
from tornado.web import HTTPError
from WebAppDIRAC.Lib.WebHandler import WebHandler
from WebAppDIRAC.Lib.SessionData import SessionData

class RootHandler( WebHandler ):

  AUTH_PROPS = "all"
  LOCATION = "/"

  def web_index( self ):
    #Render base template
    self.render( "root.tpl", data = SessionData().getData( self.getUserDN(), self.getUserGroup() ) )


