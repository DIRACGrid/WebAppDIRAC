import re
import os
from six.moves import urllib_parse as urlparse

from tornado.escape import xhtml_escape

from DIRAC import rootPath, gLogger

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr


class RootHandler(WebHandler):

    AUTH_PROPS = "all"
    LOCATION = "/"

    def web_changeGroup(self):
        to = self.get_argument("to")
        self.__change(group=to)

    def web_changeSetup(self):
        to = self.get_argument("to")
        self.__change(setup=to)

    def __change(self, setup=None, group=None):
        if not setup:
            setup = self.getUserSetup()
        if not group:
            group = self.getUserGroup() or "anon"
        qs = False
        if "Referer" in self.request.headers:
            o = urlparse.urlparse(self.request.headers["Referer"])
            qs = "?%s" % o.query
        url = [Conf.rootURL().strip("/"), "s:%s" % setup, "g:%s" % group]
        self.redirect("/%s%s" % ("/".join(url), qs))

    def web_getConfigData(self):
        self.finish(self.getSessionData())

    def web_index(self):
        # Render base template
        data = self.getSessionData()

        url_state = ""
        if "url_state" in self.request.arguments and len(self.get_argument("url_state")) > 0:
            url_state = xhtml_escape(self.get_argument("url_state"))

        # Default theme/view settings
        theme_name = "crisp"
        view_name = Conf.getTheme()
        if ":" in view_name:
            _, theme_name = view_name.split(":", 1)

        # User selected theme
        if "theme" in self.request.arguments and len(self.get_argument("theme")) > 0:
            theme_name = xhtml_escape(self.get_argument("theme").lower())

        open_app = ""
        if "open_app" in self.request.arguments and len(self.get_argument("open_app")) > 0:
            open_app = xhtml_escape(self.get_argument("open_app").strip())

        icon = data["baseURL"] + Conf.getIcon()
        background = data["baseURL"] + Conf.getBackgroud()
        logo = data["baseURL"] + Conf.getLogo()
        welcomeFile = Conf.getWelcome()
        welcome = ""
        if welcomeFile:
            try:
                with open(welcomeFile, "r") as f:
                    welcome = f.read().replace("\n", "")
            except BaseException:
                gLogger.warn("Welcome page not found here: %s" % welcomeFile)

        level = str(gLogger.getLevel()).lower()
        self.render(
            "root.tpl",
            iconUrl=icon,
            base_url=data["baseURL"],
            _dev=Conf.devMode(),
            ext_version=data["extVersion"],
            url_state=url_state,
            extensions=data["extensions"],
            credentials=data["user"],
            title=Conf.getTitle(),
            theme=theme_name,
            root_url=Conf.rootURL(),
            view="tabs",
            open_app=open_app,
            debug_level=level,
            welcome=welcome,
            backgroundImage=background,
            logo=logo,
            bugReportURL=Conf.bugReportURL(),
            http_port=Conf.HTTPPort(),
            https_port=Conf.HTTPSPort(),
        )
