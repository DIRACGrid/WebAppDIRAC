import re
import os
from six.moves import urllib_parse as urlparse

from tornado.escape import xhtml_escape
from tornado import template

from DIRAC import rootPath, gLogger, S_OK, gConfig

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr
from DIRAC.Resources.IdProvider.OAuth2IdProvider import OAuth2IdProvider


class RootHandler(WebHandler):

  AUTH_PROPS = "all"
  LOCATION = "/"

  @classmethod
  def initializeHandler(cls, serviceInfo):
    """
      This may be overwritten when you write a DIRAC service handler
      And it must be a class method. This method is called only one time,
      at the first request

      :param dict ServiceInfoDict: infos about services, it contains
                                    'serviceName', 'serviceSectionPath',
                                    'csPaths' and 'URL'
    """
    # Add WebClient
    result = gConfig.getOptionsDictRecursively("/WebApp/AuthorizationClient")
    if not result['OK']:
      raise Exception("Can't load web portal settings.")
    config = result['Value']
    result = gConfig.getOptionsDictRecursively('/Systems/Framework/Production/Services/AuthManager/AuthorizationServer')
    if not result['OK']:
      raise Exception("Can't load authorization server settings.")
    serverMetadata = result['Value']
    config.update(serverMetadata)
    config = dict((k, v.replace(', ', ',').split(',') if ',' in v else v) for k, v in config.items())
    cls._authClient = OAuth2IdProvider(**config)

  def web_changeGroup(self):
    to = self.get_argument("to")
    self.__change(group=to)

  def web_changeSetup(self):
    to = self.get_argument("to")
    self.__change(setup=to)

  def __change(self, setup=None, group=None):
    if not setup:
      setup = self.getUserSetup()
    if not group:
      group = self.getUserGroup() or 'anon'
    qs = False
    if 'Referer' in self.request.headers:
      o = urlparse.urlparse(self.request.headers['Referer'])
      qs = '?%s' % o.query
    url = [Conf.rootURL().strip("/"), "s:%s" % setup, "g:%s" % group]
    self.redirect("/%s%s" % ("/".join(url), qs))

  def web_getConfigData(self):
    self.finish(self.getSessionData())

  def web_fetchToken(self):
    """ Fetch access token
    """
    print('------ web_fetchToken --------')
    sessionID = self.getCurrentSession()
    if self.application.getSession(sessionID)['access_token'] != self.get_argument('access_token'):
      self.set_status(401)
      self.finish('Unauthorize.')
      return

    # Create PKCE things
    url = self._authClient.metadata['token_endpoint']
    token = self._authClient.refresh_token(url, refresh_token=session['refresh_token'],
                                           scope='%s changeGroup' % self.getUserGroup())
    self.application.updateSession(sessionID, **token)

    self.finish(token['access_token'])

  def web_logout(self):
    """ Start authorization flow
    """
    print('------ web_logout --------')
    self.application.removeSession(self.getCurrentSession())
    self.set_cookie('authGrant', 'Visitor')
    self.redirect('/DIRAC')

  def web_login(self):
    """ Start authorization flow
    """
    print('------ web_login --------')
    provider = self.get_argument('provider')

    # Create PKCE things
    code_verifier = generate_token(48)
    code_challenge = create_s256_code_challenge(code_verifier)
    url = self._authClient.metadata['authorization_endpoint']
    if provider:
      url += '/%s' % provider
    uri, state = self._authClient.create_authorization_url(url, code_challenge=code_challenge,
                                                                       code_challenge_method='S256',
                                                                       scope='changeGroup')
    self.application.addSession(state, code_verifier=code_verifier, provider=provider,
                                next=self.get_argument('next', '/DIRAC'))
    self.set_cookie('authGrant', 'Session')
    # Redirect to authorization server
    self.redirect(uri)

  def web_loginComplete(self):
    """ Finishing authoriation flow
    """
    print('------ web_loginComplete --------')
    code = self.get_argument('code')
    state = self.get_argument('state')

    # Parse response
    self._authClient.store_token = None
    result = yield self.threadTask(self._authClient.parseAuthResponse, self.request,
                                   self.application.getSession(state))

    self.application.removeSession(state)
    if not result['OK']:
      self.finish(result['Message'])
      return
    # FINISHING with IdP auth result
    username, userProfile, session = result['Value']

    # Create session to work through portal
    sessionID = generate_token(30)
    self.application.addSession(dict(session.update(id=sessionID)))
    self.set_secure_cookie('session_id', sessionID, secure=True, httponly=True)

    t = template.Template('''<!DOCTYPE html>
      <html>
        <head>
          <title>Authentication</title>
          <meta charset="utf-8" />
        </head>
        <body>
          Authorization is done.
          <script>
            sessionStorage.setItem("access_token", "{{access_token}}");
            window.location = "{{next}}";
          </script>
        </body>
      </html>''')
    self.finish(t.generate(next=session['next'], access_token=session.token.access_token))

  def web_index(self):
    # Render base template
    data = self.getSessionData()

    url_state = ""
    if "url_state" in self.request.arguments and len(self.get_argument("url_state")) > 0:
      url_state = xhtml_escape(self.get_argument("url_state"))

    # Default theme/view settings
    theme_name = "crisp"
    view_name = Conf.getTheme()
    if ":" in view_name:
      _, theme_name = view_name.split(":", 1)

    # User selected theme
    if "theme" in self.request.arguments and len(self.get_argument("theme")) > 0:
      theme_name = xhtml_escape(self.get_argument("theme").lower())

    open_app = ""
    if "open_app" in self.request.arguments and len(self.get_argument("open_app")) > 0:
      open_app = xhtml_escape(self.get_argument("open_app").strip())

    icon = data['baseURL'] + Conf.getIcon()
    background = data['baseURL'] + Conf.getBackgroud()
    logo = data['baseURL'] + Conf.getLogo()
    welcomeFile = Conf.getWelcome()
    welcome = ''
    if welcomeFile:
      try:
        with open(welcomeFile, 'r') as f:
          welcome = f.read().replace('\n', '')
      except BaseException:
        gLogger.warn('Welcome page not found here: %s' % welcomeFile)

    level = str(gLogger.getLevel()).lower()
    self.render("root.tpl", iconUrl=icon, base_url=data['baseURL'], _dev=Conf.devMode(),
                ext_version=data['extVersion'], url_state=url_state,
                extensions=data['extensions'], auth_client_settings=data['configuration']['AuthorizationClient'],
                credentials=data['user'], title=Conf.getTitle(),
                theme=theme_name, root_url=Conf.rootURL(), view='tabs',
                open_app=open_app, debug_level=level, welcome=welcome,
                backgroundImage=background, logo=logo, bugReportURL=Conf.bugReportURL(),
                http_port=Conf.HTTPPort(), https_port=Conf.HTTPSPort())
