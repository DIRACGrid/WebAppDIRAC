""" WebAppDIRAC
"""

from __future__ import print_function
from __future__ import absolute_import
from __future__ import division

__RCSID__ = "$Id$"

import os

# Define Version

majorVersion = 4
minorVersion = 2
patchLevel = 0
preVersion = 3

version = "v%sr%s" % (majorVersion, minorVersion)
buildVersion = "v%dr%d" % (majorVersion, minorVersion)
if patchLevel:
  version = "%sp%s" % (version, patchLevel)
  buildVersion = "%s build %s" % (buildVersion, patchLevel)
if preVersion:
  version = "%s-pre%s" % (version, preVersion)
  buildVersion = "%s pre %s" % (buildVersion, preVersion)

# Check of python version

rootPath = os.path.realpath(os.path.dirname(__file__))
