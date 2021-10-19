/*******************************************************************************
 * It can be used to create a context menu. NOTE: You have to provide the menu
 * items and the scope. The menuitems is a dictionary which has Visible and
 * Protected keys: -Visible: the menu items accessible by all users. -Protected:
 * the menu items are restricted. Only the appropriate users can be accessed to
 * this functionalities. For example: only the users can access to the menu
 * items which are a certain group. These to items are lists which contain
 * dictionaries used to configure the menu items.:
 * {'Visible':[{}],'Protected','Protected':[{}]} The dictionaries have the
 * following format: {"text":"a","handler":func,"arguments":[a,b,c],
 * properties:{}} -text: the menu item name (this text will appears in the menu)
 * -handler: this function handle the event. -arguments: we can pass parameters
 * to the func method. -properties: We can provide properties which are
 * properties of the {@link Ext.menu.Menu}. -property: It is used when the menu
 * item is protected. (We allow to use the functionalities to a certain users.
 *
 *
 * var sandboxSubmenu = { 'Visible':[ {"text":"Get input file(s)",
 * "handler":me.__getSandbox,"arguments":[GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid,
 * "JobID"), "Input"],"properties":{tooltip:'Click to kill the selected
 * job.',iconCls : "dirac-icon-download"}}, {"text":"Get output file(s)",
 * "handler":me.__getSandbox,"arguments":[GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid,
 * "JobID"), "Output"],"properties":{tooltip:'Click to kill the selected
 * job.',iconCls : "dirac-icon-download"}} ]};
 *
 * var menuitems = { 'Visible':[ {"text":"JDL", "handler":me.__oprGetJobData,
 * "arguments":["getJDL"], "properties":{tooltip:'Click to show the JDL of the
 * selected job.'}}, {"text":"-"},//separator {"text":"Attributes",
 * "handler":me.__oprGetJobData, "arguments":["getBasicInfo"],
 * "properties":{tooltip:'Click to show the attributtes of the selected job.'}},
 * {"text":"SandBox", "subMenu": sandboxSubmenu, "properties":{iconCls :
 * "jm-icon-sandbox",}} ]} me.contextGridMenu = new
 * Ext.dirac.utils.DiracApplicationContextMenu({menu:menuitems,scope:me});
 *
 */
