
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time

import operator
import json
import ast

try:
  from hashlib import md5
except:
  from md5 import md5

class FileCatalogHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  '''
    Method to read all the available fields possible for defining a query
  '''   
  @asyncGen
  def web_getMetadataFields(self):
    
    self.L_NUMBER = 0
    self.S_NUMBER = 0
    RPC = RPCClient( "DataManagement/FileCatalog" )
    result = yield self.threadTask(RPC.getMetadataFields)
    gLogger.debug( "request: %s" % result )
    if not result[ "OK" ] :
      gLogger.error( "getSelectorGrid: %s" % result[ "Message" ] )
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    result = result["Value"]
    callback = {}
    if not result.has_key( "FileMetaFields" ):
      error = "Service response has no FileMetaFields key"
      gLogger.error( "getSelectorGrid: %s" % error )
      self.finish({ "success" : "false" , "error" : error })
      return
    if not result.has_key( "DirectoryMetaFields" ):
      error = "Service response has no DirectoryMetaFields key"
      gLogger.error( "getSelectorGrid: %s" % error )
      self.finish({ "success" : "false" , "error" : error })
      return
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
    self.finish({ "success" : "true" , "result" : callback})
  
  '''
    Method to read all the available options for a metadata field
  '''
  @asyncGen   
  def web_getQueryData( self ):

    try:
      compat = dict()
      for key in self.request.arguments:
        
        parts = str( key ).split(".");
        
        if len(parts)!=3:
          continue;
        
        key = str( key )
        name = parts[1]
        sign = parts[2]
        
        if not len( name ) > 0:
          continue
        
        value = str( self.request.arguments[ key ][0] ).split("|")
        
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
          compat[name][sign] = value[1]
        elif value[0]=="s":
          compat[name][sign] += value[1].split(":::")
    
    except Exception, e:
      self.finish({ "success" : "false" , "error" : "Metadata query error" })
      return
    
    path = "/";
    
    if self.request.arguments.has_key("path") :
      path = self.request.arguments["path"][0]
    
    gLogger.always( compat )
    
    RPC = RPCClient( "DataManagement/FileCatalog" )
    
    result = yield self.threadTask(RPC.getCompatibleMetadata, compat, path )
    gLogger.always( result )

    if not result[ "OK" ]:
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    
    self.finish({ "success" : "true" , "result" : result["Value"] })
  
  @asyncGen   
  def web_getFilesData( self ) :
    RPC = RPCClient( "DataManagement/FileCatalog", timeout=3600 )
    req = self.__request()
    gLogger.always(req)
    gLogger.debug( "submit: incoming request %s" % req )
    result = yield self.threadTask(RPC.findFilesByMetadataWeb, req["selection"] , req["path"] , self.S_NUMBER , self.L_NUMBER)
    gLogger.debug( "submit: result of findFilesByMetadataDetailed %s" % result )
    if not result[ "OK" ] :
      gLogger.error( "submit: %s" % result[ "Message" ] )
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    result = result[ "Value" ]

    if not len(result) > 0:
      self.finish({ "success" : "true" , "result" : [] , "total" : 0, "date":"-" })
      return
    
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
    self.finish({ "success" : "true" , "result" : callback , "total" : total, "date":timestamp})

    
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
      
      if len( tmp ) != 3 :
        continue
      
      name = tmp[1]
      logic = tmp[2]
      value = self.request.arguments[param][0].split("|")
      
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
          req[ "selection" ][name][logic] = value[1]
        elif value[0]=="s":
          req[ "selection" ][name][logic] += value[1].split(":::")
    if self.request.arguments.has_key("path") :
      req["path"] = self.request.arguments["path"][0]
    gLogger.always("REQ: ",req)
    return req
  
  def __request_file(self):
    req = { "selection" : {} , "path" : "/" }
   
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
    
    selectionElems=self.request.arguments["selection"][0].split("<|>")
    
    gLogger.always( "request: THISSSS %s " % self.request.arguments["selection"][0] )
    
    for param in selectionElems:
      
      tmp = str( param ).split( '|' )
      
      if len( tmp ) != 4 :
        continue
      
      name = tmp[0]
      logic = tmp[1]
      
      if not logic in ["in","nin", "=" , "!=" , ">=" , "<=" , ">" , "<" ] :
        gLogger.always( "Operand '%s' is not supported " % logic )
        continue
      
      if name in meta :
        #check existence of the 'name' section
        if not req[ "selection" ].has_key(name):
          req[ "selection" ][name] = dict()
          
        #check existence of the 'sign' section
        if not req[ "selection" ][name].has_key(logic):
          if tmp[2]=="v":
            req[ "selection" ][name][logic] = ""
          elif tmp[2]=="s":
            req[ "selection" ][name][logic] = []
          
        if tmp[2]=="v":
          req[ "selection" ][name][logic] = tmp[3]
        elif tmp[2]=="s":
          req[ "selection" ][name][logic] += tmp[3].split(":::")
    if self.request.arguments.has_key("path") :
      req["path"] = self.request.arguments["path"][0]
    gLogger.always("REQ: ",req)
    return req
  
  @asyncGen  
  def web_getMetadataFilesInFile( self ):
    self.set_header('Content-type','text/plain')
    self.set_header('Content-Disposition', 'attachment; filename="error.txt"')
    RPC = RPCClient( "DataManagement/FileCatalog" )
    req = self.__request_file()
    gLogger.always(req)
    gLogger.debug( "submit: incoming request %s" % req )
    result = yield self.threadTask(RPC.findFilesByMetadata, req["selection"] , req["path"])
    
    if not result[ "OK" ] :
      gLogger.error( "submit: %s" % result[ "Message" ] )
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    
    result = result[ "Value" ]
    retStrLines = []
    
    if len(result)>0:
      for key , value in result.items() :
        for fileName in value:
          retStrLines.append(key+"/"+fileName)
    
    strData = "\n".join(retStrLines)
    
    self.set_header('Content-type','text/plain')
    self.set_header('Content-Disposition', 'attachment; filename="%s.txt"' % md5( str( req ) ).hexdigest())
    self.set_header('Content-Length', len( strData ))
    self.finish(strData)
    
  @asyncGen  
  def web_getSubnodeFiles( self ):
    RPC = RPCClient( "DataManagement/FileCatalog" )
    path = self.request.arguments["path"][0]
#     print path
#     path = "/vo.cta.in2p3.fr"
    result = yield self.threadTask(RPC.listDirectory, path, False)
    if not result[ "OK" ] :
      gLogger.error( "submit: %s" % result[ "Message" ] )
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
#     print result
    filesData = result["Value"]["Successful"][path]["Files"]
    dirData = result["Value"]["Successful"][path]["SubDirs"]
    
    retData = []
    
    for entryName in dirData:
      nodeDef = { 'text' : entryName.split("/")[-1] }
      nodeDef[ 'leaf' ] = False
      nodeDef[ 'expanded' ] = False
      retData.append(nodeDef)
      
    for entryName in filesData:
      nodeDef = { 'text' : entryName.split("/")[-1] }
      nodeDef[ 'leaf' ] = True
      retData.append(nodeDef)
    
    self.finish({"success" : "true", "nodes":retData})
