Ext.define("DIRAC.JobMonitor.classes.JobMonitor", {
  extend: "Ext.dirac.core.Module",

  requires: [
    "Ext.util.*",
    "Ext.panel.Panel",
    "Ext.form.field.Text",
    "Ext.button.Button",
    "Ext.menu.CheckItem",
    "Ext.menu.Menu",
    "Ext.form.field.ComboBox",
    "Ext.layout.*",
    "Ext.toolbar.Paging",
    "Ext.grid.Panel",
    "Ext.form.field.Date",
    "Ext.form.field.TextArea",
    "Ext.dirac.utils.DiracGridPanel",
    "Ext.dirac.utils.DiracIdListButton",
    "Ext.dirac.utils.DiracPageSizeCombo",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracApplicationContextMenu",
    "Ext.dirac.utils.DiracBaseSelector",
    "Ext.dirac.utils.DiracAjaxProxy",
    "Ext.data.ArrayStore",
    "Ext.dirac.utils.DiracJsonStore",
    "Ext.dirac.utils.DiracArrayStore",
    "Ext.chart.PolarChart",
  ],

  loadState: function (data) {
    var me = this;

    me.grid.loadState(data);

    me.leftPanel.loadState(data);

    if (data.leftPanelCollapsed) {
      me.leftPanel.collapse();
    }

    if ("centralGridPanelVisible" in data) {
      if (!data.centralGridPanelVisible) {
        me.centralWorkPanel.getLayout().setActiveItem(1);
      }
    }

    if ("statisticsSelectionPanelCollapsed" in data) {
      if (data.statisticsSelectionPanelCollapsed) {
        me.statisticsSelectionGrid.collapse();
      }
    }

    if ("statisticsSelectionValues" in data) {
      me.statisticsGridComboMain.suspendEvents(false);
      me.statisticsGridCombo.suspendEvents(false);
      me.statisticsGridComboMain.setValue(data.statisticsSelectionValues[0]);
      me.statisticsGridCombo.setValue(data.statisticsSelectionValues[1]);
      me.statisticsGridComboMain.resumeEvents();
      me.statisticsGridCombo.resumeEvents();
    }
  },

  getStateData: function () {
    var me = this;

    // data for grid columns
    var oReturn = {
      leftMenu: me.leftPanel.getStateData(),
      grid: me.grid.getStateData(),
      // show/hide for selectors and their selected data (including NOT
      // button)
    };

    oReturn.leftPanelCollapsed = me.leftPanel.collapsed;
    oReturn.centralGridPanelVisible = !me.grid.hidden;
    oReturn.statisticsSelectionPanelCollapsed = me.statisticsSelectionGrid.collapsed;
    oReturn.statisticsSelectionValues = [me.statisticsGridComboMain.getValue(), me.statisticsGridCombo.getValue()];

    return oReturn;
  },
  dataFields: [
    {
      name: "JobID",
      type: "int",
    },
    {
      name: "LastSignOfLife",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "VerifiedFlag",
    },
    {
      name: "Status",
    },
    {
      name: "StartExecTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "RescheduleCounter",
      type: "int",
    },
    {
      name: "MinorStatus",
    },
    {
      name: "ApplicationStatus",
    },
    {
      name: "SubmissionTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "JobType",
    },
    {
      name: "RescheduleTime",
    },
    {
      name: "FailedFlag",
    },
    {
      name: "CPUTime",
    },
    {
      name: "JobGroup",
    },
    {
      name: "JobName",
    },
    {
      name: "LastUpdateTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "Site",
    },
    {
      name: "HeartBeatTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "VO",
    },
    {
      name: "OwnerGroup",
    },
    {
      name: "UserPriority",
    },
    {
      name: "Owner",
    },
    {
      name: "JobType",
    },
    {
      name: "JobIDcheckBox",
      mapping: "JobID",
    },
    {
      name: "StatusIcon",
      mapping: "Status",
    },
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Job Monitor";

    me.launcher.maximized = false;

    var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

    me.launcher.width = oDimensions[0];
    me.launcher.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar ? GLOBAL.APP.MAIN_VIEW.taskbar.getHeight() : 0;

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

    me.statisticsPanel = new Ext.create("Ext.panel.Panel", {
      header: false,
      region: "center",
      floatable: false,
      // autoScroll : true,
      hidden: true,
      collapsible: false,
      layout: "border",
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    var selectors = {
      site: "Site",
      status: "Status",
      minorStatus: "Minor Status",
      appStatus: "Application Status",
      owner: "Owner",
      OwnerGroup: "OwnerGroup",
      VO: "VO",
      jobGroup: "Job Group",
      jobType: "Job Type",
    };

    var textFields = {
      JobID: {
        name: "JobID(s)",
        type: "number",
      },
      PilotJobReference: {
        name: "Pilot Job Reference(s)",
        type: "originalText",
      },
    };

    var properties = [["NormalUser", "JobSharing", "owner"]];
    var map = [
      ["app", "appStatus"],
      ["minorstat", "minorStatus"],
      ["owner", "owner"],
      ["prod", "jobGroup"],
      ["site", "site"],
      ["status", "status"],
      ["types", "jobType"],
      ["OwnerGroup", "OwnerGroup"],
      ["VO", "VO"],
    ];

    me.leftPanel = Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      textFields: textFields,
      datamap: map,
      url: "JobMonitor/getSelectionData",
      properties: properties,
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */

    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + me.applicationName + "/getJobData",
    });

    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      autoLoad: false,
      proxy: oProxy,
      fields: me.dataFields,
      scope: me,
      remoteSort: false,
      autoLoad: true,
      sorters: [
        {
          property: "JobID",
          direction: "DESC",
        },
      ],
    });

    var pagingToolbar = {};

    var toolButtons = {
      Visible: [
        {
          text: "",
          handler: me.__oprJobAction,
          arguments: ["reschedule", ""],
          properties: {
            tooltip: "Reschedule",
            iconCls: "dirac-icon-reschedule",
          },
        },
        {
          text: "",
          handler: me.__oprJobAction,
          arguments: ["kill", ""],
          properties: {
            tooltip: "Kill",
            iconCls: "dirac-icon-kill",
          },
        },
        {
          text: "",
          handler: me.__oprJobAction,
          arguments: ["delete", ""],
          properties: {
            tooltip: "Delete",
            iconCls: "dirac-icon-delete",
          },
        },
        {
          text: "",
          handler: me.__setActiveItemInTheCentralWorkPanel,
          arguments: [],
          properties: {
            iconCls: "dirac-icon-pie",
            tooltip: "Go to the statistics panel",
          },
        },
      ],
      Protected: [
        {
          text: "",
          handler: me.__oprJobAction,
          arguments: ["reset", ""],
          properties: {
            tooltip: "Reset",
            iconCls: "jm-red-reset-icon",
          },
          property: "JobAdministrator",
        },
      ],
    };

    pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      toolButtons: toolButtons,
      property: "JobAdministrator",
      store: me.dataStore,
      scope: me,
    });

    var oColumns = {
      checkBox: {
        dataIndex: "JobIDcheckBox",
      },
      JobId: {
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
      },
      MinorStatus: {
        dataIndex: "MinorStatus",
        properties: {
          flex: 1,
        },
      },
      ApplicationStatus: {
        dataIndex: "ApplicationStatus",
      },
      Site: {
        dataIndex: "Site",
      },
      VO: {
        dataIndex: "VO",
      },
      JobName: {
        dataIndex: "JobName",
        properties: {
          flex: 1,
          width: 200,
        },
      },
      "LastUpdate[UTC]": {
        dataIndex: "LastUpdateTime",
        renderer: Ext.util.Format.dateRenderer("Y-m-d H:i:s"),
        properties: {
          width: 150,
        },
      },
      "LastSignOfLife[UTC]": {
        dataIndex: "LastSignOfLife",
        renderer: Ext.util.Format.dateRenderer("Y-m-d H:i:s"),
        properties: {
          width: 150,
        },
      },
      "SubmissionTime[UTC]": {
        dataIndex: "SubmissionTime",
        renderer: Ext.util.Format.dateRenderer("Y-m-d H:i:s"),
        properties: {
          width: 150,
        },
      },
      FailedFlag: {
        dataIndex: "FailedFlag",
        properties: {
          hidden: true,
        },
      },
      RescheduleCounter: {
        dataIndex: "RescheduleCounter",
        properties: {
          hidden: true,
        },
      },
      CPUTime: {
        dataIndex: "CPUTime",
        properties: {
          hidden: true,
        },
      },
      OwnerDN: {
        dataIndex: "OwnerDN",
        properties: {
          hidden: true,
        },
      },
      JobGroup: {
        dataIndex: "JobGroup",
        properties: {
          hidden: true,
        },
      },
      JobType: {
        dataIndex: "JobType",
        properties: {
          hidden: true,
        },
      },
      Owner: {
        dataIndex: "Owner",
      },
      OwnerGroup: {
        dataIndex: "OwnerGroup",
      },
    };

    var actionSubmenu = {
      Visible: [
        {
          text: "Kill",
          handler: me.__oprJobAction,
          arguments: ["kill", true],
          properties: {
            tooltip: "Click to kill the selected job",
            iconCls: "dirac-icon-kill",
          },
        },
        {
          text: "Delete",
          handler: me.__oprJobAction,
          arguments: ["delete", true],
          properties: {
            tooltip: "Click to delete the selected job",
            iconCls: "dirac-icon-delete",
          },
        },
      ],
    };
    var pilotSubmenu = {
      Visible: [
        {
          text: "Get StdOut",
          handler: me.__oprGetJobData,
          arguments: ["getPilotStdOut"],
          properties: {
            tooltip: "Click to get pilot standard output",
            iconCls: "dirac-icon-download",
          },
        },
        {
          text: "Get StdErr",
          handler: me.__oprGetJobData,
          arguments: ["getPilotStdErr"],
          properties: {
            tooltip: "Click to get pilot standard error",
            iconCls: "dirac-icon-download",
          },
        },
        {
          text: "LoggingInfo",
          handler: me.__oprGetJobData,
          arguments: ["getPilotLoggingInfo"],
          properties: {
            tooltip: "Click to get pilot logging information",
            iconCls: "dirac-icon-download",
          },
        },
      ],
    };

    var sandboxSubmenu = {
      Visible: [
        {
          text: "Get input file(s)",
          handler: me.__getSandbox,
          arguments: ["Input"],
          properties: {
            tooltip: "Click to get the job input sandbox",
            iconCls: "dirac-icon-download",
          },
        },
        {
          text: "Get output file(s)",
          handler: me.__getSandbox,
          arguments: ["Output"],
          properties: {
            tooltip: "Click to get the job output sandbox",
            iconCls: "dirac-icon-download",
          },
        },
      ],
    };

    var menuitems = {
      Visible: [
        {
          text: "JDL",
          handler: me.__oprGetJobData,
          arguments: ["getJDL"],
          properties: {
            tooltip: "Click to show the JDL of the selected job.",
          },
        },
        {
          text: "-",
        }, // separator
        {
          text: "Attributes",
          handler: me.__oprGetJobData,
          arguments: ["getBasicInfo"],
          properties: {
            tooltip: "Click to show the attributtes of the selected job.",
          },
        },
        {
          text: "Parameters",
          handler: me.__oprGetJobData,
          arguments: ["getParams"],
          properties: {
            tooltip: "Click to show the Parameters of the selected job.",
          },
        },
        {
          text: "Logging info",
          handler: me.__oprGetJobData,
          arguments: ["getLoggingInfo"],
          properties: {
            tooltip: "Click to show the log of the selected job.",
          },
        },
        {
          text: "-",
        }, // separator
        {
          text: "Peek StandardOutput",
          handler: me.__oprGetJobData,
          arguments: ["getStandardOutput"],
          properties: {
            tooltip: "Click to retrive the stdout of the selected job.",
          },
        },
        {
          text: "Get LogFile",
          handler: me.__oprGetJobData,
          arguments: ["getLogURL"],
          properties: {
            tooltip: "Click to download the log file of the jobs.",
            iconCls: "dirac-icon-download",
          },
        },
        {
          text: "Get Pending Request",
          handler: me.__oprGetJobData,
          arguments: ["getPending"],
          properties: {
            tooltip: "Click to view the pendig request of the selected job",
          },
        },
        {
          text: "Get StagerReport",
          handler: me.__oprGetJobData,
          arguments: ["getStagerReport"],
          properties: {
            tooltip: "Click to show the stager log.",
          },
        },
        {
          text: "-",
        }, // separator
        {
          text: "Actions",
          subMenu: actionSubmenu,
          properties: {
            iconCls: "dirac-icon-action",
          },
        },
        {
          text: "Pilot",
          subMenu: pilotSubmenu,
          properties: {
            iconCls: "dirac-icon-action",
          },
        },
        {
          text: "SandBox",
          subMenu: sandboxSubmenu,
          properties: {
            iconCls: "jm-icon-sandbox",
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
      //features: [{ftype:'grouping'}],
      oColumns: oColumns,
      contextMenu: me.contextGridMenu,
      pagingToolbar: pagingToolbar,
      scope: me,
    });

    me.leftPanel.setGrid(me.grid);

    /* Definition of the statistics panel */

    me.statisticsGridComboMain = new Ext.form.field.ComboBox({
      allowBlank: false,
      displayField: "set",
      editable: false,
      mode: "local",
      store: new Ext.data.ArrayStore({
        fields: ["set"],
        data: [["Selected Statistics"], ["Global Statistics"]],
      }),
      triggerAction: "all",
      value: "Selected Statistics",
      flex: 1,
      listeners: {
        change: function (combo, newValue, oldValue, eOpts) {
          var me = combo.moduleObject;
          me.leftPanel.oprLoadGridData();
        },
      },
      moduleObject: me,
    });

    me.statisticsGridCombo = new Ext.form.field.ComboBox({
      allowBlank: false,
      displayField: "category",
      editable: false,
      mode: "local",
      store: new Ext.data.ArrayStore({
        fields: ["category"],
        data: [["Status"], ["Site"], ["Minor Status"], ["Application Status"], ["Owner"], ["Owner Group"], ["VO"], ["Job Group"], ["Job Type"]],
      }),
      triggerAction: "all",
      value: "Status",
      flex: 1,
      listeners: {
        change: function (combo, newValue, oldValue, eOpts) {
          var me = combo.moduleObject;
          me.leftPanel.oprLoadGridData();
        },
      },
      moduleObject: me,
    });

    var oButtonGoToGrid = new Ext.Button({
      margin: 0,
      iconCls: "jm-grid-icon",
      handler: function () {
        me.centralWorkPanel.getLayout().setActiveItem(0);
      },
      scope: me,
    });

    me.btnShowPlotAsPng = new Ext.Button({
      margin: 0,
      iconCls: "dirac-icon-save",
      handler: function () {
        var plot = me.statisticsPlotPanel.down("polar");
        if (plot) {
          var imgData = plot.getImage();

          var iHeight = me.statisticsPlotPanel.getHeight();

          var iWidth = me.statisticsPlotPanel.getWidth();

          var element = document.createElement("canvas");

          element.setAttribute("width", iWidth);
          element.setAttribute("height", iHeight);

          var oContext = element.getContext("2d");

          oContext.beginPath();
          oContext.rect(0, 0, iWidth, iHeight);
          oContext.fillStyle = "#FFFFFF";
          oContext.fill();

          var oImage = new Image();
          oImage.src = imgData.data;

          oImage.onload = function () {
            console.log([oImage.clientWidth, oImage.clientHeight]);

            oContext.drawImage(oImage, 0, 0, iWidth, iHeight);

            var link = document.createElement("a");
            link.download = "jobStatistics.png";
            link.href = element.toDataURL("image/png").replace("image/png", "image/octet-stream");
            link.click();
          };
        }
      },
      scope: me,
      tooltip: "Save pie chart as PNG image",
    });

    me.btnPlotSettings = new Ext.Button({
      margin: 0,
      iconCls: "dirac-icon-settings",
      handler: function () {
        me.formPlotSettings();
      },
      scope: me,
      tooltip: "Plot settings",
    });

    /*-----------AUTO REFRESH---------------*/
    var oTask = {
      run: function () {
        me.leftPanel.oprLoadGridData();
      },
      interval: 0,
    };

    var oHeartbeat = new Ext.util.TaskRunner();

    var oAutoMenu = [
      {
        handler: function () {
          this.setChecked(true);
          oHeartbeat.start(
            Ext.apply(oTask, {
              interval: 900000,
            })
          );
        },
        group: "refresh",
        text: "15 Minutes",
      },
      {
        handler: function () {
          this.setChecked(true);
          oHeartbeat.start(
            Ext.apply(oTask, {
              interval: 1800000,
            })
          );
        },
        group: "refresh",
        text: "30 Minutes",
      },
      {
        handler: function () {
          this.setChecked(true);
          oHeartbeat.start(
            Ext.apply(oTask, {
              interval: 3600000,
            })
          );
        },
        group: "refresh",
        text: "One Hour",
      },
      {
        checked: true,
        handler: function () {
          this.setChecked(true);
          oHeartbeat.stopAll();
        },
        group: "refresh",
        text: "Disabled",
      },
    ];

    for (var i = 0; i < oAutoMenu.length; i++) {
      oAutoMenu[i] = new Ext.menu.CheckItem(oAutoMenu[i]);
    }

    var btnAutorefresh = new Ext.Button({
      menu: oAutoMenu,
      text: "Auto Refresh: Disabled",
      tooltip: "Click to set the time for autorefresh",
    });

    btnAutorefresh.on("menuhide", function (button, menu) {
      var length = menu.items.getCount();
      for (var i = 0; i < length; i++) {
        if (menu.items.items[i].checked) {
          button.setText("Auto Refresh: " + menu.items.items[i].text);
        }
      }
    });
    var oColumns = {
      None: {
        dataIndex: "key",
        properties: {
          width: 46,
          sortable: false,
          hideable: false,
          fixed: true,
          menuDisabled: true,
        },
        renderFunction: "renderStatusForGivenColor",
      },
      Key: {
        dataIndex: "key",
        properties: {
          hideable: false,
          width: 150,
        },
      },
      Value: {
        dataIndex: "value",
        properties: {
          flex: 1,
        },
        renderFunction: "diffValues",
      },
    };

    var dataStore = Ext.create("Ext.dirac.utils.DiracArrayStore", {
      fields: ["key", "value", "code", "color"],
      oDiffFields: {
        Id: "key",
        Fields: ["value"],
      },
      scope: me,
    });

    /*---------------------------------------------------*/
    me.statisticsSelectionGrid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      region: "west",
      store: dataStore,
      width: 300,
      header: false,
      border: 0,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      dockedItems: [
        new Ext.create("Ext.toolbar.Toolbar", {
          dock: "top",
          items: [oButtonGoToGrid, me.btnShowPlotAsPng, me.btnPlotSettings, "-", btnAutorefresh],
        }),
        new Ext.create("Ext.toolbar.Toolbar", {
          dock: "top",
          items: [me.statisticsGridComboMain],
        }),
        new Ext.create("Ext.toolbar.Toolbar", {
          dock: "top",
          items: [me.statisticsGridCombo],
        }),
      ],
      oColumns: oColumns,
      scope: me,
    });

    me.plotSettings = {};

    me.plotSettings.plotTitle = {
      type: "text",
      text: "No data",
      font: "16px Helvetica",
      width: 100,
      height: 30,
      x: 40, // the sprite x position
      y: 22,
      // the sprite y position
    };
    me.plotSettings.plotLegend = {
      field: "key",
      type: "dom",
      position: "right",
      boxStrokeWidth: 2,
      labelFont: "12px Helvetica",
      padding: 5,
    };
    me.statisticsPlotPanel = new Ext.create("Ext.panel.Panel", {
      autoScroll: true,
      region: "center",
      floatable: false,
      layout: "fit",
      header: false,
    });

    me.statisticsPlotPanel.onResize = function (width, height, oldWidth, oldHeight) {
      me.createPlotFromGridData(me.statisticsGridComboMain.getValue() + " :: " + me.statisticsGridCombo.getValue());
    };

    me.statisticsPanel.add([me.statisticsSelectionGrid, me.statisticsPlotPanel]);

    /* END - Definition of the statistics panel */

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE MAIN CONTAINER
     * -----------------------------------------------------------------------------------------------------------
     */

    me.centralWorkPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      layout: "card",
      region: "center",
      header: false,
      border: false,
      items: [me.grid, me.statisticsPanel],
    });

    me.add([me.leftPanel, me.centralWorkPanel]);
  },
  __setActiveItemInTheCentralWorkPanel: function () {
    var me = this;
    me.centralWorkPanel.getLayout().setActiveItem(1);
  },

  formPlotSettings: function () {
    var me = this;

    if (!"plotSettings" in me) me.plotSettings = {};

    me.plotSettings.txtPlotTitle = Ext.create("Ext.form.field.Text", {
      fieldLabel: "Title",
      labelAlign: "left",
      allowBlank: false,
      margin: 10,
      anchor: "100%",
      value: me.plotSettings.plotTitle.text,
    });

    me.plotSettings.cmbLegendPosition = new Ext.create("Ext.form.field.ComboBox", {
      labelAlign: "left",
      fieldLabel: "Legend position",
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: [
          ["right", "right"],
          ["left", "left"],
          ["top", "top"],
          ["bottom", "bottom"],
          ["none", "none"],
        ],
      }),
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      margin: 10,
      value: me.plotSettings.plotLegend.legend,
    });

    // button for saving the state
    me.plotSettings.btnApplySettings = new Ext.Button({
      text: "Submit",
      margin: 3,
      iconCls: "dirac-icon-submit",
      handler: function () {
        var me = this;
        me.createPlotFromGridData(me.plotSettings.txtPlotTitle.getValue(), me.plotSettings.cmbLegendPosition.getValue());
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      border: false,
    });

    oToolbar.add([me.plotSettings.btnApplySettings]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      autoHeight: true,
      border: false,
      layout: "anchor",
      items: [oToolbar, me.plotSettings.txtPlotTitle, me.plotSettings.cmbLegendPosition, me.txtElementConfig],
    });

    // initializing window showing the saving form
    Ext.create("widget.window", {
      height: 300,
      width: 500,
      title: "Plot Settings",
      layout: "fit",
      modal: true,
      items: oPanel,
    }).show();
  },

  funcOnChangeEitherCombo: function () {
    var me = this;

    var sSet = me.statisticsGridComboMain.getValue();
    var sCategory = me.statisticsGridCombo.getValue();

    me.statisticsGridComboMain.setDisabled(true);
    me.statisticsGridCombo.setDisabled(true);

    if (sSet == "Selected Statistics") {
      var oData = me.leftPanel.getSelectionData();
      oData.statsField = sCategory;

      me.statisticsSelectionGrid.body.mask("Wait ...");

      Ext.Ajax.request({
        url: GLOBAL.BASE_URL + me.applicationName + "/getStatisticsData",
        params: oData,
        scope: me,
        success: function (response) {
          var response = Ext.JSON.decode(response.responseText);

          if (response["success"] == "true") {
            me.statisticsPlotPanel.removeAll();
            me.statisticsSelectionGrid.store.removeAll();
            me.statisticsSelectionGrid.store.add(response["result"]);

            me.createPlotFromGridData(sSet + " :: " + sCategory);
          } else {
            GLOBAL.APP.CF.alert(response["error"], "error");
          }

          me.statisticsSelectionGrid.body.unmask();
          me.statisticsGridComboMain.setDisabled(false);
          me.statisticsGridCombo.setDisabled(false);
        },
        failure: function (response) {
          me.statisticsGridComboMain.setDisabled(false);
          me.statisticsGridCombo.setDisabled(false);
          me.statisticsSelectionGrid.body.unmask();
          GLOBAL.APP.CF.showAjaxErrorMessage(response);
        },
      });
    } else {
      me.statisticsSelectionGrid.body.mask("Wait ...");

      Ext.Ajax.request({
        url: GLOBAL.BASE_URL + me.applicationName + "/getStatisticsData",
        params: {
          statsField: sCategory,
          globalStat: true,
        },
        scope: me,
        success: function (response) {
          var response = Ext.JSON.decode(response.responseText);

          if (response["success"] == "true") {
            me.statisticsPlotPanel.removeAll();
            me.statisticsSelectionGrid.store.removeAll();
            me.statisticsSelectionGrid.store.add(response["result"]);

            me.createPlotFromGridData(sSet + " :: " + sCategory);
          } else {
            GLOBAL.APP.CF.alert(response["error"], "error");
          }
          me.statisticsSelectionGrid.body.unmask();
          me.statisticsGridComboMain.setDisabled(false);
          me.statisticsGridCombo.setDisabled(false);
        },
        failure: function (response) {
          me.statisticsSelectionGrid.body.unmask();
          me.statisticsGridComboMain.setDisabled(false);
          me.statisticsGridCombo.setDisabled(false);
          GLOBAL.APP.CF.showAjaxErrorMessage(response);
        },
      });
    }
  },

  createPlotFromGridData: function (sTitle, sLegendPosition) {
    var me = this;
    me.statisticsPlotPanel.removeAll();
    if (!sLegendPosition) {
      if ("plotSettings" in me && "plotLegend" in me.plotSettings) {
        sLegendPosition = me.plotSettings.plotLegend.legend;
      } else {
        sLegendPosition = "right";
      }
    }

    var oNow = new Date();

    me.plotSettings.plotTitle.text = sTitle + " (" + oNow.toString() + ")";
    me.plotSettings.plotLegend.docked = sLegendPosition;
    var colors = [];
    for (var i = 0; i < me.statisticsSelectionGrid.getStore().getCount(); i++) {
      colors.push(me.statisticsSelectionGrid.getStore().getAt(i).data.color);
    }
    me.statisticsSelectionGrid.plot = Ext.create("Ext.chart.PolarChart", {
      width: 400,
      height: 400,
      padding: "10 0 0 0",
      theme: "Base:gradients",
      layout: "center",
      animate: true,
      shadow: false,
      insetPadding: 80,
      background: {
        type: "image",
        src: GLOBAL.ROOT_URL + "static/core/img/wallpapers/dirac_jobmonitor_background.png",
      },
      interactions: ["rotate", "itemhighlight"],
      store: me.statisticsSelectionGrid.getStore(),
      legend: me.plotSettings.plotLegend,
      sprites: [me.plotSettings.plotTitle],
      series: {
        type: "pie",
        highlight: true,
        angleField: "value",
        label: {
          field: "key",
          display: "outside",
          orientation: "vertical",
        },
        showInLegend: true,
        tooltip: {
          trackMouse: true,
          width: 140,
          height: 28,
          renderer: function (toolTip, record, ctx) {
            toolTip.setHtml(record.get("key") + ": " + record.get("value"));
          },
        },
      },
    });

    me.statisticsSelectionGrid.on("sortchange", function (ct, column, direction, eOpts) {
      var colors = [];
      var me = this;
      for (var i = 0; i < me.getStore().getCount(); i++) {
        colors.push(me.getStore().getAt(i).data.color);
      }
      me.plot.setColors(colors);
    });
    me.statisticsSelectionGrid.plot.setColors(colors);
    me.statisticsPlotPanel.add(me.statisticsSelectionGrid.plot);
  },
  __oprJobAction: function (oAction, useSelectedJobId) {
    var me = this;
    var oItems = [];
    var oId = null;
    if (useSelectedJobId) {
      var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID");
    }

    if (oId == null || oId == "" || oId == undefined) {
      var oElems = Ext.query("#" + me.id + " input.checkrow");

      for (var i = 0; i < oElems.length; i++) if (oElems[i].checked) oItems.push(oElems[i].value);

      if (oItems.length < 1) {
        GLOBAL.APP.CF.alert("No jobs were selected", "error");
        return;
      }
    } else {
      oItems[0] = oId;
    }

    var c = false;

    if (oItems.length == 1) c = confirm("Are you sure you want to " + oAction + " " + oItems[0] + "?");
    else c = confirm("Are you sure you want to " + oAction + " these jobs?");

    if (c === false) return;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/jobAction",
      method: "POST",
      params: {
        action: oAction,
        JobID: oItems.join(","),
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);
        if (jsonData["success"] == "false") {
          GLOBAL.APP.CF.alert("Error: " + jsonData["error"], "error");
          return;
        } else {
          if (jsonData.showResult) {
            var html = "";
            for (var i = 0; i < jsonData.showResult.length; i++) {
              html = html + jsonData.showResult[i] + "<br>";
            }
            Ext.Msg.alert("Result:", html);
          }

          me.leftPanel.oprLoadGridData();
        }
      },
    });
  },
  __oprGetJobData: function (oDataKind) {
    var me = this;

    var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID");

    me.getContainer().body.mask("Wait ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/jobData",
      method: "POST",
      params: {
        data_kind: oDataKind,
        id: oId,
      },
      scope: me,
      success: function (response) {
        me.getContainer().body.unmask();
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          if (oDataKind == "getJDL") {
            // text
            me.getContainer().oprPrepareAndShowWindowText(jsonData["result"], "JDL for JobID:" + oId);
          } else if (oDataKind == "getBasicInfo") {
            // grid
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Attributes for JobID:" + oId,
              ["name", "value"],
              [
                {
                  text: "Name",
                  flex: 1,
                  sortable: true,
                  dataIndex: "name",
                },
                {
                  text: "Value",
                  flex: 1,
                  sortable: true,
                  dataIndex: "value",
                },
              ]
            );
          } else if (oDataKind == "getParams") {
            // grid
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Parameters for JobID:" + oId,
              ["name", "value"],
              [
                {
                  text: "Name",
                  flex: 1,
                  sortable: true,
                  dataIndex: "name",
                },
                {
                  text: "Value",
                  flex: 1,
                  sortable: true,
                  dataIndex: "value",
                },
              ]
            );
          } else if (oDataKind == "getLoggingInfo") {
            // grid
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Attributes for JobID:" + oId,
              ["status", "minor_status", "app_status", "date_time", "source"],
              [
                {
                  text: "Source",
                  flex: 1,
                  sortable: true,
                  dataIndex: "source",
                },
                {
                  text: "Status",
                  flex: 1,
                  sortable: true,
                  dataIndex: "status",
                },
                {
                  text: "Minor Status",
                  flex: 1,
                  sortable: true,
                  dataIndex: "minor_status",
                },
                {
                  text: "Application Status",
                  flex: 1,
                  sortable: true,
                  dataIndex: "app_status",
                },
                {
                  text: "Date Time",
                  flex: 1,
                  sortable: true,
                  dataIndex: "date_time",
                },
              ]
            );
          } else if (oDataKind == "getStandardOutput") {
            // text
            me.getContainer().oprPrepareAndShowWindowText(jsonData["result"], "Standard output for JobID:" + oId);
          } else if (oDataKind == "getLogURL") {
            me.getContainer().oprShowInNewTab(jsonData["result"], "Log file for JobId:" + oId);
            // me.getContainer().oprPrepareAndShowWindowHTML(jsonData["result"],
            // 'Log file for JobId:' + oId);
          } else if (oDataKind == "getPending") {
            var data = [];
            if ("PendingRequest" in jsonData["result"]) {
              var rows = jsonData["result"]["PendingRequest"].split("\n");
              for (var i = 0; i < rows.length; i++) {
                var row = rows[i].split(":");
                if (i == 0) {
                  data.push(row);
                } else {
                  data.push(row);
                }
              }
            } else {
              GLOBAL.APP.CF.alert("Error: No pending request(s) found");
            }

            me.getContainer().oprPrepareAndShowWindowGrid(
              data,
              "Production:" + oId,
              ["type", "operation", "status", "order", "targetSE", "file"],
              [
                {
                  text: "Type",
                  flex: 1,
                  sortable: true,
                  dataIndex: "type",
                },
                {
                  text: "Operation",
                  flex: 1,
                  sortable: true,
                  dataIndex: "operation",
                },
                {
                  text: "Status",
                  flex: 1,
                  sortable: true,
                  dataIndex: "status",
                },
                {
                  text: "Order",
                  flex: 1,
                  sortable: true,
                  dataIndex: "order",
                },
                {
                  text: "Target Se",
                  flex: 1,
                  sortable: true,
                  dataIndex: "targetSE",
                },
                {
                  text: "File",
                  flex: 1,
                  sortable: true,
                  dataIndex: "file",
                },
              ]
            );
          } else if (oDataKind == "getStagerReport") {
            me.getContainer().oprPrepareAndShowWindowText(jsonData["result"], "Stager report for JobId:" + oId);
          } else if (oDataKind == "getPilotStdOut") {
            me.getContainer().oprPrepareAndShowWindowText(jsonData["result"], "Pilot StdOut for JobID:" + oId);
          } else if (oDataKind == "getPilotStdErr") {
            me.getContainer().oprPrepareAndShowWindowText(jsonData["result"], "Pilot StdErr for JobID:" + oId);
          }
        } else {
          GLOBAL.APP.CF.alert(jsonData["error"], "error");
        }
      },
    });
  },
  __getSandbox: function (sType) {
    var me = this;
    var sId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/getSandbox",
      params: {
        jobID: sId,
        sandbox: sType,
        check: 1,
      },
      scope: me,
      success: function (response) {
        var me = this;
        var response = Ext.JSON.decode(response.responseText);

        if (response["success"] == "true") {
          var sUrl = GLOBAL.BASE_URL + me.applicationName + "/getSandbox?jobID=" + sId + "&sandbox=" + sType;
          window.open(sUrl, "Input Sandbox file", "width=400,height=200");
        } else {
          GLOBAL.APP.CF.alert(response["error"], "error");
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
    });
  },
});
