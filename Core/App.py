
import ssl
import tornado.web
import tornado.httpserver
from DIRAC import S_OK, S_ERROR, gLogger
from WebAppDIRAC.Core.Routes import Routes
from WebAppDIRAC.Core import Conf

class App( object ):

  def __init__( self ):
    self.__routes = Routes( Conf.rootURL() )
    self.__servers = {}
    self.log = gLogger.getSubLogger( "Web" )

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
    self.__app = tornado.web.Application( self.__routes.getRoutes(), debug = debug )
    self.log.always( "Configuring HTTP on port %s" % Conf.HTTPPort() )
    srv = tornado.httpserver.HTTPServer( self.__app )
    port = Conf.HTTPPort()
    srv.listen( port )
    self.__servers[ ( 'http', port ) ] = srv
    if Conf.HTTPS():
      self.log.always( "Configuring HTTPS on port %s" % Conf.HTTPSPort() )
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

