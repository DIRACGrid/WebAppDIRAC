
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.TransferClient import TransferClient
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC import gConfig, S_OK, S_ERROR
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
  '''
  def __getRemoteConfiguration( self ):
    rpcClient = RPCClient( gConfig.getValue( "/DIRAC/Configuration/MasterServer", "Configuration/Server" ) )
    modCfg = Modificator( rpcClient )
    retVal = modCfg.loadFromRemote()
    if retVal[ 'OK' ]:
      session[ 'cfgData' ] = str( modCfg )
      session[ 'csName' ] = "%s Configuration" % ( modCfg.getValue( "/DIRAC/VirtualOrganization" ) )
      session.save()
      c.cfgData = modCfg.cfgData
      c.csName = session[ 'csName' ]
    return retVal
  
  def web_initializeConfigurationCopy(self):
    self.__getRemoteConfiguration()
  '''  

  def web_getSubnodes( self ):
    
    retData = {"nodes":[{"csComment": "", "text": "Configuration", "csName": "Configuration"}, {"csComment": "", "text": "Setups", "csName": "Setups"}]}
    self.write(json.dumps(retData))
    
    '''
    try:
      parentNodeId = str( self.request.arguments[ 'node' ] )
      sectionPath = str( self.request.arguments[ 'nodePath' ] )
    except Exception, e:
      return S_ERROR( "Cannot expand section %s" % str( e ) )
    
    cfgData = CFG()
    cfgData.loadFromBuffer( session[ 'cfgData' ] )
#     gLogger.info( "Expanding section", "%s" % sectionPath )
    try:
      sectionCfg = cfgData
      for section in [ section for section in sectionPath.split( "/" ) if not section.strip() == "" ]:
        sectionCfg = sectionCfg[ section ]
    except Exception, v:
      gLogger.error( "Section does not exist", "%s -> %s" % ( sectionPath, str( v ) ) )
      return S_ERROR( "Section %s does not exist: %s" % ( sectionPath, str( v ) ) )
#     gLogger.verbose( "Section to expand %s" % sectionPath )
    retData = []
    for entryName in sectionCfg.listAll():
      id = "%s/%s" % ( parentNodeId, entryName )
      comment = sectionCfg.getComment( entryName )
      nodeDef = { 'text' : entryName, 'csName' : entryName, 'csComment' : comment }
      if not sectionCfg.isSection( entryName ):
         nodeDef[ 'leaf' ] = True
         nodeDef[ 'csValue' ] = sectionCfg[ entryName ]
      #Comment magic
      htmlC = self.__htmlComment( comment )
      if htmlC:
        qtipDict = { 'text' : htmlC }
        nodeDef[ 'qtipCfg' ] = qtipDict
      retData.append( nodeDef )
    self.write(json.dumps(retData))
    '''