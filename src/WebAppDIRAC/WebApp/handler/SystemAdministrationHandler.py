""" Handler for SystemAdministration WebApp
"""

import json
import datetime

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.FrameworkSystem.Client.MonitoringClient import gMonitor
from DIRAC.FrameworkSystem.Client.NotificationClient import NotificationClient
from DIRAC.FrameworkSystem.Client.SystemAdministratorClient import SystemAdministratorClient
from DIRAC.FrameworkSystem.Client.ComponentMonitoringClient import ComponentMonitoringClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class SystemAdministrationHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getSysInfo(self):
        """Provide information about hosts state from database"""
        DN = self.getUserDN()
        group = self.getUserGroup()
        client = ComponentMonitoringClient(delegatedDN=DN, delegatedGroup=group)
        result = yield self.threadTask(client.getLogs)
        if not result["OK"] or not len(result["Value"]) > 0:
            self.finish({"success": "false", "error": result.get("Message", "No system information found")})
            return

        callback = result["Value"]

        # Add the information about the extensions' versions, if available, to display along with the DIRAC version
        for i in range(len(callback)):
            callback[i]["Host"] = callback[i]["HostName"]
            callback[i]["Timestamp"] = str(callback[i].get("Timestamp", "unknown"))
            # We have to keep the backward compatibility (this can heppen when we do not update one host to v6r15 ...
            callback[i]["DIRAC"] = "%s,%s" % (
                callback[i].get("DIRACVersion", callback[i].get("DIRAC", "")),
                callback[i].get("Extension", callback[i].get("Extensions", "")),
            )

        self.finish({"success": "true", "result": sorted(callback, key=lambda i: i["Host"]), "total": len(callback)})

    @asyncGen
    def web_getHostData(self):
        """
        Returns flatten list of components (services, agents) installed on hosts
        returned by getHosts function
        """
        DN = self.getUserDN()
        group = self.getUserGroup()

        callback = list()

        if "hostname" not in self.request.arguments or not self.get_argument("hostname"):
            self.finish({"success": "true", "result": callback})
            return

        host = self.get_argument("hostname")
        client = SystemAdministratorClient(host, None, delegatedDN=DN, delegatedGroup=group)
        result = yield self.threadTask(client.getOverallStatus)
        gLogger.debug("Result of getOverallStatus(): %s" % result)

        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return

        overall = result["Value"]

        for record in self.flatten(overall):
            record["Host"] = host
            callback.append(record)

        self.finish({"success": "true", "result": callback})

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

    @asyncGen
    def web_getHostErrors(self):
        DN = self.getUserDN()
        group = self.getUserGroup()

        if "host" not in self.request.arguments:
            self.finish({"success": "false", "error": "Name of the host is missing or not defined"})
            return

        host = self.get_argument("host")

        client = SystemAdministratorClient(host, None, delegatedDN=DN, delegatedGroup=group)

        result = yield self.threadTask(client.checkComponentLog, "*")

        gLogger.debug(result)
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        result = result["Value"]

        callback = list()
        for key, value in result.items():
            system, component = key.split("/")
            value["System"] = system
            value["Name"] = component
            value["Host"] = host
            callback.append(value)
        total = len(callback)

        self.finish({"success": "true", "result": callback, "total": total})

    @asyncGen
    def web_getHostLog(self):
        DN = self.getUserDN()
        group = self.getUserGroup()

        if "host" not in self.request.arguments:
            self.finish({"success": "false", "error": "Name of the host is missing or not defined"})
            return
        host = self.get_argument("host")

        if "system" not in self.request.arguments:
            self.finish({"success": "false", "error": "Name of the system is missing or not defined"})
            return
        system = self.get_argument("system")

        if "component" not in self.request.arguments:
            self.finish({"success": "false", "error": "Name of component is missing or not defined"})
            return

        name = self.get_argument("component")

        client = SystemAdministratorClient(host, None, delegatedDN=DN, delegatedGroup=group)

        result = yield self.threadTask(client.getLogTail, system, name)
        gLogger.debug(result)

        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return

        result = result["Value"]

        key = system + "_" + name
        if key not in result:
            self.finish({"success": "false", "error": "%s key is absent in service response" % key})
            return

        log = result[key]

        self.finish({"success": "true", "result": log.replace("\n", "<br>")})

    @asyncGen
    def web_hostAction(self):
        """
        Restart all DIRAC components on a given host
        """

        if "host" not in self.request.arguments:
            self.finish({"success": "false", "error": "No hostname defined"})
            return

        if "action" not in self.request.arguments:
            self.finish({"success": "false", "error": "No action defined"})
            return

        action = self.get_argument("action")
        hosts = self.get_argument("host").split(",")
        version = self.get_argument("version")

        DN = self.getUserDN()
        group = self.getUserGroup()

        actionSuccess = list()
        actionFailed = list()

        for i in hosts:
            client = SystemAdministratorClient(str(i), None, delegatedDN=DN, delegatedGroup=group)
            if action == "restart":
                result = yield self.threadTask(client.restartComponent, str("*"), str("*"))
            elif action == "revert":
                result = yield self.threadTask(client.revertSoftware)
            elif action == "update":
                result = yield self.threadTask(client.updateSoftware, version, timeout=600)
            else:
                error = i + ": Action %s is not defined" % action
                actionFailed.append(error)
                continue

            gLogger.always(result)

            if not result["OK"]:
                if result["Message"].find("Unexpected EOF") > 0:
                    msg = "Signal 'Unexpected EOF' received: %s. Most likely DIRAC components" % result["Message"]
                    msg = i + ": " + msg + " were successfully restarted."
                    actionSuccess.append(msg)
                    continue
                error = i + ": " + result["Message"]
                actionFailed.append(error)
                gLogger.error(error)
            else:
                gLogger.info(result["Value"])
                actionSuccess.append(i)

        self.finish(self.aftermath(actionSuccess, actionFailed, action, "Host"))

    @asyncGen
    def web_componentAction(self):
        """
        Actions which should be done on components. The only parameters is an action
        to perform.
        Returns standard JSON response structure with with service response
        or error messages
        """
        DN = self.getUserDN()
        group = self.getUserGroup()

        if not (("action" in self.request.arguments) and (len(self.get_argument("action")) > 0)):
            self.finish({"success": "false", "error": "No action defined"})
            return

        action = self.get_argument("action")

        if action not in ["restart", "start", "stop"]:
            error = "The request parameters action '%s' is unknown" % action
            gLogger.debug(error)
            self.finish({"success": "false", "error": error})
            return

        result = dict()
        for i in self.request.arguments:
            if i == "action":
                continue

            target = i.split("@")
            if not len(target) == 2:
                continue

            system = self.get_argument(i)
            gLogger.always("System: %s" % system)
            host = target[1]
            gLogger.always("Host: %s" % host)
            component = target[0]
            gLogger.always("Component: %s" % component)
            if host not in result:
                result[host] = list()
            result[host].append([system, component])

        if not result:
            error = "Failed to get component(s) for %s" % action
            gLogger.debug(error)
            self.finish({"success": "false", "error": error})

        gLogger.always(result)
        actionSuccess = list()
        actionFailed = list()

        for hostname in result:

            if not result[hostname]:
                continue

            client = SystemAdministratorClient(hostname, None, delegatedDN=DN, delegatedGroup=group)

            for i in result[hostname]:

                system = i[0]
                component = i[1]

                try:
                    if action == "restart":
                        result = yield self.threadTask(client.restartComponent, system, component)
                    elif action == "start":
                        result = yield self.threadTask(client.startComponent, system, component)
                    elif action == "stop":
                        result = yield self.threadTask(client.stopComponent, system, component)
                    else:
                        result = dict(OK=False)
                        result["Message"] = "Action %s is not valid" % action
                except Exception as x:
                    result = dict(OK=False)
                    result["Message"] = "Exception: %s" % str(x)
                gLogger.debug("Result: %s" % result)

                if not result["OK"]:
                    error = hostname + ": " + result["Message"]
                    actionFailed.append(error)
                    gLogger.error("Failure during component %s: %s" % (action, error))
                else:
                    gLogger.always("Successfully %s component %s" % (action, component))
                    actionSuccess.append(component)

        self.finish(self.aftermath(actionSuccess, actionFailed, action, "Component"))

    def aftermath(self, actionSuccess, actionFailed, action, prefix):

        success = ", ".join(actionSuccess)
        failure = "\n".join(actionFailed)

        if len(actionSuccess) > 1:
            sText = prefix + "s"
        else:
            sText = prefix

        if len(actionFailed) > 1:
            fText = prefix + "s"
        else:
            fText = prefix

        if success and failure:
            sMessage = "%s %sed successfully: %s" % (sText, action, success)
            fMessage = "Failed to %s %s:\n%s" % (action, fText, failure)
            result = sMessage + "\n\n" + fMessage
            return {"success": "true", "result": result}
        elif success and len(failure) < 1:
            result = "%s %sed successfully: %s" % (sText, action, success)
            return {"success": "true", "result": result}
        elif len(success) < 1 and failure:
            result = "Failed to %s %s:\n%s" % (action, fText, failure)
            gLogger.always(result)
            return {"success": "false", "error": result}

        result = "No action has performed due technical failure. Check the logs please"
        gLogger.debug(result)
        return {"success": "false", "error": result}

    def web_getUsersGroups(self):

        result = gConfig.getSections("/Registry/Users")
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        result = result["Value"]

        users = [[x] for x in result]

        result = gConfig.getSections("/Registry/Groups")
        if not result["OK"]:
            self.finish({"success": "false", "error": result["Message"]})
            return
        result = result["Value"]

        groups = [[x] for x in result]

        self.finish({"success": "true", "users": users, "groups": groups, "email": self.getUserEmail()})

    def getUserEmail(self):

        user = self.getUserName()

        if not user:
            gLogger.debug("user value is empty")
            return None

        if user == "anonymous":
            gLogger.debug("user is anonymous")
            return None

        email = gConfig.getValue("/Registry/Users/%s/Email" % user, "")
        gLogger.debug("/Registry/Users/%s/Email - '%s'" % (user, email))
        email = email.strip()

        if not email:
            return None
        return email

    def web_sendMessage(self):
        """
        Send message(not implemented yet) or email getting parameters from request
        """

        email = self.getUserEmail()

        if "subject" not in self.request.arguments:
            result = "subject parameter is not in request... aborting"
            gLogger.debug(result)
            self.finish({"success": "false", "error": result})
            return

        subject = self.checkUnicode(self.get_argument("subject"))
        if not subject:
            subject = "Message from %s" % email

        if "message" not in self.request.arguments:
            result = "msg parameter is not in request... aborting"
            gLogger.debug(result)
            self.finish({"success": "false", "error": result})
            return

        body = self.checkUnicode(self.get_argument("message"))
        if not len(body) > 0:
            result = "Message body has zero length... aborting"
            gLogger.debug(result)
            self.finish({"success": "false", "error": result})
            return

        users = self.get_argument("users").split(",")

        groups = self.get_argument("groups").split(",")

        gLogger.info("List of groups from request: %s" % groups)
        if groups:
            for g in groups:
                userList = self.getUsersFromGroup(g)
                gLogger.info("Get users: %s from group %s" % (userList, g))
                if userList:
                    users.extend(userList)

        gLogger.info("Merged list of users from users and group %s" % users)

        if not len(users) > 0:
            error = "Length of list of recipients is zero size"
            gLogger.info(error)
            self.finish({"success": "false", "error": error})
            return

        users = uniqueElements(users)
        gLogger.info("Final list of users to send message/mail: %s" % users)

        sendDict = self.getMailDict(users)
        self.finish(self.sendMail(sendDict, subject, body, email))

    def checkUnicode(self, text=None):
        """
        Check if value is unicode or not and return properly converted string
        Arguments are string and unicode/string, return value is a string
        """
        try:
            text = text.decode("utf-8", "replace")
        except Exception:
            pass
        text = text.encode("utf-8")
        gLogger.debug(text)

        return text

    def getUsersFromGroup(self, groupname=None):

        if not groupname:
            gLogger.debug("Argument groupname is missing")
            return None

        users = gConfig.getValue("/Registry/Groups/%s/Users" % groupname, [])
        gLogger.debug("%s users: %s" % (groupname, users))
        if not users:
            gLogger.debug("No users for group %s found" % groupname)
            return None
        return users

    def getMailDict(self, names=None):
        """
        Convert list of usernames to dict like { e-mail : full name }
        Argument is a list. Return value is a dict
        """

        resultDict = dict()
        if not names:
            return resultDict

        for user in names:
            email = gConfig.getValue("/Registry/Users/%s/Email" % user, "")
            gLogger.debug("/Registry/Users/%s/Email - '%s'" % (user, email))
            email = email.strip()

            if not email:
                gLogger.error("Can't find value for option /Registry/Users/%s/Email" % user)
                continue

            fname = gConfig.getValue("/Registry/Users/%s/FullName" % user, "")
            gLogger.debug("/Registry/Users/%s/FullName - '%s'" % (user, fname))
            fname = fname.strip()

            if not fname:
                fname = user
                gLogger.debug("FullName is absent, name to be used: %s" % fname)

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
            result = ""
            gLogger.debug(result)
            return {"success": "false", "error": result}

        if not title:
            result = "title argument is missing"
            gLogger.debug(result)
            return {"success": "false", "error": result}

        if not body:
            result = "body argument is missing"
            gLogger.debug(result)
            return {"success": "false", "error": result}

        if not fromAddress:
            result = "fromAddress argument is missing"
            gLogger.debug(result)
            return {"success": "false", "error": result}

        sentSuccess = list()
        sentFailed = list()
        gLogger.debug("Initializing Notification client")
        ntc = NotificationClient()

        for email, name in sendDict.iteritems():
            result = ntc.sendMail(email, title, body, fromAddress, False)
            if not result["OK"]:
                error = name + ": " + result["Message"]
                sentFailed.append(error)
                gLogger.error("Sent failure: ", error)
            else:
                gLogger.info("Successfully sent to %s" % name)
                sentSuccess.append(name)

        success = ", ".join(sentSuccess)
        failure = "\n".join(sentFailed)

        if success and failure:
            result = "Successfully sent e-mail to: "
            result = result + success + "\n\nFailed to send e-mail to:\n" + failure
            gLogger.debug(result)
            return {"success": "true", "result": result}
        elif success and len(failure) < 1:
            result = "Successfully sent e-mail to: %s" % success
            gLogger.debug(result)
            return {"success": "true", "result": result}
        elif len(success) < 1 and failure:
            result = "Failed to sent email to:\n%s" % failure
            gLogger.debug(result)
            return {"success": "false", "error": result}

        result = "No messages were sent due technical failure"
        gLogger.debug(result)
        return {"success": "false", "error": result}

    @asyncGen
    def web_getComponentNames(self):

        result = None

        setup = self.getUserSetup().split("-")[-1]
        systemList = []
        componentTypes = ["Services", "Agents"]
        componentTypes = self.get_arguments("ComponentType") or componentTypes

        retVal = gConfig.getSections("/Systems")

        if retVal["OK"]:
            systems = retVal["Value"]
            for i in systems:
                for compType in componentTypes:
                    compPath = "/Systems/%s/%s/%s" % (i, setup, compType)
                    retVal = gConfig.getSections(compPath)
                    if retVal["OK"]:
                        components = retVal["Value"]
                        systemList += [{"Name": j} for j in components]

            result = {"success": "true", "result": systemList}
        else:
            result = {"success": "false", "error": result["Message"]}

        self.finish(result)

    @asyncGen
    def web_getSelectionData(self):

        data = {"Hosts": []}

        setup = self.getUserSetup().split("-")[-1]

        hosts = []
        result = ComponentMonitoringClient().getHosts({}, False, False)
        if result["OK"]:
            for hostDict in result["Value"]:
                if hostDict.get("HostName"):
                    data["Hosts"].append([hostDict["HostName"]])

        componentTypes = ["Services", "Agents", "Executors"]
        componentTypes = self.get_arguments("ComponentType") or componentTypes

        retVal = gConfig.getSections("/Systems")

        components = []
        componentNames = []
        data["ComponentModule"] = []
        data["ComponentName"] = []
        if retVal["OK"]:
            systems = retVal["Value"]
            for i in systems:
                for compType in componentTypes:
                    compPath = "/Systems/%s/%s/%s" % (i, setup, compType)
                    retVal = gConfig.getSections(compPath)
                    if retVal["OK"]:
                        records = retVal["Value"]
                        componentNames += [[cnames] for cnames in records]
                        for record in records:
                            modulepath = "%s/%s/Module" % (compPath, record)
                            module = gConfig.getValue(modulepath, "")
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

        self.finish(data)

    @asyncGen
    def web_ComponentLocation(self):

        _setup = self.getUserSetup()
        setup = _setup.split("-")[-1]

        hosts = []
        result = ComponentMonitoringClient().getHosts({}, False, False)
        if result["OK"]:
            hosts = [h["HostName"] for h in result["Value"] if h.get("HostName")]

        componentTypes = ["Services", "Agents"]
        componentTypes = self.get_arguments("ComponentType") or componentTypes

        componentNames = []
        if "ComponentName" in self.request.arguments:
            componentNames = list(json.loads(self.get_argument("ComponentName")))

        componentModules = []
        if "ComponentModule" in self.request.arguments:
            componentModules = list(json.loads(self.get_argument("ComponentModule")))

        showAll = 0
        if "showAll" in self.request.arguments:
            showAll = int(self.get_argument("showAll"))

        selectedHosts = []
        if "Hosts" in self.request.arguments:  # we only use the selected host(s)
            selectedHosts = list(json.loads(self.get_argument("Hosts")))
        retVal = gConfig.getSections("/Systems")

        compMatching = {}
        fullNames = []
        if retVal["OK"]:
            systems = retVal["Value"]
            for i in systems:
                for compType in componentTypes:
                    compPath = "/Systems/%s/%s/%s" % (i, setup, compType)
                    retVal = gConfig.getSections(compPath)
                    if retVal["OK"]:
                        components = retVal["Value"]
                        for j in components:
                            path = "%s/%s" % (i, j)
                            if j in componentNames:
                                fullNames += [path]
                                compMatching[path] = path
                            modulepath = "%s/%s/Module" % (compPath, j)
                            module = gConfig.getValue(modulepath, "")
                            if module != "" and module in componentModules:
                                fullNames += [path]
                            elif module == "" and j in componentModules:
                                fullNames += [path]

                            compMatching[path] = module if module != "" else path

        records = []
        if fullNames:
            condDict = {"Setup": _setup, "ComponentName": fullNames}
        else:
            if len(componentTypes) < 2:
                cType = "agent" if componentTypes[-1] == "Agents" else "service"
                condDict = {"Setup": _setup, "Type": cType}
            else:
                condDict = {"Setup": _setup}

        gLogger.debug("condDict" + str(condDict))
        retVal = gMonitor.getComponentsStatus(condDict)

        today = datetime.datetime.today()
        if retVal["OK"]:
            components = retVal["Value"][0]
            for setup in components:
                for cType in components[setup]:
                    for name in components[setup][cType]:
                        for component in components[setup][cType][name]:
                            if selectedHosts and "Host" in component and component["Host"] not in selectedHosts:
                                continue
                            elif "Host" in component and component["Host"] not in hosts:
                                continue
                            if "LastHeartbeat" in component:
                                dateDiff = today - component["LastHeartbeat"]
                            else:
                                dateDiff = today - today

                            if showAll == 0 and dateDiff.days >= 2 and "Host" in component:
                                continue

                            for conv in component:
                                component[conv] = str(component[conv])
                            component["ComponentModule"] = (
                                compMatching[component["ComponentName"]]
                                if component["ComponentName"] in compMatching
                                else component["ComponentName"]
                            )
                            records += [component]

            result = {"success": "true", "result": records}
        else:
            result = {"success": "false", "error": retVal["Message"]}

        self.finish(result)
