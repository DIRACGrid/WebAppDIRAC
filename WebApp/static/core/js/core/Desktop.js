/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.dirac.core.Desktop
 * @extends Ext.panel.Panel
 * 
 * This class manages the wallpaper, shortcuts, taskbar, desktop states, and the
 * broadcast part for the window states.
 * 
 */
Ext.define('Ext.dirac.core.Desktop', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.desktop',
    mixins : [ "Ext.dirac.core.Stateful" ],
    uses : [ 'Ext.util.MixedCollection', 'Ext.menu.Menu', 'Ext.view.View', // dataview
    'Ext.dirac.core.Window', 'Ext.dirac.core.TaskBar', 'Ext.dirac.core.Wallpaper' ],

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
     *      {@link Ext.dirac.core.ShorcutModel ShortcutModel}.
     */
    shortcuts : null,

    /**
     * @cfg {String} shortcutItemSelector This property is passed to the
     *      DataView for the desktop to select shortcut items. If the
     *      {@link #shortcutTpl} is modified, this will probably need to be
     *      modified as well.
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

    getStateData : function() {

	var me = this;

	var oData = {
	    "data" : []
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

		    oElem = {
			name : win.getAppClassName(),
			currentState : win.currentState,
			data : win.loadedObject.getStateData(),
			x : win.x,
			y : win.y,
			width : win.getWidth(),
			height : win.getHeight(),
			maximized : win.maximized,
			zIndex : win.zIndex,
			loadedObjectType : win.loadedObjectType
		    };

		} else if (win.loadedObjectType == "link") {

		    oElem = {
			title : win.title,
			linkToLoad : win.linkToLoad,
			x : win.x,
			y : win.y,
			width : win.getWidth(),
			height : win.getHeight(),
			maximized : win.maximized,
			zIndex : win.zIndex,
			loadedObjectType : win.loadedObjectType
		    };

		}

		oData.data.push(oElem);
	    }

	});

	return oData;

    },

    loadState : function(oData) {

	var me = this;
	for ( var i = 0, len = oData["data"].length; i < len; i++) {

	    var oAppStateData = stateData["data"][i];

	    if (oAppStateData.name)
		me.createWindow(oAppStateData.loadedObjectType, oAppStateData.name, oAppStateData);

	}

    },

    initComponent : function() {
	var me = this;

	/*
	 * The taskbar object has a taskbar and a menu that appears when we
	 * right click on a task within the taskbar
	 */
	me.windowMenu = new Ext.menu.Menu(me.createWindowMenu());

	me.bbar = me.taskbar = new Ext.dirac.core.TaskBar(me.taskbarConfig);
	me.taskbar.windowMenu = me.windowMenu;

	/*
	 * Collection of windows
	 */
	me.windows = new Ext.util.MixedCollection();

	/*
	 * There is another menu the one that appears when we click somewhere on
	 * the desktop
	 */
	me.contextMenu = new Ext.menu.Menu(me.createDesktopMenu());

	me.items = [ {
	    xtype : 'wallpaper',
	    id : me.id + '_wallpaper'
	}, me.createDataView() ];

	me.callParent();

	me.shortcutsView = me.items.getAt(1);
	me.shortcutsView.on('itemclick', me.onShortcutItemClick, me);

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
     * @private click handler called when a shortcut item is clicked
     * @param e
     */
    onShortcutItemClick : function(dataView, record) {
	/*
	 * var me = this, module = me.app.getModule(record.data.module), win =
	 * module && module.createWindow();
	 * 
	 * if (win) { me.restoreWindow(win); } else
	 * me.app.createWindow(record.data.module);
	 */

    },

    afterRender : function() {
	var me = this;
	me.callParent();
	me.el.on('contextmenu', me.onDesktopMenu, me);

	me.__oprLoadUrlState();

    },

    __oprLoadUrlState : function() {

	var me = this;

	var oValid = true;

	_load_by_url = Ext.util.Format.trim(_load_by_url);

	if (_load_by_url.length != "") {

	    var oParts = _load_by_url.split("|");

	    if (oParts.length != 2) {

		me.refreshUrlDesktopState();
		return;

	    }

	    if ((parseInt(oParts[0]) != 0) && (parseInt(oParts[0]) != 1)) {

		oValid = false;

	    }

	    if (parseInt(oParts[0]) == 0) {

		var oApps = oParts[1].split("^");

		for ( var i = 0; i < oApps.length; i++) {

		    var oAppParts = oApps[i].split(":");

		    if (oAppParts.length != 7) {

			oValid = false;
			break;

		    }

		    if (isNaN(parseInt(oAppParts[2])) || isNaN(parseInt(oAppParts[3])) || isNaN(parseInt(oAppParts[4])) || isNaN(parseInt(oAppParts[5])) || isNaN(parseInt(oAppParts[6]))) {

			oValid = false;
			break;

		    }

		}

	    }

	    if (parseInt(oParts[0]) == 1) {

		if (Ext.util.Format.trim(oParts[1]) == "") {

		    oValid = false;

		}

	    }

	}

	if (oValid) {

	    var oParts = _load_by_url.split("|");

	    if ((oParts.length != 2) || (Ext.util.Format.trim(oParts[1]).length == 0))
		return;

	    if (parseInt(oParts[0]) == 0) {
		// non desktop state
		var oApps = oParts[1].split("^");

		for ( var i = 0, len = oApps.length; i < len; i++) {

		    var oAppItems = oApps[i].split(":");

		    var oSetupData = {};

		    if (Ext.util.Format.trim(oAppItems[1]) != "")
			oSetupData.stateToLoad = oAppItems[1];

		    oSetupData.x = oAppItems[2];
		    oSetupData.y = oAppItems[3];
		    oSetupData.width = oAppItems[4];
		    oSetupData.height = oAppItems[5];

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

	    me.refreshUrlDesktopState();

	}

    },

    /**
     * Overridable configuration method for the shortcuts presented on the
     * desktop
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
     * Overridable configuration method for the desktop context menu
     * (contextMenu)
     * 
     * @return Object
     */
    createDesktopMenu : function() {
	var me = this, ret = {
	    items : me.contextMenuItems || []
	};

	// reading the existing states of the desktop for that user
	me.statesMenu = new Ext.menu.Menu();

	var oFunc = function() {

	    me.oprReadDesktopStatesFromCache();

	}

	_app._sm.oprReadApplicationStatesAndReferences("desktop", oFunc);

	var funcAfterSave = function(sAppName, sStateName) {

	    var oNewItem = Ext.create('Ext.menu.Item', {
		text : stateName,
		handler : Ext.bind(me.oprLoadDesktopState, me, [ sStateName ], false),
		scope : me,
		iconCls : "system_state_icon",
		menu : [ {
		    text : "Share state",
		    handler : Ext.bind(_app._sm.oprShareState, _app._sm, [ sStateName, "dekstop" ], false),
		    iconCls : "system_share_state_icon"
		} ]
	    });

	    me.statesMenu.insert(0, oNewItem);

	    me.currentState = stateName;
	    _app._sm.addActiveState(sAppName, sStateName);
	    me.refreshUrlDesktopState();

	};

	var funcAfterRemove = function(sStateType, sAppName, sStateName) {

	    for ( var i = 0; i < me.statesMenu.items.length; i++) {

		if (me.statesMenu.items.getAt(i).text == sStateName) {

		    me.statesMenu.remove(me.statesMenu.items.getAt(i));
		    break;

		}

	    }

	}

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
	}, '-', {
	    text : "Load state",
	    iconCls : "toolbar-other-load",
	    menu : me.statesMenu
	}, {
	    text : "Save",
	    iconCls : "toolbar-other-save",
	    handler : Ext.bind(_app._sm.oprSaveAppState, _app._sm, [ "application", "desktop", me, funcAfterSave ], false),
	    minWindows : 1,
	    scope : me
	}, {
	    text : "Save As ...",
	    iconCls : "toolbar-other-save",
	    handler : Ext.bind(_app._sm.formSaveState, _app._sm, [ "application", "desktop", me, funcAfterSave ], false),
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
	    handler : Ext.bind(_app._sm.formManageStates, _app._sm, [ "desktop", funcAfterRemove ], false),
	    scope : me
	})

	return ret;
    },

    oprReadDesktopStatesFromCache : function() {

	var me = this;

	me.statesMenu.removeAll();

	var oStates = _app._sm.cache.application.desktop;

	for ( var sStateName in oStates) {

	    var newItem = Ext.create('Ext.menu.Item', {
		text : sStateName,
		handler : Ext.bind(me.oprLoadDesktopState, me, [ sStateName ], false),
		scope : me,
		iconCls : "system_state_icon",
		stateType : "application",
		menu : [ {
		    text : "Share state",
		    handler : Ext.bind(_app._sm.oprShareState, _app._sm, [ sStateName, "desktop" ], false),
		    iconCls : "system_share_state_icon"
		} ]
	    });

	    me.statesMenu.add(newItem);

	}

	me.statesMenu.add("-");

	var oRefs = _app._sm.cache.reference.desktop;

	for ( var sStateName in oRefs) {

	    var newItem = Ext.create('Ext.menu.Item', {
		text : sStateName,
		handler : Ext.bind(me.loadSharedStateByName, me, [ "desktop", sStateName ], false),
		scope : me,
		iconCls : "system_link_icon",
		stateType : "reference"
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
     * @private Handler called before the window taskbar menu appears. It is
     *          used to disable enable some operations within that menu.
     */
    onWindowMenuBeforeShow : function(menu) {
	var items = menu.items.items, win = menu.theWin;

	items[2].setDisabled(win.maximized !== true && win.hidden !== true); // Restore
	items[3].setDisabled(win.minimized === true); // Minimize
	items[4].setDisabled(win.maximized === true || win.hidden === true); // Maximize

	// We copy the menu from the window

	if (win.loadedObjectType == "link") {

	    items[0].hide();
	    items[1].hide();

	} else if (win.loadedObjectType == "app") {

	    items[0].show();
	    items[1].show();

	    items[0].menu = win.loadMenu;
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
     * @private Handler called when the Maximize option is choicen from the
     *          window taskbar menu
     */
    onWindowMenuMaximize : function() {
	var me = this, win = me.windowMenu.theWin;

	win.maximize();
	win.toFront();
    },

    /**
     * @private Handler called when the Minimize option is choicen from the
     *          window taskbar menu
     */
    onWindowMenuMinimize : function() {
	var me = this, win = me.windowMenu.theWin;

	win.minimize();
    },

    /**
     * @private Handler called when the Restore option is choicen from the
     *          window taskbar menu
     */
    onWindowMenuRestore : function() {
	var me = this, win = me.windowMenu.theWin;

	me.restoreWindow(win);
    },

    /**
     * @private Handler called when the window taskbar menu gets hidden
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
     *                This parametear can be used in other menus as well.
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
     *                wallpaper Physical path to the wallpaper image
     * @param {boolean}
     *                stretch If it is true then the wallpaper will be streched,
     *                otherwise not
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
     *                win The window object getting minimized
     */
    minimizeWindow : function(win) {
	win.minimized = true;
	// win.maximized = false;
	this.refreshUrlDesktopState();
	win.hide();
    },

    maximizeWindow : function(win) {
	win.getHeader().hide();
	win.maximize();

    },

    /**
     * @private Handler called when the window gets restored
     * @param {Ext.window.Window}
     *                win The window object getting minimized
     */
    restoreWindow : function(win) {
	if (win.isVisible()) {
	    win.getHeader().show();
	    win.setWidth(this.getWidth() / 2);
	    win.setHeight(this.getHeight() / 2);
	    win.setPosition(50, 50);
	    win.restore();
	    win.toFront();
	} else {
	    win.show();
	}
	win.minimized = false;
	this.refreshUrlDesktopState();
	return win;
    },

    /**
     * @private Handler called when the window gets closed
     * @param {Ext.window.Window}
     *                win The object window getting closed
     */
    onWindowClose : function(win) {
	var me = this;

	if (win.__dirac_destroy != null)
	    win.__dirac_destroy(win);

	if (win.parentWindow)
	    win.parentWindow.removeChildWindowFromList(win);

	me.windows.remove(win);
	/*
	 * If the number of windows get 0, the current desktop state is cleared
	 */
	if (me.windows.getCount() == 0) {

	    if (me.currentState != "")
		_app._sm.removeActiveState("desktop", me.currentState);

	    me.currentState = '';
	    me.refreshUrlDesktopState();
	}
	me.taskbar.removeTaskButton(win.taskButton);
	me.updateActiveWindow();

	/*
	 * Close all other child windows
	 */
	for ( var i = win.childWindows.length - 1; i >= 0; i--) {
	    if (win.childWindows[i] != null) {
		win.childWindows[i].close();
	    }
	}

	if (!win.isChildWindow)
	    me.refreshUrlDesktopState();

    },

    onWindowMove : function(oWindow, iX, iY, eOpts) {

	var me = this;

	if (oWindow.__dirac_move != null)
	    oWindow.__dirac_move(oWindow, iX, iY, eOpts);

	me.refreshUrlDesktopState();
    },

    onWindowResize : function(oWindow, iWidth, iHeight, eOpts) {

	var me = this;

	if (oWindow.__dirac_resize != null)
	    oWindow.__dirac_resize(oWindow, iWidth, iHeight, eOpts);

	me.refreshUrlDesktopState();
    },

    /**
     * Function to create a window and to load the module defined by the
     * moduleName
     * 
     * @param {String}
     *                moduleName The name of the module (the JavaScript class)
     *                to be loaded
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

	    if (_dev == 0) {

		var oConfig = {
		    enabled : true,
		    paths : {}
		};

		oConfig["paths"]["DIRAC." + oParts[1] + ".classes"] = "static/" + oParts[0] + "/" + oParts[1] + "/build";

		Ext.Loader.setConfig(oConfig);

	    }

	    Ext.require(sStartClass, function() {

		var me = this;

		var instance = Ext.create(sStartClass, {});

		var config = {
		    desktop : me,
		    setupData : setupData,
		    loadedObject : instance,
		    loadedObjectType : "app"
		};

		var window = me.initWindow(config);
		window.show();

	    }, this);

	} else if (loadedObjectType == "link") {
	    var me = this;

	    var window = me.initWindow({
		setupData : setupData,
		loadedObjectType : "link",
		linkToLoad : moduleName
	    });

	    window.show();

	}

    },

    /**
     * Function that is used by modules to create windows with some content.
     * This function does configuration of the window object.
     * 
     * @param {Object}
     *                config Configuration and content of the window
     */

    initWindow : function(config) {

	var me = this, win, cfg = Ext.applyIf(config || {}, {
	    stateful : false,
	    isWindow : true,
	    constrainHeader : true,
	    minimizable : true,
	    maximizable : true,
	    animCollapse : false,
	    border : false,
	    hideMode : 'offsets',
	    layout : 'fit',
	    __dirac_activate : null,
	    __dirac_beforeshow : null,
	    __dirac_afterrender : null,
	    __dirac_deactivate : null,
	    __dirac_minimize : null,
	    __dirac_maximize : null,
	    __dirac_restore : null,
	    __dirac_destroy : null,
	    __dirac_boxready : null,
	    __dirac_destroy : null,
	    __dirac_move : null,
	    __dirac_resize : null
	});

	win = me.add(new Ext.dirac.core.Window(cfg));

	me.windows.add(win);

	win.taskButton = me.taskbar.addTaskButton(win);

	win.on({
	    activate : me.updateActiveWindow2,
	    beforeshow : me.updateActiveWindow,
	    afterrender : me.hideMessageBox,
	    deactivate : me.updateActiveWindow,
	    minimize : me.minimizeWindow,
	    maximize : me.maximizeWindow,
	    restore : me.restoreWindow,
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

    updateActiveWindow2 : function() {
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

	if (activeWindow.__dirac_activate != null) {
	    activeWindow.__dirac_activate(activeWindow);
	}

    },

    /*
     * -------------------------BROADCAST METHODS FOR THE ACTIVE
     * WINDOWS-------------------------
     */

    /**
     * Function to add new state to the instances of the same module
     * 
     * @param {String}
     *                stateName This is the name od the state
     * @param {String}
     *                appName Name of the module
     * @param {Object}
     *                stateData Data of the module that define its state
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
     *                appName Name of the module (application)
     */
    oprRefreshAllAppStates : function(appName) {

	var me = this;

	/*
	 * If the Ajax is not successful then the states will remain the same
	 */

	var oFunc = function() {

	    me.windows.each(function(item, index, len) {
		if (item.getAppClassName() == appName)
		    item.oprRefreshAppStates();
	    });

	    if (appName in me.registerStartMenus)
		me.registerStartMenus[appName].oprRefreshAppStates();

	}

	_app._sm.oprReadApplicationStatesAndReferences(appName, oFunc);

    },

    /**
     * Function to remove a state from the state lists of the instances of the
     * same module
     * 
     * @param {String}
     *                stateName Name of the state
     * @param {String}
     *                appName Name of the module (application)
     */
    removeStateFromWindows : function(stateType, stateName, appName) {

	var me = this;

	delete _app._sm.cache.application[appName][stateName];

	me.windows.each(function(item, index, len) {
	    if (item.getAppClassName() == appName)
		item.removeState(stateType, stateName);
	});

	if (appName in me.registerStartMenus)
	    me.registerStartMenus[appName].removeState(stateType, stateName);

    },

    /*
     * -------------------------END: BROADCAST METHODS FOR THE ACTIVE
     * WINDOWS-------------------------
     */

    /*
     * ---------------------------------MANAGEMENT OF DESKTOP
     * STATES--------------------------------------------
     */

    /**
     * Function to load a desktop state
     * 
     * @param {String}
     *                stateName The name of the state
     */
    oprLoadDesktopState : function(sStateName) {

	/*
	 * First we have to check whether some other state is currently in use
	 * so we have to give possibility to choose whether they want to
	 * continue to the chosen state or not
	 */

	var me = this;

	var iCount = me.windows.getCount();

	if (iCount > 0) {

	    /*
	     * Two cases: - There is an active desktop state - There is no
	     * active desktop state
	     */
	    if (me.currentState == '') {

		var ret = Ext.MessageBox.confirm('Confirm', 'Are you sure you want to close windows without saving them ?', function(button) {

		    var me = this;
		    if (button === 'yes') {

			me.closeAllActiveWindows();

			me.__loadDesktopStateData(sStateName);

		    }
		}, me);

	    } else {

		var ret = Ext.MessageBox.confirm('Confirm', 'There is an active desktop state. Do you want to save the state before we load the new one ?', function(button) {

		    var me = this;
		    if (button === 'yes') {
			me.oprSendDataForSave(me.currentState, false);
		    }

		    me.closeAllActiveWindows();
		    me.__loadDesktopStateData(sStateName);

		}, me);

	    }
	} else {

	    me.__loadDesktopStateData(sStateName);

	}

    },

    /**
     * Function to create all windows from a desktop state
     * 
     * @param {String}
     *                stateName The name of the state
     */
    __loadDesktopStateData : function(sStateName) {

	var me = this;

	if (!(("desktop" in _app._sm.cache.application) && (sStateName in _app._sm.cache.application.desktop))) {

	    me.funcPostponedLoading = function() {

		me.loadDesktopStateData(sStateName);

	    }

	    setTimeout(me.funcPostponedLoading, 1000);
	    return;

	}

	me.loadState(_app._sm.cache.application.desktop[sStateName]);

	me.currentState = sStateName;
	_app._sm.addActiveState("desktop", sStateName);

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

	var oFunc = function() {

	    me.oprReadDesktopStatesFromCache();

	}

	_app._sm.oprReadApplicationStatesAndReferences("desktop", oFunc);

    },

    addDesktopReference : function(stateName) {

	var me = this;

	var newItem = Ext.create('Ext.menu.Item', {
	    text : stateName,
	    handler : Ext.bind(me.loadSharedStateByName, me, [ "desktop", stateName ], false),
	    scope : me,
	    iconCls : "system_link_icon",
	});

	me.statesMenu.add(newItem);

    },

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
     * ---------------------------------END: MANAGEMENT OF DESKTOP
     * STATES--------------------------------------------
     */

    refreshUrlDesktopState : function() {

	var me = this;

	var sNewUrlState = "";

	if (me.currentState != "") {

	    sNewUrlState = "?url_state=1|" + me.currentState;

	} else {

	    for ( var i = 0; i < me.windows.getCount(); i++) {
		var oWin = me.windows.getAt(i);

		if ((oWin != undefined) && (oWin != null) && (!oWin.isChildWindow))
		    sNewUrlState += ((sNewUrlState == "") ? "" : "^") + oWin.getUrlDescription();
	    }

	    sNewUrlState = "?url_state=0|" + sNewUrlState;

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

	me.loadSharedState(_app._sm.cache.reference[sAppName][sStateName]["link"]);

    },

    registerStartAppMenu : function(oMenu, sAppClassName) {

	var me = this;
	me.registerStartMenus[sAppClassName] = oMenu;

    },

    getDesktopDimensions : function() {

	var me = this;

	return [ me.getWidth(), me.getHeight() ];

    },

    /*-----------------IMPLEMENTATION OF THE INTERFACE BETWEEN STATE MANAGEMENT ADN DESKTOP----------------*/

    
    cbAfterLoadSharedState : function(sLink, oDataReceived) {

	var me = this;
	var oDataItems = sLink.split("|");

	if (oDataItems[0] != "desktop") {

	    var oSetupData = {
		"data" : oDataReceived,
		"currentState" : ""
	    };

	    me.app.createWindow("app", oDataItems[0], oSetupData);

	} else {

	    for ( var i = 0, len = oDataReceived["data"].length; i < len; i++) {

		var appStateData = oDataReceived["data"][i];

		if (appStateData.name)
		    me.app.createWindow(appStateData.loadedObjectType, appStateData.name, appStateData);

	    }

	    if (me.currentState != "")
		_app._sm.removeActiveState("desktop", me.currentState);

	    me.currentState = "";

	}

    },

    cbAfterSaveSharedState : function(sLinkName, sLink) {

	var me = this;

	var oDataItems = sLink.split("|");

	if (oDataItems[0] != "desktop") {
	    me.addStateToExistingWindows("reference", sLinkName, oDataItems[1], sLink);
	} else {
	    me.addDesktopReference(sLinkName);
	}

    }

/*-----------------END - IMPLEMENTATION OF THE INTERFACE BETWEEN STATE MANAGEMENT ADN DESKTOP----------------*/

});
