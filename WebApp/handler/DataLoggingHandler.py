from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient

class DataLoggingHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getData(self):
    sData = self.getSessionData()
    result = {}
    user = sData["user"]["username"]
    if user == "Anonymous":
      result["prod"] = [["Insufficient rights"]]
    else:
      if "lfn" in self.request.arguments:
        lfn = str(self.request.arguments[ 'lfn' ][-1])
        RPC = RPCClient("DataManagement/DataLogging")
        retVal = RPC.getFileLoggingInfo(lfn)
        if retVal["OK"]:
          data = []
          for i in retVal['Value']:
            data.append({"Status":i[0],"MinorStatus":i[1],"StatusTime":i[2],"Source":i[3]})
          result = {"success":"true","result":data}
        else:
          result = {"success":"false","error":result["Message"]}
    self.finish(result)

  ################################################################################
