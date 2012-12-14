
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
import json

class JobMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  def index(self):
    pass
  
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
