import json

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getAllUsers
from DIRAC.FrameworkSystem.Client.TokenManagerClient import TokenManagerClient

from WebAppDIRAC.Lib.WebHandler import _WebHandler as WebHandler


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
        gLogger.info("*!*!*!  RESULT: \n%s" % result)
        if not result["OK"]:
            return {"success": "false", "error": result["Message"]}

        tokens = []
        for record in result["Value"]:
            tokens.append(
                {
                    "tokenid": record["user_id"],
                    "UserName": record["username"],
                    "UserID": record["user_id"],
                    "Provider": record["provider"],
                    "ExpirationTime": str(record["rt_expires_at"]),
                }
            )
        timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
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
