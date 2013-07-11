
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.TransferClient import TransferClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR
from DIRAC.Core.Security import CS
from DIRAC.Core.Utilities import Time, List, DictCache
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
import tempfile
import datetime
import json

try:
  from hashlib import md5
except:
  from md5 import md5

class AccountingPlotOldHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  __keysCache = DictCache.DictCache()

  def __getUniqueKeyValues( self, typeName ):
    sessionData = SessionData().getData()
    userGroup = sessionData["user"]["group"]
    if 'NormalUser' in CS.getPropertiesForGroup( userGroup ):
      cacheKey = ( sessionData["user"]["username"], userGroup, sessionData["setup"], typeName )
    else:
      cacheKey = ( userGroup, sessionData["setup"], typeName )
    data = AccountingPlotOldHandler.__keysCache.get( cacheKey )
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
      AccountingPlotOldHandler.__keysCache.add( cacheKey, 300, data )
    return data

  def web_getSelectionData(self):
    callback = {}
    typeName = self.request.arguments["type"][0]
    #Get unique key values
    retVal = self.__getUniqueKeyValues( typeName )
    if not retVal[ 'OK' ]:
      self.write(json.dumps({"success":"false", "result":"", "error":retVal[ 'Message' ]}))
      return
    callback["selectionValues"] = json.dumps( retVal[ 'Value' ] )
    #Cache for plotsList?
    data = AccountingPlotOldHandler.__keysCache.get( "reportsList:%s" % typeName )
    if not data:
      repClient = ReportsClient( rpcClient = RPCClient( "Accounting/ReportGenerator" ) )
      retVal = repClient.listReports( typeName )
      if not retVal[ 'OK' ]:
        self.write(json.dumps({"success":"false", "result":"", "error":retVal[ 'Message' ]}))
        return
      data = json.dumps( retVal[ 'Value' ] )
      AccountingPlotOldHandler.__keysCache.add( "reportsList:%s" % typeName, 300, data )
    callback["plotsList"] = data
    self.write(json.dumps({"success":"true", "result":callback}))

  def __parseFormParams(self):
    params = self.request.arguments
    pD = {}
    extraParams = {}
    pinDates = False

    for name in params:
      if name.find( "_" ) != 0:
        continue
      value = params[ name ][0]
      name = name[1:]
      pD[ name ] = str( value )

    print pD
    #Personalized title?
    if 'plotTitle' in pD:
      extraParams[ 'plotTitle' ] = pD[ 'plotTitle' ]
      del( pD[ 'plotTitle' ] )
    #Pin dates?
    if 'pinDates' in pD:
      pinDates = pD[ 'pinDates' ]
      del( pD[ 'pinDates' ] )
      pinDates = pinDates.lower() in ( "yes", "y", "true", "1" )
    #Get plotname
    if not 'grouping' in pD:
      return S_ERROR( "Missing grouping!" )
    grouping = pD[ 'grouping' ]
    #Get plotname
    if not 'typeName' in pD:
      return S_ERROR( "Missing type name!" )
    typeName = pD[ 'typeName' ]
    del( pD[ 'typeName' ] )
    #Get plotname
    if not 'plotName' in pD:
      return S_ERROR( "Missing plot name!" )
    reportName = pD[ 'plotName' ]
    del( pD[ 'plotName' ] )
    #Get times
    if not 'timeSelector' in pD:
      return S_ERROR( "Missing time span!" )
    #Find the proper time!
    pD[ 'timeSelector' ] = int( pD[ 'timeSelector' ] )
    if pD[ 'timeSelector' ] > 0:
      end = Time.dateTime()
      start = end - datetime.timedelta( seconds = pD[ 'timeSelector' ] )
      if not pinDates:
        extraParams[ 'lastSeconds' ] = pD[ 'timeSelector' ]
    else:
      if 'endTime' not in pD:
        end = False
      else:
        end = Time.fromString( pD[ 'endTime' ] )
        del( pD[ 'endTime' ] )
      if 'startTime' not in pD:
        return S_ERROR( "Missing starTime!" )
      else:
        start = Time.fromString( pD[ 'startTime' ] )
        del( pD[ 'startTime' ] )
    del( pD[ 'timeSelector' ] )

    for k in pD:
      if k.find( "ex_" ) == 0:
        extraParams[ k[3:] ] = pD[ k ]
    #Listify the rest
    for selName in pD:
      pD[ selName ] = List.fromChar( pD[ selName ], "," )
    return S_OK( ( typeName, reportName, start, end, pD, grouping, extraParams ) )

  def web_generatePlot( self ):
    callback = {}
    retVal =  self.__queryForPlot()
    if retVal[ 'OK' ]:
      callback = { 'success' : True, 'data' : retVal[ 'Value' ][ 'plot' ] }
    else:
      callback = { 'success' : False, 'errors' : retVal[ 'Message' ] }
    self.write(json.dumps(callback))

  def __queryForPlot( self ):
    retVal = self.__parseFormParams()
    if not retVal[ 'OK' ]:
      return retVal
    params = retVal[ 'Value' ]
    repClient = ReportsClient( rpcClient = RPCClient( "Accounting/ReportGenerator" ) )
    retVal = repClient.generateDelayedPlot( *params )
    return retVal

  @asyncGen
  def web_getPlotImg( self ):
    """
    Get plot image
    """
    callback = {}
    if 'file' not in self.request.arguments:
      callback = {"success":"false","error":"Maybe you forgot the file?"}
      self.finish(json.dumps(callback))
      return
    plotImageFile = str( self.request.arguments[ 'file' ][0] )
    if plotImageFile.find( ".png" ) < -1:
      callback = {"success":"false","error":"Not a valid image!"}
      self.finish(json.dumps(callback))
      return
    transferClient = TransferClient( "Accounting/ReportGenerator" )
    tempFile = tempfile.TemporaryFile()
    retVal = yield self.threadTask(transferClient.receiveFile, tempFile, plotImageFile)
    if not retVal[ 'OK' ]:
      callback = {"success":"false","error":retVal[ 'Message' ]}
      self.finish(json.dumps(callback))
      return
    tempFile.seek( 0 )
    data = tempFile.read()
    self.set_header('Content-type','image/png')
    self.set_header('Content-Disposition','attachment; filename="%s.png"' % md5( plotImageFile ).hexdigest())
    self.set_header('Content-Length',len( data ))
    self.set_header('Content-Transfer-Encoding','Binary')
    self.set_header('Cache-Control',"no-cache, no-store, must-revalidate, max-age=0")
    self.set_header('Pragma',"no-cache")
    self.set_header('Expires', ( datetime.datetime.utcnow() - datetime.timedelta( minutes = -10 ) ).strftime( "%d %b %Y %H:%M:%S GMT" ))
    self.finish(data)

  @asyncGen
  def web_getCsvPlotData( self ):
    callback = {}
    retVal = self.__parseFormParams()
    if not retVal[ 'OK' ]:
      callback = {"success":"false","error":retVal[ 'Message' ]}
      self.finish(callback)
    params = retVal[ 'Value' ]
    repClient = ReportsClient( rpcClient = RPCClient( "Accounting/ReportGenerator" ) )
    retVal = yield self.threadTask(repClient.getReport, *params )
    if not retVal[ 'OK' ]:
      callback = {"success":"false","error":retVal[ 'Message' ]}
      self.finish(callback)
    rawData = retVal[ 'Value' ]
    groupKeys = rawData[ 'data' ].keys()
    groupKeys.sort()
