
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
import json
import ast

class MetadataCatalogHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  '''
    Method to read all the available fields possible for defining a query
  '''   
  def web_getMetadataFields(self):
    
    stubResponse = {"total": 18, "result": [{"Type": "label", "Name": "fileLevelMDTest"}, {"Type": "int", "Name": "nbShowers"}, {"Type": "varchar(128)", "Name": "prodName"}, {"Type": "float", "Name": "viewCone"}, {"Type": "varchar(128)", "Name": "particle"}, {"Type": "varchar(128)", "Name": "corsikaProdVersion"}, {"Type": "float", "Name": "thetaP"}, {"Type": "float", "Name": "altitude"}, {"Type": "float", "Name": "phiP"}, {"Type": "varchar(128)", "Name": "simtelArrayConfig"}, {"Type": "varchar(128)", "Name": "outputType"}, {"Type": "varchar(128)", "Name": "simtelArrayProdVersion"}, {"Type": "varchar(128)", "Name": "MCCampaign"}, {"Type": "varchar(128)", "Name": "energyInfo"}, {"Type": "float", "Name": "offset"}, {"Type": "int", "Name": "runNumSeries"}, {"Type": "float", "Name": "az"}, {"Type": "float", "Name": "zen"}], "success": "true"};
    self.write(json.dumps(stubResponse))
    return
  
    RPC = RPCClient( "DataManagement/FileCatalog" )
    result = RPC.getMetadataFields()
    gLogger.debug( "request: %s" % result )
    if not result[ "OK" ] :
      gLogger.error( "getSelectorGrid: %s" % result[ "Message" ] )
      return self.write(json.dumps({ "success" : "false" , "error" : result[ "Message" ] }))
    result = result["Value"]
    callback = list()
    if not result.has_key( "FileMetaFields" ):
      error = "Service response has no FileMetaFields key"
      gLogger.error( "getSelectorGrid: %s" % error )
      return self.write(json.dumps({ "success" : "false" , "error" : error }))
    if not result.has_key( "DirectoryMetaFields" ):
      error = "Service response has no DirectoryMetaFields key"
      gLogger.error( "getSelectorGrid: %s" % error )
      return self.write(json.dumps({ "success" : "false" , "error" : error }))
    filemeta = result[ "FileMetaFields" ]
    if len( filemeta ) > 0 :
      for key , value in filemeta.items():
        tmp = dict()
        tmp[ "Name" ] = key
        tmp[ "Type" ] = "label"
        callback.append( tmp )
    gLogger.debug( "getSelectorGrid: FileMetaFields callback %s" % callback )
    dirmeta = result[ "DirectoryMetaFields" ]
    if len( dirmeta ) > 0 :
      for key , value in dirmeta.items():
        tmp = dict()
        tmp[ "Name" ] = key
        tmp[ "Type" ] = value.lower()
        callback.append( tmp )
    gLogger.debug( "getSelectorGrid: Resulting callback %s" % callback )
    self.write(json.dumps({ "success" : "true" , "result" : callback , "total" : len( callback )}))
  
  
  '''
    Method to read all the available options for a metadata field
  '''
  def web_getMetadataFieldOptions(self):
    if not "getValue" in self.request.arguments:
      return self.write(json.dumps({ "success" : "false" , "error" : "Metadata key is absent" }))
    
    
    try:
      meta = str( self.request.arguments[ "getValue" ][0] )
      compat = dict()
      for key in self.request.arguments:
        key = str( key )
        prefix = key[ :12 ]
        postfix = key[ 12: ]
        if not "_compatible_" in prefix:
          continue
        if not len( postfix ) > 0:
          continue 
        compat[ postfix ] = str( self.request.arguments[ key ][0] )
    except Exception, e:
      return self.write(json.dumps({ "success" : "false" , "error" : e }))
    gLogger.always( compat )    
    
#     meta = str( self.request.arguments[ "getValue" ][0] )
#     compat = dict()
    
    RPC = RPCClient( "DataManagement/FileCatalog" )

    result = RPC.getCompatibleMetadata( compat )
    gLogger.always( result )

    if not result[ "OK" ]:
      return self.write(json.dumps({ "success" : "false" , "error" : result[ "Message" ] }))
    result = result[ "Value" ]

    if not meta in result:
      return self.write(json.dumps({ "success" : "true" , "result" : {} }))
    
    callback = []
    for i in result[ meta ]:
      callback.append( { "name" : i} )
      
    return self.write(json.dumps({ "success" : "true" , "result" : callback }))
  
  '''
    Method to read the compatible fields regarding the current query
  '''
  def getCompatible( self ):

    '''
    if not "meta" in request.params:
      return { "success" : "false" , "error" : "Meta key is absent" }

    if not "value" in request.params:
      return { "success" : "false" , "error" : "Value key is absent" }
    '''

    try:
      compat = dict()
      for key in self.request.arguments:
        key = str( key )
        prefix = key[ :12 ]
        postfix = key[ 12: ]
        if not "_compatible_" in prefix:
          continue
        if not len( postfix ) > 0:
          continue 
        compat[ postfix ] = str( self.request.arguments[ key ][0] )
    except Exception, e:
      return self.write(json.dumps({ "success" : "false" , "error" : e }))

    RPC = RPCClient( "DataManagement/FileCatalog" )

    result = RPC.getCompatibleMetadata( compat )
    gLogger.always( result )

    if not result[ "OK" ]:
      return self.write(json.dumps({ "success" : "false" , "error" : result[ "Message" ] }))
    result = result[ "Value" ]
    
    callback = dict()
    for i in result:
      if not len( result[ i ] ) > 0:
        continue
      callback[ i ] = True
    return self.write(json.dumps({ "success" : "true" , "result" : callback }))
  