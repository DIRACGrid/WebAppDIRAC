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

	    // resetting the configuration
	    me.socket.send(JSON.stringify({
		op : "resetConfiguration"
	    }));
	    me.btnResetConfig.hide();
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

		case "setOptionValue":
		    /*
		     * var node = reqArguments.node; node.attributes.csValue =
		     * reqArguments.params.value; configureLeafNode( node );
		     */
		    break;
		case "setComment":
		    // reqArguments.node.attributes.csComment = retVal.Value;
		    break;
		case "copyKey":
		    me.__cbMenuCopyNode(oResponse);
		    break;
		case "renameKey":
		    me.__cbMenuRenameNode(oResponse);
		    break;
		case "deleteKey":
		    me.__cbMenuDeleteNode(oResponse);
		    break;
		case "createSection":
		    me.__cbMenuCreateSubsection(oResponse);
		    break;
		case "createOption":
		    me.__cbMenuCreateOption(oResponse);
		    break;

		}
	    }

	};

	me.btnViewConfigAsText = new Ext.Button({

	    text : 'View as Text',
	    // margin : 1,
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
	    // margin : 1,
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

		    if (!me.flagReset) {

			var oNodePath = me.__getNodePath(oNode);

			me.socket.send(JSON.stringify({
			    op : "getSubnodes",
			    nodePath : oNodePath,
			    node : oNode.getId()
			}));

		    }
		}
	    }
	});

	me.treePanel = new Ext.create('Ext.tree.Panel', {
	    region : 'center',
	    store : me.treeStore,
	    tbar : [ me.btnViewConfigAsText, me.btnResetConfig ],
	    listeners : {

		beforeitemcontextmenu : function(oView, record, item, index, e, eOpts) {

		    e.preventDefault();
		    if (record.isLeaf()) {
			me.leafMenu.node = record;
			me.leafMenu.showAt(e.xy);
		    } else {
			me.sectionMenu.node = record;
			me.sectionMenu.showAt(e.xy);
		    }

		    return false;

		},

		beforecontainercontextmenu : function(oView, e, eOpts) {
		    console.log("beforecontainercontextmenu");

		    return false;

		}

	    }
	});

	me.btnValuePanelSubmit = new Ext.Button({

	    text : 'Submit',
	    margin : 1,
	    iconCls : "cm-submit-icon",
	    handler : me.__oprActionValuePanel,
	    scope : me

	});

	me.btnValuePanelReset = new Ext.Button({

	    text : 'Reset',
	    margin : 1,
	    iconCls : "cm-reset-icon",
	    handler : function() {

	    },
	    scope : me

	});

	me.btnValuePanelCancel = new Ext.Button({

	    text : 'Cancel',
	    margin : 1,
	    iconCls : "cm-kill-icon",
	    handler : function() {

	    },
	    scope : me

	});

	me.txtValuePanelTextArea = new Ext.create('Ext.form.field.TextArea', {});

	me.valuePanel = new Ext.create('Ext.panel.Panel', {
	    title : 'Path',
	    region : 'east',
	    floatable : false,
	    margins : '0',
	    width : 250,
	    minWidth : 230,
	    maxWidth : 350,
	    bodyPadding : 5,
	    layout : 'fit',
	    autoScroll : true,
	    collapsed : true,
	    items : [ me.txtValuePanelTextArea ],
	    bbar : [ me.btnValuePanelSubmit, me.btnValuePanelReset, me.btnValuePanelCancel ]
	});

	me.add([ me.treePanel, me.valuePanel ]);

	me.leafMenu = new Ext.menu.Menu({
	    items : [ {
		text : 'Change option value',
		listeners : {
		    click : me.__oprMenuSetOptionValue
		}
	    }, '-', {
		text : 'Change comment',
		listeners : {
		    click : me.__oprMenuSetCommentValue
		}
	    }, '-', {
		text : 'Copy option',
		listeners : {
		    click : me.__oprMenuCopyNode
		}
	    }, {
		text : 'Rename option',
		listeners : {
		    click : me.__oprMenuRenameNode
		}
	    }, {
		text : 'Delete option',
		listeners : {
		    click : me.__oprMenuDeleteNode
		}
	    } ],
	    moduleObject : me
	});

	me.sectionMenu = new Ext.menu.Menu({
	    items : [ {
		text : 'Create a subsection',
		listeners : {
		    click : me.__oprMenuCreateSubsection
		}
	    }, {
		text : 'Create an option',
		listeners : {
		    click : me.__oprMenuCreateOption
		}
	    }, '-', {
		text : 'Change comment',
		listeners : {
		    click : me.__oprMenuSetCommentValue
		}
	    }, '-', {
		text : 'Copy section',
		listeners : {
		    click : me.__oprMenuCopyNode
		}
	    }, {
		text : 'Rename section',
		listeners : {
		    click : me.__oprMenuRenameNode
		}
	    }, {
		text : 'Delete section',
		listeners : {
		    click : me.__oprMenuDeleteNode
		}
	    } ],
	    moduleObject : me
	});

	me.expansionState = {};
	me.counterNodes = 0;
	me.flagReset = false;

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

	// console.log(oSerializedActions);

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

	var me = this;

	me.treeStore.getRootNode().removeAll();

	// clean the expansionState
	if ("" in me.expansionState) {
	    delete me.expansionState[""];
	}

	var oRetData = oResponse.data;
	me.flagReset = true;

	for ( var i = 0; i < oRetData.length; i++) {

	    // console.log("[" + i + "]---------------------------");
	    // console.log(oRetData[i]);
	    var oPath = oRetData[i][0];
	    var oData = oRetData[i][1];

	    var oParentNode = me.__findNodeByPath(oPath);
	    // console.log(oParentNode);

	    if (!me.__oprPathAsExpanded(me.__getNodePath(oParentNode), true)) {

		/*
		 * HACK for representation the plus/minus sign for none expanded
		 * node
		 */
		oParentNode.removeAll();
		/*
		 * END - HACK
		 */

		for ( var j = 0; j < oData.length; j++) {

		    var oNodeData = oData[j];

		    oNodeData.id = me.__generateNewNodeId();

		    if ("qtipCfg" in oNodeData)
			oNodeData.qtip = oNodeData.qtipCfg.text;

		    var oNewNode = oParentNode.createNode(oNodeData);

		    /*
		     * HACK for representation the plus/minus sign for none
		     * expanded node
		     */
		    if (!oNodeData.leaf)
			oNewNode.appendChild({});
		    /*
		     * END - HACK
		     */

		    oParentNode.appendChild(oNewNode);

		}

		oParentNode.expand();

	    }

	}

	me.flagReset = false;

    },

    __stringToList : function(stringValue, sep) {
	if (!sep)
	    sep = ",";
	var vList = stringValue.split(sep);
	var strippedList = [];
	for ( var i = 0; i < vList.length; i++) {
	    var trimmed = Ext.util.Format.trim(vList[i]);
	    if (trimmed.length > 0) {
		strippedList.push(trimmed);
	    }
	}
	return strippedList;
    },

    __commentToList : function(stringValue) {
	var vList = stringValue.trim().split("\n");
	var cList = [];
	for ( var i = 0; i < vList.length; i++) {
	    var trimmed = Ext.util.Format.trim(vList[i]);
	    if (trimmed.length == 0)
		continue;
	    if (i == vList.length - 1 && trimmed.indexOf("@@-") == 0)
		break;
	    cList.push(trimmed);
	}
	return cList;
    },

    __oprMenuSetOptionValue : function(oItem, e, eOpts) {

	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;

	oModule.valuePanel.csNode = oNode;
	oModule.valuePanel.csValue = oModule.__stringToList(oNode.raw.csValue).join("\n");
	oModule.valuePanel.csPath = oModule.__getNodePath(oNode);
	oModule.valuePanel.setTitle("Value for <br/>" + oModule.valuePanel.csPath);
	oModule.txtValuePanelTextArea.setValue(oModule.valuePanel.csValue);
	oModule.valuePanel.csAction = "setValue";
	oModule.valuePanel.expand(false);

    },
    __oprMenuSetCommentValue : function(oItem, e, eOpts) {

	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;

	oModule.valuePanel.csNode = oNode;
	oModule.valuePanel.csValue = oModule.__commentToList(oNode.raw.csComment).join("\n");
	oModule.valuePanel.csPath = oModule.__getNodePath(oNode);
	oModule.valuePanel.setTitle("Comment for <br/>" + oModule.valuePanel.csPath);
	oModule.txtValuePanelTextArea.setValue(oModule.valuePanel.csValue);
	oModule.valuePanel.csAction = "setComment";
	oModule.valuePanel.expand(false);

    },

    __oprActionValuePanel : function(oButton, eOpts) {

	var oValuePanel = oButton.scope.valuePanel;
	var oModule = oButton.scope;
	var oNode = oValuePanel.csNode;
	var sValue = oModule.txtValuePanelTextArea.getValue();

	switch (oValuePanel.csAction) {
	case 'setValue':

	    oNode.setText(oNode.raw.csName + " = " + oNode.raw.csValue);
	    me.socket.send(JSON.stringify({
		op : "setOptionValue",
		path : oModule.__getNodePath(oNode),
		value : oModule.__stringToList(sValue, "\n").join(",")
	    }));

	    break;
	case 'setComment':

	    me.socket.send(JSON.stringify({
		op : "setComment",
		path : oModule.__getNodePath(oNode),
		value : sValue
	    }));

	    break;
	}

	oValuePanel.collapse(false);

    },

    __oprMenuCopyNode : function(oItem, e, eOpts) {

	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;
	var sNewName = window.prompt("What's the name for the copy?", oNode.raw.csName + " copy");
	if (sNewName == null)
	    return;

	me.socket.send(JSON.stringify({
	    op : "copyKey",
	    path : oModule.__getNodePath(oNode),
	    newName : sNewName
	}));

    },

    __cbMenuCopyNode : function(oResponse) {

	/*
	 * var newName = reqArguments.params.newName; var node =
	 * reqArguments.node; var newCfg = { text : node.text, csName : newName,
	 * csComment : node.attributes.csComment, }; if (node.isLeaf()) {
	 * newCfg.leaf = true; newCfg.csValue = node.attributes.csValue; } else {
	 * newCfg.text = newName; newCfg.loader = node.loader; }
	 * node.parentNode.appendChild(new Ext.tree.AsyncTreeNode(newCfg));
	 */

    },

    __oprMenuRenameNode : function(oItem, e, eOpts) {
	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;
	var sNewName = window.prompt("What's the new name for " + oNode.raw.csName + " ?");
	if (sNewName == null)
	    return;

	me.socket.send(JSON.stringify({
	    op : "renameKey",
	    path : oModule.__getNodePath(oNode),
	    newName : sNewName
	}));

    },

    __cbMenuRenameNode : function(oResponse) {

	/*
	 * var newName = reqArguments.params.newName; var node =
	 * reqArguments.node; node.attributes.csName = newName; if
	 * (node.isLeaf()) { configureLeafNode(node); } else
	 * node.setText(newName);
	 */

    },

    __oprMenuDeleteNode : function(oItem, e, eOpts) {
	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;
	if (!window.confirm("Are you sure you want to delete " + oModule.__getNodePath(oNode) + "?"))
	    return;
	me.socket.send(JSON.stringify({
	    op : "deleteKey",
	    path : oModule.__getNodePath(oNode)
	}));

    },

    __cbMenuDeleteNode : function(oResponse) {

	/*
	 * var node = reqArguments.node; var pN = node.parentNode;
	 * pN.removeChild( node ); pN.reload();
	 */

    },

    __oprMenuCreateSubsection : function(oItem, e, eOpts) {
	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;
	var sNewName = window.prompt("What's the name of the new section?");
	if (sNewName == null)
	    return;

	me.socket.send(JSON.stringify({
	    op : "createSection",
	    path : oModule.__getNodePath(oNode),
	    name : sNewName
	}));

    },

    __cbMenuCreateSubsection : function(oResponse) {

	/*
	 * var csData = retVal.Value; var newCfg = { text : csData.csName,
	 * csName : csData.csName, csComment : csData.csComment, leaf : false };
	 * var node = reqArguments.node; if( node.isLoaded() ) {
	 * node.appendChild( new Ext.tree.AsyncTreeNode( newCfg ) ); }
	 * node.expand();
	 */

    },

    __oprMenuCreateOption : function(oItem, e, eOpts) {
	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;
	var sNewName = window.prompt("What's the name of the new option?");
	if (sNewName == null)
	    return;
	var sValue = window.prompt("What's the value of the new option?");
	if (sValue == null)
	    return;

	me.socket.send(JSON.stringify({
	    op : "createOption",
	    path : oModule.__getNodePath(oNode),
	    name : sNewName,
	    value : sValue
	}));

    },

    __cbMenuCreateOption : function(oResponse) {

	/*
	 * var csData = retVal.Value; var newCfg = { text : csData[0], csName :
	 * csData[0], csValue : csData[1], csComment : csData[2], leaf : true };
	 * var node = reqArguments.node; if( node.isLoaded() ) {
	 * node.appendChild( new Ext.tree.AsyncTreeNode( newCfg ) ); }
	 * node.expand();
	 */

    }

});
