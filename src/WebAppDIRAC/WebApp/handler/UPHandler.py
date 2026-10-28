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
        decoded = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        # Legacy data encoded with DEncode - validate depth before decoding
        _checkDEncodeDepth(raw)
        decoded = DEncode.decode(raw)[0]
        if not isinstance(decoded, (dict, list, str, int, float, bool, type(None))):
            raise ValueError("Stored data contains unsupported types after DEncode decode")

    # Older encodings can wrap the actual JSON document in an extra string
    # layer: legacy data is stored as a DEncode-encoded JSON text, and data
    # saved between v6.0.7 and v6.0.8 was double-encoded (json.dumps() was
    # applied to an already serialized JSON text). Unwrap these string
    # layers, mirroring the historic json.loads(DEncode.decode(...)[0])
    # behavior, until a real structure or a plain non-JSON string is reached.
    while isinstance(decoded, str):
        try:
            decoded = json.loads(decoded)
        except (json.JSONDecodeError, UnicodeDecodeError):
            break
    return decoded


def _checkDEncodeDepth(data):
    """Validate DEncode data depth to prevent DoS via deeply nested structures.

    Walks the DEncode stream token by token so that only real containers
    (d/l/t) contribute to the nesting depth. String payloads
    (``s<len>:payload``) are skipped, since their content is arbitrary bytes
    and must not be interpreted as structure: counting container-like
    characters inside payloads falsely triggers the depth and balance checks
    on perfectly valid legacy data.
    """
    depth = 0
    maxDepth = 0
    i = 0
    while i < len(data):
        byte = data[i]
        if byte in (ord("d"), ord("l"), ord("t")):
            depth += 1
            maxDepth = max(maxDepth, depth)
            if maxDepth > _MAX_DENCODE_DEPTH:
                raise ValueError(f"DEncode data exceeds maximum nesting depth ({_MAX_DENCODE_DEPTH})")
            i += 1
        elif byte == ord("e"):
            depth -= 1
            if depth < 0:
                raise ValueError("DEncode data has unbalanced nesting")
            i += 1
        elif byte in (ord("s"), ord("u")):
            # String: s/u <length> ':' <payload>. Skip the payload bytes.
            i += 1
            digitsStart = i
            while i < len(data) and ord("0") <= data[i] <= ord("9"):
                i += 1
            if i == digitsStart or i >= len(data) or data[i] != ord(":"):
                raise ValueError("Malformed DEncode string")
            i += 1 + int(data[digitsStart:i])
            if i > len(data):
                raise ValueError("Malformed DEncode string")
        elif byte in (ord("i"), ord("I"), ord("f")):
            # Numeric values terminated by 'e'. Floats may contain an
            # exponent "e+/-..." which is not the terminator (see DEncode.decodeFloat)
            end = data.find(b"e", i + 1)
            if end < 0:
                raise ValueError("Malformed DEncode number")
            if byte == ord("f") and end + 1 < len(data) and data[end + 1] in (ord("+"), ord("-")):
                end = data.find(b"e", end + 1)
                if end < 0:
                    raise ValueError("Malformed DEncode number")
            i = end + 1
        elif byte == ord("b"):
            # Boolean: b0 or b1, no terminator
            i += 2
        elif byte == ord("n"):
            # None, no terminator
            i += 1
        elif byte == ord("z"):
            # Datetime: 'z' followed by 'a'/'d'/'t' and the encoded tuple
            if i + 1 >= len(data) or data[i + 1] not in (ord("a"), ord("d"), ord("t")):
                raise ValueError("Malformed DEncode datetime")
            i += 2
        else:
            raise ValueError("Malformed DEncode data")
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
        # The client sends the state as an already serialized JSON text
        # (Ext.JSON.encode on the browser side). Store it as is; calling
        # json.dumps() on it would double-encode it.
        raw = state if isinstance(state, str) else json.dumps(state)
        data = base64.b64encode(zlib.compress(raw.encode(), 9))
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
        # Unpack data. Skip vars that cannot be decoded instead of failing
        # the whole listing because of a single corrupt or unreadable entry.
        decoded = {}
        for k in data:
            try:
                decoded[k] = _safeDecode(data[k])
            except Exception as e:
                gLogger.error(f"Failed to decode application state {k!r}: {e}")
        return decoded

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
