from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.FrameworkSystem.Client.ComponentMonitoringClient import ComponentMonitoringClient
import json
import datetime

class ComponentHistoryHandler( WebHandler ):

  AUTH_PROPS = 'authenticated'

  @asyncGen
  def web_getJobData( self ):

    req = self.__request()

    client = ComponentMonitoringClient()
    result = client.getInstallations( req[ 'installation' ], req[ 'component' ], req[ 'host' ], True )
    if result[ 'OK' ]:
      values = []
      installations = result[ 'Value' ]
      for i in range( self.pageNumber, self.pageNumber + self.numberOfInstallations ):
        if len( installations ) > i:
          installation = installations[ i ]
        else:
          break
        uninstalled = '-'
        if installation[ 'UnInstallationTime' ]:
          uninstalled = installation[ 'UnInstallationTime' ].strftime( '%Y-%m-%d %H:%M' )
        values.append( { 'Name': installation[ 'Instance' ], \
                         'Module': installation[ 'Component' ][ 'Module' ], \
                         'Host': installation[ 'Host' ][ 'HostName' ], \
                         'System': installation[ 'Component' ][ 'System' ], \
                         'Type': installation[ 'Component' ][ 'Type' ], \
                         'Installed': installation[ 'InstallationTime' ].strftime( '%Y-%m-%d %H:%M' ), \
                         'Uninstalled': uninstalled } )
      timestamp = Time.dateTime().strftime( '%Y-%m-%d %H:%M [UTC]' )
      total = len( installations )
      callback = { 'success' : 'true', 'result' : values,
                'total' : total, 'date' : timestamp }
    else:
      callback = { 'success' : 'false' , 'error' : result[ 'Message' ] }
    self.finish( callback )

  @asyncGen
  def web_getSelectionData( self ):

    req = self.__request()

    data = {}
    userData = self.getSessionData()

    setup = userData[ 'setup' ].split( '-' )[-1]
    systemList = []
    system = None

    fields = [ 'name', 'host', 'module', 'system', 'type' ]

    client = ComponentMonitoringClient()
    result = client.getInstallations( {}, {}, {}, True )
    if result[ 'OK' ]:
      for field in fields:
        data[ field ] = set()
      for installation in result[ 'Value' ]:
        data[ 'name' ].add( installation[ 'Instance' ] )
        data[ 'host' ].add( installation[ 'Host' ][ 'HostName' ] )
        data[ 'module' ].add( installation[ 'Component' ][ 'Module' ] )
        data[ 'system' ].add( installation[ 'Component' ][ 'System' ] )
        data[ 'type' ].add( installation[ 'Component' ][ 'Type' ] )

      for field in fields:
        data[ field ] = list( data[ field ] )
        data[ field ].sort()
        data[ field ] = map( lambda x : [x] , data[ field ] )
    else:
      data = { 'success' : 'false' , 'error' : result[ 'Message' ] }

    self.finish( data )

  def __request( self ):
    req = { 'installation': {}, 'component': {}, 'host': {} }

    # Figure out what page we are at and how many results we are displaying
    if 'limit' in self.request.arguments:
      self.numberOfInstallations = int( self.request.arguments[ 'limit' ][-1] )
      if 'start' in self.request.arguments:
        self.pageNumber = int( self.request.arguments[ 'start' ][-1] )
      else:
        self.pageNumber = 0
    else:
      self.numberOfInstallations = 25
      self.pageNumber = 0

    # Check every possible selector

    if 'name' in self.request.arguments:
      print self.request.arguments[ 'name' ][-1]
      req[ 'installation' ][ 'Instance' ] = list( json.loads( self.request.arguments[ 'name' ][-1] ) )

    if 'host' in self.request.arguments:
      print self.request.arguments[ 'host' ][-1]
      req[ 'host' ][ 'HostName' ] = list( json.loads( self.request.arguments[ 'host' ][-1] ) )

    if 'system' in self.request.arguments:
      print self.request.arguments[ 'system' ][-1]
      req[ 'component' ][ 'System' ] = list( json.loads( self.request.arguments[ 'system' ][-1] ) )

    if 'module' in self.request.arguments:
      print self.request.arguments[ 'module' ][-1]
      req[ 'component' ][ 'Module' ] = list( json.loads( self.request.arguments[ 'module' ][-1] ) )

    if 'type' in self.request.arguments:
      print self.request.arguments[ 'type' ][-1]
      req[ 'component' ][ 'Type' ] = list( json.loads( self.request.arguments[ 'type' ][-1] ) )

    if 'startDate' in self.request.arguments and len( self.request.arguments[ 'startDate' ][0] ) > 0:
      if len( self.request.arguments[ 'startTime' ][0] ) > 0:
        time = self.request.arguments[ 'startTime' ][0]
      else:
        time = '00:00'
      date = datetime.datetime.strptime( '%s-%s' % ( self.request.arguments[ 'startDate' ][0], time ), '%Y-%m-%d-%H:%M' )
      req[ 'installation' ][ 'InstallationTime.bigger' ] = date

    if 'endDate' in self.request.arguments and len( self.request.arguments[ 'endDate' ][0] ) > 0:
      if len( self.request.arguments[ 'endTime' ][0] ) > 0:
        time = self.request.arguments[ 'endTime' ][0]
      else:
        time = '00:00'
      date = datetime.datetime.strptime( '%s-%s' % ( self.request.arguments[ 'endDate' ][0], time ), '%Y-%m-%d-%H:%M' )
      req[ 'installation' ][ 'UnInstallationTime.bigger' ] = date

    return req
