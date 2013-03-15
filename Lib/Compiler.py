import tempfile
import os
import subprocess

from DIRAC import gLogger, S_OK, S_ERROR
from DIRAC.ConfigurationSystem.Client.Helpers.CSGlobals import getInstalledExtensions
from WebAppDIRAC.Lib.SessionData import SessionData
from WebAppDIRAC.Core.HandlerMgr import HandlerMgr

class Compiler(object):

  def __init__( self ):
    self.__extVersion = SessionData.getExtJSVersion()
    self.__staticPaths = HandlerMgr().getPaths( "static" )
    self.__extensions = getInstalledExtensions()
    self.__webAppPath = os.path.dirname( self.__staticPaths[-1] )
    self.__extPath = os.path.join( self.__webAppPath, "static", "extjs", self.__extVersion )
    self.__sdkPath = os.path.join( self.__webAppPath, "static", "extjs", self.__extVersion, "src" )

    self.__classPaths = [ os.path.join( self.__webAppPath, *p ) for p in ( ("static", "core", "js", "utils" ),
                                                                           ("static", "core", "js", "core" ))]
    self.__classPaths.append( os.path.join( self.__extPath, "examples", "ux", "form" ) )

    self.__debugFlag = str( gLogger.getLevel() in ( 'DEBUG', 'VERBOSE', 'INFO' ) ).lower()
    self.__inDir = os.path.join( os.path.dirname( self.__webAppPath ), "Lib", "CompileTemplates" )

  def __writeINFile( self, tplName, extra = False ):
    inTpl = os.path.join( self.__inDir, tplName )
    try:
      with open( inTpl ) as infd:
        data = infd.read()
    except IOError:
      return S_ERROR( "%s does not exist" % inTpl )
    data = data.replace( "%EXT_VERSION%", self.__extVersion )
    if extra:
      for k in extra:
        data = data.replace( "%%%s%%" % k.upper(), extra[k] )
    outfd, filepath = tempfile.mkstemp( ".compilejs.%s" % tplName )
    os.write( outfd, data )
    os.close( outfd )
    return S_OK( filepath )

  def __cmd( self, cmd ):
    env = {}
    #MEGAHACK FOR FUCKING OSX LION
    for k in ( 'LD_LIBRARY_PATH', 'DYLD_LIBRARY_PATH' ):
      env[ k ] = os.environ[ k ]
      os.environ.pop(k)
    gLogger.verbose( "Command is: %s" % " ".join( cmd ) )
    result = subprocess.call( cmd )
    for k in env:
      os.environ[ k ] = env[ k ]
    return result

  def __compileApp( self, extPath, extName, appName ):
    result = self.__writeINFile( "app.tpl", { 'APP_LOCATION' : '%s.%s.classes.%s' % ( extName, appName, appName ) } )
    if not result[ 'OK' ]:
      return result
    inFile = result[ 'Value' ]
    buildDir = os.path.join( extPath, appName, 'build' )
    if not os.path.isdir( buildDir ):
      try:
        os.makedirs( buildDir )
      except IOError, excp:
        return S_ERROR( "Can't create build dir %s" % excp )
    outFile = os.path.join( buildDir, "index.html" )

    classPath = list( self.__classPaths )
    classPath.append( os.path.join( extPath, appName, "classes" ) )
    cmd = [ 'sencha', '-sdk', self.__sdkPath, 'compile', '-classpath=%s' % ",".join( classPath ),
            '-debug=%s' % self.__debugFlag, 'page', '-yui', '-in', inFile, '-out', outFile ]
    if self.__cmd( cmd ):
      return S_ERROR( "Error compiling %s.%s" % ( extName, appName ) )

    try:
      with open( os.path.join( buildDir, "all-classes.js" ) ) as allFD:
        lines = allFD.readlines()
        with open( os.path.join( buildDir, "%s.js" % appName ), "w" ) as appFD:
          #Skip first line
          appFD.write( "".join( lines[1:] ) )
    except IOError, excp:
      return S_ERROR( "Could not read/write js: %s" % excp )

    try:
      os.unlink( os.path.join( buildDir, "all-classes.js" ) )
      os.unlink( outFile )
    except:
      pass
    return S_OK()



  def run( self ):
    gLogger.notice( "Compiling core" )
    result = self.__writeINFile( "core.tpl" )
    if not result[ 'OK' ]:
      return result
    inFile = result[ 'Value' ]
    outFile = os.path.join( self.__webAppPath, "static", "core", "build", "index.html" )
    gLogger.verbose( " IN file written to %s" % inFile )

    cmd = [ 'sencha', '-sdk', self.__sdkPath, 'compile', '-classpath=%s' % ",".join( self.__classPaths ),
            '-debug=%s' % self.__debugFlag, 'page', '-yui', '-in', inFile, '-out', outFile ]

    if self.__cmd( cmd ):
      gLogger.error( "Error compiling JS" )
      return S_ERROR( "Failed compiling core" )

    try:
      os.unlink( inFile )
    except IOError:
      pass

    for staticPath in self.__staticPaths:
      gLogger.notice( "Looing into %s" % staticPath )
      for extName in self.__extensions:
        extPath = os.path.join( staticPath, extName )
        if not os.path.isdir( extPath ):
          continue
        gLogger.notice( "Exploring %s" % extName )
        for appName in os.listdir( extPath ):
          expectedJS = os.path.join( extPath, appName, "classes", "%s.js" % appName )
          if not os.path.isfile( expectedJS ):
            continue
          gLogger.notice( "Trying to compile %s.%s.classes.%s" % ( extName, appName, appName ) )
          result = self.__compileApp( extPath, extName, appName )
          if not result[ 'OK' ]:
            return result

    return S_OK()


