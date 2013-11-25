Ext.define('DIRAC.RegistryManager.classes.RegistryManager', {
	extend : 'Ext.dirac.core.Module',
	requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.form.field.Date",
			"Ext.form.field.TextArea", "Ext.form.field.Checkbox", "Ext.form.FieldSet", "Ext.Button", "Ext.dirac.utils.DiracMultiSelect", "Ext.util.*", "Ext.toolbar.Toolbar", "Ext.data.Record",
			"Ext.tree.Panel", "Ext.data.TreeStore", "Ext.data.NodeInterface", 'Ext.form.field.TextArea', 'Ext.Array' ],

	initComponent : function() {

		var me = this;

		if (GLOBAL.VIEW_ID == "desktop") {

			me.launcher.title = "Registry Manager";
			me.launcher.maximized = false;
			var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

			me.launcher.height = oDimensions[1] / 2;
			me.launcher.width = oDimensions[0] / 2;

		}

		if (GLOBAL.VIEW_ID == "tabs") {

		}

		Ext.apply(me, {
			layout : 'border',
			bodyBorder : false,
			defaults : {
				collapsible : true,
				split : true
			},
			items : [],
			header : false
		});

		me.callParent(arguments);

	},

	__createSocket : function(sOnOpenFuncName) {

		var me = this;

		var sLoc = window.location;
		var sWsuri;

		if (sLoc.protocol === "https:") {
			sWsuri = "wss:";
		} else {
			sWsuri = "ws:";
		}
		sWsuri += "//" + sLoc.host + GLOBAL.BASE_URL + 'RegistryManager';

		var socket = new WebSocket(sWsuri);

		socket.onopen = function(e) {
			console.log("CONNECTED");
			me.isConnectionEstablished = true;
			socket.send(JSON.stringify({
				op : sOnOpenFuncName
			}));

		};

		socket.onerror = function(e) {
			console.log("ERR " + e.data);
			me.isConnectionEstablished = false;
		};

		socket.onclose = function(e) {
			me.isConnectionEstablished = false;
			var sMessage = "CONNECTION CLOSED";

			if (me.changeMade)
				sMessage += " - UNCOMMITED CHANGES ARE LOST";

			console.log("CLOSE");
			sMessage += "\nDo you want to reconnect now?";

			if (me.dontShowMessageBeforeClose) {
				if (confirm(sMessage)) {
					// resetting the configuration
					me.socket = me.__createSocket("resetConfiguration");

				}
			}
		};

		socket.onmessage = function(e) {

			var oResponse = JSON.parse(e.data);

			if (parseInt(oResponse.success, 10) == 0) {

				GLOBAL.APP.CF.alert(oResponse.message, "error");

				switch (oResponse.op) {

				case "init":

					break;
				case "addUser":

					break;
				case "editUser":

					break;
				case "removeUser":

					break;
				case "addGroup":

					break;
				case "editGroup":

					break;
				case "deleteGroup":

					break;
				case "addHost":

					break;
				case "editHost":

					break;
				case "deleteHost":

					break;
				case "editRegistryProperties":

					break;
				case "commitChanges":

					break;

				}

			} else {

				switch (oResponse.op) {

				case "init":

					break;
				case "addUser":

					break;
				case "editUser":

					break;
				case "removeUser":

					break;
				case "addGroup":

					break;
				case "editGroup":

					break;
				case "deleteGroup":

					break;
				case "addHost":

					break;
				case "editHost":

					break;
				case "deleteHost":

					break;
				case "editRegistryProperties":

					break;
				case "commitChanges":

					break;

				}
			}

		};

		return socket;
	},

	buildUI : function() {

		var me = this;

		me.isConnectionEstablished = false;

		me.socket = me.__createSocket("init");

		me.rightPanel = new Ext.create('Ext.panel.Panel', {
			region : 'east',
			margins : '0',
			width : 250,
			minWidth : 200,
			maxWidth : 350
		});

		// drop-down menu with values

		me.cbDataTypes = Ext.create('Ext.form.field.ComboBox', {
			fieldLabel : "Data type",
			queryMode : 'local',
			labelAlign : 'left',
			displayField : "text",
			valueField : "value",
			anchor : '100%',
			store : new Ext.data.SimpleStore({
				fields : [ 'value', 'text' ],
				data : [ [ "users", "Users" ], [ "groups", "Groups" ], [ "hosts", "Hosts" ] ]
			}),
			listeners : {
				change : function(field, newValue, oldValue, eOpts) {

					var sNewNoun = newValue.substr(0, newValue.length - 1);

					me.gridContextMenu.items.getAt(0).setText("New " + sNewNoun);
					me.gridContextMenu.items.getAt(1).setText("Edit " + sNewNoun);
					me.gridContextMenu.items.getAt(2).setText("Delete " + sNewNoun);

				}
			},
			value : "users"
		});

		me.btnActivateRegistryPropertiesForm = new Ext.Button({
			text : 'Registry Properties',
			iconCls : "dirac-icon-reset",
			handler : function() {

			},
			scope : me
		});

		me.btnCommitChanges = new Ext.Button({
			text : 'Commit',
			iconCls : "dirac-icon-submit",
			handler : function() {

			},
			scope : me
		});

		var oLeftPanelTopToolbar = new Ext.toolbar.Toolbar({
			dock : 'top',
			items : [ me.cbDataTypes, '->', me.btnActivateRegistryPropertiesForm, me.btnCommitChanges ]
		});

		me.gridFields = {

			"users" : [ {
				name : "name"
			}, {
				name : "dn"
			}, {
				name : "cn"
			}, {
				name : "email"
			} ],
			"groups" : [ {
				name : "name"
			}, {
				name : "users"
			}, {
				name : "properties"
			}, {
				name : "vomsrole"
			}, {
				name : "autouploadproxy"
			}, {
				name : "autouploadpilotproxy"
			}, {
				name : "autoaddvoms"
			}, {
				name : "jobshare"
			} ],
			"hosts" : [ {
				name : "name"
			}, {
				name : "dn"
			}, {
				name : "properties"
			} ]

		};

		me.gridColumns = {

			"users" : [ {
				header : 'Name',
				sortable : true,
				dataIndex : 'name',
				align : 'left',
				hideable : false
			}, {
				header : 'DN',
				sortable : true,
				dataIndex : 'dn',
				align : 'left',
				hideable : false
			}, {
				header : 'CN',
				sortable : true,
				dataIndex : 'cn',
				align : 'left',
				hideable : false
			}, {
				header : 'E-Mail',
				sortable : true,
				dataIndex : 'email',
				align : 'left',
				hideable : false
			} ],
			"groups" : [ {
				header : 'Name',
				sortable : true,
				dataIndex : 'name',
				align : 'left',
				hideable : false
			}, {
				header : 'Users',
				sortable : true,
				dataIndex : 'users',
				align : 'left',
				hideable : false
			}, {
				header : 'Properties',
				sortable : true,
				dataIndex : 'properties',
				align : 'left',
				hideable : false
			}, {
				header : 'VOMS Role',
				sortable : true,
				dataIndex : 'vomsrole',
				align : 'left',
				hideable : false
			}, {
				header : 'Auto Upload Proxy',
				sortable : true,
				dataIndex : 'autouploadproxy',
				align : 'left',
				hideable : false
			}, {
				header : 'Auto Upload Pilot Proxy',
				sortable : true,
				dataIndex : 'autouploadpilotproxy',
				align : 'left',
				hideable : false
			}, {
				header : 'Auto Add VOMS',
				sortable : true,
				dataIndex : 'autoaddvoms',
				align : 'left',
				hideable : false
			}, {
				header : 'Job Share',
				sortable : true,
				dataIndex : 'jobshare',
				align : 'left',
				hideable : false
			} ],
			"hosts" : [ {
				header : 'Name',
				sortable : true,
				dataIndex : 'name',
				align : 'left',
				hideable : false
			}, {
				header : 'DN',
				sortable : true,
				dataIndex : 'dn',
				align : 'left',
				hideable : false
			}, {
				header : 'Properties',
				sortable : true,
				dataIndex : 'properties',
				align : 'left',
				hideable : false
			} ]

		};

		me.grid = Ext.create('Ext.grid.Panel', {
			region : 'center',
			store : me.dataStore,
			height : '600',
			header : false,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			}
		});

		me.grid.addDocked(oLeftPanelTopToolbar);

		me.gridContextMenu = new Ext.menu.Menu({
			items : [ {
				handler : function() {

				},
				text : 'New user'
			}, {
				handler : function() {

				},
				text : 'Edit user'
			}, {
				handler : function() {

				},
				text : 'Delete user'
			} ]
		});

		me.dontShowMessageBeforeClose = true;

	},

	afterRender : function() {
		var me = this;

		me.__setDiracDestroyHandler();

		this.callParent();
	},

	__setDiracDestroyHandler : function() {

		var me = this;

		me.on("destroy", function(oComp, eOpts) {

			var oThisContainer = this;

			oThisContainer.dontShowMessageBeforeClose = false;
			oThisContainer.socket.close();

		}, me);

	},

	__createGroupForm : function(oRecord) {

		var me = this;

		if ("groupForm" in me) {

			me.groupForm.txtName.setValue("");
			me.groupForm.txtJobShare.setValue("");

			if ((oRecord != null) && (oRecord != undefined)) {

				me.groupForm.txtName.setValue(oRecord.get("name"));
				me.groupForm.cbAutoUploadProxy.setValue(oRecord.get("autouploadproxy"));
				me.groupForm.cbAutoUploadPilotProxy.setValue(oRecord.get("autouploadpilotproxy"));
				me.groupForm.cbAutoAddVoms.setValue(oRecord.get("autoaddvoms"));
				me.groupForm.txtJobShare.setValue(oRecord.get("jobshare"));

			}
		} else {

			me.groupForm = {};

			me.groupForm.txtName = Ext.create('Ext.form.field.Text', {
				fieldLabel : "Name:",
				labelAlign : 'left',
				margin : 10
			});

			me.groupForm.cbAutoUploadProxy = Ext.create('Ext.form.field.ComboBox', {
				fieldLabel : "Auto Upload Proxy",
				queryMode : 'local',
				labelAlign : 'left',
				displayField : "value",
				valueField : "value",
				anchor : '100%',
				store : new Ext.data.SimpleStore({
					fields : [ 'value' ],
					data : [ [ "None" ], [ "True" ], [ "False" ] ]
				})
			});

			me.groupForm.cbAutoUploadPilotProxy = Ext.create('Ext.form.field.ComboBox', {
				fieldLabel : "Auto Upload Pilot Proxy",
				queryMode : 'local',
				labelAlign : 'left',
				displayField : "value",
				valueField : "value",
				anchor : '100%',
				store : new Ext.data.SimpleStore({
					fields : [ 'value' ],
					data : [ [ "None" ], [ "True" ], [ "False" ] ]
				})
			});

			me.groupForm.cbAutoAddVoms = Ext.create('Ext.form.field.ComboBox', {
				fieldLabel : "Auto Add VOMS",
				queryMode : 'local',
				labelAlign : 'left',
				displayField : "value",
				valueField : "value",
				anchor : '100%',
				store : new Ext.data.SimpleStore({
					fields : [ 'value' ],
					data : [ [ "None" ], [ "True" ], [ "False" ] ]
				})
			});

			me.groupForm.txtJobShare = Ext.create('Ext.form.field.Number', {
				fieldLabel : "Job Share:",
				labelAlign : 'left',
				margin : 10
			});

		}

		me.rightPanel.removeAll();
		me.rightPanel.add([ me.groupForm.txtName, me.groupForm.cbAutoUploadProxy, me.groupForm.cbAutoUploadPilotProxy, me.groupForm.cbAutoAddVoms, me.groupForm.txtJobShare ]);
		me.activeRecordInForm = oRecord;

	},

	__createUserForm : function(oRecord) {

		var me = this;

		if ("userForm" in me) {

			me.userForm.txtName.setValue("");
			me.userForm.txtDn.setValue("");
			me.userForm.txtCn.setValue("");
			me.userForm.txtEmail.setValue("");

			if ((oRecord != null) && (oRecord != undefined)) {

				me.userForm.txtName.setValue(oRecord.get("name"));
				me.userForm.txtDn.setValue(oRecord.get("dn"));
				me.userForm.txtCn.setValue(oRecord.get("cn"));
				me.userForm.txtEmail.setValue(oRecord.get("email"));

			}

		} else {
			me.userForm = {};

			me.userForm.txtName = Ext.create('Ext.form.field.Text', {
				fieldLabel : "Name:",
				labelAlign : 'left',
				margin : 10
			});

			me.userForm.txtDn = Ext.create('Ext.form.field.Text', {
				fieldLabel : "DN:",
				labelAlign : 'left',
				margin : 10
			});

			me.userForm.txtCn = Ext.create('Ext.form.field.Text', {
				fieldLabel : "CN:",
				labelAlign : 'left',
				margin : 10
			});

			me.userForm.txtEmail = Ext.create('Ext.form.field.Text', {
				fieldLabel : "E-Mail:",
				labelAlign : 'left',
				margin : 10
			});

		}

		me.rightPanel.removeAll();
		me.rightPanel.add([ me.userForm.txtName, me.userForm.txtDn, me.userForm.txtCn, me.userForm.txtEmail ]);
		me.activeRecordInForm = oRecord;

	},

	__createHostForm : function(oRecord) {

		var me = this;

		if ("hostForm" in me) {

			me.hostForm.txtName.setValue("");
			me.hostForm.txtDn.setValue("");

			if ((oRecord != null) && (oRecord != undefined)) {

				me.hostForm.txtName.setValue(oRecord.get("name"));
				me.hostForm.txtDn.setValue(oRecord.get("dn"));

			}

		} else {
			me.hostForm = {};

			me.hostForm.txtName = Ext.create('Ext.form.field.Text', {
				fieldLabel : "Name:",
				labelAlign : 'left',
				margin : 10
			});

			me.hostForm.txtDn = Ext.create('Ext.form.field.Text', {
				fieldLabel : "DN:",
				labelAlign : 'left',
				margin : 10
			});

		}

		me.rightPanel.removeAll();
		me.rightPanel.add([ me.hostForm.txtName, me.hostForm.txtDn ]);
		me.activeRecordInForm = oRecord;

	},

	__createMultiListWithButtons : function(sTitle, oData) {

		var me = this;

		var oMultiSelect = new Ext.ux.form.MultiSelect({
			fieldLabel : sTitle,
			queryMode : 'local',
			labelAlign : 'left',
			displayField : "value",
			valueField : "value",
			anchor : '100%',
			store : new Ext.data.SimpleStore({
				fields : [ 'value' ],
				data : oData
			})
		});

		var oAddButton = new Ext.Button({
			iconCls : "dirac-icon-plus",
			handler : function() {
				Ext.MessageBox.prompt('New Item', 'Enter the name of the new item :', function(btn, text) {
					if (btn == "ok") {
						text = Ext.util.Format.trim(text);
						if (text != "") {

							// first we check whether the item exists or not
							var oStore = oMultiSelect.store;
							var bFound = false;

							for ( var i = 0; i < oStore.getCount(); i++) {

								if (oStore.getAt(i).get("value") == text) {

									bFound = true;
									break;

								}

							}

							if (!bFound) {

								oStore.add([ text ])

							} else {

								GLOBAL.APP.CF.alert('The item already exists !', 'warning');

							}

						}
					}
				});
			},
			scope : me
		});

		var oDeleteButton = new Ext.Button({
			iconCls : "dirac-icon-delete",
			handler : function() {

				var oStore = oMultiSelect.store;
				var oSelectedValues = oMultiSelect.getValue();

				for ( var i = 0; i < oSelectedValues.length; i++) {

					var sItem = oSelectedValues[i];

					for ( var j = 0; j < oStore.getCount(); j++) {

						if (oStore.getAt(j).get("value") == sItem) {

							oStore.removeAt(j);
							break;

						}

					}

				}

			},
			scope : me
		});

		var oToolbar = new Ext.toolbar.Toolbar({
			dock : 'top',
			items : [ '->', oAddButton, oDeleteButton ]
		});

		oMultiSelect.addDocked(oToolbar);

		return oMultiSelect;

	}

});
