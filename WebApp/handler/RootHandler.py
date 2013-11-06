import json
import urlparse
from DIRAC import gConfig
from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr
from DIRAC.ConfigurationSystem.Client.Helpers import Registry

class RootHandler(WebHandler):

  AUTH_PROPS = "all"
  LOCATION = "/"

  def web_changeGroup( self ):
    try:
      to = self.request.arguments[ 'to' ][-1]
    except KeyError:
      raise WErr( 400, "Missing 'to' argument" )
    self.__change( group = to )

  def web_changeSetup( self ):
    try:
      to = self.request.arguments[ 'to' ][-1]
    except KeyError:
      raise WErr( 400, "Missing 'to' argument" )
    self.__change( setup = to )

  def __change( self, setup = None, group = None ):
    if not setup:
      setup = self.getUserSetup()
    if not group:
      group = self.getUserGroup() or 'anon'
    qs = False
    if 'Referer' in self.request.headers:
      o = urlparse.urlparse( self.request.headers[ 'Referer' ] )
      qs = '?%s' % o.query
    url = [ Conf.rootURL().strip( "/" ), "s:%s" % setup, "g:%s" % group ]
    self.redirect( "/%s%s" % ( "/".join( url ), qs ) )

  def web_getConfigData( self ):
    self.finish( self.getSessionData() )

  def web_index(self):
    # Render base template
    data = self.getSessionData()

    url_state = ""
    if self.request.arguments.has_key("url_state") and len(self.request.arguments["url_state"][0]) > 0:
      url_state = self.request.arguments["url_state"][0]

    view_name = "desktop"
    if self.request.arguments.has_key("view") and len(self.request.arguments["view"][0]) > 0:  
      view_name = self.request.arguments["view"][0]
      
    theme_name = "ext-all-gray"
    if self.request.arguments.has_key("theme") and len(self.request.arguments["theme"][0]) > 0:
      if self.request.arguments["theme"][0]=="Neptune":
        theme_name = "ext-all-neptune"
      if self.request.arguments["theme"][0]=="Classic":
        theme_name = "ext-all"
        
    open_app = ""
    if self.request.arguments.has_key("open_app") and len(self.request.arguments["open_app"][0]) > 0:
      open_app = self.request.arguments["open_app"][0].strip()
      
    self.render( "root.tpl", base_url = data[ 'baseURL' ], _dev = Conf.devMode(),
                 ext_version = data[ 'extVersion' ], url_state = url_state,
                 extensions = data[ 'extensions' ],
                 credentials = data[ 'user' ], title = Conf.getTitle(),
                 theme = theme_name, root_url = Conf.rootURL(), view = view_name, open_app = open_app )

