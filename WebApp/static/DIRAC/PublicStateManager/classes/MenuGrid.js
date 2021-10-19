Ext.define("DIRAC.PublicStateManager.classes.MenuGrid", {
  extend: "Ext.tree.Panel",

  requires: [
    "Ext.data.*",
    "Ext.grid.*",
    "Ext.tree.*",
    // 'Ext.ux.CheckColumn',
    "DIRAC.PublicStateManager.classes.MenuModel",
    "Ext.data.TreeStore",
  ],
  xtype: "tree-grid",

  title: "Desktops&Applications",
  height: 300,
  width: 600,
  useArrows: false,
  rootVisible: false,
  multiSelect: true,
  singleExpand: false,
  listeners: {
    afterrender: function (component, eOpts) {
      var me = this;
      me.setLoading(true);
    },
  },
  initComponent: function () {
    var me = this;

    me.store = Ext.create("Ext.data.TreeStore", {
      model: DIRAC.PublicStateManager.classes.MenuModel,
      proxy: {
        type: "ajax",
        url: GLOBAL.BASE_URL + "UP/listPublicStates",
        extraParams: {
          app: "desktop",
          obj: "application",
        },
      },
      autoLoad: true,
      listeners: {
        load: function (oStore, oOperation, eOpts) {
          me.setLoading(false);
        },
      },
    });

    Ext.apply(me, {
      columns: [
        {
          xtype: "treecolumn",
          text: "Name",
          flex: 2,
          sortable: true,
          dataIndex: "name",
        },
        {
          xtype: "templatecolumn",
          text: "Type",
          flex: 1,
          sortable: true,
          dataIndex: "type",
          align: "center",
          tpl: Ext.create("Ext.XTemplate", "{type:this.formatApplicationType}", {
            formatApplicationType: function (v) {
              if (v == "desktop") {
                return ' <font color="#00CC00">' + v + "</font>";
              } else {
                return ' <font color="#FF3300">' + v + "</font>";
              }
            },
          }),
        },
        {
          text: "UserName",
          flex: 1,
          dataIndex: "user",
          sortable: true,
        },
        {
          text: "Group",
          flex: 1,
          dataIndex: "group",
          sortable: true,
        },
        {
          text: "VO",
          flex: 1,
          dataIndex: "vo",
          sortable: true,
        },
        {
          text: "Load",
          width: 55,
          menuDisabled: true,
          xtype: "actioncolumn",
          tooltip: "Load a state...",
          align: "center",
          iconCls: "dirac-icon-state",
          handler: function (grid, rowIndex, colIndex, actionItem, event, record, row) {
            GLOBAL.APP.MAIN_VIEW.SM.formStateLoader(GLOBAL.APP.MAIN_VIEW.cbAfterLoadSharedState, GLOBAL.APP.MAIN_VIEW.cbAfterSaveSharedState);

            var prefix = "";
            if (record.get("type") == "desktop") {
              prefix = "desktop|";
            } else {
              prefix = record.get("app") + "|";
            }

            var fullState = prefix + record.get("user") + "|" + record.get("group") + "|" + record.get("name");

            GLOBAL.APP.MAIN_VIEW.SM.txtLoadText.setRawValue(fullState);
            GLOBAL.APP.MAIN_VIEW.SM.txtRefName.setRawValue(record.get("name"));
            GLOBAL.APP.MAIN_VIEW.SM.txtLoadText.disable();
          },
          // Only leaf level tasks may be edited
          isDisabled: function (view, rowIdx, colIdx, item, record) {
            return (
              !record.data.leaf || (record.get("user") == GLOBAL.USER_CREDENTIALS.username && record.get("group") == GLOBAL.USER_CREDENTIALS.group)
            );
          },
        },
        {
          text: "Module",
          flex: 1,
          dataIndex: "app",
          sortable: true,
          hidden: true,
        },
      ],
    });

    me.callParent();
  },
});
