from DIRAC.WorkloadManagementSystem.Client.SandboxStoreClient import SandboxStoreClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
import json

class SystemAdministrationHandler(WebHandler):

  AUTH_PROPS = "authenticated"    
