import tornado.web
from six.moves import urllib_parse as urlparse

from WebAppDIRAC.Lib import Conf


class CoreHandler(tornado.web.RequestHandler):

  def initialize(self, action):
    print('===... CoreHandler')
    self.__action = action

  def get(self, setup, group, route):
    print('===... CoreHandler_get')
    if self.__action == "addSlash":
      o = urlparse(self.request.uri)
      proto = self.request.protocol
      if 'X-Scheme' in self.request.headers:
        proto = self.request.headers['X-Scheme']
      nurl = "%s://%s%s/" % (proto, self.request.host, o.path)
      if o.query:
        nurl = "%s?%s" % (nurl, o.query)
      self.redirect(nurl, permanent=True)
    elif self.__action == "sendToRoot":
      dest = "/"
      rootURL = Conf.rootURL()
      if rootURL:
        dest += "%s/" % rootURL.strip("/")
      if setup and group:
        dest += "s:%s/g:%s/" % (setup, group)
      self.redirect(dest)