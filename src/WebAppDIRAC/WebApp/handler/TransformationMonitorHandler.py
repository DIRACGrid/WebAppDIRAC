""" Handler for TransformationMonitor page
"""

import json

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.TransformationSystem.Client.TransformationClient import TransformationClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, asyncGen


class TransformationMonitorHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    def index(self):
        pass

    @asyncGen
    def web_getSelectionData(self):
        callback = {}
        group = self.getUserGroup()
        user = self.getUserName()
        if user == "Anonymous":
            callback["prod"] = [["Insufficient rights"]]
        else:
            callback = {}

            ####
            tsClient = TransformationClient()
            result = yield self.threadTask(tsClient.getDistinctAttributeValues, "Plugin", {})

            if result["OK"]:
                plugin = []
                if len(result["Value"]) > 0:
                    for i in result["Value"]:
                        plugin.append([str(i)])
                else:
                    plugin.append("Nothing to display")
            else:
                plugin = "Error during RPC call"
            callback["plugin"] = plugin
            ####
            result = yield self.threadTask(tsClient.getDistinctAttributeValues, "Status", {})
            if result["OK"]:
                status = []
                if len(result["Value"]) > 0:
                    for i in result["Value"]:
                        status.append([str(i)])
                else:
                    status = "Nothing to display"
            else:
                status = "Error during RPC call"
            callback["prodStatus"] = status
            ####
            result = yield self.threadTask(tsClient.getDistinctAttributeValues, "TransformationGroup", {})
            if result["OK"]:
                group = []
                if len(result["Value"]) > 0:
                    for i in result["Value"]:
                        group.append([str(i)])
                else:
                    group = "Nothing to display"
            else:
                group = "Error during RPC call"
            callback["transformationGroup"] = group
            ####
            result = yield self.threadTask(tsClient.getDistinctAttributeValues, "AgentType", {})
            if result["OK"]:
                atype = []
                if len(result["Value"]) > 0:
                    for i in result["Value"]:
                        atype.append([str(i)])
                else:
                    atype = "Nothing to display"
            else:
                atype = "Error during RPC call"
            callback["agentType"] = atype
            ####
            result = yield self.threadTask(tsClient.getDistinctAttributeValues, "Type", {})
            if result["OK"]:
                transType = []
                if result["Value"]:
                    for i in result["Value"]:
                        transType.append([str(i)])
                else:
                    transType = "Nothing to display"
            else:
                transType = "Error during RPC call"
            callback["productionType"] = transType
        self.finish(callback)

    @asyncGen
    def web_getTransformationData(self):
        pagestart = Time.time()
        user = self.getUserName()

        tsClient = TransformationClient(timeout=3600)

        if user == "Anonymous":
            callback = {"success": "false", "error": "You are not authorised"}
        else:
            result = self._request()

            result = yield self.threadTask(
                tsClient.getTransformationSummaryWeb, result, self.globalSort, self.pageNumber, self.numberOfJobs
            )
            if not result["OK"]:
                self.finish(json.dumps({"success": "false", "error": result["Message"]}))
                return

            result = result["Value"]

            if "TotalRecords" not in result:
                self.finish(json.dumps({"success": "false", "result": "", "error": "Data structure is corrupted"}))
                return

            if result["TotalRecords"] < 1:
                self.finish(
                    json.dumps(
                        {"success": "false", "result": "", "error": "There were no data matching your selection"}
                    )
                )
                return

            if "ParameterNames" not in result and "Records" not in result:
                self.finish(json.dumps({"success": "false", "result": "", "error": "Data structure is corrupted"}))
                return

            if len(result["ParameterNames"]) < 1:
                self.finish(json.dumps({"success": "false", "result": "", "error": "ParameterNames field is missing"}))
                return

            if len(result["Records"]) < 1:
                self.finish(json.dumps({"success": "false", "Message": "There are no data to display"}))
                return

            callback = []
            jobs = result["Records"]
            head = result["ParameterNames"]
            headLength = len(head)
            for i in jobs:
                tmp = {head[j]: i[j] for j in range(headLength)}
                callback.append(tmp)
            total = result["TotalRecords"]
            if "Extras" in result:
                gLogger.info(result["Extras"])
                extra = result["Extras"]
                timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
                callback = {"success": "true", "result": callback, "total": total, "extra": extra, "date": timestamp}
            else:
                callback = {"success": "true", "result": callback, "total": total, "date": None}

            gLogger.info("\033[0;31m PRODUCTION SUBMIT REQUEST: \033[0m %s" % (Time.time() - pagestart))
        self.finish(json.dumps(callback))

    ################################################################################
    @asyncGen
    def web_action(self):
        transid = int(self.get_argument("id"))
        if self.get_argument("data_kind") == "getLoggingInfo":
            callback = yield self.threadTask(self.__getLoggingInfo, transid)
        elif self.get_argument("data_kind") == "fileStatus":
            callback = yield self.threadTask(self.__transformationFileStatus, transid)
        elif self.get_argument("data_kind") == "fileProcessed":
            callback = yield self.threadTask(self.__fileRetry, transid, "proc")
        elif self.get_argument("data_kind") == "fileNotProcessed":
            callback = yield self.threadTask(self.__fileRetry, transid, "not")
        elif self.get_argument("data_kind") == "fileAllProcessed":
            callback = yield self.threadTask(self.__fileRetry, transid, "all")
        elif self.get_argument("data_kind") == "dataQuery":
            callback = yield self.threadTask(self.__dataQuery, transid)
        elif self.get_argument("data_kind") == "additionalParams":
            callback = yield self.threadTask(self.__additionalParams, transid)
        elif self.get_argument("data_kind") == "transformationDetail":
            callback = yield self.threadTask(self.__transformationDetail, transid)
        elif self.get_argument("data_kind") == "extend":
            callback = yield self.threadTask(self.__extendTransformation, transid)
        elif self.get_argument("data_kind") == "workflowxml":
            callback = yield self.threadTask(self.__workflowxml, transid)
        else:
            callback = {"success": "false", "error": "Action is unknown!!!"}
        self.finish(callback)

    ################################################################################
    @asyncGen
    def web_executeOperation(self):
        cmd = self.get_argument("action")
        ids = self.get_argument("ids").split(",")
        ids = [int(i) for i in ids]

        tsClient = TransformationClient()

        agentType = "Manual"
        if cmd == "clean":
            status = "Cleaning"
        elif cmd == "start":
            status = "Active"
            agentType = "Automatic"
        elif cmd == "flush":
            status = "Flush"
            agentType = "Automatic"
        elif cmd == "stop":
            status = "Stopped"
        elif cmd == "complete":
            status = "Completed"
        else:
            self.finish({"success": "false", "error": "Unknown action"})

        callback = []

        for i in ids:
            try:
                transid = int(i)

                result = yield self.threadTask(tsClient.setTransformationParameter, transid, "Status", status)

                if result["OK"]:
                    resString = "ProdID: %s set to %s successfully" % (i, cmd)
                    result = yield self.threadTask(tsClient.setTransformationParameter, transid, "AgentType", agentType)
                    if not result["OK"]:
                        resString = "ProdID: %s failed to set to %s: %s" % (i, cmd, result["Message"])
                else:
                    resString = "ProdID: %s failed due the reason: %s" % (i, result["Message"])
            except Exception:
                resString = "Unable to convert given ID %s to transformation ID" % i
            callback.append(resString)
        callback = {"success": "true", "showResult": callback}
        gLogger.info(cmd, ids)
        self.finish(callback)

    ################################################################################
    def __fileRetry(self, prodid, mode):
        tsClient = TransformationClient()
        if mode == "proc":
            res = tsClient.getTransformationFilesCount(prodid, "ErrorCount", {"Status": "Processed"})
        elif mode == "not":
            res = tsClient.getTransformationFilesCount(
                prodid, "ErrorCount", {"Status": ["Unused", "Assigned", "Failed"]}
            )
        elif mode == "all":
            res = tsClient.getTransformationFilesCount(prodid, "ErrorCount")

        if not res["OK"]:
            return {"success": "false", "error": res["Message"]}
        resList = []
        total = res["Value"].pop("Total")
        if total == 0:
            return {"success": "false", "error": "No files found"}
        for status in sorted(res["Value"]):
            count = res["Value"][status]
            percent = "%.1f" % ((count * 100.0) / total)
            resList.append((status, str(count), percent))
        resList.append(("Total", total, "-"))
        gLogger.debug("#######", res)
        return {"success": "true", "result": resList}

    ################################################################################
    def __dataQuery(self, prodid):
        callback = {}
        tsClient = TransformationClient()

        # FIXME: getTransformationInputDataQuery has been replaced by getTransformationMetaQuery in DIRAC v7r0
        res = tsClient.getTransformationMetaQuery(prodid, "Input")
        if not res["OK"] and "Unknown method" in res["Message"]:
            res = tsClient.getTransformationInputDataQuery(prodid)

        gLogger.debug("-= #######", res)
        if not res["OK"]:
            return {"success": "false", "error": res["Message"]}
        result = res["Value"]
        back = [[i, result[i]] for i in sorted(result)]
        return {"success": "true", "result": back}

    ################################################################################
    def __additionalParams(self, prodid):
        callback = {}
        tsClient = TransformationClient()

        res = tsClient.getAdditionalParameters(prodid)
        if not res["OK"]:
            return {"success": "false", "error": res["Message"]}
        result = res["Value"]
        back = [[i, result[i]] for i in sorted(result)]
        return {"success": "true", "result": back}

    ################################################################################
    def __workflowxml(self, transid):

        tsClient = TransformationClient()
        retVal = tsClient.getTransformations({"TransformationID": transid})
        if not retVal["OK"]:
            raise WErr.fromSERROR(retVal)
        return {"success": "true", "result": retVal["Value"][0]["Body"]}

    ################################################################################
    def __getLoggingInfo(self, transid):
        tsClient = TransformationClient()
        result = tsClient.getTransformationLogging(transid)
        if result["OK"]:
            result = result["Value"]
            if len(result) > 0:
                callback = []
                resultUser = gConfig.getSections("/Security/Users")
                dndb = {}
                if resultUser["OK"]:
                    users = resultUser["Value"]
                    for j in users:
                        dndb[gConfig.getValue("/Security/Users/%s/DN" % j)] = j
                for i in result:
                    DN = i["AuthorDN"]
                    i["AuthorDN"] = dndb.get(DN, DN)
                    date = Time.toString(i["MessageDate"])
                    callback.append([i["Message"], date, i["AuthorDN"]])
                callback = {"success": "true", "result": callback}
            else:
                callback = {"success": "false", "error": "Nothing to display"}
        else:
            callback = {"success": "false", "error": result["Message"]}
        return callback

    ################################################################################
    def __transformationFileStatus(self, transid):
        tsClient = TransformationClient()
        res = tsClient.getTransformationFilesCount(transid, "Status")
        if not res["OK"]:
            return {"success": "false", "error": res["Message"]}
        resList = []
        total = res["Value"].pop("Total")
        if total == 0:
            return {"success": "false", "error": "No files found"}
        for status in sorted(res["Value"]):
            count = res["Value"][status]
            percent = "%.1f" % ((count * 100.0) / total)
            resList.append((status, str(count), percent))
        resList.append(("Total", total, "-"))
        gLogger.debug("#######", res)
        return {"success": "true", "result": resList}

    ################################################################################
    def __transformationDetail(self, prodid):
        callback = {}

        tsClient = TransformationClient()
        res = tsClient.getTransformationParameters(prodid, ["DetailedInfo"])

        if not res["OK"]:
            callback = {"success": "false", "error": res["Message"]}
        else:
            callback = res["Value"]
            if callback:
                callback = {"success": "true", "result": res["Value"]}
            else:
                callback = {"success": "false", "error": "Production does not have parameter 'DetailedInfo'"}
        gLogger.debug("#######", res)
        return callback

    ################################################################################
    def __extendTransformation(self, transid):
        tasks = int(self.get_argument("tasks"))
        gLogger.info("extend %s" % transid)
        tsClient = TransformationClient()
        gLogger.info("extendTransformation(%s,%s)" % (transid, tasks))
        res = tsClient.extendTransformation(transid, tasks)
        if res["OK"]:
            resString = "%s extended by %s successfully" % (transid, tasks)
        else:
            resString = "%s failed to extend: %s" % (transid, res["Message"])
        callback = {"success": "true", "showResult": [resString], "result": resString}
        gLogger.debug("#######", res)
        return callback

    ################################################################################
    @asyncGen
    def web_showFileStatus(self):
        callback = {}
        start = int(self.get_argument("start"))
        limit = int(self.get_argument("limit"))
        transid = self.get_argument("transformationId")
        status = self.get_argument("status")

        tsClient = TransformationClient()
        result = yield self.threadTask(
            tsClient.getTransformationFilesSummaryWeb,
            {"TransformationID": transid, "Status": status},
            [["FileID", "ASC"]],
            start,
            limit,
        )

        if not result["OK"]:
            callback = {"success": "false", "error": result["Message"]}
        else:
            result = result["Value"]
            if "TotalRecords" in result and result["TotalRecords"] > 0:
                if "ParameterNames" in result and "Records" in result:
                    if len(result["ParameterNames"]) > 0:
                        if len(result["Records"]) > 0:
                            callback = []
                            jobs = result["Records"]
                            head = result["ParameterNames"]
                            headLength = len(head)
                            for i in jobs:
                                tmp = {head[j]: i[j] for j in range(headLength)}
                                callback.append(tmp)
                            total = result["TotalRecords"]
                            timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
                            if "Extras" in result:
                                extra = result["Extras"]
                                callback = {
                                    "success": "true",
                                    "result": callback,
                                    "total": total,
                                    "extra": extra,
                                    "date": timestamp,
                                }
                            else:
                                callback = {"success": "true", "result": callback, "total": total, "date": timestamp}
                        else:
                            callback = {"success": "false", "result": "", "error": "There are no data to display"}
                    else:
                        callback = {"success": "false", "result": "", "error": "ParameterNames field is undefined"}
                else:
                    callback = {"success": "false", "result": "", "error": "Data structure is corrupted"}
            else:
                callback = {"success": "false", "result": "", "error": "There were no data matching your selection"}
        self.finish(callback)

    ################################################################################
    def web_getTier1Sites(self):
        callback = {}
        tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
        if len(tier1) < 1:
            callback = {"success": False, "errors": "No site defined in the CS!"}
        else:
            callback = {"success": True, "data": tier1}
        self.finish(json.dumps(callback))

    ################################################################################
    @asyncGen
    def web_setSite(self):
        callback = {}
        transID = int(self.get_argument("TransformationId"))
        runID = int(self.get_argument("RunNumber"))
        site = self.get_argument("Site")

        gLogger.info("\033[0;31m setTransformationRunsSite(%s, %s, %s) \033[0m" % (transID, runID, site))

        tsClient = TransformationClient()
        result = yield self.threadTask(tsClient.setTransformationRunsSite, transID, runID, site)

        if result["OK"]:
            callback = {"success": "true", "result": "true"}
        else:
            callback = {"success": "false", "error": result["Message"]}
        self.finish(callback)

    ################################################################################
    def _request(self):
        req = {}
        self.numberOfJobs = int(self.get_argument("limit", "25"))
        self.pageNumber = int(self.get_argument("start", "0"))

        prods = list(json.loads(self.get_argument("transformationId", "[]")))
        if prods:
            req["TransformationID"] = prods

        requests = list(json.loads(self.get_argument("requestId", "[]")))
        if requests:
            req["TransformationFamily"] = requests

        if "TransformationFamily" in self.request.arguments:
            req["TransformationFamily"] = self.get_argument("TransformationFamily")

        agentType = list(json.loads(self.get_argument("agentType", "[]")))
        if agentType:
            req["agentType"] = agentType

        status = list(json.loads(self.get_argument("status", "[]")))
        if status:
            req["Status"] = status

        plugin = list(json.loads(self.get_argument("plugin", "[]")))
        if plugin:
            req["Plugin"] = plugin

        transtype = list(json.loads(self.get_argument("type", "[]")))
        if transtype:
            req["Type"] = transtype

        group = list(json.loads(self.get_argument("transformationGroup", "[]")))
        if group:
            req["TransformationGroup"] = group

        if "sort" in self.request.arguments:
            sort = json.loads(self.get_argument("sort"))
            if sort:
                self.globalSort = [["TransformationFamily", "ASC"]]
                for i in sort:
                    self.globalSort += [[i["property"], i["direction"]]]
        else:
            self.globalSort = [["TransformationID", "DESC"]]

        if self.get_argument("startDate", None):
            req["FromDate"] = self.get_argument("startDate")
            if self.get_argument("startTime", None):
                req["FromDate"] += " " + self.get_argument("startTime")

        if self.get_argument("endDate", None):
            req["ToDate"] = self.get_argument("endDate")
            if self.get_argument("endTime", None):
                req["ToDate"] += " " + self.get_argument("endTime")

        if self.get_argument("date", None):
            req["LastUpdate"] = self.get_argument("date")
        gLogger.verbose("REQUEST:", req)
        return req
