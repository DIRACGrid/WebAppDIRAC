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
        me.downTimePanel = Ext.create("Ext.panel.Panel", {
              title : "Downtimes",
              columnWidth : 1 / 3,
              html : "dadad"

            });
        me.policies = Ext.create("Ext.panel.Panel", {
              title : "Policies",
              columnWidth : 1 / 3,
              html : "dsdsd"

            });
        me.timeline = Ext.create("Ext.panel.Panel", {
              title : "Timeline",
              columnWidth : 1 / 3,
              html : "dsdsd"

            });
        me.familymaters = Ext.create("Ext.panel.Panel", {
              title : "Family matters",
              html : "dsdsd"

            });
        me.callParent(arguments);
        me.add([me.viewPanel, me.historyPanel, me.downTimePanel, me.policies, me.timeline, me.familymaters]);
      },
      updatePanel : function(selection) {
        var me = this;
        me.viewPanel.setTitle(selection.Name);
        me.view.getStore().loadData([selection]);

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
              },
              success : function(response) {

                var jsonData = Ext.JSON.decode(response.responseText);

                if (jsonData["success"] == "true") {
                  me.historyGrid.getStore().loadData(jsonData["result"]);
                }
              }
            });

      }

    });
