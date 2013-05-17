
from WebAppDIRAC.Lib.WebHandler import WebHandler,WebSocketHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.TransferClient import TransferClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Security import CS
from DIRAC.Core.Utilities import Time, List, DictCache
from DIRAC.AccountingSystem.Client.ReportsClient import ReportsClient

from DIRAC.Core.Utilities.CFG import CFG
from DIRAC.ConfigurationSystem.private.Modificator import Modificator

import tempfile
import datetime 
import simplejson
import json
import ast

try:
  from hashlib import md5
except:
  from md5 import md5


class ConfigurationManagerHandler(WebSocketHandler):

  AUTH_PROPS = "authenticated"

  def on_open( self  ):
    self.__configData = {}

  def on_message( self, msg ):
    self.log.info( "RECEIVED %s" % msg )
    try:
      params = simplejson.loads( msg )
    except:
      gLogger.exception( "No op defined" )
    
    if params["op"] == "init":
      self.__getRemoteConfiguration()
    elif params["op"] == "getSubnodes":
      self.__getSubnodes(params["node"],params["nodePath"])
      
  
  def __getRemoteConfiguration( self ):
    rpcClient = RPCClient( gConfig.getValue( "/DIRAC/Configuration/MasterServer", "Configuration/Server" ) )
    modCfg = Modificator( rpcClient )
    retVal = modCfg.loadFromRemote()
    if retVal[ 'OK' ]:
      self.__configData[ 'cfgData' ] = modCfg 
#       modCfg.getOption( "/DIRAC/Configuration/Version", "0" )
      #self.__configData[ 'csName' ] = "%s Configuration" % ( modCfg.getValue( "/DIRAC/VirtualOrganization" ) )
    self.write_message(json.dumps({"success":1, "op":"init"}))
    
  def __getSubnodes( self, parentNodeId, sectionPath ):
   
    gLogger.info( "Expanding section", "%s" % sectionPath )

    try:
      sectionCfg = self.__configData[ 'cfgData' ].getCFG()
      for section in [ section for section in sectionPath.split( "/" ) if not section.strip() == "" ]:
        sectionCfg = sectionCfg[ section ]
    except Exception, v:
      gLogger.exception( "Section does not exist", "%s -> %s" % ( sectionPath, str( v ) ) )
      return S_ERROR( "Section %s does not exist: %s" % ( sectionPath, str( v ) ) )
    gLogger.verbose( "Section to expand %s" % sectionPath )
      
    retData = []
    
    for entryName in sectionCfg.listAll():
      id = "%s/%s" % ( parentNodeId, entryName )
      comment = sectionCfg.getComment( entryName )
      nodeDef = { 'text' : entryName, 'csName' : entryName, 'csComment' : comment }
      nodeDef[ 'leaf' ] = False
      nodeDef[ 'expanded' ] = False
      if not sectionCfg.isSection( entryName ):
         nodeDef[ 'leaf' ] = True
         nodeDef[ 'csValue' ] = sectionCfg[ entryName ]
         nodeDef[ 'text' ] = nodeDef[ 'text' ] + " = " + nodeDef[ 'csValue' ]  
         
      #Comment magic
      htmlC = comment #self.__htmlComment( comment )
      if htmlC:
        qtipDict = { 'text' : htmlC }
        nodeDef[ 'qtipCfg' ] = qtipDict
      retData.append( nodeDef )
    self.write_message(json.dumps({"success":1, "op":"getSubnodes", "nodes":retData, "parentNodeId":parentNodeId}))
    