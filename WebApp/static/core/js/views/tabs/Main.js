/*******************************************************************************
 * This class is a container which contains the left and right panels. The
 * desktop split into two parts: 1. The left panel contains a menu used to
 * manage the applications. 2. The right panel contains the opened applications
 */
Ext.define('Ext.dirac.views.tabs.Main', {
      extend : 'Ext.panel.Panel',
      requires : ['Ext.dirac.views.tabs.LeftContainer', 'Ext.dirac.views.tabs.RightContainer', 'Ext.dirac.views.tabs.TreeMenuModel', 'Ext.dirac.views.tabs.StateManagement'],
      mixins : ["Ext.dirac.core.Stateful", "Ext.dirac.core.AppView"],
      alias : 'widget.viewtabs',
      xtype : 'main-container',
      // title: 'DIRAC::TAB',
      // layout: 'fit',

      items : [],

      leftConatiner : null,

      rightContainer : null,

      sharedDesktop : null,

      loading : false,

      myDesktop : null,

      /**
       * It contains a list of module name
       * 
       * @type{List}
       */
      applications : [],
      /*************************************************************************
       * it store the Default node
       * 
       * @type{Ext.dirac.views.tabs.TreeMenuMode}
       */
      defaultDesktop : null,

      _state_related_url : [],

      /**
       * It contains the applications which can be deleted after save
       * 
       * @type{Object}
       */
      deleteApplications : [],

      listeners : {
        afterrender : function() {
          var me = this;
          if (me.loadRightContainer.iCode != -4) {
            me.loadRightContainer.show();
            me.loadlefttContainer.show();
          }
        }
      },
      constructor : function(config) {
        var me = this;
        // //////////////////////////HACK TO BE
        // REMOVED///////////////////////////
        me.taskbar = {};
        me.taskbar.getHeight = function() {
          return 0;
        }// hack
        // ///////////////////////////END///////////////////////////
        me.rightContainer = Ext.create('Ext.dirac.views.tabs.RightContainer');
        me.loadRightContainer = new Ext.LoadMask(me.rightContainer, {
              msg : "Loading ...",
              iCode : 1
            });
        var menu = me.createTreeMenu();
        me.leftConatiner = Ext.create('Ext.dirac.views.tabs.LeftContainer', {
              menu : menu
            });
        me.loadlefttContainer = new Ext.LoadMask(me.leftConatiner, {
              msg : "Loading ...",
              iCode : 1
            });
        me.callParent(arguments);
      },
      initComponent : function() {
        var me = this;
        me.ID = "tabs";
        var leftCont = me.getLeftContainer();
        var rightCont = me.getRightContainer();
        Ext.apply(me, {
              layout : {
                type : 'border',
                padding : 2
              },
              items : [me.leftConatiner, me.rightContainer]
            });
        me.SM = new Ext.dirac.views.tabs.StateManagement();
        me.callParent(arguments);
      },
      /**
       * @private method executed after the desktop has been rendered
       */
      afterRender : function() {
        var me = this;
        Ext.get("app-dirac-loading").show();
        me.callParent();
        var cbAfterLoaded = function(iCode, stateName) {
          me.__oprLoadUrlState();
          Ext.get("app-dirac-loading").hide();
          me.loadlefttContainer.hide();
        };
        // load the state of the desktop described in the URL after the shared
        // desktops loaded to the cache.
        GLOBAL.APP.SM.oprReadSharedDesktops("desktop", cbAfterLoaded);
      },
      /**
       * @private Method called to load the state of the desktop described in
       *          the URL. This method is called after the desktop has been
       *          rendered.
       */
      __oprLoadUrlState : function() {

        var me = this;

        var oValid = true;

        GLOBAL.URL_STATE = Ext.util.Format.trim(GLOBAL.URL_STATE);

        // if the URL state is not empty
        if (GLOBAL.URL_STATE.length != "") {

          // we get two parts of the URL state
          var oParts = GLOBAL.URL_STATE.split("|");

          // if the number of parts differ from 2, it means that it is
          // a mistake
          if (oParts.length != 2) {

            me.refreshUrlDesktopState();
            return;

          }

          // if the indicator for desktop loaded state is not valid
          if ((parseInt(oParts[0], 10) != 0) && (parseInt(oParts[0], 10) != 1)) {

            oValid = false;

          }

          /*
           * if the indicator for desktop loaded state is 0, it means that no
           * desktop state has been loaded, but only particular apps
           */
          if (parseInt(oParts[0], 10) == 0) {
            GLOBAL.APP.CF.alert('Tab theme can not load applications from URL', "error");
            me.loadlefttContainer.hide();
            me.loadRightContainer.hide();
            return;
          }

          // in the case of loaded desktop state, we check whether a
          // name of the desktop state exists
          if (parseInt(oParts[0], 10) == 1) {

            if (Ext.util.Format.trim(oParts[1]) == "") {

              oValid = false;

            }

          }

        }

        if (oValid) {

          var oParts = GLOBAL.URL_STATE.split("|");

          if ((oParts.length != 2) || (Ext.util.Format.trim(oParts[1]).length == 0)) {
            me.loadRightContainer.hide();
            return;
          }

          if (parseInt(oParts[0], 10) == 1) {
            // desktop state
            me.loading = true; // it is only used by the tabchange event in
            // order to not load the applications.
            var afterTabCreated = function(name, tab) {
              me.getLeftContainer().setActiveMenu('menuPanel');
              GLOBAL.APP.MAIN_VIEW.loadDesktopStateData(name, tab);
              tab.isLoaded = true;
              me.loading = false;
            };

            var oDesktop = oParts[1].split(',');
            if (oDesktop.length > 0) {
              me.readLayoutFromStates(oDesktop, afterTabCreated);
            } else {
              me.loadRightContainer.hide();
            }
            me.refreshUrlDesktopState();
          }
        } else {

          // if the data are not valid, we refresh the URL in the
          // browser
          me.refreshUrlDesktopState();
          me.loadRightContainer.hide();

        }

      },
      /*************************************************************************
       * This function is used to read the saved desktop states from the server
       * or the cache using SM. #param{Ext.Array} oDesktop is a list of desktop
       * names which are in the URL. #param{Object} cbFunction is a function
       * which will be called after the desktop states active.
       */
      readLayoutFromStates : function(oDesktop, cbFunction) {
        var me = this;
        var oStateData = null;
        for (var i = 0; i < oDesktop.length; i++) {
          var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", oDesktop[i]);

          switch (iStateLoaded) {
            case -1 :
              GLOBAL.APP.CF.alert("The " + oDesktop[i] + " state does not exist !", "warning");
              Ext.Array.remove(oDesktop, oDesktop[i]);
              me.readLayoutFromStates(oDesktop, cbFunction);
              me.loadRightContainer.hide();
              break;
            return;
          case -2 :
            me.funcPostponedLoading = function() {

              me.readLayoutFromStates(oDesktop, cbFunction);

            }

            setTimeout(me.funcPostponedLoading, 1000);
            return;
            break;
        }
        oStateData = GLOBAL.APP.SM.getStateData("application", "desktop", oDesktop[i]);
        var view = (oStateData.view ? oStateData.view : 'tabView');
        if (i == oDesktop.length - 1) {
          GLOBAL.APP.MAIN_VIEW.createDesktopTab(oDesktop[i], view, cbFunction);
        } else {
          GLOBAL.APP.MAIN_VIEW.createDesktopTab(oDesktop[i], view);
        }
        if (!Ext.Array.contains(me._state_related_url, oDesktop[i])) {
          me._state_related_url.push(oDesktop[i]);
        }

      }

      },
      getStateData : function() {

        var me = this;

        var oData = {
          "dirac_view" : 1,
          "version" : GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION,
          "data" : [],
          "views" : {
            "tabs" : {
              "version" : 1,
              "desktopGranularity" : me.desktopGranularity,
              "positions" : []
            }
          }
        };

        oData.data = me.getRightContainer().getStateData();

        return oData;

      },
      loadState : function(oData, tab) {

        var me = this;
        me.loadRightContainer.show();
        if (me.ID in oData["views"]) {
          for (var i = 0, len = oData["data"].length; i < len; i++) {

            if ("module" in oData["data"][i]) {

              var oAppStateData = {};

              oAppStateData.name = oData["data"][i].module;
              oAppStateData.data = oData["data"][i].data;
              oAppStateData.currentState = oData["data"][i].currentState;

              if (i == oData["data"].length - 1) {
                var cbSetActiveTab = function(oTab) {
                  me.loadRightContainer.hide();
                  if (tab && tab.view == 'tabView') {// when the presenter
                    // view used then does
                    // not have tabs
                    tab.setActiveTab(oTab);
                  }
                };
                me.createWindow("app", oAppStateData.name, oAppStateData, tab, cbSetActiveTab);

              } else {
                me.createWindow("app", oAppStateData.name, oAppStateData, tab);
              }

            } else if ("link" in oData["data"][i]) {
              me.loadRightContainer.hide();
              var oAppStateData = {};

              oAppStateData.name = oData["data"][i].link;
              oAppStateData.data = oData["data"][i].data;
              oAppStateData.currentState = oData["data"][i].currentState;
              me.createWindow("link", oAppStateData.name, oAppStateData, tab);
            }

          }
        } else {// desktop theme

          for (var i = 0, len = oData["data"].length; i < len; i++) {
            me.loadRightContainer.hide();
            if ("link" in oData["data"][i]) {
              var oAppStateData = {};

              oAppStateData.name = oData["data"][i].link;
              oAppStateData.data = oData["data"][i].data;
              oAppStateData.currentState = oData["data"][i].currentState;
              me.createWindow("link", oAppStateData.name, oAppStateData, tab);
            } else if ("module" in oData["data"][i]) {

              var oAppStateData = {};

              oAppStateData.name = oData["data"][i].module;
              oAppStateData.data = oData["data"][i].data;
              oAppStateData.currentState = oData["data"][i].currentState;

              if (i == oData["data"].length - 1) {
                var cbSetActiveTab = function(oTab) {
                  me.loadRightContainer.hide();
                  if (tab && tab.view && tab.view == 'tabView') {// when the
                    // presenter view
                    // used then does
                    // not have tabs
                    tab.setActiveTab(oTab);
                  }
                };
                me.createWindow("app", oAppStateData.name, oAppStateData, tab, cbSetActiveTab);

              } else {
                me.createWindow("app", oAppStateData.name, oAppStateData, tab);
              }

            }
          }
        }

      },
      getLeftContainer : function() {
        var me = this;
        return me.leftConatiner;
      },
      getRightContainer : function() {
        var me = this;
        return me.rightContainer;
      },
      /**
       * It creates a tree which nodes are applications. This is used as a Menu.
       * The tree has application nodes, My desktop node and Shared desktop
       * node.
       */
      createTreeMenu : function() {
        var me = this;

        Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.TreeMenuModel');

        config = {
          text : 'Desktops',
          allowDrag : false,
          allowDrop : false,
          iconCls : "core-desktop-icon",
          expanded : true,
          root : true
        };
        var rootNode = Ext.ModelManager.create(config, 'Ext.dirac.views.tabs.TreeMenuModel');

        for (var j = 0; j < GLOBAL.APP.configData["menu"].length; j++) {
          me.__getAppRecursivelyFromConfig(GLOBAL.APP.configData["menu"][j], rootNode);
        }

        var oFunc = function(iCode, sAppName) {
          me.createDesktopTree(rootNode);
        };

        if (GLOBAL.STATE_MANAGEMENT_ENABLED)
          GLOBAL.APP.SM.oprReadApplicationStatesAndReferences("desktop", oFunc);// OK
        return rootNode;
      },
      __getAppRecursivelyFromConfig : function(item, rootNode) {
        var me = this;
        if (item.length == 2) {
          var childnode = rootNode.appendChild({
                'text' : item[0],
                expandable : true,
                allowDrag : false,
                allowDrop : false,
                leaf : false,
                application : item[2],
                iconCls : "core-application-group-icon"
              });
          for (var i = 0; i < item[1].length; i++) {
            me.__getAppRecursivelyFromConfig(item[1][i], childnode);
          }
        } else {
          if (item[0] == "app") {
            var oParts = item[2].split(".");
            var sStartClass = "";
            if (oParts.length == 2)
              sStartClass = item[2] + ".classes." + oParts[1];
            else
              sStartClass = item[2];
            me.applications.push(sStartClass); // we have to save a list of
            // applications which can
            // used.
            var newnode = rootNode.appendChild({
                  'text' : item[1],
                  expandable : true,
                  application : item[2],
                  leaf : false,
                  allowDrag : false,
                  iconCls : 'core-application-icon'
                });
            newnode.appendChild({
                  'text' : 'Default',
                  type : 'app',
                  allowDrag : false,
                  expandable : false,
                  leaf : true,
                  application : sStartClass,
                  stateToLoad : 'Default',
                  iconCls : 'icon-applications-states-all-default'
                });
          } else {
            var newnode = rootNode.appendChild({
                  'text' : item[1],
                  expandable : false,
                  application : item[2],
                  type : 'link',
                  iconCls : "system_web_window",
                  leaf : true
                });
          }
        }
        return;
      },
      /*************************************************************************
       * It creates the My Desktops sub-tree.
       * 
       * @param {Object}
       *          an instance of a node
       */
      createDesktopTree : function(node) {
        var me = this;

        var rootNode = node.appendChild({
              text : 'My Desktops',
              allowDrag : false,
              allowDrop : false,
              iconCls : "core-desktop-icon"
            });
        me.myDesktop = rootNode;

        me.defaultDesktop = me.myDesktop.appendChild({
              text : 'Default',
              type : 'Default',
              expandable : true,
              allowDrag : false,
              allowDrop : false,
              iconCls : "core-desktop-icon"
            });

        me.defaultDesktop.appendChild({
              'text' : 'All',
              expandable : false,
              application : 'Default',
              allowDrag : false,
              allowDrop : false,
              type : 'tabView',
              leaf : true,
              iconCls : 'icon-applications-states-all-default'
            });

        var oStates = GLOBAL.APP.SM.getApplicationStates("application", "desktop");// OK
        for (var i = 0, len = oStates.length; i < len; i++) {
          var sStateName = oStates[i];
          var oStateData = GLOBAL.APP.SM.getStateData('application', 'desktop', sStateName);
          var childNode = rootNode.appendChild({
                'text' : sStateName,
                expandable : true,
                application : sStateName,
                type : 'desktop',
                isShared : false,
                leaf : false,
                allowDrag : false,
                allowDrop : true,
                iconCls : "core-desktop-icon",
                icon : null,
                view : oStateData.view
              });
          childNode.appendChild({
                'text' : 'All',
                expandable : false,
                application : sStateName,
                allowDrag : false,
                allowDrop : false,
                type : 'tabView',
                leaf : true,
                iconCls : 'icon-applications-states-all-default',
                view : oStateData.view
              });

        }

        var rootNode = node.appendChild({
              text : 'Shared Desktops',
              allowDrag : false,
              allowDrop : false,
              iconCls : "core-desktop-icon"
            });

        me.sharedDesktop = rootNode;

        // creating items for the state links
        var oRefs = GLOBAL.APP.SM.getApplicationStates("reference", "desktop");// OK

        for (var i = 0, len = oRefs.length; i < len; i++) {

          var sStateName = oRefs[i];

          var childNode = rootNode.appendChild({
                'text' : sStateName,
                expandable : false,
                application : sStateName,
                isShared : true,
                allowDrag : false,
                allowDrop : false,
                type : 'tabView',
                leaf : true,
                iconCls : 'icon-applications-states-all-default'
              });
        }

        return rootNode;
      },

      /*************************************************************************
       * It changes the workspace in the RightContainer taking account what was
       * selected in the LeftConatiner.
       * 
       * @param {String}
       *          type can be welcome, menuPanel and sharedLayouts.
       */
      changeRightPanel : function(type) {
        var me = this;
        var rContainer = me.getRightContainer();
        rContainer.changePanel(type);
      },
      /*************************************************************************
       * it creates an application and loads its data from the UserProfile.
       * 
       * @param{String} loadedObjectType is the type of the object which will be
       *                loaded
       * @param{String} moduleName is the full package of the class for example:
       *                DIRAC.JobMonitor.classes.JobMonitor
       * @param{Object} setupData is the saved states of the application
       * @param{String} tabName is the tab name which will contain the
       *                application which being loaded.
       */
      createWindow : function(loadedObjectType, moduleName, setupData, oTab, cbFunction) {
        var me = this;
        Ext.get("app-dirac-loading").show();

        if (loadedObjectType == "app") {

          var oParts = moduleName.split(".");
          var sStartClass = "";

          if (oParts.length == 2)
            sStartClass = moduleName + ".classes." + oParts[1];
          else
            sStartClass = moduleName;

          // if the development mod is off, we set up diffrent path to
          // load javascript
          if (GLOBAL.DEV == 0) {

            var oConfig = {
              enabled : true,
              paths : {}
            };

            oConfig["paths"][oParts[0] + "." + oParts[1] + ".classes"] = "static/" + oParts[0] + "/" + oParts[1] + "/build";

            Ext.Loader.setConfig(oConfig);

          }

          Ext.require(sStartClass, function() {

            var me = this;

            // creating an object of the demeanded application
            var instance = Ext.create(sStartClass, {
                  launcherElements : {
                    title : 'Module',
                    iconCls : 'notepad',
                    width : 0,
                    height : 0,
                    maximized : true,
                    x : null,
                    y : null
                  }
                });

            var config = {
              setupData : setupData,
              loadedObject : instance,
              loadedObjectType : "app",
              toLoad : (cbFunction ? true : false),
              isLoaded : false
            };

            me.getRightContainer().createWindow(config, oTab, cbFunction);
              // initializing window

            }, this);

        } else if (loadedObjectType == "link") {

          me.getRightContainer().createWindow({
                setupData : setupData,
                loadedObjectType : "link",
                linkToLoad : moduleName
              });

        }
        Ext.get("app-dirac-loading").hide();
      },
      /*************************************************************************
       * It creates a new desktop for a given name.
       * 
       * @param{String} name is the tab name
       * @param{String} view is used to know the type of the desktop. NOTE: It
       *                can be tab or presenter like
       * @param{Object} cbFunction It is called after the dektop has created.
       */
      createDesktopTab : function(name, view, cbFunction) {
        var me = this;
        me.getRightContainer().createDesktopTab(name, view, cbFunction);

      },
      /*************************************************************************
       * it returns the desktop dimension.
       */
      getDesktopDimensions : function() {
        var me = this;

        return [me.getWidth(), me.getHeight()];
      },
      /**
       * It saves the state of an application. Note: It only take into account
       * the active a application.
       */
      saveActiveApplicationState : function() {
        var me = this;

        var activeDesktop = me.getActiveDesktop();
        if (activeDesktop) {
          var appl = activeDesktop.getActiveTab();
          if (appl) {
            var funcAfterSave = function(iCode, sAppName, sStateType, sStateName) {

              if ((iCode == 1) && (appl.currentState != sStateName)) {

                GLOBAL.APP.MAIN_VIEW.getRightContainer().addStateToExistingWindows(sStateName, sAppName);

                if (appl.currentState != "")
                  GLOBAL.APP.SM.oprRemoveActiveState(sAppName, appl.currentState);

                appl.loadedObject.currentState = sStateName;
                appl.currentState = sStateName;
                GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);
                appl.setTitle(appl.loadedObject.launcher.title + " [" + appl.loadedObject.currentState + "]");

                // GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

                if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow)
                  GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
              }

            };
            GLOBAL.APP.MAIN_VIEW.SM.oprSaveAppState("application", appl.loadedObject.self.getName(), appl.loadedObject, funcAfterSave);
            // appl.oprSaveAppState(false);
            // var appClassName = appl.getClassName();
            // var desktopName = activeDesktop.title;
            // me.refreashTree(desktopName, appClassName);
          } else {
            Ext.dirac.system_info.msg("Error", 'You do not have any active tab on the desktop. Please select a tab (application) in the current desktop!!!');
          }
        } else {
          Ext.dirac.system_info.msg("Error", 'Please open a dektop!!! ');
        }
      },
      /**
       * It saves the state of an existing application with a new name. Note: It
       * only take into account the active a application.
       */
      saveAsActiveApplicationState : function() {
        var me = this;

        var activeDesktop = me.getActiveDesktop();
        if (activeDesktop) {
          var appl = activeDesktop.getActiveTab();
          if (appl) {
            var funcAfterSave = function(iCode, sAppName, sStateType, sStateName) {

              if ((iCode == 1) && (appl.currentState != sStateName)) {

                GLOBAL.APP.MAIN_VIEW.getRightContainer().addStateToExistingWindows(sStateName, sAppName);

                if (appl.currentState != "")
                  GLOBAL.APP.SM.oprRemoveActiveState(sAppName, appl.currentState);

                appl.loadedObject.currentState = sStateName;
                appl.currentState = sStateName;
                GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);
                appl.setTitle(appl.loadedObject.launcher.title + " [" + appl.loadedObject.currentState + "]");

                // GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

                if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow)
                  GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
              }

            };
            GLOBAL.APP.MAIN_VIEW.SM.formSaveState("application", appl.loadedObject.self.getName(), appl.loadedObject, funcAfterSave);

          } else {
            Ext.dirac.system_info.msg("Error", 'Please open an application!!! ');
          }
        } else {
          Ext.dirac.system_info.msg("Error", 'Please open a dektop!!! ');
        }
      },
      /**
       * It refreshes the menu
       * 
       * @param {string}
       *          desktop The name of the tab(desktop) which contains the
       *          application
       * @param {string}
       *          application the class name of the application.
       */
      refreashTree : function(desktop, application) {
        // <debug>
        Ext.log({
              level : 'log',
              stack : true
            }, "Begin method!");
        // </debug>

        var me = this;
        var selPanel = me.getLeftContainer();
        if (selPanel) {
          var treePanel = selPanel.getTreePanel();
          var rootNode = treePanel.getStore().getRootNode();
          me.refreshNode(rootNode, desktop, application);
        } else {
          Ext.dirac.system_info.msg("Error", 'The panel which contains the menu does not exists!!!');
        }
        // <debug>
        Ext.log({
              level : 'log',
              stack : true
            }, "End method!");
        // </debug>

      },
      /*************************************************************************
       * it refresh a specific node
       * 
       * @param{Object} rootNode
       * @param{String} desktop
       * @param{String}
       */
      refreshNode : function(rootNode, desktop, application) {
        if (rootNode) {
          if (rootNode.childNodes.length > 0) {
            for (var i = 0; i < rootNode.childNodes.length; i++) {
              var node = rootNode.childNodes[i];
              if (node.data.text == desktop && desktop != 'Default') {
                this.refreshNode(node, desktop, application);
              } else if (node.data.application == application) {
                parent = node.parentNode; // the application found.
                // the
                // children of the parent nodes
                // have to be deleted.
                parent.collapse();
                parent.expand();
                return;
              } else if (node.childNodes.length > 0) {
                this.refreshNode(node, desktop, application);
              }
            }
          }
        }
      },
      /*************************************************************************
       * It adds a name state to the menu.
       * 
       * @param{String} stateName
       * @param{String} appName
       * @param{Object} stateData
       */
      addNodeToMenu : function(stateName, appName) {
        var me = this;
        var selPanel = me.getLeftContainer().getSelectionPanel();
        if (selPanel) {
          var treePanel = selPanel.getTreePanel();
          var rootNode = treePanel.getStore().getRootNode();

          var node = me.__findNode(rootNode, appName);

          var defaultNode = node.firstChild;
          defaultNode.data.iconCls = 'icon-state-applications-class';
          defaultNode.text = stateName;
          defaultNode.data.text = stateName;
          defaultNode.data.stateToLoad = stateName;
          node.removeChild(defaultNode);

          Ext.define('Ext.dirac.views.tabs.TreeNodeModel', {
                extend : 'Ext.data.Model',
                fields : ['text', 'type', 'application', 'stateToLoad', 'desktop'],
                alias : 'widget.treenodemodel'
              });
          nodeObj = {
            'text' : 'Default',
            type : 'app',
            allowDrag : false,
            expandable : false,
            leaf : true,
            application : appName,
            stateToLoad : 'Default',
            iconCls : 'icon-applications-states-all-default'
          };

          Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.TreeNodeModel');
          var newNode = Ext.ModelManager.create(nodeObj, 'Ext.dirac.views.tabs.TreeNodeModel');
          node.insertChild(0, newNode);
          node.appendChild(defaultNode);
        } else {
          Ext.dirac.system_info.msg("Error", 'The panel which contains the menu does not exists!!!');
        }
      },
      /*************************************************************************
       * It check the existance of a node for a given name.
       * 
       * @param{Object} rootNode
       * @param{String} name
       * @private
       */
      __findNode : function(rootNode, name) {
        var me = this;
        for (var i = 0; i < rootNode.childNodes.length; i++) {
          var node = rootNode.childNodes[i];
          if (node.data.application == name) {
            return node.parentNode;
          } else {
            found = me.__findNode(node, name);
            if (found) {
              return found;
            }
          }
        }
      },

      /*************************************************************************
       * It removes a given node from the menu tree.
       * 
       * @param{String} stateName
       * @param{String} AppName
       */
      removeNodeFromMenu : function(stateName, appName) {
        var me = this;
        var selPanel = me.getLeftContainer().getSelectionPanel();
        if (selPanel) {
          var treePanel = selPanel.getTreePanel();
          var rootNode = treePanel.getStore().getRootNode();
          var node = me.__findNode(rootNode, appName);
          var oDelete = node.findChild('text', stateName);
          node.removeChild(oDelete);
        } else {
          Ext.dirac.system_info.msg("Error", 'The panel which contains the menu does not exists!!!');
        }
      },
      deleteApplicationStates : function() {
        var me = this;

        var activeDesktop = me.getActiveDesktop();
        if (activeDesktop) {
          if (activeDesktop.view == 'presenterView') {
            appl = activeDesktop.getOpenedApplication();
          } else {
            var appl = activeDesktop.getActiveTab();
          }

          if (appl) {
            var funcAfterRemove = function(sStateType, sAppName, sStateName) {

              me.removeNodeFromMenu(sStateName, sAppName);

            }
            GLOBAL.APP.MAIN_VIEW.SM.formManageStates(appl.loadedObject.self.getName(), funcAfterRemove);

          } else {
            Ext.dirac.system_info.msg("Error", 'Please open an application!!! ');
          }
        } else {
          Ext.dirac.system_info.msg("Error", 'Please open a dektop!!! ');
        }
      },
      /**
       * It saves the desktop state. If the state name is defaulf, a new must be
       * defined.
       */
      saveActiveDesktopState : function() {
        var me = this;
        me.getRightContainer().oprSaveDesktopState();
      },
      /**
       * It save an existing desktop state with a new name.
       */
      saveAsActiveDesktopState : function() {
        var me = this;
        me.getRightContainer().oprSaveAsDesktopState();
      },
      /**
       * It deletes the desktops.
       */
      deleteDesktopStates : function() {
        var me = this;
        me.getRightContainer().oprDeleteDesktopState();
      },
      /**
       * It renames the current desktop.
       * 
       * @param {string}
       *          name the new name of the desktop.
       * @param {boolean}
       *          addToMenu if it is set, it means the new name has to be added
       *          to the menu.
       */
      renameCurrentDesktop : function(name) {
        var me = this;

        var activeDesktop = me.getActiveDesktop();
        if (activeDesktop) {
          var desktopName = activeDesktop.title;
          activeDesktop.setTitle(name);
          if (desktopName == 'Default') { // if the current desktop is the
            // default, we have to remove the
            // items from the Default desktop.
            // and we have to create a new item(desktop).
            me.__addDesktopToMenu(name);
            // remove the applications from the state.
            var data = me.getRightContainer().getStateData(); // get the active
            // desktop states.
            var cbAfterRefresh = function(code, sAppName, sStateType, sStateName) {
              if (code == 1) {
                var node = me.defaultDesktop.findChild('text', sStateName);
                me.moveDesktopmMnuItem(name, node);
              }
              return;
            };
            for (i = 0; i < data.length; i++) {
              GLOBAL.APP.SM.oprDeleteState(data[i].module, "application", data[i].currentState, cbAfterRefresh);
            }

          } else {
            me.__addDesktopToMenu(name);
          }
          
        } else {
          Ext.dirac.system_info.msg("Error", 'Please open a dektop!!! ');
        }
      },
      /**
       * It is used to add a new desktop to the menu.
       * 
       * @param {string}
       *          stateName the name of the desktop.
       * @private
       */
      __addDesktopToMenu : function(stateName) {
        var me = this;
        me.myDesktop.expand();
        var selPanel = me.getLeftContainer().getSelectionPanel();
        if (selPanel) {
          var treePanel = selPanel.getTreePanel();
          // var rootNode = treePanel.getStore().getRootNode();
          var rootNode = me.myDesktop;
          var oNode = null;
          rootNode.eachChild(function(node) { // remove the node if it is
                // exists
                if (node && node.getData().text == stateName) {
                  oNode = node;
                }
              }, me);
          if (oNode) {
            var firstChild = oNode.firstChild;

            oNode.collapse();

            oNode.removeAll();
            oNode.appendChild(firstChild);
            // me.__addUserDesktopStatesToDesktop(oNode);
            // oNode.expandChildren(true);
          } else {

            try {
              nodeObj = {
                'text' : stateName,
                expandable : true,
                application : stateName,
                type : 'desktop',
                leaf : false,
                iconCls : 'core-desktop-icon',
                allowDrag : false,
                allowDrop : true
              };
              Ext.define('Ext.dirac.views.tabs.DesktopNodeModel', {
                    extend : 'Ext.data.Model',
                    fields : ['text', 'type', 'application', 'stateToLoad', 'desktop'],
                    alias : 'widget.desktopnodemodel'
                  });
              Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.DesktopNodeModel');
              var node = Ext.ModelManager.create(nodeObj, 'Ext.dirac.views.tabs.DesktopNodeModel');
              var childNode = rootNode.appendChild(node);
              nodeObj = {
                'text' : 'All',
                expandable : false,
                application : stateName,
                type : 'tabView',
                leaf : true,
                iconCls : 'icon-applications-states-all-default',
                allowDrag : false,
                allowDrop : false
              };
              Ext.define('Ext.dirac.views.tabs.DesktopNodeModel', {
                    extend : 'Ext.data.Model',
                    fields : ['text', 'type', 'application', 'stateToLoad', 'desktop'],
                    alias : 'widget.desktopnodemodel'
                  });
              Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.DesktopNodeModel');
              var node = Ext.ModelManager.create(nodeObj, 'Ext.dirac.views.tabs.DesktopNodeModel');
              childNode.appendChild(node);
              childNode.expand();
            } catch (err) {
              Ext.log({
                    level : 'error'
                  }, "Failed to create child nodes!" + err);
              Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
            }

          }
        } else {
          Ext.dirac.system_info.msg("Error", 'The panel which contains the menu does not exists!!!');
        }
      },

      /**
       * It deletes the state from the menu.
       * 
       * @param {String}
       *          stateName it is the desktop name which has to be deleted from
       *          the menu.
       */
      deleteStateFromMenu : function(stateName) {
        var me = this;
        var selPanel = me.getLeftContainer().getSelectionPanel();
        if (selPanel) {
          var treePanel = selPanel.getTreePanel();
          // var rootNode = treePanel.getStore().getRootNode();
          var rootNode = me.myDesktop;
          rootNode.eachChild(function(node) {
                if (node && node.getData().text == stateName) {
                  rootNode.removeChild(node);
                  return;
                }
              }, me);
        } else {
          Ext.dirac.system_info.msg("Error", 'The panel which contains the menu does not exists!!!');
        }
      },
      /**
       * It removes a given node from the tree (Menu tree).
       * 
       * @param{String} stateName
       */
      removeFormSharedDesktop : function(stateName) {
        var me = this;
        var me = this;
        var selPanel = me.getLeftContainer().getSelectionPanel();
        if (selPanel) {
          var treePanel = selPanel.getTreePanel();
          // var rootNode = treePanel.getStore().getRootNode();
          var rootNode = me.sharedDesktop;
          rootNode.eachChild(function(node) {
                if (node && node.getData().text == stateName) {
                  rootNode.removeChild(node);
                  return;
                }
              }, me);
        } else {
          Ext.dirac.system_info.msg("Error", 'The panel which contains the menu does not exists!!!');
        }
      },
      /**
       * It adds a node to the Shared Desktops node. The name of the node is the
       * stateName.
       * 
       * @param{String} stateName
       */
      addToSharedDesktop : function(stateName) {
        var me = this;
        var selPanel = me.getLeftContainer().getSelectionPanel();
        if (selPanel) {
          var treePanel = selPanel.getTreePanel();
          var rootNode = me.sharedDesktop;
          try {
            rootNode.appendChild({
                  'text' : stateName,
                  expandable : false,
                  application : stateName,
                  allowDrag : false,
                  allowDrop : false,
                  type : 'tabView',
                  leaf : true,
                  iconCls : 'icon-applications-states-all-default'
                });
          } catch (err) {
            Ext.log({
                  level : 'error'
                }, "Failed to create child nodes!" + err);
            Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
          }

        } else {
          Ext.dirac.system_info.msg("Error", 'The panel which contains the menu does not exists!!!');
        }
      },

      /**
       * It closes the tab which belongs to a givgen desktop.
       * 
       * @param desktopName
       *          {String} the name of the desktop
       * @param tabName
       *          {String} the name of the tab (window) whih needs to be closed.
       */
      closeTab : function(desktopName, tabName) {
        var me = this;
        var desktops = null;
        var appContainer = me.getRightContainer().getApplicationContainer();
        if (appContainer) {
          if (!desktopName) {
            desktops = appContainer.getActiveTab();
          } else {
            desktops = appContainer.getTab(desktopName);
          }
          if (desktops) { // if the desktop is active
            var tab = desktops.getPanel(tabName);
            if (tab) { // if the windows is open.
              tab.close();
            }
          }
        } else {
          alert('appContainer does not exists!');
        }
      },
      /**
       * It refresh a node in the myDesktop.
       * 
       * @param{String} nodeName
       */
      refreshMyDesktop : function(nodeName) {
        var me = this;
        if (nodeName) {
          var oNode = me.myDesktop.findChild('text', nodeName);
          oNode.collapse();
          oNode.expand();
        } else {
          me.myDesktop.collapse();
          me.myDesktop.expand();
        }
      },
      /**
       * It retrieves the desktop states from the the UserProfile making a
       * request to the controller. It adds the applications states to the
       * specific node.
       * 
       * @private
       * @property {Ext.dirac.views.tabs.TreeMenuModel} rootNode the name of the
       *           node which is the desktop name.
       */
      addDesktopStatesToDesktop : function(rootNode) {
        var me = this;
        if (rootNode.data.isShared) {
          me.__addSharedDesktopStatesToDesktop(rootNode);
        } else {
          me.__addUserDesktopStatesToDesktop(rootNode);
        }

      },
      __addUserDesktopStatesToDesktop : function(rootNode) {
        var me = this;
        var sStateName = rootNode.getData().text;
        var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", sStateName);
        switch (iStateLoaded) {
          case -1 :
            GLOBAL.APP.CF.alert("The state " + sStateName + " does not exist !", "warning");
            return;
            break;
          case -2 :
            me.funcPostponedLoading = function() {
              me.__addUserDesktopStatesToDesktop(rootNode);
            }
            setTimeout(me.funcPostponedLoading, 1000);
            return;
            break;
        }

        var oDesktop = GLOBAL.APP.SM.getStateData("application", "desktop", sStateName);
        var node = rootNode.firstChild;
        try {
          rootNode.appendChild(node);
        } catch (err) {
          console.log(err);
        }
        for (var i = 0; i < oDesktop.data.length; i++) {
          try {
            nodeObj = {
              'text' : oDesktop.data[i].currentState,
              expandable : false,
              application : oDesktop.data[i].module,
              stateToLoad : oDesktop.data[i].currentState,
              desktop : sStateName,
              type : 'app',
              leaf : true,
              iconCls : 'icon-state-applications-class',
              allowDrag : true,
              allowDrop : true
            };
            Ext.define('Ext.dirac.views.tabs.DesktopNodeModel', {
                  extend : 'Ext.data.Model',
                  fields : ['text', 'type', 'application', 'stateToLoad', 'desktop'],
                  alias : 'widget.desktopnodemodel'
                });
            Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.DesktopNodeModel');
            var node = Ext.ModelManager.create(nodeObj, 'Ext.dirac.views.tabs.DesktopNodeModel');
            rootNode.appendChild(node);
          } catch (err) {
            Ext.log({
                  level : 'error'
                }, "Failed to create child nodes!" + err);
            Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
          }
        }
      },
      __addSharedDesktopStatesToDesktop : function(rootNode) {
        var me = this;
        me.loadlefttContainer.show();
        var sStateName = rootNode.getData().text;
        var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", sStateName);
        switch (iStateLoaded) {
          case -1 :
            GLOBAL.APP.CF.alert("The state " + sStateName + " does not exist !", "warning");
            return;
            break;
          case -2 :
            me.funcPostponedLoading = function() {
              me.__addUserDesktopStatesToDesktop(rootNode);
            }
            setTimeout(me.funcPostponedLoading, 1000);
            return;
            break;
        }

        var desktops = GLOBAL.APP.SM.getStateData('application', 'desktop', sStateName);

        var node = rootNode.firstChild;

        try {
          rootNode.appendChild(node);
        } catch (err) {
          console.log(err);
        }

        for (var i = 0; i < desktops.data.length; i++) {
          try {
            nodeObj = {
              'text' : desktops.data[i].currentState,
              expandable : false,
              application : desktops.data[i].name,
              stateToLoad : desktops.data[i].currentState,
              desktop : sStateName,
              type : 'app',
              leaf : true,
              iconCls : 'icon-state-applications-class',
              allowDrag : true,
              allowDrop : true
            };
            Ext.define('Ext.dirac.views.tabs.DesktopNodeModel', {
                  extend : 'Ext.data.Model',
                  fields : ['text', 'type', 'application', 'stateToLoad', 'desktop'],
                  alias : 'widget.desktopnodemodel'
                });
            Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.DesktopNodeModel');
            var node = Ext.ModelManager.create(nodeObj, 'Ext.dirac.views.tabs.DesktopNodeModel');
            rootNode.appendChild(node);
          } catch (err) {
            Ext.log({
                  level : 'error'
                }, "Failed to create child nodes!" + err);
            Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
          }
        }
        me.loadlefttContainer.hide();
      },
      /**
       * Function to refresh the state of the desktop working area in the URL
       */
      refreshUrlDesktopState : function() {

        var me = this;

        var sNewUrlState = "";

        var sThemeText = "Grey";

        if (GLOBAL.WEB_THEME == "ext-all-neptune")
          sThemeText = "Neptune";

        if (GLOBAL.WEB_THEME == "ext-all")
          sThemeText = "Classic";

        var sState_related_url = "&url_state=1|";
        if (me._state_related_url.length > 0) {
          sState_related_url += me._state_related_url[0];
          for (var i = 1; i < me._state_related_url.length; i++) {
            sState_related_url += ',' + me._state_related_url[i];
          }
        }

        if (me.currentState != "") {
          // if there is an active desktop state
          if (!Ext.Array.contains(me._state_related_url, me.currentState)) {
            if (me._state_related_url.length > 0) {
              sState_related_url += "," + me.currentState;
            } else {
              sState_related_url += me.currentState;
            }
            me._state_related_url.push(me.currentState);
          }
        }

        sNewUrlState = "?view=" + GLOBAL.VIEW_ID + "&theme=" + sThemeText + sState_related_url;
        var oHref = location.href;
        var oQPosition = oHref.indexOf("?");

        if (oQPosition != -1) {

          sNewUrlState = oHref.substr(0, oQPosition) + sNewUrlState;

        } else {

          sNewUrlState = oHref + sNewUrlState;

        }

        window.history.pushState("X", "ExtTop - Desktop Sample App", sNewUrlState);

      },

      loadSharedStateByName : function(sAppName, sStateName) {

        var me = this;

        var oData = GLOBAL.APP.SM.getStateData("reference", sAppName, sStateName);
        GLOBAL.APP.SM.oprLoadSharedState(oData["link"], me.cbAfterLoadSharedState, sStateName);

      },
      /*************************************************************************
       * @param{Object}oData It contains the information what is needed to open
       *                     an application. -objectType -moduleName -setupData
       */
      createNewModuleContainer : function(oData) {

        var me = this;

        me.createWindow(oData.objectType, oData.moduleName, oData.setupData);

      },
      cbAfterLoadSharedState : function(iCode, sLink, oDataReceived, stateName) {

        var me = GLOBAL.APP.MAIN_VIEW;

        var oDataItems = sLink.split("|");

        if (oDataItems[0] != "desktop") {

          var oSetupData = {
            "data" : oDataReceived,
            "currentState" : ""
          };

          me.createWindow("app", oDataItems[0], oSetupData);

        } else {

          var afterTabCreated = function(name, tab) {
            me.loadState(oDataReceived, tab);
          };

          me.createDesktopTab(stateName, 'tabView', afterTabCreated);

          if (me.currentState != "")
            GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.currentState);

          me.currentState = "";

          me.currentState = stateName;
          GLOBAL.APP.SM.oprAddActiveState("desktop", stateName);// OK

          me.refreshUrlDesktopState();

        }

      },
      oprLoadDesktopState : function(sStateName) {
        var me = this;
        me.__loadDesktopStateData(sStateName);

      },
      __loadDesktopStateData : function(sStateName) {

        var me = this;

        var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", sStateName);

        switch (iStateLoaded) {
          case -1 :
            GLOBAL.APP.CF.alert("The state does not exist !", "warning");
            return;
            break;
          case -2 :
            me.funcPostponedLoading = function() {

              me.__loadDesktopStateData(sStateName);

            }

            setTimeout(me.funcPostponedLoading, 1000);
            return;
            break;
        }

        me.loadState(GLOBAL.APP.SM.getStateData("application", "desktop", sStateName));

        if (me.currentState != "")
          GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.currentState);// OK

        me.currentState = sStateName;
        GLOBAL.APP.SM.oprAddActiveState("desktop", sStateName);// OK

        me.refreshUrlDesktopState();

      },
      /*************************************************************************
       * It creates a desktop for a given name
       */
      createNewDesktop : function() {
        var me = this;
        var afterSave = function(name) {
          me.createDesktopTab(name, me.ID);
          // add to the menu...
          me.__addDesktopToMenu(name);
          if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow)
            GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();

        }
        GLOBAL.APP.MAIN_VIEW.SM.formSaveDialog("application", "desktop", null, afterSave, "Create desktop:");
      },
      /*************************************************************************
       * it is used to move the tree node to the current (active) desktop
       * 
       * @param {String}
       *          desktop it is the name of the dedktop
       * @param {}
       *          item it is the node.
       */
      moveDesktopmMnuItem : function(desktop, item) {
        var me = this;
        if (item.data.text != "Default") { // do not move the default node
          var selPanel = me.getLeftContainer().getSelectionPanel();
          if (selPanel) {
            var treePanel = selPanel.getTreePanel();
            if (treePanel) {
              var node = me.myDesktop.findChild('text', desktop);
              node.expand();
              node.appendChild(item);
            }

          }
        }
      },
      /*************************************************************************
       * it returns the active tab
       * 
       * @return {Object}
       */
      getActiveDesktop : function() {
        var me = this;
        var activeDesktop = null;

        var rCont = me.getRightContainer();
        if (rCont) {
          var mainPanel = rCont.getApplicationContainer();
          if (mainPanel) {
            activeDesktop = mainPanel.getActiveTab();
          }
        }

        return activeDesktop;
      },

      addToDelete : function(appName, stateType, stateName) {
        var me = this;
        me.deleteApplications.push({
              module : appName,
              stateType : stateType,
              currentState : stateName
            });
      },
      destroyDeleteApplications : function() {
        var me = this;
        var cbAfterRefresh = function() {
          return;
        };
        for (var i = 0; i < me.deleteApplications.length; i++) {
          GLOBAL.APP.SM.oprDeleteState(me.deleteApplications[i].module, me.deleteApplications[i].stateType, me.deleteApplications[i].currentState, cbAfterRefresh);
        }
      },
      /**
       * It adds a node to the Shared Desktops node. The name of the node is the
       * stateName.
       * 
       * @param{String} stateName
       */
      addToDeafultDesktop : function(stateName, appClassName) {
        var me = this;
        me.myDesktop.expand();
        if (!me.defaultDesktop.loaded) {
          me.defaultDesktop.expand();
        } else {

          Ext.define('Ext.dirac.views.tabs.TreeNodeModel', {
                extend : 'Ext.data.Model',
                fields : ['text', 'type', 'application', 'stateToLoad', 'desktop'],
                alias : 'widget.treenodemodel'
              });
          var appName = appClassName.split(".");
          var qTip = "State Name: " + stateName + "<br>Application: " + appName[appName.length - 1] + "<br>";

          nodeObj = {
            'text' : stateName,
            expandable : false,
            application : appClassName,
            stateToLoad : stateName,
            type : 'app',
            leaf : true,
            iconCls : 'icon-state-applications-class',
            scope : me,
            allowDrag : true,
            allowDrop : true,
            qtip : qTip
          };
          Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.TreeNodeModel');
          // var model =
          // Ext.ModelManager.getModel('Ext.dirac.views.tabs.TreeMenuModel');
          // Ext.data.NodeInterface.decorate(model);
          var newnode = Ext.ModelManager.create(nodeObj, 'Ext.dirac.views.tabs.TreeNodeModel');
          // n = node.createNode(nodeObj);
          me.defaultDesktop.appendChild(newnode);
        }

      },
      addApplicationToDesktopMenu : function(desktopName, stateName, appClassName) {
        var me = this;
        me.myDesktop.expand();
        if (!me.defaultDesktop.loaded) {
          me.defaultDesktop.doNotCreateDesktop = true;
          var cbFunc = function() {
            var node = me.defaultDesktop.findChild('text', stateName);
            if (node) {
              me.moveDesktopmMnuItem(desktopName, node);
            } else {
              me.funcPostponedLoading = function() {

                cbFunc();

              };

              setTimeout(me.funcPostponedLoading, 1000);
            }
          }
          me.defaultDesktop.expand(false, cbFunc);
        } else {

          Ext.define('Ext.dirac.views.tabs.TreeNodeModel', {
                extend : 'Ext.data.Model',
                fields : ['text', 'type', 'application', 'stateToLoad', 'desktop'],
                alias : 'widget.treenodemodel'
              });
          var appName = appClassName.split(".");
          var qTip = "State Name: " + stateName + "<br>Application: " + appName[appName.length - 1] + "<br>";

          nodeObj = {
            'text' : stateName,
            expandable : false,
            application : appClassName,
            stateToLoad : stateName,
            type : 'app',
            leaf : true,
            iconCls : 'icon-state-applications-class',
            scope : me,
            allowDrag : true,
            allowDrop : true,
            qtip : qTip
          };
          Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.TreeNodeModel');
          // var model =
          // Ext.ModelManager.getModel('Ext.dirac.views.tabs.TreeMenuModel');
          // Ext.data.NodeInterface.decorate(model);
          var newnode = Ext.ModelManager.create(nodeObj, 'Ext.dirac.views.tabs.TreeNodeModel');
          // n = node.createNode(nodeObj);
          var desktopNode = me.myDesktop.findChild('text', desktopName);
          desktopNode.expand();
          desktopNode.appendChild(newnode);

        }
      }

    });
