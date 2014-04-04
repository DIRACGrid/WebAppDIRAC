/**
 * @class Ext.dirac.views.tabs.ContextMenu
 * @extends Ext.menu.Menu
 */
Ext.define('Ext.dirac.views.tabs.ContextMenu', {
      extend : 'Ext.menu.Menu',
      xtype : 'applicationContextMenu',
      oSelectedMenuItem : null,
      constructor : function(config) {
        var me = this;
        me.callParent(arguments);
      },
      initComponent : function(config) {
        var me = this;
        Ext.apply(me, {
              items : [{
                    text : "New Desktop",
                    iconCls : "dirac-icon-new-folder",
                    handler : function() {
                      GLOBAL.APP.MAIN_VIEW.createNewDesktop();
                    }

                  }, {
                    text : 'Share desktop',
                    iconCls : "dirac-icon-state",
                    disabled : true,
                    value : 0,
                    handler : function() {
                      var me = this;

                      GLOBAL.APP.SM.oprShareState("desktop", me.oSelectedMenuItem.data.text, function(rCode, rAppName, rStateName, rMessage) {

                            if (rCode == 1) {

                              var oHtml = "";
                              oHtml += "<div style='padding:5px'>The string you can send is as follows:</div>";
                              oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

                              Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + rStateName + "</span> state:", oHtml);

                            }

                          });

                    },
                    scope : me
                  }, {
                    text : 'Make private',
                    disabled : true,
                    iconCls : "dirac-icon-private",
                    value : 1,
                    handler : function() {
                      var me = this;
                      GLOBAL.APP.SM.oprChangeSharedStateToPrivate("desktop", me.oSelectedMenuItem.data.text, function(rCode, rAppName, rStateName, rMessage) {

                            if (rCode == 1) {

                              var oHtml = "";
                              oHtml += "<div style='padding:5px'>The desktop access has changed to private:</div>";
                              oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

                              Ext.MessageBox.alert("Info for making private the <span style='color:red'>" + rStateName + "</span> state:", oHtml);

                            }

                          });

                    },
                    scope : me
                  }, {
                    text : "Switch to presenter view",
                    scope : me,
                    value : 2,
                    view : 'presenterView',
                    disabled : true,
                    handler : function() {
                      var me = this;
                      me.oSelectedMenuItem.data.view = 'presenterView';
                      me.oSelectedMenuItem.getChildAt(0).data.view = 'presenterView';
                      Ext.Ajax.request({
                            url : GLOBAL.BASE_URL + 'UP/changeView',
                            params : {
                              app : "desktop",
                              desktop : me.oSelectedMenuItem.data.text,
                              view : 'presenterView',
                              obj : "application"
                            },
                            scope : me,
                            success : function(response) {
                              var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", me.oSelectedMenuItem.data.text);

                              switch (iStateLoaded) {
                                case -1 :
                                  GLOBAL.APP.CF.alert("The state does not exist !", "warning");
                                  return;
                                  break;
                                case -2 :
                                  me.funcPostponedLoading = function() {
                                    GLOBAL.APP.CF.alert("Network problem during the svae...", "warning");
                                  }
                                  setTimeout(me.funcPostponedLoading, 1000);
                                  return;
                                  break;
                              }
                              GLOBAL.APP.SM.cache["application"]["desktop"][me.oSelectedMenuItem.data.text].view = 'presenterView'; // it
                              // is a
                              // hack
                              Ext.dirac.system_info.msg("Notification", 'Desktop view has changed successfully !');
                            },
                            failure : function(response) {
                              Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
                            }
                          });
                    }
                  }, {
                    text : "Switch to tab view",
                    scope : me,
                    disabled : true,
                    value : 3,
                    view : 'tabView',
                    handler : function() {
                      var me = this;
                      me.oSelectedMenuItem.data.view = 'tabView';
                      me.oSelectedMenuItem.getChildAt(0).data.view = 'tabView';
                      Ext.Ajax.request({
                            url : GLOBAL.BASE_URL + 'UP/changeView',
                            params : {
                              app : "desktop",
                              desktop : me.oSelectedMenuItem.data.text,
                              view : 'tabView',
                              obj : "application"
                            },
                            scope : me,
                            success : function(response) {
                              var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", me.oSelectedMenuItem.data.text);

                              switch (iStateLoaded) {
                                case -1 :
                                  GLOBAL.APP.CF.alert("The state does not exist !", "warning");
                                  return;
                                  break;
                                case -2 :
                                  me.funcPostponedLoading = function() {
                                    GLOBAL.APP.CF.alert("Network problem during the svae...", "warning");
                                  }
                                  setTimeout(me.funcPostponedLoading, 1000);
                                  return;
                                  break;
                              }
                              GLOBAL.APP.SM.cache["application"]["desktop"][me.oSelectedMenuItem.data.text].view = 'tabView';
                              Ext.dirac.system_info.msg("Notification", 'Desktop view has changed successfully !');
                            },
                            failure : function(response) {
                              Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
                            }
                          });
                    }
                  }, {
                    text : 'Save',
                    value : 4
                  }, {
                    text : 'Save As',
                    value : 5
                  }, {
                    text : 'Delete',
                    value : 6,
                    handler : function() {
                      if (me.oSelectedMenuItem.data.type == "app") {

                        if (me.oSelectedMenuItem.data.desktop == "") {
                          GLOBAL.APP.MAIN_VIEW.SM.deleteState(me.oSelectedMenuItem.data.application, me.oSelectedMenuItem.data.text, function(returnCode, appName, stateType, stateName) {
                                GLOBAL.APP.MAIN_VIEW.removeNodeFormDefaultDesktop(me.oSelectedMenuItem.data.text);

                              });
                        } else {
                          GLOBAL.APP.MAIN_VIEW.SM.deleteStateFromDesktop(me.oSelectedMenuItem.data.desktop, me.oSelectedMenuItem.data.application, me.oSelectedMenuItem.data.text, function(returnCode, appName, stateType, stateName) {
                                GLOBAL.APP.MAIN_VIEW.removeApplicationFromDesktop(me.oSelectedMenuItem.data.desktop,  me.oSelectedMenuItem.data.text);
                              });

                        }

                      } else {
                        if (me.oSelectedMenuItem.data.text == "Deafult")
                          return; //do not delete the default desktop.
                          
                        GLOBAL.APP.MAIN_VIEW.SM.deleteState("desktop", me.oSelectedMenuItem.data.text, function(returnCode, appName, stateType, stateName) {
                              GLOBAL.APP.MAIN_VIEW.deleteStateFromMenu(stateName);
                            });
                      }

                    }
                  }]
            });
        me.callParent(arguments);
      },
      enableMenuItem : function(menuItem) {
        var me = this;
        me.items.each(function(item, index) {
              if (item.value == menuItem) {
                item.enable();
              }
            });

      },
      disableMenuItem : function(menuItem) {
        var me = this;
        me.items.each(function(item, index) {
              if (item.value == menuItem) {
                item.disable();
              }
            });
      }
    });