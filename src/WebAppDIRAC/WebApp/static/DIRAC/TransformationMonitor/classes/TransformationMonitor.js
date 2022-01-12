/*******************************************************************************
 * It is the transformation monitor class.
 */
Ext.define("DIRAC.TransformationMonitor.classes.TransformationMonitor", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.panel.Panel",
    "Ext.panel.Panel",
    "Ext.dirac.utils.DiracBoxSelect",
    "Ext.dirac.utils.GridPanel",
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
  applicationsToOpen: {
    JobMonitor: "DIRAC.JobMonitor.classes.JobMonitor",
  },

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
      name: "TransformationIDcheckBox",
      mapping: "TransformationID",
    },
    {
      name: "TransformationID",
    },
    {
      name: "StatusIcon",
      mapping: "Status",
    },
    {
      name: "Status",
    },
    {
      name: "TransformationName",
    },
    {
      name: "TransformationGroup",
    },
    {
      name: "GroupSize",
    },
    {
      name: "InheritedFrom",
    },
    {
      name: "MaxNumberOfJobs",
    },
    {
      name: "EventsPerJob",
    },
    {
      name: "AuthorDN",
    },
    {
      name: "AuthorGroup",
    },
    {
      name: "Type",
    },
    {
      name: "Plugin",
    },
    {
      name: "AgentType",
    },
    {
      name: "FileMask",
    },
    {
      name: "Description",
    },
    {
      name: "LongDescription",
    },
    {
      name: "CreationDate",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "LastUpdate",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "Files_Total",
    },
    {
      name: "Files_PercentProcessed",
    },
    {
      name: "Files_Unused",
    },
    {
      name: "Files_Assigned",
    },
    {
      name: "Files_Processed",
    },
    {
      name: "Files_Problematic",
    },
    {
      name: "Files_MaxReset",
    },
    {
      name: "Jobs_Created",
    },
    {
      name: "Jobs_TotalCreated",
    },
    {
      name: "Jobs_Submitting",
    },
    {
      name: "Jobs_Waiting",
    },
    {
      name: "Jobs_Running",
    },
    {
      name: "Jobs_Done",
    },
    {
      name: "Jobs_Failed",
    },
    {
      name: "Jobs_Stalled",
    },
    {
      name: "Jobs_Completed",
    },
    {
      name: "TransformationFamily",
      type: "float",
    },
    {
      name: "Jobs_Matched",
    },
    {
      name: "Jobs_Killed",
    },
    {
      name: "Jobs_Staging",
    },
    {
      name: "Jobs_Checking",
    },
    {
      name: "Jobs_Rescheduled",
    },
    {
      name: "Jobs_Scheduled",
    },
  ],

  initComponent: function () {
    var me = this;

    GLOBAL.APP.CF.log("debug", "create the widget(initComponent)...");

    me.launcher.title = "Transformation Monitor";
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
      status: "Status",
      agentType: "Agent Type",
      type: "Type",
      transformationGroup: "Group",
      plugin: "Plugin",
    };

    var textFields = {
      transformationId: {
        name: "ProductionID(s)",
        type: "number",
      },
      requestId: {
        name: "RequestID(s)",
        type: "number",
      },
    };

    var map = [
      ["agentType", "agentType"],
      ["productionType", "type"],
      ["transformationGroup", "transformationGroup"],
      ["plugin", "plugin"],
      ["prodStatus", "status"],
    ];

    me.leftPanel = new Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      textFields: textFields,
      datamap: map,
      url: "TransformationMonitor/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */
    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + me.applicationName + "/getTransformationData",
      timeout: 3600000,
    });

    me.diffValues = {};
    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      autoLoad: true,
      groupDir: "DESC",
      fields: me.dataFields,
      remoteSort: false,
      groupField: "TransformationFamily",
      multiSortLimit: 1,
      oDiffFields: {
        Id: "TransformationID",
        Fields: [
          "Jobs_Created",
          "Jobs_TotalCreated",
          "Jobs_Done",
          "Jobs_Failed",
          "Jobs_Running",
          "Jobs_Stalled",
          "Jobs_Submitting",
          "Jobs_Waiting",
          "Jobs_Completed",
          "Files_PercentProcessed",
          "Files_Total",
          "Files_Unused",
          "Files_Assigned",
          "Files_Processed",
          "Files_Problematic",
          "Files_MaxReset",
          "Jobs_Matched",
          "Jobs_Killed",
          "Jobs_Staging",
          "Jobs_Checking",
          "Jobs_Rescheduled",
          "Jobs_Scheduled",
        ],
      },
      scope: me,
    });
    me.dataStore.sort("TransformationGroup", "DESC");
    var pagingToolbar = null;

    var toolButtons = {
      Protected: [
        {
          text: "Start",
          handler: me.__oprTransformationAction,
          arguments: ["start", ""],
          properties: {
            tooltip: "Click to start the selected transformation(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Stop",
          handler: me.__oprTransformationAction,
          arguments: ["stop", ""],
          properties: {
            tooltip: "Click to stop the selected transformation(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Flush",
          handler: me.__oprTransformationAction,
          arguments: ["flush", ""],
          properties: {
            tooltip: "Click to flush the selected transformation(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Complete",
          handler: me.__oprTransformationAction,
          arguments: ["complete", ""],
          properties: {
            tooltip: "Click to complete the selected transformation(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Clean",
          handler: me.__oprTransformationAction,
          arguments: ["clean", ""],
          properties: {
            tooltip: "Click to clean the selected transformation(s)",
          },
          property: "ProductionManagement",
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
        dataIndex: "TransformationIDcheckBox",
      },
      ID: {
        dataIndex: "TransformationID",
        properties: {
          width: 60,
          align: "left",
          hideable: false,
        },
      },
      Request: {
        dataIndex: "TransformationFamily",
        properties: {
          hidden: true,
        },
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
      AgentType: {
        dataIndex: "AgentType",
        properties: {
          width: 100,
        },
      },
      Type: {
        dataIndex: "Type",
      },
      Group: {
        dataIndex: "TransformationGroup",
        properties: {
          hidden: true,
        },
      },
      Name: {
        dataIndex: "TransformationName",
      },
      Files: {
        dataIndex: "Files_Total",
        renderFunction: "diffValues",
      },
      "Processed (%)": {
        dataIndex: "Files_PercentProcessed",
        renderFunction: "diffValues",
        properties: {
          width: 110,
        },
      },
      "Files Processed": {
        dataIndex: "Files_Processed",
        renderFunction: "diffValues",
        properties: {
          hidden: true,
          width: 120,
        },
      },
      "Files Assigned": {
        dataIndex: "Files_Assigned",
        renderFunction: "diffValues",
        properties: {
          hidden: true,
          width: 120,
        },
      },
      "Files Problematic": {
        dataIndex: "Files_Problematic",
        renderFunction: "diffValues",
        properties: {
          hidden: true,
          width: 120,
        },
      },
      "Files Unused": {
        dataIndex: "Files_Unused",
        renderFunction: "diffValues",
        properties: {
          hidden: true,
          width: 120,
        },
      },
      "Files MaxReset": {
        dataIndex: "Files_MaxReset",
        renderFunction: "diffValues",
        properties: {
          hidden: true,
          width: 120,
        },
      },
      Created: {
        dataIndex: "Jobs_Created",
        renderFunction: "diffValues",
      },
      "Total Created": {
        dataIndex: "Jobs_TotalCreated",
        renderFunction: "diffValues",
      },
      Submitting: {
        dataIndex: "Jobs_Submitting",
        renderFunction: "diffValues",
      },
      Matched: {
        dataIndex: "Jobs_Matched",
        renderFunction: "diffValues",
      },
      Checking: {
        dataIndex: "Jobs_Checking",
        renderFunction: "diffValues",
      },
      Waiting: {
        dataIndex: "Jobs_Waiting",
        renderFunction: "diffValues",
      },
      Staging: {
        dataIndex: "Jobs_Staging",
        renderFunction: "diffValues",
      },
      Rescheduled: {
        dataIndex: "Jobs_Rescheduled",
        renderFunction: "diffValues",
      },
      Killed: {
        dataIndex: "Jobs_Killed",
        renderFunction: "diffValues",
      },
      Running: {
        dataIndex: "Jobs_Running",
        renderFunction: "diffValues",
      },
      Scheduled: {
        dataIndex: "Jobs_Scheduled",
        renderFunction: "diffValues",
      },

      Done: {
        dataIndex: "Jobs_Done",
        renderFunction: "diffValues",
      },
      Completed: {
        dataIndex: "Jobs_Completed",
        renderFunction: "diffValues",
      },
      Failed: {
        dataIndex: "Jobs_Failed",
        renderFunction: "diffValues",
      },
      Stalled: {
        dataIndex: "Jobs_Stalled",
        renderFunction: "diffValues",
      },
      InheritedFrom: {
        dataIndex: "InheritedFrom",
        properties: {
          hidden: true,
        },
      },
      GroupSize: {
        dataIndex: "GroupSize",
        properties: {
          hidden: true,
        },
      },
      FileMask: {
        dataIndex: "FileMask",
        properties: {
          hidden: true,
        },
      },
      Plugin: {
        dataIndex: "Plugin",
        properties: {
          hidden: true,
        },
      },
      EventsPerJob: {
        dataIndex: "EventsPerJob",
        properties: {
          hidden: true,
        },
      },
      MaxNumberOfJobs: {
        dataIndex: "MaxNumberOfJobs",
        properties: {
          hidden: true,
        },
      },
      AuthorDN: {
        dataIndex: "AuthorDN",
        properties: {
          hidden: true,
        },
      },
      AuthorGroup: {
        dataIndex: "AuthorGroup",
        properties: {
          hidden: true,
        },
      },
      Description: {
        dataIndex: "Description",
        properties: {
          hidden: true,
        },
      },
      LongDescription: {
        dataIndex: "LongDescription",
        properties: {
          hidden: true,
        },
      },
      "CreationDate [UTC]": {
        dataIndex: "CreationDate",
        renderer: Ext.util.Format.dateRenderer("Y-m-j H:i"),
      },
      "LastUpdate [UTC]": {
        dataIndex: "LastUpdate",
        renderer: Ext.util.Format.dateRenderer("Y-m-j H:i"),
      },
    };

    var showJobshandler = function () {
      var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "TransformationID");
      var sId = GLOBAL.APP.CF.zfill(oId, 8);

      var setupdata = {
        data: {
          leftMenu: {
            selectors: {
              jobGroup: {
                data_selected: [sId],
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
    var fileRetrySubMenu = {
      Visible: [
        {
          text: "Processed",
          handler: me.__oprGetJobData,
          arguments: ["fileProcessed"],
          properties: {
            tooltip: "Click to show processed files.",
          },
        },
        {
          text: "Not Processed",
          handler: me.__oprGetJobData,
          arguments: ["fileNotProcessed"],
          properties: {
            tooltip: "Click to show non-processed files.",
          },
        },
        {
          text: "All",
          handler: me.__oprGetJobData,
          arguments: ["fileAllProcessed"],
          properties: {
            tooltip: "Click to show all files.",
          },
        },
      ],
    };
    var actionSubMenu = {
      Protected: [
        {
          text: "Start",
          handler: me.__oprTransformationAction,
          arguments: ["start", true],
          properties: {
            tooltip: "Click to start the selected transformations(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Stop",
          handler: me.__oprTransformationAction,
          arguments: ["stop", true],
          properties: {
            tooltip: "Click to stop the selected transformations(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Extend",
          handler: me.__extendTransformation,
          properties: {
            tooltip: "Click to extend the selected transformations(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Flush",
          handler: me.__oprTransformationAction,
          arguments: ["flush", true],
          properties: {
            tooltip: "Click to flush the selected transformations(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Complete",
          handler: me.__oprTransformationAction,
          arguments: ["complete", true],
          properties: {
            tooltip: "Click to complete the selected transformations(s)",
          },
          property: "ProductionManagement",
        },
        {
          text: "Clean",
          handler: me.__oprTransformationAction,
          arguments: ["clean", true],
          properties: {
            tooltip: "Click to clean the selected transformations(s)",
          },
          property: "ProductionManagement",
        },
      ],
    };

    var menuitems = {
      Visible: [
        {
          text: "Show Jobs",
          handler: showJobshandler,
          properties: {
            tooltip: "Click to show the jobs which belong to the selected transformation(s).",
          },
        },
        {
          text: "-",
        },
        {
          text: "Logging Info",
          handler: me.__oprGetJobData,
          arguments: ["getLoggingInfo"],
          properties: {
            tooltip: "Click to show the logging information of the selected transformation.",
          },
        },
        {
          text: "Workflow xml",
          handler: me.__oprGetJobData,
          arguments: ["workflowxml"],
          properties: {
            tooltip: "Click to show the workflow information of the selected transformation.",
          },
        },
        {
          text: "File Status",
          handler: me.__oprGetJobData,
          arguments: ["fileStatus"],
          properties: {
            tooltip: "Click to show the file status of the selected transformation.",
          },
        },
        {
          text: "-",
        }, // menu separator
        {
          text: "File Retries",
          subMenu: fileRetrySubMenu,
        },
        {
          text: "InputData Query",
          handler: me.__oprGetJobData,
          arguments: ["dataQuery"],
          properties: {
            tooltip: "Clisck to show the input data query.",
          },
        },
        {
          text: "Additional Params",
          handler: me.__oprGetJobData,
          arguments: ["additionalParams"],
          properties: {
            tooltip: "Clisck to show the parameters of the production.",
          },
        },
        {
          text: "Show Details",
          handler: me.__oprGetJobData,
          arguments: ["transformationDetail"],
          properties: {
            tooltip: "Click to show a detailed description of the selected transformation.",
          },
        },
        {
          text: "-",
        }, // menu separator
        {
          text: "Actions",
          subMenu: actionSubMenu,
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
      contextMenu: me.contextGridMenu,
      pagingToolbar: pagingToolbar,
      scope: me,
      /* viewConfig : {
                enableTextSelection : true,
                getRowClass : function() {
                  return this.enableTextSelection ? 'x-selectable' : '';
                }
              }*/
    });

    me.leftPanel.setGrid(me.grid);

    me.add([me.leftPanel, me.grid]);
  },
  __oprGetJobData: function (oDataKind) {
    var me = this;
    var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "TransformationID");
    if (!oId) {
      return;
    }
    me.getContainer().body.mask("Wait ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
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
          if (oDataKind == "getLoggingInfo") {
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Production:" + oId,
              ["message", "date", "author"],
              [
                {
                  text: "Message",
                  flex: 1,
                  sortable: false,
                  dataIndex: "message",
                },
                {
                  text: "Date(UTC)",
                  flex: 1,
                  sortable: false,
                  dataIndex: "date",
                },
                {
                  text: "Author",
                  flex: 1,
                  sortable: false,
                  dataIndex: "author",
                },
              ]
            );
          } else if (oDataKind == "fileStatus") {
            var menu = [
              {
                text: "Show Files",
                handler: me.__showFileStatus,
                arguments: [me],
              },
            ];
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Production:" + oId,
              ["status", "count", "precentage"],
              [
                {
                  text: "Status",
                  flex: 1,
                  sortable: false,
                  dataIndex: "status",
                },
                {
                  text: "Count",
                  flex: 1,
                  sortable: false,
                  dataIndex: "count",
                },
                {
                  text: "Precentage",
                  flex: 1,
                  sortable: false,
                  dataIndex: "precentage",
                },
              ],
              menu
            );
          } else if (oDataKind == "fileProcessed") {
            var menu = [
              {
                text: "Show Files",
                handler: me.__showFileStatus,
                arguments: [me, "Processed"],
              },
            ];
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Production:" + oId,
              ["retries", "count", "precentage"],
              [
                {
                  text: "Retries",
                  flex: 1,
                  sortable: false,
                  dataIndex: "retries",
                },
                {
                  text: "Count",
                  flex: 1,
                  sortable: false,
                  dataIndex: "count",
                },
                {
                  text: "Precentage",
                  flex: 1,
                  sortable: false,
                  dataIndex: "precentage",
                },
              ],
              menu
            );
          } else if (oDataKind == "fileNotProcessed") {
            var menu = [
              {
                text: "Show Files",
                handler: me.__showFileStatus,
                arguments: [me, "NotProcessed"],
              },
            ];
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Production:" + oId,
              ["retries", "count", "precentage"],
              [
                {
                  text: "Retries",
                  flex: 1,
                  sortable: false,
                  dataIndex: "retries",
                },
                {
                  text: "Count",
                  flex: 1,
                  sortable: false,
                  dataIndex: "count",
                },
                {
                  text: "Precentage",
                  flex: 1,
                  sortable: false,
                  dataIndex: "precentage",
                },
              ],
              menu
            );
          } else if (oDataKind == "fileAllProcessed") {
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Production:" + oId,
              ["retries", "count", "precentage"],
              [
                {
                  text: "Retries",
                  flex: 1,
                  sortable: false,
                  dataIndex: "retries",
                },
                {
                  text: "Count",
                  flex: 1,
                  sortable: false,
                  dataIndex: "count",
                },
                {
                  text: "Precentage",
                  flex: 1,
                  sortable: false,
                  dataIndex: "precentage",
                },
              ]
            );
          } else if (oDataKind == "dataQuery") {
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Production:" + oId,
              ["name", "value"],
              [
                {
                  text: "Name",
                  flex: 1,
                  sortable: false,
                  dataIndex: "name",
                },
                {
                  text: "Value",
                  flex: 1,
                  sortable: false,
                  dataIndex: "value",
                },
              ]
            );
          } else if (oDataKind == "additionalParams") {
            me.getContainer().oprPrepareAndShowWindowGrid(
              jsonData["result"],
              "Production:" + oId,
              ["name", "value"],
              [
                {
                  text: "Name",
                  flex: 1,
                  sortable: false,
                  dataIndex: "name",
                },
                {
                  text: "Value",
                  flex: 1,
                  sortable: false,
                  dataIndex: "value",
                },
              ]
            );
          } else if (oDataKind == "transformationDetail") {
            me.getContainer().oprPrepareAndShowWindowText(jsonData["result"], "Production:" + oId);
          } else if (oDataKind == "workflowxml") {
            var xmlText = '<?xml version="1.0" encoding="UTF-8" ?>' + jsonData["result"];
            // xmlText = encodeURI(xmlText);

            if (Ext.isSafari) {
              var w = window.open("data:text/xml," + xmlText);
              w.focus();
            } else {
              var win = GLOBAL.APP.MAIN_VIEW.getRightContainer().createModalWindow({
                height: 500,
                width: 700,
                title: "WorkFlow",
                modal: true,
                parentWindow: me,
                isChildWindow: true,
                autoscroll: true,
                autoScroll: true,
                iconCls: "system_child_window",
                html: '<div id = "xmlContainer"></div>',
                listeners: {
                  render: function () {
                    var xmlContainer = Ext.get("xmlContainer");
                    xmlContainer.update("<pre>" + Ext.util.Format.htmlEncode(xmlText) + "</pre>");
                  },
                },
              });

              win.show();
            }
          } else {
            alert(jsonData["error"]);
          }
        }
      },
    });
  },
  __showFileStatus: function (parent, status) {
    var me = this;
    oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(parent.grid, "TransformationID");
    var oStatus = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me, "status");
    if (!oStatus) {
      oStatus = status;
    }
    parent.grid.body.mask("Wait ...");

    var url = GLOBAL.BASE_URL + "TransformationMonitor/showFileStatus";
    var params = {
      status: oStatus,
      transformationId: oId,
    };

    var oFields = ["LFN", "TransformationID", "FileID", "Status", "TaskID", "TargetSE", "UsedSE", "ErrorCount", "LastUpdate", "InsertedTime"];

    var oColumns = [
      {
        text: "LFN",
        flex: 1,
        width: 60,
        sortable: false,
        dataIndex: oFields[0],
      },
      {
        text: "TransformationId",
        flex: 1,
        sortable: false,
        dataIndex: oFields[1],
        hidden: true,
      },
      {
        text: "FileId",
        flex: 1,
        sortable: false,
        dataIndex: oFields[2],
        hidden: true,
      },
      {
        text: "Status",
        flex: 1,
        sortable: false,
        dataIndex: oFields[3],
      },
      {
        text: "TaskId",
        flex: 1,
        sortable: false,
        dataIndex: oFields[4],
      },
      {
        text: "TargetSE",
        flex: 1,
        sortable: false,
        dataIndex: oFields[5],
      },
      {
        text: "UsedSE",
        flex: 1,
        sortable: false,
        dataIndex: oFields[6],
      },
      {
        text: "ErrorCount",
        flex: 1,
        sortable: false,
        dataIndex: oFields[7],
      },
      {
        text: "LastUpdate",
        flex: 1,
        sortable: false,
        dataIndex: oFields[8],
      },
      {
        text: "InsertedTime",
        flex: 1,
        sortable: false,
        dataIndex: oFields[9],
      },
    ];

    var oGrid = parent.__createStatusGridPanel(oFields, oColumns, url, params);

    /*
     * var oMenu = new Ext.menu.Menu({ items : [{ text : 'Show value',
     * handler : parent.getContainer().showValue.bind(oGrid, oGrid)
     * }] }); oGrid.menu = oMenu;
     */
    parent.getContainer().showInWindow("Files with status " + oStatus + " for production:" + oId, oGrid);
    parent.grid.body.unmask();
  },
  __flushRun: function (parentGrid) {
    var me = this;
    var oRunNumberId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me, "RunNumber");
    var oTransFormationId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(parentGrid, "TransformationID");

    var appName = me.parent.applicationName;

    var title = "Flush " + oRunNumberId;
    var msg = "Are you sure you want to flush this run: " + oRunNumberId + " ?";
    Ext.Msg.confirm(title, msg, function (btn) {
      if (btn == "yes") {
        var params = {
          RunNumber: oRunNumberId,
          TransformationId: oTransFormationId,
          Status: "Flush",
        };
        Ext.Ajax.request({
          method: "POST",
          params: params,
          failure: function (responseText) {
            alert(responseText.statusText);
          },
          success: function (response) {
            var response = Ext.JSON.decode(response.responseText);
            if (response.success == true) {
              me.oprLoadGridData();
            } else {
              alert(response["error"]);
            }
          },
          url: GLOBAL.BASE_URL + appName + "/setRunStatus",
        });
      }
    });
  },
  __setSite: function (parentGrid, site) {
    var me = this;
    var oRunNumberId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me, "RunNumber");
    var oTransFormationId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(parentGrid, "TransformationID");

    var appName = me.parent.applicationName;

    var title = "Set Site " + site;
    var msg = "Are you sure you want to set site " + site + " for the run " + oRunNumberId + " in production " + oTransFormationId + " ?";
    Ext.Msg.confirm(title, msg, function (btn) {
      if (btn == "yes") {
        var params = {
          RunNumber: oRunNumberId,
          TransformationId: oTransFormationId,
          Site: site,
        };
        Ext.Ajax.request({
          method: "POST",
          params: params,
          failure: function (responseText) {
            alert(responseText.statusText);
          },
          success: function (response) {
            var response = Ext.JSON.decode(response.responseText);
            if (response.success == true) {
              me.oprLoadGridData();
            } else {
              alert(response["error"]);
            }
          },
          url: GLOBAL.BASE_URL + appName + "/setSite",
        });
      }
    });
  },
  __extendTransformation: function () {
    var me = this;
    var id = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "TransformationID");
    Ext.Msg.prompt("Extend transformation", "Please enter the number of tasks", function (btn, tasks) {
      if (btn == "ok") {
        if (tasks) {
          Ext.Ajax.request({
            success: function (response) {
              var jsonData = Ext.JSON.decode(response.responseText);
              if (jsonData["success"] == "false") {
                alert("Error: " + jsonData["error"]);
                return;
              } else {
                if (jsonData.showResult) {
                  var html = "";
                  for (var i = 0; i < jsonData.showResult.length; i++) {
                    html = html + jsonData.showResult[i] + "<br>";
                  }
                  Ext.Msg.alert("Result:", html);
                }
                me.grid.store.load();
              }
            },
            method: "POST",
            params: {
              data_kind: "extend",
              id: id,
              tasks: tasks,
            },
            url: GLOBAL.BASE_URL + me.applicationName + "/action",
            failure: function (response) {
              GLOBAL.APP.CF.showAjaxErrorMessage(response);
            },
          });
        }
      }
    });
  },
  __setRefreshCycle: function (time) {
    var me = this;
    me.refreshCycle = time; // it is used if we want to save the state!!!
    if (time != 0) {
      clearInterval(me.grid.refreshTimeout);
      me.grid.refreshTimeout = setInterval(function () {
        me.grid.store.load();
      }, time);
    } else {
      clearInterval(me.grid.refreshTimeout);
    }
  },
  __createStatusGridPanel: function (oFields, oColumns, url, params) {
    var me = this;
    var oGrid = null;

    var oGrid = Ext.create("Ext.dirac.utils.GridPanel", {
      oFields: oFields,
      oColumns: oColumns,
      url: url,
      params: params,
      menu: null,
      parent: me,
      selType: "cellmodel",
      viewConfig: {
        enableTextSelection: true,
        getRowClass: function () {
          return this.enableTextSelection ? "x-selectable" : "";
        },
        listeners: {
          render: function (view) {
            var grid = this;

            // record the current cellIndex
            grid.mon(view, {
              uievent: function (type, view, cell, recordIndex, cellIndex, e) {
                grid.cellIndex = cellIndex;
                grid.recordIndex = recordIndex;
              },
            });

            grid.tip = Ext.create("Ext.tip.ToolTip", {
              target: view.el,
              delegate: ".x-grid-cell",
              trackMouse: true,
              renderTo: Ext.getBody(),
              listeners: {
                beforeshow: function updateTipBody(tip) {
                  if (!Ext.isEmpty(grid.cellIndex) && grid.cellIndex !== -1) {
                    header = grid.headerCt.getGridColumns()[grid.cellIndex];
                    tip.update(grid.getStore().getAt(grid.recordIndex).get(header.dataIndex));
                  }
                },
              },
            });
          },
          destroy: function (view) {
            delete view.tip; // Clean up this property on destroy.
          },
        },
      },
    });

    return oGrid;
  },
  __oprTransformationAction: function (oAction, useGridTransformationId) {
    var me = this;
    var oItems = [];
    var oId = null;

    if (useGridTransformationId) {
      oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "TransformationID");
    }

    if (oId == null || oId == "" || oId == undefined) {
      var oElems = Ext.query("#" + me.id + " input.checkrow");

      for (var i = 0; i < oElems.length; i++) if (oElems[i].checked) oItems.push(oElems[i].value);

      if (oItems.length < 1) {
        alert("No transformations were selected");
        return;
      }
    } else {
      oItems[0] = oId;
    }

    var c = false;

    if (oItems.length == 1) c = confirm("Are you sure you want to " + oAction + " " + oItems[0] + "?");
    else c = confirm("Are you sure you want to " + oAction + " these transformations?");

    if (c === false) return;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/executeOperation",
      method: "POST",
      params: {
        action: oAction,
        ids: oItems.join(","),
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);
        if (jsonData["success"] == "false") {
          alert("Error: " + jsonData["error"]);
          return;
        } else {
          if (jsonData.showResult) {
            var html = "";
            for (var i = 0; i < jsonData.showResult.length; i++) {
              html = html + jsonData.showResult[i] + "<br>";
            }
            Ext.Msg.alert("Result:", html);
          }
          me.grid.store.load();
        }
      },
    });
  },
});
