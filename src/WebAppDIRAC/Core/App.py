import os
import ssl
import sys
import signal
import tornado.web
import tornado.process
import tornado.httpserver
import tornado.autoreload

from DIRAC import gLogger, S_OK
from WebAppDIRAC.Core.HandlerMgr import HandlerMgr
from WebAppDIRAC.Core.TemplateLoader import TemplateLoader
from WebAppDIRAC.Lib.SessionData import SessionData
from WebAppDIRAC.Lib import Conf

# If we are running with python3, Tornado will use asyncio,
# and we have to convince it to let us run in a different thread
# Doing this ensures a consistent behavior between py2 and py3
# see https://www.tornadoweb.org/en/stable/asyncio.html#tornado.platform.asyncio.AnyThreadEventLoopPolicy
import asyncio
from tornado.platform.asyncio import AnyThreadEventLoopPolicy

asyncio.set_event_loop_policy(AnyThreadEventLoopPolicy())


class App:
    def __init__(self, handlersLoc="WebApp.handler"):
        self.__handlerMgr = HandlerMgr(handlersLoc, Conf.rootURL())
        self.__servers = {}
        self.log = gLogger.getSubLogger("Web")

    def _logRequest(self, handler):
        status = handler.get_status()
        if status < 400:
            logm = self.log.notice
        elif status < 500:
            logm = self.log.warn
        else:
            logm = self.log.error
        request_time = 1000.0 * handler.request.request_time()
        logm("%d %s %.2fms" % (status, handler._request_summary(), request_time))

    def __reloadAppCB(self):
        gLogger.notice("\n !!!!!! Reloading web app...\n")

    def stopChildProcesses(self, sig, frame):
        """
        It is used to properly stop tornado when more than one process is used.
        In principle this is doing the job of runsv....
        :param int sig: the signal sent to the process
        :param object frame: execution frame which contains the child processes
        """
        # tornado.ioloop.IOLoop.instance().add_timeout(time.time()+5, sys.exit)
        for child in frame.f_locals.get("children", []):
            gLogger.info("Stopping child processes: %d" % child)
            os.kill(child, signal.SIGTERM)
        # tornado.ioloop.IOLoop.instance().stop()
        # gLogger.info('exit success')
        sys.exit(0)

    def getAppToDict(self, port=None):
        """Load Web portals

        :return: S_OK(dict)/S_ERROR()
        """
        app = {"port": port or Conf.HTTPSPort()}
        # Calculating routes
        result = self.__handlerMgr.getRoutes()
        if not result["OK"]:
            return result
        app["routes"] = result["Value"]
        # Initialize the session data
        SessionData.setHandlers(self.__handlerMgr.getHandlers()["Value"])
        # Create the app
        tLoader = TemplateLoader(self.__handlerMgr.getPaths("template"))
        app["settings"] = dict(
            debug=Conf.devMode(),
            template_loader=tLoader,
            cookie_secret=str(Conf.cookieSecret()),
            log_function=self._logRequest,
        )
        return S_OK(app)

    def bootstrap(self):
        """
        Configure and create web app
        """
        self.log.always("\n ====== Starting DIRAC web app ====== \n")

        # Calculating routes
        result = self.__handlerMgr.getRoutes()
        if not result["OK"]:
            return result
        routes = result["Value"]
        # Initialize the session data
        SessionData.setHandlers(self.__handlerMgr.getHandlers()["Value"])
        # Create the app
        tLoader = TemplateLoader(self.__handlerMgr.getPaths("template"))
        kw = dict(
            debug=Conf.devMode(),
            template_loader=tLoader,
            cookie_secret=str(Conf.cookieSecret()),
            log_function=self._logRequest,
            autoreload=Conf.numProcesses() < 2,
        )

        # please do no move this lines. The lines must be before the fork_processes
        signal.signal(signal.SIGTERM, self.stopChildProcesses)
        signal.signal(signal.SIGINT, self.stopChildProcesses)

        # Check processes if we're under a load balancert
        if Conf.balancer() and Conf.numProcesses() not in (0, 1):
            tornado.process.fork_processes(Conf.numProcesses(), max_restarts=0)
            kw["debug"] = False
        # Debug mode?
        if kw["debug"]:
            self.log.info("Configuring in developer mode...")
        # Configure tornado app
        self.__app = tornado.web.Application(routes, **kw)
        port = Conf.HTTPPort()
        self.log.notice("Configuring HTTP on port %s" % port)
        # Create the web servers
        srv = tornado.httpserver.HTTPServer(self.__app, xheaders=True)
        srv.listen(port)
        self.__servers[("http", port)] = srv

        Conf.generateRevokedCertsFile()  # it is used by nginx....

        if Conf.HTTPS():
            self.log.notice("Configuring HTTPS on port %s" % Conf.HTTPSPort())
            sslops = dict(
                certfile=Conf.HTTPSCert(),
                keyfile=Conf.HTTPSKey(),
                cert_reqs=ssl.CERT_OPTIONAL,
                ca_certs=Conf.generateCAFile(),
                ssl_version=ssl.PROTOCOL_TLSv1_2,
            )

            sslprotocol = str(Conf.SSLProtocol())
            aviableProtocols = [i for i in dir(ssl) if i.find("PROTOCOL") == 0]
            if sslprotocol and sslprotocol != "":
                if sslprotocol in aviableProtocols:
                    sslops["ssl_version"] = getattr(ssl, sslprotocol)
                else:
                    message = "%s protocol is not provided." % sslprotocol
                    message += "The following protocols are provided: %s" % str(aviableProtocols)
                    gLogger.warn(message)

            self.log.debug(" - %s" % "\n - ".join(["%s = %s" % (k, sslops[k]) for k in sslops]))
            srv = tornado.httpserver.HTTPServer(self.__app, ssl_options=sslops, xheaders=True)
            port = Conf.HTTPSPort()
            srv.listen(port)
            self.__servers[("https", port)] = srv
        else:
            # when NGINX is used then the Conf.HTTPS return False, it means tornado
            # does not have to be configured using 443 port
            Conf.generateCAFile()  # if we use Nginx we have to generate the cas as well...
        return result

    def run(self):
        """
        Start web servers
        """
        bu = Conf.rootURL().strip("/")
        urls = []
        for proto, port in self.__servers:
            urls.append("%s://0.0.0.0:%s/%s/" % (proto, port, bu))
        self.log.always("Listening on %s" % " and ".join(urls))
        tornado.autoreload.add_reload_hook(self.__reloadAppCB)
        tornado.ioloop.IOLoop.instance().start()
