""" Get Site Summary page content
"""

import json

from DIRAC import gLogger
from DIRAC.Core.Utilities.SiteSEMapping import getSEsForSite
from DIRAC.Core.Utilities.Plotting.FileCoding import codeRequestInFileId
from DIRAC.ConfigurationSystem.Client.Helpers.Resources import getSiteCEMapping, getGOCSiteName, getDIRACSiteName
from DIRAC.ResourceStatusSystem.Client.PublisherClient import PublisherClient

from WebAppDIRAC.WebApp.handler.ResourceSummaryHandler import SummaryHandlerMix


class SiteSummaryHandler(SummaryHandlerMix):

    ELEMENT_TYPE = "Site"

    def web_getSelectionData(self, **kwargs):
        return self._getSelectionData(**kwargs)

    def web_expand(self, name: list = None):
        return self._expand(name)

    def web_action(self, action=None, **kwargs):
        return self._action(action, **kwargs)

    def web_getSiteSummaryData(
        self, name=None, status=None, action=None, elementType=None, statusType=None, tokenOwner=None
    ):
        """This method returns the data required to fill the grid."""
        if name:
            name = list(json.loads(name))
        if status:
            status = list(json.loads(status))
        if action:
            action = list(json.loads(action))
        if elementType:
            elementType = list(json.loads(elementType))
        if statusType:
            statusType = list(json.loads(statusType))
        if tokenOwner:
            tokenOwner = list(json.loads(tokenOwner))

        elementStatuses = PublisherClient().getElementStatuses(
            "Site", name, elementType, statusType, status, tokenOwner
        )
        if not elementStatuses["OK"]:
            return {"success": "false", "error": elementStatuses["Message"]}

        elementList = [dict(zip(elementStatuses["Columns"], site)) for site in elementStatuses["Value"]]

        for elementStatus in elementList:
            elementStatus["Country"] = elementStatus["Name"][-2:]
            elementStatus["DateEffective"] = str(elementStatus["DateEffective"])
            elementStatus["LastCheckTime"] = str(elementStatus["LastCheckTime"])
            elementStatus["TokenExpiration"] = str(elementStatus["TokenExpiration"])

        return {"success": "true", "result": elementList, "total": len(elementList)}

    def _getInfo(self, requestParams: dict) -> dict:
        """Get site info"""
        if not (name := requestParams.get("name")):
            gLogger.warn("No name given")
            return {"success": "false", "error": "We need a Site Name to generate an Overview"}

        elementStatuses = PublisherClient().getElementStatuses("Site", name, None, "all", None, None)

        if not elementStatuses["OK"]:
            gLogger.error(elementStatuses["Message"])
            return {"success": "false", "error": "Error getting ElementStatus information"}

        if not elementStatuses["Value"]:
            gLogger.error(f'element "{name}" not found')
            return {"success": "false", "error": f'element "{name}" not found'}

        elementStatus = [dict(zip(elementStatuses["Columns"], element)) for element in elementStatuses["Value"]][0]
        elementStatus["DateEffective"] = str(elementStatus["DateEffective"])
        elementStatus["LastCheckTime"] = str(elementStatus["LastCheckTime"])
        elementStatus["TokenExpiration"] = str(elementStatus["TokenExpiration"])

        if not (gocdb_name := getGOCSiteName(name))["OK"]:
            gLogger.error(gocdb_name["Message"])
            elementStatus["GOCDB"] = ""
            gocdb_name = ""
        else:
            gocdb_name = gocdb_name["Value"]
            elementStatus["GOCDB"] = '<a href="https://goc.egi.eu/portal/index.php?Page_'
            elementStatus["GOCDB"] += f'Type=Submit_Search&SearchString={gocdb_name}" target="_blank">{gocdb_name}</a>'

        if not (dirac_names := getDIRACSiteName(gocdb_name))["OK"]:
            gLogger.error(dirac_names["Message"])
            dirac_names = []
        else:
            elementStatus["GOCDB"] += "("
            for i in dirac_names["Value"]:
                elementStatus["GOCDB"] += "%s " % i
            elementStatus["GOCDB"] += ")"

        elementStatus["GGUS"] = '<a href="https://ggus.eu/ws/ticket_search.php?'
        elementStatus["GGUS"] += "show_columns_check[]=REQUEST_ID&"
        elementStatus["GGUS"] += "show_columns_check[]=TICKET_TYPE&show_columns_check[]=AFFECTED_VO&"
        elementStatus["GGUS"] += "show_columns_check[]=AFFECTED_SITE&show_columns_check[]=PRIORITY"
        elementStatus["GGUS"] += "&show_columns_check[]=RESPONSIBLE_UNIT&"
        elementStatus["GGUS"] += "show_columns_check[]=STATUS&show_columns_check[]=DATE_OF_CREATION&"
        elementStatus["GGUS"] += "show_columns_check[]=LAST_UPDATE&show_columns_check[]=TYPE_OF_PROBLEM&"
        elementStatus["GGUS"] += "show_columns_check[]=SUBJECT&ticket=&supportunit=all&su_hierarchy=all&"
        elementStatus["GGUS"] += "vo=all&user=&keyword=&involvedsupporter=&assignto=&"
        elementStatus["GGUS"] += "affectedsite=%s&specattrib=0&status=open&priority=all&" % gocdb_name
        elementStatus["GGUS"] += "typeofproblem=all&ticketcategory=&mouarea=&technology_provider=&"
        elementStatus["GGUS"] += "date_type=creation+date&radiotf=1&timeframe=any&from_date=&to_date=&"
        elementStatus["GGUS"] += "untouched_date=&orderticketsby=GHD_INT_REQUEST_ID&"
        elementStatus["GGUS"] += 'orderhow=descending" target="_blank"> %s tickets</a>' % gocdb_name

        convertName = {
            "CERN-PROD": "CERN",
            "INFN-T1": "CNAF",
            "FZK-LCG2": "GridKa",
            "IN2P3-CC": "IN2P3",
            "NIKHEF-ELPROD": "NIKHEF",
            "pic": "PIC",
            "RAL-LCG2": "RAL",
            "SARA-MATRIX": "SARA",
        }

        elog = convertName.get(gocdb_name, "")

        elementStatus["Elog"] = (
            '<a href="https://lblogbook.cern.ch/Operations/?Site=^'
            + elog
            + '%24&mode=summary" target="_blank">'
            + elog
            + "</a>"
        )

        return {"success": "true", "result": elementStatus, "total": len(elementStatus)}

    def _getStorages(self, requestParams: dict) -> dict:
        """Get storages"""
        if not (name := requestParams.get("name")):
            gLogger.warn("No name given")
            return {"success": "false", "error": "We need a Site Name to generate an Overview"}

        if not (result := getSEsForSite(name))["OK"]:
            return {"success": "false", "error": result["Message"]}
        storageElements = result["Value"]

        storageElementsStatus = []
        gLogger.info(f"storageElements = {storageElements}")

        # FIXME: use properly RSS
        for se in storageElements:
            result = PublisherClient().getElementStatuses("Resource", se, None, None, None, None)
            for sestatus in result["Value"]:
                storageElementsStatus.append([sestatus[0], sestatus[1], sestatus[2], sestatus[6]])

        return {"success": "true", "result": storageElementsStatus, "total": len(storageElementsStatus)}

    def _getComputingElements(self, requestParams: dict) -> dict:
        """Get computing elements"""
        if not (name := requestParams.get("name")):
            gLogger.warn("No name given")
            return {"success": "false", "error": "We need a Site Name to generate an Overview"}

        if not (result := getSiteCEMapping())["OK"]:
            return {"success": "false", "error": result["Message"]}
        computing_elements = result["Value"][name]
        computing_elements_status = []
        gLogger.info(f"computing_elements = {computing_elements}")

        for ce in computing_elements:
            result = PublisherClient().getElementStatuses("Resource", ce, None, "all", None, None)
            gLogger.info(f"cestatus = {result}")

            for cestatus in result["Value"]:
                computing_elements_status.append([cestatus[0], cestatus[1], cestatus[2], cestatus[6]])

        return {"success": "true", "result": computing_elements_status, "total": len(computing_elements_status)}

    def _getImages(self, requestParams: dict) -> dict:
        """Get images"""
        if not (name := requestParams.get("name")):
            gLogger.warn("No name given")
            return {"success": "false", "error": "We need a Site Name to generate an Overview"}

        elementStatuses = PublisherClient().getElementStatuses("Site", name, None, "all", None, None)

        if not elementStatuses["Value"]:
            gLogger.error(f'element "{name}" not found')
            return {"success": "false", "error": f'element "{name}" not found'}

        elementStatus = [dict(zip(elementStatuses["Columns"], element)) for element in elementStatuses["Value"]][0]

        plotDict1 = self.getPlotDict(
            elementStatus["Name"], "FinalMajorStatus", "RunningJobs", "Job", plotTitle="Final Minor Status of jobs"
        )
        image1 = codeRequestInFileId(plotDict1)["Value"]["plot"]

        plotDict2 = self.getPlotDict(elementStatus["Name"], "GridStatus", "NumberOfPilots", "Pilot")
        image2 = codeRequestInFileId(plotDict2)["Value"]["plot"]

        plotDict3 = self.getPlotDict(
            elementStatus["Name"], "JobType", "Job execution rate", "Job", plotTitle="Jobs execution rate by job type"
        )
        image3 = codeRequestInFileId(plotDict3)["Value"]["plot"]

        plotDict4 = self.getPlotDict(
            elementStatus["Name"], "JobSplitType", "NumberOfJobs", "WMSHistory", status="Running"
        )
        image4 = codeRequestInFileId(plotDict4)["Value"]["plot"]

        plotDict5 = self.getPlotDict(elementStatus["Name"], "Channel", "SuceededTransfers", "DataOperation")
        image5 = codeRequestInFileId(plotDict5)["Value"]["plot"]

        plotDict6 = self.getPlotDict(elementStatus["Name"], "FinalStatus", "FailedTransfers", "DataOperation")
        image6 = codeRequestInFileId(plotDict6)["Value"]["plot"]

        return {
            "success": "true",
            "result": [
                {"Type": "Accounting", "src": image1},
                {"Type": "Accounting", "src": image2},
                {"Type": "Accounting", "src": image3},
                {"Type": "Monitoring", "src": image4},
                {"Type": "Accounting", "src": image5},
                {"Type": "Accounting", "src": image6},
            ],
            "total": 6,
        }

    def getPlotDict(
        self, siteName: str, grouping: str, reportName: str, typeName: str, plotTitle: str = None, status: str = None
    ) -> dict:
        """Create pilot dictionary

        :param siteName: site name
        :param grouping: grouping
        :param reportName: report name
        :param typeName: type name
        :param plotTitle: plot title
        :param status: status
        """

        plotDict = {
            "condDict": {
                # DIRAC.AccountingSystem.Client.Types.DataOperation class use 'ExecutionSite' key instead 'Site'
                "ExecutionSite" if typeName == "DataOperation" else "Site": [siteName],
                "grouping": [grouping],
            },
            "extraArgs": {"lastSeconds": 86400},
            "grouping": grouping,
            "reportName": reportName,
            "typeName": typeName,
            "_plotTitle": plotTitle,
        }

        if plotTitle is not None:
            plotDict["extraArgs"]["plotTitle"] = plotTitle
        if status is not None:
            plotDict["condDict"]["Status"] = [status]

        return plotDict
