import json

from DIRAC import gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.RequestManagementSystem.Client.ReqClient import ReqClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class RequestMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getRequestMonitorData(self):
    callback = {}
    req = self.__request()

    result = yield self.threadTask(ReqClient().getRequestSummaryWeb,
                                   req, self.globalSort, self.pageNumber, self.numberOfJobs)

    if not result["OK"]:
      self.finish({"success": "false", "result": [], "total": 0, "error": result["Message"]})
      return

    result = result["Value"]

    if "TotalRecords" not in result:
      self.finish({"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"})
      return

    if not (result["TotalRecords"] > 0):
      self.finish({"success": "false",
                   "result": [],
                   "total": 0,
                   "error": "There were no data matching your selection"})
      return

    if not ("ParameterNames" in result and "Records" in result):
      self.finish({"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"})
      return

    if not (len(result["ParameterNames"]) > 0):
      self.finish({"success": "false", "result": [], "total": -1, "error": "ParameterNames field is missing"})
      return

    if not (len(result["Records"]) > 0):
      self.finish({"success": "false", "result": [], "total": 0, "Message": "There are no data to display"})
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
      for j in range(0, headLength):
        if j == 2:
          if i[j] == "None":
            i[j] = "-"
        tmp[head[j]] = i[j]
      callback.append(tmp)
    total = result["TotalRecords"]
    total = result["TotalRecords"]
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    if "Extras" in result:
      st = self.__dict2string({})
      extra = result["Extras"]
      callback = {
          "success": "true",
          "result": callback,
          "total": total,
          "extra": extra,
          "request": st,
          "date": timestamp}
    else:
      callback = {"success": "true", "result": callback, "total": total, "date": timestamp}
    self.finish(callback)

  def __dict2string(self, req):
    result = ""
    try:
      for key, value in req.iteritems():
        result = result + str(key) + ": " + ", ".join(value) + "; "
    except Exception as x:
      pass
      gLogger.info("\033[0;31m Exception: \033[0m %s" % x)
    result = result.strip()
    result = result[:-1]
    return result

  @asyncGen
  def web_getSelectionData(self):
    callback = {}
    group = self.getUserGroup()
    user = self.getUserName()
    if user == "Anonymous":
      self.finish({"success": "false", "result": [], "total": 0, "error": "Insufficient rights"})
    else:
      # R E Q U E S T T Y P E
      result = yield self.threadTask(ReqClient().getDistinctValuesWeb, "Type")
      if result["OK"]:
        reqtype = list()
        if len(result["Value"]) > 0:
          for i in result["Value"]:
            reqtype.append([str(i)])
        else:
          reqtype = [["Nothing to display"]]
      else:
        reqtype = [["Error during RPC call"]]
      callback["operationType"] = reqtype
  # U S E R
      result = yield self.threadTask(ReqClient().getDistinctValuesWeb, "OwnerDN")

      if result["OK"]:
        owner = []
        for dn in result["Value"]:

          owner.append([dn])
        if len(owner) < 2:
          owner = [["Nothing to display"]]
      else:
        owner = [["Error during RPC call"]]
      callback["owner"] = owner
  # G R O U P
      result = yield self.threadTask(ReqClient().getDistinctValuesWeb, "OwnerGroup")
      gLogger.info("getDistinctValuesWeb(OwnerGroup)", result)
      if result["OK"]:
        ownerGroup = list()
        if len(result["Value"]) > 0:
          for i in result["Value"]:
            ownerGroup.append([str(i)])
        else:
          ownerGroup = [["Nothing to display"]]
      else:
        ownerGroup = [["Error during RPC call"]]
      callback["ownerGroup"] = ownerGroup
  # S T A T U S
      result = yield self.threadTask(ReqClient().getDistinctValuesWeb, "Status")

      if result["OK"]:
        status = list()
        if len(result["Value"]) > 0:
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
    req = {}
    group = self.getUserGroup()
    user = self.getUserName()

    if "limit" in self.request.arguments:
      self.numberOfJobs = int(self.request.get_argument("limit"))
      if "start" in self.request.arguments:
        self.pageNumber = int(self.request.get_argument("start"))
      else:
        self.pageNumber = 0
    else:
      self.numberOfJobs = 25
      self.pageNumber = 0

    found = False
    if 'id' in self.request.arguments:
      jobids = list(json.loads(self.request.arguments['id'][-1]))
      if len(jobids) > 0:
        req['JobID'] = jobids
        found = True

    if 'reqId' in self.request.arguments and not found:
      reqids = list(json.loads(self.request.arguments['reqId'][-1]))
      if len(reqids) > 0:
        req['RequestID'] = reqids
        found = True

    if not found:

      if 'operationType' in self.request.arguments:
        value = list(json.loads(self.request.arguments["operationType"][-1]))
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
          for i in sort:
            self.globalSort += [[i['property'], i['direction']]]
        else:
          self.globalSort = [["RequestID", "DESC"]]

    if 'startDate' in self.request.arguments and len(self.request.get_argument("startDate")) > 0:
      if 'startTime' in self.request.arguments and len(self.request.get_argument("startTime")) > 0:
        req["FromDate"] = str(self.request.get_argument("startDate") + " " + self.request.get_argument("startTime"))
      else:
        req["FromDate"] = self.request.get_argument("startDate")

    if 'endDate' in self.request.arguments and len(self.request.get_argument("endDate")) > 0:
      if 'endTime' in self.request.arguments and len(self.request.get_argument("endTime")) > 0:
        req["ToDate"] = str(self.request.get_argument("endDate") + " " + self.request.get_argument("endTime"))
      else:
        req["ToDate"] = self.request.get_argument("endDate")

    if 'date' in self.request.arguments and len(self.request.get_argument("date")) > 0:
      req["LastUpdate"] = self.request.get_argument("date")
    gLogger.info("REQUEST:", req)
    return req
