Ext.define("DIRAC.ResourceSummary.classes.OverviewPanel", {
      extend : "Ext.panel.Panel",
      title : 'Overview',
      region : 'east',
      autoScroll : true,
      collapsible : true,
      split : true,
      region : 'east',
      margins : '2 0 2 0',
      cmargins : '2 2 2 2',
      bodyStyle : 'padding: 5px',
      width : 600,
      labelAlign : 'top',
      minWidth : 200,
      hidden : true,
      layout : "column",
      columnWidth : 2,
      listeners : {
        collapse : function(panel, eOpts) {
          panel.hide();
        }
      },
      initComponent : function() {
        var me = this;
        me.dataFields = [{
              name : 'StatusType'
            }, {
              name : 'Status'
            }, {
              name : 'ElementType'
            }, {
              name : 'Reason'
            }, {
              name : 'DateEffective'
            }, {
              name : 'LastCheckTime'
            }, {
              name : 'TokenOwner'
            }, {
              name : 'TokenExpiration'
            }];

        var viewStore = Ext.create('Ext.data.Store', {
              fields : me.dataFields
            });
        var tpl = new Ext.XTemplate('<tpl for=".">', '<div style="margin-bottom: 10px;" class="dataset-statistics">', '<b>Status Type:</b> {StatusType}<br/>', '<b>Status:</b> {Status}<br/>', '<b>ElementType:</b> {ElementType}<br/>', '<b>Reason:</b> {Reason}<br/>',
            '<b>DateEffective:</b> {DateEffective} <br><b>LastCheckTime:</b> {LastCheckTime}<br/> <b>TokenOwner:</b> {TokenOwner}<br/>', '<b>TokenExpiration:</b> {TokenExpiration}<br/>', '</div>', '</tpl>');

        me.view = new Ext.view.View({
              columnWidth : 1 / 3,
              tpl : tpl,
              store : viewStore,
              itemSelector : 'div.dataset-statistics',
              autoHeight : true
            });

        me.viewPanel = Ext.create("Ext.panel.Panel", {
              columnWidth : 1 / 3,
              items : me.view,
              layout : 'fit'
            })
        var historyStore = new Ext.data.ArrayStore({
              fields : ["Status", "DataEffectiv", "Reason"],
              data : []
            });

        me.historyGrid = Ext.create("Ext.grid.Panel", {
              layout : 'fit',
              store : historyStore,
              columns : [{
                    text : 'Status',
                    flex : 1,
                    sortable : false,
                    dataIndex : 'Status'
                  }, {
                    text : 'DataEffectiv',
                    flex : 1,
                    sortable : false,
                    dataIndex : 'DataEffectiv'
                  }, {
                    text : 'Reason',
                    flex : 1,
                    sortable : false,
                    dataIndex : 'Reason'
                  }],
              width : '100%',
              viewConfig : {
                stripeRows : true,
                enableTextSelection : true
              }
            })
        me.historyPanel = Ext.create("Ext.panel.Panel", {
              title : "History",
              columnWidth : 1 / 3,
              items : [me.historyGrid]
            });

        me.downtimeGrid = Ext.create("Ext.grid.Panel", {
              layout : 'fit',
              store : Ext.create("Ext.data.ArrayStore", {
                    fields : ['StartDate', 'EndDare', 'Link', 'Description', 'Severity'],
                    data : []
                  }),
              columns : [{
                    text : 'StartDate',
                    sortable : true,
                    dataIndex : 'StartDate',
                    align : 'left',
                    flex : 1
                  }, {
                    text : 'EndDate',
                    sortable : true,
                    dataIndex : 'EndDate',
                    align : 'left',
                    flex : 1
                  }, {
                    text : 'Description',
                    sortable : true,
                    dataIndex : 'Description',
                    align : 'left',
                    flex : 1
                  }, {
                    text : 'Severity',
                    sortable : true,
                    dataIndex : 'Severity',
                    align : 'left',
                    flex : 1
                  }, {
                    text : 'Link',
                    dataIndex : 'Link',
                    hidden : true,
                    flex : 1
                  }],
              width : '100%',
              viewConfig : {
                stripeRows : true,
                enableTextSelection : true
              }
            });
        me.downTimePanel = Ext.create("Ext.panel.Panel", {
              title : "Downtimes",
              columnWidth : 1 / 3,
              items : [me.downtimeGrid]

            });

        me.policiesGrid = Ext.create("Ext.grid.Panel", {
              layout : 'fit',
              store : Ext.create("Ext.data.ArrayStore", {
                    fields : ["Status", "PolicyName", "DataEffectiv", "LastCheckTime", "Reason"],
                    data : []
                  }),
              columns : [{
                    text : 'Status',
                    flex : 1,
                    sortable : false,
                    dataIndex : 'Status'
                  }, {
                    text : 'PolicyName',
                    flex : 1,
                    sortable : false,
                    dataIndex : 'PolicyName'
                  }, {
                    text : 'DataEffectiv',
                    flex : 1,
                    sortable : false,
                    dataIndex : 'DataEffectiv'
                  }, {
                    text : 'LastCheckTime',
                    flex : 1,
                    sortable : false,
                    dataIndex : 'LastCheckTime'
                  }, {
                    text : 'Reason',
                    flex : 1,
                    sortable : false,
                    dataIndex : 'Reason'
                  }],
              width : '100%',
              viewConfig : {
                stripeRows : true,
                enableTextSelection : true
              }
            });

        me.policies = Ext.create("Ext.panel.Panel", {
              title : "Policies",
              columnWidth : 1 / 3,
              items : [me.policiesGrid]

            });
        me.timeline = Ext.create("Ext.panel.Panel", {
              title : "Timeline",
              columnWidth : 1 / 3,
              html : "dsdsd"

            });
        me.familymaters = Ext.create("Ext.panel.Panel", {
              title : "Family matters",
              columnWidth : 1 / 3,
              html : "dsdsd"

            });
        me.callParent(arguments);
        me.add([me.viewPanel, me.historyPanel, me.downTimePanel, me.policies, me.timeline, me.familymaters]);
      },
      updatePanel : function(selection) {
        var me = this;
        me.viewPanel.setTitle(selection.Name);
        me.view.getStore().loadData([selection]);

        me.historyGrid.body.mask("Loading ...");
        Ext.Ajax.request({
              url : GLOBAL.BASE_URL + me.applicationName + '/action',
              method : 'POST',
              params : {
                action : Ext.JSON.encode(["History"]),
                name : Ext.JSON.encode([selection.Name]),
                elementType : Ext.JSON.encode([selection.ElementType]),
                statusType : Ext.JSON.encode([selection.StatusType])
              },
              scope : me,
              failure : function(response) {
                GLOBAL.APP.CF.showAjaxErrorMessage(response);
                me.historyGrid.body.unmask();
              },
              success : function(response) {

                var jsonData = Ext.JSON.decode(response.responseText);

                if (jsonData["success"] == "true") {
                  me.historyGrid.getStore().loadData(jsonData["result"]);
                  me.historyGrid.body.unmask();
                }
              }
            });

        me.downtimeGrid.body.mask("Loading ...");
        Ext.Ajax.request({
              url : GLOBAL.BASE_URL + me.applicationName + '/action',
              method : 'POST',
              params : {
                action : Ext.JSON.encode(["Downtime"]),
                name : Ext.JSON.encode([selection.Name]),
                elementType : Ext.JSON.encode([selection.ElementType]),
                element : Ext.JSON.encode(["Resource"]),
                statusType : Ext.JSON.encode([selection.StatusType])
              },
              scope : me,
              failure : function(response) {
                GLOBAL.APP.CF.showAjaxErrorMessage(response);
                me.downtimeGrid.body.unmask();
              },
              success : function(response) {

                var jsonData = Ext.JSON.decode(response.responseText);

                if (jsonData["success"] == "true") {
                  me.downtimeGrid.getStore().loadData(jsonData["result"]);
                  me.downtimeGrid.body.unmask();
                }
              }
            });

        me.policiesGrid.body.mask("Loading ...");
        Ext.Ajax.request({
              url : GLOBAL.BASE_URL + me.applicationName + '/action',
              method : 'POST',
              params : {
                action : Ext.JSON.encode(["Policies"]),
                name : Ext.JSON.encode([selection.Name]),
                elementType : Ext.JSON.encode([selection.ElementType]),
                statusType : Ext.JSON.encode([selection.StatusType])
              },
              scope : me,
              failure : function(response) {
                GLOBAL.APP.CF.showAjaxErrorMessage(response);
                me.policiesGrid.body.unmask();
              },
              success : function(response) {

                var jsonData = Ext.JSON.decode(response.responseText);

                if (jsonData["success"] == "true") {
                  me.policiesGrid.getStore().loadData(jsonData["result"]);
                  me.policiesGrid.body.unmask();
                }
              }
            });

      }

    });
