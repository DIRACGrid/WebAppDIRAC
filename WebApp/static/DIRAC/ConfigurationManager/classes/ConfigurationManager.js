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
	    "Ext.tree.Panel", "Ext.data.TreeStore", "Ext.data.NodeInterface", 'Ext.form.field.TextArea', 'Ext.Array' ],

    loadState : function(oData) {

	var me = this;

	me.__postponedLoadState(oData);

    },

    __postponedLoadState : function(oData) {

	var me = this;

	if (!me.isConnectionEstablished) {
	    setTimeout(function() {
		me.__postponedLoadState(oData);
	    }, 1000);
	} else {

	    me.socket.send(JSON.stringify({
		op : "getBulkExpandedNodeData",
		nodes : oData.expandedNodes.join("<<||>>")
	    }));

	}

    },

    getStateData : function() {

	var me = this;
	var oReturn = {};

	var oSerializedActions = [];

	if ("" in me.expansionState)
	    me.__serializeExpansionAction("", me.expansionState[""], oSerializedActions);

	oReturn.expandedNodes = oSerializedActions;

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

    /*
     * This function is used only for ExtJS version 4.1.3
     */

    setNodeText : function(oNode, sNewText) {

	var me = this;
	var oDivContainer = me.treePanel.getView().getNode(oNode).childNodes[0].childNodes[0];

	var iNumberChildren = oDivContainer.childNodes.length;

	// removing the old text node
	oDivContainer.removeChild(oDivContainer.childNodes[iNumberChildren - 1]);

	// creating the new text node
	var oNewTextNode = document.createTextNode(sNewText);
	oDivContainer.appendChild(oNewTextNode);

	oNode.raw.text = sNewText;
	oNode.data.text = sNewText;

    },

    /*
     * __createSocket:function(){
     * 
     * var me = this;
     * 
     * var sLoc = window.location; var sWsuri;
     * 
     * if (sLoc.protocol === "https:") { sWsuri = "wss:"; } else { sWsuri =
     * "ws:"; } sWsuri += "//" + sLoc.host + _app_base_url +
     * 'ConfigurationManager';
     * 
     * socket = new WebSocket(sWsuri);
     * 
     * socket.onopen = function(e) { console.log("CONNECTED");
     * me.isConnectionEstablished = true; socket.send(JSON.stringify({ op :
     * "init" })); };
     * 
     * socket.onerror = function(e) { console.log("ERR " + e.data); };
     * 
     * socket.onclose = function(e) { console.log("CLOSE");
     *  // resetting the configuration socket.send(JSON.stringify({ op :
     * "resetConfiguration" })); me.btnResetConfig.hide(); };
     * 
     * return socket;
     *  },
     */

    buildUI : function() {

	var me = this;

	me.isConnectionEstablished = false;

	var sLoc = window.location;
	var sWsuri;

	if (sLoc.protocol === "https:") {
	    sWsuri = "wss:";
	} else {
	    sWsuri = "ws:";
	}
	sWsuri += "//" + sLoc.host + _app_base_url + 'ConfigurationManager';

	me.socket = new WebSocket(sWsuri);

	me.socket.onopen = function(e) {
	    console.log("CONNECTED");
	    me.isConnectionEstablished = true;
	    me.socket.send(JSON.stringify({
		op : "init"
	    }));
	};

	me.socket.onerror = function(e) {
	    console.log("ERR " + e.data);
	    me.isConnectionEstablished = false;
	};

	me.socket.onclose = function(e) {
	    me.isConnectionEstablished = false;
	    var sMessage = "CONNECTION CLOSED";

	    if (me.changeMade)
		sMessage += " - UNCOMMITED CHANGES ARE LOST";

	    console.log("CLOSE");
	    sMessage += "\n Do you want to reconnect now?";
	    
	    if (me.dontShowMessageBeforeClose) {
		if (confirm(sMessage)) {
		    // resetting the configuration
		    me.socket.send(JSON.stringify({
			op : "resetConfiguration"
		    }));
		    me.btnResetConfig.hide();
		}
	    }
	};

	me.socket.onmessage = function(e) {

	    var oResponse = JSON.parse(e.data);

	    // console.log("----RESPONSE----");
	    // console.log(oResponse);

	    if (parseInt(oResponse.success) == 0) {

		alert(oResponse.message);

		switch (oResponse.op) {

		case "moveNode":
		    me.waitForMoveResponse = false;
		    break;
		case "commitConfiguration":
		    me.btnCommitConfiguration.show();
		    me.btnViewConfigDifference.show();
		    break;
		}

	    } else {

		switch (oResponse.op) {

		case "init":
		    if (_app_ext_version == "ext-4.1.1a")
			me.setNodeText(me.treeStore.getRootNode(), oResponse.name + " [" + oResponse.version + "]");
		    else
			me.treeStore.getRootNode().setText(oResponse.name + " [" + oResponse.version + "]");
		    break;
		case "getSubnodes":
		    me.__oprCreateSubnodes(oResponse);
		    break;
		case "showConfigurationAsText":
		    me.__showConfigTextInWindow(oResponse.text);
		    break;
		case "showCurrentDiff":
		    me.__showConfigDiffInWindow(oResponse.html);
		    me.btnCommitConfiguration.show();
		    me.btnViewConfigDifference.show();
		    break;
		case "resetConfiguration":
		    if (_app_ext_version == "ext-4.1.1a")
			me.setNodeText(me.treeStore.getRootNode(), oResponse.name + " [" + oResponse.version + "]");
		    else
			me.treeStore.getRootNode().setText(oResponse.name + " [" + oResponse.version + "]");
		    me.__cbResetConfigurationTree(oResponse.text);
		    me.__clearValuePanel();
		    me.copyNode = null;
		    me.btnPasteButton.setDisabled(true);
		    me.treePanel.body.unmask();
		    me.changeMade = false;
		    break;
		case "getBulkExpandedNodeData":
		    me.__cbGetBulkExpandedNodeData(oResponse);
		    break;

		case "setOptionValue":
		    var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);
		    oNode.raw.csValue = oResponse.value;
		    me.valuePanel.csValue = oResponse.value;
		    me.txtOptionValuePanelTextArea.setValue(oResponse.value);
		    if (_app_ext_version == "ext-4.1.1a")
			me.setNodeText(oNode, oNode.raw.csName + " = " + oNode.raw.csValue);
		    else
			oNode.setText(oNode.raw.csName + " = " + oNode.raw.csValue);
		    me.changeMade = true;
		    break;
		case "setComment":
		    var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);
		    oNode.raw.csComment = oResponse.comment;
		    me.valuePanel.csComment = me.__commentToList(oNode.raw.csComment).join("\n");
		    me.changeMade = true;
		    break;
		case "copyKey":
		    me.__cbMenuCopyNode(oResponse);
		    me.changeMade = true;
		    break;
		case "renameKey":
		    me.__cbMenuRenameNode(oResponse);
		    me.changeMade = true;
		    break;
		case "deleteKey":
		    me.__cbMenuDeleteNode(oResponse);
		    me.__clearValuePanel();
		    me.changeMade = true;
		    break;
		case "createSection":
		    me.__cbMenuCreateSubsection(oResponse);
		    me.changeMade = true;
		    break;
		case "createOption":
		    me.__cbMenuCreateOption(oResponse);
		    me.changeMade = true;
		    break;
		case "commitConfiguration":
		    alert("The changes in the configuration have been successfuly commited !");
		    me.btnCommitConfiguration.show();
		    me.btnViewConfigDifference.show();
		    me.changeMade = false;
		    break;
		case "moveNode":
		    me.__cbMoveNode(oResponse);
		    me.changeMade = true;
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

	    text : 'Reload',

	    iconCls : "cm-reset-icon",
	    handler : function() {
		if (me.changeMade) {
		    if (confirm("If you reload you might loose the changes you've might made.\nDo you want to reload?")) {
			me.socket.send(JSON.stringify({
			    op : "resetConfiguration"
			}));
			me.btnResetConfig.hide();
			me.treePanel.body.mask("Loading ...");
		    }
		} else {

		    me.socket.send(JSON.stringify({
			op : "resetConfiguration"
		    }));
		    me.btnResetConfig.hide();
		    me.treePanel.body.mask("Loading ...");

		}
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

	var bBarElems = [ me.btnViewConfigAsText, me.btnResetConfig ];

	if (("properties" in _user_credentials) && (Ext.Array.indexOf(_user_credentials.properties, "CSAdministrator") != -1)) {

	    me.btnBrowseManage = new Ext.Button({

		text : 'Manage',

		iconCls : "cm-to-manage-icon",
		handler : function() {
		    if (me.editMode) {
			me.btnBrowseManage.setText("Manage");
			me.btnBrowseManage.setIconCls("cm-to-manage-icon");
			me.leafMenu.hide();
			me.sectionMenu.hide();
			me.valuePanel.hide();
			me.btnCommitConfiguration.hide();
			me.btnViewConfigDifference.hide();
		    } else {
			me.btnBrowseManage.setText("Browse");
			me.btnBrowseManage.setIconCls("cm-to-browse-icon");
			me.valuePanel.show();
			me.valuePanel.expand(false);
			me.btnCommitConfiguration.show();
			me.btnViewConfigDifference.show();
		    }
		    me.editMode = !me.editMode;
		},
		scope : me

	    });

	    me.btnCommitConfiguration = new Ext.Button({

		text : 'Commit',

		iconCls : "cm-submit-icon",
		handler : function() {
		    if (confirm("Do you want to apply the configuration changes you've done till now?")) {
			me.socket.send(JSON.stringify({
			    op : "commitConfiguration"
			}));
			me.btnCommitConfiguration.hide();
			me.btnViewConfigDifference.hide();
		    }
		},
		scope : me,
		hidden : true

	    });

	    me.btnViewConfigDifference = new Ext.Button({

		text : 'View diffrence',

		iconCls : "cm-to-browse-icon",
		handler : function() {
		    me.socket.send(JSON.stringify({
			op : "showCurrentDiff"
		    }));
		    me.btnCommitConfiguration.hide();
		    me.btnViewConfigDifference.hide();
		},
		scope : me,
		hidden : true
	    });

	    bBarElems.push("->");
	    bBarElems.push(me.btnCommitConfiguration);
	    bBarElems.push(me.btnViewConfigDifference);
	    bBarElems.push(me.btnBrowseManage);

	}

	me.treePanel = new Ext.create('Ext.tree.Panel', {
	    region : 'center',
	    store : me.treeStore,
	    viewConfig : {
		plugins : {
		    ptype : 'treeviewdragdrop',
		    containerScroll : true
		}
	    },
	    tbar : bBarElems,
	    listeners : {

		beforeitemcontextmenu : function(oView, oNode, item, index, e, eOpts) {

		    if (me.editMode) {

			e.preventDefault();
			if (oNode.isLeaf()) {
			    me.leafMenu.node = oNode;
			    me.leafMenu.showAt(e.xy);
			} else {
			    me.sectionMenu.node = oNode;
			    me.sectionMenu.showAt(e.xy);
			}

			if (me.editMode) {

			    if (oNode.getId() != "root") {

				me.__oprSetValuesForValuePanel(me, oNode);

			    }
			}

			return false;
		    } else {

			return true;
		    }

		},

		beforecontainercontextmenu : function(oView, e, eOpts) {
		    if (me.editMode) {
			return false;
		    } else {
			return true;
		    }
		},

		itemclick : function(oView, oNode, item, index, e, eOpts) {

		    if (oNode.getId() != "root") {

			me.__oprSetValuesForValuePanel(me, oNode);

		    }

		},
		beforeitemmove : function(oNode, oOldParent, oNewParent, iIndex, eOpts) {

		    if (me.editMode) {
			if (!me.waitForMoveResponse) {
			    me.__oprMoveNode(oNode, oOldParent, oNewParent, iIndex);
			    return false;
			}
		    } else {
			return false;
		    }

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
		if (me.valuePanel.csNode == null)
		    return;

		me.txtOptionValuePanelTextArea.setValue(me.valuePanel.csValue);
		me.txtCommentValuePanelTextArea.setValue(me.valuePanel.csComment);
	    },
	    scope : me

	});

	me.txtOptionValuePanelTextArea = new Ext.create('Ext.form.field.TextArea', {
	    fieldLabel : "Value",
	    labelAlign : "top",
	    flex : 1
	});
	me.txtCommentValuePanelTextArea = new Ext.create('Ext.form.field.TextArea', {
	    fieldLabel : "Comment",
	    labelAlign : "top",
	    flex : 1
	});

	me.valuePanel = new Ext.create('Ext.panel.Panel', {
	    title : 'Path',
	    region : 'east',
	    floatable : false,
	    margins : '0',
	    width : 250,
	    minWidth : 230,
	    maxWidth : 350,
	    bodyPadding : 5,
	    layout : {
		type : 'vbox',
		align : 'stretch',
		pack : 'start'
	    },
	    autoScroll : true,
	    collapsed : true,

	    csNode : null,
	    csPath : "",
	    csValue : "",
	    csComment : "",

	    items : [ me.txtOptionValuePanelTextArea, me.txtCommentValuePanelTextArea ],

	    bbar : [ me.btnValuePanelSubmit, me.btnValuePanelReset ],
	    listeners : {

		render : function(oPanel, eOpts) {

		    oPanel.hide();

		}

	    }
	});

	me.add([ me.treePanel, me.valuePanel ]);

	me.leafMenu = new Ext.menu.Menu({
	    width : 150,
	    items : [ {
		text : 'Copy',
		listeners : {
		    click : me.__oprMenuCopyNode
		}
	    }, {
		text : 'Rename',
		listeners : {
		    click : me.__oprMenuRenameNode
		}
	    }, {
		text : 'Delete',
		listeners : {
		    click : me.__oprMenuDeleteNode
		}
	    } ],
	    moduleObject : me
	});

	me.btnPasteButton = new Ext.menu.Item({

	    text : 'Paste',
	    disabled : false,
	    listeners : {
		click : me.__oprMenuPasteNode
	    }

	});

	me.sectionMenu = new Ext.menu.Menu({
	    width : 150,
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
		text : 'Copy',
		listeners : {
		    click : me.__oprMenuCopyNode
		}
	    }, me.btnPasteButton, {
		text : 'Rename',
		listeners : {
		    click : me.__oprMenuRenameNode
		}
	    }, {
		text : 'Delete',
		listeners : {
		    click : me.__oprMenuDeleteNode
		}
	    } ],
	    moduleObject : me
	});

	me.expansionState = {};
	me.counterNodes = 0;
	me.flagReset = false;
	me.waitForMoveResponse = false;
	me.editMode = false;
	me.copyNode = null;
	me.changeMade = false;
	me.dontShowMessageBeforeClose = true;

    },

    afterRender : function() {
	var me = this;

	me.__setDiracDestroyHandler();

	this.callParent();
    },

    __setDiracDestroyHandler : function() {

	var me = this;

	if (me.getContainer() != null) {
	    me.getContainer().__dirac_destroy = function(oWin) {
		me.dontShowMessageBeforeClose = false;
		oWin.loadedObject.socket.close();
	    }
	} else {
	    setTimeout(function() {
		me.__setDiracDestroyHandler();
	    }, 1000);

	}

    },

    __clearValuePanel : function() {

	var me = this;
	me.txtCommentValuePanelTextArea.setValue("");
	me.txtOptionValuePanelTextArea.setValue("");
	me.valuePanel.csValue = "";
	me.valuePanel.csComment = "";
	me.valuePanel.csNode = null;
	me.valuePanel.csPath = "";
	me.valuePanel.setTitle("[No node selected]");

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

    __showConfigDiffInWindow : function(sHtml) {

	var me = this;
	var oWindow = me.getContainer().oprGetChildWindow("Current Configuration Difference", false, 700, 500);
	sHtml = sHtml.replace(new RegExp("&amp;nbsp;", 'g'), "&nbsp;");
	var oPanel = new Ext.create('Ext.panel.Panel', {
	    html : sHtml,
	    layout : "fit",
	    autoScroll : true,
	    bodyPadding : 5
	});
	oWindow.add(oPanel);
	oWindow.show();
	oWindow.maximize();

    },

    __cbResetConfigurationTree : function() {

	var me = this;

	var oSerializedActions = [];

	if ("" in me.expansionState)
	    me.__serializeExpansionAction("", me.expansionState[""], oSerializedActions);

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

	    var oPath = oRetData[i][0];
	    var oData = oRetData[i][1];

	    var oParentNode = me.__findNodeByPath(oPath);

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

	if (!sep) {
	    sep = ",";
	} else {
	    stringValue = stringValue.replace(new RegExp(",", 'g'), "");
	}

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

    __oprSetValuesForValuePanel : function(oModule, oNode) {

	oModule.valuePanel.csNode = oNode;
	oModule.valuePanel.csComment = oModule.__commentToList(oNode.raw.csComment).join("\n");
	oModule.valuePanel.csPath = oModule.__getNodePath(oNode);
	oModule.valuePanel.setTitle("Node <br/>" + oModule.valuePanel.csPath);

	if (oNode.isLeaf()) {

	    oModule.valuePanel.csValue = oModule.__stringToList(oNode.raw.csValue).join("\n");
	    oModule.txtOptionValuePanelTextArea.setValue(oModule.valuePanel.csValue);
	    oModule.txtCommentValuePanelTextArea.setValue(oModule.valuePanel.csComment);
	    oModule.txtOptionValuePanelTextArea.show();

	} else {

	    oModule.txtCommentValuePanelTextArea.setValue(oModule.valuePanel.csComment);
	    oModule.txtOptionValuePanelTextArea.hide();
	}

    },

    __oprActionValuePanel : function(oButton, eOpts) {

	var oValuePanel = oButton.scope.valuePanel;
	var oModule = oButton.scope;
	var oNode = oValuePanel.csNode;

	if (oNode == null)
	    return;

	if (oNode.isLeaf()) {

	    var sNewValue = oModule.__stringToList(oModule.txtOptionValuePanelTextArea.getValue(), "\n").join(",");

	    oModule.socket.send(JSON.stringify({
		op : "setOptionValue",
		path : oModule.__getNodePath(oNode),
		value : sNewValue,
		parentNodeId : oNode.getId()

	    }));
	}

	oModule.socket.send(JSON.stringify({
	    op : "setComment",
	    path : oModule.__getNodePath(oNode),
	    value : oModule.txtCommentValuePanelTextArea.getValue(),
	    parentNodeId : oNode.getId()
	}));

    },

    __oprMenuCopyNode : function(oItem, e, eOpts) {

	var oModule = oItem.parentMenu.moduleObject;
	var oNode = oItem.parentMenu.node;

	// when press COPY
	oModule.copyNode = oNode;
	oModule.btnPasteButton.setDisabled(false);

    },

    __oprMenuPasteNode : function(oItem, e, eOpts) {

	var oModule = oItem.parentMenu.moduleObject;
	var oNode = oItem.parentMenu.node;

	if (oModule.copyNode != null) {
	    // when press PASTE, if only the name repeats itself
	    // First we have to check if there is a node with that name

	    var sNewName = oModule.copyNode.raw.csName;

	    var bNameExists = oModule.__nameExists(oNode, sNewName);

	    while (bNameExists) {

		sNewName = sNewName + "(copy)";
		sNewName = window.prompt("The name already exists. What's the name for the copy?", sNewName);

		if (sNewName == null)
		    return;

		bNameExists = oModule.__nameExists(oNode, sNewName);
	    }

	    oModule.socket.send(JSON.stringify({
		op : "copyKey",
		newName : sNewName,
		copyFromPath : oModule.__getNodePath(oModule.copyNode),
		copyToPath : oModule.__getNodePath(oNode),
		nodeId : oModule.copyNode.getId(),
		parentNodeToId : oNode.getId()
	    }));

	}

    },

    __nameExists : function(oNode, sName) {

	var oChildNodes = oNode.childNodes;

	var bNameExists = false;

	for ( var i = 0; i < oChildNodes.length; i++) {

	    if (oChildNodes[i].raw.csName == sName) {

		bNameExists = true;
		break;

	    }

	}

	return bNameExists;

    },

    __cbMenuCopyNode : function(oResponse) {

	var me = this;

	var newName = oResponse.newName;
	var oNode = me.treeStore.getNodeById(oResponse.nodeId);
	var oDestinationNode = me.treeStore.getNodeById(oResponse.parentNodeToId);

	var newCfg = {
	    text : oNode.data.text,
	    csName : newName,
	    csComment : oNode.raw.csComment,
	};

	if (oNode.isLeaf()) {

	    newCfg.leaf = true;
	    newCfg.csValue = oNode.raw.csValue;
	    newCfg.csName = newName;
	    newCfg.text = newName + " = " + oNode.raw.csValue;
	    newCfg.id = me.__generateNewNodeId();
	    var oNewNode = oNode.createNode(newCfg);
	    oDestinationNode.appendChild(oNewNode);
	} else {

	    newCfg.text = newName;
	    newCfg.csName = newName;
	    newCfg.leaf = false;
	    newCfg.id = me.__generateNewNodeId();
	    var oNewNode = oNode.createNode(newCfg);
	    oNewNode.appendChild({});
	    oDestinationNode.appendChild(oNewNode);
	}

    },

    __oprMenuRenameNode : function(oItem, e, eOpts) {
	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;
	var sNewName = window.prompt("What's the new name for " + oNode.raw.csName + " ?");
	if (sNewName == null)
	    return;

	oModule.socket.send(JSON.stringify({
	    op : "renameKey",
	    path : oModule.__getNodePath(oNode),
	    newName : sNewName,
	    parentNodeId : oNode.getId()
	}));

    },

    __cbMenuRenameNode : function(oResponse) {

	var me = this;
	var newName = oResponse.newName;
	var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);

	oNode.raw.csName = newName;

	if (oNode.isLeaf()) {

	    if (_app_ext_version == "ext-4.1.1a")
		me.setNodeText(oNode, oNode.raw.csName + " = " + oNode.raw.csValue);
	    else
		oNode.setText(oNode.raw.csName + " = " + oNode.raw.csValue);

	} else {

	    if (_app_ext_version == "ext-4.1.1a")
		me.setNodeText(oNode, newName);
	    else
		oNode.setText(newName)

	}

    },

    __oprMenuDeleteNode : function(oItem, e, eOpts) {
	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;
	if (!window.confirm("Are you sure you want to delete " + oModule.__getNodePath(oNode) + "?"))
	    return;
	oModule.socket.send(JSON.stringify({
	    op : "deleteKey",
	    path : oModule.__getNodePath(oNode),
	    parentNodeId : oNode.getId()
	}));

    },

    __cbMenuDeleteNode : function(oResponse) {

	var me = this;

	var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);
	var oParentNode = oNode.parentNode;
	oParentNode.removeChild(oNode);

    },

    __oprMenuCreateSubsection : function(oItem, e, eOpts) {
	var oNode = oItem.parentMenu.node;
	var oModule = oItem.parentMenu.moduleObject;
	var sNewName = window.prompt("What's the name of the new section?");
	if (sNewName == null)
	    return;

	oModule.socket.send(JSON.stringify({
	    op : "createSection",
	    path : oModule.__getNodePath(oNode),
	    name : sNewName,
	    parentNodeId : oNode.getId()
	}));

    },

    __cbMenuCreateSubsection : function(oResponse) {

	var me = this;
	var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);

	var csData = oResponse.node;
	var newCfg = {
	    text : csData.csName,
	    csName : csData.csName,
	    csComment : csData.csComment,
	    leaf : false
	};

	if (oNode.isLoaded()) {

	    newCfg.id = me.__generateNewNodeId();

	    var oNewNode = oNode.createNode(newCfg);
	    oNewNode.appendChild({});
	    oNode.appendChild(oNewNode);

	}

	oNode.expand();

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

	oModule.socket.send(JSON.stringify({
	    op : "createOption",
	    path : oModule.__getNodePath(oNode),
	    name : sNewName,
	    value : sValue,
	    parentNodeId : oNode.getId()
	}));

    },

    __cbMenuCreateOption : function(oResponse) {

	var me = this;
	var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);
	var newCfg = {
	    text : oResponse.optionName + " = " + oResponse.value,
	    csName : oResponse.optionName,
	    csValue : oResponse.value,
	    csComment : oResponse.comment,
	    leaf : true
	};

	if (oNode.isLoaded()) {

	    newCfg.id = me.__generateNewNodeId();

	    var oNewNode = oNode.createNode(newCfg);
	    oNode.appendChild(oNewNode);

	}

	oNode.expand();

    },

    __oprMoveNode : function(oNode, oOldParent, oNewParent, iIndex) {

	var me = this;

	me.socket.send(JSON.stringify({
	    op : "moveNode",

	    nodePath : me.__getNodePath(oNode),
	    newParentPath : me.__getNodePath(oNewParent),
	    beforeOfIndex : iIndex,

	    oldIndex : oOldParent.indexOf(oNode),
	    nodeId : oNode.getId(),
	    parentOldId : oOldParent.getId(),
	    parentNewId : oNewParent.getId()
	}));

	me.waitForMoveResponse = true;

    },

    __cbMoveNode : function(oResponse) {

	var me = this;
	var oNode = me.treeStore.getNodeById(oResponse.nodeId);
	var oNewParent = me.treeStore.getNodeById(oResponse.parentNewId);

	oNewParent.insertChild(parseInt(oResponse.beforeOfIndex), oNode);
	me.waitForMoveResponse = false;

    }

});
