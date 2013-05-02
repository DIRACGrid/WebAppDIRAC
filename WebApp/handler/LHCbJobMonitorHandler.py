from WebAppDIRAC.WebApp.handler.JobMonitorHandler import JobMonitorHandler

class LHCbJobMonitorHandler(JobMonitorHandler):
  AUTH_PROPS = "authenticated"

  def index(self):
    pass

  def __init__(self):
    print 'INITTTTT'
    JobMonitorHandler.__init__(self)
