/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.dirac.core.Window This is a window widget with extended
 *        functionality such as state management
 * @extend Ext.window.Window
 * 
 */
Ext.define('Ext.dirac.core.Window', {
    extend : 'Ext.window.Window',
    requires : [ "Ext.dirac.utils.DiracToolButton", "Ext.menu.Menu", "Ext.menu.Item", "Ext.form.*", "Ext.LoadMask" ],

    /**
     * @property {String} currentState The name of the current active desktop
     *           state
     */
    currentState : "",
    /**
     * @property {Object} loadedObject The object of the module loaded within
     *           the window
     */
    loadedObject : null,
    /**
     * @property {Ext.LoadMask} loadMask The load mask used when a state is
     *           being loaded
     */
    loadMask : null,
    /**
     * @property {Ext.dirac.core.Desktop} desktop Reference to the desktop
     *           object
     */
    desktop : null,

    initComponent : function() {

	var me = this;

	me.loadMask = new Ext.LoadMask(me, {
	    msg : "Loading ..."
	});

	if (me.loadedObjectType == "app") {
	    me.items = [ me.loadedObject ];
	    me.appClassName = me.loadedObject.self.getName();
	} else if (me.loadedObjectType == "link") {
	    me.items = [ {
		xtype : "component",
		autoEl : {
		    tag : "iframe",
		    src : me.linkToLoad
		}
	    } ];
	    me.appClassName = "link";
	}

	me.childWindows = [];

	me.callParent();

    },

    afterRender : function() {

	var me = this;
	me.callParent();
	if (me.loadedObjectType == "app")
	    me.setLoadedObject(me.setupData);
	else if (me.loadedObjectType == "link")
	    me.setPropertiesWhenLink(me.setupData);

	GLOBAL.APP.desktop.refreshUrlDesktopState();

    },

    /**
     * Function to set a state of the loaded object and a state of the window
     * itself
     * 
     * @param {Object}
     *                setupData Setup data
     */
    setLoadedObject : function(setupData) {

	var me = this;

	if (setupData != null) {

	    if (("maximized" in setupData) && (setupData["maximized"])) {

		me.maximize();

	    } else if (("minimized" in setupData) && (setupData["minimized"])) {

		if ("width" in setupData)
		    me.setWidth(parseInt(setupData.width));

		if ("height" in setupData)
		    me.setHeight(parseInt(setupData.height));

		me.desktop.minimizeWindow(me);

	    } else {

		if ("x" in setupData) {
		    me.setPosition(parseInt(setupData.x), parseInt(setupData.y));
		}

		if ("width" in setupData) {
		    me.setWidth(parseInt(setupData.width));
		}

		if ("height" in setupData) {
		    me.setHeight(parseInt(setupData.height));
		}

		if ((!("height" in setupData)) && (!("width" in setupData))) {

		    if (!me.loadedObject.launcher.maximized) {
			if ("width" in me.loadedObject.launcher) {

			    me.setWidth(me.loadedObject.launcher.width);

			} else {

			    me.setWidth(600);

			}

			if ("height" in me.loadedObject.launcher) {

			    me.setHeight(me.loadedObject.launcher.height);

			} else {

			    me.setHeight(400);

			}
		    } else {

			me.maximize();

		    }

		}

	    }

	    if ("zIndex" in setupData) {

		me.setZIndex(setupData.zIndex);

	    }

	    if ("stateToLoad" in setupData) {

		me.oprLoadAppStateFromCache(setupData["stateToLoad"]);

	    } else {

		if ("data" in setupData) {
		    me.currentState = setupData.currentState;
		    me.loadedObject.currentState = setupData.currentState;
		    
		    if(me.currentState!="")
			GLOBAL.APP.SM.addActiveState(me.loadedObject.self.getName(), me.currentState);
		    
		    me.loadedObject.loadState(setupData.data);
		}

	    }

	} else {
	    
	    if((me.loadedObject.launcher.x != null)&&(me.loadedObject.launcher.y != null)){
		
		me.setPosition(me.loadedObject.launcher.x,me.loadedObject.launcher.y);
	    }
	    
	    if (!me.loadedObject.launcher.maximized) {

		if ("width" in me.loadedObject.launcher) {
		    
		    me.setWidth(me.loadedObject.launcher.width);

		} else {

		    me.setWidth(600);

		}

		if ("height" in me.loadedObject.launcher) {
		    
		    me.setHeight(me.loadedObject.launcher.height);

		} else {

		    me.setHeight(400);

		}
	    } else {

		me.maximize();
	    }

	}

	if (me.currentState == "") {

	    me.setTitle(me.loadedObject.launcher.title);
	    me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title, 20));

	} else {
	    me.setTitle(me.loadedObject.launcher.title + " [" + me.currentState + "]");
	    me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title + " [" + me.currentState + "]", 20));
	}

	me.setIconCls(me.loadedObject.launcher.iconCls);
	me.taskButton.setIconCls(me.loadedObject.launcher.iconCls);
	me.loadedObject.setContainer(me);

    },

    setPropertiesWhenLink : function(setupData) {

	var me = this;

	if (setupData.x && setupData.y)
	    me.setPosition(setupData.x, setupData.y);
	else {
	    me.setPosition(0, 0);
	}

	if (!setupData.width && !setupData.height)
	    me.maximize();
	else {
	    if (setupData.width)
		me.setWidth(setupData.width);

	    if (setupData.height)
		me.setHeight(setupData.height);
	}

	me.setTitle(setupData.title);
	me.taskButton.setIconCls("notepad");
	me.taskButton.setText(Ext.util.Format.ellipsis(me.title, 20));
	me.setIconCls("notepad");

	if (setupData.zIndex)
	    me.setZIndex(setupData.zIndex);

    },

    /**
     * Getter function for the class of the loaded object
     * 
     * @return {String} The name of the class
     */
    getAppClassName : function() {

	return this.appClassName;

    },

    /**
     * Getter function for the current state of the loaded object
     * 
     * @return {String} The name of the class
     */
    getCurrentState : function() {

	return this.currentState;

    },
    /**
     * Overriden function, inherited from Ext.window.Window used to set up the
     * buttons at the top right corner of the window
     */
    addTools : function() {

	var me = this;

	if (me.loadedObjectType == "app") {

	    me.statesMenu = new Ext.menu.Menu();

	    /*
	     * if the cache for the state of the started application exist
	     */
	    
	    /*
	     * A call to isStateLoaded can be used to see whether the application states have been loaded
	     * */
	    var iAppStatesLoaded = GLOBAL.APP.SM.isStateLoaded("application",me.appClassName,"|"); 
	    
	    if (iAppStatesLoaded!=-2) {

		me.oprRefreshAppStates();

	    } else {

		/*
		 * if the application cache does not exist
		 */

		var oFunc = function(sAppName) {

		    me.oprRefreshAppStates();

		}

		GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(me.appClassName, oFunc);

	    }

	    var funcAfterSave = function(sAppName, sStateName) {

		me.desktop.addStateToExistingWindows("application", sStateName, sAppName);
		
		if(me.currentState!="")
		    GLOBAL.APP.SM.removeActiveState(sAppName,me.currentState);
		
		me.loadedObject.currentState = sStateName;
		me.currentState = sStateName;
		GLOBAL.APP.SM.addActiveState(sAppName, sStateName);
		me.setTitle(me.loadedObject.launcher.title + " [" + me.loadedObject.currentState + "]");
		me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title + " [" + me.loadedObject.currentState + "]", 20));
		GLOBAL.APP.desktop.refreshUrlDesktopState();

	    };

	    var funcAfterRemove = function(sStateType, sAppName, sStateName) {

		me.desktop.removeStateFromWindows(sStateType, sAppName, sStateName);

	    }

	    me.loadMenu = new Ext.menu.Menu({
		items : [ {
		    text : "Load state",
		    iconCls : "toolbar-other-load",
		    menu : me.statesMenu
		}, {
		    text : "Save",
		    iconCls : "toolbar-other-save",
		    handler : Ext.bind(GLOBAL.APP.SM.oprSaveAppState, GLOBAL.APP.SM, [ "application", me.loadedObject.self.getName(), me.loadedObject, funcAfterSave ], false),
		    scope : me
		}, {
		    text : "Save As ...",
		    iconCls : "toolbar-other-save",
		    handler : Ext.bind(GLOBAL.APP.SM.formSaveState, GLOBAL.APP.SM, [ "application", me.loadedObject.self.getName(), me.loadedObject, funcAfterSave ], false),
		    scope : me
		}, {
		    text : "Refresh states",
		    iconCls : "toolbar-other-refresh",
		    handler : me.oprRefreshAllAppStates,
		    scope : me
		}, {
		    text : "Manage states ...",
		    iconCls : "toolbar-other-manage",
		    handler : Ext.bind(GLOBAL.APP.SM.formManageStates, GLOBAL.APP.SM, [ me.loadedObject.self.getName(), funcAfterRemove ], false),
		    scope : me
		} ]
	    });

	    me.addTool({
		xtype : "diracToolButton",
		type : "save",
		menu : me.loadMenu
	    });

	}

	me.callParent();

    },
    /**
     * Function that is called when the refresh button of the SAVE window menu
     * is clicked
     */
    oprRefreshAllAppStates : function() {

	var me = this;

	me.desktop.oprRefreshAllAppStates(me.appClassName);

    },
    /**
     * Function for adding new state within the list of existing states
     * 
     * @param {String}
     *                stateName The name of the state
     */
    addNewState : function(stateType, stateName) {

	var me = this;

	if (stateType == "application") {

	    var newItem = Ext.create('Ext.menu.Item', {
		text : stateName,
		handler : Ext.bind(me.oprLoadAppStateFromCache, me, [ stateName ], false),
		scope : me,
		iconCls : "system_state_icon",
		stateType : stateType,
		menu : [ {
		    text : "Share state",
		    handler : Ext.bind(GLOBAL.APP.SM.oprShareState, GLOBAL.APP.SM, [ stateName, me.loadedObject.self.getName() ], false),
		    iconCls : "system_share_state_icon"
		} ]
	    });

	    var iIndexPosition = 0;

	    for ( var i = me.statesMenu.items.length - 1; i >= 0; i--) {

		if (me.statesMenu.items.getAt(i).self.getName() == "Ext.menu.Separator") {
		    iIndexPosition = i;
		    break;
		}

	    }

	    me.statesMenu.insert(iIndexPosition, newItem);

	} else if (stateType == "reference") {

	    var newItem = Ext.create('Ext.menu.Item', {
		text : stateName,
		handler : Ext.bind(me.desktop.loadSharedStateByName, me.desktop, [ me.appClassName, stateName ], false),
		scope : me,
		iconCls : "system_link_icon",
		stateType : stateType,
	    });

	    me.statesMenu.add(newItem);

	}

    },
    /**
     * Function for removing a state from the list of existing states
     * 
     * @param {String}
     *                stateName The name of the state
     */
    removeState : function(stateType, stateName) {

	var me = this;

	if (stateType == "application") {

	    /*
	     * Searching from the begging of the menu
	     * 
	     */
	    for ( var i = 0; i < me.statesMenu.items.length; i++) {

		if (me.statesMenu.items.getAt(i).self.getName() == "Ext.menu.Separator")
		    break;

		if (me.statesMenu.items.getAt(i).text == stateName) {

		    me.statesMenu.remove(me.statesMenu.items.getAt(i));
		    break;

		}

	    }

	} else if (stateType == "reference") {

	    /*
	     * Searching from the end of the menu
	     * 
	     */
	    for ( var i = me.statesMenu.items.length - 1; i >= 0; i--) {

		if (me.statesMenu.items.getAt(i).self.getName() == "Ext.menu.Separator")
		    break;

		if (me.statesMenu.items.getAt(i).text == stateName) {

		    me.statesMenu.remove(me.statesMenu.items.getAt(i));
		    break;

		}

	    }

	}

    },

    /**
     * Function to refresh the states of a module. The states are read from the
     * cash.
     */
    oprRefreshAppStates : function() {

	var me = this;

	me.statesMenu.removeAll();
	
	var oStates = GLOBAL.APP.SM.getApplicationStates("application", me.appClassName);
	
	for ( var i = 0, len = oStates.length; i < len; i++) {
	    
	    var stateName = oStates[i];
		
	    var oNewItem = Ext.create('Ext.menu.Item', {
		text : stateName,
		handler : Ext.bind(me.oprLoadAppStateFromCache, me, [ stateName ], false),
		scope : me,
		iconCls : "system_state_icon",
		stateType : "application",
		menu : [ {
		    text : "Share state",
		    handler : Ext.bind(GLOBAL.APP.SM.oprShareState, GLOBAL.APP.SM, [ stateName, me.appClassName ], false),
		    iconCls : "system_share_state_icon"
		} ]
	    });

	    me.statesMenu.add(oNewItem);

	}

	me.statesMenu.add("-");
	
	var oRefs = GLOBAL.APP.SM.getApplicationStates("reference", me.appClassName);
	
	for ( var i = 0, len = oRefs.length; i < len; i++) {
	    
	    var stateName = oRefs[i];
	    
	    var oNewItem = Ext.create('Ext.menu.Item', {
		text : stateName,
		handler : Ext.bind(me.desktop.loadSharedStateByName, me.desktop, [ me.appClassName, stateName ], false),
		scope : me,
		iconCls : "system_link_icon",
		stateType : "reference"
	    });

	    me.statesMenu.add(oNewItem);

	}

    },

    /**
     * Function to load module state with data from the cache
     * 
     * @param {String}
     *                stateName The name of the state
     */
    oprLoadAppStateFromCache : function(stateName) {

	var me = this;
	var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application",me.appClassName,stateName);
	
	switch(iStateLoaded){
		case -1:
	    		alert("The state does not exist !");
	    		return;
	    		break;
		case -2: 
		    	me.funcPostponedLoading = function() {
    
    				me.oprLoadAppStateFromCache(stateName);
    
    		    	}
    
		    	setTimeout(me.funcPostponedLoading, 1000);
		    	return;
	    	break;
	}

	me.loadMask.show();

	me.closeAllChildWindows();
	
	me.loadedObject.loadState(GLOBAL.APP.SM.getStateData("application",me.appClassName,stateName));
	
	if(me.currentState!="")
	    GLOBAL.APP.SM.removeActiveState(me.appClassName, me.currentState);
	
	me.currentState = stateName;
	me.loadedObject.currentState = stateName;
	
	GLOBAL.APP.SM.addActiveState(me.appClassName, stateName);
	GLOBAL.APP.desktop.refreshUrlDesktopState();

	me.setTitle(me.loadedObject.launcher.title + " [" + stateName + "]");
	me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title + " [" + stateName + "]", 20));
	me.loadMask.hide();

    },

    oprGetChildWindow : function(sTitle, oModal, oWidth, oHeight) {

	var me = this;

	var oWindow = me.desktop.initWindow({
	    height : oHeight,
	    width : oWidth,
	    title : sTitle,
	    modal : oModal,
	    parentWindow : me,
	    isChildWindow : true,
	    iconCls : "system_child_window"
	});

	me.childWindows.push(oWindow);

	return oWindow;

    },

    removeChildWindowFromList : function(oChildWindow) {

	var me = this;
	var oNewList = [];

	for ( var i = 0; i < me.childWindows.length; i++) {

	    if (oChildWindow.id != me.childWindows[i].id)
		oNewList.push(me.childWindows[i]);

	}

	me.childWindows = oNewList;

    },

    closeAllChildWindows : function() {

	var me = this;

	for ( var i = me.childWindows.length - 1; i >= 0; i--)
	    me.childWindows[i].close();

    },

    getUrlDescription : function() {

	var me = this;

	if (me.loadedObjectType == "link")
	    return "";

	var oPos = me.getPosition();

	var oState = "0";
	if (me.minimized)
	    oState = -1;
	else if (me.maximized)
	    oState = 1;

	return me.loadedObject.self.getName() + ":" + me.currentState + ":" + oPos[0] + ":" + oPos[1] + ":" + me.getWidth() + ":" + me.getHeight() + ":" + oState;

    }

});
