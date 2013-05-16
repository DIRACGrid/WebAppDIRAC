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
	
	Ext.apply(me, {
	    layout : 'border',
	    bodyBorder : false,
	    defaults : {
		collapsible : true,
		split : true
	    },
	    items:[]
	});
	
	me.callParent(arguments);

    },
    
    buildUI:function(){
	
	var me = this;
	
	Ext.Ajax.request({
	    url : _app_base_url + 'ConfigurationManager/initializeConfigurationCopy',
	    method : 'POST',
	    params : {},
	    scope : me,
	    success : function(response) {
	

        	me.treeStore = Ext.create('Ext.data.TreeStore', {
        	    proxy : {
        		type : 'ajax',
        		url : _app_base_url + 'ConfigurationManager/getSubnodes',
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
        		    // console.log(oThisStore.proxy.extraParams.nodePath);
        		}
        	    }
        	});
        
        	me.treePanel = new Ext.create('Ext.tree.Panel', {
        	    region : 'center',
        	    store : me.treeStore,
        	    listeners : {
        		itemappend : function(oNode, oChildNode, index, eOpts) {
        
        		},
        		beforeitemappend : function(oNode, oChildNode, eOpts) {
        
        		    if (oChildNode.isLeaf())
        			me.__configureLeafNode(oChildNode);
        
        		}
        	    }
        	});
        
        	me.add([me.treePanel ]);
	
	    }
	});
	
	
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
    },

    __configureLeafNode : function(oNode) {

	// Version 4.1.3 has a bug regarding this, fixed in 4.2.0
	// oNode.text = oNode.raw.csName + " = " + oNode.raw.csValue;

    }

});
