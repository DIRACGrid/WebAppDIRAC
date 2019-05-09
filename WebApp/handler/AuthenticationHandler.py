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
from DIRAC.ConfigurationSystem.Client.Helpers.Resources import getIdPOption
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getUsernameForID

try:
  from OAuthDIRAC.FrameworkSystem.Client.OAuthManagerClient import OAuthManagerClient
  oauth = OAuthManagerClient()
except:
  oauth = None


class AuthenticationHandler(WebHandler):

  AUTH_PROPS = "all"

  oauth = OAuthClient()

  @asyncGen
  def web_sendRequest(self):
    """ Send mail to administrators """
    typeAuth = str(self.request.arguments["typeauth"][0])
    loadValue = self.request.arguments["value"]
    addresses = Conf.getCSValue('AdminsEmails')
    subject = "Request from %s %s" % (loadValue[0],loadValue[1])
    body = 'Type auth: %s, details: %s' % (typeAuth,loadValue)
    result = NotificationClient().sendMail(addresses,subject=subject,body=body)
    self.finish(result)

  @asyncGen
  def web_getAuthNames(self):
    """ Get list of enable authentication types """
    self.finish(Conf.getAuthNames())

  @asyncGen
  def web_getAuthCFG(self):
    """ Get option from IdP """
    typeAuth = str(self.request.arguments["typeauth"][0])
    loadValue = self.request.arguments["value"][0]
    res = getIdPOption(typeAuth,loadValue)
    if not res:
      method = getIdPOption(typeAuth, 'method')
      if method == 'oAuth2':
        if loadValue == 'authorization_url':
          res = oauth.create_auth_request_uri(typeAuth) if oauth else S_ERROR('OAuthDIRAC extantion is not enable')
          if not res['OK']:
            self.finish(res)
          res = res['Value']
    self.finish(S_OK(res))

  @asyncGen
  def web_getCurrentAuth(self):
    """ Get current authentication type """
    if self.get_secure_cookie("TypeAuth"):
      current = self.get_secure_cookie("TypeAuth")
    else:
      current = 'default'
    self.finish(current)

  @asyncGen
  def web_waitOAuthStatus(self):
    """ Listen authentication status on OAuthDB """ 
    state = str(self.request.arguments["state"][0])
    typeAuth = str(self.request.arguments["typeauth"][0])
    gLogger.debug('Read authentication status of "%s" session' % state)
    result = oauth.waitStateResponse(state) if oauth else S_ERROR('OAuthDIRAC extantion is not enable')
    if result['OK']:
      if result['Value']['Status'] == 'authed':
        self.set_secure_cookie("TypeAuth", result['Value']['OAuthProvider'])
        self.set_secure_cookie("StateAuth", result['Value']['State'], expires_days=1)
      result = S_OK()
    self.finish(result)

  @asyncGen
  def web_auth(self):
    """ Set authentication type """
    typeAuth = str(self.request.arguments["typeauth"][0])
    needLogOut = False
    auths = ['Certificate']
    if Conf.getCSSections("TypeAuths")['OK']:
      auths.extend(Conf.getCSSections("TypeAuths").get("Value"))
    if (typeAuth == 'Log out') or (typeAuth not in auths):
      typeAuth = self.get_secure_cookie("TypeAuth")
      self.set_secure_cookie("TypeAuth", 'Visitor')
      needLogOut = True
    method = getIdPOption(typeAuth, 'method')
    if needLogOut:
      if method == 'oAuth2':
        state = self.get_secure_cookie("StateAuth")
        result = oauth.killState(state) if oauth else S_ERROR('OAuthDIRAC extantion is not enable')
    else:
      self.set_secure_cookie("TypeAuth", typeAuth)
    self.finish(S_OK())
  