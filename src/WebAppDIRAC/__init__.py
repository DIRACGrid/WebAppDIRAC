""" WebAppDIRAC
"""

# Define Version
import importlib.resources

try:
    version = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    # package is not installed
    version = "Unknown"


def extension_metadata():
    return {
        "priority": 10,
        "web_resources": {
            "static": [importlib.resources.files("WebAppDIRAC") / "WebApp" / "static"],  # pylint: disable=no-member
            "template": [importlib.resources.files("WebAppDIRAC") / "WebApp" / "template"],  # pylint: disable=no-member
        },
    }
