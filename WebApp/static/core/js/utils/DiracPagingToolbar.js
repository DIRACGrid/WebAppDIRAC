/**
 * This widget contains different tool bar buttons. We have to provide the tool buttons using a dictionary. The tool buttons have to be defined same way as
 * {@link Ext.dirac.utils.DiracApplicationContextMenu}
 * The format of the dictionary is {'Visible':[],'Protected':[]} The Visible buttons are available to all users, while the Protected buttons are available
 * only users which are in a certain group(They have a certain role).
 *
 * The Visible and Protected lists contains dictionaries which have the following format: {"text":"a","handler":func,"arguments":[a,b,c], properties:{}}
 *      -text: the menu item name (this text will appears in the menu)
 *      -handler: this function handle the event.
 *      -arguments: we can pass parameters to the func method.
 *      -properties: We can provide properties which are properties of the {@link Ext.menu.Menu}.
 *      -property: It is used when the menu item is protected. (We allow to use the functionalities to a certain users).
 *
 *
 * For example:
 *
 *
 *    pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar",{
 *        toolButtons : toolButtons,
 *        dataStore : me.dataStore,
 *        scope : me
 *      });
 *
 *    -toolButons: It is the dictionary which describe the buttons. In the following example we can see how to defined protected tool buttons.
 *
 *       var toolButtons = {
 *       'Visible':[
 *         {"text":"", "handler":me.__oprJobAction, "arguments":["reschedule", ""],"properties":{tooltip : "Reschedule", iconCls : "dirac-icon-reschedule"}},
 *         {"text":"", "handler":me.__oprJobAction, "arguments":["kill", ""],"properties":{tooltip : "Kill", iconCls : "dirac-icon-kill"}},
 *         {"text":"", "handler":me.__oprJobAction, "arguments":["delete", ""],"properties":{tooltip : "Delete", iconCls : "dirac-icon-delete"}},
 *         {"text":"", "handler":me.__setActiveItemInTheCentralWorkPanel,"arguments":[],"properties":{iconCls : "dirac-icon-pie",tooltip : "Go to the statistics panel"}}
 *        ],
 *       'Protected':[
 *        {"text":"","handler":me.__oprJobAction, "arguments":["reset", ""],"properties":{tooltip : "Reset", iconCls : "jm-red-reset-icon"}, "property":"JobAdministrator"}
 *        ]};
 *
 *    -dataStore: It is the {@link Ext.dirac.utils.DiracJsonStore} object.
 *    -scope: It is used to have access to the main widget.
 *
 */
Ext.define('Ext.dirac.utils.DiracPagingToolbar',{
  extend:'Ext.toolbar.Paging',
  requires : ['Ext.dirac.utils.DiracIdListButton', 'Ext.dirac.utils.DiracPageSizeCombo'],
  displayInfo : true,
  displayMsg : 'Displaying topics {0} - {1} of {2}',
  items : [],
  emptyMsg : "No topics to display",
  prependButtons : true,
  /*layout : {
    overflowHandler : 'Scroller'
  },*/
  /***
   * @cfg{List} pagingToolbarItems
   * It contains the tool bar items such as buttons, size combo, etc.
   */
  pagingToolbarItems : [],
  /***
   * @cfg{List} pagingToolbarButtons
   * It contains the tool bar buttons.
   */
  pagingToolbarButtons : [],
  /***
   * @cfg{Ext.dirac.utils.DiracPageSizeCombo}pageSizeCombo
   * This widget is the page size combo.
   */
  pageSizeCombo : null,
  /***
   * @cfg{Ext.dirac.utils.DiracJsonStore}dataStore
   * The associated data store object.
   */
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
  /***
   * This function is used to load the data which is saved in the User Profile.
   * @param{Object}data
   * it contains the saved values.
   */
  loadState : function(data) {
    var me = this;
    if (data.pageSize) {

      me.pageSizeCombo.suspendEvents(false);
      me.pageSizeCombo.setValue(data.pageSize);
      me.pageSizeCombo.resumeEvents();

    }
  },
  /**
   * It returns the data which has to be saved in the User Profile.
   * @return{Object}
   */
  getStateData : function() {
    var me = this;
    var pageSize = me.pageSizeCombo.getValue();
    return pageSize;
  },
  /***
   * @private
   * @param{Object} It is the time when the next refresh will occur.
   * It is used to set how often refresh the widgets.
   */
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