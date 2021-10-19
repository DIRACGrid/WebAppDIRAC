/*******************************************************************************
 * This class is the Graphical representation of the Manage states menu.
 *
 * @class Ext.dirac.views.tabs.StateManagerMenu
 * @extends Ext.menu.Menu
 */
Ext.define("Ext.dirac.views.tabs.StateManagerMenu", {
  extend: "Ext.menu.Menu",
  xtype: "stateMenu",
  items: [
    {
      text: "Desktops",
      menu: {
        items: [
          {
            text: "New Desktop",
            iconCls: "dirac-icon-new-folder",
            handler: function () {
              GLOBAL.APP.MAIN_VIEW.createNewDesktop();
            },
          },
          {
            text: "Save",
            iconCls: "dirac-icon-save",
            handler: function () {
              GLOBAL.APP.MAIN_VIEW.saveActiveDesktopState();
            },
          },
          {
            text: "Save As",
            iconCls: "dirac-icon-save",
            handler: function () {
              GLOBAL.APP.MAIN_VIEW.saveAsActiveDesktopState();
            },
          },
          {
            text: "Delete",
            iconCls: "dirac-icon-delete",
            handler: function () {
              GLOBAL.APP.MAIN_VIEW.deleteDesktopStates();
            },
          },
        ],
      },
    },
    {
      text: "Applications",
      menu: {
        items: [
          {
            text: "Save",
            iconCls: "dirac-icon-save",
            handler: function () {
              GLOBAL.APP.MAIN_VIEW.saveActiveApplicationState();
            },
          },
          {
            text: "Save As",
            iconCls: "dirac-icon-save",
            handler: function () {
              GLOBAL.APP.MAIN_VIEW.saveAsActiveApplicationState();
            },
          },
          {
            text: "Delete",
            iconCls: "dirac-icon-delete",
            handler: function () {
              GLOBAL.APP.MAIN_VIEW.deleteApplicationStates();
            },
          },
        ],
      },
    },
    "-",
    {
      text: "State Loader",
      iconCls: "dirac-icon-state",
      handler: function () {
        GLOBAL.APP.MAIN_VIEW.SM.formStateLoader(GLOBAL.APP.MAIN_VIEW.cbAfterLoadSharedState, GLOBAL.APP.MAIN_VIEW.cbAfterSaveSharedState);
      },
    },
  ],
});
