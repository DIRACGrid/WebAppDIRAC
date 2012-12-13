
from tornado.web import HTTPError
from WebAppDIRAC.Lib.WebHandler import WebHandler
import json

class GridWindowHandler(WebHandler):

  def web_getGridData(self):
    result = [{'company':'3m Co', 'price':71.72, 'change':0.02, 'pctChange':0.03}, 
              {'company':'3m Co', 'price':71.72, 'change':0.02, 'pctChange':0.03}, 
              {'company':'3m Co', 'price':71.72, 'change':0.02, 'pctChange':0.03}]
    self.write(json.dumps(result))
                
    
    
