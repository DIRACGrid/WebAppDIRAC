
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
import json
import ast
import pprint

class ProxyUploadHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  @asyncGen
  def web_proxyUpload(self):
    """
    Get p12 file and passwords as input. Split p12 to user key and certificate
    and creating proxy for groups user belongs to. Upload proxy to proxy store
    """
    # Otherwise the browser would offer to download a file
    #response.headers['Content-type'] = "text/html"
    userData = self.getSessionData()
    username = userData["user"]["username"]
    gLogger.info("Start upload proxy out of p12 for user: %s" % (username))
    disclaimer = "\nNo proxy was created\nYour private info was safely deleted"
    disclaimer = disclaimer + " from DIRAC service"
    
    if username == "anonymous":
      error = "Please, send a registration request first"
      gLogger.error("Anonymous is not allowed")
      gLogger.debug("Service response: %s" % error)
      self.finish({"success":"false","error":error})
      return
    
    groupList = userData["validGroups"]
    groups = ", ".join(groupList)
    gLogger.info("Available groups for the user %s: %s" % (username,groups))
    
    if not len(groupList) > 0:
      gLogger.error("User is not registered in any group")
      error = "Seems that user %s is not register in any group" % username
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      self.finish({"success":"false","error":error})
      return
    
    store = list()
    gLogger.debug("Request's body:")
    for key in self.request.files.keys():
      try:
        gLogger.debug("%s - %s" % (key,self.request.files[key]))
      except Exception,x:
        gLogger.error("Exception: %s" % str(x))
        error = "An exception has happen '%s'" % str(x)
        error = error + disclaimer
        gLogger.debug("Service response: %s" % error)
        self.finish({"success":"false","error":error})
        return
      try:
        if self.request.files[key][0].filename:
          name = self.request.files[key][0].filename
          name = name.strip()
          if name[-4:] == ".p12":
            gLogger.info(".p12 in filename detected")
            if self.request.arguments["pass_p12"]:
              fileObject = self.request.files[key][0]
              fileObject.p12 = str(self.request.arguments["pass_p12"][0])
              gLogger.info(".p12 password detected")
              store.append(fileObject)
              gLogger.info("Certificate object is loaded")
      except Exception,x:
        gLogger.debug("Non fatal for logic, exception happens: %s" % str(x))
        pass
      
      
    if not len(store) > 0: # If there is a file(s) to store
      gLogger.error("No file with *.p12 found")
      error = "Failed to find any suitable *.p12 filename in your request"
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      self.finish({"success":"false","error":error})
      return
    
    gLogger.info("Number of p12 file(s) to process: %s" % len(store))
    import tempfile
    import shutil
    import os
    import random
    import string
    
    storePath = tempfile.mkdtemp(prefix='DIRAC_')
    gLogger.info("Saving file from request to a tmp directory")
    descriptionList = list()
    try:
      for file in store:
        
        gLogger.info("STEP 1")
        desc = dict()
        for i in "name","p12","pem":
          tmp = "".join(random.choice(string.letters) for x in range(10))
          desc[i] = os.path.join(storePath,tmp)
          
        tmpFile = open(desc["name"],"w")
