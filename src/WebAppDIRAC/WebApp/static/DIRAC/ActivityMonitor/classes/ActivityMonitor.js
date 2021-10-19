Ext.define("DIRAC.ActivityMonitor.classes.ActivityMonitor", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.util.*",
    "Ext.panel.Panel",
    "Ext.form.field.Text",
    "Ext.button.Button",
    "Ext.menu.Menu",
    "Ext.form.field.ComboBox",
    "Ext.layout.*",
    "Ext.form.field.Date",
    "Ext.form.field.TextArea",
    "Ext.form.field.Checkbox",
    "Ext.form.FieldSet",
    "Ext.dirac.utils.DiracMultiSelect",
    "Ext.toolbar.Toolbar",
    "Ext.data.Record",
    "Ext.Array",
    "Ext.data.TreeStore",
    "Ext.ux.form.MultiSelect",
    "DIRAC.ActivityMonitor.classes.ActivityTreeModel",
  ],

  expansionState: {},
  initComponent: function () {
    var me = this;
    me.launcher.title = "Activity Monitor";

    Ext.apply(me, {
      layout: "border",
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
      items: [],
      header: false,
    });

    me.callParent(arguments);
  },

  buildUI: function () {
    var me = this;

    var oToolb = Ext.create("Ext.toolbar.Toolbar", {
      dock: "top",
      border: false,
      layout: {
        pack: "center",
      },
      items: [
        {
          xtype: "button",
          text: "Proxy Monitor",
          handler: function () {
            me.mainPanel.getLayout().setActiveItem(0);
          },
          toggleGroup: me.id + "-ids-submodule",
          allowDepress: false,
        },
        {
          xtype: "button",
          text: "Plot Creator",
          handler: function () {
            me.mainPanel.getLayout().setActiveItem(1);
          },
          toggleGroup: me.id + "-ids-submodule",
          allowDepress: false,
        },
        {
          xtype: "button",
          text: "Plot Viewer",
          handler: function () {
            me.mainPanel.getLayout().setActiveItem(2);
          },
          toggleGroup: me.id + "-ids-submodule",
          allowDepress: false,
        },
        {
          xtype: "button",
          text: "System overview plots",
          handler: function () {
            me.mainPanel.getLayout().setActiveItem(3);
          },
          toggleGroup: me.id + "-ids-submodule",
          allowDepress: false,
        },
      ],
    });

    oToolb.items.getAt(0).toggle();

    me.mainPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      layout: "card",
      region: "center",
      header: false,
      border: false,
      dockedItems: [oToolb],
    });

    me.__buildActivityMonitor();
    me.__buildPlotManagement();
    me.__buildPlotViewer();
    me.__buildSystemViewer();

    me.add([me.mainPanel]);
  },

  __buildActivityMonitor: function () {
    var me = this;

    me.activityMonitorDataStore = new Ext.data.JsonStore({
      proxy: {
        type: "ajax",
        url: GLOBAL.BASE_URL + "ActivityMonitor/getActivityData",
        reader: {
          keepRawData: true,
          type: "json",
          rootProperty: "result",
        },
        timeout: 1800000,
      },
      autoLoad: true,
      fields: [
        {
          name: "sources_id",
          type: "int",
        },
        "sources_site",
        "sources_componentType",
        "sources_componentLocation",
        "sources_componentName",
        {
          name: "activities_id",
          type: "int",
        },
        "activities_name",
        "activities_category",
        "activities_unit",
        "activities_type",
        "activities_description",
        {
          name: "activities_bucketLength",
          type: "int",
        },
        "activities_filename",
        {
          name: "activities_lastUpdate",
          type: "float",
        },
      ],
      remoteSort: true,
      pageSize: 100,
      listeners: {
        load: function (oStore, records, successful, eOpts) {
          var bResponseOK = oStore.proxy.getReader().rawData["success"] == "true";

          if (!bResponseOK) {
            GLOBAL.APP.CF.alert(oStore.proxy.getReader().rawData["error"], "info");

            if (parseInt(oStore.proxy.getReader().rawData["total"], 10) == 0) {
              me.dataStore.removeAll();
            }
          }
        },
      },
    });

    var oDeleteSelectedActivities = new Ext.Button({
      text: "Delete",
      iconCls: "dirac-icon-delete",
      handler: function () {
        var oElems = Ext.query("#" + me.activityMonitorPanel.id + " input.checkrow");

        var oItems = [];

        for (var i = 0; i < oElems.length; i++) if (oElems[i].checked) oItems.push(oElems[i].value);

        if (oItems.length < 1) {
          GLOBAL.APP.CF.alert("No jobs were selected", "error");
          return;
        }

        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "ActivityMonitor/deleteActivities",
          params: {
            ids: oItems.join(","),
          },
          scope: me,
          success: function (response) {
            me.activityMonitorDataStore.store.load();
          },
        });
      },
      tooltip: "Click to delete all selected proxies",
    });

    me.activityMonitorToolbar = Ext.create("Ext.toolbar.Paging", {
      store: me.activityMonitorDataStore,
      displayInfo: true,
      displayMsg: "Displaying topics {0} - {1} of {2}",
      items: [oDeleteSelectedActivities, "->"],
      prependButtons: true,
      emptyMsg: "No topics to display",
      layout: {
        overflowHandler: "Scroller",
      },
    });

    var sGridId = Ext.id();

    var sCheckboxDefinition = "";
    sCheckboxDefinition += '<input type="checkbox" value="" onchange="';
    sCheckboxDefinition += "var oChecked=this.checked;";
    sCheckboxDefinition += "var oElems=Ext.query('#" + sGridId + " input.checkrow');";
    sCheckboxDefinition += "for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;";
    sCheckboxDefinition += '" class="am-main-check-box"/>';

    me.activityMonitorPanel = Ext.create("Ext.grid.Panel", {
      store: me.activityMonitorDataStore,
      stateful: true,
      stateId: "ActivityMonitorPanel",
      id: sGridId,
      header: false,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      columns: [
        {
          header: sCheckboxDefinition,
          name: "checkBox",
          width: 26,
          sortable: false,
          dataIndex: "activities_id",
          renderer: function (value, metaData, record, row, col, store, gridView) {
            return this.rendererChkBox(record);
          },
          hideable: false,
          fixed: true,
          menuDisabled: true,
          align: "center",
        },
        {
          header: "Site",
          sortable: true,
          dataIndex: "sources_site",
        },
        {
          header: "Component Type",
          sortable: true,
          dataIndex: "sources_componentType",
        },
        {
          header: "Location",
          sortable: true,
          dataIndex: "sources_componentLocation",
          flex: 1,
        },
        {
          header: "Component name",
          sortable: true,
          dataIndex: "sources_componentName",
          flex: 1,
        },
        {
          header: "Activity name",
          sortable: true,
          dataIndex: "activities_name",
        },
        {
          header: "Category",
          sortable: true,
          dataIndex: "activities_category",
        },
        {
          header: "Unit",
          sortable: true,
          dataIndex: "activities_unit",
        },
        {
          header: "Activity type",
          sortable: true,
          dataIndex: "activities_type",
        },
        {
          header: "Description",
          sortable: true,
          dataIndex: "activities_description",
        },
        {
          header: "Bucket size",
          sortable: true,
          dataIndex: "activities_bucketLength",
        },
        {
          header: "File",
          sortable: true,
          dataIndex: "activities_filename",
        },
        {
          header: "Last update",
          sortable: true,
          dataIndex: "activities_lastUpdate",
          renderer: function (value, metaData, record, row, col, store, gridView) {
            return this.renderLastUpdate(value, metaData, record, row, col, store, gridView);
          },
        },
      ],
      rendererChkBox: function (record) {
        return (
          '<input value="' +
          record.get("sources_id") +
          "." +
          record.get("activities_id") +
          '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>'
        );
      },
      renderLastUpdate: function (value, metadata, record, rowIndex, colIndex, store) {
        var lastUpdated = record.data.activities_lastUpdate;
        var timeLimit = 86400 * 30;
        if (lastUpdated > timeLimit) lastUpdated = timeLimit;
        var green = parseInt((200 * (timeLimit - lastUpdated)) / timeLimit);
        var red = parseInt((200 * lastUpdated) / timeLimit);
        return '<span style="color: rgb(' + red + "," + green + ',0);">' + lastUpdated + "</span>";
      },
      bbar: me.activityMonitorToolbar,
    });

    me.htmlDescriptionVariables = "";
    me.htmlDescriptionVariables += "<table style='width:100%'>";
    me.htmlDescriptionVariables += "<tr>";
    me.htmlDescriptionVariables += "<td style='width:50%;background-color:#eeeeee;font-weight:bold;padding:5px'>";
    me.htmlDescriptionVariables += "Variable Name";
    me.htmlDescriptionVariables += "</td>";
    me.htmlDescriptionVariables += "<td style='width:50%;background-color:#eeeeee;font-weight:bold;padding:5px'>";
    me.htmlDescriptionVariables += "Description";
    me.htmlDescriptionVariables += "</td>";
    me.htmlDescriptionVariables += "</tr>";

    var oVariables = [
      ["$DESCRIPTION", "Description of the activity"],
      ["$SITE", "Site for the originating component"],
      ["$COMPONENTTYPE", "Type of component to generate the activity (for example: service, agent, web)"],
      ["$COMPONENTNAME", "Full name of component"],
      ["$COMPONENTLOCATION", "	Location of component"],
      ["$UNIT", "Activity unit"],
      ["$CATEGORY", "Activity category"],
    ];

    for (var i = 0; i < oVariables.length; i++) {
      me.htmlDescriptionVariables += "<tr>";
      me.htmlDescriptionVariables += "<td style='width:50%;font-weight:bold;padding:5px'>";
      me.htmlDescriptionVariables += oVariables[i][0];
      me.htmlDescriptionVariables += "</td>";
      me.htmlDescriptionVariables += "<td style='width:50%;padding:5px'>";
      me.htmlDescriptionVariables += oVariables[i][1];
      me.htmlDescriptionVariables += "</td>";
      me.htmlDescriptionVariables += "</tr>";
    }

    me.htmlDescriptionVariables += "</table>";

    me.mainPanel.add([me.activityMonitorPanel]);
  },

  __buildPlotManagement: function () {
    var me = this;

    me.plotManagementMainPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      layout: "border",
      header: false,
      border: false,
      items: [],
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    var sGridId = Ext.id();

    var sCheckboxDefinition = "";
    sCheckboxDefinition += '<input type="checkbox" value="" onchange="';
    sCheckboxDefinition += "var oChecked=this.checked;";
    sCheckboxDefinition += "var oElems=Ext.query('#" + sGridId + " input.checkrow');";
    sCheckboxDefinition += "for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;";
    sCheckboxDefinition += '" class="am-main-check-box"/>';

    me.plotManagementListPanel = Ext.create("Ext.grid.Panel", {
      region: "south",
      height: 300,
      store: null,
      stateful: true,
      stateId: "ActivityList",
      header: false,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      columns: [
        {
          header: sCheckboxDefinition,
          name: "checkBox",
          width: 26,
          sortable: false,
          dataIndex: "id",
          renderer: function (value, metaData, record, row, col, store, gridView) {
            return this.rendererChkBox(value);
          },
          hideable: false,
          fixed: true,
          menuDisabled: true,
          align: "center",
        },
        {
          header: "Name",
          sortable: true,
          width: 300,
          dataIndex: "name",
        },
        {
          header: "Variable Fields",
          sortable: true,
          dataIndex: "variable_fields",
          flex: 1,
        },
      ],
      refreshData: function () {
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "ActivityMonitor/getStaticPlotViews",
          scope: me,
          success: function (response) {
            var me = this;
            var response = Ext.JSON.decode(response.responseText);

            me.plotManagementListPanel.reconfigure(
              new Ext.data.ArrayStore({
                fields: ["id", "name", "variable_fields"],
                data: response.result,
              }),
              undefined
            );
          },
        });
      },
      rendererChkBox: function (val) {
        return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
      },
      dockedItems: [
        {
          dock: "top",
          xtype: "toolbar",
          border: false,
          items: [
            "->",
            {
              xtype: "button",
              iconCls: "dirac-icon-delete",
              text: "Delete",
              handler: function () {},
            },
          ],
          tooltip: "Delete selected views",
        },
      ],
    });

    me.plotManagementListPanel.refreshData();

    // -------------------------------------------------------------------------------------

    var oTopPanel = new Ext.create("Ext.panel.Panel", {
      region: "center",
      floatable: false,
      layout: "border",
      header: false,
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    me.viewDefinitionData = {};
    me.viewDefinitionDataForServer = {};
    me.viewDefinitionDataForServerVariable = [];

    me.plotManagementFieldCreator = new Ext.create("Ext.panel.Panel", {
      region: "west",
      floatable: false,
      layout: "anchor",
      header: false,
      width: 350,
      bodyPadding: 5,
      dockedItems: [
        {
          dock: "top",
          xtype: "toolbar",
          border: false,
          layout: {
            pack: "center",
          },
          items: [
            "->",
            {
              xtype: "button",
              iconCls: "dirac-icon-plus",
              text: "Add to view definition",
              handler: function () {
                var sTypeValue = me.restrictByFieldCreator.getValue();
                var oSelectedValues = me.valuesFieldCreator.getValue();

                if (sTypeValue == null) {
                  GLOBAL.APP.CF.alert("No data type selected !", "warning");
                  return;
                }

                if (me.variableFieldCreator.getValue() || (!me.variableFieldCreator.getValue() && oSelectedValues.length > 0)) {
                  var sTypeText = me.restrictByFieldCreator.findRecordByValue(sTypeValue).get("text");

                  me.viewDefinitionData[sTypeText] = {
                    value: sTypeValue,
                    checked: me.variableFieldCreator.getValue(),
                  };

                  if (me.variableFieldCreator.getValue()) me.viewDefinitionDataForServerVariable.push(sTypeValue);
                  else me.viewDefinitionDataForServer[sTypeValue] = oSelectedValues;

                  oNodeData = {
                    text: sTypeText,
                    leaf: false,
                  };
                  var oRoot = me.plotManagementViewTreeStore.getRootNode();

                  var oTypeNode = oRoot.createNode(oNodeData);
                  oRoot.appendChild(oTypeNode);

                  if (me.variableFieldCreator.getValue()) {
                    var oNewNode = oTypeNode.createNode({
                      text: "variable value",
                      leaf: true,
                    });
                    oTypeNode.appendChild(oNewNode);
                  } else {
                    for (var i = 0; i < oSelectedValues.length; i++) {
                      var oNewNode = oTypeNode.createNode({
                        text: oSelectedValues[i],
                        leaf: true,
                      });
                      oTypeNode.appendChild(oNewNode);
                    }
                  }

                  oRoot.expand();
                  oTypeNode.expand();

                  // we have to remove the selected option

                  me.restrictByFieldCreator.store.remove(me.restrictByFieldCreator.findRecordByValue(sTypeValue));

                  // we have to set the value to null
                  me.restrictByFieldCreator.setValue(null);
                  me.valuesFieldCreator.store.removeAll();
                  me.valuesFieldCreator.reset();
                } else {
                  GLOBAL.APP.CF.alert("No values have been selected !", "warning");
                }
              },
            },
          ],
        },
      ],
    });

    me.restrictByFieldCreator = Ext.create("Ext.form.field.ComboBox", {
      fieldLabel: "Restrict by",
      queryMode: "local",
      labelAlign: "left",
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      editable: false,
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: [
          ["sources.site", "Site"],
          ["sources.componentType", "Component type"],
          ["sources.componentLocation", "Component location"],
          ["sources.componentName", "Component name"],
          ["activities.description", "Activity"],
          ["activities.category", "Activity category"],
        ],
      }),
      value: null,
      listeners: {
        change: function (oComp, sNewValue, sOldValue, eOpts) {
          if (sNewValue != null && Ext.util.Format.trim(sNewValue) != "") {
            Ext.Ajax.request({
              url: GLOBAL.BASE_URL + "ActivityMonitor/queryFieldValue",
              params: {
                queryField: sNewValue,
                selectedFields: Ext.JSON.encode(me.viewDefinitionDataForServer),
              },
              scope: me,
              success: function (response) {
                var response = Ext.JSON.decode(response.responseText);

                if (response["success"] == "true") {
                  me.valuesFieldCreator.store.removeAll();

                  oData = response.result;

                  for (var i = 0; i < oData.length; i++) {
                    me.valuesFieldCreator.store.add({
                      value: Ext.util.Format.trim(oData[i][0]),
                    });
                  }

                  me.valuesFieldCreator.reset();
                } else {
                  GLOBAL.APP.CF.alert(response["error"], "warning");
                }
              },
            });
          }
        },
      },
    });

    me.valuesFieldCreator = new Ext.ux.form.MultiSelect({
      fieldLabel: "Having values",
      queryMode: "local",
      labelAlign: "left",
      displayField: "value",
      valueField: "value",
      anchor: "100%",
      height: 150,
      store: new Ext.data.ArrayStore({
        fields: ["value"],
        data: [],
      }),
    });

    me.variableFieldCreator = Ext.create("Ext.form.field.Checkbox", {
      fieldLabel: "Variable field",
      labelAlign: "left",
    });

    me.plotManagementFieldCreator.add([me.restrictByFieldCreator, me.valuesFieldCreator, me.variableFieldCreator]);

    // -------------------------------------------------------------------------------------

    me.plotManagementViewOptions = new Ext.create("Ext.panel.Panel", {
      region: "east",
      floatable: false,
      layout: "anchor",
      header: false,
      width: 350,
      bodyPadding: 5,
      dockedItems: [
        {
          dock: "top",
          xtype: "toolbar",
          border: false,
          layout: {
            pack: "center",
          },
          items: [
            "->",
            {
              xtype: "button",
              text: "Test View",
              handler: function () {
                me.oprTestView();
              },
            },
          ],
        },
      ],
    });

    me.checkGroupByViewOptions = new Ext.create("Ext.form.CheckboxGroup", {
      columns: 1,
      vertical: true,
      items: [
        {
          boxLabel: "Site",
          name: "rb",
          inputValue: "sources.site",
        },
        {
          boxLabel: "Component type",
          name: "rb",
          inputValue: "sources.componentType",
          checked: true,
        },
        {
          boxLabel: "Component location",
          name: "rb",
          inputValue: "sources.componentLocation",
        },
        {
          boxLabel: "Component name",
          name: "rb",
          inputValue: "sources.componentName",
        },
        {
          boxLabel: "Activity",
          name: "rb",
          inputValue: "activities.description",
        },
        {
          boxLabel: "Activity category",
          name: "rb",
          inputValue: "activities.category",
        },
      ],
    });

    me.txtActivityLabelViewOptions = Ext.create("Ext.form.field.Text", {
      fieldLabel: "Activities label",
      labelAlign: "left",
      value: "$DESCRIPTION",
      anchor: "100%",
    });

    me.txtViewNameViewOptions = Ext.create("Ext.form.field.Text", {
      fieldLabel: "View name",
      labelAlign: "left",
      anchor: "100%",
    });

    me.txtStackActivityViewOptions = Ext.create("Ext.form.field.Checkbox", {
      fieldLabel: "Stack activities",
      labelAlign: "left",
    });

    me.plotManagementViewOptions.add([
      {
        xtype: "fieldset",
        columnWidth: 0.5,
        title: "Group plots by",
        collapsible: true,
        items: [me.checkGroupByViewOptions],
      },
      me.txtActivityLabelViewOptions,
      me.txtStackActivityViewOptions,
      me.txtViewNameViewOptions,
    ]);

    // -------------------------------------------------------------------------------------

    me.contextTreeMenu = new Ext.menu.Menu({
      width: 150,
      items: [
        {
          text: "Delete",
          iconCls: "dirac-icon-delete",
          listeners: {
            click: function () {
              var oNode = me.contextTreeMenu.node;

              if (oNode.isLeaf()) {
                oNode = oNode.parentNode;
              }

              var sType = oNode.data.text;

              me.restrictByFieldCreator.store.add({
                value: me.viewDefinitionData[sType].value,
                text: sType,
              });

              if (me.viewDefinitionData[sType].value in me.viewDefinitionDataForServer) {
                delete me.viewDefinitionDataForServer[me.viewDefinitionData[sType].value];
              } else {
                Ext.Array.remove(me.viewDefinitionDataForServerVariable, me.viewDefinitionData[sType].value);
              }

              delete me.viewDefinitionData[sType];

              var oParentNode = oNode.parentNode;
              oParentNode.removeChild(oNode);
            },
          },
        },
      ],
      moduleObject: me,
    });

    me.plotManagementViewTreeStore = Ext.create("Ext.data.TreeStore", {
      proxy: {
        type: "localstorage",
        id: me.id + "treeStoreLocalStorage",
      },
      root: {
        text: "View Definition",
      },
    });

    me.plotManagementViewTree = new Ext.create("Ext.tree.Panel", {
      region: "center",
      store: me.plotManagementViewTreeStore,
      header: false,
      listeners: {
        beforeitemcontextmenu: function (oView, oNode, item, index, e, eOpts) {
          e.preventDefault();
          if (oNode.data.id != "root") {
            me.contextTreeMenu.node = oNode;
            me.contextTreeMenu.showAt(e.getXY());
          }
        },
      },
    });

    // -------------------------------------------------------------------------------------
    oTopPanel.add([me.plotManagementFieldCreator, me.plotManagementViewOptions, me.plotManagementViewTree]);
    me.plotManagementMainPanel.add([me.plotManagementListPanel, oTopPanel]);

    me.mainPanel.add(me.plotManagementMainPanel);
  },

  __buildPlotViewer: function () {
    var me = this;

    me.plotViewerMainPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      layout: "border",
      header: false,
      border: false,
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "ActivityMonitor/getStaticPlotViews",
      scope: me,
      success: function (response) {
        var me = this;
        var response = Ext.JSON.decode(response.responseText);

        me.plotViewerListPanel.reconfigure(
          new Ext.data.ArrayStore({
            fields: ["id", "name", "variable_fields"],
            data: response.result,
          }),
          undefined
        );
      },
    });

    me.plotViewerListPanel = Ext.create("Ext.grid.Panel", {
      region: "west",
      width: 250,
      store: null,
      header: false,
      stateful: true,
      stateId: "ActivityViewList",
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      columns: [
        {
          header: "Click on a view to plot it",
          sortable: true,
          dataIndex: "name",
          flex: 1,
        },
      ],
      listeners: {
        cellclick: function (oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
          me.plotViewerResultPanel.removeAll();

          var oNewPlots = me.__buildPlotView(record.get("name"), "");

          me.plotViewerResultPanel.add(oNewPlots);
        },
      },
    });

    me.plotViewerResultPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      region: "center",
      layout: "border",
      header: false,
      border: false,
      items: [],
    });

    me.plotViewerMainPanel.add([me.plotViewerListPanel, me.plotViewerResultPanel]);
    me.mainPanel.add([me.plotViewerMainPanel]);
  },

  __buildPlotView: function (sViewId, sVariableData) {
    var me = this;

    var oMainPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      region: "center",
      layout: "border",
      header: false,
      items: [],
      viewId: sViewId,
    });

    var oLeftPanel = new Ext.create("Ext.panel.Panel", {
      title: "Activity view options",
      floatable: false,
      region: "west",
      layout: "anchor",
      width: 300,
      bodyPadding: 10,
      items: [],
    });

    var oRightPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      region: "center",
      header: false,
      autoScroll: true,
      layout: {
        type: "table",
        columns: 1,
      },
    });

    var oCalenFrom = new Ext.create("Ext.form.field.Date", {
      width: 100,
      format: "Y-m-d",
      fieldLabel: "From",
      labelAlign: "left",
      hidden: true,
      anchor: "100%",
    });

    var oCalenTo = new Ext.create("Ext.form.field.Date", {
      width: 100,
      format: "Y-m-d",
      fieldLabel: "To",
      labelAlign: "left",
      hidden: true,
      anchor: "100%",
    });

    var oTimeSpan = new Ext.create("Ext.form.field.ComboBox", {
      labelAlign: "left",
      fieldLabel: "Time Span",
      editable: false,
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: [
          [3600, "Last Hour"],
          [86400, "Last Day"],
          [604800, "Last Week"],
          [2592000, "Last Month"],
          [-1, "Manual Selection"],
        ],
      }),
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      value: 86400,
      listeners: {
        change: function (field, newValue, oldValue, eOpts) {
          oCalenFrom.hide();
          oCalenTo.hide();

          switch (newValue) {
            case -1:
              oCalenFrom.show();
              oCalenTo.show();
              break;
          }
        },
      },
    });

    var oPlotSize = new Ext.create("Ext.form.field.ComboBox", {
      labelAlign: "left",
      fieldLabel: "Plot Size",
      editable: false,
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: [
          [0, "Small"],
          [1, "Medium"],
          [2, "Big"],
          [3, "Very Big"],
        ],
      }),
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      value: 1,
    });

    oLeftPanel.add([oTimeSpan, oCalenFrom, oCalenTo, oPlotSize]);

    var oToolbar = new Ext.create("Ext.toolbar.Toolbar", {
      dock: "bottom",
      border: false,
      layout: {
        pack: "center",
      },
      items: [],
    });

    var oSubmitBtn = new Ext.Button({
      text: "Submit",
      margin: 3,
      iconCls: "dirac-icon-submit",
      handler: function () {
        oRightPanel.setLoading(true);
        var oParams = {};
        var bValid = true;

        oParams["id"] = sViewId;

        if (oTimeSpan.getValue() == -1) {
          if (oCalenFrom.getValue() == null || Ext.Date.format(oCalenFrom.getValue(), "Y-m-d") == "") {
            GLOBAL.APP.CF.alert("Select a from date", "warning");
            bValid = false;
          }

          if (oCalenTo.getValue() == null || Ext.Date.format(oCalenTo.getValue(), "Y-m-d") == "") {
            GLOBAL.APP.CF.alert("Select a to date", "warning");
            bValid = false;
          }

          oParams["timespan"] = -1;
          oParams["fromDate"] = Ext.Date.format(oCalenFrom.getValue(), "Y-m-d");
          oParams["toDate"] = Ext.Date.format(oCalenTo.getValue(), "Y-m-d");
        } else {
          oParams["timespan"] = oTimeSpan.getValue();
        }

        if (sVariableData) {
          oParams["varData"] = Ext.encode(sVariableData);
        }

        oParams["size"] = oPlotSize.getValue();

        if (bValid) {
          Ext.Ajax.request({
            url: GLOBAL.BASE_URL + "ActivityMonitor/plotView",
            params: oParams,
            scope: me,
            success: function (response) {
              oRightPanel.setLoading(false);
              var me = this;
              var response = Ext.JSON.decode(response.responseText);

              if (response.success == "true") {
                var plotsList = response.data;
                if (plotsList.length) {
                  oRightPanel.removeAll();

                  for (var i = 0; i < plotsList.length; i++) {
                    var oNewImage = Ext.create("Ext.Img", {
                      region: "center",
                      src: GLOBAL.BASE_URL + "ActivityMonitor/getPlotImg?file=" + plotsList[i],
                    });

                    oRightPanel.add(oNewImage);
                  }
                }
              } else {
                GLOBAL.APP.CF.alert(response.error, "warning");
              }
            },
          });
        }
      },
    });

    var oResetBtn = new Ext.Button({
      text: "Reset",
      margin: 3,
      iconCls: "dirac-icon-reset",
      handler: function () {},
    });

    oToolbar.add([oSubmitBtn, oResetBtn]);

    oLeftPanel.addDocked([oToolbar]);

    oMainPanel.add([oLeftPanel, oRightPanel]);

    return oMainPanel;
  },

  generateViewRequest: function () {
    var me = this;

    if (me.viewDefinitionDataForServer.length == 0) {
      GLOBAL.APP.CF.alert("Select at least one non variable restriction", "warning");
      return;
    }

    var oGrouping = me.checkGroupByViewOptions.getValue().rb;

    var sActDesc = me.txtActivityLabelViewOptions.getValue();
    if (!sActDesc) {
      GLOBAL.APP.CF.alert("Write the activities description", "warning");
      return;
    }

    var bStack = false;
    if (me.txtStackActivityViewOptions.getValue()) var bStack = true;

    return Ext.JSON.encode({
      groupBy: oGrouping,
      definition: me.viewDefinitionDataForServer,
      variable: me.viewDefinitionDataForServerVariable,
      stacked: bStack,
      label: sActDesc,
    });
  },

  oprTestView: function () {
    var me = this;

    var sViewRequest = me.generateViewRequest();

    if (!sViewRequest) return;

    var sViewName = Ext.util.Format.trim(me.txtViewNameViewOptions.getValue());

    if (sViewName.length == 0) {
      GLOBAL.APP.CF.alert("The name of the view is missing.", "warning");
      return;
    }

    me.getContainer().body.mask("Wait ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "ActivityMonitor/tryView",
      success: function (response) {
        var response = Ext.JSON.decode(response.responseText);

        if (response.success == "true") {
          var plotsList = response.images;
          if (plotsList.length) {
            var oWindow = me.getContainer().createChildWindow(sViewName, false, 700, 500);

            var oPlotContainer = Ext.create("Ext.panel.Panel", {
              floatable: false,
              region: "center",
              header: false,
              autoScroll: true,
              layout: {
                type: "table",
                columns: 1,
              },
              dockedItems: [
                {
                  xtype: "toolbar",
                  dock: "top",
                  items: [
                    {
                      xtype: "button",
                      text: "Save view",
                      handler: function () {
                        var sViewRequest = me.generateViewRequest();

                        if (!sViewRequest) return;

                        var sViewName = Ext.util.Format.trim(me.txtViewNameViewOptions.getValue());

                        if (sViewName.length == 0) {
                          GLOBAL.APP.CF.alert("The name of the view is missing.", "warning");
                          return;
                        }

                        me.getContainer().body.mask("Wait ...");
                        Ext.Ajax.request({
                          url: GLOBAL.BASE_URL + "ActivityMonitor/saveView",
                          success: function (response) {
                            var response = Ext.JSON.decode(response.responseText);

                            if (response.success == "true") {
                              me.plotManagementListPanel.store.load();
                            } else {
                              GLOBAL.APP.CF.alert("Error: " + response.error, "warning");
                            }

                            me.getContainer().body.unmask();
                          },
                          failure: function (oRequest) {
                            GLOBAL.APP.CF.showAjaxErrorMessage(response);
                            me.getContainer().body.unmask();
                          },
                          params: {
                            plotRequest: sViewRequest,
                            viewName: sViewName,
                          },
                        });
                      },
                    },
                  ],
                },
              ],
            });

            for (var i = 0; i < plotsList.length; i++) {
              var oNewImage = Ext.create("Ext.Img", {
                src: GLOBAL.BASE_URL + "ActivityMonitor/getPlotImg?file=" + plotsList[i],
              });

              oPlotContainer.add(oNewImage);
            }

            oWindow.add(oPlotContainer);

            oWindow.show();
          }
        } else {
          GLOBAL.APP.CF.alert(response.error, "warning");
        }
        me.getContainer().body.unmask();
      },
      failure: function (oRequest) {
        GLOBAL.APP.CF.alert("Error: " + oRequest.statusText, "warning");
        me.getContainer().body.unmask();
      },
      params: {
        plotRequest: sViewRequest,
        timeLength: "day",
        viewName: sViewName,
      },
    });
  },
  __buildSystemViewer: function () {
    var me = this;

    me.systemPlotViewerMainPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      layout: "border",
      header: false,
      border: false,
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    me.systemPlotsTreeStore = Ext.create("Ext.data.TreeStore", {
      model: "DIRAC.ActivityMonitor.classes.ActivityTreeModel",
      fields: ["text", "component"],
      scope: me,
      proxy: {
        type: "ajax",
        url: GLOBAL.BASE_URL + "ActivityMonitor/getDynamicPlotViews",
      },
      root: {
        text: "/",
        id: "/Systems",
        expanded: true,
      },
      folderSort: true,
      sorters: [
        {
          property: "text",
          direction: "ASC",
        },
      ],
      listeners: {
        collapse: function (oNode, eOpts) {
          me.__oprUnsetPathAsExpanded(me.__getNodePath(oNode), true);
        },
        expand: function (oNode, eOpts) {
          me.__oprPathAsExpanded(me.__getNodePath(oNode), true);
        },
        scope: me,
      },
    });

    me.systemPlotViewerTreePanel = Ext.create("Ext.tree.TreePanel", {
      region: "west",
      width: 250,
      store: me.systemPlotsTreeStore,
      listeners: {
        itemclick: function (record, item, index, e, eOpts) {
          console.log(record);
          if (item.get("component") != "") {
            me.systemPlotViewerResultPanel.removeAll();
            var varData = {
              "sources.componentName": item.get("component"),
            };
            var oNewPlots = me.__buildPlotView("Dynamic component view", varData);

            me.systemPlotViewerResultPanel.add(oNewPlots);
          }
        },
      },
    });

    me.systemPlotViewerResultPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      region: "center",
      layout: "border",
      header: false,
      border: false,
      items: [],
    });

    me.systemPlotViewerMainPanel.add([me.systemPlotViewerTreePanel, me.systemPlotViewerResultPanel]);
    me.mainPanel.add([me.systemPlotViewerMainPanel]);
  },
  __oprUnsetPathAsExpanded: function (sPath) {
    var me = this;
    var oParts = sPath.split("/");

    // The first element is always empty
    var oTemp = me.expansionState;
    var oStartIndex = 0;

    if (sPath == "/") oStartIndex = 1;

    for (var i = oStartIndex; i < oParts.length; i++) {
      if (oParts[i] in oTemp) {
        if (i == oParts.length - 1) {
          delete oTemp[oParts[i]];
        } else {
          oTemp = oTemp[oParts[i]];
        }
      }
    }
  },

  __oprPathAsExpanded: function (sPath, bInsertIntoStructure) {
    var me = this;
    var oParts = sPath.split("/");

    // The first element is always empty
    var oTemp = me.expansionState;
    var oFound = true;

    var oStartIndex = 0;

    if (sPath == "/") oStartIndex = 1;

    for (var i = oStartIndex; i < oParts.length; i++) {
      if (oParts[i] in oTemp) {
        oTemp = oTemp[oParts[i]];
      } else {
        oFound = false;

        if (bInsertIntoStructure) {
          oTemp[oParts[i]] = {};
        }

        break;
      }
    }

    return oFound;
  },
  __getNodePath: function (oNode) {
    var sPath = "";
    var oCopyRefNode = oNode;
    while (oCopyRefNode) {
      if (oCopyRefNode.data.id) sPath = "/" + oCopyRefNode.data.id + sPath;
      else break;
      oCopyRefNode = oCopyRefNode.parentNode;
    }
    if (!sPath) return "/";
    return sPath;
  },
});
