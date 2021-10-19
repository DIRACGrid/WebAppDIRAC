/**
 * @class Ext.dirac.views.tabs.ContextMenu
 * @extends Ext.menu.Menu
 */
Ext.define("Ext.dirac.views.tabs.ContextMenu", {
  extend: "Ext.menu.Menu",
  xtype: "applicationContextMenu",
  oSelectedMenuItem: null,
  constructor: function (config) {
    var me = this;
    me.callParent(arguments);
  },
  initComponent: function (config) {
    var me = this;
    Ext.apply(me, {
      items: [
        {
          text: "Create Default desktop",
          iconCls: "core-desktop-icon",
          handler: function () {
            GLOBAL.APP.MAIN_VIEW.createDefaultDesktop();
          },
        },
        {
          text: "New Desktop",
          iconCls: "dirac-icon-new-folder",
          handler: function () {
            GLOBAL.APP.MAIN_VIEW.createNewDesktop();
          },
        },
        {
          text: "Make public",
          iconCls: "dirac-icon-state",
          disabled: false,
          handler: function () {
            var me = this;

            if (me.oSelectedMenuItem.data.type == "desktop") {
              GLOBAL.APP.SM.oprPublishState("desktop", me.oSelectedMenuItem.data.text);
            } else {
              GLOBAL.APP.SM.oprPublishState(me.oSelectedMenuItem.data.application, me.oSelectedMenuItem.data.text);
            }
          },
          scope: me,
        },
        {
          text: "Share desktop",
          iconCls: "dirac-icon-state",
          disabled: true,
          value: 0,
          handler: function () {
            var me = this;

            GLOBAL.APP.SM.oprShareState("desktop", me.oSelectedMenuItem.data.text, function (rCode, rAppName, rStateName, rMessage) {
              if (rCode == 1) {
                var oHtml = "";
                oHtml += "<div style='padding:5px'>The string you can send is as follows:</div>";
                oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

                Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + rStateName + "</span> state:", oHtml);
              }
            });
          },
          scope: me,
        },
        {
          text: "Share application",
          iconCls: "dirac-icon-state",
          disabled: true,
          value: 1,
          handler: function () {
            var me = this;

            GLOBAL.APP.SM.oprShareState(
              me.oSelectedMenuItem.data.application,
              me.oSelectedMenuItem.data.text,
              function (rCode, rAppName, rStateName, rMessage) {
                if (rCode == 1) {
                  var oHtml = "";
                  oHtml += "<div style='padding:5px'>The string you can send is as follows:</div>";
                  oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

                  Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + rStateName + "</span> state:", oHtml);
                }
              }
            );
          },
          scope: me,
        },
        {
          text: "Make private",
          disabled: true,
          iconCls: "dirac-icon-private",
          value: 2,
          handler: function () {
            var me = this;
            var app = "desktop";

            if (me.oSelectedMenuItem.data.type == "app") {
              app = me.oSelectedMenuItem.data.application;
            }
            GLOBAL.APP.SM.oprChangeSharedStateToPrivate(app, me.oSelectedMenuItem.data.text, function (rCode, rAppName, rStateName, rMessage) {
              if (rCode == 1) {
                var oHtml = "";
                oHtml += "<div style='padding:5px'>The desktop access has changed to private:</div>";
                oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

                Ext.MessageBox.alert("Info for making private the <span style='color:red'>" + rStateName + "</span> state:", oHtml);
              }
            });
          },
          scope: me,
        },
        {
          text: "Switch to presenter view",
          scope: me,
          value: 3,
          view: "presenterView",
          iconCls: "dirac-icon-presenter-theme",
          disabled: true,
          handler: function () {
            var me = this;
            me.oSelectedMenuItem.data.view = "presenterView";
            me.oSelectedMenuItem.getChildAt(0).data.view = "presenterView";
            Ext.Ajax.request({
              url: GLOBAL.BASE_URL + "UP/changeView",
              params: {
                app: "desktop",
                desktop: me.oSelectedMenuItem.data.text,
                view: "presenterView",
                type: "presenterView",
                obj: "application",
              },
              scope: me,
              success: function (response) {
                var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", me.oSelectedMenuItem.data.text);

                switch (iStateLoaded) {
                  case -1:
                    GLOBAL.APP.CF.alert("The state does not exist !", "warning");
                    return;
                    break;
                  case -2:
                    me.funcPostponedLoading = function () {
                      GLOBAL.APP.CF.alert("Network problem during the svae...", "warning");
                    };
                    setTimeout(me.funcPostponedLoading, 1000);
                    return;
                    break;
                }
                GLOBAL.APP.SM.cache["application"]["desktop"][me.oSelectedMenuItem.data.text].view = "presenterView"; // it
                // is a
                // hack
                Ext.dirac.system_info.msg("Notification", "Desktop view has changed successfully !");
              },
              failure: function (response) {
                GLOBAL.APP.CF.showAjaxErrorMessage(response);
              },
            });
          },
        },
        {
          text: "Switch to tab view",
          scope: me,
          disabled: true,
          value: 4,
          view: "tabView",
          iconCls: "dirac-icon-tab-theme",
          handler: function () {
            var me = this;
            me.oSelectedMenuItem.data.view = "tabView";
            me.oSelectedMenuItem.getChildAt(0).data.view = "tabView";
            Ext.Ajax.request({
              url: GLOBAL.BASE_URL + "UP/changeView",
              params: {
                app: "desktop",
                desktop: me.oSelectedMenuItem.data.text,
                view: "tabView",
                obj: "application",
              },
              scope: me,
              success: function (response) {
                var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", me.oSelectedMenuItem.data.text);

                switch (iStateLoaded) {
                  case -1:
                    GLOBAL.APP.CF.alert("The state does not exist !", "warning");
                    return;
                    break;
                  case -2:
                    me.funcPostponedLoading = function () {
                      GLOBAL.APP.CF.alert("Network problem during the svae...", "warning");
                    };
                    setTimeout(me.funcPostponedLoading, 1000);
                    return;
                    break;
                }
                GLOBAL.APP.SM.cache["application"]["desktop"][me.oSelectedMenuItem.data.text].view = "tabView";
                Ext.dirac.system_info.msg("Notification", "Desktop view has changed successfully !");
              },
              failure: function (response) {
                GLOBAL.APP.CF.showAjaxErrorMessage(response);
              },
            });
          },
        },
        {
          text: "Save",
          value: 5,
          iconCls: "dirac-icon-save",
          handler: function () {
            if (me.oSelectedMenuItem.data.type == "app") {
              // the
              // selected
              // menu item
              // is an
              // application

              GLOBAL.APP.MAIN_VIEW.SM.saveState(
                me.oSelectedMenuItem.data.desktop,
                me.oSelectedMenuItem.data.application,
                me.oSelectedMenuItem.data.text,
                function (desktop, stateType, stateName) {}
              );
            } else {
              // we can modify the desktop, which is not belongs
              // to Default.
              if (me.oSelectedMenuItem.data.text == "Deafult") return; // do not delete the default desktop.

              GLOBAL.APP.MAIN_VIEW.saveDesktopState(me.oSelectedMenuItem.data.text);
            }
          },
        },
        {
          text: "Save As",
          iconCls: "dirac-icon-save",
          value: 6,
          handler: function () {
            if (me.oSelectedMenuItem.data.type == "app") {
              // the
              // selected
              // menu item
              // is an
              // application

              GLOBAL.APP.MAIN_VIEW.SM.saveAsState(
                me.oSelectedMenuItem.data.desktop,
                me.oSelectedMenuItem.data.application,
                me.oSelectedMenuItem.data.text,
                function (desktop, stateType, stateName) {
                  Ext.dirac.system_info.msg("Notification", stateName + " is saved!");
                  GLOBAL.APP.MAIN_VIEW.SM.saveWindow.hide();
                }
              );
            } else {
              GLOBAL.APP.MAIN_VIEW.saveAsActiveDesktopState(me.oSelectedMenuItem.data.text);
            }
          },
        },
        {
          text: "Delete",
          iconCls: "dirac-icon-delete",
          value: 7,
          handler: function () {
            // the selected menu item is an application
            if (me.oSelectedMenuItem.data.type == "app") {
              //if the desktop is empty it means the application is belongs to the default desktop.
              if (me.oSelectedMenuItem.data.desktop == "" || me.oSelectedMenuItem.data.desktop === undefined) {
                GLOBAL.APP.MAIN_VIEW.SM.deleteState(
                  me.oSelectedMenuItem.data.application,
                  me.oSelectedMenuItem.data.text,
                  function (returnCode, appName, stateType, stateName) {
                    GLOBAL.APP.MAIN_VIEW.removeNodeFormDefaultDesktop(me.oSelectedMenuItem.data.text);
                    GLOBAL.APP.MAIN_VIEW.closeApplication(me.oSelectedMenuItem.data.desktop, me.oSelectedMenuItem.data.text); //close the application
                  }
                );
              } else {
                GLOBAL.APP.MAIN_VIEW.SM.deleteStateFromDesktop(
                  me.oSelectedMenuItem.data.desktop,
                  me.oSelectedMenuItem.data.application,
                  me.oSelectedMenuItem.data.text,
                  function (returnCode, appName, stateType, stateName) {
                    GLOBAL.APP.MAIN_VIEW.removeApplicationFromDesktop(me.oSelectedMenuItem.data.desktop, me.oSelectedMenuItem.data.text);
                    GLOBAL.APP.MAIN_VIEW.closeApplication(me.oSelectedMenuItem.data.desktop, me.oSelectedMenuItem.data.text); //close the application
                  }
                );
              }
            } else {
              // we can modify the desktop, which is not belongs
              // to Default.
              if (me.oSelectedMenuItem.data.text == "Deafult") return; // do not delete the default desktop.

              GLOBAL.APP.MAIN_VIEW.SM.deleteState("desktop", me.oSelectedMenuItem.data.text, function (returnCode, appName, stateType, stateName) {
                GLOBAL.APP.MAIN_VIEW.deleteStateFromMenu(stateName);
              });
            }
          },
        },
      ],
    });
    me.callParent(arguments);
  },
  enableMenuItem: function (menuItem) {
    var me = this;
    me.items.each(function (item, index) {
      if (item.value == menuItem) {
        item.enable();
      }
    });
  },
  disableMenuItem: function (menuItem) {
    var me = this;
    me.items.each(function (item, index) {
      if (item.value == menuItem) {
        item.disable();
      }
    });
  },
});
