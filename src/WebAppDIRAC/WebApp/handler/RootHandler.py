import json
import pprint
from urllib.parse import urlparse

from tornado.escape import xhtml_escape
from tornado import template

from DIRAC import gLogger
from DIRAC.Core.Tornado.Server.private.BaseRequestHandler import TornadoResponse

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import _WebHandler as WebHandler, WErr


class RootHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "all"
    DEFAULT_LOCATION = "/"
    SUPPORTED_METHODS = ("GET",)

    def web_changeGroup(self, to):
        """Change group

        :param str to: group name

        :return: TornadoResponse()
        """
        return TornadoResponse().redirect(self.__change(group=to))  # pylint: disable=no-member

    def web_changeSetup(self, to):
        """Change setup

        :param str to: setup name

        :return: TornadoResponse()
        """
        return TornadoResponse().redirect(self.__change(setup=to))  # pylint: disable=no-member

    def __change(self, setup=None, group=None):
        """Generate URL to change setup/group

        :param str setup: setup name
        :param str group: group name

        :return: str
        """
        url = [
            Conf.rootURL().strip("/"),
            "s:%s" % (setup or self.getUserSetup()),
            "g:%s" % (group or self.getUserGroup() or "anon"),
        ]
        qs = False
        if "Referer" in self.request.headers:
            o = urlparse(self.request.headers["Referer"])
            url.append("?%s" % o.query)
        return "/%s" % "/".join(url)

    def web_getConfigData(self, **kwargs):
        """Get session data

        :return: dict
        """
        return self.getSessionData()

    def web_logout(self, **kwargs):
        """Logout"""
        token = self.get_secure_cookie("session_id")
        if token:
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
        result = self._idps.getIdProvider("DIRACWeb")
        if not result["OK"]:
            raise WErr(500, result["Message"])
        cli = result["Value"]
        cli.scope = ""
        if provider:
            cli.metadata["authorization_endpoint"] = "%s/%s" % (cli.get_metadata("authorization_endpoint"), provider)

        uri, state, session = cli.submitNewSession()

        # Save authorisation session
        session.update(dict(state=state, provider=provider, next=next))

        resp = TornadoResponse()
        # pylint: disable=no-member
        resp.set_secure_cookie("webauth_session", json.dumps(session), secure=True, httponly=True)

        # Redirect to authorization server
        resp.set_cookie("authGrant", "Visitor")  # pylint: disable=no-member
        return resp.redirect(uri)  # pylint: disable=no-member

    def web_loginComplete(self, code, state, **kwargs):
        """Finishing authoriation flow

        :param str code: code
        :param str state: state

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
        {{message}}
        <script>
          sessionStorage.setItem("access_token", "{{access_token}}");
          window.location = "{{next}}";
        </script>
      </body>
    </html>"""
        )
        resp = TornadoResponse()
        authSession = self.get_secure_cookie("webauth_session")
        if not authSession:
            return resp.redirect("/")  # pylint: disable=no-member
        authSession = json.loads(authSession)

        result = self._idps.getIdProvider("DIRACWeb")
        if not result["OK"]:
            # pylint: disable=no-member
            resp.finish(t.generate(next=authSession["next"], access_token="", message=result["Message"]).decode())
            return resp
        cli = result["Value"]

        result = cli.fetchToken(authorization_response=self.request.uri, code_verifier=authSession.get("code_verifier"))
        if not result["OK"]:
            # pylint: disable=no-member
            resp.finish(t.generate(next=authSession["next"], access_token="", message=result["Message"]).decode())
            return resp
        token = result["Value"]

        # Remove authorisation session.
        resp.clear_cookie("webauth_session")  # pylint: disable=no-member

        # Create session to work through portal
        self.log.debug("Tokens received:\n", pprint.pformat(token))
        # pylint: disable=no-member
        resp.set_secure_cookie("session_id", json.dumps(dict(token)), secure=True, httponly=True)
        resp.set_cookie("authGrant", "Session")  # pylint: disable=no-member

        result = cli.researchGroup()
        if not result["OK"]:
            # pylint: disable=no-member
            return resp.finish(
                t.generate(next=authSession["next"], access_token="", message=result["Message"]).decode()
            )
        group = result["Value"].get("group")

        url = "/".join([Conf.rootURL().strip("/"), "s:%s" % self.getUserSetup(), "g:%s" % group])
        nextURL = "/%s/?%s" % (url, urlparse(authSession["next"]).query)
        # Save token and go to main page
        # with document('DIRAC authentication') as html:
        #   dom.div('Authorization is done.',
        #           style='display:flex;justify-content:center;align-items:center;padding:28px;font-size:28px;')
        #   dom.script("sessionStorage.setItem('access_token','%s');window.location='%s'" % (access_token, nextURL),
        #              type="text/javascript")
        # return template.Template(html.render()).generate()
        # pylint: disable=no-member
        resp.finish(
            t.generate(next=nextURL, access_token=token["access_token"], message="Authorization is done").decode()
        )
        return resp

    def web_index(self, *, url_state="", theme="crisp", open_app="", **kwargs):
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
                with open(welcomeFile, "r") as f:
                    welcome = f.read().replace("\n", "")
            except Exception:
                gLogger.warn("Welcome page not found here: %s" % welcomeFile)

        # pylint: disable=no-member
        return TornadoResponse().render(
            "root.tpl",
            _dev=Conf.devMode(),
            logo=data["baseURL"] + Conf.getLogo(),
            view="tabs",
            theme=theme.lower(),
            title=Conf.getTitle(),
            welcome=welcome,
            iconUrl=data["baseURL"] + Conf.getIcon(),
            open_app=open_app.strip(),
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
