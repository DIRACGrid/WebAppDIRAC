/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.ux.desktop.StartMenu
 * Startmenu as a part of the taskbar. An object of
 * this class has two main parts:
 *  - Menu (on the left side)
 *  - Toolbar (on the right side)
 * @extends Ext.panel.Panel
 */
Ext.define('Ext.ux.desktop.StartMenu', {
	extend : 'Ext.panel.Panel',

	requires : [ 'Ext.menu.Menu', 'Ext.toolbar.Toolbar' ],

	ariaRole : 'menu',

	cls : 'x-menu ux-start-menu',

	defaultAlign : 'bl-tl',

	iconCls : 'user',

	floating : true,

	shadow : true,

	/*
	 * We have to hardcode a width because the internal Menu cannot drive our
	 * width. This is combined with changing the align property of the menu's
	 * layout from the typical 'stretchmax' to 'stretch' which allows the the
	 * items to fill the menu area.
	 */
	width : 300,

	initComponent : function() {
		var me = this, menu = me.menu;
		
		/*
		 * Start menu
		 */
		me.menu = new Ext.menu.Menu({
			cls : 'ux-start-menu-body',
			border : false,
			floating : false,
			items : menu
		});
		me.menu.layout.align = 'stretch';

		me.items = [ me.menu ];
		me.layout = 'fit';

		Ext.menu.Manager.register(me);
		me.callParent();
		
		/*
		 * Additional toolbar on the right side of the 
		 * start menu.
		 */
		me.toolbar = new Ext.toolbar.Toolbar(Ext.apply({
			dock : 'right',
			cls : 'ux-start-menu-toolbar',
			vertical : true,
			width : 100
		}, me.toolConfig));

		me.toolbar.layout.align = 'stretch';
		me.addDocked(me.toolbar);

		delete me.toolItems;

		me.on('deactivate', function() {
			me.hide();
		});
	},
	
	/**
	 * Function to add an item (button, menu) to the menu
	 * of the start menu
	 */
	addMenuItem : function() {
		var cmp = this.menu;
		cmp.add.apply(cmp, arguments);
	},

	/**
	 * Function to add an item (button, menu) to the toolbar
	 * of the start menu
	 */
	addToolItem : function() {
		var cmp = this.toolbar;
		cmp.add.apply(cmp, arguments);
	},

	showBy : function(cmp, pos, off) {
		var me = this;

		if (me.floating && cmp) {
			me.layout.autoSize = true;
			me.show();

			// Component or Element
			cmp = cmp.el || cmp;

			// Convert absolute to floatParent-relative coordinates if
			// necessary.
			var xy = me.el.getAlignToXY(cmp, pos || me.defaultAlign, off);
			if (me.floatParent) {
				var r = me.floatParent.getTargetEl().getViewRegion();
				xy[0] -= r.x;
				xy[1] -= r.y;
			}
			me.showAt(xy);
			me.doConstrain();
		}
		return me;
	}
});
