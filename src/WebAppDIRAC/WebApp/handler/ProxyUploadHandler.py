from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen
from DIRAC.FrameworkSystem.Client import ProxyUpload
from DIRAC.Core.Security.X509Chain import X509Chain  # pylint: disable=import-error
from DIRAC import gLogger
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getGroupsForDN


class ProxyUploadHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_proxyUpload(self):
        """
        Get p12 file and passwords as input. Split p12 to user key and certificate
        and creating proxy for groups user belongs to. Upload proxy to proxy store
        """
        # Otherwise the browser would offer to download a file
        # response.headers['Content-type'] = "text/html"
        userData = self.getSessionData()
        username = userData["user"]["username"]
        gLogger.info("Start upload proxy out of p12 for user: %s" % (username))
        disclaimer = "\nNo proxy was created\nYour private info was safely deleted"
        disclaimer = disclaimer + " from DIRAC service"

        if username == "anonymous":
            error = "Please, send a registration request first"
            gLogger.error("Anonymous is not allowed")
            gLogger.debug("Service response: %s" % error)
            self.finish({"success": "false", "error": error})
            return

        groupList = userData["validGroups"]
        gLogger.info("Available groups for the user %s: %s" % (username, ", ".join(groupList)))

        if not len(groupList) > 0:
            gLogger.error("User is not registered in any group")
            error = "Seems that user %s is not register in any group" % username
            error = error + disclaimer
            gLogger.debug("Service response: %s" % error)
            self.finish({"success": "false", "error": error})
            return

        fileObject = None
        gLogger.debug("Request's body:")
        key = list(self.request.files)[0]
        try:
            if self.request.files[key][0].filename:
                name = self.request.files[key][0].filename
                name = name.strip()
                if name[-4:] == ".p12":
                    gLogger.info(".p12 in filename detected")
                    if self.get_argument("pass_p12", None):
                        fileObject = self.request.files[key][0]
                        fileObject.p12 = self.get_argument("pass_p12")
                        gLogger.info(".p12 password detected")
                        # store.append(fileObject)
                        gLogger.info("Certificate object is loaded")
        except Exception as x:
            gLogger.debug("Non fatal for logic, exception happens: %s" % str(x))
            pass

        if fileObject is None:  # If there is a file(s) to store
            gLogger.error("No file with *.p12 found")
            error = "Failed to find any suitable *.p12 filename in your request"
            error = error + disclaimer
            gLogger.debug("Service response: %s" % error)
            self.finish({"success": "false", "error": error})
            return

        import tempfile
        import shutil
        import os
        import random
        import string

        storePath = tempfile.mkdtemp(prefix="DIRAC_")
        gLogger.info("Saving file from request to a tmp directory")

        try:
            descriptionDict = dict()
            for i in "name", "p12", "pem":
                tmp = "".join(random.choice(string.ascii_letters) for x in range(10))
                descriptionDict[i] = os.path.join(storePath, tmp)

            with open(descriptionDict["name"], "wb") as tmpFile:
                tmpFile.write(fileObject.body)

            with open(descriptionDict["p12"], "w") as tmpFile:
                tmpFile.write(fileObject.p12)

            pemPassword = "".join(random.choice(string.ascii_letters) for x in range(10))

            with open(descriptionDict["pem"], "w") as tmpFile:
                tmpFile.write(pemPassword)
        except Exception as x:
            shutil.rmtree(storePath)
            gLogger.exception(x)
            error = "An exception has happen '%s'" % str(x)
            error = error + disclaimer
            gLogger.debug("Service response: %s" % error)
            self.finish({"success": "false", "error": error})
            return

        gLogger.info("Split certificate(s) to public and private keys")

        from DIRAC.Core.Utilities import Subprocess

        keyDict = dict()

        name = descriptionDict["name"]
        p12 = descriptionDict["p12"]
        keyDict["pem"] = descriptionDict["pem"]

        for j in "pub", "private":
            tmp = "".join(random.choice(string.ascii_letters) for x in range(10))
            keyDict[j] = os.path.join(storePath, tmp)

        cmdCert = "openssl pkcs12 -clcerts -nokeys -in %s -out %s -password file:%s" % (name, keyDict["pub"], p12)
        cmdKey = "openssl pkcs12 -nocerts -in %s -out %s -passout file:%s -password file:%s" % (
            name,
            keyDict["private"],
            keyDict["pem"],
            p12,
        )

        for cmd in cmdCert, cmdKey:
            result = yield self.threadTask(Subprocess.shellCall, 900, cmd)
            gLogger.debug("Command is: %s" % cmd)
            gLogger.debug("Result is: %s" % result)
            if not result["OK"]:
                shutil.rmtree(storePath)
                gLogger.error(result["Message"])
                error = "Error while executing SSL command: %s" % result["Message"]
                error = error + disclaimer
                gLogger.debug("Service response: %s" % error)
                self.finish({"success": "false", "error": error})
                return

        proxyChain = X509Chain()

        result = proxyChain.loadChainFromFile(keyDict["pub"])
        if not result["OK"]:
            self.finish({"error": "Could not load the proxy: %s" % result["Message"], "success": "false"})
            return

        result = proxyChain.getIssuerCert()
        if not result["OK"]:
            self.finish({"error": "Could not load the proxy: %s" % result["Message"], "success": "false"})
            return
        issuerCert = result["Value"]

        upParams = ProxyUpload.CLIParams()
        upParams.onTheFly = True
        upParams.proxyLifeTime = issuerCert.getRemainingSecs()["Value"] - 300
        upParams.certLoc = keyDict["pub"]
        upParams.keyLoc = keyDict["private"]
        upParams.userPasswd = pemPassword
        result = ProxyUpload.uploadProxy(upParams)

        if not result["OK"]:
            self.finish({"error": result["Message"], "success": "false"})
            return

        shutil.rmtree(storePath)

        result = issuerCert.getSubjectDN()
        if result["OK"]:
            result = getGroupsForDN(result["Value"])
        if not result["OK"]:
            self.finish({"error": result["Message"], "success": "false"})
            return
        groups = ", ".join(result["Value"])
        result = "Operation finished successfully\n"
        result += "Proxy uploaded for user: %s \n" % username
        if len(groupList) > 0:
            result += " in groups: %s \n" % groups
        else:
            result += " in group: %s \n" % groups

        result += "\nYour private info was safely deleted from DIRAC server."
        gLogger.info(result)
        self.finish({"success": "true", "result": result})
