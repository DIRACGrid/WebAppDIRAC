/**
 * This widget contains different tool bar buttons. We have to provide the tool
 * buttons using a dictionary. The tool buttons have to be defined same way as
 * {@link Ext.dirac.utils.DiracApplicationContextMenu} The format of the
 * dictionary is {'Visible':[],'Protected':[]} The Visible buttons are available
 * to all users, while the Protected buttons are available only users which are
 * in a certain group(They have a certain role).
 *
 * The Visible and Protected lists contains dictionaries which have the
 * following format: {"text":"a","handler":func,"arguments":[a,b,c],
 * properties:{}} -text: the menu item name (this text will appears in the menu)
 * -handler: this function handle the event. -arguments: we can pass parameters
 * to the func method. -properties: We can provide properties which are
 * properties of the {@link Ext.menu.Menu}. -property: It is used when the menu
 * item is protected. (We allow to use the functionalities to a certain users).
 *
 *
 * For example:
 *
 * <pre>
 * pagingToolbar = Ext.create(&quot;Ext.dirac.utils.DiracPagingToolbar&quot;, {
 *       toolButtons : toolButtons,
 *       store : me.dataStore,
 *       scope : me
 *     });
 * </pre>
 *
 * -toolButons: It is the dictionary which describe the buttons. In the
 * following example we can see how to defined protected tool buttons.
 *
 * <pre>
 * var toolButtons = {
 *   'Visible' : [{
 *         &quot;text&quot; : &quot;&quot;,
 *         &quot;handler&quot; : me.__oprJobAction,
 *         &quot;arguments&quot; : [&quot;reschedule&quot;, &quot;&quot;],
 *         &quot;properties&quot; : {
 *           tooltip : &quot;Reschedule&quot;,
 *           iconCls : &quot;dirac-icon-reschedule&quot;
 *         }
 *       }, {
 *         &quot;text&quot; : &quot;&quot;,
 *         &quot;handler&quot; : me.__oprJobAction,
 *         &quot;arguments&quot; : [&quot;kill&quot;, &quot;&quot;],
 *         &quot;properties&quot; : {
 *           tooltip : &quot;Kill&quot;,
 *           iconCls : &quot;dirac-icon-kill&quot;
 *         }
 *       }, {
 *         &quot;text&quot; : &quot;&quot;,
 *         &quot;handler&quot; : me.__oprJobAction,
 *         &quot;arguments&quot; : [&quot;delete&quot;, &quot;&quot;],
 *         &quot;properties&quot; : {
 *           tooltip : &quot;Delete&quot;,
 *           iconCls : &quot;dirac-icon-delete&quot;
 *         }
 *       }, {
 *         &quot;text&quot; : &quot;&quot;,
 *         &quot;handler&quot; : me.__setActiveItemInTheCentralWorkPanel,
 *         &quot;arguments&quot; : [],
 *         &quot;properties&quot; : {
 *           iconCls : &quot;dirac-icon-pie&quot;,
 *           tooltip : &quot;Go to the statistics panel&quot;
 *         }
 *       }],
 *   'Protected' : [{
 *         &quot;text&quot; : &quot;&quot;,
 *         &quot;handler&quot; : me.__oprJobAction,
 *         &quot;arguments&quot; : [&quot;reset&quot;, &quot;&quot;],
 *         &quot;properties&quot; : {
 *           tooltip : &quot;Reset&quot;,
 *           iconCls : &quot;jm-red-reset-icon&quot;
 *         },
 *         &quot;property&quot; : &quot;JobAdministrator&quot;
 *       }]
 * };
 * </pre>
 *
 * -store: It is the {@link Ext.dirac.utils.DiracJsonStore} object. -scope: It
 * is used to have access to the main widget.
 *
 */
