/**
 * @class Ext.dirac.core.StateManagement This class manages the entire
 *        application platform
 * @mixins Ext.util.Observable
 * 
 */

Ext.define('Ext.dirac.core.StateManagement', {
    requires : [],

    cache : {
	application : {},
	reference : {}
    },

    activeStates : [],

    isStateLoaded : function(sStateType, sAppName, sStateName) {

	var me = this;

	if (sAppName in me.cache[sStateType]) {

	    if (sStateName in me.cache[sStateType][sAppName]) {

		return 1;

	    } else {

		return -1;

	    }

	} else {
	    return -2;
	}

    },

    getApplicationStates : function(sStateType, sAppName) {

	var me = this;
	var oAppStates = [];

	for ( var key in me.cache[sStateType][sAppName])
	    oAppStates.push(key);

	return oAppStates;

    },

    getStateData : function(sStateType, sAppName, sStateName) {

	var me = this;
	var oValidation = me.isStateLoaded(sStateType, sAppName, sStateName);

	if (oValidation == 1) {

	    return me.cache[sStateType][sAppName][sStateName];

	} else
	    return oValidation;

    },

    oprReadApplicationStatesAndReferences : function(sAppName, cbAfterRefresh) {

	var me = this;

	Ext.Ajax.request({
	    url : GLOBAL.BASE_URL + 'UP/listAppState',
	    params : {
		app : sAppName,
		obj : "application"
	    },
	    success : function(response) {

		var oStates = Ext.JSON.decode(response.responseText);
		me.cache["application"][sAppName] = {};

		for ( var sStateName in oStates) {

		    me.cache["application"][sAppName][sStateName] = oStates[sStateName];

		}

		Ext.Ajax.request({
		    url : GLOBAL.BASE_URL + 'UP/listAppState',
		    params : {
			app : sAppName,
			obj : "reference"
		    },
		    success : function(response) {

			var oStates = Ext.JSON.decode(response.responseText);
			me.cache["reference"][sAppName] = {};

			for ( var sStateName in oStates) {

			    me.cache["reference"][sAppName][sStateName] = oStates[sStateName];

			}

			cbAfterRefresh(sAppName);

		    },
		    failure : function(response) {
			me.cache["reference"][sAppName] = {};
			Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
		    }
		});

	    },
	    failure : function(response) {

		me.cache[sStateType][sAppName] = {};
		me.cache["reference"][sAppName] = {};

		Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
	    }
	});

    },

    /**
     * Function called when the Save As ... button from the SAVE window menu is
     * clicked
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
	    validateOnBlur : false

	});

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

    __isValidStateName : function(sStateName) {

	var regExpr = /^([0-9a-zA-Z\.\_\-]+)+$/;

	return (String(sStateName).search(regExpr) != -1);

    },

    /**
     * Function that is used to prepare and send the data of the desktop state
     * to the server.
     * 
     * @param {String}
     *                stateName The name of the state
     * @param {Boolean}
     *                isNewItem Parameter that says whether the state already
     *                exists or not
     */
    oprSendDataForSave : function(sStateName, bNewItem) {

	var me = this;

	var oSendData = me.__oAppObject.getStateData();
	/*
	 * We save those data in the database
	 */
	if (!Ext.isObject(oSendData)) {
	    /*
	     * Here the data to be sent is not an object
	     */
	    return;
	}

	/*
	 * If the Ajax is not successful the state wont be saved.
	 */
	Ext.Ajax.request({
	    url : GLOBAL.BASE_URL + 'UP/saveAppState',
	    params : {
		app : me.__sAppName,
		name : sStateName,
		state : Ext.JSON.encode(oSendData),
		obj : me.__sStateType
	    },
	    scope : me,
	    success : function(oResponse) {
		var me = this;
		Ext.example.msg("Notification", 'State saved successfully !');

		me.cache[me.__sStateType][me.__sAppName][sStateName] = oSendData;

		if (bNewItem) {
		    me.__cbAfterSave(me.__sAppName, sStateName);
		    me.saveWindow.hide();
		}

	    },
	    failure : function(response) {

		Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
	    }
	});

    },

    /**
     * Function to create and open the form for managing the desktop states
     */
    formManageStates : function(sAppName, cbAfterRemove) {

	var me = this;

	me.btnDeleteState = new Ext.Button({

	    text : 'Delete selected states',
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

	me.manageWindow = Ext.create('widget.window', {
	    height : 280,
	    width : 500,
	    title : 'Manage states :: ' + GLOBAL.APP.getApplicationTitle(sAppName),
	    layout : 'border',
	    modal : true,
	    resizable:false,
	    items : [ oToolbar, oPanel ]
	});

	me.manageWindow.show();

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

    isAnyActiveState : function(sAppName, sStateName) {

	var me = this;
	var oFound = false;

	for ( var i = 0; i < me.activeStates.length; i++) {

	    if ((sStateName == me.activeStates[i][1]) && (sAppName == me.activeStates[i][0])) {

		oFound = true;
		break;

	    }
	}

	return oFound;

    },

    addActiveState : function(sAppName, sStateName) {

	var me = this;

	me.activeStates.push([ sAppName, sStateName ]);

    },

    removeActiveState : function(sAppName, sStateName) {

	var me = this;
	var iIndex = -1;
	for ( var i = me.activeStates.length - 1; i >= 0; i--) {
	    if ((sStateName == me.activeStates[i][1]) && (sAppName == me.activeStates[i][0])) {
		iIndex = i;
		break;
	    }
	}
	if (iIndex != -1)
	    me.activeStates.splice(iIndex, 1);
    },

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
		 * First we check whether there are instances of that state that
		 * are active
		 */
		var oStateName = oSelectField.options[i].value;
		if (iWhoSelect == 0) {

		    if (!me.isAnyActiveState(sAppName, oStateName)) {

			/*
			 * If the Ajax is not successful then the item wont be
			 * deleted.
			 */
			Ext.Ajax.request({
			    url : GLOBAL.BASE_URL + 'UP/delAppState',
			    params : {
				app : sAppName,
				name : oStateName,
				obj : "application"
			    },
			    success : Ext.bind(me.cbDeleteSelectedStates, me, [ i, oSelectField, iWhoSelect ], false),
			    failure : function(response) {

				Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			    }
			});

		    } else
			Ext.MessageBox.alert('Message', 'The state <b>' + oSelectField.options[i].value + '</b> you are willing to delete is curently in use !');

		} else {

		    Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'UP/delAppState',
			params : {
			    app : sAppName,
			    name : oStateName,
			    obj : "reference"
			},
			success : Ext.bind(me.cbDeleteSelectedStates, me, [ i, oSelectField, iWhoSelect ], false),
			failure : function(response) {

			    Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
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
     *                index index of the selected element
     * @param {DOMObject}
     *                oSelectEl the select element of the management form
     */
    cbDeleteSelectedStates : function(index, oSelectEl, iWhoSelect) {

	var me = this;

	var sStateName = oSelectEl.options[index].value;
	var sAppName = me.manageWindow.items.getAt(1).appName;

	if (iWhoSelect == 0)
	    delete me.cache["application"][sAppName][sStateName];
	else
	    delete me.cache["reference"][sAppName][sStateName];

	me.manageWindow.items.getAt(1).cbAfterRemove(((iWhoSelect == 0) ? "application" : "reference"), sStateName, sAppName);

	oSelectEl.remove(index);

    },

    /*-----------------------------------------------SHARE STATE-----------------------------------------------*/

    oprShareState : function(sStateName, sAppName) {

	var me = this;

	Ext.Ajax.request({
	    url : GLOBAL.BASE_URL + 'UP/makePublicAppState',
	    params : {
		obj : "application",
		app : sAppName,
		name : sStateName,
		access : "ALL"
	    },
	    scope : me,
	    success : function(response) {

		var me = this;

		var oStringToShow = sAppName + "|" + GLOBAL.APP.configData["user"]["username"] + "|" + GLOBAL.APP.configData["user"]["group"] + "|" + sStateName;

		var oHtml = "";
		oHtml += "<div style='padding:5px'>The string you can send is as follows:</div>";
		oHtml += "<div style='padding:5px;font-weight:bold'>" + oStringToShow + "</div>";

		Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + sStateName + "</span> state:", oHtml);

	    },
	    failure : function(response) {

		var responseData = Ext.JSON.decode(response.responseText);
		Ext.example.msg("Notification", responseData["error"]);
	    }
	});

    },

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
		    alert("The value in the 'Shared State' field is not valid !");
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
		    alert("The 'Name' field cannot be empty !");
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

		    me.loadSharedState(me.txtLoadText.getValue(), null);
		    me.saveSharedState(me.txtRefName.getValue(), me.txtLoadText.getValue(), null);

		}

	    },
	    scope : me

	});

	var oToolbar = new Ext.toolbar.Toolbar();

	oToolbar.add([ me.btnLoadSharedState, me.btnSaveSharedState, me.btnLoadAndSaveSharedState ]);

	var oPanel = new Ext.create('Ext.panel.Panel', {
	    autoHeight : true,
	    border : false,
	    items : [ oToolbar, me.txtLoadText, me.txtRefName, ]
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

    },

    loadSharedState : function(oData, cbAfterLoadSharedState) {

	var me = this;

	if ((cbAfterLoadSharedState != null) && (cbAfterLoadSharedState != undefined))
	    me.__cbAfterLoadSharedState = cbAfterLoadSharedState;

	var oDataItems = oData.split("|");

	if (oDataItems.length != 4) {

	    alert("The 'Load' data you entered is not valid !");
	    return;

	}

	Ext.Ajax.request({
	    url : GLOBAL.BASE_URL + 'UP/loadUserAppState',
	    params : {
		obj : "application",
		app : oDataItems[0],
		user : oDataItems[1],
		group : oDataItems[2],
		name : oDataItems[3]
	    },
	    scope : me,
	    success : function(response) {

		var me = this;
		var oDataReceived = Ext.JSON.decode(response.responseText);

		if (me.__cbAfterLoadSharedState != null)
		    me.__cbAfterLoadSharedState(oData, oDataReceived);

		if (me.manageWindow)
		    me.manageWindow.close();

	    },
	    failure : function(response) {

		var responseData = Ext.JSON.decode(response.responseText);
		Ext.example.msg("Notification", responseData["error"]);
	    }
	});

    },

    saveSharedState : function(sRefName, sRef, cbAfterSaveSharedState) {

	var me = this;

	if ((cbAfterSaveSharedState != null) && (cbAfterSaveSharedState != undefined))
	    me.__cbAfterSaveSharedState = cbAfterSaveSharedState;

	var oDataItems = sRef.split("|");

	if (me.isStateLoaded("reference", oDataItems[0], sRefName) == 1) {

	    alert("The name for the link already exists !");
	    return;
	}

	Ext.Ajax.request({
	    url : GLOBAL.BASE_URL + 'UP/saveAppState',
	    params : {
		app : oDataItems[0],
		name : sRefName,
		state : Ext.JSON.encode({
		    link : sRef
		}),
		obj : "reference"
	    },
	    scope : me,
	    success : function(response) {

		Ext.example.msg("Notification", 'The shared state has been saved successfully !');

		me.txtLoadText.setRawValue("");
		me.txtRefName.setRawValue("");

		me.cache.reference[oDataItems[0]][sRefName] = {
		    link : sRef
		};

		if (me.__cbAfterSaveSharedState != null) {
		    me.__cbAfterSaveSharedState(sRefName, sRef);
		}

	    },
	    failure : function(response) {

		Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
	    }
	});

    },

/*-----------------------------------------------END - SHARE STATE-----------------------------------------------*/

});
