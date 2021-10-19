Ext.define("DIRAC.VMDirac.classes.VMDirac", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.util.*",
    "Ext.layout.*",
    "Ext.panel.Panel",
    "Ext.toolbar.Toolbar",
    "Ext.Button",
    "Ext.button.Button",
    "Ext.menu.Menu",
    "Ext.form.FieldSet",
    "Ext.form.field.Date",
    "Ext.form.field.Text",
    "Ext.form.field.ComboBox",
    "Ext.form.field.TextArea",
    "Ext.form.field.Checkbox",
    "Ext.dirac.utils.DiracMultiSelect",
    "Ext.data.Record",
  ],

  loadState: function (oData) {
    var me = this;
  },

  /*
   * PARTLY DONE
   */
  getStateData: function () {
    var me = this;
    var oReturn = {};

    return oReturn;
  },

  initComponent: function () {
    var me = this;

    me.launcher.title = "VMDirac";
    me.launcher.maximized = true;

    var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();
    var iDim = Math.floor(Math.min(oDimensions[0], oDimensions[1]) / 2);
    me.launcher.width = 2 * iDim;
    me.launcher.height = iDim;

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

    me._plot_counter = 0;
    me._can_stop_vm = "";

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "VMDirac/checkVmWebOperation",
      params: {
        operation: "Web",
      },
      scope: me,
      success: function (response) {
        var response = Ext.JSON.decode(response.responseText);
        if (response.success == "true") {
          me._can_stop_vm = response.Value;
        }
      },
      failure: function (response) {
        Ext.dirac.system_info.msg("Notification", "Operation failed due to a network error.<br/> Please try again later !");
      },
    });

    me.cbPlot = Ext.create("Ext.form.ComboBox", {
      store: new Ext.data.SimpleStore({
        fields: ["value", "key"],
        data: [
          ["load", "Average Load"],
          ["running", "Running VMs"],
          ["runningbyendpoint", "Run. VMs By EndPoint"],
          ["runningbyrunningpod", "Run. VMs By RunningPod"],
          ["runningbyimage", "Run. VMs By Image"],
          ["jobs", "Started Jobs"],
          ["transferbytes", "Transferred Data"],
          ["transferfiles", "Transferred Files"],
        ],
      }),
      displayField: "key",
      valueField: "value",
      labelAlign: "left",
      fieldLabel: "Plot",
      value: "load",
      labelWidth: 70,
      padding: "2px 5px 2px 5px",
      width: 300,
      editable: false,
    });

    me.cbTimespan = Ext.create("Ext.form.ComboBox", {
      store: new Ext.data.SimpleStore({
        fields: ["value", "key"],
        data: [
          [86400, "Last day"],
          [86400 * 7, "Last week"],
          [86400 * 30, "Last month"],
          [0, "All History"],
        ],
      }),
      displayField: "key",
      valueField: "value",
      labelAlign: "left",
      fieldLabel: "Timespan",
      value: 0,
      labelWidth: 70,
      padding: "2px 5px 2px 5px",
      editable: false,
    });

    me.cbRotate = Ext.create("Ext.form.ComboBox", {
      store: new Ext.data.SimpleStore({
        fields: ["value", "key"],
        data: [
          [0, "No Rotation"],
          [15, "15 sec."],
          [30, "30 sec."],
          [60, "1 min."],
        ],
      }),
      displayField: "key",
      valueField: "value",
      labelAlign: "left",
      fieldLabel: "Plot Rotation",
      value: 0,
      labelWidth: 70,
      padding: "2px 5px 2px 5px",
      width: 200,
      editable: false,
    });

    me._rotate_plot_object = null;

    me.cbRotate.on(
      "change",
      function (combo, newValue, oldValue, eOpts) {
        if (newValue == 0) {
          if (me._rotate_plot_object != null) {
            clearInterval(me._rotate_plot_object);
          }
        } else {
          me._rotate_plot_object = setInterval(function () {
            me.showNextTab();
          }, 1000 * newValue);
        }
      },
      me
    );

    me.btnCreatePlot = Ext.create("Ext.button.Button", {
      text: "Create Plot",
      handler: function () {
        me.oprDrawPlot();
      },
      iconCls: "dirac-icon-plus",
    });

    var oSceltTopPanel = Ext.create("Ext.panel.Panel", {
      region: "center",
      layout: "border",
      header: false,
      tbar: Ext.create("Ext.toolbar.Toolbar", {
        items: [me.cbPlot, me.cbTimespan, "-", me.cbRotate, "->", me.btnCreatePlot],
      }),
    });

    me.chartPanel = Ext.create("Ext.tab.Panel", {
      region: "center",
      header: false,
      border: false,
    });

    oSceltTopPanel.add(me.chartPanel);

    me.dataStore = new Ext.data.JsonStore({
      proxy: {
        type: "ajax",
        url: GLOBAL.BASE_URL + "VMDirac/getInstancesList",
        reader: {
          type: "json",
          rootProperty: "result",
        },
        timeout: 1800000,
      },
      fields: [
        "inst_RunningPod",
        "inst_Name",
        "inst_Endpoint",
        "inst_ErrorMessage",
        "inst_InstanceID",
        "inst_Status",
        "inst_UniqueID",
        "img_VMImageID",
        "img_Name",
        "inst_VMImageID",
        "inst_PublicIP",
        "inst_LastUpdate",
        "inst_Load",
        "inst_Uptime",
        "inst_Jobs",
      ],
      sorters: "inst_InstanceID",
      remoteSort: true,
      autoLoad: true,
      pageSize: 100,

      listeners: {
        load: function (oStore, records, successful, eOpts) {
          var bResponseOK = oStore.proxy.reader.rawData["success"] == "true";

          if (!bResponseOK) {
            GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "info");

            if (parseInt(oStore.proxy.reader.rawData["total"], 10) == 0) {
              me.dataStore.removeAll();
            }
          } else {
            if (oStore.proxy.reader.rawData) me.pagingToolbar.updateStamp.setText("Updated: " + oStore.proxy.reader.rawData["date"]);

            /*
             * me.dataStore.remoteSort = false; me.dataStore.sort();
             * me.dataStore.remoteSort = true;
             */
          }
        },
      },
    });

    me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
    me.checkboxFunctionDefinition += "var oChecked=this.checked;";
    me.checkboxFunctionDefinition += "var oElems=Ext.query('#" + me.id + " input.checkrow');";
    me.checkboxFunctionDefinition += "for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;";
    me.checkboxFunctionDefinition += '" class="vm-main-check-box"/>';

    me.pagingToolbar = {};
    me.pagingToolbar.updateStamp = new Ext.Button({
      disabled: true,
      text: "Updated: -",
    });

    me.btnStopVms = new Ext.Button({
      text: "",
      tooltip: "Stop selected virtual machines",
      iconCls: "dirac-icon-stop",
      handler: function () {
        me.oprStopSelectedVirtualMachines();
      },
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
      store: new Ext.data.SimpleStore({
        fields: ["number"],
        data: [[25], [50], [100], [200], [500], [1000]],
      }),
      triggerAction: "all",
      value: 100,
      width: 50,
    });

    me.pagingToolbar.vmStatusCombo = new Ext.form.field.ComboBox({
      value: "All",
      displayField: "status",
      valueField: "status",
      editable: false,
      mode: "local",
      store: new Ext.data.SimpleStore({
        fields: ["status"],
        data: [["All"], ["New"], ["Submitted"], ["Wait_ssh_context"], ["Contextualizing"], ["Running"], ["Halted"], ["Stalled"], ["Stopping"]],
      }),
      triggerAction: "all",
    });

    me.pagingToolbar.pageSizeCombo.on(
      "change",
      function (combo, newValue, oldValue, eOpts) {
        var me = this;
        me.dataStore.pageSize = newValue;
        me.oprLoadGridData();
      },
      me
    );

    me.pagingToolbar.vmStatusCombo.on(
      "change",
      function (combo, newValue, oldValue, eOpts) {
        var me = this;
        me.oprLoadGridData();
      },
      me
    );

    var pagingToolbarItems = [];

    if (me._can_stop_vm == "Auth") {
      pagingToolbarItems = [
        me.btnStopVms,
        "->",
        "VM Status: ",
        me.pagingToolbar.vmStatusCombo,
        "-",
        me.pagingToolbar.updateStamp,
        "-",
        "Items per page: ",
        me.pagingToolbar.pageSizeCombo,
        "-",
      ];
    } else {
      me.btnStopVms = null;
      pagingToolbarItems = [
        "VM Status: ",
        me.pagingToolbar.vmStatusCombo,
        "-",
        me.pagingToolbar.updateStamp,
        "-",
        "Items per page: ",
        me.pagingToolbar.pageSizeCombo,
        "-",
      ];
    }

    me.pagingToolbar.toolbar = Ext.create("Ext.toolbar.Paging", {
      store: me.dataStore,
      displayInfo: true,
      displayMsg: "Displaying {0} - {1} of {2}",
      items: pagingToolbarItems,
      emptyMsg: "No topics to display",
      prependButtons: true,
    });

    me.contextGridMenu = new Ext.menu.Menu({
      items: [
        {
          handler: function () {
            me.showHistoryLogWindow();
          },
          iconCls: "dirac-icon-list",
          text: "Show History",
        },
      ],
    });

    me.gridPanel = Ext.create("Ext.grid.Panel", {
      region: "south",
      height: 300,
      store: me.dataStore,
      header: false,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      columns: [
        {
          header: me.checkboxFunctionDefinition,
          name: "checkBox",
          width: 26,
          sortable: false,
          dataIndex: "inst_InstanceID",
          renderer: function (value, metaData, record, row, col, store, gridView) {
            return this.rendererChkBox(value);
          },
          hideable: false,
          fixed: true,
          menuDisabled: true,
          align: "center",
        },
        {
          header: "InstanceID",
          width: 80,
          sortable: true,
          dataIndex: "inst_InstanceID",
        },
        {
          header: "Image",
          width: 120,
          sortable: true,
          dataIndex: "img_Name",
        },
        {
          header: "RunningPod",
          width: 120,
          sortable: true,
          dataIndex: "inst_RunningPod",
        },
        {
          header: "EndPoint",
          width: 100,
          sortable: true,
          dataIndex: "inst_Endpoint",
        },
        {
          header: "Status",
          width: 100,
          sortable: true,
          dataIndex: "inst_Status",
        },
        {
          header: "DIRAC VM ID",
          width: 100,
          sortable: true,
          dataIndex: "inst_Name",
        },
        {
          header: "Endpoint VM ID",
          width: 220,
          sortable: true,
          dataIndex: "inst_UniqueID",
        },
        {
          header: "IP",
          width: 100,
          sortable: true,
          dataIndex: "inst_PublicIP",
        },
        {
          header: "Load",
          width: 50,
          sortable: true,
          dataIndex: "inst_Load",
          renderer: function (value, metaData, record, row, col, store, gridView) {
            return this.renderLoad(value);
          },
        },
        {
          header: "Uptime",
          width: 75,
          sortable: true,
          dataIndex: "inst_Uptime",
          renderer: function (value, metaData, record, row, col, store, gridView) {
            return this.renderUptime(value);
          },
        },
        {
          header: "Jobs",
          width: 50,
          sortable: true,
          dataIndex: "inst_Jobs",
        },
        {
          header: "Last Update (UTC)",
          width: 125,
          sortable: true,
          dataIndex: "inst_LastUpdate",
        },
        {
          header: "Error",
          flex: 1,
          sortable: true,
          dataIndex: "inst_ErrorMessage",
        },
      ],
      rendererChkBox: function (val) {
        return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
      },
      renderLoad: function (value) {
        return value.toFixed(2);
      },
      renderUptime: function (value) {
        var hour = parseInt(value / 3600);
        var min = parseInt((value % 3600) / 60);
        var sec = parseInt(value % 60);

        if (min < 10) min = "0" + min;
        if (sec < 10) sec = "0" + sec;
        return "" + hour + ":" + min + ":" + sec;
      },
      tbar: me.pagingToolbar.toolbar,
      listeners: {
        beforecellcontextmenu: function (oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
          e.preventDefault();
          // var oJobId =
          // GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid,
          // "CurrentJobID");
          // var oStatus =
          // GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid,
          // "Status");
          me.contextGridMenu.showAt(e.xy);
          return false;
        },
      },
    });

    me.add([oSceltTopPanel, me.gridPanel]);
  },

  getPlotId: function () {
    var me = this;
    return me._plot_counter++;
  },

  showNextTab: function () {
    var me = this;

    if (me.chartPanel.items.length > 0) {
      var oActiveTab = me.chartPanel.getActiveTab();

      for (var i = 0; i < me.chartPanel.items.length; i++) {
        var item = me.chartPanel.items.getAt(i);

        if (item.getId() == oActiveTab.getId()) {
          var iNewIndex = (i + 1) % me.chartPanel.items.length;
          me.chartPanel.setActiveTab(iNewIndex);
          break;
        }
      }
    }
  },

  oprLoadGridData: function () {
    var me = this;
    // Collect data for filtration
    var sStatusSelector = me.pagingToolbar.vmStatusCombo.getValue();

    if (sStatusSelector != "All") {
      var extraParams = {
        statusSelector: sStatusSelector,
      };

      // set those data as extraParams in
      me.gridPanel.store.proxy.extraParams = extraParams;
    } else {
      me.gridPanel.store.proxy.extraParams = {};
    }

    me.gridPanel.store.currentPage = 1;
    me.gridPanel.store.load();
  },

  oprStopSelectedVirtualMachines: function () {
    var me = this;

    var oIds = [];

    var oElems = Ext.query("#" + me.id + " input.checkrow");

    for (var i = 0; i < oElems.length; i++) {
      if (oElems[i].checked && oElems[i].value != "-") oIds.push(oElems[i].value);
    }

    if (oIds.length > 0) {
      if (window.confirm("Are you sure you want to stop selected Virtual Machines?")) {
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/stopInstances",
          params: {
            idList: Ext.JSON.encode(oIds),
          },
          scope: me,
          success: function (response) {
            me.oprLoadGridData();
          },
          failure: function (response) {
            Ext.dirac.system_info.msg("Notification", "Operation failed due to a network error.<br/> Please try again later !");
          },
        });
      }
    }
  },

  showHistoryLogWindow: function () {
    var me = this;

    var sInstanceId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.gridPanel, "inst_InstanceID");
    var sUniqueId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.gridPanel, "inst_UniqueID");
    var sName = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.gridPanel, "img_Name");

    var sTitle = "Information for instance " + sUniqueId + " (" + sName + ")";
    var oWindow = me.getContainer().createChildWindow(sTitle, false, 700, 300);

    var oGrid = Ext.create("Ext.grid.Panel", {
      store: new Ext.data.JsonStore({
        proxy: {
          type: "ajax",
          url: GLOBAL.BASE_URL + "VMDirac/getHistoryForInstance",
          reader: {
            type: "json",
            rootProperty: "result",
          },
          timeout: 1800000,
          extraParams: {
            instanceID: sInstanceId,
          },
        },
        fields: ["Status", "Load", "Jobs", "TransferredFiles", "TransferredBytes", "Update"],
        autoLoad: true,
      }),
      columns: [
        {
          header: "Update time",
          sortable: true,
          flex: 1,
          dataIndex: "Update",
        },
        {
          header: "Status",
          sortable: false,
          dataIndex: "Status",
        },
        {
          header: "Load",
          sortable: false,
          dataIndex: "Load",
        },
        {
          header: "Jobs",
          sortable: false,
          dataIndex: "Jobs",
        },
        {
          header: "Files transferred",
          sortable: false,
          dataIndex: "TransferredFiles",
        },
        {
          header: "Bytes transferred",
          sortable: false,
          dataIndex: "TransferredBytes",
        },
      ],
      width: "100%",
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
    });

    oWindow.add(oGrid);
    oWindow.show();
  },

  oprDrawPlot: function () {
    var me = this;
    var sPlotType = me.cbPlot.getValue();

    me.chartPanel.body.mask("Wait ...");

    switch (sPlotType) {
      case "load":
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/getHistoryValues",
          success: me.plotHistoryValue,
          failure: me.ajaxFailure,
          scope: me,
          params: {
            vars: Ext.JSON.encode(["Load"]),
            timespan: me.cbTimespan.getValue(),
          },
        });
        break;
      case "running":
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/getRunningInstancesHistory",
          success: me.plotRunning,
          failure: me.ajaxFailure,
          scope: me,
          params: {
            bucketSize: 900,
            timespan: me.cbTimespan.getValue(),
          },
        });
        break;
      case "runningbyendpoint":
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/getRunningInstancesBEPHistory",
          success: me.plotRunningByFields,
          failure: me.ajaxFailure,
          scope: me,
          params: {
            bucketSize: 900,
            timespan: me.cbTimespan.getValue(),
          },
        });
        break;
      case "runningbyrunningpod":
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/getRunningInstancesByRunningPodHistory",
          success: me.plotRunningByFields,
          failure: me.ajaxFailure,
          scope: me,
          params: {
            bucketSize: 900,
            timespan: me.cbTimespan.getValue(),
          },
        });
        break;
      case "runningbyimage":
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/getRunningInstancesByImageHistory",
          success: me.plotRunningByFields,
          failure: me.ajaxFailure,
          scope: me,
          params: {
            bucketSize: 900,
            timespan: me.cbTimespan.getValue(),
          },
        });
        break;
      case "jobs":
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/getHistoryValues",
          success: me.plotHistoryValue,
          failure: me.ajaxFailure,
          scope: me,
          params: {
            vars: Ext.JSON.encode(["Jobs"]),
            timespan: me.cbTimespan.getValue(),
          },
        });
        break;
      case "transferbytes":
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/getHistoryValues",
          success: me.plotHistoryValue,
          failure: me.ajaxFailure,
          scope: me,
          params: {
            vars: Ext.JSON.encode(["TransferredBytes"]),
            timespan: me.cbTimespan.getValue(),
          },
        });
        break;
      case "transferfiles":
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + "VMDirac/getHistoryValues",
          success: me.plotHistoryValue,
          failure: me.ajaxFailure,
          scope: me,
          params: {
            vars: Ext.JSON.encode(["TransferredFiles"]),
            timespan: me.cbTimespan.getValue(),
          },
        });
        break;
    }
  },
  ajaxFailure: function (response) {
    var me = this;
    Ext.dirac.system_info.msg("Notification", "Operation failed due to a network error.<br/> Please try again later !");
    me.chartPanel.body.unmask();
  },

  createTabWithDiv: function () {
    var me = this;

    var sNewId = "vmplot_" + me.id + "_" + me.getPlotId();

    var sTitle = me.cbPlot.getRawValue() + " :: " + me.cbTimespan.getRawValue();

    // here create new tab
    var oTab = Ext.create("Ext.panel.Panel", {
      title: sTitle,
      floatable: false,
      margins: "0",
      layout: "fit",
      autoScroll: true,
      closable: true,
      html: "<div id='" + sNewId + "' style='width:100%'></div>",
      googleChartId: sNewId,
      googleDataTable: null,
      googleConfig: null,
      listeners: {
        resize: function (oThisTab, width, height, oldWidth, oldHeight, eOpts) {
          if (oThisTab.googleDataTable != null) {
            var iHeight = height - 20;
            var iWidth = width - 20;

            document.getElementById(oThisTab.googleChartId).innerHTML = "";
            document.getElementById(oThisTab.googleChartId).style.height = "" + iHeight + "px";
            document.getElementById(oThisTab.googleChartId).style.width = "" + iWidth + "px";

            var chart = new google.visualization.AnnotatedTimeLine(document.getElementById(oThisTab.googleChartId));
            chart.draw(oThisTab.googleDataTable, oThisTab.googleConfig);
          }
        },
      },
    });

    me.chartPanel.add(oTab);
    me.chartPanel.setActiveTab(oTab);

    var iHeight = oTab.getHeight() - 20;
    var iWidth = oTab.getWidth() - 20;

    document.getElementById(sNewId).style.height = "" + iHeight + "px";
    document.getElementById(sNewId).style.width = "" + iWidth + "px";

    return [sNewId, oTab];
  },

  plotRunning: function (ajaxResponse, reqArguments) {
    var me = this;
    var retVal = Ext.JSON.decode(ajaxResponse.responseText);
    if (retVal.success == "false") {
      Ext.dirac.system_info.msg("Notification", "Failed to plot running: " + retVal.error);
      return;
    }
    var plotData = retVal.data;

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("date", "Date");
    dataTable.addColumn("number", "Running VMs");

    var rows = [];
    var utcOffset = new Date().getTimezoneOffset() * 60000;
    for (var i = 0; i < plotData.length; i++) {
      var record = plotData[i];
      var row = [new Date(record[0] * 1000 - utcOffset), record[1]];
      rows.push(row);
    }
    dataTable.addRows(rows);

    var oDivData = me.createTabWithDiv();
    var sDivId = oDivData[0];
    var oDivTab = oDivData[1];

    var chart = new google.visualization.AnnotatedTimeLine(document.getElementById(sDivId));

    var chartConfig = {
      displayAnnotations: true,
      scaleType: "allmaximized",
      fill: 20,
      displayRangeSelector: false,
      thickness: 3,
      displayZoomButtons: false,
      displayGrid: false,
      dateFormat: "y-MM-dd HH:mm (v)",
      colors: ["3fa900"],
      min: 0,
    };
    if (retVal.timespan == 0) chartConfig.displayRangeSelector = true;

    oDivTab.googleDataTable = dataTable;
    oDivTab.googleConfig = chartConfig;
    chart.draw(dataTable, chartConfig);
    me.chartPanel.body.unmask();
  },

  plotRunningByFields: function (ajaxResponse, reqArguments) {
    var me = this;

    var retVal = Ext.JSON.decode(ajaxResponse.responseText);
    if (retVal.success == "false") {
      Ext.dirac.system_info.msg("Notification", "Failed to plot running: " + retVal.error);
      return;
    }
    var plotData = retVal.data;

    var matrix = [];
    for (var i = 0; i < plotData.length; i++) {
      var record = plotData[i];
      var dev = 0;
      for (var n = 0; n < matrix.length; n++) {
        if (matrix[n] == record[1]) {
          dev = 1;
        }
      }
      if (dev == 0) {
        matrix.push(record[1]);
      }
    }

    var dates = [];
    for (var i = 0; i < plotData.length; i++) {
      var record = plotData[i];
      var dev = 0;
      for (var n = 0; n < dates.length; n++) {
        if (dates[n] == record[0]) {
          dev = 1;
        }
      }
      if (dev == 0) {
        dates.push(record[0]);
      }
    }
    var data = new google.visualization.DataTable();
    data.addColumn("date", "Date");
    for (var i = 0; i < matrix.length; i++) {
      data.addColumn("number", matrix[i]);
    }
    var utcOffset = new Date().getTimezoneOffset() * 60000;

    for (var i = 0; i < dates.length; i++) {
      var row = [];
      var field = new Date(dates[i] * 1000 - utcOffset);
      row.push(field);
      var matrix_times_range = [];
      var matrix_times_large = 0;
      for (var j = 0; j < plotData.length; j++) {
        row_time = [];
        var record = plotData[j];
        if (dates[i] == record[0]) {
          row_time.push(record[1]);
          row_time.push(record[2]);
          matrix_times_large = matrix_times_large + 1;
          matrix_times_range.push(row_time);
        }
      }
      var dev = 0;
      for (var n = 0; n < matrix.length; n++) {
        dev = 0;
        for (var m = 0; m < matrix_times_large; m++) {
          if (matrix[n] == matrix_times_range[m][0]) {
            row.push(matrix_times_range[m][1]);
            dev = 1;
          }
        }
        if (dev == 0) {
          row.push(0);
        }
      }
      data.addRow(row);
    }

    var oDivData = me.createTabWithDiv();
    var sDivId = oDivData[0];
    var oDivTab = oDivData[1];

    var chart = new google.visualization.AnnotatedTimeLine(document.getElementById(sDivId));
    var chartConfig = {
      /*
       * displayAnnotations: true, scaleType : 'allmaximized',
       */
      fill: 20,
      displayRangeSelector: false,
      thickness: 3,
      displayZoomButtons: false,
      displayGrid: false,
      dateFormat: "y-MM-dd HH:mm (v)",
      colors: ["3fa900"],
      min: 0,
    };
    if (this.plotTimespan == 0) chartConfig.displayRangeSelector = true;
    if (dates.length == 0) {
      var dataTable = new google.visualization.DataTable();
      dataTable.addColumn("date", "Date");
      dataTable.addColumn("number", "No VMs");
      var rows = [];
      dataTable.addRows(rows);

      oDivTab.googleDataTable = dataTable;
      oDivTab.googleConfig = chartConfig;
      chart.draw(dataTable, chartConfig);
    } else {
      oDivTab.googleDataTable = data;
      oDivTab.googleConfig = chartConfig;
      chart.draw(data, chartConfig);
    }
    me.chartPanel.body.unmask();
  },

  plotHistoryValue: function (ajaxResponse, reqArguments) {
    var me = this;
    var retVal = Ext.JSON.decode(ajaxResponse.responseText);
    if (retVal.success == "false") {
      Ext.dirac.system_info.msg("Notification", "Failed to plot running: " + retVal.error);
      return;
    }
    var plotData = retVal;

    var dataTable = new google.visualization.DataTable();
    for (var i = 0; i < plotData.fields.length; i++) {
      var field = plotData.fields[i];
      switch (field) {
        case "Update":
          dataTable.addColumn("date", "Date");
          break;
        case "Jobs":
          dataTable.addColumn("number", "Started jobs");
          break;
        case "TransferredFiles":
          dataTable.addColumn("number", "Files transferred");
          break;
        case "TransferredBytes":
          dataTable.addColumn("number", "Data transferred (GiB)");
          break;
        default:
          dataTable.addColumn("number", field);
      }
    }
    var rows = [];
    var utcOffset = new Date().getTimezoneOffset() * 60000;
    for (var i = 0; i < plotData.data.length; i++) {
      var record = plotData.data[i];
      var row = [];
      for (var j = 0; j < record.length; j++) {
        switch (plotData.fields[j]) {
          case "Update":
            var s = record[j] * 1000 - utcOffset;
            var d = new Date(s);
            row.push(d);
            break;
          case "TransferredBytes":
            row.push(record[j] / 1073741824.0);
            break;
          default:
            row.push(record[j]);
        }
      }
      rows.push(row);
    }
    dataTable.addRows(rows);

    var oDivData = me.createTabWithDiv();
    var sDivId = oDivData[0];
    var oDivTab = oDivData[1];

    var chart = new google.visualization.AnnotatedTimeLine(document.getElementById(sDivId));
    var sC = [];
    for (var i = 0; i < plotData.fields.length - i; i++) {
      if (i > 2) continue;
      sC.push(i);
    }
    var colors = [];
    for (var i = 0; i < plotData.fields.length; i++) {
      switch (plotData.fields[i]) {
        case "Load":
          colors.push("4684ee");
          break;
        case "TransferredBytes":
          colors.push("c9710d");
          break;
        case "TransferredFiles":
          colors.push("0ab58c");
          break;
        case "Jobs":
          colors.push("b00c12");
          break;
      }
    }
    var chartConfig = {
      displayAnnotations: true,
      // scaleColumns : [0,1,2],
      scaleColumns: sC,
      scaleType: "allmaximized",
      fill: 20,
      displayRangeSelector: false,
      thickness: 3,
      displayZoomButtons: false,
      displayGrid: false,
      dateFormat: "y-MM-dd HH:mm (v)",
      colors: colors,
      min: 0,
    };
    if (this.plotTimespan == 0) chartConfig.displayRangeSelector = true;

    oDivTab.googleDataTable = dataTable;
    oDivTab.googleConfig = chartConfig;
    chart.draw(dataTable, chartConfig);
    me.chartPanel.body.unmask();
  },
});
