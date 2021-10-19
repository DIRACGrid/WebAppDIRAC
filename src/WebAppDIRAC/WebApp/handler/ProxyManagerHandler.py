import json
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.FrameworkSystem.Client.ProxyManagerClient import gProxyManager

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen, WErr


class ProxyManagerHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getSelectionData(self):
        callback = {}

        user = self.getUserName()
        if user.lower() == "anonymous":
            self.finish({"success": "false", "error": "You are not authorize to access these data"})

        if len(self.request.arguments) > 0:
            callback["extra"] = {i: self.get_argument(i) for i in self.request.arguments}
        result = yield self.threadTask(gProxyManager.getDBContents)
        if not result["OK"]:
            if result.get("Errno", 0) == 1112:
                raise WErr(503, "Connection error")
            self.finish({"success": "false", "error": result["Message"]})
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
        self.finish(callback)

    @asyncGen
    def web_getProxyManagerData(self):
        user = self.getUserName()
        if user.lower() == "anonymous":
            self.finish({"success": "false", "error": "You are not authorize to access these data"})
        start, limit, sort, req = self.__request()
        # pylint: disable=no-member
        result = yield self.threadTask(gProxyManager.getDBContents, req, sort, start, limit)
        # result = yield self.threadTask(gProxyManager.getDBContents, None, None, req, start, limit)
        gLogger.info("*!*!*!  RESULT: \n%s" % result)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
        svcData = result["Value"]
        proxies = []
        for record in svcData["Records"]:
            proxies.append(
                {
                    "proxyid": "%s@%s" % (record[1], record[2]),
                    "UserName": str(record[0]),
                    "UserDN": record[1],
                    "UserGroup": record[2],
                    "ExpirationTime": str(record[3]),
                    "PersistentFlag": str(record[4]),
                }
            )
        # for record in svcData['Dictionaries']:
        #   proxies.append({'proxyid': "%s@%s" % (record["DN"],
        #                                         record['groups'] if record['groups'] > 1 else record['groups'][0]),
        #                   'UserName': record['user'],
        #                   'UserDN': record['DN'],
        #                   'UserGroups': record['groups'],
        #                   'ExpirationTime': str(record['expirationtime']),
        #                   'Provider': record['provider']})
        timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
        data = {"success": "true", "result": proxies, "total": svcData["TotalRecords"], "date": timestamp}
        self.finish(data)

    @asyncGen
    def web_deleteProxies(self):
        try:
            webIds = list(json.loads(self.get_argument("idList")))
        except Exception:
            self.finish({"success": "false", "error": "No valid id's specified"})
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
        callback = {}
        if retVal["OK"]:
            callback = {"success": "true", "result": retVal["Value"]}
        else:
            callback = {"success": "false", "error": retVal["Message"]}
        self.finish(callback)

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
            return str(month) + " months"
        elif month == 1:
            return "One month"

        week, day = divmod(sec, 604800)
        if week == 1:
            return "One week"
        elif week > 1:
            return str(week) + " weeks"

        day, hours = divmod(sec, 86400)
        if day == 1:
            return "One day"
        elif day > 0:
            return str(day) + " days"

    def __request(self):
        gLogger.info("!!!  PARAMS: ", str(self.request.arguments))
        start = int(self.get_argument("start", "0"))
        limit = int(self.get_argument("limit", "25"))
        req = {}

        sortDirection = self.get_argument("sortDirection", "ASC")
        sortField = self.get_argument("sortField", "UserName")
        sort = [[sortField, sortDirection]]
        gLogger.info("!!!  S O R T : ", sort)

        users = list(json.loads(self.get_argument("username", "[]")))
        if users:
            req["UserName"] = users

        usersgroup = list(json.loads(self.get_argument("usergroup", "[]")))
        if usersgroup:
            req["UserGroup"] = usersgroup

        persistent = self.get_argument("persistent", "")
        if usersgroup and persistent in ["True", "False"]:
            req["PersistentFlag"] = persistent
        before = int(self.get_argument("expiredBefore", "0"))
        after = int(self.get_argument("expiredAfter", "0"))
        if before > after:
            before, after = after, before
        if before:
            req["beforeDate"] = before
        if after:
            req["afterDate"] = after
        gLogger.always("REQUEST:", req)
        return (start, limit, sort, req)
