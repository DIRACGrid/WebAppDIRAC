Ext.define("DIRAC.ComponentHistory.classes.ComponentHistory", {
  extend: "Ext.dirac.core.Module",

  requires: [
    "Ext.dirac.utils.DiracGridPanel",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracApplicationContextMenu",
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
    { name: "Name" },
    { name: "Module" },
    { name: "Host" },
    { name: "System" },
    { name: "Type" },
    { name: "Installed" },
    { name: "Uninstalled" },
    { name: "InstalledBy" },
    { name: "UninstalledBy" },
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Component history";
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
      name: "Name",
      host: "Host",
      system: "System",
      module: "Module",
      type: "Type",
    };

    var textFields = {};

    var map = [
      ["name", "name"],
      ["host", "host"],
      ["system", "system"],
      ["module", "module"],
      ["type", "type"],
    ];

    me.leftPanel = Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      textFields: textFields,
      datamap: map,
      hasTimeSearchPanel: true,
      url: "ComponentHistory/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */

    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + "ComponentHistory/getInstallationData",
    });

    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      autoLoad: false,
      proxy: oProxy,
      fields: me.dataFields,
      scope: me,
      remoteSort: false,
      autoLoad: true,
    });

    var pagingToolbar = {};

    pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      store: me.dataStore,
      scope: me,
    });

    var oColumns = {
      Name: { dataIndex: "Name", properties: { width: 180, align: "center" } },
      Module: { dataIndex: "Module", properties: { width: 180, align: "center" } },
      Host: { dataIndex: "Host", properties: { width: 180, align: "center" } },
      System: { dataIndex: "System", properties: { width: 180, align: "center" } },
      Type: { dataIndex: "Type", properties: { width: 100, align: "center" } },
      Installed: { dataIndex: "Installed", properties: { width: 120, align: "center" } },
      Uninstalled: { dataIndex: "Uninstalled", properties: { width: 120, align: "center" } },
      "Installed by": { dataIndex: "InstalledBy", properties: { width: 120, align: "center" } },
      "Uninstalled by": { dataIndex: "UninstalledBy", properties: { width: 120, align: "center" } },
    };

    me.grid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      store: me.dataStore,
      oColumns: oColumns,
      pagingToolbar: pagingToolbar,
      scope: me,
    });

    me.leftPanel.setGrid(me.grid);

    me.add([me.leftPanel, me.grid]);
  },
});
