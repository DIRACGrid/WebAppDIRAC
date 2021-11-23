import os

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import List
from DIRAC.Core.DISET.AuthManager import AuthManager
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
from DIRAC.Core.Utilities.Extensions import extensionsByPriority

# from DIRAC.FrameworkSystem.Client.ProxyManagerClient import gProxyManager

from WebAppDIRAC.Lib import Conf

DEFAULT_SCHEMA = [
    [
        "Tools",
        [
            ["app", "Application Wizard", "DIRAC.ApplicationWizard"],
            ["app", "Job Launchpad", "DIRAC.JobLaunchpad"],
            ["app", "Notepad", "DIRAC.Notepad"],
            ["app", "Proxy Upload", "DIRAC.ProxyUpload"],
        ],
    ],
    [
        "Applications",
        [
            ["app", "Accounting", "DIRAC.Accounting"],
            ["app", "Activity Monitor", "DIRAC.ActivityMonitor"],
            ["app", "Configuration Manager", "DIRAC.ConfigurationManager"],
            ["app", "Job Monitor", "DIRAC.JobMonitor"],
            ["app", "Downtimes", "DIRAC.Downtimes"],
            ["app", "File Catalog", "DIRAC.FileCatalog"],
            ["app", "Job Monitor", "DIRAC.JobMonitor"],
            ["app", "Job Summary", "DIRAC.JobSummary"],
            ["app", "Pilot Monitor", "DIRAC.PilotMonitor"],
            ["app", "Pilot Summary", "DIRAC.PilotSummary"],
            ["app", "Proxy Manager", "DIRAC.ProxyManager"],
            ["app", "Public State Manager", "DIRAC.PublicStateManager"],
            ["app", "Registry Manager", "DIRAC.RegistryManager"],
            ["app", "Request Monitor", "DIRAC.RequestMonitor"],
            ["app", "Resource Summary", "DIRAC.ResourceSummary"],
            ["app", "Site Summary", "DIRAC.SiteSummary"],
            ["app", "Space Occupancy", "DIRAC.SpaceOccupancy"],
            ["app", "System Administration", "DIRAC.SystemAdministration"],
            ["app", "Transformation Monitor", "DIRAC.TransformationMonitor"],
        ],
    ],
]


class SessionData:

    __handlers = {}
    __groupMenu = {}
    __extensions = []
    __extVersion = "ext-6.2.0"
    __configuration = {}

    @classmethod
    def setHandlers(cls, handlers):
        """Set handlers

        :param dict handlers: handlers
        """
        cls.__handlers = {}
        for k in handlers:
            handler = handlers[k]
            cls.__handlers[handler.LOCATION.strip("/")] = handler
        # Calculate extensions
        cls.__extensions = extensionsByPriority()
        for ext in ["DIRAC", "WebAppDIRAC"]:
            if ext in cls.__extensions:
                cls.__extensions.append(cls.__extensions.pop(cls.__extensions.index(ext)))

    def __init__(self, credDict, setup):
        self.__credDict = credDict
        self.__setup = setup

    def __isGroupAuthApp(self, appLoc):
        """The method checks if the application is authorized for a certain user group

        :param str appLoc It is the application name for example: DIRAC.JobMonitor

        :return bool -- if the handler is authorized to the user returns True otherwise False
        """
        handlerLoc = "/".join(List.fromChar(appLoc, ".")[1:])
        if not handlerLoc:
            gLogger.error("Application handler does not exists:", appLoc)
            return False
        if handlerLoc not in self.__handlers:
            gLogger.error("Handler %s required by %s does not exist!" % (handlerLoc, appLoc))
            return False
        handler = self.__handlers[handlerLoc]
        auth = AuthManager(Conf.getAuthSectionForHandler(handlerLoc))
        gLogger.info("Authorization: %s -> %s" % (dict(self.__credDict), handler.AUTH_PROPS))
        return auth.authQuery("", dict(self.__credDict), handler.AUTH_PROPS)

    def __generateSchema(self, base, path):
        """Generate a menu schema based on the user credentials

        :param str base: base
        :param str path: path

        :return: list
        """
        # Calculate schema
        schema = []
        fullName = "%s/%s" % (base, path)
        result = gConfig.getSections(fullName)
        if not result["OK"]:
            return schema
        sectionsList = result["Value"]
        for sName in sectionsList:
            subSchema = self.__generateSchema(base, "%s/%s" % (path, sName))
            if subSchema:
                schema.append((sName, subSchema))
        result = gConfig.getOptions(fullName)
        if not result["OK"]:
            return schema
        optionsList = result["Value"]
        for opName in optionsList:
            opVal = gConfig.getValue("%s/%s" % (fullName, opName))
            if opVal.startswith("link|"):
                schema.append(("link", opName, opVal[5:]))  # pylint: disable=unsubscriptable-object
                continue
            if self.__isGroupAuthApp(opVal):
                schema.append(("app", opName, opVal))
        return schema

    def __generateDefaultSchema(self):
        """Generate a menu schema based on the user credentials

        :param str base: base
        :param str path: path

        :return: list
        """
        schema = []
        for section, apps in DEFAULT_SCHEMA:
            appList = []
            for app in apps:
                if self.__isGroupAuthApp(app[-1]):
                    appList.append(app)
            if appList:
                schema.append((section, appList))
        return schema

    def __getGroupMenu(self):
        """Load the schema from the CS and filter based on the group

        :param dict cfg: dictionary with current configuration

        :return: list
        """
        menuSection = "%s/Schema" % (Conf.BASECS)
        # Somebody coming from HTTPS and not with a valid group
        group = self.__credDict.get("group", "")
        # Cache time!
        if group not in self.__groupMenu:
            result = gConfig.getSections(menuSection)
            if not result["OK"] or not result["Value"]:
                self.__groupMenu[group] = self.__generateDefaultSchema()
            else:
                self.__groupMenu[group] = self.__generateSchema(menuSection, "")
        return self.__groupMenu[group]

    @classmethod
    def getWebAppPath(cls):
        """Get WebApp path

        :return: str
        """
        return os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "WebApp")

    @classmethod
    def getExtJSVersion(cls):
        """Get ExtJS version

        :return: str
        """
        return cls.__extVersion

    @classmethod
    def getWebConfiguration(cls):
        """Get WebApp configuration

        :return: dict
        """
        result = gConfig.getOptionsDictRecursively("/WebApp")
        if not cls.__configuration and result["OK"]:
            cls.__configuration = result["Value"]
        return cls.__configuration

    def getData(self):
        """Return session data

        :return: dict
        """
        data = {
            "configuration": self.getWebConfiguration(),
            "menu": self.__getGroupMenu(),
            "user": self.__credDict,
            "validGroups": [],
            # 'groupsStatuses': '',
            "setup": self.__setup,
            "validSetups": gConfig.getSections("/DIRAC/Setups")["Value"],
            "extensions": self.__extensions,
            "extVersion": self.getExtJSVersion(),
        }
        # Add valid groups if known
        username = self.__credDict.get("username", "anonymous")
        if username != "anonymous":
            result = Registry.getGroupsForUser(username)
            if not result["OK"]:
                return result
            data["validGroups"] = result["Value"]
            # result = gProxyManager.getGroupsStatusByUsername(username)  # pylint: disable=no-member
            # if result['OK']:
            #   data['groupsStatuses'] = result['Value']
        # Calculate baseURL
        baseURL = [Conf.rootURL().strip("/"), "s:%s" % data["setup"], "g:%s" % self.__credDict.get("group", "")]
        data["baseURL"] = "/%s" % "/".join(baseURL)
        return data
