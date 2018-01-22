
/**
 * @class Ext.dirac.views.tabs.TabMenuPlugin
 * @extends Object Plugin (ptype = 'tabtoolbar') for adding a toolbar to a
 *          TabBar.
 * @constructor
 * @param {Object}
 *          config Configuration options
 * @ptype tabtoolbar
 * 
 * This plugin is an improvement version of Ext.ux.tab.Toolbar.
 * 
 */
Ext.define('Ext.dirac.views.tabs.TabMenuPlugin', {
      alias : 'plugin.tabtoolbar',

      constructor : function(config) {
        Ext.apply(this, config || {});
      },

      /**
       * @cfg {String} position The position where the toolbar will appear
       *      inside the tabbar. Supported values are 'left' and 'right'
       *      (defaults to right).
       */
      position : 'right',

      // private
      init : function(tabPanel) {
        var me = this;
        var toolbarId = me.id;
        delete me.id;

        Ext.apply(tabPanel, me.parentOverrides);
        me.tabPanel = tabPanel;
        me.tabBar = tabPanel.tabBar;

        // ensure we have a valid position
        if (this.position !== 'left') {
          this.position = 'right';
        }

        tabPanel.on({
              render : function() {
                me.layout = me.tabBar.layout;
                me.layout.overflowHandler.handleOverflow = Ext.Function.bind(me.overflowMenu, me);
              },
              single : true
            }); // When we have lot of tabs which can not fit one scree, then we
                // have to move the help to different position.
        me.tabBar.on({
              afterlayout : function() {
                me.layout = me.tabBar.layout;
                if (me.toolbar)
                  return;

                // we need to subtract the toolbar width from this function
                // result
                me.layout.availableSpaceOffset += this.width;

                var scrollerEl = me.tabBar.body.child('.' + Ext.baseCSSPrefix + 'box-scroller-' + this.position), contentEl = me.tabBar.body.createChild({
                      style : 'width:' + this.width + 'px;',
                      cls : Ext.baseCSSPrefix + 'tab-toolbar-' + this.position
                    }, scrollerEl);

                // if scroller is not created (only one tab)
                // we need to add the floating style to the tab bar
                if (scrollerEl == undefined) {
                  me.tabBar.body.child('.' + Ext.baseCSSPrefix + 'box-inner').setStyle({
                        'float' : this.position == 'left' ? 'right' : 'left'
                      })
                }

                me.toolbar = new Ext.toolbar.Toolbar({
                      cls : 'x-tab-toolbar',
                      renderTo : contentEl,
                      items : Ext.Array.from(this.items),
                      id : toolbarId
                    });
                me.tabPanel.updateLayout();

              },
              beforedestroy : function() {
                me.toolbar.destroy();
              },
              scope : this,
              single : true
            });
      },
      overflowMenu : function() {
        var me = this;
        if (me.toolbar)
          me.toolbar.destroy();
        var toolbarId = me.id;
        me.layout = me.tabBar.layout;

        // we need to subtract the toolbar width from this function result
        me.layout.availableSpaceOffset += this.width;
        result = Ext.getClass(me.layout.overflowHandler).prototype.handleOverflow.apply(me.layout.overflowHandler, arguments);

        var scrollerEl = me.tabBar.body.child('.' + Ext.baseCSSPrefix + 'box-scroller-' + this.position), contentEl = me.tabBar.body.createChild({
              style : 'width:' + this.width + 'px;',
              cls : Ext.baseCSSPrefix + 'tab-toolbar-' + this.position
            }, scrollerEl);

        // if scroller is not created (only one tab)
        // we need to add the floating style to the tab bar
        if (scrollerEl == undefined) {
          me.tabBar.body.child('.' + Ext.baseCSSPrefix + 'box-inner').setStyle({
                'float' : this.position == 'left' ? 'right' : 'left'
              })
        }

        me.toolbar = new Ext.toolbar.Toolbar({
              cls : 'x-tab-toolbar',
              renderTo : contentEl,
              items : Ext.Array.from(this.items),
              id : toolbarId
            });

        result.reservedSpace += contentEl.getWidth();
        return result;
      }

    });