#         shutil.copyfileobj(file.file, tmpFile)
#         file.file.close()
       
        tmpFile.write(file.body)
        tmpFile.close()
        
        gLogger.info("STEP 3")
        tmpFile = open(desc["p12"],"w")
        tmpFile.write(file.p12)
        tmpFile.close()
        
        gLogger.info("STEP 4")
        pemPassword = "".join(random.choice(string.letters) for x in range(10))
        
        tmpFile = open(desc["pem"],"w")
        tmpFile.write(pemPassword)
        tmpFile.close()
        gLogger.info("STEP 5")
        descriptionList.append(desc)
    except Exception,x:
      shutil.rmtree(storePath)
      gLogger.error("Exception: %s" % str(x))
      error = "An exception has happen '%s'" % str(x)
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      self.finish({"success":"false","error":error})
      return
    
    if not len(descriptionList) > 0: # If there is a file(s) to store
      shutil.rmtree(storePath)
      gLogger.error("No certificate(s) found")
      error = "List of certificate(s) is empty"
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      self.finish({"success":"false","error":error})
      return
    
    gLogger.info("Split certificate(s) to public and private keys")
    
    keyList = list()
    
    from DIRAC.Core.Utilities import Subprocess
    
    for i in descriptionList:
      key = dict()
      
      name = i["name"]
      p12 = i["p12"]
      key["pem"] = i["pem"]
      
      for j in "pub","private":
        tmp = "".join(random.choice(string.letters) for x in range(10))
        key[j] = os.path.join(storePath,tmp)
        
      cmdCert = "openssl pkcs12 -clcerts -nokeys -in %s -out %s -password file:%s" % (name,key["pub"],p12)
      cmdKey = "openssl pkcs12 -nocerts -in %s -out %s -passout file:%s -password file:%s" % (name,key["private"],key["pem"],p12)
      
      for cmd in cmdCert,cmdKey:
        result = yield self.threadTask(Subprocess.shellCall,900,cmd)
        gLogger.debug("Command is: %s" % cmd)
        gLogger.debug("Result is: %s" % result)
        if not result["OK"]:
          shutil.rmtree(storePath)
          gLogger.error(result["Message"])
          error = "Error while executing SSL command: %s" % result["Message"]
          error = error + disclaimer
          gLogger.debug("Service response: %s" % error)
          self.finish({"success":"false","error":error})
          return 
      keyList.append(key)
      
    if not len(keyList) > 0:
      shutil.rmtree(storePath)
      error = "List of public and private keys is empty"
      gLogger.error(error)
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      self.finish({"success":"false","error":error})
      return
      
    resultList = list()
    for key in keyList:
      for group in groupList:
        gLogger.info("Uploading proxy for group: %s" % group)
        cmd = "cat %s | dirac-proxy-init -U -g %s -C %s -K %s -p" % (key["pem"],group,key["pub"],key["private"])
        result = result = yield self.threadTask(Subprocess.shellCall,900,cmd)
        gLogger.debug("Command is: %s" % cmd)
        gLogger.debug("Result is: %s" % result)
        gLogger.info("Command is: %s" % cmd)
        gLogger.info("Result is: %s" % result)
        
        if not result[ 'OK' ]:
          shutil.rmtree(storePath)
          error = "".join(result["Message"])
          gLogger.error(error)
          if len(resultList) > 0:
            success = "\nHowever some operations has finished successfully:\n"
            success = success + "\n".join(resultList)
            error = error + success
          error = error + disclaimer
          gLogger.debug("Service response: %s" % error)
          self.finish({"success":"false","error":error})
          return
        code = result["Value"][0]
        stdout = result["Value"][1]
        error = result["Value"][2]
        if len(error) > 0:
          error = error.replace(">","")
          error = error.replace("<","")
        if not code == 0:
          if len(resultList) > 0:
            success = "\nHowever some operations has finished successfully:\n"
            success = success + "\n".join(resultList)
            error = error + success
          error = error + disclaimer
          gLogger.debug("Service response: %s" % error)
          self.finish({"success":"false","error":error})
          return
        resultList.append(stdout)
    shutil.rmtree(storePath)
    debug = "\n".join(resultList)
    gLogger.debug(debug)
    groups = ", ".join(groupList)
    result = "Proxy uploaded for user: %s" % username
    if len(groupList) > 0:
      result = result + " in groups: %s" % groups
    else:
      result = result + " in group: %s" % groups
    gLogger.info(result)
    result = "Operation finished successfully\n" + result
    result = result + "\nYour private info was safely deleted from DIRAC server"
    gLogger.debug("Service response: %s" % result)
    self.finish({"success":"true","result":result})
  