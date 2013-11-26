
from WebAppDIRAC.Lib.WebHandler import WebHandler, WebSocketHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time, List, DictCache
from DIRAC.Core.Utilities.CFG import CFG
from DIRAC.ConfigurationSystem.private.Modificator import Modificator

import json
import types
import time

class RegistryManagerHandler(WebSocketHandler):

  AUTH_PROPS = "authenticated"

  def on_open(self):
    self.__configData = {}

  @asyncGen
  def on_message(self, msg):

    self.log.info("RECEIVED %s" % msg)
    try:
      params = json.loads(msg)
    except:
      gLogger.exception("No op defined")

    res = False
    if params["op"] == "init":
      res = self.__getRemoteConfiguration("init")
    elif params["op"] == "getData":
      res = self.__getData(params)
      
    if res:
      self.write_message(res)

  def __getRemoteConfiguration(self, funcName):
    rpcClient = RPCClient(gConfig.getValue("/DIRAC/Configuration/MasterServer", "Configuration/Server"))
    modCfg = Modificator(rpcClient)
    retVal = modCfg.loadFromRemote()

    if not retVal[ 'OK' ]:
      return {"success":0, "op":"getSubnodes", "message":"The configuration cannot be read from the remote !"}

    self.__configData[ 'cfgData' ] = modCfg
    self.__configData[ 'strCfgData' ] = str(modCfg)
    
    version = str(modCfg.getCFG()["DIRAC"]["Configuration"]["Version"])
    configName = str(modCfg.getCFG()["DIRAC"]["Configuration"]["Name"])
    return {"success":1, "op":funcName, "version":version, "name":configName}
  
  def __getData(self, params):
    data = []
    if params["type"] == "users":
      
      sectionPath = "/Registry/Users"
      sectionCfg = self.getSectionCfg(sectionPath)
      
      for username in sectionCfg.listAll():
        
        item = {}
        item["name"] = username
        props = sectionCfg[username]
        
        item["dn"] = self.getIfExists("DN", props)
        item["ca"] = self.getIfExists("CA", props)
        item["email"] = self.getIfExists("Email", props)
        
        data.append(item)
      
    elif params["type"] == "groups":
      sectionPath = "/Registry/Groups"
      sectionCfg = self.getSectionCfg(sectionPath)
      
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
      sectionPath = "/Registry/Hosts"
      sectionCfg = self.getSectionCfg(sectionPath)
      
      for host in sectionCfg.listAll():
        item = {}
        item["name"] = host
        props = sectionCfg[host]
        
        item["dn"] = self.getIfExists("DN", props)
        item["properties"] = self.getIfExists("Properties", props)
        
        data.append(item)
    
    return {"op":"getData", "success":1, "type": params["type"], "data": data}
  
  def getSectionCfg(self, sectionPath):
    sectionCfg = None
    try:
      sectionCfg = self.__configData[ 'cfgData' ].getCFG()
      for section in [ section for section in sectionPath.split("/") if not section.strip() == "" ]:
        sectionCfg = sectionCfg[ section ]
    except Exception, v:
      return False
    return sectionCfg
  
  def getIfExists(self, elem, propsList):
    if elem in propsList.listAll():
      return propsList[elem]
    else:
      return ""
  
  



