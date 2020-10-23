from hashlib import md5

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Resources.Catalog.FileCatalog import FileCatalog
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getVOForGroup

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class FileCatalogHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  def __init__(self, *args, **kwargs):
    super(FileCatalogHandler, self).__init__(*args, **kwargs)
    sessionData = self.getSessionData()
    self.user = sessionData['user'].get('username', '')
    self.group = sessionData['user'].get('group', '')
    self.vo = getVOForGroup(self.group)
    self.fc = FileCatalog(vo=self.vo)

  @asyncGen
  def web_getMetadataFields(self):
    """ Method to get the selected file(s)
    """

    self.L_NUMBER = 0
    self.S_NUMBER = 0
    result = yield self.threadTask(self.fc.getMetadataFields)
    gLogger.debug("request: %s" % result)
    if not result["OK"]:
      gLogger.error("getSelectorGrid: %s" % result["Message"])
      self.finish({"success": "false", "error": result["Message"]})
      return
    result = result["Value"]
    callback = {}
    if "FileMetaFields" not in result:
      error = "Service response has no FileMetaFields key"
      gLogger.error("getSelectorGrid: %s" % error)
      self.finish({"success": "false", "error": error})
      return
    if "DirectoryMetaFields" not in result:
      error = "Service response has no DirectoryMetaFields key"
      gLogger.error("getSelectorGrid: %s" % error)
      self.finish({"success": "false", "error": error})
      return
    filemeta = result["FileMetaFields"]
    if len(filemeta) > 0:
      for key, value in filemeta.items():
        callback[key] = "label"
    gLogger.debug("getSelectorGrid: FileMetaFields callback %s" % callback)
    dirmeta = result["DirectoryMetaFields"]
    if len(dirmeta) > 0:
      for key, value in dirmeta.items():
        callback[key] = value.lower()
    gLogger.debug("getSelectorGrid: Resulting callback %s" % callback)
    self.finish({"success": "true", "result": callback})

  @asyncGen
  def web_getQueryData(self):
    """ Method to read all the available options for a metadata field
    """
    try:
      compat = dict()
      for key in self.request.arguments:

        parts = str(key).split(".")

        if len(parts) != 3:
          continue

        key = str(key)
        name = parts[1]
        sign = parts[2]

        if not len(name) > 0:
          continue

        value = str(self.request.arguments[key][0]).split("|")

        # check existence of the 'name' section
        if name not in compat:
          compat[name] = dict()

        # check existence of the 'sign' section
        if sign not in compat[name]:
          if value[0] == "v":
            compat[name][sign] = ""
          elif value[0] == "s":
            compat[name][sign] = []

        if value[0] == "v":
          compat[name][sign] = value[1]
        elif value[0] == "s":
          compat[name][sign] += value[1].split(":::")

    except Exception:
      self.finish({"success": "false", "error": "Metadata query error"})
      return

    path = "/"

    if "path" in self.request.arguments:
      path = self.request.arguments["path"][0]

    gLogger.always(compat)

    result = yield self.threadTask(self.fc.getCompatibleMetadata, compat, path)
    gLogger.always(result)

    if not result["OK"]:
      self.finish({"success": "false", "error": result["Message"]})
      return

    self.finish({"success": "true", "result": result["Value"]})

  @asyncGen
  def web_getFilesData(self):
    req = self.__request()
    gLogger.always(req)
    gLogger.debug("submit: incoming request %s" % req)
    result = yield self.threadTask(self.fc.findFilesByMetadataWeb,
                                   req["selection"],
                                   req["path"],
                                   self.S_NUMBER,
                                   self.L_NUMBER)
    gLogger.debug("submit: result of findFilesByMetadataDetailed %s" % result)
    if not result["OK"]:
      gLogger.error("submit: %s" % result["Message"])
      self.finish({"success": "false", "error": result["Message"]})
      return
    result = result["Value"]

    if not len(result) > 0:
      self.finish({"success": "true", "result": [], "total": 0, "date": "-"})
      return

    total = result["TotalRecords"]
    result = result["Records"]

    callback = list()
    for key, value in result.items():

      size = ""
      if "Size" in value:
        size = value["Size"]

      date = ""
      if "CreationDate" in value:
        date = str(value["CreationDate"])

      meta = ""
      if "Metadata" in value:
        m = value["Metadata"]
        meta = '; '.join(['%s: %s' % (i, j) for (i, j) in m.items()])

      dirnameList = key.split("/")
      dirname = "/".join(dirnameList[:len(dirnameList) - 1])
      filename = dirnameList[len(dirnameList) - 1:]

      callback.append({"fullfilename": key, "dirname": dirname, "filename": filename, "date": date, "size": size,
                       "metadata": meta})
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    self.finish({"success": "true", "result": callback, "total": total, "date": timestamp})

  def __request(self):
    req = {"selection": {}, "path": "/"}

    self.L_NUMBER = 25
    if "limit" in self.request.arguments and len(self.request.arguments["limit"][0]) > 0:
      self.L_NUMBER = int(self.request.arguments["limit"][0])

    self.S_NUMBER = 0
    if "start" in self.request.arguments and len(self.request.arguments["start"][0]) > 0:
      self.S_NUMBER = int(self.request.arguments["start"][0])

    result = gConfig.getOption("/WebApp/ListSeparator")
    if result["OK"]:
      separator = result["Value"]
    else:
      separator = ":::"

    result = self.fc.getMetadataFields()
    gLogger.debug("request: %s" % result)

    if not result["OK"]:
      gLogger.error("request: %s" % result["Message"])
      return req
    result = result["Value"]

    if "FileMetaFields" not in result:
      error = "Service response has no FileMetaFields key. Return empty dict"
      gLogger.error("request: %s" % error)
      return req

    if "DirectoryMetaFields" not in result:
      error = "Service response has no DirectoryMetaFields key. Return empty dict"
      gLogger.error("request: %s" % error)
      return req

    filemeta = result["FileMetaFields"]
    dirmeta = result["DirectoryMetaFields"]

    meta = []
    for key, value in dirmeta.items():
      meta.append(key)

    gLogger.always("request: metafields: %s " % meta)

    for param in self.request.arguments:

      tmp = str(param).split('.')

      if len(tmp) != 3:
        continue

      name = tmp[1]
      logic = tmp[2]
      value = self.request.arguments[param][0].split("|")

      if logic not in ["in", "nin", "=", "!=", ">=", "<=", ">", "<"]:
        gLogger.always("Operand '%s' is not supported " % logic)
        continue

      if name in meta:
        # check existence of the 'name' section
        if name not in req["selection"]:
          req["selection"][name] = dict()

        # check existence of the 'sign' section
        if logic not in req["selection"][name]:
          if value[0] == "v":
            req["selection"][name][logic] = ""
          elif value[0] == "s":
            req["selection"][name][logic] = []

        if value[0] == "v":
          req["selection"][name][logic] = value[1]
        elif value[0] == "s":
          req["selection"][name][logic] += value[1].split(":::")
    if "path" in self.request.arguments:
      req["path"] = self.request.arguments["path"][0]
    gLogger.always("REQ: ", req)
    return req

  def __request_file(self):
    req = {"selection": {}, "path": "/"}

    separator = ":::"

    result = self.fc.getMetadataFields()
    gLogger.debug("request: %s" % result)

    if not result["OK"]:
      gLogger.error("request: %s" % result["Message"])
      return req
    result = result["Value"]

    if "FileMetaFields" not in result:
      error = "Service response has no FileMetaFields key. Return empty dict"
      gLogger.error("request: %s" % error)
      return req

    if "DirectoryMetaFields" not in result:
      error = "Service response has no DirectoryMetaFields key. Return empty dict"
      gLogger.error("request: %s" % error)
      return req

    filemeta = result["FileMetaFields"]
    dirmeta = result["DirectoryMetaFields"]

    meta = []
    for key, value in dirmeta.items():
      meta.append(key)

    gLogger.always("request: metafields: %s " % meta)

    selectionElems = self.request.arguments["selection"][0].split("<|>")

    gLogger.always("request: THISSSS %s " % self.request.arguments["selection"][0])

    for param in selectionElems:

      tmp = str(param).split('|')

      if len(tmp) != 4:
        continue

      name = tmp[0]
      logic = tmp[1]

      if logic not in ["in", "nin", "=", "!=", ">=", "<=", ">", "<"]:
        gLogger.always("Operand '%s' is not supported " % logic)
        continue

      if name in meta:
        # check existence of the 'name' section
        if name not in req["selection"]:
          req["selection"][name] = dict()

        # check existence of the 'sign' section
        if logic not in req["selection"][name]:
          if tmp[2] == "v":
            req["selection"][name][logic] = ""
          elif tmp[2] == "s":
            req["selection"][name][logic] = []

        if tmp[2] == "v":
          req["selection"][name][logic] = tmp[3]
        elif tmp[2] == "s":
          req["selection"][name][logic] += tmp[3].split(":::")
    if "path" in self.request.arguments:
      req["path"] = self.request.arguments["path"][0]
    gLogger.always("REQ: ", req)
    return req

  @asyncGen
  def web_getMetadataFilesInFile(self):
    self.set_header('Content-type', 'text/plain')
    self.set_header('Content-Disposition', 'attachment; filename="error.txt"')
    req = self.__request_file()
    gLogger.always(req)
    gLogger.debug("submit: incoming request %s" % req)
    result = yield self.threadTask(self.fc.findFilesByMetadata, req["selection"], req["path"])

    if not result["OK"]:
      gLogger.error("submit: %s" % result["Message"])
      self.finish({"success": "false", "error": result["Message"]})
      return

    result = result["Value"]
    retStrLines = []

    if len(result) > 0:
      for fileName in result:
        retStrLines.append(fileName)

    strData = "\n".join(retStrLines)

    self.set_header('Content-type', 'text/plain')
    self.set_header('Content-Disposition', 'attachment; filename="%s.txt"' % md5(str(req)).hexdigest())
    self.set_header('Content-Length', len(strData))
    self.finish(strData)

  @asyncGen
  def web_getSubnodeFiles(self):
    path = self.request.arguments["path"][0]

    result = yield self.threadTask(self.fc.listDirectory, path, False)
    if not result["OK"]:
      gLogger.error("submit: %s" % result["Message"])
      self.finish({"success": "false", "error": result["Message"]})
      return
    filesData = result["Value"]["Successful"][path]["Files"]
    dirData = result["Value"]["Successful"][path]["SubDirs"]

    retData = []

    for entryName in dirData:
      nodeDef = {'text': entryName.split("/")[-1]}
      nodeDef['leaf'] = False
      nodeDef['expanded'] = False
      retData.append(nodeDef)

    for entryName in filesData:
      nodeDef = {'text': entryName.split("/")[-1]}
      nodeDef['leaf'] = True
      retData.append(nodeDef)

    retData = sorted(retData, key=lambda node: node['text'].upper())

    self.finish({"success": "true", "nodes": retData})
