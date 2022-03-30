import os
import json
import tornado
import tempfile

from DIRAC import gConfig
from DIRAC.MonitoringSystem.Client.MonitoringClient import MonitoringClient
from DIRAC.Core.DISET.TransferClient import TransferClient
from DIRAC.Core.Utilities import Time, DEncode

from WebAppDIRAC.Lib.WebHandler import _WebHandler as WebHandler, FileResponse


class ActivityMonitorHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def web_getActivityData(
        self, start: int = 0, limit: int = 0, sortField: str = None, sortDirection: str = None
    ) -> dict:
        """Get activity  data"""
        sort = []
        if sortField and sortDirection:
            sort = [(sortField.replace("_", "."), sortDirection)]

        if not (result := MonitoringClient().getActivitiesContents({}, sort, start, limit))["OK"]:
            return {"success": "false", "result": [], "total": -1, "error": result["Message"]}

        svcData = result["Value"]
        callback = {"success": "true", "total": svcData["TotalRecords"], "result": []}
        now = Time.toEpoch()
        for record in svcData["Records"]:
            formatted = {}
            for i in range(len(svcData["Fields"])):
                formatted[svcData["Fields"][i].replace(".", "_")] = record[i]
            if "activities_lastUpdate" in formatted:
                formatted["activities_lastUpdate"] = now - int(formatted["activities_lastUpdate"])
            callback["result"].append(formatted)

        return callback

    def __dateToSecs(self, timeVar: str) -> int:
        """Convert date to seconds"""
        return int(Time.toEpoch(Time.fromString(timeVar)))

    def web_plotView(self) -> dict:
        """Get plot view"""
        plotRequest = {}
        try:
            if "id" not in self.request.arguments:
                return {"success": "false", "error": "Missing viewID in plot request"}
            plotRequest["id"] = self.get_argument("id")
            if "size" not in self.request.arguments:
                return {"success": "false", "error": "Missing plotsize in plot request"}
            plotRequest["size"] = int(self.get_argument("size"))

            timespan = int(self.get_argument("timespan"))
            if timespan < 0:
                toSecs = self.__dateToSecs(self.get_argument("toDate"))
                fromSecs = self.__dateToSecs(self.get_argument("fromDate"))
            else:
                toSecs = int(Time.toEpoch())
                fromSecs = toSecs - timespan
            plotRequest["fromSecs"] = fromSecs
            plotRequest["toSecs"] = toSecs
            if "varData" in self.request.arguments:
                plotRequest["varData"] = dict(json.loads(self.get_argument("varData")))
        except Exception as e:
            return {"success": "false", "error": "Error while processing plot parameters: %s" % str(e)}

        if (result := MonitoringClient().plotView(plotRequest))["OK"]:
            return {"success": "true", "data": result["Value"]}
        return {"success": "false", "error": result["Message"]}

    def web_getStaticPlotViews(self) -> dict:
        """Get static plot view"""
        if not (result := MonitoringClient().getViews(True))["OK"]:
            return {"success": "false", "error": result["Message"]}
        return {"success": "true", "result": result["Value"]}

    def web_getPlotImg(self):
        """Get plot image"""
        if "file" not in self.request.arguments:
            return {"success": "false", "error": "Maybe you forgot the file?"}
        plotImageFile = self.get_argument("file")
        # Prevent directory traversal
        plotImageFile = os.path.normpath("/" + plotImageFile).lstrip("/")

        transferClient = TransferClient("Framework/Monitoring")
        tempFile = tempfile.TemporaryFile()
        retVal = transferClient.receiveFile(tempFile, plotImageFile)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        tempFile.seek(0)
        data = tempFile.read()
        return FileResponse(data, plotImageFile, "png")

    def web_queryFieldValue(self, queryField, selectedFields) -> dict:
        """Query a value for a field"""
        definedFields = json.loads(selectedFields)
        result = MonitoringClient().queryField(queryField, definedFields)
        if "rpcStub" in result:
            del result["rpcStub"]
        if result["OK"]:
            return {"success": "true", "result": result["Value"]}
        return {"success": "false", "error": result["Message"]}

    def web_deleteActivities(self) -> dict:
        """Delete activities"""
        try:
            webIds = self.get_argument("ids").split(",")
        except Exception as e:
            return {"success": "false", "error": "No valid id's specified"}

        idList = []
        for webId in webIds:
            try:
                idList.append([int(field) for field in webId.split(".")])
            except Exception as e:
                return {"success": "false", "error": "Error while processing arguments: %s" % str(e)}

        retVal = MonitoringClient().deleteActivities(idList)
        if "rpcStub" in retVal:
            del retVal["rpcStub"]
        if retVal["OK"]:
            return {"success": "true"}
        return {"success": "false", "error": retVal["Message"]}

    def web_tryView(self) -> dict:
        """Try plotting graphs for a view"""
        try:
            plotRequest = json.loads(self.get_argument("plotRequest"))
            if "timeLength" in self.request.arguments:
                timeLength = self.get_argument("timeLength")
                toSecs = int(Time.toEpoch())
                if timeLength == "hour":
                    fromSecs = toSecs - 3600
                elif timeLength == "day":
                    fromSecs = toSecs - 86400
                elif timeLength == "month":
                    fromSecs = toSecs - 2592000
                elif fromSecs == "year":
                    fromDate = toSecs - 31104000
                else:
                    return {"success": "false", "error": "Time length value not valid"}
            else:
                fromDate = self.get_argument("fromDate")
                toDate = self.get_argument("toDate")
                fromSecs = self.__dateToSecs(fromDate)
                toSecs = self.__dateToSecs(toDate)
        except Exception as e:
            return {"success": "false", "error": "Error while processing plot parameters: %s" % str(e)}

        requestStub = DEncode.encode(plotRequest)
        if not (retVal := MonitoringClient().tryView(fromSecs, toSecs, requestStub))["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        return {"success": "true", "images": retVal["Value"], "stub": requestStub}

    def web_saveView(self):
        """Save a view"""
        try:
            plotRequest = json.loads(self.get_argument("plotRequest"))
            viewName = self.get_argument("viewName")
        except Exception as e:
            return {"success": "false", "error": "Error while processing plot parameters: %s" % str(e)}
        requestStub = DEncode.encode(plotRequest)
        result = MonitoringClient().saveView(viewName, requestStub)
        if "rpcStub" in result:
            del result["rpcStub"]

        return {"success": "true"}

    def __getSections(self, path):

        result = []

        retVal = gConfig.getSections("/DIRAC/Setups")
        if retVal["OK"]:
            setups = [i.split("-")[-1] for i in retVal["Value"]]
        setup = self.getUserSetup().split("-")[-1]
        leaf = True if path.find("Agents") != -1 or path.find("Services") != -1 else False
        retVal = gConfig.getSections(path)

        if retVal["OK"]:
            records = retVal["Value"]
            for i in records:
                if i in setups and i != setup:
                    continue
                if i == setup:
                    path = "%s/%s" % (path, i)
                    result = self.__getSections(path)

                if i not in [setup, "Databases", "URLs"]:

                    id = "%s/%s" % (path, i)
                    components = path.split("/")
                    if len(components) > 2:
                        componentName = "%s/%s" % (components[2], i)
                    else:
                        componentName = i
                    result += [{"text": i, "qtip": "Systems", "leaf": leaf, "component": componentName, "id": id}]

        return result

    def web_getDynamicPlotViews(self, node):
        """It retrieves the systems from the CS."""
        nodes = []
        result = self.__getSections(node)
        for i in result:
            nodes += [i]

        return tornado.escape.json_encode(nodes)
