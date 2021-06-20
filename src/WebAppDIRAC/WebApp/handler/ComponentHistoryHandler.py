import json
import datetime

from DIRAC.Core.Utilities import Time
from DIRAC.FrameworkSystem.Client.ComponentMonitoringClient import ComponentMonitoringClient
from WebAppDIRAC.Lib.WebHandler import WebHandler, asyncGen, WErr


class ComponentHistoryHandler(WebHandler):

  AUTH_PROPS = 'authenticated'

  @asyncGen
  def web_getInstallationData(self):
    """
    Retrieves a list of dictionaries containing components to be displayed by the Component History page
    """
    # Get the selectors values
    req = self.__request()

    client = ComponentMonitoringClient()
    result = yield self.threadTask(client.getInstallations, req['installation'], req['component'], req['host'], True)
    if result['OK']:
      values = []
      installations = result['Value']
      for i in range(self.pageNumber, self.pageNumber + self.numberOfInstallations):
        if len(installations) > i:
          installation = installations[i]
        else:
          break
        uninstalled = '-'
        installedBy = '-'
        uninstalledBy = '-'
        if installation['UnInstallationTime']:
          uninstalled = installation['UnInstallationTime'].strftime('%Y-%m-%d %H:%M')
        if installation['InstalledBy']:
          installedBy = installation['InstalledBy']
        if installation['UnInstalledBy']:
          uninstalledBy = installation['UnInstalledBy']
        values.append({'Name': installation['Instance'],
                       'Module': installation['Component']['DIRACModule'],
                       'Host': installation['Host']['HostName'],
                       'System': installation['Component']['DIRACSystem'],
                       'Type': installation['Component']['Type'],
                       'Installed': installation['InstallationTime'].strftime('%Y-%m-%d %H:%M'),
                       'Uninstalled': uninstalled,
                       'InstalledBy': installedBy,
                       'UninstalledBy': uninstalledBy})
      timestamp = Time.dateTime().strftime('%Y-%m-%d %H:%M [UTC]')
      total = len(installations)
      callback = {'success': 'true', 'result': values,
                  'total': total, 'date': timestamp}
    else:
      raise WErr.fromSERROR(result)
    self.finish(callback)

  @asyncGen
  def web_getSelectionData(self):
    """
    Returns a list of possible values for each different selector to choose from
    """

    req = self.__request()

    data = {}
    setup = self.getUserSetup().split('-')[-1]
    systemList = []
    system = None

    fields = ['name', 'host', 'module', 'system', 'type']

    client = ComponentMonitoringClient()
    result = yield self.threadTask(client.getInstallations, {}, {}, {}, True)
    if result['OK']:
      for field in fields:
        data[field] = set()
      for installation in result['Value']:
        data['name'].add(installation['Instance'])
        data['host'].add(installation['Host']['HostName'])
        data['module'].add(installation['Component']['DIRACModule'])
        data['system'].add(installation['Component']['DIRACSystem'])
        data['type'].add(installation['Component']['Type'])

      # Order and format the results
      for field in fields:
        data[field] = list(data[field])
        data[field].sort()
        data[field] = map(lambda x: [x], data[field])
    else:
      raise WErr.fromSERROR(result)

    self.finish(data)

  def __request(self):
    """
    Returns a dictionary with the fields 'installation', 'component' and 'host'
    to be used by the getInstallations call in ComponentMonitoring service.
    The data inserted into the fields is retrieved from the values in the
    selectors
    """
    req = {'installation': {}, 'component': {}, 'host': {}}

    # Figure out what page we are at and how many results we are displaying
    if 'limit' in self.request.arguments:
      self.numberOfInstallations = int(self.request.get_argument("limit"))
      if 'start' in self.request.arguments:
        self.pageNumber = int(self.request.get_argument("start"))
      else:
        self.pageNumber = 0
    else:
      self.numberOfInstallations = 25
      self.pageNumber = 0

    # Check every possible selector and get its value ( if any )
    if 'name' in self.request.arguments:
      req['installation']['Instance'] = list(json.loads(self.request.arguments['name'][-1]))

    if 'host' in self.request.arguments:
      req['host']['HostName'] = list(json.loads(self.request.arguments['host'][-1]))

    if 'system' in self.request.arguments:
      req['component']['System'] = list(json.loads(self.request.arguments['system'][-1]))

    if 'module' in self.request.arguments:
      req['component']['Module'] = list(json.loads(self.request.arguments['module'][-1]))

    if 'type' in self.request.arguments:
      req['component']['Type'] = list(json.loads(self.request.arguments['type'][-1]))

    if 'startDate' in self.request.arguments and len(self.request.get_argument("startDate")) > 0:
      if len(self.request.get_argument("startTime")) > 0:
        time = self.request.get_argument("startTime")
      else:
        time = '00:00'
      date = datetime.datetime.strptime('%s-%s' % (self.request.get_argument("startDate"), time), '%Y-%m-%d-%H:%M')
      req['installation']['InstallationTime.bigger'] = date

    if 'endDate' in self.request.arguments and len(self.request.get_argument("endDate")) > 0:
      if len(self.request.get_argument("endTime")) > 0:
        time = self.request.get_argument("endTime")
      else:
        time = '00:00'
      date = datetime.datetime.strptime('%s-%s' % (self.request.get_argument("endDate"), time), '%Y-%m-%d-%H:%M')
      req['installation']['UnInstallationTime.smaller'] = date

    return req
