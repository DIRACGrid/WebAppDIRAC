
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time

import operator
import json
import ast

class FileCatalogHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  '''
    Method to read all the available fields possible for defining a query
  '''   
  def web_getMetadataFields(self):
    '''
    stubResponse = {"total": 18, "result": [{"Type": "label", "Name": "fileLevelMDTest"}, {"Type": "int", "Name": "nbShowers"}, {"Type": "varchar(128)", "Name": "prodName"}, {"Type": "float", "Name": "viewCone"}, {"Type": "varchar(128)", "Name": "particle"}, {"Type": "varchar(128)", "Name": "corsikaProdVersion"}, {"Type": "float", "Name": "thetaP"}, {"Type": "float", "Name": "altitude"}, {"Type": "float", "Name": "phiP"}, {"Type": "varchar(128)", "Name": "simtelArrayConfig"}, {"Type": "varchar(128)", "Name": "outputType"}, {"Type": "varchar(128)", "Name": "simtelArrayProdVersion"}, {"Type": "varchar(128)", "Name": "MCCampaign"}, {"Type": "varchar(128)", "Name": "energyInfo"}, {"Type": "float", "Name": "offset"}, {"Type": "int", "Name": "runNumSeries"}, {"Type": "float", "Name": "az"}, {"Type": "float", "Name": "zen"}], "success": "true"};
    self.write(json.dumps(stubResponse))
    return
    '''
    self.L_NUMBER = 0
    self.S_NUMBER = 0
    RPC = RPCClient( "DataManagement/FileCatalog" )
    result = RPC.getMetadataFields()
    gLogger.debug( "request: %s" % result )
    if not result[ "OK" ] :
      gLogger.error( "getSelectorGrid: %s" % result[ "Message" ] )
      return self.write(json.dumps({ "success" : "false" , "error" : result[ "Message" ] }))
    result = result["Value"]
    callback = {}
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
        callback[key]= "label" 
    gLogger.debug( "getSelectorGrid: FileMetaFields callback %s" % callback )
    dirmeta = result[ "DirectoryMetaFields" ]
    if len( dirmeta ) > 0 :
      for key , value in dirmeta.items():
        callback[key]= value.lower()
    gLogger.debug( "getSelectorGrid: Resulting callback %s" % callback )
    self.write(json.dumps({ "success" : "true" , "result" : callback}))
  
  '''
    Method to read all the available options for a metadata field
  '''
  '''
  @asyncGen 
  def web_getQueryData( self ):

    try:
      compat = dict()
      for key in self.request.arguments:
        key = str( key )
        prefix = key[ :12 ]
        name = key[ 12: ]
        if not "_compatible_" in prefix:
          continue
        if not len( name ) > 0:
          continue
        
        value = str( self.request.arguments[ key ][0] ).split("|")
        
        sign = value[1]
        
        #check existence of the 'name' section
        if not compat.has_key(name):
          compat[name] = dict()
          
        #check existence of the 'sign' section
        if not compat[name].has_key(sign):
          if value[0]=="v":
            compat[name][sign] = ""
          elif value[0]=="s":
            compat[name][sign] = []
          
        if value[0]=="v":
          compat[name][sign] = value[2]
        elif value[0]=="s":
          compat[name][sign] += value[2].split(":::")
    
    except Exception, e:
      self.finish(json.dumps({ "success" : "false" , "error" : "Metadata query error" }))
    
    gLogger.always( compat )
    
    RPC = RPCClient( "DataManagement/FileCatalog" )
    
    result = yield self.threadTask(RPC.getCompatibleMetadata, compat )
    gLogger.always( result )

    if not result[ "OK" ]:
      self.finish(json.dumps({ "success" : "false" , "error" : result[ "Message" ] }))
    
    self.finish(json.dumps({ "success" : "true" , "result" : result["Value"] }))
  '''  
  def web_getQueryData( self ):

    try:
      compat = dict()
      for key in self.request.arguments:
        key = str( key )
        prefix = key[ :12 ]
        name = key[ 12: ]
        if not "_compatible_" in prefix:
          continue
        if not len( name ) > 0:
          continue
        
        value = str( self.request.arguments[ key ][0] ).split("|")
        
        sign = value[1]
        
        #check existence of the 'name' section
        if not compat.has_key(name):
          compat[name] = dict()
          
        #check existence of the 'sign' section
        if not compat[name].has_key(sign):
          if value[0]=="v":
            compat[name][sign] = ""
          elif value[0]=="s":
            compat[name][sign] = []
          
        if value[0]=="v":
          compat[name][sign] = value[2]
        elif value[0]=="s":
          compat[name][sign] += value[2].split(":::")
    
    except Exception, e:
      return self.write(json.dumps({ "success" : "false" , "error" : "Metadata query error" }))
    
    path = "/";
    
    if self.request.arguments.has_key("path") :
      path = self.request.arguments["path"][0]
    
    gLogger.always( compat )
    
    RPC = RPCClient( "DataManagement/FileCatalog" )
    
    result = RPC.getCompatibleMetadata( compat, path )
    gLogger.always( result )

    if not result[ "OK" ]:
      return self.write(json.dumps({ "success" : "false" , "error" : result[ "Message" ] }))
    
    return self.write(json.dumps({ "success" : "true" , "result" : result["Value"] }))
  '''
  @asyncGen  
  def web_getFilesData( self ) :
    RPC = RPCClient( "DataManagement/FileCatalog" )
    req = self.__request()
    gLogger.always(req)
    gLogger.debug( "submit: incoming request %s" % req )
    result = yield self.threadTask(RPC.findFilesByMetadataWeb, req["selection"] , req["path"] , self.S_NUMBER , self.L_NUMBER)
    gLogger.debug( "submit: result of findFilesByMetadataDetailed %s" % result )
    if not result[ "OK" ] :
      gLogger.error( "submit: %s" % result[ "Message" ] )
      self.finish(json.dumps({ "success" : "false" , "error" : result[ "Message" ] }))
    result = result[ "Value" ]
#     gLogger.always( "Result of findFilesByMetadataDetailed %s" % result )

    if not len(result) > 0:
      self.finish(json.dumps({ "success" : "true" , "result" : [] , "total" : 0, "date":"-" }))
    
    total = result[ "TotalRecords" ]
    result = result[ "Records" ]
    
    callback = list()
    for key , value in result.items() :
      
      size = ""
      if "Size" in value:
        size = value[ "Size" ]

      date = ""
      if "CreationDate" in value:
        date = str( value[ "CreationDate" ] )

      meta = ""
      if "Metadata" in value:
        m = value[ "Metadata" ]
        meta = '; '.join( [ '%s: %s' % ( i , j ) for ( i , j ) in m.items() ] )
      
      dirnameList = key.split("/")
      dirname = "/".join(dirnameList[:len(dirnameList)-1])
      filename = dirnameList[len(dirnameList)-1:]
        
      callback.append({"fullfilename":key, "dirname": dirname, "filename" : filename , "date" : date , "size" : size ,
                            "metadata" : meta })
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    self.finish(json.dumps({ "success" : "true" , "result" : callback , "total" : total, "date":timestamp}))
  
  '''  
  def web_getFilesData( self ) :
    RPC = RPCClient( "DataManagement/FileCatalog" )
    req = self.__request()
    gLogger.always(req)
    gLogger.debug( "submit: incoming request %s" % req )
    result = RPC.findFilesByMetadataWeb( req["selection"] , req["path"] , self.S_NUMBER , self.L_NUMBER)
    gLogger.debug( "submit: result of findFilesByMetadataDetailed %s" % result )
    if not result[ "OK" ] :
      gLogger.error( "submit: %s" % result[ "Message" ] )
      return self.write(json.dumps({ "success" : "false" , "error" : result[ "Message" ] }))
    result = result[ "Value" ]
