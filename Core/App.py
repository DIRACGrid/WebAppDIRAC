
import ssl
import imp
import os
import tornado.web
import tornado.httpserver
import tornado.autoreload
import tornado.process
from DIRAC import S_OK, S_ERROR, gLogger, gConfig
from WebAppDIRAC.Core.HandlerMgr import HandlerMgr
from WebAppDIRAC.Core.TemplateLoader import TemplateLoader
from WebAppDIRAC.Lib.SessionData import SessionData
from WebAppDIRAC.Lib import Conf
from DIRAC.Core.Utilities.CFG import CFG
from DIRAC.ConfigurationSystem.Client.ConfigurationData import gConfigurationData
from DIRAC.ConfigurationSystem.Client.Helpers import CSGlobals

class App( object ):

  def __init__( self ):
    self.__handlerMgr = HandlerMgr( Conf.rootURL() )
    self.__servers = {}
    self.log = gLogger.getSubLogger( "Web" )

  def _logRequest( self, handler ):
    status = handler.get_status()
    if status < 400:
      logm = self.log.notice
    elif status < 500:
      logm = self.log.warn
    else:
      logm = self.log.error
    request_time = 1000.0 * handler.request.request_time()
    logm( "%d %s %.2fms" % ( status, handler._request_summary(), request_time ) )

  def __reloadAppCB( self ):
    gLogger.notice( "\n !!!!!! Reloading web app...\n" )

  def __loadWebAppCFGFiles( self ):
    """
    Load WebApp/web.cfg definitions
    """
    exts = []
    for ext in CSGlobals.getCSExtensions():
      if ext == "DIRAC":
        continue
      if ext[-5:] != "DIRAC":
        ext = "%sDIRAC" % ext
      if ext != "WebAppDIRAC":
        exts.append( ext )
    exts.append( "DIRAC" )
    exts.append( "WebAppDIRAC" )
    webCFG = CFG()
    for modName in reversed( exts ):
      try:
        modPath = imp.find_module( modName )[1]
      except ImportError:
        continue
      gLogger.verbose( "Found module %s at %s" % ( modName, modPath ) )
      cfgPath = os.path.join( modPath, "WebApp", "web.cfg" )
      if not os.path.isfile( cfgPath ):
        gLogger.verbose( "Inexistant %s" % cfgPath )
        continue
      try:
        modCFG = CFG().loadFromFile( cfgPath )
      except Exception, excp:
        gLogger.error( "Could not load %s: %s" % ( cfgPath, excp ) )
        continue
      gLogger.verbose( "Loaded %s" % cfgPath )
      expl = [ Conf.BASECS ]
      while len( expl ):
        current = expl.pop( 0 )
        if not modCFG.isSection( current ):
          continue
        if modCFG.getOption( "%s/AbsoluteDefinition" % current, False ):
          gLogger.verbose( "%s:%s is an absolute definition" % ( modName, current ) )
          try:
            webCFG.deleteKey( current )
          except:
            pass
          modCFG.deleteKey( "%s/AbsoluteDefinition" % current )
        else:
          for sec in modCFG[ current ].listSections():
            expl.append( "%s/%s" % ( current, sec ) )
      #Add the modCFG
      webCFG = webCFG.mergeWith( modCFG )
    gConfig.loadCFG( webCFG )

  def bootstrap( self ):
    """
    Configure and create web app
    """
    self.log.always( "\n ====== Starting DIRAC web app ====== \n" )
    #Load required CFG files
    self.__loadWebAppCFGFiles()
    #Calculating routes
    result = self.__handlerMgr.getRoutes()
    if not result[ 'OK' ]:
      return result
    routes = result[ 'Value' ]
    #Initialize the session data
    SessionData.setHandlers( self.__handlerMgr.getHandlers()[ 'Value' ] )
    #Create the app
    tLoader = TemplateLoader( self.__handlerMgr.getPaths( "template" ) )
    kw = dict( debug = Conf.devMode(), template_loader = tLoader, cookie_secret = Conf.cookieSecret(),
               log_function = self._logRequest )
    #Check processes if we're under a load balancert
    if Conf.balancer() and Conf.numProcesses() not in ( 0, 1 ):
      tornado.process.fork_processes( Conf.numProcesses(), max_restarts=0 )
      kw[ 'debug' ] = False
    #Debug mode?
    if kw[ 'debug' ]:
      self.log.info( "Configuring in developer mode..." )
    #Configure tornado app
    self.__app = tornado.web.Application( routes, **kw )
    self.log.notice( "Configuring HTTP on port %s" % ( Conf.HTTPPort() ) )
    #Create the web servers
    srv = tornado.httpserver.HTTPServer( self.__app )
    port = Conf.HTTPPort()
    srv.listen( port )
    self.__servers[ ( 'http', port ) ] = srv
    if Conf.HTTPS():
      self.log.notice( "Configuring HTTPS on port %s" % Conf.HTTPSPort() )
      sslops = dict( certfile = Conf.HTTPSCert(),
                     keyfile = Conf.HTTPSKey(),
                     cert_reqs = ssl.CERT_OPTIONAL,
                     ca_certs = Conf.generateCAFile() )
      self.log.debug( " - %s" % "\n - ".join( [ "%s = %s" % ( k, sslops[k] ) for k in sslops ] ) )
      srv = tornado.httpserver.HTTPServer( self.__app, ssl_options = sslops )
      port = Conf.HTTPSPort()
      srv.listen( port )
      self.__servers[ ( 'https', port ) ] = srv
    return result

  def run( self ):
    """
    Start web servers
    """
    bu = Conf.rootURL().strip( "/" )
    urls = []
    for proto, port in self.__servers:
      urls.append("%s://0.0.0.0:%s/%s/" % ( proto, port, bu ) )
    self.log.always( "Listening on %s" % " and ".join( urls ) )
    tornado.autoreload.add_reload_hook( self.__reloadAppCB )
    tornado.ioloop.IOLoop.instance().start()

