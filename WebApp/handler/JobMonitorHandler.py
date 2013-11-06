
from DIRAC.WorkloadManagementSystem.Client.SandboxStoreClient import SandboxStoreClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
from WebAppDIRAC.WebApp.handler.Palette import Palette
import json
import ast

class JobMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getJobData(self):
    RPC = RPCClient("WorkloadManagement/JobMonitoring")
    req = self.__request()
    result = yield self.threadTask(RPC.getJobPageSummaryWeb, req, self.globalSort , self.pageNumber, self.numberOfJobs)

    if not result["OK"]:
      self.finish({"success":"false", "result":[], "total":0, "error":result["Message"]})
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
      for j in range(0, headLength):
        tmp[head[j]] = i[j]
      callback.append(tmp)
    total = result["TotalRecords"]
    if result.has_key("Extras"):
      st = self.__dict2string({})
      extra = result["Extras"]
      timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
      callback = {"success":"true", "result":callback, "total":total, "extra":extra, "request":st, "date":timestamp }
    else:
      callback = {"success":"true", "result":callback, "total":total, "date":None}
    self.finish(callback)

  def __dict2string(self, req):
    result = ""
    try:
      for key, value in req.iteritems():
        result = result + str(key) + ": " + ", ".join(value) + "; "
    except Exception, x:
      pass
      gLogger.info("\033[0;31m Exception: \033[0m %s" % x)
    result = result.strip()
    result = result[:-1]
    return result

  @asyncGen
  def web_getSelectionData(self):
    sData = self.getSessionData()
    callback = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]
    if user == "Anonymous":
      callback["prod"] = [["Insufficient rights"]]
    else:
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getProductionIds)
      if result["OK"]:
        prod = []
        prods = result["Value"]
        if len(prods) > 0:
          # prod.append([str("All")])
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
# ##
    RPC = RPCClient("WorkloadManagement/JobMonitoring")
    result = yield self.threadTask(RPC.getSites)
    if result["OK"]:
      tier1 = gConfig.getValue("/Website/PreferredSites", [])  # Always return a list
      site = []
      if len(result["Value"]) > 0:
        s = list(result["Value"])
        for i in tier1:
          site.append([str(i)])
        for i in s:
          if i not in tier1:
            site.append([str(i)])
      else:
        site = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getSites() return error: %s" % result["Message"])
      site = [["Error happened on service side"]]
    callback["site"] = site
# ##
    result = yield self.threadTask(RPC.getStates)
    if result["OK"]:
      stat = []
      if len(result["Value"]) > 0:
        for i in result["Value"]:
          stat.append([str(i)])
      else:
        stat = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getStates() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
    callback["status"] = stat
# ##
    result = yield self.threadTask(RPC.getMinorStates)
    if result["OK"]:
      stat = []
      if len(result["Value"]) > 0:
        for i in result["Value"]:
          i = i.replace(",", ";")
          stat.append([i])
      else:
        stat = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getMinorStates() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
    callback["minorstat"] = stat
# ##
    result = yield self.threadTask(RPC.getApplicationStates)
    if result["OK"]:
      app = []
      if len(result["Value"]) > 0:
        for i in result["Value"]:
          i = i.replace(",", ";")
          app.append([i])
      else:
        app = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getApplicationstates() return error: %s" % result["Message"])
      app = [["Error happened on service side"]]
    callback["app"] = app
# ##
    result = yield self.threadTask(RPC.getJobTypes)
    if result["OK"]:
      types = []
      if len(result["Value"]) > 0:
        for i in result["Value"]:
          i = i.replace(",", ";")
          types.append([i])
      else:
        types = [["Nothing to display"]]
    else:
      gLogger.error("RPC.getJobTypes() return error: %s" % result["Message"])
      types = [["Error happened on service side"]]
    callback["types"] = types
