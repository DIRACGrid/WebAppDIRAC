/*
 * Pilot Monitor page
 */
Ext.define("DIRAC.PilotSummary.classes.PilotSummary", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.dirac.utils.DiracBaseSelector",
    "Ext.dirac.utils.DiracJsonStore",
    "Ext.dirac.utils.DiracAjaxProxy",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracApplicationContextMenu",
    "Ext.dirac.utils.DiracGridPanel",
    "Ext.dirac.utils.DiracRowExpander",
  ],
  applicationsToOpen: {
    PilotMonitor: "DIRAC.PilotMonitor.classes.PilotMonitor",
  },
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

  dataFields: [
    {
      name: "Scheduled",
    },
    {
      name: "Status",
    },
    {
      name: "Aborted_Hour",
    },
    {
      name: "PilotsPerJob",
      type: "float",
    },
    {
      name: "Site",
    },
    {
      name: "Submitted",
    },
    {
      name: "Done_Empty",
    },
    {
      name: "Waiting",
    },
    {
      name: "PilotJobEff",
      type: "float",
    },
    {
      name: "Done",
    },
    {
      name: "CE",
    },
    {
      name: "Aborted",
    },
    {
      name: "Ready",
    },
    {
      name: "Total",
    },
    {
      name: "Running",
    },
    {
      name: "StatusIcon",
      mapping: "Status",
    },
    {
      name: "Failed",
    },
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Pilot Summary";
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
      site: "Site",
      Status: "Status",
    };

    var map = [
      ["site", "site"],
      ["Status", "Status"],
    ];

    me.leftPanel = new Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      datamap: map,
      hasTimeSearchPanel: false,
      url: "PilotSummary/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */
    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + "PilotSummary/getPilotSummaryData",
    });

    me.diffValues = {};
    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      fields: me.dataFields,
      remoteSort: false,
      scope: me,
    });

    var pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      store: me.dataStore,
      scope: me,
      value: 100,
    });

    var oColumns = {
      None2: {
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
      Site: {
        dataIndex: "Site",
        properties: {
          fixed: false,
          width: 120,
        },
      },
      CE: {
        dataIndex: "CE",
      },
      Status: {
        dataIndex: "Status",
        properties: {
          width: 60,
          sortable: false,
        },
      },
      "PilotJobEff (%)": {
        dataIndex: "PilotJobEff",
      },
      PilotsPerJob: {
        dataIndex: "PilotsPerJob",
      },
      Submitted: {
        dataIndex: "Submitted",
        properties: {
          hidden: true,
        },
      },
      Ready: {
        dataIndex: "Ready",
        properties: {
          hidden: true,
        },
      },
      Waiting: {
        dataIndex: "Waiting",
      },
      Scheduled: {
        dataIndex: "Scheduled",
      },
      Running: {
        dataIndex: "Running",
      },
      Done: {
        dataIndex: "Done",
      },
      Aborted: {
        dataIndex: "Aborted",
      },
      Aborted_Hour: {
        dataIndex: "Aborted_Hour",
      },
      Failed: {
        dataIndex: "Failed",
      },
      Done_Empty: {
        dataIndex: "Done_Empty",
        properties: {
          hidden: true,
        },
      },
      Total: {
        dataIndex: "Total",
        properties: {
          hidden: true,
        },
      },
    };

    var showPilothandler = function () {
      var oSite = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "Site");
      var setupdata = {};
      setupdata.data = {};
      setupdata.currentState = oSite;
      setupdata.data.leftMenu = {};
      setupdata.data.leftMenu.selectors = {};
      setupdata.data.leftMenu.selectors.site = {
        data_selected: [oSite],
        hidden: false,
        not_selected: false,
      };

      GLOBAL.APP.MAIN_VIEW.createNewModuleContainer({
        objectType: "app",
        moduleName: me.applicationsToOpen["PilotMonitor"],
        setupData: setupdata,
      });
    };

    var menuitems = {
      Visible: [
        {
          text: "Show Pilots",
          handler: showPilothandler,
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
      columnLines: true,
      width: 600,
      height: 300,
      oColumns: oColumns,
      region: "center",
      contextMenu: me.contextGridMenu,
      pagingToolbar: pagingToolbar,
      stateful: true,
      stateId: "PilotSummary-Grid",
      scope: me,
      plugins: [
        {
          ptype: "diracrowexpander",
          checkField: {
            CE: "Multiple",
          },
          rowBodyTpl: ['<div id="expanded-Grid-{[values.Site.split(".").join("_")]}"> </div>'],
        },
      ],
    });

    me.leftPanel.setGrid(me.grid);
    me.grid.view.on("expandbody", function (rowNode, record, expandbody) {
      var targetId = "expanded-Grid-" + record.get("Site").split(".").join("_");
      if (Ext.getCmp(targetId + "_grid") != null) {
        Ext.destroy(Ext.getCmp(targetId + "_grid"));
      }

      if (Ext.getCmp(targetId + "_grid") == null) {
        var params = {
          expand: Ext.JSON.encode([record.data.Site]),
        };
        var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
          url: GLOBAL.BASE_URL + "PilotSummary/getPilotSummaryData",
        });
        oProxy.extraParams = params;
        var expandStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
          proxy: oProxy,
          fields: me.dataFields,
          scope: me,
          autoLoad: true,
          dontLoadOnCreation: true,
        });
        expandStore.on("load", function () {
          me.grid.expandedGridPanel.setLoading(false);
        });
        me.grid.expandedGridPanel = Ext.create("Ext.grid.Panel", {
          forceFit: true,
          renderTo: targetId,
          isExpanded: false,
          id: targetId + "_grid",
          store: expandStore,
          viewConfig: {
            stripeRows: true,
            enableTextSelection: true,
          },
          columns: [
            {
              header: "Site",
              sortable: false,
              dataIndex: "Site",
              align: "left",
              hideable: false,
              fixed: true,
            },
            {
              header: "CE",
              sortable: false,
              dataIndex: "CE",
              align: "left",
              hideable: false,
              fixed: true,
            },
            {
              header: "Status",
              width: 60,
              sortable: false,
              dataIndex: "Status",
              align: "left",
            },
            {
              header: "PilotJobEff (%)",
              sortable: false,
              dataIndex: "PilotJobEff",
              align: "left",
            },
            {
              header: "PilotsPerJob",
              sortable: false,
              dataIndex: "PilotsPerJob",
              align: "left",
            },
            {
              header: "Submitted",
              sortable: false,
              dataIndex: "Submitted",
              align: "left",
              hidden: true,
            },
            {
              header: "Ready",
              sortable: false,
              dataIndex: "Ready",
              align: "left",
              hidden: true,
            },
            {
              header: "Waiting",
              sortable: false,
              dataIndex: "Waiting",
              align: "left",
            },
            {
              header: "Scheduled",
              sortable: false,
              dataIndex: "Scheduled",
              align: "left",
            },
            {
              header: "Running",
              sortable: false,
              dataIndex: "Running",
              align: "left",
            },
            {
              header: "Done",
              sortable: false,
              dataIndex: "Done",
              align: "left",
            },
            {
              header: "Failed",
              sortable: false,
              dataIndex: "Failed",
              align: "left",
            },
            {
              header: "Aborted",
              sortable: false,
              dataIndex: "Aborted",
              align: "left",
            },
            {
              header: "Aborted_Hour",
              sortable: false,
              dataIndex: "Aborted_Hour",
              align: "left",
            },
            {
              header: "Done_Empty",
              sortable: false,
              dataIndex: "Done_Empty",
              align: "left",
              hidden: true,
            },
            {
              header: "Total",
              sortable: false,
              dataIndex: "Total",
              align: "left",
              hidden: true,
            },
          ],
        });

        rowNode.grid = me.grid.expandedGridPanel;
        me.grid.expandedGridPanel.setLoading("Loading data ...");
        me.grid.expandedGridPanel.getStore().load();
        me.grid.expandedGridPanel.getEl().swallowEvent(["mouseover", "mousedown", "click", "dblclick", "onRowFocus"]);
        me.grid.expandedGridPanel.fireEvent("bind", me.grid.expandedGridPanel, {
          id: record.get("Site"),
        });
      }
    });

    me.add([me.leftPanel, me.grid]);
  },
});
