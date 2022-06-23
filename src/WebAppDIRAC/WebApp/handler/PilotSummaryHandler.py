import json
import datetime

from DIRAC import gConfig, gLogger
from DIRAC.WorkloadManagementSystem.Client.PilotManagerClient import PilotManagerClient
from DIRAC.WorkloadManagementSystem.Client.JobMonitoringClient import JobMonitoringClient
from WebAppDIRAC.Lib.WebHandler import WebHandler


class PilotSummaryHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def web_getPilotSummaryData(self):
        req = self.__request()

        result = PilotManagerClient().getPilotSummaryWeb(req, self.globalSort, self.pageNumber, self.numberOfJobs)
        if not result["OK"]:
            return {"success": "false", "result": [], "total": 0, "error": result["Message"]}

        result = result["Value"]

        if "TotalRecords" not in result:
            return {"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"}
        if not (result["TotalRecords"] > 0):
            return {"success": "false", "result": [], "total": 0, "error": "There were no data matching your selection"}
        if not ("ParameterNames" in result and "Records" in result):
            return {"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"}
        if not (len(result["ParameterNames"]) > 0):
            return {"success": "false", "result": [], "total": -1, "error": "ParameterNames field is missing"}
        if not (len(result["Records"]) > 0):
            return {"success": "false", "result": [], "total": 0, "Message": "There are no data to display"}

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
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
        if "Extras" in result:
            st = self.__dict2string({})
            extra = result["Extras"]
            return {
                "success": "true",
                "result": callback,
                "total": total,
                "extra": extra,
                "request": st,
                "date": timestamp,
            }
        return {"success": "true", "result": callback, "total": total, "date": timestamp}

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

    def web_getSelectionData(self):
        callback = {}
        if self.getUserName() == "Anonymous":
            return {"success": "false", "result": [], "total": 0, "error": "Insufficient rights"}

        if (result := JobMonitoringClient().getSites())["OK"]:
            tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
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
        return callback

    def __request(self):
        self.numberOfJobs = int(self.get_argument("limit", "25"))
        self.pageNumber = int(self.get_argument("start", "0"))
        self.globalSort = [["GridSite", "ASC"]]

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
