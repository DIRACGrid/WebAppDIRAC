/**
 * @class Ext.dirac.views.desktop.Main
 * @extends Ext.panel.Panel
 * 
 * This class manages the wallpaper, shortcuts, taskbar, desktop states, and the
 * broadcast part for the window states.
 * 
 */
Ext.define('Ext.dirac.views.desktop.Main', {
	extend : 'Ext.panel.Panel',
	alias : 'widget.desktop',
	requires : [ 'Ext.util.MixedCollection', 'Ext.menu.Menu', 'Ext.view.View', 'Ext.dirac.views.desktop.Window', 'Ext.dirac.views.desktop.TaskBar', 'Ext.dirac.views.desktop.Wallpaper',
			'Ext.dirac.views.desktop.StateManagement', 'Ext.dirac.views.desktop.ShortcutModel' ],
	mixins : [ "Ext.dirac.core.Stateful", "Ext.dirac.core.AppView" ],

	activeWindowCls : 'ux-desktop-active-win',
	inactiveWindowCls : 'ux-desktop-inactive-win',
	lastActiveWindow : null,

	border : false,
	html : '&#160;',
	layout : 'fit',
	xTickSize : 1,
	yTickSize : 1,
	registerStartMenus : {},

	/**
	 * @property {Ext.menu.Menu} windowMenu Menu that is used as a context menu
	 *           that appears when a window is clicked within the taskbar
	 */
	windowMenu : null,

	/**
	 * @property {Ext.util.MixedCollection} windows This is the collection of
	 *           created windows (available on the taskbar)
	 */
	windows : null,

	/**
	 * @property {Ext.menu.Menu} contextMenu Menu that is used as a context menu
	 *           for the desktop
	 */
	contextMenu : null,

	/**
	 * @cfg {Array | Store} shortcuts The items to add to the DataView. This can
	 *      be a {@link Ext.data.Store Store} or a simple array. Items should
	 *      minimally provide the fields in the
	 *      {@link Ext.dirac.views.desktop.ShorcutModel ShortcutModel}.
	 */
	shortcuts : null,

	/**
	 * @cfg {String} shortcutItemSelector This property is passed to the DataView
	 *      for the desktop to select shortcut items. If the {@link #shortcutTpl}
	 *      is modified, this will probably need to be modified as well.
	 */
	shortcutItemSelector : 'div.ux-desktop-shortcut',

	/**
	 * @cfg {String} shortcutTpl This XTemplate is used to render items in the
	 *      DataView. If this is changed, the {@link shortcutItemSelect} will
	 *      probably also need to changed.
	 */
	shortcutTpl : [ '<tpl for=".">', '<div class="ux-desktop-shortcut" id="{name}-shortcut">', '<div class="ux-desktop-shortcut-icon {iconCls}">', '<img src="', Ext.BLANK_IMAGE_URL,
			'" title="{name}">', '</div>', '<span class="ux-desktop-shortcut-text">{name}</span>', '</div>', '</tpl>', '<div class="x-clear"></div>' ],
	/**
	 * @cfg {Object} taskbarConfig The config object for the
	 *      TaskBar.http://www.youtube.com/
	 */
	taskbarConfig : null,

	/**
	 * @cfg {Array} desktopGranularity Defines the dimension of the matrix used
	 *      for pinning apps
	 */
	desktopGranularity : [ 12, 12 ],

	stateDataStructureVersion : 1,

	wallpaper : GLOBAL.ROOT_URL + 'static/core/img/wallpapers/dirac_background_6.png',

	wallpaperStretch : false,

	getStateData : function() {

		var me = this;

		var oData = {
			"dirac_view" : 1,
			"version" : GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION,
			"data" : [],
			"views" : {
				"desktop" : {
					"version" : me.stateDataStructureVersion,
					"desktopGranularity" : me.desktopGranularity,
					"positions" : []
				}
			}
		};

		me.windows.each(function(win) {

			/*
			 * First we check whether the window is not a child window
			 */

			if (!win.isChildWindow) {

				/*
				 * Depends on the loadedObjectType
				 */
				var oElem = null;

				if (win.loadedObjectType == "app") {

					oData.data.push({
						module : win.getAppClassName(),
						data : win.loadedObject.getStateData(),
						currentState : win.currentState
					});

					oData.views.desktop.positions.push({
						x : win.x,
						y : win.y,
						width : win.getWidth(),
						height : win.getHeight(),
						maximized : win.maximized,
						minimized : win.minimized,
						zIndex : win.zIndex,
						loadedObjectType : win.loadedObjectType,
						desktopStickMode : ((win.desktopStickMode) ? 1 : 0),
						headerHidden : ((win.getHeader().hidden) ? 1 : 0),
						i_x : win.i_x,
						i_y : win.i_y,
						ic_x : win.ic_x,
						ic_y : win.ic_y,
						_before_pin_state : win._before_pin_state
					});

				} else if (win.loadedObjectType == "link") {

					oData.data.push({
						link : win.linkToLoad
					});

					oData.views.desktop.positions.push({
						title : win.title,
						x : win.x,
						y : win.y,
						width : win.getWidth(),
						height : win.getHeight(),
						maximized : win.maximized,
						minimized : win.minimized,
						zIndex : win.zIndex,
						loadedObjectType : win.loadedObjectType,
						desktopStickMode : ((win.desktopStickMode) ? 1 : 0),
						headerHidden : ((win.getHeader().hidden) ? 1 : 0),
						i_x : win.i_x,
						i_y : win.i_y,
						ic_x : win.ic_x,
						ic_y : win.ic_y,
						_before_pin_state : win._before_pin_state
					});

				}

			}

		});

		return oData;

	},

	loadState : function(oData) {

		var me = this;

		if (me.ID in oData["views"]) {
			/*
			 * The case when the the views.desktop does not exists has to be supported !
			 */
			me.desktopGranularity = oData["views"]["desktop"]["desktopGranularity"];

			me.takenCells = [];

			for ( var i = 0; i < me.desktopGranularity[0]; i++) {

				me.takenCells.push([]);

				for ( var j = 0; j < me.desktopGranularity[1]; j++) {

					me.takenCells[i].push(false);

				}

			}

			var iWidth = me.getWidth();
			var iHeight = me.getHeight() - me.taskbar.getHeight();

			me.boxSizeX = 1.0 * iWidth / me.desktopGranularity[1];
			me.boxSizeY = 1.0 * iHeight / me.desktopGranularity[0];

			for ( var i = 0, len = oData["views"]["desktop"]["positions"].length; i < len; i++) {

				var oAppStateData = oData["views"]["desktop"]["positions"][i];

				if ("module" in oData["data"][i]) {

					oAppStateData.name = oData["data"][i].module;
					oAppStateData.data = oData["data"][i].data;
					oAppStateData.currentState = oData["data"][i].currentState;
					me.createWindow(oAppStateData.loadedObjectType, oAppStateData.name, oAppStateData);
				}
			}
		} else {

			// we have to clean the takenCells matrix
			me.setDesktopMatrixCells(0, me.desktopGranularity[0] - 1, 0, me.desktopGranularity[1] - 1, false);

			for ( var i = 0, len = oData["data"].length; i < len; i++) {

				if ("module" in oData["data"][i]) {

					var oAppStateData = {};

					oAppStateData.name = oData["data"][i].module;
					oAppStateData.data = oData["data"][i].data;
					oAppStateData.currentState = oData["data"][i].currentState;

					me.createWindow("app", oAppStateData.name, oAppStateData);
				}
			}

		}

	},

	initComponent : function() {
		var me = this;

		me.ID = "desktop";

		// the width of a desktop cell used for pinning
		me.boxSizeX = 0;
		// the height of a desktop cell used for pinning
		me.boxSizeY = 0;

		/*
		 * The taskbar object has a taskbar and a menu that appears when we right
		 * click on a task within the taskbar
		 */
		me.windowMenu = new Ext.menu.Menu(me.createWindowMenu());

		me.SM = new Ext.dirac.views.desktop.StateManagement();
		me.bbar = me.taskbar = new Ext.dirac.views.desktop.TaskBar(me.taskbarConfig);
		me.taskbar.windowMenu = me.windowMenu;

		/*
		 * Collection of windows
		 */
		me.windows = new Ext.util.MixedCollection();

		/*
		 * There is another menu the one that appears when we click somewhere on the
		 * desktop
		 */
		me.contextMenu = new Ext.menu.Menu(me.createDesktopMenu());

		me.shortcuts = Ext.create('Ext.data.Store', {
			model : 'Ext.dirac.views.desktop.ShortcutModel',
			data : {}
		});

		me.contextMenuItems = [];

		me.items = [ {
			xtype : 'wallpaper',
			id : me.id + '_wallpaper'
		}, me.createDataView() ];

		me.callParent(arguments);

		/*
		 * Setting the wallpaper
		 */

		var wallpaper = me.wallpaper;
		me.wallpaper = me.items.getAt(0);
		if (wallpaper) {
			me.setWallpaper(wallpaper, me.wallpaperStretch);
		}

		// the matrix that registers what cells from the desktop are
		// taken and what are not
		me.takenCells = [];

		for ( var i = 0; i < me.desktopGranularity[0]; i++) {

			me.takenCells.push([]);

			for ( var j = 0; j < me.desktopGranularity[1]; j++) {

				me.takenCells[i].push(false);

			}

		}

		me._state_related_url = "";

	},

	/**
	 * @private method executed after the desktop has been rendered
	 */
	afterRender : function() {
		var me = this;
		me.callParent();
		me.el.on('contextmenu', me.onDesktopMenu, me);

		// load the state of the desktop described in the URL
		me.__oprLoadUrlState();

	},

	listeners : {

		/**
		 * @private Resize event handler. All existing windows are being resized.
		 */
		resize : function(oComp, w, h, ow, oh, eOpts) {

			var me = oComp;

			var iWidth = me.getWidth();
			var iHeight = me.getHeight() - me.taskbar.getHeight();

			// we calculate the new dimensions of the cells
			me.boxSizeX = 1.0 * iWidth / me.desktopGranularity[1];
			me.boxSizeY = 1.0 * iHeight / me.desktopGranularity[0];

			// we resize each window, which is pinned
			me.windows.each(function(win) {
				if (win.desktopStickMode) {

					var oPos = [ 0, 0 ];

					oPos[0] = Math.round(win.i_x * me.boxSizeX);
					oPos[1] = Math.round(win.i_y * me.boxSizeY);

					win._x = oPos[0];
					win._y = oPos[1];

					win.suspendEvent("resize");
					win.suspendEvent("move");
					win.setPosition(oPos[0], oPos[1]);
					win.setSize(Math.round(me.boxSizeX * win.ic_x), Math.round(me.boxSizeY * win.ic_y));
					win.resumeEvent("resize");
					win.resumeEvent("move");

				} else {

					var ratioWidth = 1.0 * w / ow;
					var ratioHeight = 1.0 * h / oh;

					var oPos = [ 0, 0 ];

					oPos[0] = Math.round(ratioWidth * win.x);
					oPos[1] = Math.round(ratioHeight * win.y);

					win.suspendEvent("resize");
					win.suspendEvent("move");
					win.setPosition(oPos[0], oPos[1]);
					win.setSize(Math.round(ratioWidth * win.width), Math.round(ratioHeight * win.height));
					win.resumeEvent("resize");
					win.resumeEvent("move");

				}
			});

		}

	},

	/**
	 * @private Method called to load the state of the desktop described in the
	 *          URL. This method is called after the desktop has been rendered.
	 */
	__oprLoadUrlState : function() {

		var me = this;

		var oValid = true;

		if (GLOBAL.OPEN_APP != "") {

			me.createWindow("app", GLOBAL.OPEN_APP, {
				maximized : true
			});

			return;
		}

		GLOBAL.URL_STATE = Ext.util.Format.trim(GLOBAL.URL_STATE);

		// if the URL state is not empty
		if (GLOBAL.URL_STATE.length != "") {

			// we get two parts of the URL state
			var oParts = GLOBAL.URL_STATE.split("|");

			// if the number of parts differ from 2, it means that it is
			// a mistake
			if (oParts.length != 2) {

				me.refreshUrlDesktopState();
				return;

			}

			// if the indicator for desktop loaded state is not valid
			if ((parseInt(oParts[0], 10) != 0) && (parseInt(oParts[0], 10) != 1)) {

				oValid = false;

			}

			/*
			 * if the indicator for desktop loaded state is 0, it means that no
			 * desktop state has been loaded, but only particular apps
			 */
			if (parseInt(oParts[0], 10) == 0) {

				var oApps = oParts[1].split("^");

				// for each application in the URL state
				for ( var i = 0; i < oApps.length; i++) {

					var oAppParts = oApps[i].split(":");

					/*
					 * for each application there must be 8 data describing their state
					 * Each application is described with 8 parameters [A:B:C:D:E:F:G:H] A -
					 * the name of the main app class B - the name of a state. If no state
					 * is loaded then B is empty C - X position at the desktop D - Y
					 * position at the desktop E - Width of the window F - Height of the
					 * window G - Indicator whether the app is in minimized state (-1),
					 * maximized state (1). 0 otherwise. H - [P1,P2,P3,P4,P5,P6] P1 - 0 if
					 * the app is pinned; 1 if the app is pinned P2 - 0 if the header is
					 * visible; 1 if the header is hidden P3 - X matrix index if the app
					 * is pinned P4 - Y matrix index if the app is pinned P5 - Number of
					 * cells regarding the X axis the app takes P6 - Number of cells
					 * regarding the Y axis the app takes
					 */
					if (oAppParts.length != 8) {

						oValid = false;
						break;

					}

					/*
					 * if the application is valid i.e. it can be accessed by the user and
					 * the other data are valid
					 */
					if (!GLOBAL.APP.isValidApplication(oAppParts[0]) || isNaN(parseInt(oAppParts[2], 10)) || isNaN(parseInt(oAppParts[3], 10)) || isNaN(parseInt(oAppParts[4], 10))
							|| isNaN(parseInt(oAppParts[5], 10)) || isNaN(parseInt(oAppParts[6], 10))) {

						oValid = false;
						break;

					}

				}

			}

			// in the case of loaded desktop state, we check whether a
			// name of the desktop state exists
			if (parseInt(oParts[0], 10) == 1) {

				if (Ext.util.Format.trim(oParts[1]) == "") {

					oValid = false;

				}

			}

		}

		if (oValid) {

			var oParts = GLOBAL.URL_STATE.split("|");

			if ((oParts.length != 2) || (Ext.util.Format.trim(oParts[1]).length == 0))
				return;

			if (parseInt(oParts[0], 10) == 0) {
				// non desktop state
				var oApps = oParts[1].split("^");

				for ( var i = 0, len = oApps.length; i < len; i++) {

					/*
					 * For each application we prepare the data before we load into a
					 * window.
					 */
					var oAppItems = oApps[i].split(":");

					var oSetupData = {};

					if (Ext.util.Format.trim(oAppItems[1]) != "")
						oSetupData.stateToLoad = oAppItems[1];

					oSetupData.x = oAppItems[2];
					oSetupData.y = oAppItems[3];
					oSetupData.width = oAppItems[4];
					oSetupData.height = oAppItems[5];

					var oPinnedData = oAppItems[7].split(",");
					oSetupData.desktopStickMode = parseInt(oPinnedData[0], 10);
					oSetupData.hiddenHeader = parseInt(oPinnedData[1], 10);
					oSetupData.i_x = parseInt(oPinnedData[2], 10);
					oSetupData.i_y = parseInt(oPinnedData[3], 10);
					oSetupData.ic_x = parseInt(oPinnedData[4], 10);
					oSetupData.ic_y = parseInt(oPinnedData[5], 10);

					switch (Ext.util.Format.trim(oAppItems[6])) {

					case "1":
						oSetupData.maximized = true;
						break;
					case "-1":
						oSetupData.minimized = true;
						break;

					}

					me.createWindow("app", oAppItems[0], oSetupData);

				}

			} else {
				// desktop state
				me.oprLoadDesktopState(oParts[1]);
			}

		} else {

			// if the data are not valid, we refresh the URL in the
			// browser
			me.refreshUrlDesktopState();

		}

	},

	/**
	 * Overridable configuration method for the shortcuts presented on the desktop
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
	 * Overridable configuration method for the desktop context menu (contextMenu)
	 * 
	 * @return Object
	 */
	createDesktopMenu : function() {
		var me = this, ret = {
			items : me.contextMenuItems || []
		};

		// reading the existing states of the desktop for that user
		me.statesMenu = new Ext.menu.Menu();

		var oFunc = function(iCode, sAppName) {
			me.oprReadDesktopStatesFromCache();
		};

		/*
		 * if the state management is enabled, first we read the states and the
		 * references and then we load them into the desktop menu.
		 */

		if (GLOBAL.STATE_MANAGEMENT_ENABLED)
			GLOBAL.APP.SM.oprReadApplicationStatesAndReferences("desktop", oFunc);// OK

		/*
		 * Function that is executed after a state has been saved
		 */
		var funcAfterSave = function(iCode, sAppName, sStateType, sStateName) {

			if ((iCode == 1) && (me.currentState != sStateName)) {

				// we create new item
				var oNewItem = Ext.create('Ext.menu.Item', {
					text : sStateName,
					handler : Ext.bind(me.oprLoadDesktopState, me, [ sStateName ], false),
					scope : me,
					iconCls : "dirac-icon-state",
					minWidth : 200,
					menu : [ {
						text : "Share state",
						stateName : sStateName,
						handler : function() {

							var oThisItem = this;

							GLOBAL.APP.SM.oprShareState("desktop", oThisItem.stateName, function(rCode, rAppName, rStateName, rMessage) {

								if (rCode == 1) {

									var oHtml = "";
									oHtml += "<div style='padding:5px'>The string you can send is as follows:</div>";
									oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

									Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + rStateName + "</span> state:", oHtml);

								}

							});

						},
						iconCls : "dirac-icon-share"
					} ]
				});

				// and we insert at the beginning of the menu
				me.statesMenu.insert(0, oNewItem);

				// if there is an active desktop state, we have to remove it
				if (me.currentState != "")
					GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.currentState);// OK

				// if there is a state, we set it as an active state
				me.currentState = sStateName;
				GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);// OK
				me.refreshUrlDesktopState();

				if (me.SM.saveWindow)
					me.SM.saveWindow.close();

			}

		};

		/*
		 * Function that is executed after a state has been removed
		 */
		var funcAfterRemove = function(sStateType, sAppName, sStateName) {

			// we only remove the item from the desktop menu
			for ( var i = 0; i < me.statesMenu.items.length; i++) {

				if (me.statesMenu.items.getAt(i).text == sStateName) {

					me.statesMenu.remove(me.statesMenu.items.getAt(i));
					break;

				}

			}

		}

		// we create the items of the desktop menu
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
		});

		// we append the items for state management, only if the state
		// management is enabled
		if (GLOBAL.STATE_MANAGEMENT_ENABLED)
			ret.items.push('-', {
				text : "Load state",
				iconCls : "toolbar-other-load",
				menu : me.statesMenu
			}, {
				text : "Save",
				iconCls : "dirac-icon-save",
				handler : Ext.bind(me.SM.oprSaveAppState, me.SM, [ "application", "desktop", me, funcAfterSave ], false),
				minWindows : 1,
				scope : me
			}, {
				text : "Save As ...",
				iconCls : "dirac-icon-save",
				handler : Ext.bind(me.SM.formSaveState, me.SM, [ "application", "desktop", me, funcAfterSave ], false),
				minWindows : 1,
				scope : me
			}, {
				text : "Refresh states",
				iconCls : "toolbar-other-refresh",
				handler : me.oprRefreshAllDesktopStates,
				scope : me
			}, {
				text : "Manage states ...",
				iconCls : "toolbar-other-manage",
				handler : Ext.bind(me.SM.formManageStates, me.SM, [ "desktop", funcAfterRemove ], false),
				scope : me
			})

		return ret;
	},

	/**
	 * @private Method called to load the desktop states into the desktop menu
	 *          after they've been read from the server.
	 */
	oprReadDesktopStatesFromCache : function() {

		var me = this;

		me.statesMenu.removeAll();

		// creating items for the states
		var oStates = GLOBAL.APP.SM.getApplicationStates("application", "desktop");// OK

		for ( var i = 0, len = oStates.length; i < len; i++) {

			var sStateName = oStates[i];

			var newItem = Ext.create('Ext.menu.Item', {
				text : sStateName,
				handler : Ext.bind(me.oprLoadDesktopState, me, [ sStateName ], false),
				scope : me,
				iconCls : "dirac-icon-state",
				stateType : "application",
				minWidth : 200,
				menu : [ {
					text : "Share state",
					stateName : sStateName,
					handler : function() {

						var oThisItem = this;

						GLOBAL.APP.SM.oprShareState("desktop", oThisItem.stateName, function(rCode, rAppName, rStateName, rMessage) {

							if (rCode == 1) {

								var oHtml = "";
								oHtml += "<div style='padding:5px'>The string you can send is as follows:</div>";
								oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

								Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + rStateName + "</span> state:", oHtml);

							}

						});

					},
					iconCls : "dirac-icon-share"
				} ]
			});

			me.statesMenu.add(newItem);

		}

		me.statesMenu.add("-");

		// creating items for the state links
		var oRefs = GLOBAL.APP.SM.getApplicationStates("reference", "desktop");// OK

		for ( var i = 0, len = oRefs.length; i < len; i++) {

			var sStateName = oRefs[i];

			var newItem = Ext.create('Ext.menu.Item', {
				text : sStateName,
				handler : Ext.bind(me.loadSharedStateByName, me, [ "desktop", sStateName ], false),
				scope : me,
				iconCls : "dirac-icon-link",
				stateType : "reference",
				minWidth : 200
			});

			me.statesMenu.add(newItem);

		}

	},

	/**
	 * Function to tile the windows within the available desktop space
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
				nextY = Math.max(nextY, y + win.el.getHeight() + me.yTickSize);
			}
		});
	},

	/**
	 * Function to arrange the windows in a cascade order
	 */
	cascadeWindows : function() {
		var x = 0, y = 0, zmgr = this.getDesktopZIndexManager();

		zmgr.eachBottomUp(function(win) {
			if (win.isWindow && win.isVisible() && !win.maximized) {
				win.setPosition(x, y);
				x += 20;
				y += 20;
			}
		});
	},

	/**
	 * Overridable configuration method for the taskbar window menu (windowMenu)
	 * 
	 * @return Object
	 */
	createWindowMenu : function() {
		var me = this;

		return {
			defaultAlign : 'br-tr',
			items : [ {
				text : 'Save/Load state',
				scope : me,
				menu : new Ext.menu.Menu()
			}, "-", {
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
				text : 'Pin',
				handler : me.onWindowMenuPin,
				scope : me
			}, {
				text : 'Show header',
				handler : me.onWindowMenuHeader,
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
	 * @private Handler called before the window taskbar menu appears. It is used
	 *          to disable enable some operations within that menu.
	 */
	onWindowMenuBeforeShow : function(menu) {
		var me = this;

		var items = menu.items.items, win = menu.theWin;

		if (win.desktopStickMode) {
			// if the active window is pinned, then restore, minimize,
			// maximize items are disabled
			items[2].setDisabled(true);
			items[3].setDisabled(true);
			items[4].setDisabled(true);

		} else {

			items[2].setDisabled(win.maximized !== true && win.hidden !== true); // Restore
			items[3].setDisabled(win.minimized === true); // Minimize
			items[4].setDisabled(win.maximized === true || win.hidden === true); // Maximize

		}

		// We copy the menu from the window

		if (win.loadedObjectType == "link") {

			items[0].hide();
			items[1].hide();

		} else if (win.loadedObjectType == "app") {

			items[0].show();
			items[1].show();

			items[0].menu = win.loadMenu;
			// setting the Pin/Unpin text
			if (win.desktopStickMode) {

				items[6].setText("Unpin");

			} else {

				items[6].setText("Pin");

			}

			// setting the Show/Hide header text
			if (win.getHeader().hidden) {

				items[7].setText("Show header");

			} else {

				items[7].setText("Hide header");

			}

		}
	},

	/**
	 * @private Handler called when the Close option is choicen from the window
	 *          taskbar menu
	 */
	onWindowMenuClose : function() {
		var me = this, win = me.windowMenu.theWin;
		win.close();
	},

	/**
	 * @private Handler called when the Maximize option is choicen from the window
	 *          taskbar menu
	 */
	onWindowMenuMaximize : function() {
		var me = this, win = me.windowMenu.theWin;
		win.maximize();
	},

	/**
	 * @private Handler called when the Minimize option is choicen from the window
	 *          taskbar menu
	 */
	onWindowMenuMinimize : function() {
		var me = this, win = me.windowMenu.theWin;
		win.minimize();
	},

	/**
	 * @private Handler called when the Pin/Unpin option is choicen from the
	 *          window taskbar menu
	 */
	onWindowMenuPin : function() {
		var me = this, win = me.windowMenu.theWin;
		var items = me.windowMenu.items.items;

		me.setDesktopStickMode(win);

		if (win.desktopStickMode) {

			items[6].setText("Unpin");

		} else {

			items[6].setText("Pin");

		}

		me.refreshUrlDesktopState();

	},

	/**
	 * @private Handler called when the Show/Hide header option is choicen from
	 *          the window taskbar menu
	 */
	onWindowMenuHeader : function() {
		var me = this, win = me.windowMenu.theWin;
		var items = me.windowMenu.items.items;

		if (win.getHeader().hidden) {

			items[7].setText("Hide header");
			win.getHeader().show();

		} else {

			items[7].setText("Show header");
			win.getHeader().hide();

		}

		me.refreshUrlDesktopState();

	},

	/**
	 * @private Handler called when the Restore option is choicen from the window
	 *          taskbar menu
	 */
	onWindowMenuRestore : function() {
		var me = this, oWin = me.windowMenu.theWin;
		oWin.restore();
		oWin.minimized = false;
		me.refreshUrlDesktopState();
	},

	/**
	 * @private Handler called when the window taskbar menu gets hidden
	 * @param menu
	 */
	onWindowMenuHide : function(menu) {

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
			menu.on('beforeshow', me.onDesktopMenuBeforeShow, me);
		}
		menu.showAt(e.getXY());
		menu.doConstrain();
	},

	/**
	 * @private Handler called before the desktop context menu is shown This
	 *          function serves to disable or enable some operations that have
	 *          minWindows property defined
	 * @param menu
	 *          This parametear can be used in other menus as well.
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
	 *          wallpaper Physical path to the wallpaper image
	 * @param {boolean}
	 *          stretch If it is true then the wallpaper will be streched,
	 *          otherwise not
	 */
	setWallpaper : function(wallpaper, stretch) {
		this.wallpaper.setWallpaper(wallpaper, stretch);
		return this;
	},

	/**
	 * @private
	 */
	setTickSize : function(xTickSize, yTickSize) {
		var me = this, xt = me.xTickSize = xTickSize, yt = me.yTickSize = (arguments.length > 1) ? yTickSize : xt;

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
		return (windows.getCount() && windows.getAt(0).zIndexManager) || null;
	},

	getWindow : function(id) {
		return this.windows.get(id);
	},

	/**
	 * @private Handler called when the window gets minimized
	 * @param {Ext.window.Window}
	 *          win The window object getting minimized
	 */
	minimizeWindow : function(win) {
		win.minimized = true;
		this.refreshUrlDesktopState();
		win.hide();
	},

	/**
	 * @private Handler called when the window gets maximized
	 * @param {Ext.window.Window}
	 *          win The window object getting maximized
	 */
	maximizeWindow : function(win) {
		win.getHeader().hide();
		win.minimized = false;
		win.toFront();
	},

	/**
	 * @private Handler called when the window gets closed
	 * @param {Ext.window.Window}
	 *          win The object window getting closed
	 */
	onWindowClose : function(win) {
		var me = this;

		if (win.parentWindow)
			win.parentWindow.removeChildWindowFromList(win);

		me.windows.remove(win);
		/*
		 * If the number of windows get 0, the current desktop state is cleared
		 */
		if (me.windows.getCount() == 0) {

			if (me.currentState != "")
				GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.currentState);// OK

			me.currentState = '';
			me.refreshUrlDesktopState();
		}
		me.taskbar.removeTaskButton(win.taskButton);
		me.updateDeactiveWindow();

		/*
		 * Close all other child windows
		 */

		for ( var i = win.childWindows.length - 1; i >= 0; i--) {
			if (win.childWindows[i] != null) {
				console.log(win.childWindows[i].title);
				win.childWindows[i].close();
			}
		}

		/*
		 * if it is not child window remove the current state out of active states
		 */
		if (!win.isChildWindow) {
			if (win.currentState != "")
				GLOBAL.APP.SM.oprRemoveActiveState(win.loadedObject.self.getName(), win.currentState);// OK

			me.refreshUrlDesktopState();
		}

		/*
		 * if the window was pinned we free all the cells taken by the application
		 */
		if (win.desktopGridStickButton) {
			if (win.desktopGridStickButton.type == "unpin") {

				me.setDesktopMatrixCells(win.i_x, win.i_x + win.ic_x - 1, win.i_y, win.i_y + win.ic_y - 1, false);

			}
		}

	},

	/**
	 * @private Handler called when the window gets moved
	 * @param {Ext.window.Window}
	 *          oWindow The object window getting moved
	 * @param {int}
	 *          iX The X coordinate of the window
	 * @param {int}
	 *          iY The Y coordinate of the window
	 */
	onWindowMove : function(oWindow, iX, iY, eOpts) {

		var me = this;

		// if the window is in the pinned state
		if (oWindow.desktopStickMode) {

			// if the mouse is within the constraints of the window
			// header
			if ((GLOBAL.MOUSE_X >= oWindow.x) && (GLOBAL.MOUSE_X <= oWindow.x + oWindow.getWidth()) && (GLOBAL.MOUSE_Y >= oWindow.y) && (GLOBAL.MOUSE_Y <= oWindow.y + oWindow.getHeader().getHeight())) {

				// we calculate the distance of the mouse cursor
				// regarding X and Y axes
				var oXDiff = GLOBAL.MOUSE_X - iX;
				var oYDiff = GLOBAL.MOUSE_Y - iY;

				var oBox = me.getBoxSize();

				// calculation of the new X and Y coordinates of the
				// cursor
				var oNewX = iX + oXDiff % oBox[0];
				var oNewY = iY + oYDiff % oBox[1];

				// geting the cell where the new cursor coordinates lay
				var oCell = me.getGridCell(oNewX, oNewY, false);

				/*
				 * we check whether the cells needed by the app starting from the oCell,
				 * are not taken
				 */
				var bOK = true;

				for ( var i = oCell[0]; i <= oCell[0] + oWindow.ic_x - 1; i++) {
					for ( var j = oCell[1]; j <= oCell[1] + oWindow.ic_y - 1; j++) {

						if (!((i >= oWindow.i_x) && (i <= oWindow.i_x + oWindow.ic_x - 1) && (j >= oWindow.i_y) && (j <= oWindow.i_y + oWindow.ic_y - 1))) {

							if (me.takenCells[j][i]) {

								bOK = false;
								break;

							}
						}
					}

					if (!bOK)
						break;

				}

				// if the destination cells are free i.e. not taken
				if (bOK) {

					// we free the previous cells
					me.setDesktopMatrixCells(oWindow.i_x, oWindow.i_x + oWindow.ic_x - 1, oWindow.i_y, oWindow.i_y + oWindow.ic_y - 1, false);

					// we occupy the new cells of the new position
					me.setDesktopMatrixCells(oCell[0], oCell[0] + oWindow.ic_x - 1, oCell[1], oCell[1] + oWindow.ic_y - 1, true);

					// we change the indexes of the top left cell taken
					// by the app
					oWindow.i_x = oCell[0];
					oWindow.i_y = oCell[1];

					// we record the coordinates of the application
					oWindow._x = Math.round(oWindow.i_x * oBox[0]);
					oWindow._y = Math.round(oWindow.i_y * oBox[1]);

				}

				// we apply the coordinates
				oWindow.suspendEvents(false);
				oWindow.setPosition(oWindow._x, oWindow._y);
				oWindow.resumeEvents();

			}
		}

		me.refreshUrlDesktopState();

	},

	/**
	 * @private Handler called when the window gets resized
	 * @param {Ext.window.Window}
	 *          win The object window getting resized
	 * @param {int}
	 *          iWidth The new width of the window
	 * @param {int}
	 *          iHeight The new height of the window
	 */
	onWindowResize : function(oWindow, iWidth, iHeight, eOpts) {

		var me = this;

		// if the window is in the pinned state
		if (oWindow.desktopStickMode) {

			oWindow.suspendEvents(false);
			var oBox = me.getBoxSize();

			var iPomX = oWindow.x + iWidth - 10;
			var iPomY = oWindow.y + iHeight - 10;

			// getting the indexes of the bottom right cell
			var oCell = me.getGridCell(iPomX, iPomY, true);

			/*
			 * we check whether the cells needed by the app starting from the
			 * [i_x,i_y], are not taken
			 */
			var bOK = true;
			for ( var i = oWindow.i_x; i <= oCell[0]; i++) {
				for ( var j = oWindow.i_y; j <= oCell[1]; j++) {

					if (!((i >= oWindow.i_x) && (i <= oWindow.i_x + oWindow.ic_x - 1) && (j >= oWindow.i_y) && (j <= oWindow.i_y + oWindow.ic_y - 1))) {

						if (me.takenCells[j][i]) {

							bOK = false;
							break;

						}
					}
				}

				if (!bOK)
					break;

			}

			// if the destination cells are free i.e. not taken
			if (bOK) {

				// we free the previous cells
				me.setDesktopMatrixCells(oWindow.i_x, oWindow.i_x + oWindow.ic_x - 1, oWindow.i_y, oWindow.i_y + oWindow.ic_y - 1, false);

				// we occupy the new cells of the new position
				me.setDesktopMatrixCells(oWindow.i_x, oCell[0], oWindow.i_y, oCell[1], true);

				// we set up the new cell dimensions of the window
				oWindow.ic_x = oCell[0] - oWindow.i_x + 1;
				oWindow.ic_y = oCell[1] - oWindow.i_y + 1;

			}

			// we are setting the new dimensions of the window
			oWindow.setWidth(Math.round(oWindow.ic_x * oBox[0]));
			oWindow.setHeight(Math.round(oWindow.ic_y * oBox[1]));

			oWindow.resumeEvents();

		}

		me.refreshUrlDesktopState();
	},

	/**
	 * @private Method to print the matrix of the desktop cells
	 * @param {String}
	 *          sWhere Some label that will refer to the place where this function
	 *          was called
	 */
	printTakenCellsMatrix : function(sWhere) {

		var me = this;

		console.log(sWhere);

		var s = "";

		for ( var i = 0; i < me.desktopGranularity[0]; i++) {

			for ( var j = 0; j < me.desktopGranularity[1]; j++) {

				s += " " + ((me.takenCells[i][j]) ? 1 : 0) + " ";

			}
			s += '\n';

		}

		console.log(s);

	},

	/**
	 * Function to get the indexes of the underlying cell in the desktop cell
	 * matrix regarding the cursor position (iX,iY)
	 */
	getGridCell : function(iX, iY, bWithFixNearestBorder) {

		var me = this;

		var oBox = me.getBoxSize();

		var iBoxWidth = oBox[0];
		var iBoxHeight = oBox[1];

		var iXAxis = Math.floor(iX / iBoxWidth);
		var iYAxis = Math.floor(iY / iBoxHeight);

		if (bWithFixNearestBorder) {

			var oResidualX = iX % iBoxWidth;

			if (oResidualX < (iBoxWidth / 2))
				iXAxis--;

			var oResidualY = iY % iBoxHeight;

			if (oResidualY < (iBoxHeight / 2))
				iYAxis--;

		}

		if (iXAxis >= me.desktopGranularity[1]) {
			iXAxis = me.desktopGranularity[1] - 1;
		} else if (iXAxis < 0) {

			iXAxis = 0;

		}

		if (iYAxis >= me.desktopGranularity[0]) {
			iYAxis = me.desktopGranularity[0] - 1;
		} else if (iYAxis < 0) {

			iYAxis = 0;

		}

		return [ iXAxis, iYAxis ];

	},

	/**
	 * Function to find an empty area into the desktop cell matrix with dimensions
	 * iXSize, iYSize
	 * 
	 * @param {int}
	 *          iXSize Number of cells regarding the X axis
	 * @param {int}
	 *          iYSize Number of cells regarding the Y axis
	 */
	findEmptyGridCell : function(iXSize, iYSize) {

		var me = this;
		var oFound = false;
		var oPosI = [ -1, -1 ];

		for ( var i = 0; i <= me.desktopGranularity[1] - iXSize; i++) {
			for ( var j = 0; j <= me.desktopGranularity[0] - iYSize; j++) {

				var bFree = true;

				for ( var k1 = i; k1 < i + iXSize; k1++) {
					for ( var k2 = j; k2 < j + iYSize; k2++) {

						if (me.takenCells[k2][k1]) {

							bFree = false;
							break;

						}

					}
				}

				if (bFree) {

					oPosI[0] = i;
					oPosI[1] = j;
					oFound = true;
					break;

				}

			}

			if (oFound)
				break;
		}

		return oPosI;

	},

	/**
	 * Function to activate/deactivate the pinning state of a window
	 * 
	 * @param {Ext.dirac.core.Window}
	 *          oWin The window object
	 */
	setDesktopStickMode : function(oWin) {

		var me = this;

		oWin.desktopStickMode = !oWin.desktopStickMode;

		if (oWin.desktopStickMode) {

			// First try to locate on the same place as before
			var oLocatedAsPrev = false;
			var oFindEmptyCell = [ -1, -1 ];
			var oDim = [ 2, 2 ];

			if (oWin.i_x != -1) {

				var bAreAllFree = true;

				for ( var i = oWin.i_x; i <= oWin.i_x + oWin.ic_x - 1; i++) {
					for ( var j = oWin.i_y; j <= oWin.i_y + oWin.ic_y - 1; j++) {
						if (me.takenCells[j][i]) {
							bAreAllFree = false;
							break;

						}
					}

					if (!bAreAllFree)
						break;

				}

				if (bAreAllFree) {

					oFindEmptyCell = [ oWin.i_x, oWin.i_y ];
					oDim = [ oWin.ic_x, oWin.ic_y ];
					oLocatedAsPrev = true;

				}

			}

			if (!oLocatedAsPrev) {

				oFindEmptyCell = me.findEmptyGridCell(oDim[0], oDim[1]);

				if (oFindEmptyCell[0] == -1) {
					oDim = [ 1, 1 ];
					oFindEmptyCell = me.findEmptyGridCell(oDim[0], oDim[1]);
				}

			}

			if (oFindEmptyCell[0] >= 0) {

				var oPos = [ 0, 0 ];
				var oBox = me.getBoxSize();

				oPos[0] = Math.round(oFindEmptyCell[0] * oBox[0]);
				oPos[1] = Math.round(oFindEmptyCell[1] * oBox[1]);

				oWin._before_pin_state = {
					x : oWin.x,
					y : oWin.y,
					width : oWin.getWidth(),
					height : oWin.getHeight(),
					maximized : oWin.maximized,
					minimized : oWin.minimized
				};

				oWin._x = oPos[0];
				oWin._y = oPos[1];
				oWin.i_x = oFindEmptyCell[0];
				oWin.i_y = oFindEmptyCell[1];
				oWin.ic_x = oDim[0];
				oWin.ic_y = oDim[1];

				me.setDesktopMatrixCells(oWin.i_x, oWin.i_x + oWin.ic_x - 1, oWin.i_y, oWin.i_y + oWin.ic_y - 1, true);

				oWin.suspendEvents(false);

				oWin.restore();
				oWin.toFront();
				oWin.minimized = false;

				oWin.setPosition(oPos[0], oPos[1]);
				oWin.setSize(Math.round(oBox[0] * oDim[0]), Math.round(oBox[1] * oDim[1]));
				oWin.resumeEvents();
				oWin.desktopGridStickButton.setType("unpin");

				oWin.getHeader().show();

				/*
				 * Hide minimize, maximize, restore
				 */

				oWin.tools[3].hide();
				oWin.tools[4].hide();
				oWin.tools[5].hide();
				oWin.taskButton.setIconCls("system_pin_window");

			} else {

				GLOBAL.APP.CF.alert("No available space on the desktop can be found !", "warning");
				oWin.desktopStickMode = false;

			}

		} else {

			me.setDesktopMatrixCells(oWin.i_x, oWin.i_x + oWin.ic_x - 1, oWin.i_y, oWin.i_y + oWin.ic_y - 1, false);

			/*
			 * Show minimize, maximize, restore
			 */
			oWin.tools[3].show();
			oWin.tools[4].show();
			oWin.tools[5].show();

			oWin.loadWindowFrameState(oWin._before_pin_state);

			oWin.desktopGridStickButton.setType("pin");

			oWin.taskButton.setIconCls("notepad");

		}

		me.refreshUrlDesktopState();
	},

	/**
	 * Function to set/unset the cells of particular region of the desktop cells
	 * matrix
	 * 
	 * 
	 * @param {int}
	 *          iXMin Starting X index
	 * @param {int}
	 *          iXMax Ending X index
	 * @param {int}
	 *          iYMin Starting Y index
	 * @param {int}
	 *          iYMax Ending Y index
	 * @param {boolean}
	 *          bSetValue The setter value
	 * 
	 */
	setDesktopMatrixCells : function(iXMin, iXMax, iYMin, iYMax, bSetValue) {

		var me = this;

		for ( var i = iXMin; i <= iXMax; i++) {
			for ( var j = iYMin; j <= iYMax; j++) {
				me.takenCells[j][i] = bSetValue;
			}
		}

	},

	/**
	 * Function to create a window and to load the module defined by the
	 * moduleName
	 * 
	 * @param {String}
	 *          loadedObjectType The type of the object to be loaded [app|link]
	 * @param {String}
	 *          moduleName The name of the module (the JavaScript class) to be
	 *          loaded
	 * @param {String}
	 *          setupData Data needed by the app during loading process
	 * 
	 */
	createWindow : function(loadedObjectType, moduleName, setupData) {

		Ext.get("app-dirac-loading").show();

		if (loadedObjectType == "app") {

			var oParts = moduleName.split(".");
			var sStartClass = "";

			if (oParts.length == 2)
				sStartClass = moduleName + ".classes." + oParts[1];
			else
				sStartClass = moduleName;

			// if the development mod is off, we set up diffrent path to
			// load javascript
			if (GLOBAL.DEV == 0) {

				var oConfig = {
					enabled : true,
					paths : {}
				};

				oConfig["paths"][oParts[0] + "." + oParts[1] + ".classes"] = "static/" + oParts[0] + "/" + oParts[1] + "/build";

				Ext.Loader.setConfig(oConfig);

			}

			Ext.require(sStartClass, function() {

				var me = this;

				// creating an object of the demeanded application
				var instance = Ext.create(sStartClass, {
					launcherElements : {
						title : 'Module',
						iconCls : 'notepad',
						width : 0,
						height : 0,
						maximized : true,
						x : null,
						y : null
					}
				});

				var config = {
					desktop : me,
					setupData : setupData,
					loadedObject : instance,
					loadedObjectType : "app"
				};

				// initializing window
				var window = me.initWindow(config);

				// showing window
				window.show();

			}, this);

		} else if (loadedObjectType == "link") {
			var me = this;

			var window = me.initWindow({
				setupData : setupData,
				loadedObjectType : "link",
				linkToLoad : moduleName
			});

			// showing window
			window.show();

		}

	},

	/**
	 * Function that is used by modules to create windows with some content. This
	 * function does configuration of the window object.
	 * 
	 * @param {Object}
	 *          config Configuration and content of the window
	 */

	initWindow : function(config) {

		var me = this, win, cfg = Ext.applyIf(config || {}, {
			stateful : false,
			isWindow : true,
			constrainHeader : false,
			minimizable : true,
			maximizable : true,
			animCollapse : false,
			border : false,
			hideMode : 'offsets',
			layout : 'fit',
			x : 0,
			y : 0
		});

		// creating the window
		win = me.add(new Ext.dirac.views.desktop.Window(cfg));

		// we add the window to the windows collections
		me.windows.add(win);

		// adding taskbar button related to the window
		win.taskButton = me.taskbar.addTaskButton(win);

		// setting event handlers for some events of the window
		win.on({
			activate : me.updateActiveWindow,
			beforeshow : me.updateDeactiveWindow,
			afterrender : me.hideMessageBox,
			deactivate : me.updateDeactiveWindow,
			minimize : me.minimizeWindow,
			maximize : me.maximizeWindow,
			destroy : me.onWindowClose,
			move : me.onWindowMove,
			resize : me.onWindowResize,
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

	hideMessageBox : function() {
		Ext.get("app-dirac-loading").hide();
	},

	/**
	 * @private Function to update the active window
	 */
	updateDeactiveWindow : function() {
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

		me.taskbar.setActiveButton(activeWindow && activeWindow.taskButton);

	},

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

		me.taskbar.setActiveButton(activeWindow && activeWindow.taskButton);

	},

	/*
	 * BROADCAST METHODS FOR THE ACTIVE WINDOWS
	 */

	/**
	 * Function to add new state to the instances of the same module
	 * 
	 * @param {String}
	 *          stateName This is the name od the state
	 * @param {String}
	 *          appName Name of the module
	 * @param {Object}
	 *          stateData Data of the module that define its state
	 */
	addStateToExistingWindows : function(stateType, stateName, appName) {

		var me = this;

		me.windows.each(function(item, index, len) {
			if (item.getAppClassName() == appName)
				item.addNewState(stateType, stateName);
		});

		if (appName in me.registerStartMenus)
			me.registerStartMenus[appName].addNewState(stateType, stateName);

	},

	/**
	 * Function used to refresh the states of a certain module (application) and
	 * to update all instances of the module that are active at the moment
	 * 
	 * @param {String}
	 *          appName Name of the module (application)
	 */
	oprRefreshAllAppStates : function(appName) {

		var me = this;

		/*
		 * If the Ajax is not successful then the states will remain the same
		 */

		var oFunc = function(iCode, sAppName) {
			if (iCode == 1) {
				me.windows.each(function(item, index, len) {
					if (item.getAppClassName() == appName)
						item.oprRefreshAppStates();
				});

				if (appName in me.registerStartMenus)
					me.registerStartMenus[appName].oprRefreshAppStates();
			}

		}

		GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(appName, oFunc);

	},

	/**
	 * Function to remove a state from the state lists of the instances of the
	 * same module
	 * 
	 * @param {String}
	 *          stateName Name of the state
	 * @param {String}
	 *          appName Name of the module (application)
	 */
	removeStateFromWindows : function(sStateType, sAppName, sStateName) {

		var me = this;

		me.windows.each(function(item, index, len) {
			if (item.getAppClassName() == sAppName)
				item.removeState(sStateType, sStateName);
		});

		if (sAppName in me.registerStartMenus)
			me.registerStartMenus[sAppName].removeState(sStateType, sStateName);

	},

	/**
	 * Function to load a desktop state
	 * 
	 * @param {String}
	 *          stateName The name of the state
	 */
	oprLoadDesktopState : function(sStateName) {

		/*
		 * First we have to check whether some other state is currently in use so we
		 * have to give possibility to choose whether they want to continue to the
		 * chosen state or not
		 */

		var me = this;

		var iCount = me.windows.getCount();

		if (iCount > 0) {

			if (me.currentState == '') {

				/*
				 * There is no active desktop state
				 */

				var ret = Ext.MessageBox.confirm('Confirm', 'Are you sure you want to close windows without saving them ?', function(button) {

					var me = this;
					if (button === 'yes') {

						me.closeAllActiveWindows();

						me.__loadDesktopStateData(sStateName);

					}
				}, me);

			} else {

				/*
				 * There is an active desktop state
				 */

				var ret = Ext.MessageBox.confirm('Confirm', 'There is an active desktop state. Do you want to save the state before we load the new one ?', function(button) {

					var me = this;
					if (button === 'yes') {

						var funcAfterSave = function(sAppName, sStateNameOld) {
						};

						me.SM.oprSaveAppState("application", "desktop", me, funcAfterSave);
					}

					me.closeAllActiveWindows();
					me.__loadDesktopStateData(sStateName);

				}, me);

			}
		} else {

			// if there are no windows open
			me.__loadDesktopStateData(sStateName);

		}

	},

	/**
	 * Function to create all windows from a desktop state
	 * 
	 * @param {String}
	 *          stateName The name of the state
	 */
	__loadDesktopStateData : function(sStateName) {

		var me = this;

		var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", "desktop", sStateName);

		switch (iStateLoaded) {
		case -1:
			GLOBAL.APP.CF.alert("The state does not exist !", "warning");
			return;
			break;
		case -2:
			me.funcPostponedLoading = function() {

				me.__loadDesktopStateData(sStateName);

			}

			setTimeout(me.funcPostponedLoading, 1000);
			return;
			break;
		}

		me.loadState(GLOBAL.APP.SM.getStateData("application", "desktop", sStateName));

		if (me.currentState != "")
			GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.currentState);// OK

		me.currentState = sStateName;
		GLOBAL.APP.SM.oprAddActiveState("desktop", sStateName);// OK

		me.refreshUrlDesktopState();

	},

	/**
	 * Function to close all active windows
	 */
	closeAllActiveWindows : function() {

		var me = this;

		me.windows.each(function(win) {

			win.close();

		});

	},

	/**
	 * Function to refresh the list of desktop states
	 */
	oprRefreshAllDesktopStates : function() {

		var me = this;

		var oFunc = function(iCode, sAppName) {

			if (iCode == 1) {
				me.oprReadDesktopStatesFromCache();
			}

		}

		GLOBAL.APP.SM.oprReadApplicationStatesAndReferences("desktop", oFunc);

	},

	/**
	 * Function to add new desktop link to the menu
	 */
	addDesktopReference : function(stateName) {

		var me = this;

		var newItem = Ext.create('Ext.menu.Item', {
			text : stateName,
			handler : Ext.bind(me.loadSharedStateByName, me, [ "desktop", stateName ], false),
			scope : me,
			iconCls : "dirac-icon-link"
		});

		me.statesMenu.add(newItem);

	},

	/**
	 * Function to remove desktop link out of the menu
	 */
	removeDesktopReference : function() {

		var me = this;

		for ( var i = me.statesMenu.items.length - 1; i >= 0; i--) {

			if (me.statesMenu.items.getAt(i).self.getName() == "Ext.menu.Separator")
				break;

			if (me.statesMenu.items.getAt(i).text == stateName) {

				me.statesMenu.remove(me.menu.items.getAt(i));
				break;

			}

		}

	},

	/*
	 * END: MANAGEMENT OF DESKTOP STATES
	 */

	/**
	 * Function to refresh the state of the desktop working area in the URL
	 */
	refreshUrlDesktopState : function() {

		var me = this;

		var sNewUrlState = "";

		var sThemeText = "Grey";

		if (GLOBAL.WEB_THEME == "ext-all-neptune")
			sThemeText = "Neptune";

		if (GLOBAL.WEB_THEME == "ext-all")
			sThemeText = "Classic";

		if (me.currentState != "") {

			// if there is an active desktop state
			me._state_related_url = "url_state=1|" + me.currentState;
			sNewUrlState = "?view=" + GLOBAL.VIEW_ID + "&theme=" + sThemeText + "&url_state=1|" + me.currentState;

		} else {

			// if there is NO active desktop state
			for ( var i = 0; i < me.windows.getCount(); i++) {
				var oWin = me.windows.getAt(i);

				if ((oWin != undefined) && (oWin != null) && (!oWin.isChildWindow))
					sNewUrlState += ((sNewUrlState == "") ? "" : "^") + oWin.getUrlDescription();
			}

			me._state_related_url = "url_state=0|" + sNewUrlState;
			sNewUrlState = "?view=" + GLOBAL.VIEW_ID + "&theme=" + sThemeText + "&url_state=0|" + sNewUrlState;

		}

		var oHref = location.href;
		var oQPosition = oHref.indexOf("?");

		if (oQPosition != -1) {

			sNewUrlState = oHref.substr(0, oQPosition) + sNewUrlState;

		} else {

			sNewUrlState = oHref + sNewUrlState;

		}

		window.history.pushState("X", "ExtTop - Desktop Sample App", sNewUrlState);

	},

	loadSharedStateByName : function(sAppName, sStateName) {

		var me = this;

		var oData = GLOBAL.APP.SM.getStateData("reference", sAppName, sStateName);
		GLOBAL.APP.SM.oprLoadSharedState(oData["link"], me.cbAfterLoadSharedState);

	},

	/**
	 * Function to register the submenu of an application within the main menu
	 */
	registerStartAppMenu : function(oMenu, sAppClassName) {

		var me = this;
		me.registerStartMenus[sAppClassName] = oMenu;

	},

	/**
	 * Function to get the dimensions of the desktop
	 */
	getViewMainDimensions : function() {

		var me = this;

		return [ me.getWidth(), me.getHeight() - GLOBAL.APP.MAIN_VIEW.taskbar.getHeight() ];

	},

	/**
	 * Function to get the dimensions of a desktop cell
	 */
	getBoxSize : function() {

		var me = this;

		return [ me.boxSizeX, me.boxSizeY ];

	},

	createNewModuleContainer : function(oData) {

		var me = this;

		me.createWindow(oData.objectType, oData.moduleName, oData.setupData);

	},

	/*-----------------IMPLEMENTATION OF THE INTERFACE BETWEEN STATE MANAGEMENT ADN DESKTOP----------------*/

	cbAfterLoadSharedState : function(iCode, sLink, oDataReceived) {

		var me = GLOBAL.APP.MAIN_VIEW;

		var oDataItems = sLink.split("|");

		if (oDataItems[0] != "desktop") {

			var oSetupData = {
				"data" : oDataReceived,
				"currentState" : ""
			};

			me.createWindow("app", oDataItems[0], oSetupData);

		} else {

			for ( var i = 0, len = oDataReceived["data"].length; i < len; i++) {

				var appStateData = oDataReceived["data"][i];

				if (appStateData.name)
					me.createWindow(appStateData.loadedObjectType, appStateData.name, appStateData);

			}

			if (me.currentState != "")
				GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.currentState);

			me.currentState = "";

		}

	},

	cbAfterSaveSharedState : function(iCode, sLinkName, sLink) {

		var me = GLOBAL.APP.MAIN_VIEW;

		var oDataItems = sLink.split("|");

		if (oDataItems[0] != "desktop") {
			me.addStateToExistingWindows("reference", sLinkName, oDataItems[0]);
		} else {
			me.addDesktopReference(sLinkName);
		}

	}

/*-----------------END - IMPLEMENTATION OF THE INTERFACE BETWEEN STATE MANAGEMENT ADN DESKTOP----------------*/

});
