
from DIRAC import gLogger
from DIRAC.Core.Utilities.ThreadPool import getGlobalThreadPool
from DIRAC.Core.Security.X509Chain import X509Chain
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
from DIRAC.Core.DISET.AuthManager import AuthManager
from WebAppDIRAC.Core import Conf

import ssl
import functools
import sys
import tornado.web
import tornado.ioloop
import tornado.gen
import tornado.stack_context

class WebHandler( tornado.web.RequestHandler ):

  __threadPool = getGlobalThreadPool()
  __disetConfig = ThreadConfig()
  __log = False

  def __init__( self, *args, **kwargs ):
    super( WebHandler, self ).__init__( *args, **kwargs )
    if not WebHandler.__log:
      WebHandler.__log = gLogger.getSubLogger( self.__class__.__name__ )
    self.__processCredentials()
    self.__disetConfig.reset()

  def __processCredentials( self ):
    self.__credDict = {}
    if not self.request.protocol == "https":
      return
    derCert = self.request.get_ssl_certificate( binary_form = True )
    if not derCert:
      return
    pemCert = ssl.DER_cert_to_PEM_cert( derCert )
    cert = X509Chain()
    result = cert.getCredentials()
    if not result[ 'OK' ]:
      self.log.error( "Could not get client credentials %s" % result[ 'Message' ] )
    self.__credDict = result[ 'Value' ]


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
    if not group:
      if userDN:
        self.__credDict[ 'group' ] = Registry.findDefaultGroupForDN( userDN )
    auth = AuthManager( Conf.getAuthSectionForRoute( handlerRoute ) )
    try:
      defProps = getattr( self, "auth_%s" % methodName )
    except AttributeError:
      defProps = [ 'all' ]
    return auth.authQuery( methodName, self.__credDict, defProps )

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



