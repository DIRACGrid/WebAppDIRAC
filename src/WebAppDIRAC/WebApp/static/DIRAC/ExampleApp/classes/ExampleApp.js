/***
 * This is a simple example which describes how to use predefined widgets and how to create a new application. We used the following steps to create the first application:
 *
 *    - We called our first application ExampleApp.
 *    - We added the following line to the CS in the WebApp section: ExampleApp = DIRAC.ExampleApp
 *    - We created ExampleApp directory under DIRAC. We created two directories under ExampleApp called: classes and css.
 *    - classes directory contains the ExampleApp.js while the css directory contains the ExampleApp.css
 *    - We implemented the ExampleApp.js class
 *    - We implemented the ExampleAppHandler.py
 *
 *    ExampleHandler.py:
 *    from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr
 *     from DIRAC import gConfig, S_OK, S_ERROR, gLogger
 *     import json
 *     import datetime
 *
 *     class ExampleAppHandler(WebHandler):
 *
 *       DEFAULT_AUTHORIZATION = "authenticated"
 *
 *       def web_getJobData(self):
 *         timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M [UTC]")
 *         total = 5
 *         values = []
 *         values = [{"ExampleId":1,"ExampleValue":"Zoli"},{"ExampleId":2,"ExampleValue":'a'},{"ExampleId":3,"ExampleValue":'aaaa'},{"ExampleId":4,"ExampleValue":'bbbb'},{"ExampleId":5,"ExampleValue":'adsd'}]
 *         return {"success":"true", "result":values, "total":total, "date":timestamp }
 *
 *       def web_getSelectionData(self):
 *         return {"firstName":["A","C","D"],"lastName":["wwww","dsds","sads"]}
 *
 *
 *    NOTE: You can see the Source by clicking on the page title: DIRAC.ExampleApp.classes.ExampleApp.
 *
 */
Ext.define("DIRAC.ExampleApp.classes.ExampleApp", {
  extend: "Ext.dirac.core.Module",

  requires: [
    "Ext.dirac.utils.DiracGridPanel",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracApplicationContextMenu",
    "Ext.dirac.utils.DiracBaseSelector",
    "Ext.dirac.utils.DiracAjaxProxy",
  ],

  /***
   * @param{Object} data
   * It loads the data from the User Profile to the widget.
   */
  loadState: function (data) {
    var me = this;

    //loads the saved data related to the Grid Panel
    me.grid.loadState(data);

    //it loads the selector data
    me.leftPanel.loadState(data);

    //it loads the selector panel status.
    if (data.leftPanelCollapsed) {
      if (data.leftPanelCollapsed) me.leftPanel.collapse();
    }
  },
  /**
   * @return{Object}
   * It returns the data which will be saved in the User Profile.
   */
  getStateData: function () {
    var me = this;
    var oReturn = {};

    // data for grid columns
    oReturn.grid = me.grid.getStateData();
    // show/hide for selectors and their selected data (including NOT
    // button)
    oReturn.leftMenu = me.leftPanel.getStateData();

    oReturn.leftPanelCollapsed = me.leftPanel.collapsed;

    return oReturn;
  },
  dataFields: [{ name: "ExampleId", type: "int" }, { name: "ExampleValue" }],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Example Application";
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
  /**
   * It build the widget.
   */
  buildUI: function () {
    var me = this;

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE LEFT PANEL
     * -----------------------------------------------------------------------------------------------------------
     */

    var selectors = {
      firstName: "First Name",
      lastName: "Last Name",
    };

    var textFields = {
      ids: "PersonalId",
    };

    var map = [
      ["firstName", "firstName"],
      ["lastName", "lastName"],
    ];

    me.leftPanel = Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      textFields: textFields,
      datamap: map,
      url: "ExampleApp/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */

    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + "ExampleApp/getJobData",
    });

    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      fields: me.dataFields,
      scope: me,
    });

    var pagingToolbar = {};

    var toolButtons = {
      Visible: [
        { text: "", handler: me.__executeAction, arguments: ["example", ""], properties: { tooltip: "Example", iconCls: "dirac-icon-reschedule" } },
      ],
    };

    pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      toolButtons: toolButtons,
      store: me.dataStore,
      scope: me,
    });

    var oColumns = {
      ExampleId: { dataIndex: "ExampleId" },
      ExampleValue: { dataIndex: "ExampleValue" },
    };

    var menuitems = {
      Visible: [{ text: "Get info", handler: me.__executeAction, arguments: ["Get info"], properties: { tooltip: "Click to show...." } }],
    };

    me.contextGridMenu = new Ext.dirac.utils.DiracApplicationContextMenu({ menu: menuitems, scope: me });

    me.grid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      store: me.dataStore,
      oColumns: oColumns,
      contextMenu: me.contextGridMenu,
      pagingToolbar: pagingToolbar,
      scope: me,
    });

    me.leftPanel.setGrid(me.grid);

    me.add([me.leftPanel, me.grid]);
  },
  __executeAction: function (action) {
    var me = this;
    GLOBAL.APP.CF.alert(action + " button pressed", "info");
  },
});
