import os
import json
import datetime
import tempfile

from DIRAC import gConfig, S_OK, S_ERROR
from DIRAC.Core.Utilities import TimeUtilities, List, DictCache
from DIRAC.Core.Utilities.Plotting.FileCoding import extractRequestFromFileId, codeRequestInFileId
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
from DIRAC.Core.Tornado.Client.ClientSelector import TransferClientSelector as TransferClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, FileResponse


class AccountingHandler(WebHandler):
    """This class is the background for the application that shows information about the use of resources at all times."""

    DEFAULT_AUTHORIZATION = "all"

    # Cache of the accounting data
    # Key: (user, group, setup, accounting type)
    __keysCache = DictCache.DictCache()

    # Reports client
    repClient = None
    # Transfer client
    transClient = None

    @classmethod
    def initializeHandler(cls, serviceInfo):
        """This may be overwritten when you write a DIRAC service handler
        And it must be a class method. This method is called only one time,
        at the first request

        :param dict serviceInfo: infos about service
        """
        cls.repClient = ReportsClient()
        cls.transClient = TransferClient("Accounting/ReportGenerator")

    def __getUniqueKeyValues(self, typeName):
        """Get unique key values for accounting type

        :param str typeName: accounting type

        :return: S_OK()/S_ERROR()
        """
        cacheKey = (self.getUserName(), self.getUserGroup(), self.getUserSetup(), typeName)
        data = AccountingHandler.__keysCache.get(cacheKey)
        if not data:
            retVal = self.repClient.listUniqueKeyValues(typeName)
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
            if "JobGroup" in retVal["Value"]:
                productions = retVal["Value"]["JobGroup"]
                productions.sort(reverse=True)
                retVal["Value"]["JobGroup"] = productions
            data = retVal
            AccountingHandler.__keysCache.add(cacheKey, 300, data)
        return data

    def web_getSelectionData(self, type, **kwargs):
        """Get selection data

        :param type: type of accounting data

        :return: dict
        """
        callback = {}
        typeName = type
        # Get unique key values
        retVal = self.__getUniqueKeyValues(typeName)
        if not retVal["OK"]:
            return {"success": "false", "result": "", "error": retVal["Message"]}

        records = {}
        for record in retVal["Value"]:  # may have more than 1000 of records.
            # do not show all of them in the web portal
            # length = len( retVal['Value'][record] )
            # if  length > 10000:
            #  records[record] = retVal['Value'][record][length - 5000:]
            #  message = "The %s accounting type contains to many rows: %s - > %d. Note: Only 1000 rows are returned!"
            #  message = message % ( typeName, record, length )
            #  gLogger.warn( message )
            # else:
            records[record] = retVal["Value"][record]
        callback["selectionValues"] = records

        # Cache for plotsList?
        data = AccountingHandler.__keysCache.get("reportsList:%s" % typeName)
        if not data:
            retVal = self.repClient.listReports(typeName)
            if not retVal["OK"]:
                return {"success": "false", "result": "", "error": retVal["Message"]}
            data = retVal["Value"]
            AccountingHandler.__keysCache.add("reportsList:%s" % typeName, 300, data)
        callback["plotsList"] = data
        return {"success": "true", "result": callback}

    def __parseFormParams(self, timeSelector, typeName=None, **pD):
        """Prepare parameters

        :param int timeSelector: time selector
        :param str typeName: type of accounting data

        :return: S_OK(tuple)/S_ERROR()
        """
        extraParams = {}

        # Personalized title?
        if "plotTitle" in pD:
            extraParams["plotTitle"] = pD["plotTitle"]
            del pD["plotTitle"]

        # Pin dates?
        pinDates = False
        if "pinDates" in pD:
            pinDates = pD["pinDates"].lower() in ("yes", "y", "true", "1")
            del pD["pinDates"]

        # Find the proper time!
        pD["timeSelector"] = timeSelector
        if pD["timeSelector"] > 0:
            end = datetime.datetime.utcnow()
            start = end - datetime.timedelta(seconds=pD["timeSelector"])
            if not pinDates:
                extraParams["lastSeconds"] = pD["timeSelector"]
        else:

            end = False
            if "endTime" in pD:
                end = TimeUtilities.fromString(pD["endTime"])
                del pD["endTime"]
            if "startTime" not in pD:
                return S_ERROR("Missing starTime!")
            start = TimeUtilities.fromString(pD["startTime"])
            del pD["startTime"]
        del pD["timeSelector"]

        # Find extra parameters
        for k in pD:
            if k.find("ex_") == 0:
                extraParams[k[3:]] = pD[k]

        # Selection data
        data = {}

        # Listify the rest
        for selName in pD:
            if isinstance(pD[selName], str):
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

        return S_OK((start, end, pD, extraParams))

    def web_generatePlot(self, typeName, plotName, timeSelector: int, grouping, **kwargs):
        """Generate plot

        :param str typeName: accounting type name
        :param str plotName: plot name
        :param int timeSelector: time selector value
        :param str grouping: grouping field name

        :return: dict
        """
        retVal = self.__parseFormParams(timeSelector, grouping=[grouping], typeName=typeName, **kwargs)
        if retVal["OK"]:
            start, end, pD, kwargs = retVal["Value"]
            retVal = self.repClient.generateDelayedPlot(typeName, plotName, start, end, pD, grouping, kwargs)
        if retVal["OK"]:
            return {"success": True, "data": retVal["Value"]["plot"]}
        return {"success": False, "errors": retVal["Message"]}

    def web_getPlotImg(self, fileName=None, **kwargs):
        """Get plot image

        :param str file: file path

        :return: dict
        """
        plotImageFile = fileName
        if not plotImageFile:
            return {"success": "false", "error": "Maybe you forgot the file?"}
        # Prevent directory traversal
        plotImageFile = os.path.normpath("/" + plotImageFile).lstrip("/")

        tempFile = tempfile.TemporaryFile()
        retVal = self.transClient.receiveFile(tempFile, plotImageFile)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Message"]}

        tempFile.seek(0)
        data = tempFile.read()
        return FileResponse(data, plotImageFile, "png")

    def web_getPlotImgFromCache(self, fileName=None, **kwargs):
        """Get plot image from cache.

        :param str file: file path

        :return: dict
        """
        plotImageFile = fileName
        if not plotImageFile:
            return {"success": "false", "error": "Maybe you forgot the file?"}

        retVal = extractRequestFromFileId(plotImageFile)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Value"]}
        fields = retVal["Value"]
        if "extraArgs" in fields:  # in order to get the plot from the cache we have to clean the extraArgs...
            plotTitle = fields["extraArgs"].get("plotTitle", "")
            fields["extraArgs"] = {}
            if plotTitle:
                fields["extraArgs"]["plotTitle"] = plotTitle

        retVal = codeRequestInFileId(fields)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Value"]}

        plotImageFile = retVal["Value"]["plot"]
        tempFile = tempfile.TemporaryFile()
        retVal = self.transClient.receiveFile(tempFile, plotImageFile)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Message"]}

        tempFile.seek(0)
        data = tempFile.read()
        return FileResponse(data, plotImageFile, "png", cache=False)

    def web_getCsvPlotData(self, typeName, plotName, timeSelector: int, grouping, **kwargs):
        """Generate CVS plot

        :param str typeName: accounting type name
        :param str plotName: plot name
        :param int timeSelector: time selector value
        :param str grouping: grouping field name

        :return: dict
        """
        retVal = self.__parseFormParams(timeSelector, grouping=[grouping], typeName=typeName, **kwargs)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Message"]}
        start, end, pD, kwargs = retVal["Value"]
        params = (typeName, plotName, start, end, pD, grouping, kwargs)
        retVal = self.repClient.getReport(*params)
        if not retVal["OK"]:
            return {"success": "false", "error": retVal["Message"]}

        rawData = retVal["Value"]
        groupKeys = sorted(rawData["data"])
        if "granularity" in rawData:
            granularity = rawData["granularity"]
            data = rawData["data"]
            tS = int(TimeUtilities.toEpoch(start))
            timeStart = tS - tS % granularity
            strData = "epoch,%s\n" % ",".join(groupKeys)
            for timeSlot in range(timeStart, int(TimeUtilities.toEpoch(end)), granularity):
                lineData = [str(timeSlot)]
                for key in groupKeys:
                    lineData.append(str(data[key][timeSlot]) if timeSlot in data[key] else "")
                strData += "%s\n" % ",".join(lineData)
        else:
            strData = "%s\n" % ",".join(groupKeys)
            strData += ",".join([str(rawData["data"][k]) for k in groupKeys])

        return FileResponse(strData, str(params), "csv", cache=False)

    def web_getPlotData(self, typeName, plotName, timeSelector: int, grouping, **kwargs):
        """Generate plot

        :param str typeName: accounting type name
        :param str plotName: plot name
        :param int timeSelector: time selector value
        :param str grouping: grouping field name

        :return: dict
        """
        retVal = self.__parseFormParams(timeSelector, grouping=[grouping], typeName=typeName, **kwargs)
        if retVal["OK"]:
            start, end, pD, kwargs = retVal["Value"]
            retVal = self.repClient.getReport(typeName, plotName, start, end, pD, grouping, kwargs)

        return retVal["Value"] if retVal["OK"] else {"success": "false", "error": retVal["Message"]}
