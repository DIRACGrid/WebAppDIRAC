from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getUsernameForID
from DIRAC.FrameworkSystem.Client.NotificationClient   import NotificationClient
from WebAppDIRAC.Lib import Conf

import json
import tornado
import requests

class AuthenticationHandler(WebHandler):

  AUTH_PROPS = "all"
  
  # Send mail to administrators
  @asyncGen
  def web_sendRequest(self):
    typeAuth = str(self.request.arguments["typeauth"][0])
    loadValue = self.request.arguments["value"]
    addresses = Conf.getCSValue('AdminsEmails')
    NotificationClient().sendMail(addresses,subject = "Request from %s %s" % (loadValue[0],loadValue[1]),body = 'Type auth: %s, details: %s' % (typeAuth,loadValue))

  # Get information from web.cfg about auth types
  @asyncGen
  def web_getAuthCFG(self):
    typeAuth = str(self.request.arguments["typeauth"][0])
    loadValue = self.request.arguments["value"][0]
    res = {}
    if Conf.getCSSections("TypeAuths")['OK']:
      if typeAuth:
        if loadValue:
          if loadValue == 'all':
            res = Conf.getCSOptionsDict("TypeAuths/%s" % typeAuth).get('Value')
          else:
            res = Conf.getCSValue("TypeAuths/%s/%s" % (typeAuth, loadValue), None)
        else:
          res = Conf.getCSOptions("TypeAuths/%s" % typeAuth)
      else:
        res = Conf.getCSSections("TypeAuths")
    self.write(res)

  # Get current auth type
  @asyncGen
  def web_getCurrentAuth(self):
    if self.get_secure_cookie("TypeAuth"):
      current = self.get_secure_cookie("TypeAuth")
    else:
      current = 'default'
    self.write(current)

  # Python part in auth process
  @asyncGen
  def web_auth(self):
    typeAuth = str(self.request.arguments["typeauth"][0])
    loadValue = self.request.arguments["value"][0]
    method = Conf.getCSValue("TypeAuths/%s/method" % typeAuth)
    auths = ['Certificate']
    if Conf.getCSSections("TypeAuths")['OK']:
      auths.extend(Conf.getCSSections("TypeAuths").get("Value"))
    if (typeAuth == 'Logout') or (typeAuth not in auths):
      typeAuth = self.get_secure_cookie("TypeAuth")
      self.set_secure_cookie("TypeAuth", 'Visitor')
    elif method == 'oAuth2':
      accessToken = loadValue
      url = Conf.getCSValue('TypeAuths/%s/authority' % typeAuth) + '/userinfo'
      access = 'Bearer ' + accessToken
      heads = {'Authorization': access, 'Content-Type': 'application/json'}
      oJson = requests.get(url, headers=heads, verify=False).json()
      res = getUsernameForID(oJson['sub'])
      if res['OK']:
        self.set_secure_cookie("TypeAuth", typeAuth)
        self.set_secure_cookie("AccessToken", accessToken)
        self.write({"value": 'Done'})
      else:
        self.write({"value": 'NotRegistred', "profile": oJson})
    else:
      self.set_secure_cookie("TypeAuth", typeAuth)
