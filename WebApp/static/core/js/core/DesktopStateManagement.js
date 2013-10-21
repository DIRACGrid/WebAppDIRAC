/**
 * @class Ext.dirac.core.StateManagement This class manages the state management
 *        within the Desktop view
 * 
 */

Ext.define('Ext.dirac.core.DesktopStateManagement', {
	requires : [],

	﻿	/**
		 * Function called when the Save As ... button from the SAVE window menu is
		 * clicked
		 * 
		 * @param {String}
		 *          sStateType The type of the state [application|reference]
		 * @param {String}
		 *          sAppName Application class name
		 * @param {Object}
		 *          oAppObject The application object
		 * @param {Function}
		 *          cbAfterSave Function that is executed after the save has been
		 *          saved
		 */
	formSaveState : function(sStateType, sAppName, oAppObject, cbAfterSave) {

		var me = this;

		me.__oAppObject = oAppObject;
		me.__cbAfterSave = cbAfterSave;
		me.__sStateType = sStateType;
		me.__sAppName = sAppName;

		me.txtStateName = Ext.create('Ext.form.field.Text', {

			fieldLabel : "State Name:",
			labelAlign : 'left',
			margin : 10,
			width : 400,
			enableKeyEvents : true,
			validateValue : function(sValue) {

				sValue = Ext.util.Format.trim(sValue);

				if (sValue.length < 1) {
					this.markInvalid("You must specify a name !");
					return false;

				} else {

					if (me.isStateLoaded(me.__sStateType, me.__sAppName, sValue) == 1) {

						this.markInvalid("The name you enetered already exists !");
						return false;

					} else {

						if (me.__isValidStateName(sValue)) {
							this.clearInvalid();
							return true;
						} else {

							this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
							return false;

						}

					}

				}

			},
			validateOnChange : true,
			validateOnBlur : false,
			listeners : {

				keypress : function(oTextField, e, eOpts) {

					if (e.getCharCode() == 13) {

						if (me.txtStateName.isValid()) {

							var sStateName = me.txtStateName.getValue();

							me.oprSendDataForSave(sStateName, true);

						}

					}

				}

			}

		});

		// button for saving the state
		me.btnSaveState = new Ext.Button({

			text : 'Save',
			margin : 3,
			iconCls : "toolbar-other-save",
			handler : function() {

				if (me.txtStateName.isValid()) {

					var sStateName = me.txtStateName.getValue();

					me.oprSendDataForSave(sStateName, true);

				}

			},
			scope : me

		});

		// button to close the save form
		me.btnCancelSaveState = new Ext.Button({

			text : 'Cancel',
			margin : 3,
			iconCls : "toolbar-other-close",
			handler : function() {

				me.txtStateName.setValue("");
				me.__oAppObject = null;
				me.__cbAfterSave = null;
				me.__sStateType = null;
				me.saveWindow.hide();

			},
			scope : me

		});

		var oToolbar = new Ext.toolbar.Toolbar();

		oToolbar.add([ me.btnSaveState, me.btnCancelSaveState ]);

		var oPanel = new Ext.create('Ext.panel.Panel', {
			autoHeight : true,
			border : false,
			items : [ oToolbar, me.txtStateName ]
		});

		// initializing window showing the saving form
		me.saveWindow = Ext.create('widget.window', {
			height : 120,
			width : 500,
			title : 'Save state',
			layout : 'fit',
			modal : true,
			items : oPanel
		});

		me.saveWindow.show();
		me.txtStateName.focus();

	},
	
	/**
	 * Function called when the Save button from the SAVE window menu is clicked
	 * 
	 * @param {String}
	 *          sStateType The type of the state [application|reference]
	 * @param {String}
	 *          sAppName Application class name
	 * @param {Object}
	 *          oAppObject The application object
	 * @param {Function}
	 *          cbAfterSave Function that is executed after the save has been
	 *          saved
	 */
	oprSaveAppState : function(sStateType, sAppName, oAppObject, cbAfterSave) {

		var me = this;

		if (oAppObject.currentState == "") {

			me.formSaveState(sStateType, sAppName, oAppObject, cbAfterSave);

		} else {

			me.__oAppObject = oAppObject;
			me.__cbAfterSave = cbAfterSave;
			me.__sStateType = sStateType;
			me.__sAppName = sAppName;

			me.oprSendDataForSave(oAppObject.currentState, false);
		}
	},
	
	/**
	 * Function to create and open the form for managing the desktop states
	 * 
	 * @param {String}
	 *          sAppName Application class name
	 * @param {Function}
	 *          cbAfterRemove A function to be executed after a state has been
	 *          removed
	 * 
	 */
	formManageStates : function(sAppName, cbAfterRemove) {

		var me = this;

		me.btnDeleteState = new Ext.Button({

			text : 'Delete',
			margin : 3,
			iconCls : "toolbar-other-close",
			handler : me.oprDeleteSelectedStates,
			scope : me

		});

		var oToolbar = new Ext.toolbar.Toolbar({
			region : "north",
			border : false
		});

		oToolbar.add([ me.btnDeleteState ]);

		var oPanel = new Ext.create('Ext.panel.Panel', {
			region : "center",
			border : false,
			bodyPadding : 5,
			autoHeight : true,
			layout : {
				type : 'vbox',
				align : 'stretch'
			},
			appName : sAppName,
			cbAfterRemove : cbAfterRemove,
			items : [ {
				xtype : "panel",
				layout : "column",
				border : false,
				items : [ {
					xtype : 'radiofield',
					boxLabel : 'States',
					inputValue : 's',
					name : "manage_state_type",
					width : 150,
					padding : "0 0 5 0",
					checked : true,
					listeners : {

						change : function(cmp, newValue, oldValue, eOpts) {

							var oSelectElStates = me.manageWindow.items.getAt(1).items.getAt(1);
							var oSelectElLinks = me.manageWindow.items.getAt(1).items.getAt(2);

							if (newValue) {

								oSelectElStates.show();
								oSelectElLinks.hide();

							} else {

								oSelectElStates.hide();
								oSelectElLinks.show();

							}

						}

					}
				}, {
					xtype : 'radiofield',
					boxLabel : 'Links',
					inputValue : 'l',
					padding : "0 0 5 0",
					name : "manage_state_type",
					width : 150
				} ]
			}, {
				html : "<select multiple='multiple' style='width:100%;height:175px'></select>",
				xtype : "box"
			}, {
				html : "<select multiple='multiple' style='width:100%;height:175px'></select>",
				xtype : "box",
				hidden : true
			} ]
		});

		// creating the window
		me.manageWindow = Ext.create('widget.window', {
			height : 280,
			width : 500,
			title : 'Manage states :: ' + GLOBAL.APP.getApplicationTitle(sAppName),
			layout : 'border',
			modal : true,
			resizable : false,
			items : [ oToolbar, oPanel ]
		});

		me.manageWindow.show();

		// filling the lists of the form with states and references
		me.__oprFillSelectFieldWithStates();

	},

	/**
	 * Function to fill the select element with the existing module states
	 */
	__oprFillSelectFieldWithStates : function() {

		var me = this;
		var oSelectEl = document.getElementById(me.manageWindow.getId()).getElementsByTagName("select")[0];

		for (i = oSelectEl.length - 1; i >= 0; i--)
			oSelectEl.remove(i);

		var sAppName = me.manageWindow.items.getAt(1).appName;

		for ( var sStateName in me.cache.application[sAppName]) {

			var elOptNew = document.createElement('option');

			elOptNew.text = sStateName;
			elOptNew.value = sStateName;

			try {
				oSelectEl.add(elOptNew, null); // standards compliant; doesn't
				// work in IE
			} catch (ex) {
				oSelectEl.add(elOptNew); // IE only
			}

		}

		oSelectEl = document.getElementById(me.manageWindow.getId()).getElementsByTagName("select")[1];

		for (i = oSelectEl.length - 1; i >= 0; i--)
			oSelectEl.remove(i);

		for ( var sStateName in me.cache.reference[sAppName]) {

			var elOptNew = document.createElement('option');

			elOptNew.text = sStateName;
			elOptNew.value = sStateName;

			try {
				oSelectEl.add(elOptNew, null); // standards compliant; doesn't
				// work in IE
			} catch (ex) {
				oSelectEl.add(elOptNew); // IE only
			}

		}

	},
	
	/**
	 * Function to delete all selected states or references from the form lists
	 */
	oprDeleteSelectedStates : function() {

		var me = this;

		var iWhoSelect = 0;

		var sAppName = me.manageWindow.items.getAt(1).appName;

		if (me.manageWindow.items.getAt(1).items.getAt(0).items.getAt(1).getValue())
			iWhoSelect = 1;

		var oSelectField = document.getElementById(me.manageWindow.getId()).getElementsByTagName("select")[iWhoSelect];

		for ( var i = oSelectField.length - 1; i >= 0; i--) {
			if (oSelectField.options[i].selected) {

				/*
				 * First we check whether there are instances of that state that are
				 * active
				 */
				var oStateName = oSelectField.options[i].value;
				if (iWhoSelect == 0) {

					if (!me.isAnyActiveState(sAppName, oStateName)) {

						/*
						 * If the Ajax is not successful then the item wont be deleted.
						 */
						Ext.Ajax.request({
							url : GLOBAL.BASE_URL + 'UP/delAppState',
							params : {
								app : sAppName,
								name : oStateName,
								obj : "application"
							},
							success : Ext.bind(me.cbDeleteSelectedStates, me, [ i, oSelectField, iWhoSelect ], true),
							failure : function(response) {

								if (response.status == 400)
									Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
								else
									Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');

							}
						});

					} else
						GLOBAL.APP.CF.alert('The state <b>' + oSelectField.options[i].value + '</b> you are willing to delete is curently in use !', 'warning');

				} else {

					Ext.Ajax.request({
						url : GLOBAL.BASE_URL + 'UP/delAppState',
						params : {
							app : sAppName,
							name : oStateName,
							obj : "reference"
						},
						success : Ext.bind(me.cbDeleteSelectedStates, me, [ i, oSelectField, iWhoSelect ], true),
						failure : function(response) {

							if (response.status == 400)
								Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
							else
								Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
						}
					});

				}

			}
		}

	},
	
	/**
	 * Callback of the oprDeleteSelectedStates function
	 * 
	 * @param {Integer}
	 *          index index of the selected element
	 * @param {DOMObject}
	 *          oSelectEl the select element of the management form
	 */
	cbDeleteSelectedStates : function(response, options, index, oSelectEl, iWhoSelect) {

		if (response.status == 200) {

			var me = this;

			var sStateName = oSelectEl.options[index].value;
			var sAppName = me.manageWindow.items.getAt(1).appName;

			if (iWhoSelect == 0)
				delete me.cache["application"][sAppName][sStateName];
			else
				delete me.cache["reference"][sAppName][sStateName];

			me.manageWindow.items.getAt(1).cbAfterRemove(((iWhoSelect == 0) ? "application" : "reference"), sStateName, sAppName);

			oSelectEl.remove(index);

		} else {

			if (response.status == 400)
				Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
			else
				Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');

		}

	},
	
	/**
	 * Function to create and show the form for saving or loading a shared state
	 * 
	 * @param {Function}
	 *          cbAfterLoad Function to be executed after the shared state has
	 *          been loaded
	 * @param {Function}
	 *          cbAfterSave Function to be executed after the shared state has
	 *          been saved
	 * 
	 */
	formStateLoader : function(cbAfterLoad, cbAfterSave) {

		var me = this;

		me.txtLoadText = Ext.create('Ext.form.field.Text', {

			fieldLabel : "Shared State:",
			labelAlign : 'left',
			margin : 10,
			width : 400,
			validate : function() {
				var me = this;
				var sValue = me.getValue();
				if ((Ext.util.Format.trim(sValue) != "") && (sValue.split("|").length == 4)) {
					return true;
				} else {
					GLOBAL.APP.CF.alert("The value in the 'Shared State' field is not valid !", "warning");
					return false;
				}

			},
			validateOnChange : false,
			validateOnBlur : false

		});

		me.txtRefName = Ext.create('Ext.form.field.Text', {

			fieldLabel : "Name:",
			labelAlign : 'left',
			margin : 10,
			width : 400,
			validate : function() {
				var me = this;

				if (Ext.util.Format.trim(me.getValue()) != "") {

					return true;

				} else {
					GLOBAL.APP.CF.alert("The 'Name' field cannot be empty !", "warning");
					return false;
				}

			},
			validateOnChange : false,
			validateOnBlur : false
		});

		me.btnLoadSharedState = new Ext.Button({

			text : 'Load',
			margin : 3,
			iconCls : "toolbar-other-load",
			handler : function() {

				if (me.txtLoadText.validate()) {
					GLOBAL.APP.desktop.closeAllActiveWindows();
					GLOBAL.APP.desktop.currentState = "";

					me.loadSharedState(me.txtLoadText.getValue(), null);
				}
			},
			scope : me

		});

		me.btnSaveSharedState = new Ext.Button({

			text : 'Create Link',
			margin : 3,
			iconCls : "toolbar-other-save",
			handler : function() {

				var oValid = true;

				if (!me.txtLoadText.validate())
					oValid = false;

				if (!me.txtRefName.validate())
					oValid = false;

				if (oValid) {

					me.saveSharedState(me.txtRefName.getValue(), me.txtLoadText.getValue(), null);

				}

			},
			scope : me

		});

		me.btnLoadAndSaveSharedState = new Ext.Button({

			text : 'Load &amp; Create Link',
			margin : 3,
			iconCls : "toolbar-other-load",
			handler : function() {
				var oValid = true;

				if (!me.txtLoadText.validate())
					oValid = false;

				if (!me.txtRefName.validate())
					oValid = false;

				if (oValid) {
					GLOBAL.APP.desktop.closeAllActiveWindows();
					GLOBAL.APP.desktop.currentState = "";
					me.loadSharedState(me.txtLoadText.getValue(), null);
					me.saveSharedState(me.txtRefName.getValue(), me.txtLoadText.getValue(), null);

				}

			},
			scope : me

		});

		var oToolbar = new Ext.toolbar.Toolbar({

			border : false

		});

		oToolbar.add([ me.btnLoadSharedState, me.btnSaveSharedState, me.btnLoadAndSaveSharedState ]);

		var oPanel = new Ext.create('Ext.panel.Panel', {
			autoHeight : true,
			border : false,
			items : [ oToolbar, me.txtLoadText, me.txtRefName ]
		});

		me.__cbAfterLoadSharedState = cbAfterLoad;
		me.__cbAfterSaveSharedState = cbAfterSave;

		me.manageWindow = Ext.create('widget.window', {
			height : 200,
			width : 500,
			title : 'State Loader',
			layout : 'fit',
			modal : true,
			items : [ oPanel ],
			iconCls : "system_state_icon",
			listeners : {

				close : function(oPanel, eOpts) {

					me.__cbAfterLoadSharedState = null;
					me.__cbAfterSaveSharedState = null;

				}

			}
		});

		me.manageWindow.show();

	}
	
	

});