
from DIRAC import gLogger
from DIRAC.Core.Utilities.ThreadPool import getGlobalThreadPool
from DIRAC.Core.Security.X509Chain import X509Chain
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
from DIRAC.Core.DISET.AuthManager import AuthManager
from WebAppDIRAC.Lib import Conf

import ssl
import functools
import sys
import tornado.web
import tornado.ioloop
import tornado.gen
import tornado.stack_context

class WErr( tornado.web.HTTPError ):
  def __init__( self, code, msg = "", **kwargs ):
    super( WErr, self ).__init__( code, msg or None )
    for k in kwargs:
      setattr( self, k, kwargs[ k ] )
    self.ok = False
    self.msg = msg
    self.kwargs = kwargs

  def __str__( self ):
    return super( tornado.web.HTTPError, self ).__str__()

class WOK( object ):
  def __init__( self, data = False, **kwargs ):
    for k in kwargs:
      setattr( self, k, kwargs[ k ] )
    self.ok = True
    self.data = data


class WebHandler( tornado.web.RequestHandler ):

  __threadPool = getGlobalThreadPool()
  __disetConfig = ThreadConfig()
  __log = False

  #Helper function to create threaded gen.Tasks with automatic callback and execption handling
  @classmethod
  def threadTask( cls, method, *args, **kwargs ):
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
      cls__disetConfig.load( disetConf )
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
      targs = ( tmethod, self.__disetConfig.dump(), targs )
      cls.__threadPool.generateJobAndQueueIt( cbMethod, args = targs, kwargs = tkwargs )

    #Return a YieldPoint
    genTask = tornado.gen.Task( threadJob, method, *args, **kwargs )
    return genTask


  def __init__( self, *args, **kwargs ):
    super( WebHandler, self ).__init__( *args, **kwargs )
    if not WebHandler.__log:
      WebHandler.__log = gLogger.getSubLogger( self.__class__.__name__ )
    self.__processCredentials()
    self.__disetConfig.reset()

  def __processCredentials( self ):
    self.__credDict = {}
    #NGINX
    if Conf.balancer() == "nginx":
      headers = self.request.headers
      if headers[ 'X-Scheme' ] == "https" and headers[ 'X-Ssl_client_verify' ] == 'SUCCESS':
        DN = headers[ 'X-Ssl_client_s_dn' ]
        self.__credDict[ 'subject' ] = DN
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

  def _request_summary( self ):
    summ = super( WebHandler, self )._request_summary()
    cl = []
    if self.__credDict.get( 'validDN', False ):
      cl.append( self.__credDict[ 'username' ] )
      if self.__credDict.get( 'validGroup', False ):
        cl.append( "@%s" % self.__credDict[ 'group' ] )
      cl.append( " (%s)" % self.__credDict[ 'subject' ] )
    summ = "%s %s" % ( summ, "".join( cl ) )
    return summ

  @property
  def log( self ):
    return self.__log

  @classmethod
  def getLog( cls ):
    return cls.__log

  def getUserDN( self ):
    return self.__credDict.get( 'subject', '' )

  def getUserName( self ):
    return self.__credDict.get( 'username', '' )

  def getUserGroup( self ):
    return self.__credDict.get( 'group', '' )

  def __auth( self, handlerRoute, methodName, group ):
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
    auth = AuthManager( Conf.getAuthSectionForRoute( handlerRoute ) )
    try:
      defProps = getattr( self, "auth_%s" % methodName )
    except AttributeError:
      defProps = [ 'all' ]
    ok = auth.authQuery( methodName, self.__credDict, defProps )
    if ok and userDN:
      self.__credDict[ 'validGroup' ] = True
    return ok

  def __setThreadConfig( self, setup ):
    DN = self.getUserDN()
    if DN:
      self.__disetConfig.setDN( DN )
    group = self.getUserGroup()
    if group:
      self.__disetConfig.setGroup( group )
    if not setup:
      setup = Conf.setup()
    self.__disetConfig.setSetup( setup )

  def __checkRequest( self, setup, group, route ):
    if route[-1] == "/":
      methodName = "index"
      handlerRoute = route
    else:
      iP = route.rfind( "/" )
      methodName = route[ iP + 1: ]
      handlerRoute = route[ :iP ]
    if not self.__auth( handlerRoute, methodName, group ):
      raise tornado.web.HTTPError( 401 )
    self.__setThreadConfig( setup )
    return methodName


  def get( self, setup, group, route ):
    methodName = "web_%s" % self.__checkRequest( setup, group, route )
    try:
      mObj = getattr( self, methodName )
    except AttributeError as e:
      self.log.fatal( "This should not happen!! %s" % e )
      raise tornado.web.HTTPError( 404 )
    return mObj()



