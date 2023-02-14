#!/usr/bin/env python
import os
import sys

import tornado.iostream

tornado.iostream.SSLIOStream.configure(
    "tornado_m2crypto.m2iostream.M2IOStream"
)  # pylint: disable=wrong-import-position

from DIRAC import gConfig, S_OK
from DIRAC.Core.Base.Script import Script
from DIRAC.Core.Utilities.Extensions import extensionsByPriority, getExtensionMetadata
from DIRAC.ConfigurationSystem.Client.LocalConfiguration import LocalConfiguration
from DIRAC.FrameworkSystem.Client.Logger import gLogger

from WebAppDIRAC.Core.App import App


def _createStaticSymlinks(targetDir):
    """Create symlinks to static web content

    This method is used to populate the directory specified in the local
    configuration under ``/WebApp/StaticResourceLinkDir`` so that nginx can
    serve this content from a consistent location.

    :params str targetDir: The directory in which to create the symlinks
    """
    if not os.path.isdir(targetDir):
        os.makedirs(targetDir)
    extensions = extensionsByPriority()
    for extension in extensions:
        metadata = getExtensionMetadata(extension)
        staticDirs = metadata.get("web_resources", {}).get("static", [])

        for i, path in enumerate(sorted(staticDirs)):
            destination = os.path.join(targetDir, extension)
            # If there is more than one suffix append a counter
            if i >= 1:
                destination += f"-{i}"
            gLogger.notice("    creating symlink from", f"{path} to {destination}")
            if os.path.islink(destination):
                if path == os.readlink(destination):
                    # The link is already up to date
                    continue
                os.unlink(destination)
            os.symlink(path, destination)

    # TODO: Check /etc/nginx/conf.d/site.conf and warn if it's inconsistent?


def _checkDIRACVersion():
    """Validate a compatible DIRAC version is installed

    In order to build WebApp extensions it is necessary to install the vanilla
    WebApp during the compilation of the javascrip sources. The dependency on DIRAC
    makes this unreliable as M2Crypto and gfal2 are both hard to install.

    Instead, the DIRAC dependency is only included when installing the "server"
    extra however this makes it possible to install incompatible version of DIRAC.
    To avoid hard-to-debug failures we inspect the metadata when launching the
    service and refuse to start if the DIRAC version is incompatible.
    """
    from importlib.metadata import requires, version  # pylint: disable=import-error,no-name-in-module
    from packaging.requirements import Requirement  # pylint: disable=no-name-in-module

    deps = [Requirement(x) for x in requires("WebAppDIRAC")]
    deps = [x for x in deps if x.name.lower() == "dirac"]
    if len(deps) != 1:
        raise NotImplementedError(f"This shouldn't be possible: {deps!r}")
    dirac_version = version("DIRAC")
    dirac_spec = deps[0].specifier
    if dirac_version not in dirac_spec:
        raise RuntimeError(
            "WebAppDIRAC {} requires {} but {} is incompatible".format(
                version("WebAppDIRAC"), dirac_version, dirac_spec
            )
        )


@Script()
def main():
    def ignoreIncompatible(op):
        gConfig.setOptionValue("/WebApp/IgnoreVersionCheck", "True")
        return S_OK()

    def disableDevMode(op):
        gConfig.setOptionValue("/WebApp/DevelopMode", "False")
        return S_OK()

    def setHandlers(op):
        localCfg.handlersLoc = op
        gLogger.notice("SET handlersLoc to ", localCfg.handlersLoc)
        return S_OK()

    localCfg = LocalConfiguration()

    localCfg.handlersLoc = "WebApp.handler"
    localCfg.setConfigurationForWeb("WebApp")
    localCfg.addDefaultEntry("/DIRAC/Security/UseServerCertificate", "yes")
    localCfg.addDefaultEntry("LogLevel", "INFO")
    localCfg.addDefaultEntry("LogColor", True)
    localCfg.registerCmdOpt("i", "--ignore-incompatible", "Ignore incompatible version.", ignoreIncompatible)
    localCfg.registerCmdOpt("p", "production", "Enable production mode", disableDevMode)
    localCfg.registerCmdOpt(
        "S:",
        "set_handlers_location=",
        "Specify path(s) to handlers, for ex. 'OAuthDIRAC.FrameworkSystem.Utilities'",
        setHandlers,
    )

    result = localCfg.loadUserData()
    if not result["OK"]:
        gLogger.initialize("WebApp", "/")
        gLogger.fatal("There were errors when loading configuration", result["Message"])
        sys.exit(1)

    if gConfig.getOption("/WebApp/IgnoreVersionCheck").get("Value", "").lower() not in ["yes", "true"]:
        _checkDIRACVersion()

    result = gConfig.getOption("/WebApp/StaticResourceLinkDir")
    if result["OK"]:
        gLogger.notice("Creating symlinks to static resources")
        _createStaticSymlinks(result["Value"])
    else:
        gLogger.warn("Not creating symlinks to static resources", result["Message"])

    gLogger.notice("Set next path(s): ", localCfg.handlersLoc)
    app = App(handlersLoc=localCfg.handlersLoc)
    result = app.bootstrap()
    if not result["OK"]:
        gLogger.fatal(result["Message"])
        sys.exit(1)
    app.run()


if __name__ == "__main__":
    main()
