""" Handler for Space Occupancy web App
"""

import json

from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, asyncGen
from DIRAC import gLogger
from DIRAC.ResourceStatusSystem.Client.ResourceManagementClient import ResourceManagementClient


class SpaceOccupancyHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getSelectionData(self):
        callback = {
            "StorageElement": set(),
        }

        rmc = ResourceManagementClient()

        gLogger.info("Arguments to web_getSelectionData", repr(self.request.arguments))

        spaces = yield self.threadTask(rmc.selectSpaceTokenOccupancyCache)

        if spaces["OK"]:
            for sp in spaces["Value"]:
                callback["StorageElement"].add(sp[1])

        for key, value in callback.items():
            callback[key] = [[item] for item in list(value)]
            # callback[key].sort()
            callback[key] = [["All"]] + callback[key]

        self.finish(callback)

    @asyncGen
    def web_getSpaceOccupancyData(self):

        rmc = ResourceManagementClient()

        se = json.loads(self.get_argument("StorageElement", "null"))

        res = yield self.threadTask(rmc.selectSpaceTokenOccupancyCache, None, list(se) if se else se)

        if not res["OK"]:
            raise WErr.fromSERROR(res)

        resList = []
        for sp in res["Value"]:
            # sp is e.g. ['dips://lbtestvobox.cern.ch:9196/',
            #             'CertificationSandboxSE',
            #             0.0,
            #             76085.6171875,
            #             161137.355469,
            #             datetime.datetime(2019, 7, 15, 11, 17, 38)]
            spRes = {}
            spRes["Endpoint"] = sp[0]
            spRes["StorageElement"] = sp[1]
            spRes["LastCheckTime"] = str(sp[5])

            if sp[4]:
                spRes["Ratio"] = float("%.2f" % (sp[3] * 100 / sp[4]))
            else:
                spRes["Ratio"] = "-"

            spRes["Free"] = float("%.2f" % sp[3])
            spRes["Total"] = float("%.2f" % sp[4])
            spRes["Guaranteed"] = float("%.2f" % sp[2])

            # FIXME: call here SpaceTokenOccupancyPolicy and avoid hardcoding twice

            if sp[4] == 0:
                spRes["Status"] = "Unknown"
            elif sp[3] < 0.1:
                spRes["Status"] = "Banned"
            elif sp[3] < 5:
                spRes["Status"] = "Degraded"
            else:
                spRes["Status"] = "Active"

            resList.append(spRes)

        self.finish({"success": "true", "result": resList, "total": len(res["Value"])})
