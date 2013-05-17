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
	    items : []
	});

	me.callParent(arguments);

    },

    buildUI : function() {

	var me = this;

	/*
	 * Ext.Ajax.request({ url : _app_base_url +
	 * 'ConfigurationManager/initializeConfigurationCopy', method : 'POST',
	 * params : {}, scope : me, success : function(response) {
	 */

	var sLoc = window.location;
	var sWsuri;

	if (sLoc.protocol === "https:") {
	    sWsuri = "wss:";
	} else {
	    sWsuri = "ws:";
	}
	sWsuri += "//" + sLoc.host + '/DIRAC/ConfigurationManager';

	me.socket = new WebSocket(sWsuri);

	me.socket.onopen = function(e) {
	    console.log("CONNECTED");
	    me.socket.send(JSON.stringify({
		op : "init"
	    }));
	};

	me.socket.onerror = function(e) {
	    console.log("ERR " + e.data);
	};

	me.socket.onclose = function(e) {
	    console.log("CLOSE");
	};

	me.socket.onmessage = function(e) {
	    
	    var oResponse = JSON.parse( e.data );
	    
	    if(parseInt(oResponse.success)==0){
		
		alert(oResponse.message);
		
	    }else{
		
        	switch (oResponse.op) {
        
        	    case "init":	
        				break;
        	    case "getSubnodes": 
        				me.__oprCreateSubnodes(oResponse);
        				break;
        
        	}
	    }

	};

	me.btnViewConfigAsText = new Ext.Button({

	    text : 'View as Text',
	    margin : 1,
	    iconCls : "",
	    handler : function() {

	    },
	    scope : me

	});

	me.btnDownloadConfig = new Ext.Button({

	    text : 'Download',
	    margin : 1,
	    iconCls : "",
	    handler : function() {

	    },
	    scope : me

	});

	me.btnResetConfig = new Ext.Button({

	    text : 'Reset',
	    margin : 1,
	    iconCls : "",
	    handler : function() {

	    },
	    scope : me

	});

	// me.tbar.add([me.btnViewConfigAsText,me.btnDownloadConfig,me.btnResetConfig]);

	me.treeStore = Ext.create('Ext.data.TreeStore', {
	    root : {
		text : 'Configuration'
	    },
	    proxy : { 
			type : 'localstorage' 
	    },  		
	    root : {
		text : 'Configuration'
	    },
	    listeners : {
		beforeload : function(oThisStore, oOperation, eOpts) {
		    // oThisStore.proxy.extraParams.nodePath =
		    // me.__getNodePath(oOperation.node);
		    // console.log(oThisStore.proxy.extraParams.nodePath);
		},
		beforeexpand : function(oNode, eOpts) {

		}
	    }
	});

	me.treePanel = new Ext.create('Ext.tree.Panel', {
	    region : 'center',
	    store : me.treeStore,
	    listeners : {
		afteritemexpand: function( oNode, index, item, eOpts ){
		    
		    var oNodePath = me.__getNodePath(oNode);

		    me.socket.send(JSON.stringify({
			op : "getSubnodes",
			nodePath : oNodePath,
			node : oNode.getId()
		    }));
		    
		},
		beforeitemappend : function(oNode, oChildNode, eOpts) {

		    if (oChildNode.isLeaf())
			me.__configureLeafNode(oChildNode);

		}
	    },
	    tbar : [ me.btnViewConfigAsText, me.btnDownloadConfig, me.btnResetConfig ]
	});

	me.add([ me.treePanel ]);

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
    __oprCreateSubnodes:function(oResponse){
	
	var me = this;
	
	var oParentNode = me.treeStore.getNodeById(oResponse.parentNodeId);
	
	if(!oParentNode.hasChildNodes()){
	
        	for(var i=0;i<oResponse.nodes.length;i++){
        	    //console.log(oResponse.nodes[i]);
        	    var oNewNode = oParentNode.createNode(oResponse.nodes[i]);
        	    oNewNode.collapse();
        	    oParentNode.appendChild(oNewNode);
        	}
	
	}
	
    },
    __configureLeafNode : function(oNode) {

	// Version 4.1.3 has a bug regarding this, fixed in 4.2.0
	// oNode.text = oNode.raw.csName + " = " + oNode.raw.csValue;

    }

});
