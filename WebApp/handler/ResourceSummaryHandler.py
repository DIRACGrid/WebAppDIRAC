import collections
import json

from DIRAC import gLogger

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.ResourceStatusSystem.PolicySystem.StateMachine import RSSMachine
from DIRAC.Core.Utilities import Time


class ResourceSummaryHandler(WebHandler):

  AUTH_PROPS = "all"

  @asyncGen
  def web_getSelectionData(self):
    '''It returns the possible selection data
    '''
    callback = {
        'name': set(),
        'elementType': set(),
        'status': set(),
        'statusType': set(),
        'tokenOwner': set()
    }

    pub = RPCClient('ResourceStatus/Publisher')

    gLogger.info(self.request.arguments)

    elementStatuses = yield self.threadTask(pub.getElementStatuses, 'Resource', None, None, None, None, None)

    if elementStatuses['OK']:

      for elementStatus in elementStatuses['Value']:
        callback['status'].add(elementStatus[2])
        callback['name'].add(elementStatus[0])
        callback['elementType'].add(elementStatus[6])
        callback['statusType'].add(elementStatus[1])
        callback['tokenOwner'].add(elementStatus[8])

    for key, value in callback.items():

      callback[key] = [[item] for item in list(value)]
      callback[key].sort()
      callback[key] = [['All']] + callback[key]

    self.finish(callback)

  @asyncGen
  def web_getResourceSummaryData(self):
    '''This method returns the data required to fill the grid.
    '''

    requestParams = self.__requestParams()
    gLogger.info(requestParams)

    pub = RPCClient('ResourceStatus/Publisher')

    elementStatuses = yield self.threadTask(pub.getElementStatuses, 'Resource',
                                            requestParams['name'],
                                            requestParams['elementType'],
                                            requestParams['statusType'],
                                            requestParams['status'],
                                            requestParams['tokenOwner'])
    if not elementStatuses['OK']:
      self.finish({'success': 'false', 'error': elementStatuses['Message']})

    elementTree = collections.defaultdict(list)

    for element in elementStatuses['Value']:

      elementDict = dict(zip(elementStatuses['Columns'], element))

      elementDict['DateEffective'] = str(elementDict['DateEffective'])
      elementDict['LastCheckTime'] = str(elementDict['LastCheckTime'])
      elementDict['TokenExpiration'] = str(elementDict['TokenExpiration'])

      elementTree[elementDict['Name']].append(elementDict)

    elementList = []

    for elementValues in elementTree.values():

      if len(elementValues) == 1:
        elementList.append(elementValues[0])
      else:

        elementList.append(self.combine(elementValues))

    rssMachine = RSSMachine(None)

    yield self.threadTask(rssMachine.orderPolicyResults, elementList)

    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")

    self.finish({'success': 'true', 'result': elementList, 'total': len(elementList), "date": timestamp})

  def combine(self, elementValues):

    statuses = [element['Status'] for element in elementValues]

    statusSet = set(statuses)

    if len(statusSet) == 1:
      status = statusSet.pop()
      reason = 'All %s' % status

    else:

      if set(['Active', 'Degraded']) & set(statusSet):
        status = 'Degraded'
        reason = 'Not completely active'

      else:
        status = 'Banned'
        reason = 'Not usable'

