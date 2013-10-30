
from DIRAC.WorkloadManagementSystem.Client.SandboxStoreClient import SandboxStoreClient
from DIRAC.FrameworkSystem.Client.SystemAdministratorClient import SystemAdministratorClient
from DIRAC.FrameworkSystem.Client.SystemAdministratorIntegrator import SystemAdministratorIntegrator
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
import json

class SystemAdministrationHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  @asyncGen
  def web_getSysInfo(self):
    
    userData = self.getSessionData()
    
    DN = str(userData["user"]["DN"])
    group = str(userData["user"]["group"])

    # TODO: remove hosts code after v6r7 since it will be built-in
    result = gConfig.getSections("/Registry/Hosts")
    if not result[ "Value" ]:
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    hosts = result[ "Value" ]

    client = SystemAdministratorIntegrator(hosts=hosts , delegatedDN=DN ,
                                          delegatedGroup=group)
    result = yield self.threadTask(client.getHostInfo)
    gLogger.debug(result)
    if not result[ "OK" ]:
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    result = result[ "Value" ]

    callback = list()
    for i in result:
      if result[ i ][ "OK" ]:
        tmp = result[ i ][ "Value" ]
      else:
        tmp = dict()
      tmp[ "Host" ] = i
      callback.append(tmp)

    total = len(callback)
    if not total > 0:
      self.finish({ "success" : "false" , "error" : "No system information found" })
      return
    
    self.finish({ "success" : "true" , "result" : callback , "total" : total })
  
  @asyncGen  
  def web_getHostData(self):
    """
    Returns flatten list of components (services, agents) installed on hosts
    returned by getHosts function
    """

    # checkUserCredentials()
    userData = self.getSessionData()
    
    DN = str(userData["user"]["DN"])
    group = str(userData["user"]["group"])

    callback = list()
    
    if not (self.request.arguments.has_key("hostname") and len(self.request.arguments["hostname"][0]) > 0):
      self.finish({ "success" : "false" , "error" : "Name of the host is absent" })
      return
    
    host = self.request.arguments["hostname"][0]
    client = SystemAdministratorClient(host , None , delegatedDN=DN ,
                                          delegatedGroup=group)
    result = yield self.threadTask(client.getOverallStatus)
    gLogger.debug("Result of getOverallStatus(): %s" % result)

    if not result[ "OK" ]:
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    
    overall = result[ "Value" ]
   
    for record in self.flatten(overall):
      record[ "Host" ] = host
      callback.append(record)

    self.finish({ "success" : "true" , "result" : callback })
    
    
  def flatten( self , dataDict ):

    """
    Flatten dict of dicts structure returned by getOverallStatus() method of
    SystemAdministrator client
    """

    for kind , a in dataDict.items():
      for system , b in a.items():
        for name , c in b.items():
          if ( "Installed" in c ) and ( c[ "Installed" ] ):
            c[ "Type" ] = kind
            c[ "System" ] = system
            c[ "Name" ] = name
            yield c
