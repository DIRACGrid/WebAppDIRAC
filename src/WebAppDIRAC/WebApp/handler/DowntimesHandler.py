""" WebApp handler for Downtimes WebApp
"""

import json
from datetime import datetime

from DIRAC import gLogger
from DIRAC.ResourceStatusSystem.Client.PublisherClient import PublisherClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr


class DowntimesHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    # Publisher client
    pubClient = None

    @classmethod
    def initializeHandler(cls, serviceInfo):
        """This may be overwritten when you write a DIRAC service handler
        And it must be a class method. This method is called only one time,
        at the first request

        :param dict serviceInfo: infos about services
        """
        cls.pubClient = PublisherClient()

    def web_getSelectionData(self):
        """Get selection data

        :return: dict
        """
        callback = {"name": set(), "severity": set(), "sites": set()}

        downtimes = self.pubClient.getCachedDowntimes(None, None, None, None)

        if downtimes["OK"]:
            dtList = [dict(zip(downtimes["Columns"], dt)) for dt in downtimes["Value"]]

            for dt in dtList:
                callback["name"].add(dt["Name"])
                callback["severity"].add(dt["Severity"])

        sites = self.pubClient.getSites()
        if sites["OK"]:
            callback["site"] = sites["Value"]

        for key, value in callback.items():
            callback[key] = [[item] for item in list(value)]
            callback[key] = [["All"]] + callback[key]

        callback["view"] = [["tabular"], ["availability"]]
        return callback

    def web_getDowntimesData(
        self, name=None, severity=None, site=None, startDate=None, startTime=None, endDate=None, endTime=None
    ):
        """Get downtimes data

        :param str name: name
        :param str severity: severity
        :param str site: site
        :param str startDate: start date
        :param str startTime: start time
        :param str endDate: end date
        :param str endTime: end time

        :return: dict
        """
        requestParams = {
            "name": list(json.loads(name)) if name else [],
            "site": list(json.loads(site)) if site else [],
            "severity": list(json.loads(severity)) if severity else [],
        }

        requestParams["startDate"] = datetime.utcnow()
        if startDate and startTime:
            requestParams["startDate"] = datetime.strptime("%s %s" % (startDate, startTime), "%Y-%m-%d %H:%M")

        requestParams["endDate"] = datetime.utcnow()
        if endDate and endTime:
            requestParams["endDate"] = datetime.strptime("%s %s" % (endDate, endTime), "%Y-%m-%d %H:%M")

        gLogger.info("Request parameters:", requestParams)

        retVal = self.pubClient.getSitesResources(requestParams["site"])

        if not retVal["OK"]:
            raise WErr.fromSERROR(retVal)
        sitesResources = retVal["Value"]

        names = []
        if requestParams["site"]:
            for _site, resources in list(sitesResources.items()):
                names += resources["ces"]
                names += resources["ses"]

        downtimes = self.pubClient.getCachedDowntimes(None, None, names, requestParams["severity"])
        if not downtimes["OK"]:
            raise WErr.fromSERROR(downtimes)

        dtList = [dict(zip(downtimes["Columns"], dt)) for dt in downtimes["Value"]]

        for dt in dtList:
            dt["Site"] = "Unknown"

            for site, resources in list(sitesResources.items()):
                if dt["Name"] in resources["ces"] + resources["ses"]:
                    dt["Site"] = site
                    break

            dt["StartDate"] = str(dt["StartDate"])
            dt["EndDate"] = str(dt["EndDate"])

        return {"success": "true", "result": dtList, "total": len(dtList)}
