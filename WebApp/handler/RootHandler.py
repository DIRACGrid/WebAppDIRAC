
from tornado.web import HTTPError
from WebAppDIRAC.Lib.WebHandler import WebHandler

class RootHandler( WebHandler ):

  LOCATION = "/"

  def web_index( self ):
    #Render base template
    self.render( "root.tpl" )


