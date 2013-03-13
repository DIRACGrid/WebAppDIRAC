
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR
import json
import ast

class AccountingPlotHandler(WebHandler):

  AUTH_PROPS = "authenticated"
     
  def index(self):
    pass