
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
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

class ConfigurationManagerHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  __configData = {}
  
  def __getRemoteConfiguration( self ):
    rpcClient = RPCClient( gConfig.getValue( "/DIRAC/Configuration/MasterServer", "Configuration/Server" ) )
    modCfg = Modificator( rpcClient )
    retVal = modCfg.loadFromRemote()
    if retVal[ 'OK' ]:
      ConfigurationManagerHandler.__configData[ 'cfgData' ] = str( modCfg )
      ConfigurationManagerHandler.__configData[ 'csName' ] = "%s Configuration" % ( modCfg.getValue( "/DIRAC/VirtualOrganization" ) )
    return retVal
  
  def web_initializeConfigurationCopy(self):
    retVal = self.__getRemoteConfiguration()
    print ConfigurationManagerHandler.__configData.keys()
    self.write(json.dumps({"OK":1}))
      

  def web_getSubnodes( self ):
    try:
      parentNodeId = str( self.request.arguments[ 'node' ][0] )
      sectionPath = str( self.request.arguments[ 'nodePath' ][0] )
    except Exception, e:
      return S_ERROR( "Cannot expand section %s" % str( e ) )
    
    cfgData = CFG()
    cfgData.loadFromBuffer( ConfigurationManagerHandler.__configData[ 'cfgData' ] )
    gLogger.info( "Expanding section", "%s" % sectionPath )
#     print ConfigurationManagerHandler.__configData[ 'cfgData' ]
    try:
      sectionCfg = cfgData
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
    self.write(json.dumps({"nodes":retData}))