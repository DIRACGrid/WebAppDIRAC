import os
from DIRAC import S_OK, S_ERROR, gConfig, gLogger
from DIRAC.Core.Utilities import List
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
from DIRAC.ConfigurationSystem.Client.Helpers import CSGlobals
from DIRAC.Core.DISET.AuthManager import AuthManager
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from WebAppDIRAC.Lib import Conf

class SessionData( object ):


  __disetConfig = ThreadConfig()
  __handlers = {}
  __groupMenu = {}
  __extensions = []
  __extVersion = False

  @classmethod
  def setHandlers( cls, handlers ):
    cls.__handlers = {}
    for k in handlers:
      handler = handlers[ k ]
      cls.__handlers[ handler.LOCATION.strip("/") ] = handler
    #Calculate extensions
    cls.__extensions = []
    for ext in CSGlobals.getInstalledExtensions():
      if ext in ( "WebAppDIRAC", "DIRAC" ):
        continue
      cls.__extensions.append( ext )
    cls.__extensions.append( "DIRAC" )
    cls.__extensions.append( "WebAppDIRAC" )

  def __isGroupAuthApp( self, appLoc, credDict ):
    handlerLoc = "/".join( List.fromChar( appLoc, "." )[1:] )
    if not handlerLoc:
      return False
    if handlerLoc not in self.__handlers:
      gLogger.error( "Handler %s required by %s does not exist!" % ( handlerLoc, appLoc ) )
      return False
    handler = self.__handlers[ handlerLoc ]
    auth = AuthManager( Conf.getAuthSectionForHandler( handlerLoc ) )
    return auth.authQuery( "", credDict, handler.AUTH_PROPS )

  def __generateSchema( self, base, path, credDict ):
    """
    Generate a menu schema based on the user credentials
    """
    #Calculate schema
    schema = []
    fullName = "%s/%s" % ( base, path )
    result = gConfig.getSections( fullName )
    if not result[ 'OK' ]:
      return schema
    sectionsList = result[ 'Value' ]
    for sName in sectionsList:
      subSchema = self.__generateSchema( base, "%s/%s" % ( path, sName ), credDict )
      if subSchema:
        schema.append( ( sName, subSchema ) )
    result = gConfig.getOptions( fullName )
    if not result[ 'OK' ]:
      return schema
    optionsList = result[ 'Value' ]
    for opName in optionsList:
      opVal = gConfig.getValue( "%s/%s" % ( fullName, opName ) )
      if opVal.find( "link|" ) == 0:
        schema.append( ( "link", opName, opVal[5:] ) )
        continue
      if self.__isGroupAuthApp( opVal, credDict ):
        schema.append( ( "app", opName, opVal ) )
    return schema

  def __getCredDict( self, DN, group ):
    """
    Generate a credDict based on the credentials
    """
    if not group or not DN:
      return {}
    users = Registry.getUsersInGroup( group )
    if not users:
      gLogger.error( "Group %s does not have any user!" % group )
      return {}
    result = Registry.getUsernameForDN( DN )
    if not result[ 'OK' ]:
      return {}
    user = result[ 'Value' ]
    if user not in users:
      return {}
    return { 'DN' : DN, 'group' : group, 'username' : user }


  def __getGroupMenu( self, credDict, group ):
    """
    Load the schema from the CS and filter based on the group
    """
    #Somebody coming from HTTPS and not with a valid group
    if group and not 'group' in credDict:
      group = ""
    #Cache time!
    if group not in self.__groupMenu:
      base = "%s/Schema" % ( Conf.BASECS )
      self.__groupMenu[ group ] = self.__generateSchema( base, "", credDict )
    return self.__groupMenu[ group ]


  @classmethod
  def getWebAppPath( cls ):
    return  os.path.join( os.path.dirname( os.path.dirname( os.path.realpath( __file__ ) ) ), "WebApp" )

  @classmethod
  def getExtJSVersion( cls ):
    if not cls.__extVersion:
      extPath = os.path.join( cls.getWebAppPath(), "static", "extjs" )
      extVersionPath = []
      for entryName in os.listdir( extPath ):
        if entryName.find( "ext-" ) == 0:
          extVersionPath.append( entryName )

      cls.__extVersion = sorted( extVersionPath )[-1]
    return cls.__extVersion

  def getData( self ):
    DN = self.__disetConfig.getDN()
    group = self.__disetConfig.getGroup()
    credDict = self.__getCredDict( DN, group )
    data = { 'menu' : self.__getGroupMenu( credDict, group ),
             'user' :  credDict,
             'validGroups' : [],
             'setup' : self.__disetConfig.getSetup() or gConfig.getValue( "/DIRAC/Setup", "" ),
             'validSetups' : gConfig.getSections( "/DIRAC/Setups" )[ 'Value' ],
             'extensions' : self.__extensions,
             'extVersion' : self.getExtJSVersion() }
    #Add valid groups if known
    if DN:
      result = Registry.getGroupsForDN( DN )
      if result[ 'OK' ]:
        data[ 'validGroups' ] = result[ 'Value' ]
    #Calculate baseURL
    baseURL = [ Conf.rootURL().strip( "/" ),
                "s:%s" % data[ 'setup' ],
                "g:%s" % credDict.get( 'group', 'anon' )  ]
    data[ 'baseURL' ] = "/%s" % "/".join( baseURL )
    return data
