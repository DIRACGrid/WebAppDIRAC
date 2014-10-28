from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.ResourceStatusSystem.PolicySystem.StateMachine import RSSMachine

from DIRAC import gLogger
import collections
import json

class ResourceSummaryHandler( WebHandler ):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getSelectionData( self ):
    '''It returns the possible selection data
    '''
    callback = {
                'name'        : set(),
                'elementType' : set(),
                'status'      : set(),
                'statusType'  : set(),
                'tokenOwner'  : set()
                }
     
    pub = RPCClient( 'ResourceStatus/Publisher' )
    
    gLogger.info( self.request.arguments )    
    
    elementStatuses = pub.getElementStatuses( 'Resource', None, None, None, None, None )
    
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
      callback[ key ] = [ [ 'All' ] ] + callback[ key ] 
          
        
      
    self.finish( callback )
  
  @asyncGen
  def web_getResourceSummaryData( self ):
    '''This method returns the data required to fill the grid.
    '''
    
    requestParams = self.__requestParams()
    gLogger.info( requestParams )
    
    pub = RPCClient( 'ResourceStatus/Publisher' )
       
    elementStatuses = pub.getElementStatuses( 'Resource',
                                              requestParams[ 'name' ],
                                              requestParams[ 'elementType' ],
                                              requestParams[ 'statusType' ],
                                              requestParams[ 'status' ],
                                              requestParams[ 'tokenOwner' ] )
    if not elementStatuses[ 'OK' ]:
      self.finish( { 'success' : 'false', 'error' : elementStatuses[ 'Message' ] } )
      return c.result
       
    elementTree = collections.defaultdict( list )
    
    for element in elementStatuses[ 'Value' ]:
      
      elementDict = dict( zip( elementStatuses[ 'Columns' ], element ) )
      
      elementDict[ 'DateEffective' ] = str( elementDict[ 'DateEffective' ] )
      elementDict[ 'LastCheckTime' ] = str( elementDict[ 'LastCheckTime' ] )
      elementDict[ 'TokenExpiration' ] = str( elementDict[ 'TokenExpiration' ] )
      
      elementTree[ elementDict[ 'Name' ] ].append( elementDict )

    elementList = []

    for elementValues in elementTree.values():
            
      if len( elementValues ) == 1:
        elementList.append( elementValues[ 0 ] )      
      else:
        
        elementList.append( self.combine( elementValues ) ) 
    
    rssMachine = RSSMachine( None )
    rssMachine.orderPolicyResults( elementList )    
        
    self.finish( { 'success': 'true', 'result': elementList, 'total': len( elementList ) } )
    
        
  def combine( self, elementValues ):
    
    statuses = [ element[ 'Status' ] for element in elementValues ]
    
    statusSet = set( statuses )
        
    if len( statusSet ) == 1:
      status = statusSet.pop()
      reason = 'All %s' % status
    
    else:     
        
      if set( [ 'Active', 'Degraded' ] ) & set( statusSet ):
        status = 'Degraded'
        reason = 'Not completely active'

      else:
        status = 'Banned'
        reason = 'Not usable'
          
