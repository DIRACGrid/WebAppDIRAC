/**
 * @class Ext.dirac.views.desktop.TaskBar The taskbar class. An object of this
 *        class has three main parts: - Start menu - Quick start menu - Window
 *        bar (syn. task bar)
 * @extends Ext.toolbar.Toolbar
 */
Ext.define('Ext.dirac.views.desktop.TaskBar', {
	extend : 'Ext.toolbar.Toolbar', // TODO - make this a basic hbox panel...

	requires : [ 'Ext.button.Button', 'Ext.resizer.Splitter', 'Ext.menu.Menu', 'Ext.dirac.views.desktop.StartMenu', 'Ext.toolbar.TextItem' ],

	alias : 'widget.taskbar',

	cls : 'ux-taskbar',

	/**
	 * @cfg {String} startBtnText The text for the Start Button.
	 */
	startBtnText : '',

	height : 28,

	initComponent : function() {

		var me = this;

		if (!GLOBAL.APP.configData.user.username) {

			GLOBAL.STATE_MANAGEMENT_ENABLED = false;

		}

		me.startMenu = new Ext.dirac.views.desktop.StartMenu();

		me.windowBar = new Ext.toolbar.Toolbar(me.getWindowBarConfig());

		me.items = [ {
			xtype : 'button',
			cls : 'ux-start-button',
			iconCls : 'ux-start-button-icon',
			menu : me.startMenu,
			menuAlign : 'bl-tl',
			text : me.startBtnText
		}, me.windowBar ];

		var sButtonThemeText = "Grey";

		if (GLOBAL.WEB_THEME == "ext-all-neptune")
			sButtonThemeText = "Neptune";

		if (GLOBAL.WEB_THEME == "ext-all")
			sButtonThemeText = "Classic";

		var button_theme = {
			"text" : sButtonThemeText,
			"menu" : []
		};

		var oListTheme = [ "Grey", "Neptune", "Classic" ];

		for ( var i = 0; i < oListTheme.length; i++) {
			button_theme.menu.push({
				text : oListTheme[i],
				handler : function() {

					var me = this;

					var oHref = location.href;

					var oQPosition = oHref.indexOf("?");

					if (oQPosition != -1) {
						location.href = oHref.substr(0, oQPosition) + '?theme=' + me.text + "&" + GLOBAL.APP.MAIN_VIEW._state_related_url;
					} else {
						location.href = oHref + '?theme=' + me.text + "&" + GLOBAL.APP.MAIN_VIEW._state_related_url;
					}

				}
			});
		}

		/*
		 * me.items.push({ xtype : 'tbtext', text : "Theme" });
		 * me.items.push(button_theme);
		 */

		var button_views = {
			"text" : GLOBAL.VIEW_ID,
			"menu" : []
		};

		var oListViews = [ "desktop", "tabs" ];

		for ( var i = 0; i < oListViews.length; i++) {
			button_views.menu.push({
				text : oListViews[i],
				handler : function() {

					var me = this;

					var oHref = location.href;

					var oQPosition = oHref.indexOf("?");

					if (oQPosition != -1) {
						location.href = oHref.substr(0, oQPosition) + '?view=' + me.text + "&theme=" + sButtonThemeText;
					} else {
						location.href = oHref + '?view=' + me.text + "&theme=" + sButtonThemeText;
					}

				}
			});
		}

		/*
		 * me.items.push({ xtype : 'tbtext', text : "View" });
		 * 
		 * me.items.push(button_views);
		 */

		if (GLOBAL.APP.configData.user.username) {
			/*
			 * If the user is registered
			 */

			var button_data = {
				"text" : GLOBAL.APP.configData["user"]["group"],
				"menu" : []
			};

			for ( var i = 0; i < GLOBAL.APP.configData["validGroups"].length; i++)
				button_data.menu.push({
					text : GLOBAL.APP.configData["validGroups"][i],
					handler : function() {

						var me = this;

						var oHref = location.href;

						var oQPosition = oHref.indexOf("?");

						if (oQPosition != -1) {

							location.href = oHref.substr(0, oQPosition) + 'changeGroup?to=' + me.text;
						} else {

							location.href = oHref + 'changeGroup?to=' + me.text;
						}

					}
				});

			me.group_button = new Ext.button.Button(button_data);

			var setup_data = {
				"text" : GLOBAL.APP.configData["setup"],
				"menu" : []
			};

			for ( var i = 0; i < GLOBAL.APP.configData["validSetups"].length; i++)
				setup_data.menu.push({
					text : GLOBAL.APP.configData["validSetups"][i],
					handler : function() {

						var me = this;

						location.href = GLOBAL.BASE_URL + 'changeSetup?to=' + me.text;

					}
				});

			me.setup_button = new Ext.button.Button(setup_data);
			me.items.push('-');
			me.items.push({
				xtype : 'tbtext',
				text : GLOBAL.APP.configData["user"]["username"] + "@"
			});

			me.items.push(me.group_button);
			me.items.push('-');
			me.items.push(me.setup_button);

		} else {

			/*
			 * If the user is not registered
			 */
			if (location.protocol === 'http:') {

				var oHref = location.href;
				var oQPosition = oHref.indexOf("?");
				var sAddr = "";

				if (oQPosition != -1) {

					sAddr = oHref.substr(0, oQPosition);

				} else {

					sAddr = oHref;

				}

				me.items.push('-');
				me.items.push({
					xtype : 'tbtext',
					text : "Visitor (<a href='https://" + location.host.replace("8080", "8443") + location.pathname + "'>Secure connection</a>)"
				});

			} else {
				me.items.push('-');
				me.items.push({
					xtype : 'tbtext',
					text : "Visitor"
				});
			}
		}

		me.callParent();

	},

	afterLayout : function() {
		var me = this;
		me.callParent();
		me.windowBar.el.on('contextmenu', me.onButtonContextMenu, me);
	},

	/**
	 * This method returns the configuration object for the Tray toolbar. A
	 * derived class can override this method, call the base version to build the
	 * config and then modify the returned object before returning it.
	 */
	getTrayConfig : function() {
		var ret = {
			width : 80,
			items : this.trayItems
		};
		delete this.trayItems;
		return ret;
	},

	getWindowBarConfig : function() {
		return {
			flex : 1,
			cls : 'ux-desktop-windowbar',
			items : [ '&#160;' ],
			layout : {
				overflowHandler : 'Scroller'
			}
		};
	},

	getWindowBtnFromEl : function(el) {
		var c = this.windowBar.getChildByElement(el);
		return c || null;
	},

	onButtonContextMenu : function(e) {
		var me = this, t = e.getTarget(), btn = me.getWindowBtnFromEl(t);
		if (btn) {
			e.stopEvent();
			me.windowMenu.theWin = btn.win;
			me.windowMenu.showBy(t);
		}
	},

	/**
	 * Function to add a (task) button within the task bar
	 * 
	 * @param {Ext.window.Window}
	 *          win The window to be referenced by the button
	 * @return {Ext.button.Button} Button object added to the task bar
	 */
	addTaskButton : function(win) {

		var config = {
			iconCls : win.iconCls,
			enableToggle : true,
			toggleGroup : 'all',
			width : 140,
			margins : '0 2 0 3',
			text : Ext.util.Format.ellipsis(win.title, 20),
			listeners : {
				click : this.onWindowBtnClick,
				scope : this
			},
			win : win
		};
		var cmp = this.windowBar.add(config);
		cmp.toggle(true);
		return cmp;
	},

	/**
	 * Event handler executed when a button is clicked
	 * 
	 * @param {Ext.button.Button}
	 *          btn Button that has been clicked
	 */
	onWindowBtnClick : function(btn) {
		var win = btn.win;

		if (win.minimized || win.hidden) {

			win.minimized = false;
			win.show();

		} else if (win.active) {

			if (!win.desktopStickMode) {
				win.minimize();
			}

		} else {

			win.toFront();

		}

		if (!("isChildWindow" in win))
			win.desktop.refreshUrlDesktopState();
	},

	/**
	 * Function to remove a (task) button within the task bar
	 * 
	 * @param {Ext.button.Button}
	 *          btn The button to be removed
	 * @return {Ext.button.Button} Button object removed from the task bar
	 */
	removeTaskButton : function(btn) {
		var found, me = this;
		me.windowBar.items.each(function(item) {
			if (item === btn) {
				found = item;
			}
			return !found;
		});
		if (found) {
			me.windowBar.remove(found);
		}
		return found;
	},

	/**
	 * Function to activate a button
	 * 
	 * @param {Ext.button.Button}
	 *          btn The button to be removed
	 */
	setActiveButton : function(btn) {
		if (btn) {
			btn.toggle(true);
		} else {
			this.windowBar.items.each(function(item) {
				if (item.isButton) {
					item.toggle(false);
				}
			});
		}
	}
});
