import re
import os
import urlparse

from DIRAC import rootPath, gLogger

from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr


def xss_filter(text):
  cleanr = re.compile('<.*?>')
  cleantext = re.sub(cleanr, '', text)
  return cleantext


class RootHandler(WebHandler):

  AUTH_PROPS = "all"
  LOCATION = "/"

  def web_upload(self):

    if 'filename' not in self.request.arguments:
      raise WErr(400, "Please provide a file name!")
    data = self.request.arguments.get("data", "")[0]
    filename = self.request.arguments.get("filename", "")[0]

    if re.match("(?!\.)^[\w\d_\.\-]*$", filename):
      filepath = "%s/webRoot/www/pilot/%s" % (rootPath, filename)
    else:
      raise WErr(400, "Please provide a valid file name!")

    try:
      tmpfile = "%s.tmp" % filepath
      with open(tmpfile, 'w') as tmp:
        tmp.write(data)
      os.rename(tmpfile, filepath)
    except OSError as e:
      raise WErr(400, "Cannot create the file: %s; %s" % (filename, repr(e)))
    self.finish('File has created')

  def web_changeGroup(self):
    try:
      to = self.request.arguments['to'][-1]
    except KeyError:
      raise WErr(400, "Missing 'to' argument")
    self.__change(group=to)

  def web_changeSetup(self):
    try:
      to = self.request.arguments['to'][-1]
    except KeyError:
      raise WErr(400, "Missing 'to' argument")
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

  def web_index(self):
    # Render base template
    data = self.getSessionData()

    url_state = ""
    if "url_state" in self.request.arguments and len(self.request.arguments["url_state"][0]) > 0:
      url_state = xss_filter(self.request.arguments["url_state"][0])

    view_name = Conf.getTheme()
    if "view" in self.request.arguments and len(self.request.arguments["view"][0]) > 0:
      view_name = xss_filter(self.request.arguments["view"][0])

    theme_name = "crisp"  # "gray"
    if "theme" in self.request.arguments and len(self.request.arguments["theme"][0]) > 0:
      theme_name = xss_filter(self.request.arguments["theme"][0].lower())

    open_app = ""
    if "open_app" in self.request.arguments and len(self.request.arguments["open_app"][0]) > 0:
      open_app = xss_filter(self.request.arguments["open_app"][0].strip())

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
                extensions=data['extensions'],
                credentials=data['user'], title=Conf.getTitle(),
                theme=theme_name, root_url=Conf.rootURL(), view=view_name,
                open_app=open_app, debug_level=level, welcome=welcome,
                backgroundImage=background, logo=logo, bugReportURL=Conf.bugReportURL(),
                http_port=Conf.HTTPPort(), https_port=Conf.HTTPSPort())
