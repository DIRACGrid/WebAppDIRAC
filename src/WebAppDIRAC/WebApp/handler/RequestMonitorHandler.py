import json

from DIRAC import gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.RequestManagementSystem.Client.ReqClient import ReqClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class RequestMonitorHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getRequestMonitorData(self):
        callback = {}
        req = self.__request()

        result = yield self.threadTask(
            ReqClient().getRequestSummaryWeb, req, self.globalSort, self.pageNumber, self.numberOfJobs
        )

        if not result["OK"]:
            self.finish({"success": "false", "result": [], "total": 0, "error": result["Message"]})
            return

        result = result["Value"]

        if "TotalRecords" not in result:
            self.finish({"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"})
            return

        if not (result["TotalRecords"] > 0):
            self.finish(
                {"success": "false", "result": [], "total": 0, "error": "There were no data matching your selection"}
            )
            return

        if not ("ParameterNames" in result and "Records" in result):
            self.finish({"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"})
            return

        if not (len(result["ParameterNames"]) > 0):
            self.finish({"success": "false", "result": [], "total": -1, "error": "ParameterNames field is missing"})
            return

        if not (len(result["Records"]) > 0):
            self.finish({"success": "false", "result": [], "total": 0, "Message": "There are no data to display"})
            return

        callback = []
        jobs = result["Records"]
        head = result["ParameterNames"]
        headLength = len(head)

        jobs = result["Records"]
        head = result["ParameterNames"]
        headLength = len(head)
        for i in jobs:
            tmp = {}
            for j in range(0, headLength):
                if j == 2:
                    if i[j] == "None":
                        i[j] = "-"
                tmp[head[j]] = i[j]
            callback.append(tmp)
        total = result["TotalRecords"]
        total = result["TotalRecords"]
        timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
        if "Extras" in result:
            st = self.__dict2string({})
            extra = result["Extras"]
            callback = {
                "success": "true",
                "result": callback,
                "total": total,
                "extra": extra,
                "request": st,
                "date": timestamp,
            }
        else:
            callback = {"success": "true", "result": callback, "total": total, "date": timestamp}
        self.finish(callback)

    def __dict2string(self, req):
        result = ""
        try:
            for key, value in req.iteritems():
                result = result + str(key) + ": " + ", ".join(value) + "; "
        except Exception as x:
            pass
            gLogger.info("\033[0;31m Exception: \033[0m %s" % x)
        result = result.strip()
        result = result[:-1]
        return result

    @asyncGen
    def web_getSelectionData(self):
        callback = {}
        group = self.getUserGroup()
        user = self.getUserName()
        if user == "Anonymous":
            self.finish({"success": "false", "result": [], "total": 0, "error": "Insufficient rights"})
        else:
            # R E Q U E S T T Y P E
            result = yield self.threadTask(ReqClient().getDistinctValuesWeb, "Type")
            if result["OK"]:
                reqtype = list()
                if len(result["Value"]) > 0:
                    for i in result["Value"]:
                        reqtype.append([str(i)])
                else:
                    reqtype = [["Nothing to display"]]
            else:
                reqtype = [["Error during RPC call"]]
            callback["operationType"] = reqtype
            # U S E R
            result = yield self.threadTask(ReqClient().getDistinctValuesWeb, "OwnerDN")

            if result["OK"]:
                owner = []
                for dn in result["Value"]:

                    owner.append([dn])
                if len(owner) < 2:
                    owner = [["Nothing to display"]]
            else:
                owner = [["Error during RPC call"]]
            callback["owner"] = owner
            # G R O U P
            result = yield self.threadTask(ReqClient().getDistinctValuesWeb, "OwnerGroup")
            gLogger.info("getDistinctValuesWeb(OwnerGroup)", result)
            if result["OK"]:
                ownerGroup = list()
                if len(result["Value"]) > 0:
                    for i in result["Value"]:
                        ownerGroup.append([str(i)])
                else:
                    ownerGroup = [["Nothing to display"]]
            else:
                ownerGroup = [["Error during RPC call"]]
            callback["ownerGroup"] = ownerGroup
            # S T A T U S
            result = yield self.threadTask(ReqClient().getDistinctValuesWeb, "Status")

            if result["OK"]:
                status = list()
                if len(result["Value"]) > 0:
                    for i in result["Value"]:
                        status.append([str(i)])
                else:
                    status = [["Nothing to display"]]
            else:
                status = [["Error during RPC call"]]
            callback["status"] = status
            self.finish(callback)

    ################################################################################
    def __request(self):
        self.numberOfJobs = int(self.get_argument("limit", "25"))
        self.pageNumber = int(self.get_argument("start", "0"))
        self.globalSort = [["JobID", "DESC"]]
        group = self.getUserGroup()
        user = self.getUserName()
        req = {}
        found = False

        jobids = list(json.loads(self.get_argument("id", "[]")))
        if jobids:
            req["JobID"] = jobids
            found = True

        reqids = list(json.loads(self.get_argument("reqId", "[]")))
        if reqids and not found:
            req["RequestID"] = reqids
            found = True

        if not found:
            value = list(json.loads(self.get_argument("operationType", "[]")))
            if value:
                req["Type"] = value

            value = list(json.loads(self.get_argument("ownerGroup", "[]")))
            if value:
                req["OwnerGroup"] = value

            value = list(json.loads(self.get_argument("status", "[]")))
            if value:
                req["Status"] = value

            value = list(json.loads(self.get_argument("owner", "[]")))
            if value:
                req["OwnerDN"] = value

            sort = json.loads(self.get_argument("sort", "[]"))
            if sort:
                self.globalSort = [[i["property"], i["direction"]] for i in sort]

        if self.get_argument("startDate", ""):
            req["FromDate"] = self.get_argument("startDate")
            if self.get_argument("startTime", ""):
                req["FromDate"] += " " + self.get_argument("startTime")

        if self.get_argument("endDate", ""):
            req["ToDate"] = self.get_argument("endDate")
            if self.get_argument("endTime", ""):
                req["ToDate"] += " " + self.get_argument("endTime")

        if self.get_argument("date", ""):
            req["LastUpdate"] = self.get_argument("date")
        gLogger.info("REQUEST:", req)
        return req
