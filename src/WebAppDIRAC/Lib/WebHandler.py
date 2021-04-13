from concurrent.futures import ThreadPoolExecutor
import ssl
import json
import datetime
import requests
import functools
import traceback
from hashlib import md5

import tornado.web
import tornado.websocket
from tornado import gen
from tornado.web import HTTPError
from tornado.ioloop import IOLoop

from DIRAC import gLogger
from DIRAC.Core.Security import Properties
from DIRAC.Core.DISET.AuthManager import AuthManager
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.Core.Utilities.JEncode import DATETIME_DEFAULT_FORMAT
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getUsernameForID, getDNForUsername

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.SessionData import SessionData


global gThreadPool
gThreadPool = ThreadPoolExecutor(100)
sLog = gLogger.getSubLogger(__name__)


class WErr(HTTPError):

  def __init__(self, code, msg="", **kwargs):
    super(WErr, self).__init__(code, str(msg) or None)
    for k in kwargs:
      setattr(self, k, kwargs[k])
    self.msg = msg
    self.kwargs = kwargs

  @classmethod
  def fromSERROR(cls, result):
    """ Prevent major problem with % in the message """
    return cls(500, result['Message'].replace("%", ""))


def asyncWithCallback(method):
  return tornado.web.asynchronous(method)


def asyncGen(method):
  return gen.coroutine(method)

def defaultEncoder(data):
  """ Encode

        - datetime to ISO format string
        - set to list

      :param data: value to encode

      :return: encoded value
  """
  if isinstance(data, (datetime.date, datetime.datetime)):
    return data.strftime(DATETIME_DEFAULT_FORMAT)
  if isinstance(data, (set)):
    return list(data)
  raise TypeError('Object of type {} is not JSON serializable'.format(data.__class__.__name__))


class WebHandler(tornado.web.RequestHandler):

