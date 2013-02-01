
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
import json

class JobMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  def index(self):
    pass
  
  def web_standalone(self):
     self.render("JobMonitor/standalone.tpl", config_data = json.dumps(SessionData().getData()))
  
  def web_getJobData(self):
#    result = {"root":[{'JobID':1, 'Status':'done', 'Site':'LCG', 'LastUpdateTime':'12.12.2012 12:12'},
#              {'JobID':2, 'Status':'failed', 'Site':'LCG', 'LastUpdateTime':'12.12.2012 12:12'}]}
    RPC = RPCClient("WorkloadManagement/JobMonitoring")
    
    result = RPC.getJobPageSummaryWeb({}, [["JobID", "DESC"]], 0, 25)
   
    if result["OK"]:
      result = result["Value"]
#      gLogger.info("ReS",result)
      if result.has_key("TotalRecords"):
        if result["TotalRecords"] > 0:
          if result.has_key("ParameterNames") and result.has_key("Records"):
            if len(result["ParameterNames"]) > 0:
              if len(result["Records"]) > 0:
                callback = []
                jobs = result["Records"]
                head = result["ParameterNames"]
                headLength = len(head)
                for i in jobs:
                  tmp = {}
                  for j in range(0, headLength):
                    tmp[head[j]] = i[j]
                  callback.append(tmp)
                total = result["TotalRecords"]
#                timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
                if result.has_key("Extras"):
                  st = self.__dict2string({})
                  extra = result["Extras"]
                  callback = {"success":"true", "result":callback, "total":total, "extra":extra, "request":st, "date":None}
                else:
                  callback = {"success":"true", "result":callback, "total":total, "date":None}
              else:
                callback = {"success":"false", "result":"", "error":"There are no data to display"}
            else:
              callback = {"success":"false", "result":"", "error":"ParameterNames field is missing"}
          else:
            callback = {"success":"false", "result":"", "error":"Data structure is corrupted"}
        else:
          callback = {"success":"false", "result":"", "error":"There were no data matching your selection"}
      else:
        callback = {"success":"false", "result":"", "error":"Data structure is corrupted"}
    else:
      callback = {"success":"false", "error":result["Message"]}
    
    self.write(json.dumps(callback))

  def __dict2string(self, req):
    result = ""
    try:
      for key, value in req.iteritems():
        result = result + str(key) + ": " + ", ".join(value) + "; "
    except Exception, x:
      pass
#      gLogger.info("\033[0;31m Exception: \033[0m %s" % x)
    result = result.strip()
    result = result[:-1]
    return result

  def web_getSelectionData(self):
    sData = SessionData().getData() 
    callback = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]
    '''
    if len(self.request.arguments) > 0:
      tmp = {}
      for i in self.request.arguments:
        tmp[i] = str(self.request.arguments[i])
      callback["extra"] = tmp
      if callback["extra"].has_key("prod"):
        callback["extra"]["prod"] = callback["extra"]["prod"].zfill(8)
        if callback["extra"]["prod"] == "00000000":
          callback["extra"]["prod"] = ""
    '''
    if user == "Anonymous":
      callback["prod"] = [["Insufficient rights"]]
    else:
      #RPC = getRPCClient("WorkloadManagement/JobMonitoring")
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = RPC.getProductionIds()
      if result["OK"]:
        prod = []
        prods = result["Value"]
        if len(prods)>0:
          #prod.append([str("All")])
          tmp = []
          for keys in prods:
            try:
              id = str(int(keys)).zfill(8)
            except:
              id = str(keys)
            tmp.append(str(id))
          tmp.sort(reverse=True)
          for i in tmp:
            prod.append([str(i)])
        else:
          prod = [["Nothing to display"]]
      else:
        gLogger.error("RPC.getProductionIds() return error: %s" % result["Message"])
        prod = [["Error happened on service side"]]
      callback["prod"] = prod
###
    #RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    RPC = RPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getSites()
    if result["OK"]:
      #tier1 = gConfig.getValue("/Website/PreferredSites",[]) # Always return a list
      site = []
      if len(result["Value"])>0:
        s = list(result["Value"])
        #site.append([str("All")])
        for i in s:
          site.append([str(i)])    
      else:
        site = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getSites() return error: %s" % result["Message"])
      site = [["Error happened on service side"]]
    callback["site"] = site
###
    result = RPC.getStates()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        #stat.append([str("All")])
        for i in result["Value"]:
          stat.append([str(i)])
      else:
        stat = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getStates() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
    callback["status"] = stat
###
    result = RPC.getMinorStates()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        #stat.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          stat.append([i])
      else:
        stat = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getMinorStates() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
    callback["minorstat"] = stat
###
    result = RPC.getApplicationStates()
    if result["OK"]:
      app = []
      if len(result["Value"])>0:
        #app.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          app.append([i])
      else:
        app = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getApplicationstates() return error: %s" % result["Message"])
      app = [["Error happened on service side"]]
    callback["app"] = app
###
    result = RPC.getJobTypes()
    if result["OK"]:
      types = []
      if len(result["Value"])>0:
        #types.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          types.append([i])
      else:
        types = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getJobTypes() return error: %s" % result["Message"])
      types = [["Error happened on service side"]]
    callback["types"] = types
###
    #groupProperty = credentials.getProperties(group)
    if user == "Anonymous":
      callback["owner"] = [["Insufficient rights"]]
    else:
      result = RPC.getOwners()
      if result["OK"]:
        owner = []
        if len(result["Value"])>0:
          #owner.append([str("All")])
          for i in result["Value"]:
            owner.append([str(i)])
        else:
          owner = [["Nothing to display"]]
      else:
        gLogger.error("RPC.getOwners() return error: %s" % result["Message"])
        owner = [["Error happened on service side"]]
      callback["owner"] = owner
    self.write(json.dumps(callback))