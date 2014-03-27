from DIRAC import gConfig
from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Core.App import App

class CompilerHelper:
  
  def __init__(self):
    app = App()
    app._loadWebAppCFGFiles()
    self.__dependencySection = "Dependencies"
    
          
  def getAppDependencies(self):
    """
    Generate the dependency dictionary
    """
    dependency = {}
    fullName = "%s/%s" % ( Conf.BASECS, self.__dependencySection)
    result = gConfig.getOptions( fullName )
    if not result[ 'OK' ]:
      return dependency
    optionsList = result[ 'Value' ]
    for opName in optionsList:
      opVal = gConfig.getValue( "%s/%s" % ( fullName, opName ) )
      dependency[opName] = opVal 
      
    return dependency
    