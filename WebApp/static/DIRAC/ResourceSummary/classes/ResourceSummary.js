Ext.define("DIRAC.ResourceSummary.classes.ResourceSummary", {
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

        me.launcher.title = "Resource Summary";
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
          elementType : "ResourceType",
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
              url : "ResourceSummary/getSelectionData"
            });

        /*
         * -----------------------------------------------------------------------------------------------------------
         * DEFINITION OF THE GRID
         * -----------------------------------------------------------------------------------------------------------
         */
        var oProxy = Ext.create('Ext.dirac.utils.DiracAjaxProxy', {
              url : GLOBAL.BASE_URL + 'ResourceSummary/getResourceSummaryData'
            });

        me.diffValues = {};
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
          "ResourceType" : {
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

        var showPilothandler = function() {
          var oSite = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "Site");
          var setupdata = {};
          setupdata.data = {};
          setupdata.currentState = oSite;
          setupdata.data.leftMenu = {};
          setupdata.data.leftMenu.selectors = {};
          setupdata.data.leftMenu.selectors.site = {
            data_selected : [oSite],
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
              columnLines : true,
              enableLocking : true,
              width : 600,
              height : 300,
              oColumns : oColumns,
              contextMenu : me.contextGridMenu,
              pagingToolbar : pagingToolbar,
              scope : me,
              columnLines : true,
              enableLocking : true,
              plugins : [{
                    ptype : 'diracrowexpander',
                    containValue : {
                      'StatusType' : "elements"
                    },
                    rowBodyTpl : ['<div id="expanded-Grid-{Name}"> </div>']
                  }]
            });

        me.leftPanel.setGrid(me.grid);

        me.grid.view.on('expandbody', function(rowNode, record, expandbody) {
              var targetId = 'expanded-Grid-' + record.get('Name');
              if (Ext.getCmp(targetId + "_grid") == null) {
                var params = {
                  "name" : Ext.JSON.encode([record.data.Name])
                };
                var oProxy = Ext.create('Ext.dirac.utils.DiracAjaxProxy', {
                      url : GLOBAL.BASE_URL + 'ResourceSummary/expand'
                    });
                oProxy.extraParams = params;
                var expandStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
                      proxy : oProxy,
                      fields : me.dataFields,
                      scope : me,
                      autoLoad : true
                    });

                var expandedGridPanel = Ext.create('Ext.grid.Panel', {
                      forceFit : true,
                      renderTo : targetId,
                      id : targetId + "_grid",
                      store : expandStore,
                      columns : [{
                            header : 'Name',
                            sortable : true,
                            dataIndex : 'Name',
                            align : 'left',
                            hideable : false,
                            fixed : true
                          }, {
                            header : 'ResourceType',
                            sortable : true,
                            dataIndex : 'ElementType',
                            align : 'left',
                            hideable : false,
                            fixed : true
                          }, {
                            header : 'StatusType',
                            width : 60,
                            sortable : true,
                            dataIndex : 'StatusType',
                            align : 'left'
                          }, {
                            header : 'Status',
                            sortable : false,
                            dataIndex : 'Status',
                            align : 'left'
                          }, {
                            header : 'Reason',
                            sortable : true,
                            dataIndex : 'Reason',
                            align : 'left'
                          }, {
                            header : 'DateEffective',
                            sortable : false,
                            dataIndex : 'DateEffective',
                            align : 'left'
                          }, {
                            header : 'LastCheckTime',
                            sortable : true,
                            dataIndex : 'LastCheckTime',
                            align : 'left'
                          }, {
                            header : 'TokenOwner',
                            sortable : true,
                            dataIndex : 'TokenOwner',
                            align : 'left'
                          }, {
                            header : 'TokenExpiration',
                            sortable : true,
                            dataIndex : 'TokenExpiration',
                            align : 'left'
                          }]
                    });

                rowNode.grid = expandedGridPanel;
                expandStore.load();
                expandedGridPanel.getEl().swallowEvent(['mouseover', 'mousedown', 'click', 'dblclick', 'onRowFocus']);
                expandedGridPanel.fireEvent("bind", expandedGridPanel, {
                      id : record.get('id')
                    });
              }
            });

        me.add([me.leftPanel, me.grid]);

      },
      
    });