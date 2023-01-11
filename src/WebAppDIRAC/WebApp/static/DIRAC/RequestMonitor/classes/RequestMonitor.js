/*******************************************************************************
 * Requets Monitor apllication
 */
/*******************************************************************************
 * It is the transformation monitor class.
 */

Ext.define("DIRAC.RequestMonitor.classes.RequestMonitor", {
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
  },
  /**
   * This is used to open an application.
   *
   * @cfg{Object} it contains the application name and the module name.
   */
  applicationsToOpen: {
    JobMonitor: "DIRAC.JobMonitor.classes.JobMonitor",
  },

  getStateData: function () {
    var me = this;

    var oStates = {
      grid: me.grid.getStateData(),
      leftMenu: me.leftPanel.getStateData(),
    };

    return oStates;
  },

  dataFields: [
    {
      name: "RequestIDcheckBox",
      mapping: "RequestID",
    },
    {
      name: "Status",
    },
    {
      name: "OwnerGroup",
    },
    {
      name: "LastUpdateTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "OperationType",
    },
    {
      name: "CreationTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "JobID",
    },
    {
      name: "Owner",
    },
    {
      name: "RequestID",
      type: "int",
    },
    {
      name: "Error",
    },
    {
      name: "RequestName",
    },
    {
      name: "StatusIcon",
      mapping: "Status",
    },
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Request Monitor";
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
      operationType: "Operation Type",
      status: "Status",
      owner: "Owner",
      ownerGroup: "Owner Group",
    };

    var textFields = {
      id: {
        name: "JobId(s)",
      },
      reqId: {
        name: "RequestId(s)",
      },
    };

    var map = [
      ["operationType", "operationType"],
      ["status", "status"],
      ["owner", "owner"],
      ["ownerGroup", "ownerGroup"],
    ];

    me.leftPanel = new Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      textFields: textFields,
      datamap: map,
      url: "RequestMonitor/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */
    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + "RequestMonitor/getRequestMonitorData",
    });

    me.diffValues = {};
    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      fields: me.dataFields,
      scope: me,
    });

    var pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      dataStore: me.dataStore,
      scope: me,
    });

    var oColumns = {
      checkBox: {
        dataIndex: "RequestIDcheckBox",
      },
      RequestId: {
        dataIndex: "RequestID",
      },
      JobID: {
        dataIndex: "JobID",
      },
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
        properties: {
          width: 60,
        },
      },
      Owner: {
        dataIndex: "Owner",
      },
      OperationType: {
        dataIndex: "OperationType",
      },
      OwnerGroup: {
        dataIndex: "OwnerGroup",
      },
      RequestName: {
        dataIndex: "RequestName",
        properties: {
          hidden: true,
        },
      },
      Error: {
        dataIndex: "Error",
      },
      "CreationTime [UTC]": {
        dataIndex: "CreationTime",
        renderer: Ext.util.Format.dateRenderer("Y-m-j H:i"),
        properties: {
          hidden: true,
        },
      },
      "LastUpdateTime [UTC]": {
        dataIndex: "LastUpdateTime",
        renderer: Ext.util.Format.dateRenderer("Y-m-j H:i"),
        properties: {
          hidden: true,
        },
      },
    };

    var showJobshandler = function () {
      var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID");
      var setupdata = {};
      setupdata.data = {};
      setupdata.currentState = oId;
      setupdata.data.leftMenu = {};
      setupdata.data.leftMenu.JobID = oId;

      GLOBAL.APP.MAIN_VIEW.createNewModuleContainer({
        objectType: "app",
        moduleName: me.applicationsToOpen["JobMonitor"],
        setupData: setupdata,
      });
    };

    var menuitems = {
      Visible: [
        {
          text: "Show Jobs",
          handler: showJobshandler,
          properties: {
            tooltip: "Click to show the jobs which belong to the selected request.",
          },
        },
      ],
    };

    me.contextGridMenu = new Ext.dirac.utils.DiracApplicationContextMenu({
      menu: menuitems,
      scope: me,
    });

    me.grid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      store: me.dataStore,
      features: [
        {
          ftype: "grouping",
        },
      ],
      oColumns: oColumns,
      tbar: pagingToolbar,
      contextMenu: me.contextGridMenu,
      pagingToolbar: pagingToolbar,
      scope: me,
    });

    me.leftPanel.setGrid(me.grid);

    me.add([me.leftPanel, me.grid]);
  },
});
