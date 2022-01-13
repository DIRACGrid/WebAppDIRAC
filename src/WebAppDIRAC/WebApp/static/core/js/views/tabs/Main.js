/*******************************************************************************
 * This class is a container which contains the left and right panels. The
 * desktop split into two parts: 1. The left panel contains a menu used to
 * manage the applications. 2. The right panel contains the opened applications
 */
Ext.define("Ext.dirac.views.tabs.Main", {
  extend: "Ext.panel.Panel",
  requires: [
    "Ext.dirac.views.tabs.LeftContainer",
    "Ext.dirac.views.tabs.RightContainer",
    "Ext.dirac.views.tabs.TreeMenuModel",
    "Ext.dirac.views.tabs.StateManagement",
    "Ext.dirac.utils.WelcomeWindow",
  ],
  mixins: ["Ext.dirac.core.Stateful", "Ext.dirac.core.AppView"],
  alias: "widget.viewtabs",
  xtype: "main-container",
  // title: 'DIRAC::TAB',
  // layout: 'fit',

  items: [],

  leftConatiner: null,

  rightContainer: null,

  sharedDesktops: null,

  sharedApplications: null,

  sharedObjects: null,

  loading: false,

  appCounter: 0,

  myDesktop: null,

  /**
   * It contains a list of module name
   *
   * @type{List}
   */
  applications: [],
  /*************************************************************************
   * it store the Default node
   *
   * @type{Ext.dirac.views.tabs.TreeMenuMode}
   */
  defaultDesktop: null,

  _state_related_url: [],

  _default_desktop_state: [],

  /**
   * It contains the applications which can be deleted after save
   *
   * @type{Object}
   */
  deleteApplications: [],

  listeners: {
    afterrender: function () {
      var me = this;

      if (me.loadRightContainer.iCode != -4) {
        me.loadRightContainer.hide();
        me.loadleftContainer.hide();
      }
    },
  },
  constructor: function (config) {
    var me = this;
    me.rightContainer = Ext.create("Ext.dirac.views.tabs.RightContainer");
    me.loadRightContainer = new Ext.LoadMask({
      target: me.rightContainer,
      msg: "Loading desktops and applications...",
      iCode: 1,
    });

    var menu = me.createTreeMenu();

    me.leftConatiner = Ext.create("Ext.dirac.views.tabs.LeftContainer", {
      menu: menu,
    });
    me.loadleftContainer = new Ext.LoadMask({
      target: me.leftConatiner,
      msg: "Loading menu ...",
      iCode: 1,
    });
    me.callParent(arguments);
  },
  initComponent: function () {
    var me = this;
    me.ID = "tabs";
    var leftCont = me.getLeftContainer();
    var rightCont = me.getRightContainer();
    Ext.apply(me, {
      layout: {
        type: "border",
        padding: 2,
      },
      items: [me.leftConatiner, me.rightContainer],
    });
    me.SM = new Ext.dirac.views.tabs.StateManagement();
    me.callParent(arguments);
  },
  /**
   * @private method executed after the desktop has been rendered
   */
  afterRender: function () {
    var me = this;
    me.callParent();
    me.getLeftContainer().setActiveMenu("menuPanel"); // the statrting page
    // is the menu panel
    me.__oprLoadUrlState();
    Ext.get("app-dirac-loading").hide();
    if (me.loadleftContainer && me.loadRightContainer) {
      me.loadRightContainer.show();
      me.loadleftContainer.show(); // TODO Remove this comment!!!
    }
  },
  /**
   * @private Method called to load the state of the desktop described in
   *          the URL. This method is called after the desktop has been
   *          rendered.
   */
  __oprLoadUrlState: function () {
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
      if (parseInt(oParts[0], 10) != 0 && parseInt(oParts[0], 10) != 1) {
        oValid = false;
      }

      /*
       * if the indicator for desktop loaded state is 0, it means that no
       * desktop state has been loaded, but only particular apps
       */
      if (parseInt(oParts[0], 10) == 0) {
        GLOBAL.APP.CF.alert("Tab theme can not load applications from URL", "error");
        me.loadleftContainer.hide();
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

      if (oParts.length != 2 || Ext.util.Format.trim(oParts[1]).length == 0) {
        me.loadRightContainer.hide();
        return;
      }

      if (parseInt(oParts[0], 10) == 1) {
        me.getLeftContainer().setActiveMenu("menuPanel");
        // desktop state
        me.loading = true; // it is only used by the tabchange event in
        // order to not load the applications.
        var afterTabCreated = function (name, tab) {
          GLOBAL.APP.MAIN_VIEW.oprLoadDesktopState(name, tab);
          // //TODO make
          // sure the
          // applications
          // are loaded
          // to the
          // correct
          // tab!
          tab.isLoaded = true;
          me.loading = false;
          me.loadRightContainer.hide();
        };

        var oDesktop = oParts[1].split(",");
        oDesktop = Ext.Array.remove(oDesktop, "");
        // we remove the empty string from the list.

        var dsktops = [];
        if (oDesktop.length > 0) {
          var defaultdesktop = oDesktop[0].split("*");
          if (defaultdesktop.length > 1) {
            // LOAD applications to the default desktop....
            var isLoaded = oDesktop.length == 1 ? true : false;
            var loadFinished = oDesktop.length > 1 ? true : false;
            // if the desktop is the default desktop and we do not have any
            // desktop,
            // the default desktop is loaded.
            var loadlast = null;
            if (oDesktop.length == 1) {
              // we have another desktop
              loadlast = function (tab, appnb) {
                me.countloadedonDegault = 1;
                tab.on(
                  "add",
                  function (widget, component, index, eOpts) {
                    if (appnb == me.countloadedonDegault) {
                      // only load the latest application
                      widget.setActiveTab(component);
                      component.on("afterlayout", function (p, layout, eOpts) {
                        component.loadData();
                      });
                    }
                    me.countloadedonDegault += 1;
                  },
                  me
                );
              };
            }
            me.loadDefaultdesktop(defaultdesktop, isLoaded, loadFinished, loadlast);
            Ext.Array.erase(oDesktop, 0, 1);
          }

          if (oDesktop.length > 0) {
            me.readLayoutFromStates(oDesktop, afterTabCreated);
          } else {
            me.loadRightContainer.hide();
          }
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
  readLayoutFromStates: function (oDesktop, cbFunction) {
    var me = this;
    var oStateData = null;
    for (var i = 0; i < oDesktop.length; i++) {
      // do not create an empty
      // desktop...
      if (oDesktop[i] != "") {
        var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", oDesktop[i]);

        switch (iStateLoaded) {
          case 1:
            oStateData = GLOBAL.APP.SM.getStateData("application", "desktop", oDesktop[i]);
            break;
          case -1:
            var isRefernceLoaded = GLOBAL.APP.SM.isStateLoaded("reference", "desktop", oDesktop[i]);
            switch (isRefernceLoaded) {
              case 1:
                oStateData = GLOBAL.APP.SM.getStateData("reference", "desktop", oDesktop[i]);
                break;
              case -1:
                GLOBAL.APP.CF.alert("The " + oDesktop[i] + " state does not exist !", "warning");
                Ext.Array.remove(oDesktop, oDesktop[i]);
                me.readLayoutFromStates(oDesktop, cbFunction);
                me.loadRightContainer.hide();
                break;
                return;
              case -2:
                me.funcPostponedLoading = function () {
                  me.readLayoutFromStates(oDesktop, cbFunction);
                };

                setTimeout(me.funcPostponedLoading, 1000);
                return;
                break;
            }
            break;
            return;
          case -2:
            me.funcPostponedLoading = function () {
              me.readLayoutFromStates(oDesktop, cbFunction);
            };

            setTimeout(me.funcPostponedLoading, 1000);
            return;
            break;
        }

        var view = oStateData.view ? oStateData.view : "tabView";
        if (i == oDesktop.length - 1) {
          GLOBAL.APP.MAIN_VIEW.createDesktopTab(oDesktop[i], view, cbFunction);
        } else {
          GLOBAL.APP.MAIN_VIEW.createDesktopTab(oDesktop[i], view);
        }
        if (!Ext.Array.contains(me._state_related_url, oDesktop[i])) {
          me._state_related_url.push(oDesktop[i]);
        }
      }
    }
  },
  loadDefaultdesktop: function (applications, isLoaded, loadFinished, cbLoad) {
    var me = this;
    var afterDefaultTabCreated = function (name, tab) {
      var setupData = {};
      for (var i = 0; i < applications.length; i++) {
        if (applications[i] != "") {
          var application = applications[i].split(":");

          if (application.length > 1 && Ext.util.Format.trim(application[1]) != "") {
            // store
            // the state of the applications
            if (application[0] in setupData) {
              setupData[application[0]].push(application[1]);
            } else {
              setupData[application[0]] = [];
              setupData[application[0]].push(application[1]);
            }
          }

          var isStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", application[1], "|"); // OK

          if (isStateLoaded == -2) {
            /*
             * if the application cache does not exist
             */

            var oFunc = function (success, appName) {
              if (success == 1) {
                var loadState = {
                  stateToLoad: "",
                };
                if (appName in setupData) {
                  loadState.stateToLoad = setupData[appName].pop();
                }
                me.createWindow("app", appName, loadState, tab);
              }
            };

            if (GLOBAL.STATE_MANAGEMENT_ENABLED) GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(application[0], oFunc);
          }

          if (!Ext.Array.contains(me._default_desktop_state, application[0])) {
            me._default_desktop_state.push(applications[i]);
          }
        }
      }
      me.loading = loadFinished;
      tab.isLoaded = isLoaded;
      if (cbLoad) {
        cbLoad(tab, applications.length - 1);
      }
    };
    GLOBAL.APP.MAIN_VIEW.createDesktopTab("Default", me.view, afterDefaultTabCreated);
  },
  getStateData: function () {
    var me = this;
    // TODO: Save the portal state. We can save the settings here.
    return [];
  },
  loadState: function (oData, tab) {
    var me = this;
    me.loadRightContainer.show();

    if (tab) {
      tab.loadState(oData);
    } else {
      tab = me.getActiveDesktop();
    }

    if (me.ID in oData["views"]) {
      if (oData["data"].length < 1) {
        // we have no application in the desktop...
        me.loadRightContainer.hide();
      }
      for (var i = 0, len = oData["data"].length; i < len; i++) {
        if ("module" in oData["data"][i]) {
          var oAppStateData = {};

          oAppStateData.name = oData["data"][i].module;
          oAppStateData.data = oData["data"][i].data;
          oAppStateData.currentState = oData["data"][i].currentState;

          if (i == oData["data"].length - 1) {
            var cbSetActiveTab = function (oTab) {
              if (tab && tab.view == "tabView") {
                // when the presenter view used then does not have tabs
                // we have to found what was the last active tab.
                var activeTab = oData.views.tabs.activeTab;

                if (activeTab) {
                  if (activeTab.currentState == "") {
                    tab.setActiveTab(0);
                    me.loadRightContainer.hide();
                  } else if (tab.items.length < oData["data"].length) {
                    Ext.defer(function () {
                      // wait until all application
                      // window have created...
                      me.loadRightContainer.show();
                      tab.items.each(function (win, value, length) {
                        if (activeTab.currentState == win.currentState && activeTab.name == win.setupData.name) {
                          tab.setActiveTab(win);
                          me.loadRightContainer.hide();
                          return;
                        }
                      });
                    }, 100);
                  } else {
                    var found = false;
                    tab.items.each(function (win, value, length) {
                      if (activeTab.currentState == win.currentState && activeTab.name == win.setupData.name) {
                        tab.setActiveTab(win);
                        me.loadRightContainer.hide();
                        found = true;
                        return;
                      }
                    });
                    if (!found) {
                      tab.setActiveTab(0);
                      me.loadRightContainer.hide();
                    }
                  }
                } else {
                  me.loadRightContainer.hide();
                  tab.setActiveTab(oTab);
                }
              }
            };
            me.createWindow("app", oAppStateData.name, oAppStateData, tab, cbSetActiveTab);
            // load the one application on the desktop
          } else {
            // create each application
            me.createWindow("app", oAppStateData.name, oAppStateData, tab);
          }
        } else if ("link" in oData["data"][i]) {
          me.loadRightContainer.hide();
          var oAppStateData = {};

          oAppStateData.name = oData["data"][i].link;
          Ext.apply(oAppStateData, oData["data"][i]);

          me.createWindow("link", oAppStateData.name, oAppStateData, tab);
        }
      }
    } else {
      // desktop theme( it is saved using the desktop theme.

      for (var i = 0, len = oData["data"].length; i < len; i++) {
        if ("link" in oData["data"][i]) {
          var oAppStateData = {};

          oAppStateData.name = oData["data"][i].link;
          Ext.apply(oAppStateData, oData["data"][i]);

          me.createWindow("link", oAppStateData.name, oAppStateData, tab);
        } else if ("module" in oData["data"][i]) {
          var oAppStateData = {};

          oAppStateData.name = oData["data"][i].module;
          oAppStateData.data = oData["data"][i].data;
          oAppStateData.currentState = oData["data"][i].currentState;

          if (i == oData["data"].length - 1) {
            var cbSetActiveTab = function (oTab) {
              if (tab && tab.view == "tabView") {
                // when the presenter view used then does not have tabs
                // we have to found what was the last active tab.
                var activeTab = tab._activeTab;
                if (activeTab) {
                  if (tab.items.length < oData["data"].length) {
                    Ext.defer(function () {
                      // wait until all application
                      // window have created...
                      me.loadRightContainer.show();
                      tab.items.each(function (win, value, length) {
                        if (activeTab.currentState == win.currentState && activeTab.name == win.setupData.name) {
                          tab.setActiveTab(win);
                          me.loadRightContainer.hide();
                          return;
                        }
                      });
                    }, 100);
                  } else {
                    tab.items.each(function (win, value, length) {
                      if (activeTab.currentState == win.currentState && activeTab.name == win.setupData.name) {
                        tab.setActiveTab(win);
                        me.loadRightContainer.hide();
                        return;
                      }
                    });
                  }
                } else {
                  tab.setActiveTab(oTab);
                }
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
  getLeftContainer: function () {
    var me = this;
    return me.leftConatiner;
  },
  getRightContainer: function () {
    var me = this;
    return me.rightContainer;
  },
  /**
   * It creates a tree which nodes are applications. This is used as a Menu.
   * The tree has application nodes, My desktop node and Shared desktop
   * node.
   */
  createTreeMenu: function () {
    var me = this;

    Ext.data.NodeInterface.decorate("Ext.dirac.views.tabs.TreeMenuModel");

    var config = {
      text: "Desktops",
      allowDrag: false,
      allowDrop: false,
      iconCls: "core-desktop-icon",
      expanded: true,
      root: true,
      application: "",
    };
    var rootNode = Ext.create("Ext.dirac.views.tabs.TreeMenuModel", config);

    for (var j = 0; j < GLOBAL.APP.configData["menu"].length; j++) {
      me.__getAppRecursivelyFromConfig(GLOBAL.APP.configData["menu"][j], rootNode);
    }

    var oFunc = function (iCode, sAppName) {
      if (me.loadRightContainer) {
        me.loadRightContainer.hide();
      }
      if (me.loadleftContainer) {
        me.loadleftContainer.hide();
      }
      me.createDesktopTree(rootNode);
    };

    if (GLOBAL.STATE_MANAGEMENT_ENABLED) {
      GLOBAL.APP.SM.oprReadApplicationStatesAndReferences("desktop", oFunc); // OK
    }

    return rootNode;
  },
  __getAppRecursivelyFromConfig: function (item, rootNode) {
    var me = this;
    var expanded = null;
    if (item.length == 2) {
      if (item[0] == "Applications") {
        expanded = true;
      } else {
        expanded = false;
      }
      var childnode = rootNode.appendChild({
        text: item[0],
        expandable: true,
        expanded: expanded,
        allowDrag: false,
        allowDrop: false,
        leaf: false,
        application: item[2],
      });
      for (var i = 0; i < item[1].length; i++) {
        me.__getAppRecursivelyFromConfig(item[1][i], childnode);
      }
    } else {
      if (item[0] == "app") {
        var oParts = item[2].split(".");
        var sStartClass = oParts.length == 2 ? item[2] + ".classes." + oParts[1] : item[2];
        me.applications.push(sStartClass); // we have to save a list of
        // applications which can
        // used.
        var newnode = rootNode.appendChild({
          text: item[1],
          expandable: false,
          application: sStartClass, // item[2],
          leaf: true,
          allowDrag: false,
          iconCls: "core-application-icon",
          stateToLoad: "Default",
          type: "app",
          desktop: "Default",
        });
      } else {
        var newnode = rootNode.appendChild({
          text: item[1],
          expandable: false,
          application: item[2],
          type: "link",
          iconCls: "system_web_window",
          leaf: true,
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
  createDesktopTree: function (node) {
    var me = this;

    var rootNode = node.appendChild({
      text: "My Desktops",
      allowDrag: false,
      allowDrop: false,
      iconCls: "my-desktop",
      application: "",
    });
    me.myDesktop = rootNode;

    me.defaultDesktop = me.myDesktop.appendChild({
      text: "Default",
      type: "Default",
      expandable: true,
      allowDrag: false,
      allowDrop: false,
      iconCls: "core-desktop-icon",
    });

    me.defaultDesktop.appendChild({
      text: "All",
      expandable: false,
      application: "Default",
      allowDrag: false,
      allowDrop: false,
      type: "tabView",
      leaf: true,
      iconCls: "icon-applications-states-all-default",
    });

    var oStates = GLOBAL.APP.SM.getApplicationStates("application", "desktop"); // OK
    for (var i = 0, len = oStates.length; i < len; i++) {
      var sStateName = oStates[i];
      var oStateData = GLOBAL.APP.SM.getStateData("application", "desktop", sStateName);
      var childNode = rootNode.appendChild({
        text: sStateName,
        expandable: true,
        application: sStateName,
        type: "desktop",
        isShared: false,
        leaf: false,
        allowDrag: false,
        allowDrop: true,
        iconCls: "core-desktop-icon",
        icon: null,
        view: oStateData.view,
      });
      childNode.appendChild({
        text: "All",
        expandable: false,
        application: sStateName,
        allowDrag: false,
        allowDrop: false,
        type: oStateData.view != null ? oStateData.view : "tabView",
        leaf: true,
        iconCls: "icon-applications-states-all-default",
        view: oStateData.view,
      });
    }

    var rootNode = node.appendChild({
      text: "Shared",
      allowDrag: false,
      allowDrop: false,
      iconCls: "dirac-icon-share",
      application: "",
    });

    me.sharedObjects = rootNode;

    var desktopsNode = me.sharedObjects.appendChild({
      text: "Shared Desktops",
      allowDrag: false,
      allowDrop: false,
      iconCls: "shared-desktop",
      application: "",
    });
    me.sharedDesktops = desktopsNode;

    var applicationsNode = me.sharedObjects.appendChild({
      text: "Shared Applications",
      allowDrag: false,
      allowDrop: false,
      iconCls: "shared-desktop",
      application: "",
    });

    me.sharedApplications = applicationsNode;

    return rootNode;
  },

  oprLoadSharedDesktopsAndApplications: function () {
    var me = this;
    // creating items for the state links
    me.sharedDesktops.removeAll();
    me.sharedApplications.removeAll();

    var oRefs = GLOBAL.APP.SM.getApplicationStates("reference", "desktop"); // OK

    for (var i = 0, len = oRefs.length; i < len; i++) {
      var sStateName = oRefs[i];

      var childNode = me.sharedDesktops.appendChild({
        text: sStateName,
        expandable: false,
        application: "desktop",
        stateToLoad: sStateName,
        isShared: true,
        allowDrag: false,
        allowDrop: false,
        type: "tabView",
        stateType: "desktop",
        leaf: true,
        iconCls: "icon-applications-states-all-default",
        qtip: sStateName,
      });
    }

    // load shared applications state
    var selPanel = me.getLeftContainer().getSelectionPanel();
    var treePanel = null;
    if (selPanel) {
      treePanel = selPanel.getTreePanel();
    }

    treePanel.setLoading(true);
    var applications = GLOBAL.APP.MAIN_VIEW.applications;
    for (var i = 0; i < applications.length; i++) {
      var oFunc = function (iCode, sAppName) {
        var appRefs = GLOBAL.APP.SM.getApplicationStates("reference", sAppName);
        for (var i = 0, len = appRefs.length; i < len; i++) {
          var stateName = appRefs[i];

          me.addToSharedApplications(sAppName, stateName, "reference");
        }
        treePanel.setLoading(false);
      };

      var appRefs = GLOBAL.APP.SM.getApplicationStates("reference", applications[i]); // OK
      if (appRefs.length > 0) {
        // it is already loaded
        for (var j = 0, len = appRefs.length; j < len; j++) {
          var stateName = appRefs[j];

          me.addToSharedApplications(applications[i], stateName, "reference");
        }
      } else {
        GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(applications[i], oFunc); // OK
      }
    }
  },
  /*************************************************************************
   * It changes the workspace in the RightContainer taking account what was
   * selected in the LeftConatiner.
   *
   * @param {String}
   *          type can be welcome, menuPanel and sharedLayouts.
   */
  changeRightPanel: function (type) {
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
  createWindow: function (loadedObjectType, moduleName, setupData, oTab, cbFunction) {
    var me = this;

    // Do not create new window if the application in downtime
    var message = GLOBAL.APP.applicationInDowntime(moduleName);
    if (message) {
      return GLOBAL.APP.CF.alert(message, "info");
    }

    Ext.get("app-dirac-loading").show();

    if (loadedObjectType == "app") {
      var oParts = moduleName.split(".");
      /*
        The value is taken from the query parameters, e.g.:
        https://dirac.egi.eu/DIRAC/s:BIOMED-Prod/g:dirac_admin/?theme=Crisp&url_state=1|*DIRAC.RegistryManager.classes.RegistryManager:*DIRAC.PilotSummary.classes.PilotSummary:*DIRAC.JobSummary.classes.JobSummary:*DIRAC.ConfigurationManager.classes.ConfigurationManager:*DIRAC.Accounting.classes.Accounting:*DIRAC.ProxyManager.classes.ProxyManager:,

        https://dirac.egi.eu/DIRAC/BIOMED-Prod/registry/?theme=Crisp&url_state=1|*DIRAC.RegistryManager.classes.RegistryManager:*DIRAC.PilotSummary.classes.PilotSummary:*DIRAC.JobSummary.classes.JobSummary:*DIRAC.ConfigurationManager.classes.ConfigurationManager:*DIRAC.Accounting.classes.Accounting:*DIRAC.ProxyManager.classes.ProxyManager:,

        https://dirac.egi.eu/DIRAC/?theme=Crisp&url_state=1|*DIRAC.Accounting.classes.Accounting:*DIRAC.Accounting:,
      */
      var sStartClass = oParts.length == 2 ? moduleName + ".classes." + oParts[1] : moduleName;

      // if the development mod is off, we set up diffrent path to
      // load javascript
      if (GLOBAL.DEV == 0) {
        var oConfig = {
          enabled: true,
          paths: {},
        };

        oConfig["paths"][oParts[0] + "." + oParts[1] + ".classes"] = "static/" + oParts[0] + "/" + oParts[1] + "/build";

        Ext.Loader.setConfig(oConfig);
      }

      Ext.require(
        sStartClass,
        function () {
          var me = this;

          // creating an object of the demeanded application
          var instance = Ext.create(sStartClass, {
            launcherElements: {
              title: "Module",
              iconCls: "notepad",
              applicationName: oParts[1],
              width: 0,
              height: 0,
              maximized: true,
              x: null,
              y: null,
            },
          });

          var config = {
            setupData: setupData,
            loadedObject: instance,
            loadedObjectType: "app",
            toLoad: cbFunction ? true : false,
            isLoaded: false,
          };

          me.getRightContainer().createWindow(config, oTab, cbFunction);
          // initializing window
        },
        this
      );
    } else if (loadedObjectType == "link") {
      if (window.location.protocol.startsWith("https") && !moduleName.startsWith("https")) {
        var tab = new Ext.dirac.views.tabs.Panel();
        tab.oprShowInNewTab(moduleName, moduleName);
        Ext.get("app-dirac-loading").hide();
      } else {
        me.getRightContainer().createWindow(
          {
            setupData: setupData,
            loadedObjectType: "link",
            linkToLoad: moduleName,
          },
          oTab,
          cbFunction
        );
      }
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
  createDesktopTab: function (name, view, cbFunction) {
    var me = this;
    me.getRightContainer().createDesktopTab(name, view, cbFunction);
  },
  /*************************************************************************
   * it returns the desktop dimension.
   */
  getDesktopDimensions: function () {
    var me = this;

    return [me.getWidth(), me.getHeight()];
  },
  /**
   * It saves the state of an application. Note: It only take into account
   * the active a application.
   */
  saveActiveApplicationState: function () {
    var me = this;

    var activeDesktop = me.getActiveDesktop();
    if (activeDesktop) {
      var appl = activeDesktop.getActiveTab();
      if (appl) {
        GLOBAL.APP.MAIN_VIEW.SM.saveState(
          activeDesktop.title,
          appl.loadedObject.self.getName(),
          appl.loadedObject.currentState,
          function (retCode, appName, stateType, stateName) {
            if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow) {
              GLOBAL.APP.MAIN_VIEW.SM.saveWindow.hide();
            }
          }
        );
      } else {
        Ext.dirac.system_info.msg(
          "Error",
          "You do not have any active application on the desktop. Please select an application (tab) on the desktop!!!"
        );
      }
    } else {
      Ext.dirac.system_info.msg("Error Notification", "Please open a dektop!!! ");
    }
  },
  /**
   * It saves the state of an existing application with a new name. Note: It
   * only take into account the active a application.
   */
  saveAsActiveApplicationState: function () {
    var me = this;

    var activeDesktop = me.getActiveDesktop();
    if (activeDesktop) {
      var appl = activeDesktop.getActiveTab();

      if (appl) {
        GLOBAL.APP.MAIN_VIEW.SM.saveAsState(
          activeDesktop.title,
          appl.loadedObject.self.getName(),
          appl.loadedObject.currentState,
          function (desktop, app, stateName) {
            Ext.dirac.system_info.msg("Notification", stateName + " application is saved on " + desktop + "!");

            if (desktop != "Default" && appl.currentState != stateName) {
              // GLOBAL.APP.MAIN_VIEW.getRightContainer().addStateToExistingWindows(stateName,
              // app);

              if (appl.currentState != "") GLOBAL.APP.SM.oprRemoveActiveState(app, appl.currentState);

              appl.loadedObject.currentState = stateName;
              appl.currentState = stateName;
              GLOBAL.APP.SM.oprAddActiveState(app, stateName);
              appl.setTitle(appl.loadedObject.launcher.title + " [" + appl.loadedObject.currentState + "]");

              if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow) GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
            }
          }
        );
      } else {
        Ext.dirac.system_info.msg("Error", "Please open an application!!! ");
      }
    } else {
      Ext.dirac.system_info.msg("Error", "Please open a dektop!!! ");
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
  refreashTree: function (desktop, application) {
    // <debug>
    Ext.log(
      {
        level: "log",
        stack: true,
      },
      "Begin method!"
    );
    // </debug>

    var me = this;
    var selPanel = me.getLeftContainer().getSelectionPanel();
    if (selPanel) {
      var treePanel = selPanel.getTreePanel();
      var rootNode = treePanel.getStore().getRootNode();
      me.refreshNode(rootNode, desktop, application);
    } else {
      Ext.dirac.system_info.msg("Error", "The panel which contains the menu does not exists!!!");
    }
    // <debug>
    Ext.log(
      {
        level: "log",
        stack: true,
      },
      "End method!"
    );
    // </debug>
  },
  /*************************************************************************
   * it refresh a specific node
   *
   * @param{Object} rootNode
   * @param{String} desktop
   * @param{String}
   */
  refreshNode: function (rootNode, desktop, application) {
    if (rootNode) {
      if (rootNode.childNodes.length > 0) {
        for (var i = 0; i < rootNode.childNodes.length; i++) {
          var node = rootNode.childNodes[i];
          if (node.data.text == desktop && desktop != "Default") {
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
  addNodeToMenu: function (stateName, appName) {
    var me = this;
    var selPanel = me.getLeftContainer().getSelectionPanel();
    if (selPanel) {
      var treePanel = selPanel.getTreePanel();
      var rootNode = treePanel.getStore().getRootNode();

      var node = me.__findNode(rootNode, appName);

      var defaultNode = node.firstChild;
      defaultNode.data.iconCls = "core-application-icon";
      defaultNode.text = stateName;
      defaultNode.data.text = stateName;
      defaultNode.data.stateToLoad = stateName;
      node.removeChild(defaultNode);

      var nodeObj = {
        text: "Default",
        type: "app",
        allowDrag: false,
        expandable: false,
        leaf: true,
        application: appName,
        stateToLoad: "Default",
        iconCls: "icon-applications-states-all-default",
      };
      /* eslint-disable */
      if (!Ext.data.schema.Schema.instances.default.hasEntity("Ext.dirac.views.tabs.TreeNodeModel")) {
        /* eslint-enable */
        Ext.define("Ext.dirac.views.tabs.TreeNodeModel", {
          extend: "Ext.data.Model",
          fields: ["text", "type", "application", "stateToLoad", "desktop"],
          alias: "widget.treenodemodel",
        });
        Ext.data.NodeInterface.decorate("Ext.dirac.views.tabs.TreeNodeModel");
      } else {
        /* eslint-disable */
        var model = Ext.data.schema.Schema.instances.default.getEntity("Ext.dirac.views.tabs.TreeNodeModel"); // returns the constructor MyApp.models.MyModel()
        /* eslint-enable */
        Ext.data.NodeInterface.decorate(model);
      }

      var newNode = Ext.create("Ext.dirac.views.tabs.TreeNodeModel", nodeObj);
      node.insertChild(0, newNode);
      node.appendChild(defaultNode);
    } else {
      Ext.dirac.system_info.msg("Error", "The panel which contains the menu does not exists!!!");
    }
  },
  /*************************************************************************
   * It check the existance of a node for a given name.
   *
   * @param{Object} rootNode
   * @param{String} name
   * @private
   */
  __findNode: function (rootNode, name) {
    var me = this;
    for (var i = 0; i < rootNode.childNodes.length; i++) {
      var node = rootNode.childNodes[i];
      if (node.get("application") == name) {
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
  removeNodeFromMenu: function (stateName, appName) {
    var me = this;
    var selPanel = me.getLeftContainer().getSelectionPanel();
    if (selPanel) {
      var treePanel = selPanel.getTreePanel();
      var rootNode = treePanel.getStore().getRootNode();
      var node = me.__findNode(rootNode, appName);
      var oDelete = node.findChild("text", stateName);
      node.removeChild(oDelete);
    } else {
      Ext.dirac.system_info.msg("Error", "The panel which contains the menu does not exists!!!");
    }
  },
  removeFromSharedAppMenu: function (stateName) {
    var me = this;
    var node = me.sharedApplications.findChild("text", stateName);
    me.sharedApplications.removeChild(node);
  },
  deleteApplicationStates: function () {
    var me = this;

    var activeDesktop = me.getActiveDesktop();
    if (activeDesktop) {
      if (activeDesktop.view == "presenterView") {
        appl = activeDesktop.getOpenedApplication();
      } else {
        var appl = activeDesktop.getActiveTab();
      }

      if (appl) {
        var funcAfterRemove = function (stateType, sAppName, sStateName) {
          if (stateType == "application") {
            me.removeNodeFromMenu(sStateName, sAppName);
          } else {
            // it is a shared app =>reference
            me.removeFromSharedAppMenu(sStateName);
          }
        };
        GLOBAL.APP.MAIN_VIEW.SM.formManageStates(appl.loadedObject.self.getName(), funcAfterRemove);
      } else {
        Ext.dirac.system_info.msg("Error", "Please open an application!!! ");
      }
    } else {
      Ext.dirac.system_info.msg("Error", "Please open a dektop!!! ");
    }
  },
  /**
   * It saves the desktop state. If the state name is defaulf, a new must be
   * defined.
   */
  saveActiveDesktopState: function () {
    var me = this;
    me.getRightContainer().oprSaveDesktopState();
  },
  /*************************************************************************
   * It is used to save the sate of a given desktop....
   *
   * @param {String}
   *          stateName the name of the desktop
   */
  saveDesktopState: function (stateName) {
    var me = this;
    me.getRightContainer().oprSaveDesktopState(stateName);
  },
  /**
   * It save an existing desktop state with a new name.
   */
  saveAsActiveDesktopState: function () {
    var me = this;
    me.getRightContainer().oprSaveAsDesktopState();
  },
  /**
   * It deletes the desktops.
   */
  deleteDesktopStates: function () {
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
  renameCurrentDesktop: function (name) {
    var me = this;

    var activeDesktop = me.getActiveDesktop();
    if (activeDesktop) {
      var desktopName = activeDesktop.title;
      activeDesktop.setTitle(name);
      if (desktopName == "Default") {
        // if the current desktop is the
        // remove the applications from the default desktop
        me._default_desktop_state = [];
        // default, we have to remove the
        // items from the Default desktop.
        // and we have to create a new item(desktop).
        me.__addDesktopToMenu(name);
        // remove the applications from the state.
        var data = me.getRightContainer().getStateData(); // get the active
        // desktop states.
        var cbAfterRefresh = function (code, sAppName, sStateType, sStateName) {
          if (code == 1) {
            var node = me.defaultDesktop.findChild("text", sStateName);
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
      Ext.dirac.system_info.msg("Error", "Please open a dektop!!! ");
    }
  },
  /**
   * It is used to add a new desktop to the menu.
   *
   * @param {string}
   *          stateName the name of the desktop.
   * @private
   */
  __addDesktopToMenu: function (stateName) {
    var me = this;
    me.myDesktop.expand();
    var selPanel = me.getLeftContainer().getSelectionPanel();
    if (selPanel) {
      var treePanel = selPanel.getTreePanel();
      // var rootNode = treePanel.getStore().getRootNode();
      var rootNode = me.myDesktop;
      var oNode = null;
      rootNode.eachChild(function (node) {
        // remove the node if it is
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
          var nodeObj = {
            text: stateName,
            expandable: true,
            application: stateName,
            type: "desktop",
            leaf: false,
            iconCls: "core-desktop-icon",
            allowDrag: false,
            allowDrop: true,
          };
          /* eslint-disable */
          if (!Ext.data.schema.Schema.instances.default.hasEntity("Ext.dirac.views.tabs.DesktopNodeModel")) {
            /* eslint-enable */
            Ext.define("Ext.dirac.views.tabs.DesktopNodeModel", {
              extend: "Ext.data.Model",
              fields: ["text", "type", "application", "stateToLoad", "desktop"],
              alias: "widget.desktopnodemodel",
            });
            Ext.data.NodeInterface.decorate("Ext.dirac.views.tabs.DesktopNodeModel");
          } else {
            /* eslint-disable */
            var model = Ext.data.schema.Schema.instances.default.getEntity("Ext.dirac.views.tabs.DesktopNodeModel");
            /* eslint-enable */
            Ext.data.NodeInterface.decorate(model);
          }

          var node = Ext.create("Ext.dirac.views.tabs.DesktopNodeModel", nodeObj);
          var childNode = rootNode.appendChild(node);
          var nodeObj = {
            text: "All",
            expandable: false,
            application: stateName,
            type: "tabView",
            leaf: true,
            iconCls: "icon-applications-states-all-default",
            allowDrag: false,
            allowDrop: false,
          };

          var node = Ext.create("Ext.dirac.views.tabs.DesktopNodeModel", nodeObj);
          childNode.appendChild(node);
          childNode.expand();
        } catch (err) {
          Ext.log(
            {
              level: "error",
            },
            "Failed to create child nodes!" + err
          );
          Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
        }
      }
    } else {
      Ext.dirac.system_info.msg("Error", "The panel which contains the menu does not exists!!!");
    }
  },

  /**
   * It deletes the state from the menu.
   *
   * @param {String}
   *          stateName it is the desktop name which has to be deleted from
   *          the menu.
   */
  deleteStateFromMenu: function (stateName) {
    var me = this;
    var selPanel = me.getLeftContainer().getSelectionPanel();
    if (selPanel) {
      var treePanel = selPanel.getTreePanel();
      // var rootNode = treePanel.getStore().getRootNode();
      var rootNode = me.myDesktop;
      rootNode.eachChild(function (node) {
        if (node && node.getData().text == stateName) {
          rootNode.removeChild(node);
          return;
        }
      }, me);
    } else {
      Ext.dirac.system_info.msg("Error", "The panel which contains the menu does not exists!!!");
    }
  },
  /**
   * It removes a given node from the tree (Menu tree).
   *
   * @param{String} stateName
   */
  removeFormSharedDesktop: function (stateName) {
    var me = this;
    var me = this;
    var selPanel = me.getLeftContainer().getSelectionPanel();
    if (selPanel) {
      var treePanel = selPanel.getTreePanel();
      // var rootNode = treePanel.getStore().getRootNode();
      var rootNode = me.sharedDesktops;
      rootNode.eachChild(function (node) {
        if (node && node.getData().text == stateName) {
          rootNode.removeChild(node);
          return;
        }
      }, me);
    } else {
      Ext.dirac.system_info.msg("Error", "The panel which contains the menu does not exists!!!");
    }
  },
  /**
   * It adds a node to the Shared Desktops node. The name of the node is the
   * stateName.
   *
   * @param{String} stateName
   */
  addToSharedDesktop: function (stateName, stateType) {
    var me = this;
    var selPanel = me.getLeftContainer().getSelectionPanel();
    if (selPanel) {
      var treePanel = selPanel.getTreePanel();
      var rootNode = me.sharedDesktops;
      try {
        rootNode.appendChild({
          text: stateName,
          expandable: false,
          application: stateName,
          isShared: true,
          allowDrag: false,
          allowDrop: false,
          type: "tabView",
          stateType: stateType,
          leaf: true,
          iconCls: "icon-applications-states-all-default",
          qtip: stateName,
        });
      } catch (err) {
        Ext.log(
          {
            level: "error",
          },
          "Failed to create child nodes!" + err
        );
        Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
      }
    } else {
      Ext.dirac.system_info.msg("Error", "The panel which contains the menu does not exists!!!");
    }
  },

  /**
   * It adds a node to the Shared applications node. The name of the node is
   * the stateName.
   *
   * @param{String} stateName
   */
  addToSharedApplications: function (applicationName, stateName, stateType) {
    var me = this;
    var selPanel = me.getLeftContainer().getSelectionPanel();
    if (selPanel) {
      var treePanel = selPanel.getTreePanel();
      var rootNode = me.sharedApplications;
      var application = applicationName.split(".");
      var qtip = application[application.length - 1] + "<br>State Name: " + stateName;
      try {
        rootNode.appendChild({
          text: stateName,
          expandable: false,
          application: applicationName,
          stateToLoad: stateName,
          isShared: true,
          allowDrag: false,
          allowDrop: false,
          type: "tabView",
          leaf: true,
          stateType: stateType,
          iconCls: "icon-applications-states-all-default",
          qtip: qtip,
        });
      } catch (err) {
        Ext.log(
          {
            level: "error",
          },
          "Failed to create child nodes!" + err
        );
        Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
      }
    } else {
      Ext.dirac.system_info.msg("Error", "The panel which contains the menu does not exists!!!");
    }
    me.refreshUrlDesktopState();
  },
  /**
   * It closes the tab which belongs to a givgen desktop.
   *
   * @param desktopName
   *          {String} the name of the desktop
   * @param tabName
   *          {String} the name of the tab (window) whih needs to be closed.
   */
  closeTab: function (desktopName, tabName) {
    var me = this;
    var desktops = null;
    var appContainer = me.getRightContainer().getApplicationContainer();
    if (appContainer) {
      if (!desktopName) {
        desktops = appContainer.getActiveTab();
      } else {
        desktops = appContainer.getTab(desktopName);
      }
      if (desktops) {
        // if the desktop is active
        var tab = desktops.getPanel(tabName);
        if (tab) {
          // if the windows is open.
          tab.close();
        }
      }
    } else {
      alert("appContainer does not exists!");
    }
  },
  /**
   * It refresh a node in the myDesktop. If teh nodeName does not exists, it
   * adds to the myDesktop
   *
   * @param{String} nodeName
   */
  refreshMyDesktop: function (nodeName) {
    var me = this;
    var selPanel = me.getLeftContainer().getSelectionPanel();
    var treePanel = null;
    if (selPanel) {
      treePanel = selPanel.getTreePanel();
    }

    treePanel.setLoading(true);
    if (nodeName) {
      var oNode = me.myDesktop.findChild("text", nodeName);
      if (oNode) {
        oNode.collapse();
        Ext.defer(function () {
          oNode.expand();
          treePanel.setLoading(false);
        }, 1000); // wait a bit and after expand the tree.
      } else {
        me.__addDesktopToMenu(nodeName);
        treePanel.setLoading(false);
      }
    } else {
      me.myDesktop.collapse();
      Ext.defer(function () {
        me.myDesktop.expand();
        treePanel.setLoading(false);
      }, 1000);
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
  addDesktopStatesToDesktop: function (rootNode) {
    var me = this;
    if (rootNode.data.isShared) {
      me.__addSharedDesktopStatesToDesktop(rootNode);
    } else {
      me.__addUserDesktopStatesToDesktop(rootNode);
    }
  },
  __addUserDesktopStatesToDesktop: function (rootNode) {
    var me = this;
    var sStateName = rootNode.getData().text;
    var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", sStateName);
    switch (iStateLoaded) {
      case -1:
        GLOBAL.APP.CF.alert("The state " + sStateName + " does not exist !", "warning");
        return;
        break;
      case -2:
        me.funcPostponedLoading = function () {
          me.__addUserDesktopStatesToDesktop(rootNode);
        };
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
        var node = null;
        if (oDesktop.data[i].loadedObjectType == "link") {
          node = {
            text: oDesktop.data[i].text,
            expandable: false,
            application: oDesktop.data[i].link,
            type: "link",
            iconCls: "system_web_window",
            leaf: true,
          };
        } else {
          if (!oDesktop.data[i].module)
            // when the desktop contains wrong
            // data
            continue;
          var appName = oDesktop.data[i].module.split(".");
          var qtip = appName[appName.length - 1] + "<br>State Name: " + oDesktop.data[i].currentState;
          var nodeObj = {
            text: oDesktop.data[i].currentState,
            expandable: false,
            application: oDesktop.data[i].module,
            stateToLoad: oDesktop.data[i].currentState,
            desktop: sStateName,
            type: "app",
            leaf: true,
            iconCls: "core-application-icon",
            allowDrag: true,
            allowDrop: true,
            qtip: qtip,
          };

          if (!Ext.data.schema.Schema.instances.default.hasEntity("Ext.dirac.views.tabs.DesktopNodeModel")) {
            Ext.define("Ext.dirac.views.tabs.DesktopNodeModel", {
              extend: "Ext.data.Model",
              fields: ["text", "type", "application", "stateToLoad", "desktop"],
              alias: "widget.desktopnodemodel",
            });
            Ext.data.NodeInterface.decorate("Ext.dirac.views.tabs.DesktopNodeModel");
          } else {
            /* eslint-disable */
            var model = Ext.data.schema.Schema.instances.default.getEntity("Ext.dirac.views.tabs.DesktopNodeModel");
            /* eslint-enable */
            Ext.data.NodeInterface.decorate(model);
          }
          node = Ext.create("Ext.dirac.views.tabs.DesktopNodeModel", nodeObj);
        }

        rootNode.appendChild(node);
      } catch (err) {
        Ext.log(
          {
            level: "error",
          },
          "Failed to create child nodes!" + err
        );
        Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
      }
    }
  },
  __addSharedDesktopStatesToDesktop: function (rootNode) {
    var me = this;
    me.loadleftContainer.show();
    var sStateName = rootNode.getData().text;
    var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", sStateName);
    switch (iStateLoaded) {
      case -1:
        GLOBAL.APP.CF.alert("The state " + sStateName + " does not exist !", "warning");
        return;
        break;
      case -2:
        me.funcPostponedLoading = function () {
          me.__addUserDesktopStatesToDesktop(rootNode);
        };
        setTimeout(me.funcPostponedLoading, 1000);
        return;
        break;
    }

    var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", sStateName);

    var node = rootNode.firstChild;

    try {
      rootNode.appendChild(node);
    } catch (err) {
      console.log(err);
    }

    for (var i = 0; i < desktops.data.length; i++) {
      try {
        var node = null;
        if (desktops.data[i].loadedObjectType == "link") {
          node = {
            text: desktops.data[i].text,
            expandable: false,
            application: desktops.data[i].link,
            type: "link",
            iconCls: "system_web_window",
            leaf: true,
          };
        } else {
          var nodeObj = {
            text: desktops.data[i].currentState,
            expandable: false,
            application: desktops.data[i].name,
            stateToLoad: desktops.data[i].currentState,
            desktop: sStateName,
            type: "app",
            leaf: true,
            iconCls: "core-application-icon",
            allowDrag: true,
            allowDrop: true,
          };
          /* eslint-disable */
          if (!Ext.data.schema.Schema.instances.default.hasEntity("Ext.dirac.views.tabs.DesktopNodeModel")) {
            /* eslint-enable */
            Ext.define("Ext.dirac.views.tabs.DesktopNodeModel", {
              extend: "Ext.data.Model",
              fields: ["text", "type", "application", "stateToLoad", "desktop"],
              alias: "widget.desktopnodemodel",
            });
            Ext.data.NodeInterface.decorate("Ext.dirac.views.tabs.DesktopNodeModel");
          } else {
            /* eslint-disable */
            var model = Ext.data.schema.Schema.instances.default.getEntity("Ext.dirac.views.tabs.DesktopNodeModel");
            /* eslint-enable */
            Ext.data.NodeInterface.decorate(model);
          }
          node = Ext.create("Ext.dirac.views.tabs.DesktopNodeModel", nodeObj);
        }

        rootNode.appendChild(node);
      } catch (err) {
        Ext.log(
          {
            level: "error",
          },
          "Failed to create child nodes!" + err
        );
        Ext.dirac.system_info.msg("Error", '"Failed to create desktop!!!');
      }
    }
    me.loadleftContainer.hide();
  },
  /**
   * Function to refresh the state of the desktop working area in the URL
   */
  refreshUrlDesktopState: function () {
    var me = this;

    var sNewUrlState = "";

    var sThemeText = "Crisp";

    if (GLOBAL.WEB_THEME == "neptune") sThemeText = "Neptune";

    if (GLOBAL.WEB_THEME == "classic") sThemeText = "Classic";

    if (GLOBAL.WEB_THEME == "triton") sButtonThemeText = "Triton";

    if (GLOBAL.WEB_THEME == "gray") sButtonThemeText = "Gray";

    var url_prefix = "&url_state=1|";
    var sState_related_url = "";
    var default_State_url = "";

    if (me._default_desktop_state.length > 0) {
      default_State_url += "*" + me._default_desktop_state[0];
      for (var i = 1; i < me._default_desktop_state.length; i++) {
        default_State_url += "*" + me._default_desktop_state[i];
      }
    }

    if (me._state_related_url.length > 0) {
      sState_related_url += me._state_related_url[0];
      for (var i = 1; i < me._state_related_url.length; i++) {
        sState_related_url += "," + me._state_related_url[i];
      }
    }

    if (me.currentState != "") {
      var stateName = "";
      if (me.currentState != "Default") {
        stateName = me.currentState;
      } else {
        var applications = me.getActiveDesktop();
        var activeDesktop = applications.getActiveTab();
        if (!activeDesktop) {
          activeDesktop = applications.items.getAt(0); // we have only one
          // application in
          // the desktop
        }
        if (activeDesktop && activeDesktop.isLoaded) {
          var defaultDesktopStateName = activeDesktop.getUrlDescription();

          // if there is an active desktop state
          if (!Ext.Array.contains(me._default_desktop_state, defaultDesktopStateName)) {
            default_State_url += "*" + defaultDesktopStateName;

            me._default_desktop_state.push(defaultDesktopStateName);
          }
        } else {
          // If we have already opened application on the default desktop,
          // we must not add the default desktop to the url
          default_State_url += me._default_desktop_state.length < 1 ? "**," : "";
        }
      }

      // if there is an active desktop state
      if (stateName != "" && !Ext.Array.contains(me._state_related_url, stateName)) {
        if (me._state_related_url.length > 0) {
          sState_related_url += "," + stateName;
        } else {
          sState_related_url += stateName;
        }
        me._state_related_url.push(stateName);
      }
    }

    if (me._default_desktop_state.length > 0) {
      sNewUrlState = "?theme=" + sThemeText + url_prefix + default_State_url + "," + sState_related_url;
    } else {
      sNewUrlState = "?theme=" + sThemeText + url_prefix + default_State_url + sState_related_url;
    }

    var oHref = location.href;
    var oQPosition = oHref.indexOf("?");

    if (oQPosition != -1) {
      sNewUrlState = oHref.substr(0, oQPosition) + sNewUrlState;
    } else {
      sNewUrlState = oHref + sNewUrlState;
    }

    window.history.pushState("X", "ExtTop - Desktop Sample App", sNewUrlState);
  },

  loadSharedStateByName: function (sAppName, sStateName) {
    var me = this;

    var oData = GLOBAL.APP.SM.getStateData("reference", sAppName, sStateName);
    GLOBAL.APP.SM.oprLoadSharedState(oData["link"], me.cbAfterLoadSharedState, sStateName);
  },
  /*************************************************************************
   * @param{Object}oData It contains the information what is needed to open
   *                     an application. -objectType -moduleName -setupData
   */
  createNewModuleContainer: function (oData) {
    var me = this;

    me.createWindow(oData.objectType, oData.moduleName, oData.setupData);
  },
  cbAfterLoadSharedState: function (iCode, sLink, oDataReceived, stateName) {
    if (iCode != 1) {
      Ext.dirac.system_info.msg("Error Notification", sLink + " does not exists ");
      return;
    }
    var me = GLOBAL.APP.MAIN_VIEW;

    var oDataItems = sLink.split("|");

    if (oDataItems[0] != "desktop") {
      // this is an application

      var oSetupData = {
        data: oDataReceived,
        currentState: stateName,
      };

      me.createWindow("app", oDataItems[0], oSetupData);
    } else {
      // this is a desctop....

      var cbAfterCreate = function (name, tab) {
        for (var i = 0, len = oDataReceived["data"].length; i < len; i++) {
          var appStateData = oDataReceived["data"][i];
          var loadedObjectType = !appStateData.loadedObjectType ? "app" : appStateData.loadedObjectType; // TODO
          // We can remove it later.
          var name = appStateData.module;

          if (name) me.createWindow(loadedObjectType, name, appStateData);
        }

        tab.loadState(oDataReceived);

        var activeTab = null;
        if (oDataReceived.views.tabs) {
          activeTab = oDataReceived.views.tabs.activeTab;
        }
        if (activeTab) {
          if (tab.items.length < oDataReceived["data"].length) {
            me.__defferOpenApplication(activeTab, tab);
          } else {
            tab.items.each(function (win, value, length) {
              var name = win.setupData.name;
              if (!name) name = win.setupData.module;
              if (activeTab.currentState == win.currentState && activeTab.name == name) {
                tab.setActiveTab(win);
                return;
              }
              me.loadRightContainer.hide();
            });
          }
        } else {
          me.loadRightContainer.hide();
          if (tab.items.length == 0) {
            Ext.defer(function () {
              tab.setActiveTab(0);
            }, 100);
          } else {
            tab.setActiveTab(0);
          }
        }

        if (me.currentState != "") GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.currentState);

        me.currentState = stateName;
        GLOBAL.APP.SM.oprAddActiveState("desktop", me.currentState);
      };
      me.createDesktopTab(stateName, me.ID, cbAfterCreate);
    }
  },
  __defferOpenApplication: function (activeTab, tab) {
    var me = this;
    Ext.defer(function () {
      // wait until all application
      // window have created...
      me.__openApplication(activeTab, tab);
    }, 100);
  },
  __openApplication: function (activeTab, tab) {
    var me = this;
    me.loadRightContainer.show();
    if (tab.items.length == 0) {
      // no application is loaded
      me.__defferOpenApplication(activeTab, tab);
    } else {
      tab.items.each(function (win, value, length) {
        var name = win.setupData.name;
        if (!name) name = win.setupData.module;
        if (activeTab.currentState == win.currentState && activeTab.name == name) {
          tab.setActiveTab(win);
          return;
        }
        me.loadRightContainer.hide();
      });
    }
  },
  cbAfterSaveSharedState: function (iCode, sLinkName, sLink) {
    var me = GLOBAL.APP.MAIN_VIEW;

    var dataItems = sLink.split("|");
    if (dataItems[0] == "desktop") {
      me.addToSharedDesktop(sLinkName, "desktop");
    } else {
      me.addToSharedApplications(dataItems[0], sLinkName, "reference");
    }
  },
  oprLoadDesktopState: function (sStateName, tab) {
    var me = this;
    me.__loadDesktopStateData(sStateName, tab);
  },
  __loadDesktopStateData: function (sStateName, tab) {
    var me = this;

    var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", sStateName);
    var data = null;
    switch (iStateLoaded) {
      case 1:
        var state = GLOBAL.APP.SM.getStateData("application", "desktop", sStateName);
        data = Ext.Array.clone(state.data);
        break;
      case -1:
        return me.loadSharedStateByName("desktop", sStateName);
        break;
      case -2:
        me.funcPostponedLoading = function () {
          me.__loadDesktopStateData(sStateName, tab);
        };

        setTimeout(me.funcPostponedLoading, 1000);
        return;
        break;
    }

    // we have to remove the applications which are already loaded.
    if (tab) {
      var loadedApplications = tab.getApplicationsState();
      for (var i = 0; i < loadedApplications.length; i++) {
        for (var j = 0; j < data.length; j++) {
          if (
            loadedApplications[i].module == data[j].module &&
            loadedApplications[i].currentState == data[j].currentState &&
            loadedApplications[i].data == data[j].data
          ) {
            Ext.Array.erase(data, j, 1);
            break;
          }
        }
      }
    }

    if (data.length == 0) return;
    /* eslint-disable */
    var newState = Ext.Object.chain(state);
    /* eslint-enable */
    newState.data = data;
    me.loadState(newState, tab);

    if (me.currentState != "") GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.currentState); // OK

    me.currentState = sStateName;
    GLOBAL.APP.SM.oprAddActiveState("desktop", sStateName); // OK

    me.refreshUrlDesktopState();
  },

  /*************************************************************************
   * It creates a desktop for a given name
   */
  createNewDesktop: function () {
    var me = this;
    var cbfunc = function (name, tab) {
      tab.isLoaded = true;
      me.saveActiveDesktopState();
    };

    var afterSave = function (name) {
      me.createDesktopTab(name, me.ID, cbfunc);
      // add to the menu...
      me.__addDesktopToMenu(name);
      if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow) GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
    };
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
  moveDesktopmMnuItem: function (desktop, item) {
    var me = this;
    if (item && item.data.text != "Default") {
      // do not move the default
      // node

      var node = me.myDesktop.findChild("text", desktop);
      if (node) {
        node.expand();
        node.appendChild(item);
      }
    }
  },
  /*************************************************************************
   * it returns the active tab
   *
   * @return {Object}
   */
  getActiveDesktop: function () {
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

  addToDelete: function (appName, stateType, stateName) {
    var me = this;
    me.deleteApplications.push({
      module: appName,
      stateType: stateType,
      currentState: stateName,
    });
  },
  destroyDeleteApplications: function () {
    var me = this;
    var cbAfterRefresh = function () {
      return;
    };
    for (var i = 0; i < me.deleteApplications.length; i++) {
      GLOBAL.APP.SM.oprDeleteState(
        me.deleteApplications[i].module,
        me.deleteApplications[i].stateType,
        me.deleteApplications[i].currentState,
        cbAfterRefresh
      );
    }
  },
  /**
   * It adds a node to the Shared Desktops node. The name of the node is the
   * stateName.
   *
   * @param{String} stateName
   */
  addToDeafultDesktop: function (stateName, appClassName) {
    var me = this;
    me.myDesktop.expand();
    if (!me.defaultDesktop.loaded) {
      me.defaultDesktop.expand();
    } else {
      /* eslint-disable */
      if (!Ext.data.schema.Schema.instances.default.hasEntity("Ext.dirac.views.tabs.TreeNodeModel")) {
        /* eslint-enable */
        Ext.define("Ext.dirac.views.tabs.TreeNodeModel", {
          extend: "Ext.data.Model",
          fields: ["text", "type", "application", "stateToLoad", "desktop"],
          alias: "widget.treenodemodel",
        });
        Ext.data.NodeInterface.decorate("Ext.dirac.views.tabs.TreeNodeModel");
      } else {
        var model = Ext.data.schema.Schema.instances.default.getEntity("Ext.dirac.views.tabs.TreeNodeModel"); // returns the constructor MyApp.models.MyModel()
        Ext.data.NodeInterface.decorate(model);
      }

      var appName = appClassName.split(".");
      var qTip = "State Name: " + stateName + "<br>Application: " + appName[appName.length - 1] + "<br>";

      var nodeObj = {
        text: stateName,
        expandable: false,
        application: appClassName,
        stateToLoad: stateName,
        type: "app",
        leaf: true,
        iconCls: "core-application-icon",
        scope: me,
        allowDrag: true,
        allowDrop: true,
        qtip: qTip,
      };

      var newnode = Ext.create("Ext.dirac.views.tabs.TreeNodeModel", nodeObj);
      // n = node.createNode(nodeObj);
      me.defaultDesktop.appendChild(newnode);
    }
  },
  addApplicationToDesktopMenu: function (desktopName, stateName, appClassName) {
    var me = this;
    me.myDesktop.expand();
    if (desktopName == "Default" && !me.defaultDesktop.loaded) {
      me.defaultDesktop.doNotCreateDesktop = true;
      var cbFunc = function () {
        var node = me.defaultDesktop.findChild("text", stateName);
        if (node) {
          me.moveDesktopmMnuItem(desktopName, node);
        } else {
          me.funcPostponedLoading = function () {
            cbFunc();
          };

          setTimeout(me.funcPostponedLoading, 1000);
        }
      };
      me.defaultDesktop.expand(false, cbFunc);
    } else {
      if (!Ext.data.schema.Schema.instances.default.hasEntity("Ext.dirac.views.tabs.TreeNodeModel")) {
        Ext.define("Ext.dirac.views.tabs.TreeNodeModel", {
          extend: "Ext.data.Model",
          fields: ["text", "type", "application", "stateToLoad", "desktop"],
          alias: "widget.treenodemodel",
        });
        Ext.data.NodeInterface.decorate("Ext.dirac.views.tabs.TreeNodeModel");
      } else {
        /* eslint-disable */
        var model = Ext.data.schema.Schema.instances.default.getEntity("Ext.dirac.views.tabs.TreeNodeModel"); // returns the constructor MyApp.models.MyModel()
        /* eslint-enable */
        Ext.data.NodeInterface.decorate(model);
      }
      var appName = appClassName.split(".");
      var qTip = "State Name: " + stateName + "<br>Application: " + appName[appName.length - 1] + "<br>";

      var nodeObj = {
        text: stateName,
        expandable: false,
        application: appClassName,
        stateToLoad: stateName,
        desktop: desktopName,
        type: "app",
        leaf: true,
        iconCls: "core-application-icon",
        scope: me,
        allowDrag: true,
        allowDrop: true,
        qtip: qTip,
      };

      var newnode = Ext.create("Ext.dirac.views.tabs.TreeNodeModel", nodeObj);
      // n = node.createNode(nodeObj);
      var desktopNode = me.myDesktop.findChild("text", desktopName);
      desktopNode.expand();
      desktopNode.appendChild(newnode);
    }
  },
  removeNodeFormDefaultDesktop: function (appState) {
    var me = this;
    var node = me.defaultDesktop.findChild("text", appState);
    if (node) {
      me.defaultDesktop.removeChild(node);
    }
  },
  removeApplicationFromDesktop: function (desktopName, appName) {
    var me = this;
    var node = me.myDesktop.findChild("text", desktopName);
    if (node) {
      var deleteNode = node.findChild("text", appName);
      node.removeChild(deleteNode);
    }
  },
  moveApplication: function (applicationName, module, oldDesktopName, newDesktopName) {
    GLOBAL.APP.MAIN_VIEW.SM.moveAppState(applicationName, module, oldDesktopName, newDesktopName);
  },
  isTabOpen: function (desktopName, tabName) {
    var me = this;
    var desktops = null;
    var appContainer = me.getRightContainer().getApplicationContainer();
    if (appContainer) {
      if (!desktopName) {
        desktops = appContainer.getActiveTab();
      } else {
        desktops = appContainer.getTab(desktopName);
      }
      if (desktops) {
        // if the desktop is active
        var tab = desktops.getPanel(tabName);
        if (tab) {
          // if the windows is open.
          Ext.dirac.system_info.msg("Error", tabName + " is in use on the " + desktopName + ". Please close it before move");
          return true;
        }
      }
    }
    return false;
  },
  /**
   * It use to set the automatic tab change of the active desktop
   *
   * @param {Inteher}
   *          time it is the time in millisecond to wait before change the
   *          tab.
   * @param {function}
   *          cbFunction this is a callback function. The input parameter is
   *          the desktop name.
   */
  setTabChangePeriod: function (time, cbFunction) {
    var me = this;
    var appContainer = me.getRightContainer().getApplicationContainer();
    if (appContainer) {
      desktop = appContainer.getActiveTab();
      if (desktop) {
        desktop.setTabChangeTime(time);
        if (cbFunction) {
          cbFunction(desktop.title);
        }
      }
    }
  },
  openHelpWindow: function (app) {
    var me = this;
    if (app.appClassName == "link") {
      Ext.dirac.system_info.msg("Error", "You can not add help to an external link!");
    } else {
      var win = app.createChildWindow(app.title, false, 700, 500);
      Ext.apply(win, {
        type: "help",
        minimizable: false,
        application: app.loadedObject,
      });
      win.on("close", function () {
        var notepad = this.items.getAt(0);
        if (notepad) {
          var text = notepad.getStateData();
          this.application.setHelpText(text);
          Ext.Array.remove(app.childWindows, this);
        }
      });

      me.createHelpWindow("app", "DIRAC.Notepad.classes.Notepad", app.loadedObject.getHelpText(), win);
      win.show();
    }
  },

  createHelpWindow: function (loadedObjectType, moduleName, setupData, win) {
    var me = this;
    Ext.get("app-dirac-loading").show();

    var oParts = moduleName.split(".");
    var sStartClass = "";

    if (oParts.length == 2) sStartClass = moduleName + ".classes." + oParts[1];
    else sStartClass = moduleName;

    // if the development mod is off, we set up diffrent path to
    // load javascript
    if (GLOBAL.DEV == 0) {
      var oConfig = {
        enabled: true,
        paths: {},
      };

      oConfig["paths"][oParts[0] + "." + oParts[1] + ".classes"] = "static/" + oParts[0] + "/" + oParts[1] + "/build";

      Ext.Loader.setConfig(oConfig);
    }

    Ext.require(
      sStartClass,
      function () {
        var me = this;

        // creating an object of the demeanded application
        var instance = Ext.create(sStartClass, {
          renderTo: Ext.getBody(),
          layout: "fit",
          launcherElements: {
            title: "Module",
            applicationName: oParts[1],
            width: 0,
            height: 0,
            maximized: true,
            x: null,
            y: null,
          },
        });

        instance.loadState(setupData);
        win.add(instance);
        // initializing window
      },
      this
    );

    Ext.get("app-dirac-loading").hide();
  },
  closeApplication: function (desktopName, applicationName) {
    var me = this;

    var desktops = null;

    if (desktopName == "") {
      // it is the default desktop
      desktopName = "Default";
    }

    var appContainer = me.getRightContainer().getApplicationContainer();
    if (appContainer) {
      desktops = appContainer.getTab(desktopName);

      if (desktops) {
        // if the desktop is active
        var tab = desktops.getPanel(applicationName);
        if (tab) {
          tab.close();
        }
      }
    }
  },
  createDefaultDesktop: function () {
    var me = this;
    GLOBAL.APP.MAIN_VIEW.createDesktopTab("Default", me.view);
  },
});
/*
 * Welcome window
 */
Ext.create("Ext.dirac.utils.WelcomeWindow");
