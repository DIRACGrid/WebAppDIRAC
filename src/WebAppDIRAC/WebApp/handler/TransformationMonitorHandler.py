""" Handler for TransformationMonitor page
"""

import json
import datetime

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import TimeUtilities
from DIRAC.TransformationSystem.Client.TransformationClient import TransformationClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr


class TransformationMonitorHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def web_getSelectionData(self):
        if self.getUserName().lower() == "anonymous":
            return {"prod": [["Insufficient rights"]]}

        tsClient = TransformationClient()
        if (result := tsClient.getDistinctAttributeValues("Plugin", {}))["OK"]:
            plugin = []
            if len(result["Value"]) > 0:
                for i in result["Value"]:
                    plugin.append([str(i)])
            else:
                plugin.append("Nothing to display")
        else:
            plugin = "Error during RPC call"
        callback = {"plugin": plugin}

        if (result := tsClient.getDistinctAttributeValues("Status", {}))["OK"]:
            status = []
            if len(result["Value"]) > 0:
                for i in result["Value"]:
                    status.append([str(i)])
            else:
                status = "Nothing to display"
        else:
            status = "Error during RPC call"
        callback["prodStatus"] = status

        if (result := tsClient.getDistinctAttributeValues("TransformationGroup", {}))["OK"]:
            group = []
            if len(result["Value"]) > 0:
                for i in result["Value"]:
                    group.append([str(i)])
            else:
                group = "Nothing to display"
        else:
            group = "Error during RPC call"
        callback["transformationGroup"] = group

        if (result := tsClient.getDistinctAttributeValues("AgentType", {}))["OK"]:
            atype = []
            if len(result["Value"]) > 0:
                for i in result["Value"]:
                    atype.append([str(i)])
            else:
                atype = "Nothing to display"
        else:
            atype = "Error during RPC call"
        callback["agentType"] = atype

        if (result := tsClient.getDistinctAttributeValues("Type", {}))["OK"]:
            transType = []
            if result["Value"]:
                for i in result["Value"]:
                    transType.append([str(i)])
            else:
                transType = "Nothing to display"
        else:
            transType = "Error during RPC call"
        callback["productionType"] = transType
        return callback

    def web_getTransformationData(
        self,
        sort=None,
        date=None,
        endDate=None,
        endTime=None,
        startDate=None,
        startTime=None,
        start=0,
        limit=25,
        type="[]",
        status="[]",
        plugin="[]",
        requestId="[]",
        agentType="[]",
        transformationId="[]",
        transformationGroup="[]",
        TransformationFamily=None,
    ):
        pagestart = datetime.datetime.utcnow()

        if self.getUserName().lower() == "anonymous":
            return {"success": "false", "error": "You are not authorised"}

        params = self._prepareSearchParameters(
            sort,
            date,
            status,
            plugin,
            endDate,
            endTime,
            requestId,
            agentType,
            type,
            startDate,
            startTime,
            transformationId,
            transformationGroup,
            TransformationFamily,
        )

        tsClient = TransformationClient(timeout=3600)
        if not (result := tsClient.getTransformationSummaryWeb(params, self.globalSort, start, limit))["OK"]:
            return {"success": "false", "error": result["Message"]}

        data = result["Value"]

        if "TotalRecords" not in data:
            return {"success": "false", "result": "", "error": "Data structure is corrupted"}

        if (total := data["TotalRecords"]) < 1:
            return {"success": "false", "result": "", "error": "There were no data matching your selection"}

        if "ParameterNames" not in data and "Records" not in data:
            return {"success": "false", "result": "", "error": "Data structure is corrupted"}

        if (headLength := len(head := data["ParameterNames"])) < 1:
            return {"success": "false", "result": "", "error": "ParameterNames field is missing"}

        if len(jobs := data["Records"]) < 1:
            return {"success": "false", "Message": "There are no data to display"}

        callback = []
        for i in jobs:
            tmp = {head[j]: i[j] for j in range(headLength)}
            callback.append(tmp)
        if "Extras" in data:
            gLogger.info(extra := data["Extras"])
            timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
            callback = {"success": "true", "result": callback, "total": total, "extra": extra, "date": timestamp}
        else:
            callback = {"success": "true", "result": callback, "total": total, "date": None}

        gLogger.info("\033[0;31m PRODUCTION SUBMIT REQUEST: \033[0m %s" % (datetime.datetime.utcnow() - pagestart))
        return callback

    def web_action(self, data_kind, id: int, tasks: int = None):
        if data_kind == "getLoggingInfo":
            return self.__getLoggingInfo(id)
        if data_kind == "fileStatus":
            return self.__transformationFileStatus(id)
        if data_kind == "fileProcessed":
            return self.__fileRetry(id, "proc")
        if data_kind == "fileNotProcessed":
            return self.__fileRetry(id, "not")
        if data_kind == "fileAllProcessed":
            return self.__fileRetry(id, "all")
        if data_kind == "dataQuery":
            return self.__dataQuery(id)
        if data_kind == "additionalParams":
            return self.__additionalParams(id)
        if data_kind == "transformationDetail":
            return self.__transformationDetail(id)
        if data_kind == "extend":
            return self.__extendTransformation(id, tasks)
        if data_kind == "workflowxml":
            return self.__workflowxml(id)
        return {"success": "false", "error": "Action is unknown!!!"}

    def web_executeOperation(self, action, ids):
        tsClient = TransformationClient()

        agentType = "Manual"
        if action == "clean":
            status = "Cleaning"
        elif action == "start":
            status = "Active"
            agentType = "Automatic"
        elif action == "flush":
            status = "Flush"
            agentType = "Automatic"
        elif action == "stop":
            status = "Stopped"
        elif action == "complete":
            status = "Completed"
        else:
            return {"success": "false", "error": "Unknown action"}

        callback = []

        for i in ids.split(","):
            try:
                result = tsClient.setTransformationParameter(transid := int(i), "Status", status)
                if result["OK"]:
                    resString = f"ProdID: {transid} set to {action} successfully"
                    result = tsClient.setTransformationParameter(transid, "AgentType", agentType)
                    if not result["OK"]:
                        resString = f"ProdID: {transid} failed to set to {action}: {result['Message']}"
                else:
                    resString = f"ProdID: {transid} failed due the reason: {result['Message']}"
            except Exception:
                resString = f"Unable to convert given ID {transid} to transformation ID"
            callback.append(resString)
        gLogger.info(action, ids)
        return {"success": "true", "showResult": callback}

    def __fileRetry(self, prodid, mode):
        tsClient = TransformationClient()
        if mode == "proc":
            result = tsClient.getTransformationFilesCount(prodid, "ErrorCount", {"Status": "Processed"})
        elif mode == "not":
            result = tsClient.getTransformationFilesCount(
                prodid, "ErrorCount", {"Status": ["Unused", "Assigned", "Failed"]}
            )
        elif mode == "all":
            result = tsClient.getTransformationFilesCount(prodid, "ErrorCount")

        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}

        resList = []
        if (total := result["Value"].pop("Total")) == 0:
            return {"success": "false", "error": "No files found"}
        for status in sorted(result["Value"]):
            count = result["Value"][status]
            percent = "%.1f" % ((count * 100.0) / total)
            resList.append((status, str(count), percent))
        resList.append(("Total", total, "-"))
        gLogger.debug("#######", result)
        return {"success": "true", "result": resList}

    def __dataQuery(self, prodid):
        tsClient = TransformationClient()

        # FIXME: getTransformationInputDataQuery has been replaced by getTransformationMetaQuery in DIRAC v7r0
        result = tsClient.getTransformationMetaQuery(prodid, "Input")
        if not result["OK"] and "Unknown method" in result["Message"]:
            result = tsClient.getTransformationInputDataQuery(prodid)

        gLogger.debug("-= #######", result)
        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}
        data = result["Value"]
        back = [[i, data[i]] for i in sorted(data)]
        return {"success": "true", "result": back}

    def __additionalParams(self, prodid):
        if not (result := TransformationClient().getAdditionalParameters(prodid))["OK"]:
            return {"success": "false", "error": result["Message"]}
        data = result["Value"]
        back = [[i, data[i]] for i in sorted(data)]
        return {"success": "true", "result": back}

    def __workflowxml(self, transid):
        tsClient = TransformationClient()
        if not (result := tsClient.getTransformations({"TransformationID": transid}))["OK"]:
            raise WErr.fromSERROR(result)
        return {"success": "true", "result": result["Value"][0]["Body"]}

    def __getLoggingInfo(self, transid):
        if (result := TransformationClient().getTransformationLogging(transid))["OK"]:
            if len(data := result["Value"]) > 0:
                dndb = {}
                callback = []
                if (result := gConfig.getSections("/Security/Users"))["OK"]:
                    for user in result["Value"]:
                        dndb[gConfig.getValue(f"/Security/Users/{user}/DN")] = user
                for i in data:
                    DN = i["AuthorDN"]
                    i["AuthorDN"] = dndb.get(DN, DN)
                    date = TimeUtilities.toString(i["MessageDate"])
                    callback.append([i["Message"], date, i["AuthorDN"]])
                return {"success": "true", "result": callback}
            return {"success": "false", "error": "Nothing to display"}
        return {"success": "false", "error": result["Message"]}

    def __transformationFileStatus(self, transid):
        tsClient = TransformationClient()
        if not (result := tsClient.getTransformationFilesCount(transid, "Status"))["OK"]:
            return {"success": "false", "error": result["Message"]}
        resList = []
        if (total := result["Value"].pop("Total")) == 0:
            return {"success": "false", "error": "No files found"}
        for status in sorted(result["Value"]):
            count = result["Value"][status]
            percent = "%.1f" % ((count * 100.0) / total)
            resList.append((status, str(count), percent))
        resList.append(("Total", total, "-"))
        gLogger.debug("#######", result)
        return {"success": "true", "result": resList}

    def __transformationDetail(self, prodid):
        tsClient = TransformationClient()
        if not (result := tsClient.getTransformationParameters(prodid, ["DetailedInfo"]))["OK"]:
            return {"success": "false", "error": result["Message"]}
        if callback := result["Value"]:
            return {"success": "true", "result": callback}
        gLogger.debug("#######", result)
        return {"success": "false", "error": "Production does not have parameter 'DetailedInfo'"}

    def __extendTransformation(self, transid, tasks):
        gLogger.info(f"Extend transformation ({transid}, {tasks})")
        if (result := TransformationClient().extendTransformation(transid, tasks))["OK"]:
            resString = f"{transid} extended by {tasks} successfully"
        else:
            resString = f"{transid} failed to extend: {result['Message']}"
        gLogger.debug("#######", result)
        return {"success": "true", "showResult": [resString], "result": resString}

    def web_showFileStatus(self, start: int, limit: int, transformationId, status):
        result = TransformationClient().getTransformationFilesSummaryWeb(
            {"TransformationID": transformationId, "Status": status},
            [["FileID", "ASC"]],
            start,
            limit,
        )

        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}

        data = result["Value"]
        total = len(data.get("TotalRecords", []))
        if total == 0:
            return {"success": "false", "result": "", "error": "There were no data matching your selection"}
        if not ("ParameterNames" in data and "Records" in data):
            return {"success": "false", "result": "", "error": "Data structure is corrupted"}
        head = data.get("ParameterNames", [])
        if len(head) == 0:
            return {"success": "false", "result": "", "error": "ParameterNames field is undefined"}
        if len(data["Records"]) == 0:
            return {"success": "false", "result": "", "error": "There are no data to display"}
        callback = []
        for job in data["Records"]:
            callback.append(dict(zip(head, job)))
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
        if "Extras" in data:
            return {
                "success": "true",
                "result": callback,
                "total": total,
                "extra": data["Extras"],
                "date": timestamp,
            }
        return {"success": "true", "result": callback, "total": total, "date": timestamp}

    def web_getTier1Sites(self):
        if len(tier1 := gConfig.getValue("/WebApp/PreferredSites", [])) < 1:
            return {"success": False, "errors": "No site defined in the CS!"}
        return {"success": True, "data": tier1}

    def web_setSite(self, TransformationId: int, RunNumber: int, Site):
        gLogger.info("\033[0;31m setTransformationRunsSite(%s, %s, %s) \033[0m" % (TransformationId, RunNumber, Site))
        result = TransformationClient().setTransformationRunsSite(TransformationId, RunNumber, Site)
        if result["OK"]:
            return {"success": "true", "result": "true"}
        return {"success": "false", "error": result["Message"]}

    def _prepareSearchParameters(
        self,
        sort,
        date,
        status,
        plugin,
        endDate,
        endTime,
        requestId,
        agentType,
        transtype,
        startDate,
        startTime,
        transformationId,
        transformationGroup,
        TransformationFamily,
    ):
        """Prepare a query dictionary which can be used with TransformationClient.getTransformationSummaryWeb

        Note: This method can be overridden by extensions
        """
        req = {}
        if prods := list(json.loads(transformationId)):
            req["TransformationID"] = prods
        if requests := list(json.loads(requestId)):
            req["TransformationFamily"] = requests
        if TransformationFamily:
            req["TransformationFamily"] = TransformationFamily
        if agentType := list(json.loads(agentType)):
            req["agentType"] = agentType
        if status := list(json.loads(status)):
            req["Status"] = status
        if plugin := list(json.loads(plugin)):
            req["Plugin"] = plugin
        if transtype := list(json.loads(transtype)):
            req["Type"] = transtype
        if group := list(json.loads(transformationGroup)):
            req["TransformationGroup"] = group
        if sort:
            if sort := json.loads(sort):
                self.globalSort = [["TransformationFamily", "ASC"]]
                for i in sort:
                    self.globalSort += [[i["property"], i["direction"]]]
        else:
            self.globalSort = [["TransformationID", "DESC"]]
        if startDate:
            req["FromDate"] = startDate
            if startTime:
                req["FromDate"] += " " + startTime
        if endDate:
            req["ToDate"] = endDate
            if endTime:
                req["ToDate"] += " " + endTime
        if date:
            req["LastUpdate"] = date
        gLogger.verbose("REQUEST:", req)
        return req
