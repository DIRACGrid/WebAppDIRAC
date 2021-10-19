import json

from DIRAC import gConfig, S_OK, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Utilities.Graphs.Palette import Palette
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getUsernameForDN
from DIRAC.WorkloadManagementSystem.Client.PilotManagerClient import PilotManagerClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class PilotMonitorHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getPilotData(self):
        req = self.__request()

        result = yield self.threadTask(
            PilotManagerClient().getPilotMonitorWeb, req, self.globalSort, self.pageNumber, self.numberOfJobs
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
                if j == 12:
                    if i[j] == 0:
                        i[j] = "-"
                tmp[head[j]] = i[j]
            callback.append(tmp)
        total = result["TotalRecords"]
        timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
        if "Extras" in result:
            extra = result["Extras"]
            callback = {"success": "true", "result": callback, "total": total, "extra": extra, "date": timestamp}
        else:
            callback = {"success": "true", "result": callback, "total": total, "date": timestamp}

        self.finish(callback)

    @asyncGen
    def web_getSelectionData(self):
        callback = {}

        if len(self.request.arguments) > 0:
            tmp = {self.get_argument(i).replace('"', "") for i in self.request.arguments}
            callback["extra"] = list(tmp)

        result = yield self.threadTask(PilotManagerClient().getPilotMonitorSelectors)

        if result["OK"]:
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

        self.finish(callback)

    ################################################################################
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

    @asyncGen
    def web_getJobInfoData(self):
        callback = {}
        data = self.get_argument("data")

        RPC = PilotManagerClient()
        if self.get_argument("data_kind") == "getPilotOutput":
            result = yield self.threadTask(RPC.getPilotOutput, data)
            if result["OK"]:
                callback = {"success": "true", "result": result["Value"]["StdOut"]}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getPilotError":
            result = yield self.threadTask(RPC.getPilotOutput, data)
            if result["OK"]:
                if len(result["Value"]["StdErr"]) > 0:
                    callback = {"success": "true", "result": result["Value"]["StdErr"]}
                else:
                    callback = {"success": "false", "error": "Pilot Error is empty"}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getLoggingInfo":
            result = yield self.threadTask(RPC.getPilotLoggingInfo, data)
            if result["OK"]:
                callback = {"success": "true", "result": result["Value"]}
            else:
                callback = {"success": "false", "error": result["Message"]}

        self.finish(callback)

    @asyncGen
    def web_getStatisticsData(self):
        req = self.__request()

        paletteColor = Palette()

        RPC = PilotManagerClient()

        selector = self.get_argument("statsField")

        if selector == "Site":
            selector = "GridSite"
        if selector == "Computing Element":
            selector = "DestinationSite"
        if selector == "Owner Group":
            selector = "OwnerGroup"
        if selector == "Owner":
            selector = "OwnerDN"

        result = yield self.threadTask(RPC.getPilotStatistics, selector, req)
        if not result["OK"]:
            if "FromDate" in req:
                del req["FromDate"]

            if "LastUpdate" in req:
                del req["LastUpdate"]

            if "ToDate" in req:
                del req["ToDate"]

            result = yield self.threadTask(RPC.getCounters, "PilotAgents", [selector], req)

            statistics = {}
            if result["OK"]:
                for status, count in result["Value"]:
                    if "OwnerDN" in status:
                        userName = getUsernameForDN(status["OwnerDN"])
                        if userName["OK"]:
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
            callback = {"success": "true", "result": callback}
        else:
            callback = {"success": "false", "error": result["Message"]}

        self.finish(callback)
