#!/usr/bin/env python

import sys
import os
import urllib2
import zipfile
import platform
import stat
import subprocess

gDefaultPerms = stat.S_IWUSR | stat.S_IRUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH

def executeCommand( cmd ):
  env = {}
  # MEGAHACK FOR FUCKING OSX LION
  for k in ( 'LD_LIBRARY_PATH', 'DYLD_LIBRARY_PATH' ):
    if k in os.environ:
      env[ k ] = os.environ[ k ]
      os.environ.pop( k )
  print "Command is: %s" % " ".join( cmd ) 
  result = subprocess.call( cmd )
  for k in env:
    os.environ[ k ] = env[ k ]
  return result

here = sys.path[0]


# Check that the downdir exists
staticDir = os.path.join( here, "WebApp", "static" )
downDir = os.path.join( here, "bundles" )
if not os.path.isdir( downDir ):
  os.makedirs( downDir )

# First, download EXTJS
spinner = ".:|\-=-/|:"
extVersion = "6.0.1"
senchacmdVersion = "5.0.2.270"
extFilePath = os.path.join( downDir, "ext-%s-gpl.zip" % extVersion )
if not os.path.isfile( extFilePath ):
  print "Downloading ExtJS4..."
  remFile = False
  for srcUrl in ( 'http://cdn.sencha.com', 'http://cdn.sencha.com/ext/gpl' ):
    try:
      extURL = "%s/ext-%s-gpl.zip" % ( srcUrl, extVersion )
      print "Trying %s" % extURL
      req = urllib2.Request( extURL )
      opener = urllib2.build_opener( urllib2.HTTPSHandler( debuglevel = 111 ) )
      remFile = opener.open( req )
      break
    except Exception, excp:
      print excp
      continue
  if not remFile:
    print "Can't download extjs!"
    sys.exit( 1 )
  try:
    locFile = open( extFilePath, "wb" )
    count = 0
    remData = remFile.read( 1024 )
    while remData:
      print "%s\r" % spinner[count % len( spinner )],
      sys.stdout.flush()
      locFile.write( remData )
      remData = remFile.read( 1024 )
      count += 1
    locFile.close()
    remFile.close()
  except:
    os.unlink( extFilePath )
    raise

print "Installing ExtJS 4"
extDir = os.path.join( staticDir, "extjs" )
if True:
  zFile = zipfile.ZipFile( extFilePath )
  count = 0
  biggest = 40
  for entryName in zFile.namelist():
    biggest = max( biggest, len( entryName ) )
    print " %s %s\r" % ( spinner[count % len( spinner )], entryName.ljust( biggest, " " ) ),
    count += 1
    entryDir = os.path.join( extDir, os.path.dirname( entryName ) )
    if not os.path.isdir( entryDir ):
      os.makedirs( entryDir )
    entryPath = os.path.join( extDir, entryName )
    if os.path.isdir( entryPath ):
      continue
    localFile = open( entryPath, "w" )
    localFile.write( zFile.read( entryName ) )
    localFile.close()

print "Installing Sencha cmd"

diracDirectory = os.path.dirname( here )
dposition = diracDirectory.rfind( "pro" ) 
if dposition != -1:
  diracDirectory = diracDirectory[:dposition]
senchacmddir = os.path.join( diracDirectory, "sbin" )
senchaurl = "http://cdn.sencha.com/cmd"   
senchacmdVersion
if not os.path.exists( senchacmddir ):  # if case the sbin directory does not exists, we have to create it
  os.makedirs( senchacmddir )
senchafullpath = os.path.join( senchacmddir, "Sencha", "Cmd", senchacmdVersion )
if os.path.exists( senchafullpath ):
  print "Sencha cmd is already installed"
else:
  # The sencha cpmmand lime has to be installed
  # http://cdn.sencha.com/cmd/5.0.2.270/SenchaCmd-5.0.2.270-linux-x64.run.zip
  architecture = ""
  machineType = platform.uname()
  isMac = False
  if machineType != "":
    if machineType[0].lower().find( "linux" ) != -1:
      if machineType[4].find( "64" ) != -1:
        architecture = "linux-x64.run"
      else:
        architecture = "linux.run"  # 32 bit machine
    elif machineType[0].lower().find( "darwin" ) != -1:
      # http://cdn.sencha.com/cmd/5.0.2.270/SenchaCmd-5.0.2.270-osx.app.zip
      architecture = "osx.app"
      isMac = True
    else:
      print "This platform is not supported", machineType
      sys.exit( 1 )
  
  fileName = "SenchaCmd-%s-%s" % ( senchacmdVersion, architecture )     
  senchaDownloadUrl = os.path.join( senchaurl, "%s/%s.zip" % ( senchacmdVersion, fileName ) )
  try:
    print "Trying %s" % senchaDownloadUrl
    req = urllib2.Request( senchaDownloadUrl )
    opener = urllib2.build_opener( urllib2.HTTPSHandler( debuglevel = 111 ) )
    remFile = opener.open( req )
  except Exception, excp:
    print excp
  if not remFile:
    print "Can't download extjs!"
    sys.exit( 1 )
  
  try:
    locFile = open( os.path.join( senchacmddir, "%s.zip" % fileName ), "wb" )
    count = 0
    remData = remFile.read( 1024 )
    while remData:
      print "%s\r" % spinner[count % len( spinner )],
      sys.stdout.flush()
      locFile.write( remData )
      remData = remFile.read( 1024 )
      count += 1
    locFile.close()
    remFile.close()
  except:
    os.unlink( senchacmddir )
    raise
  
  print "Decompress %s " % fileName
  zFile = zipfile.ZipFile( os.path.join( senchacmddir, "%s.zip" % fileName ) )
  count = 0
  biggest = 40
  for entryName in zFile.namelist():
    biggest = max( biggest, len( entryName ) )
    print " %s %s\r" % ( spinner[count % len( spinner )], entryName.ljust( biggest, " " ) ),
    count += 1
    entryDir = os.path.join( senchacmddir, os.path.dirname( entryName ) )
    if not os.path.isdir( entryDir ):
      os.makedirs( entryDir )
    entryPath = os.path.join( senchacmddir, entryName )
    if os.path.isdir( entryPath ):
      continue
    localFile = open( entryPath, "w" )
    localFile.write( zFile.read( entryName ) )
    localFile.close()
  
  print "Install sencha cmd..."
  if isMac:
    rootPath = os.path.join( senchacmddir, fileName )
    for root, dirs, files in os.walk( rootPath ):
      for file in files:
        fname = os.path.join( root, file )
        os.chmod( fname, gDefaultPerms )            
    cmd = [os.path.join( senchacmddir, fileName, "Contents/MacOS/installbuilder.sh" ), "--prefix", senchacmddir, "--mode", "unattended"]
    if executeCommand( cmd ):
      print "Error during sencha cmd installation"
  else:
    os.chmod( os.path.join( senchacmddir, fileName ), gDefaultPerms )
    cmd = [os.path.join( senchacmddir, fileName ), "--prefix", senchacmddir, "--mode", "unattended"]
    if executeCommand( cmd ):
      print "Error during sencha cmd installation"
