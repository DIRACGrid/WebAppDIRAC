from DIRAC.TransformationSystem.Client.TransformationClient import TransformationClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Utilities.List import sortList
import json
import ast

class TransformationMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  tsClient = TransformationClient()
  
    
  def index(self):
    pass

  @asyncGen
  def web_getSelectionData(self):
    sData = self.getSessionData()
    callback = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]
    if user == "Anonymous":
      callback["prod"] = [["Insufficient rights"]]
    else:
      callback = {}

      RPC = RPCClient("Transformation/TransformationManager")
  ####
      result = yield self.threadTask(self.tsClient.getDistinctAttributeValues, "Plugin",{} )
      if result["OK"]:
        plugin = []
        if len(result["Value"])>0:
          for i in result["Value"]:
            plugin.append([str(i)])
        else:
          plugin.append("Nothing to display")
      else:
        plugin = "Error during RPC call"
      callback["plugin"] = plugin
  ####
      result = yield self.threadTask(self.tsClient.getDistinctAttributeValues, "Status",{})
      if result["OK"]:
        status = []
        if len(result["Value"])>0:
          for i in result["Value"]:
            status.append([str(i)])
        else:
          status = "Nothing to display"
      else:
        status = "Error during RPC call"
      callback["prodStatus"] = status
  ####
      result = yield self.threadTask(self.tsClient.getDistinctAttributeValues, "TransformationGroup",{})
      if result["OK"]:
        group = []
        if len(result["Value"])>0:
          for i in result["Value"]:
            group.append([str(i)])
        else:
          group = "Nothing to display"
      else:
        group = "Error during RPC call"
      callback["transformationGroup"] = group
  ####
      result = yield self.threadTask(self.tsClient.getDistinctAttributeValues, "AgentType",{})
      if result["OK"]:
        atype = []
        if len(result["Value"])>0:
          for i in result["Value"]:
            atype.append([str(i)])
        else:
          atype = "Nothing to display"
      else:
        atype = "Error during RPC call"
      callback["agentType"] = atype
  ####
      result = yield self.threadTask(self.tsClient.getDistinctAttributeValues, "Type",{})
      if result["OK"]:
        type = []
        if len(result["Value"])>0:
          for i in result["Value"]:
            type.append([str(i)])
        else:
          type = "Nothing to display"
      else:
        type = "Error during RPC call"
      callback["productionType"] = type
    self.finish(callback)

  @asyncGen
  def web_getTransformationData(self):

    pagestart = Time.time()
    callback = None
    sData = self.getSessionData()
    callback = {}
    user = sData["user"]["username"]
    if user == "Anonymous":
      callback = {"success":"false","error":"You are not authorised"}
    else:
      RPC = RPCClient("Transformation/TransformationManager")
      result = self.__request()
      
      result = yield self.threadTask(self.tsClient.getTransformationSummaryWeb, result, self.globalSort, self.pageNumber, self.numberOfJobs)
      if not result["OK"]:
        self.finish(json.dumps({"success":"false", "error":result["Message"]}))
        return

      result = result["Value"]

      if not result.has_key("TotalRecords"):
        self.finish(json.dumps({"success":"false", "result":"", "error":"Data structure is corrupted"}))
        return

      if not (result["TotalRecords"] > 0):
        self.finish(json.dumps({"success":"false", "result":"", "error":"There were no data matching your selection"}))
        return


      if not (result.has_key("ParameterNames") and result.has_key("Records")):
        self.finish(json.dumps({"success":"false", "result":"", "error":"Data structure is corrupted"}))
        return

      if not (len(result["ParameterNames"]) > 0):
        self.finish(json.dumps({"success":"false", "result":"", "error":"ParameterNames field is missing"}))
        return

      if not (len(result["Records"]) > 0):
        self.finish(json.dumps({"success":"false", "Message":"There are no data to display"}))
        return

      callback = []
      jobs = result["Records"]
      head = result["ParameterNames"]
      headLength = len(head)
      for i in jobs:
        tmp = {}
        for j in range(0,headLength):
          tmp[head[j]] = i[j]
        callback.append(tmp)
      total = result["TotalRecords"]
      if "Extras" in result:
        gLogger.info(result["Extras"])
        extra = result["Extras"]
        timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
        callback = {"success":"true","result":callback,"total":total,"extra":extra, "date":timestamp}
      else:
        callback = {"success":"true","result":callback,"total":total, "date":None}

      gLogger.info("\033[0;31m PRODUCTION SUBMIT REQUEST: \033[0m %s" % (Time.time() - pagestart))
    self.finish(json.dumps(callback))

  ################################################################################
  @asyncGen
  def web_action(self):
    try:
      id = self.request.arguments[ 'id' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )

    callback = {}

    if self.request.arguments["data_kind"][0] == "getLoggingInfo":
      callback = yield self.threadTask(self.__getLoggingInfo, id)
    elif self.request.arguments["data_kind"][0] == "fileStatus":
      callback = yield self.threadTask(self.__transformationFileStatus, id)
    elif self.request.arguments["data_kind"][0] == "fileProcessed":
      callback = yield self.threadTask(self.__fileRetry, id, 'proc')
    elif self.request.arguments["data_kind"][0] == "fileNotProcessed":
      callback = yield self.threadTask(self.__fileRetry, id, 'not')
    elif self.request.arguments["data_kind"][0] == "fileAllProcessed":
      callback = yield self.threadTask(self.__fileRetry, id, 'all')
    elif self.request.arguments["data_kind"][0] == "dataQuery":
      print '????', dir(self)
      callback = self.dataQuery(id)
    elif self.request.arguments["data_kind"][0] == "additionalParams":
      callback = yield self.threadTask(self.__additionalParams, id)
    elif self.request.arguments["data_kind"][0] == "transformationDetail":
      callback = yield self.threadTask(self.__transformationDetail, id)
    elif self.request.arguments["data_kind"][0] == "extend":
      callback = yield self.threadTask(self.__extendTransformation, id)
    else:
      callback = {"success":"false","error":"Action is unknown!!!"}
    self.finish(callback)

  ################################################################################
  @asyncGen
  def web_executeOperation(self):
    try:
      cmd = self.request.arguments[ 'action' ][-1]
      ids = self.request.arguments["ids"][0].split(",")
      ids = [int(i) for i in ids ]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
   
    RPC = RPCClient("Transformation/TransformationManager")
    
    if cmd == 'clean':
      status = 'Cleaning'
    elif cmd == 'start':
      status = 'Active'
    
    elif cmd == 'flush':
      status = 'Flush'
    
    elif cmd == 'stop':
      status = 'Stopped'
    elif cmd == 'complete':
      status = 'Completed'
    else:
      self.finish( {"success":"false","error": "Unknown action"})
      return
    callback = []
    
    for i in ids:
      try:
        id = int(i)
