import os
import json
import tornado
import tempfile

from DIRAC import gConfig
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.TransferClient import TransferClient
from DIRAC.Core.Utilities import Time, DEncode

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class ActivityMonitorHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getActivityData(self):
        try:
            start = int(self.get_argument("start"))
        except BaseException:
            start = 0
        try:
            limit = int(self.get_argument("limit"))
        except BaseException:
            limit = 0

        try:
            sortField = self.get_argument("sortField").replace("_", ".")
            sortDir = self.get_argument("sortDirection")
            sort = [(sortField, sortDir)]
        except BaseException:
            sort = []

        rpcClient = RPCClient("Framework/Monitoring")
        retVal = yield self.threadTask(rpcClient.getActivitiesContents, {}, sort, start, limit)

        if not retVal["OK"]:
            self.finish({"success": "false", "result": [], "total": -1, "error": retVal["Message"]})
            return

        svcData = retVal["Value"]
        callback = {"success": "true", "total": svcData["TotalRecords"], "result": []}
        now = Time.toEpoch()
        for record in svcData["Records"]:
            formatted = {}
            for i in range(len(svcData["Fields"])):
                formatted[svcData["Fields"][i].replace(".", "_")] = record[i]
            if "activities_lastUpdate" in formatted:
                formatted["activities_lastUpdate"] = now - int(formatted["activities_lastUpdate"])
            callback["result"].append(formatted)

        self.finish(callback)

    def __dateToSecs(self, timeVar):
        dt = Time.fromString(timeVar)
        return int(Time.toEpoch(dt))

    @asyncGen
    def web_plotView(self):

        plotRequest = {}
        try:
            if "id" not in self.request.arguments:
                self.finish({"success": "false", "error": "Missing viewID in plot request"})
                return
            plotRequest["id"] = self.get_argument("id")
            if "size" not in self.request.arguments:
                self.finish({"success": "false", "error": "Missing plotsize in plot request"})
                return
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
            self.finish({"success": "false", "error": "Error while processing plot parameters: %s" % str(e)})
            return

        rpcClient = RPCClient("Framework/Monitoring")
        retVal = yield self.threadTask(rpcClient.plotView, plotRequest)

        if retVal["OK"]:
            self.finish({"success": "true", "data": retVal["Value"]})
        else:
            self.finish({"success": "false", "error": retVal["Message"]})

    @asyncGen
    def web_getStaticPlotViews(self):
        rpcClient = RPCClient("Framework/Monitoring")
        retVal = yield self.threadTask(rpcClient.getViews, True)
        if not retVal["OK"]:
            self.finish({"success": "false", "error": retVal["Message"]})
        else:
            self.finish({"success": "true", "result": retVal["Value"]})

    @asyncGen
    def web_getPlotImg(self):
        """
        Get plot image
        """
        callback = {}
        if "file" not in self.request.arguments:
            callback = {"success": "false", "error": "Maybe you forgot the file?"}
            self.finish(callback)
            return
        plotImageFile = self.get_argument("file")
        # Prevent directory traversal
        plotImageFile = os.path.normpath("/" + plotImageFile).lstrip("/")

        transferClient = TransferClient("Framework/Monitoring")
        tempFile = tempfile.TemporaryFile()
        retVal = yield self.threadTask(transferClient.receiveFile, tempFile, plotImageFile)
        if not retVal["OK"]:
            callback = {"success": "false", "error": retVal["Message"]}
            self.finish(callback)
            return
        tempFile.seek(0)
        data = tempFile.read()
        self.finishWithImage(data, plotImageFile)

    @asyncGen
    def web_queryFieldValue(self):
        """
        Query a value for a field
        """
        fieldQuery = self.get_argument("queryField")
        definedFields = json.loads(self.get_argument("selectedFields"))
        rpcClient = RPCClient("Framework/Monitoring")
        result = yield self.threadTask(rpcClient.queryField, fieldQuery, definedFields)
        if "rpcStub" in result:
            del result["rpcStub"]

        if result["OK"]:
            self.finish({"success": "true", "result": result["Value"]})
        else:
            self.finish({"success": "false", "error": result["Message"]})

    @asyncGen
    def web_deleteActivities(self):
        try:
            webIds = self.get_argument("ids").split(",")
        except Exception as e:
            self.finish({"success": "false", "error": "No valid id's specified"})
            return

        idList = []
        for webId in webIds:
            try:
                idList.append([int(field) for field in webId.split(".")])
            except Exception as e:
                self.finish({"success": "false", "error": "Error while processing arguments: %s" % str(e)})
                return

        rpcClient = RPCClient("Framework/Monitoring")

        retVal = yield self.threadTask(rpcClient.deleteActivities, idList)

        if "rpcStub" in retVal:
            del retVal["rpcStub"]

        if retVal["OK"]:
            self.finish({"success": "true"})
        else:
            self.finish({"success": "false", "error": retVal["Message"]})

    @asyncGen
    def web_tryView(self):
        """
        Try plotting graphs for a view
        """
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
                    self.finish({"success": "false", "error": "Time length value not valid"})
                    return
            else:
                fromDate = self.get_argument("fromDate")
                toDate = self.get_argument("toDate")
                fromSecs = self.__dateToSecs(fromDate)
                toSecs = self.__dateToSecs(toDate)
        except Exception as e:
            self.finish({"success": "false", "error": "Error while processing plot parameters: %s" % str(e)})
            return

        rpcClient = RPCClient("Framework/Monitoring")
        requestStub = DEncode.encode(plotRequest)
        retVal = yield self.threadTask(rpcClient.tryView, fromSecs, toSecs, requestStub)
        if not retVal["OK"]:
            self.finish({"success": "false", "error": retVal["Message"]})
            return

        self.finish({"success": "true", "images": retVal["Value"], "stub": requestStub})

    @asyncGen
    def web_saveView(self):
        """
        Save a view
        """
        try:
            plotRequest = json.loads(self.get_argument("plotRequest"))
            viewName = self.get_argument("viewName")
        except Exception as e:
            self.finish({"success": "false", "error": "Error while processing plot parameters: %s" % str(e)})
            return
        rpcClient = RPCClient("Framework/Monitoring")
        requestStub = DEncode.encode(plotRequest)
        result = yield self.threadTask(rpcClient.saveView, viewName, requestStub)
        if "rpcStub" in result:
            del result["rpcStub"]

        self.finish({"success": "true"})

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

    @asyncGen
    def web_getDynamicPlotViews(self):
        """
        It retrieves the systems from the CS.
        """
        nodes = []
        path = self.get_argument("node")

        result = self.__getSections(path)
        for i in result:
            nodes += [i]

        result = tornado.escape.json_encode(nodes)
        self.finish(result)
