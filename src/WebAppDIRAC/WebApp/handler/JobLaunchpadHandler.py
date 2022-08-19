import pprint
import tempfile

from DIRAC import gConfig, gLogger
from DIRAC.Resources.Catalog.FileCatalog import FileCatalog
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getVOForGroup
from DIRAC.ConfigurationSystem.Client.Helpers.Operations import Operations
from DIRAC.FrameworkSystem.Client.ProxyManagerClient import ProxyManagerClient
from DIRAC.WorkloadManagementSystem.Client.WMSClient import WMSClient

from WebAppDIRAC.Lib.WebHandler import WebHandler


class JobLaunchpadHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"
    defaultParams = {
        "JobName": [1, "DIRAC"],
        "Executable": [1, "/bin/ls"],
        "Arguments": [1, "-ltrA"],
        "OutputSandbox": [1, "std.out, std.err"],
        "JobGroup": [0, "Unknown"],
        "InputData": [0, ""],
        "OutputData": [0, ""],
        "OutputSE": [0, "DIRAC-USER"],
        "OutputPath": [0, ""],
        "CPUTime": [0, "86400"],
        "Site": [0, ""],
        "BannedSite": [0, ""],
        "Platform": [0, "Linux_x86_64_glibc-2.12"],
        "Priority": [0, "5"],
        "StdError": [0, "std.err"],
        "StdOutput": [0, "std.out"],
        "Parameters": [0, "0"],
        "ParameterStart": [0, "0"],
        "ParameterStep": [0, "1"],
        "ParameterFactor": [0, "0"],
    }

    def initializeRequest(self):
        for opt, value in (self.getAppSettings().get("Options") or {}).items():
            self.defaultParams[opt] = value.replace(", ", ",").split(",")
        self.user = self.getUserName()
        self.group = self.getUserGroup()
        self.vo = getVOForGroup(self.group)

    def web_getProxyStatus(self):
        return self.__getProxyStatus()

    def __getProxyStatus(self):

        proxyManager = ProxyManagerClient()

        group = self.getUserGroup()

        if group == "visitor":
            return {"success": "false", "error": "User is anonymous or is not registered in the system"}

        userDN = self.getUserDN()

        defaultSeconds = 24 * 3600 + 60  # 24H + 1min
        validSeconds = gConfig.getValue("/Registry/DefaultProxyLifeTime", defaultSeconds)

        gLogger.info(f"\033[0;31m userHasProxy({userDN}, {group}, {validSeconds}) \033[0m")

        if (result := proxyManager.userHasProxy(userDN, group, validSeconds))["OK"]:
            return {"success": "true", "result": "true" if result["Value"] else "false"}
        return {"success": "false", "error": "false"}

    def web_getLaunchpadSetupWithLFNs(self):
        """Method obtain launchpad setup with pre-selected LFNs as input data parameter,
        the caller js client will use setup to open an new Launchpad
        """
        # On the fly file catalog for advanced launchpad
        if not hasattr(self, "fc"):
            group = self.getUserGroup()
            vo = getVOForGroup(group)
            self.fc = FileCatalog(vo=vo)

        self.set_header("Content-type", "text/plain")
        gLogger.always("submit: incoming arguments to getLaunchpadSetupWithLFNs", repr(self.request.arguments))
        lfnList = self.get_argument("path").split(",")

        ptlfn = ""
        for lfn in lfnList:
            ptlfn += (", " + lfn) if ptlfn else lfn

        params = self.defaultParams.copy()
        params["InputData"] = [1, ptlfn]

        obj = Operations(vo=vo)
        predefinedSets = {}
        launchpadSections = obj.getSections("Launchpad")
        if launchpadSections["OK"]:
            for section in launchpadSections["Value"]:
                predefinedSets[section] = {}
                sectionOptions = obj.getOptionsDict("Launchpad/" + section)
                pprint.pprint(sectionOptions)
                if sectionOptions["OK"]:
                    predefinedSets[section] = sectionOptions["Value"]

        return {"success": "true", "result": params, "predefinedSets": predefinedSets}

    def web_getLaunchpadOpts(self):
        """Reading of the predefined sets of launchpad parameters values"""
        obj = Operations(vo=self.vo)
        predefinedSets = {}
        launchpadSections = obj.getSections("Launchpad")
        if launchpadSections["OK"]:
            for section in obj.getValue("Launchpad/ApplicationList", launchpadSections["Value"]):
                predefinedSets[section] = {}
                sectionOptions = obj.getOptionsDict("Launchpad/" + section)
                pprint.pprint(sectionOptions)
                if sectionOptions["OK"]:
                    predefinedSets[section] = sectionOptions["Value"]
        return {"success": "true", "result": self.defaultParams, "predefinedSets": predefinedSets}

    def web_jobSubmit(self):
        # self.set_header('Content-type', "text/html")  # Otherwise the browser would offer you to download a JobSubmit file
        if "NormalUser" not in self.getProperties():
            return {"success": "false", "error": "You are not allowed to run the jobs"}
        proxy = self.__getProxyStatus()
        if proxy["success"] == "false" or proxy["result"] == "false":
            return {"success": "false", "error": "You can not run a job: your proxy is valid less then 24 hours"}

        jdl = ""
        lfns = []
        params = {}
        for tmp in self.request.arguments:
            value = self.get_argument(tmp)
            if value:
                if tmp.startswith("lfnField"):
                    lfns.append("LFN:" + value)
                else:
                    params[tmp] = value

        for item in params:
            if item == "OutputSandbox":
                jdl += str(item) + " = {" + str(params[item]) + "};"
            if item == "Parameters":
                try:
                    parameters = int(params[item])
                    jdl += str(item) + ' = "' + str(parameters) + '";'
                except Exception:
                    parameters = str(params[item])
                    if parameters.find("{") >= 0 and parameters.find("}") >= 0:
                        parameters = parameters.rstrip("}")
                        parameters = parameters.lstrip("{")
                        if len(parameters) > 0:
                            jdl += str(item) + " = {" + parameters + "};"
                        else:
                            return {"success": "false", "error": "Parameters vector has zero length"}
                    else:
                        return {
                            "success": "false",
                            "error": "Parameters must be an integer or a vector. Example: 4 or {1,2,3,4}",
                        }
            else:
                jdl += str(item) + ' = "' + str(params[item]) + '";'

        store = []
        for key in self.request.files:
            try:
                if self.request.files[key][0].filename:
                    gLogger.info("\033[0;31m file - %s \033[0m " % self.request.files[key][0].filename)
                    store.append(self.request.files[key][0])
            except Exception:
                pass

        gLogger.info("\033[0;31m *** %s \033[0m " % params)

        clearFS = False  # Clear directory flag
        fileNameList = []
        exception_counter = 0
        callback = {}

        if len(store) > 0:  # If there is a file(s) in sandbox
            clearFS = True
            import shutil
            import os

            storePath = tempfile.mkdtemp(prefix="DIRAC_")
            try:
                for fileObj in store:
                    name = os.path.join(storePath, fileObj.filename.lstrip(os.sep))

                    tFile = open(name, "w")
                    tFile.write(fileObj.body)
                    tFile.close()

                    fileNameList.append(name)
            except Exception as x:
                exception_counter = 1
                callback = {
                    "success": "false",
                    "error": "An EXCEPTION happens during saving your sandbox file(s): %s" % str(x),
                }

        sndBox = ""
        if ((len(fileNameList) > 0) or (len(lfns) > 0)) and exception_counter == 0:
            sndBox = 'InputSandbox = {"' + '","'.join(fileNameList + lfns) + '"};'

        if exception_counter == 0:
            jdl += sndBox
            jobManager = WMSClient(useCertificates=True, timeout=1800)
            jdl = str(jdl)
            gLogger.info("J D L : ", jdl)
            try:
                result = jobManager.submitJob(jdl)
                if result["OK"]:
                    callback = {"success": "true", "result": result["Value"]}
                else:
                    callback = {"success": "false", "error": result["Message"]}
            except Exception as x:
                callback = {"success": "false", "error": "An EXCEPTION happens during job submittion: %s" % str(x)}
        if clearFS:
            shutil.rmtree(storePath)
        return callback
