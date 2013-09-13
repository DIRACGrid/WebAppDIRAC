
from DIRAC import gLogger
from DIRAC.Core.Utilities.ThreadPool import getGlobalThreadPool
from DIRAC.Core.Security.X509Chain import X509Chain
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
from DIRAC.Core.DISET.AuthManager import AuthManager
from WebAppDIRAC.Lib.SessionData import SessionData
from WebAppDIRAC.Lib import Conf

import ssl
import functools
import sys
import types
import json
import traceback
import tornado.web
import tornado.ioloop
import tornado.gen
import tornado.stack_context
import tornado.websocket

class WErr( tornado.web.HTTPError ):
  def __init__( self, code, msg = "", **kwargs ):
    super( WErr, self ).__init__( code, str( msg ) or None )
    for k in kwargs:
      setattr( self, k, kwargs[ k ] )
    self.ok = False
    self.msg = msg
    self.kwargs = kwargs

  def __str__( self ):
    return super( tornado.web.HTTPError, self ).__str__()

  @classmethod
  def fromSERROR( cls, result ):
    #Prevent major fuckups with % in the message
    return cls( 500, result[ 'Message' ].replace( "%", "" ) )

class WOK( object ):
  def __init__( self, data = False, **kwargs ):
    for k in kwargs:
      setattr( self, k, kwargs[ k ] )
    self.ok = True
    self.data = data

def asyncWithCallback( method ):
  return tornado.web.asynchronous( method )

def asyncGen( method ):
  return tornado.gen.coroutine( method )

