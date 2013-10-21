
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC.ConfigurationSystem.Client.Helpers.Operations import Operations
import tempfile
import json
import ast

class JobLaunchpadHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  
  def web_getProxyStatus(self):
    self.write(self.__getProxyStatus())
  
  def __getProxyStatus(self, secondsOverride=None):
    from DIRAC.FrameworkSystem.Client.ProxyManagerClient import ProxyManagerClient
    
    proxyManager = ProxyManagerClient()
    
    userData = self.getSessionData()
  
    group = str(userData["user"]["group"])
    
    if group == "visitor":
      return {"success":"false", "error":"User is anonymous or is not registered in the system"}
    
    userDN = str(userData["user"]["DN"])
    
    defaultSeconds = 24 * 3600 + 60  # 24H + 1min
    validSeconds = gConfig.getValue("/Registry/DefaultProxyLifeTime", defaultSeconds)
      
    gLogger.info("\033[0;31m userHasProxy(%s, %s, %s) \033[0m" % (userDN, group, validSeconds))
    
    result = proxyManager.userHasProxy(userDN, group, validSeconds)
    
    if result["OK"]:
      if result["Value"]:
        return {"success":"true", "result":"true"}
      else:
        return {"success":"true", "result":"false"}
    else:
      return {"success":"false", "error":"false"}
      
    gLogger.info("\033[0;31m PROXY: \033[0m", result)
  
  def __getPlatform(self):
    gLogger.info("start __getPlatform")
    
    path = "/Resources/Computing/OSCompatibility"
    result = gConfig.getOptionsDict(path)
    
    gLogger.debug(result)
    
    if not result[ "OK" ]:
      return False
    
    platformDict = result[ "Value" ]
    platform = platformDict.keys()
    
    gLogger.debug("platform: %s" % platform)
    gLogger.info("end __getPlatform")
    return platform

  def __getOptionsFromCS(self , path="/Website/Launchpad/Options" , delimiter=","):
    gLogger.info("start __getOptionsFromCS")
    
    result = gConfig.getOptionsDict(path)
    
    gLogger.always(result)
    if not result["OK"]:
      return []
    
    options = result["Value"]
    for i in options.keys():
      options[ i ] = options[ i ].split(delimiter)
      
    result = gConfig.getSections(path)
    if result["OK"]:
      sections = result["Value"]
      
    if len(sections) > 0:
      for i in sections:
        options[ i ] = self.__getOptionsFromCS(path + '/' + i , delimiter)
        
    gLogger.always("options: %s" % options)
    gLogger.info("end __getOptionsFromCS")
    return options
    
  def web_getLaunchpadOpts(self):
    
    defaultParams = {"JobName" :        [1, 'DIRAC'],
                     "Executable" :     [1, "/bin/ls"],
                     "Arguments" :      [1, "-ltrA"],
                     "OutputSandbox" :  [1, "std.out, std.err"],
                     "InputData" :      [0, ""],
                     "OutputData" :     [0, ""],
                     "OutputSE" :       [0, "DIRAC-USER"],
                     "OutputPath":      [0, ""],
                     "CPUTime" :        [0, "86400"],
                     "Site" :           [0, ""],
                     "BannedSite" :     [0, ""],
                     "Platform" :       [0, "Linux_x86_64_glibc-2.5"],
                     "Priority" :       [0, "5"],
                     "StdError" :       [0, "std.err"],
                     "StdOutput" :      [0, "std.out"],
                     "Parameters" :     [0, "0"],
                     "ParameterStart" : [0, "0"],
                     "ParameterStep" :  [0, "1"]}
    
    delimiter = gConfig.getValue("/Website/Launchpad/ListSeparator" , ',')
    options = self.__getOptionsFromCS(delimiter=delimiter)
#     platform = self.__getPlatform()
#     if platform and options:
#       if not options.has_key("Platform"):
#         options[ "Platform" ] = platform
#       else:
#         csPlatform = list(options[ "Platform" ])
#         allPlatforms = csPlatform + platform
#         platform = uniqueElements(allPlatforms)
#         options[ "Platform" ] = platform
    gLogger.debug("Combined options from CS: %s" % options)
    override = gConfig.getValue("/Website/Launchpad/OptionsOverride" , False)
    gLogger.info("end __getLaunchpadOpts")
    
#    Updating the default values from OptionsOverride configuration branch
    
    for key in options:
      if key not in defaultParams:
        defaultParams[key] = [ 0, "" ]                                                                                                 
      defaultParams[key][1] = options[key][0]
      
