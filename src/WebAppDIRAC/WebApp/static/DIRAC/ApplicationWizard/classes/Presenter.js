Ext.define("DIRAC.ApplicationWizard.classes.Presenter", {
  extend: "Ext.panel.Panel",
  requires: ["DIRAC.ApplicationWizard.classes.Image", "Ext.dirac.utils.Tabtheme"],
  view: "presenterView",
  region: "center",
  minWidth: 300,
  title: name,
  header: false,
  closable: true,
  autoRender: true,
  clickedPanel: null,
  layout: "fit",

  getStateData: function () {
    var me = this;

    var result = me.presenter.getStateData();
    result.data = [];
    me.presenter.items.each(function (item) {
      if (item.loadedObjectType == "image") {
        // it is an image
        result.data.push({
          src: item.src,
          title: item.title,
          loadedObjectType: item.loadedObjectType,
        });
      } else {
        result.data.push({
          link: item.linkToLoad,
          title: item.title,
          loadedObjectType: item.loadedObjectType,
        });
      }
    });
    return result;
  },

  loadState: function (states) {
    var me = this;
    me.presenter.loadState(states);
    for (var i = 0; i < states.data.length; i++) {
      if (states.data[i].loadedObjectType == "image") {
        var data = {
          src: states.data[i].src,
          title: states.data[i].title,
        };
        me.addImages([data]);
      } else {
        var data = {
          link: states.data[i].link,
          title: states.data[i].title,
        };
        me.addLinks([data]);
      }
    }
  },
  constructor: function (config) {
    var me = this;
    me.presenter = Ext.create("Ext.dirac.utils.Tabtheme", {
      //region : 'center',
      // minWidth : 300,
      // title : name,
      closable: false,
      parent: me,
    });

    me.presenter.updateTime = Ext.create("Ext.form.Label", {
      xtype: "label",
      text: "Updated: -",
      style: GLOBAL.WEB_THEME == "neptune" ? "font-weight:bold;color:#FFFFFF;" : "font-weight:bold;color:#666666;",
      // #990066;', //#666666;'
      // html: "<span style='color:red'>Updated: - </span>"
    });

    var now = new Date();
    var UTCTime = now.toUTCString();
    UTCTime = UTCTime.replace("GMT", "[UTC]");
    me.presenter.updateTime.setText("Updated:" + UTCTime);
    me.presenter.tools.push(me.presenter.updateTime);
    Ext.apply(me, {
      items: [me.presenter],
    });

    me.callParent(arguments);
  },

  /**
   * It creates the widgets for a givel list
   *
   * @param {Object}
   *          links it is a list of links
   */
  addLinks: function (links) {
    var me = this;
    var activeTab = me;

    for (var i = 0; i < links.length; i++) {
      var config = {
        setupData: {
          text: links[i].title,
        },
        loadedObjectType: "link",
        plotParams: links[i],
        linkToLoad: links[i].link,
        listeners: {
          beforeclose: function (panel, eOpts) {
            activeTab.closeRemoveApplication(panel); // generate a close
            // event again.

            return false;
          },

          afterrender: function (panel) {
            panel.header.el.on("dblclick", function (e, t, eOpts) {
              var panel = Ext.getCmp(t.id).up("panel");

              var data = {
                link: panel.linkToLoad,
                title: panel.title,
              };
              me.clickedPanel = panel;
              me.__loadSelectionData(data);
            });
          },
        },
      };
      var tab = new Ext.dirac.views.tabs.Panel(config);
      tab.activeTab = me; // this needs to stop the loading
      // message. The event handled in the Panel class.
      Ext.apply(tab, {
        tools: [
          {
            type: "maximize",
            tooltip: "Maximize the application.",
            scope: tab,
            handler: function (event, toolEl, panelHeader) {
              var me = this;
              activeTab.hideComponents(); // hides all
              // components!
              me.show(); // only show the current component
              // we need to hide the maximize and also the close
              // buttons!!
              for (var i = 0; i < me.tools.length; i++) {
                if (me.tools[i].type == "maximize" || me.tools[i].type == "close") {
                  me.tools[i].hide();
                } else if (me.tools[i].type == "minimize") {
                  me.tools[i].show();
                }
              }
              var origSize = {
                width: tab.getWidth(),
                height: tab.getHeight(),
              };
              me.origiginalSize = origSize;
              me.setWidth(activeTab.getWidth());
              me.setHeight(activeTab.getHeight());
              me.isOpen = true;
              activeTab.add(me);
            },
          },
          {
            type: "minimize",
            tooltip: "Minimize the application.",
            scope: tab,
            hidden: true,
            handler: function (event, toolEl, panelHeader) {
              var me = this;
              activeTab.showComponents();
              // we need to show the maximize and close
              // buttons and hide the minimize buttons.
              for (var i = 0; i < me.tools.length; i++) {
                if (me.tools[i].type == "maximize" || me.tools[i].type == "close") {
                  me.tools[i].show();
                } else if (me.tools[i].type == "minimize") {
                  me.tools[i].hide();
                }
              }
              me.isOpen = false;
              me.setWidth(tab.origiginalSize.width);
              me.setHeight(tab.origiginalSize.height);
              activeTab.addWidget(me);
            },
          },
        ],
      });
      activeTab.addWidget(tab);
      tab.header.hide(); // we do not show the name of the application!
      // (save space)
      tab.loadData();

      /*
       * GLOBAL.APP.MAIN_VIEW.createWindow("link", links[i], data, me);
       */
    }
  },

  addImages: function (images) {
    var me = this;
    var width = 99 / me.columnWidth;
    width = "." + Math.round(width);

    for (var i = 0; i < images.length; i++) {
      var oImg = Ext.create("DIRAC.ApplicationWizard.classes.Image", {
        layout: "column",
        loadedObjectType: "image",
        columnWidth: width,
        plotParams: images[i],
        title: images[i].title,
        src: images[i].src,
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
      me.presenter.addImage(oImg);
      oImg.setLoading(true);
    }
  },

  hideComponents: function () {
    var me = this;
    me.presenter.items.each(function (widget) {
      widget.hide();
    });
  },
  showComponents: function () {
    var me = this;
    me.presenter.items.each(function (widget) {
      widget.show();
    });
  },
  /*************************************************************************
   * it adds an application {@link Ext.dirac.views.tabs.Panel} to the
   * presenter view.
   *
   * @param{Object} widget is a object which inherited from
   *                {@link Ext.dirac.views.tabs.Panel}
   */
  addWidget: function (widget) {
    var me = this;

    me.presenter.addImage(widget);
  },
  closeRemoveApplication: function (panel) {
    var me = this;

    me.presenter.remove(panel);
  },
  __loadSelectionData: function (plotParams) {
    var me = this;
    var data = {
      leftMenu: {},
    };

    Ext.apply(data.leftMenu, plotParams);
    me.parent.leftPanel.loadState(data);
  },
});
