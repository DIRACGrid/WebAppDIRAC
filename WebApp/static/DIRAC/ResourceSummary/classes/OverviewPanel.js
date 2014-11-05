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
              tpl : tpl,
              store : viewStore,
              itemSelector : 'div.dataset-statistics',
              autoHeight : true
            });

        me.viewPanel = Ext.create("Ext.panel.Panel", {
              title : "sasasa",
              items : me.view,
              layout : 'fit'
            })
        me.historyPanel = Ext.create("Ext.panel.Panel", {
              title : "History",
              html : "cool"
            });
        me.downTimePanel = Ext.create("Ext.panel.Panel", {
              title : "Downtimes",
              html : "dadad"

            });
        me.policies = Ext.create("Ext.panel.Panel", {
              title : "Policies",
              html : "dsdsd"

            });
        me.timeline = Ext.create("Ext.panel.Panel", {
              title : "Timeline",
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
      }

    });
