#!/usr/bin/env python
import os
import six
import sys
import tornado

from DIRAC import gConfig, S_OK
from DIRAC.Core.Base import Script
from DIRAC.Core.Utilities.Extensions import extensionsByPriority, getExtensionMetadata
from DIRAC.Core.Utilities.DIRACScript import DIRACScript
from DIRAC.ConfigurationSystem.Client.LocalConfiguration import LocalConfiguration
from DIRAC.FrameworkSystem.Client.Logger import gLogger

from WebAppDIRAC.Core.App import App

__RCSID__ = "$Id$"


def _createStaticSymlinks(targetDir):
  """Create symlinks to static web content

  This method is used to populate the directory specified in the local
  configuration under ``/WebApp/StaticResourceLinkDir`` so that nginx can
  serve this content from a consistent location.

  :params str targetDir: The directory in which to create the symlinks
  """
  extensions = extensionsByPriority()
  for extension in extensions:
    if six.PY3:
      metadata = getExtensionMetadata(extension)
      staticDirs = metadata.get("web_resources", {}).get("static", [])
    else:
      staticDirs = []
      try:
        modFile, modPath, desc = imp.find_module(extName)
        # to match in the real root path to enabling module web extensions (static, templates...)
        realModPath = os.path.realpath(modPath)
      except ImportError:
        continue
      staticDirs = [os.path.join(realModPath, "WebApp", "static")]
      if not os.path.isdir(staticDirs[0]):
        continue

    for i, path in enumerate(sorted(staticDirs)):
      destination = os.path.join(targetDir, extension)
      # If there is more than one suffix append a counter
      if i >= 1:
        destination += "-%s" % i
      gLogger.notice("    creating symlink from", "%s to %s" % (path, destination))
      if os.path.islink(destination):
        if path == os.readlink(destination):
          # The link is already up to date
          continue
        os.unlink(destination)
      os.symlink(path, destination)

  # TODO: Check /etc/nginx/conf.d/site.conf and warn if it's inconsistent?


@DIRACScript()
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

  result = DIRAC.gConfig.getOption("/WebApp/StaticResourceLinkDir")
  if result["OK"]:
    gLogger.notice("Creating symlinks to static resources")
    _createStaticSymlinks(result["Value"])
  else:
    gLogger.warn("Not creating symlinks to static resources", result["Message"])

  gLogger.notice("Set next path(s): ", localCfg.handlersLoc)
  app = App(handlersLoc=localCfg.handlersLoc)
  result = app.bootstrap()
  if not result['OK']:
    gLogger.fatal(result['Message'])
    sys.exit(1)
  app.run()


if __name__ == "__main__":
  main()
