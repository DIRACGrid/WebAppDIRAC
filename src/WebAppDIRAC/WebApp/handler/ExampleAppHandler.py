from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen
from DIRAC.Core.Utilities import Time


class ExampleAppHandler(WebHandler):

    AUTH_PROPS = "all"

    @asyncGen
    def web_getJobData(self):
        timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
        total = 5
        values = [
            {"ExampleId": 1, "ExampleValue": "Zoli"},
            {"ExampleId": 2, "ExampleValue": "a"},
            {"ExampleId": 3, "ExampleValue": "aaaa"},
            {"ExampleId": 4, "ExampleValue": "bbbb"},
            {"ExampleId": 5, "ExampleValue": "adsd"},
        ]
        callback = {"success": "true", "result": values, "total": total, "date": timestamp}
        self.finish(callback)

    @asyncGen
    def web_getSelectionData(self):
        callback = {"firstName": ["A", "C", "D"], "lastName": ["wwww", "dsds", "sads"]}
        self.finish(callback)
