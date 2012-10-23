
import base64
import zlib
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.Utilities import DEncode
from DIRAC.Core.DISET.ThreadConfig import ThreadConfig
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient

class UPHandler( WebHandler ):

  __tc = ThreadConfig()


  def prepare( self ):
    if not self.isRegisteredUser():
      raise WErr( 401, "Not a registered user" )
    self.set_header( "Pragma", "no-cache" )
    self.set_header( "Cache-Control", "max-age=0, no-store, no-cache, must-revalidate" )


  @asyncGen
  def web_saveAppState( self ):
    self.__tc.setSetup( False )
    try:
      app = self.request.arguments[ 'app' ][-1]
      name = self.request.arguments[ 'name' ][-1]
      state = self.request.arguments[ 'state' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    data = base64.b64encode( zlib.compress( DEncode.encode( state ), 9 ) )
    up = UserProfileClient( "Web/App/%s" % app )
    result = yield self.threadTask( up.storeVar, name, data )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result)
    self.set_status( 200 )
    self.finish()

  @asyncGen
  def web_loadAppState( self ):
    self.__tc.setSetup( False )
    try:
      app = self.request.arguments[ 'app' ][-1]
      name = self.request.arguments[ 'name' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    up = UserProfileClient( "Web/App/%s" % app )
    result = yield self.threadTask( up.retrieveVar, name )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result)
    data = result[ 'Value' ]
    data, count = DEncode.decode( zlib.decompress( base64.b64decode( data ) ) )
    self.set_header( "Content-Type", "application/json" )
    self.finish( data )

  @asyncGen
  def web_listAppState( self ):
    self.__tc.setSetup( False )
    try:
      app = self.request.arguments[ 'app' ][-1]
    except KeyError as excp:
      raise WErr( 400, "Missing %s" % excp )
    up = UserProfileClient( "Web/App/%s" % app )
    result = yield self.threadTask( up.listAvailableVars, { 'UserName' : [ self.getUserName() ] } )
    if not result[ 'OK' ]:
      raise WErr.fromSERROR( result)
    data = result[ 'Value' ]
    self.finish( { 'app': [ e[-1] for e in data ] } )

