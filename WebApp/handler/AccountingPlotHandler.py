
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR
from DIRAC.Core.Security import CS
import json
import ast

class AccountingPlotHandler(WebHandler):

  AUTH_PROPS = "authenticated"
     
  def __getUniqueKeyValues( self, typeName ):
    userGroup = getSelectedGroup()
    if 'NormalUser' in CS.getPropertiesForGroup( userGroup ):
      cacheKey = ( getUserName(), userGroup, getSelectedSetup(), typeName )
    else:
      cacheKey = ( userGroup, getSelectedSetup(), typeName )
    data = AccountingplotsController.__keysCache.get( cacheKey )
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
      AccountingplotsController.__keysCache.add( cacheKey, 300, data )
    return data
