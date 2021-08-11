import re
import os
from six.moves import urllib_parse as urlparse

from tornado.escape import xhtml_escape
from tornado import template

from DIRAC import rootPath, gLogger, S_OK, gConfig

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import _WebHandler as WebHandler, WErr, asyncGen
from DIRAC.Resources.IdProvider.OAuth2IdProvider import OAuth2IdProvider
from DIRAC.FrameworkSystem.private.authorization.utils.Tokens import OAuth2Token


class RootHandler(WebHandler):

  AUTH_PROPS = "all"
  LOCATION = "/"

  def web_changeGroup(self, to):
    """ Change group

        :param str to: group name

        :return: TornadoResponse()
    """
    return TornadoResponse().redirect(self.__change(group=to))

  def web_changeSetup(self, to):
    """ Change setup

        :param str to: setup name

        :return: TornadoResponse()
    """
    return TornadoResponse().redirect(self.__change(setup=to))

  def __change(self, setup=None, group=None):
    """ Generate URL to change setup/group

        :param str setup: setup name
        :param str group: group name

        :return: str
    """
    url = [Conf.rootURL().strip("/")]
    if setup:
      url.append("s:%s" % (setup or self.getUserSetup()))
    if group:
      url.append("g:%s" % (group or self.getUserGroup() or 'anon'))
    qs = False
    if 'Referer' in self.request.headers:
      o = urlparse.urlparse(self.request.headers['Referer'])
      url.append('?%s' % o.query)
    return "/%s" % "/".join(url)

  def web_getConfigData(self):
    """ Get session data

        :return: dict
    """
    return self.getSessionData()

  def web_logout(self):
    """ Logout
    """
    token = self.get_secure_cookie('session_id')
    if token:
      token = json.loads(token)
      if token.get('refresh_token'):
        result = self._idps.getIdProvider('WebAppDIRAC')
        if result['OK']:
          cli = result['Value']
          cli.token = token
          cli.revokeToken(token['refresh_token'])

  def finish_logout(self):
    """ Finish logout process
    """
    self.clear_cookie('session_id')
    self.set_cookie('authGrant', 'Visitor')
    self.redirect('/DIRAC')

  def web_login(self, provider, nextURI='/DIRAC'):
    """ Start authorization flow

        :param str provider: provider name
        :param str nextURI: current URI

        :return: TornadoResponse()
    """
    result = self._idps.getIdProvider('WebAppDIRAC')
    if not result['OK']:
      return result
    cli = result['Value']
    cli.scope = ''
    if provider:
      cli.metadata['authorization_endpoint'] = '%s/%s' % (cli.get_metadata('authorization_endpoint'), provider)

    uri, state, session = cli.submitNewSession()

    # Save authorisation session
    session.update(dict(state=state, provider=provider, next=nextURI))

    resp = TornadoResponse()
    resp.set_secure_cookie('webauth_session', json.dumps(session), secure=True, httponly=True)

    # Redirect to authorization server
    resp.set_cookie('authGrant', 'Visitor')
    return resp.redirect(uri)

  def web_loginComplete(self, code, state):
    """ Finishing authoriation flow

        :param str code: code
        :param str state: state

        :return: TornadoResponse()
    """
    t = template.Template('''<!DOCTYPE html>
    <html>
      <head>
        <title>Authentication</title>
        <meta charset="utf-8" />
      </head>
      <body>
        {{message}}
        <script>
          sessionStorage.setItem("access_token", "{{access_token}}");
          window.location = "{{next}}";
        </script>
      </body>
    </html>''')
    resp = TornadoResponse()
    authSession = json.loads(self.get_secure_cookie('webauth_session'))

    result = self._idps.getIdProvider('WebAppDIRAC')
    if not result['OK']:
      return result
    cli = result['Value']

    # Parse response
    authSession = json.loads(self.get_secure_cookie('webauth_session'))

    token = cli.fetchToken(authorization_response=self.request.uri, code_verifier=authSession.get('code_verifier'))
    
    # Remove authorisation session
    self.clear_cookie('webauth_session')

    # Create session to work through portal
    self.set_secure_cookie('session_id', json.dumps(dict(token)), secure=True, httponly=True)
    self.set_cookie('authGrant', 'Session')

    group = token.groups[0]
    url = '/'.join([Conf.rootURL().strip("/"), "s:%s" % self.getUserSetup(), "g:%s" % group])
    nextURL = "/%s/?%s" % (url, urlparse.urlparse(authSession['next']).query)
    # Save token and go to main page
    # with document('DIRAC authentication') as html:
    #   dom.div('Authorization is done.',
    #           style='display:flex;justify-content:center;align-items:center;padding:28px;font-size:28px;')
    #   dom.script("sessionStorage.setItem('access_token','%s');window.location='%s'" % (access_token, nextURL),
    #              type="text/javascript")
    # return template.Template(html.render()).generate()
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
    return t.generate(next=nextURL, access_token=token.access_token)

  def web_index(self, url_state="", theme="crisp", open_app=""):
    """ Index method

        :param str url_state: url state
        :param str theme: selected theme name, default "crisp"

        :return: TornadoResponse()
    """
    # Render base template
    data = self.getSessionData()

    icon = data['baseURL'] + Conf.getIcon()
    background = data['baseURL'] + Conf.getBackgroud()
    logo = data['baseURL'] + Conf.getLogo()
    welcomeFile = Conf.getWelcome()
    welcome = ''
    if welcomeFile:
      try:
        with open(welcomeFile, 'r') as f:
          welcome = f.read().replace('\n', '')
      except Exception:
        gLogger.warn('Welcome page not found here: %s' % welcomeFile)

    return TornadoResponse().render(
        "root.tpl",
        _dev=Conf.devMode(),
        logo=data['baseURL'] + Conf.getLogo(),
        view='tabs',
        theme=theme.lower(),
        title=Conf.getTitle(),
        welcome=welcome,
        iconUrl=data['baseURL'] + Conf.getIcon(),
        open_app=open_app.strip(),
        base_url=data['baseURL'],
        root_url=Conf.rootURL(),
        url_state=xhtml_escape(url_state),
        http_port=Conf.HTTPPort(),
        https_port=Conf.HTTPSPort(),
        extensions=data['extensions'],
        credentials=data['user'],
        ext_version=data['extVersion'],
        debug_level=str(gLogger.getLevel()).lower(),
        bugReportURL=Conf.bugReportURL(),
        backgroundImage=data['baseURL'] + Conf.getBackgroud(),
        auth_client_settings=data['configuration'].get('AuthorizationClient', {}))