class WebHandler( tornado.web.RequestHandler ):

  __threadPool = getGlobalThreadPool()
  __disetConfig = ThreadConfig()
  __log = False

  #Auth requirements
  AUTH_PROPS = None
  #Location of the handler in the URL
  LOCATION = ""
  #URL Schema with holders to generate handler urls
  URLSCHEMA = ""
  #RE to extract group and setup
  PATH_RE = ""

  #Helper function to create threaded gen.Tasks with automatic callback and execption handling
  def threadTask( self, method, *args, **kwargs ):
    """
    Helper method to generate a gen.Task and automatically call the callback when the real
    method ends. THIS IS SPARTAAAAAAAAAA
    """
    #Save the task to access the runner
    genTask = False

    #This runs in the separate thread, calls the callback on finish and takes into account exceptions
    def cbMethod( *cargs, **ckwargs ):
      cb = ckwargs.pop( 'callback' )
      method = cargs[0]
      disetConf = cargs[1]
      cargs = cargs[2]
      self.__disetConfig.reset()
      self.__disetConfig.load( disetConf )
      ioloop = tornado.ioloop.IOLoop.instance()
      try:
        result = method( *cargs, **ckwargs )
        ioloop.add_callback( functools.partial( cb, result ) )
      except Exception, excp:
        exc_info = sys.exc_info()
        ioloop.add_callback( lambda : genTask.runner.handle_exception( *exc_info ) )

    #Put the task in the thread :)
    def threadJob( tmethod, *targs, **tkwargs ):
      tkwargs[ 'callback' ] = tornado.stack_context.wrap( tkwargs[ 'callback' ] )
      targs = ( tmethod, self.__disetDump, targs )
      self.__threadPool.generateJobAndQueueIt( cbMethod, args = targs, kwargs = tkwargs )

    #Return a YieldPoint
    genTask = tornado.gen.Task( threadJob, method, *args, **kwargs )
    return genTask

  def __disetBlockDecor( self, func ):
    def wrapper( *args, **kwargs ):
      raise RuntimeError( "All DISET calls must be made from inside a Threaded Task! Bad boy!" )
    return wrapper


  def __init__( self, *args, **kwargs ):
    """
    Initialize the handler
    """
    super( WebHandler, self ).__init__( *args, **kwargs )
    if not WebHandler.__log:
      WebHandler.__log = gLogger.getSubLogger( self.__class__.__name__ )
    self.__credDict = {}
    self.__setup = Conf.setup()
    self.__processCredentials()
    self.__disetConfig.reset()
    self.__disetConfig.setDecorator( self.__disetBlockDecor )
    self.__disetDump = self.__disetConfig.dump()
    match = self.PATH_RE.match( self.request.path )
    self._pathResult = self.__checkPath( *match.groups() )
    self.__sessionData = SessionData( self.__credDict, self.__setup )

  def __processCredentials( self ):
    """
    Extract the user credentials based on the certificate or what comes from the balancer
    """
    #NGINX
    if Conf.balancer() == "nginx":
      headers = self.request.headers
      if headers[ 'X-Scheme' ] == "https" and headers[ 'X-Ssl_client_verify' ] == 'SUCCESS':
        DN = headers[ 'X-Ssl_client_s_dn' ]
        self.__credDict[ 'DN' ] = DN
        self.__credDict[ 'issuer' ] = headers[ 'X-Ssl_client_i_dn' ]
        result = Registry.getUsernameForDN( DN )
        if not result[ 'OK' ]:
          self.__credDict[ 'validDN' ] = False
        else:
          self.__credDict[ 'validDN' ] = True
          self.__credDict[ 'username' ] = result[ 'Value' ]
      return
    #TORNADO
    if not self.request.protocol == "https":
      return
    derCert = self.request.get_ssl_certificate( binary_form = True )
    if not derCert:
      return
    pemCert = ssl.DER_cert_to_PEM_cert( derCert )
    chain = X509Chain()
    chain.loadChainFromString( pemCert )
    result = chain.getCredentials()
    if not result[ 'OK' ]:
      self.log.error( "Could not get client credentials %s" % result[ 'Message' ] )
      return
    self.__credDict = result[ 'Value' ]
    #Hack. Data coming from OSSL directly and DISET difer in DN/subject
    try:
      self.__credDict[ 'DN' ] = self.__credDict[ 'subject' ]
    except KeyError:
      pass

  def _request_summary( self ):
    """
    Return a string returning the summary of the request
    """
    summ = super( WebHandler, self )._request_summary()
    cl = []
    if self.__credDict.get( 'validDN', False ):
      cl.append( self.__credDict[ 'username' ] )
      if self.__credDict.get( 'validGroup', False ):
        cl.append( "@%s" % self.__credDict[ 'group' ] )
      cl.append( " (%s)" % self.__credDict[ 'DN' ] )
    summ = "%s %s" % ( summ, "".join( cl ) )
    return summ

  @property
  def log( self ):
    return self.__log

  @classmethod
  def getLog( cls ):
    return cls.__log

  def getUserDN( self ):
    return self.__credDict.get( 'DN', '' )

  def getUserName( self ):
    return self.__credDict.get( 'username', '' )

  def getUserGroup( self ):
    return self.__credDict.get( 'group', '' )

  def getUserSetup( self ):
    return self.__setup

  def getUserProperties( self ):
    return self.__sessionData.getData().properties

  def isRegisteredUser( self ):
    return self.__credDict.get( 'validDN', "" ) and self.__credDict.get( 'validGroup', "" )

  def getSessionData( self ):
    return self.__sessionData.getData()

  def actionURL( self, action = "" ):
    """
    Given an action name for the handler, return the URL
    """
    if action == "index":
      action = ""
    group = self.getUserGroup()
    if group:
      group = "/g:%s" % group
    setup = self.getUserSetup()
    if setup:
      setup = "/s:%s" % setup
    location = self.LOCATION
    if location:
      location = "/%s" % location
    ats = dict( action = action, group = group, setup = setup, location = location )
    return self.URLSCHEMA % ats

  def __auth( self, handlerRoute, group ):
    """
    Authenticate request
    """
    userDN = self.getUserDN()
    if group:
      self.__credDict[ 'group' ] = group
    else:
      if userDN:
        result = Registry.findDefaultGroupForDN( userDN )
        if result[ 'OK' ]:
          self.__credDict[ 'group' ] = result[ 'Value' ]
    self.__credDict[ 'validGroup' ] = False

    if type( self.AUTH_PROPS ) not in ( types.ListType, types.TupleType ):
      self.AUTH_PROPS = [ p.strip() for p in self.AUTH_PROPS.split( "," ) if p.strip() ]
    allAllowed = False
    for p in self.AUTH_PROPS:
      if p.lower() in ( 'all', 'any' ):
        allAllowed = True

    auth = AuthManager( Conf.getAuthSectionForHandler( handlerRoute ) )
    ok = auth.authQuery( "", self.__credDict, self.AUTH_PROPS )
    if ok:
      if userDN:
        self.__credDict[ 'validGroup' ] = True
        self.log.info( "AUTH OK: %s by %s@%s (%s)" % ( handlerRoute, self.__credDict[ 'username' ], self.__credDict[ 'group' ], userDN ) )
      else:
        self.__credDict[ 'validDN' ] = False
        self.log.info( "AUTH OK: %s by visitor" % ( handlerRoute ) )
    elif allAllowed:
      self.log.info( "AUTH ALL: %s by %s" % ( handlerRoute, userDN ) )
      ok = True
    else:
      self.log.info( "AUTH KO: %s by %s@%s" % ( handlerRoute, userDN, group ) )
    return ok

  def __checkPath( self, setup, group, route ):
    """
    Check the request, auth, credentials and DISET config
    """
    if route[-1] == "/":
      methodName = "index"
      handlerRoute = route
    else:
      iP = route.rfind( "/" )
      methodName = route[ iP + 1: ]
      handlerRoute = route[ :iP ]
    if setup:
      self.__setup = setup
    if not self.__auth( handlerRoute, group ):
      return WErr( 401, "Unauthorized, bad boy!" )

    DN = self.getUserDN()
    if DN:
      self.__disetConfig.setDN( DN )
    group = self.getUserGroup()
    if group:
      self.__disetConfig.setGroup( group )
    self.__disetConfig.setSetup( setup )
    self.__disetDump = self.__disetConfig.dump()

    return WOK( methodName )

  def get( self, setup, group, route ):
    if not self._pathResult.ok:
      raise self._pathResult
    methodName = "web_%s" % self._pathResult.data
    try:
      mObj = getattr( self, methodName )
    except AttributeError as e:
      self.log.fatal( "This should not happen!! %s" % e )
      raise tornado.web.HTTPError( 404 )
    return mObj()

  def post( self, *args, **kwargs ):
    return self.get( *args, **kwargs )


  def write_error( self, status_code, **kwargs ):
    self.set_status( status_code )
    cType = "text/plain"
    data = self._reason
    if 'exc_info' in kwargs:
      ex = kwargs[ 'exc_info' ][1]
      trace = traceback.format_exception( *kwargs["exc_info"] )
      if not isinstance( ex, WErr ):
        data += "\n".join( trace )
      else:
        if self.settings.get("debug"):
          self.log.error( "Request ended in error:\n  %s" % "\n  ".join( trace ) )
        data = ex.msg
        if type( data ) == types.DictType:
          cType = "application/json"
          data = json.dumps( data )
    self.set_header( 'Content-Type', cType )
    self.finish( data )


class WebSocketHandler( tornado.websocket.WebSocketHandler, WebHandler ):

  def __init__( self, *args, **kwargs ):
    WebHandler.__init__( self, *args, **kwargs )
    tornado.websocket.WebSocketHandler.__init__( self, *args, **kwargs )

  def open( self, setup, group, route ):
    if not self._pathResult.ok:
      raise self._pathResult
    return self.on_open()

  def on_open( self ):
    pass


