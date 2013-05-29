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
	    "Ext.tree.Panel", "Ext.data.TreeStore", "Ext.data.NodeInterface", 'Ext.form.field.TextArea', 'Ext.Array', 'Ext.grid.Panel' ],

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

	me.leftPanel = new Ext.create('Ext.panel.Panel', {
	    title : 'Metadata Catalog',
	    region : 'west',
	    floatable : false,
	    margins : '0',
	    width : 250,
	    minWidth : 230,
	    maxWidth : 350,
	    bodyPadding : 0,
	    autoScroll : true
	});

	me.centerPanel = new Ext.create('Ext.panel.Panel', {
	    title : 'Metadata Query',
	    region : 'west',
	    floatable : false,
	    margins : '0',
	    width : 250,
	    minWidth : 230,
	    maxWidth : 350,
	    bodyPadding : 0,
	    autoScroll : true
	});

	me.rightPanel = new Ext.create('Ext.panel.Panel', {
	    region : 'center',
	    floatable : false,
	    margins : '0',
	    bodyPadding : 0,
	    autoScroll : true,
	    flex : 1
	});

	/*
	 * The grid for the metadata choice (part of the leftPanel)
	 */

	me.metadataCatalogStore = new Ext.data.JsonStore({

	    proxy : {
		type : 'ajax',
		url : _app_base_url + 'MetadataCatalog/getMetadataOptions',
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

	me.metadataCatalogGrid = Ext.create('Ext.grid.Panel', {
	    region : 'center',
	    store : me.metadataCatalogStore,
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
		hideable : false
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
	    }
	});
	
	me.leftPanel.add([me.metadataCatalogGrid]);
	
	
	me.add([ me.leftPanel, me.centerPanel, me.rightPanel ]);

    }
});
