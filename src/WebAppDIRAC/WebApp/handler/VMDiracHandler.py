import ast
import json

from DIRAC.Core.Utilities import Time
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen
from DIRAC.WorkloadManagementSystem.Client.VMClient import VMClient


class VMDiracHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getInstancesList(self):
        try:
            start = int(self.get_argument("start"))
        except Exception:
            start = 0
        try:
            limit = int(self.get_argument("limit"))
        except Exception:
            limit = 0

        sortField = "inst_InstanceID"
        sortDir = "DESC"
        if "sort" in self.request.arguments:
            sortValue = self.get_argument("sort")
            # converting the string into a dictionary
            sortValue = ast.literal_eval(sortValue.strip("[]"))
            sortField = str(sortValue["property"]).replace("_", ".")
            sortDir = str(sortValue["direction"])
        sort = [[sortField, sortDir]]

        condDict = {}
        if "cond" in self.request.arguments:
            dec = json.loads(self.get_argument("cond"))
            for k in dec:
                v = [str(dec[k])] if isinstance(dec[k], str) else [str(f) for f in dec[k]]
                condDict[str(k).replace("_", ".")] = v

        if "statusSelector" in self.request.arguments:
            condDict["inst.Status"] = [str(self.get_argument("statusSelector"))]

        result = VMClient().getInstancesContent(condDict, sort, start, limit)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        svcData = result["Value"]
        data = {"numRecords": svcData["TotalRecords"], "instances": []}
        for record in svcData["Records"]:
            rD = {}
            for iP in range(len(svcData["ParameterNames"])):
                param = svcData["ParameterNames"][iP].replace(".", "_")
                rD[param] = record[iP].strftime("%Y-%m-%d %H:%M:%S") if param == "inst_LastUpdate" else record[iP]
            data["instances"].append(rD)
        self.finish({"success": "true", "result": data["instances"], "total": data["numRecords"], "date": None})

    def web_stopInstances(self):
        webIds = json.loads(self.get_argument("idList"))
        result = VMClient().declareInstancesStopping(webIds)
        self.finish({"success": "true", "result": result})

    def web_getHistoryForInstance(self):
        instanceID = int(self.get_argument("instanceID"))
        result = VMClient().getHistoryForInstanceID(instanceID)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        svcData = result["Value"]
        data = []
        for record in svcData["Records"]:
            rD = {}
            for iP in range(len(svcData["ParameterNames"])):
                param = svcData["ParameterNames"][iP].replace(".", "_")
                rD[param] = record[iP].strftime("%Y-%m-%d %H:%M:%S") if param == "Update" else record[iP]
            data.append(rD)
        self.finish({"success": "true", "result": data, "total": len(data)})

    def web_checkVmWebOperation(self):
        operation = str(self.get_argument("operation"))
        result = VMClient().checkVmWebOperation(operation)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
        else:
            self.finish({"success": "true", "data": result["Value"]})

    def web_getHistoryValues(self):
        try:
            dbVars = [str(f) for f in json.loads(self.get_argument("vars"))]
        except Exception:
            dbVars = ["Load", "Jobs", "TransferredFiles"]
        try:
            timespan = int(self.get_argument("timespan"))
        except Exception:
            timespan = 86400
        result = VMClient().getHistoryValues(3600, {}, dbVars, timespan)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        svcData = result["Value"]
        data = []
        olderThan = Time.toEpoch() - 400
        for record in svcData["Records"]:
            rL = []
            for iP in range(len(svcData["ParameterNames"])):
                param = svcData["ParameterNames"][iP]
                rL.append(Time.toEpoch(record[iP]) if param == "Update" else record[iP])
            if rL[0] < olderThan:
                data.append(rL)
        self.finish({"success": "true", "data": data, "fields": svcData["ParameterNames"]})

    def web_getRunningInstancesHistory(self):
        try:
            bucketSize = int(self.get_argument("bucketSize"))
        except Exception:
            bucketSize = 900
        try:
            timespan = int(self.get_argument("timespan"))
        except Exception:
            timespan = 86400
        result = VMClient().getRunningInstancesHistory(timespan, bucketSize)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        svcData = result["Value"]
        data = []
        olderThan = Time.toEpoch() - 400
        rL = []
        for record in svcData:
            eTime = Time.toEpoch(record[0])
            if eTime < olderThan:
                rL = [eTime, int(record[1])]
            data.append(rL)
        self.finish({"success": "true", "data": data, "timespan": timespan})

    def web_getRunningInstancesBEPHistory(self):
        try:
            bucketSize = int(self.get_argument("bucketSize"))
        except Exception:
            bucketSize = 900
        try:
            timespan = int(self.get_argument("timespan"))
        except Exception:
            timespan = 86400
        result = VMClient().getRunningInstancesBEPHistory(timespan, bucketSize)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        svcData = result["Value"]
        data = []
        olderThan = Time.toEpoch() - 400
        for record in svcData:
            eTime = Time.toEpoch(record[0])
            if eTime < olderThan:
                rL = [eTime, record[1], int(record[2])]
            data.append(rL)
        self.finish({"success": "true", "data": data})

    def web_getRunningInstancesByRunningPodHistory(self):
        try:
            bucketSize = int(self.get_argument("bucketSize"))
        except Exception:
            bucketSize = 900
        try:
            timespan = int(self.get_argument("timespan"))
        except Exception:
            timespan = 86400
        result = VMClient().getRunningInstancesByRunningPodHistory(timespan, bucketSize)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        svcData = result["Value"]
        data = []
        olderThan = Time.toEpoch() - 400
        for record in svcData:
            eTime = Time.toEpoch(record[0])
            if eTime < olderThan:
                rL = [eTime, record[1], int(record[2])]
            data.append(rL)
        self.finish({"success": "true", "data": data})

    def web_getRunningInstancesByImageHistory(self):
        try:
            bucketSize = int(self.get_argument("bucketSize"))
        except Exception:
            bucketSize = 900
        try:
            timespan = int(self.get_argument("timespan"))
        except Exception:
            timespan = 86400
        result = VMClient().getRunningInstancesByImageHistory(timespan, bucketSize)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        svcData = result["Value"]
        data = []
        olderThan = Time.toEpoch() - 400
        for record in svcData:
            eTime = Time.toEpoch(record[0])
            if eTime < olderThan:
                rL = [eTime, record[1], int(record[2])]
            data.append(rL)
        self.finish({"success": "true", "data": data})
