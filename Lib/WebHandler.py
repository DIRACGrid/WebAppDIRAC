import sys
import ssl
import json
import types
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
from DIRAC.Core.Utilities.JEncode import encode
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
# pylint: disable=no-name-in-module
from DIRAC.Resources.IdProvider.IdProviderFactory import IdProviderFactory

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.SessionData import SessionData

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
  # If need to use request path for declare some value/option
  OVERPATH = False

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
    pathItems = match.groups()
    self._pathResult = self.__checkPath(*pathItems[:3])
    self.overpath = pathItems[3:] and pathItems[3] or ''
    self.__sessionData = SessionData(self.__credDict, self.__setup)
    self.__forceRefreshCS()

  def __forceRefreshCS(self):
    """ Force refresh configuration from master configuration server
    """
    if self.request.headers.get('X-RefreshConfiguration') == 'True':
      self.log.debug('Initialize force refresh..')
      if not AuthManager('').authQuery("", dict(self.__credDict), "CSAdministrator"):
        raise WErr(401, 'Cannot initialize force refresh, request not authenticated')
      result = gConfig.forceRefresh()
      if not result['OK']:
        raise WErr(501, result['Message'])

  def __processCredentials(self):
    """
    Extract the user credentials based on the certificate or what comes from the balancer
    """
    def readCertificate():
      """ Fill credentional from certificate

          :return: S_OK()/S_ERROR()
      """
      # NGINX
      if Conf.balancer() == "nginx":
        headers = self.request.headers
        if not headers:
          return S_ERROR('No headers found.')
        if headers.get('X-Scheme') == "https" and headers.get('X-Ssl_client_verify') == 'SUCCESS':
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
        return S_OK()

      # TORNADO
      derCert = self.request.get_ssl_certificate(binary_form=True)
      if not derCert:
        return S_ERROR('No certificate found.')
      pemCert = ssl.DER_cert_to_PEM_cert(derCert)
      chain = X509Chain()
      chain.loadChainFromString(pemCert)
      result = chain.getCredentials()
      if not result['OK']:
        return S_ERROR("Could not get client credentials %s" % result['Message'])
      self.__credDict = result['Value']
      # Hack. Data coming from OSSL directly and DISET difer in DN/subject
      try:
        self.__credDict['DN'] = self.__credDict['subject']
      except KeyError:
        pass
      return S_OK()

    if self.request.protocol != "https":
      return

    # Look in idetity providers
    typeAuth = self.get_cookie("TypeAuth") or "Certificate"
    try:
      stateAuth = json.loads(self.get_cookie("StateAuth"))
    except BaseException as e:
      stateAuth = {}
    session = stateAuth.get(typeAuth) or ''
    self.log.verbose("%s authentication" % typeAuth, session and 'with %s session' % session)

    # If enter as visitor
    if typeAuth == "Visitor":
      return

    # Look enabled authentication types in CS
    result = Conf.getCSSections("TypeAuths")
    if not result['OK']:
      self.log.error(result['Message'])
    if typeAuth not in ['Certificate'] + (result['Value'] or []):
      self.log.error(typeAuth, "is absent in configuration. Try to use certificate.")
      typeAuth = 'Certificate'

    # Parameters for IdProviders
    params = {}
    params['stateAuth'] = session

    # Fill credentials dict. If IdP fail try to read certificate credentionals
    for idp in [typeAuth, 'Certificate']:
      typeAuth = idp
      if idp == 'Certificate':
        result = readCertificate()
        break
      result = IdProviderFactory().getIdProvider(idp)
      if result['OK']:
        providerObj = result['Value']
        result = providerObj.getCredentials(params)
        if result['OK']:
          stateAuth[typeAuth] = result['Value']['Session']
          self.__credDict = result['Value']['credDict']
          break
      self.log.error(result['Message'], idp != 'Certificate' and 'Try to authenticate with certificate.' or '')

    # Set cookies
    session = stateAuth.get(typeAuth) and '%s session.' % stateAuth[typeAuth] or ''
    self.log.debug(session, 'Set cookie: "TypeAuth": %s' % typeAuth)
    self.log.debug(session, 'Set cookie: "StateAuth": %s' % json.dumps(stateAuth))
    self.set_cookie("TypeAuth", typeAuth)
    self.set_cookie("StateAuth", json.dumps(stateAuth).replace(' ', ''))

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
    authDN = self.getDN()
    if group:
      self.__credDict['group'] = group
    elif authDN:
      result = Registry.getHostnameForDN(authDN)
      if result['OK'] and result['Value']:
        self.__credDict['group'] = 'hosts'
      else:
        result = Registry.findDefaultGroupForDN(authDN)
        if result['OK']:
          self.__credDict['group'] = result['Value']

    if type(self.AUTH_PROPS) not in (types.ListType, types.TupleType):
      self.AUTH_PROPS = [p.strip() for p in self.AUTH_PROPS.split(",") if p.strip()]

    self.__credDict['validGroup'] = False
    auth = AuthManager(Conf.getAuthSectionForHandler(handlerRoute))
    ok = auth.authQuery(method, self.__credDict, self.AUTH_PROPS)
    if ok:
      if authDN:
        self.__credDict['validGroup'] = True
        self.log.info("AUTH OK: %s by %s@%s (%s)" %
                      (handlerRoute, self.__credDict['username'], self.__credDict['group'], authDN))
      else:
        self.__credDict['validDN'] = False
        self.log.info("AUTH OK: %s by visitor" % (handlerRoute))
    elif self.isTrustedHost(self.__credDict.get('DN')):
      self.log.info("Request is coming from Trusted host")
      return True
    else:
      self.log.info("AUTH KO: %s by %s@%s" % (handlerRoute, authDN, group))
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

  def get(self, setup, group, route, overpath=None):
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

  def finishJEncode(self, o):
    """ Encode data before finish
    """
    self.finish(encode(o))

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
