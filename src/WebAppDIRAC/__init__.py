""" WebAppDIRAC
"""

# Define Version
from pkg_resources import get_distribution, DistributionNotFound

try:
    __version__ = get_distribution(__name__).version
    version = __version__
except DistributionNotFound:
    # package is not installed
    version = "Unknown"


def extension_metadata():
    import importlib.resources  # pylint: disable=import-error,no-name-in-module

    return {
        "priority": 10,
        "web_resources": {
            "static": [importlib.resources.files("WebAppDIRAC") / "WebApp" / "static"],  # pylint: disable=no-member
            "template": [importlib.resources.files("WebAppDIRAC") / "WebApp" / "template"],  # pylint: disable=no-member
        },
    }
