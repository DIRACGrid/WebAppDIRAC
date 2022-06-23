import ast
import json

from DIRAC.Core.Utilities import TimeUtilities
from WebAppDIRAC.Lib.WebHandler import WebHandler
from DIRAC.WorkloadManagementSystem.Client.VMClient import VMClient


class VMDiracHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def web_getInstancesList(
        self, start: int = 0, limit: int = 0, sort: str = None, cond: str = None, statusSelector: str = None
    ):
        sortField = "inst_InstanceID"
        sortDir = "DESC"
        if sort:
            # converting the string into a dictionary
            sort = ast.literal_eval(sort.strip("[]"))
            sortField = str(sort["property"]).replace("_", ".")
            sortDir = str(sort["direction"])
        sort = [[sortField, sortDir]]

        condDict = {}
        if cond:
            dec = json.loads(cond)
            for k in dec:
                v = [str(dec[k])] if isinstance(dec[k], str) else [str(f) for f in dec[k]]
                condDict[str(k).replace("_", ".")] = v

        if statusSelector:
            condDict["inst.Status"] = [statusSelector]

        if not (result := VMClient().getInstancesContent(condDict, sort, start, limit))["OK"]:
            return {"success": "false", "error": result["Message"]}
        svcData = result["Value"]
        data = {"numRecords": svcData["TotalRecords"], "instances": []}
        for record in svcData["Records"]:
            rD = {}
            for iP in range(len(svcData["ParameterNames"])):
                param = svcData["ParameterNames"][iP].replace(".", "_")
                rD[param] = record[iP].strftime("%Y-%m-%d %H:%M:%S") if param == "inst_LastUpdate" else record[iP]
            data["instances"].append(rD)
        return {"success": "true", "result": data["instances"], "total": data["numRecords"], "date": None}

    def web_stopInstances(self, idList):
        webIds = json.loads(idList)
        result = VMClient().declareInstancesStopping(webIds)
        return {"success": "true", "result": result}

    def web_getHistoryForInstance(self, instanceID: int):
        if not (result := VMClient().getHistoryForInstanceID(instanceID))["OK"]:
            return {"success": "false", "error": result["Message"]}

        svcData = result["Value"]
        data = []
        for record in svcData["Records"]:
            rD = {}
            for iP in range(len(svcData["ParameterNames"])):
                param = svcData["ParameterNames"][iP].replace(".", "_")
                rD[param] = record[iP].strftime("%Y-%m-%d %H:%M:%S") if param == "Update" else record[iP]
            data.append(rD)
        return {"success": "true", "result": data, "total": len(data)}

    def web_checkVmWebOperation(self, operation):
        if not (result := VMClient().checkVmWebOperation(operation))["OK"]:
            return {"success": "false", "error": result["Message"]}
        return {"success": "true", "data": result["Value"]}

    def web_getHistoryValues(self, vars=None, timespan=86400):
        try:
            dbVars = [str(f) for f in json.loads(vars)]
        except Exception:
            dbVars = ["Load", "Jobs", "TransferredFiles"]

        if not (result := VMClient().getHistoryValues(3600, {}, dbVars, timespan))["OK"]:
            return {"success": "false", "error": result["Message"]}
        svcData = result["Value"]
        data = []
        olderThan = TimeUtilities.toEpoch() - 400
        for record in svcData["Records"]:
            rL = []
            for iP in range(len(svcData["ParameterNames"])):
                param = svcData["ParameterNames"][iP]
                rL.append(TimeUtilities.toEpoch(record[iP]) if param == "Update" else record[iP])
            if rL[0] < olderThan:
                data.append(rL)
        return {"success": "true", "data": data, "fields": svcData["ParameterNames"]}

    def web_getRunningInstancesHistory(self, bucketSize=900, timespan=86400):
        if not (result := VMClient().getRunningInstancesHistory(timespan, bucketSize))["OK"]:
            return {"success": "false", "error": result["Message"]}
        svcData = result["Value"]
        data = []
        olderThan = TimeUtilities.toEpoch() - 400
        rL = []
        for record in svcData:
            eTime = TimeUtilities.toEpoch(record[0])
            if eTime < olderThan:
                rL = [eTime, int(record[1])]
            data.append(rL)
        return {"success": "true", "data": data, "timespan": timespan}

    def web_getRunningInstancesBEPHistory(self, bucketSize=900, timespan=86400):
        if not (result := VMClient().getRunningInstancesBEPHistory(timespan, bucketSize))["OK"]:
            return {"success": "false", "error": result["Message"]}
        svcData = result["Value"]
        data = []
        olderThan = TimeUtilities.toEpoch() - 400
        for record in svcData:
            eTime = TimeUtilities.toEpoch(record[0])
            if eTime < olderThan:
                rL = [eTime, record[1], int(record[2])]
            data.append(rL)
        return {"success": "true", "data": data}

    def web_getRunningInstancesByRunningPodHistory(self, bucketSize=900, timespan=86400):
        if not (result := VMClient().getRunningInstancesByRunningPodHistory(timespan, bucketSize))["OK"]:
            return {"success": "false", "error": result["Message"]}
        svcData = result["Value"]
        data = []
        olderThan = TimeUtilities.toEpoch() - 400
        for record in svcData:
            eTime = TimeUtilities.toEpoch(record[0])
            if eTime < olderThan:
                rL = [eTime, record[1], int(record[2])]
            data.append(rL)
        return {"success": "true", "data": data}

    def web_getRunningInstancesByImageHistory(self, bucketSize=900, timespan=86400):
        if not (result := VMClient().getRunningInstancesByImageHistory(timespan, bucketSize))["OK"]:
            return {"success": "false", "error": result["Message"]}
        svcData = result["Value"]
        data = []
        olderThan = TimeUtilities.toEpoch() - 400
        for record in svcData:
            eTime = TimeUtilities.toEpoch(record[0])
            if eTime < olderThan:
                rL = [eTime, record[1], int(record[2])]
            data.append(rL)
        return {"success": "true", "data": data}
