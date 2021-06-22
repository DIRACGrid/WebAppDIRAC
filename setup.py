from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import subprocess
from pathlib import Path
from setuptools import setup


# HACK: Compile the webapp sources
subprocess.run(
    [
        "docker",
        "run",
        "--rm",
        f"-v={Path(__file__).parent}:/shared",
        "-w=/shared",
        "diracgrid/dirac-distribution",
        "/dirac-webapp-compile.py",
        "-D=/shared/src",
        "-n=WebAppDIRAC",
    ],
    check=True
)

# This is required to allow editable pip installs while using the declarative configuration (setup.cfg)
setup()
