#!/usr/bin/env python

import sys
from DIRAC.Core.Base import Script

Script.parseCommandLine()

from DIRAC import gLogger
from WebAppDIRAC.Lib.Compiler import Compiler

if __name__ == "__main__":
  result = Compiler().run()
  if not result[ 'OK' ]:
    gLogger.fatal( result[ 'Message' ] )
    sys.exit(1)
  sys.exit(0)

