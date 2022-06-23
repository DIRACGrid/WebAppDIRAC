import collections
import json
import datetime

from DIRAC import gLogger
from DIRAC.ResourceStatusSystem.Client.PublisherClient import PublisherClient
from DIRAC.ResourceStatusSystem.PolicySystem.StateMachine import RSSMachine

from WebAppDIRAC.Lib.WebHandler import WebHandler


class SummaryHandlerMix(WebHandler):
    DEFAULT_AUTHORIZATION = "all"
    ELEMENT_TYPE = None

    def _getSelectionData(self, **kwargs) -> dict:
        """It returns the possible selection data"""
        callback = {"name": set(), "elementType": set(), "status": set(), "statusType": set(), "tokenOwner": set()}

        pub = PublisherClient()

        gLogger.info("Arguments to web_getSelectionData", repr(kwargs))
        elementStatuses = pub.getElementStatuses(self.ELEMENT_TYPE, None, None, None, None, None)

        if elementStatuses["OK"]:

            for elementStatus in elementStatuses["Value"]:
                callback["status"].add(elementStatus[2])
                callback["name"].add(elementStatus[0])
                callback["elementType"].add(elementStatus[6])
                callback["statusType"].add(elementStatus[1])
                callback["tokenOwner"].add(elementStatus[8])

        for key, value in callback.items():

            callback[key] = sorted([[item] for item in list(value)])
            callback[key] = [["All"]] + callback[key]

        return callback

    def combine(self, elementValues: list) -> dict:
        """Helper method to combine values

        :param elementValues: values
        """

        statuses = [element["Status"] for element in elementValues]

        statusSet = set(statuses)

        if len(statusSet) == 1:
            status = statusSet.pop()
            reason = "All %s" % status

        else:

            if set(["Active", "Degraded"]) & set(statusSet):
                status = "Degraded"
                reason = "Not completely active"

            else:
                status = "Banned"
                reason = "Not usable"

        # Make a copy
        combined = {}
        combined.update(elementValues[0])
        combined["StatusType"] = "%d elements" % len(statuses)
        combined["Status"] = status
        combined["Reason"] = reason
        combined["DateEffective"] = ""
        combined["LastCheckTime"] = ""
        combined["TokenOwner"] = ""
        combined["TokenExpiration"] = ""

        return combined

    def _expand(self, name) -> dict:
        """This method handles the POST requests"""
        elements = PublisherClient().getElementStatuses(self.ELEMENT_TYPE, name, None, None, None, None)
        if not elements["OK"]:
            return {"success": "false", "error": elements["Message"]}

        elementList = [dict(zip(elements["Columns"], element)) for element in elements["Value"]]
        for element in elementList:
            element["DateEffective"] = str(element["DateEffective"])
            element["LastCheckTime"] = str(element["LastCheckTime"])
            element["TokenExpiration"] = str(element["TokenExpiration"])

        return {"success": "true", "result": elementList, "total": len(elementList)}

    def _action(self, action, **kwargs) -> dict:
        """Do action requested from the web portal."""
        if not (methodName := action):
            return {"success": "false", "error": "Missing action"}

        if not action.startswith("set"):
            methodName = f"_get{action}"

        if not hasattr(self, methodName):
            return {"success": "false", "error": f"bad action {action}"}
        return getattr(self, methodName)(kwargs)

    def __checkAuth(self, username: str):
        """Check user permissions

        :return: None if all OK else error message
        """
        if username.lower() == "anonymous":
            return "Cannot perform this operation as anonymous"
        if "SiteManager" not in self.getProperties():
            return "Not authorized"

    def setToken(self, requestParams: dict) -> dict:
        """Set token"""
        if error := self.__checkAuth(username := self.getUserName()):
            return {"success": "false", "error": error}

        result = PublisherClient().setToken(
            self.ELEMENT_TYPE,
            requestParams["name"],
            requestParams["statusType"],
            requestParams["status"],
            requestParams["elementType"],
            username,
            requestParams["lastCheckTime"],
        )

        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}
        return {"success": "true", "result": result["Value"]}

    def setStatus(self, requestParams: dict) -> dict:
        """Set token"""
        if error := self.__checkAuth(username := self.getUserName()):
            return {"success": "false", "error": error}

        result = PublisherClient().setStatus(
            self.ELEMENT_TYPE,
            requestParams["name"],
            requestParams["statusType"],
            requestParams["status"],
            requestParams["elementType"],
            username,
            requestParams["lastCheckTime"],
        )

        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}
        return {"success": "true", "result": result["Value"]}

    def _checkParameters(self, requestParams: dict, parametersToCheck: list):
        """Check incoming parameters

        :param requestParams: request parameters
        :param parametersToCheck: parameters to check

        :return: None if all is OK else error message
        """
        for fieldName in parametersToCheck:
            if not requestParams.get(fieldName):
                return f"Missing {fieldName}"

    def _getHistory(self, requestParams: dict) -> dict:
        """Get history"""
        if error := self._checkParameters(requestParams, ["name", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        result = PublisherClient().getElementHistory(
            self.ELEMENT_TYPE, requestParams["name"], requestParams["elementType"], requestParams["statusType"]
        )
        if not result["OK"]:
            gLogger.error(result["Message"])
            return {"success": "false", "error": "error getting history"}

        history = [[r[0], str(r[1]), r[2]] for r in result["Value"]]

        return {"success": "true", "result": history, "total": len(history)}

    def _getPolicies(self, requestParams: dict) -> dict:
        """Get policies"""
        if error := self._checkParameters(requestParams, ["name", "statusType"]):
            return {"success": "false", "error": error}

        result = PublisherClient().getElementPolicies(
            self.ELEMENT_TYPE, requestParams["name"], requestParams["statusType"]
        )
        if not result["OK"]:
            gLogger.error(result["Message"])
            return {"success": "false", "error": "error getting policies"}

        policies = [[r[0], r[1], str(r[2]), str(r[3]), r[4]] for r in result["Value"]]

        return {"success": "true", "result": policies, "total": len(policies)}

    def _getDowntime(self, requestParams: dict) -> dict:
        """Get downtime"""
        if error := self._checkParameters(requestParams, ["name", "element", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        result = PublisherClient().getDowntimes(
            requestParams["element"],
            requestParams["elementType"],
            requestParams["name"],
        )
        if not result["OK"]:
            gLogger.error(result["Message"])
            return {"success": "false", "error": "error getting downtimes"}

        downtimes = [[str(dt[0]), str(dt[1]), dt[2], dt[3], dt[4]] for dt in result["Value"]]

        return {"success": "true", "result": downtimes, "total": len(downtimes)}

    def _getTimeline(self, requestParams: dict) -> dict:
        """Get timeline"""
        if error := self._checkParameters(requestParams, ["name", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        result = PublisherClient().getElementHistory(
            self.ELEMENT_TYPE,
            requestParams["name"],
            requestParams["elementType"],
            requestParams["statusType"],
        )

        if not result["OK"]:
            gLogger.error(result["Message"])
            return {"success": "false", "error": "error getting history"}

        history = []

        for status, dateEffective, reason in result["Value"]:

            # history.append( [ history[ -1 ][ 0 ], str( dateEffective - timedelta( seconds = 1 ) ), '' ] )

            history.append([status, str(dateEffective), reason])

        return {"success": "true", "result": history, "total": len(history)}

    def _getTree(self, requestParams: dict) -> dict:
        """Get timeline"""
        if error := self._checkParameters(requestParams, ["name", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        result = PublisherClient().getTree(requestParams["elementType"], requestParams["name"])
        if not result["OK"]:
            gLogger.error(result["Message"])
            return {"success": "false", "error": "error getting tree"}
        data = result["Value"]

        siteName = list(data)[0]

        tree = [[siteName, None, None, None]]
        for k, v in data[siteName]["statusTypes"].items():
            tree.append([None, k, v, siteName])

        tree.append(["ces", None, None, siteName])
        for ce, ceDict in data[siteName]["ces"].items():
            tree.append([ce, None, None, "ces"])
            for k, v in ceDict.items():
                tree.append([None, k, v, ce])

        tree.append(["ses", None, None, siteName])
        for se, seDict in data[siteName]["ses"].items():
            tree.append([se, None, None, "ses"])
            for k, v in seDict.items():
                tree.append([None, k, v, se])

        return {"success": "true", "result": tree, "total": len(tree)}

    def _getInfo(self, requestParams: dict) -> dict:
        """Get timeline"""
        if error := self._checkParameters(requestParams, ["name", "element", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        result = PublisherClient().getElementStatuses(
            requestParams["element"],
            requestParams["name"],
            requestParams["elementType"],
            requestParams["statusType"],
            None,
            None,
        )

        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}
        if not result["Value"]:
            return {"success": "false", "error": "Nothing found."}

        columns = result["Columns"]

        data = dict(zip(columns, result["Value"][0]))
        data["DateEffective"] = str(data["DateEffective"])
        data["LastCheckTime"] = str(data["LastCheckTime"])
        data["TokenExpiration"] = str(data["TokenExpiration"])

        return {"success": "true", "result": data, "total": len(data)}


class ResourceSummaryHandler(SummaryHandlerMix):

    ELEMENT_TYPE = "Resource"

    def web_getSelectionData(self):
        return self._getSelectionData()

    def web_expand(self, name: list = None):
        return self._expand(name)

    def web_action(self, action=None, **kwargs):
        return self._action(action, **kwargs)

    def web_getResourceSummaryData(self, name=None, status=None, elementType=None, statusType=None, tokenOwner=None):
        """This method returns the data required to fill the grid."""
        elementStatuses = PublisherClient().getElementStatuses(
            self.ELEMENT_TYPE,
            name,
            elementType,
            statusType,
            status,
            tokenOwner,
        )
        if not elementStatuses["OK"]:
            return {"success": "false", "error": elementStatuses["Message"]}

        elementTree = collections.defaultdict(list)

        for element in elementStatuses["Value"]:

            elementDict = dict(zip(elementStatuses["Columns"], element))

            elementDict["DateEffective"] = str(elementDict["DateEffective"])
            elementDict["LastCheckTime"] = str(elementDict["LastCheckTime"])
            elementDict["TokenExpiration"] = str(elementDict["TokenExpiration"])

            elementTree[elementDict["Name"]].append(elementDict)

        elementList = []

        for elementValues in elementTree.values():

            if len(elementValues) == 1:
                elementList.append(elementValues[0])
            else:
                elementList.append(self.combine(elementValues))

        RSSMachine(None).orderPolicyResults(elementList)

        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")

        return {"success": "true", "result": elementList, "total": len(elementList), "date": timestamp}
