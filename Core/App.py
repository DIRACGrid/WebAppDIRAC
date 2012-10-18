
import ssl
import tornado.web
import tornado.httpserver
from DIRAC import S_OK, S_ERROR, gLogger
from WebAppDIRAC.Core.Routes import Routes
from WebAppDIRAC.Core.TemplateLoader import TemplateLoader
from WebAppDIRAC.Lib import Conf

class App( object ):

  def __init__( self ):
    self.__routes = Routes( Conf.rootURL() )
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

  def bootstrap( self ):
    """
    Configure and create web app
    """
    self.log.always( "\n ====== Starting DIRAC web app ====== \n" )
    debug = Conf.debug()
    if debug:
      self.log.info( "Configuring in debug mode..." )
    result = self.__routes.bootstrap()
    if not result[ 'OK' ]:
      return result
    #Create the app
    tLoader = TemplateLoader( self.__routes.getPaths( "template" ) )
    kw = dict( debug = debug, template_loader = tLoader, cookie_secret = Conf.cookieSecret(),
               log_function = self._logRequest )
    self.__app = tornado.web.Application( self.__routes.getRoutes(), **kw )
    self.log.notice( "Configuring HTTP on port %s" % Conf.HTTPPort() )
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
    tornado.ioloop.IOLoop.instance().start()