#      if set( [ 'Unknown','Active', 'Degraded' ] ) & set( statusSet ):
#        for upStatus in [ 'Active', 'Degraded' ]:
#          if upStatus in statusSet:
#            status = upStatus
#            reason = '%d %s' % ( statuses.count( upStatus ), upStatus )
#            break
#      else:
#        for downStatus in [ 'Unknown','Probing','Banned','Error' ]:
#          if downStatus in statusSet:
#            status = downStatus
#            reason = '%d %s' % ( statuses.count( downStatus ), downStatus )
#            break

    # Make a copy
    combined = {}
    combined.update( elementValues[ 0 ] )
    combined[ 'StatusType' ] = '%d elements' % len( statuses ) 
    combined[ 'Status' ] = status
    combined[ 'Reason' ] = reason
    combined[ 'DateEffective' ] = ''
    combined[ 'LastCheckTime' ] = ''
    combined[ 'TokenOwner' ] = ''
    combined[ 'TokenExpiration' ] = ''
      
    return combined
  
  @asyncGen
  def web_expand( self ):
    '''
      This method handles the POST requests
    '''
    
    requestParams = self.__requestParams()
    gLogger.info( requestParams )
    
    pub = RPCClient( 'ResourceStatus/Publisher' )
       
    elements = pub.getElementStatuses( 'Resource',
                                       requestParams[ 'name' ],
                                       None, None, None, None )
    if not elements[ 'OK' ]:
      c.result = { 'success' : 'false', 'error' : elements[ 'Message' ] }
      return c.result

    elementList = [ dict( zip( elements[ 'Columns' ], element ) ) for element in elements[ 'Value' ] ]
    for element in elementList:
      element[ 'DateEffective' ] = str( element[ 'DateEffective' ] )
      element[ 'LastCheckTime' ] = str( element[ 'LastCheckTime' ] )
      element[ 'TokenExpiration' ] = str( element[ 'TokenExpiration' ] )      
    
    self.finish( { 'success': 'true', 'result': elementList, 'total': len( elementList ) } )
  
  @asyncGen
  def web_action( self ):
    
    requestParams = self.__requestParams()
    if 'action' in requestParams and requestParams[ 'action' ]:
      
      actionName = requestParams[ 'action' ][ 0 ]
      
      methodName = actionName
      if not actionName.startswith( 'set' ):
        methodName = '_get%s' % actionName
      
      try:
        result = getattr( self, methodName )( requestParams )
      except AttributeError:
        result = { 'success' : 'false', 'error' : 'bad action %s' % actionName }  
    
    else:
      
      result = { 'success' : 'false', 'error' : 'Missing action' }
    
    self.finish( result )
    
  def setToken( self, requestParams ):
    
    sData = self.getSessionData()
    
    username = sData["user"]["username"]
    
    if username == 'anonymous':
      return { 'success' : 'false', 'error' : 'Cannot perform this operation as anonymous' } 
    elif not 'SiteManager' in sData['user']['properties']:
      return { 'success' : 'false', 'error' : 'Not authorized' } 
    
    pub = RPCClient( 'ResourceStatus/Publisher' )
    res = pub.setToken( 'Resource',
                         str(requestParams[ 'name' ][ 0 ]),
                         str(requestParams[ 'statusType' ][ 0 ]),
                         str(requestParams[ 'status' ][ 0 ]),
                         str(requestParams[ 'elementType' ][ 0 ]),
                         username,
                         str(requestParams[ 'lastCheckTime' ][ 0 ]) ) 
                   
    if not res[ 'OK' ]:
      return { 'success' : 'false', 'error' : res[ 'Message' ] } 
          
    return { 'success' : 'true', 'result' : res[ 'Value' ] } 

  def setStatus( self, requestParams ):
    
    sData = self.getSessionData()
    
    username = sData["user"]["username"]
    
    
    if username == 'anonymous':
      return { 'success' : 'false', 'error' : 'Cannot perform this operation as anonymous' } 
    elif not 'SiteManager' in sData['user']['properties']:
      return { 'success' : 'false', 'error' : 'Not authorized' } 
    
    pub = RPCClient( 'ResourceStatus/Publisher' )
    
    res = pub.setStatus( 'Resource',
                         str( requestParams[ 'name' ][ 0 ] ),
                         str( requestParams[ 'statusType' ][ 0 ] ),
                         str( requestParams[ 'status' ][ 0 ] ),
                         str( requestParams[ 'elementType' ][ 0 ] ),
                         username,
                         str(requestParams[ 'lastCheckTime' ][ 0 ]) ) 
                   
    if not res[ 'OK' ]:
      return { 'success' : 'false', 'error' : res[ 'Message' ] } 
          
    return { 'success' : 'true', 'result' : res[ 'Value' ] } 

  def _getHistory( self, requestParams ):
  
    # Sanitize
    if not 'name' in requestParams or not requestParams[ 'name' ]:
      return { 'success' : 'false', 'error' : 'Missing name' }
    if not 'elementType' in requestParams or not requestParams[ 'elementType' ]:
      return { 'success' : 'false', 'error' : 'Missing elementType' }
    if not 'statusType' in requestParams or not requestParams[ 'statusType' ]:
      return { 'success' : 'false', 'error' : 'Missing statusType' }
    
    pub = RPCClient( 'ResourceStatus/Publisher' )
    res = pub.getElementHistory( 'Resource', requestParams[ 'name' ],
                                 requestParams[ 'elementType' ],
                                 requestParams[ 'statusType' ] )
    
    if not res[ 'OK' ]:
      gLogger.error( res[ 'Message' ] )
      return { 'success' : 'false', 'error' : 'error getting history' } 
    
    history = [ [ r[0], str( r[1] ), r[2] ] for r in res[ 'Value' ] ]
    
    return { 'success' : 'true', 'result' : history, 'total' : len( history ) }  

  def _getPolicies( self, requestParams ):
  
    # Sanitize
    if not 'name' in requestParams or not requestParams[ 'name' ]:
      self.finish( { 'success' : 'false', 'error' : 'Missing name' } )
    if not 'statusType' in requestParams or not requestParams[ 'statusType' ]:
      self.finish( { 'success' : 'false', 'error' : 'Missing statusType' } )
    
    pub = RPCClient( 'ResourceStatus/Publisher' )
    res = pub.getElementPolicies( 'Resource', requestParams[ 'name' ],
                                  requestParams[ 'statusType' ] )
    
    if not res[ 'OK' ]:
      gLogger.error( res[ 'Message' ] )
      return { 'success' : 'false', 'error' : 'error getting policies' } 
    
    policies = [ [ r[0], r[1], str( r[2] ), str( r[3] ), r[4] ] for r in res[ 'Value' ] ]
    
    return { 'success' : 'true', 'result' : policies, 'total' : len( policies ) }    
   
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
                      'tokenOwner'    : None,
                      'lastCheckTime' : None,
                      'action'        : None
                  }
    
    for key in responseParams:
      if key in self.request.arguments and str( self.request.arguments[ key ][-1] ):
        responseParams[ key ] = list( json.loads( self.request.arguments[ key ][-1] ) )   
  
    return responseParams    
