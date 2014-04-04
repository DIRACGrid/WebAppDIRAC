/**
 * To be defined
 */
Ext.define('Ext.dirac.views.tabs.TabPanel', {
  extend : 'Ext.tab.Panel',
  requires : ['Ext.dirac.views.tabs.TabScrollerMenu'],
  xtype : 'diractabcontainer',
  alias : 'widget.tabPanel',
  resizeTabs : true,
  dragable : true,
  isLoaded : false,
  enableTabScroll : true,
  hasClose : false,
  activeTab : 0,
  layout : 'fit',
  view : 'tabView',
  // renderTo:Ext.getBody(),
  /*
   * defaults : { autoScroll : true, bodyPadding : 10, bodyStyle: { background:
   * '#AAAAAA' }, },
   */
  bodyStyle : {
    background : '#AAAAAA'
  },
  workspace : null,
  plugins : [{
        ptype : 'tabscrollermenu',
        maxText : 15,
        pageSize : 5
      }],
  setWorkspace : function(wsk) {
    this.workspace = wsk;
  },
  getWorkspace : function() {
    return this.workspace;
  },
  initComponent : function() {
    var me = this;
    me.callParent(arguments);
    /*
     * me.loadMask = new Ext.LoadMask(me, { msg : "Loading ..." });
     */
  },
  listeners : {
    'beforeclose' : function() {
      var me = this;
      var appContainer = GLOBAL.APP.MAIN_VIEW.getRightContainer().getApplicationContainer(); // we have to set the active tab to this widget.
      if (appContainer) {
        appContainer.setActiveTab(me);
      }
      Ext.MessageBox.confirm('Confirm', 'There is an active desktop state. Do you want to save the current state?', function(button) {
            var me = this;
            if (button === 'yes') {
              GLOBAL.APP.MAIN_VIEW.saveActiveDesktopState();
            } else {
              me.doClose(); // generate a close event again.
            }

          }, me);
      return false; // it cancel the close of the tab. it wait until the state
      // is saved.
    },
    'close' : function() {
      var me = this;
      Ext.Array.remove(GLOBAL.APP.MAIN_VIEW._state_related_url, me.title); // we have to remove the desktop from the list.
      GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.title); // We have to remove the desktop state from the  list.
      GLOBAL.APP.MAIN_VIEW.currentState = ""; // the current state has to be
      // null;
      GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();
    },
    'tabchange' : function(tabPanel, newCard, oldCard, eOpts) {
      var me = this;
      if (newCard.type == 'desktop') { // Ignore the change of the applications

        GLOBAL.APP.SM.oprAddActiveState("desktop", newCard.title);// OK
        GLOBAL.APP.MAIN_VIEW.currentState = newCard.title; // as we work more than one desktop, we need to set the current state each time when a tab has changed.
        // newCard.loadMask.show();
        if (!GLOBAL.APP.MAIN_VIEW.loading && !newCard.isLoaded && newCard.title != 'Default') {
          GLOBAL.APP.MAIN_VIEW.loadDesktopStateData(newCard.title, newCard);
          newCard.isLoaded = true;
        }
      } else {// it is an application
        if (newCard.toLoad && !newCard.isLoaded) {
          newCard.loadData();
          newCard.isLoaded = true;
        }
      }
    }
  },
  /**
   * It is used to return a given tab.
   * 
   * @property tabName {String} tabName it returns the tab from the container.
   * @return tab {Ext.dirac.views.tabs.TabPanel}
   */
  getTab : function(tabName) {
    var tab = null;
    var me = this;
    me.items.each(function(tabObj, value, length) {
          console.log(tabObj);
          if (tabObj.title == tabName) {
            tab = tabObj;
            return;
          }
        });
    return tab;
  },
  /**
   * 
   * @property state
   * @return
   */
  getPanel : function(state) {
    var panel = null;
    var me = this;
    me.items.each(function(panelObj, value, length) {
          if (panelObj.currentState == state) {
            panel = panelObj;
            return;
          }
        });
    return panel;
  }
    // plugins : Ext.create('Ext.dirac.views.tabs.TabCloseMenu', {
    // extraItemsTail : [ '-', {
    // text : 'Closable',
    // checked : true,
    // hideOnClick : true,
    // handler : function(item) {
    // currentItem.tab.setClosable(item.checked);
    // }
    // }, '-', {
    // text : 'Enabled',
    // checked : true,
    // hideOnClick : true,
    // handler : function(item) {
    // currentItem.tab.setDisabled(!item.checked);
    // }
    // } ],
    // listeners : {
    // aftermenu : function() {
    // currentItem = null;
    // },
    // beforemenu : function(menu, item) {
    //menu.child('[text="Closable"]').setChecked(item.closable);
    //menu.child('[text="Enabled"]').setChecked(!item.tab.isDisabled());

    //currentItem = item;
    //}
    //}
    //}),
  });
