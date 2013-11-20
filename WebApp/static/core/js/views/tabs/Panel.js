/**
 *This is used to show an application....
 *@class Ext.dirac.core.Panel
 *@extends Ext.panel.Panel
 */
Ext.define('Ext.dirac.views.tabs.Panel',{
  extend : 'Ext.panel.Panel',
  alias : 'widget.diraccomonpanel',
  requires : [ "Ext.LoadMask" ],
  width : 600,
  height : 400,
  closable : true,
  dragable : true,
  collapsible : false, //do not allow to minimize the panel.
  currentState : "",
  desktopName:"Default",
  hasClose : false,
  layout : 'fit',
  activeTab : null,
  defaults: {
    layout : 'fit'
  },
  isOpen : false,
  //renderTo : Ext.getBody(),
  //autoRender : true,
  /**
   * property {string} appClassName is the class name of the application
   */
  appClassName : null,
  listeners : {
    beforeclose : function(panel, eOpts ){
      var me = this;
      Ext.MessageBox.confirm('Confirm', 'There is an active desktop state. Do you want to save the current state?', function(button) {
        var me = this;
        if (button == 'yes') {
          var funcAfterSave = function(iCode, sAppName, sStateType, sStateName) {

            if ((iCode == 1) && (me.currentState != sStateName)) {

              GLOBAL.APP.MAIN_VIEW.getRightContainer().addStateToExistingWindows(sStateName, sAppName);

              if (me.currentState != "")
                GLOBAL.APP.SM.oprRemoveActiveState(sAppName, me.currentState);

              me.loadedObject.currentState = sStateName;
              me.currentState = sStateName;
              GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);
              me.setTitle(me.loadedObject.launcher.title + " [" + me.loadedObject.currentState + "]");

              //GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

              if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow)
                GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
            }

          };
          GLOBAL.APP.MAIN_VIEW.SM.oprSaveAppState("application", me.loadedObject.self.getName(), me.loadedObject, funcAfterSave);

        }else{
          panel.removeAndclose(panel); //generate a close event again.
        }
      },me);
      return false;
    },
    afterrender : function ( panel, eOpts ){
      var leftCont = GLOBAL.APP.MAIN_VIEW.getLeftContainer();
      if (leftCont){
        var selPanel = leftCont.getSelectionPanel() //this contains the tree(menu)
      }
    },
    render : function(oElem, eOpts) {
      var me = this;
      if (me.activeTab){
        me.activeTab.setLoading(false);
      }
      if (me.activeTab && me.activeTab.view == 'presenter'){
        me.mon(oElem.el, 'mouseover', function (event, html, eOpts) {
          if (!me.isOpen){
            me.header.show();
          }
        }, me);
        me.mon(oElem.el, 'mouseout', function (event, html, eOpts) {
          if (!me.isOpen){
            me.header.hide();
          }
        }, me);
      }
    },
  },
  removeAndclose : function(panel, eOpts){
    var activeTab = GLOBAL.APP.MAIN_VIEW.getRightContainer().getApplicationContainer().getActiveTab();
    if (activeTab){
      activeTab.remove(panel);
    }
  },
  initComponent : function() {
    var me = this;
    me.loadMask = new Ext.LoadMask(me, {
      msg : "Loading ..."
    });

    if (me.loadedObjectType == "app") {
      me.title = me.loadedObject.launcher.title;
      me.items = [ me.loadedObject ];
      me.appClassName = me.loadedObject.self.getName();
    } else if (me.loadedObjectType == "link") {
      me.items = [ {
        xtype : "component",
        autoEl : {
          tag : "iframe",
          src : me.linkToLoad
        }
      } ];
      me.appClassName = "link";
    }
    // a list of the child windows
    me.oneTimeAfterShow = false;

    me.childWindows = [];
    this.callParent();
  },
  /**
   * It returns the class name of the application
   */
  getClassName : function() {
    return this.appClassName;
  },
  getAppClassName : function() {
    return this.appClassName;
  },
  loadData : function(){
    var me = this;
    console.log('cool');
    if (!me.oneTimeAfterShow) {
      if (me.loadedObjectType == "app")
        me.setLoadedObject(me.setupData);
      else if (me.loadedObjectType == "link")
        me.setPropertiesWhenLink(me.setupData);

      //GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

      me.oneTimeAfterShow = true;
    }
  },
  //afterRender
  /*afterRender : function() {

    var me = this;

    me.callParent();

    if (!me.oneTimeAfterShow) {
      if (me.loadedObjectType == "app")
        me.setLoadedObject(me.setupData);
      else if (me.loadedObjectType == "link")
        me.setPropertiesWhenLink(me.setupData);

      //GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

      me.oneTimeAfterShow = true;
    }

  },*/
  setPropertiesWhenLink : function(data){
    return;
  },
  setLoadedObject : function(setupData) {

    var me = this;

    // if there is a state to load, we load that state
    if ( (setupData.stateToLoad) && setupData.stateToLoad != 'Default' ) {

      me.oprLoadAppStateFromCache(setupData.stateToLoad);

    } else {

      // if there is no state to load, but only data to apply
      if ("data" in setupData) {

        if ("currentState" in setupData) {

          if (setupData.currentState != "") {
            me.currentState = setupData.currentState;
            me.loadedObject.currentState = setupData.currentState;
            GLOBAL.APP.SM.oprAddActiveState(me.loadedObject.self.getName(), me.currentState);
          }

        }

        me.loadedObject.loadState(setupData.data);
      }

    }


    if (me.currentState == "") {

      me.setTitle(me.loadedObject.launcher.title + " [Untitled]");

    } else {
      me.setTitle(me.loadedObject.launcher.title + " [" + me.currentState + "]");
    }

    // making relation between the application and the window container
    me.loadedObject.setContainer(me);

  },
  oprLoadAppStateFromCache : function(stateName) {

    var me = this;

    // checking whether the state exists or not
    var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", me.appClassName, stateName);// OK

    switch (iStateLoaded) {
    case -1:
      GLOBAL.APP.CF.alert("The state" +stateName+" does not exist !", "warning");
      return;
      break;
    case -2:
      me.funcPostponedLoading = function() {

      me.oprLoadAppStateFromCache(stateName);

    }

      setTimeout(me.funcPostponedLoading, 1000);
      return;
      break;
    }

    /*
     * loading the state data and setting other properties related to the window
     */
    me.loadMask.show();

    me.closeAllChildWindows();

    me.loadedObject.loadState(GLOBAL.APP.SM.getStateData("application", me.appClassName, stateName));// OK

    if (me.currentState != "")
      GLOBAL.APP.SM.oprRemoveActiveState(me.appClassName, me.currentState);// OK

    me.currentState = stateName;
    me.loadedObject.currentState = stateName;

    GLOBAL.APP.SM.oprAddActiveState(me.appClassName, stateName);// OK
    //GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

    me.setTitle(me.loadedObject.launcher.title + " [" + stateName + "]");
    me.loadMask.hide();

  },
  /**
   * Function to close all child windows
   *
   */
  closeAllChildWindows : function() {

    var me = this;

    for ( var i = me.childWindows.length - 1; i >= 0; i--)
      me.childWindows[i].close();

  },

  /**
   * Function to load module state with data from the cache
   *
   * @param {String}
   *          stateName The name of the state
   */
  createChildWindow : function(sTitle, oModal, oWidth, oHeight) {

    var me = this;

    var oWindow = GLOBAL.APP.MAIN_VIEW.getRightContainer().createModalWindow({
      height : oHeight,
      width : oWidth,
      title : sTitle,
      modal : oModal,
      parentWindow : me,
      isChildWindow : true,
      iconCls : "system_child_window"
    });

    me.childWindows.push(oWindow);

    return oWindow;

  },
});
