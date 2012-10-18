
from WebAppDIRAC.Lib.WebHandler import WebHandler

class RootHandler( WebHandler ):

  LOCATION = "/"

  def web_index( self ):
    self.render( "jar/jor.html", title = "HELLO", potato = "ASD" )

