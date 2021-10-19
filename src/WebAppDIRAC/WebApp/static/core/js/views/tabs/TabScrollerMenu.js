/*
 * This plugin used by the tab view.
 */
Ext.define("Ext.dirac.views.tabs.TabScrollerMenu", {
  alias: "plugin.diractabscrollermenu",

  requires: ["Ext.menu.Menu"],

  /**
   * @cfg {Number} pageSize How many items to allow per submenu.
   */
  pageSize: 5,
  /**
   * @cfg {Number} maxText How long should the title of each {@link Ext.menu.Item} be.
   */
  maxText: 65,
  /**
   * @cfg {String} menuPrefixText Text to prefix the submenus.
   */
  menuPrefixText: "Applications",

  /**
   * Creates new TabScrollerMenu.
   * @param {Object} config Configuration options
   */
  constructor: function (config) {
    Ext.apply(this, config);
  },

  /**
   * @private
   * @param {Object} tabPanel tab panel which contains a toolbar
   * @param {Object} menu which shows the open tabs
   */
  init: function (tabPanel, menu) {
    var me = this;

    me.tabPanel = tabPanel;
    me.tabMenu = menu;
    if (menu) {
      menu.on("click", me.showTabsMenu, me);
    }
  },

  /**
   * Returns an the current page size (this.pageSize);
   * @return {Number} this.pageSize The current page size.
   */
  getPageSize: function () {
    return this.pageSize;
  },
  /**
   * Sets the number of menu items per submenu "page size".
   * @param {Number} pageSize The page size
   */
  setPageSize: function (pageSize) {
    this.pageSize = pageSize;
  },
  /**
   * Returns the current maxText length;
   * @return {Number} this.maxText The current max text length.
   */
  getMaxText: function () {
    return this.maxText;
  },
  /**
   * Sets the maximum text size for each menu item.
   * @param {Number} t The max text per each menu item.
   */
  setMaxText: function (t) {
    this.maxText = t;
  },
  /**
   * Returns the current menu prefix text String.;
   * @return {String} this.menuPrefixText The current menu prefix text.
   */
  getMenuPrefixText: function () {
    return this.menuPrefixText;
  },
  /**
   * Sets the menu prefix text String.
   * @param {String} t The menu prefix text.
   */
  setMenuPrefixText: function (t) {
    this.menuPrefixText = t;
  },

  showTabsMenu: function (e) {
    var me = this;

    if (me.tabsMenu) {
      me.tabsMenu.removeAll();
    } else {
      me.tabsMenu = new Ext.menu.Menu();
    }

    me.generateTabMenuItems();

    me.tabsMenu.showAt(e.getXY());
  },

  /**
   * @private
   */
  generateTabMenuItems: function () {
    var me = this,
      tabPanel = me.tabPanel,
      curActive = tabPanel.getActiveTab(),
      allItems = tabPanel.items.getRange(),
      pageSize = me.getPageSize(),
      tabsMenu = me.tabsMenu,
      totalItems,
      numSubMenus,
      remainder,
      i,
      curPage,
      menuItems,
      x,
      item,
      start,
      index;

    tabsMenu.suspendLayouts();
    allItems = Ext.Array.filter(allItems, function (item) {
      if (item.id == curActive.id) {
        return false;
      }
      return item.hidden ? !!item.hiddenByLayout : true;
    });
    totalItems = allItems.length;
    numSubMenus = Math.floor(totalItems / pageSize);
    remainder = totalItems % pageSize;

    if (totalItems > pageSize) {
      // Loop through all of the items and create submenus in chunks of 10
      for (i = 0; i < numSubMenus; i++) {
        curPage = (i + 1) * pageSize;
        menuItems = [];

        for (x = 0; x < pageSize; x++) {
          index = x + curPage - pageSize;
          item = allItems[index];
          menuItems.push(me.autoGenMenuItem(item));
        }

        tabsMenu.add({
          text: me.getMenuPrefixText() + " " + (curPage - pageSize + 1) + " - " + curPage,
          menu: menuItems,
        });
      }
      // remaining items
      if (remainder > 0) {
        start = numSubMenus * pageSize;
        menuItems = [];
        for (i = start; i < totalItems; i++) {
          item = allItems[i];
          menuItems.push(me.autoGenMenuItem(item));
        }

        me.tabsMenu.add({
          text: me.menuPrefixText + " " + (start + 1) + " - " + (start + menuItems.length),
          menu: menuItems,
        });
      }
    } else {
      for (i = 0; i < totalItems; ++i) {
        tabsMenu.add(me.autoGenMenuItem(allItems[i]));
      }
    }
    tabsMenu.resumeLayouts(true);
  },

  /**
   * @private
   */
  autoGenMenuItem: function (item) {
    var maxText = this.getMaxText(),
      text = Ext.util.Format.ellipsis(item.title, maxText);

    return {
      text: text,
      handler: this.showTabFromMenu,
      scope: this,
      disabled: item.disabled,
      tabToShow: item,
      iconCls: item.iconCls,
    };
  },

  /**
   * @private
   */
  showTabFromMenu: function (menuItem) {
    this.tabPanel.setActiveTab(menuItem.tabToShow);
  },

  destroy: function () {
    Ext.destroy(this.tabsMenu, this.menuButton);
    this.callParent();
  },
});