Ext.define("Ext.dirac.utils.DiracPagingToolbar", {
  extend: "Ext.toolbar.Paging",
  requires: ["Ext.dirac.utils.DiracIdListButton", "Ext.dirac.utils.DiracPageSizeCombo"],
  displayInfo: true,
  displayMsg: "Displaying topics {0} - {1} of {2}",
  items: [],
  emptyMsg: "No topics to display",
  prependButtons: true,
  /*
   * layout : { overflowHandler : 'Scroller' },
   */
  /**
   * @cfg{List} pagingToolbarItems It contains the tool bar items such as
   *            buttons, size combo, etc.
   */
  pagingToolbarItems: [],
  /**
   * @cfg{List} pagingToolbarButtons It contains the tool bar buttons.
   */
  pagingToolbarButtons: [],
  /**
   * @cfg{Ext.dirac.utils.DiracPageSizeCombo}pageSizeCombo This widget is
   *                                                       the page size
   *                                                       combo.
   */
  pageSizeCombo: null,
  /**
   * @cfg{Ext.dirac.utils.DiracJsonStore}store The associated data store
   *                                           object.
   */
  store: null,
  constructor: function (config) {
    var me = this;

    me.pagingToolbarItems = []; // make sure there is no element in the list
    me.pagingToolbarButtons = [];
    var idBtn = Ext.create("Ext.dirac.utils.DiracIdListButton", {
      scope: config.scope,
    });
    me.pagingToolbarItems.push(idBtn);
    me.pagingToolbarItems.push("-");

    if (config.toolButtons) {
      var nbOfButtons = 0;
      if ("Visible" in config.toolButtons && config.toolButtons.Visible.length > 0) {
        for (var i = 0; i < config.toolButtons.Visible.length; i++) {
          if (config.toolButtons.Visible[i].menu) {
            me.pagingToolbarButtons[nbOfButtons] = config.toolButtons.Visible[i];
          } else {
            me.pagingToolbarButtons[nbOfButtons] = Ext.create("Ext.Button", {
              text: config.toolButtons.Visible[i].text,
              handler: config.toolButtons.Visible[i].handler.bind(config.scope, ...(config.toolButtons.Visible[i].arguments || [])),
            });
            if ("properties" in config.toolButtons.Visible[i]) {
              Ext.apply(me.pagingToolbarButtons[nbOfButtons], config.toolButtons.Visible[i].properties);
            }
          }
          nbOfButtons++;
        }
      }
      if ("Protected" in config.toolButtons && config.toolButtons.Protected.length > 0) {
        for (var i = 0; i < config.toolButtons.Protected.length; i++) {
          if (
            "properties" in GLOBAL.USER_CREDENTIALS &&
            Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, config.toolButtons.Protected[i].property) != -1
          ) {
            if (config.toolButtons.Protected[i].menu) {
              me.pagingToolbarButtons[nbOfButtons] = config.toolButtons.Protected[i];
            } else {
              me.pagingToolbarButtons[nbOfButtons] = Ext.create("Ext.Button", {
                text: config.toolButtons.Protected[i].text,
                handler: config.toolButtons.Protected[i].handler.bind(config.scope, ...(config.toolButtons.Protected[i].arguments || [])),
              });
              if ("properties" in config.toolButtons.Protected[i]) {
                Ext.apply(me.pagingToolbarButtons[nbOfButtons], config.toolButtons.Protected[i].properties);
              }
            }
          }
          nbOfButtons++;
        }
      }
    }

    for (var i in me.pagingToolbarButtons) {
      me.pagingToolbarItems.push(me.pagingToolbarButtons[i]);
    }

    me.pagingToolbarItems.push("-");
    me.pagingToolbarItems.push("->");

    me.pagingToolbarItems.push("Items per page: ");

    me.pageSizeCombo = Ext.create("Ext.dirac.utils.DiracPageSizeCombo", {
      scope: config.scope,
      value: config.value ? config.value : 25,
    });

    me.pageSizeCombo.on(
      "change",
      function (combo, newValue, oldValue, eOpts) {
        var me = this;
        me.grid.store.pageSize = newValue;
        me.leftPanel.oprLoadGridData();
      },
      config.scope
    );

    me.pagingToolbarItems.push(me.pageSizeCombo);
    me.updateStamp = new Ext.Button({
      disabled: true,
      // disabledClass:'my-disabled',
      text: "Updated: -",
    });

    me.pagingToolbarItems.push(me.updateStamp);

    me.callParent(arguments);
  },
  initComponent: function (config) {
    var me = this;
    Ext.apply(me, {
      items: me.pagingToolbarItems,
    });
    me.callParent(arguments);

    var refreshButton = me.getComponent("refresh");
    var index = me.items.indexOf(refreshButton);
    var updateindex = me.items.indexOf(me.updateStamp);
    me.items.insert(index + 1, me.items.items[updateindex]);

    refreshButton.handler = function () {
      var parent = me.scope;
      parent.leftPanel.oprLoadGridData();
    };

    // /change the refresh button
    me.autoRefresh = new Ext.menu.Menu({
      items: [
        {
          text: "Disabled",
          group: "column",
          name: "0",
          checked: true,
          handler: function () {
            me.__setRefreshCycle(0);
            this.cehcked = true;
          },
        },
        {
          text: "Each 15m",
          group: "column",
          checked: false,
          name: "900000",
          handler: function () {
            me.__setRefreshCycle(900000);
          },
        },
        {
          text: "Each 30m",
          group: "column",
          checked: false,
          name: "1800000",
          handler: function () {
            me.__setRefreshCycle(1800000);
          },
        },
        {
          text: "Every hour",
          group: "column",
          checked: false,
          name: "3600000",
          handler: function () {
            me.__setRefreshCycle(3600000);
          },
        },
      ],
    });

    me.mouseup = false;
    me.refreshMenu = false;
    refreshButton.on("render", function (oElem, eOpts) {
      me.mon(
        oElem.el,
        "mouseup",
        function (event, html, eOpts) {
          me.mouseup = true;
        },
        me
      );
      me.mon(
        oElem.el,
        "mousedown",
        function (e, t, eOpts) {
          me.mouseup = false;
          Ext.defer(
            function () {
              if (me.mouseup == false) {
                me.autoRefresh.showBy(oElem.el);
                me.refreshMenu = true;
              } else {
                me.mouseup = false;
              }
            },
            1500,
            me
          );
        },
        me
      );
    });
    refreshButton.on("click", function () {
      if (me.refreshMenu) {
        me.refreshMenu = false;
        return false;
      }
    });
  },
  /**
   * This function is used to load the data which is saved in the User
   * Profile.
   *
   * @param{Object}data it contains the saved values.
   */
  loadState: function (data) {
    var me = this;

    if (data && data.grid && data.grid.pagingToolbar) {
      var toolbar = data.grid.pagingToolbar;
      if (toolbar.pageSize) {
        me.pageSizeCombo.suspendEvents(false);
        // we have to set correctly the page size of the store
        me.store.pageSize = toolbar.pageSize;
        me.pageSizeCombo.setValue(toolbar.pageSize);
        me.pageSizeCombo.resumeEvents();
      }
      if (toolbar.refreshCycle) {
        var refreshCycle = toolbar.refreshCycle == 60000 ? 900000 : toolbar.refreshCycle;
        var index = me.autoRefresh.items.findIndex("name", refreshCycle);
        me.autoRefresh.items.getAt(index).setChecked(true);
        me.__setRefreshCycle(refreshCycle);
      }
    }
  },
  /**
   * It returns the data which has to be saved in the User Profile.
   *
   * @return{Object}
   */
  getStateData: function () {
    var me = this;
    var returnValues = {
      pageSize: me.pageSizeCombo.getValue(),
      refreshCycle: me.refreshCycle,
    };

    return returnValues;
  },
  /**
   * @private
   * @param{Object} It is the time when the next refresh will occur. It is
   *                used to set how often refresh the widgets.
   */
  __setRefreshCycle: function (time) {
    var me = this;
    if (!time) return;
    me.refreshCycle = time; // it is used if we want to save the state!!!
    if (time != 0) {
      clearInterval(me.store.refreshTimeout);
      me.store.refreshTimeout = setInterval(function () {
        me.store.load();
      }, time);
    } else {
      clearInterval(me.store.refreshTimeout);
    }
  },
});
