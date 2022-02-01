import os
import json
import tempfile
import datetime

from hashlib import md5

from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.DISET.TransferClient import TransferClient
from DIRAC.Core.Utilities import Time, List, DictCache
from DIRAC.Core.Utilities.Plotting.FileCoding import extractRequestFromFileId, codeRequestInFileId
from DIRAC.MonitoringSystem.Client.MonitoringClient import MonitoringClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class MonitoringHandler(WebHandler):

    AUTH_PROPS = "authenticated"
    __keysCache = DictCache.DictCache()

    def __getUniqueKeyValues(self, typeName):
        cacheKey = (self.getUserName(), self.getUserGroup(), self.getUserSetup(), typeName)
        data = MonitoringHandler.__keysCache.get(cacheKey)
        if not data:
            client = MonitoringClient()
            retVal = client.listUniqueKeyValues(typeName)
            if "rpcStub" in retVal:
                del retVal["rpcStub"]
            if not retVal["OK"]:
                return retVal

            # Site ordering based on TierLevel / alpha
            if "Site" in retVal["Value"]:
                siteLevel = {}
                for siteName in retVal["Value"]["Site"]:
                    sitePrefix = siteName.split(".")[0].strip()
                    level = gConfig.getValue("/Resources/Sites/%s/%s/MoUTierLevel" % (sitePrefix, siteName), 10)
                    if level not in siteLevel:
                        siteLevel[level] = []
                    siteLevel[level].append(siteName)
                orderedSites = []
                for level in sorted(siteLevel):
                    orderedSites.extend(sorted(siteLevel[level]))
                retVal["Value"]["Site"] = orderedSites
            data = retVal
            MonitoringHandler.__keysCache.add(cacheKey, 300, data)
        return data

    @asyncGen
    def web_getSelectionData(self):
        callback = {}
        typeName = self.get_argument("type")
        # Get unique key values
        retVal = yield self.threadTask(self.__getUniqueKeyValues, typeName)
        if not retVal["OK"]:
            self.finish({"success": "false", "result": "", "error": retVal["Message"]})
            return

        records = {}
        for record in retVal["Value"]:  # may have more than 1000 of records.
            # do not show all of them in the web portal
            length = len(retVal["Value"][record])
            if length > 10000:
                records[record] = retVal["Value"][record][length - 5000 :]
                message = (
                    "The %s accounting type contains to many rows: %s - > %d. Note: Only 1000 rows are returned!"
                    % (typeName, record, length)
                )
                gLogger.warn(message)
            else:
                records[record] = retVal["Value"][record]
        callback["selectionValues"] = records

        # Cache for plotsList?
        data = MonitoringHandler.__keysCache.get("reportsList:%s" % typeName)
        if not data:
            repClient = MonitoringClient()
            retVal = yield self.threadTask(repClient.listReports, typeName)
            if not retVal["OK"]:
                self.finish({"success": "false", "result": "", "error": retVal["Message"]})
                return
            data = retVal["Value"]
            MonitoringHandler.__keysCache.add("reportsList:%s" % typeName, 300, data)
        callback["plotsList"] = data
        self.finish({"success": "true", "result": callback})

    def __parseFormParams(self):
        pD = {}
        extraParams = {}
        pinDates = False

        for name in self.request.arguments:
            pD[name] = self.get_argument(name)

        # Personalized title?
        if "plotTitle" in pD:
            extraParams["plotTitle"] = pD["plotTitle"]
            del pD["plotTitle"]
        # Pin dates?
        if "pinDates" in pD:
            pinDates = pD["pinDates"]
            del pD["pinDates"]
            pinDates = pinDates.lower() in ("yes", "y", "true", "1")
        # Get plotname
        if "grouping" not in pD:
            return S_ERROR("Missing grouping!")
        grouping = pD["grouping"]
        # Get plotname
        if "typeName" not in pD:
            return S_ERROR("Missing type name!")
        typeName = pD["typeName"]
        del pD["typeName"]
        # Get plotname
        if "plotName" not in pD:
            return S_ERROR("Missing plot name!")
        reportName = pD["plotName"]
        del pD["plotName"]
        # Get times
        if "timeSelector" not in pD:
            return S_ERROR("Missing time span!")
        # Find the proper time!
        pD["timeSelector"] = int(pD["timeSelector"])
        if pD["timeSelector"] > 0:
            end = Time.dateTime()
            start = end - datetime.timedelta(seconds=pD["timeSelector"])
            if not pinDates:
                extraParams["lastSeconds"] = pD["timeSelector"]
        else:
            if "endTime" not in pD:
                end = False
            else:
                end = Time.fromString(pD["endTime"])
                del pD["endTime"]
            if "startTime" not in pD:
                return S_ERROR("Missing starTime!")
            else:
                start = Time.fromString(pD["startTime"])
                del pD["startTime"]
        del pD["timeSelector"]

        for k in pD:
            if k.find("ex_") == 0:
                extraParams[k[3:]] = pD[k]

        # Selection data
        data = {}

        # Listify the rest
        for selName in pD:
            if selName == "grouping":
                pD[selName] = [pD[selName]]
            else:
                try:
                    pD[selName] = json.loads(pD[selName])
                except ValueError:
                    pD[selName] = List.fromChar(pD[selName], ",")

            # If json parse value as string, listify it
            if isinstance(pD[selName], str):
                pD[selName] = List.fromChar(pD[selName], ",")

            # Convert 'value*' to list of values that starts with 'value'
            fullList = []
            for value in pD[selName]:
                if value.endswith("*"):
                    if not data:
                        retVal = self.__getUniqueKeyValues(typeName)
                        if not retVal["OK"]:
                            return retVal
                        data = retVal["Value"]
                    for v in data[selName]:
                        if v.startswith(value[:-1]):
                            fullList.append(v)
                else:
                    fullList.append(value)

            pD[selName] = fullList

        return S_OK((typeName, reportName, start, end, pD, grouping, extraParams))

    @asyncGen
    def web_generatePlot(self):
        callback = {}
        retVal = yield self.threadTask(self.__queryForPlot)
        if retVal["OK"]:
            callback = {"success": True, "data": retVal["Value"]["plot"]}
        else:
            callback = {"success": False, "errors": retVal["Message"]}
        self.finish(callback)

    def __queryForPlot(self):
        res = self.__parseFormParams()
        return MonitoringClient().generateDelayedPlot(*res["Value"]) if res["OK"] else res

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

        transferClient = TransferClient("Monitoring/Monitoring")
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
    def web_getPlotImgFromCache(self):
        """
        Get plot image from cache.
        """
        callback = {}
        if "file" not in self.request.arguments:
            callback = {"success": "false", "error": "Maybe you forgot the file?"}
            self.finish(callback)
            return
        plotImageFile = self.get_argument("file")

        retVal = extractRequestFromFileId(plotImageFile)
        if not retVal["OK"]:
            callback = {"success": "false", "error": retVal["Value"]}
            self.finish(callback)
            return
        fields = retVal["Value"]
        if "extraArgs" in fields:  # in order to get the plot from the cache we have to clean the extraArgs...
            plotTitle = ""
            if "plotTitle" in fields["extraArgs"]:
                plotTitle = fields["extraArgs"]["plotTitle"]
                fields["extraArgs"] = {}
                fields["extraArgs"]["plotTitle"] = plotTitle
            else:
                fields["extraArgs"] = {}

        retVal = codeRequestInFileId(fields)
        if not retVal["OK"]:
            callback = {"success": "false", "error": retVal["Value"]}
            self.finish(callback)
            return
        plotImageFile = retVal["Value"]["plot"]

        transferClient = TransferClient("Monitoring/Monitoring")
        tempFile = tempfile.TemporaryFile()
        retVal = yield self.threadTask(transferClient.receiveFile, tempFile, plotImageFile)
        if not retVal["OK"]:
            callback = {"success": "false", "error": retVal["Message"]}
            self.finish(callback)
            return
        tempFile.seek(0)
        data = tempFile.read()
        self.finishWithImage(data, plotImageFile, disableCaching=True)

    @asyncGen
    def web_getCsvPlotData(self):
        callback = {}
        retVal = self.__parseFormParams()
        if not retVal["OK"]:
            callback = {"success": "false", "error": retVal["Message"]}
            self.finish(callback)
        params = retVal["Value"]
        repClient = MonitoringClient()
        retVal = yield self.threadTask(repClient.getReport, *params)
        if not retVal["OK"]:
            callback = {"success": "false", "error": retVal["Message"]}
            self.finish(callback)
        rawData = retVal["Value"]
        groupKeys = sorted(rawData["data"])
        if "granularity" in rawData:
            granularity = rawData["granularity"]
            data = rawData["data"]
            tS = int(Time.toEpoch(params[2]))
            timeStart = tS - tS % granularity
            strData = "epoch,%s\n" % ",".join(groupKeys)
            for timeSlot in range(timeStart, int(Time.toEpoch(params[3])), granularity):
                lineData = [str(timeSlot)]
                for key in groupKeys:
                    if timeSlot in data[key]:
                        lineData.append(str(data[key][timeSlot]))
                    else:
                        lineData.append("")
                strData += "%s\n" % ",".join(lineData)
        else:
            strData = "%s\n" % ",".join(groupKeys)
            strData += ",".join([str(rawData["data"][k]) for k in groupKeys])
        self.set_header("Content-type", "text/csv")
        self.set_header("Content-Disposition", 'attachment; filename="%s.csv"' % md5(str(params).encode()).hexdigest())
        self.set_header("Content-Length", len(strData))
        self.finish(strData)

    @asyncGen
    def web_getPlotData(self):
        callback = {}
        retVal = self.__parseFormParams()
        if not retVal["OK"]:
            callback = {"success": "false", "error": retVal["Message"]}
            self.finish(callback)
        params = retVal["Value"]
        repClient = MonitoringClient()
        retVal = yield self.threadTask(repClient.getReport, *params)
        if not retVal["OK"]:
            callback = {"success": "false", "error": retVal["Message"]}
            self.finish(callback)
        rawData = retVal["Value"]
        self.finish(rawData["data"])
