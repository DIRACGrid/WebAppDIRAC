/*
 * Pilot Monitor page
 */
Ext.define("DIRAC.PilotSummary.classes.PilotSummary", {
  extend : 'Ext.dirac.core.Module',
  requires : ["Ext.dirac.utils.DiracBaseSelector", "Ext.dirac.utils.DiracJsonStore", "Ext.dirac.utils.DiracAjaxProxy", "Ext.dirac.utils.DiracPagingToolbar", 'Ext.dirac.utils.DiracToolButton', "Ext.dirac.utils.DiracApplicationContextMenu", "Ext.dirac.utils.DiracGridPanel"],
  loadState : function(data) {
    var me = this;

    me.grid.loadState(data);

    me.leftPanel.loadState(data);
  },
  getStateData : function() {
    var me = this;
    var oStates = {};
    oStates.columns = {};

    oStates.columns = me.grid.getStateData();
    oStates.leftMenu = me.leftPanel.getStateData();

    return oStates;
  },

  dataFields : [{
    name : 'Scheduled'
  }, {
    name : 'Status'
  }, {
    name : 'Aborted_Hour'
  }, {
    name : 'PilotsPerJob',
    type : 'float'
  }, {
    name : 'Site'
  }, {
    name : 'Submitted'
  }, {
    name : 'Done_Empty'
  }, {
    name : 'Waiting'
  }, {
    name : 'PilotJobEff',
    type : 'float'
  }, {
    name : 'Done'
  }, {
    name : 'CE'
  }, {
    name : 'Aborted'
  }, {
    name : 'Ready'
  }, {
    name : 'Total'
  }, {
    name : 'Running'
  }, {
    name : 'StatusIcon',
    mapping : 'Status'
  }],

  initComponent : function() {
    var me = this;

    me.launcher.title = "Pilot Summary";
    me.launcher.maximized = false;

    if (GLOBAL.VIEW_ID == "desktop") {

      var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

      me.launcher.width = oDimensions[0];
      me.launcher.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar.getHeight();

      me.launcher.x = 0;
      me.launcher.y = 0;

    }

    if (GLOBAL.VIEW_ID == "tabs") {

      var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

      me.launcher.width = oDimensions[0];
      me.launcher.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar.getHeight();

      me.launcher.x = 0;
      me.launcher.y = 0;

    }

    Ext.apply(me, {
          layout : 'border',
          bodyBorder : false,
          defaults : {
            collapsible : true,
            split : true
          }
        });

    me.callParent(arguments);

  },
  buildUI : function() {

    var me = this;

    var selectors = {
      site : "Site"
    };

    var map = [["site", "site"]];

    me.leftPanel = new Ext.create('Ext.dirac.utils.DiracBaseSelector', {
          scope : me,
          cmbSelectors : selectors,
          datamap : map,
          url : "PilotSummary/getSelectionData"
        });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */
    var oProxy = Ext.create('Ext.dirac.utils.DiracAjaxProxy', {
          url : GLOBAL.BASE_URL + 'PilotSummary/getPilotSummaryData'
        });

    me.diffValues = {};
    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
          proxy : oProxy,
          fields : me.dataFields,
          scope : me
        });

    var pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
          dataStore : me.dataStore,
          scope : me
        });
    me.expSites = [];
    var expSite = function(value, xxx, obj) {
      if (value == 'Multiple') {
        var site = 'Empty value'
        try {
          var site = obj.data.Site;
          var recIndex = obj.id;
          me.expSites[me.expSites.length] = [site, recIndex];
        } catch (e) {
        }
        var html = '<img id="img.' + site + '" style="cursor: pointer; cursor: hand;" src="static/core/img/common/plus.gif"';
        html = html + ' onclick="addEntries(\'' + site + '\',' + recIndex + ')" />';
        return html
      }
    }
    var oColumns = {
      "None" : {
        "dataIndex" : "CE",
        "properties" : {
          width : 26,
          sortable : false,
          hideable : false,
          fixed : true,
          menuDisabled : true
        },
        renderer : expSite
      },
      "None" : {
        "dataIndex" : "StatusIcon",
        "properties" : {
          width : 26,
          sortable : false,
          hideable : false,
          fixed : true,
          menuDisabled : true,
          name : 'expand',
          id : 'expand'
        },
        "renderFunction" : "rendererStatus"
      },
      "Site" : {
        "dataIndex" : "Site",
        "properties" : {
          fixed : true
        }
      },
      "CE" : {
        "dataIndex" : "CE"
      },
      "PilotJobEff (%)" : {
        "dataIndex" : "PilotJobEff"
      },
      "PilotsPerJob" : {
        "dataIndex" : "PilotsPerJob"
      },
      "Submitted" : {
        "dataIndex" : "Submitted",
        "properties" : {
          hidden : true
        }
      },
      "Ready" : {
        "dataIndex" : "Ready",
        "properties" : {
          hidden : true
        }
      },
      "Waiting" : {
        "dataIndex" : "Waiting"
      },
      "Scheduled" : {
        "dataIndex" : "Scheduled"
      },
      "Running" : {
        "dataIndex" : "Running"
      },
      "Done" : {
        "dataIndex" : "Done"
      },
      "Aborted" : {
        "dataIndex" : "Aborted"
      },
      "Aborted_Hour" : {
        "dataIndex" : "Aborted_Hour"
      },
      "Done_Empty" : {
        "dataIndex" : "Done_Empty",
        "properties" : {
          hidden : true
        }
      },
      "Total" : {
        "dataIndex" : "Total",
        "properties" : {
          hidden : true
        }
      }
    };

    var showPilothandler = function() {
      var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID");
      var sId = GLOBAL.APP.CF.zfill(oId, 8);
      var setupdata = {};
      setupdata.data = {};
      setupdata.currentState = sId;
      setupdata.data.leftMenu = {};
      setupdata.data.leftMenu.selectors = {};
      setupdata.data.leftMenu.selectors.jobGroup = {
        data_selected : [sId],
        hidden : false,
        not_selected : false
      };

      GLOBAL.APP.MAIN_VIEW.createNewModuleContainer({
            objectType : "app",
            moduleName : me.applicationsToOpen['PilotMonitor'],
            setupData : setupdata
          });
    }

    var menuitems = {
      'Visible' : [{
        "text" : "Show Pilots",
        "handler" : showPilothandler,
        "properties" : {
          tooltip : 'Click to show the jobs which belong to the selected request.'
        }
      }]
    };

    me.contextGridMenu = new Ext.dirac.utils.DiracApplicationContextMenu({
          menu : menuitems,
          scope : me
        });

    me.grid = Ext.create('Ext.dirac.utils.DiracGridPanel', {
          store : me.dataStore,
          features : [{
            ftype : 'grouping'
          }],
          oColumns : oColumns,
          tbar : pagingToolbar,
          contextMenu : me.contextGridMenu,
          pagingToolbar : pagingToolbar,
          scope : me
        });

    me.add([me.leftPanel, me.grid]);

  }
});