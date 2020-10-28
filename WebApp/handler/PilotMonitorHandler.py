import json

from DIRAC import gConfig, S_OK, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Utilities.Graphs.Palette import Palette
from DIRAC.ConfigurationSystem.Client.Helpers.Registry import getUsernameForDN
from DIRAC.WorkloadManagementSystem.Client.PilotManagerClient import PilotManagerClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class PilotMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getPilotData(self):
    req = self.__request()

    result = yield self.threadTask(PilotManagerClient().getPilotMonitorWeb,
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

    for i in jobs:
      tmp = {}
      for j in range(0, headLength):
        if j == 12:
          if i[j] == 0:
            i[j] = "-"
        tmp[head[j]] = i[j]
      callback.append(tmp)
    total = result["TotalRecords"]
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    if "Extras" in result:
      extra = result["Extras"]
      callback = {"success": "true", "result": callback, "total": total, "extra": extra, "date": timestamp}
    else:
      callback = {"success": "true", "result": callback, "total": total, "date": timestamp}

    self.finish(callback)

  @asyncGen
  def web_getSelectionData(self):

    callback = {}

    if len(self.request.arguments) > 0:
      tmp = {}
      for i in self.request.arguments:
        tmp[i] = str(self.request.arguments[i][0]).replace('"', '')
      callback["extra"] = tmp

    result = yield self.threadTask(PilotManagerClient().getPilotMonitorSelectors)

    if result["OK"]:
      result = result["Value"]

      if "Status" in result and len(result["Status"]) > 0:
        status = []
        for i in result["Status"]:
          status.append([str(i)])
      else:
        status = [["Nothing to display"]]
      callback["status"] = status

      if "GridType" in result and len(result["GridType"]) > 0:
        gridtype = []
        for i in result["GridType"]:
          gridtype.append([str(i)])
      else:
        gridtype = [["Nothing to display"]]
      callback["gridtype"] = gridtype

      if "OwnerGroup" in result and len(result["OwnerGroup"]) > 0:
        ownerGroup = []
        for i in result["OwnerGroup"]:
          ownerGroup.append([str(i)])
      else:
        ownerGroup = [["Nothing to display"]]
      callback["ownerGroup"] = ownerGroup

      if "DestinationSite" in result and len(result["DestinationSite"]) > 0:
        ce = []
        for i in result["DestinationSite"]:
          ce.append([str(i)])
      else:
        ce = [["Nothing to display"]]
      callback["computingElement"] = ce

      if "GridSite" in result and len(result["GridSite"]) > 0:
        tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
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
      if "Broker" in result and len(result["Broker"]) > 0:
        broker = []
        for i in result["Broker"]:
          broker.append([str(i)])
      else:
        broker = [["Nothing to display"]]
      callback["broker"] = broker
      if "Owner" in result and len(result["Owner"]) > 0:
        owner = []
        for i in result["Owner"]:
          owner.append([str(i)])
      else:
        owner = [["Nothing to display"]]
      callback["owner"] = owner

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

    if 'site' in self.request.arguments:
      site = list(json.loads(self.request.arguments['site'][-1]))
      if len(site) > 0:
        req['GridSite'] = site

    if 'taskQueueId' in self.request.arguments:
      taskQueueId = list(json.loads(self.request.arguments['taskQueueId'][-1]))
      if len(taskQueueId) > 0:
        req['TaskQueueID'] = taskQueueId

    if 'pilotId' in self.request.arguments:
      pilotId = list(json.loads(self.request.arguments['pilotId'][-1]))
      if len(pilotId) > 0:
        req['PilotJobReference'] = pilotId

    if 'broker' in self.request.arguments:
      broker = list(json.loads(self.request.arguments["broker"][-1]))
      if len(broker) > 0:
        req['broker'] = broker

    if 'status' in self.request.arguments:
      status = list(json.loads(self.request.arguments["status"][-1]))
      if len(status) > 0:
        req['Status'] = status

    if 'computingElement' in self.request.arguments:
      ce = list(json.loads(self.request.arguments["computingElement"][-1]))
      if len(ce) > 0:
        req['DestinationSite'] = ce

    if 'owner' in self.request.arguments:
      owner = list(json.loads(self.request.arguments["owner"][-1]))
      if len(owner) > 0:
        req['Owner'] = owner

    if 'ownerGroup' in self.request.arguments:
      ownerGroup = list(json.loads(self.request.arguments["ownerGroup"][-1]))
      if len(ownerGroup) > 0:
        req['OwnerGroup'] = ownerGroup

    if 'sort' in self.request.arguments:
      sort = json.loads(self.request.arguments['sort'][-1])
      if len(sort) > 0:
        self.globalSort = []
        for i in sort:
          self.globalSort += [[i['property'], i['direction']]]
    else:
      self.globalSort = [["SubmissionTime", "DESC"]]

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

  @asyncGen
  def web_getJobInfoData(self):
    callback = {}
    data = self.request.arguments["data"][0]

    RPC = PilotManagerClient()
    if self.request.arguments["data_kind"][0] == "getPilotOutput":
      result = yield self.threadTask(RPC.getPilotOutput, data)
      if result["OK"]:
        callback = {"success": "true", "result": result["Value"]["StdOut"]}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getPilotError":
      result = yield self.threadTask(RPC.getPilotOutput, data)
      if result["OK"]:
        if len(result["Value"]["StdErr"]) > 0:
          callback = {"success": "true", "result": result["Value"]["StdErr"]}
        else:
          callback = {"success": "false", "error": "Pilot Error is empty"}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getLoggingInfo":
      result = yield self.threadTask(RPC.getPilotLoggingInfo, data)
      if result["OK"]:
        callback = {"success": "true", "result": result["Value"]}
      else:
        callback = {"success": "false", "error": result["Message"]}

    self.finish(callback)

  @asyncGen
  def web_getStatisticsData(self):
    req = self.__request()

    paletteColor = Palette()

    RPC = PilotManagerClient()

    selector = self.request.arguments["statsField"][0]

    if selector == 'Site':
      selector = "GridSite"
    if selector == "Computing Element":
      selector = "DestinationSite"
    elif selector == "Owner Group":
      selector = "OwnerGroup"
    elif selector == "Owner":
      selector = "OwnerDN"

    result = yield self.threadTask(RPC.getPilotStatistics, selector, req)
    if not result['OK']:
      if 'FromDate' in req:
        del req['FromDate']

      if 'LastUpdate' in req:
        del req['LastUpdate']

      if 'ToDate' in req:
        del req['ToDate']

      result = yield self.threadTask(RPC.getCounters, "PilotAgents", [selector], req)

      statistics = {}
      if result['OK']:
        for status, count in result['Value']:
          if "OwnerDN" in status:
            userName = getUsernameForDN(status['OwnerDN'])
            if userName['OK']:
              status['OwnerDN'] = userName['Value']
          statistics[status[selector]] = count

      result = S_OK(statistics)

    if result["OK"]:
      callback = []
      result = dict(result["Value"])
      keylist = sorted(result)
      if selector == "Site":
        tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
        if len(tier1) > 0:
          tier1.sort()
          for i in tier1:
            if i in result:
              countryCode = i.rsplit(".", 1)[1]
              callback.append({"key": i, "value": result[i], "code": countryCode,
                               "color": paletteColor.getColor(countryCode)})
      for key in keylist:
        if selector == "Site" and tier1:
          if key not in tier1:
            try:
              countryCode = key.rsplit(".", 1)[1]
            except BaseException:
              countryCode = "Unknown"
            callback.append({"key": key,
                             "value": result[key],
                             "code": countryCode,
                             "color": paletteColor.getColor(key)})
        elif selector == "Site" and not tier1:
          try:
            countryCode = key.rsplit(".", 1)[1]
          except BaseException:
            countryCode = "Unknown"
          callback.append({"key": key, "value": result[key], "code": countryCode, "color": paletteColor.getColor(key)})
        else:
          callback.append({"key": key, "value": result[key], "code": "", "color": paletteColor.getColor(key)})
      callback = {"success": "true", "result": callback}
    else:
      callback = {"success": "false", "error": result["Message"]}

    self.finish(callback)
