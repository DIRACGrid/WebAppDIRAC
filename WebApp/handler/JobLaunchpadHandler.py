
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
import json
import ast

class JobLaunchpadHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  @asyncGen
  def web_getProxyStatus(self):
    from DIRAC.FrameworkSystem.Client.ProxyManagerClient import ProxyManagerClient
    
    proxyManager = ProxyManagerClient()
    
    userData = self.getSessionData()
  
    group = str(userData["user"]["group"])
    
    if group == "visitor":
      self.finish({"success":"false", "error":"User is anonymous or is not registered in the system"})
    
    userDN = str(userData["user"]["DN"])
    
    defaultSeconds = 24 * 3600 + 60  # 24H + 1min
    validSeconds = gConfig.getValue("/Registry/DefaultProxyLifeTime", defaultSeconds)
      
    gLogger.info("\033[0;31m userHasProxy(%s, %s, %s) \033[0m" % (userDN, group, validSeconds))
    
    result = yield self.threadTask(proxyManager.userHasProxy, userDN, group, validSeconds)
    
    if result["OK"]:
      if result["Value"]:
        self.finish({"success":"true", "result":"true"})
      else:
        self.finish({"success":"true", "result":"false"})
    else:
      self.finish({"success":"false", "error":"false"})
      
    gLogger.info("\033[0;31m PROXY: \033[0m", result)
    
    
  
  
