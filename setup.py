#!/usr/bin/env python

from distutils.core import setup

setup( name='WIRAC',
      version='v0r0p1',
      description='Web framework for DIRAC',
      author='Adria Casajus',
      author_email='adria@ecm.ub.es',
      packages=[ 'tornado=2.4.0' ],
     )