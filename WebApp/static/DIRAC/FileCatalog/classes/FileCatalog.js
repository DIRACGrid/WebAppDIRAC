/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('DIRAC.FileCatalog.classes.FileCatalog', {
    extend : 'Ext.dirac.core.Module',
    requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.form.field.Date",
	    "Ext.form.field.TextArea", "Ext.form.field.Checkbox", "Ext.form.FieldSet", "Ext.Button", "Ext.dirac.utils.DiracMultiSelect", "Ext.util.*", "Ext.toolbar.Toolbar", "Ext.data.Record",
	    "Ext.tree.Panel", "Ext.data.TreeStore", "Ext.data.NodeInterface", 'Ext.form.field.TextArea', 'Ext.Array', 'Ext.grid.Panel', 'Ext.form.field.Text', 'Ext.grid.feature.Grouping' ],

    loadState : function(oData) {

    },

    getStateData : function() {

	var me = this;
	var oReturn = {};

	return oReturn;

    },

    initComponent : function() {

	var me = this;

	me.launcher.title = "File Catalog";
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
		me.oprLoadFilesGridData();
	    },
	    scope : me

	});

	me.btnResetLeftPanel = new Ext.Button({

	    text : 'Refresh',

	    iconCls : "meta-refresh-icon",
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
	    title : 'Query',
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

	me.queryPanel.addDocked([ queryPanelToolbarBottom ]);

	/*-------------------------------------------------------------------------------------*/

	me.filesDataStore = new Ext.data.JsonStore({

	    proxy : {
		type : 'ajax',
		url : _app_base_url + 'FileCatalog/getFilesData',
		reader : {
		    type : 'json',
		    root : 'result'
		}
	    },
	    groupField : 'dirname',
	    fields : [ {
		name : 'dirname'
	    }, {
		name : 'filename'
	    }, {
		name : 'date'
	    }, {
		name : 'size'
	    }, {
		name : 'metadata'
	    }, {
		name : "fullfilename"
	    } ],
	    remoteSort : true,
	    pageSize : 25,
	    listeners : {

		load : function(oStore, records, successful, eOpts) {

		    me.pagingToolbar.updateStamp.setText('Updated: ' + oStore.proxy.reader.rawData["date"]);
		    me.queryPanel.body.unmask();
		    me.metadataCatalogGrid.body.unmask();

		}

	    }
	});

	me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
	me.checkboxFunctionDefinition += 'var oChecked=this.checked;';
	me.checkboxFunctionDefinition += 'var oElems=Ext.query(\'#' + me.id + ' input.checkrow\');';
	me.checkboxFunctionDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
	me.checkboxFunctionDefinition += '"/>';

	me.pagingToolbar = {};
	me.pagingToolbar.updateStamp = new Ext.Button({
	    disabled : true,
	    text : 'Updated: -'
	});

	me.pagingToolbar.pageSizeCombo = new Ext.form.field.ComboBox({
	    allowBlank : false,
	    displayField : 'number',
	    editable : false,
	    maxLength : 4,
	    maxLengthText : 'The maximum value for this field is 1000',
	    minLength : 1,
	    minLengthText : 'The minimum value for this field is 1',
	    mode : 'local',
	    store : new Ext.data.SimpleStore({
		fields : [ 'number' ],
		data : [ [ 25 ], [ 50 ], [ 100 ], [ 200 ], [ 500 ], [ 1000 ] ]
	    }),
	    triggerAction : 'all',
	    value : 25,
	    width : 50
	});

	me.pagingToolbar.pageSizeCombo.on("change", function(combo, newValue, oldValue, eOpts) {
	    var me = this;
	    me.filesDataStore.pageSize = newValue;
	    me.oprLoadFilesGridData();
	}, me);

	me.pagingToolbar.btnGrouping = new Ext.Button({
	    text : 'Disable Grouping',
	    handler : function() {

		if (me.groupingFeature.disabled) {
		    me.groupingFeature.enable();
		    me.pagingToolbar.btnGrouping.setText("Disable Grouping");
		    me.filesGrid.columns[1].hide();
		} else {
		    me.groupingFeature.disable();
		    me.pagingToolbar.btnGrouping.setText("Enable Grouping");
		    me.filesGrid.columns[1].show();
		}

	    },
	    scope : me
	});

	var pagingToolbarItems = [ me.pagingToolbar.btnGrouping, '->', me.pagingToolbar.updateStamp, '-', 'Items per page: ', me.pagingToolbar.pageSizeCombo, '-' ];

	me.pagingToolbar.toolbar = Ext.create('Ext.toolbar.Paging', {
	    store : me.filesDataStore,
	    displayInfo : true,
	    displayMsg : 'Displaying topics {0} - {1} of {2}',
	    items : pagingToolbarItems,
	    emptyMsg : "No topics to display",
	    prependButtons : true
	});

	me.groupingFeature = Ext.create('Ext.grid.feature.Grouping', {
	    groupHeaderTpl : '{columnName}: {name} ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})',
	    hideGroupedHeader : true,
	    startCollapsed : true,
	    id : 'directoryGrouping'
	});

	me.filesGrid = Ext.create('Ext.grid.Panel', {
	    region : 'center',
	    store : me.filesDataStore,
	    flex : 1,
	    viewConfig : {
		stripeRows : true,
		enableTextSelection : true
	    },
	    features : [ me.groupingFeature ],
	    columns : [ {
		header : me.checkboxFunctionDefinition,
		name : 'checkBox',
		width : 26,
		sortable : false,
		dataIndex : 'fullfilename',
		renderer : function(value, metaData, record, row, col, store, gridView) {
		    return this.rendererChkBox(value);
		},
		hideable : false,
		fixed : true,
		menuDisabled : true
	    }, {
		header : 'Directory',
		sortable : true,
		dataIndex : 'dirname',
		hideable : false,
		flex : 1,
	    }, {
		header : 'File',
		sortable : true,
		dataIndex : 'filename',
		align : 'left',
		flex : 1
	    }, {
		header : 'Date',
		sortable : true,
		dataIndex : 'date',
		align : 'left',
		width : 150
	    }, {
		header : 'Size',
		sortable : true,
		dataIndex : 'size',
		align : 'left'
	    }, {
		header : 'Metadata',
		sortable : false,
		dataIndex : 'metadata',
		align : 'left'
	    } ],
	    rendererChkBox : function(val) {
		return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
	    },
	    tbar : me.pagingToolbar.toolbar
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

	    },
	    scope : me

	});

	metadataCatalogGridToolbar.add(me.btnRefreshLeftPanel);

	me.metadataCatalogGrid = Ext.create('Ext.grid.Panel', {
	    title : 'Metadata',
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
		sortable : true,
		hideable : false,
		sortState : "ASC",
		flex : 1
	    } ],
	    rendererType : function(value) {
		if (value == 'varchar(128)') {
		    return '<img src="static/DIRAC/FileCatalog/images/new_string.png">';
		} else if (value == 'int') {
		    return '<img src="static/DIRAC/FileCatalog/images/new_int.png">';
		} else if (value == 'datetime') {
		    return '<img src="static/DIRAC/FileCatalog/images/new_date.png">';
		} else {
		    return '<img src="static/DIRAC/FileCatalog/images/new_float.png">';
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

	oLeftPanel.addDocked([ queryPanelToolbarTop ]);

	me.add([ oLeftPanel, me.filesGrid ]);
	me.fieldsTypes = {};

	Ext.Ajax.request({
	    url : _app_base_url + 'FileCatalog/getMetadataFields',
	    method : 'POST',
	    params : {},
	    scope : me,
	    success : function(oReponse) {

		oResponse = Ext.JSON.decode(oReponse.responseText);

		if (oResponse.success == "true") {

		    // populating the fields for the first time

		    me.fieldsTypes = oResponse.result;

		    me.__getQueryData(true);

		} else {
		    alert(oResponse.error);
		}

	    }
	});

    },

    oprLoadFilesGridData : function() {

	// me.metadataCatalogGrid.body.mask("Wait ...");
	var me = this;

	me.queryPanel.body.mask("Wait ...");
	me.metadataCatalogGrid.body.mask("Wait ...");

	var oSendData = {};

	for ( var i = 0; i < me.queryPanel.items.length; i++) {

	    var oBlock = me.queryPanel.items.getAt(i);
	    var oData = me.__getValueBlockDescription(oBlock);

	    if (oData != "")
		oSendData["p." + oBlock.fieldName] = oData;

	}

	oSendData.path = me.txtPathField.getValue();

	// set those data as extraParams in
	me.filesGrid.store.proxy.extraParams = oSendData;
	me.filesGrid.store.load();
    },

    onItemLogicOperationClick : function(oItem, e, eOpts) {

	var oButton = oItem.up("button");
	oButton.setIconCls(oItem.iconCls);
	oButton.moduleObject.__getQueryData(true);

    },

    __removeLastBlockIfEmpty : function() {

	var me = this;

	if (me.queryPanel.items.length > 0) {
	    var oLastBlock = me.queryPanel.items.getAt(me.queryPanel.items.length - 1);

	    var oDropDown = oLastBlock.items.getAt(2);

	    if (oLastBlock.blockType == "string") {

		if (oDropDown.getValue().length == 0) {

		    me.queryPanel.remove(oLastBlock);

		}
	    } else {
		if (oDropDown.getValue() == null) {

		    me.queryPanel.remove(oLastBlock);

		}
	    }
	}

    },
    __removeBlock : function(oBlock) {

	var me = this;
	me.queryPanel.remove(oBlock);
	me.__getQueryData(true);

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
	    noChangeEventWhenCreated : 0,
	    store : new Ext.data.SimpleStore({
		fields : [ 'value', 'text' ],
		data : me.__getFieldOptions(sName)
	    }),
	    listeners : {

		change : function(oField, newValue, oldValue, eOpts) {

		    if (oField.noChangeEventWhenCreated == 1) {
			me.__getQueryData(true);
		    } else {
			oField.noChangeEventWhenCreated = 1;
		    }

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

	var oDropDown = Ext.create('Ext.form.field.ComboBox', {
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
		    me.__getQueryData(true);
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
		moduleObject : me,
		menu : [ {
		    text : "Equal to",
		    iconCls : "meta-equal-icon",
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

	var sBlockType = oThisBlock.blockType;
	var oDropDown = oThisBlock.items.getAt(2);

	var ifValue = true;

	switch (sBlockType) {

	case "value":
	    if (oDropDown.getValue() == null)
		ifValue = false;
	    break;
	case "string":
	    if (oDropDown.getValue().length == 0)
		ifValue = false;
	    break;

	}

	if (ifValue) {

	    var oSendData = {};

	    for ( var i = 0; i < me.queryPanel.items.length; i++) {

		var oBlock = me.queryPanel.items.getAt(i);

		if (oThisBlock != oBlock) {

		    var oDropDown = oBlock.items.getAt(2);

		    oSendData["_compatible_" + oBlock.fieldName] = oDropDown.getValue();
		}
	    }

	    Ext.Ajax.request({
		url : _app_base_url + 'FileCatalog/getQueryData',
		method : 'POST',
		params : oSendData,
		scope : me,
		success : function(oReponse) {

		    oResponse = Ext.JSON.decode(oReponse.responseText);

		    var oBackData = oResponse.result;
		    var oDropDown = oThisBlock.items.getAt(2);

		    oDropDown.suspendEvents(false);

		    var oList = [];
		    for ( var i = 0; i < oBackData[oThisBlock.fieldName].length; i++)
			oList.push([ oBackData[oThisBlock.fieldName][i], oBackData[oThisBlock.fieldName][i] ]);

		    var oNewStore = new Ext.data.SimpleStore({
			fields : [ 'value', 'text' ],
			data : oList
		    });

		    switch (sBlockType) {

		    case "value":
			oDropDown.bindStore(oNewStore);
			break;
		    case "string":
			oDropDown.refreshStore(oNewStore);
			break;

		    }

		    oDropDown.collapse();
		    oDropDown.expand();

		    oDropDown.resumeEvents();
		    me.queryPanel.body.unmask();

		}
	    });
	} else {

	    oDropDown.suspendEvents(false);

	    var oNewStore = new Ext.data.SimpleStore({
		fields : [ 'value', 'text' ],
		data : me.__getFieldOptions(oThisBlock.fieldName)
	    });

	    switch (sBlockType) {

	    case "value":
		oDropDown.bindStore(oNewStore);
		break;
	    case "string":
		oDropDown.refreshStore(oNewStore);
		break;

	    }

	    oDropDown.collapse();
	    oDropDown.expand();

	    oDropDown.resumeEvents();
	    me.queryPanel.body.unmask();

	}

    },

    __getQueryData : function(bRefreshMetadataList) {

	var me = this;
	// collect already selected options
	me.metadataCatalogGrid.body.mask("Wait ...");

	var oSendData = {};

	for ( var i = 0; i < me.queryPanel.items.length; i++) {

	    var oBlock = me.queryPanel.items.getAt(i);
	    var oData = me.__getValueBlockDescription(oBlock);

	    if (oData != "")
		oSendData["_compatible_" + oBlock.fieldName] = oData;

	}

	Ext.Ajax.request({
	    url : _app_base_url + 'FileCatalog/getQueryData',
	    method : 'POST',
	    params : oSendData,
	    scope : me,
	    success : function(oReponse) {

		oResponse = Ext.JSON.decode(oReponse.responseText);
		me.queryData = oResponse.result;

		if (bRefreshMetadataList) {
		    me.__oprRefreshMetadataFieldsList();
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

	var oRet = "";

	if (oBlock.blockType == "string") {
	    if (oDropDown.getValue().length > 0) {
		oRet = "s" + "|" + me.__getSignByIconCls(oButton.iconCls, oDropDown.isInverseSelection()) + "|" + oDropDown.getValue().join(":::");
	    }
	} else {
	    if (oDropDown.getValue() != null) {
		oRet = "v" + "|" + me.__getSignByIconCls(oButton.iconCls, false) + "|" + oDropDown.getValue();
	    }
	}

	return oRet;

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
	
	for(var i=0;i<oNewData.length-1;i++){
	    for(var j=i+1;j<oNewData.length;j++){
		
		if(oNewData[i][1].toLowerCase() > oNewData[j][1].toLowerCase()){
		    
		    var elem = oNewData[i];
		    oNewData[i] = oNewData[j];
		    oNewData[j] = elem;
		    
		}
		
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
