import os
import json
import tempfile
import datetime

from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Tornado.Client.ClientSelector import TransferClientSelector as TransferClient
from DIRAC.Core.Utilities import TimeUtilities, List, DictCache
from DIRAC.Core.Utilities.Plotting.FileCoding import extractRequestFromFileId, codeRequestInFileId
from DIRAC.MonitoringSystem.Client.MonitoringClient import MonitoringClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, FileResponse


class MonitoringHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"
    __keysCache = DictCache.DictCache()

    def __getUniqueKeyValues(self, typeName):
        cacheKey = (self.getUserName(), self.getUserGroup(), self.getUserSetup(), typeName)
        if not (data := MonitoringHandler.__keysCache.get(cacheKey)):
            retVal = MonitoringClient().listUniqueKeyValues(typeName)
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

    def web_getSelectionData(self, type, **kwargs):
        typeName = type
        callback = {}
        # Get unique key values
        if not (retVal := self.__getUniqueKeyValues(typeName))["OK"]:
            return {"success": "false", "result": "", "error": retVal["Message"]}

        records = {}
        for record in retVal["Value"]:  # may have more than 1000 of records.
            # do not show all of them in the web portal
            length = len(retVal["Value"][record])
            if length > 10000:
                records[record] = retVal["Value"][record][length - 5000 :]
                message = f"The {typeName} monitoring type contains too many rows: {record} -> {length}"
                message += " Note: Only 5000 rows are returned!"
                gLogger.warn(message)
            else:
                records[record] = retVal["Value"][record]
        callback["selectionValues"] = records

        # Cache for plotsList?
        if not (data := MonitoringHandler.__keysCache.get(f"reportsList:{typeName}")):
            if not (retVal := MonitoringClient().listReports(typeName))["OK"]:
                return {"success": "false", "result": "", "error": retVal["Message"]}
            data = retVal["Value"]
            MonitoringHandler.__keysCache.add(f"reportsList:{typeName}", 300, data)
        callback["plotsList"] = data
        return {"success": "true", "result": callback}

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
            end = datetime.datetime.utcnow()
            start = end - datetime.timedelta(seconds=pD["timeSelector"])
            if not pinDates:
                extraParams["lastSeconds"] = pD["timeSelector"]
        else:
            if "endTime" not in pD:
                end = False
            else:
                end = TimeUtilities.fromString(pD["endTime"])
                del pD["endTime"]
            if "startTime" not in pD:
                return S_ERROR("Missing starTime!")
            else:
                start = TimeUtilities.fromString(pD["startTime"])
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

    def web_generatePlot(self):
        if (retVal := self.__queryForPlot())["OK"]:
            return {"success": "true", "data": retVal["Value"]["plot"]}
        return {"success": "false", "errors": retVal["Message"]}

    def __queryForPlot(self):
        res = self.__parseFormParams()
        return MonitoringClient().generateDelayedPlot(*res["Value"]) if res["OK"] else res

    def web_getPlotImg(self, fileName=None):
        """Get plot image"""
        if not fileName:
            return {"success": "false", "error": "Maybe you forgot the file?"}
        # Prevent directory traversal
        plotImageFile = os.path.normpath("/" + fileName).lstrip("/")

        transferClient = TransferClient("Monitoring/Monitoring")
        tempFile = tempfile.TemporaryFile()
        retVal = transferClient.receiveFile(tempFile, plotImageFile)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        tempFile.seek(0)
        data = tempFile.read()
        return FileResponse(data, plotImageFile, ext="png")

    def web_getPlotImgFromCache(self, fileName=None):
        """Get plot image from cache."""
        if not fileName:
            return {"success": "false", "error": "Maybe you forgot the file?"}

        retVal = extractRequestFromFileId(fileName)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Message"]}
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
            return {"success": "false", "error": retVal["Message"]}
        plotImageFile = retVal["Value"]["plot"]

        transferClient = TransferClient("Monitoring/Monitoring")
        tempFile = tempfile.TemporaryFile()
        if not (retVal := transferClient.receiveFile(tempFile, plotImageFile))["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        tempFile.seek(0)
        data = tempFile.read()
        return FileResponse(data, plotImageFile, ext="png", cache=False)

    def web_getCsvPlotData(self):
        if not (retVal := self.__parseFormParams())["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        params = retVal["Value"]
        if not (retVal := MonitoringClient().getReport(*params))["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        rawData = retVal["Value"]
        groupKeys = sorted(rawData["data"])
        if "granularity" in rawData:
            granularity = rawData["granularity"]
            data = rawData["data"]
            tS = int(TimeUtilities.toEpoch(params[2]))
            timeStart = tS - tS % granularity
            strData = "epoch,%s\n" % ",".join(groupKeys)
            for timeSlot in range(timeStart, int(TimeUtilities.toEpoch(params[3])), granularity):
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
        return FileResponse(strData, str(params), ext="csv", cache=False)

    def web_getPlotData(self):
        if not (retVal := self.__parseFormParams())["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        params = retVal["Value"]
        if not (retVal := MonitoringClient().getReport(*params))["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        return retVal["Value"]["data"]
