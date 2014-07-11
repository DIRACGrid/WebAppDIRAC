Ext.define('DIRAC.ApplicationWizard.classes.ApplicationWizard', {
      extend : 'Ext.dirac.core.Module',

      requires : ["Ext.grid.Panel", "Ext.dirac.utils.DiracBaseSelector", "DIRAC.ApplicationWizard.classes.Presenter"],

      loadState : function(data) {
        var me = this;
        me.leftPanel.loadState(data);
        if (data.leftPanelCollapsed) {
            me.leftPanel.collapse();
        }

      },
      getStateData : function() {
        var me = this;
        var data = {
          leftMenu : me.leftPanel.getStateData(),
          pData : me.presenterView.presenter.getStateData(),
          leftPanelCollapsed : me.leftPanel.collapsed
        };
        return data;
      },

      initComponent : function() {

        var me = this;

        if (GLOBAL.VIEW_ID == "desktop") {

          me.launcher.title = "Application Wizzard";
          me.launcher.maximized = false;

          var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

          me.launcher.width = oDimensions[0];
          me.launcher.height = oDimensions[1];

          me.launcher.x = 0;
          me.launcher.y = 0;

        }

        if (GLOBAL.VIEW_ID == "tabs") {

          me.launcher.title = "Application Wizzard";
          me.launcher.maximized = false;

          var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

          me.launcher.width = oDimensions[0];
          me.launcher.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar.getHeight();

          me.launcher.x = 0;
          me.launcher.y = 0;

        }

        Ext.apply(me, {
              layout : 'border',
              bodyBorder : false,
              defaults : {
                collapsible : true,
                split : true
              }
            });

        me.callParent(arguments);

      },
      /**
       * It build the widget.
       */
      buildUI : function() {

        var me = this;

        var textFields = {
          'pageUrl' : {
            "name" : "Page url",
            "type" : "originalText"
          },
          'imageUrl' : {
            "name" : "Image url",
            "type" : "originalText"
          }
        };

        me.leftPanel = Ext.create('Ext.dirac.utils.DiracBaseSelector', {
              scope : me,
              textFields : textFields,
              hasTimeSearchPanel : false,
              panelButtons : false
            });

        // Buttons at the bottom of the panel
        var leftPanelButtons = new Ext.create('Ext.toolbar.Toolbar', {
              dock : 'bottom',
              layout : {
                pack : 'center'
              },
              items : []
            });

        var addButton = new Ext.Button({
              text : 'Add',
              margin : 3,
              iconCls : "dirac-icon-submit",
              handler : function() {
                var urls = me.leftPanel.getSelectionData();
                var pageUrl = Ext.JSON.decode(urls['pageUrl']);
                var imageUrl = Ext.JSON.decode(urls['imageUrl']);
                me.presenterView.addLinks(pageUrl);
                me.presenterView.addImages(imageUrl);
              },
              scope : me
            });

        leftPanelButtons.add(addButton);

        var resetButton = new Ext.Button({
              text : 'Reset',
              margin : 3,
              iconCls : "dirac-icon-reset",
              handler : function() {
                me.leftPanel.oprResetSelectionOptions();
              },
              scope : me

            });

        leftPanelButtons.add(resetButton);

        me.leftPanel.addDocked(leftPanelButtons);

        me.presenterView = Ext.create("DIRAC.ApplicationWizard.classes.Presenter");

        me.add([me.leftPanel, me.presenterView]);
      }

    });
