import json

from DIRAC import gLogger
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC.Core.Utilities.SitesDIRACGOCDBmapping import getGOCSiteName, getDIRACSiteName
from DIRAC.Core.Utilities.SiteSEMapping import getSEsForSite
from DIRAC.Core.Utilities.Plotting.FileCoding import codeRequestInFileId
from DIRAC.ResourceStatusSystem.Utilities.CSHelpers import getSiteComputingElements

from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen


class SiteSummaryHandler(WebHandler):

  AUTH_PROPS = "all"

  @asyncGen
  def web_getSelectionData(self):

    callback = {
        'name': set(),
        'elementType': set(),
        'status': set(),
        'statusType': set(),
        'tokenOwner': set()
    }

    pub = RPCClient('ResourceStatus/Publisher')

    gLogger.info(self.request.arguments)

    elementStatuses = pub.getElementStatuses('Site', None, None, None, None, None)

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

    return self.finish(callback)

  @asyncGen
  def web_getSiteSummaryData(self):
    '''This method returns the data required to fill the grid.'''
    requestParams = self.__requestParams()
    gLogger.info(requestParams)

    pub = RPCClient('ResourceStatus/Publisher')

    elementStatuses = yield self.threadTask(pub.getElementStatuses, 'Site',
                                            requestParams['name'],
                                            requestParams['elementType'],
                                            requestParams['statusType'],
                                            requestParams['status'],
                                            requestParams['tokenOwner'])
    if not elementStatuses['OK']:
      self.finish({'success': 'false', 'error': elementStatuses['Message']})

    elementList = [dict(zip(elementStatuses['Columns'], site)) for site in elementStatuses['Value']]

    for elementStatus in elementList:

      elementStatus['Country'] = elementStatus['Name'][-2:]
      elementStatus['DateEffective'] = str(elementStatus['DateEffective'])
      elementStatus['LastCheckTime'] = str(elementStatus['LastCheckTime'])
      elementStatus['TokenExpiration'] = str(elementStatus['TokenExpiration'])

    result = {'success': 'true', 'result': elementList, 'total': len(elementList)}

    self.finish(result)

  @asyncGen
  def web_action(self):

    requestParams = self.__requestParams()
    if 'action' in requestParams and requestParams['action']:

      actionName = requestParams['action'][0]

      methodName = actionName
      if not actionName.startswith('set'):
        methodName = '_get%s' % actionName

      try:
        result = yield self.threadTask(getattr(self, methodName), requestParams)
      except AttributeError:
        result = {'success': 'false', 'error': 'bad action %s' % actionName}

    else:

      result = {'success': 'false', 'error': 'Missing action'}

    self.finish(result)

  def _getHistory(self, requestParams):

    # Sanitize
    if 'name' not in requestParams or not requestParams['name']:
      return {'success': 'false', 'error': 'Missing name'}
    if 'elementType' not in requestParams or not requestParams['elementType']:
      return {'success': 'false', 'error': 'Missing elementType'}
    if 'statusType' not in requestParams or not requestParams['statusType']:
      return {'success': 'false', 'error': 'Missing statusType'}

    pub = RPCClient('ResourceStatus/Publisher')
    res = pub.getElementHistory('Site', requestParams['name'],
                                requestParams['elementType'],
                                requestParams['statusType'])

    if not res['OK']:
      gLogger.error(res['Message'])
      return {'success': 'false', 'error': 'error getting history'}

    history = [[r[0], str(r[1]), r[2]] for r in res['Value']]

    return {'success': 'true', 'result': history, 'total': len(history)}

  def _getPolicies(self, requestParams):

    # Sanitize
    if 'name' not in requestParams or not requestParams['name']:
      return {'success': 'false', 'error': 'Missing name'}
    if 'statusType' not in requestParams or not requestParams['statusType']:
      self.finish({'success': 'false', 'error': 'Missing statusType'})

    pub = RPCClient('ResourceStatus/Publisher')
    res = pub.getElementPolicies('Site', requestParams['name'],
                                 requestParams['statusType'])

    if not res['OK']:
      gLogger.error(res['Message'])
      return {'success': 'false', 'error': 'error getting policies'}

    policies = [[r[0], r[1], str(r[2]), str(r[3]), r[4]] for r in res['Value']]

    return {'success': 'true', 'result': policies, 'total': len(policies)}

  def _getInfo(self, requestParams):

    gLogger.info(requestParams)

    if not requestParams['name']:
      gLogger.warn('No name given')
      self.finish({'success': 'false', 'error': 'We need a Site Name to generate an Overview'})

    elementName = requestParams['name'][0]

    pub = RPCClient('ResourceStatus/Publisher')

    elementStatuses = pub.getElementStatuses('Site',
                                             str(elementName),
                                             None,
                                             'all',
                                             None,
                                             None)

    if not elementStatuses['OK']:
      gLogger.error(elementStatuses['Message'])
      self.finish({'success': 'false', 'error': 'Error getting ElementStatus information'})

    if not elementStatuses['Value']:
      gLogger.error('element "%s" not found' % elementName)
      self.finish({'success': 'false', 'error': 'element "%s" not found' % elementName})

    elementStatus = [dict(zip(elementStatuses['Columns'], element)) for element in elementStatuses['Value']][0]
    elementStatus['DateEffective'] = str(elementStatus['DateEffective'])
    elementStatus['LastCheckTime'] = str(elementStatus['LastCheckTime'])
    elementStatus['TokenExpiration'] = str(elementStatus['TokenExpiration'])

    gocdb_name = getGOCSiteName(elementName)
    if not gocdb_name['OK']:
      gLogger.error(gocdb_name['Message'])
      elementStatus['GOCDB'] = ""
      gocdb_name = ''
    else:
      gocdb_name = gocdb_name['Value']
      elementStatus['GOCDB'] = '<a href="https://goc.egi.eu/portal/index.php?Page_'
      elementStatus['GOCDB'] += 'Type=Submit_Search&SearchString=%s" target="_blank">%s</a>' % (
          gocdb_name, gocdb_name)

    dirac_names = getDIRACSiteName(gocdb_name)
    if not dirac_names['OK']:
      gLogger.error(dirac_names['Message'])
      dirac_names = []
    else:
      elementStatus['GOCDB'] += "("
      for i in dirac_names['Value']:
        elementStatus['GOCDB'] += "%s " % i
      elementStatus['GOCDB'] += ")"

    elementStatus["GGUS"] = '<a href="https://ggus.eu/ws/ticket_search.php?'
    elementStatus["GGUS"] += 'show_columns_check[]=REQUEST_ID&'
    elementStatus["GGUS"] += 'show_columns_check[]=TICKET_TYPE&show_columns_check[]=AFFECTED_VO&'
    elementStatus["GGUS"] += 'show_columns_check[]=AFFECTED_SITE&show_columns_check[]=PRIORITY'
    elementStatus["GGUS"] += '&show_columns_check[]=RESPONSIBLE_UNIT&'
    elementStatus["GGUS"] += 'show_columns_check[]=STATUS&show_columns_check[]=DATE_OF_CREATION&'
    elementStatus["GGUS"] += 'show_columns_check[]=LAST_UPDATE&show_columns_check[]=TYPE_OF_PROBLEM&'
    elementStatus["GGUS"] += 'show_columns_check[]=SUBJECT&ticket=&supportunit=all&su_hierarchy=all&'
    elementStatus["GGUS"] += 'vo=all&user=&keyword=&involvedsupporter=&assignto=&'
    elementStatus["GGUS"] += 'affectedsite=%s&specattrib=0&status=open&priority=all&'
    elementStatus["GGUS"] += 'typeofproblem=all&ticketcategory=&mouarea=&technology_provider=&'
    elementStatus["GGUS"] += 'date_type=creation+date&radiotf=1&timeframe=any&from_date=&to_date=&' % gocdb_name
    elementStatus["GGUS"] += 'untouched_date=&orderticketsby=GHD_INT_REQUEST_ID&'
    elementStatus["GGUS"] += 'orderhow=descending" target="_blank"> %s tickets</a>' % gocdb_name

    convertName = {'CERN-PROD': 'CERN',
                   'INFN-T1': 'CNAF',
                   'FZK-LCG2': 'GridKa',
                   'IN2P3-CC': 'IN2P3',
                   'NIKHEF-ELPROD': 'NIKHEF',
                   'pic': 'PIC',
                   'RAL-LCG2': 'RAL',
                   'SARA-MATRIX': 'SARA'}

    elog = convertName.get(gocdb_name, "")

    elementStatus['Elog'] = '<a href="https://lblogbook.cern.ch/Operations/?Site=^' + \
        elog + '%24&mode=summary" target="_blank">' + elog + '</a>'

    return {'success': 'true', 'result': elementStatus, 'total': len(elementStatus)}

  def _getStorages(self, requestParams):

    if not requestParams['name']:
      gLogger.warn('No name given')
      return {'success': 'false', 'error': 'We need a Site Name to generate an Overview'}

    pub = RPCClient('ResourceStatus/Publisher')

    elementName = requestParams['name'][0]
    storageElements = getSEsForSite(elementName)
    storageElementsStatus = []
    gLogger.info('storageElements = ' + str(storageElements))

    # FIXME: use properly RSS
    for se in storageElements:
      sestatuses = pub.getElementStatuses('Resource',
                                          se,
                                          None,
                                          None,
                                          None,
                                          None)

      for sestatus in sestatuses['Value']:
        storageElementsStatus.append([sestatus[0], sestatus[2], sestatus[6]])

    return {'success': 'true', 'result': storageElementsStatus, 'total': len(storageElementsStatus)}

  def _getComputingElements(self, requestParams):

    if not requestParams['name']:
      gLogger.warn('No name given')
      return {'success': 'false', 'error': 'We need a Site Name to generate an Overview'}

    pub = RPCClient('ResourceStatus/Publisher')

    elementName = requestParams['name'][0]

    computing_elements = getSiteComputingElements(elementName)
    computing_elements_status = []
    gLogger.info('computing_elements = ' + str(computing_elements))

    for ce in computing_elements:
      cestatuses = pub.getElementStatuses('Resource',
                                          ce,
                                          None,
                                          'all',
                                          None,
                                          None)
      gLogger.info('cestatus = ' + str(cestatuses))

      for cestatus in cestatuses['Value']:
        computing_elements_status.append([cestatus[0], cestatus[2], cestatus[6]])

    return {'success': 'true', 'result': computing_elements_status, 'total': len(computing_elements_status)}

  def _getImages(self, requestParams):

    if not requestParams['name']:
      gLogger.warn('No name given')
      return {'success': 'false', 'error': 'We need a Site Name to generate an Overview'}

    elementName = requestParams['name'][0]
    pub = RPCClient('ResourceStatus/Publisher')

    elementStatuses = pub.getElementStatuses('Site',
                                             str(elementName),
                                             None,
                                             'all',
                                             None,
                                             None)

    if not elementStatuses['Value']:
      gLogger.error('element "%s" not found' % elementName)
      return {'success': 'false', 'error': 'element "%s" not found' % elementName}

    elementStatus = [dict(zip(elementStatuses['Columns'], element)) for element in elementStatuses['Value']][0]

    plotDict1 = self.getPlotDict(elementStatus['Name'], 'FinalMajorStatus',
                                 'RunningJobs', 'Job', plotTitle='Final Minor Status of jobs')
    image1 = codeRequestInFileId(plotDict1)['Value']['plot']

    plotDict2 = self.getPlotDict(elementStatus['Name'], 'GridStatus',
                                 'NumberOfPilots', 'Pilot')
    image2 = codeRequestInFileId(plotDict2)['Value']['plot']

    plotDict3 = self.getPlotDict(elementStatus['Name'], 'JobType',
                                 'RunningJobs', 'Job', plotTitle='Jobs by job type')
    image3 = codeRequestInFileId(plotDict3)['Value']['plot']

    plotDict4 = self.getPlotDict(elementStatus['Name'], 'JobSplitType',
                                 'NumberOfJobs', 'WMSHistory', status='Running')
    image4 = codeRequestInFileId(plotDict4)['Value']['plot']

    plotDict5 = self.getPlotDict(elementStatus['Name'], 'Channel',
                                 'SuceededTransfers', 'DataOperation')
    image5 = codeRequestInFileId(plotDict5)['Value']['plot']

    plotDict6 = self.getPlotDict(elementStatus['Name'], 'FinalStatus',
                                 'FailedTransfers', 'DataOperation')
    image6 = codeRequestInFileId(plotDict6)['Value']['plot']

    return {'success': 'true', 'result': [image1, image2, image3, image4, image5, image6], 'total': 6}

  def getPlotDict(self, siteName, grouping, reportName, typeName,
                  plotTitle=None,
                  status=None):

    plotDict = {'condDict': {
        'Site': [siteName],
        'grouping': [grouping]
    },
        'extraArgs': {
        'lastSeconds': 43200
    },
        'grouping': grouping,
        'reportName': reportName,
        'typeName': typeName,
        '_plotTitle': plotTitle}

    if plotTitle is not None:
      plotDict['extraArgs']['plotTitle'] = plotTitle
    if status is not None:
      plotDict['condDict']['Status'] = status

    return plotDict

  def __requestParams(self):
    '''
      We receive the request and we parse it, in this case, we are doing nothing,
      but it can be certainly more complex.
    '''

    gLogger.always("!!!  PARAMS: ", str(self.request.arguments))

    responseParams = {
        'name': None,
        'elementType': None,
        'statusType': None,
        'status': None,
        'action': None,
        'tokenOwner': None
    }

    for key in responseParams:
      if key in self.request.arguments and str(self.request.arguments[key][-1]):
        responseParams[key] = list(json.loads(self.request.arguments[key][-1]))

    return responseParams
