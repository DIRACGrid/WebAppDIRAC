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
      self.finish( { 'success' : 'false', 'error' : elementStatuses[ 'Message' ] } )
      
    elementList = [ dict( zip( elementStatuses[ 'Columns' ], site ) ) for site in elementStatuses[ 'Value' ] ]

    for elementStatus in elementList :

      elementStatus[ 'Country' ] = elementStatus[ 'Name' ][ -2: ]
      elementStatus[ 'DateEffective' ] = str( elementStatus[ 'DateEffective' ] )
      elementStatus[ 'LastCheckTime' ] = str( elementStatus[ 'LastCheckTime' ] )
      elementStatus[ 'TokenExpiration' ] = str( elementStatus[ 'TokenExpiration' ] )

    result = { 'success': 'true', 'result': elementList, 'total': len( elementList ) }

    self.finish( result )

  
   
  @asyncGen
  def web_action( self ):
    
    requestParams = self.__requestParams()
    if 'action' in requestParams and requestParams[ 'action' ]:
      
      actionName = requestParams[ 'action' ][ 0 ]
      
      methodName = actionName
      if not actionName.startswith( 'set' ):
        methodName = '_get%s' % actionName
      
      try:
        return  getattr( self, methodName )( requestParams )
      except AttributeError:
        result = { 'success' : 'false', 'error' : 'bad action %s' % actionName }  
    
    else:
      
      result = { 'success' : 'false', 'error' : 'Missing action' }
    
    self.finish( result )
  
  def _getHistory( self, requestParams ):

    # Sanitize
    if not 'name' in requestParams or not requestParams[ 'name' ]:
      self.finish( { 'success' : 'false', 'error' : 'Missing name' } )
    if not 'elementType' in requestParams or not requestParams[ 'elementType' ]:
      self.finish( { 'success' : 'false', 'error' : 'Missing elementType' } )
    if not 'statusType' in requestParams or not requestParams[ 'statusType' ]:
      self.finish( { 'success' : 'false', 'error' : 'Missing statusType' } )

    pub = RPCClient( 'ResourceStatus/Publisher' )
    res = pub.getElementHistory( 'Site', requestParams[ 'name' ],
                                 requestParams[ 'elementType' ],
                                 requestParams[ 'statusType' ] )

    if not res[ 'OK' ]:
      gLogger.error( res[ 'Message' ] )
      self.finish( { 'success' : 'false', 'error' : 'error getting history' } )

    history = [ [ r[0], str( r[1] ), r[2] ] for r in res[ 'Value' ] ]

    self.finish( { 'success' : 'true', 'result' : history, 'total' : len( history ) } )

  def _getPolicies( self, requestParams ):

    # Sanitize
    if not 'name' in requestParams or not requestParams[ 'name' ]:
      self.finish( { 'success' : 'false', 'error' : 'Missing name' } )
    if not 'statusType' in requestParams or not requestParams[ 'statusType' ]:
      self.finish( { 'success' : 'false', 'error' : 'Missing statusType' } )

    pub = RPCClient( 'ResourceStatus/Publisher' )
    res = pub.getElementPolicies( 'Site', requestParams[ 'name' ],
                                  requestParams[ 'statusType' ] )

    if not res[ 'OK' ]:
      gLogger.error( res[ 'Message' ] )
      self.finish( { 'success' : 'false', 'error' : 'error getting policies' } )

    policies = [ [ r[0], r[1], str( r[2] ), str( r[3] ), r[4] ] for r in res[ 'Value' ] ]

    self.finish( { 'success' : 'true', 'result' : policies, 'total' : len( policies ) } )
  
  def _getInfo( self, requestParams ):
    requestParams = self.__requestParams()
    gLogger.info( requestParams )

    if not requestParams[ 'name' ]:
      gLogger.warn( 'No name given' )
      self.finish( { 'success': 'false', 'error': 'We need a Site Name to generate an Overview' } )
      
    elementName = requestParams[ 'name' ][ 0 ]

    pub = RPCClient( 'ResourceStatus/Publisher' )

    elementStatuses = pub.getElementStatuses( 'Site',
                                              str(elementName),
                                              None,
                                              'all',
                                              None,
                                              None )

    
    if not elementStatuses[ 'OK' ]:
      gLogger.error( elementStatuses[ 'Message' ] )
      self.finish( { 'success': 'false', 'error': 'Error getting ElementStatus information' } )
      
    
    if not elementStatuses[ 'Value' ]:
      gLogger.error( 'element "%s" not found' % elementName )
      self.finish( { 'success' : 'false', 'error' : 'element "%s" not found' % elementName } )
      
    elementStatus = [ dict( zip( elementStatuses[ 'Columns' ], element ) ) for element in elementStatuses[ 'Value' ] ][ 0 ]
    elementStatus[ 'DateEffective' ] = str( elementStatus[ 'DateEffective' ] )
    elementStatus[ 'LastCheckTime' ] = str( elementStatus[ 'LastCheckTime' ] )
    elementStatus[ 'TokenExpiration' ] = str( elementStatus[ 'TokenExpiration' ] )
    
    
    self.finish( { 'success' : 'true', 'result' : elementStatus, 'total' : len( elementStatus ) } )
    
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
