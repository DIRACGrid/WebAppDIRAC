Ext.define('Ext.dirac.utils.DiracPagingToolbar',{
  extend:'Ext.toolbar.Paging',
  requires : ['Ext.dirac.utils.DiracIdListButton', 'Ext.dirac.utils.DiracPageSizeCombo'],
  displayInfo : true,
  displayMsg : 'Displaying topics {0} - {1} of {2}',
  items : [],
  emptyMsg : "No topics to display",
  prependButtons : true,
  layout : {
    overflowHandler : 'Scroller'
  },
  pagingToolbarItems : [],
  pagingToolbarButtons : [],
  pageSizeCombo : null,
  dataStore : null,
  constructor : function (config){
    var me = this;
    me.pagingToolbarItems = []; //make sure there is no element in the list
    me.pagingToolbarButtons = [];
    var idBtn = Ext.create('Ext.dirac.utils.DiracIdListButton', {scope: config.scope});
    me.pagingToolbarItems.push(idBtn);
    me.pagingToolbarItems.push("-");

    if (config.toolButtons){
      if ("Visible" in config.toolButtons && config.toolButtons.Visible.length >0){
        for (var i = 0; i < config.toolButtons.Visible.length; i++){
            me.pagingToolbarButtons[i] = Ext.create('Ext.Button',{
              text : config.toolButtons.Visible[i].text,
              handler : Ext.bind(config.toolButtons.Visible[i].handler, config.scope, config.toolButtons.Visible[i].arguments, false)
            });
            if ("properties" in config.toolButtons.Visible[i]){
              Ext.apply(me.pagingToolbarButtons[i], config.toolButtons.Visible[i].properties);
            }
          }
      }
      if ("Protected" in config.toolButtons && config.toolButtons.Protected.length > 0 ){
        for (var i = 0; i < config.toolButtons.Protected.length; i++){
          if (("properties" in GLOBAL.USER_CREDENTIALS) && (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, config.toolButtons.Protected[i].property) != -1)) {
            me.pagingToolbarButtons[i] = Ext.create('Ext.Button',{
              text : config.toolButtons.Protected[i].text,
              handler : Ext.bind(config.toolButtons.Protected[i].handler, config.scope,  config.toolButtons.Protected[i].arguments, false)
            });
            if ("properties" in config.toolButtons.Protected[i]){
              Ext.apply(me.pagingToolbarButtons[i], config.toolButtons.Protected[i].properties);
            }
          }
        }
      }
    }

    for (var i in me.pagingToolbarButtons){
      me.pagingToolbarItems.push(me.pagingToolbarButtons[i]);
    }

    me.pagingToolbarItems.push('-');
    me.pagingToolbarItems.push('->');

    me.pagingToolbarItems.push('Items per page: ');

    me.pageSizeCombo = Ext.create("Ext.dirac.utils.DiracPageSizeCombo",{scope:config.scope});

    me.pageSizeCombo.on("change", function(combo, newValue, oldValue, eOpts) {
      var me = this;
      me.dataStore.pageSize = newValue;
      me.oprLoadGridData();
    }, config.scope);

    me.pagingToolbarItems.push(me.pageSizeCombo);
    me.updateStamp = new Ext.Button({
      disabled : true,
      // disabledClass:'my-disabled',
      text : 'Updated: -'
    });

    me.pagingToolbarItems.push(me.updateStamp);

    if (config.dataStore){
      me.dataStore = config.dataStore;
    }
    me.callParent(arguments);
  },
  initComponent : function(config){
    var me = this;
    Ext.apply(me, {items: me.pagingToolbarItems})
    me.callParent(arguments);

    var refreshButton = me.getComponent('refresh');
    var index = me.items.indexOf(refreshButton);
    var updateindex = me.items.indexOf(me.updateStamp);
    me.items.insert(index+1, me.items.items[updateindex]);

    refreshButton.handler = function() {
      var parent = me.scope;
      parent.oprLoadGridData();
    };

    ///change the refresh button
    me.autoRefresh = new Ext.menu.Menu({
      items: [
              {text: 'Disabled',   group : 'column',checked:true,handler: function(){ me.__setRefreshCycle(0); this.cehcked = true;}},
              {text: 'Each 15m',   group : 'column',checked:false,handler: function(){ me.__setRefreshCycle(60000);}},
              {text: 'Each 30m',   group : 'column',checked:false, handler: function(){ me.__setRefreshCycle(1800000); }},
              {text: 'Every hour', group : 'column',checked:false, handler: function(){ me.__setRefreshCycle(3600000); }}
              ]
    });

    me.mouseup = false;
    me.refreshMenu = false;
    refreshButton.on('render',function( oElem, eOpts ){
      me.mon(oElem.el, 'mouseup', function (event, html, eOpts) {
        me.mouseup = true;
      }, me);
      me.mon(oElem.el, 'mousedown', function( e, t, eOpts ) {
        me.mouseup = false;
        Ext.defer(function(){
          if(me.mouseup == false){
            me.autoRefresh.showBy(oElem.el);
            me.refreshMenu = true;
          }else{
            me.mouseup = false;
          }
        }, 1500, me);
      }, me);
    });
    refreshButton.on('click', function(){
      if (me.refreshMenu){
        me.refreshMenu = false;
        return false;
      }
    });
  },
  __setRefreshCycle : function(time){
    var me = this;
    me.refreshCycle = time; //it is used if we want to save the state!!!
    if (time != 0){
      clearInterval(me.dataStore.refreshTimeout);
      me.dataStore.refreshTimeout = setInterval(function(){
        me.dataStore.load();
      }, time);
    }else{
      clearInterval(me.dataStore.refreshTimeout);
    }
  },
});