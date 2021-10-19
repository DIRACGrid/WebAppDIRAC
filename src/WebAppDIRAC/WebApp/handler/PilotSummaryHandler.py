import json

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.WorkloadManagementSystem.Client.PilotManagerClient import PilotManagerClient
from DIRAC.WorkloadManagementSystem.Client.JobMonitoringClient import JobMonitoringClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class PilotSummaryHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getPilotSummaryData(self):
        callback = {}
        req = self.__request()

        result = yield self.threadTask(
            PilotManagerClient().getPilotSummaryWeb, req, self.globalSort, self.pageNumber, self.numberOfJobs
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

        for i in jobs:
            tmp = {}
            for j in range(0, headLength):
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
            result = yield self.threadTask(JobMonitoringClient().getSites)
            if result["OK"]:
                tier1 = gConfig.getValue("/WebApp/PreferredSites")
                if tier1:
                    try:
                        tier1 = tier1.split(", ")
                    except BaseException:
                        tier1 = list()
                else:
                    tier1 = list()
                site = []
                if len(result["Value"]) > 0:
                    s = list(result["Value"])
                    for i in tier1:
                        site.append([str(i)])
                    for i in s:
                        if i not in tier1:
                            site.append([str(i)])
                else:
                    site = [["Nothing to display"]]

            else:
                site = [["Error during RPC call"]]

            callback["site"] = site
            callback["Status"] = [["Good"], ["Bad"], ["Idle"], ["Poor"], ["Fair"]]

            self.finish(callback)

    ################################################################################

    def __request(self):
        self.numberOfJobs = int(self.get_argument("limit", "25"))
        self.pageNumber = int(self.get_argument("start", "0"))
        self.globalSort = [["GridSite", "ASC"]]
        group = self.getUserGroup()
        user = self.getUserName()

        req = {}
        found = False
        jobids = list(json.loads(self.get_argument("id", "[]")))
        if jobids:
            req["JobID"] = jobids
            found = True

        elif "expand" in self.request.arguments:
            expand = list(json.loads(self.get_argument("expand", "[]")))
            if expand:
                self.numberOfJobs = 500
                self.pageNumber = 0
                req["ExpandSite"] = expand[0]
                found = True

        if not found:
            value = list(json.loads(self.get_argument("prod", "[]")))
            if value:
                req["JobGroup"] = value

            value = list(json.loads(self.get_argument("site", "[]")))
            if len(value) > 1:
                req["GridSite"] = value
            elif len(value) == 1:
                req["ExpandSite"] = value[0]

            value = list(json.loads(self.get_argument("Status", "[]")))
            if value:
                req["Status"] = value

            if "sort" in self.request.arguments:
                sort = json.loads(self.get_argument("sort"))
                if len(sort) > 0:
                    self.globalSort = [[i["property"], i["direction"]] for i in sort]
                else:
                    self.globalSort = [["GridSite", "DESC"]]

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
