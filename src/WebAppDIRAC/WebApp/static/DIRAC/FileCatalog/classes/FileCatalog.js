Ext.define("DIRAC.FileCatalog.classes.FileCatalog", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.util.*",
    "Ext.panel.Panel",
    "Ext.form.field.Text",
    "Ext.button.Button",
    "Ext.menu.Menu",
    "Ext.form.field.ComboBox",
    "Ext.layout.*",
    "Ext.form.field.TextArea",
    "Ext.form.field.Checkbox",
    "Ext.form.FieldSet",
    "Ext.Button",
    "Ext.util.*",
    "Ext.toolbar.Toolbar",
    "Ext.data.Record",
    "Ext.tree.Panel",
    "Ext.data.TreeStore",
    "Ext.data.NodeInterface",
    "Ext.form.field.TextArea",
    "Ext.Array",
    "Ext.grid.Panel",
    "Ext.form.field.Text",
    "Ext.grid.feature.Grouping",
    "Ext.tree.Panel",
    "Ext.data.TreeStore",
  ],

  loadState: function (oData) {
    var me = this;

    me.setLoading("Loading state ...");

    me.txtPathField.setValue(oData["path"]);

    /*
     * We starting adding one by one block, for each block we are going to
     * check if A) the parameter exists into the list of parameters and B)
     * the values are within the possible values We stop loading the blocks
     * only if some of the condition A) and B) are not fulfilled.
     *
     */
    me.__postponedLoadState(oData);

    // me.setLoading(false);
  },

  __postponedLoadState: function (oData) {
    var me = this;

    if (me.queryData == null) {
      Ext.Function.defer(me.__postponedLoadState, 1000, me, [oData]);
    } else {
      /*
       * We start loading block by block
       */

      me.__loadingStateDataStruct = {
        blocks: oData["blocks"],
        index: 0,
        error_message: "",
        next: function () {
          var oIter = this;

          if (oIter.blocks.length == 0) {
            oIter.finished = true;
            me.setLoading(false);
            return;
          }

          if (oIter.index == oIter.blocks.length - 1) {
            oIter.finished = true;
          }

          var oBlockData = oIter.blocks[oIter.index];

          /*
           * We check whether the parameter name exists
           */
          if (!(oBlockData[0] in me.queryData)) {
            oIter.finished = true;
            oIter.error_message = "'" + oBlockData[0] + "' was not found in the current set of metadata fields !";
            GLOBAL.APP.CF.alert(oIter.error_message, "error");
            me.setLoading(false);
            return;
          }

          /*
           * We check whether the values are defined for the parameter
           */
          switch (oBlockData[1]) {
            case "varchar(128)":
              var oDataArray = oBlockData[4].split(":::");

              for (var i = 0; i < oDataArray.length; i++) {
                if (me.queryData[oBlockData[0]].indexOf(oDataArray[i]) == -1) {
                  oIter.finished = true;
                  oIter.error_message = "'" + oDataArray[i] + "' value was not found as a value of the '" + oBlockData[0] + "' field !";
                  GLOBAL.APP.CF.alert(oIter.error_message, "error");
                  me.setLoading(false);
                  return;
                }
              }

              break;

            default:
              if (me.queryData[oBlockData[0]].indexOf(oBlockData[4]) == -1) {
                oIter.finished = true;
                oIter.error_message = "'" + oBlockData[4] + "' value was not found as a value of the '" + oBlockData[0] + "' field !";
                GLOBAL.APP.CF.alert(oIter.error_message, "error");
                me.setLoading(false);
                return;
              }
              break;
          }

          switch (oBlockData[1]) {
            case "varchar(128)":
              var oNewBlock = me.__getDropDownField(oBlockData[0], oBlockData[1]);
              me.queryPanel.add(oNewBlock);
              oNewBlock.items.getAt(2).setValue(oBlockData[4].split(":::"));

              if (oBlockData[3]) oNewBlock.items.getAt(2).setInverseSelection(true);

              me.__getQueryData(true);

              break;

            default:
              var oNewBlock = me.__getValueField(oBlockData[0], oBlockData[1]);
              me.queryPanel.add(oNewBlock);
              oNewBlock.items.getAt(2).setValue(oBlockData[4]);
              oNewBlock.items.getAt(1).setIconCls(oBlockData[2]);

              me.__getQueryData(true);

              break;
          }

          if (oIter.finished) {
            me.oprLoadFilesGridData();
            me.setLoading(false);
          }

          oIter.index++;
        },
        finished: false,
      };

      me.__loadingStateDataStruct.next();
    }
  },

  getStateData: function () {
    var me = this;
    var oReturn = {};

    var oSendData = [];

    for (var i = 0; i < me.queryPanel.items.length; i++) {
      var oBlock = me.queryPanel.items.getAt(i);

      var oItem = [oBlock.fieldName, oBlock.fieldType, oBlock.items.getAt(1).iconCls];

      if (oBlock.blockType == "string") {
        oItem.push(oBlock.items.getAt(2).isInverseSelection() ? 1 : 0);
        oItem.push(oBlock.items.getAt(2).getValue().join(":::"));
      } else {
        oItem.push(0);
        oItem.push(oBlock.items.getAt(2).getValue());
      }

      oSendData.push(oItem);
    }

    oReturn["path"] = me.txtPathField.getValue();
    oReturn["blocks"] = oSendData;

    return oReturn;
  },

  initComponent: function () {
    var me = this;

    me.launcher.title = "File Catalog";
    me.launcher.maximized = true;

    me.__loadingStateDataStruct = null;

    Ext.apply(me, {
      layout: "border",
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
      items: [],
    });

    me.callParent(arguments);
  },

  buildUI: function () {
    var me = this;

    /*-------------------------------------------------------------------------------------*/

    me.queryPanelToolbarCenter = new Ext.toolbar.Toolbar({
      dock: "bottom",
      layout: {
        pack: "center",
      },
      items: [],
    });

    me.btnSubmitLeftPanel = new Ext.Button({
      text: "Submit",

      iconCls: "dirac-icon-submit",
      handler: function () {
        if (me.__isEveryBlockBlured()) {
          me.oprLoadFilesGridData();
        } else {
          me.funcAfterEveryBlockGetsBlured = function () {
            me.oprLoadFilesGridData();
          };

          me.btnSubmitLeftPanel.focus();
        }
      },
      scope: me,
    });

    me.btnResetLeftPanel = new Ext.Button({
      text: "Refresh",

      iconCls: "dirac-icon-refresh",
      handler: function () {
        me.__getQueryData(true);
      },
      scope: me,
    });

    me.btnClearQuery = new Ext.Button({
      text: "Clear",

      iconCls: "dirac-icon-reset",
      handler: function () {
        for (var i = me.queryPanel.items.length - 1; i >= 0; i--) {
          var oBlock = me.queryPanel.items.getAt(i);

          me.queryPanel.remove(oBlock);
        }

        me.__getQueryData(true);
      },
      scope: me,
    });

    me.queryPanelToolbarCenter.add([me.btnSubmitLeftPanel, me.btnResetLeftPanel, me.btnClearQuery]);

    var queryPanelToolbarTop = new Ext.toolbar.Toolbar({
      dock: "top",
      layout: {
        pack: "center",
      },
      items: [],
    });

    queryPanelToolbarTop.add({
      xtype: "tbtext",
      text: "Path to start from:",
    });

    me.txtPathField = new Ext.form.field.Text({
      width: 200,
      value: "/",
      flex: 1,
      listeners: {
        blur: function (oField, oEvent, eOpts) {
          me.__getQueryData(true);
        },
      },
    });

    queryPanelToolbarTop.add(me.txtPathField);

    me.btnResetPath = new Ext.Button({
      text: "",

      iconCls: "dirac-icon-reset",
      handler: function () {
        me.txtPathField.setValue("/");
        me.__getQueryData(true);
      },
      scope: me,
    });

    queryPanelToolbarTop.add(me.btnResetPath);

    me.queryPanel = new Ext.create("Ext.panel.Panel", {
      title: "Query",
      region: "north",
      header: false,
      floatable: false,
      bodyBorder: false,
      margins: "0",
      width: 450,
      minWidth: 400,
      maxWidth: 550,
      bodyPadding: 0,
      autoScroll: true,
      split: true,
      height: 400,
    });

    /*-------------------------------------------------------------------------------------*/

    me.filesDataStore = new Ext.data.JsonStore({
      proxy: {
        type: "ajax",
        url: GLOBAL.BASE_URL + "FileCatalog/getFilesData",
        reader: {
          type: "json",
          rootProperty: "result",
          keepRawData: true,
        },
        timeout: 1800000,
        listeners: {
          exception: function (proxy, response, operation) {
            GLOBAL.APP.CF.showAjaxErrorMessage(response);
          },
        },
      },
      groupField: "dirname",
      fields: [
        {
          name: "dirname",
        },
        {
          name: "filename",
        },
        {
          name: "date",
        },
        {
          name: "size",
        },
        {
          name: "metadata",
        },
        {
          name: "fullfilename",
        },
      ],
      remoteSort: true,
      pageSize: 100,
      listeners: {
        load: function (oStore, records, successful, eOpts) {
          if (oStore.proxy.getReader().rawData["total"] == 0)
            GLOBAL.APP.CF.alert("There were no data matching your selection and access policy!", "info");

          me.pagingToolbar.updateStamp.setText("Updated: " + oStore.proxy.getReader().rawData["date"]);
          me.queryPanel.body.unmask();
          me.metadataCatalogGrid.body.unmask();
          me.queryPanelToolbarCenter.show();
        },
      },
    });

    me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
    me.checkboxFunctionDefinition += "var oChecked=this.checked;";
    me.checkboxFunctionDefinition += "var oElems=Ext.query('#" + me.id + " input.checkrow');";
    me.checkboxFunctionDefinition += "for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;";
    me.checkboxFunctionDefinition += '" class="meta-main-check-box"/>';

    me.pagingToolbar = {};
    me.pagingToolbar.updateStamp = new Ext.Button({
      disabled: true,
      text: "Updated: -",
    });

    me.pagingToolbar.pageSizeCombo = new Ext.form.field.ComboBox({
      allowBlank: false,
      displayField: "number",
      editable: false,
      maxLength: 4,
      maxLengthText: "The maximum value for this field is 1000",
      minLength: 1,
      minLengthText: "The minimum value for this field is 1",
      mode: "local",
      store: new Ext.data.ArrayStore({
        fields: ["number"],
        data: [[25], [50], [100], [200], [500], [1000]],
      }),
      triggerAction: "all",
      value: 100,
      width: 50,
    });

    me.pagingToolbar.pageSizeCombo.on(
      "change",
      function (combo, newValue, oldValue, eOpts) {
        var me = this;
        me.filesDataStore.pageSize = newValue;
        me.oprLoadFilesGridData();
      },
      me
    );

    me.pagingToolbar.btnGrouping = new Ext.Button({
      tooltip: "Ungroup",
      iconCls: "meta-ungroup-icon",
      handler: function () {
        if (me.groupingFeature.disabled) {
          me.groupingFeature.enable();
          me.pagingToolbar.btnGrouping.setTooltip("Ungroup");
          me.pagingToolbar.btnGrouping.setIconCls("meta-ungroup-icon");
          me.filesGrid.columns[1].hide();
        } else {
          me.groupingFeature.disable();
          me.pagingToolbar.btnGrouping.setTooltip("Group");
          me.pagingToolbar.btnGrouping.setIconCls("meta-group-icon");

          me.filesGrid.columns[1].show();
          me.filesGrid.columns[1].flex = 1;
          me.filesGrid.updateLayout();
        }
      },
      scope: me,
    });

    me.pagingToolbar.btnSaveFile = new Ext.Button({
      tooltip: "Save",
      iconCls: "dirac-icon-save",
      handler: function () {
        me.__getMetadataFile();
      },
      scope: me,
    });

    me.pagingToolbar.btnSaveFiles = new Ext.Button({
      tooltip: "Download selected<br>files in a .zip archive",
      iconCls: "dirac-icon-save",
      handler: function () {
        me.__getSelectedFiles();
      },
      scope: me,
    });

    me.pagingToolbar.btnSelectedFiles2Launchpad = new Ext.Button({
      tooltip: "Open job launchpad<br>with selected files",
      iconCls: "dirac-icon-submit",
      handler: function () {
        me.__getSelectedFiles2Launchpad();
      },
      scope: me,
    });

    me.pagingToolbar.btnShowQuery = new Ext.Button({
      tooltip: "Show Query",
      iconCls: "meta-query-icon",
      handler: function () {
        var oWindow = me.getContainer().createChildWindow("Show Query", false, 400, 300);

        var oTextArea = new Ext.create("Ext.form.field.TextArea", {
          value: me.lastSubmittedQuery,
          cls: "meta-textbox-help-window",
        });

        oWindow.add(oTextArea);
        oWindow.show();
      },
      scope: me,
    });

    /*
     * Read application settings from CS(WebApp section) to build panel
     */
    var pagingToolbarItems = [];
    if (
      GLOBAL.APP.configData.hasOwnProperty("configuration") &&
      GLOBAL.APP.configData.configuration.hasOwnProperty("FileCatalog") &&
      GLOBAL.APP.configData.configuration.FileCatalog.pagingToolbar
    ) {
      var items = GLOBAL.APP.configData.configuration.FileCatalog.pagingToolbar.replace(/, /g, ",").split(",");
      for (var i = 0; i < items.length; i++) {
        var element = items[i];
        pagingToolbarItems.push(me.pagingToolbar.hasOwnProperty(element) ? me.pagingToolbar[element] : element);
      }
    } else {
      pagingToolbarItems = [
        me.pagingToolbar.btnGrouping,
        me.pagingToolbar.btnSaveFile,
        me.pagingToolbar.btnShowQuery,
        "-",
        "-",
        "->",
        me.pagingToolbar.updateStamp,
        "-",
        "Items per page: ",
        me.pagingToolbar.pageSizeCombo,
        "-",
      ];
    }

    me.pagingToolbar.toolbar = Ext.create("Ext.toolbar.Paging", {
      store: me.filesDataStore,
      displayInfo: true,
      displayMsg: "Displaying topics {0} - {1} of {2}",
      items: pagingToolbarItems,
      emptyMsg: "No topics to display",
      prependButtons: true,
    });

    me.pagingToolbar.toolbar.items.insert(4, me.pagingToolbar.toolbar.items.items[21]);
    me.pagingToolbar.toolbar.items.insert(24, me.pagingToolbar.toolbar.items.items[7]);
    me.pagingToolbar.toolbar.items.insert(21, me.pagingToolbar.toolbar.items.items[22]);

    me.groupingFeature = Ext.create("Ext.grid.feature.Grouping", {
      groupHeaderTpl: '{columnName}: {name} ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})',
      hideGroupedHeader: true,
      startCollapsed: true,
      id: "directoryGrouping",
    });

    var oRightPanel = new Ext.create("Ext.panel.Panel", {
      region: "center",
      layout: "border",
      header: false,
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    me.treeFileCatalogStore = Ext.create("Ext.data.TreeStore", {
      proxy: {
        type: "ajax",
        url: GLOBAL.BASE_URL + "FileCatalog/getSubnodeFiles",
        reader: {
          type: "json",
          rootProperty: "nodes",
        },
      },
      root: {
        text: "/",
      },
      listeners: {
        nodebeforeexpand: function (oNode, eOpts) {
          me.treeFileCatalogStore.proxy.extraParams = {
            path: me.__getNodePath(oNode),
          };
        },
      },
    });

    me.treeFileCatalogStore.getRootNode().expand();

    me.fileCatalogTree = new Ext.create("Ext.tree.Panel", {
      region: "north",
      store: me.treeFileCatalogStore,
      header: false,
      height: 300,
      listeners: {
        beforeitemcontextmenu: function (oView, oNode, item, index, e, eOpts) {
          e.preventDefault();
          if (!oNode.isLeaf()) {
            me.sectionMenu.node = oNode;
            me.sectionMenu.showAt(e.getXY());
          }

          return false;
        },

        beforecontainercontextmenu: function (oView, e, eOpts) {
          return false;
        },
      },
    });

    me.filesGrid = Ext.create("Ext.grid.Panel", {
      region: "center",
      header: false,
      stateful: true,
      stateId: "FileCatalogGrid",
      store: me.filesDataStore,
      multiSelect: true,
      selType: "checkboxmodel",
      flex: 1,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      features: [me.groupingFeature],
      columns: [
        {
          header: "Directory",
          sortable: true,
          dataIndex: "dirname",
          hideable: false,
        },
        {
          header: "File",
          sortable: true,
          dataIndex: "filename",
          align: "left",
          hideable: false,
          flex: 1,
        },
        {
          header: "Date",
          sortable: true,
          dataIndex: "date",
          align: "left",
          width: 150,
        },
        {
          header: "Size",
          sortable: true,
          dataIndex: "size",
          align: "left",
        },
        {
          header: "Metadata",
          sortable: false,
          dataIndex: "metadata",
          align: "left",
          flex: 2,
        },
      ],
      tbar: me.pagingToolbar.toolbar,
    });

    /*
     * The grid for the metadata choice (part of the metadataOptionPanel)
     */

    me.metadataCatalogStore = new Ext.data.ArrayStore({
      fields: ["Type", "Name"],
      data: [],
    });

    me.metadataCatalogGrid = Ext.create("Ext.grid.Panel", {
      title: "Directory Metadata",
      region: "center",
      hideHeaders: true,
      stateful: true,
      stateId: "FileCatalogMetadata",
      store: me.metadataCatalogStore,
      bodyBorder: false,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      columns: [
        {
          width: 26,
          sortable: false,
          dataIndex: "Type",
          renderer: function (value, metaData, record, row, col, store, gridView) {
            return this.rendererType(value);
          },
          hideable: false,
          fixed: true,
          menuDisabled: true,
          align: "center",
        },
        {
          dataIndex: "Name",
          align: "left",
          sortable: true,
          hideable: false,
          sortState: "ASC",
          flex: 1,
        },
      ],
      rendererType: function (value) {
        if (value == "varchar(128)") {
          return '<img src="static/DIRAC/FileCatalog/images/new_string.png">';
        } else if (value == "int") {
          return '<img src="static/DIRAC/FileCatalog/images/new_int.png">';
        } else if (value == "datetime") {
          return '<img src="static/DIRAC/FileCatalog/images/new_date.png">';
        } else {
          return '<img src="static/DIRAC/FileCatalog/images/new_float.png">';
        }
      },
      listeners: {
        itemclick: function (oView, oRecord, item, index, e, eOpts) {
          if (me.__isEveryBlockBlured()) {
            switch (oRecord.get("Type")) {
              case "varchar(128)":
                me.queryPanel.add(me.__getDropDownField(oRecord.get("Name"), oRecord.get("Type")));
                break;
              default:
                me.queryPanel.add(me.__getValueField(oRecord.get("Name"), oRecord.get("Type")));
                break;
            }
          } else {
            me.funcAfterEveryBlockGetsBlured = function () {
              switch (oRecord.get("Type")) {
                case "varchar(128)":
                  me.queryPanel.add(me.__getDropDownField(oRecord.get("Name"), oRecord.get("Type")));
                  break;
                default:
                  me.queryPanel.add(me.__getValueField(oRecord.get("Name"), oRecord.get("Type")));
                  break;
              }
            };

            me.btnSubmitLeftPanel.focus();
          }
        },
      },
    });

    var oLeftPanel = new Ext.create("Ext.panel.Panel", {
      region: "west",
      layout: "border",
      header: false,
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
      width: 450,
      minWidth: 400,
      maxWidth: 550,
      items: [me.queryPanel, me.metadataCatalogGrid],
    });

    oLeftPanel.addDocked([queryPanelToolbarTop, me.queryPanelToolbarCenter]);

    oRightPanel.add([me.fileCatalogTree, me.filesGrid]);

    me.add([oLeftPanel, oRightPanel]);

    me.fieldsTypes = null;
    me.queryData = null;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "FileCatalog/getMetadataFields",
      method: "POST",
      params: {},
      scope: me,
      success: function (oReponse) {
        oResponse = Ext.JSON.decode(oReponse.responseText);

        if (oResponse.success == "true") {
          // populating the fields for the first time

          me.fieldsTypes = oResponse.result;

          me.__getQueryData(true);
        } else {
          GLOBAL.APP.CF.alert(oResponse.error, "error");
        }
      },
    });

    me.funcAfterEveryBlockGetsBlured = null;
    me.lastSubmittedQuery = "";

    me.sectionMenu = new Ext.menu.Menu({
      width: 150,
      items: [
        {
          text: "Set as starting path",
          listeners: {
            click: me.oprSetStartPath,
          },
        },
      ],
      moduleObject: me,
    });
  },

  oprSetStartPath: function (oItem, e, eOpts) {
    var oNode = oItem.parentMenu.node;
    var oModule = oItem.parentMenu.moduleObject;

    oModule.txtPathField.setValue(oModule.__getNodePath(oNode));
    oModule.__getQueryData(true);
  },

  oprLoadFilesGridData: function () {
    // me.metadataCatalogGrid.body.mask("Wait ...");
    var me = this;

    me.queryPanel.body.mask("Wait ...");
    me.metadataCatalogGrid.body.mask("Wait ...");
    me.queryPanelToolbarCenter.hide();

    var oSendData = {};

    for (var i = 0; i < me.queryPanel.items.length; i++) {
      var oBlock = me.queryPanel.items.getAt(i);
      var oData = me.__getValueBlockDescription(oBlock);

      if (oData[0] != "") oSendData["p." + oBlock.fieldName + "." + oData[0]] = oData[1];
    }

    oSendData.path = me.txtPathField.getValue();

    me.lastSubmittedQuery = me.__restructureQueryForShow(oSendData);

    // set those data as extraParams in
    me.filesGrid.store.proxy.extraParams = oSendData;
    me.filesGrid.store.currentPage = 1;
    me.filesGrid.store.load();
  },

  __restructureQueryForShow: function (oSendData) {
    var req = {
      selection: {},
      path: "",
    };

    for (var sParam in oSendData) {
      var oParts = sParam.split(".");

      if (oParts.length != 3) continue;

      var sName = oParts[1];
      var sLogic = oParts[2];
      var oValue = oSendData[sParam].split("|");

      if (!(sName in req["selection"])) req["selection"][sName] = {};

      if (!(sLogic in req["selection"][sName])) {
        if (oValue[0] == "v") {
          req["selection"][sName][sLogic] = "";
        } else if (oValue[0] == "s") {
          req["selection"][sName][sLogic] = [];
        }
      }

      if (oValue[0] == "v") {
        req["selection"][sName][sLogic] = oValue[1];
      } else if (oValue[0] == "s") {
        req["selection"][sName][sLogic] = oValue[1].split(":::");
      }
    }

    if ("path" in oSendData) req["path"] = oSendData["path"];

    var sText = JSON.stringify(req["selection"]);

    var iTab = 0;
    var sNewText = "";

    for (var i = 0; i < sText.length; i++) {
      switch (sText.charAt(i)) {
        case "{":
          var sTabs = "";
          for (var j = 0; j <= iTab; j++) sTabs += "\t";
          sNewText += "{\n" + sTabs;
          iTab++;
          break;
        case "}":
          var sTabs = "";
          for (var j = 0; j < iTab - 1; j++) sTabs += "\t";

          if (i + 1 < sText.length) {
            if (sText.charAt(i + 1) == ",") {
              sNewText += "\n" + sTabs + "},\n" + sTabs;
              i++;
            } else {
              sNewText += "\n" + sTabs + "}\n" + sTabs;
            }
          } else {
            sNewText += "\n" + sTabs + "}\n" + sTabs;
          }
          iTab--;
          break;

        default:
          sNewText += sText.charAt(i);
      }
    }

    return "metaDict = " + sNewText + 'path = "' + req["path"] + '"';
  },

  onItemLogicOperationClick: function (oItem, e, eOpts) {
    var oButton = oItem.up("button");
    oButton.setIconCls(oItem.iconCls);
    oButton.moduleObject.__getQueryData(true);
  },

  __removeLastBlockIfEmpty: function () {
    var me = this;

    if (me.queryPanel.items.length > 0) {
      var oLastBlock = me.queryPanel.items.getAt(me.queryPanel.items.length - 1);

      var oDropDown = oLastBlock.items.getAt(2);

      if (oLastBlock.blockType == "string") {
        if (oDropDown.getValue().length == 0) {
          me.queryPanel.remove(oLastBlock);
        }
      } else {
        if (oDropDown.getValue() == null) {
          me.queryPanel.remove(oLastBlock);
        }
      }
    }
  },
  __removeBlock: function (oBlock) {
    var me = this;
    me.queryPanel.remove(oBlock);
    me.__getQueryData(true);
  },

  __getDropDownField: function (sName, sType) {
    var me = this;

    me.__removeLastBlockIfEmpty();

    var oDropDown = Ext.create("Ext.dirac.utils.DiracBoxSelect", {
      //forceSelection: false,
      queryMode: "local",
      displayField: "text",
      valueField: "value",
      width: 250,
      margin: 3,
      focusBlurState: 0,
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: me.__getFieldOptions(sName),
      }),
      listeners: {
        blur: function (oField, oEvent, eOpts) {
          oField.focusBlurState = 0;
          me.__getQueryData(true);
        },
        focus: function (oField, oEvent, eOpts) {
          oField.focusBlurState = 1;
        },
        expand: function (oField, eOpts) {
          me.queryPanel.body.mask("Wait ...");
          oField.collapse();
          me.__expandMenuBeforeExpandMenu(oPanel);
        },
      },
      onClearButtonAfterClick: function (oSelectBox) {
        me.__getQueryData(true);
      },
      onNotButtonAfterClick: function (oSelectBox) {
        me.__getQueryData(true);
      },
      onItemRemovedClick: function (oSelectBox) {
        me.__getQueryData(true);
      },
    });

    var oPanel = Ext.create("Ext.container.Container", {
      layout: {
        type: "hbox",
        // align : 'stretch',
        margin: 3,
      },
      fieldName: sName,
      fieldType: sType,
      blockType: "string",
      items: [
        {
          xtype: "panel",
          html: "<div style='padding:7px 0px 0px 5px;'>" + sName + "</div>",
          border: false,
          flex: 1,
        },
        {
          xtype: "button",
          iconCls: "meta-in-icon",
          margin: 3,
        },
        oDropDown,
        {
          xtype: "button",
          iconCls: "dirac-icon-reset",
          margin: 3,
          handler: function () {
            me.__removeBlock(oPanel);
          },
        },
      ],
    });

    return oPanel;
  },
  __getValueField: function (sName, sType) {
    var me = this;

    me.__removeLastBlockIfEmpty();

    var oDropDown = Ext.create("Ext.form.field.ComboBox", {
      queryMode: "local",
      displayField: "text",
      valueField: "value",
      width: 250,
      margin: 3,
      focusBlurState: 0,
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: me.__getFieldOptions(sName),
      }),
      listeners: {
        blur: function (oField, oEvent, eOpts) {
          oField.focusBlurState = 0;
          me.__getQueryData(true);
        },
        focus: function (oField, oEvent, eOpts) {
          oField.focusBlurState = 1;
        },
        expand: function (oField, eOpts) {
          me.queryPanel.body.mask("Wait ...");
          oField.collapse();
          me.__expandMenuBeforeExpandMenu(oPanel);
        },
      },
    });

    var oPanel = Ext.create("Ext.container.Container", {
      layout: {
        type: "hbox",
        // align : 'stretch',
        margin: 3,
      },
      fieldName: sName,
      fieldType: sType,
      blockType: "value",
      items: [
        {
          xtype: "panel",
          html: "<div style='padding:7px 0px 0px 5px;'>" + sName + "</div>",
          border: false,
          flex: 1,
        },
        {
          xtype: "button",
          iconCls: "meta-equal-icon",
          margin: 3,
          moduleObject: me,
          menu: [
            {
              text: "Equal to",
              iconCls: "meta-equal-icon",
              width: 200,
              listeners: {
                click: me.onItemLogicOperationClick,
              },
            },
            {
              text: "Not equal to",
              iconCls: "meta-nequal-icon",
              width: 200,
              listeners: {
                click: me.onItemLogicOperationClick,
              },
            },
            {
              text: "Greater than",
              iconCls: "meta-great-icon",
              width: 200,
              listeners: {
                click: me.onItemLogicOperationClick,
              },
            },
            {
              text: "Less than",
              iconCls: "meta-less-icon",
              width: 200,
              listeners: {
                click: me.onItemLogicOperationClick,
              },
            },
            {
              text: "Greater than or equal to",
              iconCls: "meta-gequal-icon",
              width: 200,
              listeners: {
                click: me.onItemLogicOperationClick,
              },
            },
            {
              text: "Less than or equal to",
              iconCls: "meta-lequal-icon",
              width: 200,
              listeners: {
                click: me.onItemLogicOperationClick,
              },
            },
          ],
        },
        oDropDown,
        {
          xtype: "button",
          iconCls: "dirac-icon-reset",
          margin: 3,
          handler: function () {
            me.__removeBlock(oPanel);
          },
        },
      ],
    });

    return oPanel;
  },

  __isEveryBlockBlured: function () {
    var me = this;

    var bBlured = true;

    for (var i = 0; i < me.queryPanel.items.length; i++) {
      var oBlock = me.queryPanel.items.getAt(i);
      if (oBlock.focusBlurState == 1) {
        bBlured = false;
        break;
      }
    }

    return bBlured;
  },

  __expandMenuBeforeExpandMenu: function (oThisBlock) {
    var me = this;
    // collect already selected options

    var sBlockType = oThisBlock.blockType;
    var oDropDown = oThisBlock.items.getAt(2);

    var ifValue = true;

    switch (sBlockType) {
      case "value":
        if (oDropDown.getValue() == null) ifValue = false;
        break;
      case "string":
        if (oDropDown.getValue().length == 0) ifValue = false;
        break;
    }

    if (ifValue) {
      var oSendData = {};

      for (var i = 0; i < me.queryPanel.items.length; i++) {
        var oBlock = me.queryPanel.items.getAt(i);

        if (oThisBlock != oBlock) {
          var oData = me.__getValueBlockDescription(oBlock);

          if (oData[0] != "") oSendData["p." + oBlock.fieldName + "." + oData[0]] = oData[1];
        }
      }

      oSendData["path"] = me.txtPathField.getValue();

      Ext.Ajax.request({
        url: GLOBAL.BASE_URL + "FileCatalog/getQueryData",
        method: "POST",
        params: oSendData,
        scope: me,
        timeout: 1800000,
        success: function (oReponse) {
          oResponse = Ext.JSON.decode(oReponse.responseText);

          if (oResponse.success == "true") {
            var oBackData = oResponse.result;
            var oDropDown = oThisBlock.items.getAt(2);

            oDropDown.suspendEvents(false);

            var oList = [];
            for (var i = 0; i < oBackData[oThisBlock.fieldName].length; i++)
              oList.push([oBackData[oThisBlock.fieldName][i], oBackData[oThisBlock.fieldName][i]]);

            var oNewStore = new Ext.data.ArrayStore({
              fields: ["value", "text"],
              data: oList,
            });

            switch (sBlockType) {
              case "value":
                oDropDown.bindStore(oNewStore);
                break;
              case "string":
                oDropDown.setStore(oNewStore);
                break;
            }

            oDropDown.collapse();
            oDropDown.expand();

            oDropDown.resumeEvents();
            me.queryPanel.body.unmask();

            if (me.funcAfterEveryBlockGetsBlured != null) {
              me.funcAfterEveryBlockGetsBlured();
              me.funcAfterEveryBlockGetsBlured = null;
            }
          } else {
            GLOBAL.APP.CF.alert(oResponse.error, "error");
            me.queryPanel.body.unmask();
          }
        },
      });
    } else {
      oDropDown.suspendEvents(false);

      var oNewStore = new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: me.__getFieldOptions(oThisBlock.fieldName),
      });

      switch (sBlockType) {
        case "value":
          oDropDown.bindStore(oNewStore);
          break;
        case "string":
          oDropDown.setStore(oNewStore);
          break;
      }

      oDropDown.collapse();
      oDropDown.expand();

      oDropDown.resumeEvents();
      me.queryPanel.body.unmask();
    }
  },

  __getSelectedFiles: function () {
    var me = this;
    var oSendData = [];

    var selection = me.filesGrid.getSelectionModel().getSelection();

    for (var i = 0; i < selection.length; i++) {
      oSendData.push(selection[i].get("fullfilename"));
    }

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "FileCatalog/getSelectedFiles",
      params: {
        path: oSendData.join(","),
      },
      scope: me,
      success: function (response) {
        var me = this;
        var response = Ext.JSON.decode(response.responseText);

        if (response["success"] == "true") {
          archivePath = response["archivePath"];
          var sUrl = GLOBAL.BASE_URL + "FileCatalog/getSelectedFiles?archivePath=" + encodeURIComponent(archivePath);
          window.open(sUrl, "Data zip archive", "width=400,height=200");
        } else {
          GLOBAL.APP.CF.alert(response["lfn"] + ":\n  " + response["error"], "error");
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
    });
  },

  __getSelectedFiles2Launchpad: function () {
    var me = this;

    var oSendData = [];

    var selection = me.filesGrid.getSelectionModel().getSelection();

    for (var i = 0; i < selection.length; i++) {
      oSendData.push(selection[i].get("fullfilename"));
    }

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "JobLaunchpad/getLaunchpadSetupWithLFNs?path=" + encodeURIComponent(oSendData.join(",")),
      success: function (response) {
        if (response.status == 200) {
          var data = {};
          data = Ext.JSON.decode(response.responseText);

          var oSetupData = { data: {} };
          oSetupData.data.InputData = data["result"]["InputData"][1];

          GLOBAL.APP.MAIN_VIEW.createNewModuleContainer({
            objectType: "app",
            moduleName: "DIRAC.JobLaunchpad.classes.JobLaunchpad",
            setupData: oSetupData,
          });
        } else {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
    });
  },

  __getMetadataFile: function () {
    var me = this;

    var oSendData = [];

    for (var i = 0; i < me.queryPanel.items.length; i++) {
      var oBlock = me.queryPanel.items.getAt(i);
      var oData = me.__getValueBlockDescription(oBlock);

      if (oData[0] != "") oSendData.push(oBlock.fieldName + "|" + oData[0] + "|" + oData[1]);
    }

    if (oSendData.length > 0)
      location.href =
        GLOBAL.BASE_URL +
        "FileCatalog/getMetadataFilesInFile?path=" +
        encodeURIComponent(me.txtPathField.getValue()) +
        "&selection=" +
        encodeURIComponent(oSendData.join("<|>"));
  },

  __getQueryData: function (bRefreshMetadataList) {
    var me = this;
    // collect already selected options
    me.metadataCatalogGrid.body.mask("Wait ...");

    var oSendData = {};

    for (var i = 0; i < me.queryPanel.items.length; i++) {
      var oBlock = me.queryPanel.items.getAt(i);
      var oData = me.__getValueBlockDescription(oBlock);

      if (oData[0] != "") oSendData["p." + oBlock.fieldName + "." + oData[0]] = oData[1];
    }

    oSendData["path"] = me.txtPathField.getValue();

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "FileCatalog/getQueryData",
      method: "POST",
      params: oSendData,
      scope: me,
      timeout: 1800000,
      success: function (oReponse) {
        oResponse = Ext.JSON.decode(oReponse.responseText);

        if (oResponse.success == "true") {
          me.queryData = oResponse.result;

          if (bRefreshMetadataList) {
            me.__oprRefreshMetadataFieldsList();
          }

          me.metadataCatalogGrid.body.unmask();

          if (me.funcAfterEveryBlockGetsBlured != null) {
            me.funcAfterEveryBlockGetsBlured();
            me.funcAfterEveryBlockGetsBlured = null;
          }

          if (me.__loadingStateDataStruct != null) {
            if (!me.__loadingStateDataStruct.finished) {
              me.__loadingStateDataStruct.next();
            }
          }
        } else {
          GLOBAL.APP.CF.alert(oResponse.error, "error");
          me.metadataCatalogGrid.body.unmask();
        }
      },
    });
  },

  __refreshQueryFieldsOptions: function () {
    var me = this;

    for (var i = 0; i < me.queryPanel.items.length; i++) {
      var oBlock = me.queryPanel.items.getAt(i);

      var oDropDown = oBlock.items.getAt(2);

      var oValue = oDropDown.getValue();

      oDropDown.suspendEvents(false);

      var oNewStore = new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: me.__getFieldOptions(oBlock.fieldName),
      });

      oDropDown.bindStore(oNewStore);

      oDropDown.setValue(oValue);

      oDropDown.resumeEvents();
    }
  },

  __getValueBlockDescription: function (oBlock) {
    var me = this;
    var oButton = oBlock.items.getAt(1);
    var oDropDown = oBlock.items.getAt(2);

    var oRet = ["", ""];

    if (oBlock.blockType == "string") {
      if (oDropDown.getValue().length > 0) {
        var sSign = me.__getSignByIconCls(oButton.iconCls, oDropDown.isInverseSelection());
        oRet = [sSign, "s" + "|" + oDropDown.getValue().join(":::")];
      }
    } else {
      if (oDropDown.getValue() != null) {
        var sSign = me.__getSignByIconCls(oButton.iconCls, false);
        oRet = [sSign, "v" + "|" + oDropDown.getValue()];
      }
    }

    return oRet;
  },

  __getSignByIconCls: function (sIconCls, bNot) {
    var sSign = "";

    switch (sIconCls) {
      case "meta-equal-icon":
        if (bNot) {
          sSign = "!=";
        } else {
          sSign = "=";
        }
        break;
      case "meta-gequal-icon":
        if (bNot) {
          sSign = "<";
        } else {
          sSign = ">=";
        }
        break;
      case "meta-great-icon":
        if (bNot) {
          sSign = "<=";
        } else {
          sSign = ">";
        }
        break;
      case "meta-lequal-icon":
        if (bNot) {
          sSign = ">";
        } else {
          sSign = "<=";
        }
        break;
      case "meta-less-icon":
        if (bNot) {
          sSign = ">=";
        } else {
          sSign = "<";
        }
        break;
      case "meta-nequal-icon":
        if (bNot) {
          sSign = "=";
        } else {
          sSign = "!=";
        }
        break;
      case "meta-in-icon":
        if (bNot) {
          sSign = "nin";
        } else {
          sSign = "in";
        }
        break;
    }

    return sSign;
  },

  __oprRefreshMetadataFieldsList: function () {
    var me = this;

    me.metadataCatalogStore.removeAll();

    var oNewData = [];

    for (var key in me.queryData) {
      if (me.queryData[key].length > 0) {
        oNewData.push([me.fieldsTypes[key], key]);
      }
    }

    for (var i = 0; i < oNewData.length - 1; i++) {
      for (var j = i + 1; j < oNewData.length; j++) {
        if (oNewData[i][1].toLowerCase() > oNewData[j][1].toLowerCase()) {
          var elem = oNewData[i];
          oNewData[i] = oNewData[j];
          oNewData[j] = elem;
        }
      }
    }

    me.metadataCatalogStore.add(oNewData);
  },

  __getFieldOptions: function (sName) {
    var me = this;

    var oList = [];
    for (var i = 0; i < me.queryData[sName].length; i++) oList.push([me.queryData[sName][i], me.queryData[sName][i]]);

    return oList;
  },
  __getNodePath: function (oNode) {
    var sPath = "";
    var oCopyRefNode = oNode;

    if (oCopyRefNode.get("text") == "/") {
      sPath = "/";
    } else {
      while (oCopyRefNode) {
        if (oCopyRefNode.get("text") == "/") break;

        // if (oCopyRefNode.get("text"))
        sPath = "/" + oCopyRefNode.get("text") + sPath;
        // else
        // break;
        oCopyRefNode = oCopyRefNode.parentNode;
      }
      if (!sPath) return "/";
    }
    return sPath;
  },
});
