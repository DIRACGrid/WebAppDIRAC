import base64
import json
import zlib

from DIRAC import S_OK, gLogger
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.Core.Tornado.Server.private.BaseRequestHandler import authorization
from DIRAC.Core.Utilities import DEncode
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr


_MAX_DECODED_SIZE = 5 * 1024 * 1024  # 5 MB limit for decompressed data
_MAX_DENCODE_DEPTH = 50  # Prevent DoS via deeply nested DEncode structures


def _safeDecode(data):
    """Safely decode stored state data.

    Tries JSON first (secure, portable), falls back to DEncode only for
    backward compatibility with legacy stored data. DEncode is a custom
    binary format being phased out.

    Includes defense-in-depth limits:
    - Decompressed size limit to prevent zip bombs
    - Depth limit for DEncode structures to prevent stack overflow DoS
    - Type validation to prevent complex object injection
    """
    compressed = base64.b64decode(data)
    raw = zlib.decompress(compressed)
    if len(raw) > _MAX_DECODED_SIZE:
        raise ValueError(f"Decompressed data exceeds size limit ({_MAX_DECODED_SIZE} bytes)")

    try:
        return json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        # Legacy data encoded with DEncode - validate depth before decoding
        _checkDEncodeDepth(raw)
        decoded = DEncode.decode(raw)[0]
        if not isinstance(decoded, (dict, list, str, int, float, bool, type(None))):
            raise ValueError("Stored data contains unsupported types after DEncode decode")
        return decoded


def _checkDEncodeDepth(data):
    """Validate DEncode data depth to prevent DoS via deeply nested structures."""
    depth = 0
    maxDepth = 0
    for byte in data:
        if byte in (ord("d"), ord("l"), ord("t")):
            depth += 1
            maxDepth = max(maxDepth, depth)
        elif byte == ord("e"):
            depth -= 1
    if maxDepth > _MAX_DENCODE_DEPTH:
        raise ValueError(f"DEncode data exceeds maximum nesting depth ({_MAX_DENCODE_DEPTH})")
    if depth != 0:
        raise ValueError("DEncode data has unbalanced nesting")


