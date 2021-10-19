""" WebApp handler for Downtimes WebApp
"""

import json
from datetime import datetime

import tornado
from DIRAC import gLogger
from DIRAC.ResourceStatusSystem.Client.PublisherClient import PublisherClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, asyncGen


class DowntimesHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getSelectionData(self):
        callback = {"name": set(), "severity": set(), "sites": set()}

        gLogger.info("web_getSelectionData arguments", repr(self.request.arguments))

        downtimes = yield self.threadTask(PublisherClient().getCachedDowntimes, None, None, None, None)

        if downtimes["OK"]:

            dtList = [dict(zip(downtimes["Columns"], dt)) for dt in downtimes["Value"]]

            for dt in dtList:

                callback["name"].add(dt["Name"])
                callback["severity"].add(dt["Severity"])

        sites = yield self.threadTask(PublisherClient().getSites)
        if sites["OK"]:

            callback["site"] = sites["Value"]

        for key, value in callback.items():

            callback[key] = [[item] for item in list(value)]
            # callback[key].sort()
            callback[key] = [["All"]] + callback[key]

        callback["view"] = [["tabular"], ["availability"]]

        self.finish(callback)

    @asyncGen
    def web_getDowntimesData(self):
        requestParams = self.__requestParams()
        gLogger.info(requestParams)

        retVal = yield self.threadTask(PublisherClient().getSitesResources, list(requestParams["site"]))

        sitesResources = ""
        if not retVal["OK"]:
            raise WErr.fromSERROR(retVal)
        else:
            sitesResources = retVal["Value"]

        names = []
        if requestParams["site"]:

            if names is None:
                names = []

            for _site, resources in sitesResources.items():

                names += resources["ces"]
                names += resources["ses"]

        downtimes = PublisherClient().getCachedDowntimes(None, None, names, list(requestParams["severity"]))
        if not downtimes["OK"]:
            raise WErr.fromSERROR(downtimes)

        dtList = [dict(zip(downtimes["Columns"], dt)) for dt in downtimes["Value"]]

        for dt in dtList:

            dt["Site"] = "Unknown"

            for site, resources in sitesResources.items():
                if dt["Name"] in resources["ces"] + resources["ses"]:
                    dt["Site"] = site
                    break

            dt["StartDate"] = str(dt["StartDate"])
            dt["EndDate"] = str(dt["EndDate"])

        self.finish({"success": "true", "result": dtList, "total": len(dtList)})

    def __requestParams(self):
        """
        We receive the request and we parse it, in this case, we are doing nothing,
        but it can be certainly more complex.
        """
        gLogger.always("!!!  PARAMS: ", repr(self.request.arguments))

        responseParams = {"name": [], "severity": [], "site": []}

        for key in responseParams:
            if self.get_argument(key, None):
                responseParams[key] = list(json.loads(self.get_argument(key)))

        try:
            startDate = "%s %s" % (self.get_argument("startDate"), self.get_argument("startTime"))
            startDate = datetime.strptime(startDate, "%Y-%m-%d %H:%M")
        except (tornado.web.MissingArgumentError, ValueError):
            startDate = datetime.utcnow()
        responseParams["startDate"] = startDate

        try:
            endDate = "%s %s" % (self.get_argument("endDate"), self.get_argument("endTime"))
            endDate = datetime.strptime(endDate, "%Y-%m-%d %H:%M")
        except (tornado.web.MissingArgumentError, ValueError):
            endDate = datetime.utcnow()
        responseParams["endDate"] = endDate

        return responseParams
