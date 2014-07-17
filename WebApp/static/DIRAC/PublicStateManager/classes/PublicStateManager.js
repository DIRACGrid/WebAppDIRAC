Ext.define('DIRAC.PublicStateManager.classes.PublicStateManager', {
      extend : 'Ext.dirac.core.Module',
      requires : ['DIRAC.PublicStateManager.classes.MenuGrid'],
      loadState : function(data) {

      },
      getStateData : function() {
        var me = this;
        var states = {};

        return states;
      },
      initComponent : function() {
        var me = this;

        if (GLOBAL.VIEW_ID == "desktop") {

          me.launcher.title = "Public State Manager";
          me.launcher.maximized = false;

          var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();
          var iDim = Math.floor(Math.min(oDimensions[0], oDimensions[1]) / 2);
          me.launcher.width = 2 * iDim;
          me.launcher.height = iDim;

          me.launcher.x = 0;
          me.launcher.y = 0;

        }

        if (GLOBAL.VIEW_ID == "tabs") {

          me.launcher.title = "Public State Manager";
          me.launcher.maximized = false;

          var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();
          var iDim = Math.floor(Math.min(oDimensions[0], oDimensions[1]) / 2);
          me.launcher.width = 2 * iDim;
          me.launcher.height = iDim;

          me.launcher.x = 0;
          me.launcher.y = 0;

        }

        Ext.apply(me, {
              layout : 'fit',
              defaults : {
                collapsible : false,
                split : true
              }
            });

        me.callParent(arguments);

      },

      buildUI : function() {

        var me = this;
        me.leftPanel = Ext.create("DIRAC.PublicStateManager.classes.MenuGrid", {
              collapsible : true,
              region : 'center'
            });
        me.add([me.leftPanel]);
      }
    });