#    Reading of the predefined sets of launchpad parameters values
    
    obj = Operations()
    predefinedSets = {}
    
    launchpadSections = obj.getSections("Launchpad")
    import pprint
    if launchpadSections['OK']:
      for section in launchpadSections["Value"]:
        predefinedSets[section] = {}
        sectionOptions = obj.getOptionsDict("Launchpad/" + section)
        pprint.pprint(sectionOptions)
        if sectionOptions['OK']:
          predefinedSets[section] = sectionOptions["Value"]
    
    self.write({"success":"true", "result":defaultParams, "predefinedSets":predefinedSets})
  
  def __canRunJobs(self):
    data = self.getSessionData()
    isAuth = False
    if "properties" in data["user"]:
      if "NormalUser" in data["user"]["properties"]:
        isAuth = True
    return isAuth
  
  @asyncGen
  def web_jobSubmit(self):
   
    # self.set_header('Content-type', "text/html")  # Otherwise the browser would offer you to download a JobSubmit file
    if not self.__canRunJobs():
      self.finish({"success":"false", "error":"You are not allowed to run the jobs"})
      return
    proxy = self.__getProxyStatus(86460)
    if proxy["success"] == "false" or proxy["result"] == "false":
      self.finish({"success":"false", "error":"You can not run a job: your proxy is valid less then 24 hours"})
      return
      
    jdl = ""
    params = {}
    lfns = []
    
    for tmp in self.request.arguments:
      try:
        if len(self.request.arguments[tmp][0]) > 0:
          if tmp[:8] == "lfnField":
            if len(self.request.arguments[tmp][0].strip()) > 0:
              lfns.append("LFN:" + self.request.arguments[tmp][0])
          else:
            params[tmp] = self.request.arguments[tmp][0]
      except:
        pass
    for item in params:
      if item == "OutputSandbox":
        jdl = jdl + str(item) + " = {" + str(params[item]) + "};"
      if item == "Parameters":
        try:
          parameters = int(params[item])
          jdl = jdl + str(item) + " = \"" + str(parameters) + "\";"
        except:
          parameters = str(params[item])
          if parameters.find("{") >= 0 and parameters.find("}") >= 0:
            parameters = parameters.rstrip("}")
            parameters = parameters.lstrip("{")
            if len(parameters) > 0:
              jdl = jdl + str(item) + " = {" + parameters + "};"
            else:
              self.finish({"success":"false", "error":"Parameters vector has zero length"})
              return
          else:
            self.finish({"success":"false", "error":"Parameters must be an integer or a vector. Example: 4 or {1,2,3,4}"})
            return
      else:
        jdl = jdl + str(item) + " = \"" + str(params[item]) + "\";"
        
    store = []
    for key in self.request.files:
      try:
        if self.request.files[key][0].filename:
          gLogger.info("\033[0;31m file - %s \033[0m " % self.request.files[key][0].filename)
          store.append(self.request.files[key][0])
      except:
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
      storePath = tempfile.mkdtemp(prefix='DIRAC_')
      try:
        for fileObj in store:
          name = os.path.join(storePath , fileObj.filename.lstrip(os.sep))
          
          tFile = open(name , 'w')
          tFile.write(fileObj.body)
          tFile.close()
          
          fileNameList.append(name)
      except Exception, x:
        exception_counter = 1
        callback = {"success":"false", "error":"An EXCEPTION happens during saving your sandbox file(s): %s" % str(x)}
        
    if ((len(fileNameList) > 0) or (len(lfns) > 0)) and exception_counter == 0:
      sndBox = "InputSandbox = {\"" + "\",\"".join(fileNameList + lfns) + "\"};"
    else:
      sndBox = ""
      
    if exception_counter == 0:
      jdl = jdl + sndBox
      from DIRAC.WorkloadManagementSystem.Client.WMSClient import WMSClient
      
      jobManager = WMSClient(useCertificates=True, timeout = 1800 )
      jdl = str(jdl)
      gLogger.info("J D L : ", jdl)
      try:
        result = yield self.threadTask(jobManager.submitJob, jdl)
        if result["OK"]:
          callback = {"success":"true", "result":result["Value"]}
        else:
          callback = {"success":"false", "error":result["Message"]}
      except Exception, x:
        callback = {"success":"false", "error":"An EXCEPTION happens during job submittion: %s" % str(x)}
    if clearFS:
      shutil.rmtree(storePath)
    self.finish(callback)
    
  
  
