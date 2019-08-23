import sys
import ssl
import json
import types
import requests
import functools
import traceback
import tornado.web
import tornado.gen
import tornado.ioloop
import tornado.websocket
import tornado.stack_context

from concurrent.futures import ThreadPoolExecutor

from DIRAC import gConfig, gLogger, S_OK, S_ERROR
from DIRAC.Core.Security import Properties
from DIRAC.Core.Security.X509Chain import X509Chain  # pylint: disable=import-error
from DIRAC.Core.DISET.AuthManager import AuthManager
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.Core.Utilities.Decorators import deprecated
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
# pylint: disable=no-name-in-module
from DIRAC.ConfigurationSystem.Client.Helpers.Resources import getInfoAboutProviders

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.SessionData import SessionData

try:
  from OAuthDIRAC.Resources.IdProvider.IdProviderFactory import IdProviderFactory  # pylint: disable=import-error
  from OAuthDIRAC.FrameworkSystem.Client.OAuthManagerClient import OAuthManagerClient  # pylint: disable=import-error
  oauth = OAuthManagerClient()
except BaseException:
  oauth = None

global gThreadPool
gThreadPool = ThreadPoolExecutor(100)


class WErr(tornado.web.HTTPError):

  def __init__(self, code, msg="", **kwargs):
    super(WErr, self).__init__(code, str(msg) or None)
    for k in kwargs:
      setattr(self, k, kwargs[k])
    self.ok = False
    self.msg = msg
    self.kwargs = kwargs

  def __str__(self):
    return super(WErr, self).__str__()

  @classmethod
  def fromSERROR(cls, result):
    # Prevent major fuckups with % in the message
    return cls(500, result['Message'].replace("%", ""))


class WOK(object):

  def __init__(self, data=False, **kwargs):
    for k in kwargs:
      setattr(self, k, kwargs[k])
    self.ok = True
    self.data = data


def asyncWithCallback(method):
  return tornado.web.asynchronous(method)


def asyncGen(method):
  return tornado.gen.coroutine(method)


