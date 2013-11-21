/**
 * to be described
 */
Ext.define('Ext.dirac.views.tabs.SelPanel',{
  extend : 'Ext.panel.Panel',
  requies : ['Ext.dirac.views.tabs.ContextMenu','Ext.dirac.views.tabs.TreeMenuModel','Ext.tree.plugin.TreeViewDragDrop','Ext.dirac.views.tabs.SettingsPanel','Ext.LoadMask', 'Ext.dirac.views.tabs.StateManagerMenu'],
  xtype: 'menuselpanel',
  alias : 'widget.selPanel',
  /**
   * @property {Ext.tree.Panel} tree it stores the reference to the
   *           menu.
   */
  tree : null,
  settings : null,
  layout : {
    type : 'accordion',
    animate : true
  },
  split : true,
  initComponent : function() {
    Ext.apply(this, {
      items : [ this.createView(), this.createSettingsView() ],
    });

    this.callParent(arguments);
  },
  /**
   * It returns the tree panel.
   *
   * @return{Ext.tree.panel}
   */
  getTreePanel : function() {
    return this.tree;
  },
  /**
   * Create the DataView to be used for the menu.
   *
   * @private
   * @return {Ext.view.View}
   */
  createView : function() {
    var me = this;

    var store = Ext.create('Ext.data.TreeStore',{
      root : me.treeModel,
      scope: me,
      listeners : {
        beforeexpand : function(node, op) {
          this.loadMask = new Ext.LoadMask(node, {
            msg : "Loading ..."
          });
          if (node.data.type == "desktop"){
            if (node.data.application != 'Default'){ //trick: When the Default node expanded we should not modify it.
              //Because the Default is the menu and it is created previously.
              //<debug>
              Ext.log({level:'log',stack:true }, "Begin method(desktop)!");
              //</debug>

              GLOBAL.APP.MAIN_VIEW.createDesktopTab(node.data.application, node.data.view); //an empty tab is created
              //the application states must be listed.
              me.removeChildNodes(node); //it is used to refresh the tree. may new applications opened and saved.
              GLOBAL.APP.MAIN_VIEW.addDesktopStatesToDesktop(node);
              //<debug>
              Ext.log({level:'log',stack:true},"End method(desktop)!");
              //</debug>
            }
          } else if (node.data.application != "") {

            if (!GLOBAL.STATE_MANAGEMENT_ENABLED)
              return;

            var oParts = node.data.application.split(".");
            var sStartClass = "";
            if (oParts.length == 2){
              sStartClass = node.data.application + ".classes." + oParts[1];
            }else{
              sStartClass = node.data.application;
            }
            //<debug>
            Ext.log({level:'log',stack:true }, "Begin method(application)!");
            Ext.log({level:'log'},this.self.getName());
            Ext.log({level:'log'},me.self.getName());
            //</debug>

            me.removeChildNodes(node);

            var iAppStatesLoaded = GLOBAL.APP.SM.isStateLoaded("application", sStartClass, "|");// OK

            if (iAppStatesLoaded != -2) {
              me.oprRefreshAppStates(sStartClass, node);
            } else {
              var oFunc = function(iCode, sAppName) {

                me.oprRefreshAppStates(sStartClass, node);

              };

              GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(sStartClass, oFunc);// OK

            }

            //<debug>
            Ext.log({level:'log',stack:true }, "End method(application)!");
            //</debug>


          }

        },
        beforemove:function( node, oldParent, newParent, index, eOpts ){
          if (index == 0){
            alert('Please move the node after Default/All!');
            return false;
          }
        },
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
      //renderTo : Ext.getBody(),
      draggable : true,
      width : 200,
      height : 250,
      tools:[{
        type:'save',
        tooltip: 'Manage states!',
        // hidden:true,
        handler: function(event, toolEl, panelHeader) {
          var menu = Ext.create('Ext.dirac.views.tabs.StateManagerMenu');
          menu.showBy(toolEl);
        }
      }],
      viewConfig : {
        listeners : {

        },
        enableDD : true,
        plugins : {
          ptype : 'treeviewdragdrop'
        }
      },
      listeners : {
        itemclick : function(record, item, index, e, eOpts) {

          if (item.data.type == "layout") {

            var afterTabCreated = function(name, tab){
              GLOBAL.APP.MAIN_VIEW.loadDesktopStateData(name, tab);
            };

            GLOBAL.APP.MAIN_VIEW.createDesktopTab(item.data.application, item.data.view, afterTabCreated);

          } else {
            var activeDesktop = null;
            var rCont = GLOBAL.APP.MAIN_VIEW.getRightContainer();
            var mainPanel = rCont.getApplicationContainer();
            var activeDesktop = mainPanel.getActiveTab();
            var cbSetActiveTab = null;
            if (activeDesktop) {
              cbSetActiveTab = function(oTab){
                activeDesktop.setActiveTab(oTab);
                //oTab.loadData();
              }
            }
            GLOBAL.APP.MAIN_VIEW.createWindow(item.data.type,
                item.data.application, item.data, activeDesktop, cbSetActiveTab);
          }
        },
        beforeitemmove : function( node, oldParent, newParent, index, eOpts ){
          if (oldParent.getData().text!=newParent.getData().text){
            tabName = node.getData().text;
            if (oldParent.getData().type == 'desktop'){
              desktopName = oldParent.getData().text;
            }else{
              desktopName = 'Default';
            }
            GLOBAL.APP.MAIN_VIEW.closeTab(desktopName, tabName);

          }
        }
      }
    });
    me.contextMenu =  Ext.create('Ext.dirac.views.tabs.ContextMenu');
    me.tree.on('itemcontextmenu', function(view, record, item, index, event){
      var me = this;
      me.contextMenu.oSelectedMenuItem = record;

      if (record.data.type == 'desktop'){
        me.contextMenu.enableMenuItem(0);
        me.contextMenu.enableMenuItem(1);
        me.contextMenu.enableMenuItem(2);
        me.contextMenu.enableMenuItem(3);
      }else{
        me.contextMenu.disableMenuItem(0);
        me.contextMenu.disableMenuItem(1);
        me.contextMenu.disableMenuItem(2);
        me.contextMenu.disableMenuItem(3);
      }
      me.contextMenu.showAt(event.getX(), event.getY());
      event.preventDefault();
    },me);
    return me.tree;
  },
  /**
   * It removes all the nodes except the first node.
   * @private
   * @property {Ext.dirac.views.tabs.TreeMenuModel} node the node object
   */
  removeChildNodes : function(node){
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
  /***
   * It lists the application state. Each state is a node of the application tree.
   * @param{String}appClassName is the class name of the application.
   * @param{Object} node is the current tree node. The states of an application will be loaded under that node...
   */
  oprRefreshAppStates : function(appClassName, node){
    var me = this;
    var oStates = GLOBAL.APP.SM.getApplicationStates("application", appClassName);// OK

    for ( var i = 0, len = oStates.length; i < len; i++) {

      var stateName = oStates[i];

      try{
        Ext.define('Ext.dirac.views.tabs.TreeNodeModel', {
          extend : 'Ext.data.Model',
          fields : [ 'text', 'type', 'application', 'stateToLoad','desktop' ],
          alias : 'widget.treenodemodel'
        });
        nodeObj = {
            'text' : stateName,
            expandable : false,
            application : appClassName,
            stateToLoad : stateName,
            type : 'app',
            leaf : true,
            iconCls : 'icon-state-applications-class',
            scope:me,
            allowDrag : true,
            allowDrop : true
        };
        Ext.data.NodeInterface.decorate('Ext.dirac.views.tabs.TreeNodeModel');
        //var model = Ext.ModelManager.getModel('Ext.dirac.views.tabs.TreeMenuModel');
        //Ext.data.NodeInterface.decorate(model);
        var newnode = Ext.ModelManager.create(nodeObj, 'Ext.dirac.views.tabs.TreeNodeModel');
        //n = node.createNode(nodeObj);
        node.appendChild(newnode);

      }catch(err){
        Ext.log({level:'error'}, "Failed to create child nodes!"+err);
        Ext.dirac.system_info.msg("Error",'"Failed to create child nodes!!!');
      }

    }
  }

});
