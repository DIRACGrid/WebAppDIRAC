Ext.define("DIRAC.ApplicationWizard.classes.ApplicationWizard", {
  extend: "Ext.dirac.core.Module",

  requires: ["Ext.grid.Panel", "Ext.dirac.utils.DiracBaseSelector", "DIRAC.ApplicationWizard.classes.Presenter"],

  loadState: function (states) {
    var me = this;
    me.leftPanel.loadState(states);
    if (states.leftPanelCollapsed) {
      me.leftPanel.collapse();
    }
    me.presenterView.loadState(states.pData);
  },
  getStateData: function () {
    var me = this;
    var data = {
      leftMenu: me.leftPanel.getStateData(),
      pData: me.presenterView.getStateData(),
      leftPanelCollapsed: me.leftPanel.collapsed,
    };
    return data;
  },

  initComponent: function () {
    var me = this;

    me.launcher.title = "Application Wizard";
    me.launcher.maximized = false;

    var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

    me.launcher.width = oDimensions[0];
    me.launcher.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar ? GLOBAL.APP.MAIN_VIEW.taskbar.getHeight() : 0;

    me.launcher.x = 0;
    me.launcher.y = 0;

    Ext.apply(me, {
      layout: {
        type: "hbox",
        align: "stretch",
      },
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: false,
      },
    });

    me.callParent(arguments);
  },
  /**
   * It build the widget.
   */
  buildUI: function () {
    var me = this;

    var textFields = {
      link: {
        name: "Page url",
        type: "originalText",
      },
      src: {
        name: "Image url",
        type: "originalText",
      },
      title: {
        name: "Title",
        type: "originalText",
        properties: {
          canDisable: false,
        },
      },
    };

    me.leftPanel = Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      textFields: textFields,
      hasTimeSearchPanel: false,
      panelButtons: false,
      collapseDirection: "left",
    });

    // Buttons at the bottom of the panel
    var leftPanelButtons = new Ext.create("Ext.toolbar.Toolbar", {
      dock: "bottom",
      layout: {
        pack: "center",
      },
      items: [],
    });

    var addButton = new Ext.Button({
      text: "Add",
      margin: 3,
      iconCls: "dirac-icon-submit",
      handler: function () {
        var urls = me.leftPanel.getSelectionData();
        var title = Ext.JSON.decode(urls["title"]);
        if (title.length > 0) {
          title = title[0];
        } else {
          title = "";
        }
        var plotParams = {};
        var link = Ext.JSON.decode(urls["link"]);
        if (link && link.length > 0) {
          plotParams = {
            link: link[0],
            title: title,
          };
          me.presenterView.addLinks([plotParams]);
        } else {
          plotParams = {
            src: Ext.JSON.decode(urls["src"])[0],
            title: title,
          };
          me.presenterView.addImages([plotParams]);
        }
      },
      scope: me,
    });

    leftPanelButtons.add(addButton);

    var resetButton = new Ext.Button({
      text: "Reset",
      margin: 3,
      iconCls: "dirac-icon-reset",
      handler: function () {
        me.leftPanel.oprResetSelectionOptions();
      },
      scope: me,
    });

    leftPanelButtons.add(resetButton);

    var applyButton = new Ext.Button({
      text: "Apply",
      tooltip: "It updates the selected image.",
      margin: 3,
      iconCls: "dirac-icon-upload",
      handler: function () {
        var urls = me.leftPanel.getSelectionData();
        var link = Ext.JSON.decode(urls["link"]);
        if (link.length > 0) {
          link = link[0];
          title = Ext.JSON.decode(urls["title"])[0];
          me.presenterView.clickedPanel.setTitle(title);
          if (me.presenterView.clickedPanel.linkToLoad != link) {
            me.presenterView.clickedPanel.linkToLoad = link;
            me.presenterView.clickedPanel.items.getAt(0).el.set({
              src: link,
            });
          }
        } else {
          var image = null;
          var image = me.presenterView.presenter.getLastClickedImage();
          if (image) {
            var src = Ext.JSON.decode(urls["src"])[0];
            var title = Ext.JSON.decode(urls["title"])[0];
            var newImage = Ext.create("DIRAC.ApplicationWizard.classes.Image", {
              layout: "column",
              loadedObjectType: "image",
              columnWidth: image.columnWidth,
              plotParams: {
                src: src,
                title: title,
              },
              title: title,
              src: src,
              listeners: {
                render: function () {
                  var me = this;
                  me.el.on({
                    load: function (evt, ele, opts) {
                      me.setLoading(false);
                    },
                  });
                },
              },
            });

            me.presenterView.presenter.replaceImg(image, newImage);
          }
        }
      },
      scope: me,
    });

    leftPanelButtons.add(applyButton);

    me.leftPanel.addDocked(leftPanelButtons);

    me.presenterView = Ext.create("DIRAC.ApplicationWizard.classes.Presenter", {
      parent: me,
      flex: 2,
    });

    me.add([me.leftPanel, me.presenterView]);
  },
});
