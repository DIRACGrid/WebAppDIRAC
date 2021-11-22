""" Basic modules for loading handlers
"""

import re
import os
import inspect
import collections

from DIRAC import S_OK, S_ERROR, rootPath, gLogger
from DIRAC.Core.Utilities.ObjectLoader import ObjectLoader
from DIRAC.Core.Utilities.DIRACSingleton import DIRACSingleton
from DIRAC.Core.Utilities.Extensions import extensionsByPriority, getExtensionMetadata

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, _WebHandler, WebSocketHandler
from WebAppDIRAC.Core.CoreHandler import CoreHandler
from WebAppDIRAC.Core.StaticHandler import StaticHandler


class HandlerMgr(metaclass=DIRACSingleton):
    """This class prepares portal application handlers and forms their routing using regular expressions,
    see https://docs.python.org/3/library/re.html
    """

    def __init__(self, handlersLocation, baseURL="/"):
        """Constructor

        :param str handlersLocation: handlers location
        :param str baseURL: base URL
        """
        self.__baseURL = baseURL.strip("/")
        self.__handlersLocation = handlersLocation
        self.__routes = []
        self.__handlers = []
        # The following regular expression describes two capturing groups from the incoming request path:
        # 1) the DIRAC setup
        # 2) the DIRAC user group
        self.__setupGroupRE = r"(?:/s:([\w-]*)/g:([\w.-]*))?"
        # Describes the same, only as non-capturing groups.
        self.__shySetupGroupRE = r"(?:/s:(?:[\w-]*)/g:(?:[\w.-]*))?"
        self.log = gLogger.getSubLogger("Routing")

    def getPaths(self, dirName):
        """Get lists of paths for all installed and enabled extensions

        :param str dirName: path to handlers

        :return: list
        """
        pathList = []
        for extName in extensionsByPriority():
            metadata = getExtensionMetadata(extName)
            pathList.extend(map(str, metadata.get("web_resources", {}).get(dirName, [])))
        return pathList

    def __calculateRoutes(self):
        """Load all handlers and generate the routes

        :return: S_OK()/S_ERROR()
        """
        ol = ObjectLoader()
        handlerList = []
        self.log.debug("Add handles from: %s", self.__handlersLocation)
        for parentClass in [WebHandler, _WebHandler]:
            result = ol.getObjects(self.__handlersLocation, parentClass=parentClass, recurse=True, continueOnError=True)
            if not result["OK"]:
                return result
            handlerList += list(result["Value"].items())
        self.__handlers = collections.OrderedDict(handlerList)

        # ['/opt/dirac/pro/WebAppExt/WebApp/static', ...]
        staticPaths = self.getPaths("static")
        self.log.verbose("Static paths found:\n - %s" % "\n - ".join(staticPaths))
        self.__routes = []

        # Add some standard paths for static files
        statDirectories = Conf.getStaticDirs()
        self.log.info("The following static directories are used:%s" % str(statDirectories))
        for staticDirectory in statDirectories:
            # Get real static files directory
            realStaticDirectory = "%s/webRoot/www/%s" % (rootPath, staticDirectory)
            # Make sure the directory exists
            if not os.path.exists(realStaticDirectory):
                os.makedirs(realStaticDirectory)
            # Let's add routes
            pattern = "/%s/(.*)" % staticDirectory
            self.__routes.append((pattern, StaticHandler, dict(pathList=[realStaticDirectory])))
            self.log.debug(" - Static route: %s" % pattern)

        for pattern in (r"/static/(.*)", r"/(favicon\.ico)", r"/(robots\.txt)"):
            pattern = r"%s%s" % (self.__shySetupGroupRE, pattern)
            if self.__baseURL:
                pattern = "/%s%s" % (self.__baseURL, pattern)
            self.__routes.append((pattern, StaticHandler, dict(pathList=staticPaths)))
            self.log.debug(" - Static route: %s" % pattern)
        for hn in self.__handlers:
            self.log.info("Found handler %s" % hn)
            handler = self.__handlers[hn]
            # CHeck it has AUTH_PROPS
            if isinstance(handler.AUTH_PROPS, type(None)):
                return S_ERROR("Handler %s does not have AUTH_PROPS defined. Fix it!" % hn)
            # Get the root for the handler
            if handler.LOCATION:
                handlerRoute = handler.LOCATION.strip("/") and "/%s" % handler.LOCATION.strip("/") or ""
            else:
                handlerRoute = hn[len(re.sub(r".[A-z]+$", "", hn)) :].replace(".", "/").replace("Handler", "")
            # Add the setup group RE before
            baseRoute = self.__setupGroupRE
            # IF theres a base url like /DIRAC add it
            baseRoute = "/%s%s" % (self.__baseURL or "", baseRoute)
            # Set properly the LOCATION after calculating where it is with helpers to add group and setup later
            handler.LOCATION = handlerRoute
            # Add a pattern that points to the target method.
            # Note that there are handlers with an index method.
            # It responds to the request without specifying a method.
            # The special characters "*" helps to take into account such a case,
            # see https://docs.python.org/3/library/re.html#regular-expression-syntax.
            # E.g .: /DIRAC/ -> RootHandler.web_index
            handler.PATH_RE = re.compile("%s(%s/[A-z0-9_]*)" % (baseRoute, handlerRoute))
            handler.URLSCHEMA = "/%s%%(setup)s%%(group)s%%(location)s/%%(action)s" % (self.__baseURL)
            if issubclass(handler, WebSocketHandler):
                handler.PATH_RE = re.compile("%s(%s)" % (baseRoute, handlerRoute))
                route = "%s(%s)" % (baseRoute, handlerRoute)
                self.__routes.append((route, handler))
                self.log.verbose(" - WebSocket %s -> %s" % (handlerRoute, hn))
                self.log.debug("  * %s" % route)
                continue
            # Look for methods that are exported
            for mName, mObj in inspect.getmembers(handler):
                if inspect.isroutine(mObj) and mName.find(handler.METHOD_PREFIX) == 0:
                    self.log.debug("  Find %s method" % mName)
                    methodName = mName[len(handler.METHOD_PREFIX) :]
                    args = getattr(handler, "path_%s" % methodName, [])
                    if mName == "web_index" and handler.__name__ == "RootHandler":
                        # Index methods have the bare url
                        self.log.verbose(" - Route %s -> %s.web_index" % (handlerRoute, hn))
                        route = "%s(%s/)" % (baseRoute, handlerRoute)
                        self.__routes.append((route, handler))
                        self.__routes.append(
                            ("%s(%s)" % (baseRoute, handlerRoute), CoreHandler, dict(action="addSlash"))
                        )
                    else:
                        # Normal methods get the method appended without web_
                        self.log.verbose(" - Route %s/%s ->  %s.%s" % (handlerRoute, mName[4:], hn, mName))
                        route = "%s(%s%s)" % (
                            baseRoute,
                            handlerRoute,
                            "" if methodName == "index" else ("/%s" % methodName),
                        )
                        # Use request path as options/values, for ex. ../method/<option>/<file path>?<option>=..
                        if args:
                            route += r"[\/]?%s" % "/".join(args)
                        self.__routes.append((route, handler))
                    self.log.debug("  * %s" % route)
        # Send to root
        self.__routes.append(("%s(/?)" % self.__setupGroupRE, CoreHandler, dict(action="sendToRoot")))
        if self.__baseURL:
            self.__routes.append(
                ("/%s%s()" % (self.__baseURL, self.__setupGroupRE), CoreHandler, dict(action="sendToRoot"))
            )
        return S_OK()

    def getHandlers(self):
        """Get handlers

        :return: S_OK()/S_ERROR()
        """
        if not self.__handlers:
            result = self.__calculateRoutes()
            if not result["OK"]:
                return result
        return S_OK(self.__handlers)

    def getRoutes(self):
        """Get routes

        :return: S_OK()/S_ERROR()
        """
        if not self.__routes:
            result = self.__calculateRoutes()
            if not result["OK"]:
                return result
        return S_OK(self.__routes)
