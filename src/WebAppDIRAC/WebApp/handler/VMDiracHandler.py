from __future__ import print_function
from __future__ import division
from __future__ import absolute_import


import ast
import six
import json

from DIRAC.Core.Utilities import Time
from DIRAC.Core.DISET.RPCClient import RPCClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class VMDiracHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getInstancesList(self):
    try:
      start = int(self.get_argument("start"))
    except Exception:
      start = 0
    try:
      limit = int(self.get_argument("limit"))
    except Exception:
      limit = 0

    sortField = "inst_InstanceID"
    sortDir = "DESC"
    if "sort" in self.request.arguments:
      sortValue = self.get_argument("sort")
      # converting the string into a dictionary
      sortValue = ast.literal_eval(sortValue.strip("[]"))
      sortField = str(sortValue["property"]).replace("_", ".")
      sortDir = str(sortValue["direction"])
    sort = [(sortField, sortDir)]

    condDict = {}
    try:
      if 'cond' in self.request.arguments:
        dec = json.loads(self.get_argument("cond"))
        for k in dec:
          v = dec[k]
          if isinstance(v, six.string_types):
            v = [str(v)]
          else:
            v = [str(f) for f in v]
          condDict[str(k).replace("_", ".")] = v
    except Exception:
      raise
    try:
      if 'statusSelector' in self.request.arguments:
        condDict['inst.Status'] = [str(self.get_argument('statusSelector'))]
    except Exception:
      pass

    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.getInstancesContent(condDict, sort, start, limit)
    if not result['OK']:
      callback = {"success": "false", "error": result["Message"]}
      self.write(callback)
      return
    svcData = result['Value']
    data = {'numRecords': svcData['TotalRecords'], 'instances': []}
    for record in svcData['Records']:
      rD = {}
      for iP in range(len(svcData['ParameterNames'])):
        param = svcData['ParameterNames'][iP].replace(".", "_")
        if param == 'inst_LastUpdate':
          rD[param] = record[iP].strftime("%Y-%m-%d %H:%M:%S")
        else:
          rD[param] = record[iP]
      data['instances'].append(rD)
    callback = {"success": "true", "result": data['instances'], "total": data['numRecords'], "date": None}
    self.write(callback)

  def web_stopInstances(self):
    webIds = json.loads(self.get_argument('idList'))
    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.declareInstancesStopping(webIds)
    callback = {"success": "true", "result": result}
    self.write(callback)

  def web_getHistoryForInstance(self):
    instanceID = int(self.get_argument('instanceID'))
    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.getHistoryForInstanceID(instanceID)
    if not result['OK']:
      return result
    svcData = result['Value']
    data = []
    for record in svcData['Records']:
      rD = {}
      for iP in range(len(svcData['ParameterNames'])):
        param = svcData['ParameterNames'][iP].replace(".", "_")
        if param == 'Update':
          rD[param] = record[iP].strftime("%Y-%m-%d %H:%M:%S")
        else:
          rD[param] = record[iP]
      data.append(rD)
    callback = {"success": "true", "result": data, "total": len(data)}
    self.write(callback)

  def web_checkVmWebOperation(self):
    operation = str(self.get_argument('operation'))
    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.checkVmWebOperation(operation)
    if not result['OK']:
      callback = {"success": "false", "error": result['Message']}
      return self.write(callback)
    data = result['Value']
    callback = {"success": "true", "data": data}
    self.write(callback)

  def web_getHistoryValues(self):
    try:
      dbVars = [str(f) for f in json.loads(self.get_argument('vars'))]
    except Exception:
      dbVars = ['Load', 'Jobs', 'TransferredFiles']
    try:
      timespan = int(self.get_argument('timespan'))
    except Exception:
      timespan = 86400
    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.getHistoryValues(3600, {}, dbVars, timespan)
    if not result['OK']:
      callback = {"success": "false", "error": result['Message']}
      return self.write(callback)
    svcData = result['Value']
    data = []
    olderThan = Time.toEpoch() - 400
    for record in svcData['Records']:
      rL = []
      for iP in range(len(svcData['ParameterNames'])):
        param = svcData['ParameterNames'][iP]
        if param == 'Update':
          rL.append(Time.toEpoch(record[iP]))
        else:
          rL.append(record[iP])
      if rL[0] < olderThan:
        data.append(rL)
    callback = {"success": "true", 'data': data, 'fields': svcData['ParameterNames']}
    return self.write(callback)

  def web_getRunningInstancesHistory(self):
    try:
      bucketSize = int(self.get_argument('bucketSize'))
    except Exception:
      bucketSize = 900
    try:
      timespan = int(self.get_argument('timespan'))
    except Exception:
      timespan = 86400
    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.getRunningInstancesHistory(timespan, bucketSize)
    if not result['OK']:
      callback = {"success": "false", "error": result['Message']}
      return self.write(callback)
    svcData = result['Value']
    data = []
    olderThan = Time.toEpoch() - 400
    rL = []
    for record in svcData:
      eTime = Time.toEpoch(record[0])
      if eTime < olderThan:
        rL = [eTime, int(record[1])]
      data.append(rL)
    callback = {"success": "true", 'data': data, "timespan": timespan}
    return self.write(callback)

  def web_getRunningInstancesBEPHistory(self):
    try:
      bucketSize = int(self.get_argument('bucketSize'))
    except Exception:
      bucketSize = 900
    try:
      timespan = int(self.get_argument('timespan'))
    except Exception:
      timespan = 86400
    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.getRunningInstancesBEPHistory(timespan, bucketSize)
    if not result['OK']:
      callback = {"success": "false", "error": result['Message']}
      return self.write(callback)
    svcData = result['Value']
    data = []
    olderThan = Time.toEpoch() - 400
    for record in svcData:
      eTime = Time.toEpoch(record[0])
      if eTime < olderThan:
        rL = [eTime, record[1], int(record[2])]
      data.append(rL)
    callback = {"success": "true", 'data': data}
    return self.write(callback)

  def web_getRunningInstancesByRunningPodHistory(self):
    try:
      bucketSize = int(self.get_argument('bucketSize'))
    except Exception:
      bucketSize = 900
    try:
      timespan = int(self.get_argument('timespan'))
    except Exception:
      timespan = 86400
    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.getRunningInstancesByRunningPodHistory(timespan, bucketSize)
    if not result['OK']:
      callback = {"success": "false", "error": result['Message']}
      return self.write(callback)
    svcData = result['Value']
    data = []
    olderThan = Time.toEpoch() - 400
    for record in svcData:
      eTime = Time.toEpoch(record[0])
      if eTime < olderThan:
        rL = [eTime, record[1], int(record[2])]
      data.append(rL)
    callback = {"success": "true", 'data': data}
    return self.write(callback)

  def web_getRunningInstancesByImageHistory(self):
    try:
      bucketSize = int(self.get_argument('bucketSize'))
    except Exception:
      bucketSize = 900
    try:
      timespan = int(self.get_argument('timespan'))
    except Exception:
      timespan = 86400
    rpcClient = RPCClient("WorkloadManagement/VirtualMachineManager")
    result = rpcClient.getRunningInstancesByImageHistory(timespan, bucketSize)
    if not result['OK']:
      callback = {"success": "false", "error": result['Message']}
      return self.write(callback)
    svcData = result['Value']
    data = []
    olderThan = Time.toEpoch() - 400
    for record in svcData:
      eTime = Time.toEpoch(record[0])
      if eTime < olderThan:
        rL = [eTime, record[1], int(record[2])]
      data.append(rL)
    callback = {"success": "true", 'data': data}
    return self.write(callback)