
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR
from DIRAC.Core.Security import CS
from DIRAC.Core.Utilities import Time, List, DictCache
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
import simplejson
import json
import ast

class AccountingPlotHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  __keysCache = DictCache()
     
  def __getUniqueKeyValues( self, typeName ):
    sessionData = SessionData().getData()
    userGroup = sessionData["user"]["group"]
    if 'NormalUser' in CS.getPropertiesForGroup( userGroup ):
      cacheKey = ( sessionData["user"]["username"], userGroup, sessionData["setup"], typeName )
    else:
      cacheKey = ( userGroup, sessionData["setup"], typeName )
    data = AccountingPlotHandler.__keysCache.get( cacheKey )
    if not data:
      rpcClient = RPCClient( "Accounting/ReportGenerator" )
      retVal = rpcClient.listUniqueKeyValues( typeName )
      if 'rpcStub' in retVal:
        del( retVal[ 'rpcStub' ] )
      if not retVal[ 'OK' ]:
        return retVal

      #Site ordering based on TierLevel / alpha
      if 'Site' in retVal[ 'Value' ]:
        siteLevel = {}
        for siteName in retVal[ 'Value' ][ 'Site' ]:
          sitePrefix = siteName.split( "." )[0].strip()
          level = gConfig.getValue( "/Resources/Sites/%s/%s/MoUTierLevel" % ( sitePrefix, siteName ), 10 )
          if level not in siteLevel:
            siteLevel[ level ] = []
          siteLevel[ level ].append( siteName )
        orderedSites = []
        for level in sorted( siteLevel ):
          orderedSites.extend( sorted( siteLevel[ level ] ) )
        retVal[ 'Value' ][ 'Site' ] = orderedSites
      data = retVal
      AccountingPlotHandler.__keysCache.add( cacheKey, 300, data )
    return data
  
  def web_getSelectionData(self):
    callback = {}
    typeName = self.request.arguments["type"][0]
    #Get unique key values
    retVal = self.__getUniqueKeyValues( typeName )
    if not retVal[ 'OK' ]:
      self.write(json.dumps({"success":"false", "result":"", "error":retVal[ 'Message' ]}))
      return
    callback["selectionValues"] = simplejson.dumps( retVal[ 'Value' ] )
    #Cache for plotsList?
    data = AccountingPlotHandler.__keysCache.get( "reportsList:%s" % typeName )
    if not data:
      repClient = ReportsClient( rpcClient = RPCClient( "Accounting/ReportGenerator" ) )
      retVal = repClient.listReports( typeName )
      if not retVal[ 'OK' ]:
        self.write(json.dumps({"success":"false", "result":"", "error":retVal[ 'Message' ]}))
        return
      data = simplejson.dumps( retVal[ 'Value' ] )
      AccountingPlotHandler.__keysCache.add( "reportsList:%s" % typeName, 300, data )
    callback["plotsList"] = data
    self.write(json.dumps({"success":"true", "result":callback}))
  
