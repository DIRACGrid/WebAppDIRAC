from DIRAC import gLogger
from DIRAC.Core.Security.X509Chain import X509Chain  # pylint: disable=import-error
from DIRAC.FrameworkSystem.Client import ProxyUpload
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getGroupsForDN

from WebAppDIRAC.Lib.WebHandler import WebHandler


class ProxyUploadHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def web_proxyUpload(self, pass_p12=None):
        """
        Get p12 file and passwords as input. Split p12 to user key and certificate
        and creating proxy for groups user belongs to. Upload proxy to proxy store
        """
        # Otherwise the browser would offer to download a file
        # response.headers['Content-type'] = "text/html"
        userData = self.getSessionData()
        username = userData["user"]["username"]
        gLogger.info(f"Start upload proxy out of p12 for user: {username}")
        disclaimer = "\nNo proxy was created\nYour private info was safely deleted from DIRAC service"

        if username.lower() == "anonymous":
            gLogger.error("Anonymous is not allowed")
            gLogger.debug(f"Service response: {(error := 'Please, send a registration request first')}")
            return {"success": "false", "error": error}

        groupList = userData["validGroups"]
        gLogger.info(f"Available groups for the user {username}:", ", ".join(groupList))

        if not len(groupList) > 0:
            gLogger.error("User is not registered in any group")
            error = f"Seems that user {username} is not register in any group {disclaimer}"
            gLogger.debug(f"Service response: {error}")
            return {"success": "false", "error": error}

        fileObject = None
        gLogger.debug("Request's body:")
        key = list(self.request.files)[0]
        try:
            if self.request.files[key][0].filename:
                name = self.request.files[key][0].filename
                name = name.strip()
                if name[-4:] == ".p12":
                    gLogger.info(".p12 in filename detected")
                    if pass_p12:
                        fileObject = self.request.files[key][0]
                        fileObject.p12 = pass_p12
                        gLogger.info(".p12 password detected")
                        # store.append(fileObject)
                        gLogger.info("Certificate object is loaded")
        except Exception as x:
            gLogger.debug(f"Non fatal for logic, exception happens: {x}")

        if fileObject is None:  # If there is a file(s) to store
            gLogger.error("No file with *.p12 found")
            error = f"Failed to find any suitable *.p12 filename in your request {disclaimer}"
            gLogger.debug(f"Service response: {error}")
            return {"success": "false", "error": error}

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
            error = f"An exception has happen '{x}' {disclaimer}"
            gLogger.debug("Service response: %s" % error)
            return {"success": "false", "error": error}

        gLogger.info("Split certificate(s) to public and private keys")

        from DIRAC.Core.Utilities import Subprocess

        keyDict = dict()

        name = descriptionDict["name"]
        p12 = descriptionDict["p12"]
        keyDict["pem"] = descriptionDict["pem"]

        for j in "pub", "private":
            tmp = "".join(random.choice(string.ascii_letters) for x in range(10))
            keyDict[j] = os.path.join(storePath, tmp)

        cmdCert = f"openssl pkcs12 -clcerts -nokeys -in {name} -out {keyDict['pub']} -password file:{p12}"
        cmdKey = f"openssl pkcs12 -nocerts -in {name} -out {keyDict['private']} -passout file:{keyDict['pem']} -password file:{p12}"

        for cmd in cmdCert, cmdKey:
            result = Subprocess.shellCall(900, cmd)
            gLogger.debug(f"Command is: {cmd}")
            gLogger.debug(f"Result is: {result}")
            if not result["OK"]:
                shutil.rmtree(storePath)
                gLogger.error(result["Message"])
                error = f"Error while executing SSL command: {result['Message']} {disclaimer}"
                gLogger.debug(f"Service response: {error}")
                return {"success": "false", "error": error}

        proxyChain = X509Chain()

        if not (result := proxyChain.loadChainFromFile(keyDict["pub"]))["OK"]:
            return {"error": "Could not load the proxy: %s" % result["Message"], "success": "false"}

        if not (result := proxyChain.getIssuerCert())["OK"]:
            return {"error": "Could not load the proxy: %s" % result["Message"], "success": "false"}

        issuerCert = result["Value"]

        upParams = ProxyUpload.CLIParams()
        upParams.onTheFly = True
        upParams.proxyLifeTime = issuerCert.getRemainingSecs()["Value"] - 300
        upParams.certLoc = keyDict["pub"]
        upParams.keyLoc = keyDict["private"]
        upParams.userPasswd = pemPassword

        if not (result := ProxyUpload.uploadProxy(upParams))["OK"]:
            return {"error": result["Message"], "success": "false"}

        shutil.rmtree(storePath)

        if (result := issuerCert.getSubjectDN())["OK"]:
            result = getGroupsForDN(result["Value"])
        if not result["OK"]:
            return {"error": result["Message"], "success": "false"}

        groups = ", ".join(result["Value"])
        result = f"Operation finished successfully\nProxy uploaded for user: {username} \n"
        if len(groupList) > 0:
            result += f" in groups: {groups} \n"
        else:
            result += f" in group: {groups} \n"

        result += "\nYour private info was safely deleted from DIRAC server."
        gLogger.info(result)
        return {"success": "true", "result": result}
