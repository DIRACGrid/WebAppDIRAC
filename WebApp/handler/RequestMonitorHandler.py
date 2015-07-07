from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Security import CS
import json
import ast

class RequestMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getRequestMonitorData(self):
    RPC = RPCClient("RequestManagement/ReqManager", timeout = 600 )
    callback = {}
    req = self.__request()
   
    result = yield self.threadTask(RPC.getRequestSummaryWeb, req, self.globalSort , self.pageNumber, self.numberOfJobs)

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

    jobs = result["Records"]
    head = result["ParameterNames"]
    headLength = len(head)
    for i in jobs:
      tmp = {}
      for j in range(0,headLength):
        if j == 2:
          if i[j] == "None":
            i[j] = "-"
        tmp[head[j]] = i[j]
      callback.append(tmp)
    total = result["TotalRecords"]
    total = result["TotalRecords"]
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    if result.has_key("Extras"):
      st = self.__dict2string({})
      extra = result["Extras"]
      callback = {"success":"true", "result":callback, "total":total, "extra":extra, "request":st, "date":timestamp }
    else:
      callback = {"success":"true", "result":callback, "total":total, "date":timestamp}
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
      self.finish({"success":"false", "result":[], "total":0, "error":"Insufficient rights"})
    else:
      RPC = RPCClient("RequestManagement/ReqManager")
  ### R E Q U E S T T Y P E
      result = yield self.threadTask( RPC.getDistinctValuesWeb, "Type" )
      if result["OK"]:
        reqtype = list()
        if len(result["Value"])>0:
          for i in result["Value"]:
            reqtype.append([str(i)])
        else:
          reqtype = [["Nothing to display"]]
      else:
        reqtype = [["Error during RPC call"]]
      callback["operationType"] = reqtype
  ### U S E R
      result = yield self.threadTask( RPC.getDistinctValuesWeb, "OwnerDN" )

      if result["OK"]:
        owner = []
        for dn in result["Value"]:

          owner.append( [dn] )
        if len(owner) < 2:
          owner = [["Nothing to display"]]
      else:
        owner = [["Error during RPC call"]]
      callback["owner"] = owner
  ### G R O U P
      result = yield self.threadTask( RPC.getDistinctValuesWeb, "OwnerGroup" )
      gLogger.info( "getDistinctValuesWeb(OwnerGroup)", result )
      if result["OK"]:
        ownerGroup = list()
        if len(result["Value"])>0:
          for i in result["Value"]:
            ownerGroup.append([str(i)])
        else:
          ownerGroup = [["Nothing to display"]]
      else:
        ownerGroup = [["Error during RPC call"]]
      callback["ownerGroup"] = ownerGroup
  ### S T A T U S
      result = yield self.threadTask( RPC.getDistinctValuesWeb, "Status" )

      if result["OK"]:
        status = list()
        if len(result["Value"])>0:
          for i in result["Value"]:
            status.append([str(i)])
        else:
          status = [["Nothing to display"]]
      else:
        status = [["Error during RPC call"]]
      callback["status"] = status
      self.finish(callback)

  ################################################################################
  def __request(self):
    self.pageNumber = 0
    self.numberOfJobs = 25
    self.globalSort = [["JobID", "DESC"]]
    sData = self.getSessionData()
    req = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]

    if "limit" in self.request.arguments:
      self.numberOfJobs = int(self.request.arguments["limit"][-1])
      if "start" in self.request.arguments:
        self.pageNumber = int(self.request.arguments["start"][-1])
      else:
        self.pageNumber = 0
    else:
      self.numberOfJobs = 25
      self.pageNumber = 0

    found = False
    if 'id' in self.request.arguments:
      jobids = list(json.loads(self.request.arguments[ 'id' ][-1]))
      if len(jobids) > 0:
        req['JobID'] = jobids
        found = True

    if 'reqId' in self.request.arguments and not found:
      reqids = list(json.loads(self.request.arguments[ 'reqId' ][-1]))
      if len(reqids) > 0:
        req['RequestID'] = reqids
        found = True

    if not found:

      if 'operationType' in self.request.arguments:
        value = list( json.loads( self.request.arguments["operationType"][-1] ) )
        if len(value) > 0:
          req["Type"] = value


      if 'ownerGroup' in self.request.arguments:
        value = list(json.loads(self.request.arguments["ownerGroup"][-1]))
        if len(value) > 0:
          req["OwnerGroup"] = value

      if 'status' in self.request.arguments:
        value = list(json.loads(self.request.arguments["status"][-1]))
        if len(value) > 0:
          req["Status"] = value

      if 'owner' in self.request.arguments:
        value = list(json.loads(self.request.arguments["owner"][-1]))
        if len(value) > 0:
          req["OwnerDN"] = value

      if 'sort' in self.request.arguments:
        sort = json.loads(self.request.arguments['sort'][-1])
        if len(sort) > 0:
          self.globalSort = []
          for i in sort :
            self.globalSort  += [[i['property'],i['direction']]]
        else:
          self.globalSort = [["RequestID","DESC"]]

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
