from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class PublicStateManagerHandler(WebHandler):

    AUTH_PROPS = "authenticated"

    @asyncGen
    def web_getTreeMenuItems(self):
        applications = {}
        desktops = {}
        tree = {"text": ".", "children": [applications, desktops]}
