/**
 * @class Ext.dirac.views.desktop.TaskBar The taskbar class. An object of this
 *        class has three main parts: - Start menu - Quick start menu - Window
 *        bar (syn. task bar)
 * @extends Ext.toolbar.Toolbar
 */
Ext.define("Ext.dirac.views.desktop.TaskBar", {
  extend: "Ext.toolbar.Toolbar", // TODO - make this a basic hbox panel...

  requires: [
    "Ext.button.Button",
    "Ext.resizer.Splitter",
    "Ext.menu.Menu",
    "Ext.dirac.views.desktop.StartMenu",
    "Ext.toolbar.TextItem",
    "Ext.dirac.views.tabs.SettingsPanel"
  ],

  alias: "widget.taskbar",

  cls: "ux-taskbar",

  /**
   * @cfg {String} startBtnText The text for the Start Button.
   */
  startBtnText: "",

  initComponent: function() {
    var me = this;

    if (!GLOBAL.APP.configData.user.username || GLOBAL.APP.configData.user.group == "visitor") {
      GLOBAL.STATE_MANAGEMENT_ENABLED = false;
    }

    var cfg = {
      app: me,
      menu: ["-"] // add a menu separator
    };

    me.usrname_button = new Ext.dirac.views.tabs.SettingsPanel().addAuthsButton();
    me.group_button = new Ext.dirac.views.tabs.SettingsPanel().addGroupsButton();
    me.setup_button = new Ext.dirac.views.tabs.SettingsPanel().addSetupButton();
    me.button_theme = new Ext.dirac.views.tabs.SettingsPanel().addThemeButton();
    me.button_views = new Ext.dirac.views.tabs.SettingsPanel().addViewButton();
    me.windowBar = new Ext.toolbar.Toolbar(me.getWindowBarConfig());
    me.startMenu = new Ext.dirac.views.desktop.StartMenu(cfg);

    me.items = [
      {
        xtype: "button",
        iconCls: "ux-dirac-start-button-icon",
        menu: me.startMenu,
        menuAlign: "bl-tl",
        text: me.startBtnText
      },
      me.windowBar
    ];

    me.items.push({
      xtype: "tbtext",
      text: "Theme"
    });
    me.items.push(me.button_theme);
    me.items.push({
      xtype: "tbtext",
      text: "View"
    });
    me.items.push(me.button_views);
    me.items.push("-");
    me.items.push(me.usrname_button);

    if (GLOBAL.APP.configData.user.username && GLOBAL.APP.configData.user.group != "visitor") {
      me.items.push({
        xtype: "tbtext",
        text: "@"
      });
      me.items.push(me.group_button);
      me.items.push("-");
      me.items.push(me.setup_button);
    }

    me.callParent();
  },

  afterLayout: function() {
    var me = this;
    me.callParent();
    me.windowBar.el.on("contextmenu", me.onButtonContextMenu, me);
  },

  /**
   * This method returns the configuration object for the Tray toolbar. A
   * derived class can override this method, call the base version to build
   * the config and then modify the returned object before returning it.
   */
  getTrayConfig: function() {
    var ret = {
      width: 80,
      items: this.trayItems
    };
    delete this.trayItems;
    return ret;
  },

  getWindowBarConfig: function() {
    return {
      flex: 1,
      cls: "ux-desktop-windowbar",
      items: ["&#160;"],
      layout: {
        overflowHandler: "Scroller"
      }
    };
  },

  getWindowBtnFromEl: function(el) {
    var c = this.windowBar.getChildByElement(el);
    return c || null;
  },

  onButtonContextMenu: function(e) {
    var me = this,
      t = e.getTarget(),
      btn = me.getWindowBtnFromEl(t);
    if (btn) {
      e.stopEvent();
      me.windowMenu.theWin = btn.win;
      me.windowMenu.showBy(t);
    }
  },

  /**
   * Function to add a (task) button within the task bar
   *
   * @param {Ext.window.Window}
   *          win The window to be referenced by the button
   * @return {Ext.button.Button} Button object added to the task bar
   */
  addTaskButton: function(win) {
    var config = {
      iconCls: win.iconCls,
      enableToggle: true,
      toggleGroup: "all",
      width: 140,
      margins: "0 2 0 3",
      text: Ext.util.Format.ellipsis(win.title, 20),
      listeners: {
        click: this.onWindowBtnClick,
        scope: this
      },
      win: win
    };
    var cmp = this.windowBar.add(config);
    cmp.toggle(true);
    return cmp;
  },

  /**
   * Event handler executed when a button is clicked
   *
   * @param {Ext.button.Button}
   *          btn Button that has been clicked
   */
  onWindowBtnClick: function(btn) {
    var win = btn.win;

    if (win.minimized || win.hidden) {
      win.minimized = false;
      win.show();
    } else if (win.active) {
      if (!win.desktopStickMode) {
        win.minimize();
      }
    } else {
      win.toFront();
    }

    if (!("isChildWindow" in win)) win.desktop.refreshUrlDesktopState();
  },

  /**
   * Function to remove a (task) button within the task bar
   *
   * @param {Ext.button.Button}
   *          btn The button to be removed
   * @return {Ext.button.Button} Button object removed from the task bar
   */
  removeTaskButton: function(btn) {
    var found,
      me = this;
    me.windowBar.items.each(function(item) {
      if (item === btn) {
        found = item;
      }
      return !found;
    });
    if (found) {
      me.windowBar.remove(found);
    }
    return found;
  },

  /**
   * Function to activate a button
   *
   * @param {Ext.button.Button}
   *          btn The button to be removed
   */
  setActiveButton: function(btn) {
    if (btn) {
      btn.toggle(true);
    } else {
      this.windowBar.items.each(function(item) {
        if (item.isButton) {
          item.toggle(false);
        }
      });
    }
  }
});
