/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.ux.desktop.Desktop
 * This is an abstract class that has 
 * to be inherited by every module.
 * @mixin Ext.util.Observable
 * 
 */
Ext.define('Ext.ux.desktop.ToolButton', {
	extend : 'Ext.panel.Tool',
	alias: 'widget.toolButton',
	requires: [
	           'Ext.menu.Manager',
	           'Ext.util.ClickRepeater',
	           'Ext.layout.component.Button',
	           'Ext.util.TextMetrics',
	           'Ext.util.KeyMap'
	       ],
	menuActiveCls: 'menu-active',
	menuAlign: 'tl-bl?',
	menu:null,
	
	initComponent: function() {
        var me = this;
        me.callParent(arguments);
        me.addEvents(                
        		/**
                 * @event menushow
                 * If this button has a menu, this event fires when it is shown
                 * @param {Ext.button.Button} this
                 * @param {Ext.menu.Menu} menu
                 */
                'menushow',

                /**
                 * @event menuhide
                 * If this button has a menu, this event fires when it is hidden
                 * @param {Ext.button.Button} this
                 * @param {Ext.menu.Menu} menu
                 */
                'menuhide',

                /**
                 * @event menutriggerover
                 * If this button has a menu, this event fires when the mouse enters the menu triggering element
                 * @param {Ext.button.Button} this
                 * @param {Ext.menu.Menu} menu
                 * @param {Event} e
                 */
                'menutriggerover',

                /**
                 * @event menutriggerout
                 * If this button has a menu, this event fires when the mouse leaves the menu triggering element
                 * @param {Ext.button.Button} this
                 * @param {Ext.menu.Menu} menu
                 * @param {Event} e
                 */
                'menutriggerout'
            );
        if (me.menu) {
            // Flag that we'll have a splitCls
            me.split = true;

            // retrieve menu by id or instantiate instance if needed
            me.menu = Ext.menu.Manager.get(me.menu);
            me.menu.ownerButton = me;
        }
	},
	
	onRender: function() {
        var me = this;

        me.callParent(arguments);
        if (me.menu) {
            me.mon(me.menu, {
                scope: me,
                show: me.onMenuShow,
                hide: me.onMenuHide
            });

            me.keyMap = new Ext.util.KeyMap({
                target: me.el,
                key: Ext.EventObject.DOWN,
                handler: me.onDownKey,
                scope: me
            });
        }
	},
	
	getRefItems: function(deep){
        var menu = this.menu,
            items;
        
        if (menu) {
            items = menu.getRefItems(deep);
            items.unshift(menu);
        }
        return items || [];
    },
    
    beforeDestroy: function() {
        var me = this;
        
        if (me.menu && me.destroyMenu !== false) {
            Ext.destroy(me.menu);
        }
        
        me.callParent();
    },
    
    showMenu: function() {
        var me = this;
        if (me.rendered && me.menu) {
            
            if (me.menu.isVisible()) {
                me.menu.hide();
            }

            me.menu.showBy(me.el, me.menuAlign, ((!Ext.isStrict && Ext.isIE) || Ext.isIE6) ? [-2, -2] : undefined);
        }
        return me;
    },
    /**
     * Hides this button's menu (if it has one)
     */
    hideMenu: function() {
        if (this.hasVisibleMenu()) {
            this.menu.hide();
        }
        return this;
    },

    /**
     * Returns true if the button has a menu and it is visible
     * @return {Boolean}
     */
    hasVisibleMenu: function() {
        var menu = this.menu;
        return menu && menu.rendered && menu.isVisible();
    },
    
 // private
    onMenuShow: function(e) {
        var me = this;
        me.ignoreNextClick = 0;
        me.addClsWithUI(me.menuActiveCls);
        me.fireEvent('menushow', me, me.menu);
    },

    // private
    onMenuHide: function(e) {
        var me = this;
        me.removeClsWithUI(me.menuActiveCls);
        me.ignoreNextClick = Ext.defer(me.restoreClick, 250, me);
        me.fireEvent('menuhide', me, me.menu);
    },
 // private
    onDownKey: function() {
        var me = this;

        if (!me.disabled) {
            if (me.menu) {
                me.showMenu();
            }
        }
    },
    restoreClick: function() {
        this.ignoreNextClick = 0;
    },
    onDestroy: function() {
        var me = this;
        if (me.rendered) {
            Ext.destroy(me.keyMap);
            delete me.keyMap;
        }
        me.callParent();
    },
    
    onClick: function(e) {
        var me = this;
        
        if (!me.disabled) {
            //me.doToggle();
            me.maybeShowMenu();
            me.fireHandler(e);
        }
    },
    
    fireHandler: function(e){
        var me = this,
            handler = me.handler;
            
        if (me.fireEvent('click', me, e) !== false) {
            if (handler) {
                handler.call(me.scope || me, me, e);
            }
            me.blur();
        }
    },
    
    maybeShowMenu: function(){
        var me = this;
        if (me.menu && !me.hasVisibleMenu() && !me.ignoreNextClick) {
            me.showMenu();
        }
    }

});
