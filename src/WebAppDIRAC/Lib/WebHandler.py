import contextlib
import os
import re
import json
import pprint
import datetime
import traceback
import inspect
from hashlib import md5
from concurrent.futures import ThreadPoolExecutor

import tornado.web
import tornado.websocket
from tornado.web import HTTPError, url as TornadoURL

from DIRAC import gLogger, S_OK, S_ERROR
from DIRAC.Core.Utilities.JEncode import DATETIME_DEFAULT_FORMAT
from DIRAC.Core.Utilities.Decorators import deprecated
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.Core.Tornado.Server.private.BaseRequestHandler import (
    BaseRequestHandler,
    TornadoResponse,
)
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

    def __init__(self, payload, fileName: str, ext: str = "", cache: bool = True):
        """C'or

        :param payload: response body
        :param fileName: CSV name
        :param ext: file type
        :param cache: use cache
        """
        name, _ext = os.path.splitext(fileName)
        self.ext = (ext or _ext).lower()
        # Generate file name
        self.fileHash = md5(name.encode()).hexdigest()  # MD5 take a bytes
        self.cache = cache
        super().__init__(payload, 200)

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

        reqObj.set_header("Content-Disposition", f'attachment; filename="{self.fileHash}.{self.ext}"')
        reqObj.set_header("Content-Length", len(self.payload))

        if not self.cache:
            # Disable cache
            reqObj.set_header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
            reqObj.set_header("Pragma", "no-cache")
            reqObj.set_header(
                "Expires",
                (datetime.datetime.utcnow() - datetime.timedelta(minutes=-10)).strftime("%d %b %Y %H:%M:%S GMT"),
            )

        super()._runActions(reqObj)


class WErr(HTTPError):
    def __init__(self, code, msg="", **kwargs):
        super().__init__(code, str(msg) or None)
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
    raise TypeError(f"Object of type {data.__class__.__name__} is not JSON serializable")