#     gLogger.always( "Result of findFilesByMetadataDetailed %s" % result )

    if not len(result) > 0:
      return self.write(json.dumps({ "success" : "true" , "result" : [] , "total" : 0, "date":"-" }))
    
    total = result[ "TotalRecords" ]
    result = result[ "Records" ]
    
    callback = list()
    for key , value in result.items() :
      
      size = ""
      if "Size" in value:
        size = value[ "Size" ]

      date = ""
      if "CreationDate" in value:
        date = str( value[ "CreationDate" ] )

      meta = ""
      if "Metadata" in value:
        m = value[ "Metadata" ]
        meta = '; '.join( [ '%s: %s' % ( i , j ) for ( i , j ) in m.items() ] )
      
      dirnameList = key.split("/")
      dirname = "/".join(dirnameList[:len(dirnameList)-1])
      filename = dirnameList[len(dirnameList)-1:]
        
      callback.append({"fullfilename":key, "dirname": dirname, "filename" : filename , "date" : date , "size" : size ,
                            "metadata" : meta })
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    return self.write(json.dumps({ "success" : "true" , "result" : callback , "total" : total, "date":timestamp}))

    
  def __request(self):
    req = { "selection" : {} , "path" : "/" }
      
    self.L_NUMBER = 25
    if self.request.arguments.has_key( "limit" ) and len( self.request.arguments[ "limit" ][0] ) > 0:
      self.L_NUMBER = int( self.request.arguments[ "limit" ][0] )
      
    self.S_NUMBER = 0
    if self.request.arguments.has_key( "start" ) and len( self.request.arguments[ "start" ][0] ) > 0:
      self.S_NUMBER = int( self.request.arguments[ "start" ][0] )
      
    result = gConfig.getOption( "/Website/ListSeparator" )
    if result[ "OK" ] :
      separator = result[ "Value" ]
    else:
      separator = ":::"
      
    RPC = RPCClient("DataManagement/FileCatalog")
    result = RPC.getMetadataFields()
    gLogger.debug( "request: %s" % result )
    
    if not result["OK"]:
      gLogger.error( "request: %s" % result[ "Message" ] )
      return req
    result = result["Value"]
    
    if not result.has_key( "FileMetaFields" ):
      error = "Service response has no FileMetaFields key. Return empty dict"
      gLogger.error( "request: %s" % error )
      return req
    
    if not result.has_key( "DirectoryMetaFields" ):
      error = "Service response has no DirectoryMetaFields key. Return empty dict"
      gLogger.error( "request: %s" % error )
      return req
    
    filemeta = result[ "FileMetaFields" ]
    dirmeta = result[ "DirectoryMetaFields" ]
    
    meta = []
    for key,value in dirmeta.items() :
      meta.append( key )
      
    gLogger.always( "request: metafields: %s " % meta )
    
    for param in self.request.arguments :
      
      tmp = str( param ).split( '.' )
      
      if len( tmp ) < 2 :
        continue
      
      name = tmp[1]
      value = self.request.arguments[param][0].split("|")
      
      logic = value[ 1 ]
      
      if not logic in ["in","nin", "=" , "!=" , ">=" , "<=" , ">" , "<" ] :
        gLogger.always( "Operand '%s' is not supported " % logic )
        continue
      
      if name in meta :
        #check existence of the 'name' section
        if not req[ "selection" ].has_key(name):
          req[ "selection" ][name] = dict()
          
        #check existence of the 'sign' section
        if not req[ "selection" ][name].has_key(logic):
          if value[0]=="v":
            req[ "selection" ][name][logic] = ""
          elif value[0]=="s":
            req[ "selection" ][name][logic] = []
          
        if value[0]=="v":
          req[ "selection" ][name][logic] = value[2]
        elif value[0]=="s":
          req[ "selection" ][name][logic] += value[2].split(":::")
    if self.request.arguments.has_key("path") :
      req["path"] = self.request.arguments["path"][0]
    gLogger.always("REQ: ",req)
    return req
