#!/usr/bin/env python

import os
import sys

from DIRAC.Core.Base.Script import Script


@Script()
def main():
    # Must be define BEFORE any dirac import.
    os.environ["DIRAC_USE_TORNADO_IOLOOP"] = "True"

    from DIRAC.ConfigurationSystem.Client.LocalConfiguration import LocalConfiguration
    from DIRAC.Core.Tornado.Server.TornadoServer import TornadoServer
    from DIRAC.Core.Utilities.DErrno import includeExtensionErrors
    from DIRAC.FrameworkSystem.Client.Logger import gLogger

    localCfg = LocalConfiguration()
    localCfg.addDefaultEntry("/DIRAC/Security/UseServerCertificate", "yes")
    localCfg.addDefaultEntry("LogLevel", "INFO")
    localCfg.addDefaultEntry("LogColor", True)
    resultDict = localCfg.loadUserData()
    if not resultDict["OK"]:
        gLogger.initialize("Tornado", "/")
        gLogger.error("There were errors when loading configuration", resultDict["Message"])
        sys.exit(1)

    includeExtensionErrors()

    gLogger.initialize("Tornado", "/")

    serverToLaunch = TornadoServer(False)

    try:
        from WebAppDIRAC.Core.App import App
    except ImportError as e:
        gLogger.fatal(f"Web portal is not installed. {repr(e)}")
        sys.exit(1)

    # Get routes and settings for a portal
    result = App().getAppToDict(8010)
    if not result["OK"]:
        gLogger.fatal(result["Message"])
        sys.exit(1)
    app = result["Value"]

    serverToLaunch.addHandlers(app["routes"], app["settings"], app["port"])

    serverToLaunch.startTornado()


if __name__ == "__main__":
    main()
