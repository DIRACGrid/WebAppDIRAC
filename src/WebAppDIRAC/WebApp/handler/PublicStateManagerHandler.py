from WebAppDIRAC.Lib.WebHandler import _WebHandler


class PublicStateManagerHandler(_WebHandler):

    AUTH_PROPS = "authenticated"

    def web_getTreeMenuItems(self):
        applications = {}
        desktops = {}
        tree = {"text": ".", "children": [applications, desktops]}
