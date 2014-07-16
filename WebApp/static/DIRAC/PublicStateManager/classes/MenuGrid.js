Ext.define('DIRAC.PublicStateManager.classes.MenuGrid', {
      extend : 'Ext.tree.Panel',

      requires : ['Ext.data.*', 'Ext.grid.*', 'Ext.tree.*',
          // 'Ext.ux.CheckColumn',
          'DIRAC.PublicStateManager.classes.MenuModel'],
      xtype : 'tree-grid',

      title : 'Desktops&Applications',
      height : 300,
      useArrows : true,
      rootVisible : false,
      multiSelect : true,
      singleExpand : true,

      initComponent : function() {
        this.width = 600;

        Ext.apply(this, {
              store : new Ext.data.TreeStore({
                    model : DIRAC.PublicStateManager.classes.MenuModel,
                    proxy : {
                      type : 'ajax',
                      url : GLOBAL.BASE_URL + 'UP/listPublicStates',
                      extraParams : {
                        app : 'desktop',
                        obj : 'application'
                      }
                    },
                    folderSort : true
                  }),
              columns : [{
                    xtype : 'treecolumn', // this is so we know which column
                                          // will
                    // show the tree
                    text : 'Name',
                    flex : 2,
                    sortable : true,
                    dataIndex : 'name'
                  }, {
                    // we must use the templateheader component so we can use a
                    // custom tpl
                    xtype : 'templatecolumn',
                    text : 'Type',
                    flex : 1,
                    sortable : true,
                    dataIndex : 'type',
                    align : 'center',
                    // add in the custom tpl for the rows
                    tpl : Ext.create('Ext.XTemplate', '{type:this.formatApplicationType}', {
                          formatApplicationType : function(v) {
                            if (v == 'desktop') {
                              return ' <font color="#00CC00">' + v + '</font>';
                            } else {
                              return ' <font color="#FF3300">' + v + '</font>';
                            }
                          }
                        })
                  }, {
                    text : 'UserName',
                    flex : 1,
                    dataIndex : 'user',
                    sortable : true
                  }, {
                    text : 'Group',
                    flex : 1,
                    dataIndex : 'group',
                    sortable : true
                  }, {
                    text : 'VO',
                    flex : 1,
                    dataIndex : 'vo',
                    sortable : true
                  }, {
                    text : 'Load',
                    width : 55,
                    menuDisabled : true,
                    xtype : 'actioncolumn',
                    tooltip : 'Edit task',
                    align : 'center',
                    iconCls : 'dirac-icon-plus',
                    handler : function(grid, rowIndex, colIndex, actionItem, event, record, row) {
                      Ext.Msg.alert('Loading: ' + record.get('name'), record.get('app'));
                    },
                    // Only leaf level tasks may be edited
                    isDisabled : function(view, rowIdx, colIdx, item, record) {
                      return !record.data.leaf;
                    }
                  }, {
                    text : 'Module',
                    flex : 1,
                    dataIndex : 'app',
                    sortable : true,
                    hidden : true
                  }]
            });
        this.callParent();
      }
    });