import json
import pprint
from urllib.parse import urlparse

from tornado.escape import xhtml_escape, json_encode
from tornado import template

from DIRAC import gLogger
from DIRAC.Core.Tornado.Server.private.BaseRequestHandler import TornadoResponse

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr


class RootHandler(WebHandler):
    DEFAULT_AUTHORIZATION = "all"
    DEFAULT_LOCATION = "/"
    SUPPORTED_METHODS = ("GET",)

    def web_changeGroup(self, to: str):
        """Change group

        :return: TornadoResponse()
        """
        return TornadoResponse().redirect(self.__change(group=to))  # pylint: disable=no-member

    def __change(self, setup: str = None, group: str = None) -> str:
        """Generate URL to change setup/group, set query"""
        root = Conf.rootURL().strip("/")
        setup = setup or self.getUserSetup() or ""
        group = group or self.getUserGroup() or ""
        query = ((ref := self.request.headers.get("Referer")) and urlparse(ref).query) or ""
        return f"/{root}/s:{setup}/g:{group}/?{query}"

    def __validateNextURL(self, url):
        """Validate redirect URL to prevent open redirect and XSS attacks.

        Only allows URLs that start with the configured root URL path.
        """
        rootURL = Conf.rootURL().strip("/")
        parsed = urlparse(url)
        # Reject URLs with schemes (javascript:, data:, etc.)
        if parsed.scheme and parsed.scheme.lower() not in ("http", "https"):
            return rootURL + "/"
        # Reject URLs with different netloc (different host)
        if parsed.netloc:
            return rootURL + "/"
        # Ensure path starts with root URL
        if not parsed.path.startswith(rootURL):
            return rootURL + "/"
        return url

    def web_getConfigData(self, **kwargs) -> dict:
        """Get session data"""
        return self.getSessionData()

    def web_logout(self, **kwargs):
        """Logout"""
        if token := self.get_secure_cookie("session_id"):
            token = json.loads(token)
            if token.get("refresh_token"):
                result = self._idps.getIdProvider("DIRACWeb")
                if result["OK"]:
                    cli = result["Value"]
                    cli.token = token
                    cli.revokeToken(token["refresh_token"])

    def finish_logout(self):
        """Finish logout process"""
        self.clear_cookie("session_id")
        self.set_cookie("authGrant", "Visitor")
        self.redirect("/DIRAC")

    def web_login(self, provider, next="/DIRAC", **kwargs):
        """Start authorization flow

        :param str provider: provider name
        :param str next: current URI

        :return: TornadoResponse()
        """
        # Validate next URL to prevent open redirect
        next = self.__validateNextURL(next)

        if not (result := self._idps.getIdProvider("DIRACWeb"))["OK"]:
            raise WErr(500, result["Message"])
        cli = result["Value"]
        cli.scope = ""
        if provider:
            cli.metadata["authorization_endpoint"] = "{}/{}".format(
                cli.get_metadata("authorization_endpoint"), provider
            )

        uri, state, session = cli.submitNewSession()

        # Save authorisation session
        session.update(dict(state=state, provider=provider, next=next))

        resp = TornadoResponse()
        # pylint: disable=no-member
        resp.set_secure_cookie("webauth_session", json.dumps(session), secure=True, httponly=True, samesite="Lax")

        # Redirect to authorization server
        resp.set_cookie("authGrant", "Visitor", samesite="Lax")  # pylint: disable=no-member
        return resp.redirect(uri)  # pylint: disable=no-member

    def web_loginComplete(self, code: str, state: str, **kwargs):
        """Finishing authoriation flow

        :return: TornadoResponse()
        """
        t = template.Template(
            """<!DOCTYPE html>
    <html>
      <head>
        <title>Authentication</title>
        <meta charset="utf-8" />
      </head>
      <body>
        {{ message }}
        <script>
          sessionStorage.setItem("access_token", {% raw json_encode(access_token) %});
          window.location = {% raw json_encode(next) %};
        </script>
      </body>
    </html>"""
        )
        resp = TornadoResponse()
        if not (authSession := self.get_secure_cookie("webauth_session")):
            return resp.redirect("/")  # pylint: disable=no-member
        authSession = json.loads(authSession)

        # Validate next URL to prevent open redirect and XSS
        nextURL = self.__validateNextURL(authSession.get("next", "/DIRAC"))

        if not (result := self._idps.getIdProvider("DIRACWeb"))["OK"]:
            # pylint: disable=no-member
            resp.finish(t.generate(next=nextURL, access_token="", message=result["Message"], json_encode=json_encode).decode())
            return resp
        cli = result["Value"]

        result = cli.fetchToken(authorization_response=self.request.uri, code_verifier=authSession.get("code_verifier"))
        if not result["OK"]:
            # pylint: disable=no-member
            resp.finish(t.generate(next=nextURL, access_token="", message=result["Message"], json_encode=json_encode).decode())
            return resp
        token = result["Value"]

        # Remove authorisation session.
        resp.clear_cookie("webauth_session")  # pylint: disable=no-member

        # Create session to work through portal
        self.log.debug("Tokens received:\n", pprint.pformat(token))
        # pylint: disable=no-member
        resp.set_secure_cookie("session_id", json.dumps(dict(token)), secure=True, httponly=True, samesite="Lax")
        resp.set_cookie("authGrant", "Session", samesite="Lax")  # pylint: disable=no-member

        if not (result := cli.researchGroup())["OK"]:
            # pylint: disable=no-member
            return resp.finish(
                t.generate(next=nextURL, access_token="", message=result["Message"], json_encode=json_encode).decode()
            )
        self.request.headers["Referer"] = nextURL
        redirectURL = self.__change(group=result["Value"].get("group"))

        # Save token and go to main page
        # pylint: disable=no-member
        resp.finish(
            t.generate(next=redirectURL, access_token=token["access_token"], message="Authorization is done", json_encode=json_encode).decode()
        )
        return resp

    def web_index(self, *, url_state="", theme="", open_app="", **kwargs):
        """Index method

        :param str url_state: url state
        :param str theme: selected theme name, default "crisp"

        :return: TornadoResponse()
        """
        # Render base template
        data = self.getSessionData()

        welcome = ""
        welcomeFile = Conf.getWelcome()
        if welcomeFile:
            try:
                with open(welcomeFile) as f:
                    welcome = f.read().replace("\n", "")
            except Exception:
                gLogger.warn(f"Welcome page not found here: {welcomeFile}")

        if not theme:
            theme = Conf.getTheme()

        # pylint: disable=no-member
        return TornadoResponse().render(
            "root.tpl",
            _dev=Conf.devMode(),
            logo=data["baseURL"] + Conf.getLogo(),
            view="tabs",
            theme=xhtml_escape(theme.lower()),
            title=Conf.getTitle(),
            welcome=welcome,
            iconUrl=data["baseURL"] + Conf.getIcon(),
            open_app=xhtml_escape(open_app.strip()),
            base_url=data["baseURL"],
            root_url=Conf.rootURL(),
            url_state=xhtml_escape(url_state),
            http_port=Conf.HTTPPort(),
            https_port=Conf.HTTPSPort(),
            extensions=data["extensions"],
            credentials=data["user"],
            ext_version=data["extVersion"],
            debug_level=str(gLogger.getLevel()).lower(),
            bugReportURL=Conf.bugReportURL(),
            backgroundImage=data["baseURL"] + Conf.getBackgroud(),
            auth_client_settings=data["configuration"].get("AuthorizationClient", {}),
        )
