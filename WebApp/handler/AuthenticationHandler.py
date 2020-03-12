import json
import time
import pprint

from tornado.web import HTTPError, RequestHandler

from DIRAC import S_OK, S_ERROR, gLogger
from DIRAC.FrameworkSystem.Client.NotificationClient import NotificationClient

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen

try:
  from OAuthDIRAC.FrameworkSystem.Client.OAuthManagerClient import gSessionManager  # pylint:disable=import-error
except ImportError:
  gSessionManager = None

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
    body = 'Typeauth: %s, details: %s' % (typeAuth, loadValue)
    self.log.verbose('Send mail to', addresses)
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

    result = S_ERROR('Timeout')
    for i in range(4):
      if not gSessionManager:
        result = S_ERROR('Not session manager found.')
        break
      result = gSessionManager.getSessionStatus(session)
      if not result['OK']:
        break
      status = result['Value']['Status']
      gLogger.verbose('%s session' % session, status)
      if status not in ['prepared','in progress','finishing', 'redirect']:
        break
      if status == 'prepared' and i > 2:
        result = S_ERROR('Waiting authentication response to long.')
        break
      time.sleep(5)

    if not result['OK']:
      gSessionManager.killSession(session)
      self.log.error(session, 'session, %s ' % result['Message'])
    else:
      self.log.verbose(session, 'session, authentication status: %s' % status)
      if status == 'authed':
        self.set_cookie("TypeAuth", typeAuth)
        self.set_cookie(typeAuth, result['Value']['Session'])
      else:
        self.clear_cookie(typeAuth)

    self.finish(result)

  @asyncGen
  def web_auth(self):
    """ Set authentication type
    """
    result = S_OK({'Action': 'reload'})
    typeAuth = str(self.request.arguments["typeauth"][0])
    if typeAuth == 'Log out':
      self.clear_all_cookies()
      self.set_cookie("TypeAuth", 'Visitor')

    elif typeAuth == 'Certificate':
      self.set_cookie("TypeAuth", typeAuth)

    elif not gSessionManager:
      result = S_ERROR('Not session manager found.')

    else:
      result = gSessionManager.submitAuthorizeFlow(typeAuth, self.get_cookie(typeAuth))
      if result['OK']:
        if result['Value']['Status'] == 'ready':
          self.set_cookie("TypeAuth", typeAuth)
          result['Value']['Action'] = 'reload'
        elif result['Value']['Status'] == 'needToAuth':
          result['Value']['Action'] = 'popup'
        else:
          result = S_ERROR('Not correct status "%s" of %s' % (result['Value']['Status'], typeAuth))

    self.finishJEncode(result)
