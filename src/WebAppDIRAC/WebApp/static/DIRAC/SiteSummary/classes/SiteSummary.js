Ext.define("DIRAC.SiteSummary.classes.SiteSummary", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.dirac.utils.DiracBaseSelector",
    "Ext.dirac.utils.DiracJsonStore",
    "Ext.dirac.utils.DiracAjaxProxy",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracApplicationContextMenu",
    "Ext.dirac.utils.DiracGridPanel",
    "DIRAC.SiteSummary.classes.OverviewPanel",
  ],
  loadState: function (data) {
    var me = this;

    me.grid.loadState(data);

    me.leftPanel.loadState(data);
  },
  getStateData: function () {
    var me = this;

    var oStates = {
      grid: me.grid.getStateData(),
      leftMenu: me.leftPanel.getStateData(),
    };

    return oStates;
  },

  /**
   * This is used to open an application.
   *
   * @cfg{Object} it contains the application name and the module name.
   */
  applicationsToOpen: {
    ResourceSummary: "DIRAC.ResourceSummary.classes.ResourceSummary",
  },

  dataFields: [
    {
      name: "Name",
    },
    {
      name: "Country",
    },
    {
      name: "Status",
    },
    {
      name: "Reason",
    },
    {
      name: "DateEffective",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "TokenExpiration",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "ElementType",
    },
    {
      name: "StatusType",
    },
    {
      name: "LastCheckTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "VO",
    },
    {
      name: "TokenOwner",
    },
    {
      name: "StatusIcon",
      mapping: "Status",
    },
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Site Summary";
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

    var selectors = {
      name: "Name",
      elementType: "SiteType",
      status: "Status",
      statusType: "StatusType",
      VO: "VO",
      tokenOwner: "TokenOwner",
    };

    var map = [
      ["name", "name"],
      ["elementType", "elementType"],
      ["status", "status"],
      ["statusType", "statusType"],
      ["tokenOwner", "tokenOwner"],
    ];

    me.leftPanel = new Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      datamap: map,
      hasTimeSearchPanel: false,
      url: "SiteSummary/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */
    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + "SiteSummary/getSiteSummaryData",
    });

    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      fields: me.dataFields,
      scope: me,
    });

    var pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      store: me.dataStore,
      scope: me,
      value: 100,
    });

    var oColumns = {
      None: {
        dataIndex: "StatusIcon",
        properties: {
          width: 36,
          sortable: false,
          hideable: false,
          fixed: true,
          menuDisabled: true,
        },
        renderFunction: "rendererStatus",
      },
      Name: {
        dataIndex: "Name",
        properties: {
          fixed: false,
        },
      },
      Country: {
        dataIndex: "Country",
        properties: {
          hideable: true,
          sortable: true,
          align: "left",
        },
        renderer: function flag(code) {
          return '<img src="' + GLOBAL.BASE_URL + "static/core/img/flags/" + code + '.gif">';
        },
      },
      SiteType: {
        dataIndex: "ElementType",
      },
      StatusType: {
        dataIndex: "StatusType",
        properties: {
          width: 60,
          sortable: false,
        },
      },
      Status: {
        dataIndex: "Status",
      },
      Reason: {
        dataIndex: "Reason",
      },
      DateEffective: {
        dataIndex: "DateEffective",
        properties: {
          sortable: true,
        },
      },
      LastCheckTime: {
        dataIndex: "LastCheckTime",
        properties: {
          sortable: true,
        },
      },
      VO: {
        dataIndex: "VO",
        properties: {
          sortable: true,
        },
      },
      TokenOwner: {
        dataIndex: "TokenOwner",
        properties: {
          sortable: true,
        },
      },
      TokenExpiration: {
        dataIndex: "TokenExpiration",
        properties: {
          sortable: true,
        },
      },
    };

    var statusSubmenu = {
      Visible: [
        {
          text: "Active",
          handler: me.__oprSetSite,
          arguments: ["setStatus", "Active"],
          properties: {
            tooltip: "Click to activate the resource.",
          },
        },
        {
          text: "Degraded",
          handler: me.__oprSetSite,
          arguments: ["setStatus", "Degraded"],
          properties: {
            tooltip: "Click to set degraded the resource.",
          },
        },
        {
          text: "Probing",
          handler: me.__oprSetSite,
          arguments: ["setStatus", "Probing"],
          properties: {
            tooltip: "Click to set probing the resource.",
          },
        },
        {
          text: "Banned",
          handler: me.__oprSetSite,
          arguments: ["setStatus", "Banned"],
          properties: {
            tooltip: "Click to set banned the resource.",
          },
        },
      ],
    };
    var tokenSubmenu = {
      Visible: [
        {
          text: "Acquire",
          handler: me.__oprSetSite,
          arguments: ["setToken", "Acquire"],
          properties: {
            tooltip: "Click to acquire the resource.",
          },
        },
        {
          text: "Release",
          handler: me.__oprSetSite,
          arguments: ["setToken", "Release"],
          properties: {
            tooltip: "Click to release the resource.",
          },
        },
      ],
    };
    var menuitems = {
      Visible: [
        {
          text: "Overview",
          handler: me.__oprShowEditor,
          properties: {
            tooltip: "Click to show the jobs which belong to the selected request.",
          },
        },
        {
          text: "-", // separator
        },
        {
          text: "History",
          handler: me.__oprOnSiteSummaryData,
          arguments: ["History"],
          properties: {
            tooltip: "Click to show the history of the selected resource.",
          },
        },
        {
          text: "Policies",
          handler: me.__oprOnSiteSummaryData,
          arguments: ["Policies"],
          properties: {
            tooltip: "Click to show the policies of the selected resource.",
          },
        },
        {
          text: "-", // separator
        },
        {
          text: "Set status",
          subMenu: statusSubmenu,
        },
        {
          text: "Set token",
          subMenu: tokenSubmenu,
        },
      ],
    };

    me.contextGridMenu = new Ext.dirac.utils.DiracApplicationContextMenu({
      menu: menuitems,
      scope: me,
    });

    me.grid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      store: me.dataStore,
      columnLines: true,
      width: 600,
      height: 300,
      oColumns: oColumns,
      stateful: true,
      stateId: "SiteSummary_grid",
      contextMenu: me.contextGridMenu,
      pagingToolbar: pagingToolbar,
      scope: me,
    });

    me.leftPanel.setGrid(me.grid);

    me.overviewPanel = Ext.create("DIRAC.SiteSummary.classes.OverviewPanel", {
      applicationName: me.applicationName,
      parentWidget: me,
      width: 900,
      height: 300,
    });

    me.add([me.leftPanel, me.grid, me.overviewPanel]);
  },
  __oprOnSiteSummaryData: function (action) {
    var me = this;
    var selectedValues = me.__getSelectedValues();
    me.getContainer().body.mask("Wait ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: Ext.JSON.encode([action]),
        name: Ext.JSON.encode([selectedValues.name]),
        elementType: Ext.JSON.encode([selectedValues.elementType]),
        statusType: Ext.JSON.encode([selectedValues.statusType]),
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
      success: function (response) {
        me.getContainer().body.unmask();
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          if (action == "History") {
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "History:" + selectedValues.name + "(" + selectedValues.statusType + ")",
              ["Status", "DataEffectiv", "Reason"],
              [
                {
                  text: "Status",
                  flex: 1,
                  sortable: false,
                  dataIndex: "Status",
                },
                {
                  text: "DataEffectiv",
                  flex: 1,
                  sortable: false,
                  dataIndex: "DataEffectiv",
                },
                {
                  text: "Reason",
                  flex: 1,
                  sortable: false,
                  dataIndex: "Reason",
                },
              ]
            );
          } else if (action == "Policies") {
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Policies:" + selectedValues.name + "(" + selectedValues.statusType + ")",
              ["Status", "PolicyName", "DataEffectiv", "LastCheckTime", "Reason"],
              [
                {
                  text: "Status",
                  flex: 1,
                  sortable: false,
                  dataIndex: "Status",
                },
                {
                  text: "PolicyName",
                  flex: 1,
                  sortable: false,
                  dataIndex: "PolicyName",
                },
                {
                  text: "DataEffectiv",
                  flex: 1,
                  sortable: false,
                  dataIndex: "DataEffectiv",
                },
                {
                  text: "LastCheckTime",
                  flex: 1,
                  sortable: false,
                  dataIndex: "LastCheckTime",
                },
                {
                  text: "Reason",
                  flex: 1,
                  sortable: false,
                  dataIndex: "Reason",
                },
              ]
            );
          } else {
            me.getContainer().body.unmask();
            Ext.dirac.system_info.msg("error", jsonData["error"]);
          }
        }
      },
    });
  },
  __getSelectedValues: function () {
    var me = this;

    var values = {};

    if (me.grid.expandedGridPanel) {
      if (!me.grid.expandedGridPanel.isExpanded) {
        values.name = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "Name");
        values.elementType = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "ElementType");
        values.statusType = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "StatusType");
        values.lastCheckTime = Ext.Date.format(GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "LastCheckTime"), "Y-m-d H:i:s");
      } else {
        me.grid.expandedGridPanel.isExpanded = false;
        values.name = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid.expandedGridPanel, "Name");
        values.elementType = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid.expandedGridPanel, "ElementType");
        values.statusType = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid.expandedGridPanel, "StatusType");
        values.lastCheckTime = Ext.Date.format(GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid.expandedGridPanel, "LastCheckTime"), "Y-m-d H:i:s");
      }
    } else {
      values.name = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "Name");
      values.elementType = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "ElementType");
      values.statusType = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "StatusType");
      values.lastCheckTime = Ext.Date.format(GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "LastCheckTime"), "Y-m-d H:i:s");
    }
    return values;
  },
  __oprSetSite: function (action, newStatus) {
    var me = this;
    var selectedValues = me.__getSelectedValues();
    me.getContainer().body.mask("Wait ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: Ext.JSON.encode([action]),
        name: Ext.JSON.encode([selectedValues.name]),
        elementType: Ext.JSON.encode([selectedValues.elementType]),
        statusType: Ext.JSON.encode([selectedValues.statusType]),
        status: Ext.JSON.encode([newStatus]),
        lastCheckTime: Ext.JSON.encode([selectedValues.lastCheckTime]),
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
      success: function (response) {
        me.getContainer().body.unmask();
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          var rowid = null;
          Ext.dirac.system_info.msg("info", jsonData["result"]);
          var selectedRows = me.grid.getSelectionModel().getSelection();
          // we assume that we only select one row...
          me.grid.getStore().load();
          if (me.grid.expandedGridPanel) {
            me.grid.expandedGridPanel.destroy();
            delete me.grid.expandedGridPanel;
          }

          Ext.defer(function () {
            var records = me.grid.getStore().getRange();
            var record = null;
            for (var i = 0; i < records.length; i++) {
              if (records[i].get("Name") == selectedRows[0].get("Name")) {
                var record = me.grid.getView().getRecord(records[i]);
                rowid = record.index;
                me.grid.getSelectionModel().select(record);
                break;
              }
            }

            me.grid.getPlugin().toggleRow(rowid, record);
          }, 400);
        } else {
          me.getContainer().body.unmask();
          Ext.dirac.system_info.msg("error", jsonData["error"]);
        }
      },
    });
  },
  __oprShowEditor: function () {
    var me = this;
    var values = me.__getSelectedValues();
    me.overviewPanel.maximizedSize = {
      height: me.grid.getHeight() + me.leftPanel.getHeight(),
      width: me.grid.getWidth() + me.leftPanel.getWidth(),
    };
    me.overviewPanel.loadData(values);
    me.overviewPanel.expand();
    me.overviewPanel.show();
  },
});
