#!/usr/bin/env python

import sys
import tornado
from DIRAC.Core.Base import Script
from DIRAC.ConfigurationSystem.Client.LocalConfiguration import LocalConfiguration
from DIRAC.FrameworkSystem.Client.Logger import gLogger
from WebAppDIRAC.Core.App import App

if __name__ == "__main__":

  localCfg = LocalConfiguration()

  localCfg.setConfigurationForWeb( "WebApp" )
  localCfg.addMandatoryEntry( "/DIRAC/Setup" )
  localCfg.addDefaultEntry( "/DIRAC/Security/UseServerCertificate", "yes" )
  localCfg.addDefaultEntry( "LogLevel", "INFO" )
  localCfg.addDefaultEntry( "LogColor", True )

  result = localCfg.loadUserData()
  if not result[ 'OK' ]:
    gLogger.initialize( serverName, "/" )
    gLogger.fatal( "There were errors when loading configuration", result[ 'Message' ] )
    sys.exit( 1 )

  app = App()
  result = app.bootstrap()
  if not result[ 'OK' ]:
    gLogger.fatal( result[ 'Message' ] )
    sys.exit( 1 )
  app.run()


