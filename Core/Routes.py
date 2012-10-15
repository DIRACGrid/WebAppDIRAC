
import inspect
from DIRAC import S_OK, S_ERROR, rootPath, gLogger
from DIRAC.Core.Utilities.ObjectLoader import ObjectLoader
from WebAppDIRAC.Core.WebHandler import WebHandler
from WebAppDIRAC.Core.CoreHandler import CoreHandler

class Routes( object ):

  def __init__( self, baseURL = "" ):
    self.__baseURL = baseURL.strip( "/" )
    self.__routes = []
    self.__handlers = []
    self.__setupGroupRE = r"(?:/s:([\w-]*)/g:([\w-]*))?"
    self.log = gLogger.getSubLogger( "Routing" )

  def bootstrap( self ):
    """
    Load all handlers and generate the routes
    """
    ol = ObjectLoader( [ 'WebAppDIRAC' ] )
    origin = "WebApp.Handler"
    result = ol.getObjects( origin, parentClass = WebHandler, recurse = True )
    if not result[ 'OK' ]:
      return result
    self.__handlers = result[ 'Value' ]
    for hn in self.__handlers:
      self.log.info( "Found handler %s" % hn  )
      handler = self.__handlers[ hn ]
      #Get the root for the handler
      try:
        handlerRoute = getattr( handler, "LOCATION" ).strip( "/")
      except AttributeError:
        handlerRoute = hn[ len( origin ): ].lower().replace( ".", "/" ).replace( "handler", "" )
      #Add the setup group RE before
      baseRoute = self.__setupGroupRE
      #IF theres a base url like /DIRAC add it
      if self.__baseURL:
        baseRoute = "/%s%s" % ( self.__baseURL, baseRoute )
      #Look for methods that are exported
      for mName, mObj in inspect.getmembers( handler ):
        if inspect.ismethod( mObj ) and mName.find( "web_" ) == 0:
          if mName == "web_index":
            #Index methods have the bare url
            self.log.info( " - Route %s -> %s.index" % ( handlerRoute, hn ) )
            route = "%s(%s/)" % ( baseRoute, handlerRoute )
            self.__routes.append( ( route, handler ) )
            self.__routes.append( ( route.rstrip( "/" ), CoreHandler, dict( action = 'addSlash' ) ) )
          else:
            #Normal methods get the method appeded without web_
            self.log.info( " - Route %s%s ->  %s.%s" % ( handlerRoute, mName[4:], hn, mName ) )
            route = "%s(%s/%s)" % ( baseRoute, handlerRoute, mName[4:] )
            self.__routes.append( ( route, handler ) )
          self.log.debug( "  * %s" % route )
    #Send to root
    self.__routes.append( ( "%s(/?)" % self.__setupGroupRE, CoreHandler, dict( action = "sendToRoot" ) ) )
    if self.__baseURL:
      self.__routes.append( ( "/%s%s()" % ( self.__baseURL, self.__setupGroupRE ),
                              CoreHandler, dict( action = "sendToRoot" ) ) )
    return S_OK()

  def getRoutes( self ):
    return self.__routes