class WebHandler(tornado.web.RequestHandler):

  __disetConfig = ThreadConfig()
  __log = False

  # Auth requirements
  AUTH_PROPS = None
  # Location of the handler in the URL
  LOCATION = ""
  # URL Schema with holders to generate handler urls
  URLSCHEMA = ""
  # RE to extract group and setup
  PATH_RE = None

  def threadTask(self, method, *args, **kwargs):
    if tornado.version < '5.0.0':
      return self.threadTaskOld(method, *args, **kwargs)
    else:
      return self.threadTaskExecutor(method, *args, **kwargs)

  # Helper function to create threaded gen.Tasks with automatic callback and execption handling
  @deprecated("Only for Tornado 4.x.x and DIRAC v6r20")
  def threadTaskOld(self, method, *args, **kwargs):
    """
    Helper method to generate a gen.Task and automatically call the callback when the real
    method ends. THIS IS SPARTAAAAAAAAAA. SPARTA has improved using futures ;)
    """
    # Save the task to access the runner
    genTask = False

    # This runs in the separate thread, calls the callback on finish and takes into account exceptions
    def cbMethod(*cargs, **ckwargs):
      cb = ckwargs.pop('callback')
      method = cargs[0]
      disetConf = cargs[1]
      cargs = cargs[2]
      self.__disetConfig.reset()
      self.__disetConfig.load(disetConf)
      ioloop = tornado.ioloop.IOLoop.instance()
      try:
        result = method(*cargs, **ckwargs)
        ioloop.add_callback(functools.partial(cb, result))
      except Exception as excp:
        gLogger.error("Following exception occured %s" % excp)
        exc_info = sys.exc_info()
        genTask.set_exc_info(exc_info)
        ioloop.add_callback(lambda: genTask.exception())

    # Put the task in the thread :)
    def threadJob(tmethod, *targs, **tkwargs):
      tkwargs['callback'] = tornado.stack_context.wrap(tkwargs['callback'])
      targs = (tmethod, self.__disetDump, targs)
      gThreadPool.submit(cbMethod, *targs, **tkwargs)

    # Return a YieldPoint
    genTask = tornado.gen.Task(threadJob, method, *args, **kwargs)
    return genTask

  def threadTaskExecutor(self, method, *args, **kwargs):
    def threadJob(*targs, **tkwargs):
      args = targs[0]
      disetConf = targs[1]
      self.__disetConfig.reset()
      self.__disetConfig.load(disetConf)
      return method(*args, **tkwargs)
    targs = (args, self.__disetDump)
    return tornado.ioloop.IOLoop.current().run_in_executor(gThreadPool, functools.partial(threadJob, *targs, **kwargs))

  def __disetBlockDecor(self, func):
    def wrapper(*args, **kwargs):
      raise RuntimeError("All DISET calls must be made from inside a Threaded Task!")
    return wrapper

  def __init__(self, *args, **kwargs):
    """
    Initialize the handler
    """
    self.stream = None  # Needed for set_secure_cookie tornado method
    super(WebHandler, self).__init__(*args, **kwargs)
    if not WebHandler.__log:
      WebHandler.__log = gLogger.getSubLogger(self.__class__.__name__)
    self.__credDict = {}
    self.__setup = Conf.setup()
    self.__processCredentials()
    self.__disetConfig.reset()
    self.__disetConfig.setDecorator(self.__disetBlockDecor)
    self.__disetDump = self.__disetConfig.dump()
    match = self.PATH_RE.match(self.request.path)
    self._pathResult = self.__checkPath(*match.groups())
    self.__sessionData = SessionData(self.__credDict, self.__setup)
    self.__forceRefreshCS()

  def __forceRefreshCS(self):
    """ Force refresh configuration from master configuration server
    """
    if self.request.headers.get('X-RefreshConfiguration') == 'True':
      self.log.info('Initialize force refresh..')
      if not AuthManager('').authQuery("", dict(self.__credDict), "CSAdministrator"):
        raise tornado.web.HTTPError(401, 'Cannot initialize force refresh, request not authenticated')
      result = gConfig.forceRefresh()
      if not result['OK']:
        raise tornado.web.HTTPError(501, result['Message'])

  def __processCredentials(self):
    """
    Extract the user credentials based on the certificate or what comes from the balancer
    """
    if not self.request.protocol == "https":
      return

    # Look in idetity providers
    typeAuth = self.get_secure_cookie("TypeAuth") or "Certificate"
    try:
      stateAuth = json.loads(self.get_secure_cookie("StateAuth"))
    except BaseException as e:
      stateAuth = {}
    __session = stateAuth.get(typeAuth) or ''
    self.log.info("%s authentication" % typeAuth, __session and 'with %s session' % __session)

    # If enter as visitor
    if typeAuth == "Visitor":
      return

    # Look enabled authentication types in CS
    result = Conf.getCSSections("TypeAuths")
    if not result['OK']:
      self.log.error(result['Message'])
    if typeAuth not in ['Certificate'] + result.get('Value') or []:
      self.log.error(typeAuth, "is absent in configuration. Try to use certificate.")
      typeAuth = 'Certificate'

    # Parameters for IdProviders
    params = {}
    params['stateAuth'] = __session
    params['balancer'] = Conf.balancer()
    params['headers'] = self.request.headers
    params['certificate'] = not params['balancer'] == 'nginx' and self.request.get_ssl_certificate(binary_form=True)

    # Fill credentials dict
    for idp in list(set([typeAuth, 'Certificate'])):
      result = IdProviderFactory().getIdProvider(idp)
      if result['OK']:
        providerObj = result['Value']
        result = providerObj.getCredentials(params)
        if result['OK']:
          typeAuth = idp
          stateAuth[typeAuth] = result['Value']['Session']
          self.__credDict = result['Value']['credDict']
          break
      self.log.error(result['Message'], not idp == 'Certificate' and 'Try to authenticate with certificate.' or '')

    # Set cookies
    __session = stateAuth.get(typeAuth) and '%s session.' % stateAuth[typeAuth] or ''
    self.log.info(__session, 'Set cookie: "TypeAuth": %s' % typeAuth)
    self.log.info(__session, 'Set cookie: "StateAuth": %s' % json.dumps(stateAuth))
    self.set_secure_cookie("TypeAuth", typeAuth)
    self.set_secure_cookie("StateAuth", json.dumps(stateAuth))

  def _request_summary(self):
    """
    Return a string returning the summary of the request
    """
    summ = super(WebHandler, self)._request_summary()
    cl = []
    if self.__credDict.get('validDN', False):
      cl.append(self.__credDict['username'])
      if self.__credDict.get('validGroup', False):
        cl.append("@%s" % self.__credDict['group'])
      cl.append(" (%s)" % self.__credDict['DN'])
    summ = "%s %s" % (summ, "".join(cl))
    return summ

  @property
  def log(self):
    return self.__log

  @classmethod
  def getLog(cls):
    return cls.__log

  def getDN(self):
    return self.__credDict.get('DN', '')

  def getUserName(self):
    return self.__credDict.get('username', '')

  def getUserGroup(self):
    return self.__credDict.get('group', '')

  def getUserSetup(self):
    return self.__setup

  def isRegisteredUser(self):
    return self.__credDict.get('validDN', "") and self.__credDict.get('validGroup', "")

  def getSessionData(self):
    return self.__sessionData.getData()

  def actionURL(self, action=""):
    """
    Given an action name for the handler, return the URL
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

  def __auth(self, handlerRoute, group, method):
    """
    Authenticate request
    :param str handlerRoute: the name of the handler
    :param str group: DIRAC group
    :param str method: the name of the method
    :return: bool
    """
    __DN = self.getDN()
    if group:
      self.__credDict['group'] = group
    elif __DN:
      result = Registry.getHostnameForDN(__DN)
      if result['OK'] and result['Value']:
        self.__credDict['group'] = 'hosts'
      else:
        result = Registry.findDefaultGroupForDN(__DN)
        if result['OK']:
          self.__credDict['group'] = result['Value']

    if type(self.AUTH_PROPS) not in (types.ListType, types.TupleType):
      self.AUTH_PROPS = [p.strip() for p in self.AUTH_PROPS.split(",") if p.strip()]

    self.__credDict['validGroup'] = False
    auth = AuthManager(Conf.getAuthSectionForHandler(handlerRoute))
    ok = auth.authQuery(method, self.__credDict, self.AUTH_PROPS)
    if ok:
      if __DN:
        self.__credDict['validGroup'] = True
        self.log.info("AUTH OK: %s by %s@%s (%s)" %
                      (handlerRoute, self.__credDict['username'], self.__credDict['group'], __DN))
      else:
        self.__credDict['validDN'] = False
        self.log.info("AUTH OK: %s by visitor" % (handlerRoute))
    elif self.isTrustedHost(self.__credDict.get('DN')):
      self.log.info("Request is coming from Trusted host")
      return True
    else:
      self.log.info("AUTH KO: %s by %s@%s" % (handlerRoute, __DN, group))
    return ok

  def isTrustedHost(self, dn):
    """
    Check if the request coming from a TrustedHost
    :param str dn: certificate DN
    :return: bool if the host is Trusrted it return true otherwise false
    """
    retVal = Registry.getHostnameForDN(dn)
    if retVal['OK']:
      hostname = retVal['Value']
      if Properties.TRUSTED_HOST in Registry.getPropertiesForHost(hostname, []):
        return True
    return False

  def __checkPath(self, setup, group, route):
    """
    Check the request, auth, credentials and DISET config
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
      return WErr(401, "Unauthorized.")

    DN = self.getDN()
    if DN:
      self.__disetConfig.setDN(DN)
    group = self.getUserGroup()
    if group:
      self.__disetConfig.setGroup(group)
    self.__disetConfig.setSetup(setup)
    self.__disetDump = self.__disetConfig.dump()

    return WOK(methodName)

  def get(self, setup, group, route):
    if not self._pathResult.ok:
      raise self._pathResult
    methodName = "web_%s" % self._pathResult.data
    try:
      mObj = getattr(self, methodName)
    except AttributeError as e:
      self.log.fatal("This should not happen!! %s" % e)
      raise tornado.web.HTTPError(404)
    return mObj()

  def post(self, *args, **kwargs):
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


class WebSocketHandler(tornado.websocket.WebSocketHandler, WebHandler):

  def __init__(self, *args, **kwargs):
    WebHandler.__init__(self, *args, **kwargs)
    tornado.websocket.WebSocketHandler.__init__(self, *args, **kwargs)

  def open(self, setup, group, route):
    if not self._pathResult.ok:
      raise self._pathResult
    return self.on_open()

  def on_open(self):
    pass
