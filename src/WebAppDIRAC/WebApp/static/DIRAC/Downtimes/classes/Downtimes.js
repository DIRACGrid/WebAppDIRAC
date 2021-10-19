Ext.define("DIRAC.Downtimes.classes.Downtimes", {
  extend: "Ext.dirac.core.Module",

  requires: ["Ext.dirac.utils.DiracGridPanel", "Ext.dirac.utils.DiracBaseSelector", "Ext.dirac.utils.DiracAjaxProxy"],

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
      name: "Site",
    },
    {
      name: "Name",
    },
    {
      name: "StartDate",
    },
    {
      name: "EndDate",
    },
    {
      name: "Link",
    },
    {
      name: "Description",
    },
    {
      name: "Severity",
    },
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Downtimes";
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
      site: "Site",
      name: "Name",
      severity: "Severity",
    };

    var map = [
      ["site", "site"],
      ["name", "name"],
      ["severity", "severity"],
    ];

    me.leftPanel = Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      datamap: map,
      hasTimeSearchPanel: false,
      url: "Downtimes/getSelectionData",
    });
    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */

    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + "Downtimes/getDowntimesData",
    });

    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      autoLoad: false,
      proxy: oProxy,
      fields: me.dataFields,
      groupField: "Name",
      scope: me,
      remoteSort: false,
    });

    me.dataStore.sort("Name", "ASC");
    var oColumns = {
      Name: {
        dataIndex: "Name",
        properties: {
          align: "left",
          width: 150,
        },
      },
      Site: {
        dataIndex: "Site",
        properties: {
          hidden: true,
        },
      },
      StartDate: {
        dataIndex: "StartDate",
        properties: {
          align: "left",
          width: 120,
        },
      },
      EndDate: {
        dataIndex: "EndDate",
        properties: {
          align: "left",
          width: 120,
        },
      },
      Serverity: {
        dataIndex: "Serverity",
        properties: {
          align: "left",
          width: 80,
        },
      },
      Description: {
        dataIndex: "Description",
        properties: {
          align: "left",
          width: 500,
        },
      },
      Link: {
        dataIndex: "Link",
        properties: {
          hidden: true,
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
