""" Main module
"""

import os
import json
import pprint
import datetime
import functools
import traceback
from hashlib import md5
from concurrent.futures import ThreadPoolExecutor

import tornado.web
import tornado.websocket
from tornado import gen
from tornado.web import HTTPError
from tornado.ioloop import IOLoop

from DIRAC import gLogger, gConfig, S_OK, S_ERROR
from DIRAC.Core.Utilities.JEncode import DATETIME_DEFAULT_FORMAT
from DIRAC.Core.Utilities.Decorators import deprecated
from DIRAC.Core.DISET.AuthManager import AuthManager
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.Core.Tornado.Server.TornadoREST import TornadoREST
from DIRAC.Core.Tornado.Server.private.BaseRequestHandler import TornadoResponse
from DIRAC.FrameworkSystem.private.authorization.utils.Tokens import OAuth2Token

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.SessionData import SessionData


global gThreadPool
gThreadPool = ThreadPoolExecutor(100)
sLog = gLogger.getSubLogger(__name__)


class FileResponse(TornadoResponse):
    """This class provide logic for CSV and PNG formats.

    Usage example::

      def web_myMethod(self):
        # Generate CSV data
        ...
        return FileResponse(data, 'filename', 'csv')
    """

    def __init__(self, payload=None, fileName=None, ext=None, cache=True):
        """C'or

        :param payload: response body
        :param str fileName: CSV name
        :param str ext: file type
        :param bool cache: use cache
        """
        self.name, self.ext = os.path.splitext(fileName)
        self.ext = (ext or self.ext).lower()
        self.cache = cache
        super(FileResponse, self).__init__(payload, 200)

    def _runActions(self, reqObj):
        """Calling methods in the order of their registration

        :param reqObj: RequestHandler instance
        """
        # Set content type
        if self.ext == "csv":
            reqObj.set_header("Content-type", "text/csv")
        elif self.ext == "png":
            reqObj.set_header("Content-Transfer-Encoding", "Binary")
            reqObj.set_header("Content-type", "image/png")
        else:
            reqObj.set_header("Content-type", "text/plain")

        # Generate file name
        fileName = "%s.%s" % (md5(self.name).hexdigest(), self.ext)
        reqObj.set_header("Content-Disposition", 'attachment; filename="%s"' % fileName)
        reqObj.set_header("Content-Length", len(self.payload))

        if not self.cache:
            # Disable cache
            reqObj.set_header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
            reqObj.set_header("Pragma", "no-cache")
            reqObj.set_header(
                "Expires",
                (datetime.datetime.utcnow() - datetime.timedelta(minutes=-10)).strftime("%d %b %Y %H:%M:%S GMT"),
            )

        super(FileResponse, self)._runActions(reqObj)


class WErr(HTTPError):
    def __init__(self, code, msg="", **kwargs):
        super(WErr, self).__init__(code, str(msg) or None)
        for k in kwargs:
            setattr(self, k, kwargs[k])
        self.msg = msg
        self.kwargs = kwargs

    @classmethod
    def fromSERROR(cls, result):
        """Prevent major problem with % in the message"""
        return cls(500, result["Message"].replace("%", ""))


def asyncWithCallback(method):
    return tornado.web.asynchronous(method)


def asyncGen(method):
    return gen.coroutine(method)


def defaultEncoder(data):
    """Encode

      - datetime to ISO format string
      - set to list

    :param data: value to encode

    :return: encoded value
    """
    if isinstance(data, (datetime.date, datetime.datetime)):
        return data.strftime(DATETIME_DEFAULT_FORMAT)
    if isinstance(data, (set)):
        return list(data)
    raise TypeError("Object of type {} is not JSON serializable".format(data.__class__.__name__))


