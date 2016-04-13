
from DIRAC.WorkloadManagementSystem.Client.SandboxStoreClient import SandboxStoreClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time
from WebAppDIRAC.WebApp.handler.Palette import Palette
from DIRAC.RequestManagementSystem.Client.Request import Request
from DIRAC.Core.Utilities import DictCache

import json


class JobMonitorHandler( WebHandler ):

  AUTH_PROPS = "authenticated"
  
  __dataCache = DictCache.DictCache()
  
  @asyncGen
  def web_getJobData( self ):
    RPC = RPCClient( "WorkloadManagement/JobMonitoring", timeout = 600 )
    req = self._request()

    result = yield self.threadTask( RPC.getJobPageSummaryWeb, req, self.globalSort , self.pageNumber, self.numberOfJobs )

    if not result["OK"]:
      self.finish( {"success":"false", "result":[], "total":0, "error":result["Message"]} )
      return

    result = result["Value"]

    if not result.has_key( "TotalRecords" ):
      self.finish( {"success":"false", "result":[], "total":-1, "error":"Data structure is corrupted"} )
      return


    if not ( result["TotalRecords"] > 0 ):
      self.finish( {"success":"false", "result":[], "total":0, "error":"There were no data matching your selection"} )
      return


    if not ( result.has_key( "ParameterNames" ) and result.has_key( "Records" ) ):
      self.finish( {"success":"false", "result":[], "total":-1, "error":"Data structure is corrupted"} )
      return

    if not ( len( result["ParameterNames"] ) > 0 ):
      self.finish( {"success":"false", "result":[], "total":-1, "error":"ParameterNames field is missing"} )
      return

    if not ( len( result["Records"] ) > 0 ):
      self.finish( {"success":"false", "result":[], "total":0, "Message":"There are no data to display"} )
      return

    callback = []
    jobs = result["Records"]
    head = result["ParameterNames"]
    headLength = len( head )
    for i in jobs:
      tmp = {}
      for j in range( 0, headLength ):
        tmp[head[j]] = i[j]
      callback.append( tmp )
    total = result["TotalRecords"]
    extra = None
    if result.has_key( "Extras" ):
      st = self.__dict2string( {} )
      extra = result["Extras"]
      timestamp = Time.dateTime().strftime( "%Y-%m-%d %H:%M [UTC]" )
      extra['date'] = timestamp
      
    callback = {"success":"true", "result":callback, "total":total, "extra":extra }
    self.finish( callback )

  def __dict2string( self, req ):
    result = ""
    try:
      for key, value in req.iteritems():
        result = result + str( key ) + ": " + ", ".join( value ) + "; "
    except Exception, x:
      pass
      gLogger.info( "\033[0;31m Exception: \033[0m %s" % x )
    result = result.strip()
    result = result[:-1]
    return result
  
  @asyncGen
  def web_getSelectionData( self ):
    sData = self.getSessionData()

    user = sData["user"]["username"]
    if user == "Anonymous":
      callback["prod"] = [["Insufficient rights"]]
    else:
      cacheKey = ( sData["user"].get( "group", "" ),
                   sData["setup"] )
      
      callback = JobMonitorHandler.__dataCache.get( cacheKey )
      if not callback:
        callback = {}
        RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
        result = yield self.threadTask( RPC.getProductionIds )
        if result["OK"]:
          prod = []
          prods = result["Value"]
          if len( prods ) > 0:
            prods.sort( reverse = True )
            prod = [ [ i ] for i in prods ]
          else:
            prod = [["Nothing to display"]]
        else:
          gLogger.error( "RPC.getProductionIds() return error: %s" % result["Message"] )
          prod = [["Error happened on service side"]]
        callback["prod"] = prod
  
        RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
        result = yield self.threadTask( RPC.getSites )
        if result["OK"]:
          tier1 = gConfig.getValue( "/WebApp/PreferredSites", [] )  # Always return a list
          site = []
          if len( result["Value"] ) > 0:
            s = list( result["Value"] )
            for i in tier1:
              site.append( [str( i )] )
            for i in s:
              if i not in tier1:
                site.append( [str( i )] )
          else:
            site = [["Nothing to display"]]
        else:
          gLogger.error( "RPC.getSites() return error: %s" % result["Message"] )
          site = [["Error happened on service side"]]
        callback["site"] = site
    # ##
        result = yield self.threadTask( RPC.getStates )
        if result["OK"]:
          stat = []
          if len( result["Value"] ) > 0:
            for i in result["Value"]:
              stat.append( [str( i )] )
          else:
            stat = [["Nothing to display"]]
        else:
          gLogger.error( "RPC.getStates() return error: %s" % result["Message"] )
          stat = [["Error happened on service side"]]
        callback["status"] = stat
    # ##
        result = yield self.threadTask( RPC.getMinorStates )
        if result["OK"]:
          stat = []
          if len( result["Value"] ) > 0:
            for i in result["Value"]:
              stat.append( [i] )
          else:
            stat = [["Nothing to display"]]
        else:
          gLogger.error( "RPC.getMinorStates() return error: %s" % result["Message"] )
          stat = [["Error happened on service side"]]
        callback["minorstat"] = stat
    # ##
        result = yield self.threadTask( RPC.getApplicationStates )
        if result["OK"]:
          app = []
          if len( result["Value"] ) > 0:
            for i in result["Value"]:
              app.append( [i] )
          else:
            app = [["Nothing to display"]]
        else:
          gLogger.error( "RPC.getApplicationstates() return error: %s" % result["Message"] )
          app = [["Error happened on service side"]]
        callback["app"] = app
    # ##
        result = yield self.threadTask( RPC.getJobTypes )
        if result["OK"]:
          types = []
          if len( result["Value"] ) > 0:
            for i in result["Value"]:
              types.append( [i] )
          else:
            types = [["Nothing to display"]]
        else:
          gLogger.error( "RPC.getJobTypes() return error: %s" % result["Message"] )
          types = [["Error happened on service side"]]
        callback["types"] = types
    # ##
        # groupProperty = credentials.getProperties(group)
        if user == "Anonymous":
          callback["owner"] = [["Insufficient rights"]]
        else:
          result = yield self.threadTask( RPC.getOwners )
          if result["OK"]:
            owner = []
            if len( result["Value"] ) > 0:
              for i in result["Value"]:
                owner.append( [str( i )] )
            else:
              owner = [["Nothing to display"]]
          elif 'NormalUser' in  sData['user']['properties']:
            owner = [[user]]
            callback["owner"] = owner
          else:
              gLogger.error( "RPC.getOwners() return error: %s" % result["Message"] )
              owner = [["Error happened on service side"]]
          callback["owner"] = owner
    
        result = yield self.threadTask( RPC.getOwnerGroup )
        if result['OK']:
          callback['OwnerGroup'] = [ [group] for group in result['Value']]
        
        JobMonitorHandler.__dataCache.add( cacheKey, 360, callback )

    self.finish( callback )

  def _request( self ):
    self.pageNumber = 0
    self.numberOfJobs = 25
    self.globalSort = [["JobID", "DESC"]]

    req = {}

    if self.request.arguments.has_key( "limit" ) and len( self.request.arguments["limit"][0] ) > 0:
      self.numberOfJobs = int( self.request.arguments["limit"][0] )
      if self.request.arguments.has_key( "start" ) and len( self.request.arguments["start"][0] ) > 0:
        self.pageNumber = int( self.request.arguments["start"][0] )
      else:
        self.pageNumber = 0

    if "JobID" in self.request.arguments:
      jobids = list( json.loads( self.request.arguments[ 'JobID' ][-1] ) )
      if len( jobids ) > 0:
        req['JobID'] = jobids


    if "jobGroup" in self.request.arguments:
      prodids = list( json.loads( self.request.arguments[ 'jobGroup' ][-1] ) )
      if len( prodids ) > 0:
        req['JobGroup'] = prodids

    if "site" in self.request.arguments:
      sites = list( json.loads( self.request.arguments[ 'site' ][-1] ) )
      if len( sites ) > 0:
        req["Site"] = sites

    if "status" in self.request.arguments:
      status = list( json.loads( self.request.arguments[ 'status' ][-1] ) )
      if len( status ) > 0:
        req["Status"] = status

    if "minorStatus" in self.request.arguments:
      minorstat = list( json.loads( self.request.arguments[ 'minorStatus' ][-1] ) )
      if len( minorstat ) > 0:
        req["MinorStatus"] = minorstat

    if "appStatus" in self.request.arguments:
      apps = list( json.loads( self.request.arguments[ 'appStatus' ][-1] ) )
      if len( apps ) > 0:
        req["ApplicationStatus"] = apps

    if "jobType" in self.request.arguments:
      types = list( json.loads( self.request.arguments[ 'jobType' ][-1] ) )
      if len( types ) > 0:
        req["JobType"] = types

    if "owner" in self.request.arguments:
      owner = list( json.loads( self.request.arguments[ 'owner' ][-1] ) )
      if len( owner ) > 0:
        req["Owner"] = owner

    if "OwnerGroup" in self.request.arguments:
      ownerGroup = list( json.loads( self.request.arguments[ 'OwnerGroup' ][-1] ) )
      if len( ownerGroup ) > 0:
        req["OwnerGroup"] = ownerGroup

    if 'startDate' in self.request.arguments and len( self.request.arguments["startDate"][0] ) > 0:
      if 'startTime' in self.request.arguments and len( self.request.arguments["startTime"][0] ) > 0:
        req["FromDate"] = str( self.request.arguments["startDate"][0] + " " + self.request.arguments["startTime"][0] )
      else:
        req["FromDate"] = str( self.request.arguments["startDate"][0] )

    if 'endDate' in self.request.arguments and len( self.request.arguments["endDate"][0] ) > 0:
      if 'endTime' in self.request.arguments and len( self.request.arguments["endTime"][0] ) > 0:
        req["ToDate"] = str( self.request.arguments["endDate"][0] + " " + self.request.arguments["endTime"][0] )
      else:
        req["ToDate"] = str( self.request.arguments["endDate"][0] )

    if 'date' in self.request.arguments and len( self.request.arguments["date"][0] ) > 0:
      req["LastUpdate"] = str( self.request.arguments["date"][0] )

    if 'sort' in self.request.arguments:
      sort = json.loads( self.request.arguments['sort'][-1] )
      if len( sort ) > 0:
        self.globalSort = []
        for i in sort :
          if "LastSignOfLife" not in i['property']:
            self.globalSort += [[str( i['property'] ), str( i['direction'] )]]
    else:
      self.globalSort = [["JobID", "DESC"]]

    gLogger.debug( "Request", str( req ) )
    return req

  @asyncGen
  def web_jobAction( self ):
    ids = self.request.arguments["JobID"][0].split( "," )
    ids = [int( i ) for i in ids ]

    RPC = RPCClient( "WorkloadManagement/JobManager" )
    if self.request.arguments["action"][0] == "delete":
      result = yield self.threadTask( RPC.deleteJob, ids )
    elif self.request.arguments["action"][0] == "kill":
      result = yield self.threadTask( RPC.killJob, ids )
    elif self.request.arguments["action"][0] == "reschedule":
      result = yield self.threadTask( RPC.rescheduleJob, ids )
    elif self.request.arguments["action"][0] == "reset":
      result = yield self.threadTask( RPC.resetJob, ids )

    callback = {}
    if result["OK"]:
      callback = {"success":"true", "result":""}
    else:
      if result.has_key( "InvalidJobIDs" ):
        callback = {"success":"false", "error":"Invalid JobIDs: %s" % result["InvalidJobIDs"]}
      elif result.has_key( "NonauthorizedJobIDs" ):
        callback = {"success":"false", "error":"You are nonauthorized to %s jobs with JobID: %s" % ( self.request.arguments["action"][0], result["NonauthorizedJobIDs"] )}
      else:
        callback = {"success":"false", "error":result["Message"]}
    self.finish( callback )

  @asyncGen
  def web_jobData( self ):
    jobId = int( self.request.arguments["id"][0] )
    callback = {}

    if self.request.arguments["data_kind"][0] == "getJDL":
      RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
      result = yield self.threadTask( RPC.getJobJDL, jobId, False )
      if result["OK"]:
        callback = {"success":"true", "result":result["Value"]}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getBasicInfo":
      RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
      result = yield self.threadTask( RPC.getJobSummary, jobId )
      if result["OK"]:
        items = []
        for key, value in result["Value"].items():
          items.append( [key, value] )
        callback = {"success":"true", "result":items}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getParams":
      RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
      result = yield self.threadTask( RPC.getJobParameters, jobId )
      if result["OK"]:
        attr = result["Value"]
        items = []
        for i in attr.items():
          if i[0] == "Log URL":  # the link has to be opened in a new tab.
            items.append( [i[0], i[1].replace( '>', ' target="_blank">' )] )
          elif i[0] != "StandardOutput":
            items.append( [i[0], i[1]] )

        callback = {"success":"true", "result":items}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getLoggingInfo":
      RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
      result = yield self.threadTask( RPC.getJobLoggingInfo, jobId )
      if result["OK"]:
        callback = {"success":"true", "result":result["Value"]}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getStandardOutput":
      RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
      result = yield self.threadTask( RPC.getJobParameters, jobId )
      attr = result["Value"]
      if result["OK"]:
        if attr.has_key( "StandardOutput" ):
          callback = {"success":"true", "result":attr["StandardOutput"]}
        else:
          callback = {"success":"false", "error":"Not accessible yet"}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getPending":
      RPC = RPCClient( "RequestManagement/ReqManager" )

      result = yield self.threadTask( RPC.readRequestsForJobs, [jobId] )

      if result["OK"]:
        items = {}
        if jobId in result['Value']['Successful']:
          req = Request( result['Value']['Successful'][jobId] ).getDigest()['Value']
          items["PendingRequest"] = req
          callback = {"success":"true", "result":items}
        elif jobId in result['Value']['Failed']:  # when no request associated to the job
          callback = {"success":"false", "error":result['Value']["Failed"][jobId]}
        else:
          callback = {"success":"false", "error":"No request found with unknown reason"}
      else:
        callback = {"success":"false", "error":result["Message"]}

    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getLogURL":
      RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
      result = yield self.threadTask( RPC.getJobParameters, jobId )
      if result["OK"]:
        attr = result["Value"]
        if attr.has_key( "Log URL" ):
          url = attr["Log URL"].split( '"' )
          # we can not open non secured URL
          httpsUrl = url[1].replace( 'http', 'https' )
          callback = {"success":"true", "result":httpsUrl}
        else:
          callback = {"success":"false", "error":"No URL found"}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getStagerReport":
      RPC = RPCClient( "WorkloadManagement/JobMonitoring" )
      result = yield self.threadTask( RPC.getJobParameters, jobId )
      if result["OK"]:
        attr = result["Value"]
        if "StagerReport" in attr:
          callback = {"success":"true", "result":attr["StagerReport"]}
        else:
          callback = {"success":"false", "error":"StagerReport not available"}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getPilotStdOut":
      RPC = RPCClient( "WorkloadManagement/WMSAdministrator" )
      result = yield self.threadTask( RPC.getJobPilotOutput, jobId )
      if result["OK"]:
        if result["Value"].has_key( "StdOut" ):
          callback = {"success":"true", "result":result["Value"]["StdOut"]}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getPilotStdErr":
      RPC = RPCClient( "WorkloadManagement/WMSAdministrator" )
      result = yield self.threadTask( RPC.getJobPilotOutput, jobId )
      if result["OK"]:
        if result["Value"].has_key( "StdErr" ):
          callback = {"success":"true", "result":result["Value"]["StdErr"]}
      else:
        callback = {"success":"false", "error":result["Message"]}
    #--------------------------------------------------------------------------------
    elif self.request.arguments["data_kind"][0] == "getPilotLoggingInfo":
      PILOTRPC = RPCClient( "WorkloadManagement/WMSAdministrator" )
      retVal = yield self.threadTask( PILOTRPC.getPilots, int( jobId ) )
      if retVal['OK']:
        pilotReference = retVal['Value'].keys()[0]
        retVal = yield self.threadTask( PILOTRPC.getPilotLoggingInfo, pilotReference )
        if retVal["OK"]:
          callback = {"success":"true", "result":retVal["Value"]}
        else:
          callback = {"success":"false", "error":retVal["Message"]}
      else:
        callback = {"success":"false", "error":retVal["Message"]}
    self.finish( callback )

  @asyncGen
  def web_getStatisticsData( self ):
    req = self._request()

    paletteColor = Palette()

    RPC = RPCClient( "WorkloadManagement/JobMonitoring" )

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

    result = yield self.threadTask( RPC.getJobStats, selector, req )

    if result["OK"]:
      callback = []
      result = dict( result["Value"] )
      keylist = result.keys()
      keylist.sort()
      if selector == "Site":
        tier1 = gConfig.getValue( "/WebApp/PreferredSites", [] )
        if len( tier1 ) > 0:
          tier1.sort()
          for i in tier1:
            if result.has_key( i ):
              countryCode = i.rsplit( ".", 1 )[1]
              callback.append( {"key":i, "value":result[i], "code":countryCode, "color": paletteColor.getColor( countryCode ) } )
      for key in keylist:
        if selector == "Site" and tier1:
          if key not in tier1:
            try:
              countryCode = key.rsplit( ".", 1 )[1]
            except:
              countryCode = "Unknown"
            callback.append( {"key":key, "value":result[key], "code":countryCode, "color": paletteColor.getColor( key ) } )
        elif selector == "Site" and not tier1:
          try:
            countryCode = key.rsplit( ".", 1 )[1]
          except:
            countryCode = "Unknown"
          callback.append( {"key":key, "value":result[key], "code":countryCode, "color": paletteColor.getColor( key ) } )
        else:
          callback.append( {"key":key, "value":result[key], "code":"", "color": paletteColor.getColor( key ) } )
      callback = {"success":"true", "result":callback}
    else:
      callback = {"success":"false", "error":result["Message"]}
    self.finish( callback )

  @asyncGen
  def web_getSandbox( self ):
    if 'jobID' not in self.request.arguments:
      self.finish( {"success":"false", "error":"Maybe you forgot the jobID ?"} )
      return
    jobID = int( self.request.arguments['jobID'][0] )
    sbType = 'Output'
    if 'sandbox' in self.request.arguments:
      sbType = str( self.request.arguments['sandbox'][0] )

    userData = self.getSessionData()

    client = SandboxStoreClient( useCertificates = True,
                                delegatedDN = str( userData["user"]["DN"] ),
                                delegatedGroup = str( userData["user"]["group"] ),
                                setup = userData["setup"] )

    result = yield self.threadTask( client.downloadSandboxForJob, jobID, sbType, inMemory = True )

    if not result['OK']:
      self.finish( {"success":"false", "error":"Error: %s" % result['Message']} )
      return

    if "check" in self.request.arguments:
      self.finish( {"success":"true"} )
      return

    data = result['Value']
    fname = "%s_%sSandbox.tar" % ( str( jobID ), sbType )
    self.set_header( 'Content-type', 'application/x-tar' )
    self.set_header( 'Content-Disposition', 'attachment; filename="%s"' % fname )
    self.set_header( 'Content-Length', len( data ) )
    self.set_header( 'Cache-Control', "no-cache, no-store, must-revalidate, max-age=0" )
    self.set_header( 'Pragma', "no-cache" )
    self.finish( data )
