import json
import time
import pprint

from tornado.web import HTTPError, RequestHandler
from tornado.template import Template

from DIRAC import S_OK, S_ERROR, gLogger
from DIRAC.FrameworkSystem.Client.NotificationClient import NotificationClient

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen

try:
  from OAuthDIRAC.FrameworkSystem.Client.OAuthManagerClient import OAuthManagerClient  # pylint: disable=import-error
  authCli = OAuthManagerClient()
except ImportError:
  authCli = None

class AuthenticationHandler(WebHandler):

  AUTH_PROPS = "all"

  def initialize(self):
    super(AuthenticationHandler, self).initialize()
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
    self.log.verbose('Send mail to' % addresses)
    result = NotificationClient().sendMail(addresses, subject=subject, body=body)
    self.finish(result)

  @asyncGen
  def web_getAuthNames(self):
    """ Get list of enable authentication types
    """
    self.finish(Conf.getAuthNames())

  @asyncGen
  def web_waitOAuthStatus(self):
    """ Listen authentication status on OAuthDB
    """
    session = str(self.request.arguments["session"][0])
    typeAuth = str(self.request.arguments["typeauth"][0])
    self.log.verbose(session, 'session, waiting "%s" authentication status' % typeAuth)
    try:
      stateAuth = json.loads(self.get_cookie("StateAuth"))
    except BaseException as e:
      stateAuth = {}
    
    gLogger.notice(session, "session, waiting authorization status")
    result = S_ERROR('Timeout')
    for i in range(60):
      result = authCli.getSessionStatus(session)
      if not result['OK']:
        break
      gLogger.verbose('%s session' % session, result['Value']['Status'])
      if result['Value']['Status'] == 'prepared' and i > 3:
        result = S_ERROR('Waiting authentication response to long.')
        break
      if result['Value']['Status'] not in ['prepared', 'in progress']:
        break
      time.sleep(5)
    
    if not result['OK']:
      authCli.killState(session)
      self.log.error(session, 'session, %s' % result['Message'])
    else:
      status = result['Value']['Status']
      self.log.verbose(session, 'session, authentication status: %s' % status)
      if status == 'authed':
        stateAuth[result['Value']['Provider']] = result['Value']['State']
      else:
        stateAuth[result['Value']['Provider']] = ''
      self.log.debug(session, 'session, status dictionary:\n%s' % pprint.pformat(result['Value']))
      self.log.verbose(session, 'session, set cookie: "TypeAuth": %s' % result['Value']['Provider'])
      self.log.verbose(session, 'session, set cookie: "StateAuth": %s' % json.dumps(stateAuth))
      self.set_cookie("TypeAuth", result['Value']['Provider'])
      self.set_cookie("StateAuth", json.dumps(stateAuth).replace(' ', ''))
    self.finish(result)

  @asyncGen
  def web_auth(self):
    """ Set authentication type
    """
    result = S_OK({'Action': 'reload'})
    typeAuth = str(self.request.arguments["typeauth"][0])
    try:
      stateAuth = json.loads(self.get_cookie("StateAuth"))
    except BaseException as e:
      stateAuth = {}
    if typeAuth == 'Log out':
      typeAuth = 'Visitor'
      stateAuth = {}
      for provider, session in stateAuth.items():
        self.log.info('Log out from ', provider)
        result = authCli.killState(session)
        if not result['OK']:
          msg = result['Message']
      result = S_OK({'Action': 'reload'})
    elif not typeAuth == 'Certificate':
      session = stateAuth.get(typeAuth)
      self.log.info('Try autheticate by "%s"' % typeAuth, 'with %s' % session if session else '')
      result = authCli.submitAuthorizeFlow(typeAuth, session)
      if result['OK']:
        if result['Value']['Status'] == 'ready':
          result['Value']['Action'] = 'reload'
          stateAuth[typeAuth] = result['Value']['Session']
        elif result['Value']['Status'] == 'needToAuth':
          stateAuth[typeAuth] = ''
          result['Value']['Action'] = 'popup'
          typeAuth = self.get_cookie("TypeAuth") or 'Certificate'
        else:
          result = S_ERROR('Not correct status "%s" of %s' % (result['Value']['Status'], typeAuth))
    if result['OK']:
      action = result['Value']['Action']
      session = stateAuth.get(typeAuth) or ''
      self.log.debug('"%s" action by %s authetication' % (action, typeAuth),
                     session and 'with %s session' % session)
      self.log.debug(session and '%s session.' % session,
                     'Set cookie: "TypeAuth": %s' % typeAuth)
      self.log.debug(session and '%s session.' % session,
                     'Set cookie: "StateAuth": %s' % json.dumps(stateAuth))
      self.set_cookie("TypeAuth", typeAuth)
      self.set_cookie("StateAuth", json.dumps(stateAuth).replace(' ', ''))
    self.finishJEncode(result)
