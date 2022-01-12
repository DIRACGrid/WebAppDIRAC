""" WebAppDIRAC
"""
from __future__ import print_function
from __future__ import absolute_import
from __future__ import division

__RCSID__ = "$Id$"

import six


# Define Version
if six.PY3:
    from pkg_resources import get_distribution, DistributionNotFound

    try:
        __version__ = get_distribution(__name__).version
        version = __version__
    except DistributionNotFound:
        # package is not installed
        version = "Unknown"
else:
    majorVersion = 4
    minorVersion = 3
    patchLevel = 10
    preVersion = 0

    version = "v%sr%s" % (majorVersion, minorVersion)
    buildVersion = "v%dr%d" % (majorVersion, minorVersion)
    if patchLevel:
        version = "%sp%s" % (version, patchLevel)
        buildVersion = "%s build %s" % (buildVersion, patchLevel)
    if preVersion:
        version = "%s-pre%s" % (version, preVersion)
        buildVersion = "%s pre %s" % (buildVersion, preVersion)


def extension_metadata():
    import importlib.resources  # pylint: disable=import-error,no-name-in-module

    return {
        "priority": 10,
        "web_resources": {
            "static": [importlib.resources.files("WebAppDIRAC") / "WebApp" / "static"],  # pylint: disable=no-member
            "template": [importlib.resources.files("WebAppDIRAC") / "WebApp" / "template"],  # pylint: disable=no-member
        },
    }
