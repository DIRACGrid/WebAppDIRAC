from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gLogger

class ResourceSummaryHandler( WebHandler ):

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