# ##
    # groupProperty = credentials.getProperties(group)
    if user == "Anonymous":
      callback["owner"] = [["Insufficient rights"]]
    else:
      result = yield self.threadTask(RPC.getOwners)
      if result["OK"]:
        owner = []
        if len(result["Value"]) > 0:
          for i in result["Value"]:
            owner.append([str(i)])
        else:
          owner = [["Nothing to display"]]
      else:
        gLogger.error("RPC.getOwners() return error: %s" % result["Message"])
        owner = [["Error happened on service side"]]
      callback["owner"] = owner
    self.finish(callback)

  def __request(self):
    self.pageNumber = 0
    self.numberOfJobs = 25
    self.globalSort = [["JobID", "DESC"]]
    sData = self.getSessionData()
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
          rangeID = range(int(testI[0].strip(' ')), int(testI[1].strip(' ')) + 1)
          req["JobID"].extend(rangeID)
        else:
          req["JobID"].append(i)
    # groupProperty = credentials.getProperties(group)
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
      # converting the string into a dictionary
      sortValue = ast.literal_eval(sortValue.strip("[]"))
      self.globalSort = [[sortValue["property"], sortValue["direction"]]]
    return req

  @asyncGen
  def web_jobAction(self):
    ids = self.request.arguments["ids"][0].split(",")
    ids = [int(i) for i in ids ]

    RPC = RPCClient("WorkloadManagement/JobManager")
    if self.request.arguments["action"][0] == "delete":
      result = yield self.threadTask(RPC.deleteJob, ids)
    elif self.request.arguments["action"][0] == "kill":
      result = yield self.threadTask(RPC.killJob, ids)
    elif self.request.arguments["action"][0] == "reschedule":
      result = yield self.threadTask(RPC.rescheduleJob, ids)
    elif self.request.arguments["action"][0] == "reset":
      result = yield self.threadTask(RPC.resetJob, ids)

    callback = {}
    if result["OK"]:
      callback = {"success":"true", "result":""}
    else:
      if result.has_key("InvalidJobIDs"):
        callback = {"success":"false", "error":"Invalid JobIDs: %s" % result["InvalidJobIDs"]}
      elif result.has_key("NonauthorizedJobIDs"):
        callback = {"success":"false", "error":"You are nonauthorized to %s jobs with JobID: %s" % (self.request.arguments["action"][0], result["NonauthorizedJobIDs"])}
      else:
        callback = {"success":"false", "error":result["Message"]}
    self.finish(callback)

  @asyncGen
  def web_jobData(self):
    id = int(self.request.arguments["id"][0])
    callback = {}

    if self.request.arguments["data_kind"][0] == "getJDL":
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getJobJDL, id)
      if result["OK"]:
        callback = {"success":"true", "result":result["Value"]}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getBasicInfo":
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getJobSummary, id)
      if result["OK"]:
        items = []
        for key, value in result["Value"].items():
          items.append([key, value])
        callback = {"success":"true", "result":items}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getParams":
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getJobParameters, id)
      if result["OK"]:
        attr = result["Value"]
        items = []
        for i in attr.items():
          if i[0] != "StandardOutput":
            items.append([i[0], i[1]])
        callback = {"success":"true", "result":items}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getLoggingInfo":
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getJobLoggingInfo, id)
      if result["OK"]:
        callback = {"success":"true", "result":result["Value"]}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getStandardOutput":
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getJobParameters, id)
      attr = result["Value"]
      if result["OK"]:
        if attr.has_key("StandardOutput"):
          callback = {"success":"true", "result":attr["StandardOutput"]}
        else:
          callback = {"success":"false", "error":"Not accessible yet"}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getPending":
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getJobParameters, id)
      if result["OK"]:
        items = []
        for i in result["Value"].items():
          if i[0] != "StandardOutput":
            items.append([i[0], i[1]])
        callback = {"success":"true", "result":items}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getLogURL":
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getJobParameters, id)
      if result["OK"]:
        attr = result["Value"]
        if attr.has_key("Log URL"):
          url = attr["Log URL"].split('"')
          callback = {"success":"true", "result":url[1]}
        else:
          callback = {"success":"false", "error":"No URL found"}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getStagerReport":
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = yield self.threadTask(RPC.getJobParameters, id)
      if result["OK"]:
        attr = result["Value"]
        if attr.has_key("StagerReport"):
          callback = {"success":"true", "result":attr["StagerReport"]}
        else:
          callback = {"success":"false", "error":"StagerReport not available"}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getPilotStdOut":
      RPC = RPCClient("WorkloadManagement/WMSAdministrator")
      result = yield self.threadTask(RPC.getJobPilotOutput, id)
      if result["OK"]:
        if result["Value"].has_key("StdOut"):
          callback = {"success":"true", "result":result["Value"]["StdOut"]}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getPilotStdErr":
      RPC = RPCClient("WorkloadManagement/WMSAdministrator")
      result = yield self.threadTask(RPC.getJobPilotOutput, id)
      if result["OK"]:
        if result["Value"].has_key("StdErr"):
          callback = {"success":"true", "result":result["Value"]["StdErr"]}
      else:
        callback = {"success":"false", "error":result["Message"]}
    self.finish(callback)
  
  @asyncGen  
  def web_getStatisticsData(self):
    req = self.__request()
    
    paletteColor = Palette()
    
    RPC = RPCClient("WorkloadManagement/JobMonitoring")
    
    selector = self.request.arguments["statsField"][0]
    
    if selector == "Minor Status":
      selector = "MinorStatus"
    elif selector == "Application Status":
      selector = "ApplicationStatus"
    elif selector == "Job Group":
      selector = "JobGroup"
    
    result = yield self.threadTask(RPC.getJobStats, selector, req)
    
    if result["OK"]:
      callback = []
      result = dict(result["Value"])
      keylist = result.keys()
      keylist.sort()
      if selector == "Site":
        tier1 = gConfig.getValue("/Website/PreferredSites", [])
        if len(tier1) > 0:
          tier1.sort()
          for i in tier1:
            if result.has_key(i):
              countryCode = i.rsplit(".", 1)[1]
              callback.append({"key":i, "value":result[i], "code":countryCode, "color": paletteColor.getColor(countryCode) })
      for key in keylist:
        if selector == "Site" and tier1:
          if key not in tier1:
            try:
              countryCode = key.rsplit(".", 1)[1]
            except:
              countryCode = "Unknown"
            callback.append({"key":key, "value":result[key], "code":countryCode, "color": paletteColor.getColor(key) })
        elif selector == "Site" and not tier1:
          try:
            countryCode = key.rsplit(".", 1)[1]
          except:
            countryCode = "Unknown"
          callback.append({"key":key, "value":result[key], "code":countryCode, "color": paletteColor.getColor(key) })
        else:
          callback.append({"key":key, "value":result[key], "code":"", "color": paletteColor.getColor(key) })
      callback = {"success":"true", "result":callback}
    else:
      callback = {"success":"false", "error":result["Message"]}
    self.finish(callback)
   
  @asyncGen  
  def web_getSandbox(self):
    if 'jobID' not in self.request.arguments:
      self.finish({"success":"false", "error":"Maybe you forgot the jobID ?"});
      return
    jobID = int(self.request.arguments['jobID'][0])
    sbType = 'Output'
    if 'sandbox' in self.request.arguments:
      sbType = str(self.request.arguments['sandbox'][0])
    
    userData = self.getSessionData()
        
    client = SandboxStoreClient(useCertificates=True,
                                delegatedDN=str(userData["user"]["DN"]),
                                delegatedGroup=str(userData["user"]["group"]),
                                setup=userData["setup"])
    
    result = yield self.threadTask(client.downloadSandboxForJob, jobID, sbType, inMemory=True)
    
    if not result['OK']:
      self.finish({"success":"false", "error":"Error: %s" % result['Message']})
      return
    
    if "check" in self.request.arguments:
      self.finish({"success":"true"})
      return
    
    data = result['Value']
    fname = "%s_%sSandbox.tar" % (str(jobID), sbType)
    self.set_header('Content-type', 'application/x-tar')
    self.set_header('Content-Disposition', 'attachment; filename="%s"' % fname)
    self.set_header('Content-Length', len(data))
    self.set_header('Cache-Control', "no-cache, no-store, must-revalidate, max-age=0")
    self.set_header('Pragma', "no-cache")
    self.finish(data)
    
