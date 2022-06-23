import os
import time
import random
import shutil
import zipfile
import datetime

from DIRAC import gLogger, S_ERROR, S_OK
from DIRAC.Resources.Catalog.FileCatalog import FileCatalog
from DIRAC.DataManagementSystem.Client.DataManager import DataManager
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getVOForGroup

from WebAppDIRAC.Lib.WebHandler import WebHandler, FileResponse


class FileCatalogHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    # Supported operands
    __operands = ["in", "nin", "=", "!=", ">=", "<=", ">", "<"]

    def initializeRequest(self):
        """Called at every request, may be overwritten in your handler."""
        self.user = self.getUserName()
        self.group = self.getUserGroup()
        self.vo = getVOForGroup(self.group)
        self.fc = FileCatalog(vo=self.vo)

    def web_getSelectedFiles(self, archivePath=None, lfnPath=None):
        """Method to get the selected file(s)

        :param str archivePath: archive path
        :param str lfnPath: path LFN

        :return: dict
        """
        if lfnPath is None:
            lfnPath = ""

        # First pass: download files and check for the success
        if not archivePath:
            tmpdir = "/tmp/" + str(time.time()) + str(random.random())
            dataMgr = DataManager(vo=self.vo)
            if not os.path.isdir(tmpdir):
                os.makedirs(tmpdir)
            os.chdir(tmpdir)
            for lfn in lfnPath.split(","):
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
                    shutil.rmtree(tmpdir)
                    return {"success": "false", "error": result["Message"], "lfn": lfn}

            # make zip file
            zipname = tmpdir.split("/")[-1] + ".zip"
            archivePath = "/tmp/" + zipname
            zFile = zipfile.ZipFile(archivePath, "w")
            gLogger.always("zip file", archivePath)
            gLogger.always("start walk in tmpdir", tmpdir)
            for absolutePath, dirs, files in os.walk(tmpdir):
                gLogger.always("absolute path", absolutePath)
                gLogger.always("files", files)
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
            return {"success": "true", "archivePath": archivePath}

        # Second pass: deliver the requested archive
        # read zip file
        with open(archivePath, "rb") as archive:
            data = archive.read()
        # cleanup
        os.remove(archivePath)
        return FileResponse(data, os.path.basename(archivePath))

    def web_getMetadataFields(self):
        """Method to read all the available fields possible for defining a query

        :return: dict
        """
        callback = {}
        result = self.__getMetadataFields()
        if not result["OK"]:
            gLogger.error(result["Message"])
            return {"success": "false", "error": result["Message"]}
        filemeta, dirmeta = result["Value"]
        for key in filemeta:
            callback[key] = "label"
        gLogger.debug("getSelectorGrid: FileMetaFields callback %s" % callback)
        for key, value in dirmeta.items():
            callback[key] = value.lower()
        gLogger.debug("getSelectorGrid: Resulting callback %s" % callback)
        return {"success": "true", "result": callback}

    def web_getQueryData(self, lfnPath=None, **kwargs):
        """Method to read all the available options for a metadata field

        :param str lfnPath: path LFN

        :return: dict
        """
        if lfnPath is None:
            lfnPath = "/"

        try:
            compat = {}
            for key in kwargs:
                parts = key.split(".")
                if len(parts) != 3:
                    continue
                _, name, sign = parts

                if not name:
                    continue

                value = kwargs[key].split("|")

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

        except Exception as e:
            return {"success": "false", "error": f"Metadata query error: {e!r}"}

        gLogger.always(compat)

        result = self.fc.getCompatibleMetadata(compat, lfnPath)
        gLogger.always(result)

        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}
        return {"success": "true", "result": result["Value"]}

    def web_getFilesData(self, limit=25, start=0, lfnPath=None, **kwargs):
        """Get files data

        :param int limit: limit
        :param int start: start
        :param str lfnPath: path

        :return: dict
        """
        req = {"selection": {}, "path": "/"}

        result = self.__getMetadataFields()
        if not result["OK"]:
            gLogger.error("request:", result["Message"])
        else:
            filemeta, dirmeta = result["Value"]
            meta = [k for k in dirmeta]
            gLogger.always("request: metafields:", meta)

            for param in kwargs:
                tmp = param.split(".")
                if len(tmp) != 3:
                    continue
                _, name, logic = tmp
                value = kwargs[param].split("|")
                if logic not in self.__operands:
                    gLogger.always(f"Operand '{logic}' is not supported")
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
            if lfnPath:
                req["path"] = lfnPath

        gLogger.debug("submit: incoming request %s" % req)
        result = self.fc.findFilesByMetadataWeb(req["selection"], req["path"], start, limit)
        gLogger.debug("submit: result of findFilesByMetadataDetailed", result)
        if not result["OK"]:
            gLogger.error("submit:", result["Message"])
            return {"success": "false", "error": result["Message"]}
        result = result["Value"]

        if not len(result) > 0:
            return {"success": "true", "result": [], "total": 0, "date": "-"}

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
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
        return {"success": "true", "result": callback, "total": total, "date": timestamp}

    def web_getMetadataFilesInFile(self, selection="", lfnPath=None):
        """Get metadata files

        :param str selection: selection
        :param str lfnPath: path

        :return: dict
        """
        req = {"selection": {}, "path": "/"}
        result = self.__getMetadataFields()
        if not result["OK"]:
            gLogger.error("request:", result["Message"])
        else:
            filemeta, dirmeta = result["Value"]
            meta = [k for k in dirmeta]
            gLogger.always("request: metafields: ", meta)

            selectionElems = selection.split("<|>")

            gLogger.debug("request: THISSSS", selection)

            for param in selectionElems:
                tmp = str(param).split("|")

                if len(tmp) != 4:
                    continue

                name = tmp[0]
                logic = tmp[1]

                if logic not in self.__operands:
                    gLogger.always(f"Operand '{logic}' is not supported")
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
            if lfnPath:
                req["path"] = lfnPath

        gLogger.debug("submit: incoming request", req)
        result = self.fc.findFilesByMetadata(req["selection"], req["path"])
        if not result["OK"]:
            gLogger.error("submit: %s" % result["Message"])
            return {"success": "false", "error": result["Message"]}

        return FileResponse("\n".join([fileName for fileName in result["Value"]]), str(req))

    def web_getSubnodeFiles(self, lfnPath):
        """Get subnode files

        :param str lfnPath: path

        :return: dict
        """
        result = self.fc.listDirectory(lfnPath, False)
        if not result["OK"]:
            gLogger.error("submit:", result["Message"])
            return {"success": "false", "error": result["Message"]}

        filesData = result["Value"]["Successful"][lfnPath]["Files"]
        dirData = result["Value"]["Successful"][lfnPath]["SubDirs"]

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
        return {"success": "true", "nodes": retData}

    def __getMetadataFields(self):
        """Helper method to get metadata fields

        :return: S_OK(tuple)/S_ERROR()
        """
        result = self.fc.getMetadataFields()
        if not result["OK"]:
            return result
        if "FileMetaFields" not in result["Value"]:
            return S_ERROR("Service response has no FileMetaFields key. Return empty dict")
        if "DirectoryMetaFields" not in result["Value"]:
            return S_ERROR("Service response has no DirectoryMetaFields key. Return empty dict")
        return S_OK((result["Value"]["FileMetaFields"], result["Value"]["DirectoryMetaFields"]))
