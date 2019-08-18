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
# pylint: disable=no-name-in-module
from DIRAC.ConfigurationSystem.Client.Helpers.Resources import getInfoAboutProviders

try:
  from OAuthDIRAC.FrameworkSystem.Client.OAuthManagerClient import OAuthManagerClient  # pylint: disable=import-error
  authCli = OAuthManagerClient()
except ImportError:
  authCli = None

class AuthenticationHandler(WebHandler):

  AUTH_PROPS = "all"

  def initialize(self):
    super(AuthenticationHandler, self).initialize()
    self.loggin = gLogger.getSubLogger(__name__)
    return S_OK()

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
    session = str(self.request.arguments["session"][0])
    typeAuth = str(self.request.arguments["typeauth"][0])
    stateAuth = json.loads(self.get_secure_cookie("StateAuth") or '{ }')
    self.loggin.info('Read authentication status of "%s" session' % session)
    result = authCli.waitStateResponse(session)
    if result['OK']:
      if result['Value']['Status'] == 'authed':
        stateAuth[result['Value']['Provider']] = result['Value']['State']
        self.set_secure_cookie("TypeAuth", result['Value']['Provider'])
        self.set_secure_cookie("StateAuth", json.dumps(stateAuth), expires_days=1)
      result = S_OK()
    self.finish(result)

  @asyncGen
  def web_auth(self):
    """ Set authentication type
    """
    result = S_OK({'Action': 'reload'})
    typeAuth = str(self.request.arguments["typeauth"][0])
    stateAuth = json.loads(self.get_secure_cookie("StateAuth") or '{ }')
    if typeAuth == 'Log out':
      typeAuth = 'Visitor'
      stateAuth = {}
      for __provider, __session in stateAuth.items():
        self.loggin.info('Log out from ', __provider)
        result = authCli.killState(__session)
        if not result['OK']:
          msg = result['Message']
      result = S_OK({'Action': 'reload'})
    elif typeAuth == 'Certificate':
      typeAuth = 'Certificate'
    else:
      result = authCli.submitAuthorizeFlow(typeAuth, stateAuth.get(typeAuth))
      if result['OK']:
        stateAuth[typeAuth] = result['Value']['Session']
        if result['Value']['Status'] == 'ready':
          result['Value']['Action'] = 'reload'
        elif result['Value']['Status'] == 'needToAuth':
          result['Value']['Action'] = 'popup'
          typeAuth = self.get_secure_cookie("TypeAuth")
          stateAuth[typeAuth] = ''
        else:
          result = S_ERROR('Not correct status "%s" of %s' % (result['Value']['Status'], typeAuth))
    if result['OK']:
      self.set_secure_cookie("TypeAuth", typeAuth)
      self.set_secure_cookie("StateAuth", json.dumps(stateAuth))
    self.finish(result)
