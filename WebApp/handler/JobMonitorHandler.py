
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig
import json
import ast

class JobMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"
     
  def index(self):
    pass
  
  def web_standalone(self):
     self.render("JobMonitor/standalone.tpl", config_data = json.dumps(SessionData().getData()))
  
  def web_getJobData(self):
    RPC = RPCClient("WorkloadManagement/JobMonitoring")
    req = self.__request()
    result = RPC.getJobPageSummaryWeb(req, self.globalSort , self.pageNumber, self.numberOfJobs)
    
    if result["OK"]:
      result = result["Value"]
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
    
  def __request(self):
    self.pageNumber = 0
    self.numberOfJobs = 25
    self.globalSort = [["JobID","DESC"]]
    sData = SessionData().getData() 
    req = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]
    
    if self.request.arguments.has_key("limit") and len(self.request.arguments["limit"][0]) > 0:
      self.numberOfJobs = int(self.request.arguments["limit"][0])
      if self.request.arguments.has_key("start") and len(self.request.arguments["start"][0]) > 0:
        self.pageNumber = int(self.request.arguments["start"][0])
      else:
        self.pageNumber = 0
    
    if self.request.arguments.has_key("ids") and len(self.request.arguments["ids"][0]) > 0:
      req["JobID"] = []
      reqIds = str(self.request.arguments["ids"][0]).split(',');
      for i in reqIds:
        testI = i.split('-')
        if len(testI) == 2:
          rangeID = range(int(testI[0].strip(' ')),int(testI[1].strip(' '))+1)
          req["JobID"].extend(rangeID)
        else:
          req["JobID"].append(i)
    #groupProperty = credentials.getProperties(group)
    result = gConfig.getOption("/Website/ListSeparator")
    if result["OK"]:
      separator = result["Value"]
    else:
      separator = ","
      
    if self.request.arguments.has_key("prod") and len(self.request.arguments["prod"][0]) > 0:
      if str(self.request.arguments["prod"][0]) != "":
        req["JobGroup"] = str(self.request.arguments["prod"][0]).split(separator)
        
    if self.request.arguments.has_key("site") and len(self.request.arguments["site"][0]) > 0:
      if str(self.request.arguments["site"][0]) != "":
        req["Site"] = [x.strip() for x in str(self.request.arguments["site"][0]).split(separator)]
        
    if self.request.arguments.has_key("status") and len(self.request.arguments["status"][0]) > 0:
      if str(self.request.arguments["status"][0]) != "":
        req["Status"] = str(self.request.arguments["status"][0]).split(separator)
        
    if self.request.arguments.has_key("minorstat") and len(self.request.arguments["minorstat"][0]) > 0:
      if str(self.request.arguments["minorstat"][0]) != "":
        req["MinorStatus"] = str(self.request.arguments["minorstat"][0]).split(separator)
        
    if self.request.arguments.has_key("app") and len(self.request.arguments["app"][0]) > 0:
      if str(self.request.arguments["app"][0]) != "":
        req["ApplicationStatus"] = str(self.request.arguments["app"][0]).split(separator)
        
    if self.request.arguments.has_key("types") and len(self.request.arguments["types"][0]) > 0:
      if str(self.request.arguments["types"][0]) != "":
        req["JobType"] = str(self.request.arguments["types"][0]).split(separator)

    if self.request.arguments.has_key("owner") and len(self.request.arguments["owner"][0]) > 0:
      if str(self.request.arguments["owner"][0]) != "":
        req["Owner"] = str(self.request.arguments["owner"][0]).split(separator)
        
    if self.request.arguments.has_key("startDate") and len(self.request.arguments["startDate"][0]) > 0:
      if str(self.request.arguments["startDate"][0]) != "YYYY-mm-dd":
        if self.request.arguments.has_key("startTime") and len(self.request.arguments["startTime"][0]) > 0:
          req["FromDate"] = str(self.request.arguments["startDate"][0] + " " + self.request.arguments["startTime"][0])
        else:
          req["FromDate"] = str(self.request.arguments["startDate"][0])
          
    if self.request.arguments.has_key("endDate") and len(self.request.arguments["endDate"][0]) > 0:
      if str(self.request.arguments["endDate"][0]) != "YYYY-mm-dd":
        if self.request.arguments.has_key("endTime") and len(self.request.arguments["endTime"][0]) > 0:
          req["ToDate"] = str(self.request.arguments["endDate"][0] + " " + self.request.arguments["endTime"][0])
        else:
          req["ToDate"] = str(self.request.arguments["endDate"][0])
          
    if self.request.arguments.has_key("date") and len(self.request.arguments["date"][0]) > 0:
      if str(self.request.arguments["date"][0]) != "YYYY-mm-dd":
        req["LastUpdate"] = str(self.request.arguments["date"][0])
        
    if self.request.arguments.has_key("sort") and len(self.request.arguments["sort"][0]) > 0:
      sortValue = self.request.arguments["sort"][0]
      #converting the string into a dictionary
      sortValue = ast.literal_eval(sortValue.strip("[]"))
      self.globalSort = [[sortValue["property"],sortValue["direction"]]]
    return req
  
  def web_jobAction( self ):
    ids = self.request.arguments["ids"][0].split(",")
    ids = [int(i) for i in ids ]
    
    RPC = RPCClient("WorkloadManagement/JobManager")
    if self.request.arguments["action"][0] == "delete":
      result = RPC.deleteJob(ids)
    elif self.request.arguments["action"][0] == "kill":
      result = RPC.killJob(ids)
    elif self.request.arguments["action"][0] == "reschedule":
      result = RPC.rescheduleJob(ids)
    elif self.request.arguments["action"][0] == "reset":
      result = RPC.resetJob(ids)
      
    callback = {}  
    if result["OK"]:
      callback = {"success":"true","result":""}
    else:
      if result.has_key("InvalidJobIDs"):
        callback = {"success":"false","error":"Invalid JobIDs: %s" % result["InvalidJobIDs"]}
      elif result.has_key("NonauthorizedJobIDs"):
        callback = {"success":"false","error":"You are nonauthorized to %s jobs with JobID: %s" % (self.request.arguments["action"][0],result["NonauthorizedJobIDs"])}
      else:
        callback = {"success":"false","error":result["Message"]}
    self.write(json.dumps(callback))