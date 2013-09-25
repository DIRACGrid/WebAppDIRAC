
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
import json
import ast

class PilotMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  @asyncGen
  def web_getJobData(self):
    RPC = RPCClient("WorkloadManagement/WMSAdministrator")
    req = self.__request()
    result = yield self.threadTask(RPC.getPilotMonitorWeb, req, self.globalSort , self.pageNumber, self.numberOfJobs)
    
    if not result["OK"]:
      self.finish({"success":"false","result":[], "total":0, "error":result["Message"]})
      return
    
    result = result["Value"]
    
    if not result.has_key("TotalRecords"):
      self.finish({"success":"false", "result":[], "total":-1, "error":"Data structure is corrupted"})
      return
      
    
    if not (result["TotalRecords"] > 0):
      self.finish({"success":"false", "result":[], "total":0, "error":"There were no data matching your selection"})
      return
      
    
    if not (result.has_key("ParameterNames") and result.has_key("Records")):
      self.finish({"success":"false", "result":[], "total":-1, "error":"Data structure is corrupted"})
      return
    
    if not (len(result["ParameterNames"]) > 0):
      self.finish({"success":"false", "result":[], "total":-1, "error":"ParameterNames field is missing"})
      return
    
    if not (len(result["Records"]) > 0):
      self.finish({"success":"false", "result":[], "total":0, "Message":"There are no data to display"})
      return

    callback = []
    jobs = result["Records"]
    head = result["ParameterNames"]
    headLength = len(head)
    
    for i in jobs:
      tmp = {}
      for j in range(0,headLength):
        if j == 12:
          if i[j] == 0:
            i[j] = "-"
        tmp[head[j]] = i[j]
      callback.append(tmp)
    total = result["TotalRecords"]
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    if result.has_key("Extras"):
      extra = result["Extras"]
      callback = {"success":"true", "result":callback, "total":total, "extra":extra, "date":timestamp } 
    else:
      callback = {"success":"true", "result":callback, "total":total, "date":timestamp}
             
    self.finish(callback)

  @asyncGen
  def web_getSelectionData(self):
    
    sData = self.getSessionData()
    group = sData["user"]["group"]
    user = sData["user"]["username"]  
    callback = {}
      
    if len(self.request.arguments) > 0:
      tmp = {}
      for i in self.request.arguments:
        tmp[i] = str(self.request.arguments[i][0]).replace('"','')
      callback["extra"] = tmp
      
    RPC = RPCClient("WorkloadManagement/WMSAdministrator")
    result = yield self.threadTask(RPC.getPilotMonitorSelectors)
    
    if result["OK"]:
      result = result["Value"]
      
      if result.has_key("Status") and len(result["Status"]) > 0:
        status = []
        for i in result["Status"]:
          status.append([str(i)])
      else:
        status = [["Nothing to display"]]
      callback["status"] = status
      
      if result.has_key("GridType") and len(result["GridType"]) > 0:
        gridtype = []
        for i in result["GridType"]:
          gridtype.append([str(i)])
      else:
        gridtype = [["Nothing to display"]]
      callback["gridtype"] = gridtype
      
      if result.has_key("OwnerGroup") and len(result["OwnerGroup"]) > 0:
        ownerGroup = []
        for i in result["OwnerGroup"]:
          ownerGroup.append([str(i)])
      else:
        ownerGroup = [["Nothing to display"]]
      callback["ownerGroup"] = ownerGroup
      
      if result.has_key("DestinationSite") and len(result["DestinationSite"]) > 0:
        ce = []
        for i in result["DestinationSite"]:
          ce.append([str(i)])
      else:
        ce = [["Nothing to display"]]
      callback["computingElement"] = ce
      
      if result.has_key("GridSite") and len(result["GridSite"]) > 0:
        tier1 = gConfig.getValue("/Website/PreferredSites",[])
        site = []
        s = list(result["GridSite"])
        for i in tier1:
          site.append([str(i)])
        for i in s:
          if i not in tier1:
            site.append([str(i)])
      else:
        site = [["Error during RPC call"]]
      callback["site"] = site
      if result.has_key("Broker") and len(result["Broker"]) > 0:
        broker = []
        for i in result["Broker"]:
          broker.append([str(i)])
      else:
        broker = [["Nothing to display"]]
      callback["broker"] = broker
      if result.has_key("Owner") and len(result["Owner"]) > 0:
        owner = []
        for i in result["Owner"]:
          owner.append([str(i)])
      else:
        owner = [["Nothing to display"]]
      callback["owner"] = owner
    
    self.finish(callback)
    
  def __request(self):
    self.pageNumber = 0
    self.numberOfJobs = 25
    self.globalSort = [["SubmissionTime","DESC"]]
    
    req = {}
    
    if self.request.arguments.has_key("limit") and len(self.request.arguments["limit"][0]) > 0:
      self.numberOfJobs = int(self.request.arguments["limit"][0])
      if self.request.arguments.has_key("start") and len(self.request.arguments["start"][0]) > 0:
        self.pageNumber = int(self.request.arguments["start"][0])
      else:
        self.pageNumber = 0
    
    if self.request.arguments.has_key("pilotId") and len(self.request.arguments["pilotId"][0]) > 0:
      pageNumber = 0
      req["PilotJobReference"] = str(self.request.arguments["pilotId"][0])
    elif self.request.arguments.has_key("taskQueueId") and len(self.request.arguments["taskQueueId"][0]) > 0:
      pageNumber = 0
      req["TaskQueueID"] = str(self.request.arguments["taskQueueId"][0])
    else:
      result = gConfig.getOption("/Website/ListSeparator")
      if result["OK"]:
        separator = result["Value"]
      else:
        separator = ","
        
      if self.request.arguments.has_key("broker") and len(self.request.arguments["broker"][0]) > 0:
        if str(self.request.arguments["broker"][0]) != "":
          req["Broker"] = str(self.request.arguments["broker"][0]).split(separator)
          
      if self.request.arguments.has_key("site") and len(self.request.arguments["site"][0]) > 0:
        if str(self.request.arguments["site"][0]) != "":
          req["GridSite"] = str(self.request.arguments["site"][0]).split(separator)
          
      if self.request.arguments.has_key("status") and len(self.request.arguments["status"][0]) > 0:
        if str(self.request.arguments["status"][0]) != "":
          req["Status"] = str(self.request.arguments["status"][0]).split(separator)
          
      if self.request.arguments.has_key("computingElement") and len(self.request.arguments["computingElement"][0]) > 0:
        if str(self.request.arguments["computingElement"][0]) != "":
          req["DestinationSite"] = str(self.request.arguments["computingElement"][0]).split(separator)
          
      if self.request.arguments.has_key("ownerGroup") and len(self.request.arguments["ownerGroup"][0]) > 0:
        if str(self.request.arguments["ownerGroup"][0]) != "":
          req["OwnerGroup"] = str(self.request.arguments["ownerGroup"][0]).split(separator)
      
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
  
  @asyncGen
  def web_getJobInfoData( self ):
    callback = {}
    data = self.request.arguments["data"][0]
    
    RPC = RPCClient("WorkloadManagement/WMSAdministrator")
    if self.request.arguments["data_kind"][0] == "getPilotOutput":
      result = yield self.threadTask(RPC.getPilotOutput,data)
      if result["OK"]:
        callback = {"success":"true","result":result["Value"]["StdOut"]}
      else:
        callback = {"success":"false","error":result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getPilotError":
      result = yield self.threadTask(RPC.getPilotOutput,data)
      if result["OK"]:
        if len(result["Value"]["StdErr"]) > 0:
          callback = {"success":"true","result":result["Value"]["StdErr"]}
        else:
          callback = {"success":"false","error":"Pilot Error is empty"}
      else:
        callback = {"success":"false","error":result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getLoggingInfo":
      result = yield self.threadTask(RPC.getPilotLoggingInfo,data)
      if result["OK"]:
        callback = {"success":"true","result":result["Value"]}
      else:
        callback = {"success":"false","error":result["Message"]}
    
    self.finish(callback)