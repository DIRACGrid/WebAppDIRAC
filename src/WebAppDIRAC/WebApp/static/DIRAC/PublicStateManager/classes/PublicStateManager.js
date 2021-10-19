Ext.define("DIRAC.PublicStateManager.classes.PublicStateManager", {
  extend: "Ext.dirac.core.Module",
  requires: ["DIRAC.PublicStateManager.classes.MenuGrid"],
  loadState: function (data) {},
  getStateData: function () {
    var me = this;
    var states = {};

    return states;
  },
  initComponent: function () {
    var me = this;

    me.launcher.title = "Public State Manager";
    me.launcher.maximized = false;

    var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();
    var iDim = Math.floor(Math.min(oDimensions[0], oDimensions[1]) / 2);
    me.launcher.width = 2 * iDim;
    me.launcher.height = iDim;

    me.launcher.x = 0;
    me.launcher.y = 0;

    Ext.apply(me, {
      layout: "fit",
      defaults: {
        collapsible: false,
        split: true,
      },
    });

    me.callParent(arguments);
  },

  buildUI: function () {
    var me = this;

    me.leftPanel = Ext.create("DIRAC.PublicStateManager.classes.MenuGrid", {
      collapsible: false,
      store: me.treeStore,
      region: "center",
    });

    var panelButtons = new Ext.create("Ext.toolbar.Toolbar", {
      dock: "top",
      layout: {
        pack: "left",
      },
      items: [],
    });

    var refreshButton = new Ext.Button({
      text: "refresh",
      margin: 3,
      iconCls: "dirac-icon-refresh",
      handler: function () {
        var me = this;
        me.leftPanel.store.load();
        me.leftPanel.setLoading(true);
      },
      scope: me,
    });

    panelButtons.add(refreshButton);

    me.leftPanel.addDocked(panelButtons);

    me.add([me.leftPanel]);
    me.leftPanel.setLoading(true);
  },
});
