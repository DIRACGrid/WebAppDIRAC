/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('DIRAC.MetadataCatalog.classes.MetadataCatalog', {
    extend : 'Ext.dirac.core.Module',
    requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.form.field.Date",
	    "Ext.form.field.TextArea", "Ext.form.field.Checkbox", "Ext.form.FieldSet", "Ext.Button", "Ext.dirac.utils.DiracMultiSelect", "Ext.util.*", "Ext.toolbar.Toolbar", "Ext.data.Record",
	    "Ext.tree.Panel", "Ext.data.TreeStore", "Ext.data.NodeInterface", 'Ext.form.field.TextArea', 'Ext.Array', 'Ext.grid.Panel', 'Ext.form.field.Text' ],

    loadState : function(oData) {

    },

    getStateData : function() {

	var me = this;
	var oReturn = {};

	return oReturn;

    },

    initComponent : function() {

	var me = this;

	me.launcher.title = "Metadata Catalog";
	me.launcher.maximized = true;

	Ext.apply(me, {
	    layout : 'border',
	    bodyBorder : false,
	    defaults : {
		collapsible : true,
		split : true
	    },
	    items : []
	});

	me.callParent(arguments);

    },

    buildUI : function() {

	var me = this;

	/*-------------------------------------------------------------------------------------*/

	var queryPanelToolbarBottom = new Ext.toolbar.Toolbar({
	    dock : 'bottom',
	    layout : {
		pack : 'center'
	    },
	    items : []
	});

	me.btnSubmitLeftPanel = new Ext.Button({

	    text : 'Submit',

	    iconCls : "meta-submit-icon",
	    handler : function() {

	    },
	    scope : me

	});

	me.btnResetLeftPanel = new Ext.Button({

	    text : 'Refresh',

	    iconCls : "meta-reset-icon",
	    handler : function() {

	    },
	    scope : me

	});

	queryPanelToolbarBottom.add([ me.btnSubmitLeftPanel, me.btnResetLeftPanel ]);

	var queryPanelToolbarTop = new Ext.toolbar.Toolbar({
	    dock : 'top',
	    layout : {
		pack : 'center'
	    },
	    items : []
	});

	queryPanelToolbarTop.add({
	    xtype : 'tbtext',
	    text : "Path to start from:"
	});

	me.txtPathField = new Ext.form.field.Text({
	    width : 200,
	    value : '/'
	});

	queryPanelToolbarTop.add(me.txtPathField);

	me.btnResetPath = new Ext.Button({

	    text : '',

	    iconCls : "meta-reset-icon",
	    handler : function() {

	    },
	    scope : me

	});

	queryPanelToolbarTop.add(me.btnResetPath);

	me.queryPanel = new Ext.create('Ext.panel.Panel', {
	    title : 'Metadata Query',
	    region : 'north',
	    floatable : false,
	    bodyBorder : false,
	    margins : '0',
	    width : 450,
	    minWidth : 400,
	    maxWidth : 550,
	    bodyPadding : 0,
	    autoScroll : true,
	    height : 300
	});

	me.queryPanel.addDocked([ queryPanelToolbarBottom, queryPanelToolbarTop ]);

	/*-------------------------------------------------------------------------------------*/

	me.rightPanel = new Ext.create('Ext.panel.Panel', {
	    region : 'center',
	    floatable : false,
	    margins : '0',
	    bodyPadding : 0,
	    autoScroll : true,
	    flex : 1
	});

	/*
	 * The grid for the metadata choice (part of the metadataOptionPanel)
	 */

	me.metadataCatalogStore = new Ext.data.SimpleStore({
	    fields : [ 'Type', 'Name' ],
	    data : []
	});

	var metadataCatalogGridToolbar = new Ext.toolbar.Toolbar({
	    dock : 'bottom',
	    layout : {
		pack : 'center'
	    },
	    items : []
	});

	me.btnRefreshLeftPanel = new Ext.Button({

	    text : 'Refresh',

	    iconCls : "meta-refresh-icon",
	    handler : function() {

		for ( var i = 0; i < me.queryPanel.items.length; i++) {

		    console.log(me.__getValueBlockDescription(me.queryPanel.items.getAt(i)));
		}
	    },
	    scope : me

	});

	metadataCatalogGridToolbar.add(me.btnRefreshLeftPanel);

	me.metadataCatalogGrid = Ext.create('Ext.grid.Panel', {
	    title : 'Metadata Catalog',
	    region : 'center',

	    hideHeaders : true,
	    store : me.metadataCatalogStore,
	    bodyBorder : false,
	    viewConfig : {
		stripeRows : true,
		enableTextSelection : true
	    },
	    columns : [ {
		width : 26,
		sortable : false,
		dataIndex : 'Type',
		renderer : function(value, metaData, record, row, col, store, gridView) {
		    return this.rendererType(value);
		},
		hideable : false,
		fixed : true,
		menuDisabled : true,
		align : 'center'
	    }, {
		dataIndex : 'Name',
		align : 'left',
		sortable : false,
		hideable : false,
		flex : 1
	    } ],
	    rendererType : function(value) {
		if (value == 'varchar(128)') {
		    return '<img src="static/DIRAC/MetadataCatalog/images/str.gif">';
		} else if (value == 'int') {
		    return '<img src="static/DIRAC/MetadataCatalog/images/int.gif">';
		} else if (value == 'datetime') {
		    return '<img src="static/DIRAC/MetadataCatalog/images/date.gif">';
		} else {
		    return '<img src="static/DIRAC/MetadataCatalog/images/unknown.gif">';
		}
	    },
	    listeners : {

		itemclick : function(oView, oRecord, item, index, e, eOpts) {

		    switch (oRecord.get("Type")) {

		    case "varchar(128)":
			me.queryPanel.add(me.__getDropDownField(oRecord.get("Name")));
			break;
		    default:
			me.queryPanel.add(me.__getValueField(oRecord.get("Name"), oRecord.get("Type")));
			break;

		    }

		}

	    }

	});

	me.metadataCatalogGrid.addDocked(metadataCatalogGridToolbar);

	var oLeftPanel = new Ext.create('Ext.panel.Panel', {
	    region : 'west',
	    layout : 'border',
	    bodyBorder : false,
	    defaults : {
		collapsible : true,
		split : true
	    },
	    width : 450,
	    minWidth : 400,
	    maxWidth : 550,
	    items : [ me.queryPanel, me.metadataCatalogGrid ]

	});

	me.add([ oLeftPanel, me.rightPanel ]);
	me.fieldsTypes = {};

	Ext.Ajax.request({
	    url : _app_base_url + 'MetadataCatalog/getMetadataFields',
	    method : 'POST',
	    params : {},
	    scope : me,
	    success : function(oReponse) {

		oResponse = Ext.JSON.decode(oReponse.responseText);

		if (oResponse.success == "true") {

		    // populating the fields for the first time

		    me.fieldsTypes = oResponse.result;

		    me.metadataCatalogStore.removeAll();

		    var oNewData = [];

		    for ( var key in me.fieldsTypes)
			oNewData.push([ me.fieldsTypes[key], key ]);

		    me.metadataCatalogStore.add(oNewData);

		    me.__getQueryData(false, false);

		} else {
		    alert(oResponse.error);
		}

	    }
	});

    },

    onItemLogicOperationClick : function(oItem, e, eOpts) {

	oItem.up("button").setIconCls(oItem.iconCls);

    },

    __removeLastBlockIfEmpty : function() {

	var me = this;

	if (me.queryPanel.items.length > 0) {
	    var oLastBlock = me.queryPanel.items.getAt(me.queryPanel.items.length - 1);

	    var oDropDown = oLastBlock.items.getAt(2);

	    if (oDropDown.getValue().length == 0) {

		me.queryPanel.remove(oLastBlock);

	    }
	}

    },
    __removeBlock : function(oBlock) {

	var me = this;
	me.queryPanel.remove(oBlock);
	me.__getQueryData(true, false);

    },

    __getDropDownField : function(sName) {

	var me = this;

	me.__removeLastBlockIfEmpty();

	var oDropDown = Ext.create('Ext.dirac.utils.DiracBoxSelect', {
	    queryMode : 'local',
	    displayField : "text",
	    valueField : "value",
	    width : 250,
	    margin : 3,
	    store : new Ext.data.SimpleStore({
		fields : [ 'value', 'text' ],
		data : me.__getFieldOptions(sName)
	    }),
	    listeners : {

		change : function(oField, newValue, oldValue, eOpts) {

		    me.__getQueryData(true, false);

		},
		expand : function(oField, eOpts) {

		    me.queryPanel.body.mask("Wait ...");
		    oField.collapse();
		    me.__expandMenuBeforeExpandMenu(oPanel);

		}

	    }
	});

	var oPanel = Ext.create('Ext.container.Container', {
	    layout : {
		type : 'hbox',
		// align : 'stretch',
		margin : 3
	    },
	    fieldName : sName,
	    blockType : "string",
	    items : [ {
		xtype : 'panel',
		html : "<div style='padding:7px 0px 0px 5px;'>" + sName + "</div>",
		border : false,
		flex : 1
	    }, {
		xtype : "button",
		iconCls : "meta-in-icon",
		margin : 3
	    }, oDropDown, {
		xtype : "button",
		iconCls : "meta-reset-icon",
		margin : 3,
		handler : function() {

		    me.__removeBlock(oPanel);

		}
	    } ]

	});

	return oPanel;

    },
    __getValueField : function(sName, sType) {

	var me = this;

	me.__removeLastBlockIfEmpty();

	var oDropDown = Ext.create('Ext.dirac.utils.DiracBoxSelect', {
	    queryMode : 'local',
	    displayField : "text",
	    valueField : "value",
	    width : 250,
	    margin : 3,
	    store : new Ext.data.SimpleStore({
		fields : [ 'value', 'text' ],
		data : me.__getFieldOptions(sName)
	    }),
	    listeners : {

		change : function(oField, newValue, oldValue, eOpts) {

		    me.__getQueryData(true, false);

		},
		expand : function(oField, eOpts) {

		    me.queryPanel.body.mask("Wait ...");
		    oField.collapse();
		    me.__expandMenuBeforeExpandMenu(oPanel);

		}

	    }
	});

	var oPanel = Ext.create('Ext.container.Container', {
	    layout : {
		type : 'hbox',
		// align : 'stretch',
		margin : 3
	    },
	    fieldName : sName,
	    fieldType : sType,
	    blockType : "value",
	    items : [ {
		xtype : 'panel',
		html : "<div style='padding:7px 0px 0px 5px;'>" + sName + "</div>",
		border : false,
		flex : 1
	    }, {
		xtype : "button",
		iconCls : "meta-equal-icon",
		margin : 3,
		menu : [ {
		    text : "Equal to",
		    iconCls : "meta-equal-icon",
		    width : 200,
		    listeners : {
			click : me.onItemLogicOperationClick
		    }
		}, {
		    text : "In",
		    iconCls : "meta-in-icon",
		    width : 200,
		    listeners : {
			click : me.onItemLogicOperationClick
		    }
		}, {
		    text : "Not equal to",
		    iconCls : "meta-nequal-icon",
		    width : 200,
		    listeners : {
			click : me.onItemLogicOperationClick
		    }
		}, {
		    text : "Greater than",
		    iconCls : "meta-great-icon",
		    width : 200,
		    listeners : {
			click : me.onItemLogicOperationClick
		    }
		}, {
		    text : "Less than",
		    iconCls : "meta-less-icon",
		    width : 200,
		    listeners : {
			click : me.onItemLogicOperationClick
		    }
		}, {
		    text : "Greater than or equal to",
		    iconCls : "meta-lequal-icon",
		    width : 200,
		    listeners : {
			click : me.onItemLogicOperationClick
		    }
		}, {
		    text : "Less than or equal to",
		    iconCls : "meta-gequal-icon",
		    width : 200,
		    listeners : {
			click : me.onItemLogicOperationClick
		    }
		} ]
	    }, oDropDown, {
		xtype : "button",
		iconCls : "meta-reset-icon",
		margin : 3,
		handler : function() {

		    me.__removeBlock(oPanel);

		}
	    } ]

	});

	return oPanel;

    },

    __expandMenuBeforeExpandMenu : function(oThisBlock) {

	var me = this;
	// collect already selected options

	var oSendData = {};

	for ( var i = 0; i < me.queryPanel.items.length; i++) {

	    var oBlock = me.queryPanel.items.getAt(i);

	    if (oThisBlock != oBlock) {

		var oDropDown = oBlock.items.getAt(2);

		oSendData["_compatible_" + oBlock.fieldName] = oDropDown.getValue();

	    }

	}

	Ext.Ajax.request({
	    url : _app_base_url + 'MetadataCatalog/getQueryData',
	    method : 'POST',
	    params : oSendData,
	    scope : me,
	    success : function(oReponse) {

		oResponse = Ext.JSON.decode(oReponse.responseText);

		var oDropDown = oThisBlock.items.getAt(2);

		oDropDown.suspendEvents(false);

		var oBackData = oResponse.result;

		var oList = [];
		for ( var i = 0; i < oBackData[oThisBlock.fieldName].length; i++)
		    oList.push([ oBackData[oThisBlock.fieldName][i], oBackData[oThisBlock.fieldName][i] ]);

		var oNewStore = new Ext.data.SimpleStore({
		    fields : [ 'value', 'text' ],
		    data : oList
		});

		oDropDown.bindStore(oNewStore);

		oDropDown.focus();
		oDropDown.collapse();
		oDropDown.expand();

		oDropDown.resumeEvents();
		me.queryPanel.body.unmask();

	    }
	});

    },

    __getQueryData : function(bRefreshMetadataList, bRefreshQueryFields) {

	var me = this;
	// collect already selected options
	me.metadataCatalogGrid.body.mask("Wait ...");

	var oSendData = {};

	for ( var i = 0; i < me.queryPanel.items.length; i++) {

	    var oBlock = me.queryPanel.items.getAt(i);

	    var oDropDown = oBlock.items.getAt(2);

	    oSendData["_compatible_" + oBlock.fieldName] = oDropDown.getValue();

	}

	Ext.Ajax.request({
	    url : _app_base_url + 'MetadataCatalog/getQueryData',
	    method : 'POST',
	    params : oSendData,
	    scope : me,
	    success : function(oReponse) {

		oResponse = Ext.JSON.decode(oReponse.responseText);
		me.queryData = oResponse.result;

		if (bRefreshMetadataList) {
		    me.__oprRefreshMetadataFieldsList();
		}

		if (bRefreshQueryFields) {

		    me.__refreshQueryFieldsOptions();

		}

		me.metadataCatalogGrid.body.unmask();

	    }
	});

    },

    __refreshQueryFieldsOptions : function() {

	var me = this;

	for ( var i = 0; i < me.queryPanel.items.length; i++) {

	    var oBlock = me.queryPanel.items.getAt(i);

	    var oDropDown = oBlock.items.getAt(2);

	    var oValue = oDropDown.getValue();

	    oDropDown.suspendEvents(false);

	    var oNewStore = new Ext.data.SimpleStore({
		fields : [ 'value', 'text' ],
		data : me.__getFieldOptions(oBlock.fieldName)
	    });

	    oDropDown.bindStore(oNewStore);

	    oDropDown.setValue(oValue);

	    oDropDown.resumeEvents();

	}

    },

    __getValueBlockDescription : function(oBlock) {

	var me = this;
	var oButton = oBlock.items.getAt(1);
	var oDropDown = oBlock.items.getAt(2);
	return me.__getSignByIconCls(oButton.iconCls,oDropDown.isInverseSelection())+"|"+ oDropDown.getValue().join(":::");

    },

    __getSignByIconCls : function(sIconCls, bNot) {

	var sSign = "";

	switch (sIconCls) {

	case "meta-equal-icon":
	    if (bNot) {
		sSign = "!=";
	    } else {
		sSign = "=";
	    }
	    break;
	case "meta-gequal-icon":
	    if (bNot) {
		sSign = "<";
	    } else {
		sSign = ">=";
	    }
	    break;
	case "meta-great-icon":
	    if (bNot) {
		sSign = "<=";
	    } else {
		sSign = ">";
	    }
	    break;
	case "meta-lequal-icon":
	    if (bNot) {
		sSign = ">";
	    } else {
		sSign = "<=";
	    }
	    break;
	case "meta-less-icon":
	    if (bNot) {
		sSign = ">=";
	    } else {
		sSign = "<";
	    }
	    break;
	case "meta-nequal-icon":
	    if (bNot) {
		sSign = "=";
	    } else {
		sSign = "!=";
	    }
	    break;  
	case "meta-in-icon":
	    if (bNot) {
		sSign = "nin";
	    } else {
		sSign = "in";
	    }
	    break;  

	}
	
	return sSign;

    },

    __oprRefreshMetadataFieldsList : function() {

	var me = this;

	me.metadataCatalogStore.removeAll();

	var oNewData = [];

	for ( var key in me.queryData) {
	    if (me.queryData[key].length > 0) {
		oNewData.push([ me.fieldsTypes[key], key ]);
	    }
	}

	me.metadataCatalogStore.add(oNewData);

    },

    __getFieldOptions : function(sName) {

	var me = this;

	var oList = [];
	for ( var i = 0; i < me.queryData[sName].length; i++)
	    oList.push([ me.queryData[sName][i], me.queryData[sName][i] ]);

	return oList;

    }
});