class UPHandler(WebHandler):
    DEFAULT_AUTHORIZATION = "authenticated"
    __tc = ThreadConfig()

    def initializeRequest(self):
        self.set_header("Pragma", "no-cache")
        self.set_header("Cache-Control", "max-age=0, no-store, no-cache, must-revalidate")
        # Do not use the defined user setup. Use the web one to show the same profile independently of user setup
        self.__tc.setSetup(False)

    def web_saveAppState(self, obj, app, name, state):
        """Save App State

        :param str obj: object
        :param str app: application
        :param str name: name
        :param str state: state

        :return: dict
        """
        up = UserProfileClient(f"Web/{obj}/{app}")
        # Use JSON instead of DEncode for security and portability
        data = base64.b64encode(zlib.compress(json.dumps(state).encode(), 9))
        # before we save the state (modify the state) we have to remember the actual access: ReadAccess and PublishAccess
        result = up.getVarPermissions(name)
        access = {
            "ReadAccess": "USER",
            "PublishAccess": "USER",
        }  # this is when the application/desktop does not exists.
        if result["OK"]:
            access = result["Value"]

        result = up.storeVar(name, data)
        if result["OK"]:
            # change the access to the application/desktop
            result = up.setVarPermissions(name, access)
        return S_OK() if result["OK"] else result

    def web_makePublicAppState(self, obj, app, name, access="ALL"):
        """Make public application state

        :param str obj: object
        :param str app: application
        :param str name: name
        :param str access: access type

        :return: dict
        """
        up = UserProfileClient(f"Web/{obj}/{app}")
        access = access.upper()
        if access not in ("ALL", "VO", "GROUP", "USER"):
            raise WErr(400, "Invalid access")

        revokeAccess = {"ReadAccess": access}
        if access == "USER":  # if we make private a state,
            # we have to revoke from the public as well
            revokeAccess["PublishAccess"] = "USER"

        # TODO: Check access is in either 'ALL', 'VO' or 'GROUP'
        return up.setVarPermissions(name, revokeAccess)

    def web_loadAppState(self, obj, app, name):
        """Load application state

        :param str obj: object
        :param str app: application
        :param str name: name

        :return: dict
        """
        result = UserProfileClient(f"Web/{obj}/{app}").retrieveVar(name)
        if not result["OK"]:
            return result
        data = result["Value"]
        return _safeDecode(data)

    def web_loadUserAppState(self, obj, app, user, group, name):
        """Load user application state

        :param str obj: object
        :param str app: application
        :param str user: user name
        :param str group: group name
        :param str name: name

        :return: dict
        """
        up = UserProfileClient(f"Web/{obj}/{app}")
        result = up.retrieveVarFromUser(user, group, name)
        if not result["OK"]:
            return result
        data = result["Value"]
        return _safeDecode(data)

    @authorization(["all"])
    def web_listAppState(self, obj, app):
        """Get list application state

        :param str obj: object
        :param str app: application

        :return: dict
        """
        up = UserProfileClient(f"Web/{obj}/{app}")
        result = up.retrieveAllVars()
        if not result["OK"]:
            return result
        data = result["Value"]
        # Unpack data
        return {k: _safeDecode(data[k]) for k in data}

    def web_delAppState(self, obj, app, name):
        """Delete application state

        :param str obj: object
        :param str app: application
        :param str name: name

        :return: dict
        """
        return UserProfileClient(f"Web/{obj}/{app}").deleteVar(name)

    @authorization(["all"])
    def web_listPublicDesktopStates(self, obj, app):
        """Get list public desktop states

        :param str obj: object
        :param str app: application

        :return: dict
        """
        up = UserProfileClient(f"Web/{obj}/{app}")
        result = up.listAvailableVars()
        if not result["OK"]:
            return result
        data = result["Value"]
        paramNames = ["UserName", "Group", "VO", "desktop"]

        records = [dict(zip(paramNames, i)) for i in data]
        sharedDesktops = {}
        for i in records:
            result = up.getVarPermissions(i["desktop"])
            if not result["OK"]:
                return result
            if result["Value"]["ReadAccess"] == "ALL":
                gLogger.debug(f"Loading public desktop state for {i['UserName']} / {i['desktop']}")
                result = up.retrieveVarFromUser(i["UserName"], i["Group"], i["desktop"])
                if not result["OK"]:
                    return result
                if i["UserName"] not in sharedDesktops:
                    sharedDesktops[i["UserName"]] = {}
                sharedDesktops[i["UserName"]][i["desktop"]] = _safeDecode(result["Value"])
                sharedDesktops[i["UserName"]]["Metadata"] = i
        return sharedDesktops

    def web_makePublicDesktopState(self, obj, app, name, access="ALL"):
        """Make public desktop state

        :param str obj: object
        :param str app: application
        :param str name: name
        :param str access: access type

        :return: dict
        """
        up = UserProfileClient("Web/application/desktop")
        access = access.upper()
        if access not in ("ALL", "VO", "GROUP", "USER"):
            raise WErr(400, "Invalid access")
        # TODO: Check access is in either 'ALL', 'VO' or 'GROUP'
        return up.setVarPermissions(name, {"ReadAccess": access})

    def web_changeView(self, obj, app, desktop, view):
        """Change view

        :param str obj: object
        :param str app: application
        :param str desktop: desktop name
        :param str view: view

        :return: dict
        """
        up = UserProfileClient(f"Web/{obj}/{app}")
        result = up.retrieveVar(desktop)
        if not result["OK"]:
            return result
        data = result["Value"]
        oDesktop = _safeDecode(data)
        if not isinstance(oDesktop, dict):
            raise WErr(400, "Invalid desktop state format")
        oDesktop["view"] = str(view)
        # Use JSON for encoding instead of DEncode
        data = base64.b64encode(zlib.compress(json.dumps(oDesktop).encode(), 9))
        return up.storeVar(desktop, data)

    @authorization(["all"])
    def web_listPublicStates(self, obj, app):
        """Get list public state

        :param str obj: object
        :param str app: application

        :return: dict
        """
        user = self.getUserName()

        up = UserProfileClient(f"Web/{obj}/{app}")
        retVal = up.listStatesForWeb({"PublishAccess": "ALL"})
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

        return desktopsApplications

    def web_publishAppState(self, obj, app, name, access="ALL"):
        """Publish application state

        :param str obj: object
        :param str app: application
        :param str name: name
        :param str access: access type

        :return: dict
        """
        up = UserProfileClient(f"Web/{obj}/{app}")
        access = access.upper()
        if access not in ("ALL", "VO", "GROUP", "USER"):
            raise WErr(400, "Invalid access")

        return up.setVarPermissions(name, {"PublishAccess": access, "ReadAccess": access})
