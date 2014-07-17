from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
import json

class ApplicationWizardHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  


