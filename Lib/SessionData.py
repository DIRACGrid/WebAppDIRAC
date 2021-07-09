from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import List
from DIRAC.Core.DISET.AuthManager import AuthManager
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
from DIRAC.ConfigurationSystem.Client.Helpers import CSGlobals
from DIRAC.ConfigurationSystem.Client.Helpers.Operations import Operations


from WebAppDIRAC.Lib import Conf

__RCSID__ = "$Id$"


class SessionData(Operations):
  __handlers = {}
  __groupMenu = {}
  __extensions = []
  __extVersion = "ext-6.2.0"

  @classmethod
  def setHandlers(cls, handlers):
    """ Set handlers

        :param dict handlers: handlers
    """
    cls.__handlers = {}
    for k in handlers:
      handler = handlers[k]
      cls.__handlers[handler.LOCATION.strip("/")] = handler
    # Calculate extensions
    cls.__extensions = CSGlobals.getInstalledExtensions()
    for ext in ['DIRAC', 'WebAppDIRAC']:
      if ext in cls.__extensions:
        cls.__extensions.append(cls.__extensions.pop(cls.__extensions.index(ext)))

  def __init__(self, credDict, setup):
    """ Discovers the vo and the setup

        :param dict credDict: user crentials
        :param str setup: requested setup
    """
    self.__credDict = credDict
    super(SessionData, self).__init__(group=credDict.get("group"), setup=setup, mainSection='WebApp')

  def __isGroupAuthApp(self, appLoc):
    """ The method checks if the application is authorized for a certain user group

        :param str appLoc It is the application name for example: DIRAC.JobMonitor
        
        :return bool -- if the handler is authorized to the user returns True otherwise False
    """
    handlerLoc = "/".join(List.fromChar(appLoc, ".")[1:])
    if not handlerLoc:
      gLogger.error("Application handler does not exists:", appLoc)
      return False
    if handlerLoc not in self.__handlers:
      gLogger.error("Handler %s required by %s does not exist!" % (handlerLoc, appLoc))
      return False
    handler = self.__handlers[handlerLoc]
    auth = AuthManager(self.getSectionPath('Access/%s' % handlerLoc))
    gLogger.info("Authorization: %s -> %s" % (dict(self.__credDict), handler.AUTH_PROPS))
    return auth.authQuery("", dict(self.__credDict), handler.AUTH_PROPS)

  def __generateSchema(self, path=""):
    """ Generate a menu schema based on the user credentials

        :param str path: path

        :return: list
    """
    # Calculate schema
    schema = []
    result = self._getCFG(os.path.join(self.getValue("UseSchema", "Schema"), path))
    if not result['OK']:
      return schema
    cfg = result['Value']
    for sName in cfg.listSections():
      subSchema = self.__generateSchema(os.path.join(path, sName))
      if subSchema:
        schema.append((sName, subSchema))
    for opName in cfg.listOptions():
      opVal = cfg.getOption(opName)
      if opVal.find("link|") == 0:
        schema.append(("link", opName, opVal[5:]))
        continue
      if self.__isGroupAuthApp(opVal):
        schema.append(("app", opName, opVal))
    return schema

  def __getGroupMenu(self):
    """ Load the schema from the CS and filter based on the group

        :param dict cfg: dictionary with current configuration

        :return: list
    """
    key = (self._group, self._setup)
    if key not in self.__groupMenu or self._cacheExpired():
      self.__groupMenu[key] = self.__generateSchema()
    return self.__groupMenu[key]

  @classmethod
  def getExtJSVersion(cls):
    """ Get ExtJS version

        :return: str
    """
    return cls.__extVersion

  def getWebConfiguration(self):
    """ Get WebApp configuration

        :return: dict
    """
    result = self._getCFG()
    return result['Value'].getAsDict() if result['OK'] else {}

  def getData(self, opt=None):
    """ Return session data

        :param str opt: option

        :return: dict
    """
    data = {'configuration': self.getWebConfiguration(),
            'menu': self.__getGroupMenu(),
            'user': self.__credDict,
            'validGroups': [],
            'setup': self.__setup,
            'validSetups': gConfig.getSections("/DIRAC/Setups")['Value'],
            'extensions': self.__extensions,
            'extVersion': self.getExtJSVersion()}
    # Add valid groups if known
    DN = self.__credDict.get("DN", "")
    if DN:
      result = Registry.getGroupsForDN(DN)
      if result['OK']:
        data['validGroups'] = result['Value']
    # Calculate baseURL
    baseURL = [Conf.rootURL().strip("/"),
               "s:%s" % data['setup'],
               "g:%s" % self.__credDict.get('group', '')]
    data['baseURL'] = "/%s" % "/".join(baseURL)
    return data[opt] if opt else data