Ext.define("Ext.dirac.utils.DiracApplicationContextMenu", {
  extend: "Ext.menu.Menu",
  /**
   * @cfg{menuitems} is a dictionary which contains the menu items. More
   *                 details in above.
   */
  menuitems: null,

  dynamicShow: false,

  constructor: function (oConfig) {
    var me = this;
    me.callParent(arguments);
    if (oConfig.scope) {
      Ext.apply(me, {
        scope: oConfig.scope,
      });
    }
    if (oConfig) {
      if (oConfig.dynamicShow) me.dynamicShow = oConfig.dynamicShow;
      if (oConfig.menu && "Visible" in oConfig.menu && oConfig.menu.Visible.length > 0) {
        for (var i = 0; i < oConfig.menu.Visible.length; i++) {
          var oMenuItem = null;
          if (oConfig.menu.Visible[i].text == "-") {
            me.add(new Ext.menu.Separator());
          } else if ("handler" in oConfig.menu.Visible[i]) {
            oMenuItem = new Ext.menu.Item({
              text: oConfig.menu.Visible[i].text,
              handler: oConfig.menu.Visible[i].handler.bind(me.scope, ...(oConfig.menu.Visible[i].arguments || [])),
              scope: me.scope,
            });
          } else if ("subMenu" in oConfig.menu.Visible[i]) {
            oMenuItem = new Ext.menu.Item({
              text: oConfig.menu.Visible[i].text,
            });
            me.__createSubmenu(oMenuItem, oConfig.menu.Visible[i].subMenu);
          }
          if (oConfig.menu.Visible[i].properties) {
            Ext.apply(oMenuItem, oConfig.menu.Visible[i].properties);
          }
          if (oConfig.menu.Visible[i].checkField) {
            oMenuItem.checkField = oConfig.menu.Visible[i].checkField;
          }
          me.add(oMenuItem);
        }
      }
      if (oConfig.menu && "Protected" in oConfig.menu && oConfig.menu.Protected.length > 0) {
        for (var i = 0; i < oConfig.menu.Protected.length; i++) {
          var oMenuItem = null;
          var lDisable =
            "properties" in GLOBAL.USER_CREDENTIALS &&
            (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, oConfig.menu.Protected[i].property) != -1) == false
              ? true
              : false;
          if (oConfig.menu.Protected[i].text == "-") {
            me.add(new Ext.menu.Separator());
          } else if ("handler" in oConfig.menu.Protected[i]) {
            oMenuItem = new Ext.menu.Item({
              text: oConfig.menu.Protected[i].text,
              handler: oConfig.menu.Protected[i].handler.bind(me.scope, ...(oConfig.menu.Protected[i].arguments || [])),
              scope: me.scope,
              disabled: lDisable,
            });
          } else if ("subMenu" in oConfig.menu.Protected[i]) {
            oMenuItem = new Ext.menu.Item({
              text: oConfig.menu.Protected[i].text,
              disabled: lDisable,
            });
            me.__createSubmenu(oMenuItem, oConfig.menu.Protected[i].subMenu);
          }
          if (oConfig.menu.Protected[i].properties) {
            Ext.apply(oMenuItem, oConfig.menu.Protected[i].properties);
          }
          if (oConfig.menu.Protected[i].checkField) {
            oMenuItem.checkField = oConfig.menu.Protected[i].checkField;
          }
          me.add(oMenuItem);
        }
      }
    }
  },
  /**
   * It is used to create sub menu to a given menu item.
   *
   * @param{Ext.menu.Item} oMenu the sub menu will belong to this menu item.
   * @param{Object} subMenu it contains the menu items the format is same as
   *                the {@link #menuitems}
   */
  __createSubmenu: function (oMenu, subMenu) {
    var me = this;
    oMenu.menu = new Ext.menu.Menu();
    if (subMenu == null) {
      return;
    } else {
      if ("Visible" in subMenu) {
        for (var i = 0; i < subMenu.Visible.length; i++) {
          if (subMenu.Visible[i].text == "-") {
            oMenu.menu.add(new Ext.menu.Separator());
          } else if ("handler" in subMenu.Visible[i]) {
            var oMenuItem = new Ext.menu.Item({
              text: subMenu.Visible[i].text,
              handler: subMenu.Visible[i].handler.bind(me.scope, ...(subMenu.Visible[i].arguments || [])),
              scope: me.scope,
            });
          } else if ("subMenu" in subMenu.Visible[i]) {
            var oMenuItem = new Ext.menu.Item({
              text: oConfig.menu.Visible[i].text,
            });
            me.__createSubmenu(oMenuItem, oConfig.menu.Visible[i].subMenu);
            oMenu.menu.add(oMenuItem);
          }
          if (subMenu.Visible[i].properties) {
            Ext.apply(oMenuItem, subMenu.Visible[i].properties);
          }
          if (subMenu.Visible[i].checkField) {
            oMenuItem.checkField = subMenu.Visible[i].checkField;
          }
          oMenu.menu.add(oMenuItem);
        }
      } else if ("Protected" in subMenu) {
        for (var i = 0; i < subMenu.Protected.length; i++) {
          var lDisable =
            "properties" in GLOBAL.USER_CREDENTIALS &&
            (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, subMenu.Protected[i].property) != -1) == false
              ? true
              : false;
          oMenu.disabled = lDisable;
          if (subMenu.Protected[i].text == "-") {
            oMenu.menu.add(new Ext.menu.Separator());
          } else if ("handler" in subMenu.Protected[i]) {
            var oMenuItem = new Ext.menu.Item({
              text: subMenu.Protected[i].text,
              handler: subMenu.Protected[i].handler.bind(me.scope, ...(subMenu.Protected[i].arguments || [])),
              scope: me.scope,
              disabled: lDisable,
            });
          } else if ("subMenu" in subMenu.Protected[i]) {
            var oMenuItem = new Ext.menu.Item({
              text: oConfig.menu.Protected[i].text,
              disabled: lDisable,
              checkField: oConfig.menu.Protected[i].checkField,
            });
            me.__createSubmenu(oMenuItem, oConfig.menu.Protected[i].subMenu);
            oMenu.menu.add(oMenuItem);
          }
          if (subMenu.Protected[i].properties) {
            Ext.apply(oMenuItem, subMenu.Protected[i].properties);
          }
          if (subMenu.Protected[i].checkField) {
            oMenuItem.checkField = subMenu.Protected[i].checkField;
          }
          oMenu.menu.add(oMenuItem);
        }
      }
    }
  },
  doSow: function (record) {
    var me = this;
    for (var i = 0; i < me.items.length; i++) {
      var menuItem = me.items.getAt(i);
      for (var key in menuItem.checkField) {
        if (key == "property") continue; // it is not a condition...
        if (record.get(key) == menuItem.checkField[key]) {
          switch (menuItem.checkField["property"]) {
            case "disable":
              me.items.getAt(i).enable();
              break;
            case "hide":
              me.items.getAt(i).hide();
              break;
            default:
              me.items.getAt(i).enable();
          }
        } else {
          switch (menuItem.checkField["property"]) {
            case "disable":
              me.items.getAt(i).disable();
              break;
            case "hide":
              me.items.getAt(i).show();
              break;
            default:
              me.items.getAt(i).show();
          }
        }
      }
    }
  },
});
