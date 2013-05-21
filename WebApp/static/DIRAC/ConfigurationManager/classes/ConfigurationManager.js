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
	    "Ext.tree.Panel", "Ext.data.TreeStore", "Ext.data.NodeInterface", 'Ext.form.field.TextArea' ],

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

	// Ext.data.NodeInterface.decorate(Ext.data.ObjectTypeModel);

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

	    var oResponse = JSON.parse(e.data);

	    if (parseInt(oResponse.success) == 0) {

		alert(oResponse.message);

	    } else {

		switch (oResponse.op) {

		case "init":
		    break;
		case "getSubnodes":
		    me.__oprCreateSubnodes(oResponse);
		    break;
		case "showConfigurationAsText":
		    me.__showConfigTextInWindow(oResponse.text);
		    break;
		case "resetConfiguration":
		    me.__cbResetConfigurationTree(oResponse.text);
		    break;
		case "getBulkExpandedNodeData":
		    me.__cbGetBulkExpandedNodeData(oResponse);
		    break;
		}
	    }

	};

	me.btnViewConfigAsText = new Ext.Button({

	    text : 'View as Text',
	    margin : 1,
	    iconCls : "cm-view-text-icon",
	    handler : function() {

		me.socket.send(JSON.stringify({
		    op : "showConfigurationAsText"
		}));

		me.btnViewConfigAsText.hide();

	    },
	    scope : me

	});

	me.btnResetConfig = new Ext.Button({

	    text : 'Reset',
	    margin : 1,
	    iconCls : "cm-reset-icon",
	    handler : function() {
		me.socket.send(JSON.stringify({
		    op : "resetConfiguration"
		}));
		me.btnResetConfig.hide();
	    },
	    scope : me

	});

	me.treeStore = Ext.create('Ext.data.TreeStore', {
	    proxy : {
		type : 'localstorage'
	    },
	    root : {
		text : 'Configuration'
	    },
	    listeners : {
		beforeexpand : function(oNode, eOpts) {

		    var oNodePath = me.__getNodePath(oNode);

		    me.socket.send(JSON.stringify({
			op : "getSubnodes",
			nodePath : oNodePath,
			node : oNode.getId()
		    }));
		}
	    }
	});

	me.treePanel = new Ext.create('Ext.tree.Panel', {
	    region : 'center',
	    store : me.treeStore,
	    tbar : [ me.btnViewConfigAsText, me.btnResetConfig ]
	});

	me.add([ me.treePanel ]);

	me.expansionState = {};
	me.counterNodes = 0;

    },

    __oprPathAsExpanded : function(sPath, bInsertIntoStructure) {

	var me = this;
	var oParts = sPath.split("/");

	// The first element is always empty
	var oTemp = me.expansionState;
	var oFound = true;

	var oStartIndex = 0;

	if (sPath == "/")
	    oStartIndex = 1;

	for ( var i = oStartIndex; i < oParts.length; i++) {

	    if (oParts[i] in oTemp) {

		oTemp = oTemp[oParts[i]];

	    } else {

		oFound = false;

		if (bInsertIntoStructure) {
		    oTemp[oParts[i]] = {};
		}

		break;

	    }

	}

	return oFound;

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

    __generateNewNodeId : function() {

	var me = this;
	var sId = me.id + "-ynode-" + me.counterNodes;
	me.counterNodes++;
	return sId;

    },
    __oprCreateSubnodes : function(oResponse) {

	var me = this;

	var oParentNode = me.treeStore.getNodeById(oResponse.parentNodeId);

	if (!me.__oprPathAsExpanded(me.__getNodePath(oParentNode), true)) {

	    /*
	     * HACK for representation the plus/minus sign for none expanded
	     * node
	     */
	    oParentNode.removeAll();
	    /*
	     * END - HACK
	     */
	    for ( var i = 0; i < oResponse.nodes.length; i++) {

		var oNodeData = oResponse.nodes[i];

		oNodeData.id = me.__generateNewNodeId();

		if ("qtipCfg" in oNodeData)
		    oNodeData.qtip = oNodeData.qtipCfg.text;

		var oNewNode = oParentNode.createNode(oNodeData);

		/*
		 * HACK for representation the plus/minus sign for none expanded
		 * node
		 */
		if (!oNodeData.leaf)
		    oNewNode.appendChild({});
		/*
		 * END - HACK
		 */

		oParentNode.appendChild(oNewNode);

	    }

	}

    },

    __showConfigTextInWindow : function(sTextToShow) {

	var me = this;

	var oWindow = me.getContainer().oprGetChildWindow("Configuration As Text", false, 700, 500);

	var oTextArea = new Ext.create('Ext.form.field.TextArea', {
	    value : sTextToShow,
	    cls : "cm-textbox-help-window"

	});

	oWindow.add(oTextArea);
	oWindow.show();
	me.btnViewConfigAsText.show();

    },

    __cbResetConfigurationTree : function() {

	var me = this;

	var oRoot = me.treeStore.getRootNode();
	// oRoot.removeAll();

	var oSerializedActions = [];

	if ("" in me.expansionState)
	    me.__serializeExpansionAction("", me.expansionState[""], oSerializedActions);

	console.log(oSerializedActions);

	me.socket.send(JSON.stringify({
	    op : "getBulkExpandedNodeData",
	    nodes : oSerializedActions.join("<<||>>")
	}));

	me.btnResetConfig.show();

    },

    __findNodeByPath : function(sPathToNode) {

	var me = this;

	var oRoot = me.treeStore.getRootNode();

	var oParts = sPathToNode.split("/");

	if ((oParts.length == 2) && (oParts[1] == "")) {

	    return oRoot;

	} else {

	    var oStartNode = oRoot;

	    for ( var i = 1; i < oParts.length; i++) {

		var oChildNodes = oStartNode.childNodes;

		for ( var j = 0; j < oChildNodes.length; j++) {

		    if (oChildNodes[j].raw.csName == oParts[i]) {

			oStartNode = oChildNodes[j];
			break;

		    }

		}

	    }

	    return oStartNode;

	}

    },

    __serializeExpansionAction : function(sPathToLevel, oLevel, oColector) {

	var me = this;
	oColector.push(((sPathToLevel.length == 0) ? "/" : sPathToLevel));

	for (sChild in oLevel) {
	    me.__serializeExpansionAction(sPathToLevel + "/" + sChild, oLevel[sChild], oColector);
	}

    },
    __cbGetBulkExpandedNodeData : function(oResponse) {

	var oRetData = oResponse.data;

	console.log(oRetData);

    }

});
