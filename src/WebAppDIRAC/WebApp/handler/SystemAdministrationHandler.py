""" Handler for SystemAdministration WebApp
"""

import json

from DIRAC import gConfig, gLogger, S_ERROR
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.FrameworkSystem.Client.NotificationClient import NotificationClient
from DIRAC.FrameworkSystem.Client.SystemAdministratorClient import SystemAdministratorClient
from DIRAC.FrameworkSystem.Client.ComponentMonitoringClient import ComponentMonitoringClient

from WebAppDIRAC.Lib.WebHandler import WebHandler


class SystemAdministrationHandler(WebHandler):
    DEFAULT_AUTHORIZATION = "authenticated"

    def web_getSysInfo(self):
        """Provide information about hosts state from database"""
        client = ComponentMonitoringClient(delegatedDN=self.getUserDN(), delegatedGroup=self.getUserGroup())
        if not (result := client.getLogs())["OK"] or not len(callback := result["Value"]) > 0:
            return {"success": "false", "error": result.get("Message", "No system information found")}

        # Add the information about the extensions' versions, if available, to display along with the DIRAC version
        for _i, cb in enumerate(callback):
            cb["Host"] = cb["HostName"]
            cb["Timestamp"] = str(cb.get("Timestamp", "unknown"))
            # We have to keep the backward compatibility (this can heppen when we do not update one host to v6r15 ...
            cb["DIRAC"] = "{},{}".format(
                cb.get("DIRACVersion", cb.get("DIRAC", "")),
                cb.get("Extension", cb.get("Extensions", "")),
            )

        return {"success": "true", "result": sorted(callback, key=lambda i: i["Host"]), "total": len(callback)}

    def web_getHostData(self, hostname=None):
        """
        Returns flatten list of components (services, agents) installed on hosts
        returned by getHosts function
        """
        callback = list()

        if not hostname:
            return {"success": "true", "result": callback}

        client = SystemAdministratorClient(
            hostname, None, delegatedDN=self.getUserDN(), delegatedGroup=self.getUserGroup()
        )
        result = client.getOverallStatus()
        gLogger.debug(f"Result of getOverallStatus(): {result}")

        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}

        overall = result["Value"]

        for record in self.flatten(overall):
            record["Host"] = hostname
            callback.append(record)

        return {"success": "true", "result": callback}

    def flatten(self, dataDict):
        """
        Flatten dict of dicts structure returned by getOverallStatus() method of
        SystemAdministrator client
        """
        for kind, a in dataDict.items():
            for system, b in a.items():
                for name, c in b.items():
                    if "Installed" in c and c["Installed"]:
                        c["Type"] = kind
                        c["System"] = system
                        c["Name"] = name
                        yield c

    def web_getHostErrors(self, host):
        if not host:
            return {"success": "false", "error": "Name of the host is missing or not defined"}

        client = SystemAdministratorClient(host, None, delegatedDN=self.getUserDN(), delegatedGroup=self.getUserGroup())

        result = client.checkComponentLog("*")

        gLogger.debug(result)
        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}
        data = result["Value"]

        callback = list()
        for key, value in data.items():
            system, component = key.split("/")
            value["System"] = system
            value["Name"] = component
            value["Host"] = host
            callback.append(value)

        return {"success": "true", "result": callback, "total": len(callback)}

    def web_getHostLog(self, host=None, system=None, component=None):
        if not host:
            return {"success": "false", "error": "Name of the host is missing or not defined"}
        if not system:
            return {"success": "false", "error": "Name of the system is missing or not defined"}
        if not component:
            return {"success": "false", "error": "Name of component is missing or not defined"}

        client = SystemAdministratorClient(host, None, delegatedDN=self.getUserDN(), delegatedGroup=self.getUserGroup())

        gLogger.debug(result := client.getLogTail(system, component))

        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}

        data = result["Value"]

        key = system + "_" + component
        if key not in data:
            return {"success": "false", "error": f"{key} key is absent in service response"}

        log = data[key]

        return {"success": "true", "result": log.replace("\n", "<br>")}

    def web_hostAction(self, host=None, action=None, version=None):
        """
        Restart all DIRAC components on a given host
        """

        if not host:
            return {"success": "false", "error": "No hostname defined"}

        if not action:
            return {"success": "false", "error": "No action defined"}

        actionSuccess = list()
        actionFailed = list()

        for _host in host.split(","):
            client = SystemAdministratorClient(
                str(_host), None, delegatedDN=self.getUserDN(), delegatedGroup=self.getUserGroup()
            )
            if action == "restart":
                result = client.restartComponent("*", "*")
            elif action == "revert":
                result = client.revertSoftware()
            elif action == "update":
                result = client.updateSoftware(version, timeout=600)
            else:
                actionFailed.append(error := f"{_host}: Action {action} is not defined")
                continue

            gLogger.always(result)

            if not result["OK"]:
                if result["Message"].find("Unexpected EOF") > 0:
                    msg = f"Signal 'Unexpected EOF' received: {result['Message']}. Most likely DIRAC components"
                    msg += _host + ": " + msg + " were successfully restarted."
                    actionSuccess.append(msg)
                    continue
                actionFailed.append(error := f"{_host}: {result['Message']}")
                gLogger.error(error)
            else:
                gLogger.info(result["Value"])
                actionSuccess.append(host)

        return self.aftermath(actionSuccess, actionFailed, action, "Host")

    def web_componentAction(self, action=None, **kwargs):
        """
        Actions which should be done on components. The only parameters is an action
        to perform.
        Returns standard JSON response structure with with service response
        or error messages
        """
        if not (action and (len(action) > 0)):
            return {"success": "false", "error": "No action defined"}

        if action not in ["restart", "start", "stop"]:
            gLogger.debug(error := f"The request parameters action '{action}' is unknown")
            return {"success": "false", "error": error}

        result = dict()
        for i, system in kwargs.items():
            if len(target := i.split("@")) == 2:
                gLogger.always(f"System: {system}")
                gLogger.always(f"Host: {(host := target[1])}")
                gLogger.always(f"Component: {(component := target[0])}")
                if host not in result:
                    result[host] = list()
                result[host].append([system, component])

        if not result:
            gLogger.debug(error := f"Failed to get component(s) for {action}")
            return {"success": "false", "error": error}

        gLogger.always(result)
        actionSuccess = list()
        actionFailed = list()

        for hostname in result:
            if not result[hostname]:
                continue

            client = SystemAdministratorClient(
                hostname, None, delegatedDN=self.getUserDN(), delegatedGroup=self.getUserGroup()
            )

            for i in result[hostname]:
                system = i[0]
                component = i[1]
                try:
                    if action == "restart":
                        result = client.restartComponent(system, component)
                    elif action == "start":
                        result = client.startComponent(system, component)
                    elif action == "stop":
                        result = client.stopComponent(system, component)
                    else:
                        result = S_ERROR(f"Action {action} is not valid")
                except Exception as x:
                    result = S_ERROR("Exception: {e}")
                gLogger.debug(f"Result: {result}")

                if not result["OK"]:
                    actionFailed.append(error := f"{hostname}: {result['Message']}")
                    gLogger.error(f"Failure during component {action}: {error}")
                else:
                    gLogger.always(f"Successfully {action} component {component}")
                    actionSuccess.append(component)

        return self.aftermath(actionSuccess, actionFailed, action, "Component")

    def aftermath(self, actionSuccess, actionFailed, action, prefix):
        success = ", ".join(actionSuccess)
        failure = "\n".join(actionFailed)

        sText = prefix
        if len(actionSuccess) > 1:
            sText += "s"

        fText = prefix
        if len(actionFailed) > 1:
            fText += "s"

        if success and failure:
            sMessage = f"{sText} {action}ed successfully: {success}"
            fMessage = f"Failed to {action} {fText}:\n{failure}"
            return {"success": "true", "result": sMessage + "\n\n" + fMessage}
        elif success and len(failure) < 1:
            return {"success": "true", "result": f"{sText} {action}ed successfully: {success}"}
        elif len(success) < 1 and failure:
            gLogger.always(error := f"Failed to {action} {fText}:\n{failure}")
            return {"success": "false", "error": error}

        gLogger.debug(error := "No action has performed due technical failure. Check the logs please")
        return {"success": "false", "error": error}

    def web_getUsersGroups(self):
        if not (result := gConfig.getSections("/Registry/Users"))["OK"]:
            return {"success": "false", "error": result["Message"]}
        users = [[x] for x in result["Value"]]

        if not (result := gConfig.getSections("/Registry/Groups"))["OK"]:
            return {"success": "false", "error": result["Message"]}
        groups = [[x] for x in result["Value"]]

        return {"success": "true", "users": users, "groups": groups, "email": self.getUserEmail()}

    def getUserEmail(self):
        if not (user := self.getUserName()):
            gLogger.debug("user value is empty")
            return

        if user == "anonymous":
            gLogger.debug("user is anonymous")
            return

        email = gConfig.getValue(f"/Registry/Users/{user}/Email", "")
        gLogger.debug(f"/Registry/Users/{user}/Email - '{email}'")
        email = email.strip()

        return email or None

    def web_sendMessage(self, subject, message, users, groups):
        """
        Send message(not implemented yet) or email getting parameters from request
        """

        email = self.getUserEmail()

        if not subject:
            gLogger.debug(error := "subject parameter is not in request... aborting")
            return {"success": "false", "error": error}

        if not (subject := self.checkUnicode(subject)):
            subject = f"Message from {email}"

        if not message:
            gLogger.debug(error := "msg parameter is not in request... aborting")
            return {"success": "false", "error": error}

        if not len(body := self.checkUnicode(message)) > 0:
            gLogger.debug(error := "Message body has zero length... aborting")
            return {"success": "false", "error": error}

        users = users.split(",")
        groups = groups.split(",")

        gLogger.info(f"List of groups from request: {groups}")
        if groups:
            for g in groups:
                userList = self.getUsersFromGroup(g)
                gLogger.info(f"Get users: {userList} from group {g}")
                if userList:
                    users.extend(userList)

        gLogger.info(f"Merged list of users from users and group {users}")

        if not len(users) > 0:
            gLogger.info(error := "Length of list of recipients is zero size")
            return {"success": "false", "error": error}

        users = uniqueElements(users)
        gLogger.info(f"Final list of users to send message/mail: {users}")

        sendDict = self.getMailDict(users)
        return self.sendMail(sendDict, subject, body, email)

    def checkUnicode(self, text=None):
        """
        Check if value is unicode or not and return properly converted string
        Arguments are string and unicode/string, return value is a string
        """
        try:
            text = text.decode("utf-8", "replace")
        except Exception:
            pass

        gLogger.debug(text := text.encode("utf-8"))
        return text

    def getUsersFromGroup(self, groupname=None):
        if not groupname:
            gLogger.debug("Argument groupname is missing")
            return

        users = gConfig.getValue(f"/Registry/Groups/{groupname}/Users", [])
        gLogger.debug(f"{groupname} users: {users}")
        if users:
            return users
        gLogger.debug(f"No users for group {groupname} found")

    def getMailDict(self, names=None):
        """
        Convert list of usernames to dict like { e-mail : full name }
        Argument is a list. Return value is a dict
        """
        resultDict = dict()
        if not names:
            return resultDict

        for user in names:
            email = gConfig.getValue(f"/Registry/Users/{user}/Email", "")
            gLogger.debug(f"/Registry/Users/{user}/Email - '{email}'")

            if not (email := email.strip()):
                gLogger.error(f"Can't find value for option /Registry/Users/{user}/Email")
                continue

            fname = gConfig.getValue(f"/Registry/Users/{user}/FullName", "")
            gLogger.debug(f"/Registry/Users/{user}/FullName - '{fname}'")

            if not (fname := fname.strip()):
                gLogger.debug(f"FullName is absent, name to be used: {fname := user}")

            resultDict[email] = fname

        return resultDict

    def sendMail(self, sendDict=None, title=None, body=None, fromAddress=None):
        """
        Sending an email using sendDict: { e-mail : name } as addressbook
        title and body is the e-mail's Subject and Body
        fromAddress is an email address in behalf of whom the message is sent
        Return success/failure JSON structure
        """

        if not sendDict:
            gLogger.debug(error := "")
            return {"success": "false", "error": error}

        if not title:
            gLogger.debug(error := "title argument is missing")
            return {"success": "false", "error": error}

        if not body:
            gLogger.debug(error := "body argument is missing")
            return {"success": "false", "error": error}

        if not fromAddress:
            gLogger.debug(error := "fromAddress argument is missing")
            return {"success": "false", "error": error}

        sentSuccess = list()
        sentFailed = list()
        gLogger.debug("Initializing Notification client")
        ntc = NotificationClient()

        for email, name in sendDict.iteritems():
            result = ntc.sendMail(email, title, body, fromAddress, False)
            if not result["OK"]:
                sentFailed.append(error := f"{name}: {result['Message']}")
                gLogger.error("Sent failure: ", error)
            else:
                gLogger.info(f"Successfully sent to {name}")
                sentSuccess.append(name)

        success = ", ".join(sentSuccess)
        failure = "\n".join(sentFailed)

        if success and failure:
            gLogger.debug(result := f"Successfully sent e-mail to: {success}\n\nFailed to send e-mail to:\n{failure}")
            return {"success": "true", "result": result}
        elif success and len(failure) < 1:
            gLogger.debug(f"Successfully sent e-mail to: {success}")
            return {"success": "true", "result": result}
        elif len(success) < 1 and failure:
            gLogger.debug(error := f"Failed to sent email to:\n{failure}")
            return {"success": "false", "error": error}

        gLogger.debug(error := "No messages were sent due technical failure")
        return {"success": "false", "error": error}

    def web_getComponentNames(self, ComponentType: list = ["Services", "Agents"]):
        systemList = []
        setup = self.getUserSetup().split("-")[-1]

        if (result := gConfig.getSections("/Systems"))["OK"]:
            for system in result["Value"]:
                for compType in ComponentType:
                    compPath = f"/Systems/{system}/{setup}/{compType}"
                    if (result := gConfig.getSections(compPath))["OK"]:
                        components = result["Value"]
                        systemList += [{"Name": j} for j in components]

            return {"success": "true", "result": systemList}
        return {"success": "false", "error": result["Message"]}

    def web_getSelectionData(self, ComponentType: list = ["Services", "Agents", "Executors"]):
        data = {"Hosts": []}
        setup = self.getUserSetup().split("-")[-1]

        if (result := ComponentMonitoringClient().getHosts({}, False, False))["OK"]:
            for hostDict in result["Value"]:
                if hostname := hostDict.get("HostName"):
                    data["Hosts"].append([hostname])

        components = []
        componentNames = []
        data["ComponentName"] = []
        data["ComponentModule"] = []
        if (result := gConfig.getSections("/Systems"))["OK"]:
            for system in result["Value"]:
                for compType in ComponentType:
                    compPath = f"/Systems/{system}/{setup}/{compType}"
                    if (result := gConfig.getSections(compPath))["OK"]:
                        records = result["Value"]
                        componentNames += [[cnames] for cnames in records]
                        for record in records:
                            module = gConfig.getValue(f"{compPath}/{record}/Module", "")
                            if module != "" and module not in components:
                                components += [module]
                                data["ComponentModule"].append([module])
                            elif record not in components and module == "":
                                data["ComponentModule"].append([record])
                                components += [record]

            data["ComponentName"] = componentNames
            data["ComponentName"].sort()
            data["ComponentModule"].sort()
        else:
            data = {"success": "false", "error": result["Message"]}
        return data

    def web_ComponentLocation(
        self, ComponentType: list = ["Service", "Agent", "Executor"], ComponentModule: str = [], Hosts=[]
    ):
        if ComponentModule:
            ComponentModule = list(json.loads(ComponentModule))

        if Hosts:  # we only use the selected host(s)
            Hosts = list(json.loads(Hosts))

        condDict = {"Type": ComponentType, "DIRACModule": ComponentModule}
        gLogger.debug("condDict" + str(condDict))

        if not (result := ComponentMonitoringClient().getComponents(condDict, True, True))["OK"]:
            return {"success": "false", "error": result["Message"]}
        records = []
        for component in result["Value"]:
            installedInHosts = [installation["Host"]["HostName"] for installation in component["Installations"]]
            if Hosts and not set.intersection(set(Hosts), set(installedInHosts)):
                continue

            component["ComponentModule"] = component["DIRACSystem"] + "/" + component["DIRACModule"]
            records += [component]

        return {"success": "true", "result": records}
