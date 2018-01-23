import urlparse
from DIRAC import gConfig, gLogger, rootPath
from DIRAC import gLogger
from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr
import re
import os

def xss_filter(text):
  cleanr =re.compile('<.*?>')
  cleantext = re.sub(cleanr,'', text)
  return cleantext

class RootHandler(WebHandler):

  AUTH_PROPS = "all"
  LOCATION = "/"

  def web_upload( self ):
     
     if 'filename' not in self.request.arguments:
       raise WErr( 400, "Please provide a file name!" )
     data = self.request.arguments.get( "data", "" )[0]
     filename = self.request.arguments.get( "filename", "" )[0]
     
     if re.match( "(?!\.)^[\w\d_\.\-]*$", filename ):
       filepath = "%s/webRoot/www/pilot/%s" % ( rootPath, filename )
     else:
       raise WErr( 400, "Please provide a valid file name!" )
     
     try:
       tmpfile = "%s.tmp" % filepath
       with open( tmpfile, 'w' ) as tmp:
         tmp.write( data )
       os.rename( tmpfile, filepath )    
     except OSError as e:
       raise WErr( 400, "Cannot create the file: %s; %s" % ( filename, repr( e ) ) )
     self.finish( 'File has created' )
 
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
      url_state = xss_filter( self.request.arguments["url_state"][0] )

    view_name = Conf.getTheme()
    if self.request.arguments.has_key("view") and len(self.request.arguments["view"][0]) > 0:
      view_name = xss_filter( self.request.arguments["view"][0] )

    theme_name = "ext-all-gray"
    if self.request.arguments.has_key("theme") and len(self.request.arguments["theme"][0]) > 0:
      if self.request.arguments["theme"][0]=="Neptune":
        theme_name = "ext-all-neptune"
      if self.request.arguments["theme"][0]=="Classic":
        theme_name = "ext-all"

    open_app = ""
    if self.request.arguments.has_key("open_app") and len(self.request.arguments["open_app"][0]) > 0:
      open_app = xss_filter( self.request.arguments["open_app"][0].strip() )

    icon = data[ 'baseURL' ] + Conf.getIcon()
    backround = data[ 'baseURL' ] + Conf.getBackround()
    logo = data[ 'baseURL' ] + Conf.getLogo()
    
    level = str(gLogger.getLevel()).lower()
    self.render( "root.tpl", iconUrl=icon, base_url = data[ 'baseURL' ], _dev = Conf.devMode(),
                 ext_version = data[ 'extVersion' ], url_state = url_state,
                 extensions = data[ 'extensions' ],
                 credentials = data[ 'user' ], title = Conf.getTitle(),
                 theme = theme_name, root_url = Conf.rootURL(), view = view_name, 
                 open_app = open_app, debug_level= level,
                 backroundImage = backround, logo = logo )
    
