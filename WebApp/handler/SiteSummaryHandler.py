from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.Utilities import Time

from DIRAC import gLogger
import collections
import json

class SiteSummaryHandler( WebHandler ):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getSelectionData( self ):

    callback = {
                'name'        : set(),
                'elementType' : set(),
                'status'      : set(),
                'statusType'  : set(),
                'tokenOwner'  : set()
                }

    pub = RPCClient( 'ResourceStatus/Publisher' )

    gLogger.info( self.request.arguments )

    elementStatuses = pub.getElementStatuses( 'Site', None, None, None, None, None )

    if elementStatuses[ 'OK' ]:

      for elementStatus in elementStatuses[ 'Value' ]:

        callback[ 'status' ].add( elementStatus[ 0 ] )
        callback[ 'name' ].add( elementStatus[ 2 ] )
        callback[ 'elementType' ].add( elementStatus[ 5 ] )
        callback[ 'statusType' ].add( elementStatus[ 6 ] )
        callback[ 'tokenOwner' ].add( elementStatus[ 8 ] )

    for key, value in callback.items():

      callback[ key ] = [ [ item ] for item in list( value ) ]
      callback[ key ].sort()
      

    return self.finish( callback )
  
  @asyncGen
  def web_getSiteSummaryData( self ):
    '''This method returns the data required to fill the grid.'''
    requestParams = self.__requestParams()
    gLogger.info( requestParams )

    pub = RPCClient( 'ResourceStatus/Publisher' )

    elementStatuses = yield self.threadTask( pub.getElementStatuses, 'Site',
                                              requestParams[ 'name' ],
                                              requestParams[ 'elementType' ],
                                              requestParams[ 'statusType' ],
                                              requestParams[ 'status' ],
                                              requestParams[ 'tokenOwner' ] )
    if not elementStatuses[ 'OK' ]:
      self.finish({ 'success' : 'false', 'error' : elementStatuses[ 'Message' ] })
      
    elementList = [ dict( zip( elementStatuses[ 'Columns' ], site ) ) for site in elementStatuses[ 'Value' ] ]

    for elementStatus in elementList :

      elementStatus[ 'Country' ] = elementStatus[ 'Name' ][ -2: ]
      elementStatus[ 'DateEffective' ] = str( elementStatus[ 'DateEffective' ] )
      elementStatus[ 'LastCheckTime' ] = str( elementStatus[ 'LastCheckTime' ] )
      elementStatus[ 'TokenExpiration' ] = str( elementStatus[ 'TokenExpiration' ] )

    result = { 'success': 'true', 'result': elementList, 'total': len( elementList ) }

    self.finish( result )

    
  def __requestParams( self ):
    '''
      We receive the request and we parse it, in this case, we are doing nothing,
      but it can be certainly more complex.
    '''

    gLogger.always( "!!!  PARAMS: ", str( self.request.arguments ) ) 
    
    responseParams = { 
                      'name'          : None,
                      'elementType'   : None,
                      'statusType'    : None,
                      'status'        : None,
                      'action'        : None,
                      'tokenOwner'    : None
                  }
    
    for key in responseParams:
      if key in self.request.arguments and str( self.request.arguments[ key ][-1] ):
        responseParams[ key ] = list( json.loads( self.request.arguments[ key ][-1] ) )   
  
    return responseParams    
