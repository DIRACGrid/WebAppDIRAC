
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
import json
import ast

class MetadataCatalogHandler(WebHandler):

  AUTH_PROPS = "authenticated"
     
  def web_getMetadataOptions(self):
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
  