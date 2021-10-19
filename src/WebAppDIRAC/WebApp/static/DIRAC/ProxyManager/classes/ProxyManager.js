/*******************************************************************************
 * It is the transformation monitor class.
 */
Ext.define("DIRAC.ProxyManager.classes.ProxyManager", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.panel.Panel",
    "Ext.dirac.utils.DiracBoxSelect",
    "Ext.form.field.TextArea",
    "Ext.dirac.utils.DiracGridPanel",
    "Ext.dirac.utils.DiracIdListButton",
    "Ext.dirac.utils.DiracPageSizeCombo",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracJsonStore",
    "Ext.dirac.utils.DiracAjaxProxy",
    "Ext.dirac.utils.DiracApplicationContextMenu",
    "Ext.dirac.utils.DiracBaseSelector",
  ],

  loadState: function (data) {
    var me = this;

    me.grid.loadState(data);

    me.leftPanel.loadState(data);

    if (data.leftPanelCollapsed) {
      me.leftPanel.collapse();
    }
  },

  getStateData: function () {
    var me = this;
    var oStates = {};

    oStates = {
      grid: me.grid.getStateData(),
      leftMenu: me.leftPanel.getStateData(),
    };

    oStates.leftPanelCollapsed = me.leftPanel.collapsed;

    return oStates;
  },
  dataFields: [
    {
      name: "proxyid",
    },
    {
      name: "UserName",
    },
    {
      name: "UserDN",
    },
    {
      name: "UserGroup",
      type: "auto",
    },
    {
      name: "ExpirationTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "PersistentFlag",
    },
  ],

  initComponent: function () {
    var me = this;

    GLOBAL.APP.CF.log("debug", "create the widget(initComponent)...");

    me.launcher.title = "Proxy Manager";
    me.launcher.maximized = false;

    Ext.apply(me, {
      layout: "border",
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    me.callParent(arguments);
  },
  buildUI: function () {
    var me = this;

    GLOBAL.APP.CF.log("debug", "create the widget...(buildUI)");

    var selectors = {
      username: "User",
      usergroup: "Group",
    };

    var map = [
      ["username", "username"],
      ["usergroup", "usergroup"],
    ];

    me.leftPanel = new Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      datamap: map,
      hasTimeSearchPanel: false,
      url: "ProxyManager/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */
    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + me.applicationName + "/getProxyManagerData",
    });

    me.diffValues = {};
    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      fields: me.dataFields,
      groupField: "UserName",
      scope: me,
      remoteSort: false,
    });

    var pagingToolbar = null;

    var toolButtons = {
      Visible: [
        {
          text: "Delete",
          handler: me.__deleteProxyes,
          properties: {
            tooltip: "Click to delete the selected proxies!",
            iconCls: "dirac-icon-delete",
          },
        },
      ],
    };

    pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      toolButtons: toolButtons,
      store: me.dataStore,
      scope: me,
    });

    var oColumns = {
      checkBox: {
        dataIndex: "proxyid",
      },
      User: {
        dataIndex: "UserName",
        properties: {
          width: 100,
          sortable: true,
        },
      },
      DN: {
        dataIndex: "UserDN",
        properties: {
          width: 350,
          sortable: true,
        },
      },
      Group: {
        dataIndex: "UserGroup",
        properties: {
          width: 100,
          sortable: true,
        },
      },
      "Expiration date (UTC)": {
        dataIndex: "ExpirationTime",
        properties: {
          width: 150,
          sortable: true,
        },
        renderer: function (value, metadata, record, rowIndex, colIndex, store) {
          var expEpoch = record.data.ExpirationTime.getTime();
          /* eslint-disable */
          var nowEpoch = Ext.Date.now();
          /* eslint-enable */
          var secsLeft = expEpoch - nowEpoch;

          var msDay = 60 * 60 * 24 * 1000;
          var secsLeft = Math.floor((expEpoch - nowEpoch) / msDay);

          var timeLimit = 30; // 30 days before expiration

          if (secsLeft < timeLimit) {
            return '<span style="color:red">' + Ext.Date.format(record.data.ExpirationTime, "Y-m-d H:i:s") + " (" + secsLeft + ")" + "</span>";
          } else {
            return '<span style="color:green">' + Ext.Date.format(record.data.ExpirationTime, "Y-m-d H:i:s") + "</span>";
          }
        },
      },
      Persistent: {
        dataIndex: "PersistentFlag",
        properties: {
          width: 100,
          sortable: true,
        },
      },
    };

    me.grid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      store: me.dataStore,
      features: [
        {
          ftype: "grouping",
        },
      ],
      oColumns: oColumns,
      pagingToolbar: pagingToolbar,
      scope: me,
    });

    me.leftPanel.setGrid(me.grid);

    me.add([me.leftPanel, me.grid]);
  },
  __deleteProxyes: function () {
    var me = this;
    var items = [];
    var elememts = Ext.query("#" + me.id + " input.checkrow");

    for (var i = 0; i < elememts.length; i++) if (elememts[i].checked) items.push(elememts[i].value);

    if (items && items.length > 0) {
      msg = "proxies";

      if (window.confirm("Are you sure you want to delete selected proxies?"))
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + me.applicationName + "/deleteProxies",
          params: {
            idList: Ext.JSON.encode(items),
          },
          success: function (oResponse) {
            if (oResponse.status == 200) {
              response = Ext.JSON.decode(oResponse.responseText);
              if (response.success == "false") {
                Ext.dirac.system_info.msg("Error", response.error);
              } else {
                Ext.dirac.system_info.msg("Notification", "Deleted " + response.result + " proxies");
              }
            } else {
              GLOBAL.APP.CF.showAjaxErrorMessage(response);
            }
          },
          failure: function (response) {
            GLOBAL.APP.CF.showAjaxErrorMessage(response);
          },
        });
    }
  },
});