class _WebHandler(TornadoREST):
    __session = None
    __disetConfig = ThreadConfig()

    USE_AUTHZ_GRANTS = ["SSL", "SESSION", "VISITOR"]
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
        """Finishes this response, ending the HTTP request. More detailes:
        https://www.tornadoweb.org/en/stable/_modules/tornado/web.html#RequestHandler.finish
        """
        if data and isinstance(data, dict):
            data = json.dumps(data, default=defaultEncoder)
        return super(_WebHandler, self).finish(data, *args, **kwargs)

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
        """Search service name in request

        :param object request: tornado Request

        :return: str
        """
        match = cls.PATH_RE.match(request.path)
        groups = match.groups()
        route = groups[2]
        return route if route[-1] == "/" else route[: route.rfind("/")]

    @classmethod
    def _getServiceAuthSection(cls, serviceName):
        """Search service auth section. Developers MUST
        implement it in subclass.

        :param str serviceName: service name

        :return: str
        """
        return Conf.getAuthSectionForHandler(serviceName)

    def _getMethodName(self):
        """Parse method name.

        :return: str
        """
        match = self.PATH_RE.match(self.request.path)
        groups = match.groups()
        route = groups[2]
        return "index" if route[-1] == "/" else route[route.rfind("/") + 1 :]

    def _getMethodArgs(self, args):
        """Decode args.

        :return: tuple(list, dict)
        """
        return super(_WebHandler, self)._getMethodArgs(args[3:])

    def _prepare(self):
        """
        Prepare the request. It reads certificates and check authorizations.
        We make the assumption that there is always going to be a ``method`` argument
        regardless of the HTTP method used

        """
        # Reset session before authorization
        self.__session = None
        # Parse request URI
        self.__parseURI()
        # Reset DISET settings
        self.__disetConfig.reset()
        self.__disetConfig.setDecorator(self.__disetBlockDecor)
        self.__disetDump = self.__disetConfig.dump()

        try:
            super(_WebHandler, self)._prepare()
        except HTTPError as e:
            raise WErr(e.status_code, e.log_message)

        # Configure DISET with user creds
        if self.getUserDN():
            self.__disetConfig.setDN(self.getUserDN())
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
        """Force refresh configuration from master configuration server"""
        if self.request.headers.get("X-RefreshConfiguration") == "True":
            self.log.debug("Initialize force refresh..")
            if not AuthManager("").authQuery("", dict(self.credDict), "CSAdministrator"):
                raise WErr(401, "Cannot initialize force refresh, request not authenticated")
            result = gConfig.forceRefresh()
            if not result["OK"]:
                raise WErr(501, result["Message"])

    def _gatherPeerCredentials(self):
        """
        Load client certchain in DIRAC and extract informations.

        The dictionary returned is designed to work with the AuthManager,
        already written for DISET and re-used for HTTPS.

        :returns: a dict containing the return of :py:meth:`DIRAC.Core.Security.X509Chain.X509Chain.getCredentials`
                  (not a DIRAC structure !)
        """
        # Authorization type
        self.__authGrant = ["VISITOR"]
        if self.request.protocol == "https":
            # First of all we try to authZ with what is specified in cookies, and if attempt is unsuccessful authZ as visitor
            self.__authGrant.insert(0, self.get_cookie("authGrant", "SSL").replace("Certificate", "SSL"))

        credDict = super(_WebHandler, self)._gatherPeerCredentials(grants=self.__authGrant)

        # Add a group if it present in the request path
        if credDict and self.__group:
            credDict["validGroup"] = False
            credDict["group"] = self.__group

        return credDict

    def _authzSESSION(self):
        """Fill credentionals from session

        :return: S_OK(dict)
        """
        credDict = {}

        # Session
        sessionID = self.get_secure_cookie("session_id")

        if not sessionID:
            self.clear_cookie("authGrant")
            return S_OK(credDict)

        # Each session depends on the tokens
        try:
            sLog.debug("Load session tokens..")
            token = OAuth2Token(sessionID.decode())
            sLog.debug("Found session tokens:\n", pprint.pformat(token))
            try:
                return self._authzJWT(token["access_token"])
            except Exception as e:
                sLog.debug("Cannot check access token %s, try to fetch.." % repr(e))
                # Try to refresh access_token and refresh_token
                result = self._idps.getIdProvider("DIRACWeb")
                if not result["OK"]:
                    return result
                cli = result["Value"]
                token = cli.refreshToken(token["refresh_token"])
                # store it to the secure cookie
                self.set_secure_cookie("session_id", json.dumps(token), secure=True, httponly=True)
                return self._authzJWT(token["access_token"])

        except Exception as e:
            sLog.debug(repr(e))
            # if attempt is unsuccessful expire session
            self.clear_cookie("session_id")
            self.set_cookie("session_id", "expired")
            self.set_cookie("authGrant", "Visitor")
            return S_ERROR(repr(e))

    @property
    def log(self):
        return sLog

    @classmethod
    def getLog(cls):
        return sLog

    def getCurrentSession(self):
        return self.__session

    def getUserSetup(self):
        return self.__setup

    def getSessionData(self):
        return self.__sessionData.getData()

    def getAppSettings(self, app=None):
        return Conf.getAppSettings(app or self.__class__.__name__.replace("Handler", "")).get("Value") or {}

    def write_error(self, status_code, **kwargs):
        self.set_status(status_code)
        cType = "text/plain"
        data = self._reason
        if "exc_info" in kwargs:
            ex = kwargs["exc_info"][1]
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
        self.set_header("Content-Type", cType)
        self.finish(data)

    @deprecated("Should be deprecated for v5+, use FileResponse class instead")
    def finishWithImage(self, data, plotImageFile, disableCaching=False):
        # Set headers
        self.set_header("Content-type", "image/png")
        self.set_header(
            "Content-Disposition", 'attachment; filename="%s.png"' % md5(plotImageFile.encode()).hexdigest()
        )
        self.set_header("Content-Length", len(data))
        self.set_header("Content-Transfer-Encoding", "Binary")
        if disableCaching:
            self.set_header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
            self.set_header("Pragma", "no-cache")
            self.set_header(
                "Expires",
                (datetime.datetime.utcnow() - datetime.timedelta(minutes=-10)).strftime("%d %b %Y %H:%M:%S GMT"),
            )
        # Return the data
        self.finish(data)


class WebHandler(_WebHandler):
    """Old WebHandler"""

    # This attribute needed for log, see BaseRequestHandler
    result = None

    def get(self, setup, group, route, *pathArgs):
        self.initializeRequest()
        method = self._getMethod()
        return method(*pathArgs)

    def post(self, *args, **kwargs):
        return self.get(*args, **kwargs)


class WebSocketHandler(tornado.websocket.WebSocketHandler, WebHandler):
    def __init__(self, *args, **kwargs):
        # This attribute needed for log, see BaseRequestHandler
        self.result = None
        WebHandler.__init__(self, *args, **kwargs)
        tornado.websocket.WebSocketHandler.__init__(self, *args, **kwargs)

    def open(self, setup, group, route):
        """ Invoked when a new WebSocket is opened, read more in tornado `docs.\
        <https://www.tornadoweb.org/en/stable/websocket.html#tornado.websocket.WebSocketHandler.open>`_
    """
        return self.on_open()

    def on_open(self):
        pass

    def _getMethod(self):
        """Get method function to call.

        :return: function
        """
        return ""
