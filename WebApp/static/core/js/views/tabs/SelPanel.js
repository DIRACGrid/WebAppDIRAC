/**
 * to be described
 */
Ext.define("Ext.dirac.views.tabs.SelPanel", {
  extend: "Ext.panel.Panel",
  requires: [
    "Ext.dirac.views.tabs.ContextMenu",
    "Ext.dirac.views.tabs.TreeMenuModel",
    "Ext.tree.plugin.TreeViewDragDrop",
    "Ext.dirac.views.tabs.SettingsPanel",
    "Ext.LoadMask",
    "Ext.dirac.views.tabs.StateManagerMenu",
  ],
  xtype: "menuselpanel",
  alias: "widget.selPanel",
  /**
   * @property {Ext.tree.Panel} tree it stores the reference to the menu.
   */
  tree: null,
  settings: null,
  layout: {
    type: "accordion",
    animate: true,
  },
  split: true,
  initComponent: function () {
    var me = this;
    me.loadMask = new Ext.LoadMask({
      target: me,
      msg: "Loading menu...",
    });
    Ext.apply(me, {
      items: [me.createView(), me.createSettingsView()],
    });
    me.callParent(arguments);
  },
  /**
   * It returns the tree panel.
   *
   * @return{Ext.tree.panel}
   */
  getTreePanel: function () {
    var me = this;
    return me.tree;
  },
  /**
   * Create the DataView to be used for the menu.
   *
   * @private
   * @return {Ext.view.View}
   */
  createView: function () {
    var me = this;

    var store = Ext.create("Ext.data.TreeStore", {
      root: me.treeModel,
      scope: me,
      listeners: {
        nodebeforeexpand: function (node, op) {
          if (node.get("text") == "Shared") {
            GLOBAL.APP.MAIN_VIEW.oprLoadSharedDesktopsAndApplications();
            return;
          }
          /*
           * this.loadMask = new Ext.LoadMask({target: node, msg : "Loading
           * ..." });
           */
          var activeDesktop = GLOBAL.APP.MAIN_VIEW.getActiveDesktop(); // do
          // not refresh the tree node if we
          // have an active tab open

          var forceLoad = activeDesktop && node.childNodes.length - 1 != activeDesktop.items.length;
          // we load the states when the number of applications in the
          // desktop is not equal
          // to the applications which are in the menu...

          if (!forceLoad && activeDesktop && activeDesktop.title == node.get("text") && node.get("text") != "Default") return;

          if (node.loaded && node.get("text") == "Default") return;

          if (node.get("type") == "desktop") {
            if (node.get("application") != "Default") {
              // trick: When the
              // Default node expanded we should not modify it.
              me.removeChildNodes(node); // it is used to refresh the
              // tree. may new applications opened and saved.
              GLOBAL.APP.MAIN_VIEW.addDesktopStatesToDesktop(node);
            }
          } else if (node.get("type") == "Default") {
            // it is the default
            // desktop
            if (!GLOBAL.STATE_MANAGEMENT_ENABLED) return;

            // we have to create a default desktop.
            var desktop = {
              views: {},
              data: [],
            };

            var view = GLOBAL.APP.MAIN_VIEW.ID;
            desktop.views[GLOBAL.APP.MAIN_VIEW.ID] = {};
            GLOBAL.APP.SM.createDesktop("desktop", "Default", desktop);

            var node = GLOBAL.APP.MAIN_VIEW.defaultDesktop;
            me.removeChildNodes(node);
            me.tree.setLoading(true);
            var applications = GLOBAL.APP.MAIN_VIEW.applications;
            for (var i = 0; i < applications.length; i++) {
              var oFunc = function (iCode, sAppName) {
                me.oprRefreshAppStates(sAppName, node);
                me.tree.setLoading(false);
              };

              GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(applications[i], oFunc); // OK
            }
          } else {
            // we have to check there is a state of the app
            if (!GLOBAL.STATE_MANAGEMENT_ENABLED) return;

            var app = node.get("application");
            if (!app) {
              app = "";
            }

            var oParts = app.split(".");
            var sStartClass = "";
            if (oParts.length == 2) {
              sStartClass = node.get("application") + ".classes." + oParts[1];
            } else {
              sStartClass = node.get("application");
            }

            var oFunc = function () {
              return;
            };

            if (sStartClass != "") {
              GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(sStartClass, oFunc); // OK
            }
          }
          node.loaded = true;
        },
        beforemove: function (node, oldParent, newParent, index, eOpts) {
          if (index == 0) {
            alert("Please move the node after Default/All!");
            return false;
          }
        },
      },
    });

    me.tree = Ext.create("Ext.tree.Panel", {
      title: "Desktops&Applications",
      split: true,
      store: store,
      scope: me,
      rootVisible: false,
      useArrows: true,
      frame: false,
      draggable: true,
      width: 200,
      height: 250,
      tools: [
        {
          type: "save",
          tooltip: "Manage states!",
          // hidden:true,
          handler: function (event, toolEl, panelHeader) {
            var menu = Ext.create("Ext.dirac.views.tabs.StateManagerMenu");
            menu.showBy(toolEl);
          },
        },
      ],
      viewConfig: {
        listeners: {},
        enableDD: true,
        plugins: {
          ptype: "treeviewdragdrop",
        },
      },
      listeners: {
        itemclick: function (record, item, index, e, eOpts) {
          if (
            item.get("expandable") ||
            item.get("type") == "Default" ||
            (item.get("text") == "All" && item.get("application") == "Default" && item.parentNode.childNodes.length < 2)
          ) {
            return;
          }

          if (item.data.type == "link") {
            var cbSetActiveTab = function (oTab) {
              if (activeDesktop.view == "tabView") {
                activeDesktop.setActiveTab(oTab);
              }
            };
            var activeDesktop = GLOBAL.APP.MAIN_VIEW.getRightContainer().getTabFromApplicationContainer("Default");
            if (activeDesktop == null) {
              GLOBAL.APP.MAIN_VIEW.createDesktopTab("Default", item.get("view"));
              activeDesktop = GLOBAL.APP.MAIN_VIEW.getRightContainer().getTabFromApplicationContainer("Default");
            }
            GLOBAL.APP.MAIN_VIEW.createWindow(item.get("type"), item.get("application"), item.getData(), activeDesktop, cbSetActiveTab);
          } else if (item.get("type") == "tabView" || item.get("type") == "presenterView") {
            if (item.get("isShared") == true) {
              if (item.get("stateType") == "desktop") {
                // the desktop is a shared desktop

                var activeDesktop = GLOBAL.APP.MAIN_VIEW.getRightContainer().getTabFromApplicationContainer(item.get("stateToLoad"));
                if (activeDesktop == null) {
                  GLOBAL.APP.MAIN_VIEW._state_related_url.push(item.get("stateToLoad"));
                  GLOBAL.APP.MAIN_VIEW.createDesktopTab(item.get("stateToLoad"), item.get("view"));
                  GLOBAL.APP.MAIN_VIEW.loadSharedStateByName(item.get("application"), item.get("stateToLoad"));
                } else {
                  GLOBAL.APP.MAIN_VIEW.getRightContainer().setActiveTab(activeDesktop);
                }
              } else {
                // it is an application and it is loaded to Default
                // desktop...
                var stateUrl = item.get("application") + ":" + item.get("stateToLoad");
                if (!Ext.Array.contains(GLOBAL.APP.MAIN_VIEW._default_desktop_state, stateUrl)) {
                  GLOBAL.APP.MAIN_VIEW._default_desktop_state.push(stateUrl);
                }
                var activeDesktop = GLOBAL.APP.MAIN_VIEW.getRightContainer().getTabFromApplicationContainer("Default");
                if (activeDesktop == null) {
                  GLOBAL.APP.MAIN_VIEW.createDesktopTab("Default", item.get("view"));
                  activeDesktop = GLOBAL.APP.MAIN_VIEW.getRightContainer().getTabFromApplicationContainer("Default");
                }
                GLOBAL.APP.MAIN_VIEW.getRightContainer().setActiveTab(activeDesktop);
                var applicationTab = activeDesktop.getApplicationTab(item.get("application"), item.get("stateToLoad"));
                if (applicationTab) {
                  // the application already exists
                  activeDesktop.setActiveTab(applicationTab);
                } else {
                  // we have to load the application
                  GLOBAL.APP.MAIN_VIEW.loadSharedStateByName(item.get("application"), item.get("stateToLoad"));
                }
              }

              GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();
            } else {
              var parentNodeName = item.get("text") == "Default" ? "Default" : item.parentNode.get("text");
              var activeDesktop = GLOBAL.APP.MAIN_VIEW.getRightContainer().getTabFromApplicationContainer(parentNodeName);
              if (activeDesktop == null) {
                GLOBAL.APP.MAIN_VIEW.createDesktopTab(item.get("application"), item.get("view"));
              }
              if (activeDesktop == null || item.get("text") == "All") {
                GLOBAL.APP.MAIN_VIEW.oprLoadDesktopState(item.get("application"), activeDesktop);
              }
              GLOBAL.APP.MAIN_VIEW.getRightContainer().setActiveTab(activeDesktop);
            }
          } else {
            // check the existence of teh desktops

            var activeDesktop = null;
            // we have to get the parent node.
            if (item.get("desktop") == "Default") {
              activeDesktop = GLOBAL.APP.MAIN_VIEW.getActiveDesktop();
            } else {
              parentNodeName = item.parentNode.get("text");

              // we have to know the type of the desktop: presenterView or
              // tabView
              var view = item.parentNode.get("view");
              activeDesktop = GLOBAL.APP.MAIN_VIEW.getRightContainer().getTabFromApplicationContainer(parentNodeName);
            }

            if (activeDesktop) {
              GLOBAL.APP.MAIN_VIEW.getRightContainer().setActiveTab(activeDesktop);
              var panel = activeDesktop.getPanel(item.get("stateToLoad"));
              if (panel) {
                // we have to activate the panel
                activeDesktop.setActiveTab(panel);
              } else {
                var cbSetActiveTab = function (oTab) {
                  if (activeDesktop.view == "tabView") {
                    activeDesktop.setActiveTab(oTab);
                  }
                };

                GLOBAL.APP.MAIN_VIEW.createWindow(item.get("type"), item.get("application"), item.getData(), activeDesktop, cbSetActiveTab);
              }
            } else {
              // we have to know the type of the desktop: presenterView
              // or tabView
              var view = item.parentNode.get("view");

              // When the application is in the Default desktop then the
              // desktop variable is empty.
              // We have to use the name of the parent node...
              var desktopName = item.get("desktop");
              if (item.get("desktop") == "") {
                desktopName = item.get("text") == "Default" ? "Default" : item.parentNode.get("text");
              }
              GLOBAL.APP.MAIN_VIEW.createDesktopTab(desktopName, view);
              var cbLoadActiveTab = function (oTab) {
                oTab.loadData();
              };
              GLOBAL.APP.MAIN_VIEW.createWindow(item.get("type"), item.get("application"), item.getData(), activeDesktop, cbLoadActiveTab);
            }
          }
        },
        beforeitemmove: function (node, oldParent, newParent, index, eOpts) {
          if (oldParent.get("text") != newParent.get("text")) {
            var tabName = node.get("text");
            var moduleName = node.get("application");
            var oldDesktopName = "Default";
            var newDesktopName = "Default";

            if (oldParent.get("type") == "desktop") {
              oldDesktopName = oldParent.get("text");
            }

            if (newParent.get("type") == "desktop") {
              newDesktopName = newParent.get("text");
            }

            // we have to close the application
            if (!GLOBAL.APP.MAIN_VIEW.isTabOpen(oldDesktopName, tabName)) {
              GLOBAL.APP.MAIN_VIEW.moveApplication(tabName, moduleName, oldDesktopName, newDesktopName);
            } else {
              return false;
            }
          }
        },
      },
    });

    me.contextMenu = Ext.create("Ext.dirac.views.tabs.ContextMenu", {});

    me.tree.on(
      "itemcontextmenu",
      function (view, record, item, index, event) {
        var me = this;
        me.contextMenu.oSelectedMenuItem = record;

        if (record.get("type") == "desktop") {
          me.contextMenu.enableMenuItem(0);
          me.contextMenu.disableMenuItem(1);
          me.contextMenu.enableMenuItem(2);
          me.contextMenu.enableMenuItem(3);
          me.contextMenu.enableMenuItem(4);
        } else {
          me.contextMenu.disableMenuItem(0);
          me.contextMenu.enableMenuItem(1);
          me.contextMenu.enableMenuItem(2);
          me.contextMenu.disableMenuItem(3);
          me.contextMenu.disableMenuItem(4);
        }
        if (record.get("isShared")) {
          me.contextMenu.disableMenuItem(0);
          me.contextMenu.disableMenuItem(1);
          me.contextMenu.disableMenuItem(2);
          me.contextMenu.disableMenuItem(5);
          me.contextMenu.disableMenuItem(6);
          me.contextMenu.disableMenuItem(7);
        } else {
          me.contextMenu.enableMenuItem(5);
          me.contextMenu.enableMenuItem(6);
          me.contextMenu.enableMenuItem(7);
        }
        me.contextMenu.showAt(event.getX(), event.getY());
        event.preventDefault();
      },
      me
    );
    return me.tree;
  },
  /**
   * It removes all the nodes except the first node.
   *
   * @private
   * @property {Ext.dirac.views.tabs.TreeMenuModel} node the node object
   */
  removeChildNodes: function (node) {
    if (node.childNodes.length > 1) {
      var defaultNode = node.firstChild;
      node.removeAll();
      node.appendChild(defaultNode);
    }
  },
  createSettingsView: function () {
    var me = this;
    me.settings = Ext.create("Ext.dirac.views.tabs.SettingsPanel");
    return me.settings;
  },
  getSettimgsPanel: function () {
    var me = this;
    return me.settings;
  },
  /*************************************************************************
   * It lists the application state. Each state is a node of the application
   * tree.
   *
   * @param{String}appClassName is the class name of the application.
   * @param{Object} node is the current tree node. The states of an
   *                application will be loaded under that node...
   */
  oprRefreshAppStates: function (appClassName, node) {
    var me = this;
    var oStates = GLOBAL.APP.SM.getApplicationStates("application", appClassName); // OK

    for (var i = 0, len = oStates.length; i < len; i++) {
      var stateName = oStates[i];

      var data = {
        data: GLOBAL.APP.SM.getStateData("application", appClassName, stateName),
        currentState: stateName,
        module: appClassName,
      };

      GLOBAL.APP.SM.addApplicationStates("desktop", "Default", data);
      try {
        var application = appClassName.split(".");
        var qTip = "State Name: " + stateName + "<br>Application: " + application[application.length - 1] + "<br>";

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

        if (!Ext.data.schema.Schema.instances.default.hasEntity("Ext.dirac.views.tabs.TreeNodeModel")) {
          Ext.define("Ext.dirac.views.tabs.TreeNodeModel", {
            extend: "Ext.data.Model",
            fields: ["text", "type", "application", "stateToLoad", "desktop"],
            alias: "widget.treenodemodel",
          });
          Ext.data.NodeInterface.decorate("Ext.dirac.views.tabs.TreeNodeModel");
        } else {
          var model = Ext.data.schema.Schema.instances.default.getEntity("Ext.dirac.views.tabs.TreeNodeModel");
          Ext.data.NodeInterface.decorate(model);
        }

        var newnode = Ext.create("Ext.dirac.views.tabs.TreeNodeModel", nodeObj);
        // n = node.createNode(nodeObj);
        node.appendChild(newnode);
      } catch (err) {
        Ext.log(
          {
            level: "error",
          },
          "Failed to create child nodes!" + err
        );
        Ext.dirac.system_info.msg("Error", '"Failed to create child nodes!!!');
      }
    }
  },
});
