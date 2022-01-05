from WebAppDIRAC.Lib.WebHandler import _WebHandler as WebHandler
from DIRAC.Core.Utilities import Time


class ExampleAppHandler(WebHandler):

    DEFAULT_AUTHORIZATION = "all"

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
        return {"success": "true", "result": values, "total": total, "date": timestamp}

    def web_getSelectionData(self):
        return {"firstName": ["A", "C", "D"], "lastName": ["wwww", "dsds", "sads"]}