class _WebHandler(TornadoREST):
  __session = None
  __disetConfig = ThreadConfig()

  USE_AUTHZ_GRANTS = ['SSL', 'SESSION', 'VISITOR']
  # Auth requirements
  AUTH_PROPS = None
  # Location of the handler in the URL
  LOCATION = ""
  # URL Schema with holders to generate handler urls
  URLSCHEMA = ""
  # RE to extract group and setup
  PATH_RE = None
  # Prefix of methods names
  METHOD_PREFIX = "web_"

  def finish(self, data=None, *args, **kwargs):
    """ Finishes this response, ending the HTTP request. More detailes:
        https://www.tornadoweb.org/en/stable/_modules/tornado/web.html#RequestHandler.finish
    """
    if data and isinstance(data, dict):
      data = json.dumps(data, default=defaultEncoder)
    return super(WebHandler, self).finish(data, *args, **kwargs)

  def threadTask(self, method, *args, **kwargs):
    def threadJob(*targs, **tkwargs):
      args = targs[0]
      disetConf = targs[1]
      self.__disetConfig.reset()
      self.__disetConfig.load(disetConf)
      return method(*args, **tkwargs)

    targs = (args, self.__disetDump)
    return IOLoop.current().run_in_executor(gThreadPool, functools.partial(threadJob, *targs, **kwargs))

  def __disetBlockDecor(self, func):
    def wrapper(*args, **kwargs):
      raise RuntimeError("All DISET calls must be made from inside a Threaded Task!")
    return wrapper

  @classmethod
  def _getServiceName(cls, request):
    """ Search service name in request

        :param object request: tornado Request

        :return: str
    """
    match = cls.PATH_RE.match(request.path)
    groups = match.groups()
    route = groups[2]
    return route if route[-1] == "/" else route[:route.rfind("/")]

  @classmethod
  def _getServiceAuthSection(cls, serviceName):
    """ Search service auth section. Developers MUST
        implement it in subclass.

        :param str serviceName: service name

        :return: str
    """
    return Conf.getAuthSectionForHandler(serviceName)

  def _getMethodName(self):
    """ Parse method name.

        :return: str
    """
    match = self.PATH_RE.match(self.request.path)
    groups = match.groups()
    route = groups[2]
    return "index" if route[-1] == "/" else route[route.rfind("/") + 1:]
  
  def _getMethodArgs(self, args):
    """ Decode args.

        :return: list
    """
    return args[3:]

  def _prepare(self):
    """
      Prepare the request. It reads certificates and check authorizations.
      We make the assumption that there is always going to be a ``method`` argument
      regardless of the HTTP method used

    """
    super(_WebHandler, self)._prepare()

    # Configure DISET with user creds
    if self.getDN():
      self.__disetConfig.setDN(self.getDN())
    if self.getID():
      self.__disetConfig.setID(self.getID())
    # pylint: disable=no-value-for-parameter
    if self.getUserGroup():  # pylint: disable=no-value-for-parameter
      self.__disetConfig.setGroup(self.getUserGroup())  # pylint: disable=no-value-for-parameter
    self.__disetConfig.setSetup(self.__setup)
    self.__disetDump = self.__disetConfig.dump()

    self.__sessionData = SessionData(self.credDict, self.__setup)
    self.__forceRefreshCS()

  def __parseURI(self):
    match = self.PATH_RE.match(self.request.path)
    groups = match.groups()
    self.__setup = groups[0] or Conf.setup()
    self.__group = groups[1]
    self.__route = groups[2]
    self.__args = groups[3:]

  def __forceRefreshCS(self):
    """ Force refresh configuration from master configuration server
    """
    if self.request.headers.get('X-RefreshConfiguration') == 'True':
      self.log.debug('Initialize force refresh..')
      if not AuthManager('').authQuery("", dict(self.credDict), "CSAdministrator"):
        raise WErr(401, 'Cannot initialize force refresh, request not authenticated')
      result = gConfig.forceRefresh()
      if not result['OK']:
        raise WErr(501, result['Message'])

  def _gatherPeerCredentials(self):
    """
      Load client certchain in DIRAC and extract informations.

      The dictionary returned is designed to work with the AuthManager,
      already written for DISET and re-used for HTTPS.

      :returns: a dict containing the return of :py:meth:`DIRAC.Core.Security.X509Chain.X509Chain.getCredentials`
                (not a DIRAC structure !)
    """
    # Unsecure protocol only for visitors
    if self.request.protocol != "https":
      return

    # OIDC auth method
    def oAuth2():
      access_token = self.get_secure_cookie("AccessToken")
      if access_token is not None:
        access_token = access_token.decode()
        url = Conf.getCSValue("TypeAuths/%s/authority" % typeAuth) + '/userinfo'
        heads = {'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json'}
        if 'error' in requests.get(url, headers=heads, verify=False).json():
          self.log.error('OIDC request error: %s' % requests.get(url, headers=heads, verify=False).json()['error'])
          return
        ID = requests.get(url, headers=heads, verify=False).json()['sub']
        result = getUsernameForID(ID)
        if result['OK']:
          self.__credDict['username'] = result['Value']
        result = getDNForUsername(self.__credDict['username'])
        if result['OK']:
          self.__credDict['validDN'] = True
          self.__credDict['DN'] = result['Value'][0]
        return

    # Type of Auth
    if not self.get_secure_cookie("TypeAuth"):
      self.set_secure_cookie("TypeAuth", 'Certificate')
    typeAuth = self.get_secure_cookie("TypeAuth")
    if typeAuth is not None:
      typeAuth = typeAuth.decode()
    self.log.info("Type authentication: %s" % typeAuth)
    if typeAuth == "Visitor":
      return
    retVal = Conf.getCSSections("TypeAuths")
    if retVal['OK']:
      if typeAuth in retVal.get("Value"):
        method = Conf.getCSValue("TypeAuths/%s/method" % typeAuth, 'default')
        if method == "oAuth2":
          oAuth2()

    # NGINX
    if Conf.balancer() == "nginx":
      headers = self.request.headers
      if headers['X-Scheme'] == "https" and headers['X-Ssl_client_verify'] == 'SUCCESS':
        DN = headers['X-Ssl_client_s_dn']
        if not DN.startswith('/'):
          items = DN.split(',')
          items.reverse()
          DN = '/' + '/'.join(items)
        self.__credDict['DN'] = DN
        self.__credDict['issuer'] = headers['X-Ssl_client_i_dn']
        result = Registry.getUsernameForDN(DN)
        if not result['OK']:
          self.__credDict['validDN'] = False
        else:
          self.__credDict['validDN'] = True
          self.__credDict['username'] = result['Value']
      return

    # TORNADO
    derCert = self.request.get_ssl_certificate(binary_form=True)
    if not derCert:
      return
    pemCert = ssl.DER_cert_to_PEM_cert(derCert)
    chain = X509Chain()
    chain.loadChainFromString(pemCert)
    result = chain.getCredentials()
    if not result['OK']:
      self.log.error("Could not get client credentials %s" % result['Message'])
      return
    self.__credDict = result['Value']
    # Hack. Data coming from OSSL directly and DISET difer in DN/subject
    try:
      self.__credDict['DN'] = self.__credDict['subject']
    except KeyError:
      pass

  def _request_summary(self):
    """
    sessionID = self.get_secure_cookie('session_id')
    if not sessionID:
      self.clear_cookie('authGrant')
      return {}

    session = self.application.getSession(sessionID)
    # Each session depends on the tokens
    if not session or not session.token:
      self.clear_cookie('session_id')
      self.set_cookie('session_id', 'expired')
      self.clear_cookie('authGrant')
      raise Exception('%s session expired.' % sessionID)

    if self.request.headers.get("Authorization"):
      token = ResourceProtector().acquire_token(self.request)  # , 'changeGroup')

      # Is session active?
      if session.token.access_token != token.access_token:
        raise Exception('%s session invalid, token is not match.' % sessionID)

    token = ResourceProtector().validator(session.token.refresh_token, None, #'changeGroup',
                                          None, 'OR')

    # Update session expired time
    self.application.updateSession(session)
    self.__session = session
    return {'ID': token.sub, 'issuer': token.issuer, 'group': self.__group, 'validGroup': False}

  @property
  def log(self):
    return sLog

  @classmethod
  def getLog(cls):
    return cls.__log

  def getCurrentSession(self):
    return self.__session

  def getUserSetup(self):
    return self.__setup

  def getSessionData(self):
    return self.__sessionData.getData()

  def getAppSettings(self, app=None):
    return Conf.getAppSettings(app or self.__class__.__name__.replace('Handler', '')).get('Value') or {}

  def actionURL(self, action=""):
    """ Given an action name for the handler, return the URL

        :param str action: action

        :return: str
    """
    if action == "index":
      action = ""
    group = self.getUserGroup()
    if group:
      group = "/g:%s" % group
    setup = self.getUserSetup()
    if setup:
      setup = "/s:%s" % setup
    location = self.LOCATION
    if location:
      location = "/%s" % location
    ats = dict(action=action, group=group, setup=setup, location=location)
    return self.URLSCHEMA % ats

  # def isTrustedHost(self, dn):
  #   """ Check if the request coming from a TrustedHost

  #       :param str dn: certificate DN

  #       :return: bool if the host is Trusrted it return true otherwise false
  #   """
  #   retVal = Registry.getHostnameForDN(dn)
  #   if retVal['OK']:
  #     hostname = retVal['Value']
  #     if Properties.TRUSTED_HOST in Registry.getPropertiesForHost(hostname, []):
  #       return True
  #   return False

  def __checkPath(self, setup, group, route):
    """ Check the request, auth, credentials and DISET config

        :param str setup: setup name
        :param str group: group name
        :param str route: route

        :return: str/WErr()
    """
    if route[-1] == "/":
      methodName = "index"
      handlerRoute = route
    else:
      iP = route.rfind("/")
      methodName = route[iP + 1:]
      handlerRoute = route[:iP]
    if setup:
      self.__setup = setup
    if not self.__auth(handlerRoute, group, methodName):
      return WErr(401, "Unauthorized. %s" % methodName)

    DN = self.getUserDN()
    if DN:
      self.__disetConfig.setDN(DN)

    if self.getUserGroup():
      self.__disetConfig.setGroup(self.getUserGroup())
    self.__disetConfig.setSetup(setup)
    self.__disetDump = self.__disetConfig.dump()

    return methodName

  def get(self, setup, group, route):
    if isinstance(self._pathResult, WErr):
      raise self._pathResult
    methodName = "web_%s" % self._pathResult
    try:
      mObj = getattr(self, methodName)
    except AttributeError as e:
      self.log.fatal("This should not happen!! %s" % e)
      raise tornado.web.HTTPError(404)
    return mObj()

  def post(self, *args, **kwargs):
    return self.get(*args, **kwargs)

  def delete(self, *args, **kwargs):
    return self.get(*args, **kwargs)

  def write_error(self, status_code, **kwargs):
    self.set_status(status_code)
    cType = "text/plain"
    data = self._reason
    if 'exc_info' in kwargs:
      ex = kwargs['exc_info'][1]
      trace = traceback.format_exception(*kwargs["exc_info"])
      if not isinstance(ex, WErr):
        data += "\n".join(trace)
      else:
        if self.settings.get("debug"):
          self.log.error("Request ended in error:\n  %s" % "\n  ".join(trace))
        data = ex.msg
        if isinstance(data, dict):
          cType = "application/json"
          data = json.dumps(data)
    self.set_header('Content-Type', cType)
    self.finish(data)

  def finishWithImage(self, data, plotImageFile, disableCaching=False):
    # Set headers
    self.set_header('Content-type', 'image/png')
    self.set_header(
        'Content-Disposition',
        'attachment; filename="%s.png"' % md5(plotImageFile.encode()).hexdigest()
    )
    self.set_header('Content-Length', len(data))
    self.set_header('Content-Transfer-Encoding', 'Binary')
    if disableCaching:
      self.set_header('Cache-Control', "no-cache, no-store, must-revalidate, max-age=0")
      self.set_header('Pragma', "no-cache")
      self.set_header(
          'Expires',
          (datetime.datetime.utcnow() - datetime.timedelta(minutes=-10)).strftime("%d %b %Y %H:%M:%S GMT")
      )
    # Return the data
    self.finish(data)


class WebHandler(_WebHandler):
  def get(self, setup, group, route, *pathArgs):
    method = self._getMethod()
    return method(*pathArgs)

  def post(self, *args, **kwargs):
    return self.get(*args, **kwargs)

  def delete(self, *args, **kwargs):
    return self.get(*args, **kwargs)


class WebSocketHandler(tornado.websocket.WebSocketHandler, WebHandler):

  def __init__(self, *args, **kwargs):
    WebHandler.__init__(self, *args, **kwargs)
    tornado.websocket.WebSocketHandler.__init__(self, *args, **kwargs)

  def open(self, setup, group, route):
    if isinstance(self._pathResult, WErr):
      raise self._pathResult
    return self.on_open()

  def on_open(self):
    pass
