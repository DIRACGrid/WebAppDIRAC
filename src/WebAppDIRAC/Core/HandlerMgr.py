""" Basic modules for loading handlers
"""

import os
import collections

from DIRAC import S_OK, S_ERROR, rootPath, gLogger
from DIRAC.Core.Utilities.ObjectLoader import ObjectLoader
from DIRAC.Core.Utilities.DIRACSingleton import DIRACSingleton
from DIRAC.Core.Utilities.Extensions import extensionsByPriority, getExtensionMetadata

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, _WebHandler
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
        self.__baseURL = baseURL.strip("/") and f"/{baseURL.strip('/')}"
        self.__handlersLocation = handlersLocation
        self.__routes = []
        self.__handlers = []
        # The following regular expression describes two capturing groups from the incoming request path:
        # 1) the DIRAC setup
        setup = r"[\w-]*"
        # 2) the DIRAC user group
        group = r"[\w.-]*"
        # E.g.: /<base URL>/s:<setup name>/g:<group name>/<your reuqest>..
        self.__setupGroupRE = f"/?(?:s:({setup})/?)?(?:g:({group})/?)?"
        # Describes the same, only as non-capturing groups, see `(?:...)` matcher.
        self.__shySetupGroupRE = f"/?(?:s:(?:{setup}/?)g:(?:{group})/?)?"
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
        self.log.info("The following static directories are used: %s" % str(statDirectories))
        for staticDirectory in statDirectories:
            # Get real static files directory
            realStaticDirectory = f"{rootPath}/webRoot/www/{staticDirectory}"
            # Make sure the directory exists
            if not os.path.exists(realStaticDirectory):
                os.makedirs(realStaticDirectory)
            # Let's add routes
            pattern = f"/{staticDirectory}/(.*)"
            self.__routes.append((pattern, StaticHandler, dict(pathList=[realStaticDirectory])))
            self.log.debug(" - Static route:", pattern)

        # Define the base URL of the request for static files
        static_base_url = self.__baseURL + self.__shySetupGroupRE

        for pattern in (r"/static/(.*)", r"/(favicon\.ico)", r"/(robots\.txt)"):
            self.__routes.append((static_base_url + pattern, StaticHandler, dict(pathList=staticPaths)))
            self.log.debug(" - Static route:", static_base_url + pattern)

        # Define the base URL of the request and add the setup group regex pattern
        handler_base_url = self.__baseURL + self.__setupGroupRE

        for hn in self.__handlers:
            self.log.info("Found handler %s" % hn)
            handler = self.__handlers[hn]

            # Set the base URL of the request
            handler.BASE_URL = handler_base_url

            # CHeck it has AUTH_PROPS or DEFAULT_AUTHORIZATION
            if isinstance(handler.AUTH_PROPS, type(None)) and isinstance(handler.DEFAULT_AUTHORIZATION, type(None)):
                return S_ERROR(f"Handler {hn} does not have AUTH_PROPS defined. Fix it!")

            # Generate tornado URLs
            self.__routes += handler._BaseRequestHandler__pre_initialize()

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
