
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



