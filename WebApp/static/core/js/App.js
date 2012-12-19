/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.ux.desktop.App
 * This class manages the entire application platform
 * @mixins Ext.util.Observable
 * 
 */
Ext.define(
	'Ext.ux.desktop.App',
	{
		mixins : {
			observable : 'Ext.util.Observable'
		},

		requires : [ 'Ext.container.Viewport',
				'Ext.ux.desktop.Desktop', 'Ext.window.MessageBox',
				'Ext.ux.desktop.ShortcutModel' ],
		/**
		 * @property {boolean} isReady
		 */
		isReady : false,

		/**
		 * @property {List} modules This a list containg data for
		 *           the allowed user modules
		 */
		modules : null,

		/**
		 * @property {List} useQuickTips ?
		 */			

		useQuickTips : true,
		
		/**
		 * @property {int} _uid_counter Counter used to assigne unique number to a module that can be used as a part of the id-s within the loaded module
		 */
		_uid_counter:0,

		constructor : function(configData) {

			var me = this;

			me.addEvents('ready', 'beforeunload');

			me.mixins.observable.constructor.call(this, undefined);

			if (Ext.isReady) {
				Ext.Function.defer(me.init, 10, me);
			} else {
				Ext.onReady(me.init, me);
			}

			me.configData = configData;
			console.log(configData);
			me.callParent();

		},

		init : function() {

			var me = this, desktopCfg;

			/*
			 * ?
			 */
			if (me.useQuickTips) {
				Ext.QuickTips.init();
			}

			/*
			 * Creating the main desktop obbject
			 */
			desktopCfg = me.getDesktopConfig();
			me.desktop = new Ext.ux.desktop.Desktop(desktopCfg);

			me.viewport = new Ext.container.Viewport({
				layout : 'fit',
				items : [ me.desktop ]
			});

			Ext.EventManager.on(window, 'beforeunload',
					me.onUnload, me);

			me.isReady = true;
			me.fireEvent('ready', me);
		},

		/**
		 * This method returns the configuration object for the
		 * Desktop object.
		 * 
		 * @return Object
		 */
		getDesktopConfig : function() {
			var me = this, cfg = {
				app : me,
				taskbarConfig : me.getTaskbarConfig()
			};

			Ext.apply(cfg, me.desktopConfig);

			return Ext
					.apply(
							cfg,
							{

								contextMenuItems : [ 
//								   {
//									text : 'Change Settings',
//									handler : me.onSettings,
//									scope : me
//								   } 
								  ],

								shortcuts : Ext
										.create(
												'Ext.data.Store',
												{
													model : 'Ext.ux.desktop.ShortcutModel',
													data : {}
												}),

								wallpaper : '/DIRAC/static/core/wallpapers/desktop.jpg',
								wallpaperStretch : true
							});

			return cfg;
		},

		/**
		 * This method returns the configuration object for the
		 * TaskBar.
		 * 
		 * @return Object
		 */
		getTaskbarConfig : function() {
			var me = this, cfg = {
				app : me,
				startConfig : me.getStartConfig()
			};

			Ext.apply(cfg, me.taskbarConfig);

			return Ext.apply(cfg, {
				quickStart : [ 
//				{
//					name : 'Accordion Window',
//					iconCls : 'accordion',
//					module : 'DIRAC.AccordionWindow'
//				}, {
//					name : 'Grid Window',
//					iconCls : 'icon-grid',
//					module : 'DIRAC.GridWindow'
//				} 
				]
//				,trayItems : [ {
//					xtype : 'trayclock',
//					flex : 1
//				} ]
			});

			return cfg;
		},
		/**
		 * This method is used to recursively read the data about the start menu
		 * @return {Object}
		 */
		getMenuStructureRec:function(item){
			
			var me=this;
			
			if(item.length==2){
				
				var result = {text:item[0],menu:[]};
				
				for(var i=0;i<item[1].length;i++)
					result.menu.push(me.getMenuStructureRec(item[1][i]));
				
				return result;
				
			}else{
				
				return {
							text:item[1],
							handler:Ext.bind(me.createWindow, me,[item[0],item[2],((item[0]=="app")?null:{title:item[1]})])
						};
				
			}
			
		},
		
		/**
		 * This method returns the configuration object for the
		 * Start Button.
		 * 
		 * @return {Object}
		 */
		getStartConfig : function() {
			var me = this, cfg = {
				app : me,
				menu : []
			}, launcher;
			
			Ext.apply(cfg, me.startConfig);
			
			for(var j=0;j<me.configData["menu"].length;j++)
				cfg.menu.push(me.getMenuStructureRec(me.configData["menu"][j]));
			
			return Ext.apply(cfg, {
				title : ((me.configData.user.username)?me.configData["user"]["username"]+"@"+me.configData["user"]["group"]:"Anonymous"),
				iconCls : 'user',
				height : 300,
				toolConfig : {
					width : 100,
//					items : [ 
//					{
//						text : 'Settings',
//						iconCls : 'settings',
//						handler : me.onSettings,
//						scope : me
//					}, '-', {
//						text : 'Logout',
//						iconCls : 'logout',
//						handler : me.onLogout,
//						scope : me
//					} ]
				}
			});

			return cfg;
		},

		/**
		 * Function to create a window and to load the module
		 * defined by the moduleName
		 * 
		 * @param {String}
		 *            moduleName The name of the module (the
		 *            JavaScript class) to be loaded
		 */
		createWindow : function(loadedObjectType,moduleName,setupData) {
			
			
			if(loadedObjectType =="app"){
				var oParts = moduleName.split(".");
				var sStartClass="";
				if(oParts.length==2)
					sStartClass=moduleName+".classes."+oParts[1];
				else
					sStartClass=moduleName;
				
				Ext.require(sStartClass, function() {
					
					var me = this;
					var instance = Ext.create(sStartClass);
					instance.setUID(++me._uid_counter);	
					var config = {
							desktop: me.desktop,
							setupData: setupData,
							loadedObject:instance,
							loadedObjectType:"app"
						};

					var window = me.desktop.createWindow(config);
					
					window.show();
					
				},this);
			
			}else if(loadedObjectType == "link"){
				
				var win = this.desktop.createWindow({
				  setupData:setupData,
                  loadedObjectType:"link",
                  linkToLoad:moduleName
                });

				win.show();
				
			}
			
		},

		/**
		 * Getter of the desktop object
		 * 
		 * @return {Ext.ux.desktop.Desktop}
		 */
		getDesktop : function() {
			return this.desktop;
		},

		onReady : function(fn, scope) {
			if (this.isReady) {
				fn.call(scope, this);
			} else {
				this.on({
					ready : fn,
					scope : scope,
					single : true
				});
			}
		},

		onUnload : function(e) {
			if (this.fireEvent('beforeunload', this) === false) {
				e.stopEvent();
			}
		},

		onLogout : function() {
			Ext.Msg.confirm('Logout',
					'Are you sure you want to logout?');
		}

	});