#      if set( [ 'Unknown','Active', 'Degraded' ] ) & set( statusSet ):
#        for upStatus in [ 'Active', 'Degraded' ]:
#          if upStatus in statusSet:
#            status = upStatus
#            reason = '%d %s' % ( statuses.count( upStatus ), upStatus )
#            break
#      else:
#        for downStatus in [ 'Unknown','Probing','Banned','Error' ]:
#          if downStatus in statusSet:
#            status = downStatus
#            reason = '%d %s' % ( statuses.count( downStatus ), downStatus )
#            break

    # Make a copy
    combined = {}
    combined.update(elementValues[0])
    combined['StatusType'] = '%d elements' % len(statuses)
    combined['Status'] = status
    combined['Reason'] = reason
    combined['DateEffective'] = ''
    combined['LastCheckTime'] = ''
    combined['TokenOwner'] = ''
    combined['TokenExpiration'] = ''

    return combined

  @asyncGen
  def web_expand(self):
    '''
      This method handles the POST requests
    '''

    requestParams = self.__requestParams()
    gLogger.info(requestParams)

    pub = RPCClient('ResourceStatus/Publisher')

    elements = yield self.threadTask(pub.getElementStatuses, 'Resource',
                                     requestParams['name'],
                                     None, None, None, None)
    if not elements['OK']:
      self.finish({'success': 'false', 'error': elements['Message']})

    elementList = [dict(zip(elements['Columns'], element)) for element in elements['Value']]
    for element in elementList:
      element['DateEffective'] = str(element['DateEffective'])
      element['LastCheckTime'] = str(element['LastCheckTime'])
      element['TokenExpiration'] = str(element['TokenExpiration'])

    self.finish({'success': 'true', 'result': elementList, 'total': len(elementList)})

  @asyncGen
  def web_action(self):

    requestParams = self.__requestParams()
    if 'action' in requestParams and requestParams['action']:

      actionName = requestParams['action'][0]

      methodName = actionName
      if not actionName.startswith('set'):
        methodName = '_get%s' % actionName

      try:
        return getattr(self, methodName)(requestParams)
      except AttributeError:
        result = {'success': 'false', 'error': 'bad action %s' % actionName}

    else:

      result = {'success': 'false', 'error': 'Missing action'}

    self.finish(result)

  def setToken(self, requestParams):

    sData = self.getSessionData()

    username = sData["user"]["username"]

    if username == 'anonymous':
      self.finish({'success': 'false', 'error': 'Cannot perform this operation as anonymous'})
    elif 'SiteManager' not in sData['user']['properties']:
      self.finish({'success': 'false', 'error': 'Not authorized'})

    pub = RPCClient('ResourceStatus/Publisher')
    res = yield self.threadTask(pub.setToken, 'Resource',
                                str(requestParams['name'][0]),
                                str(requestParams['statusType'][0]),
                                str(requestParams['status'][0]),
                                str(requestParams['elementType'][0]),
                                username,
                                str(requestParams['lastCheckTime'][0]))

    if not res['OK']:
      self.finish({'success': 'false', 'error': res['Message']})

    self.finish({'success': 'true', 'result': res['Value']})

  def setStatus(self, requestParams):

    sData = self.getSessionData()

    username = sData["user"]["username"]

    if username == 'anonymous':
      self.finish({'success': 'false', 'error': 'Cannot perform this operation as anonymous'})
    elif 'SiteManager' not in sData['user']['properties']:
      self.finish({'success': 'false', 'error': 'Not authorized'})

    pub = RPCClient('ResourceStatus/Publisher')

    res = yield self.threadTask(pub.setStatus, 'Resource',
                                str(requestParams['name'][0]),
                                str(requestParams['statusType'][0]),
                                str(requestParams['status'][0]),
                                str(requestParams['elementType'][0]),
                                username,
                                str(requestParams['lastCheckTime'][0]))

    if not res['OK']:
      self.finish({'success': 'false', 'error': res['Message']})

    self.finish({'success': 'true', 'result': res['Value']})

  def _getHistory(self, requestParams):

    # Sanitize
    if 'name' not in requestParams or not requestParams['name']:
      self.finish({'success': 'false', 'error': 'Missing name'})
    if 'elementType' not in requestParams or not requestParams['elementType']:
      self.finish({'success': 'false', 'error': 'Missing elementType'})
    if 'statusType' not in requestParams or not requestParams['statusType']:
      self.finish({'success': 'false', 'error': 'Missing statusType'})

    pub = RPCClient('ResourceStatus/Publisher')
    res = yield self.threadTask(pub.getElementHistory, 'Resource', requestParams['name'],
                                requestParams['elementType'],
                                requestParams['statusType'])

    if not res['OK']:
      gLogger.error(res['Message'])
      self.finish({'success': 'false', 'error': 'error getting history'})

    history = [[r[0], str(r[1]), r[2]] for r in res['Value']]

    gLogger.debug("History:" + str(history))

    self.finish({'success': 'true', 'result': history, 'total': len(history)})

  def _getPolicies(self, requestParams):

    # Sanitize
    if 'name' not in requestParams or not requestParams['name']:
      self.finish({'success': 'false', 'error': 'Missing name'})
    if 'statusType' not in requestParams or not requestParams['statusType']:
      self.finish({'success': 'false', 'error': 'Missing statusType'})

    pub = RPCClient('ResourceStatus/Publisher')
    res = yield self.threadTask(pub.getElementPolicies, 'Resource', requestParams['name'],
                                requestParams['statusType'])

    if not res['OK']:
      gLogger.error(res['Message'])
      self.finish({'success': 'false', 'error': 'error getting policies'})

    policies = [[r[0], r[1], str(r[2]), str(r[3]), r[4]] for r in res['Value']]

    self.finish({'success': 'true', 'result': policies, 'total': len(policies)})

  def _getDowntime(self, requestParams):

    # Sanitize
    if 'name' not in requestParams or not requestParams['name']:
      self.finish({'success': 'false', 'error': 'Missing name'})
    if 'elementType' not in requestParams or not requestParams['elementType']:
      self.finish({'success': 'false', 'error': 'Missing elementType'})
    if 'statusType' not in requestParams or not requestParams['statusType']:
      self.finish({'success': 'false', 'error': 'Missing statusType'})
    if 'element' not in requestParams or not requestParams['element']:
      self.finish({'success': 'false', 'error': 'Missing element'})

    pub = RPCClient('ResourceStatus/Publisher')

    res = yield self.threadTask(pub.getDowntimes,
                                str(requestParams['element'][-1]),
                                str(requestParams['elementType'][-1]),
                                str(requestParams['name'][-1]))
    if not res['OK']:
      gLogger.error(res['Message'])
      self.finish({'success': 'false', 'error': 'error getting downtimes'})

    downtimes = [[str(dt[0]), str(dt[1]), dt[2], dt[3], dt[4]] for dt in res['Value']]

    self.finish({'success': 'true', 'result': downtimes, 'total': len(downtimes)})

  def _getTimeline(self, requestParams):

    # Sanitize
    if 'name' not in requestParams or not requestParams['name']:
      self.finish({'success': 'false', 'error': 'Missing name'})
    if 'elementType' not in requestParams or not requestParams['elementType']:
      self.finish({'success': 'false', 'error': 'Missing elementType'})
    if 'statusType' not in requestParams or not requestParams['statusType']:
      self.finish({'success': 'false', 'error': 'Missing statusType'})

    pub = RPCClient('ResourceStatus/Publisher')

    res = yield self.threadTask(pub.getElementHistory, 'Resource', str(requestParams['name'][-1]),
                                str(requestParams['elementType'][-1]),
                                str(requestParams['statusType'][-1]))

    if not res['OK']:
      gLogger.error(res['Message'])
      self.finish({'success': 'false', 'error': 'error getting history'})

    history = []

    for status, dateEffective, reason in res['Value']:

      # history.append( [ history[ -1 ][ 0 ], str( dateEffective - timedelta( seconds = 1 ) ), '' ] )

      history.append([status, str(dateEffective), reason])

    self.finish({'success': 'true', 'result': history, 'total': len(history)})

  def _getTree(self, requestParams):

    if 'name' not in requestParams or not requestParams['name']:
      self.finish({'success': 'false', 'error': 'Missing name'})
    if 'elementType' not in requestParams or not requestParams['elementType']:
      self.finish({'success': 'false', 'error': 'Missing elementType'})
    if 'statusType' not in requestParams or not requestParams['statusType']:
      self.finish({'success': 'false', 'error': 'Missing statusType'})

    pub = RPCClient('ResourceStatus/Publisher')

    res = yield self.threadTask(pub.getTree, str(requestParams['elementType'][-1]), str(requestParams['name'][-1]))
    if not res['OK']:
      gLogger.error(res['Message'])
      self.finish({'success': 'false', 'error': 'error getting tree'})
    res = res['Value']

    siteName = res.keys()[0]

    tree = [[siteName, None, None, None]]
    for k, v in res[siteName]['statusTypes'].items():
      tree.append([None, k, v, siteName])

    tree.append(['ces', None, None, siteName])
    for ce, ceDict in res[siteName]['ces'].items():
      tree.append([ce, None, None, 'ces'])
      for k, v in ceDict.items():
        tree.append([None, k, v, ce])

    tree.append(['ses', None, None, siteName])
    for se, seDict in res[siteName]['ses'].items():
      tree.append([se, None, None, 'ses'])
      for k, v in seDict.items():
        tree.append([None, k, v, se])

    self.finish({'success': 'true', 'result': tree, 'total': len(tree)})

  def _getInfo(self, requestParams):
    if 'name' not in requestParams or not requestParams['name']:
      self.finish({'success': 'false', 'error': 'Missing name'})
    if 'elementType' not in requestParams or not requestParams['elementType']:
      self.finish({'success': 'false', 'error': 'Missing elementType'})
    if 'statusType' not in requestParams or not requestParams['statusType']:
      self.finish({'success': 'false', 'error': 'Missing statusType'})
    if 'element' not in requestParams or not requestParams['element']:
      self.finish({'success': 'false', 'error': 'Missing element'})

    pub = RPCClient('ResourceStatus/Publisher')

    res = yield self.threadTask(pub.getElementStatuses, str(requestParams['element'][-1]),
                                str(requestParams['name'][-1]),
                                str(requestParams['elementType'][-1]),
                                str(requestParams['statusType'][-1]),
                                None,
                                None)

    if not res['OK']:
      self.finish({'success': 'false', 'error': res["Message"]})
    else:

      columns = res['Columns']

      res = dict(zip(columns, res['Value'][0]))
      res['DateEffective'] = str(res['DateEffective'])
      res['LastCheckTime'] = str(res['LastCheckTime'])
      res['TokenExpiration'] = str(res['TokenExpiration'])

      self.finish({'success': 'true', 'result': res, 'total': len(res)})

  def __requestParams(self):
    '''
      We receive the request and we parse it, in this case, we are doing nothing,
      but it can be certainly more complex.
    '''

    gLogger.always("!!!  PARAMS: ", str(self.request.arguments))

    responseParams = {
        'element': None,
        'name': None,
        'elementType': None,
        'statusType': None,
        'status': None,
        'tokenOwner': None,
        'lastCheckTime': None,
        'action': None
    }

    for key in responseParams:
      if key in self.request.arguments and str(self.request.arguments[key][-1]):
        responseParams[key] = list(json.loads(self.request.arguments[key][-1]))

    return responseParams
