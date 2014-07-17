from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
import json

class PublicStateManagerHandler( WebHandler ):

  AUTH_PROPS = "authenticated"
  
  @asyncGen
  def web_getTreeMenuItems( self ):
    applications = {}
    desktops = {}
    tree = { 'text':'.',
            "children": [applications, desktops]}
    
  
