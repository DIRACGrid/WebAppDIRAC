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
	    region : 'center',
	    floatable : false,
	    margins : '0',
	    width : 350,
	    minWidth : 300,
	    maxWidth : 450,
	    bodyPadding : 0,
	    autoScroll : true
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

	me.metadataCatalogStore = new Ext.data.JsonStore({

	    proxy : {
		type : 'ajax',
		url : _app_base_url + 'MetadataCatalog/getMetadataFields',
		reader : {
		    type : 'json',
		    root : 'result'
		}
	    },
	    fields : [ {
		name : 'Type'
	    }, {
		name : 'Name'
	    } ],
	    autoLoad : true
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
	    title : 'Metadata Catalog',
	    region : 'south',
	    height : 300,
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

		    // alert(record.get("Name"));
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

	// me.metadataOptionPanel.add([ me.metadataCatalogGrid ]);

	var oLeftPanel = new Ext.create('Ext.panel.Panel', {
	    region : 'west',
	    layout : 'border',
	    bodyBorder : false,
	    defaults : {
		collapsible : true,
		split : true
	    },
	    width : 350,
	    minWidth : 300,
	    maxWidth : 450,
	    items : [ me.queryPanel, me.metadataCatalogGrid ]
	// me.metadataOptionPanel]
	});

	me.add([ oLeftPanel, me.rightPanel ]);

    },

    onItemLogicOperationClick : function(oItem, e, eOpts) {

	// alert(item.iconCls);

	oItem.up("button").setIconCls(oItem.iconCls);

    },

    __getDropDownField : function(sName) {

	var oPanel = Ext.create('Ext.container.Container', {
	    layout : {
		type : 'hbox',
		align : 'stretch',
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
		xtype : "combo",
		width : 120,
		margin : 3
	    }, {
		xtype : "button",
		iconCls : "meta-refresh-icon",
		margin : 3
	    }, {
		xtype : "button",
		iconCls : "meta-reset-icon",
		margin : 3
	    } ]

	});

	return oPanel;

    },
    __getValueField : function(sName, sType) {

	var me = this;

	var oPanel = Ext.create('Ext.container.Container', {
	    layout : {
		type : 'hbox',
		align : 'stretch',
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
	    }, {
		xtype : "combo",
		width : 120,
		margin : 3
	    }, {
		xtype : "button",
		iconCls : "meta-refresh-icon",
		margin : 3
	    }, {
		xtype : "button",
		iconCls : "meta-reset-icon",
		margin : 3
	    } ]

	});

	return oPanel;

    }
});
