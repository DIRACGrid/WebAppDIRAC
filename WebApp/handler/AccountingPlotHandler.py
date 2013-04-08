
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from WebAppDIRAC.Lib.TransferClient import TransferClient
from DIRAC import gConfig, S_OK, S_ERROR
from DIRAC.Core.Security import CS
from DIRAC.Core.Utilities import Time, List, DictCache
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient
import tempfile
import datetime
import simplejson
import json
import ast

class AccountingPlotHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  __keysCache = DictCache.DictCache()

  #OK
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

  #OK
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

  
  def plotPage( self ):
    try:
      typeName = str( self.request.arguments[ 'typeName' ][0] )
    except:
      c.errorMessage = "Oops. missing type"
      return render( "/error.mako" )

    return self.__showPlotPage( typeName , "/systems/accounting/%s.mako" % typeName )

  #OK code; DONT KNOW FOR WHAT DOES IT SERVE?
  def getKeyValuesForType( self ):
    try:
      typeName = str( self.request.arguments[ 'typeName' ][0] )
    except:
      return S_ERROR( "Missing or invalid type name!" )
    retVal = self.__getUniqueKeyValues( typeName )
    if not retVal[ 'OK' ] and 'rpcStub' in retVal:
      del( retVal[ 'rpcStub' ] )
    return retVal

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
  
  #OK
  def __queryForPlot( self ):
    retVal = self.__parseFormParams()
    if not retVal[ 'OK' ]:
      return retVal
    params = retVal[ 'Value' ]
    repClient = ReportsClient( rpcClient = RPCClient( "Accounting/ReportGenerator" ) )
    retVal = repClient.generateDelayedPlot( *params )
    return retVal

  def getPlotData( self ):
    retVal = self.__parseFormParams()
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )
    params = retVal[ 'Value' ]
    repClient = ReportsClient( rpcClient = RPCClient( "Accounting/ReportGenerator" ) )
    retVal = repClient.getReport( *params )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )
    rawData = retVal[ 'Value' ]
    groupKeys = rawData[ 'data' ].keys()
    groupKeys.sort()
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
    response.headers['Content-type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename="%s.csv"' % md5( str( params ) ).hexdigest()
    response.headers['Content-Length'] = len( strData )
    return strData

  #OK
  def __translateToExpectedExtResult( self, retVal ):
    if retVal[ 'OK' ]:
      return { 'success' : True, 'data' : retVal[ 'Value' ][ 'plot' ] }
    else:
      return { 'success' : False, 'errors' : retVal[ 'Message' ] }
  #OK  
  def generatePlot( self ):
    return self.__translateToExpectedExtResult( self.__queryForPlot() )
  
  #OK
  def generatePlotAndGetHTML( self ):
    retVal = self.__queryForPlot()
    if not retVal[ 'OK' ]:
      return "<h2>Can't regenerate plot: %s</h2>" % retVal[ 'Message' ]
    return "<img src='getPlotImg?file=%s'/>" % retVal[ 'Value' ][ 'plot' ]
  
  #-----NOK-----
  def getPlotImg( self ):
    """
    Get plot image
    """
    if 'file' not in self.request.arguments:
      c.error = "Maybe you forgot the file?"
      return render( "/error.mako" )
    plotImageFile = str( self.request.arguments[ 'file' ][0] )
    if plotImageFile.find( ".png" ) < -1:
      c.error = "Not a valid image!"
      return render( "/error.mako" )
    transferClient = TransferClient( "Accounting/ReportGenerator" )
    tempFile = tempfile.TemporaryFile()
    retVal = transferClient.receiveFile( tempFile, plotImageFile )
    if not retVal[ 'OK' ]:
      c.error = retVal[ 'Message' ]
      return render( "/error.mako" )
    tempFile.seek( 0 )
    data = tempFile.read()
    response.headers['Content-type'] = 'image/png'
    response.headers['Content-Disposition'] = 'attachment; filename="%s.png"' % md5( plotImageFile ).hexdigest()
    response.headers['Content-Length'] = len( data )
    response.headers['Content-Transfer-Encoding'] = 'Binary'
    response.headers['Cache-Control'] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers['Pragma'] = "no-cache"
    response.headers['Expires'] = ( datetime.datetime.utcnow() - datetime.timedelta( minutes = -10 ) ).strftime( "%d %b %Y %H:%M:%S GMT" )
    return data
    
