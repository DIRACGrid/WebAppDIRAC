Ext.define("DIRAC.ResourceSummary.classes.OverviewPanel", {
  extend: "Ext.panel.Panel",
  requires: ["DIRAC.ResourceSummary.classes.TreeModel"],
  title: "Overview",
  region: "east",
  autoScroll: true,
  collapsible: true,
  split: true,
  region: "east",
  margins: "2 0 2 0",
  cmargins: "2 2 2 2",
  bodyStyle: "padding: 5px",
  width: 600,
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
      "</div>",
      "</tpl>"
    );

    me.view = new Ext.view.View({
      columnWidth: 1 / 3,
      tpl: tpl,
      store: viewStore,
      itemSelector: "div.dataset-statistics",
      autoHeight: true,
    });

    me.viewPanel = Ext.create("Ext.panel.Panel", {
      title: "Resource",
      columnWidth: 1 / 3,
      items: me.view,
      layout: "fit",
      resizable: true,
    });
    var historyStore = new Ext.data.ArrayStore({
      fields: ["Status", "DataEffectiv", "Reason"],
      data: [],
    });

    me.historyGrid = Ext.create("Ext.grid.Panel", {
      layout: "fit",
      store: historyStore,
      stateful: true,
      stateId: "ResourceStatusHistory",
      columns: [
        {
          text: "Status",
          flex: 1,
          sortable: false,
          dataIndex: "Status",
        },
        {
          text: "DataEffectiv",
          flex: 1,
          sortable: false,
          dataIndex: "DataEffectiv",
        },
        {
          text: "Reason",
          flex: 1,
          sortable: false,
          dataIndex: "Reason",
        },
      ],
      width: "100%",
      height: "50%",
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
    });
    me.historyPanel = Ext.create("Ext.panel.Panel", {
      title: "History",
      columnWidth: 1 / 3,
      items: [me.historyGrid],
      height: "50%",
      resizable: true,
    });

    me.downtimeGrid = Ext.create("Ext.grid.Panel", {
      layout: "fit",
      store: Ext.create("Ext.data.ArrayStore", {
        fields: ["StartDate", "EndDare", "Link", "Description", "Severity"],
        data: [],
      }),
      columns: [
        {
          text: "StartDate",
          sortable: true,
          dataIndex: "StartDate",
          align: "left",
          flex: 1,
        },
        {
          text: "EndDate",
          sortable: true,
          dataIndex: "EndDate",
          align: "left",
          flex: 1,
        },
        {
          text: "Description",
          sortable: true,
          dataIndex: "Description",
          align: "left",
          flex: 1,
        },
        {
          text: "Severity",
          sortable: true,
          dataIndex: "Severity",
          align: "left",
          flex: 1,
        },
        {
          text: "Link",
          dataIndex: "Link",
          hidden: true,
          flex: 1,
        },
      ],
      width: "100%",
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      listeners: {
        itemclick: function (table, record, item, index, e, eOpts) {
          window.open(record.get("Link"));
        },
      },
    });
    me.downTimePanel = Ext.create("Ext.panel.Panel", {
      title: "Downtimes",
      columnWidth: 1 / 3,
      items: [me.downtimeGrid],
      height: "50%",
      resizable: true,
    });

    me.policiesGrid = Ext.create("Ext.grid.Panel", {
      layout: "fit",
      store: Ext.create("Ext.data.ArrayStore", {
        fields: ["Status", "PolicyName", "DataEffectiv", "LastCheckTime", "Reason"],
        data: [],
      }),
      columns: [
        {
          text: "Status",
          flex: 1,
          sortable: false,
          dataIndex: "Status",
        },
        {
          text: "PolicyName",
          flex: 1,
          sortable: false,
          dataIndex: "PolicyName",
        },
        {
          text: "DataEffectiv",
          flex: 1,
          sortable: false,
          dataIndex: "DataEffectiv",
        },
        {
          text: "LastCheckTime",
          flex: 1,
          sortable: false,
          dataIndex: "LastCheckTime",
        },
        {
          text: "Reason",
          flex: 1,
          sortable: false,
          dataIndex: "Reason",
        },
      ],
      width: "100%",
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
    });

    me.policies = Ext.create("Ext.panel.Panel", {
      title: "Policies",
      columnWidth: 1 / 3,
      items: [me.policiesGrid],
      resizable: true,
    });

    me.timeline = Ext.create("Ext.panel.Panel", {
      title: "Timeline",
      columnWidth: 1 / 3,
      height: 300,
      width: 200,
      resizable: true,
      items: [
        {
          html: "<div id='" + me.id + "-timeline-plot' style='width:100%;'></div>",
          xtype: "box",
        },
      ],
    });

    me.treeStore = Ext.create("Ext.data.TreeStore", {
      model: "DIRAC.ResourceSummary.classes.TreeModel",
      root: {
        expanded: true,
        children: [],
      },
    });
    me.familymaters = Ext.create("Ext.tree.Panel", {
      title: "Family matters",
      width: 200,
      height: 300,
      store: me.treeStore,
      rootVisible: true,
      renderTo: Ext.getBody(),
      columnWidth: 1 / 3,
      resizable: true,
      listeners: {
        itemclick: function (tree, record, item, index, e, eOpts) {
          if (record.get("openResource")) {
            me.loadData(record.get("openResource"));
          }
        },
      },
    });

    me.callParent(arguments);
    me.add([me.viewPanel, me.familymaters, me.timeline, me.policies, me.historyPanel, me.downTimePanel]);
  },
  loadData: function (selection) {
    var me = this;

    me.viewPanel.body.mask("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: Ext.JSON.encode(["Info"]),
        name: Ext.JSON.encode([selection.name]),
        elementType: Ext.JSON.encode([selection.elementType]),
        statusType: Ext.JSON.encode([selection.statusType]),
        element: selection.element ? Ext.JSON.encode([selection.element]) : Ext.JSON.encode(["Resource"]),
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
          me.viewPanel.body.unmask();
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });

    me.historyGrid.body.mask("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: Ext.JSON.encode(["History"]),
        name: Ext.JSON.encode([selection.name]),
        elementType: Ext.JSON.encode([selection.elementType]),
        statusType: Ext.JSON.encode([selection.statusType]),
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.historyGrid.body.unmask();
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          me.historyGrid.getStore().loadData(jsonData["result"]);
          me.historyGrid.body.unmask();
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });

    me.downtimeGrid.body.mask("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: Ext.JSON.encode(["Downtime"]),
        name: Ext.JSON.encode([selection.name]),
        elementType: Ext.JSON.encode([selection.elementType]),
        element: Ext.JSON.encode(["Resource"]),
        statusType: Ext.JSON.encode([selection.statusType]),
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.downtimeGrid.body.unmask();
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          me.downtimeGrid.getStore().loadData(jsonData["result"]);
          me.downtimeGrid.body.unmask();
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });

    me.policiesGrid.body.mask("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: Ext.JSON.encode(["Policies"]),
        name: Ext.JSON.encode([selection.name]),
        elementType: Ext.JSON.encode([selection.elementType]),
        statusType: Ext.JSON.encode([selection.statusType]),
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.policiesGrid.body.unmask();
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          me.policiesGrid.getStore().loadData(jsonData["result"]);
          me.policiesGrid.body.unmask();
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });

    me.timeline.body.mask("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: Ext.JSON.encode(["Timeline"]),
        name: Ext.JSON.encode([selection.name]),
        elementType: Ext.JSON.encode([selection.elementType]),
        statusType: Ext.JSON.encode([selection.statusType]),
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.timeline.body.unmask();
      },
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          me.timeline.body.unmask();

          var height = me.timeline.getHeight() - 20;
          document.getElementById(me.id + "-timeline-plot").style.height = "" + height + "px";

          var width = me.timeline.getWidth() - 20;
          document.getElementById(me.id + "-timeline-plot").style.width = "" + width + "px";
          if (typeof google === "undefined") {
            Ext.dirac.system_info.msg(
              "Error",
              "Failed to load Google visualization libraries, " + "some content will be missing. Is googleapis.com blocked?"
            );
            return;
          }
          var chart = new google.visualization.AnnotatedTimeLine(document.getElementById(me.id + "-timeline-plot"));
          var data = new google.visualization.DataTable();
          data.addColumn("datetime", "DateTime");
          data.addColumn("number", "Status");
          data.addColumn("string", "title1");
          data.addColumn("string", "text1");

          var rows = [];

          for (var i = 0; i < jsonData["result"].length; i++) {
            title = jsonData["result"][i][0];
            annotation = jsonData["result"][i][2];

            if (annotation == "") {
              annotation = null;
              title = null;
            }
            row = [Ext.Date.parse(jsonData["result"][i][1], "Y-m-d H:i:s"), me.__statusValue(jsonData["result"][i][0]), title, annotation];
            rows.push(row);
          }

          var lastRow = [new Date(), row[1], undefined, undefined];

          rows.push(lastRow);

          data.addRows(rows);
          chart.draw(data, {
            displayAnnotations: true,
          });
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });

    me.familymaters.body.mask("Loading ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/action",
      method: "POST",
      params: {
        action: Ext.JSON.encode(["Tree"]),
        name: Ext.JSON.encode([selection.name]),
        elementType: Ext.JSON.encode([selection.elementType]),
        statusType: Ext.JSON.encode([selection.statusType]),
      },
      scope: me,
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.familymaters.body.unmask();
      },
      success: function (response) {
        me.familymaters.body.unmask();
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          var json = [];

          for (var i = 1; i < jsonData["result"].length; i++) {
            if (jsonData["result"][i][0] == null) {
              json.push({
                text: jsonData["result"][i][1],
                id: i,
                leaf: true,
                iconCls: jsonData["result"][i][2].toLowerCase(),
                html: "#",
              });
            } else {
              break;
            }
          }

          var ces = [];
          var ce = [];
          var buffer = [];

          for (var j = i + 1; j < jsonData["result"].length; j++) {
            if (jsonData["result"][j][0] == "ses") {
              ces.push({
                text: ce[0],
                id: 2000 + j,
                leaf: false,
                children: buffer,
              });
              break;
            }

            if (jsonData["result"][j][3] == "ces") {
              if (ce.length != 0) {
                ces.push({
                  text: ce[0],
                  id: 2000 + j,
                  leaf: false,
                  children: buffer,
                });
                buffer = [];
                ce = [];
              }
              ce = jsonData["result"][j];
            } else {
              buffer.push({
                text: jsonData["result"][j][1],
                id: j,
                leaf: true,
                iconCls: jsonData["result"][j][2].toLowerCase(),
                openResource: {
                  element: "Resource",
                  name: ce[0],
                  elementType: "CE",
                  statusType: jsonData["result"][j][1],
                },
              });
            }
          }
          json.push({
            text: "Computing Elements",
            id: 1000,
            leaf: false,
            children: ces,
          });

          var ses = [];
          var se = [];
          buffer = [];

          for (var k = j + 1; k < jsonData["result"].length; k++) {
            if (jsonData["result"][k][3] == "ses") {
              if (se.length != 0) {
                ses.push({
                  text: se[0],
                  id: 3000 + k,
                  leaf: false,
                  children: buffer,
                });
                buffer = [];
                se = [];
              }
              se = jsonData["result"][k];
            } else {
              buffer.push({
                text: jsonData["result"][k][1],
                id: k,
                leaf: true,
                iconCls: jsonData["result"][k][2].toLowerCase(),
                openResource: {
                  element: "Resource",
                  name: se[0],
                  elementType: "StorageElement",
                  statusType: jsonData["result"][k][1],
                },
              });
            }
          }

          ses.push({
            text: se[0],
            id: 3000 + k,
            leaf: false,
            children: buffer,
          });
          json.push({
            text: "Storage Elements",
            id: 5000,
            leaf: false,
            children: ses,
          });

          siteName = jsonData["result"][0][0];
          var rootNode = {
            expanded: true,
            text: siteName,
            children: json,
          };
          me.treeStore.setRootNode(rootNode);
        } else {
          GLOBAL.APP.CF.msg("error", jsonData["error"]);
        }
      },
    });
  },
  __statusValue: function (statusName) {
    if (statusName == "Error") return 0;
    else if (statusName == "Banned") return 1;
    else if (statusName == "Probing") return 2;
    else if (statusName == "Degraded") return 3;
    else if (statusName == "Active") return 4;
    else return -1;
  },
});
