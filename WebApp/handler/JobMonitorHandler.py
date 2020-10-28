import json

from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Utilities import DictCache
from DIRAC.Core.Utilities.Graphs.Palette import Palette
from DIRAC.RequestManagementSystem.Client.Request import Request
from DIRAC.RequestManagementSystem.Client.ReqClient import ReqClient
from DIRAC.WorkloadManagementSystem.Client.JobMonitoringClient import JobMonitoringClient
from DIRAC.WorkloadManagementSystem.Client.JobManagerClient import JobManagerClient
from DIRAC.WorkloadManagementSystem.Client.PilotManagerClient import PilotManagerClient
from DIRAC.WorkloadManagementSystem.Client.WMSAdministratorClient import WMSAdministratorClient
from DIRAC.WorkloadManagementSystem.Client.SandboxStoreClient import SandboxStoreClient

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen, WErr


class JobMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  __dataCache = DictCache.DictCache()

  @asyncGen
  def web_getJobData(self):
    req = self._request()

    result = yield self.threadTask(JobMonitoringClient().getJobPageSummaryWeb,
                                   req, self.globalSort, self.pageNumber, self.numberOfJobs)

    if not result["OK"]:
      self.finish({"success": "false", "result": [], "total": 0, "error": result["Message"]})
      return

    result = result["Value"]

    if "TotalRecords" not in result:
      self.finish({"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"})
      return

    if not result["TotalRecords"]:
      self.finish({"success": "false", "result": [], "total": 0, "error": "There were no data matching your selection"})
      return

    if "ParameterNames" not in result or "Records" not in result:
      self.finish({"success": "false", "result": [], "total": -1, "error": "Data structure is corrupted"})
      return

    if not result["ParameterNames"]:
      self.finish({"success": "false", "result": [], "total": -1, "error": "ParameterNames field is missing"})
      return

    if not result["Records"]:
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
    extra = None
    if "Extras" in result:
      extra = result["Extras"]
      timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
      extra['date'] = timestamp

    callback = {"success": "true", "result": callback, "total": total, "extra": extra}
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
    user = sData["user"]["username"]
    if user == "Anonymous":
      callback["prod"] = [["Insufficient rights"]]
    else:
      cacheKey = (sData["user"].get("group", ""),
                  sData["setup"])

      callback = JobMonitorHandler.__dataCache.get(cacheKey)
      if not callback:
        callback = {}
        RPC = JobMonitoringClient()
        result = yield self.threadTask(RPC.getProductionIds)
        if result["OK"]:
          prod = []
          prods = result["Value"]
          if prods:
            prods.sort(reverse=True)
            prod = [[i] for i in prods]
          else:
            prod = [["Nothing to display"]]
        else:
          gLogger.error("RPC.getProductionIds() return error: %s" % result["Message"])
          prod = [["Error happened on service side"]]
        callback["prod"] = prod

        RPC = JobMonitoringClient()
        result = yield self.threadTask(RPC.getSites)
        if result["OK"]:
          tier1 = gConfig.getValue("/WebApp/PreferredSites", [])  # Always return a list
          site = []
          if result["Value"]:
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
          if result["Value"]:
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
          if result["Value"]:
            for i in result["Value"]:
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
          if result["Value"]:
            for i in result["Value"]:
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
          if result["Value"]:
            for i in result["Value"]:
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
            if result["Value"]:
              for i in result["Value"]:
                owner.append([str(i)])
            else:
              owner = [["Nothing to display"]]
          elif 'NormalUser' in sData['user']['properties']:
            owner = [[user]]
            callback["owner"] = owner
          else:
            gLogger.error("RPC.getOwners() return error: %s" % result["Message"])
            owner = [["Error happened on service side"]]
          callback["owner"] = owner

        result = yield self.threadTask(RPC.getOwnerGroup)
        if result['OK']:
          callback['OwnerGroup'] = [[group] for group in result['Value']]

        JobMonitorHandler.__dataCache.add(cacheKey, 360, callback)

    self.finish(callback)

  def _request(self):
    self.pageNumber = 0
    self.numberOfJobs = 25
    self.globalSort = [["JobID", "DESC"]]

    req = {}

    if "limit" in self.request.arguments and self.request.arguments["limit"][0]:
      self.numberOfJobs = int(self.request.arguments["limit"][0])
      if "start" in self.request.arguments and self.request.arguments["start"][0]:
        self.pageNumber = int(self.request.arguments["start"][0])
      else:
        self.pageNumber = 0

    if "JobID" in self.request.arguments:
      jobids = list(json.loads(self.request.arguments['JobID'][-1]))
      if jobids:
        req['JobID'] = jobids

    if "PilotJobReference" in self.request.arguments:
      pilotids = list(json.loads(self.request.arguments['PilotJobReference'][-1]))
      if pilotids:
        req['PilotJobReference'] = pilotids

    if "jobGroup" in self.request.arguments:
      prodids = list(json.loads(self.request.arguments['jobGroup'][-1]))
      if prodids:
        req['JobGroup'] = prodids

    if "site" in self.request.arguments:
      sites = list(json.loads(self.request.arguments['site'][-1]))
      if sites:
        req["Site"] = sites

    if "status" in self.request.arguments:
      status = list(json.loads(self.request.arguments['status'][-1]))
      if status:
        req["Status"] = status

    if "minorStatus" in self.request.arguments:
      minorstat = list(json.loads(self.request.arguments['minorStatus'][-1]))
      if minorstat:
        req["MinorStatus"] = minorstat

    if "appStatus" in self.request.arguments:
      apps = list(json.loads(self.request.arguments['appStatus'][-1]))
      if apps:
        req["ApplicationStatus"] = apps

    if "jobType" in self.request.arguments:
      types = list(json.loads(self.request.arguments['jobType'][-1]))
      if types:
        req["JobType"] = types

    if "owner" in self.request.arguments:
      owner = list(json.loads(self.request.arguments['owner'][-1]))
      if owner:
        req["Owner"] = owner

    if "OwnerGroup" in self.request.arguments:
      ownerGroup = list(json.loads(self.request.arguments['OwnerGroup'][-1]))
      if ownerGroup:
        req["OwnerGroup"] = ownerGroup

    if 'startDate' in self.request.arguments and self.request.arguments["startDate"][0]:
      if 'startTime' in self.request.arguments and self.request.arguments["startTime"][0]:
        req["FromDate"] = str(self.request.arguments["startDate"][0] + " " + self.request.arguments["startTime"][0])
      else:
        req["FromDate"] = str(self.request.arguments["startDate"][0])

    if 'endDate' in self.request.arguments and self.request.arguments["endDate"][0]:
      if 'endTime' in self.request.arguments and self.request.arguments["endTime"][0]:
        req["ToDate"] = str(self.request.arguments["endDate"][0] + " " + self.request.arguments["endTime"][0])
      else:
        req["ToDate"] = str(self.request.arguments["endDate"][0])

    if 'date' in self.request.arguments and self.request.arguments["date"][0]:
      req["LastUpdate"] = str(self.request.arguments["date"][0])

    if 'sort' in self.request.arguments:
      sort = json.loads(self.request.arguments['sort'][-1])
      if sort:
        self.globalSort = []
        for i in sort:
          if "LastSignOfLife" not in i['property']:
            self.globalSort += [[str(i['property']), str(i['direction'])]]
    else:
      self.globalSort = [["JobID", "DESC"]]

    gLogger.debug("Request", str(req))
    return req

  @asyncGen
  def web_jobAction(self):
    ids = self.request.arguments["JobID"][0].split(",")
    ids = [int(i) for i in ids]

    RPC = JobManagerClient()
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
      callback = {"success": "true", "result": ""}
    else:
      if "InvalidJobIDs" in result:
        callback = {"success": "false", "error": "Invalid JobIDs: %s" % result["InvalidJobIDs"]}
      elif "NonauthorizedJobIDs" in result:
        callback = {"success": "false", "error": "You are nonauthorized to %s jobs with JobID: %s" %
                    (self.request.arguments["action"][0], result["NonauthorizedJobIDs"])}
      else:
        callback = {"success": "false", "error": result["Message"]}
    self.finish(callback)

  @asyncGen
  def web_jobData(self):
    jobId = int(self.request.arguments["id"][0])
    callback = {}

    if self.request.arguments["data_kind"][0] == "getJDL":
      RPC = JobMonitoringClient()
      result = yield self.threadTask(RPC.getJobJDL, jobId, False)
      if result["OK"]:
        callback = {"success": "true", "result": result["Value"]}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getBasicInfo":
      RPC = JobMonitoringClient()
      result = yield self.threadTask(RPC.getJobSummary, jobId)
      if result["OK"]:
        items = []
        for key, value in result["Value"].items():
          items.append([key, value])
        callback = {"success": "true", "result": items}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getParams":
      RPC = JobMonitoringClient()
      result = yield self.threadTask(RPC.getJobParameters, jobId)
      if result["OK"]:
        attr = result["Value"].get(jobId, {})
        items = []
        for i in attr.items():
          if i[0] == "Log URL":  # the link has to be opened in a new tab.
            items.append([i[0], i[1].replace('>', ' target="_blank">')])
          elif i[0] != "StandardOutput":
            items.append([i[0], i[1]])

        callback = {"success": "true", "result": items}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getLoggingInfo":
      RPC = JobMonitoringClient()
      result = yield self.threadTask(RPC.getJobLoggingInfo, jobId)
      if result["OK"]:
        callback = {"success": "true", "result": result["Value"]}
      else:
        callback = {"success": "false", "error": result["Message"]}

    elif self.request.arguments["data_kind"][0] == "getStandardOutput":
      RPC = JobMonitoringClient()
      result = yield self.threadTask(RPC.getJobParameters, jobId)
      attr = result["Value"].get(jobId, {})
      if result["OK"]:
        if "StandardOutput" in attr:
          callback = {"success": "true", "result": attr["StandardOutput"]}
        else:
          callback = {"success": "false", "error": "Not accessible yet"}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getPending":

      result = yield self.threadTask(ReqClient().readRequestsForJobs, [jobId])

      if result["OK"]:
        items = {}
        if jobId in result['Value']['Successful']:
          result = result['Value']['Successful'][jobId].getDigest()
          if result['OK']:
            items["PendingRequest"] = result['Value']
          else:
            raise WErr.fromSERROR(result)
          callback = {"success": "true", "result": items}
        elif jobId in result['Value']['Failed']:  # when no request associated to the job
          callback = {"success": "false", "error": result['Value']["Failed"][jobId]}
        else:
          callback = {"success": "false", "error": "No request found with unknown reason"}
      else:
        callback = {"success": "false", "error": result["Message"]}

    elif self.request.arguments["data_kind"][0] == "getLogURL":
      RPC = JobMonitoringClient()
      result = yield self.threadTask(RPC.getJobParameters, jobId)
      if result["OK"]:
        attr = result["Value"].get(jobId, {})
        if "Log URL" in attr:
          url = attr["Log URL"].split('"')
          if 'https:' not in url[1]:
            # we can not open non secured URL
            httpsUrl = url[1].replace('http', 'https')
          else:
            httpsUrl = url[1]
          callback = {"success": "true", "result": httpsUrl}
        else:
          callback = {"success": "false", "error": "No URL found"}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getStagerReport":
      RPC = JobMonitoringClient()
      result = yield self.threadTask(RPC.getJobParameters, jobId)
      if result["OK"]:
        attr = result["Value"].get(jobId, {})
        if "StagerReport" in attr:
          callback = {"success": "true", "result": attr["StagerReport"]}
        else:
          callback = {"success": "false", "error": "StagerReport not available"}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getPilotStdOut":
      result = yield self.threadTask(WMSAdministratorClient().getJobPilotOutput, jobId)
      if result["OK"]:
        if "StdOut" in result["Value"]:
          callback = {"success": "true", "result": result["Value"]["StdOut"]}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getPilotStdErr":
      result = yield self.threadTask(WMSAdministratorClient().getJobPilotOutput, jobId)
      if result["OK"]:
        if "StdErr" in result["Value"]:
          callback = {"success": "true", "result": result["Value"]["StdErr"]}
      else:
        callback = {"success": "false", "error": result["Message"]}
    elif self.request.arguments["data_kind"][0] == "getPilotLoggingInfo":
      retVal = yield self.threadTask(PilotManagerClient().getPilots, int(jobId))
      if retVal['OK']:
        pilotReference = list(retVal['Value'])[0]
        retVal = yield self.threadTask(PilotManagerClient().getPilotLoggingInfo, pilotReference)
        if retVal["OK"]:
          callback = {"success": "true", "result": retVal["Value"]}
        else:
          callback = {"success": "false", "error": retVal["Message"]}
      else:
        callback = {"success": "false", "error": retVal["Message"]}
    self.finish(callback)

  @asyncGen
  def web_getStatisticsData(self):
    req = self._request()

    paletteColor = Palette()

    RPC = JobMonitoringClient()

    selector = self.request.arguments["statsField"][0]

    if selector == "Minor Status":
      selector = "MinorStatus"
    elif selector == "Application Status":
      selector = "ApplicationStatus"
    elif selector == "Job Group":
      selector = "JobGroup"
    elif selector == "Owner Group":
      selector = "OwnerGroup"
    elif selector == "Job Type":
      selector = "JobType"

    result = yield self.threadTask(RPC.getJobStats, selector, req)

    if result["OK"]:
      callback = []
      result = dict(result["Value"])
      keylist = sorted(result)
      if selector == "Site":
        tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
        if tier1:
          tier1.sort()
          for i in tier1:
            if i in result:
              countryCode = i.rsplit(".", 1)[1]
              callback.append(
                  {"key": i, "value": result[i], "code": countryCode, "color": paletteColor.getColor(countryCode)})
      for key in keylist:
        if selector == "Site" and tier1:
          if key not in tier1:
            try:
              countryCode = key.rsplit(".", 1)[1]
            except BaseException:
              countryCode = "Unknown"
            callback.append(
                {"key": key, "value": result[key], "code": countryCode, "color": paletteColor.getColor(key)})
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

  @asyncGen
  def web_getSandbox(self):
    if 'jobID' not in self.request.arguments:
      self.finish({"success": "false", "error": "Maybe you forgot the jobID ?"})
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
      self.finish({"success": "false", "error": "Error: %s" % result['Message']})
      return

    if "check" in self.request.arguments:
      self.finish({"success": "true"})
      return

    data = result['Value']
    fname = "%s_%sSandbox.tar" % (str(jobID), sbType)
    self.set_header('Content-type', 'application/x-tar')
    self.set_header('Content-Disposition', 'attachment; filename="%s"' % fname)
    self.set_header('Content-Length', len(data))
    self.set_header('Cache-Control', "no-cache, no-store, must-revalidate, max-age=0")
    self.set_header('Pragma', "no-cache")
    self.finish(data)
