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
      listeners : {
        collapse : function(panel, eOpts) {
          panel.hide();
        }
      },
      initComponent : function() {
        var me = this;
        me.dataFields = [{
              name : 'statusType'
            }, {
              name : 'status'
            }, {
              name : 'elementType'
            }, {
              name : 'reason'
            }, {
              name : 'dateEffective'
            }, {
              name : 'lastCheckTime'
            }, {
              name : 'tokenOwner'
            }, {
              name : 'tokenExpiration'
            }];

        var viewStore = Ext.create('Ext.data.Store', {
              fields : me.dataFields
            });
        var tpl = new Ext.XTemplate('<tpl for=".">', '<div style="margin-bottom: 10px;" class="dataset-statistics">', '<b>Status Type:</b> {statusType}<br/>', '<b>Status:</b> {status}<br/>', '<b>ElementType:</b> {elementType}<br/>', '<b>Reason:</b> {reason}<br/>',
            '<b>DateEffective:</b> {dateEffective} <b>LastCheckTime:</b> {lastCheckTime}<br/> <b>TokenOwner:</b> {tokenOwner}<br/>', '<b>TokenExpiration:</b> {tokenExpiration}<br/>', '</div>', '</tpl>');

        me.view = new Ext.view.View({
              title : 'fsfs',
              tpl : tpl,
              store : viewStore,
              itemSelector : 'div.dataset-statistics',
              autoHeight : true
            });
        
        me.callParent(arguments);
        me.add([me.view]);
      },
      updatePanel : function(selection) {
        var me = this;
        me.view.getStore().loadData([selection]);
      }

    });
