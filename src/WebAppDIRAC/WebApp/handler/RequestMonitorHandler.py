import json
import datetime

from DIRAC import gLogger
from DIRAC.RequestManagementSystem.Client.ReqClient import ReqClient

from WebAppDIRAC.Lib.WebHandler import WebHandler


class RequestMonitorHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def initializeRequest(self):
        self.reqClient = ReqClient()

    def web_getRequestMonitorData(
        self,
        start=25,
        limit=0,
        sort="[]",
        id="[]",
        reqId="[]",
        status="[]",
        owner="[]",
        date="",
        startDate="",
        startTime="",
        endDate="",
        endTime="",
        operationType="[]",
        ownerGroup="[]",
    ):
        callback = {}
        req = self.__prepareParameters(
            id,
            reqId,
            status,
            owner,
            date,
            startDate,
            startTime,
            endDate,
            endTime,
            operationType,
            ownerGroup,
        )

        globalSort = [["JobID", "DESC"]]
        if sort := json.loads(sort):
            globalSort = [[i["property"], i["direction"]] for i in sort]

        if not (result := self.reqClient.getRequestSummaryWeb(req, globalSort, start, limit))["OK"]:
            return {"success": "false", "result": [], "total": 0, "error": result["Message"]}

        data = result["Value"]

        if "TotalRecords" not in data:
            return {"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"}

        if not (data["TotalRecords"] > 0):
            return {"success": "false", "result": [], "total": 0, "error": "There were no data matching your selection"}

        if not ("ParameterNames" in data and "Records" in data):
            return {"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"}

        if not (len(head := data["ParameterNames"]) > 0):
            return {"success": "false", "result": [], "total": -1, "error": "ParameterNames field is missing"}

        if not (len(jobs := data["Records"]) > 0):
            return {"success": "false", "result": [], "total": 0, "Message": "There are no data to display"}

        callback = []
        headLength = len(head)
        for job in jobs:
            tmp = {}
            for j in range(0, headLength):
                if j == 2 and job[j] == "None":
                    job[j] = "-"
                tmp[head[j]] = job[j]
            callback.append(tmp)
        total = data["TotalRecords"]
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
        if "Extras" in data:
            return {
                "success": "true",
                "result": callback,
                "total": total,
                "extra": data["Extras"],
                "request": "",
                "date": timestamp,
            }
        return {"success": "true", "result": callback, "total": total, "date": timestamp}

    def web_getSelectionData(self):
        callback = {}
        if self.getUserName() == "Anonymous":
            return {"success": "false", "result": [], "total": 0, "error": "Insufficient rights"}

        # R E Q U E S T T Y P E
        if (result := self.reqClient.getDistinctValuesWeb("Type"))["OK"]:
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
        if (result := self.reqClient.getDistinctValuesWeb("OwnerDN"))["OK"]:
            owner = []
            for dn in result["Value"]:
                owner.append([dn])
            if len(owner) < 2:
                owner = [["Nothing to display"]]
        else:
            owner = [["Error during RPC call"]]
        callback["owner"] = owner

        # G R O U P
        if (result := self.reqClient.getDistinctValuesWeb("OwnerGroup"))["OK"]:
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
        if (result := self.reqClient.getDistinctValuesWeb("Status"))["OK"]:
            status = list()
            if len(result["Value"]) > 0:
                for i in result["Value"]:
                    status.append([str(i)])
            else:
                status = [["Nothing to display"]]
        else:
            status = [["Error during RPC call"]]
        callback["status"] = status
        return callback

    def __prepareParameters(
        self,
        id,
        reqId,
        status,
        owner,
        date,
        startDate,
        startTime,
        endDate,
        endTime,
        operationType,
        ownerGroup,
    ):
        req = {}
        found = False

        if jobids := list(json.loads(id)):
            req["JobID"] = jobids
            found = True

        if (reqids := list(json.loads(reqId))) and not found:
            req["RequestID"] = reqids
            found = True

        if not found:
            if value := list(json.loads(operationType)):
                req["Type"] = value
            if value := list(json.loads(ownerGroup)):
                req["OwnerGroup"] = value
            if value := list(json.loads(status)):
                req["Status"] = value
            if value := list(json.loads(owner)):
                req["OwnerDN"] = value

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
        gLogger.info("REQUEST:", req)
        return req
