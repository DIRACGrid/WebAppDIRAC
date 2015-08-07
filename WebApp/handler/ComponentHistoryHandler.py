from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.FrameworkSystem.Client.ComponentMonitoringClient import ComponentMonitoringClient
from DIRAC.Core.DISET.RPCClient import RPCClient
import json
import datetime

class ComponentHistoryHandler( WebHandler ):

  AUTH_PROPS = 'authenticated'

  @asyncGen
  def web_getInstallationData( self ):
    """
    Retrieves a list of dictionaries containing components to be displayed by the Component History page
    """
    # Get the selectors values
    req = self.__request()

    client = RPCClient( 'Framework/ComponentMonitoring' )
    result = yield self.threadTask( client.getInstallations, req[ 'installation' ], req[ 'component' ], req[ 'host' ], True )
    if result[ 'OK' ]:
      values = []
      installations = result[ 'Value' ]
      for i in range( self.pageNumber, self.pageNumber + self.numberOfInstallations ):
        if len( installations ) > i:
          installation = installations[ i ]
        else:
          break
        uninstalled = '-'
        installedBy = '-'
        uninstalledBy = '-'
        if installation[ 'UnInstallationTime' ]:
          uninstalled = installation[ 'UnInstallationTime' ].strftime( '%Y-%m-%d %H:%M' )
        if installation[ 'InstalledBy' ]:
          installedBy = installation[ 'InstalledBy' ]
        if installation[ 'UnInstalledBy' ]:
          uninstalledBy = installation[ 'UnInstalledBy' ]
        values.append( { 'Name': installation[ 'Instance' ], \
                         'Module': installation[ 'Component' ][ 'Module' ], \
                         'Host': installation[ 'Host' ][ 'HostName' ], \
                         'System': installation[ 'Component' ][ 'System' ], \
                         'Type': installation[ 'Component' ][ 'Type' ], \
                         'Installed': installation[ 'InstallationTime' ].strftime( '%Y-%m-%d %H:%M' ), \
                         'Uninstalled': uninstalled, \
                         'InstalledBy': installedBy, \
                         'UninstalledBy': uninstalledBy } )
      timestamp = Time.dateTime().strftime( '%Y-%m-%d %H:%M [UTC]' )
      total = len( installations )
      callback = { 'success' : 'true', 'result' : values,
                'total' : total, 'date' : timestamp }
    else:
      raise WErr.fromSERROR( result )
    self.finish( callback )

  @asyncGen
  def web_getSelectionData( self ):
    """
    Returns a list of possible values for each different selector to choose from
    """

    req = self.__request()

    data = {}
    userData = self.getSessionData()

    setup = userData[ 'setup' ].split( '-' )[-1]
    systemList = []
    system = None

    fields = [ 'name', 'host', 'module', 'system', 'type' ]

    client = RPCClient( 'Framework/ComponentMonitoring' )
    result = yield self.threadTask( client.getInstallations, {}, {}, {}, True )
    if result[ 'OK' ]:
      for field in fields:
        data[ field ] = set()
      for installation in result[ 'Value' ]:
        data[ 'name' ].add( installation[ 'Instance' ] )
        data[ 'host' ].add( installation[ 'Host' ][ 'HostName' ] )
        data[ 'module' ].add( installation[ 'Component' ][ 'Module' ] )
        data[ 'system' ].add( installation[ 'Component' ][ 'System' ] )
        data[ 'type' ].add( installation[ 'Component' ][ 'Type' ] )

      # Order and format the results
      for field in fields:
        data[ field ] = list( data[ field ] )
        data[ field ].sort()
        data[ field ] = map( lambda x : [x] , data[ field ] )
    else:
      raise WErr.fromSERROR( result )

    self.finish( data )

  def __request( self ):
    """
    Returns a dictionary with the fields 'installation', 'component' and 'host'
    to be used by the getInstallations call in ComponentMonitoring service.
    The data inserted into the fields is retrieved from the values in the
    selectors
    """
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

    # Check every possible selector and get its value ( if any )
    if 'name' in self.request.arguments:
      req[ 'installation' ][ 'Instance' ] = list( json.loads( self.request.arguments[ 'name' ][-1] ) )

    if 'host' in self.request.arguments:
      req[ 'host' ][ 'HostName' ] = list( json.loads( self.request.arguments[ 'host' ][-1] ) )

    if 'system' in self.request.arguments:
      req[ 'component' ][ 'System' ] = list( json.loads( self.request.arguments[ 'system' ][-1] ) )

    if 'module' in self.request.arguments:
      req[ 'component' ][ 'Module' ] = list( json.loads( self.request.arguments[ 'module' ][-1] ) )

    if 'type' in self.request.arguments:
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
      req[ 'installation' ][ 'UnInstallationTime.smaller' ] = date

    return req
