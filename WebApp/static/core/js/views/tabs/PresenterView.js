/***
 * Without this panel the tools(I mean the Presenter tools) are not visible in the tab panel....
 */
Ext.define('Ext.dirac.views.tabs.PresenterView', {
  extend : 'Ext.panel.Panel',
  requires : ['Ext.dirac.views.tabs.Presenter'],
  region : 'center',
  minWidth : 300,
  title : name,
  closable : true,
  autoRender : true,
  layout : {
    type : 'border',
    padding : 2
  },
  view : 'presenterView',
  isLoaded : false,
  listeners : {
    'resize' : function(view, width, height, oldWidth, oldHeight, eOpts ){
      var me = this;
      var panel = me.getOpenedApplication()
      if (panel){
        panel.setWidth(view.getWidth());
        panel.setHeight(view.getHeight());
      }
    },
    'beforeclose' : function(){
      var me = this;
      var appContainer = GLOBAL.APP.MAIN_VIEW.getRightContainer().getApplicationContainer(); //we have to set the active tab to this widget.
      if (appContainer){
        appContainer.setActiveTab(me);
      }
      Ext.MessageBox.confirm('Confirm', 'There is an active desktop state. Do you want to save the current state?', function(button) {
        var me = this;
        if (button === 'yes') {
          GLOBAL.APP.MAIN_VIEW.saveActiveDesktopState();
        }else{
          me.doClose(); //generate a close event again.
        }

      },me);
      return false; //it cancel the close of the tab. it wait until the state is saved.
    },
    'close' : function(){
      var me = this;
      Ext.Array.remove(GLOBAL.APP.MAIN_VIEW._state_related_url, me.title); //we have to remove the desktop from the list.
      GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.title); //We have to remove the desktop state from the list.
      GLOBAL.APP.MAIN_VIEW.currentState = ""; //the current state has to be null;
      GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();
    }
  },
  constructor : function(config){
    var me = this;
    var presenter = Ext.create('Ext.dirac.views.tabs.Presenter',{
      region : 'center',
      //minWidth : 300,
      //title : name,
      closable : false,
      app: config.app,
      desktop : config.desktop});
    Ext.apply(me, {
      items : [presenter]
    });

    me.callParent(arguments);
  },
  addImage : function(img){
    var me = this;
    //me.setLoading("Loading Image...");
    me.items.getAt(0).addImage(img);
  },
  replaceImage : function(oimgid, img){
    var me = this;
    //me.setLoading("Loading Image...");
    me.items.getAt(0).replaceImage(oimgid, img);
  },
  getOpenedApplication : function(){
    var me = this;
    var app = null;
    for (var i = 0; i < me.items.length; i++){
      var panel = me.items.getAt(i);
      if (panel.self.getName() == "Ext.dirac.views.tabs.Panel"){
        app = panel;
        break;
      }
    }
    return app;
  },
  isExist : function(name){
    var me = this;
    return me.items.getAt(0).isExist(name);
  },
  getImages : function(){
    var me = this;
    return me.items.getAt(0).items;
  },
  hideComponents : function(){
   var me = this;
   var widgetsContainer = me.items.getAt(0);
   widgetsContainer.items.each(function(widget){
     widget.hide();
   });
  },
  showComponents : function(){
    var me = this;
    var widgetsContainer = me.items.getAt(0);
    widgetsContainer.items.each(function(widget){
      widget.show();
    });
  }
});