class WebHandler(BaseRequestHandler):
    DEFAULT_AUTHENTICATION = ["SSL", "SESSION", "VISITOR"]
    # Auth requirements DEFAULT_AUTHORIZATION
    DEFAULT_AUTHORIZATION = None
    # Base URL prefix
    BASE_URL = None
    # Location of the handler in the URL
    DEFAULT_LOCATION = ""
    # RE to extract group and setup
    PATH_RE = None
    # Prefix of methods names
    METHOD_PREFIX = "web_"

    SUPPORTED_METHODS = (
        "POST",
        "GET",
    )

    # for backward compatibility
    LOCATION = ""
    AUTH_PROPS = None

    # Never use the activity monitoring
    activityMonitoringReporter = False

    # pylint: disable=no-member
    @classmethod
    def _pre_initialize(cls):
        # For backward compatibility
        cls.LOCATION = cls.LOCATION or cls.DEFAULT_LOCATION
        cls.AUTH_PROPS = cls.AUTH_PROPS or cls.DEFAULT_AUTHORIZATION

        cls.DEFAULT_LOCATION = cls.DEFAULT_LOCATION or cls.LOCATION
        cls.DEFAULT_AUTHORIZATION = cls.DEFAULT_AUTHORIZATION or cls.AUTH_PROPS

        # Derive location from class name if not explicitly set
        if not cls.DEFAULT_LOCATION:
            location = cls.__name__[: -len("Handler")] if cls.__name__.endswith("Handler") else cls.__name__
            cls.LOCATION = location
            cls.DEFAULT_LOCATION = location
        else:
            location = cls.DEFAULT_LOCATION

        # Generate per-method URLs (TornadoREST style)
        urls = []
        prefix = cls.METHOD_PREFIX.lower()
        for mName, mObj in inspect.getmembers(cls, lambda x: callable(x) and x.__name__.startswith(prefix)):
            methodName = mName[len(prefix) :]

            # Build method URL path
            if location == "/":
                method_path = "" if methodName == "index" else methodName
            else:
                method_path = f"{location}/{methodName}"

            # Combine with BASE_URL (which contains setup/group regex groups)
            # BASE_URL is like: /DIRAC/?(?:s:([\w-]*)/?)?(?:g:([\w.-]*)/?)?
            base = cls.BASE_URL.rstrip("/")
            if method_path:
                url = f"{base}/{method_path}/?$"
            else:
                url = f"{base}/?$"

            # Inspect method signature for argument types
            mObj.var_kwargs = False
            args = []
            kwargs = {}
            signature = inspect.signature(mObj)
            for name in list(signature.parameters)[1:]:  # skip `self`
                kind = signature.parameters[name].kind
                default = signature.parameters[name].default
                _type = (
                    signature.parameters[name].annotation
                    if signature.parameters[name].annotation is not inspect.Parameter.empty
                    else type(default)
                    if default is not inspect.Parameter.empty and default is not None
                    else None
                )
                if kind in [
                    inspect.Parameter.POSITIONAL_ONLY,
                    inspect.Parameter.POSITIONAL_OR_KEYWORD,
                ]:
                    args.append(_type)
                    # Add regex group for positional arg
                    is_optional = (
                        kind == inspect.Parameter.POSITIONAL_OR_KEYWORD or default is not inspect.Parameter.empty
                    )
                    if _type is int:
                        url += r"(?:/([+-]?\d+)?)?" if is_optional else r"/([+-]?\d+)"
                    elif _type is float:
                        url += r"(?:/([+-]?\d*\.?\d+)?)?" if is_optional else r"/([+-]?\d*\.?\d+)"
                    elif _type is bool:
                        url += r"(?:/([01]|[A-z]+)?)?" if is_optional else r"/([01]|[A-z]+)"
                    else:
                        url += r"(?:/([\w%.-]+)?)?" if is_optional else r"/([\w%.-]+)"
                if kind in [
                    inspect.Parameter.KEYWORD_ONLY,
                    inspect.Parameter.POSITIONAL_OR_KEYWORD,
                ]:
                    kwargs[name] = _type
                if kind == inspect.Parameter.VAR_KEYWORD:
                    mObj.var_kwargs = True
                    url += r"(?:[?&].+=.+)*"

            mObj.keyword_kwarg_types = kwargs
            mObj.positional_arg_types = args

            sLog.verbose(f" - Route {url} ->  {cls.__name__}.{mName}")
            urls.append(TornadoURL(url, cls, dict(method=methodName)))

        # PATH_RE for extracting setup/group from request path (uses BASE_URL pattern)
        cls.PATH_RE = re.compile(f"{cls.BASE_URL}(.*)")

        return urls

    @classmethod
    def _getComponentInfoDict(cls, fullComponentName: str, fullURL: str) -> dict:
        return {}

    @classmethod
    def _getCSAuthorizationSection(cls, handler):
        """Search endpoint auth section.

        :param str handler: API name, see :py:meth:`_getFullComponentName`

        :return: str
        """
        return Conf.getAuthSectionForHandler(handler)

    def _getMethod(self):
        prefix = self.METHOD_PREFIX or f"{self.request.method.lower()}_"
        # Method comes from URLSpec kwargs
        methodName = self._init_kwargs.get("method", "index")
        result = getattr(self, f"{prefix}{methodName}", None)
        sLog.debug(f"_getMethod: prefix={prefix}, methodName={methodName}, result={result}")
        return result

    def _getMethodArgs(self, args: tuple, kwargs: dict):
        """Decode args. The first 3 positional args are the URL regex capture groups
        (setup, group, location) and should be ignored. Actual method arguments
        are extracted from the request body/query parameters.

        :return: tuple(list, dict)
        """
        from urllib.parse import unquote

        keywordArguments = {}
        positionalArguments = []

        # args[3:] skips the URL capture groups
        for i, _type in enumerate(self.methodObj.positional_arg_types[: len(args) - 3]):
            if arg := args[i + 3]:
                positionalArguments.append(_type(unquote(arg)) if _type else unquote(arg))

        if self.request.headers.get("Content-Type") == "application/json" and self.request.body:
            try:
                decoded = json.loads(self.request.body)
                if isinstance(decoded, list):
                    return (positionalArguments + decoded, {})
                elif isinstance(decoded, dict):
                    return (positionalArguments, decoded)
            except json.JSONDecodeError:
                pass

        for name in self.request.arguments:
            if name == "method":
                continue
            if name in self.methodObj.keyword_kwarg_types or self.methodObj.var_kwargs:
                _type = self.methodObj.keyword_kwarg_types.get(name)
                value = self.get_arguments(name) if _type in (tuple, list, set) else self.get_argument(name)
                keywordArguments[name] = _type(value) if _type else value

        return positionalArguments, keywordArguments

    @staticmethod
    def encode(inData):
        """Encode data.
        The method is defined in BaseRequestHandler and redefined in _WebHandler to provide
        correct JSON data to the view.

        :return: encoded data
        """
        return json.dumps(inData, default=defaultEncoder)

    async def prepare(self):
        """Prepare the request. It reads certificates and check authorizations.
        We make the assumption that there is always going to be a ``method`` argument
        regardless of the HTTP method used
        """
        # Parse request URI
        groups = self.PATH_RE.match(self.request.path).groups()
        self.__setup = groups[0] or Conf.setup()
        self.__group = groups[1]

        try:
            await super().prepare()
        except HTTPError as e:
            raise WErr(e.status_code, e.log_message)

    @contextlib.contextmanager
    def _setupThreadConfig(self):
        threadConfig = ThreadConfig()
        if userDN := self.getUserDN():
            threadConfig.setDN(userDN)
        if userGroup := self.getUserGroup():
            threadConfig.setGroup(userGroup)
        threadConfig.setSetup(self.__setup)
        try:
            yield
        finally:
            threadConfig.reset()

    def _executeMethod(self, args: list, kwargs: dict):
        """Execute the requested method while impersonating the current user."""
        with self._setupThreadConfig():
            return super()._executeMethod(args, kwargs)

    def _gatherPeerCredentials(self):
        """
        Load client certificate chain in DIRAC and extract informations.

        The dictionary returned is designed to work with the AuthManager,
        already written for DISET and re-used for HTTPS.

        :returns: dict containing the return of :py:meth:`DIRAC.Core.Security.X509Chain.X509Chain.getCredentials`
        """
        # Authorization type
        self.__authGrant = ["VISITOR"]
        if self.request.protocol == "https":
            # First of all we try to authZ with what is specified in cookies, and if attempt is unsuccessful authZ as visitor
            self.__authGrant.insert(0, self.get_cookie("authGrant", "SSL").replace("Certificate", "SSL"))

        credDict = super()._gatherPeerCredentials(grants=self.__authGrant)

        # Add a group if it present in the request path
        if credDict and self.__group:
            credDict["validGroup"] = False
            credDict["group"] = self.__group

        return credDict

    def _authzSESSION(self):
        """Fill credentials from session

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
                sLog.debug(f"Cannot check access token {repr(e)}, try to fetch..")
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

    @classmethod
    def getLog(cls):
        return sLog

    def getUserSetup(self):
        return self.__setup

    def getSessionData(self):
        if not hasattr(self, "__sessionData"):
            self.__sessionData = SessionData(self.credDict, self.__setup)
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
            self.log.error("Request ended in error:\n  %s" % "\n  ".join(trace))
            if isinstance(ex, WErr):
                data = ex.msg
                if isinstance(data, dict):
                    cType = "application/json"
                    data = json.dumps(data)
        self.set_header("Content-Type", cType)
        self.finish(data)

    @deprecated("Should be deprecated for v5+, use FileResponse class instead")
    def finishWithImage(self, data, plotImageFile, disableCaching=False):
        # Set headers
        self.set_header("Content-Type", "image/png")
        self.set_header(
            "Content-Disposition",
            f'attachment; filename="{md5(plotImageFile.encode()).hexdigest()}.png"',
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


class WebSocketHandler(tornado.websocket.WebSocketHandler, WebHandler):
    def __init__(self, *args, **kwargs):
        WebHandler.__init__(self, *args, **kwargs)
        tornado.websocket.WebSocketHandler.__init__(self, *args, **kwargs)

    @classmethod
    def _pre_initialize(cls):
        # For backward compatibility
        cls.LOCATION = cls.LOCATION or cls.DEFAULT_LOCATION
        cls.AUTH_PROPS = cls.AUTH_PROPS or cls.DEFAULT_AUTHORIZATION

        cls.DEFAULT_LOCATION = cls.DEFAULT_LOCATION or cls.LOCATION
        cls.DEFAULT_AUTHORIZATION = cls.DEFAULT_AUTHORIZATION or cls.AUTH_PROPS

        # Derive location from class name if not explicitly set
        if not cls.DEFAULT_LOCATION:
            location = cls.__name__[: -len("Handler")] if cls.__name__.endswith("Handler") else cls.__name__
            cls.LOCATION = location
            cls.DEFAULT_LOCATION = location
        else:
            location = cls.DEFAULT_LOCATION

        # Define base path regex to know setup/group
        cls.PATH_RE = re.compile(url := f"{cls.BASE_URL}({location})")
        sLog.verbose(f" - WebSocket {location} -> {cls.__name__}")
        sLog.debug(f"  * {url}")

        # Inspect web methods for argument type attributes
        prefix = cls.METHOD_PREFIX.lower()
        for mName, mObj in inspect.getmembers(cls, lambda x: callable(x) and x.__name__.startswith(prefix)):
            mObj.var_kwargs = False
            args = []
            kwargs = {}
            signature = inspect.signature(mObj)
            for name in list(signature.parameters)[1:]:
                kind = signature.parameters[name].kind
                default = signature.parameters[name].default
                _type = (
                    signature.parameters[name].annotation
                    if signature.parameters[name].annotation is not inspect.Parameter.empty
                    else type(default)
                    if default is not inspect.Parameter.empty and default is not None
                    else None
                )
                if kind in [
                    inspect.Parameter.POSITIONAL_ONLY,
                    inspect.Parameter.POSITIONAL_OR_KEYWORD,
                ]:
                    args.append(_type)
                if kind in [
                    inspect.Parameter.KEYWORD_ONLY,
                    inspect.Parameter.POSITIONAL_OR_KEYWORD,
                ]:
                    kwargs[name] = _type
                if kind == inspect.Parameter.VAR_KEYWORD:
                    mObj.var_kwargs = True
            mObj.keyword_kwarg_types = kwargs
            mObj.positional_arg_types = args

        return [(url, cls)]

    def open(self, *args, **kwargs):
        """Invoked when a new WebSocket is opened, read more in tornado `docs.\
        <https://www.tornadoweb.org/en/stable/websocket.html#tornado.websocket.WebSocketHandler.open>`_
        """
        return self.on_open()

    def on_open(self):
        """Developer should implement this method"""
        raise NotImplementedError('"on_open" method is not implemented')

    def _getMethod(self):
        """Get method function to call."""
        return self.on_open

    def _on_message(self, msg):
        """This needs to be implemented instead of ``on_message``"""
        raise NotImplementedError('"_on_message" method is not implemented')

    def on_message(self, msg):
        """Setup the threadConfig before doing the actual calls.
        Developer should implement ``_on_message`` instead
        of ``on_message``
        """
        with self._setupThreadConfig():
            return self._on_message(msg)
