# $HeadURL$
__RCSID__ = "$Id$"

import sys, os, platform

# Define Version

majorVersion = 0
minorVersion = 0
patchLevel = 0
preVersion = 0

version = "v%sr%s" % ( majorVersion, minorVersion )
buildVersion = "v%dr%d" % ( majorVersion, minorVersion )
if patchLevel:
  version = "%sp%s" % ( version, patchLevel )
  buildVersion = "%s build %s" % ( buildVersion, patchLevel )
if preVersion:
  version = "%s-pre%s" % ( version, preVersion )
  buildVersion = "%s pre %s" % ( buildVersion, preVersion )

# Check of python version

rootPath = os.path.realpath( os.path.dirname( __file__ ) )

