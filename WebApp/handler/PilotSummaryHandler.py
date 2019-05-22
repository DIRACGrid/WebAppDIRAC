import json

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.WorkloadManagementSystem.Client.PilotManagerClient import PilotManagerClient
from DIRAC.WorkloadManagementSystem.Client.JobMonitoringClient import JobMonitoringClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class PilotSummaryHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getPilotSummaryData(self):
    callback = {}
    req = self.__request()

    result = yield self.threadTask(PilotManagerClient().getPilotSummaryWeb,
                                   req, self.globalSort, self.pageNumber, self.numberOfJobs)

    if not result["OK"]:
      self.finish({"success": "false", "result": [], "total": 0, "error": result["Message"]})
      return

    result = result["Value"]

    if "TotalRecords" not in result:
      self.finish({"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"})
      return

    if not (result["TotalRecords"] > 0):
      self.finish({"success": "false", "result": [], "total": 0, "error": "There were no data matching your selection"})
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

    for i in jobs:
      tmp = {}
      for j in range(0, headLength):
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
    sData = self.getSessionData()
    callback = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]
    if user == "Anonymous":
      self.finish({"success": "false", "result": [], "total": 0, "error": "Insufficient rights"})
    else:
      result = yield self.threadTask(JobMonitoringClient().getSites)
      if result["OK"]:
        tier1 = gConfig.getValue("/WebApp/PreferredSites")
        if tier1:
          try:
            tier1 = tier1.split(", ")
          except BaseException:
            tier1 = list()
        else:
          tier1 = list()
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
        site = [["Error during RPC call"]]

      callback["site"] = site
      callback['Status'] = [['Good'], ['Bad'], ['Idle'], ['Poor'], ['Fair']]

      self.finish(callback)

  ################################################################################

  def __request(self):
    self.pageNumber = 0
    self.numberOfJobs = 25
    self.globalSort = [["GridSite", "ASC"]]
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
      jobids = list(json.loads(self.request.arguments['id'][-1]))
      if len(jobids) > 0:
        req['JobID'] = jobids
        found = True

    elif 'expand' in self.request.arguments:
      expand = list(json.loads(self.request.arguments['expand'][-1]))
      if len(expand) > 0:
        globalSort = [["GridSite", "ASC"]]
        numberOfJobs = 500
        pageNumber = 0
        req["ExpandSite"] = expand[0]
        found = True

    if not found:

      if 'prod' in self.request.arguments:
        value = list(json.loads(self.request.arguments["prod"][-1]))
        if len(value) > 0:
          req["JobGroup"] = value

      if 'site' in self.request.arguments:
        value = list(json.loads(self.request.arguments["site"][-1]))
        if len(value) > 0:
          if len(value) == 1:
            req["ExpandSite"] = value[0]
          else:
            req["GridSite"] = value

      if 'Status' in self.request.arguments:
        value = list(json.loads(self.request.arguments["Status"][-1]))
        if len(value) > 0:
          req['Status'] = value

      if 'sort' in self.request.arguments:
        sort = json.loads(self.request.arguments['sort'][-1])
        if len(sort) > 0:
          self.globalSort = []
          for i in sort:
            self.globalSort += [[i['property'], i['direction']]]
        else:
          self.globalSort = [["GridSite", "DESC"]]

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
    gLogger.info("REQUEST:", req)
    return req
