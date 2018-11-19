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

		
		me.items.push({ xtype : 'tbtext', text : "View" });
		 
		me.items.push(button_views);

		var getAuthCFG = function(Auth = '',Value = ''){
			var req = Ext.Ajax.request({
				url: GLOBAL.BASE_URL + 'Authentication/getAuthCFG',
				params: {
					typeauth: Auth,
					value: Value
				},
				async: false
			}).responseText
			res = JSON.parse(req)
			if (Object.keys(res).includes('Value')) {
				res = res.Value
			}
			return res
		};

		// OIDC login method
		var oAuth2LogIn = function(settings,name) {
			var manager = new Oidc.UserManager(settings);
			manager.events.addUserLoaded(function (loadedUser) { console.log(loadedUser) });
			manager.events.addSilentRenewError(function (error) {
				GLOBAL.APP.CF.log("error", "error while renewing the access token");
			});
			manager.events.addUserSignedOut(function () {
				GLOBAL.APP.CF.alert('The user has signed out',"info");
			});
			manager.events.addUserLoaded(function(loadedUser) {
				if (loadedUser && typeof loadedUser === 'string') {
					loadedUser = JSON.parse(data);
				}
				if (loadedUser) {
					loadedUser = JSON.stringify(loadedUser, null, 2);
				}
				var aJson = JSON.parse(loadedUser);
				var access_token = aJson["access_token"];
				Ext.Ajax.request({
					url: GLOBAL.BASE_URL + 'Authentication/auth',
					params: { 
						typeauth: name,
						value: access_token
					},
					success: function(response){
						var response = Ext.JSON.decode(response.responseText);
						if (response.value == 'Done') {location.protocol = "https:"} 
						else { 
							Ext.create('Ext.window.Window', {
								title: 'Welcome',
								layout: 'fit',
								preventBodyReset: true,
								closable: true,
								html: '<br><b>Welcome to the DIRAC service '+ response.profile['given_name'] +'!</b><br><br>Sorry, but You are not registred as a DIRAC user.<br>',
								buttons : [
									{
										text    : 'Registration',
										handler : function() {
											Ext.Ajax.request({
												url: GLOBAL.BASE_URL + 'Authentication/sendRequest',
												params: { 
													typeauth: name,
													value: response.profile
												},
												success: function() { GLOBAL.APP.CF.alert('Your request was sent.','info')	}
											});
											this.up('window').close();
										}
									}
								]
							}).show();
						}
					}
				});
			});
			manager.signinPopup().catch(function(error){
				GLOBAL.APP.CF.log("error", 'error while logging in through the popup');
			});
		} 

		// Generate list of login buttons
		var oListAuth = getAuthCFG()
		var currentAuth = Ext.Ajax.request({
			url: GLOBAL.BASE_URL + 'Authentication/getCurrentAuth',
			perams: {},
			async: false
		}).responseText
		var button_usrname = {
			"text" : "Visitor",
			"menu" : []
		};

		// HTTP used only for visitors
		if (location.protocol === 'http:') {
			button_usrname.menu.push({
				text : 'Log in (switch to https://)',
				handler: function() {location.protocol = "https:"}
			});
		} else {
			if (Array.isArray(oListAuth) || (currentAuth == "Visitor")) {
				button_usrname.menu.push({
					xtype: 'tbtext',
					text : 'Log in:'
				});
			}
			for (var i = 0; i < oListAuth.length; i++) {
				var name = oListAuth[i]
				var settings = getAuthCFG(name,'all')
				if (name != currentAuth) {
					button_usrname.menu.push({
						'text' : name,
						'settings': settings,
						'handler' : function() {
							if (this.settings.method == 'oAuth2') {oAuth2LogIn(this.settings,this.text)}
							else if (settings.method) {
								GLOBAL.APP.CF.alert("Authentication method " + settings.method + " is not supported." ,'error')
							}
							else {
								GLOBAL.APP.CF.alert("Authentication method is not set." ,'error')
							}
						}
					})
				}
			}
			// default authentication method
			if (currentAuth != "Certificate") {
				button_usrname.menu.push({
					'text' : "Certificate",
					'handler' : function() {
						Ext.Ajax.request({
								url: GLOBAL.BASE_URL + 'Authentication/auth',
								params: {
									typeauth: 'Certificate',
									value: ''
								},
								success: function() { location.protocol = "https:" }
						})
					}
				})
			}
			if (currentAuth != 'Visitor') {
				if (Array.isArray(oListAuth)) {
					button_usrname.menu.push({xtype: 'menuseparator'})
				}
				button_usrname.menu.push({
					text : 'Log out',
					handler : function(){
						Ext.Ajax.request({
							url: GLOBAL.BASE_URL + 'Authentication/auth',
							params: {
								typeauth: 'Logout',
								value: 'None'
							},
							success: function(response){
								console.log(response.responseText)
								location.protocol = "https:"
							}
						});
					}
				});
				button_usrname.menu.push()
			}
		}
		if (GLOBAL.APP.configData.user.username) {
			/*
			 * If the user is registered
			 */
			
			button_usrname.text = GLOBAL.APP.configData["user"]["username"];
			me.usrname_button = new Ext.button.Button(button_usrname);

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
			me.items.push(me.usrname_button);
			me.items.push({
				xtype: 'tbtext',
				text: '@'
			});
			me.items.push(me.group_button);
			me.items.push('-');
			me.items.push(me.setup_button);

		} else {

			/*
			 * If the user is not registered
			 */
			me.usrname_button = new Ext.button.Button(button_usrname);
			me.items.push('-');
			me.items.push(button_usrname);
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
