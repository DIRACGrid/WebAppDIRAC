import json
from diraccfg import CFG

from WebAppDIRAC.Lib.WebHandler import WebSocketHandler
from DIRAC.ConfigurationSystem.Client.ConfigurationClient import ConfigurationClient
from DIRAC import gConfig, gLogger
from DIRAC.ConfigurationSystem.private.Modificator import Modificator


class RegistryManagerHandler(WebSocketHandler):
    DEFAULT_AUTHORIZATION = "authenticated"

    def on_open(self):
        self.__configData = {}

    def _on_message(self, msg):
        self.log.info(f"RECEIVED {msg}")
        try:
            params = json.loads(msg)
        except Exception:
            gLogger.exception("No op defined")

        res = False
        if params["op"] == "init":
            res = self.__getRemoteConfiguration("init")
        elif params["op"] == "getData":
            res = self.__getData(params)
        elif params["op"] == "deleteItem":
            res = self.__deleteItem(params)
        elif params["op"] == "addItem":
            res = self.__addItem(params)
        elif params["op"] == "editItem":
            res = self.__editItem(params)
        elif params["op"] == "resetConfiguration":
            res = self.__getRemoteConfiguration("resetConfiguration")
        elif params["op"] == "commitChanges":
            res = self.__commitChanges()
        elif params["op"] == "getGroupList":
            res = self.__getGroupList()
        elif params["op"] == "getRegistryProperties":
            res = self.__getRegistryProperties()
        elif params["op"] == "saveRegistryProperties":
            res = self.__saveRegistryProperties(params)
        elif params["op"] == "getVomsMapping":
            res = self.__getVomsMapping()
        elif params["op"] == "saveVomsMapping":
            res = self.__saveVomsMapping(params)

        if res:
            self.write_message(res)

    def __getRemoteConfiguration(self, funcName):
        rpcClient = ConfigurationClient(
            url=gConfig.getValue("/DIRAC/Configuration/MasterServer", "Configuration/Server")
        )

        if not (modCfg := Modificator(rpcClient)).loadFromRemote()["OK"]:
            return {"success": 0, "op": "getSubnodes", "message": "The configuration cannot be read from the remote !"}

        self.__configData["cfgData"] = modCfg
        self.__configData["strCfgData"] = str(modCfg)

        version = str(modCfg.getCFG()["DIRAC"]["Configuration"]["Version"])  # pylint: disable=unsubscriptable-object
        configName = str(modCfg.getCFG()["DIRAC"]["Configuration"]["Name"])  # pylint: disable=unsubscriptable-object
        return {"success": 1, "op": funcName, "version": version, "name": configName}

    def __getData(self, params):
        data = []
        if params["type"] == "users":
            sectionCfg = self.getSectionCfg("/Registry/Users")

            for username in sectionCfg.listAll():
                item = {}
                item["name"] = username
                props = sectionCfg[username]

                item["dn"] = self.getIfExists("DN", props)
                item["ca"] = self.getIfExists("CA", props)
                item["email"] = self.getIfExists("Email", props)

                data.append(item)

        elif params["type"] == "groups":
            sectionCfg = self.getSectionCfg("/Registry/Groups")

            for group in sectionCfg.listAll():
                item = {}
                item["name"] = group
                props = sectionCfg[group]

                item["users"] = self.getIfExists("Users", props)
                item["properties"] = self.getIfExists("Properties", props)
                item["vomsrole"] = self.getIfExists("VOMSRole", props)

                item["autouploadproxy"] = self.getIfExists("AutoUploadProxy", props)
                item["autouploadpilotproxy"] = self.getIfExists("AutoUploadPilotProxy", props)
                item["autoaddvoms"] = self.getIfExists("AutoAddVOMS", props)
                item["jobshare"] = self.getIfExists("JobShare", props)

                data.append(item)

        elif params["type"] == "hosts":
            sectionCfg = self.getSectionCfg("/Registry/Hosts")

            for host in sectionCfg.listAll():
                item = {}
                item["name"] = host
                props = sectionCfg[host]

                item["dn"] = self.getIfExists("DN", props)
                item["properties"] = self.getIfExists("Properties", props)

                data.append(item)

        elif params["type"] == "voms":
            sectionCfg = self.getSectionCfg("/Registry/VOMS/Servers")

            for host in sectionCfg.listAll():
                item = {}
                item["name"] = host

                data.append(item)

        elif params["type"] == "servers":
            sectionCfg = self.getSectionCfg("/Registry/VOMS/Servers/" + params["vom"])

            for serv in sectionCfg.listAll():
                item = {}
                item["name"] = serv
                props = sectionCfg[serv]

                item["dn"] = self.getIfExists("DN", props)
                item["ca"] = self.getIfExists("CA", props)
                item["port"] = self.getIfExists("Port", props)

                data.append(item)

        return {"op": "getData", "success": 1, "type": params["type"], "data": data}

    def __getGroupList(self):
        data = []

        sectionCfg = self.getSectionCfg("/Registry/Groups")

        for group in sectionCfg.listAll():
            data.append([group])

        return {"op": "getGroupList", "success": 1, "data": data}

    def __getVomsMapping(self):
        data = []

        sectionCfg = self.getSectionCfg("/Registry/VOMS/Mapping")

        for mapping in sectionCfg.listAll():
            data.append({"name": mapping, "value": sectionCfg[mapping]})

        return {"op": "getVomsMapping", "success": 1, "data": data}

    def __getRegistryProperties(self):
        sectionCfg = self.getSectionCfg("/Registry")

        data = {}
        for entryName in sectionCfg.listAll():
            if not sectionCfg.isSection(entryName):
                data[entryName] = sectionCfg[entryName]

        return {"op": "getRegistryProperties", "success": 1, "data": data}

    def getSectionCfg(self, sectionPath):
        sectionCfg = None
        try:
            sectionCfg = self.__configData["cfgData"].getCFG()
            for section in [section for section in sectionPath.split("/") if not section.strip() == ""]:
                sectionCfg = sectionCfg[section]
        except Exception as v:
            return False
        return sectionCfg

    def getIfExists(self, elem, propsList):
        if elem in propsList.listAll():
            return propsList[elem]
        return ""

    def __addItem(self, params):
        sectionPath = "/Registry/"
        configText = ""
        params = {k: str(v).strip() if v else v for k, v in params.items()}
        if params["type"] == "users":
            sectionPath = sectionPath + "Users"
            if params["dn"]:
                configText = "DN = " + params["dn"] + "\n"

            if params["ca"]:
                configText = configText + "CA = " + params["ca"] + "\n"

            if params["email"]:
                configText = configText + "Email = " + params["email"]

        elif params["type"] == "groups":
            sectionPath = sectionPath + "Groups"
            if params["users"]:
                configText = "Users = " + params["users"] + "\n"

            if params["properties"]:
                configText = configText + "Properties = " + params["properties"] + "\n"

            if params["jobshare"]:
                configText = configText + "JobShare = " + params["jobshare"] + "\n"

            if params["autouploadproxy"]:
                configText = configText + "AutoUploadProxy = " + params["autouploadproxy"] + "\n"

            if params["autouploadpilotproxy"]:
                configText = configText + "AutoUploadPilotProxy = " + params["autouploadpilotproxy"] + "\n"

            if params["autoaddvoms"]:
                configText = configText + "AutoAddVOMS = " + params["autoaddvoms"]

        elif params["type"] == "hosts":
            sectionPath = sectionPath + "Hosts"
            if params["dn"]:
                configText = "DN = " + params["dn"] + "\n"

            if params["properties"]:
                configText = configText + "Properties = " + params["properties"]

        elif params["type"] == "voms":
            sectionPath = sectionPath + "VOMS/Servers"

        elif params["type"] == "servers":
            sectionPath = sectionPath + "VOMS/Servers/" + params["vom"]
            if params["dn"]:
                configText = "DN = " + params["dn"] + "\n"

            if params["port"]:
                configText = configText + "Port = " + params["port"] + "\n"

            if params["ca"]:
                configText = configText + "CA = " + params["ca"]

        sectionPath = sectionPath + "/" + params["name"]

        if self.__configData["cfgData"].createSection(sectionPath):
            cfgData = self.__configData["cfgData"].getCFG()
            newCFG = CFG()
            newCFG.loadFromBuffer(configText)
            self.__configData["cfgData"].mergeSectionFromCFG(sectionPath, newCFG)
            return {"success": 1, "op": "addItem"}
        return {"success": 0, "op": "addItem", "message": "Section can't be created. It already exists?"}

    def __editItem(self, params):
        ret = self.__deleteItem(params)
        if ret["success"] == 1:
            ret = self.__addItem(params)
            ret["op"] = "editItem"
            return ret
        ret["op"] = "editItem"
        return ret

        sectionPath = "/Registry/"
        configText = ""
        params = {k: str(v).strip() if v else v for k, v in params.items()}
        if params["type"] == "users":
            sectionPath = sectionPath + "Users"
            if params["dn"]:
                configText = "DN = " + params["dn"] + "\n"

            if params["ca"]:
                configText = configText + "CA = " + params["ca"] + "\n"

            if params["email"]:
                configText = configText + "Email = " + params["email"]

        elif params["type"] == "groups":
            sectionPath = sectionPath + "Groups"
            if params["users"]:
                configText = "Users = " + params["users"] + "\n"

            if params["properties"]:
                configText = configText + "Properties = " + params["properties"] + "\n"

            if params["jobshare"]:
                configText = configText + "JobShare = " + params["jobshare"] + "\n"

            if params["autouploadproxy"]:
                configText = configText + "AutoUploadProxy = " + params["autouploadproxy"] + "\n"

            if params["autouploadpilotproxy"]:
                configText = configText + "AutoUploadPilotProxy = " + params["autouploadpilotproxy"] + "\n"

            if params["autoaddvoms"]:
                configText = configText + "AutoAddVOMS = " + params["autoaddvoms"]

        elif params["type"] == "hosts":
            sectionPath = sectionPath + "Hosts"
            if params["dn"]:
                configText = "DN = " + params["dn"] + "\n"

            if params["properties"]:
                configText = configText + "Properties = " + params["properties"]

        sectionPath = sectionPath + "/" + params["name"]

        #   deleting the options underneath
        sectionCfg = self.getSectionCfg(sectionPath)

        for opt in sectionCfg.listAll():
            self.__configData["cfgData"].removeOption(sectionPath + "/" + opt)

        newCFG = CFG()
        newCFG.loadFromBuffer(configText)
        self.__configData["cfgData"].mergeSectionFromCFG(sectionPath, newCFG)
        return {"success": 1, "op": "editItem"}

    def __deleteItem(self, params):
        sectionPath = "/Registry/"

        if params["type"] == "users":
            sectionPath = sectionPath + "Users"
        elif params["type"] == "groups":
            sectionPath = sectionPath + "Groups"
        elif params["type"] == "hosts":
            sectionPath = sectionPath + "Hosts"
        elif params["type"] == "voms":
            sectionPath = sectionPath + "VOMS/Servers"
        elif params["type"] == "servers":
            sectionPath = sectionPath + "VOMS/Servers/" + params["vom"]

        sectionPath += "/" + params["name"]
        if self.__configData["cfgData"].removeOption(sectionPath) or self.__configData["cfgData"].removeSection(
            sectionPath
        ):
            return {"success": 1, "op": "deleteItem"}
        return {"success": 0, "op": "deleteItem", "message": "Entity doesn't exist"}

    def __commitChanges(self):
        if "CSAdministrator" not in self.getProperties():
            return {"success": 0, "op": "commitChanges", "message": "You are not authorized to commit changes!!"}
        gLogger.always(f"User {self.getUserDN()} is commiting a new configuration version")
        if not (retDict := self.__configData["cfgData"].commit())["OK"]:
            return {"success": 0, "op": "commitChanges", "message": retDict["Message"]}
        return {"success": 1, "op": "commitChanges"}

    def __saveRegistryProperties(self, params):
        sectionCfg = self.getSectionCfg(sectionPath := "/Registry")

        for opt in sectionCfg.listAll():
            if not sectionCfg.isSection(opt):
                self.__configData["cfgData"].removeOption(sectionPath + "/" + opt)

        configText = ""

        for newOpt in params:
            if newOpt != "op":
                if configText == "":
                    configText = newOpt + "=" + params[newOpt] + "\n"
                else:
                    configText = configText + newOpt + "=" + params[newOpt] + "\n"

        newCFG = CFG()
        newCFG.loadFromBuffer(configText)
        self.__configData["cfgData"].mergeSectionFromCFG(sectionPath, newCFG)

        return {"op": "saveRegistryProperties", "success": 1}

    def __saveVomsMapping(self, params):
        sectionCfg = self.getSectionCfg(sectionPath := "/Registry/VOMS/Mapping")

        for opt in sectionCfg.listAll():
            if not sectionCfg.isSection(opt):
                self.__configData["cfgData"].removeOption(sectionPath + "/" + opt)

        configText = ""

        for newOpt in params:
            if newOpt != "op":
                if configText == "":
                    configText = newOpt + "=" + params[newOpt] + "\n"
                else:
                    configText = configText + newOpt + "=" + params[newOpt] + "\n"

        newCFG = CFG()
        newCFG.loadFromBuffer(configText)
        self.__configData["cfgData"].mergeSectionFromCFG(sectionPath, newCFG)

        return {"op": "saveVomsMapping", "success": 1}
