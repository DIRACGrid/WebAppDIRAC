from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen

class PilotSummaryHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getSelectionData(self):
    sData = self.getSessionData()
    callback = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]
    if user == "Anonymous":
      self.finish({"success":"false", "result":[], "total":0, "error":"Insufficient rights"})
    else:
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getSites)
      if result["OK"]:
        tier1 = gConfig.getValue("/Website/PreferredSites")
        if tier1:
          try:
            tier1 = tier1.split(", ")
          except:
            tier1 = list()
        else:
          tier1 = list()
        site = []
        if len(result["Value"])>0:
          s = list(result["Value"])
          for i in tier1:
            site.append([str(i)])
          for i in s:
            if i not in tier1:
              site.append([str(i)])
        else:
          site = [["Nothing to display"]]
        
      else:
        site = [["Error during RPC call"]]
       
      callback["site"] = site
      callback['Status'] = [['Good'],['Bad'],['Idle'],['Poor'],['Fair']]
       
      self.finish(callback)