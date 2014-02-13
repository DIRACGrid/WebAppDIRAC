/*******************************************************************************
 * This class contains all the widgets which are used to visualise the
 * applications. Each tab in the left container corresponds a widget in the
 * right container.
 */
Ext.define('Ext.dirac.views.tabs.RightContainer', {
  extend : 'Ext.container.Container',
  requires : ['Ext.dirac.views.tabs.TabPanel', 'Ext.dirac.views.tabs.Wallpaper', 'Ext.dirac.views.tabs.PresenterView',
      'Ext.dirac.views.tabs.Panel'],
  xtype : 'diractabs',
  taskbar : null, // this is used by the desktop layout
  layout : 'fit',
  // layout : {
  // type : 'border',
  // padding : 2
  // },
  region : 'center',
  collapsible : false,
  autoScroll : true,
  frame : true,
  defaults : {
    xtype : 'tabpanel',
    width : 400,
    height : 200,
    // defaults: {
    // bodyPadding: 10,
    // autoScroll: true
    // },
    layout : {
      type : 'border',
      padding : 2
    },
    bodyStyle : {
      background : '#AAAAAA'
    }
  },
  // this is used to hide the MenuTabs.js
  /*
   * listeners : { render: function (cmp, eOpts) { var me = this; me.mon(cmp.el,
   * 'mouseover', function (event, html, eOpts) { var leftCont =
   * GLOBAL.APP.MAIN_VIEW.getLeftContainer(); if (leftCont.collapsed){ //hide if
   * the container collapsed leftCont.hide(); } }, me); me.mon(cmp.el,
   * 'mouseout', function (event, html, eOpts) { var leftCont =
   * GLOBAL.APP.MAIN_VIEW.getLeftContainer(); if (leftCont.collapsed &&
   * (event.getX()>=0 && event.getX() <100)){ leftCont.show(); } }, me); } },
   */
  /*****************************************************************************
   * @param {String}
   *          it stores the current open component identifier.
   */
  currentOpenedApp : null,
  appLicationContainer : null,
  initComponent : function() {
    var me = this;
    me.callParent(arguments);
    me.createMenuWidgets();
  },
  /*****************************************************************************
   * It creates the widgets corresponds to the Menu in the LeftContainer.
   */
  createMenuWidgets : function() {
    var me = this;

    me.appLicationContainer = Ext.create('widget.tabPanel', {
          region : 'center',
          minWidth : 300,
          // layout:'fit',
          layout : {
            type : 'border',
            padding : 2
          },
          collapsed : false,
          margin : '0 0 2 0',
          tabPosition : 'bottom',
          value : 'menuPanel'
        });
    me.add(me.appLicationContainer);
    var wallpaper = Ext.create('widget.wallpaper', {
          layout : 'fit',
          margin : '0 0 2 0',
          value : 'welcome'
        });
    wallpaper.setWallpaper('/DIRAC/static/core/img/wallpapers/dirac_background_6.png', false);
    me.add(wallpaper);
    me.add({
          // xtype : 'panel',
          // margin: '0 0 2 0',
          value : 'sharedLayouts',
          layout : 'fit',
          closable : false,
          xtype : "component",
          autoEl : {
            tag : "iframe",
            src : "http://diracgrid.org"
          }
        });

  },
  getStateData : function() {
    var me = this;
    var oData = [];
    var activetab = me.getApplicationContainer().getActiveTab();
    if (activetab.view == 'presenterView') {
      var views = activetab.getPresenter();
      if (views && (len = views.items.length)) {
        for (var i = 0; i < len; i++) {
          win = views.items.getAt(i);
          /*
           * Depends on the loadedObjectType
           */
          var oElem = null;

          if (win.loadedObjectType == "app") {

            oData.push({
                  module : win.getAppClassName(),
                  data : win.loadedObject.getStateData(),
                  currentState : win.currentState
                });

          } else if (win.loadedObjectType == "link") {

            oData.push({
                  link : win.linkToLoad
                });
          }
        }
      }
    } else {
      var tabs = activetab.items;
      if (tabs) {
        var bFoundNotLoadedapps = false;
        tabs.each(function(win, value, length) {

              /*
               * Depends on the loadedObjectType
               */
              var oElem = null;
              // We only save the applications which are loaded

              if (win.isLoaded) {

                if (win.loadedObjectType == "app") {

                  oData.push({
                        module : win.getAppClassName(),
                        data : win.loadedObject.getStateData(),
                        currentState : win.currentState
                      });

                } else if (win.loadedObjectType == "link") {

                  oData.push({
                        link : win.linkToLoad
                      });

                }
              } else {
                bFoundNotLoadedapps = true;
              }
            });
        if (bFoundNotLoadedapps) {
          // We may have applications which are not opened. We have to save the
          // status of this applications as well. These application states is
          // retrieved
          // from the SM.
          var desktopName = activetab.title;
          if (desktopName && GLOBAL.APP.SM.isStateLoaded("application", "desktop", desktopName)) {
            var oStateData = GLOBAL.APP.SM.getStateData("application", "desktop", desktopName);
            for (var i = 0; i < oStateData.data.length; i++) {
              if (!me.__isStateFound(oData, oStateData.data[i].currentState)) {
                oData.push(oStateData.data[i]);
              }
            }

          } else {
            GLOBAL.APP.CF.alert("This desktop can not be saved!", "error");
          }
        }

      }
    }
    return oData;
  },
  /*****************************************************************************
   * This function is used to check that the currentState is in the array.
   *
   * @param {Ext.Array}
   *          Array is an array which contains the application state objects.
   * @param {String}
   *          item is the state name.
   * @return {Boolean}
   */
  __isStateFound : function(Array, item) {
    var found = false;
    for (var i = 0; i < Array.length; i++) {
      if (Array[i].currentState == item) {
        found = true;
        break;
      }
    }
    return found;
  },

  /*****************************************************************************
   * It keeps the current opened application.
   *
   * @param {Object}
   *          oApp the current application which is opened
   */
  setOpenedApp : function(appId) {
    var me = this;
    me.currentOpenedApp = appId;
  },
  /*****************************************************************************
   * It returns the id of the current application.
   */
  getOpenedApp : function() {
    var me = this;
    return me.currentOpenedApp;
  },
  getApplicationContainer : function() {
    var me = this;
    return me.appLicationContainer;
  },
  /**
   * It changes the tab to a specific tab.
   *
   * @param{String} type is a string the name of the
   *                menu:welcome,menuPanel,sharedLayouts
   */
  changePanel : function(type) {
    var me = this;
    if (me.exists(type)) {
      me.makeVisible(type);
    } else {
      GLOBAL.APP.CF.alert("This menu is not implemented!", "error");
    }
  },
  exists : function(type) {
    var me = this;
    found = false;
    me.items.each(function(i, key) {
          if (i.value == type) {
            found = true;
            return;
          }
        });
    return found;
  },
  makeVisible : function(type) {
    var me = this;
    me.items.each(function(i, key) {
          if (i.value == type) {
            i.show();
          } else {
            i.hide();
          }
        });
  },
  /**
   * It created an application. The new application belongs to the a specific
   * tab. If this tab is not specified, it will created into the active tab.
   *
   * @param {Object}
   *          config the configuration of the window used by the application.
   * @param {String}
   *          tab the name of the tab where the applications will be created.
   */
  createWindow : function(config, oTab, cbFunction) {
    var me = this;
    var tab = new Ext.dirac.views.tabs.Panel(config);
    var activeTab = me.getApplicationContainer().getActiveTab();
    if (activeTab == null && oTab == null) {
      me.createDesktopTab('Default');
      activeTab = me.getApplicationContainer().getActiveTab(); // we
      // need to get the new active tab
    } else if (oTab != null) {
      activeTab = oTab;
    }
    if (activeTab.view == 'presenterView') {
      tab.activeTab = activeTab; // this needs to stop the loading
      // message. The event handled in the Panel class.
      Ext.apply(tab, {
            tools : [{
                  type : 'maximize',
                  tooltip : 'Maximize the application.',
                  scope : tab,
                  handler : function(event, toolEl, panelHeader) {
                    var me = this;
                    activeTab.hideComponents(); // hides all
                    // components!
                    me.show(); // only show the current component
                    // we need to hide the maximize and also the close buttons!!
                    for (var i = 0; i < me.tools.length; i++) {
                      if (me.tools[i].type == 'maximize' || me.tools[i].type == 'close') {
                        me.tools[i].hide();
                      } else if (me.tools[i].type == 'minimize') {
                        me.tools[i].show();
                      }
                    }
                    var origSize = {
                      'width' : tab.getWidth(),
                      'height' : tab.getHeight()
                    }
                    me.origiginalSize = origSize;
                    me.setWidth(activeTab.getWidth());
                    me.setHeight(activeTab.getHeight());
                    me.isOpen = true;
                    activeTab.add(me);

                  }
                }, {
                  type : 'minimize',
                  tooltip : 'Minimize the application.',
                  scope : tab,
                  hidden : true,
                  handler : function(event, toolEl, panelHeader) {
                    var me = this;
                    activeTab.showComponents();
                    // we need to show the maximize and close
                    // buttons and hide the minimize buttons.
                    for (var i = 0; i < me.tools.length; i++) {
                      if (me.tools[i].type == 'maximize' || me.tools[i].type == 'close') {
                        me.tools[i].show();
                      } else if (me.tools[i].type == 'minimize') {
                        me.tools[i].hide();
                      }
                    }
                    me.isOpen = false;
                    me.setWidth(tab.origiginalSize.width);
                    me.setHeight(tab.origiginalSize.height);
                    activeTab.addWidget(me);
                  }
                }, {
                  scope : tab,
                  type : 'save',
                  tooltip : 'Save application state.',
                  // hidden:true,
                  handler : function(event, toolEl, panelHeader) {
                    var me = this;
                    Ext.MessageBox.confirm('Confirm', 'Do you want to save the current application state?', function(
                            button) {
                          var me = this;
                          if (button == 'yes') {
                            var funcAfterSave = function(iCode, sAppName, sStateType, sStateName) {

                              if ((iCode == 1) && (GLOBAL.APP.MAIN_VIEW.currentState != sStateName)) {

                                GLOBAL.APP.MAIN_VIEW.getRightContainer()
                                    .addStateToExistingWindows(sStateName, sAppName);

                                if (GLOBAL.APP.MAIN_VIEW.currentState != "")
                                  GLOBAL.APP.SM.oprRemoveActiveState(sAppName, GLOBAL.APP.MAIN_VIEW.currentState);

                                me.loadedObject.currentState = sStateName;
                                GLOBAL.APP.MAIN_VIEW.currentState = sStateName;
                                GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);
                                me.setTitle(me.loadedObject.launcher.title + " [" + me.loadedObject.currentState + "]");

                                // GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

                                if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow)
                                  GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
                              }

                            };
                            GLOBAL.APP.MAIN_VIEW.SM.oprSaveAppState("application", me.loadedObject.self.getName(),
                                me.loadedObject, funcAfterSave);
                          }
                        }, me);
                  }
                }]
          });
      activeTab.addWidget(tab);
      tab.header.hide(); // we do not show the name of the application!
      // (save space)
      tab.loadData();
    } else {
      tab.activeTab = activeTab; // this needs to stop the loading
      // message. The event handled in the Panel class.
      activeTab.add(tab);
    }
    if (cbFunction) {
      cbFunction(tab);
    } else {
      tab.toLoad = true;
    }
  },
  createPresenterWindow : function(config) {
    var me = this, win, cfg = Ext.applyIf(config || {}, {
          stateful : false,
          isWindow : true,
          constrainHeader : true,
          minimizable : true,
          maximizable : true,
          animCollapse : false,
          closable : false,
          border : false,
          hideMode : 'offsets',
          layout : 'fit',
          maximized : true
        });
    var win = Ext.create('Ext.window.Window', cfg);
    return win;
  },
  /**
   * It is used to create a window.
   *
   * @param {Object }
   *          config the window configuration.
   * @return {Ext.window.Window} win the created window.
   */
  createModalWindow : function(config) {
    var me = this, win, cfg = Ext.applyIf(config || {}, {
          stateful : false,
          isWindow : true,
          constrainHeader : true,
          minimizable : true,
          maximizable : true,
          animCollapse : false,
          border : false,
          hideMode : 'offsets',
          layout : 'fit'
        });
    var win = Ext.create('Ext.window.Window', cfg);
    return win;
  },
  /*****************************************************************************
   * It returns the tab object for a given name.
   *
   * @param {String}
   *          name The name of the tab widget.
   * @return {Object}
   */
  getTabFromApplicationContainer : function(name) {
    var me = this;
    var tab = null;
    var container = me.getApplicationContainer();
    if (container) {
      var tabs = container.items;
      tabs.each(function(key, value, length) {
            if (key.title == name) {
              tab = key;
              return;
            }
          });
    }
    return tab;
  },
  /**
   * It creates an empty desktop. If the load is true, the applications will be
   * not loaded by the {@link Ext.dirac.views.tabs.TabPanel TabPanel class}.
   *
   * @param{String} name is the name of the desktop.
   * @param{String} view is used to decide which type of desktop will be used.
   *                We have two different views: presenter and tab view.
   * @param{Boolean} load is used to decide what we want to do with the desktop.
   *                 If it is true, we do not load the applications to the
   *                 desktop.
   */
  createDesktopTab : function(name, view, cbLoadDesktop) {
    var me = this;
    var isLoaded = (GLOBAL.APP.MAIN_VIEW.loading ? false : true);
    var tab = me.getTabFromApplicationContainer(name);
    if (tab != null) {
      me.getApplicationContainer().setActiveTab(tab);
    } else {
      if (view == 'presenterView') { // we have to add the presenter page
        tab = Ext.create('Ext.dirac.views.tabs.PresenterView', {
              title : name,
              desktop : me,
              type : 'desktop',
              isLoaded : isLoaded
            });
      } else {
        tab = Ext.create('widget.tabPanel', {
              region : 'center',
              minWidth : 300,
              title : name,
              closable : true,
              type : 'desktop',
              isLoaded : isLoaded
            });
      }
      me.getApplicationContainer().add(tab);
      me.getApplicationContainer().setActiveTab(tab);
    }
    if (cbLoadDesktop) {
      cbLoadDesktop(name, tab);
    }
  },
  /**
   * Function to add new state to the instances of the same module
   *
   * @param {String}
   *          stateName This is the name od the state
   * @param {String}
   *          appName Name of the module
   * @param {Object}
   *          stateData Data of the module that define its state
   */
  addStateToExistingWindows : function(stateName, appName) {

    var me = this;
    var activeTab = me.getApplicationContainer().getActiveTab();
    var desktopName = activeTab.title;
    GLOBAL.APP.MAIN_VIEW.addNodeToMenu(stateName, appName);

  },

  /**
   * Function called when the Save button from the desktop context menu is
   * clicked
   */
  oprSaveDesktopState : function() {

    var me = this;
    me.hasClose = close;
    var desktop = me.getApplicationContainer().getActiveTab();
    if (desktop) {
      /*
       * Function that is executed after a state has been saved
       */
      var funcAfterSave = function(iCode, sAppName, sStateType, sStateName) {

        if ((iCode == 1) && (GLOBAL.APP.MAIN_VIEW.currentState != sStateName)) {

          // if there is an active desktop state, we have to remove it
          if (GLOBAL.APP.MAIN_VIEW.currentState != "")
            GLOBAL.APP.SM.oprRemoveActiveState("desktop", GLOBAL.APP.MAIN_VIEW.currentState);// OK

          // if there is a state, we set it as an active state
          GLOBAL.APP.MAIN_VIEW.currentState = sStateName;
          GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);// OK

          GLOBAL.APP.MAIN_VIEW.renameCurrentDesktop(sStateName);

          if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow)
            GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();

          // GLOBAL.APP.MAIN_VIEW.refreshMyDesktop(sStateName);

        } else {
          GLOBAL.APP.MAIN_VIEW.renameCurrentDesktop(sStateName);
        }
        if (!Ext.Array.contains(GLOBAL.APP.MAIN_VIEW._state_related_url, sStateName)) {
          GLOBAL.APP.MAIN_VIEW._state_related_url.push(sStateName);
        }
        GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();
      };
      GLOBAL.APP.MAIN_VIEW.currentState = ((GLOBAL.APP.MAIN_VIEW.currentState == 'Default')
          ? ""
          : GLOBAL.APP.MAIN_VIEW.currentState); // we do not want to save the
      // default desktop as Default
      GLOBAL.APP.MAIN_VIEW.SM.oprSaveAppState("application", "desktop", GLOBAL.APP.MAIN_VIEW, funcAfterSave)

    } else {
      Ext.dirac.system_info.msg("Notification", 'No desktop found!');
    }
  },
  oprSaveAsDesktopState : function() {

    var me = this;
    me.hasClose = close;
    var desktop = me.getApplicationContainer().getActiveTab();
    if (desktop) {
      /*
       * Function that is executed after a state has been saved
       */
      var funcAfterSave = function(iCode, sAppName, sStateType, sStateName) {

        if ((iCode == 1) && (GLOBAL.APP.MAIN_VIEW.currentState != sStateName)) {

          // if there is an active desktop state, we have to remove it
          if (GLOBAL.APP.MAIN_VIEW.currentState != "")
            GLOBAL.APP.SM.oprRemoveActiveState("desktop", GLOBAL.APP.MAIN_VIEW.currentState);// OK

          // if there is a state, we set it as an active state
          GLOBAL.APP.MAIN_VIEW.currentState = sStateName;
          GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);// OK
          GLOBAL.APP.MAIN_VIEW._state_related_url.push(sStateName); // it is
          // required for refreshing the url.

          GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();
          GLOBAL.APP.MAIN_VIEW.renameCurrentDesktop(sStateName, true);

          if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow)
            GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();

        }

      };
      GLOBAL.APP.MAIN_VIEW.SM.formSaveState("application", "desktop", GLOBAL.APP.MAIN_VIEW, funcAfterSave)

    } else {
      Ext.dirac.system_info.msg("Notification", 'No desktop found!');
    }
  },
  oprDeleteDesktopState : function() {
    var me = this;
    /*
     * Function that is executed after a state has been removed
     */
    var funcAfterRemove = function(sStateType, sAppName, sStateName) {

      GLOBAL.APP.MAIN_VIEW.deleteStateFromMenu(sStateName);
      Ext.Array.remove(GLOBAL.APP.MAIN_VIEW._state_related_url, sStateName); // it
      // is required for refreshing the url.

      GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

    };
    GLOBAL.APP.MAIN_VIEW.SM.formManageStates("desktop", funcAfterRemove);
  }
});
