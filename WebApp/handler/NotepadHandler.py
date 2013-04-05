
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
import json

class NotepadHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  def index(self):
    pass