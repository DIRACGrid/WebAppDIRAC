/**
 * @class Ext.dirac.views.desktop.Window This is a window widget with extended
 *        functionality such as state management
 * @extend Ext.window.Window
 * 
 */
Ext.define('Ext.dirac.views.desktop.Window', {
	extend : 'Ext.window.Window',
	requires : [ "Ext.dirac.utils.DiracToolButton", "Ext.menu.Menu", "Ext.menu.Item", "Ext.form.*", "Ext.LoadMask" ],
	mixins : [ "Ext.dirac.core.Container" ],

	/**
	 * @property {String} currentState The name of the current active desktop
	 *           state
	 */
	currentState : "",
	/**
	 * @property {Object} loadedObject The object of the module loaded within the
	 *           window
	 */
	loadedObject : null,
	/**
	 * @property {Ext.LoadMask} loadMask The load mask used when a state is being
	 *           loaded
	 */
	loadMask : null,
	/**
	 * @property {Ext.dirac.views.desktop.Main} desktop Reference to the desktop
	 *           object
	 */
	desktop : null,

	/**
	 * @cfg {String} Configuration property that sets the resizable borders of a
	 *      window
	 */
	resizeHandles : "s e se",

	initComponent : function() {

		var me = this;

		// property indicating whether the window is pinned or not
		me.desktopStickMode = false;

		/*
		 * if the window is pinned, then this is the matrix index regarding the X
		 * axis
		 */
		me.i_x = -1;

		/*
		 * if the window is pinned, then this is the matrix index regarding the Y
		 * axis
		 */
		me.i_y = -1;

		/*
		 * if the window is pinned, then this is the number of cells taken by the
		 * app regarding the X axis
		 */
		me.ic_x = -1;

		/*
		 * if the window is pinned, then this is the number of cells taken by the
		 * app regarding the Y axis
		 */
		me.ic_y = -1;

		/*
		 * if the window is pinned, then this is the X coordinate of the window
		 */
		me._x = -1;

		/*
		 * if the window is pinned, then this is the Y coordinate of the window
		 */
		me._y = -1;

		/*
		 * This data structure saves the state before the app gets pinned
		 */
		me._before_pin_state = {
			x : 0,
			y : 0,
			width : 200,
			height : 200,
			maximized : false,
			minimized : false
		};

		me.loadMask = new Ext.LoadMask(me, {
			msg : "Loading ..."
		});

		if (me.loadedObjectType == "app") {
			// setting the app object as an item in the window
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

		// a list of the child windows
		me.oneTimeAfterShow = false;

		me.childWindows = [];
		me.callParent();

	},

	afterShow : function() {

		var me = this;

		me.callParent();

		if (!me.oneTimeAfterShow) {
			if (me.loadedObjectType == "app")
				me.setLoadedObject(me.setupData);
			else if (me.loadedObjectType == "link")
				me.setPropertiesWhenLink(me.setupData);

			GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

			// removing the dblclick event handler from the window header
			me.header.un({
				dblclick : {
					fn : me.toggleMaximize,
					element : 'el',
					scope : me
				}
			});
			me.oneTimeAfterShow = true;
		}

	},

	/**
	 * Function to set a state of the loaded object and a state of the window
	 * itself
	 * 
	 * @param {Object}
	 *          setupData Setup data
	 */
	setLoadedObject : function(setupData) {

		var me = this;

		me.minimized = false;

		var oDesktopDim = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

		if (setupData != null) {

			if (("desktopStickMode" in setupData) && (parseInt(setupData["desktopStickMode"], 10) == 1)) {
				/*
				 * if the applcation has to be pinned
				 */
				me.i_x = setupData["i_x"];
				me.i_y = setupData["i_y"];
				me.ic_x = setupData["ic_x"];
				me.ic_y = setupData["ic_y"];

				/*
				 * Taking the cells where the window is going to reside
				 */
				me.desktop.setDesktopMatrixCells(me.i_x, me.i_x + me.ic_x - 1, me.i_y, me.i_y + me.ic_y - 1, true);

				me.desktopStickMode = true;

				me._x = Math.round(me.i_x * me.desktop.boxSizeX);
				me._y = Math.round(me.i_y * me.desktop.boxSizeY);

				var oPos = me.getPosition();

				if ("_before_pin_state" in setupData)
					me._before_pin_state = setupData["_before_pin_state"];

				me.suspendEvents(false);
				// setting the position and the size of the window
				me.setPosition(Math.round(me.i_x * me.desktop.boxSizeX), Math.round(me.i_y * me.desktop.boxSizeY));
				me.setSize(Math.round(me.ic_x * me.desktop.boxSizeX), Math.round(me.ic_y * me.desktop.boxSizeY));
				me.resumeEvents();

				me.desktopGridStickButton.setType("unpin");
				me.getHeader().show();

				/*
				 * Hide minimize, maximize, restore
				 */
				me.tools[3].hide();
				me.tools[4].hide();
				me.tools[5].hide();

			} else if (("maximized" in setupData) && (setupData["maximized"])) {

				/*
				 * If it is not pinned but maximized
				 */
				me.maximize();

			} else if (("minimized" in setupData) && (setupData["minimized"])) {

				/*
				 * If it is not pinned but minimized
				 */

				if ("width" in setupData) {

					if (parseInt(setupData.width, 10) <= 100) {
						me.setWidth(parseInt(parseInt(setupData.width, 10) * oDesktopDim[0] / 100, 10));
					} else {
						me.setWidth(parseInt(setupData.width, 10));
					}

				}

				if ("height" in setupData) {

					if (parseInt(setupData.height, 10) <= 100) {
						me.setHeight(parseInt(parseInt(setupData.height, 10) * oDesktopDim[1] / 100, 10));
					} else {
						me.setHeight(parseInt(setupData.height, 10));
					}
				}

				me.desktop.minimizeWindow(me);

			} else {

				/*
				 * If the window is not maximized nor minimized nor pinned
				 */
				if ("x" in setupData) {
					me.setPosition(parseInt(setupData.x, 10), parseInt(setupData.y, 10));
				}

				if ("width" in setupData) {
					if (parseInt(setupData.width, 10) <= 100) {
						me.setWidth(parseInt(parseInt(setupData.width, 10) * oDesktopDim[0] / 100, 10));
					} else {
						me.setWidth(parseInt(setupData.width, 10));
					}
				}

				if ("height" in setupData) {
					if (parseInt(setupData.height, 10) <= 100) {
						me.setHeight(parseInt(parseInt(setupData.height, 10) * oDesktopDim[1] / 100, 10));
					} else {
						me.setHeight(parseInt(setupData.height, 10));
					}
				}

				// if no width nor height are set up
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

			// setting the Z-index
			if ("zIndex" in setupData) {

				me.setZIndex(setupData.zIndex);

			}

			// if there is a state to load, we load that state
			if ("stateToLoad" in setupData) {

				me.oprLoadAppStateFromCache(setupData["stateToLoad"]);

			} else {

				// if there is no state to load, but only data to apply
				if ("data" in setupData) {

					if ("currentState" in setupData) {

						if (setupData.currentState != "") {
							me.currentState = setupData.currentState;
							me.loadedObject.currentState = setupData.currentState;
							GLOBAL.APP.SM.oprAddActiveState(me.loadedObject.self.getName(), me.currentState);
						}

					}

					me.loadedObject.loadState(setupData.data);
				}

			}

			// if the header of the window has to be hidden
			if ("headerHidden" in setupData) {

				if (setupData["headerHidden"] == 1)
					me.getHeader().hide();

			}

		} else {

			// if no setupdata is provided

			if ((me.loadedObject.launcher.x != null) && (me.loadedObject.launcher.y != null)) {

				me.setPosition(me.loadedObject.launcher.x, me.loadedObject.launcher.y);

			} else {

				me.setPosition(0, 0);

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

		/*
		 * Setting other properties related to the window
		 */

		if (me.currentState == "") {

			me.setTitle(me.loadedObject.launcher.title);
			me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title, 20));

		} else {
			me.setTitle(me.loadedObject.launcher.title + " [" + me.currentState + "]");
			me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title + " [" + me.currentState + "]", 20));
		}

		if (me.desktopStickMode)
			me.taskButton.setIconCls("system_pin_window");
		else
			me.taskButton.setIconCls(me.loadedObject.launcher.iconCls);

		me.setIconCls(me.loadedObject.launcher.iconCls);

		// making relation between the application and the window container
		me.loadedObject.setContainer(me);

	},

	/**
	 * Function invoked when the window gets restored to the previous state at the
	 * desktop. The function is used in the Desktop object.
	 * 
	 * @param {Object}
	 *          oData Data to be applied
	 */
	loadWindowFrameState : function(oData) {

		var me = this;

		me.suspendEvents(false);
		me.minimized = false;
		
		var oDesktopDim = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

		if (("maximized" in oData) && (oData["maximized"])) {

			me.maximize();

		} else if (("minimized" in oData) && (oData["minimized"])) {

			if ("width" in setupData) {

				if (parseInt(oData.width, 10) <= 100) {
					me.setWidth(parseInt(parseInt(oData.width, 10) * oDesktopDim[0] / 100, 10));
				} else {
					me.setWidth(parseInt(oData.width, 10));
				}

			}

			if ("height" in setupData) {

				if (parseInt(oData.height, 10) <= 100) {
					me.setHeight(parseInt(parseInt(oData.height, 10) * oDesktopDim[1] / 100, 10));
				} else {
					me.setHeight(parseInt(oData.height, 10));
				}

			}

			me.desktop.minimizeWindow(me);

		} else {
			
			if ("x" in oData) {
				me.setPosition(parseInt(oData.x, 10), parseInt(oData.y, 10));
			}

			if ("width" in oData) {
				
				if (parseInt(oData.width, 10) <= 100) {
					me.setWidth(parseInt(parseInt(oData.width, 10) * oDesktopDim[0] / 100, 10));
				} else {
					me.setWidth(parseInt(oData.width, 10));
				}
			}

			if ("height" in oData) {
				
				if (parseInt(oData.height, 10) <= 100) {
					me.setHeight(parseInt(parseInt(oData.height, 10) * oDesktopDim[1] / 100, 10));
				} else {
					me.setHeight(parseInt(oData.height, 10));
				}
			}

			if ((!("height" in oData)) && (!("width" in oData))) {

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

		me.resumeEvents();

	},

	/**
	 * Function to set a state of the window where a link has been loaded
	 * 
	 * @param {Object}
	 *          setupData Setup data
	 */
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
			 * A call to isStateLoaded can be used to see whether the application
			 * states have been loaded
			 */
			var iAppStatesLoaded = GLOBAL.APP.SM.isStateLoaded("application", me.appClassName, "|");// OK

			if (iAppStatesLoaded != -2) {

				if (GLOBAL.STATE_MANAGEMENT_ENABLED)
					me.oprRefreshAppStates();

			} else {

				/*
				 * if the application cache does not exist
				 */

				var oFunc = function(iCode, sAppName) {

					if (iCode == 1) {
						me.oprRefreshAppStates();
					}

				}

				if (GLOBAL.STATE_MANAGEMENT_ENABLED)
					GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(me.appClassName, oFunc);

			}

			var funcAfterSave = function(iCode, sAppName, sStateType, sStateName) {

				if ((iCode == 1) && (me.currentState != sStateName)) {

					me.desktop.addStateToExistingWindows("application", sStateName, sAppName);

					if (me.currentState != "")
						GLOBAL.APP.SM.oprRemoveActiveState(sAppName, me.currentState);

					me.loadedObject.currentState = sStateName;
					me.currentState = sStateName;
					GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);
					me.setTitle(me.loadedObject.launcher.title + " [" + me.loadedObject.currentState + "]");
					me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title + " [" + me.loadedObject.currentState + "]", 20));
					GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

					if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow)
						GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
				}

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
					iconCls : "dirac-icon-save",
					handler : Ext.bind(me.desktop.SM.oprSaveAppState, me.desktop.SM, [ "application", me.loadedObject.self.getName(), me.loadedObject, funcAfterSave ], false),
					scope : me
				}, {
					text : "Save As ...",
					iconCls : "dirac-icon-save",
					handler : Ext.bind(me.desktop.SM.formSaveState, me.desktop.SM, [ "application", me.loadedObject.self.getName(), me.loadedObject, funcAfterSave ], false),
					scope : me
				}, {
					text : "Refresh states",
					iconCls : "toolbar-other-refresh",
					handler : me.oprRefreshAllAppStates,
					scope : me
				}, {
					text : "Manage states ...",
					iconCls : "toolbar-other-manage",
					handler : Ext.bind(me.desktop.SM.formManageStates, me.desktop.SM, [ me.loadedObject.self.getName(), funcAfterRemove ], false),
					scope : me
				} ]
			});

			me.addTool({
				xtype : "diracToolButton",
				type : "save",
				menu : ((GLOBAL.STATE_MANAGEMENT_ENABLED) ? me.loadMenu : []),
				tooltip : "Save state menu"
			});

			me.desktopGridStickButton = new Ext.dirac.utils.DiracToolButton({
				type : "pin",
				handler : function() {
					me.desktop.setDesktopStickMode(me);
				},
				tooltip : "Pin/Unpin window onto the desktop"
			});

			me.addTool(me.desktopGridStickButton);

			me.addTool({
				xtype : "diracToolButton",
				type : "toggle",
				handler : function() {
					me.getHeader().hide();
				},
				tooltip : "Hide window header"
			});

		}

		me.callParent();

	},
	/**
	 * Function that is called when the refresh button of the SAVE window menu is
	 * clicked
	 */
	oprRefreshAllAppStates : function() {

		var me = this;

		me.desktop.oprRefreshAllAppStates(me.appClassName);

	},
	/**
	 * Function for adding new state within the list of existing states
	 * 
	 * @param {String}
	 *          stateType The type of the state [application|reference]
	 * @param {String}
	 *          stateName The name of the state
	 */
	addNewState : function(stateType, stateName) {

		var me = this;

		if (stateType == "application") {

			var newItem = Ext.create('Ext.menu.Item', {
				text : stateName,
				handler : Ext.bind(me.oprLoadAppStateFromCache, me, [ stateName ], false),
				scope : me,
				iconCls : "dirac-icon-state",
				stateType : stateType,
				menu : [ {
					text : "Share state",
					handler : function() {

						GLOBAL.APP.SM.oprShareState(me.loadedObject.self.getName(), stateName, function(rCode, rAppName, rStateName, rMessage) {

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
				iconCls : "dirac-icon-link",
				stateType : stateType
			});

			me.statesMenu.add(newItem);

		}

	},

	/**
	 * Function for removing a state from the list of existing states
	 * 
	 * @param {String}
	 *          stateType The type of the state [application|reference]
	 * @param {String}
	 *          stateName The name of the state
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

		// first we remove all items from the menu
		me.statesMenu.removeAll();

		// first we fill the menu with the states
		var oStates = GLOBAL.APP.SM.getApplicationStates("application", me.appClassName);// OK

		for ( var i = 0, len = oStates.length; i < len; i++) {

			var stateName = oStates[i];

			var oNewItem = Ext.create('Ext.menu.Item', {
				text : stateName,
				handler : Ext.bind(me.oprLoadAppStateFromCache, me, [ stateName ], false),
				scope : me,
				iconCls : "dirac-icon-state",
				stateType : "application",
				menu : [ {
					text : "Share state",
					handler : function() {

						GLOBAL.APP.SM.oprShareState(me.appClassName, stateName, function(rCode, rAppName, rStateName, rMessage) {

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

			me.statesMenu.add(oNewItem);

		}

		me.statesMenu.add("-");

		// then we fill the menu with the refrences
		var oRefs = GLOBAL.APP.SM.getApplicationStates("reference", me.appClassName);// OK

		for ( var i = 0, len = oRefs.length; i < len; i++) {

			var stateName = oRefs[i];

			var oNewItem = Ext.create('Ext.menu.Item', {
				text : stateName,
				handler : Ext.bind(me.desktop.loadSharedStateByName, me.desktop, [ me.appClassName, stateName ], false),
				scope : me,
				iconCls : "dirac-icon-link",
				stateType : "reference"
			});

			me.statesMenu.add(oNewItem);

		}

	},

	/**
	 * Function to load module state with data from the cache
	 * 
	 * @param {String}
	 *          stateName The name of the state
	 */
	oprLoadAppStateFromCache : function(stateName) {

		var me = this;

		// checking whether the state exists or not
		var iStateLoaded = GLOBAL.APP.SM.isStateLoaded("application", me.appClassName, stateName);// OK

		switch (iStateLoaded) {
		case -1:
			GLOBAL.APP.CF.alert("The state does not exist !", "warning");
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

		/*
		 * loading the state data and setting other properties related to the window
		 */
		me.loadMask.show();

		me.closeAllChildWindows();

		me.loadedObject.loadState(GLOBAL.APP.SM.getStateData("application", me.appClassName, stateName));// OK

		if (me.currentState != "")
			GLOBAL.APP.SM.oprRemoveActiveState(me.appClassName, me.currentState);// OK

		me.currentState = stateName;
		me.loadedObject.currentState = stateName;

		GLOBAL.APP.SM.oprAddActiveState(me.appClassName, stateName);// OK
		GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();

		me.setTitle(me.loadedObject.launcher.title + " [" + stateName + "]");
		me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title + " [" + stateName + "]", 20));
		me.loadMask.hide();

	},

	/**
	 * Function to load module state with data from the cache
	 * 
	 * @param {String}
	 *          stateName The name of the state
	 */
	createChildWindow : function(sTitle, oModal, oWidth, oHeight) {

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

	/**
	 * Function to remove a child window from the list of child windows
	 * 
	 * @param {Ext.dirac.views.desktop.Window}
	 *          oChildWindow Rference to the child window
	 */
	removeChildWindowFromList : function(oChildWindow) {

		var me = this;
		var oNewList = [];

		for ( var i = 0; i < me.childWindows.length; i++) {

			if (oChildWindow.id != me.childWindows[i].id)
				oNewList.push(me.childWindows[i]);

		}

		me.childWindows = oNewList;

	},

	/**
	 * Function to close all child windows
	 * 
	 */
	closeAllChildWindows : function() {

		var me = this;

		for ( var i = me.childWindows.length - 1; i >= 0; i--)
			me.childWindows[i].close();

	},

	/**
	 * Function to get the data describing the state of the window at the desktop
	 * area
	 */
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

		var sRet = "";
		sRet += me.loadedObject.self.getName() + ":";
		sRet += me.currentState + ":";
		sRet += oPos[0] + ":";
		sRet += oPos[1] + ":";
		sRet += me.getWidth() + ":";
		sRet += me.getHeight() + ":";
		sRet += oState + ":";
		sRet += ((me.desktopStickMode) ? "1" : "0") + "," + ((me.getHeader().hidden) ? "1" : "0") + "," + me.i_x + "," + me.i_y + "," + me.ic_x + "," + me.ic_y;

		return sRet;

	}

});
