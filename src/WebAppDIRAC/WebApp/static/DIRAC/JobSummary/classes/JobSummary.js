Ext.define("DIRAC.JobSummary.classes.JobSummary", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.dirac.utils.DiracBaseSelector",
    "Ext.dirac.utils.DiracJsonStore",
    "Ext.dirac.utils.DiracAjaxProxy",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracApplicationContextMenu",
    "Ext.dirac.utils.DiracGridPanel",
  ],

  applicationsToOpen: {
    JobMonitor: "DIRAC.JobMonitor.classes.JobMonitor",
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
      name: "GridType",
    },
    {
      name: "Site",
    },
    {
      name: "Country",
    },
    {
      name: "MaskStatus",
    },
    {
      name: "Received",
      type: "int",
    },
    {
      name: "Checking",
      type: "int",
    },
    {
      name: "Staging",
      type: "int",
    },
    {
      name: "Waiting",
      type: "int",
    },
    {
      name: "Matched",
      type: "int",
    },
    {
      name: "Running",
      type: "int",
    },
    {
      name: "Stalled",
      type: "int",
    },
    {
      name: "Done",
      type: "int",
    },
    {
      name: "Completed",
      type: "int",
    },
    {
      name: "Failed",
      type: "int",
    },
    {
      name: "Efficiency",
    },
    {
      name: "Status",
    },
    {
      name: "Tier",
    },
    {
      name: "FullCountry",
    },
    {
      name: "MaskStatusIcon",
      mapping: "MaskStatus",
    },
    {
      name: "SiteCheckbox",
      mapping: "Site",
    },
    {
      name: "StatusIcon",
      mapping: "Status",
    },
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Job Summary";
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
      status: "Status",
      gridtype: "GridType",
      maskstatus: "MaskStatus",
      country: "Country",
    };

    var map = [
      ["status", "status"],
      ["gridtype", "gridtype"],
      ["maskstatus", "maskstatus"],
      ["country", "country"],
    ];

    me.leftPanel = new Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      datamap: map,
      hasTimeSearchPanel: false,
      url: "JobSummary/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */
    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + "JobSummary/getData",
    });

    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      groupDir: "DESC",
      groupField: "FullCountry",
      fields: me.dataFields,
      scope: me,
    });

    var toolButtons = {
      Visible: [
        {
          text: "Show jobs",
          handler: me.__showalljobs,
          properties: {
            tooltip: "Show jobs at the selected sites...",
          },
        },
      ],
    };

    var pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      store: me.dataStore,
      toolButtons: toolButtons,
      scope: me,
      value: 100,
    });

    var oColumns = {
      Name: {
        dataIndex: "Site",
        properties: {
          hidable: false,
        },
      },
      Tier: {
        dataIndex: "Tier",
      },
      GridType: {
        dataIndex: "GridType",
      },
      Flag: {
        dataIndex: "Country",
        properties: {
          hideable: true,
          sortable: true,
          align: "left",
          width: 26,
          fixed: true,
        },
        renderer: function flag(code) {
          return '<img src="' + GLOBAL.BASE_URL + "static/core/img/flags/" + code + '.gif">';
        },
      },
      Country: {
        dataIndex: "FullCountry",
        properties: {
          hidden: true,
        },
      },
      None: {
        dataIndex: "MaskStatusIcon",
        properties: {
          width: 26,
          sortable: false,
          hideable: false,
          fixed: true,
          menuDisabled: true,
        },
        renderFunction: "rendererStatus",
      },
      MaskStatus: {
        dataIndex: "MaskStatus",
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
      },
      "Efficiency (%)": {
        dataIndex: "Efficiency",
      },
      Received: {
        dataIndex: "Received",
        properties: {
          hidden: true,
        },
      },
      Checking: {
        dataIndex: "Checking",
        properties: {
          hidden: true,
        },
      },
      Staging: {
        dataIndex: "Staging",
      },
      Waiting: {
        dataIndex: "Waiting",
        properties: {
          hidden: true,
        },
      },
      Matched: {
        dataIndex: "Matched",
        properties: {
          hidden: true,
        },
      },
      Running: {
        dataIndex: "Running",
      },
      Completed: {
        dataIndex: "Completed",
      },
      Done: {
        dataIndex: "Done",
      },
      Stalled: {
        dataIndex: "Stalled",
      },
      Failed: {
        dataIndex: "Failed",
      },
    };

    var showJobshandler = function () {
      var site = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "Site");

      var setupdata = {
        data: {
          leftMenu: {
            selectors: {
              site: {
                data_selected: [site],
                hidden: false,
                not_selected: false,
              },
            },
          },
        },
      };

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
            tooltip: "Click to show the jobs which belong to the selected site.",
          },
        },
      ],
    };
    me.contextGridMenu = new Ext.dirac.utils.DiracApplicationContextMenu({
      menu: menuitems,
      scope: me,
    });

    var sm = Ext.create("Ext.selection.CheckboxModel");
    me.grid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      selModel: sm,
      features: [
        {
          ftype: "grouping",
        },
      ],
      store: me.dataStore,
      columnLines: true,
      width: 600,
      height: 300,
      oColumns: oColumns,
      pagingToolbar: pagingToolbar,
      contextMenu: me.contextGridMenu,
      scope: me,
    });

    me.leftPanel.setGrid(me.grid);

    me.add([me.leftPanel, me.grid]);
  },
  __showalljobs: function () {
    var me = this;
    var values = GLOBAL.APP.CF.getSelectedRecords(me.grid);
    var sites = [];
    for (var i = 0; i < values.length; i++) {
      sites.push(values[i].get("Site"));
    }
    var setupdata = {
      data: {
        leftMenu: {
          selectors: {
            site: {
              data_selected: sites,
              hidden: false,
              not_selected: false,
            },
          },
        },
      },
    };

    GLOBAL.APP.MAIN_VIEW.createNewModuleContainer({
      objectType: "app",
      moduleName: me.applicationsToOpen["JobMonitor"],
      setupData: setupdata,
    });
  },
});
