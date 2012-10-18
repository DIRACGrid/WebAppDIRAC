
import tornado.web
from WebAppDIRAC.Lib import Conf

class CoreHandler( tornado.web.RequestHandler ):

  def initialize( self, action ):
    self.__action = action

  def get( self, setup, group, route ):
    if self.__action == "addSlash":
      self.redirect( "%s/" % self.request.uri, permanent = True )
    elif self.__action == "sendToRoot":
      dest = "/"
      rootURL = Conf.rootURL()
      if rootURL:
        dest += "%s/" % rootURL.strip( "/" )
      if setup and group:
        dest += "s:%s/g:%s/" % ( setup, group )
      self.redirect( dest )



