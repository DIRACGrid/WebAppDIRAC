import base64
import zlib
import json
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.Utilities.List import uniqueElements
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities import Time

class ProxyManagerHandler( WebHandler ):

  AUTH_PROPS = "authenticated"
  
  @asyncGen
  def web_getSelectionData( self ):
    
    sData = self.getSessionData()
    
    callback = {}

    user = sData["user"]["username"]
    if user == "Anonymous":
      self.finish( {"success":"false", "error":"You are not authorize to access these data"} )
      
    if len( self.request.arguments ) > 0:
      tmp = {}
      for i in self.request.arguments:
        tmp[i] = str( self.request.arguments[i] )
      callback["extra"] = tmp
    rpcClient = RPCClient( "Framework/ProxyManager" )
    retVal = yield self.threadTask( rpcClient.getContents, {}, [], 0, 0 )
    if not retVal[ "OK" ]:
      self.finish( {"success":"false", "error":retVal["Message"]} )
    data = retVal[ "Value" ]
    users = []
    groups = []
    for record in data[ "Records" ]:
      users.append( str( record[0] ) )
      groups.append( str( record[2] ) )
    users = uniqueElements( users )
    groups = uniqueElements( groups )
    users.sort()
    groups.sort()
    users = map( lambda x: [x], users )
    groups = map( lambda x: [x], groups )
    
    callback["username"] = users
    callback["usergroup"] = groups
    result = gConfig.getOption( "/Website/ProxyManagementMonitoring/TimeSpan" )
    if result["OK"]:
      tmp = result["Value"]
      tmp = tmp.split( ", " )
      if len( tmp ) > 0:
        timespan = []
        for i in tmp:
          human_readable = self.__humanize_time( i )
          timespan.append( [i, human_readable] )
      else:
        timespan = [["Nothing to display"]]
    else:
      timespan = [["Error during RPC call"]]
    callback["expiredBefore"] = timespan
    callback["expiredAfter"] = timespan
    self.finish( callback )
  
  @asyncGen
  def web_getProxyManagerData( self ):
    sData = self.getSessionData()
    
    callback = {}

    user = sData["user"]["username"]
    if user == "Anonymous":
      self.finish( {"success":"false", "error":"You are not authorize to access these data"} )
    start, limit, sort, req = self.__request()
    rpcClient = RPCClient( "Framework/ProxyManager" )
    retVal = yield self.threadTask( rpcClient.getContents, req, sort, start, limit )
    gLogger.info( "*!*!*!  RESULT: \n%s" % retVal )
    if not retVal[ 'OK' ]:
      self.finish( {"success":"false", "error":retVal["Message"]} )
    svcData = retVal[ 'Value' ]
    proxies = []
    dnMap = {}
    for record in svcData[ 'Records' ]:
      proxies.append( { 'proxyid': "%s@%s" % ( record[1], record[2] ),
                                  'UserName' : str( record[0] ),
                                  'UserDN' : record[1],
                                  'UserGroup' : record[2],
                                  'ExpirationTime' : str( record[3] ),
                                  'PersistentFlag' : str( record[4] ) } )
    timestamp = Time.dateTime().strftime( "%Y-%m-%d %H:%M [UTC]" )
    data = {"success":"true", "result":proxies, "total":svcData[ 'TotalRecords' ], "date":timestamp}
    self.finish( data )

  def __humanize_time( self, sec = False ):
    """
    Converts number of seconds to human readble values. Max return value is 
    "More then a year" year and min value is "One day"
    """
    if not sec:
      return "Time span is not specified"
    try:
      sec = int( sec )
    except:
      return "Value from CS is not integer"
    month, week = divmod( sec, 2592000 )
    if month > 0:
      if month > 12:
        return "More then a year"
      elif month > 1:
        return str( month ) + " months"
      else:
        return "One month"
    week, day = divmod( sec, 604800 )
    if week > 0:
      if week == 1:
        return "One week"
      else:
        return str( week ) + " weeks"
    day, hours = divmod( sec, 86400 )
    if day > 0:
      if day == 1:
        return "One day"
      else:
        return str( day ) + " days"
  
  def __request( self ):
    gLogger.info( "!!!  PARAMS: ", str( self.request.arguments ) )
    req = {}
    
    start = 0
    limit = 25
    
    if self.request.arguments.has_key( "limit" ) and len( self.request.arguments["limit"][0] ) > 0:
      limit = int( self.request.arguments["limit"][0] )
    
    if self.request.arguments.has_key( "start" ) and len( self.request.arguments["start"][0] ) > 0:
        start = int( self.request.arguments["start"][0] )
        
    try:
      sortDirection = str( self.request.arguments[ 'sortDirection' ] ).strip()
    except:
      sortDirection = "ASC"
    try:
      sortField = str( self.request.arguments[ 'sortField' ] ).strip()
    except:
      sortField = "UserName"
    sort = [[sortField, sortDirection]]
    gLogger.info( "!!!  S O R T : ", sort )
    
    if "username" in self.request.arguments:
      users = list( json.loads( self.request.arguments[ 'username' ][-1] ) )
      if len( users ) > 0:
        req['UserName'] = users
        
    if "usergroup" in self.request.arguments:
      usersgroup = list( json.loads( self.request.arguments[ 'usergroup' ][-1] ) )
      if len( usersgroup ) > 0:
        req['UserGroup'] = usersgroup
    
    if "usersgroup" in self.request.arguments and len( self.request.arguments["persistent"] ) > 0:
      if str( self.request.arguments["persistent"] ) in ["True", "False"]:
        req["PersistentFlag"] = str( self.request.arguments["persistent"] )
    before = False
    after = False
    if self.request.arguments.has_key( "expiredBefore" ) and len( self.request.arguments["expiredBefore"] ) > 0:
      try:
        before = int( self.request.arguments["expiredBefore"] )
      except:
        pass
    if self.request.arguments.has_key( "expiredAfter" ) and len( self.request.arguments["expiredAfter"] ) > 0:
      try:
        after = int( self.request.arguments["expiredAfter"] )
      except:
        pass
    if before and after:
      if before > after:
        req["beforeDate"] = before      
        req["afterDate"] = after
    else:
      if before:
        req["beforeDate"] = before
      if after:
        req["afterDate"] = after
    gLogger.always( "REQUEST:", req )
    return ( start, limit, sort, req )
