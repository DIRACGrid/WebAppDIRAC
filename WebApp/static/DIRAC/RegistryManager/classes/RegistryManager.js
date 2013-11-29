Ext.define('DIRAC.RegistryManager.classes.RegistryManager',
		{
			extend : 'Ext.dirac.core.Module',
			requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.form.field.Date",
					"Ext.form.field.TextArea", "Ext.form.field.Checkbox", "Ext.form.FieldSet", "Ext.Button", "Ext.dirac.utils.DiracMultiSelect", "Ext.util.*", "Ext.toolbar.Toolbar", "Ext.data.Record",
					'Ext.Array' ],

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

					if (sOnOpenFuncName == "init") {
						me.grid.body.mask("Loading ...");
						me.__sendSocketMessage({
							op : "getData",
							type : "users"
						});
						me.__getGroupList();
					}
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
					console.log("RESPONSE");
					console.log(oResponse);

					if (parseInt(oResponse.success, 10) == 0) {

						GLOBAL.APP.CF.alert(oResponse.message, "error");

						switch (oResponse.op) {

						case "init":

							break;
						case "getData":
							me.grid.body.unmask();
							break;
						case "addItem":
							break;
						case "editItem":
							break;
						case "deleteItem":
							break;
						case "editRegistryProperties":
							break;
						case "commitChanges":
							me.getContainer().body.unmask();
							break;

						}

					} else {

						switch (oResponse.op) {

						case "init":

							break;
						case "resetConfiguration":
							me.rightPanel.removeAll();
							me.rightPanel.setTitle("");
							me.rightPanel.currentRecord = null;
							me.rightPanel.currentType = "";
							me.grid.body.mask("Loading ...");

							me.__sendSocketMessage({
								op : "getData",
								type : me.cbDataTypes.getValue()
							});
							break;
						case "getData":

							me.grid.store.removeAll();

							me.dataStore = new Ext.data.JsonStore({
								fields : me.gridFields[oResponse.type],
								data : oResponse.data
							});

							me.grid.reconfigure(me.dataStore, me.gridColumns[oResponse.type]);
							me.grid.store.sort([ {
								property : 'name',
								direction : 'ASC'
							} ]);

							me.grid.body.unmask();

							if (!me.firstTimeReadUsers) {

								for ( var i = 0; i < oResponse.data.length; i++) {
									me.userList.push(oResponse.data[i]["name"]);
								}

								me.firstTimeReadUsers = true;
							}

							break;
						case "addItem":
							me.grid.body.mask("Loading ...");
							me.rightPanel.removeAll();
							me.rightPanel.setTitle("");
							me.rightPanel.currentRecord = null;
							me.rightPanel.currentType = "";
							me.__sendSocketMessage({
								op : "getData",
								type : me.cbDataTypes.getValue()
							});
							break;
						case "editItem":
							me.grid.body.mask("Loading ...");

							me.__sendSocketMessage({
								op : "getData",
								type : me.cbDataTypes.getValue()
							});
							break;
						case "deleteItem":
							me.grid.body.mask("Loading ...");
							me.rightPanel.removeAll();
							me.rightPanel.setTitle("");
							me.rightPanel.currentRecord = null;
							me.__sendSocketMessage({
								op : "getData",
								type : me.cbDataTypes.getValue()
							});
							break;
						case "editRegistryProperties":

							break;
						case "commitChanges":
							GLOBAL.APP.CF.alert("The changes in the configuration have been successfuly commited !", "info");
							me.__sendSocketMessage({
								op : "resetConfiguration"
							});
							me.getContainer().body.unmask();
							break;
						case "getGroupList":

							me.groupList = oResponse.data;
							break;
						case "getRegistryProperties":
							me.getContainer().body.unmask();
							me.__createRegistryPropertiesForm(oResponse.data);
							break;
						case "getVomsMapping":
							me.getContainer().body.unmask();
							me.__createVomsMappingForm(oResponse.data);
							break;
						}
					}

				};

				return socket;
			},

			__setChangeMade : function(bChange) {

				var me = this;

				if (bChange && me.canDoChanges) {

					me.btnCommitChanges.show();

				} else {

					me.btnCommitChanges.hide();

				}

				me.changeMade = bChange;

			},

			buildUI : function() {

				var me = this;

				me.isConnectionEstablished = false;

				me.socket = me.__createSocket("init");

				me.rightPanel = new Ext.create('Ext.panel.Panel', {
					region : 'east',
					margins : '0',
					width : 350,
					minWidth : 300,
					maxWidth : 450,
					layout : "anchor",
					autoDestroy : false,
					currentRecord : null
				});

				// drop-down menu with values

				me.cbDataTypes = Ext.create('Ext.form.field.ComboBox', {
					margin : "0 0 0 5",
					fieldLabel : "Data",
					queryMode : 'local',
					labelAlign : 'left',
					displayField : "text",
					valueField : "value",
					labelWidth : 30,
					anchor : '100%',
					editable : false,
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

							me.grid.body.mask("Loading ...");
							me.__sendSocketMessage({
								op : "getData",
								type : newValue
							});

						}
					},
					value : "users"
				});

				me.otherDataMenu = new Ext.Button({
					text : "Other Data",
					menu : [ {
						iconCls : "dirac-icon-list",
						handler : function() {
							me.getContainer().body.mask("Loading ...");
							me.__sendSocketMessage({
								op : "getRegistryProperties"
							});
						},
						text : 'Registry Properties'
					}, {
						iconCls : "dirac-icon-list",
						handler : function() {
							me.getContainer().body.mask("Loading ...");
							me.__sendSocketMessage({
								op : "getVomsMapping"
							});
						},
						text : 'VOMS Mapping'
					} ]
				});

				me.btnCommitChanges = new Ext.Button({
					text : 'Commit',
					iconCls : "dirac-icon-submit",
					handler : function() {
						if (confirm("Do you want to apply the configuration changes you've done till now?")) {
							me.getContainer().body.mask("Loading ...");
							me.__sendSocketMessage({
								op : "commitChanges"
							});
						}
					},
					scope : me,
					hidden : true
				});

				var oLeftPanelTopToolbar = new Ext.toolbar.Toolbar({
					dock : 'top',
					items : [ me.cbDataTypes, '->', me.otherDataMenu, me.btnCommitChanges ]
				});

				me.gridFields = {
					users : [ {
						name : "name"
					}, {
						name : "dn"
					}, {
						name : "ca"
					}, {
						name : "email"
					} ],
					groups : [ {
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
					hosts : [ {
						name : "name"
					}, {
						name : "dn"
					}, {
						name : "properties"
					} ]
				};

				me.gridColumns = {

					users : [ {
						header : 'Name',
						sortable : true,
						dataIndex : 'name',
						align : 'left',
						hideable : false,
						width : 200,
						sortState : "DESC"
					}, {
						header : 'DN',
						sortable : true,
						dataIndex : 'dn',
						align : 'left',
						hideable : false,
						flex : 1
					}, {
						header : 'CA',
						sortable : true,
						dataIndex : 'ca',
						align : 'left',
						hideable : false,
						flex : 1
					}, {
						header : 'E-Mail',
						sortable : true,
						dataIndex : 'email',
						align : 'left',
						hideable : false,
						flex : 1
					} ],
					groups : [ {
						header : 'Name',
						sortable : true,
						dataIndex : 'name',
						align : 'left',
						hideable : false,
						width : 200,
						sortState : "DESC"
					}, {
						header : 'Users',
						sortable : true,
						dataIndex : 'users',
						align : 'left',
						hideable : false,
						flex : 1
					}, {
						header : 'Properties',
						sortable : true,
						dataIndex : 'properties',
						align : 'left',
						hideable : false,
						flex : 1
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
					hosts : [ {
						header : 'Name',
						sortable : true,
						dataIndex : 'name',
						align : 'left',
						hideable : false,
						width : 200,
						sortState : "DESC"
					}, {
						header : 'DN',
						sortable : true,
						dataIndex : 'dn',
						align : 'left',
						hideable : false,
						flex : 1
					}, {
						header : 'Properties',
						sortable : true,
						dataIndex : 'properties',
						align : 'left',
						hideable : false,
						flex : 1
					} ]

				};

				me.dataStore = new Ext.data.JsonStore({
					fields : me.gridFields["users"],
					data : []
				});

				me.grid = Ext.create('Ext.grid.Panel', {
					region : 'center',
					store : me.dataStore,
					height : '600',
					header : false,
					viewConfig : {
						stripeRows : true,
						enableTextSelection : true
					},
					columns : me.gridColumns["users"],
					listeners : {

						beforecellcontextmenu : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
							e.preventDefault();
							me.gridContextMenu.showAt(e.xy);
							return false;
						},

						cellclick : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {

							switch (me.cbDataTypes.getValue()) {

							case "users":
								me.__createUserForm(record);
								break;
							case "groups":
								me.__createGroupForm(record);
								break;
							case "hosts":
								me.__createHostForm(record);
								break;

							}

						}

					}
				});

				me.grid.addDocked(oLeftPanelTopToolbar);

				me.gridContextMenu = new Ext.menu.Menu({
					items : [ {
						handler : function() {

							switch (me.cbDataTypes.getValue()) {

							case "users":
								me.__createUserForm(null);
								break;
							case "groups":
								me.__createGroupForm(null);
								break;
							case "hosts":
								me.__createHostForm(null);
								break;

							}

						},
						iconCls : "dirac-icon-plus",
						text : 'New user'
					}, {
						handler : function() {

							var record = GLOBAL.APP.CF.getSelectedRecords(me.grid)[0];

							switch (me.cbDataTypes.getValue()) {

							case "users":
								me.__createUserForm(record);
								break;
							case "groups":
								me.__createGroupForm(record);
								break;
							case "hosts":
								me.__createHostForm(record);
								break;

							}

						},
						iconCls : "dirac-icon-edit",
						text : 'Edit user'
					}, {
						handler : function() {
							var sName = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "name");
							me.__deleteItem(sName, me.cbDataTypes.getValue());
						},
						iconCls : "dirac-icon-delete",
						text : 'Delete user'
					} ]
				});

				me.canDoChanges = false;

				if (("properties" in GLOBAL.USER_CREDENTIALS) && (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, "CSAdministrator") != -1)) {

					me.canDoChanges = true;

					var oRightPanelButtons = new Ext.create('Ext.toolbar.Toolbar', {
						dock : 'bottom',
						layout : {
							pack : 'center'
						},
						items : []
					});

					me.btnSubmit = new Ext.Button({

						text : 'Submit',
						margin : 3,
						iconCls : "dirac-icon-submit",
						handler : function() {

							if (me.rightPanel.items.length > 0) {

								if (me.rightPanel.currentType == "registry") {
									var oDataToSend = me.__collectRegistryProperties();
									oDataToSend.op = "saveRegistryProperties";
									me.__sendSocketMessage(oDataToSend);
									me.__setChangeMade(true);
								} else if (me.rightPanel.currentType == "voms_mapping") {
									var oDataToSend = me.__collectRegistryProperties();
									oDataToSend.op = "saveVomsMapping";
									me.__sendSocketMessage(oDataToSend);
									me.__setChangeMade(true);
								} else {

									var oDataToSend = {};
									var bValid = true;

									switch (me.rightPanel.currentType) {

									case "users":
										if (me.userForm.txtName.validate()) {
											oDataToSend.name = me.userForm.txtName.getValue();
											oDataToSend.dn = me.userForm.txtDn.getValue();
											oDataToSend.ca = me.userForm.txtCa.getValue();
											oDataToSend.email = me.userForm.txtEmail.getValue();
										} else {
											bValid = false;
										}
										break;
									case "groups":
										if (me.groupForm.txtName.validate()) {
											oDataToSend.name = me.groupForm.txtName.getValue();
											oDataToSend.jobshare = me.groupForm.txtJobShare.getValue();
											oDataToSend.properties = me.groupForm.msProperties.getValues();
											oDataToSend.users = me.groupForm.msUsers.getValues();
											oDataToSend.autouploadproxy = me.groupForm.cbAutoUploadProxy.getValue();
											oDataToSend.autouploadpilotproxy = me.groupForm.cbAutoUploadPilotProxy.getValue();
											oDataToSend.autoaddvoms = me.groupForm.cbAutoAddVoms.getValue();
										} else {
											bValid = false;
										}
										break;
									case "hosts":
										if (me.groupForm.txtName.validate()) {
											oDataToSend.name = me.hostForm.txtName.getValue();
											oDataToSend.dn = me.hostForm.txtDn.getValue();
											oDataToSend.properties = me.hostForm.msProperties.getValues();
										} else {
											bValid = false;
										}
										break;

									}
									if (bValid) {
										if (me.rightPanel.currentRecord == null) {
											// in this case it means that we are creating new item
											oDataToSend.op = "addItem";
										} else {
											// in this case it means that we are updating an existing
											// item
											oDataToSend.op = "editItem";
										}

										oDataToSend.type = me.rightPanel.currentType;
										console.log("DATA TO SEND");
										console.log(oDataToSend);
										me.__sendSocketMessage(oDataToSend);
										me.__setChangeMade(true);

									}
								}
							}

						},
						scope : me

					});

					oRightPanelButtons.add(me.btnSubmit);

					me.btnReset = new Ext.Button({

						text : 'Reset',
						margin : 3,
						iconCls : "dirac-icon-reset",
						handler : function() {

							if (me.rightPanel.currentType == "registry") {
								me.getContainer().body.mask("Loading ...");
								me.__sendSocketMessage({
									op : "getRegistryProperties"
								});
							} else if (me.rightPanel.currentType == "voms_mapping") {
								me.getContainer().body.mask("Loading ...");
								me.__sendSocketMessage({
									op : "getVomsMapping"
								});
							} else {

								var oRecord = me.rightPanel.currentRecord;

								switch (me.cbDataTypes.getValue()) {

								case "users":
									me.__createUserForm(oRecord);
									break;
								case "groups":
									me.__createGroupForm(oRecord);
									break;
								case "hosts":
									me.__createHostForm(oRecord);
									break;

								}

							}

						},
						scope : me

					});

					oRightPanelButtons.add(me.btnReset);

					me.rightPanel.addDocked(oRightPanelButtons);
				}

				me.dontShowMessageBeforeClose = true;
				me.firstTimeReadUsers = false;
				me.userList = [];
				me.groupList = [];
				me.changeMade = false;

			},

			afterRender : function() {
				var me = this;

				me.__setDiracDestroyHandler();

				this.callParent();
			},

			__getGroupList : function() {

				var me = this;

				me.__sendSocketMessage({
					op : "getGroupList"
				});

			},

			__setDiracDestroyHandler : function() {

				var me = this;

				me.on("destroy", function(oComp, eOpts) {

					var oThisContainer = this;

					oThisContainer.dontShowMessageBeforeClose = false;
					oThisContainer.socket.close();

				}, me);

				me.add([ me.grid, me.rightPanel ]);

			},

			__createGroupForm : function(oRecord) {

				var me = this;

				if ("groupForm" in me) {

					me.groupForm.txtName.setValue("");
					me.groupForm.txtJobShare.setValue("");
					me.groupForm.msProperties.multiList.store.removeAll();
					me.groupForm.msUsers.multiList.store.removeAll();

				} else {

					me.groupForm = {};

					me.groupForm.txtName = Ext.create('Ext.form.field.Text', {
						fieldLabel : "Name:",
						labelAlign : 'left',
						margin : 5,
						labelWidth : 80,
						anchor : "100%",
						validateValue : function(sValue) {

							sValue = Ext.util.Format.trim(sValue);

							if (sValue.length < 1) {
								this.markInvalid("You must specify a name !");
								return false;

							} else {

								if (GLOBAL.APP.SM.isValidStateName(sValue)) {
									this.clearInvalid();
									return true;
								} else {

									this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
									return false;

								}

							}

						}
					});

					me.groupForm.cbAutoUploadProxy = Ext.create('Ext.form.field.ComboBox', {
						fieldLabel : "Auto Upload Proxy",
						queryMode : 'local',
						labelAlign : 'left',
						displayField : "value",
						valueField : "value",
						width : 200,
						store : new Ext.data.SimpleStore({
							fields : [ 'value' ],
							data : [ [ "None" ], [ "True" ], [ "False" ] ]
						}),
						margin : 5,
						labelWidth : 80,
						editable : false
					});

					me.groupForm.cbAutoUploadPilotProxy = Ext.create('Ext.form.field.ComboBox', {
						fieldLabel : "Auto Upload Pilot Proxy",
						queryMode : 'local',
						labelAlign : 'left',
						displayField : "value",
						valueField : "value",
						width : 200,
						store : new Ext.data.SimpleStore({
							fields : [ 'value' ],
							data : [ [ "None" ], [ "True" ], [ "False" ] ]
						}),
						margin : 5,
						labelWidth : 80,
						editable : false
					});

					me.groupForm.cbAutoAddVoms = Ext.create('Ext.form.field.ComboBox', {
						fieldLabel : "Auto Add VOMS",
						queryMode : 'local',
						labelAlign : 'left',
						displayField : "value",
						valueField : "value",
						width : 200,
						store : new Ext.data.SimpleStore({
							fields : [ 'value' ],
							data : [ [ "None" ], [ "True" ], [ "False" ] ]
						}),
						margin : 5,
						labelWidth : 80,
						editable : false
					});

					me.groupForm.txtJobShare = Ext.create('Ext.form.field.Number', {
						fieldLabel : "Job Share:",
						labelAlign : 'left',
						margin : 5,
						labelWidth : 80,
						width : 200
					});

					me.groupForm.msProperties = me.__createMultiListWithButtons("Properties", [], null);
					me.groupForm.msUsers = me.__createMultiListWithButtons("Users", [], function(sNewUser) {

						if (Ext.Array.indexOf(me.userList, sNewUser) != -1) {

							return true;

						} else {

							GLOBAL.APP.CF.alert('The user does not exists !', 'warning');
							return false;
						}

					});

				}

				if ((oRecord != null) && (oRecord != undefined)) {

					me.groupForm.txtName.setValue(oRecord.get("name"));
					me.groupForm.cbAutoUploadProxy.setValue(oRecord.get("autouploadproxy"));
					me.groupForm.cbAutoUploadPilotProxy.setValue(oRecord.get("autouploadpilotproxy"));
					me.groupForm.cbAutoAddVoms.setValue(oRecord.get("autoaddvoms"));
					me.groupForm.txtJobShare.setValue(oRecord.get("jobshare"));

					var oData = oRecord.get("properties").split(",");

					for ( var i = 0; i < oData.length; i++)
						me.groupForm.msProperties.multiList.store.add({
							"value" : Ext.util.Format.trim(oData[i])
						});

					oData = oRecord.get("users").split(",");

					for ( var i = 0; i < oData.length; i++)
						me.groupForm.msUsers.multiList.store.add({
							"value" : Ext.util.Format.trim(oData[i])
						});

					me.rightPanel.setTitle("Group: " + oRecord.get("name"));
					me.rightPanel.currentRecord = oRecord;
					me.groupForm.txtName.setReadOnly(true);

				} else {

					me.rightPanel.setTitle("New Group");
					me.rightPanel.currentRecord = null;
					me.groupForm.txtName.setReadOnly(false);

				}

				me.rightPanel.currentType = "groups";

				me.rightPanel.removeAll();
				me.rightPanel.add([ me.groupForm.txtName, me.groupForm.msUsers, me.groupForm.msProperties, me.groupForm.cbAutoUploadProxy, me.groupForm.cbAutoUploadPilotProxy, me.groupForm.cbAutoAddVoms,
						me.groupForm.txtJobShare ]);
				me.activeRecordInForm = oRecord;

			},

			__createUserForm : function(oRecord) {

				var me = this;

				console.log(oRecord);

				if ("userForm" in me) {

					me.userForm.txtName.setValue("");
					me.userForm.txtDn.setValue("");
					me.userForm.txtCa.setValue("");
					me.userForm.txtEmail.setValue("");

				} else {
					me.userForm = {};

					me.userForm.txtName = Ext.create('Ext.form.field.Text', {
						fieldLabel : "Name:",
						labelAlign : 'left',
						margin : 5,
						anchor : "100%",
						labelWidth : 50,
						validateValue : function(sValue) {

							sValue = Ext.util.Format.trim(sValue);

							if (sValue.length < 1) {
								this.markInvalid("You must specify a name !");
								return false;

							} else {

								if (GLOBAL.APP.SM.isValidStateName(sValue)) {
									this.clearInvalid();
									return true;
								} else {

									this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
									return false;

								}

							}

						}
					});

					me.userForm.txtDn = Ext.create('Ext.form.field.Text', {
						fieldLabel : "DN:",
						labelAlign : 'left',
						margin : 5,
						anchor : "100%",
						labelWidth : 50
					});

					me.userForm.txtCa = Ext.create('Ext.form.field.Text', {
						fieldLabel : "CA:",
						labelAlign : 'left',
						margin : 5,
						anchor : "100%",
						labelWidth : 50
					});

					me.userForm.txtEmail = Ext.create('Ext.form.field.Text', {
						fieldLabel : "E-Mail:",
						labelAlign : 'left',
						margin : 5,
						anchor : "100%",
						labelWidth : 50
					});

				}

				if ((oRecord != null) && (oRecord != undefined)) {

					me.userForm.txtName.setValue(oRecord.get("name"));
					me.userForm.txtDn.setValue(oRecord.get("dn"));
					me.userForm.txtCa.setValue(oRecord.get("ca"));
					me.userForm.txtEmail.setValue(oRecord.get("email"));

					me.rightPanel.setTitle("User: " + oRecord.get("name"));
					me.rightPanel.currentRecord = oRecord;
					me.userForm.txtName.setReadOnly(true);

				} else {

					me.rightPanel.setTitle("New User");
					me.rightPanel.currentRecord = null;
					me.userForm.txtName.setReadOnly(false);

				}

				me.rightPanel.currentType = "users";

				me.rightPanel.removeAll();
				me.rightPanel.add([ me.userForm.txtName, me.userForm.txtDn, me.userForm.txtCa, me.userForm.txtEmail ]);
				me.activeRecordInForm = oRecord;

			},

			__createHostForm : function(oRecord) {

				var me = this;

				if ("hostForm" in me) {

					me.hostForm.txtName.setValue("");
					me.hostForm.txtDn.setValue("");
					me.hostForm.msProperties.multiList.store.removeAll();

				} else {
					me.hostForm = {};

					me.hostForm.txtName = Ext.create('Ext.form.field.Text', {
						fieldLabel : "Name:",
						labelAlign : 'left',
						margin : 5,
						anchor : "100%",
						labelWidth : 80,
						validateValue : function(sValue) {

							sValue = Ext.util.Format.trim(sValue);

							if (sValue.length < 1) {
								this.markInvalid("You must specify a name !");
								return false;

							} else {

								if (GLOBAL.APP.SM.isValidStateName(sValue)) {
									this.clearInvalid();
									return true;
								} else {

									this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
									return false;

								}

							}

						}
					});

					me.hostForm.txtDn = Ext.create('Ext.form.field.Text', {
						fieldLabel : "DN:",
						labelAlign : 'left',
						margin : 5,
						anchor : "100%",
						labelWidth : 80
					});

					me.hostForm.msProperties = me.__createMultiListWithButtons("Properties", [], null);

				}

				if ((oRecord != null) && (oRecord != undefined)) {

					me.hostForm.txtName.setValue(oRecord.get("name"));
					me.hostForm.txtDn.setValue(oRecord.get("dn"));

					var oData = oRecord.get("properties").split(",");

					for ( var i = 0; i < oData.length; i++)
						me.hostForm.msProperties.multiList.store.add({
							"value" : Ext.util.Format.trim(oData[i])
						});

					me.rightPanel.setTitle("Host: " + oRecord.get("name"));
					me.rightPanel.currentRecord = oRecord;
					me.hostForm.txtName.setReadOnly(true);

				} else {

					me.rightPanel.setTitle("New Host");
					me.rightPanel.currentRecord = null;
					me.hostForm.txtName.setReadOnly(false);

				}

				me.rightPanel.currentType = "hosts";

				me.rightPanel.removeAll();
				me.rightPanel.add([ me.hostForm.txtName, me.hostForm.txtDn, me.hostForm.msProperties ]);
				me.activeRecordInForm = oRecord;

			},

			__createMultiListWithButtons : function(sTitle, oData, funcOnAddValidationFunction) {

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
					}),
					height : 150,
					margin : "0 5 5 5",
					labelWidth : 80
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

										if (funcOnAddValidationFunction != null) {

											if (funcOnAddValidationFunction(text)) {

												oStore.add({
													value : text
												});

											}

										} else {

											oStore.add({
												value : text
											});

										}

									} else {

										GLOBAL.APP.CF.alert('The item already exists in the list !', 'warning');

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
					items : [ '->', oAddButton, oDeleteButton ],
					cls : "rm-clean-background",
					border : 0
				});

				var oMultiSelectBox = new Ext.create('Ext.panel.Panel', {
					anchor : "100%",
					margins : '0',
					multiList : oMultiSelect,
					items : [ oToolbar, oMultiSelect ],
					border : 0,
					getValues : function() {

						var oStore = oMultiSelect.store;
						var sRet = "";

						for ( var i = 0; i < oStore.getCount(); i++) {

							sRet += ((sRet == "") ? "" : ",") + oStore.getAt(i).get("value");

						}

						return sRet;

					}

				});

				return oMultiSelectBox;

			},
			__sendSocketMessage : function(oData) {

				var me = this;

				if (!me.isConnectionEstablished) {

					var sMessage = "There is no connection established with the server.\nDo you want to reconnect now?";

					if (confirm(sMessage)) {
						// resetting the configuration
						me.socket = me.__createSocket("resetConfiguration");
					}

				} else {
					console.log("REQUEST -->");
					console.log(oData);
					me.socket.send(JSON.stringify(oData));

				}

			},

			__deleteItem : function(sName, sType) {

				var me = this;

				me.__sendSocketMessage({
					op : "deleteItem",
					type : sType,
					name : sName
				});

			},

			__createRegistryPropertiesForm : function(oData) {

				var me = this;

				me.rightPanel.currentType = "registry";

				me.rightPanel.removeAll();
				me.rightPanel.setTitle("Registry Properties");

				var oRegistryToolbar = new Ext.toolbar.Toolbar({
					border : 0,
					items : [ '->', {
						xtype : "button",
						iconCls : "dirac-icon-plus",
						margin : 3,
						tooltip : "Create option",
						handler : function() {
							me.__showFormForRegistryOption();
						}
					} ]
				});

				me.rightPanel.add(oRegistryToolbar);

				for ( var sElem in oData) {

					me.rightPanel.add(me.__createRegistryProperty(sElem, oData[sElem]));

				}

				me.activeRecordInForm = oData;

			},
			__createRegistryProperty : function(sName, sValue) {

				var me = this;

				var oField = Ext.create('Ext.form.field.Text', {
					fieldLabel : sName,
					labelAlign : 'left',
					margin : 5,
					anchor : "100%",
					labelWidth : 140,
					value : sValue
				});

				var oPanel = Ext.create('Ext.container.Container', {
					layout : {
						type : 'hbox',
						margin : 3
					},
					blockType : "string",
					items : [ oField, {
						xtype : "button",
						iconCls : "dirac-icon-delete",
						margin : 3,
						handler : function() {
							me.rightPanel.remove(this.up("container"));
						},
						tooltip : "Remove this item"
					} ]

				});

				return oPanel;

			},
			__showFormForRegistryOption : function() {

				var me = this;

				me.txtElementName = Ext.create('Ext.form.field.Text', {

					fieldLabel : "Name",
					labelAlign : 'left',
					allowBlank : false,
					margin : 10,
					anchor : '100%'

				});

				me.txtElementValue = Ext.create('Ext.form.field.Text', {
					fieldLabel : "Value",
					labelAlign : 'left',
					margin : 10,
					width : 400,
					anchor : '100%'
				});

				// button for saving the state
				me.btnCreateElement = new Ext.Button({

					text : 'Submit',
					margin : 3,
					iconCls : "dirac-icon-submit",
					handler : function() {

						var bValid = me.txtElementName.validate();

						if (bValid) {
							me.rightPanel.add(me.__createRegistryProperty(me.txtElementName.getValue(), me.txtElementValue.getValue()));
							me.createElementWindow.close();
						}

					},
					scope : me

				});

				var oToolbar = new Ext.toolbar.Toolbar({
					border : false
				});

				oToolbar.add([ me.btnCreateElement ]);

				var oPanel = new Ext.create('Ext.panel.Panel', {
					autoHeight : true,
					border : false,
					layout : "anchor",
					items : [ oToolbar, me.txtElementName, me.txtElementValue ]
				});

				var sTitle = "Create an option";
				var iHeight = 200;

				// initializing window showing the saving form
				me.createElementWindow = Ext.create('widget.window', {
					height : iHeight,
					width : 500,
					title : sTitle,
					layout : 'fit',
					modal : true,
					items : oPanel
				});

				me.createElementWindow.show();
				me.txtElementName.focus();

			},

			__collectRegistryProperties : function() {

				var me = this;
				var oData = {};

				if (me.rightPanel.items.length > 1) {
					for ( var i = 1; i < me.rightPanel.items.length; i++) {
						var oItem = me.rightPanel.items.getAt(i).items.getAt(0);

						oData[oItem.fieldLabel] = oItem.getValue();

					}
				}

				return oData;

			},
			__createVomsMappingForm : function(oData) {

				var me = this;

				me.rightPanel.currentType = "voms_mapping";

				me.rightPanel.removeAll();
				me.rightPanel.setTitle("VOMS Mapping");

				var oRegistryToolbar = new Ext.toolbar.Toolbar({
					border : 0,
					items : [ '->', {
						xtype : "button",
						iconCls : "dirac-icon-plus",
						margin : 3,
						tooltip : "Create option",
						handler : function() {
							me.__showFormForRegistryOption();
						}
					} ]
				});

				me.rightPanel.add(oRegistryToolbar);

				for ( var i = 0; i < oData.length; i++) {

					me.rightPanel.add(me.__createRegistryProperty(oData[i]["name"], oData[i]["value"]));

				}

				me.activeRecordInForm = oData;

			}

		});
