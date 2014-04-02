/**
 * to be described
 */
Ext.define('Ext.dirac.views.tabs.SelPanel', {
      extend : 'Ext.panel.Panel',
      requies : ['Ext.dirac.views.tabs.ContextMenu', 'Ext.dirac.views.tabs.TreeMenuModel', 'Ext.tree.plugin.TreeViewDragDrop', 'Ext.dirac.views.tabs.SettingsPanel', 'Ext.LoadMask', 'Ext.dirac.views.tabs.StateManagerMenu'],
      xtype : 'menuselpanel',
      alias : 'widget.selPanel',
      /**
       * @property {Ext.tree.Panel} tree it stores the reference to the menu.
       */
      tree : null,
      settings : null,
      layout : {
        type : 'accordion',
        animate : true
      },
      split : true,
      initComponent : function() {
        var me = this;
        me.loadMask = new Ext.LoadMask(me, {
              msg : "Loading menu..."
            });
        Ext.apply(me, {
              items : [me.createView(), me.createSettingsView()]
            });
        me.callParent(arguments);
      },
      /**
       * It returns the tree panel.
       * 
       * @return{Ext.tree.panel}
       */
      getTreePanel : function() {
        var me = this;
        return me.tree;
      },
      /**
       * Create the DataView to be used for the menu.
       * 
       * @private
       * @return {Ext.view.View}
       */
      createView : function() {
        var me = this;

        var store = Ext.create('Ext.data.TreeStore', {
              root : me.treeModel,
              scope : me,
              listeners : {
                beforeexpand : function(node, op) {
                  /*
                   * this.loadMask = new Ext.LoadMask(node, { msg : "Loading
                   * ..." });
                   */
                  if (node.data.type == "desktop") {
                    if (node.data.application != 'Default') { // trick: When the
                      // Default node expanded we should not modify it.

                      GLOBAL.APP.MAIN_VIEW.createDesktopTab(node.data.application, node.data.view); // an
                      // empty tab is created the application states must be
                      // listed.
                      me.removeChildNodes(node); // it is used to refresh the
                      // tree. may new applications opened and saved.
                      GLOBAL.APP.MAIN_VIEW.addDesktopStatesToDesktop(node);

                    }
                  } else if (node.data.type == 'Default') { // it is the default
                    // desktop
                    if (!GLOBAL.STATE_MANAGEMENT_ENABLED)
                      return;
                    var node = GLOBAL.APP.MAIN_VIEW.defaultDesktop;
                    me.removeChildNodes(node);
                    me.tree.setLoading(true);
                    var applications = GLOBAL.APP.MAIN_VIEW.applications;
                    for (var i = 0; i < applications.length; i++) {

                      var oFunc = function(iCode, sAppName) {

                        me.oprRefreshAppStates(sAppName, node);
                        me.tree.setLoading(false);

                      };

                      GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(applications[i], oFunc);// OK

                    }

                  }
                },
                beforemove : function(node, oldParent, newParent, index, eOpts) {
                  if (index == 0) {
                    alert('Please move the node after Default/All!');
                    return false;
                  }
                }
              }
            });

        me.tree = Ext.create('Ext.tree.Panel', {
              title : 'Desktops&Applications',
              split : true,
              store : store,
              scope : me,
              rootVisible : false,
              useArrows : true,
              frame : false,
              draggable : true,
              width : 200,
              height : 250,
              tools : [{
                    type : 'save',
                    tooltip : 'Manage states!',
                    // hidden:true,
                    handler : function(event, toolEl, panelHeader) {
                      var menu = Ext.create('Ext.dirac.views.tabs.StateManagerMenu');
                      menu.showBy(toolEl);
                    }
                  }],
              viewConfig : {
                listeners : {

        }       ,
                enableDD : true,
                plugins : {
                  ptype : 'treeviewdragdrop'
                }
              },
              listeners : {
                itemclick : function(record, item, index, e, eOpts) {

                  if (item.data.type == "tabView") {
                    if (item.data.isShared == true) {
                      GLOBAL.APP.MAIN_VIEW.loadSharedStateByName("desktop", item.data.application);
                    } else {
                      GLOBAL.APP.MAIN_VIEW.oprLoadDesktopState(item.data.application);
                    }

                  } else {
                    var activeDesktop = null;
                    var rCont = GLOBAL.APP.MAIN_VIEW.getRightContainer();
                    var mainPanel = rCont.getApplicationContainer();
                    var activeDesktop = mainPanel.getActiveTab();
                    var cbSetActiveTab = null;
                    if (activeDesktop) {
                      cbSetActiveTab = function(oTab) {
                        if (activeDesktop.view == 'tabView') {
                          activeDesktop.setActiveTab(oTab);
                        }
                      };
                    } else {
                      cbSetActiveTab = function(oTab) {
                        oTab.loadData();
                      };
                    }
                    GLOBAL.APP.MAIN_VIEW.createWindow(item.data.type, item.data.application, item.data, activeDesktop, cbSetActiveTab);
                  }
                },
                beforeitemmove : function(node, oldParent, newParent, index, eOpts) {
                  if (oldParent.getData().text != newParent.getData().text) {
                    tabName = node.getData().text;
                    if (oldParent.getData().type == 'desktop') {
                      desktopName = oldParent.getData().text;
                    } else {
                      desktopName = 'Default';
                    }
                    GLOBAL.APP.MAIN_VIEW.closeTab(desktopName, tabName);

                  }
                }
              }
            });
        me.contextMenu = Ext.create('Ext.dirac.views.tabs.ContextMenu');
        me.tree.on('itemcontextmenu', function(view, record, item, index, event) {
              var me = this;
              me.contextMenu.oSelectedMenuItem = record;

              if (record.data.type == 'desktop') {
                me.contextMenu.enableMenuItem(0);
                me.contextMenu.enableMenuItem(1);
                me.contextMenu.enableMenuItem(2);
                me.contextMenu.enableMenuItem(3);
              } else {
                me.contextMenu.disableMenuItem(0);
                me.contextMenu.disableMenuItem(1);
                me.contextMenu.disableMenuItem(2);
                me.contextMenu.disableMenuItem(3);
              }
              me.contextMenu.showAt(event.getX(), event.getY());
              event.preventDefault();
            }, me);
        return me.tree;
      },
      /**
       * It removes all the nodes except the first node.
       * 
       * @private
       * @property {Ext.dirac.views.tabs.TreeMenuModel} node the node object
       */
      removeChildNodes : function(node) {
        if (node.childNodes.length > 1) {
          var defaultNode = node.firstChild;
          node.removeAll();
          node.appendChild(defaultNode);
        }
      },
      createSettingsView : function() {
        var me = this;
        me.settings = Ext.create('Ext.dirac.views.tabs.SettingsPanel');
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
      oprRefreshAppStates : function(appClassName, node) {
        var me = this;
        var oStates = GLOBAL.APP.SM.getApplicationStates("application", appClassName);// OK

        for (var i = 0, len = oStates.length; i < len; i++) {

          var stateName = oStates[i];

          try {
            Ext.define('Ext.dirac.views.tabs.TreeNodeModel', {
                  extend : 'Ext.data.Model',
                  fields : ['text', 'type', 'application', 'stateToLoad', 'desktop'],
                  alias : 'widget.treenodemodel'
                });
            var application = appClassName.split(".");
            var qTip = "State Name: " + stateName + "<br>Application: " + application[application.length - 1] + "<br>";
            console.log(qTip);
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
            node.appendChild(newnode);

          } catch (err) {
            Ext.log({
                  level : 'error'
                }, "Failed to create child nodes!" + err);
            Ext.dirac.system_info.msg("Error", '"Failed to create child nodes!!!');
          }

        }
      }

    });