#     print rawData['data']
    if 'granularity' in rawData:
      granularity = rawData[ 'granularity' ]
      data = rawData['data']
      tS = int( Time.toEpoch( params[2] ) )
      timeStart = tS - tS % granularity
      strData = "epoch,%s\n" % ",".join( groupKeys )
      for timeSlot in range( timeStart, int( Time.toEpoch( params[3] ) ), granularity ):
        lineData = [ str( timeSlot ) ]
        for key in groupKeys:
          if timeSlot in data[ key ]:
            lineData.append( str( data[ key ][ timeSlot ] ) )
          else:
            lineData.append( "" )
        strData += "%s\n" % ",".join( lineData )
    else:
      strData = "%s\n" % ",".join( groupKeys )
      strData += ",".join( [ str( rawData[ 'data' ][ k ] ) for k in groupKeys ] )
    self.set_header('Content-type','text/csv')
    self.set_header('Content-Disposition', 'attachment; filename="%s.csv"' % md5( str( params ) ).hexdigest())
    self.set_header('Content-Length', len( strData ))
    self.finish(strData)

  @asyncGen
  def web_getPlotData( self ):
    callback = {}
    retVal = self.__parseFormParams()
    if not retVal[ 'OK' ]:
      callback = {"success":"false","error":retVal[ 'Message' ]}
      self.finish(callback)
    params = retVal[ 'Value' ]
    repClient = ReportsClient( rpcClient = RPCClient( "Accounting/ReportGenerator" ) )
    retVal = yield self.threadTask(repClient.getReport, *params )
    if not retVal[ 'OK' ]:
      callback = {"success":"false","error":retVal[ 'Message' ]}
      self.finish(callback)
    rawData = retVal[ 'Value' ]
    groupKeys = rawData[ 'data' ].keys()
    groupKeys.sort()
    self.finish(json.dumps(rawData['data']))