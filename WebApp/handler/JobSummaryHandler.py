from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient

from DIRAC import gLogger

class JobSummaryHandler( WebHandler ):

  AUTH_PROPS = "all"

  @asyncGen
  def web_getSelectionData( self ):
    callback = {}

    RPC = RPCClient("WorkloadManagement/WMSAdministrator")
    result = yield self.threadTask(RPC.getSiteSummarySelectors)
    gLogger.info("\033[0;31m ++++++: \033[0m %s" % result)
    if result["OK"]:
      result = result["Value"]
      if len(result.get("Status", [])) > 0:
        status = []
        status.append([str("All")])
        for i in result["Status"]:
          status.append([str(i)])
      else:
        status = [["Nothing to display"]]
      callback["status"] = status
      if len(result.get("GridType", [])) > 0:
        gridtype = []
        gridtype.append([str("All")])
        for i in result["GridType"]:
          gridtype.append([str(i)])
      else:
        gridtype = [["Nothing to display"]]
      callback["gridtype"] = gridtype
      if len(result.get("MaskStatus", [])) > 0:
        maskstatus = []
        maskstatus.append([str("All")])
        for i in result["MaskStatus"]:
          maskstatus.append([str(i)])
      else:
        maskstatus = [["Nothing to display"]]
      callback["maskstatus"] = maskstatus
      if len(result.get("Site", [])) > 0:
        s = list(result["Site"])
        tier1 = gConfig.getValue("/Website/PreferredSites",[])
        site = list()
        site.append(["All"])
        for i in tier1:
          site.append([str(i)])
        for i in s:
          if i not in tier1:
            site.append([str(i)])
      else:
        site = [["Error during RPC call"]]
      callback["site"] = site
      if len(result.get("Country", [])) > 0:
        country = []
        country.append(["All"])
        countryCode = GeneralController().getCountries()
        for i in result["Country"]:
          if countryCode.has_key(i):
            j = countryCode[i]
          country.append([str(j)])
      else:
        country = [["Nothing to display"]]
      country.sort()
      callback["country"] = country
    else:
      callback["status"] = [["Error during RPC call"]]
      callback["gridtype"] = [["Error during RPC call"]]
      callback["maskstatus"] = [["Error during RPC call"]]
      callback["site"] = [["Error during RPC call"]]
      callback["country"] = [["Error during RPC call"]]
###
    self.finish(callback)