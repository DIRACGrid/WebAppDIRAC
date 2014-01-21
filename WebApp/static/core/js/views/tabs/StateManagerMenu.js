/***
 * This class is the Graphical representation of the Manage states menu.
 * @class Ext.dirac.views.tabs.StateManagerMenu
 * @extends Ext.menu.Menu
 */
Ext.define('Ext.dirac.views.tabs.StateManagerMenu', {
  extend : 'Ext.menu.Menu',
  xtype : 'stateMenu',
  items : [{
        text : 'Current desktop',
        menu : {
          items : [ {
            text : 'Save',
            handler : function() {
              GLOBAL.APP.MAIN_VIEW.saveActiveDesktopState();
            }
          }, {
            text : 'Save As',
            handler : function() {
              GLOBAL.APP.MAIN_VIEW.saveAsActiveDesktopState();
            }
          }, {
            text : 'Delete',
            handler : function() {
              GLOBAL.APP.MAIN_VIEW.deleteDesktopStates();
            }
          } ]
        }
      }, {
        text : 'Current application',
        menu : {
          items : [ {
            text : 'Save',
            handler : function() {
              GLOBAL.APP.MAIN_VIEW.saveActiveApplicationState();
            }
          }, {
            text : 'Save As',
            handler : function() {
              GLOBAL.APP.MAIN_VIEW.saveAsActiveApplicationState();
            }
          }, {
            text : 'Delete',
            handler : function() {
              GLOBAL.APP.MAIN_VIEW.deleteApplicationStates();
            }
          } ]
        }
      } ]
});