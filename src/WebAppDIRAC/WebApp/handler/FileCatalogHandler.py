import os
import time
import random
import shutil
import zipfile

from hashlib import md5

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Resources.Catalog.FileCatalog import FileCatalog
from DIRAC.DataManagementSystem.Client.DataManager import DataManager
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getVOForGroup

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class FileCatalogHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    def initializeRequest(self):
        self.user = self.getUserName()
        self.group = self.getUserGroup()
        self.vo = getVOForGroup(self.group)
        self.fc = FileCatalog(vo=self.vo)

    @asyncGen
    def web_getSelectedFiles(self):
        """Method to get the selected file(s)"""
        gLogger.always("getSelectedFiles: incoming arguments", repr(self.request.arguments))

        # First pass: download files and check for the success
        if "archivePath" not in self.request.arguments:
            tmpdir = "/tmp/" + str(time.time()) + str(random.random())
            dataMgr = DataManager(vo=self.vo)
            lfnStr = self.get_argument("path")
            if not os.path.isdir(tmpdir):
                os.makedirs(tmpdir)
            os.chdir(tmpdir)
            for lfn in lfnStr.split(","):
                gLogger.always("Data manager get file %s" % lfn)
                last_slash = lfn.rfind("/")
                pos_relative = lfn.find("/")
                pos_relative = lfn.find("/", pos_relative + 1)
                pos_relative = lfn.find("/", pos_relative + 1)
                pos_relative = pos_relative
                pathInZip = lfn[pos_relative:last_slash]
                tmpPathInZip = tmpdir + pathInZip
                gLogger.always("path in zip %s" % tmpPathInZip)
                if not os.path.isdir(tmpPathInZip):
                    os.makedirs(tmpPathInZip)
                result = dataMgr.getFile(str(lfn), destinationDir=str(tmpPathInZip))
                if not result["OK"]:
                    gLogger.error("Error getting while getting files", result["Message"])
                    self.finish({"success": "false", "error": result["Message"], "lfn": lfn})
                    shutil.rmtree(tmpdir)
                    return

            # make zip file
            zipname = tmpdir.split("/")[-1] + ".zip"
            archivePath = "/tmp/" + zipname
            zFile = zipfile.ZipFile(archivePath, "w")
            gLogger.always("zip file %s" % archivePath)
            gLogger.always("start walk in tmpdir %s" % tmpdir)
            for absolutePath, dirs, files in os.walk(tmpdir):
                gLogger.always("absolute path %s" % absolutePath)
                gLogger.always("files %s" % files)
                for filename in files:
                    # relative path form tmpdir current chdir
                    pos_relative = absolutePath.find("/")
                    pos_relative = absolutePath.find("/", pos_relative + 1)
                    pos_relative = absolutePath.find("/", pos_relative + 1)
                    pos_relative = absolutePath.find("/", pos_relative + 1)
                    pos_relative = pos_relative + 1
                    relativePath = absolutePath[pos_relative:]
                    gLogger.always("relativePath %s, file %s" % (relativePath, filename))
                    zFile.write(os.path.join(absolutePath, filename))
            zFile.close()
            shutil.rmtree(tmpdir)
            self.finish({"success": "true", "archivePath": archivePath})

        else:
            # Second pass: deliver the requested archive
            archivePath = self.get_argument("archivePath")
            # read zip file
            with open(archivePath, "rb") as archive:
                data = archive.read()
            # cleanup
            os.remove(archivePath)

            self.set_header("Content-type", "text/plain")
            self.set_header("Content-Length", len(data))
            self.set_header("Content-Disposition", 'attachment; filename="' + os.path.basename(archivePath))

            self.finish(data)

    @asyncGen
    def web_getMetadataFields(self):
        """Method to read all the available fields possible for defining a query"""
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
        """Method to read all the available options for a metadata field"""
        try:
            compat = {}
            for key in self.request.arguments:
                parts = key.split(".")
                if len(parts) != 3:
                    continue
                _, name, sign = parts

                if not name:
                    continue

                value = self.get_argument(key).split("|")

                # check existence of the 'name' section
                if name not in compat:
                    compat[name] = {}

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
            path = self.get_argument("path")

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
        result = yield self.threadTask(
            self.fc.findFilesByMetadataWeb, req["selection"], req["path"], self.S_NUMBER, self.L_NUMBER
        )
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
                meta = "; ".join(["%s: %s" % (i, j) for (i, j) in m.items()])

            dirnameList = key.split("/")
            dirname = "/".join(dirnameList[: len(dirnameList) - 1])
            filename = dirnameList[len(dirnameList) - 1 :]

            callback.append(
                {
                    "fullfilename": key,
                    "dirname": dirname,
                    "filename": filename,
                    "date": date,
                    "size": size,
                    "metadata": meta,
                }
            )
        timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
        self.finish({"success": "true", "result": callback, "total": total, "date": timestamp})

    def __request(self):
        req = {"selection": {}, "path": "/"}

        self.L_NUMBER = 25
        if "limit" in self.request.arguments and len(self.get_argument("limit")) > 0:
            self.L_NUMBER = int(self.get_argument("limit"))

        self.S_NUMBER = 0
        if "start" in self.request.arguments and len(self.get_argument("start")) > 0:
            self.S_NUMBER = int(self.get_argument("start"))

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
            tmp = param.split(".")
            if len(tmp) != 3:
                continue
            _, name, logic = tmp
            value = self.get_argument(param).split("|")
            if logic not in ["in", "nin", "=", "!=", ">=", "<=", ">", "<"]:
                gLogger.always("Operand '%s' is not supported " % logic)
                continue

            if name in meta:
                # check existence of the 'name' section
                if name not in req["selection"]:
                    req["selection"][name] = {}

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
            req["path"] = self.get_argument("path")
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

        selectionElems = self.get_argument("selection").split("<|>")

        gLogger.always("request: THISSSS %s " % self.get_argument("selection"))

        for param in selectionElems:

            tmp = str(param).split("|")

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
            req["path"] = self.get_argument("path")
        gLogger.always("REQ: ", req)
        return req

    @asyncGen
    def web_getMetadataFilesInFile(self):
        self.set_header("Content-type", "text/plain")
        self.set_header("Content-Disposition", 'attachment; filename="error.txt"')
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

        self.set_header("Content-type", "text/plain")
        self.set_header("Content-Disposition", 'attachment; filename="%s.txt"' % md5(str(req).encode()).hexdigest())
        self.set_header("Content-Length", len(strData))
        self.finish(strData)

    @asyncGen
    def web_getSubnodeFiles(self):
        path = self.get_argument("path")

        result = yield self.threadTask(self.fc.listDirectory, path, False)
        if not result["OK"]:
            gLogger.error("submit: %s" % result["Message"])
            self.finish({"success": "false", "error": result["Message"]})
            return
        filesData = result["Value"]["Successful"][path]["Files"]
        dirData = result["Value"]["Successful"][path]["SubDirs"]

        retData = []

        for entryName in dirData:
            nodeDef = {"text": entryName.split("/")[-1]}
            nodeDef["leaf"] = False
            nodeDef["expanded"] = False
            retData.append(nodeDef)

        for entryName in filesData:
            nodeDef = {"text": entryName.split("/")[-1]}
            nodeDef["leaf"] = True
            retData.append(nodeDef)

        retData = sorted(retData, key=lambda node: node["text"].upper())

        self.finish({"success": "true", "nodes": retData})
