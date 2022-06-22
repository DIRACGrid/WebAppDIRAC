from WebAppDIRAC.Lib.WebHandler import _WebHandler as WebHandler


class PublicStateManagerHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "authenticated"

    def web_getTreeMenuItems(self):
        applications = {}
        desktops = {}
        tree = {"text": ".", "children": [applications, desktops]}
