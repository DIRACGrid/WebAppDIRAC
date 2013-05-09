/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('DIRAC.ConfigurationManager.classes.ConfigurationManager', {
    extend : 'Ext.dirac.core.Module',
    requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.form.field.Date",
	    "Ext.form.field.TextArea", "Ext.form.field.Checkbox", "Ext.form.FieldSet", "Ext.Button", "Ext.dirac.utils.DiracMultiSelect", "Ext.util.*", "Ext.toolbar.Toolbar", "Ext.data.Record",
	    "Ext.tree.Panel", "Ext.data.TreeStore" ],

    loadState : function(oData) {

    },

    getStateData : function() {

	var me = this;
	var oReturn = {};

	return oReturn;

    },

    initComponent : function() {

	var me = this;

	me.launcher.title = "Configuration Manager";
	me.launcher.maximized = true;

	/*
	 * -----------------------------------------------------------------------------------------------------------
	 * DEFINITION OF THE LEFT PANEL
	 * -----------------------------------------------------------------------------------------------------------
	 */

	me.leftPanel = new Ext.create('Ext.panel.Panel', {
	    title : 'Actions',
	    region : 'west',
	    floatable : false,
	    margins : '0',
	    width : 250,
	    minWidth : 230,
	    maxWidth : 350,
	    bodyPadding : 5,
	    layout : 'anchor',
	    autoScroll : true
	});

	me.treeStore = Ext.create('Ext.data.TreeStore', {
	    proxy : {
		type : 'ajax',
		url : me._baseUrl + 'ConfigurationManager/getSubnodes',
		reader : {
		    type : 'json',
		    root : 'nodes'
		},
		extraParams : {
		    nodePath : "/"
		}
	    },
	    root : {
		text : 'Configuration',
		expanded : true
	    },
	    listeners : {
		beforeload : function(oThisStore, oOperation, eOpts) {
		    oThisStore.proxy.extraParams.nodePath = me.__getNodePath(oOperation.node);
		    //console.log(oThisStore.proxy.extraParams.nodePath);
		}
	    }
	});

	me.treePanel = new Ext.create('Ext.tree.Panel', {
	    title : "Configuration Tree",
	    region : 'center',
	    store : me.treeStore,
	    listeners : {
		itemappend : function(oNode, oChildNode, index, eOpts) {
		    
		}
	    }
	});

	/*
	 * -----------------------------------------------------------------------------------------------------------
	 * DEFINITION OF THE MAIN CONTAINER
	 * -----------------------------------------------------------------------------------------------------------
	 */

	Ext.apply(me, {
	    layout : 'border',
	    bodyBorder : false,
	    defaults : {
		collapsible : true,
		split : true
	    },
	    items : [ me.leftPanel, me.treePanel ]
	});

	me.callParent(arguments);

    },
    __getNodePath : function(oNode) {
	var sPath = ""
	var oCopyRefNode = oNode;
	while (oCopyRefNode) {
	    if (oCopyRefNode.raw.csName)
		sPath = "/" + oCopyRefNode.raw.csName + sPath;
	    else
		break;
	    oCopyRefNode = oCopyRefNode.parentNode;
	}
	if (!sPath)
	    return "/";
	return sPath;
    }

});
