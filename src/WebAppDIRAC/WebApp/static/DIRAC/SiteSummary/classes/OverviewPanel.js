Ext.define("DIRAC.SiteSummary.classes.OverviewPanel", {
  extend: "Ext.panel.Panel",
  title: "Overview",
  region: "east",
  autoScroll: true,
  collapsible: true,
  split: true,
  region: "east",
  margins: "2 0 2 0",
  cmargins: "2 2 2 2",
  bodyStyle: "padding: 5px",
  width: 800,
  labelAlign: "top",
  minWidth: 200,
  hidden: true,
  layout: "column",
  columnWidth: 2,
  tools: [
    {
      type: "maximize",
      tooltip: "Maximize the application.",
      handler: function (event, toolEl, panelHeader) {
        var me = this;

        var widget = me.up("panel");
        var parent = me.up("panel").parentWidget;

        parent.grid.hide();
        parent.leftPanel.hide();

        for (var i = 0; i < widget.tools.length; i++) {
          if (widget.tools[i].type == "maximize" || widget.tools[i].type == "close" || widget.tools[i].type == "collapse-right") {
            widget.tools[i].hide();
          } else if (widget.tools[i].type == "minimize") {
            widget.tools[i].show();
          }
        }

        widget.panelSize = {
          height: widget.getHeight(),
          width: widget.getWidth(),
        };

        widget.setHeight(widget.maximizedSize.height);
        widget.setWidth(widget.maximizedSize.width);
      },
    },
    {
      type: "minimize",
      tooltip: "Minimize the application.",
      hidden: true,
      handler: function (event, toolEl, panelHeader) {
        var me = this;

        var parent = me.up("panel").parentWidget;
        var widget = me.up("panel");

        parent.grid.show();
        parent.leftPanel.show();

        for (var i = 0; i < widget.tools.length; i++) {
          if (widget.tools[i].type == "maximize" || widget.tools[i].type == "close" || widget.tools[i].type == "collapse-right") {
            widget.tools[i].show();
          } else if (widget.tools[i].type == "minimize") {
            widget.tools[i].hide();
          }
        }

        widget.setHeight(widget.panelSize.height);
        widget.setWidth(widget.panelSize.width);
      },
    },
  ],
  listeners: {
    collapse: function (panel, eOpts) {
      panel.hide();
      panel.parentWidget.grid.show();
      panel.parentWidget.leftPanel.show();
    },
  },
  initComponent: function () {
    var me = this;

    me.dataFields = [
      {
        name: "Name",
      },
      {
        name: "StatusType",
      },
      {
        name: "Status",
      },
      {
        name: "ElementType",
      },
      {
        name: "Reason",
      },
      {
        name: "DateEffective",
      },
      {
        name: "LastCheckTime",
      },
      {
        name: "TokenOwner",
      },
      {
        name: "TokenExpiration",
      },
      {
        name: "GOCDB",
      },
      {
        name: "GGUS",
      },
      {
        name: "Elog",
      },
    ];

    var viewStore = Ext.create("Ext.data.Store", {
      fields: me.dataFields,
    });
    var tpl = new Ext.XTemplate(
      '<tpl for=".">',
      '<div style="margin-bottom: 10px;" class="dataset-statistics">',
      "<b>Name:</b> {Name}<br/>",
      "<b>Status Type:</b> {StatusType}<br/>",
      "<b>Status:</b> {Status}<br/>",
      "<b>ElementType:</b> {ElementType}<br/>",
      "<b>Reason:</b> {Reason}<br/>",
      "<b>DateEffective:</b> {DateEffective} <br><b>LastCheckTime:</b> {LastCheckTime}<br/> <b>TokenOwner:</b> {TokenOwner}<br/>",
      "<b>TokenExpiration:</b> {TokenExpiration}<br/>",
      "<b>GOCDB:</b> {GOCDB}<br/>",
      "<b>GGUS:</b> {GGUS}<br/>",
      "<b>Elog:</b> {Elog}<br/>",
      "</div>",
      "</tpl>"
    );

    me.view = new Ext.view.View({
      columnWidth: 1 / 2,
      tpl: tpl,
      store: viewStore,
      itemSelector: "div.dataset-statistics",
      autoHeight: true,
    });

    me.viewPanel = Ext.create("Ext.panel.Panel", {
      title: "Details",
      columnWidth: 1 / 2,
      items: me.view,
      layout: "fit",
      resizable: true,
    });

    var ceStore = new Ext.data.ArrayStore({
      fields: ["Name", "StatusType", "Status", "Type"],
      data: [],
    });

    var menuitems = {
      Visible: [
        {
          text: "Overview",
          handler: me.__showElement,
          properties: {
            tooltip: "Click for more details.",
          },
        },
      ],
    };

    me.contextGridMenu = new Ext.dirac.utils.DiracApplicationContextMenu({
      menu: menuitems,
      scope: me,
    });

    me.ceGrid = Ext.create("Ext.grid.Panel", {
      title: "Computing elements",
      columnWidth: 1 / 2,
      layout: "fit",
      stateful: true,
      stateId: "SiteSummaryCeGrid",
      store: ceStore,
      columns: [
        {
          sortable: false,
          width: 36,
          sortable: false,
          hideable: false,
          fixed: true,
          menuDisabled: true,
          dataIndex: "Status",
          renderer: function (value) {
            if (value == "Done" || value == "Good" || value == "Active" || value == "Cleared") {
              return '<img src="static/core/img/statusIcons/done.gif"/>';
            } else if (value == "Bad") {
              return '<img src="static/core/img/statusIcons/bad.gif"/>';
            } else if (value == "Failed" || value == "Bad" || value == "Banned" || value == "Aborted") {
              return '<img src="static/core/img/statusIcons/failed.gif"/>';
            } else if (value == "Waiting" || value == "Stopped" || value == "Poor" || value == "Probing") {
              return '<img src="static/core/img/statusIcons/waiting.gif"/>';
            } else if (value == "Deleted") {
              return '<img src="static/core/img/statusIcons/deleted.gif"/>';
            } else if (value == "Matched") {
              return '<img src="static/core/img/statusIcons/matched.gif"/>';
            } else if (value == "Running" || value == "Active" || value == "Fair") {
              return '<img src="static/core/img/statusIcons/running.gif"/>';
            } else if (value == "NoMask") {
              return '<img src="static/core/img/statusIcons/unknown.gif"/>';
            } else if (value == "Completed" || value == (value == "Completing")) {
              return '<img src="static/core/img/statusIcons/completed.gif"/>';
            } else if (value == "Idle") {
              return '<img src="static/core/img/statusIcons/idle.gif"/>';
            } else {
              return '<img src="static/core/img/statusIcons/unknown.gif"/>';
            }
          },
        },
        {
          text: "Name",
          flex: 1,
          sortable: false,
          dataIndex: "Name",
        },
        {
          text: "Type",
          flex: 1,
          sortable: false,
          dataIndex: "Type",
        },
        {
          text: "StatusType",
          flex: 1,
          sortable: false,
          dataIndex: "StatusType",
        },
        {
          text: "Status",
          flex: 1,
          sortable: false,
          dataIndex: "Status",
        },
      ],
      width: "100%",
      height: "50%",
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      listeners: {
        beforecellcontextmenu: function (oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
          e.preventDefault();
          me.contextGridMenu.record = record;
          me.contextGridMenu.showAt(e.getXY());
          return false;
        },
      },
    });

    var stotageStore = new Ext.data.ArrayStore({
      fields: ["Name", "StatusType", "Status", "Type"],
      data: [],
    });

    me.storageGrid = Ext.create("Ext.grid.Panel", {
      title: "Storage elements",
      columnWidth: 1 / 2,
      layout: "fit",
      store: stotageStore,
      stateful: true,
      stateId: "SiteSummary-se-grid",
      columns: [
        {
          sortable: false,
          width: 36,
          sortable: false,
          hideable: false,
          fixed: true,
          menuDisabled: true,
          dataIndex: "Status",
          renderer: function (value) {
            if (value == "Done" || value == "Good" || value == "Active" || value == "Cleared") {
              return '<img src="static/core/img/statusIcons/done.gif"/>';
            } else if (value == "Bad") {
              return '<img src="static/core/img/statusIcons/bad.gif"/>';
            } else if (value == "Failed" || value == "Bad" || value == "Banned" || value == "Aborted") {
              return '<img src="static/core/img/statusIcons/failed.gif"/>';
            } else if (value == "Waiting" || value == "Stopped" || value == "Poor" || value == "Probing") {
              return '<img src="static/core/img/statusIcons/waiting.gif"/>';
            } else if (value == "Deleted") {
              return '<img src="static/core/img/statusIcons/deleted.gif"/>';
            } else if (value == "Matched") {
              return '<img src="static/core/img/statusIcons/matched.gif"/>';
            } else if (value == "Running" || value == "Active" || value == "Fair") {
              return '<img src="static/core/img/statusIcons/running.gif"/>';
            } else if (value == "NoMask") {
              return '<img src="static/core/img/statusIcons/unknown.gif"/>';
            } else if (value == "Completed" || value == (value == "Completing")) {
              return '<img src="static/core/img/statusIcons/completed.gif"/>';
            } else if (value == "Idle") {
              return '<img src="static/core/img/statusIcons/idle.gif"/>';
            } else {
              return '<img src="static/core/img/statusIcons/unknown.gif"/>';
            }
          },
        },
        {
          text: "Name",
          flex: 1,
          sortable: false,
          dataIndex: "Name",
        },
        {
          text: "Type",
          flex: 1,
          sortable: false,
          dataIndex: "Type",
        },
        {
          text: "StatusType",
          flex: 1,
          sortable: false,
          dataIndex: "StatusType",
        },
        {
          text: "Status",
          flex: 1,
          sortable: false,
          dataIndex: "Status",
        },
      ],
      width: "100%",
      height: "50%",
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      listeners: {
        beforecellcontextmenu: function (oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
          e.preventDefault();
          me.contextGridMenu.record = record;
          me.contextGridMenu.showAt(e.getXY());
          return false;
        },
      },
    });
    var width = 99 / 2;
    width = "." + Math.round(width);
    me.plotPanel = Ext.create("Ext.panel.Panel", {
      title: "Plots",
      columnWidth: 3,
      resizable: false,
      items: [
        {
          xtype: "image",
          columnWidth: width,
          width: 216,
          height: 216,
          src: "",
          listeners: {
            afterrender: function (me) {
              me.el.on({
                load: function (evt, ele, opts) {
                  me.setLoading(false);
                },
              });
            },
          },
        },
        {
          xtype: "image",
          columnWidth: width,
          width: 216,
          height: 216,
          src: "",
          listeners: {
            afterrender: function (me) {
              me.el.on({
                load: function (evt, ele, opts) {
                  me.setLoading(false);
                },
              });
            },
          },
        },
        {
          xtype: "image",
          columnWidth: width,
          width: 216,
          height: 216,
          src: "",
          listeners: {
            afterrender: function (me) {
              me.el.on({
                load: function (evt, ele, opts) {
                  me.setLoading(false);
                },
              });
            },
          },
        },
        {
          xtype: "image",
          columnWidth: width,
          width: 216,
          height: 216,
          src: "",
          listeners: {
            afterrender: function (me) {
              me.el.on({
                load: function (evt, ele, opts) {
                  me.setLoading(false);
                },
              });
            },
          },
        },
        {
          xtype: "image",
          columnWidth: width,
          width: 216,
          height: 216,
          src: "",
          listeners: {
            afterrender: function (me) {
              me.el.on({
                load: function (evt, ele, opts) {
                  me.setLoading(false);
                },
              });
            },
          },
        },
        {
          xtype: "image",
          columnWidth: width,
          width: 216,
          height: 216,
          src: "",
          listeners: {
            afterrender: function (me) {
              me.el.on({
                load: function (evt, ele, opts) {
                  me.setLoading(false);
                },
              });
            },
          },
        },
      ],
      layout: "column",
    });

    me.rightPanel = Ext.create("Ext.panel.Panel", {
      columnWidth: 1 / 2,
      items: [me.plotPanel],
      resizable: false,
      layout: "fit",
    });

    me.callParent(arguments);
    me.add([me.viewPanel, me.rightPanel, me.ceGrid, me.storageGrid]);
    me.viewPanel.setLoading(true);
  },
  loadData: function (selection) {
    var me = this;

    me.viewPanel.setLoading("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: "Info",
        name: selection.name,
        elementType: selection.elementType,
        statusType: selection.statusType,
        element: selection.element ? selection.element : "Resource",
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.viewPanel.body.unmask();
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          me.setTitle(jsonData["result"]["Name"]);
          me.view.getStore().loadData([jsonData["result"]]);
          me.viewPanel.setLoading(false);
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });

    me.ceGrid.setLoading("Loading ....");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: "ComputingElements",
        name: selection.name,
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.ceGrid.setLoading(false);
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          me.ceGrid.getStore().loadData(jsonData["result"]);
          me.ceGrid.setLoading(false);
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });

    me.storageGrid.setLoading("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: "Storages",
        name: selection.name,
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.storageGrid.body.unmask();
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          me.storageGrid.getStore().loadData(jsonData["result"]);
          me.storageGrid.setLoading(false);
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });
    me.rightPanel.setLoading("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: "Images",
        name: selection.name,
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.rightPanel.setLoading(false);
      },
      success: function (response) {
        me.rightPanel.setLoading(false);

        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          var width = 99 / 2;
          width = "." + Math.round(width);
          for (var i = 0; i < jsonData.result.length; i++) {
            var src =
              GLOBAL.BASE_URL + jsonData.result[i].Type + "/getPlotImg?fileName=" + jsonData.result[i].src + "&nocache=" + new Date().getTime();
            var img = me.plotPanel.items.getAt(i);
            img.setSrc(src);
            img.setLoading("Loading...");
            img.on(
              "click",
              function (e, t, eOpts, me) {
                var me = this;
                var img = me.plotPanel.getComponent(t.id);
                if (img) {
                  me.fullSizeImage(img);
                }
              },
              this
            );

            img.getEl().on(
              "click",
              function (e, t, eOpts, me) {
                var me = this;
                var img = me.plotPanel.getComponent(t.id);
                if (img) {
                  me.fullSizeImage(img);
                }
              },
              this
            );
          }
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });
  },
  fullSizeImage: function (img) {
    var me = this;

    var html = '<img src="' + img.src + '" />';
    if (Ext.firefoxVersion > 0) {
      var win = new Ext.window.Window({
        collapsible: true,
        constrain: true,
        constrainHeader: true,
        html: html,
        layout: "fit",
        minHeight: 200,
        minWidth: 320,
        maximizable: true,
        minimizable: true,
      });
      win.show();
    } else {
      var panel = Ext.create("Ext.panel.Panel", {
        constrainHeader: false,
        constrain: true,
        html: html,
        layout: "fit",
        height: 600,
        width: 834,
      });

      var win = me.up("panel").createChildWindow("Site overview", false, 850, 650);
      win.add(panel);
      win.show();
    }
  },
  __showElement: function () {
    var me = this;
    console.log(me.contextGridMenu.record);

    var setupdata = {
      currentState: me.contextGridMenu.record.get("Name"),
      data: {
        leftMenu: {
          selectors: {
            name: {
              data_selected: [me.contextGridMenu.record.get("Name")],
            },
          },
        },
      },
    };

    GLOBAL.APP.MAIN_VIEW.createNewModuleContainer({
      objectType: "app",
      moduleName: me.parentWidget.applicationsToOpen["ResourceSummary"],
      setupData: setupdata,
    });
  },
});
