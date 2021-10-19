/**
 * it contains the menu tabs. New menu can be added to this class.
 *
 * @class Ext.dirac.views.tabs.MenuTabs
 * @extends Ext.tab.Panel
 */
Ext.define("Ext.dirac.views.tabs.MenuTabs", {
  extend: "Ext.tab.Panel",
  requires: ["Ext.dirac.views.tabs.SelPanel"],
  width: 200,
  margin: "0 0 2 0",
  title: "Menu",
  titleAlign: "center",
  collapsible: true,
  app: null,
  coordinates: {},
  defaults: {
    bodyPadding: 10,
    scrollable: true,
    listeners: {
      activate: function (component) {
        var me = this;
        GLOBAL.APP.MAIN_VIEW.changeRightPanel(component.value);
      },
    },
  }, // if we want to hide the menu we have to look the RightContainer.js
  listeners: {
    beforecollapse: function (p, direction, animate, eOpts) {
      var me = this;
      var leftCont = GLOBAL.APP.MAIN_VIEW.getLeftContainer();
      me.coordinates.width = leftCont.getWidth();
      me.coordinates.height = leftCont.getHeight();
      leftCont.setWidth(0);
      leftCont.setHeight(0);
      leftCont.collapsed = true;
      // leftCont.hide();
    },
    beforeexpand: function (p, animate, eOpts) {
      var me = this;
      var leftCont = GLOBAL.APP.MAIN_VIEW.getLeftContainer();
      // me.items.each(function(comp){
      // comp.show();
      // });
      leftCont.collapsed = false;
      leftCont.setWidth(me.coordinates.width);
      leftCont.setHeight(me.coordinates.height);
    },
  },
  constructor: function (config) {
    var me = this;
    if (GLOBAL.APP == null) {
      alert("Application is not initialised!!!!");
    }
    me.callParent(arguments);
  },
  initComponent: function (config) {
    var me = this;
    Ext.apply(me, {
      collapseDirection: "left", // it is required to correctly
      // collapse the menu.
      items: [
        {
          xtype: "panel",
          glyph: 72, // home
          layout: "fit",
          bodyStyle: {
            background: "#AAAAAA",
          },
          value: "welcome",
        },
        {
          xtype: "menuselpanel",
          glyph: 61, // menu
          value: "menuPanel",
          region: "west",
          scope: me,
          collapsible: true,
          width: 225,
          split: true,
          minWidth: 175,
          treeModel: me.menu,
          bodyStyle: {
            background: "#AAAAAA",
          },
        },
        {
          xtype: "panel",
          glyph: 42,
          value: "sharedLayouts",
        },
      ],
    });
    me.callParent(arguments);
  },
});
