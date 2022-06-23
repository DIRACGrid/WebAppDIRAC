import json
import datetime

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.FrameworkSystem.Client.ProxyManagerClient import gProxyManager

from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr


class ProxyManagerHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def web_getSelectionData(self, **kwargs):
        callback = {"extra": kwargs} if kwargs else {}

        if self.getUserName().lower() == "anonymous":
            return {"success": "false", "error": "You are not authorize to access these data"}

        if not (result := gProxyManager.getDBContents())["OK"]:
            if result.get("Errno", 0) == 1112:
                raise WErr(503, "Connection error")
            return {"success": "false", "error": result["Message"]}
        data = result["Value"]
        users = []
        groups = []
        for record in data["Records"]:
            users.append(str(record[0]))
            groups.append(str(record[2]))
        # AL:
        # for record in data["Dictionaries"]:
        #   users.append(record['user'])
        #   groups += record['groups']
        users = uniqueElements(users)
        groups = uniqueElements(groups)
        users.sort()
        groups.sort()
        users = [[x] for x in users]
        groups = [[x] for x in groups]

        callback["username"] = users
        callback["usergroup"] = groups
        result = gConfig.getOption("/WebApp/ProxyManagementMonitoring/TimeSpan", "86400,432000,604800,2592000")
        if result["OK"]:
            tmp = result["Value"]
            tmp = tmp.split(", ")
            if len(tmp) > 0:
                timespan = []
                for i in tmp:
                    human_readable = self.__humanize_time(i)
                    timespan.append([i, human_readable])
            else:
                timespan = [["Nothing to display"]]
        else:
            timespan = [["Error during RPC call"]]
        callback["expiredBefore"] = timespan
        callback["expiredAfter"] = timespan
        return callback

    def web_getProxyManagerData(
        self,
        start=0,
        limit=25,
        sortDirection="ASC",
        sortField="UserName",
        username="[]",
        usergroup="[]",
        persistent="",
        expiredBefore=0,
        expiredAfter=0,
    ):
        if self.getUserName().lower() == "anonymous":
            return {"success": "false", "error": "You are not authorize to access these data"}
        req = self.__prepareParameters(username, usergroup, persistent, expiredBefore, expiredAfter)
        gLogger.info("!!!  S O R T : ", sort := [[sortField, sortDirection]])
        # pylint: disable=no-member
        result = gProxyManager.getDBContents(req, sort, start, limit)
        # result = gProxyManager.getDBContents(None, None, req, start, limit)
        gLogger.info(f"*!*!*!  RESULT: \n{result}")
        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}
        svcData = result["Value"]
        proxies = []
        for record in svcData["Records"]:
            proxies.append(
                {
                    "proxyid": f"{record[1]}@{record[2]}",
                    "UserName": str(record[0]),
                    "UserDN": record[1],
                    "UserGroup": record[2],
                    "ExpirationTime": str(record[3]),
                    "PersistentFlag": str(record[4]),
                }
            )
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
        return {"success": "true", "result": proxies, "total": svcData["TotalRecords"], "date": timestamp}

    def web_deleteProxies(self, idList=None):
        if not (webIds := list(json.loads(idList))):
            return {"success": "false", "error": "No valid id's specified"}

        idList = []
        for id in webIds:
            spl = id.split("@")
            dn = "@".join(spl[:-1])
            group = spl[-1]
            idList.append((dn, group))
        retVal = gProxyManager.deleteProxyBundle(idList)
        # for uid in webIds:
        #   spl = uid.split("@")
        #   dn = "@".join(spl[:-1])
        #   idList.append(dn)
        # retVal = yield self.threadTask(ProxyManagerClient().deleteProxy, idList)  # pylint: disable=no-member
        if retVal["OK"]:
            return {"success": "true", "result": retVal["Value"]}
        return {"success": "false", "error": retVal["Message"]}

    def __humanize_time(self, sec=False):
        """
        Converts number of seconds to human readable values. Max return value is
        "More then a year" year and min value is "One day"
        """
        if not sec:
            return "Time span is not specified"
        try:
            sec = int(sec)
        except ValueError:
            return "Value from CS is not integer"

        month, week = divmod(sec, 2592000)
        if month > 12:
            return "More then a year"
        elif month > 1:
            return f"{month} months"
        elif month == 1:
            return "One month"

        week, day = divmod(sec, 604800)
        if week == 1:
            return "One week"
        elif week > 1:
            return f"{week} weeks"

        day, hours = divmod(sec, 86400)
        if day == 1:
            return "One day"
        elif day > 0:
            return f"{day} days"

    def __prepareParameters(self, username, usergroup, persistent, expiredBefore, expiredAfter):
        req = {}
        if users := list(json.loads(username)):
            req["UserName"] = users
        if usersgroup := list(json.loads(usergroup)):
            req["UserGroup"] = usersgroup
        if usersgroup and persistent in ["True", "False"]:
            req["PersistentFlag"] = persistent
        if expiredBefore > expiredAfter:
            expiredBefore, expiredAfter = expiredAfter, expiredBefore
        if expiredBefore:
            req["beforeDate"] = expiredBefore
        if expiredAfter:
            req["afterDate"] = expiredAfter
        gLogger.always("REQUEST:", req)
        return req
