from __future__ import print_function
from __future__ import division
from __future__ import absolute_import

import base64
import zlib
import json
import six

from DIRAC.Core.Utilities import DEncode
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, asyncGen


class UPHandler(WebHandler):

    AUTH_PROPS = "authenticated"
    __tc = ThreadConfig()

    def prepare(self):
        if not self.isRegisteredUser():
            raise WErr(401, "Not a registered user")
        self.set_header("Pragma", "no-cache")
        self.set_header("Cache-Control", "max-age=0, no-store, no-cache, must-revalidate")
        # Do not use the defined user setup. Use the web one to show the same profile independently of
        # user setup
        self.__tc.setSetup(False)

    def __getUP(self):
        obj = self.get_argument("obj")
        app = self.get_argument("app")
        return UserProfileClient("Web/%s/%s" % (obj, app))

    @asyncGen
    def web_saveAppState(self):
        up = self.__getUP()
        name = self.get_argument("name")
        state = self.get_argument("state")
        data = base64.b64encode(zlib.compress(DEncode.encode(state), 9))
        # before we save the state (modify the state) we have to remember the actual access: ReadAccess and PublishAccess
        result = yield self.threadTask(up.getVarPermissions, name)
        if result["OK"]:
            access = result["Value"]
        else:
            access = {
                "ReadAccess": "USER",
                "PublishAccess": "USER",
            }  # this is when the application/desktop does not exists.
        result = yield self.threadTask(up.storeVar, name, data)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        # change the access to the application/desktop
        result = yield self.threadTask(up.setVarPermissions, name, access)
        if not result["OK"]:
            raise WErr.fromSERROR(result)

        self.set_status(200)
        self.finish()

    @asyncGen
    def web_makePublicAppState(self):
        up = self.__getUP()
        name = self.get_argument("name")
        access = self.get_argument("access", "ALL").upper()
        if access not in ("ALL", "VO", "GROUP", "USER"):
            raise WErr(400, "Invalid access")

        revokeAccess = {"ReadAccess": access}
        if access == "USER":  # if we make private a state,
            # we have to revoke from the public as well
            revokeAccess["PublishAccess"] = "USER"

        # TODO: Check access is in either 'ALL', 'VO' or 'GROUP'
        result = yield self.threadTask(up.setVarPermissions, name, revokeAccess)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        self.set_status(200)
        self.finish()

    @asyncGen
    def web_loadAppState(self):
        up = self.__getUP()
        name = self.get_argument("name")
        result = yield self.threadTask(up.retrieveVar, name)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        data = result["Value"]
        data, count = DEncode.decode(zlib.decompress(base64.b64decode(data)))
        self.finish(data)

    @asyncGen
    def web_loadUserAppState(self):
        up = self.__getUP()
        user = self.get_argument("user")
        group = self.get_argument("group")
        name = self.get_argument("name")
        result = yield self.threadTask(up.retrieveVarFromUser, user, group, name)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        data = result["Value"]
        data, count = DEncode.decode(zlib.decompress(base64.b64decode(data)))
        self.finish(data)

    @asyncGen
    def web_listAppState(self):
        up = self.__getUP()
        result = yield self.threadTask(up.retrieveAllVars)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        data = result["Value"]
        for k in data:
            # Unpack data
            data[k] = json.loads(DEncode.decode(zlib.decompress(base64.b64decode(data[k])))[0])
        self.finish(data)

    @asyncGen
    def web_delAppState(self):
        up = self.__getUP()
        name = self.get_argument("name")
        result = yield self.threadTask(up.deleteVar, name)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        self.finish()

    @asyncGen
    def web_listPublicDesktopStates(self):
        up = self.__getUP()
        result = yield self.threadTask(up.listAvailableVars)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        data = result["Value"]
        paramNames = ["UserName", "Group", "VO", "desktop"]

        records = [dict(zip(paramNames, i)) for i in data]
        sharedDesktops = {}
        for i in records:
            result = yield self.threadTask(up.getVarPermissions, i["desktop"])
            if not result["OK"]:
                raise WErr.fromSERROR(result)
            if result["Value"]["ReadAccess"] == "ALL":
                print(i["UserName"], i["Group"], i)
                result = yield self.threadTask(up.retrieveVarFromUser, i["UserName"], i["Group"], i["desktop"])
                if not result["OK"]:
                    raise WErr.fromSERROR(result)
                if i["UserName"] not in sharedDesktops:
                    sharedDesktops[i["UserName"]] = {}
                sharedDesktops[i["UserName"]][i["desktop"]] = json.loads(
                    DEncode.decode(zlib.decompress(base64.b64decode(result["Value"])))[0]
                )
                sharedDesktops[i["UserName"]]["Metadata"] = i
        self.finish(sharedDesktops)

    @asyncGen
    def web_makePublicDesktopState(self):
        up = UserProfileClient("Web/application/desktop")
        name = self.get_argument("name")
        access = self.get_argument("access", "ALL").upper()
        if access not in ("ALL", "VO", "GROUP", "USER"):
            raise WErr(400, "Invalid access")
        # TODO: Check access is in either 'ALL', 'VO' or 'GROUP'
        result = yield self.threadTask(up.setVarPermissions, name, {"ReadAccess": access})
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        self.set_status(200)
        self.finish()

    @asyncGen
    def web_changeView(self):
        up = self.__getUP()
        desktopName = self.get_argument("desktop")
        view = self.get_argument("view")
        result = yield self.threadTask(up.retrieveVar, desktopName)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        data = result["Value"]
        oDesktop = json.loads(DEncode.decode(zlib.decompress(base64.b64decode(data)))[0])
        oDesktop[six.text_type("view")] = six.text_type(view)
        oDesktop = json.dumps(oDesktop)
        data = base64.b64encode(zlib.compress(DEncode.encode(oDesktop), 9))
        result = yield self.threadTask(up.storeVar, desktopName, data)
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        self.set_status(200)
        self.finish()

    @asyncGen
    def web_listPublicStates(self):

        user = self.getUserName()

        up = self.__getUP()
        retVal = yield self.threadTask(up.listStatesForWeb, {"PublishAccess": "ALL"})
        if not retVal["OK"]:
            raise WErr.fromSERROR(retVal)
        records = retVal["Value"]
        if not records:
            raise WErr(404, "There are no public states!")

        mydesktops = {"name": "My Desktops", "group": "", "vo": "", "user": "", "iconCls": "my-desktop", "children": []}
        shareddesktops = {
            "name": "Shared Desktops",
            "group": "",
            "vo": "",
            "user": "",
            "expanded": "true",
            "iconCls": "shared-desktop",
            "children": [],
        }

        myapplications = {"name": "My Applications", "group": "", "vo": "", "user": "", "children": []}
        sharedapplications = {
            "name": "Shared Applications",
            "group": "",
            "vo": "",
            "user": "",
            "expanded": "true",
            "iconCls": "shared-desktop",
            "children": [],
        }

        desktopsApplications = {
            "text": ".",
            "children": [
                {"name": "Desktops", "group": "", "vo": "", "user": "", "children": [mydesktops, shareddesktops]},
                {
                    "name": "Applications",
                    "group": "",
                    "vo": "",
                    "user": "",
                    "children": [myapplications, sharedapplications],
                },
            ],
        }
        for record in records:
            permissions = record["permissions"]
            if permissions["PublishAccess"] == "ALL":
                if record["app"] == "desktop":
                    record["type"] = "desktop"
                    record["leaf"] = "true"
                    record["iconCls"] = ("core-desktop-icon",)
                    if record["user"] == user:
                        mydesktops["children"].append(record)
                    else:
                        shareddesktops["children"].append(record)
                else:
                    record["type"] = "application"
                    record["leaf"] = "true"
                    record["iconCls"] = "core-application-icon"
                    if record["user"] == user:
                        myapplications["children"].append(record)
                    else:
                        sharedapplications["children"].append(record)

        self.finish(desktopsApplications)

    @asyncGen
    def web_publishAppState(self):
        up = self.__getUP()
        name = self.get_argument("name")
        access = self.get_argument("access", "ALL").upper()
        if access not in ("ALL", "VO", "GROUP", "USER"):
            raise WErr(400, "Invalid access")

        result = yield self.threadTask(up.setVarPermissions, name, {"PublishAccess": access, "ReadAccess": access})
        if not result["OK"]:
            raise WErr.fromSERROR(result)
        self.set_status(200)
        self.finish()
