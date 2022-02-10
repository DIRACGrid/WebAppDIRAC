import collections
import json

from DIRAC import gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.ResourceStatusSystem.Client.PublisherClient import PublisherClient
from DIRAC.ResourceStatusSystem.PolicySystem.StateMachine import RSSMachine

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class SummaryHandlerMix(WebHandler):
    AUTH_PROPS = "all"
    ELEMENT_TYPE = None

    def _getSelectionData(self) -> dict:
        """It returns the possible selection data"""
        callback = {"name": set(), "elementType": set(), "status": set(), "statusType": set(), "tokenOwner": set()}

        pub = PublisherClient()

        gLogger.info("Arguments to web_getSelectionData", repr(self.request.arguments))
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

        #      if set( [ 'Unknown','Active', 'Degraded' ] ) & set( statusSet ):
        #        for upStatus in [ 'Active', 'Degraded' ]:
        #          if upStatus in statusSet:
        #            status = upStatus
        #            reason = '%d %s' % ( statuses.count( upStatus ), upStatus )
        #            break
        #      else:
        #        for downStatus in [ 'Unknown','Probing','Banned','Error' ]:
        #          if downStatus in statusSet:
        #            status = downStatus
        #            reason = '%d %s' % ( statuses.count( downStatus ), downStatus )
        #            break

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

    def _expand(self) -> dict:
        """This method handles the POST requests"""

        requestParams = self._requestParams()
        gLogger.info(requestParams)

        pub = PublisherClient()

        elements = pub.getElementStatuses(self.ELEMENT_TYPE, requestParams["name"], None, None, None, None)
        if not elements["OK"]:
            return {"success": "false", "error": elements["Message"]}

        elementList = [dict(zip(elements["Columns"], element)) for element in elements["Value"]]
        for element in elementList:
            element["DateEffective"] = str(element["DateEffective"])
            element["LastCheckTime"] = str(element["LastCheckTime"])
            element["TokenExpiration"] = str(element["TokenExpiration"])

        return {"success": "true", "result": elementList, "total": len(elementList)}

    def _action(self) -> dict:
        """Do action requested from the web portal."""
        requestParams = self._requestParams()
        if not requestParams.get("action"):
            return {"success": "false", "error": "Missing action"}

        # pylint does not understand the action entry is not None any more
        actionName = requestParams["action"][0]  # pylint: disable=unsubscriptable-object

        methodName = actionName
        if not actionName.startswith("set"):
            methodName = f"_get{actionName}"

        try:
            return getattr(self, methodName)(requestParams)
        except AttributeError:
            return {"success": "false", "error": f"bad action {actionName}"}

    def __checkAuth(self, username: str):
        """Check user permissions

        :param username: user name

        :return: None if all OK else error message
        """
        if username == "anonymous":
            return "Cannot perform this operation as anonymous"
        if "SiteManager" not in self.getProperties():
            return "Not authorized"

    def setToken(self, requestParams: dict) -> dict:
        """Set token

        :param requestParams: request parameters
        """
        if error := self.__checkAuth(username := self.getUserName()):
            return {"success": "false", "error": error}

        res = PublisherClient().setToken(
            self.ELEMENT_TYPE,
            str(requestParams["name"][0]),
            str(requestParams["statusType"][0]),
            str(requestParams["status"][0]),
            str(requestParams["elementType"][0]),
            username,
            str(requestParams["lastCheckTime"][0]),
        )

        if not res["OK"]:
            return {"success": "false", "error": res["Message"]}
        return {"success": "true", "result": res["Value"]}

    def setStatus(self, requestParams: dict) -> dict:
        """Set token

        :param requestParams: request parameters
        """
        if error := self.__checkAuth(username := self.getUserName()):
            return {"success": "false", "error": error}

        res = PublisherClient().setStatus(
            self.ELEMENT_TYPE,
            str(requestParams["name"][0]),
            str(requestParams["statusType"][0]),
            str(requestParams["status"][0]),
            str(requestParams["elementType"][0]),
            username,
            str(requestParams["lastCheckTime"][0]),
        )

        if not res["OK"]:
            return {"success": "false", "error": res["Message"]}
        return {"success": "true", "result": res["Value"]}

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
        """Get history

        :param requestParams: request parameters
        """
        if error := self._checkParameters(requestParams, ["name", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        res = PublisherClient().getElementHistory(
            self.ELEMENT_TYPE,
            requestParams["name"],
            requestParams["elementType"],
            requestParams["statusType"],
        )

        if not res["OK"]:
            gLogger.error(res["Message"])
            return {"success": "false", "error": "error getting history"}

        history = [[r[0], str(r[1]), r[2]] for r in res["Value"]]

        return {"success": "true", "result": history, "total": len(history)}

    def _getPolicies(self, requestParams: dict) -> dict:
        """Get policies

        :param requestParams: request parameters
        """
        if error := self._checkParameters(requestParams, ["name", "statusType"]):
            return {"success": "false", "error": error}

        res = PublisherClient().getElementPolicies(
            self.ELEMENT_TYPE, requestParams["name"], requestParams["statusType"]
        )

        if not res["OK"]:
            gLogger.error(res["Message"])
            return {"success": "false", "error": "error getting policies"}

        policies = [[r[0], r[1], str(r[2]), str(r[3]), r[4]] for r in res["Value"]]

        return {"success": "true", "result": policies, "total": len(policies)}

    def _getDowntime(self, requestParams: dict) -> dict:
        """Get downtime

        :param requestParams: request parameters
        """
        if error := self._checkParameters(requestParams, ["name", "element", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        res = PublisherClient().getDowntimes(
            str(requestParams["element"][-1]),
            str(requestParams["elementType"][-1]),
            str(requestParams["name"][-1]),
        )
        if not res["OK"]:
            gLogger.error(res["Message"])
            return {"success": "false", "error": "error getting downtimes"}

        downtimes = [[str(dt[0]), str(dt[1]), dt[2], dt[3], dt[4]] for dt in res["Value"]]

        return {"success": "true", "result": downtimes, "total": len(downtimes)}

    def _getTimeline(self, requestParams: dict) -> dict:
        """Get timeline

        :param requestParams: request parameters
        """
        if error := self._checkParameters(requestParams, ["name", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        res = PublisherClient().getElementHistory(
            self.ELEMENT_TYPE,
            str(requestParams["name"][-1]),
            str(requestParams["elementType"][-1]),
            str(requestParams["statusType"][-1]),
        )

        if not res["OK"]:
            gLogger.error(res["Message"])
            return {"success": "false", "error": "error getting history"}

        history = []

        for status, dateEffective, reason in res["Value"]:

            # history.append( [ history[ -1 ][ 0 ], str( dateEffective - timedelta( seconds = 1 ) ), '' ] )

            history.append([status, str(dateEffective), reason])

        return {"success": "true", "result": history, "total": len(history)}

    def _getTree(self, requestParams: dict) -> dict:
        """Get timeline

        :param requestParams: request parameters
        """
        if error := self._checkParameters(requestParams, ["name", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        pub = PublisherClient()
        res = PublisherClient().getTree(str(requestParams["elementType"][-1]), str(requestParams["name"][-1]))
        if not res["OK"]:
            gLogger.error(res["Message"])
            return {"success": "false", "error": "error getting tree"}
        res = res["Value"]

        siteName = list(res)[0]

        tree = [[siteName, None, None, None]]
        for k, v in res[siteName]["statusTypes"].items():
            tree.append([None, k, v, siteName])

        tree.append(["ces", None, None, siteName])
        for ce, ceDict in res[siteName]["ces"].items():
            tree.append([ce, None, None, "ces"])
            for k, v in ceDict.items():
                tree.append([None, k, v, ce])

        tree.append(["ses", None, None, siteName])
        for se, seDict in res[siteName]["ses"].items():
            tree.append([se, None, None, "ses"])
            for k, v in seDict.items():
                tree.append([None, k, v, se])

        return {"success": "true", "result": tree, "total": len(tree)}

    def _getInfo(self, requestParams: dict) -> dict:
        """Get timeline

        :param requestParams: request parameters
        """
        if error := self._checkParameters(requestParams, ["name", "element", "elementType", "statusType"]):
            return {"success": "false", "error": error}

        res = PublisherClient().getElementStatuses(
            str(requestParams["element"][-1]),
            str(requestParams["name"][-1]),
            str(requestParams["elementType"][-1]),
            str(requestParams["statusType"][-1]),
            None,
            None,
        )

        if not res["OK"]:
            return {"success": "false", "error": res["Message"]}
        if not res["Value"]:
            return {"success": "false", "error": "Nothing found."}

        columns = res["Columns"]

        res = dict(zip(columns, res["Value"][0]))
        res["DateEffective"] = str(res["DateEffective"])
        res["LastCheckTime"] = str(res["LastCheckTime"])
        res["TokenExpiration"] = str(res["TokenExpiration"])

        return {"success": "true", "result": res, "total": len(res)}

    def _requestParams(self) -> dict:
        """
        We receive the request and we parse it, in this case, we are doing nothing,
        but it can be certainly more complex.
        """
        gLogger.always("!!!  PARAMS: ", repr(self.request.arguments))

        responseParams = {
            "element": None,
            "name": None,
            "elementType": None,
            "statusType": None,
            "status": None,
            "tokenOwner": None,
            "lastCheckTime": None,
            "action": None,
        }

        for key in responseParams:
            value = self.get_argument(key, "")
            if value:
                responseParams[key] = list(json.loads(value))

        return responseParams


class ResourceSummaryHandler(SummaryHandlerMix):

    ELEMENT_TYPE = "Resource"

    @asyncGen
    def web_getSelectionData(self):
        callback = yield self.threadTask(self._getSelectionData)
        self.finish(callback)

    @asyncGen
    def web_expand(self):
        callback = yield self.threadTask(self._expand)
        self.finish(callback)

    @asyncGen
    def web_action(self):
        callback = yield self.threadTask(self._action)
        self.finish(callback)

    @asyncGen
    def web_getResourceSummaryData(self):
        """This method returns the data required to fill the grid."""

        requestParams = self._requestParams()
        gLogger.info(requestParams)

        pub = PublisherClient()

        elementStatuses = yield self.threadTask(
            pub.getElementStatuses,
            self.ELEMENT_TYPE,
            requestParams["name"],
            requestParams["elementType"],
            requestParams["statusType"],
            requestParams["status"],
            requestParams["tokenOwner"],
        )
        if not elementStatuses["OK"]:
            self.finish({"success": "false", "error": elementStatuses["Message"]})
            return

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

        rssMachine = RSSMachine(None)

        yield self.threadTask(rssMachine.orderPolicyResults, elementList)

        timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")

        self.finish({"success": "true", "result": elementList, "total": len(elementList), "date": timestamp})
