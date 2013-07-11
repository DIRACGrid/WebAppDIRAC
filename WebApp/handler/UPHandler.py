
import base64
import zlib
import json
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.Utilities import DEncode
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient


class UPHandler( WebHandler ):

  AUTH_PROPS = "authenticated"
  __tc = ThreadConfig()

  def prepare( self ):
    if not self.isRegisteredUser():
      raise WErr( 401, "Not a registered user" )
    self.set_header( "Pragma", "no-cache" )
    self.set_header( "Cache-Control", "max-age=0, no-store, no-cache, must-revalidate" )
    #Do not use the defined user setup. Use the web one to show the same profile independenly of
    # user setup
    self.__tc.setSetup( False )

  def __getUP( self ):
    try:
      obj = self.request.arguments[ 'obj' ][-1]
      app = self.request.arguments[ 'app' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    return UserProfileClient( "Web/%s/%s" % ( obj, app ) )

  @asyncGen
  def web_saveAppState( self ):
    up = self.__getUP()
    try:
      name = self.request.arguments[ 'name' ][-1]
      state = self.request.arguments[ 'state' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    data = base64.b64encode( zlib.compress( DEncode.encode( state ), 9 ) )
    result = yield self.threadTask( up.storeVar, name, data )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result )
    self.set_status( 200 )
    self.finish()

  @asyncGen
  def web_makePublicAppState( self ):
    up = self.__getUP()
    try:
      name = self.request.arguments[ 'name' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    try:
      access = self.request.arguments[ 'access' ][-1].upper()
    except KeyError as excp:
      access = 'ALL'
    if access not in ( 'ALL', 'VO', 'GROUP' ):
      raise WErr( 400, "Invalid access" )
    #TODO: Check access is in either 'ALL', 'VO' or 'GROUP'
    result = yield self.threadTask( up.setVarPermissions, name, { 'ReadAccess': access } )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result )
    self.set_status( 200 )
    self.finish()

  @asyncGen
  def web_loadAppState( self ):
    up = self.__getUP()
    try:
      name = self.request.arguments[ 'name' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    result = yield self.threadTask( up.retrieveVar, name )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result)
    data = result[ 'Value' ]
    data, count = DEncode.decode( zlib.decompress( base64.b64decode( data ) ) )
    self.finish( data )

  @asyncGen
  def web_loadUserAppState( self ):
    up = self.__getUP()
    try:
      user = self.request.arguments[ 'user' ][-1]
      group = self.request.arguments[ 'group' ][-1]
      name = self.request.arguments[ 'name' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    result = yield self.threadTask( up.retrieveVarFromUser, user, group, name )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result )
    data = result[ 'Value' ]
    data, count = DEncode.decode( zlib.decompress( base64.b64decode( data ) ) )
    self.finish( data )

  @asyncGen
  def web_listAppState( self ):
    up = self.__getUP()
    result = yield self.threadTask( up.retrieveAllVars )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result )
    data = result[ 'Value' ]
    for k in data:
      #Unpack data
      data[ k ] = json.loads( DEncode.decode( zlib.decompress( base64.b64decode( data[ k ] ) ) )[0] )
    self.finish( data )

  @asyncGen
  def web_delAppState( self ):
    up = self.__getUP()
    try:
      name = self.request.arguments[ 'name' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    result = yield self.threadTask( up.deleteVar, name )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result)
    self.finish()

