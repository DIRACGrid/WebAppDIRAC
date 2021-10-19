import json

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Utilities import DictCache
from DIRAC.Core.Utilities.Graphs.Palette import Palette
from DIRAC.RequestManagementSystem.Client.Request import Request
from DIRAC.RequestManagementSystem.Client.ReqClient import ReqClient
from DIRAC.WorkloadManagementSystem.Client.JobMonitoringClient import JobMonitoringClient
from DIRAC.WorkloadManagementSystem.Client.JobManagerClient import JobManagerClient
from DIRAC.WorkloadManagementSystem.Client.PilotManagerClient import PilotManagerClient
from DIRAC.WorkloadManagementSystem.Client.WMSAdministratorClient import WMSAdministratorClient
from DIRAC.WorkloadManagementSystem.Client.SandboxStoreClient import SandboxStoreClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen, WErr


class JobMonitorHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    __dataCache = DictCache.DictCache()

    @asyncGen
    def web_getJobData(self):
        req = self._request()

        result = yield self.threadTask(
            JobMonitoringClient().getJobPageSummaryWeb, req, self.globalSort, self.pageNumber, self.numberOfJobs
        )

        if not result["OK"]:
            self.finish({"success": "false", "result": [], "total": 0, "error": result["Message"]})
            return
        result = result["Value"]

        if "TotalRecords" not in result:
            self.finish(
                {
                    "success": "false",
                    "result": [],
                    "total": -1,
                    "error": "Data structure is corrupted",
                }
            )
            return

        if not result["TotalRecords"]:
            self.finish(
                {
                    "success": "false",
                    "result": [],
                    "total": 0,
                    "error": "There were no data matching your selection",
                }
            )
            return

        if "ParameterNames" not in result or "Records" not in result:
            self.finish(
                {
                    "success": "false",
                    "result": [],
                    "total": -1,
                    "error": "Data structure is corrupted",
                }
            )
            return

        if not result["ParameterNames"]:
            self.finish(
                {
                    "success": "false",
                    "result": [],
                    "total": -1,
                    "error": "ParameterNames field is missing",
                }
            )
            return

        if not result["Records"]:
            self.finish(
                {
                    "success": "false",
                    "result": [],
                    "total": 0,
                    "Message": "There are no data to display",
                }
            )
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
        extra = None
        if "Extras" in result:
            extra = result["Extras"]
            timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
            extra["date"] = timestamp

        callback = {"success": "true", "result": callback, "total": total, "extra": extra}
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
        user = self.getUserName()
        if not self.isRegisteredUser():
            callback["prod"] = [["Insufficient rights"]]
        else:
            cacheKey = (self.getUserGroup(), self.getUserSetup())

            callback = JobMonitorHandler.__dataCache.get(cacheKey)
            if not callback:
                callback = {}
                result = yield self.threadTask(JobMonitoringClient().getJobGroups)
                if result["OK"]:
                    prod = []
                    prods = result["Value"]
                    if prods:
                        prods.sort(reverse=True)
                        prod = [[i] for i in prods]
                    else:
                        prod = [["Nothing to display"]]
                else:
                    gLogger.error("JobMonitoringClient().getJobGroups() return error: %s" % result["Message"])
                    prod = [["Error happened on service side"]]
                callback["prod"] = prod

                result = yield self.threadTask(JobMonitoringClient().getSites)
                if result["OK"]:
                    tier1 = gConfig.getValue("/WebApp/PreferredSites", [])  # Always return a list
                    site = []
                    if result["Value"]:
                        s = list(result["Value"])
                        for i in tier1:
                            site.append([str(i)])
                        for i in s:
                            if i not in tier1:
                                site.append([str(i)])
                    else:
                        site = [["Nothing to display"]]
                else:
                    gLogger.error("JobMonitoringClient().getSites() return error: %s" % result["Message"])
                    site = [["Error happened on service side"]]
                callback["site"] = site
                # ##
                result = yield self.threadTask(JobMonitoringClient().getStates)
                if result["OK"]:
                    stat = []
                    if result["Value"]:
                        for i in result["Value"]:
                            stat.append([str(i)])
                    else:
                        stat = [["Nothing to display"]]
                else:
                    gLogger.error("JobMonitoringClient().getStates() return error: %s" % result["Message"])
                    stat = [["Error happened on service side"]]
                callback["status"] = stat
                # ##
                result = yield self.threadTask(JobMonitoringClient().getMinorStates)
                if result["OK"]:
                    stat = []
                    if result["Value"]:
                        for i in result["Value"]:
                            stat.append([i])
                    else:
                        stat = [["Nothing to display"]]
                else:
                    gLogger.error("JobMonitoringClient().getMinorStates() return error: %s" % result["Message"])
                    stat = [["Error happened on service side"]]
                callback["minorstat"] = stat
                # ##
                result = yield self.threadTask(JobMonitoringClient().getApplicationStates)
                if result["OK"]:
                    app = []
                    if result["Value"]:
                        for i in result["Value"]:
                            app.append([i])
                    else:
                        app = [["Nothing to display"]]
                else:
                    gLogger.error("JobMonitoringClient().getApplicationstates() return error: %s" % result["Message"])
                    app = [["Error happened on service side"]]
                callback["app"] = app
                # ##
                result = yield self.threadTask(JobMonitoringClient().getJobTypes)
                if result["OK"]:
                    types = []
                    if result["Value"]:
                        for i in result["Value"]:
                            types.append([i])
                    else:
                        types = [["Nothing to display"]]
                else:
                    gLogger.error("JobMonitoringClient().getJobTypes() return error: %s" % result["Message"])
                    types = [["Error happened on service side"]]
                callback["types"] = types
                # ##
                # groupProperty = credentials.getProperties(group)
                if not self.isRegisteredUser():
                    callback["owner"] = [["Insufficient rights"]]
                else:
                    result = yield self.threadTask(JobMonitoringClient().getOwners)
                    if result["OK"]:
                        owner = []
                        if result["Value"]:
                            for i in result["Value"]:
                                owner.append([str(i)])
                        else:
                            owner = [["Nothing to display"]]
                    elif "NormalUser" in self.getProperties():
                        owner = [[user]]
                        callback["owner"] = owner
                    else:
                        gLogger.error("JobMonitoringClient().getOwners() return error: %s" % result["Message"])
                        owner = [["Error happened on service side"]]
                    callback["owner"] = owner

                result = yield self.threadTask(JobMonitoringClient().getOwnerGroup)
                if result["OK"]:
                    callback["OwnerGroup"] = [[group] for group in result["Value"]]

                JobMonitorHandler.__dataCache.add(cacheKey, 360, callback)

        self.finish(callback)

    def _request(self):
        self.numberOfJobs = int(self.get_argument("limit", "25"))
        self.pageNumber = int(self.get_argument("start", "0"))
        self.globalSort = [["JobID", "DESC"]]
        req = {}

        jobids = list(json.loads(self.get_argument("JobID", "[]")))
        if jobids:
            req["JobID"] = jobids

        pilotids = list(json.loads(self.get_argument("PilotJobReference", "[]")))
        if pilotids:
            req["PilotJobReference"] = pilotids

        prodids = list(json.loads(self.get_argument("jobGroup", "[]")))
        if prodids:
            req["JobGroup"] = prodids

        sites = list(json.loads(self.get_argument("site", "[]")))
        if sites:
            req["Site"] = sites

        status = list(json.loads(self.get_argument("status", "[]")))
        if status:
            req["Status"] = status

        minorstat = list(json.loads(self.get_argument("minorStatus", "[]")))
        if minorstat:
            req["MinorStatus"] = minorstat

        apps = list(json.loads(self.get_argument("appStatus", "[]")))
        if apps:
            req["ApplicationStatus"] = apps

        types = list(json.loads(self.get_argument("jobType", "[]")))
        if types:
            req["JobType"] = types

        owner = list(json.loads(self.get_argument("owner", "[]")))
        if owner:
            req["Owner"] = owner

        ownerGroup = list(json.loads(self.get_argument("OwnerGroup", "[]")))
        if ownerGroup:
            req["OwnerGroup"] = ownerGroup

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

        sort = json.loads(self.get_argument("sort", "[]"))
        if sort:
            self.globalSort = []
            for i in sort:
                if "LastSignOfLife" not in i["property"]:
                    self.globalSort += [[str(i["property"]), str(i["direction"])]]

        gLogger.debug("Request", str(req))
        return req

    @asyncGen
    def web_jobAction(self):
        ids = self.get_argument("JobID").split(",")
        ids = [int(i) for i in ids]

        RPC = JobManagerClient()
        if self.get_argument("action") == "delete":
            result = yield self.threadTask(RPC.deleteJob, ids)
        elif self.get_argument("action") == "kill":
            result = yield self.threadTask(RPC.killJob, ids)
        elif self.get_argument("action") == "reschedule":
            result = yield self.threadTask(RPC.rescheduleJob, ids)
        elif self.get_argument("action") == "reset":
            result = yield self.threadTask(RPC.resetJob, ids)

        callback = {}
        if result["OK"]:
            callback = {"success": "true", "result": ""}
        else:
            if "InvalidJobIDs" in result:
                callback = {"success": "false", "error": "Invalid JobIDs: %s" % result["InvalidJobIDs"]}
            elif "NonauthorizedJobIDs" in result:
                callback = {
                    "success": "false",
                    "error": "You are nonauthorized to %s jobs with JobID: %s"
                    % (self.get_argument("action"), result["NonauthorizedJobIDs"]),
                }
            else:
                callback = {"success": "false", "error": result["Message"]}
        self.finish(callback)

    @asyncGen
    def web_jobData(self):
        jobId = int(self.get_argument("id"))
        callback = {}

        if self.get_argument("data_kind") == "getJDL":
            RPC = JobMonitoringClient()
            result = yield self.threadTask(RPC.getJobJDL, jobId, False)
            if result["OK"]:
                callback = {"success": "true", "result": result["Value"]}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getBasicInfo":
            RPC = JobMonitoringClient()
            result = yield self.threadTask(RPC.getJobSummary, jobId)
            if result["OK"]:
                items = []
                for key, value in result["Value"].items():
                    items.append([key, value])
                callback = {"success": "true", "result": items}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getParams":
            RPC = JobMonitoringClient()
            result = yield self.threadTask(RPC.getJobParameters, jobId)
            if result["OK"]:
                attr = result["Value"].get(jobId, {})
                items = []
                for i in attr.items():
                    if i[0] == "Log URL":  # the link has to be opened in a new tab.
                        items.append([i[0], i[1].replace(">", ' target="_blank">')])
                    elif i[0] != "StandardOutput":
                        items.append([i[0], i[1]])

                callback = {"success": "true", "result": items}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getLoggingInfo":
            RPC = JobMonitoringClient()
            result = yield self.threadTask(RPC.getJobLoggingInfo, jobId)
            if result["OK"]:
                callback = {"success": "true", "result": result["Value"]}
            else:
                callback = {"success": "false", "error": result["Message"]}

        elif self.get_argument("data_kind") == "getStandardOutput":
            RPC = JobMonitoringClient()
            result = yield self.threadTask(RPC.getJobParameters, jobId)
            attr = result["Value"].get(jobId, {})
            if result["OK"]:
                if "StandardOutput" in attr:
                    callback = {"success": "true", "result": attr["StandardOutput"]}
                else:
                    callback = {"success": "false", "error": "Not accessible yet"}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getPending":

            result = yield self.threadTask(ReqClient().readRequestsForJobs, [jobId])

            if result["OK"]:
                items = {}
                if jobId in result["Value"]["Successful"]:
                    result = result["Value"]["Successful"][jobId].getDigest()
                    if result["OK"]:
                        items["PendingRequest"] = result["Value"]
                    else:
                        raise WErr.fromSERROR(result)
                    callback = {"success": "true", "result": items}
                elif jobId in result["Value"]["Failed"]:  # when no request associated to the job
                    callback = {"success": "false", "error": result["Value"]["Failed"][jobId]}
                else:
                    callback = {"success": "false", "error": "No request found with unknown reason"}
            else:
                callback = {"success": "false", "error": result["Message"]}

        elif self.get_argument("data_kind") == "getLogURL":
            RPC = JobMonitoringClient()
            result = yield self.threadTask(RPC.getJobParameters, jobId)
            if result["OK"]:
                attr = result["Value"].get(jobId, {})
                if "Log URL" in attr:
                    url = attr["Log URL"].split('"')
                    if "https:" not in url[1]:
                        # we can not open non secured URL
                        httpsUrl = url[1].replace("http", "https")
                    else:
                        httpsUrl = url[1]
                    callback = {"success": "true", "result": httpsUrl}
                else:
                    callback = {"success": "false", "error": "No URL found"}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getStagerReport":
            RPC = JobMonitoringClient()
            result = yield self.threadTask(RPC.getJobParameters, jobId)
            if result["OK"]:
                attr = result["Value"].get(jobId, {})
                if "StagerReport" in attr:
                    callback = {"success": "true", "result": attr["StagerReport"]}
                else:
                    callback = {"success": "false", "error": "StagerReport not available"}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getPilotStdOut":
            result = yield self.threadTask(WMSAdministratorClient().getJobPilotOutput, jobId)
            if result["OK"]:
                if "StdOut" in result["Value"]:
                    callback = {"success": "true", "result": result["Value"]["StdOut"]}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getPilotStdErr":
            result = yield self.threadTask(WMSAdministratorClient().getJobPilotOutput, jobId)
            if result["OK"]:
                if "StdErr" in result["Value"]:
                    callback = {"success": "true", "result": result["Value"]["StdErr"]}
            else:
                callback = {"success": "false", "error": result["Message"]}
        elif self.get_argument("data_kind") == "getPilotLoggingInfo":
            retVal = yield self.threadTask(PilotManagerClient().getPilots, int(jobId))
            if retVal["OK"]:
                pilotReference = list(retVal["Value"])[0]
                retVal = yield self.threadTask(PilotManagerClient().getPilotLoggingInfo, pilotReference)
                if retVal["OK"]:
                    callback = {"success": "true", "result": retVal["Value"]}
                else:
                    callback = {"success": "false", "error": retVal["Message"]}
            else:
                callback = {"success": "false", "error": retVal["Message"]}
        self.finish(callback)

    @asyncGen
    def web_getStatisticsData(self):
        req = self._request()

        paletteColor = Palette()

        RPC = JobMonitoringClient()

        selector = self.get_argument("statsField")

        if selector == "Minor Status":
            selector = "MinorStatus"
        elif selector == "Application Status":
            selector = "ApplicationStatus"
        elif selector == "Job Group":
            selector = "JobGroup"
        elif selector == "Owner Group":
            selector = "OwnerGroup"
        elif selector == "Job Type":
            selector = "JobType"

        result = yield self.threadTask(RPC.getJobStats, selector, req)

        if result["OK"]:
            callback = []
            result = dict(result["Value"])
            keylist = sorted(result)
            if selector == "Site":
                tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
                if tier1:
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

    @asyncGen
    def web_getSandbox(self):
        if "jobID" not in self.request.arguments:
            self.finish({"success": "false", "error": "Maybe you forgot the jobID ?"})
            return
        jobID = int(self.get_argument("jobID"))
        sbType = "Output"
        if "sandbox" in self.request.arguments:
            sbType = self.get_argument("sandbox")

        client = SandboxStoreClient(
            useCertificates=True,
            delegatedDN=self.getUserDN(),
            delegatedGroup=self.getUserGroup(),
            setup=self.getUserSetup(),
        )

        result = yield self.threadTask(client.downloadSandboxForJob, jobID, sbType, inMemory=True)

        if not result["OK"]:
            self.finish({"success": "false", "error": "Error: %s" % result["Message"]})
            return

        if "check" in self.request.arguments:
            self.finish({"success": "true"})
            return

        data = result["Value"]
        fname = "%s_%sSandbox.tar" % (str(jobID), sbType)
        self.set_header("Content-type", "application/x-tar")
        self.set_header("Content-Disposition", 'attachment; filename="%s"' % fname)
        self.set_header("Content-Length", len(data))
        self.set_header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
        self.set_header("Pragma", "no-cache")
        self.finish(data)
