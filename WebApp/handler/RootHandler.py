
from DIRAC import gConfig
from tornado.web import HTTPError
from WebAppDIRAC.Lib.WebHandler import WebHandler
from DIRAC.ConfigurationSystem.Client.Helpers import Registry
import json

class RootHandler(WebHandler):

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
      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.GridWindow', "launcher": {"text": 'Grid Window', "iconCls":'icon-grid'}, "jsLoaded":0})
      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.TabWindow', "launcher": {"text": 'Tab Windows', "iconCls":'tabs'}, "jsLoaded":0})
      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.AccordionWindow', "launcher": {"text": 'Accordion Window', "iconCls":"accordion"}, "jsLoaded":0})
      result["desktop_config"]["start_menu_config"].append({"name":'DIRAC.Notepad', "launcher": {"text": 'Notepad', "iconCls":'notepad'}, "jsLoaded":0}) 
      
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

  def web_index(self):
    # Render base template
    self.render("root.tpl", config_data=self._readConfigData())
    
