import json
import tornado
import requests
import tornado.web

from tornado.web import HTTPError, RequestHandler
from tornado.template import Template

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen

from DIRAC import S_OK, S_ERROR, gLogger
from DIRAC.FrameworkSystem.Client.NotificationClient import NotificationClient
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getUsernameForID
from DIRAC.ConfigurationSystem.Client.Helpers.Resources import getInfoAboutProviders

try:
  from OAuthDIRAC.FrameworkSystem.Client.OAuthManagerClient import OAuthManagerClient
  oauth = OAuthManagerClient()
except ImportError:
  oauth = None

class AuthenticationHandler(WebHandler):

  AUTH_PROPS = "all"

  @asyncGen
  def web_sendRequest(self):
    """ Send mail to administrators
    """
    typeAuth = str(self.request.arguments["typeauth"][0])
    loadValue = self.request.arguments["value"]
    addresses = Conf.getCSValue('AdminsEmails')
    subject = "Request from %s %s" % (loadValue[0], loadValue[1])
    body = 'Type auth: %s, details: %s' % (typeAuth, loadValue)
    result = NotificationClient().sendMail(addresses, subject=subject, body=body)
    self.finish(result)

  @asyncGen
  def web_getAuthNames(self):
    """ Get list of enable authentication types
    """
    self.finish(Conf.getAuthNames())

  @asyncGen
  def web_getAuthCFG(self):
    """ Get option from IdP
    """
    settings = {}
    result = S_OK()
    typeAuth = str(self.request.arguments["typeauth"][0])
    providerType = getInfoAboutProviders(ofWhat='Id', providerName=typeAuth, option='Type')['Value']
    if providerType == 'OAuth2':
      result = oauth.createAuthRequestURL(typeAuth)
      if result['OK']:
        settings = result['Value']
    result['Value'] = {'providerType': providerType, 'settings': settings}
    self.finish(result)

  @asyncGen
  def web_getCurrentAuth(self):
    """ Get current authentication type
    """
    if self.get_secure_cookie("TypeAuth"):
      current = self.get_secure_cookie("TypeAuth")
    else:
      current = 'default'
    self.finish(current)

  @asyncGen
  def web_waitOAuthStatus(self):
    """ Listen authentication status on OAuthDB
    """
    state = str(self.request.arguments["state"][0])
    typeAuth = str(self.request.arguments["typeauth"][0])
    gLogger.debug('Read authentication status of ", "%s" session' % state)
    result = oauth.waitStateResponse(state)
    if result['OK']:
      if result['Value']['Status'] == 'authed':
        self.set_secure_cookie("TypeAuth", result['Value']['OAuthProvider'])
        self.set_secure_cookie("StateAuth", result['Value']['State'], expires_days=1)
      result = S_OK()
    self.finish(result)

  @asyncGen
  def web_auth(self):
    """ Set authentication type
    """
    logOut = False
    typeAuth = str(self.request.arguments["typeauth"][0])

    result = Conf.getCSSections("TypeAuths")
    if not result['OK']:
      self.finish(result)
    auths = result['Value']

    # Log out
    if typeAuth == 'Log out':
      logOut = True
      typeAuth = self.get_secure_cookie("TypeAuth")

    if typeAuth == 'Certificate':
      if logOut:
        self.set_secure_cookie("TypeAuth", 'Visitor')
      else:
        self.set_secure_cookie("TypeAuth", typeAuth)

    # Not in CS
    elif typeAuth not in auths:
      if logOut:
        self.set_secure_cookie("TypeAuth", 'Visitor')
      else:
        self.finish(S_ERROR('Not found %s identity provider in configuration' % typeAuth))

    providerType = getInfoAboutProviders(ofWhat='Id', providerName=typeAuth, option='Type')['Value']
    if providerType == 'OAuth2':
      if logOut:
        state = self.get_secure_cookie("StateAuth")
        oauth.killState(state)
        self.set_secure_cookie("TypeAuth", 'Visitor')
      else:
        self.set_secure_cookie("TypeAuth", typeAuth)
    else:
      if logOut:
        self.set_secure_cookie("TypeAuth", 'Visitor')
      else:
        self.finish(S_ERROR('Cannot get type of %s identity provider' % typeAuth))

    self.finish(S_OK())
