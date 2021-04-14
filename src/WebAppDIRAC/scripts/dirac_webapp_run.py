#!/usr/bin/env python

import sys
import tornado

from DIRAC import gConfig, S_OK
from DIRAC.Core.Base import Script
from DIRAC.Core.Utilities.DIRACScript import DIRACScript
from DIRAC.ConfigurationSystem.Client.LocalConfiguration import LocalConfiguration
from DIRAC.FrameworkSystem.Client.Logger import gLogger

from WebAppDIRAC.Core.App import App

__RCSID__ = "$Id$"


@DiracScript()
def main():
  def disableDevMode(op):
    gConfig.setOptionValue("/WebApp/DevelopMode", "False")
    return S_OK()

  def setHandlers(op):
    localCfg.handlersLoc = op
    gLogger.notice("SET handlersLoc to ", localCfg.handlersLoc)
    return S_OK()

  localCfg = LocalConfiguration()

  localCfg.handlersLoc = 'WebApp.handler'
  localCfg.setConfigurationForWeb("WebApp")
  localCfg.addMandatoryEntry("/DIRAC/Setup")
  localCfg.addDefaultEntry("/DIRAC/Security/UseServerCertificate", "yes")
  localCfg.addDefaultEntry("LogLevel", "INFO")
  localCfg.addDefaultEntry("LogColor", True)
  localCfg.registerCmdOpt("p", "production", "Enable production mode", disableDevMode)
  localCfg.registerCmdOpt("S:", "set_handlers_location=",
                          "Specify path(s) to handlers, for ex. 'OAuthDIRAC.FrameworkSystem.Utilities'",
                          setHandlers)

  result = localCfg.loadUserData()
  if not result['OK']:
    gLogger.initialize("WebApp", "/")
    gLogger.fatal("There were errors when loading configuration", result['Message'])
    sys.exit(1)

  gLogger.notice("Set next path(s): ", localCfg.handlersLoc)
  app = App(handlersLoc=localCfg.handlersLoc)
  result = app.bootstrap()
  if not result['OK']:
    gLogger.fatal(result['Message'])
    sys.exit(1)
  app.run()


if __name__ == "__main__":
  main()
