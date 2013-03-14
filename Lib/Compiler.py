import tempfile
import os
import subprocess

from DIRAC import gLogger, S_OK, S_ERROR
from WebAppDIRAC.Lib.SessionData import SessionData
from WebAppDIRAC.Core.HandlerMgr import HandlerMgr

class Compiler(object):

  def __init__( self ):
    self.__extVersion = SessionData.getExtJSVersion()
    self.__staticPaths = HandlerMgr().getPaths( "static" )
    self.__webAppPath = os.path.dirname( self.__staticPaths[-1] )
    self.__extPath = os.path.join( self.__webAppPath, "static", "extjs", self.__extVersion )
    self.__sdkPath = os.path.join( self.__webAppPath, "static", "extjs", self.__extVersion, "src" )

    self.__classPaths = [ os.path.join( self.__webAppPath, *p ) for p in ( ("static", "core", "js", "utils" ),("static", "core", "js", "core" ))]
    self.__classPaths.append(os.path.join( self.__extPath,"examples", "ux", "form" ))

    print self.__classPaths    
    self.__debugFlag = gLogger.getLevel() in ( 'DEBUG', 'VERBOSE', 'INFO' )
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

  def __sencha( self, cmd ):
    senchaCmd = [ "sencha" ]
    senchaCmd.extend( cmd )
    env = {}
    #MEGAHACK FOR FUCKING OSX LION
#    for k in ( 'LD_LIBRARY_PATH', 'DYLD_LIBRARY_PATH' ):
#      env[ k ] = os.environ[ k ]
#      os.environ.pop(k)
    gLogger.verbose( "Command is: %s" % " ".join( senchaCmd ) )
    print "Command is: %s" % " ".join( senchaCmd )
    result = subprocess.call( senchaCmd )
#    for k in env:
#      os.environ[ k ] = env[ k ]
    return result

  def run( self ):
    gLogger.notice( "Compiling core" )
    result = self.__writeINFile( "core.tpl" )
    if not result[ 'OK' ]:
      return result
    inFile = result[ 'Value' ]
    outFile = os.path.join( self.__webAppPath, "static", "core", "build", "index.html" )
    gLogger.verbose( " IN file written to %s" % inFile )

    cmd = [ '-sdk', self.__sdkPath, 'compile', '-classpath=%s' % ",".join( self.__classPaths ),
            '-debug=%s' % self.__debugFlag, 'page', '-yui', '-in', inFile, '-out', outFile ]

    if self.__sencha( cmd ):
      gLogger.error( "Error compiling JS" )
      return S_ERROR( "Failed compiling core" )

#    for staticPath in staticPaths:
#      gLogger.notice( "Looing into %s" % staticPath )

    return S_OK()


