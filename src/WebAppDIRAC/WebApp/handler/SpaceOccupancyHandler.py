""" Handler for Space Occupancy web App
"""

import json

from DIRAC import gLogger
from DIRAC.ResourceStatusSystem.Client.ResourceManagementClient import ResourceManagementClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr


class SpaceOccupancyHandler(WebHandler):
    DEFAULT_AUTHORIZATION = "authenticated"

    def initializeRequest(self):
        self.rmc = ResourceManagementClient()

    def web_getSelectionData(self, **kwargs):
        callback = {
            "StorageElement": set(),
        }

        gLogger.info("Arguments to web_getSelectionData", kwargs)

        if (result := self.rmc.selectSpaceTokenOccupancyCache())["OK"]:
            for space in result["Value"]:
                callback["StorageElement"].add(space[1])

        for key, value in callback.items():
            callback[key] = [[item] for item in list(value)]
            # callback[key].sort()
            callback[key] = [["All"]] + callback[key]

        return callback

    def web_getSpaceOccupancyData(self, StorageElement="null"):
        se = json.loads(StorageElement)

        result = self.rmc.selectSpaceTokenOccupancyCache(None, list(se) if se else se)
        if not result["OK"]:
            raise WErr.fromSERROR(result)

        resList = []
        for sp in result["Value"]:
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
                spRes["Ratio"] = float(f"{sp[3] * 100 / sp[4]:.2f}")
            else:
                spRes["Ratio"] = "-"

            spRes["Free"] = float(f"{sp[3]:.2f}")
            spRes["Total"] = float(f"{sp[4]:.2f}")
            spRes["Guaranteed"] = float(f"{sp[2]:.2f}")

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

        self.finish({"success": "true", "result": resList, "total": len(result["Value"])})
