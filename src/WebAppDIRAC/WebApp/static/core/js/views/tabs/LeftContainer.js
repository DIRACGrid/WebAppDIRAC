/***
 * it contains the tab panels. We can have different panels such as Menu, documentation, help, etc.
 */
Ext.define("Ext.dirac.views.tabs.LeftContainer", {
  extend: "Ext.container.Container",
  requires: ["Ext.dirac.views.tabs.MenuTabs"],
  xtype: "icon-tabs",
  floatable: false,
  region: "west",
  split: true,
  margins: "0",
  bodyPadding: 5,
  //collapsible : true,
  layout: "fit",
  //scrollable : true,
  width: 275, //225
  minWidth: 35,
  items: [],
  desktop: null,
  collapsed: false,
  initComponent: function () {
    var me = this;
    Ext.setGlyphFontFamily("Pictos");
    var menu = Ext.create("Ext.dirac.views.tabs.MenuTabs", {
      menu: me.menu,
    });
    Ext.apply(me, { items: menu });
    me.callParent(arguments);
  },
  setActiveMenu: function (name) {
    var me = this;
    var menu = me.items.getAt(0);
    found = null;
    menu.items.each(function (i) {
      if (i.value == name) {
        found = i;
        return;
      }
    });
    if (found) {
      menu.setActiveTab(found);
    }
  },
  /***
   * It returns a panel from the container.
   * @param{String} name is the name of the panel
   * @return{Object} is a panel
   */
  __getMenuObject: function (name) {
    var me = this;
    var menu = me.items.getAt(0);
    found = null;
    menu.items.each(function (i) {
      if (i.value == name) {
        found = i;
        return;
      }
    });
    return found;
  },
  /***
   * It returns the menu panel
   *@return{Ext.dirac.views.tabs.SelPanel}
   */
  getSelectionPanel: function () {
    var me = this;
    var mPanel = me.__getMenuObject("menuPanel");
    return mPanel;
  },
});
