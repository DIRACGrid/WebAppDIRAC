from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gLogger

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
                      'tokenOwner'    : None,
                      'lastCheckTime' : None,
                      'action'        : None
                  }
    
    for key in responseParams:
      if key in self.request.arguments and str( self.request.arguments[ key ][-1] ):
        responseParams[ key ] = list( self.request.arguments[ key ][-1] )  
  
    return responseParams    
