import tornado.web
from urllib.parse import urlparse

from WebAppDIRAC.Lib import Conf


class CoreHandler(tornado.web.RequestHandler):
    def initialize(self, action):
        self.__action = action

    def get(self, setup, group, route):
        if self.__action == "addSlash":
            o = urlparse(self.request.uri)
            proto = self.request.protocol
            if "X-Scheme" in self.request.headers:
                proto = self.request.headers["X-Scheme"]
            nurl = f"{proto}://{self.request.host}{o.path}/"
            if o.query:
                nurl = f"{nurl}?{o.query}"
            self.redirect(nurl, permanent=True)
        elif self.__action == "sendToRoot":
            dest = "/"
            rootURL = Conf.rootURL()
            if rootURL:
                dest += f"{rootURL.strip('/')}/"
            if setup and group:
                dest += f"s:{setup}/g:{group}/"
            self.redirect(dest)