#        gLogger.info("RPC.setTransformationParameter(%s,'Status',%s)" % (id,status))
        result = yield self.threadTask(self.tsClient.setTransformationParameter, id,'Status',status)
        
        if result["OK"]:
          resString = "ProdID: %s set to %s successfully" % (i,cmd)
          result = yield self.threadTask(self.tsClient.setTransformationParameter, id,'AgentType',agentType)
          if not result["OK"]:
            resString = "ProdID: %s failed to set to %s: %s" % (i,cmd,result["Message"])
        else:
          resString = "ProdID: %s failed due the reason: %s" % (i,result["Message"])
      except:
        resString = "Unable to convert given ID %s to transformation ID" % i
      callback.append(resString)
    callback = {"success":"true","showResult":callback}
    gLogger.info(cmd,ids)
    self.finish(callback)

  ################################################################################
  def __fileRetry(self,prodid,mode):
    callback = {}
    RPC = RPCClient('Transformation/TransformationManager')
    if mode == "proc":
      res = self.tsClient.getTransformationFilesCount(prodid,"ErrorCount",{'Status':'Processed'})
    elif mode == "not":
      res = self.tsClient.getTransformationFilesCount(prodid,"ErrorCount",{'Status':['Unused','Assigned','Failed']})
    elif mode == "all":
      res = self.tsClient.getTransformationFilesCount(prodid,"ErrorCount")
    else:
      return {"success":"false","error":res["Message"]}
    if not res['OK']:
      callback = {"success":"false","error":res["Message"]}
    else:
      resList = []
      total = res['Value'].pop('Total')
      if total == 0:
        callback = {"success":"false","error":"No files found"}
      else:
        for status in sortList(res['Value'].keys()):
          count = res['Value'][status]
          percent = "%.1f" % ((count*100.0)/total)
          resList.append((status,str(count),percent))
        resList.append(('Total',total,'-'))
        callback = {"success":"true","result":resList}
    gLogger.info("#######",res)
    return callback

  ################################################################################
  def dataQuery(self,prodid):
    callback = {}
    RPC = RPCClient("Transformation/TransformationManager")
    print 'IIIIITTTTTTT'
    res = self.tsClient.getTransformationInputDataQuery(prodid)
    gLogger.info("-= #######",res)
    if not res['OK']:
      callback = {"success":"false","error":res["Message"]}
    else:
      result = res["Value"]
      back = []
      for i in sortList(result.keys()):
        back.append([i,result[i]])
      callback = {"success":"true","result":back}
    return callback

  ################################################################################
  def __additionalParams(self,prodid):
    callback = {}
    RPC = RPCClient('Transformation/TransformationManager')
    res = self.tsClient.getAdditionalParameters(prodid)
    if not res['OK']:
      callback = {"success":"false","error":res["Message"]}
    else:
      result = res["Value"]
      back = []
      for i in sortList(result.keys()):
        back.append([i,result[i]])
      callback = {"success":"true","result":back}
    return callback

  ################################################################################
  def __getLoggingInfo(self,id):
    RPC = RPCClient("Transformation/TransformationManager")
    callback = {}
    result = self.tsClient.getTransformationLogging(id)
    if result["OK"]:
      result = result["Value"]
      if len(result) > 0:
        callback = []
        resultUser = gConfig.getSections("/Security/Users")
        if resultUser["OK"]:
          users = resultUser["Value"]
          dndb = {}
          for j in users:
            dndb[gConfig.getValue("/Security/Users/%s/DN" % j)] = j
        else:
          dndb = {}
        for i in result:
          DN = i["AuthorDN"]
          if dndb.has_key(DN):
            i["AuthorDN"] = dndb[DN]
          else:
            i["AuthorDN"] = DN#"Owner Unknown"
          date = Time.toString(i["MessageDate"])
          callback.append([i["Message"], date, i["AuthorDN"]])
        callback = {"success":"true","result":callback}
      else:
        callback = {"success":"false","error":"Nothing to display"}
    else:
      callback = {"success":"false","error":result["Message"]}
    gLogger.info("PRODUCTION LOG:",id)
    return callback

  ################################################################################
  def __transformationFileStatus(self, id):
    callback = {}
    RPC = RPCClient('Transformation/TransformationManager')
    res = self.tsClient.getTransformationFilesCount(id,"Status")
    if not res['OK']:
      callback = {"success":"false","error":res["Message"]}
    else:
      resList = []
      total = res['Value'].pop('Total')
      if total == 0:
        callback = {"success":"false","error":"No files found"}
      else:
        for status in sortList(res['Value'].keys()):
          count = res['Value'][status]
          percent = "%.1f" % ((count*100.0)/total)
          resList.append((status,str(count),percent))
        resList.append(('Total',total,'-'))
        callback = {"success":"true","result":resList}
    gLogger.info("#######",res)
    return callback

  ################################################################################
  def __transformationDetail(self,prodid):
    callback = {}
    RPC = RPCClient('Transformation/TransformationManager')
    res = self.tsClient.getTransformationParameters(prodid,['DetailedInfo'])
    if not res["OK"]:
      callback = {"success":"false","error":res["Message"]}
    else:
      callback = res['Value']
      if callback:
        callback = {"success":"true","result":res['Value']}
      else:
        callback = {"success":"false","error":"Production does not have parameter 'DetailedInfo'"}
    gLogger.info("#######",res)
    return callback

  ################################################################################
  def __extendTransformation(self,transid):
  
    try:
      tasks = int(self.request.arguments["tasks"][-1])
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )

    gLogger.info("extend %s" % transid)
    RPC = RPCClient('Transformation/TransformationManager')
    gLogger.info("extendTransformation(%s,%s)" % (transid,tasks))
    res = self.tsClient.extendTransformation(transid,tasks)
    if res["OK"]:
      resString = "%s extended by %s successfully" % (transid,tasks)
    else:
      resString = "%s failed to extend: %s" % (transid,res["Message"])
    callback = {"success":"true","showResult":[resString],"result":resString}
    gLogger.info("#######",res)
    return callback

  ################################################################################
  @asyncGen
  def web_showFileStatus(self):
    callback = {}
    start = int(self.request.arguments["start"][-1])
    limit = int(self.request.arguments["limit"][-1])
    try:
      id = self.request.arguments[ 'transformationId' ][-1]
      status = self.request.arguments[ 'status' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )

    RPC = RPCClient("Transformation/TransformationManager")
    result = yield self.threadTask(self.tsClient.getTransformationFilesSummaryWeb, {'TransformationID':id,'Status':status},[["FileID","ASC"]],start,limit)
    if not result['OK']:
      callback = {"success":"false","error":result["Message"]}
    else:
      result = result["Value"]
      if result.has_key("TotalRecords") and  result["TotalRecords"] > 0:
        if result.has_key("ParameterNames") and result.has_key("Records"):
          if len(result["ParameterNames"]) > 0:
            if len(result["Records"]) > 0:
              callback = []
              jobs = result["Records"]
              head = result["ParameterNames"]
              headLength = len(head)
              for i in jobs:
                tmp = {}
                for j in range(0,headLength):
                  tmp[head[j]] = i[j]
                callback.append(tmp)
              total = result["TotalRecords"]
              if result.has_key("Extras"):
                extra = result["Extras"]
                timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
                callback = {"success":"true","result":callback,"total":total,"extra":extra,"date":timestamp}
              else:
                callback = {"success":"true","result":callback,"total":total, "date":timestamp}
            else:
              callback = {"success":"false","result":"","error":"There are no data to display"}
          else:
            callback = {"success":"false","result":"","error":"ParameterNames field is undefined"}
        else:
          callback = {"success":"false","result":"","error":"Data structure is corrupted"}
      else:
        callback = {"success":"false","result":"","error":"There were no data matching your selection"}
    self.finish(callback)



  ################################################################################
  def web_getTier1Sites(self):
    callback = {}
    tier1 = gConfig.getValue("/Website/PreferredSites",[])
    if len(tier1) < 1:
      callback = { 'success' : False, 'errors' : 'No site defined in the CS!' }
    else:
      callback = { 'success' : True, 'data' : tier1}
    self.finish(json.dumps(callback))


  ################################################################################
  @asyncGen
  def web_setSite(self):
    callback = {}
    try:
      transID = int(self.request.arguments[ 'TransformationId' ][-1])
      runID = int(self.request.arguments[ 'RunNumber' ][-1])
      site = self.request.arguments[ 'Site' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )

    RPC = RPCClient("Transformation/TransformationManager")
    gLogger.info("\033[0;31m setTransformationRunsSite(%s, %s, %s) \033[0m" % (transID,runID,site))
    result = self.tsClient.setTransformationRunsSite(transID,runID,site)
    
    if result["OK"]:
      callback = {"success":"true","result":"true"}
    else:
      callback = {"success":"false","error":result["Message"]}
    self.finish(callback)

  ################################################################################
  def __request(self):
    req = {}
    if "limit" in self.request.arguments:
      self.numberOfJobs = int(self.request.arguments["limit"][-1])
      if "start" in self.request.arguments:
        self.pageNumber = int(self.request.arguments["start"][-1])
      else:
        self.pageNumber = 0
    else:
      self.numberOfJobs = 25
      self.pageNumber = 0
    if 'transformationId' in self.request.arguments:
      prods = list(json.loads(self.request.arguments[ 'transformationId' ][-1]))
      if len(prods) > 0:
        req['TransformationID'] = prods

    if 'requestId' in self.request.arguments:
      requests = list(json.loads(self.request.arguments[ 'requestId' ][-1]))
      if len(requests) > 0:
        req['TransformationFamily'] = requests

    if 'TransformationFamily' in self.request.arguments:
      req['TransformationFamily'] = self.request.arguments[ 'TransformationFamily' ][-1]

    if 'agentType' in self.request.arguments:
      agentType = list(json.loads(self.request.arguments["agentType"][-1]))
      if len(agentType) > 0:
        req['agentType'] = agentType

    if 'status' in self.request.arguments:
      status = list(json.loads(self.request.arguments["status"][-1]))
      if len(status) > 0:
        req['Status'] = status

    if 'plugin' in self.request.arguments:
      plugin = list(json.loads(self.request.arguments["plugin"][-1]))
      if len(plugin) > 0:
        req["Plugin"] = plugin

    if 'type' in self.request.arguments:
      type = list(json.loads(self.request.arguments["type"][-1]))
      if len(type) > 0:
        req['Type'] = type

    if 'transformationGroup' in self.request.arguments:
      group = list(json.loads(self.request.arguments["transformationGroup"][-1]))
      if len(group) > 0:
        req['TransformationGroup'] = group

    if 'sort' in self.request.arguments:
      sort = json.loads(self.request.arguments['sort'][-1])
      if len(sort) > 0:
        self.globalSort = []
        for i in sort :
          self.globalSort  += [[i['property'],i['direction']]]
    else:
      self.globalSort = [["TransformationID","DESC"]]

    if 'startDate' in self.request.arguments and len(self.request.arguments["startDate"][0]) > 0:
      if 'startTime' in self.request.arguments and len(self.request.arguments["startTime"][0]) > 0:
        req["FromDate"] = str(self.request.arguments["startDate"][0] + " " + self.request.arguments["startTime"][0])
      else:
        req["FromDate"] = str(self.request.arguments["startDate"][0])

    if 'endDate' in self.request.arguments and len(self.request.arguments["endDate"][0]) > 0:
      if 'endTime' in self.request.arguments and len(self.request.arguments["endTime"][0]) > 0:
        req["ToDate"] = str(self.request.arguments["endDate"][0] + " " + self.request.arguments["endTime"][0])
      else:
        req["ToDate"] = str(self.request.arguments["endDate"][0])

    if 'date' in self.request.arguments and len(self.request.arguments["date"][0]) > 0:
      req["LastUpdate"] = str(self.request.arguments["date"][0])
    gLogger.info("REQUEST:",req)
    return req