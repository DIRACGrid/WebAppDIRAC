import json
from DIRAC import gConfig
from WebAppDIRAC.Lib import Conf
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr
from WebAppDIRAC.Lib.SessionData import SessionData
from DIRAC.ConfigurationSystem.Client.Helpers import Registry

class RootHandler(WebHandler):

  AUTH_PROPS = "all"
  LOCATION = "/"

  def _readConfigData(self):
    result = {"user_config":None,
              "desktop_config":{
                                "start_menu_config":[],
                                "shortcut_config":[]
                                }
              }
    
    '''
      Reading the user info
    '''
    result["user_config"] = self._getUserInfo();
    
    if result["user_config"]:
      '''
        Reading the configuration for the START menu
      '''
#      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.GridWindow', "launcher": {"text": 'Grid Window', "iconCls":'icon-grid'}, "jsLoaded":0})
#      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.TabWindow', "launcher": {"text": 'Tab Windows', "iconCls":'tabs'}, "jsLoaded":0})
#      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.AccordionWindow', "launcher": {"text": 'Accordion Window', "iconCls":"accordion"}, "jsLoaded":0})
      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.Notepad', "launcher": {"text": 'Notepad', "iconCls":'notepad'}})
      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.JobMonitor', "launcher": {"text": 'Job Monitor', "iconCls":'notepad'}}) 
      
      '''
        Reading the configuration for the SHORTCUTS placed at the desktop
      '''
  #    result["shortcut_config"].append({"name" : 'Grid Window',"iconCls" : 'grid-shortcut',"module" : 'DIRAC.GridWindow'});
  #    result["shortcut_config"].append({"name" : 'Accordion Window',"iconCls" : 'accordion-shortcut',"module" : 'Desktop.AccordionWindow'});
  #    result["shortcut_config"].append({"name" : 'Notepad',"iconCls" : 'notepad-shortcut',"module" : 'DIRAC.Notepad'});
    
    
    
    return json.dumps(result)
  
  def _getUserInfo(self):
    if not self.isRegisteredUser():
      return False
    data = {'username' : self.getUserName(), 'group' : self.getUserGroup(), 'DN' : self.getUserDN(), 'setup' : self.getUserSetup() }
    data[ 'groups' ] = Registry.getGroupsForUser(self.getUserName())["Value"]
    data[ 'setups' ] = gConfig.getSections('/DIRAC/Setups')["Value"]
    
    return data
  
  def web_changeGroup( self ):
    try:
      to = self.request.arguments[ 'to' ][-1]
    except KeyError:
      raise WErr( 400, "Missing 'to' argument" )
    self.__change( group = to )

  def web_changeSetup( self ):
    try:
      to = self.request.arguments[ 'to' ][-1]
    except KeyError:
      raise WErr( 400, "Missing 'to' argument" )
    self.__change( setup = to )

  def __change( self, setup = None, group = None ):
    if not setup:
      setup = self.getUserSetup()
    if not group:
      group = self.getUserGroup() or 'anon'
    url = [ Conf.rootURL().strip( "/" ), "s:%s" % setup, "g:%s" % group ]
    self.redirect( "/%s" % "/".join( url ) )


  def web_index(self):
    # Render base template
    #self.render( "root.tpl", data = SessionData().getData() )
    self.render("root.tpl", config_data=self._readConfigData())
    
