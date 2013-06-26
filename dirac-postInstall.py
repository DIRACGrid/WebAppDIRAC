#!/usr/bin/env python

import sys
import os
import urllib2
import zipfile

here = sys.path[0]

#Check that the downdir exists
staticDir = os.path.join( here, "WebApp", "static" )
downDir = os.path.join( here, "bundles" )
if not os.path.isdir( downDir ):
  os.makedirs( downDir )

#First, download EXTJS
spinner = ".:|\-=-/|:"
extVersion = "4.2.1"
extFilePath = os.path.join( downDir, "ext-%s-gpl.zip" % extVersion )
if not os.path.isfile( extFilePath ):
  print "Downloading ExtJS4..."
  remFile = False
  for srcUrl in ( 'http://cdn.sencha.com', 'http://cdn.sencha.com/ext/gpl' ):
    try:
      extURL = "%s/ext-%s-gpl.zip" % ( srcUrl, extVersion )
      print "Trying %s" % extURL
      remFile = urllib2.urlopen( extURL , "rb" )
      break
    except Exception, excp:
      print excp
      continue
  if not remFile:
    print "Can't download extjs!"
    sys.exit(1)
  try:
    locFile = open( extFilePath, "wb" )
    count = 0
    remData = remFile.read( 1024  )
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
    print " %s %s\r" % ( spinner[count%len(spinner)], entryName.ljust( biggest, " " ) ),
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

