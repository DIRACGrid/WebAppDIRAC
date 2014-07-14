Ext.define('DIRAC.ApplicationWizard.classes.Presenter', {
      extend : 'Ext.panel.Panel',
      requires : ['Ext.dirac.views.tabs.Presenter', 'DIRAC.ApplicationWizard.classes.Image', 'Ext.dirac.views.tabs.Panel'],
      view : 'presenterView',
      region : 'center',
      minWidth : 300,
      title : name,
      header : false,
      closable : true,
      autoRender : true,
      layout : {
        type : 'border',
        padding : 2
      },

      getStateData : function() {
        var me = this;

        var result = me.presenter.getStateData();
        result.data = [];
        me.presenter.items.each(function(item) {
              if (item.loadedObjectType == 'image') {
                // it is an image
                result.data.push({
                      src : item.src,
                      loadedObjectType : item.loadedObjectType
                    });

              } else {
                result.data.push({
                      link : item.linkToLoad,
                      loadedObjectType : item.loadedObjectType
                    });
              }

            });
        return result;

      },

      loadState : function(states) {
        var me = this;
        me.presenter.loadState(states);
        for (var i = 0; i < states.data.length; i++) {
          if (states.data[i].loadedObjectType == 'image') {
            me.addImages([states.data[i].src]);
          } else {
            me.addLinks([states.data[i].link]);
          }
        }
      },
      constructor : function(config) {
        var me = this;
        me.presenter = Ext.create('Ext.dirac.views.tabs.Presenter', {
              region : 'center',
              // minWidth : 300,
              // title : name,
              closable : false
            });
        Ext.apply(me, {
              items : [me.presenter]
            });

        me.callParent(arguments);
      },

      /**
       * It creates the widgets for a givel list
       * 
       * @param {Object}
       *          links it is a list of links
       */
      addLinks : function(links) {
        var me = this;
        var activeTab = me;

        for (var i = 0; i < links.length; i++) {

          var config = {
            setupData : {},
            loadedObjectType : "link",
            linkToLoad : links[i],
            listeners : {
              beforeclose : function(panel, eOpts) {

                activeTab.closeRemoveApplication(panel); // generate a close
                // event again.

                return false;
              }
            }
          };
          var tab = new Ext.dirac.views.tabs.Panel(config);
          tab.activeTab = me; // this needs to stop the loading
          // message. The event handled in the Panel class.
          Ext.apply(tab, {
                tools : [{
                      type : 'maximize',
                      tooltip : 'Maximize the application.',
                      scope : tab,
                      handler : function(event, toolEl, panelHeader) {
                        var me = this;
                        activeTab.hideComponents(); // hides all
                        // components!
                        me.show(); // only show the current component
                        // we need to hide the maximize and also the close
                        // buttons!!
                        for (var i = 0; i < me.tools.length; i++) {
                          if (me.tools[i].type == 'maximize' || me.tools[i].type == 'close') {
                            me.tools[i].hide();
                          } else if (me.tools[i].type == 'minimize') {
                            me.tools[i].show();
                          }
                        }
                        var origSize = {
                          'width' : tab.getWidth(),
                          'height' : tab.getHeight()
                        }
                        me.origiginalSize = origSize;
                        me.setWidth(activeTab.getWidth());
                        me.setHeight(activeTab.getHeight());
                        me.isOpen = true;
                        activeTab.add(me);

                      }
                    }, {
                      type : 'minimize',
                      tooltip : 'Minimize the application.',
                      scope : tab,
                      hidden : true,
                      handler : function(event, toolEl, panelHeader) {
                        var me = this;
                        activeTab.showComponents();
                        // we need to show the maximize and close
                        // buttons and hide the minimize buttons.
                        for (var i = 0; i < me.tools.length; i++) {
                          if (me.tools[i].type == 'maximize' || me.tools[i].type == 'close') {
                            me.tools[i].show();
                          } else if (me.tools[i].type == 'minimize') {
                            me.tools[i].hide();
                          }
                        }
                        me.isOpen = false;
                        me.setWidth(tab.origiginalSize.width);
                        me.setHeight(tab.origiginalSize.height);
                        activeTab.addWidget(me);
                      }
                    }]
              });
          activeTab.addWidget(tab);
          tab.header.hide(); // we do not show the name of the application!
          // (save space)
          tab.loadData();

          /*
           * if (GLOBAL.APP.MAIN_VIEW.ID == 'tabs'){
           * GLOBAL.APP.MAIN_VIEW.createWindow("link", links[i], data, me);
           * }else{ GLOBAL.APP.CF.msg("Error Notification", "You can add
           * external links using tab view..."); }
           */
        }
      },

      addImages : function(images) {
        var me = this;
        var width = 99 / me.columnWidth;
        width = '.' + Math.round(width);

        for (var i = 0; i < images.length; i++) {

          var oImg = Ext.create('DIRAC.ApplicationWizard.classes.Image', {
                layout : 'column',
                loadedObjectType : "image",
                columnWidth : width,
                src : images[i],
                listeners : {
                  render : function() {
                    var me = this;
                    me.el.on({
                          load : function(evt, ele, opts) {
                            me.setLoading(false);
                          }
                        });
                  }
                }
              });
          me.presenter.addImage(oImg);
          oImg.setLoading(true);
        }
      },

      hideComponents : function() {
        var me = this;
        me.presenter.items.each(function(widget) {
              widget.hide();
            });
      },
      showComponents : function() {

        var me = this;
        me.presenter.items.each(function(widget) {
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
      addWidget : function(widget) {
        var me = this;

        me.presenter.addImage(widget);

      },
      closeRemoveApplication : function(panel) {
        var me = this;

        me.presenter.remove(panel);

      }

    });