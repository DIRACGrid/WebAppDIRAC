Ext.define("DIRAC.SpaceOccupancy.classes.SpaceOccupancy", {
  extend: "Ext.dirac.core.Module",

  requires: [
    "Ext.dirac.utils.DiracGridPanel",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracBaseSelector",
    "Ext.dirac.utils.DiracAjaxProxy",
  ],

  loadState: function (data) {
    var me = this;

    me.grid.loadState(data);

    me.leftPanel.loadState(data);

    if (data.leftPanelCollapsed) {
      if (data.leftPanelCollapsed) me.leftPanel.collapse();
    }
  },

  getStateData: function () {
    var me = this;
    var oReturn = {};

    // data for grid columns
    oReturn.grid = me.grid.getStateData();
    // show/hide for selectors and their selected data (including NOT
    // button)
    oReturn.leftMenu = me.leftPanel.getStateData();

    oReturn.leftPanelCollapsed = me.leftPanel.collapsed;

    return oReturn;
  },
  dataFields: [
    {
      name: "StatusIcon",
      mapping: "Status",
    },
    {
      name: "Status",
    },
    {
      name: "Site",
    },
    {
      name: "Endpoint",
    },
    {
      name: "StorageElement",
    },
    {
      name: "Ratio",
    },
    {
      name: "Free",
    },
    {
      name: "Total",
    },
    {
      name: "Guaranteed",
    },
    {
      name: "LastCheckTime",
    },
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Space Occupancy";
    me.launcher.maximized = false;

    var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

    me.launcher.width = oDimensions[0];
    me.launcher.height = oDimensions[1];

    me.launcher.x = 0;
    me.launcher.y = 0;

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

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE LEFT PANEL
     * -----------------------------------------------------------------------------------------------------------
     */

    var selectors = {
      StorageElement: "StorageElement",
    };

    var textFields = {};

    var map = [["StorageElement", "StorageElement"]];

    me.leftPanel = Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      textFields: textFields,
      datamap: map,
      hasTimeSearchPanel: false,
      url: "SpaceOccupancy/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */

    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + "SpaceOccupancy/getSpaceOccupancyData",
    });

    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      fields: me.dataFields,
      //groupDir : 'DESC',
      groupField: "Site",
      scope: me,
      remoteSort: false,
      autoLoad: true,
    });

    me.dataStore.sort("Endpoint", "ASC");
    var oColumns = {
      None: {
        dataIndex: "StatusIcon",
        properties: {
          width: 26,
          sortable: false,
          hideable: false,
          fixed: true,
          menuDisabled: true,
        },
        renderFunction: "rendererStatus",
      },
      Status: {
        dataIndex: "Status",
      },

      Site: {
        dataIndex: "Site",
        properties: {
          hidden: true,
        },
      },
      Endpoint: {
        dataIndex: "Endpoint",
        properties: {
          align: "left",
          width: 350,
        },
      },
      StorageElement: {
        dataIndex: "StorageElement",
        properties: {
          align: "right",
          width: 100,
        },
      },
      "% Free": {
        dataIndex: "Ratio",
        properties: {
          align: "right",
          width: 80,
        },
      },
      "Total (MB)": {
        dataIndex: "Total",
        properties: {
          align: "right",
          width: 80,
        },
      },
      "Guaranteed (MB)": {
        dataIndex: "Guaranteed",
        properties: {
          align: "right",
          width: 80,
        },
      },
      LastCheckTime: {
        dataIndex: "LastCheckTime",
        properties: {
          align: "left",
          width: 120,
        },
      },
    };

    me.grid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      store: me.dataStore,
      oColumns: oColumns,
      scope: me,
      features: [
        {
          ftype: "grouping",
        },
      ],
    });

    me.leftPanel.setGrid(me.grid);

    me.add([me.leftPanel, me.grid]);
  },
});
