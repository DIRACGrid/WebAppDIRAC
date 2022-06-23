import json
import datetime

from DIRAC import gConfig, S_OK, gLogger
from DIRAC.Core.Utilities.Graphs.Palette import Palette
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getUsernameForDN
from DIRAC.WorkloadManagementSystem.Client.PilotManagerClient import PilotManagerClient
from WebAppDIRAC.Lib.WebHandler import WebHandler


class PilotMonitorHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def web_getPilotData(self):
        req = self.__request()

        result = PilotManagerClient().getPilotMonitorWeb(req, self.globalSort, self.pageNumber, self.numberOfJobs)

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
                if j == 12:
                    if i[j] == 0:
                        i[j] = "-"
                tmp[head[j]] = i[j]
            callback.append(tmp)
        total = result["TotalRecords"]
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
        if "Extras" in result:
            return {"success": "true", "result": callback, "total": total, "extra": result["Extras"], "date": timestamp}
        return {"success": "true", "result": callback, "total": total, "date": timestamp}

    def web_getSelectionData(self):
        callback = {}

        if len(self.request.arguments) > 0:
            tmp = {self.get_argument(i).replace('"', "") for i in self.request.arguments}
            callback["extra"] = list(tmp)

        if (result := PilotManagerClient().getPilotMonitorSelectors())["OK"]:
            result = result["Value"]

            if "Status" in result and len(result["Status"]) > 0:
                status = []
                for i in result["Status"]:
                    status.append([str(i)])
            else:
                status = [["Nothing to display"]]
            callback["status"] = status

            if "GridType" in result and len(result["GridType"]) > 0:
                gridtype = []
                for i in result["GridType"]:
                    gridtype.append([str(i)])
            else:
                gridtype = [["Nothing to display"]]
            callback["gridtype"] = gridtype

            if "OwnerGroup" in result and len(result["OwnerGroup"]) > 0:
                ownerGroup = []
                for i in result["OwnerGroup"]:
                    ownerGroup.append([str(i)])
            else:
                ownerGroup = [["Nothing to display"]]
            callback["ownerGroup"] = ownerGroup

            if "DestinationSite" in result and len(result["DestinationSite"]) > 0:
                ce = []
                for i in result["DestinationSite"]:
                    ce.append([str(i)])
            else:
                ce = [["Nothing to display"]]
            callback["computingElement"] = ce

            if "GridSite" in result and len(result["GridSite"]) > 0:
                tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
                site = []
                s = list(result["GridSite"])
                for i in tier1:
                    site.append([str(i)])
                for i in s:
                    if i not in tier1:
                        site.append([str(i)])
            else:
                site = [["Error during RPC call"]]
            callback["site"] = site
            if "Broker" in result and len(result["Broker"]) > 0:
                broker = []
                for i in result["Broker"]:
                    broker.append([str(i)])
            else:
                broker = [["Nothing to display"]]
            callback["broker"] = broker
            if "Owner" in result and len(result["Owner"]) > 0:
                owner = []
                for i in result["Owner"]:
                    owner.append([str(i)])
            else:
                owner = [["Nothing to display"]]
            callback["owner"] = owner

        return callback

    def __request(self):
        self.numberOfJobs = int(self.get_argument("limit", "25"))
        self.pageNumber = int(self.get_argument("start", "0"))
        self.globalSort = [["SubmissionTime", "DESC"]]
        req = {}

        site = list(json.loads(self.get_argument("site", "[]")))
        if site:
            req["GridSite"] = site

        taskQueueId = list(json.loads(self.get_argument("taskQueueId", "[]")))
        if taskQueueId:
            req["TaskQueueID"] = taskQueueId

        pilotId = list(json.loads(self.get_argument("pilotId", "[]")))
        if pilotId:
            req["PilotJobReference"] = pilotId

        broker = list(json.loads(self.get_argument("broker", "[]")))
        if broker:
            req["broker"] = broker

        status = list(json.loads(self.get_argument("status", "[]")))
        if status:
            req["Status"] = status

        ce = list(json.loads(self.get_argument("computingElement", "[]")))
        if ce:
            req["DestinationSite"] = ce

        owner = list(json.loads(self.get_argument("owner", "[]")))
        if owner:
            req["Owner"] = owner

        ownerGroup = list(json.loads(self.get_argument("ownerGroup", "[]")))
        if ownerGroup:
            req["OwnerGroup"] = ownerGroup

        sort = json.loads(self.get_argument("sort", "[]"))
        if len(sort) > 0:
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

    def web_getJobInfoData(self, data):
        RPC = PilotManagerClient()
        if self.get_argument("data_kind") == "getPilotOutput":
            if (result := RPC.getPilotOutput(data))["OK"]:
                return {"success": "true", "result": result["Value"]["StdOut"]}
            return {"success": "false", "error": result["Message"]}
        if self.get_argument("data_kind") == "getPilotError":
            if (result := RPC.getPilotOutput(data))["OK"]:
                if len(result["Value"]["StdErr"]) > 0:
                    return {"success": "true", "result": result["Value"]["StdErr"]}
                return {"success": "false", "error": "Pilot Error is empty"}
            return {"success": "false", "error": result["Message"]}
        if self.get_argument("data_kind") == "getLoggingInfo":
            if (result := RPC.getPilotLoggingInfo(data))["OK"]:
                return {"success": "true", "result": result["Value"]}
            return {"success": "false", "error": result["Message"]}
        return {}

    def web_getStatisticsData(self, statsField):
        req = self.__request()

        paletteColor = Palette()

        RPC = PilotManagerClient()

        if statsField == "Site":
            selector = "GridSite"
        elif statsField == "Computing Element":
            selector = "DestinationSite"
        elif statsField == "Owner Group":
            selector = "OwnerGroup"
        elif statsField == "Owner":
            selector = "OwnerDN"
        else:
            selector = statsField

        if not (result := RPC.getPilotStatistics(selector, req))["OK"]:
            if "FromDate" in req:
                del req["FromDate"]

            if "LastUpdate" in req:
                del req["LastUpdate"]

            if "ToDate" in req:
                del req["ToDate"]

            statistics = {}
            if (result := RPC.getCounters("PilotAgents", [selector], req))["OK"]:
                for status, count in result["Value"]:
                    if "OwnerDN" in status:
                        if (userName := getUsernameForDN(status["OwnerDN"]))["OK"]:
                            status["OwnerDN"] = userName["Value"]
                    statistics[status[selector]] = count

            result = S_OK(statistics)

        if result["OK"]:
            callback = []
            result = dict(result["Value"])
            keylist = sorted(result)
            if selector == "Site":
                tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
                if len(tier1) > 0:
                    tier1.sort()
                    for i in tier1:
                        if i in result:
                            countryCode = i.rsplit(".", 1)[1]
                            callback.append(
                                {
                                    "key": i,
                                    "value": result[i],
                                    "code": countryCode,
                                    "color": paletteColor.getColor(countryCode),
                                }
                            )
            for key in keylist:
                if selector == "Site" and tier1:
                    if key not in tier1:
                        try:
                            countryCode = key.rsplit(".", 1)[1]
                        except BaseException:
                            countryCode = "Unknown"
                        callback.append(
                            {"key": key, "value": result[key], "code": countryCode, "color": paletteColor.getColor(key)}
                        )
                elif selector == "Site" and not tier1:
                    try:
                        countryCode = key.rsplit(".", 1)[1]
                    except BaseException:
                        countryCode = "Unknown"
                    callback.append(
                        {"key": key, "value": result[key], "code": countryCode, "color": paletteColor.getColor(key)}
                    )
                else:
                    callback.append({"key": key, "value": result[key], "code": "", "color": paletteColor.getColor(key)})
            return {"success": "true", "result": callback}
        return {"success": "false", "error": result["Message"]}
