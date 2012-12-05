/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.ux.desktop.Desktop
 * @extends Ext.panel.Panel
 * 
 * This class manages the wallpaper, shortcuts, 
 * taskbar, desktop states, 
 * and the broadcast part for the window states.
 *          
 */
Ext.define(
	'Ext.ux.desktop.Desktop',
	{
		extend : 'Ext.panel.Panel',
		alias : 'widget.desktop',
		uses : [ 'Ext.util.MixedCollection', 'Ext.menu.Menu',
				'Ext.view.View', // dataview
				'Ext.ux.desktop.Window', 'Ext.ux.desktop.TaskBar',
				'Ext.ux.desktop.Wallpaper' ],

		activeWindowCls : 'ux-desktop-active-win',
		inactiveWindowCls : 'ux-desktop-inactive-win',
		lastActiveWindow : null,

		border : false,
		html : '&#160;',
		layout : 'fit',
		xTickSize : 1,
		yTickSize : 1,
		cache:{windows:{}},

		/**
		 * @property {Ext.ux.desktop.app} app This is the reference
		 *           to the application object
		 */
		app : null,

		/**
		 * @property {Ext.menu.Menu} windowMenu Menu that is used as
		 *           a context menu that appears when a window is
		 *           clicked within the taskbar
		 */
		windowMenu : null,

		/**
		 * @property {Ext.util.MixedCollection} windows This is the
		 *           collection of created windows (available on the
		 *           taskbar)
		 */
		windows : null,

		/**
		 * @property {Ext.menu.Menu} contextMenu Menu that is used
		 *           as a context menu for the desktop
		 */
		contextMenu : null,

		/**
		 * @cfg {Array | Store} shortcuts The items to add to the
		 *      DataView. This can be a {@link Ext.data.Store Store}
		 *      or a simple array. Items should minimally provide
		 *      the fields in the
		 *      {@link Ext.ux.desktop.ShorcutModel ShortcutModel}.
		 */
		shortcuts : null,

		/**
		 * @cfg {String} shortcutItemSelector This property is
		 *      passed to the DataView for the desktop to select
		 *      shortcut items. If the {@link #shortcutTpl} is
		 *      modified, this will probably need to be modified as
		 *      well.
		 */
		shortcutItemSelector : 'div.ux-desktop-shortcut',

		/**
		 * @cfg {String} shortcutTpl This XTemplate is used to
		 *      render items in the DataView. If this is changed,
		 *      the {@link shortcutItemSelect} will probably also
		 *      need to changed.
		 */
		shortcutTpl : [
				'<tpl for=".">',
				'<div class="ux-desktop-shortcut" id="{name}-shortcut">',
				'<div class="ux-desktop-shortcut-icon {iconCls}">',
				'<img src="',
				Ext.BLANK_IMAGE_URL,
				'" title="{name}">',
				'</div>',
				'<span class="ux-desktop-shortcut-text">{name}</span>',
				'</div>', '</tpl>', '<div class="x-clear"></div>' ],
		
		/**
		 * @property {String} currentDesktopState Name of the current active desktop state
		 */		
		currentDesktopState: "",
		/**
		 * @cfg {Object} taskbarConfig The config object for the
		 *      TaskBar.http://www.youtube.com/
		 */
		taskbarConfig : null,

		initComponent : function() {
			var me = this;

			/*
			 * The taskbar object has a taskbar and a menu that
			 * appears when we right click on a task within the
			 * taskbar
			 */
			me.windowMenu = new Ext.menu.Menu(me.createWindowMenu());

			me.bbar = me.taskbar = new Ext.ux.desktop.TaskBar(
					me.taskbarConfig);
			me.taskbar.windowMenu = me.windowMenu;

			/*
			 * Collection of windows
			 */
			me.windows = new Ext.util.MixedCollection();

			/*
			 * There is another menu the one that appears when we
			 * click somewhere on the desktop
			 */
			me.contextMenu = new Ext.menu.Menu(me
					.createDesktopMenu());

			me.items = [ {
				xtype : 'wallpaper',
				id : me.id + '_wallpaper'
			}, me.createDataView() ];

			me.callParent();

			me.shortcutsView = me.items.getAt(1);
			me.shortcutsView.on('itemclick',
					me.onShortcutItemClick, me);

			/*
			 * Setting the wallpaper
			 */
			var wallpaper = me.wallpaper;
			me.wallpaper = me.items.getAt(0);
			if (wallpaper) {
				me.setWallpaper(wallpaper, me.wallpaperStretch);
			}
		},

		/**
		 * @private click handler called when a shortcut item is
		 *          clicked
		 * @param e
		 */
		onShortcutItemClick : function(dataView, record) {
			var me = this, module = me.app
					.getModule(record.data.module), win = module
					&& module.createWindow();

			if (win) {
				me.restoreWindow(win);
			} else
				me.app.createWindow(record.data.module);

		},
		
		afterRender : function() {
			var me = this;
			me.callParent();
			me.el.on('contextmenu', me.onDesktopMenu, me);
		},

		/**
		 * Overridable configuration method for the shortcuts
		 * presented on the desktop
		 * 
		 * @return Object
		 */
		createDataView : function() {
			var me = this;
			return {
				xtype : 'dataview',
				overItemCls : 'x-view-over',
				trackOver : true,
				itemSelector : me.shortcutItemSelector,
				store : me.shortcuts,
				style : {
					position : 'absolute'
				},
				x : 0,
				y : 0,
				tpl : new Ext.XTemplate(me.shortcutTpl)
			};
		},

		/**
		 * Overridable configuration method for the desktop context
		 * menu (contextMenu)
		 * 
		 * @return Object
		 */
		createDesktopMenu : function() {
			var me = this, ret = {
				items : me.contextMenuItems || []
			};
			
			//reading the existing states of the desktop for that user
			me.statesMenu = new Ext.menu.Menu();
			
			Ext.Ajax.request({
			    url: 'UP/listAppState',
			    params: {
			        app: 	"desktop",
			        obj: 	"desktop"
			    },
			    scope:me,
			    success: function(response){
			    	
			    	var me = this;
			    	var states = Ext.JSON.decode(response.responseText);
			    	me.cache.desktop={};
			    	
			    	for (var stateName in states) {	
			    		
			    		var newItem = Ext.create('Ext.menu.Item', {
										    			  text: stateName,
										    			  handler: Ext.bind(me.oprLoadDesktopState, me, [stateName], false),
										    			  scope:me
										    		});
			    		
			    		me.statesMenu.add(newItem);
			    		
			    		me.cache.desktop[stateName]=states[stateName];
			    		
			    	}
			    	
			    	
			    }
			});
			
			ret.items.push(
				
				{
					text : 'Tile',
					handler : me.tileWindows,
					scope : me,
					iconCls : "toolbar-other-tile",
					minWindows : 1
				}, {
					text : 'Cascade',
					handler : me.cascadeWindows,
					scope : me,
					iconCls : "toolbar-other-cascade",
					minWindows : 1
				},
				'-',
				{
					text : "Load state",
					iconCls : "toolbar-other-load",
					menu : me.statesMenu
				}, {
					text : "Save",
					iconCls : "toolbar-other-save",
					handler:me.oprSaveDesktopState,
					minWindows : 1,
					scope: me
				},{
					text : "Save As ...",
					iconCls : "toolbar-other-save",
					handler : me.formSaveState,
					minWindows : 1,
					scope: me
				},{
					text : "Refresh states",
					iconCls : "toolbar-other-refresh",
					handler:me.oprRefreshAllDesktopStates,
					scope: me
				},{
					text : "Manage states ...",
					iconCls : "toolbar-other-manage",
					handler : me.formManageStates,//function(){alert("TDMMMMM");},//me.formManageStates,
					scope: me
				}
			)

			return ret;
		},
		
		
		/**
		 * Function to tile the windows within the available desktop
		 * space
		 */
		tileWindows : function() {
			var me = this, availWidth = me.body.getWidth(true);
			var x = me.xTickSize, y = me.yTickSize, nextY = y;

			me.windows.each(function(win) {
				if (win.isVisible() && !win.maximized) {
					var w = win.el.getWidth();

					// Wrap to next row if we are not at the line
					// start and this Window will
					// go off the end
					if (x > me.xTickSize && x + w > availWidth) {
						x = me.xTickSize;
						y = nextY;
					}

					win.setPosition(x, y);
					x += w + me.xTickSize;
					nextY = Math.max(nextY, y + win.el.getHeight()
							+ me.yTickSize);
				}
			});
		},

		/**
		 * Function to arrange the windows in a cascade order
		 */
		cascadeWindows : function() {
			var x = 0, y = 0, zmgr = this.getDesktopZIndexManager();

			zmgr.eachBottomUp(function(win) {
				if (win.isWindow && win.isVisible()
						&& !win.maximized) {
					win.setPosition(x, y);
					x += 20;
					y += 20;
				}
			});
		},

		/**
		 * Overridable configuration method for the taskbar window
		 * menu (windowMenu)
		 * 
		 * @return Object
		 */
		createWindowMenu : function() {
			var me = this;
			return {
				defaultAlign : 'br-tr',
				items : [ {
					text : 'Restore',
					handler : me.onWindowMenuRestore,
					scope : me
				}, {
					text : 'Minimize',
					handler : me.onWindowMenuMinimize,
					scope : me
				}, {
					text : 'Maximize',
					handler : me.onWindowMenuMaximize,
					scope : me
				}, '-', {
					text : 'Close',
					handler : me.onWindowMenuClose,
					scope : me
				} ],
				listeners : {
					beforeshow : me.onWindowMenuBeforeShow,
					hide : me.onWindowMenuHide,
					scope : me
				}
			};
		},

		/**
		 * @private Handler called before the window taskbar menu
		 *          appears. It is used to disable enable some
		 *          operations within that menu.
		 */
		onWindowMenuBeforeShow : function(menu) {
			var items = menu.items.items, win = menu.theWin;
			items[0].setDisabled(win.maximized !== true
					&& win.hidden !== true); // Restore
			items[1].setDisabled(win.minimized === true); // Minimize
			items[2].setDisabled(win.maximized === true
					|| win.hidden === true); // Maximize
		},

		/**
		 * @private Handler called when the Close option is choicen
		 *          from the window taskbar menu
		 */
		onWindowMenuClose : function() {
			var me = this, win = me.windowMenu.theWin;

			win.close();
		},

		/**
		 * @private Handler called when the Maximize option is
		 *          choicen from the window taskbar menu
		 */
		onWindowMenuMaximize : function() {
			var me = this, win = me.windowMenu.theWin;

			win.maximize();
			win.toFront();
		},

		/**
		 * @private Handler called when the Minimize option is
		 *          choicen from the window taskbar menu
		 */
		onWindowMenuMinimize : function() {
			var me = this, win = me.windowMenu.theWin;

			win.minimize();
		},

		/**
		 * @private Handler called when the Restore option is
		 *          choicen from the window taskbar menu
		 */
		onWindowMenuRestore : function() {
			var me = this, win = me.windowMenu.theWin;

			me.restoreWindow(win);
		},

		/**
		 * @private Handler called when the window taskbar menu gets
		 *          hidden
		 * @param menu
		 */
		onWindowMenuHide : function(menu) {
			menu.theWin = null;
		},

		// ----------------------------------------------------------------------------------------

		/**
		 * @private Handler called before the desktop context menu 
		 * @param e
		 */
		onDesktopMenu : function(e) {
			var me = this, menu = me.contextMenu;
			e.stopEvent();
			if (!menu.rendered) {
				menu.on('beforeshow', me.onDesktopMenuBeforeShow,
						me);
			}
			menu.showAt(e.getXY());
			menu.doConstrain();
		},

		/**
		 * @private Handler called before the desktop context menu is shown
		 * 			This function serves to disable or enable some 
		 * 			operations that have minWindows property defined 
		 * @param menu This parametear can be used in other menus as well.
		 */
		onDesktopMenuBeforeShow : function(menu) {
			var me = this, count = me.windows.getCount();

			menu.items.each(function(item) {
				var min = item.minWindows || 0;
				item.setDisabled(count < min);
			});
		},

		/**
		 * Function to get the wallpaper object
		 */
		getWallpaper : function() {
			return this.wallpaper.wallpaper;
		},

		/**
		 * Function to set the wallpaper
		 * 
		 * @param {String}
		 *            wallpaper Physical path to the wallpaper image
		 * @param {boolean}
		 *            stretch If it is true then the wallpaper will
		 *            be streched, otherwise not
		 */
		setWallpaper : function(wallpaper, stretch) {
			this.wallpaper.setWallpaper(wallpaper, stretch);
			return this;
		},

		/**
		 * @private
		 */
		setTickSize : function(xTickSize, yTickSize) {
			var me = this, xt = me.xTickSize = xTickSize, yt = me.yTickSize = (arguments.length > 1) ? yTickSize
					: xt;

			me.windows.each(function(win) {
				var dd = win.dd, resizer = win.resizer;
				dd.xTickSize = xt;
				dd.yTickSize = yt;
				resizer.widthIncrement = xt;
				resizer.heightIncrement = yt;
			});
		},

		// ------------------------------------------------------
		// Window management methods

		/**
		 * Function to get the top active window
		 * 
		 * @return {Ext.window.Window}
		 */
		getActiveWindow : function() {
			var win = null, zmgr = this.getDesktopZIndexManager();

			if (zmgr) {
				// We cannot rely on activate/deactive because that
				// fires against non-Window
				// components in the stack.

				zmgr.eachTopDown(function(comp) {
					if (comp.isWindow && !comp.hidden) {
						win = comp;
						return false;
					}
					return true;
				});
			}

			return win;
		},

		/**
		 * @private
		 */
		getDesktopZIndexManager : function() {
			var windows = this.windows;
			// TODO - there has to be a better way to get this...
			return (windows.getCount() && windows.getAt(0).zIndexManager)
					|| null;
		},

		getWindow : function(id) {
			return this.windows.get(id);
		},

		/**
		 * @private Handler called when the window gets minimized
		 * @param {Ext.window.Window}
		 *            win The window object getting minimized
		 */
		minimizeWindow : function(win) {
			win.minimized = true;
			win.hide();
		},

		/**
		 * @private Handler called when the window gets restored
		 * @param {Ext.window.Window}
		 *            win The window object getting minimized
		 */
		restoreWindow : function(win) {
			if (win.isVisible()) {
				win.restore();
				win.toFront();
			} else {
				win.show();
			}
			return win;
		},

		/**
		 * @private Handler called when the window gets closed
		 * @param {Ext.window.Window}
		 *            win The object window getting closed
		 */
		onWindowClose : function(win) {
			var me = this;
			me.windows.remove(win);
			/*
			 * If the number of windows get 0, 
			 * the current desktop state is cleared
			 */
			if(me.windows.getCount()==0)
				me.currentDesktopState='';
			me.taskbar.removeTaskButton(win.taskButton);
			me.updateActiveWindow();
		},

		/**
		 * Function that is used by modules to create windows with
		 * some content. This function does configuration of the
		 * window object.
		 * 
		 * @param {Object}
		 *            config Configuration and content of the window
		 * @param {Object}
		 *            cls
		 */
		
		createWindow : function(config, cls) {
			var me = this, win, cfg = Ext.applyIf(config || {}, {
				stateful : false,
				isWindow : true,
				constrainHeader : true,
				minimizable : true,
				maximizable : true
			});

			cls = cls || Ext.ux.desktop.Window;
			win = me.add(new cls(cfg));

			me.windows.add(win);

			win.taskButton = me.taskbar.addTaskButton(win);

			win.on({
				activate : me.updateActiveWindow,
				beforeshow : me.updateActiveWindow,
				deactivate : me.updateActiveWindow,
				minimize : me.minimizeWindow,
				destroy : me.onWindowClose,
				scope : me
			});

			win.on({
				boxready : function() {
					win.dd.xTickSize = me.xTickSize;
					win.dd.yTickSize = me.yTickSize;

					if (win.resizer) {
						win.resizer.widthIncrement = me.xTickSize;
						win.resizer.heightIncrement = me.yTickSize;
					}
				},
				single : true
			});

			// replace normal window close
			win.doClose = function() {
				win.el.disableShadow();

				win.destroy();
				win.doClose = Ext.emptyFn;
			};

			return win;
		},

		/**
		 * @private Function to update the active window
		 */
		updateActiveWindow : function() {
			var me = this, activeWindow = me.getActiveWindow(), last = me.lastActiveWindow;
			if (activeWindow === last) {
				return;
			}

			if (last) {
				if (last.el.dom) {
					last.addCls(me.inactiveWindowCls);
					last.removeCls(me.activeWindowCls);
				}
				last.active = false;
			}

			me.lastActiveWindow = activeWindow;

			if (activeWindow) {
				activeWindow.addCls(me.activeWindowCls);
				activeWindow.removeCls(me.inactiveWindowCls);
				activeWindow.minimized = false;
				activeWindow.active = true;
			}

			me.taskbar.setActiveButton(activeWindow
					&& activeWindow.taskButton);
		},
		
		/*
		 * -------------------------BROADCAST METHODS FOR THE ACTIVE WINDOWS-------------------------
		 */
		
		/**
		 * Function to add new state to the instances of the same module
		 * @param {String} stateName This is the name od the state
		 * @param {String} appName Name of the module 
		 * @param {Object} stateData Data of the module that define its state 
		 */
		addStateToExistingWindows: function(stateName, appName, stateData){
			
			var me=this;
			
			me.cache.windows[appName][stateName]=stateData;
			
			me.windows.each(function(item,index,len){
				if(item.getAppClassName() == appName)
					item.addNewState(stateName);
			});
			
		},
		
		/**
		 * Function used to refresh the states of a certain module (application)
		 * and to update all instances of the module that are active at the moment
		 * @param {String} appName Name of the module (application)
		 */
		oprRefreshAllAppStates: function(appName){
			
			var me = this;
			
			me.cache.windows[appName]=null;
			
			Ext.Ajax.request({
			    url: 'UP/listAppState',
			    params: {
			        app: 	appName,
			        obj: 	"application"
			    },
			    scope:me,
			    success: function(response){
			    	
			    	var me = this;
			    	var states = Ext.JSON.decode(response.responseText);
			    	
			    	me.cache.windows[appName]=states;
			    	
			    	me.windows.each(function(item,index,len){
						if(item.getAppClassName() == appName)
							item.oprRefreshAppStates();
					});
			    	
			    }
			});
			
		},
		
		/**
		 * Function to check if a  
		 * state of a module is currently active (has been loaded)
		 * @param {String} stateName Name of the state
		 * @param {String} appName Name of the module (application)
		 * @return {Boolean}
		 */
		isAnyActiveState: function(stateName,appName){
			
			var me = this;
			var oFound = false;
			
			for(var i=0,len=me.windows.getCount();i<len;i++){
				
				if((me.windows.getAt(i).getCurrentState() == stateName) && (me.windows.getAt(i).getAppClassName() == appName)){
					
					oFound = true;
					break;
					
				}
				
			}
			
			return oFound;
			
		},
		
		/**
		 * Function to remove a state from the state lists of the 
		 * instances of the same module
		 * @param {String} stateName Name of the state
		 * @param {String} appName Name of the module (application) 
		 */
		removeStateFromWindows: function(stateName, appName){
			
			var me=this;
			
			delete me.cache.windows[appName][stateName]; 
		
			me.windows.each(function(item,index,len){
				if(item.getAppClassName() == appName)
					item.removeState(stateName);
			});
			
		},
		
		/*
		 * -------------------------END: BROADCAST METHODS FOR THE ACTIVE WINDOWS-------------------------
		 */
		
		/*
		 * ---------------------------------MANAGEMENT OF DESKTOP STATES--------------------------------------------
		 */
		
		/**
		 * Function that is executed when the Save button 
		 * of the Save As form is pressed 
		 */
		oprSaveAsDesktopState : function() {
			
			var me = this;
									
			if (me.saveForm.getForm().isValid()) {
				
				var stateName = me.saveForm.getForm().findField("state_name").getValue();
				
				if(!me.isExistingState(stateName)){
					
					me.oprSendDataForSave(stateName,true);
					
				}else{
					
					Ext.MessageBox.alert('Message','State name already exists !');
					
				}
				
			}
			
		},
		
		/**
		 * Function to check if a state exists 
		 * among the list of desktop states
		 * @param {String} stateName The name of the state
		 */
		isExistingState:function(stateName){
			var me = this;

			if( stateName in me.cache.desktop)
				return true;
			else
				return false;
	
		},
		
		/**
		 * Function to load a desktop state 
		 * @param {String} stateName The name of the state
		 */
		oprLoadDesktopState: function(stateName){
			
			/*
			 * First we have to check whether some other state is currently in use
			 * so we have to give possibility to choose whether they want to continue to the chosen 
			 * state or not
			 */
			
			
			var me = this;
			var count = me.windows.getCount();
			
			if(count >0){
				
				/*
				 * Two cases:
				 * 	- There is an active desktop state
				 *  - There is no active desktop state 
				 */
				if(me.currentDesktopState == ''){
				
					var ret=Ext.MessageBox.confirm('Confirm', 'Are you sure you want to close windows without saving them ?',
						function(button) {
							
							var me = this;
						    if (button === 'yes') {
						    	
						    	me.closeAllActiveWindows();
						    	
						    	me.loadDesktopStateData(stateName);
						    	
						    }
					    },me);
					
				}else{
					
					var ret=Ext.MessageBox.confirm('Confirm', 'There is an active desktop state. Do you want to save the state before we load the new one ?',
							function(button) {
								
								var me = this;
							    if (button === 'yes') {
							    	me.oprSendDataForSave(me.currentDesktopState,false);
							    }
							    
							    me.closeAllActiveWindows();
						    	me.loadDesktopStateData(stateName);
						    	
						    },me);
					
				}
			}else{
				
				me.loadDesktopStateData(stateName);
				
			}
			
		},
		
		/**
		 * Function to create all windows from a desktop state
		 * @param {String} stateName The name of the state 
		 */
		loadDesktopStateData:function(stateName){
			
			var me = this;
			
			//get the state from the cache
			var stateData = me.cache.desktop[stateName];
			
			for(var i=0,len=stateData["data"].length;i<len;i++){
				
				var appStateData = stateData["data"][i];
				
				me.app.createWindow(appStateData.name,appStateData);
				
				
			}
			
			me.currentDesktopState = stateName;
			
		},
		
		/**
		 * Function to close all active windows
		 */
		closeAllActiveWindows: function(){
			
			var me = this;
			
			me.windows.each(function(win) {
				
				win.close();
				
			});
	
			
		},
		
		/**
		 * Function to create and open the 
		 * form for managing the desktop states
		 */
		formManageStates: function(){
			
			var me = this;

			me.manageForm = Ext.widget(
					'form',
					{
						layout : {
							type : 'vbox',
							align : 'stretch'
						},
						border : false,
						bodyPadding : 10,

						fieldDefaults : {
							labelAlign : 'top',
							labelWidth : 100,
							labelStyle : 'font-weight:bold'
						},
						defaults : {
							margins : '0 0 10 0'
						},
						items : [
									{
										 html: "<b>DESKTOP</b> states",
									    xtype: "box"
									},
									{
										 html: "<select size='10' multiple='multiple' style='width:100%'></select>",
								         xtype: "box"
									}
								],

						buttons : [
								{
									text : 'Delete selected states',
									handler : me.oprDeleteSelectedStates,
									scope: me
								},   
								{
									text : 'Cancel',
									handler : function() {
										me.manageWindow.hide();
									},
									scope: me
								}
								 ]
					});
			
			me.manageWindow = Ext.create('widget.window', {
				height : 300,
				width : 500,
				title : 'Manage states',
				layout : 'fit',
				modal: true,
				items : me.manageForm
			});
			
			me.manageWindow.show();
			me.fillSelectFieldWithStates();
			
		},
		
		/**
		 * Function to delete selected desktop states 
		 */
		oprDeleteSelectedStates: function(){
			
			var me = this;
			var oSelectField = document.getElementById(me.manageForm.getId()).getElementsByTagName("select")[0];
			
			for (var i = oSelectField.length - 1; i>=0; i--) {
			    if (oSelectField.options[i].selected) {
			    	
			    /*
			     * First we check whether there are instances of that 
			     * state that are active
			     */	

			      var oStateName=oSelectField.options[i].value;	
			    	
			      if(! (me.currentDesktopState==oStateName) ){
			    	  
			    	  
			    	  Ext.Ajax.request({
						    url: 'UP/delAppState',
						    params: {
						    	app: "desktop",
						    	name: 	oStateName,
						        obj: "desktop"
						    },
						    success:Ext.bind(me.oprDeleteSelectedStates_s, me, [i,oSelectField], false) 
						});
			    	  
			      }else
			    	  Ext.MessageBox.alert('Message','The state <b>'+oSelectField.options[i].value+'</b> you are willing to delete is curently in use !');
			    	
			    	
			      
			    }
			}
			
		},
		
		/**
		 * Callback of the oprDeleteSelectedStates function
		 * @param {Integer} index index of the selected element
		 * @param {DOMObject} oSelectEl the select element of the management form 
		 */
		oprDeleteSelectedStates_s: function(index,oSelectEl){
			
			var me = this;
			
			var oStateName = oSelectEl.options[index].value;
			
			for(var i=0;i<me.statesMenu.items.length;i++){
				
				if(me.statesMenu.items.getAt(i).text==oStateName){
					
					me.statesMenu.remove(me.statesMenu.items.getAt(i));
					break;
					
				}
				
			}
			
			oSelectEl.remove(index);
			
		},
		
		/**
		 * Function to fill the select element 
		 * with the existing desktop states
		 */
		fillSelectFieldWithStates: function(){
			
			var me = this;
			var oSelectEl = document.getElementById(me.manageForm.getId()).getElementsByTagName("select")[0];
			
			for (i = oSelectEl.length - 1; i>=0; i--) 
				oSelectEl.remove(i);
			
			for(var stateName in me.loadedObject.app.getDesktop().cache.windows[me.appClassName]){
				
				  var elOptNew = document.createElement('option');
				  elOptNew.text = stateName;
				  elOptNew.value = stateName;

				  try {
					  oSelectEl.add(elOptNew, null); // standards compliant; doesn't work in IE
				  }
				  catch(ex) {
					  oSelectEl.add(elOptNew); // IE only
				  }
				  
			}
			  
		},
		
		/**
		 * Function to refresh the list of desktop states
		 */
		oprRefreshAllDesktopStates: function(){
			
			var me = this;
			
			me.statesMenu.removeAll();
			delete me.cache.desktop;//[stateName]=states[stateName];
			me.cache.desktop = {};
			
			Ext.Ajax.request({
			    url: 'UP/listAppState',
			    params: {
			        app: 	"desktop",
			        obj: 	"desktop"
			    },
			    scope:me,
			    success: function(response){
			    	
			    	var me = this;
			    	var states = Ext.JSON.decode(response.responseText);
			    	me.cache.desktop={};
			    	
			    	for (var stateName in states) {	
			    		
			    		var newItem = Ext.create('Ext.menu.Item', {
										    			  text: stateName,
										    			  handler: Ext.bind(me.oprLoadDesktopState, me, [stateName], false),
										    			  scope:me
										    		});
			    		
			    		me.cache.desktop[stateName]=states[stateName];
			    		
			    		me.statesMenu.add(newItem);
			    		
			    	}
			    	
			    	
			    }
			});
			
		},
		/**
		 * Function called when the Save button 
		 * from the desktop context menu is clicked 
		 */
		oprSaveDesktopState : function() {
			
			var me = this;
			
			if(me.currentDesktopState == ""){
				
				me.formSaveState();
				
			}else{
				
				me.oprSendDataForSave(me.currentDesktopState,false);
			}
		},
		/**
		 * Function called when the Save As ... button
		 * from the desktop context menu is clicked
		 */
		formSaveState : function() {
			
			var me = this;

			me.saveForm = Ext.widget(
					'form',
					{
						layout : {
							type : 'vbox',
							align : 'stretch'
						},
						border : false,
						bodyPadding : 10,

						fieldDefaults : {
							labelAlign : 'top',
							labelWidth : 100,
							labelStyle : 'font-weight:bold'
						},
						defaults : {
							margins : '0 0 5 0'
						},
						items : [
								{
									xtype : 'fieldcontainer',
									layout : 'hbox',
									defaultType : 'textfield',

									fieldDefaults : {
										labelAlign : 'left'
									},

									items : [{
												flex : 1,
												fieldLabel: 'State Name',
												name : 'state_name',
												allowBlank : false
											}]
								}],

						buttons : [
								{
									text : 'Save',
									handler : me.oprSaveAsDesktopState,
									scope: me
								},   
								{
									text : 'Cancel',
									handler : function() {
										me.saveForm.getForm().reset();						
										me.saveWindow.hide();
									},
									scope: me
								}
								 ]
					});
			
			me.saveWindow = Ext.create('widget.window', {
				height : 120,
				width : 500,
				title : 'Save state',
				layout : 'fit',
				modal: true,
				items : me.saveForm
			});
			
			me.saveWindow.show();

		},	
		/**
		 * Function that is used to prepare and send 
		 * the data of the desktop state to the server.
		 * @param {String} stateName The name of the state
		 * @param {Boolean} isNewItem Parameter that says whether the state already exists or not 
		 */
		oprSendDataForSave: function (stateName,isNewItem){
			
			var me = this;
			
			var dataToSend = {"data":[]};
			
			me.windows.each(function(win) {
				
				
				dataToSend.data.push(
						{
							name: win.getAppClassName(),
							currentState: win.currentState,
							data: win.loadedObject.getStateData(),
							x: win.x,
							y: win.y,
							width: win.getWidth(),
							height: win.getHeight()
							
						}
				
				
				);

			});

			
			Ext.Ajax.request({
			    url: 'UP/saveAppState',
			    params: {
			        app: 	"desktop",
			        name: 	stateName,
			        state: 	Ext.JSON.encode(dataToSend),
			        obj: "desktop"
			    },
			    scope:me,
			    success: function(response){
			    	var me = this;
			    	Ext.MessageBox.alert('Message','State saved successfully !');
			    	if(isNewItem){
			    		var newItem = Ext.create('Ext.menu.Item', {
			    			  text: stateName,
			    			  handler: Ext.bind(me.oprLoadDesktopState, me, [stateName], false),
			    			  scope:me
			    		});

						me.statesMenu.add(newItem);
						
						me.cache.desktop[stateName]=dataToSend;
						me.saveForm.getForm().reset();
						me.saveWindow.hide();
			    	}else
			    		me.cache.desktop[stateName]=dataToSend;
			    	
			    	me.currentDesktopState = stateName;
					
			    }
			});
			
		}
		
		/*
		 * ---------------------------------END: MANAGEMENT OF DESKTOP STATES--------------------------------------------
		 */
	});
