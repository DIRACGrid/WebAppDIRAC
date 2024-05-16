import json
import datetime
import jwt

from DIRAC import gLogger
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getAllUsers
from DIRAC.FrameworkSystem.Client.TokenManagerClient import TokenManagerClient

from WebAppDIRAC.Lib.WebHandler import WebHandler


class TokenManagerHandler(WebHandler):
    DEFAULT_AUTHORIZATION = "authenticated"

    @classmethod
    def initializeHandler(cls, serviceInfo):
        """Init"""
        cls.tm = TokenManagerClient()

    def web_getSelectionData(self, **kwargs):
        user = self.getUserName()
        if user.lower() == "anonymous":
            return {"success": "false", "error": "You are not authorize to access these data"}

        users = getAllUsers()
        users.sort()
        return {"username": [[x] for x in users]}

    def web_getTokenManagerData(self, username="[]", **kwargs):
        """Get tokens information

        :param str username: user name

        :return: dict
        """
        user = self.getUserName()
        if user.lower() == "anonymous":
            return {"success": "false", "error": "You are not authorize to access these data"}

        result = self.tm.getUsersTokensInfo(list(json.loads(username)))
        gLogger.info(f"*!*!*!  RESULT: \n{result}")
        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}

        tokens = []
        for record in result["Value"]:
            tokens.append(
                {
                    "TokenId": record["user_id"],
                    "UserName": record["username"],
                    "UserID": record["user_id"],
                    "Provider": record["provider"],
                    "ExpirationTime": str(
                        datetime.datetime.fromtimestamp(int(record["expires_at"])).strftime("%Y-%m-%d %H:%M:%S")
                    ),
                    "RefreshTokenExpirationTime": str(
                        datetime.datetime.fromtimestamp(int(record["rt_expires_at"])).strftime("%Y-%m-%d %H:%M:%S")
                    ),
                }
            )
        timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
        return {"success": "true", "result": tokens, "total": len(tokens), "date": timestamp}

    def web_deleteTokens(self, idList):
        """Delete token

        :param str idList: IDs

        :return: dict
        """
        err = []

        try:
            webIds = list(json.loads(idList))
        except Exception:
            return {"success": "false", "error": "No valid id's specified"}

        tokens = []
        for uid in webIds:
            retVal = self.tm.deleteToken(uid)
            if retVal["OK"]:
                tokens.append(uid)
            else:
                err.append(retVal["Message"])
        return {"success": "true", "result": tokens} if tokens else {"success": "false", "error": "; ".join(err)}

    def web_tokenData(self, userid: str, data_kind: str) -> dict:
        """Retrieve access and refresh token, and scope to show in right click Menu

        :param str userid: user's token id
        :param str data_kind: access/refresh token or scope

        :return: dict
        """
        if (result := self.tm.getTokensByUserID(userid))["OK"]:
            res = ""
            if data_kind == "getAccessToken":
                res = (
                    str(jwt.decode(result["Value"][0]["access_token"], options={"verify_signature": False}))
                    .replace("{", "{\n")
                    .replace(", ", ",\n")
                    .replace("}", "\n}")
                )
            elif data_kind == "getRefreshToken":
                res = (
                    str(jwt.decode(result["Value"][0]["refresh_token"], options={"verify_signature": False}))
                    .replace("{", "{\n")
                    .replace(", ", ",\n")
                    .replace("}", "\n}")
                )
            elif data_kind == "getScope":
                res = result["Value"][0]["scope"]
            return {"success": "true", "result": res}
        return {"success": "false", "error": result["Message"]}
