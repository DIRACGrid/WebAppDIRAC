/**
 * @class Ext.dirac.views.tabs.ContextMenu
 * @extends Ext.menu.Menu
 */
Ext.define('Ext.dirac.views.tabs.ContextMenu', {
  extend: 'Ext.menu.Menu',
  xtype: 'applicationContextMenu',
  oSelectedMenuItem : null,
  constructor : function(config){
    var me = this;
    me.callParent(arguments);
  },
  initComponent : function(config){
    var me = this;
    Ext.apply(me,{
      items: [{
        text : 'Share desktop',
        disabled : true,
        value : 0,
        handler : function(){
          var me = this;
          Ext.Ajax.request({
            url : GLOBAL.BASE_URL + 'UP/makePublicDesktopState',
            params : {
              obj : "desktop",
              app : "application",
              name : me.oSelectedMenuItem.data.text,
              access : "ALL"
            },
            scope : me,
            success : function(response) {

              var me = this;

              var oStringToShow = "The " + me.oSelectedMenuItem.data.text + "is shared! <br> It is available using " +GLOBAL.APP.configData["user"]["group"] + " group!";

              var oHtml = "";
              oHtml += "<div style='padding:5px;font-weight:bold'>" + oStringToShow + "</div>";

              Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + me.oSelectedMenuItem.data.text + "</span> desktop:", oHtml);
              GLOBAL.APP.MAIN_VIEW.addToSharedDesktop(me.oSelectedMenuItem.data.text);

            },
            failure : function(response) {

              var responseData = Ext.JSON.decode(response.responseText);
              Ext.dirac.system_info.msg("Notification", responseData["error"]);
            }
          });

        },
        scope : me
      },{
        text : 'Make private',
        disabled : true,
        value : 1,
        handler : function(){
          var me = this;
          Ext.Ajax.request({
            url : GLOBAL.BASE_URL + 'UP/makePublicDesktopState',
            params : {
              obj : "desktop",
              app : "desktop",
              name : me.oSelectedMenuItem.data.text,
              access : "USER"
            },
            scope : me,
            success : function(response) {

              var me = this;

              var oStringToShow = "The " + me.oSelectedMenuItem.data.text + "is not shared! <br> It is available using " +GLOBAL.APP.configData["user"]["group"] + " group!";

              var oHtml = "";
              oHtml += "<div style='padding:5px;font-weight:bold'>" + oStringToShow + "</div>";

              Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + me.oSelectedMenuItem.data.text + "</span> desktop:", oHtml);
              GLOBAL.APP.MAIN_VIEW.removeFormSharedDesktop(me.oSelectedMenuItem.data.text);

            },
            failure : function(response) {

              var responseData = Ext.JSON.decode(response.responseText);
              Ext.dirac.system_info.msg("Notification", responseData["error"]);
            }
          });

        },
        scope : me
      },{
        text : "Switch to presenter view",
        scope : me,
        value : 2,
        view : 'presenter',
        disabled : true,
        handler : function(){
          var me = this;
          me.oSelectedMenuItem.data.view = 'presenter';
          me.oSelectedMenuItem.getChildAt(0).data.view = 'presenter';
          Ext.Ajax.request({
            url : GLOBAL.BASE_URL + 'UP/changeView',
            params : {
              app : "desktop",
              desktop : me.oSelectedMenuItem.data.text,
              view : 'presenter',
              obj : "application"
            },
            scope : me,
            success : function(response) {
              var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", me.oSelectedMenuItem.data.text);

              switch (iStateLoaded) {
              case -1:
                GLOBAL.APP.CF.alert("The state does not exist !", "warning");
                return;
                break;
              case -2:
                me.funcPostponedLoading = function() {
                  GLOBAL.APP.CF.alert("Network problem during the svae...", "warning");
                }
                setTimeout(me.funcPostponedLoading, 1000);
                return;
                break;
              }
              GLOBAL.APP.SM.cache["application"]["desktop"][me.oSelectedMenuItem.data.text].view = 'presenter'; //it is a hack
              Ext.dirac.system_info.msg("Notification", 'Desktop view has changed successfully !');
            },
            failure : function(response) {
              Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
            }
          });
        }
      },{
        text : "Switch to tab view",
        scope : me,
        disabled : true,
        value : 3,
        view:'layout',
        handler : function(){
          var me = this;
          me.oSelectedMenuItem.data.view = 'layout';
          me.oSelectedMenuItem.getChildAt(0).data.view = 'layout';
          Ext.Ajax.request({
            url : GLOBAL.BASE_URL + 'UP/changeView',
            params : {
              app : "desktop",
              desktop : me.oSelectedMenuItem.data.text,
              view : 'layout',
              obj : "application"
            },
            scope : me,
            success : function(response) {
              var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", me.oSelectedMenuItem.data.text);

              switch (iStateLoaded) {
              case -1:
                GLOBAL.APP.CF.alert("The state does not exist !", "warning");
                return;
                break;
              case -2:
                me.funcPostponedLoading = function() {
                  GLOBAL.APP.CF.alert("Network problem during the svae...", "warning");
                }
                setTimeout(me.funcPostponedLoading, 1000);
                return;
                break;
              }
              GLOBAL.APP.SM.cache["application"]["desktop"][me.oSelectedMenuItem.data.text].view = 'layout';
              Ext.dirac.system_info.msg("Notification", 'Desktop view has changed successfully !');
            },
            failure : function(response) {
              Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
            }
          });
        }
      },
      {
        text: 'Save',
        value : 4
      },{
        text: 'Save As',
        value : 5
      },{
        text: 'Delete',
        value : 6
      }]});
    me.callParent(arguments);
  },
  enableMenuItem : function(menuItem){
    var me = this;
    me.items.each(function(item, index){
      if (item.value == menuItem){
        item.enable();
      }
    });

  },
  disableMenuItem : function(menuItem){
    var me = this;
    me.items.each(function(item, index){
      if (item.value == menuItem){
        item.disable();
      }
    });
  }
});