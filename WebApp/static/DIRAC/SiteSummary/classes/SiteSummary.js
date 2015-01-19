Ext.define("DIRAC.SiteSummary.classes.SiteSummary", {
      extend : 'Ext.dirac.core.Module',
      requires : ["Ext.dirac.utils.DiracBaseSelector", "Ext.dirac.utils.DiracJsonStore", "Ext.dirac.utils.DiracAjaxProxy", "Ext.dirac.utils.DiracPagingToolbar", 'Ext.dirac.utils.DiracToolButton', "Ext.dirac.utils.DiracApplicationContextMenu", "Ext.dirac.utils.DiracGridPanel",
          "Ext.dirac.utils.DiracRowExpander"],
      loadState : function(data) {
        var me = this;

        me.grid.loadState(data);

        me.leftPanel.loadState(data);
      },
      getStateData : function() {
        var me = this;

        var oStates = {
          grid : me.grid.getStateData(),
          leftMenu : me.leftPanel.getStateData()
        };

        return oStates;
      },

      dataFields : [{
            name : 'Name'
          }, {
            name : 'Country'
          }, {
            name : 'Status'
          }, {
            name : 'Reason'
          }, {
            name : 'DateEffective',
            type : 'date',
            dateFormat : 'Y-m-d H:i:s'
          }, {
            name : 'TokenExpiration',
            type : 'date',
            dateFormat : 'Y-m-d H:i:s'
          }, {
            name : 'ElementType'
          }, {
            name : 'StatusType'
          }, {
            name : 'LastCheckTime',
            type : 'date',
            dateFormat : 'Y-m-d H:i:s'
          }, {
            name : 'TokenOwner'
          }],

      initComponent : function() {
        var me = this;

        me.launcher.title = "Site Summary";
        me.launcher.maximized = false;

        if (GLOBAL.VIEW_ID == "desktop") {

          var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

          me.launcher.width = oDimensions[0];
          me.launcher.height = oDimensions[1];

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
          name : "Name",
          elementType : "SiteType",
          status : "Status",
          statusType : "StatusType",
          tokenOwner : "TokenOwner"
        };

        var map = [["name", "name"], ["elementType", "elementType"], ["status", "status"], ["statusType", "statusType"], ["tokenOwner", "tokenOwner"]];

        me.leftPanel = new Ext.create('Ext.dirac.utils.DiracBaseSelector', {
              scope : me,
              cmbSelectors : selectors,
              datamap : map,
              hasTimeSearchPanel : false,
              url : "SiteSummary/getSelectionData"
            });

        /*
         * -----------------------------------------------------------------------------------------------------------
         * DEFINITION OF THE GRID
         * -----------------------------------------------------------------------------------------------------------
         */
        var oProxy = Ext.create('Ext.dirac.utils.DiracAjaxProxy', {
              url : GLOBAL.BASE_URL + 'SiteSummary/getSiteSummaryData'
            });

        me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
              proxy : oProxy,
              fields : me.dataFields,
              scope : me
            });

        var pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
              store : me.dataStore,
              scope : me,
              value : 100
            });

        var oColumns = {
          "None2" : {
            "dataIndex" : "Status",
            "properties" : {
              width : 26,
              sortable : false,
              hideable : false,
              fixed : true,
              menuDisabled : true
            },
            "renderFunction" : "rendererStatus"
          },
          "Name" : {
            "dataIndex" : "Name",
            "properties" : {
              fixed : true
            }
          },
          "Country" : {
            "dataIndex" : "Country",
            "properties" : {
              hideable : true,
              ortable : true,
              align : 'left'
            },
            renderer : function flag(code) {
              return '<img src="' +  GLOBAL.BASE_URL + 'static/core/img/flags/' + code + '.gif">';
            }
          },
          "SiteType" : {
            "dataIndex" : "ElementType"
          },
          "StatusType" : {
            "dataIndex" : "StatusType",
            "properties" : {
              width : 60,
              sortable : false
            }
          },
          "Status" : {
            "dataIndex" : "Status"
          },
          "Reason" : {
            "dataIndex" : "Reason"
          },
          "DateEffective" : {
            "dataIndex" : "DateEffective",
            "properties" : {
              sortable : true
            }
          },
          "LastCheckTime" : {
            "dataIndex" : "LastCheckTime",
            "properties" : {
              sortable : true
            }
          },
          "TokenOwner" : {
            "dataIndex" : "TokenOwner",
            "properties" : {
              sortable : true
            }
          },
          "TokenExpiration" : {
            "dataIndex" : "TokenExpiration",
            "properties" : {
              sortable : true
            }
          }
        };

        var statusSubmenu = {
          'Visible' : [{
                "text" : "Active",
                "handler" : me.__oprSetSite,
                "arguments" : ["setStatus", "Active"],
                "properties" : {
                  tooltip : 'Click to activate the resource.'
                }
              }, {
                "text" : "Degraded",
                "handler" : me.__oprSetSite,
                "arguments" : ["setStatus", "Degraded"],
                "properties" : {
                  tooltip : 'Click to set degraded the resource.'
                }
              }, {
                "text" : "Probing",
                "handler" : me.__oprSetSite,
                "arguments" : ["setStatus", "Probing"],
                "properties" : {
                  tooltip : 'Click to set probing the resource.'
                }
              }, {
                "text" : "Banned",
                "handler" : me.__oprSetSite,
                "arguments" : ["setStatus", "Banned"],
                "properties" : {
                  tooltip : 'Click to set banned the resource.'
                }
              }]
        };
        var tokenSubmenu = {
          'Visible' : [{
                "text" : "Acquire",
                "handler" : me.__oprSetSite,
                "arguments" : ["setToken", "Acquire"],
                "properties" : {
                  tooltip : 'Click to acquire the resource.'
                }
              }, {
                "text" : "Release",
                "handler" : me.__oprSetSite,
                "arguments" : ["setToken", "Release"],
                "properties" : {
                  tooltip : 'Click to release the resource.'
                }
              }]
        };
        var menuitems = {
          'Visible' : [{
                "text" : "Overview",
                "handler" : me.__oprShowEditor,
                "properties" : {
                  tooltip : 'Click to show the jobs which belong to the selected request.'
                }
              }, {
                "text" : "-" // separator
              }, {
                "text" : "History",
                "handler" : me.__oprOnSiteSummaryData,
                "arguments" : ["History"],
                "properties" : {
                  tooltip : 'Click to show the history of the selected resource.'
                }
              }, {
                "text" : "Policies",
                "handler" : me.__oprOnSiteSummaryData,
                "arguments" : ["Policies"],
                "properties" : {
                  tooltip : 'Click to show the policies of the selected resource.'
                }
              }, {
                "text" : "-" // separator
              }, {
                "text" : "Set status",
                "subMenu" : statusSubmenu
              }, {
                "text" : "Set token",
                "subMenu" : tokenSubmenu
              }]
        };

        me.contextGridMenu = new Ext.dirac.utils.DiracApplicationContextMenu({
              menu : menuitems,
              scope : me
            });

        me.grid = Ext.create('Ext.dirac.utils.DiracGridPanel', {
              store : me.dataStore,
              columnLines : true,
              width : 600,
              height : 300,
              oColumns : oColumns,
              contextMenu : me.contextGridMenu,
              pagingToolbar : pagingToolbar,
              scope : me
            });

        me.leftPanel.setGrid(me.grid);

        /*
         * me.overviewPanel =
         * Ext.create("DIRAC.ResourceSummary.classes.OverviewPanel", {
         * applicationName : me.applicationName, parentWidget : me });
         */
        me.add([me.leftPanel, me.grid]);// , me.overviewPanel]);

      },
      __oprOnSiteSummaryData : function(action) {
        var me = this;
        var selectedValues = me.__getSelectedValues();
      },
      __getSelectedValues : function() {
        var me = this;

        var values = {};

        values.name = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "Name");
        values.elementType = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "ElementType");
        values.statusType = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "StatusType");
        values.lastCheckTime = Ext.Date.format(GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "LastCheckTime"), "Y-m-d H:i:s");

        return values;
      },
      __oprSetSite : function(action, newStatus) {
        var me = this;
        var selectedValues = me.__getSelectedValues();
      },
      __oprShowEditor : function() {
        var me = this;
        var values = me.__getSelectedValues();
        me.overviewPanel.maximizedSize = {
          height : me.grid.getHeight() + me.leftPanel.getHeight(),
          width : me.grid.getWidth() + me.leftPanel.getWidth()
        };
        me.overviewPanel.loadData(values);
        me.overviewPanel.expand();
        me.overviewPanel.show();
      }

    });