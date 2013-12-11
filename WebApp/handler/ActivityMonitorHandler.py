from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.DISET.TransferClient import TransferClient
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
import tempfile
import simplejson
import json
import ast

class ActivityMonitorHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getActivityData(self):
    try:
      start = int(self.request.arguments[ 'start' ][0])
    except:
      start = 0
    try:
      limit = int(self.request.arguments[ 'limit' ][0])
    except:
      limit = 0

    try:
      sortField = str(self.request.arguments[ 'sortField' ][0]).replace("_", ".")
      sortDir = str(self.request.arguments[ 'sortDirection' ][0])
      sort = [ (sortField, sortDir) ]
    except:
      sort = []
      
    rpcClient = RPCClient("Framework/Monitoring")
    retVal = yield self.threadTask(rpcClient.getActivitiesContents, {}, sort, start, limit)
    
    if not retVal[ 'OK' ]:
      self.finish({"success":"false", "result":[], "total":-1, "error":retVal["Message"]})
      return
    
    svcData = retVal[ 'Value' ]
    callback = {'success':'true', 'total' : svcData[ 'TotalRecords' ], 'result' : [] }
    now = Time.toEpoch()
    for record in svcData[ 'Records' ]:
      formatted = {}
      for i in range(len(svcData[ 'Fields' ])):
        formatted[ svcData[ 'Fields' ][i].replace(".", "_") ] = record[i]
      if 'activities_lastUpdate' in formatted:
        formatted[ 'activities_lastUpdate' ] = now - int(formatted[ 'activities_lastUpdate' ])
      callback[ 'result' ].append(formatted)
      
    self.finish(callback)
  
  def __dateToSecs(self, timeVar):
    dt = Time.fromString(timeVar)
    return int(Time.toEpoch(dt))
  
  @asyncGen
  def web_plotView(self):

    plotRequest = {}
    try:
      if 'id' not in self.request.arguments:
        self.finish({ 'success' : "false", 'error' : "Missing viewID in plot request" })
        return
      plotRequest[ 'id' ] = self.request.arguments[ 'id' ][0]
      if 'size' not in self.request.arguments:
        self.finish({ 'success' : "false", 'error' : "Missing plotsize in plot request" })
        return
      plotRequest[ 'size' ] = int(self.request.arguments[ 'size' ][0])
      
      timespan = int(self.request.arguments[ 'timespan' ][0])
      if timespan < 0:
        toSecs = self.__dateToSecs(str(self.request.arguments[ 'toDate' ][0]))
        fromSecs = self.__dateToSecs(str(self.request.arguments[ 'fromDate' ][0]))
      else:
        toSecs = int(Time.toEpoch())
        fromSecs = toSecs - timespan
      plotRequest[ 'fromSecs' ] = fromSecs
      plotRequest[ 'toSecs' ] = toSecs
      if 'varData' in self.request.arguments:
        plotRequest[ 'varData' ] = self.request.arguments[ 'varData' ][0]
    except Exception, e:
      self.finish({ 'success' : "false", 'error' : "Error while processing plot parameters: %s" % str(e) })
      return
    
    print plotRequest
    
    rpcClient = RPCClient("Framework/Monitoring")
    retVal = yield self.threadTask(rpcClient.plotView, plotRequest)
    
    if retVal[ 'OK' ]:
      self.finish({ 'success' : "true", 'data' : retVal[ 'Value' ] })
    else:
      self.finish({ 'success' : "false", 'error' : retVal[ 'Message' ] })
  
  @asyncGen    
  def web_getStaticPlotViews(self):
    rpcClient = RPCClient("Framework/Monitoring")
    retVal = yield self.threadTask(rpcClient.getViews, True)
    if not retVal["OK"]:
      self.finish({"success":"false", "error":retVal["Message"]})
    else:
      self.finish({"success":"true", "result":retVal["Value"]})
      
  @asyncGen
  def web_getPlotImg(self):
    """
    Get plot image
    """
    callback = {}
    if 'file' not in self.request.arguments:
      callback = {"success":"false", "error":"Maybe you forgot the file?"}
      self.finish(callback)
      return
    plotImageFile = str(self.request.arguments[ 'file' ][0])
    if plotImageFile.find(".png") < -1:
      callback = {"success":"false", "error":"Not a valid image!"}
      self.finish(callback)
      return
    transferClient = TransferClient("Framework/Monitoring")
    tempFile = tempfile.TemporaryFile()
    retVal = yield self.threadTask(transferClient.receiveFile, tempFile, plotImageFile)
    if not retVal[ 'OK' ]:
      callback = {"success":"false", "error":retVal[ 'Message' ]}
      self.finish(callback)
      return
    tempFile.seek(0)
    data = tempFile.read()
    self.set_header('Content-type', 'image/png')
    self.set_header('Content-Length', len(data))
    self.set_header('Content-Transfer-Encoding', 'Binary')
    self.finish(data)
   
  @asyncGen  
  def web_queryFieldValue(self):
    """
    Query a value for a field
    """
    fieldQuery = str(self.request.arguments[ 'queryField' ][0])
    definedFields = simplejson.loads(self.request.arguments[ 'selectedFields' ][0])
    rpcClient = RPCClient("Framework/Monitoring")
    result = yield self.threadTask(rpcClient.queryField, fieldQuery, definedFields)
    if 'rpcStub' in result:
      del(result[ 'rpcStub' ])
    self.finish({"success":"true", "result":result["Value"]})
