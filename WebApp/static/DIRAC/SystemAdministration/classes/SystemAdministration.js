Ext.define('DIRAC.SystemAdministration.classes.SystemAdministration', {
	extend : 'Ext.dirac.core.Module',

	requires : [ 'Ext.tab.Panel', 'Ext.ProgressBar', 'Ext.grid.feature.Grouping', 'Ext.data.ArrayStore', 'Ext.util.TaskRunner' ],

	initComponent : function() {

		var me = this;

		if (GLOBAL.VIEW_ID == "desktop") {

			me.launcher.title = "System Administration";
			me.launcher.maximized = false;

			var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

			me.launcher.width = oDimensions[0];
			me.launcher.height = oDimensions[1];

			me.launcher.x = 0;
			me.launcher.y = 0;

		}

		if (GLOBAL.VIEW_ID == "tabs") {

			me.launcher.title = "System Administration";
			me.launcher.maximized = false;

			var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

			me.launcher.width = oDimensions[0];
			me.launcher.height = oDimensions[1];

			me.launcher.x = 0;
			me.launcher.y = 0;

		}

		Ext.apply(me, {
			layout : 'border',
			bodyBorder : false,
			defaults : {
				collapsible : true,
				split : true
			}
		});

		me.callParent(arguments);

	},

	buildUI : function() {

		var me = this;

		me.systemInfoDataStore = new Ext.data.JsonStore({

			proxy : {
				type : 'ajax',
				url : GLOBAL.BASE_URL + 'SystemAdministration/getSysInfo',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000,
				autoLoad : true
			},
			autoLoad : true,
			fields : [ {
				name : 'Host'
			}, {
				name : 'Status'
			}, {
				name : 'DIRAC'
			}, {
				name : 'Load1'
			}, {
				name : 'Load5'
			}, {
				name : 'Load15'
			}, {
				name : 'Memory'
			}, {
				name : 'Disk'
			}, {
				name : 'Swap'
			}, {
				name : 'CPUClock'
			}, {
				name : 'CPUModel'
			}, {
				name : 'CertificateDN'
			}, {
				name : 'CertificateIssuer'
			}, {
				name : 'CertificateValidity'
			}, {
				name : 'Cores'
			}, {
				name : 'PhysicalCores'
			}, {
				name : 'OpenFiles'
			}, {
				name : 'OpenPipes'
			}, {
				name : 'OpenSockets'
			}, {
				name : 'Setup'
			}, {
				name : 'Uptime'
			} ],
			remoteSort : true,
			pageSize : 100,
			createTabsOnce : false,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						if (parseInt(oStore.proxy.reader.rawData["total"]) == 0) {

							me.systemInfoDataStore.removeAll();

						}

					} else {

						if ("updateStamp" in oStore) {
							if ("date" in oStore.proxy.reader.rawData)
								oStore.updateStamp.setText('Updated: ' + oStore.proxy.reader.rawData["date"]);
							else
								oStore.updateStamp.setText(me.getUtcDate());
						}

						me.systemInfoDataStore.remoteSort = false;
						me.systemInfoDataStore.sort();
						me.systemInfoDataStore.remoteSort = true;

					}

				}

			}
		});

		me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
		me.checkboxFunctionDefinition += 'var oChecked=this.checked;';
		me.checkboxFunctionDefinition += 'var oElems=Ext.query(\'#' + me.id + ' input.checkrow\');';
		me.checkboxFunctionDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
		me.checkboxFunctionDefinition += '" class="sa-main-check-box"/>';

		var oGridButtonsToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'top',
			items : [ {
				xtype : "button",
				text : 'Restart',
				handler : function() {
					me.oprHostAction("restart", 2);
				},
				iconCls : "dirac-icon-restart",
				scope : me
			}, {
				text : 'Revert',
				handler : function() {
					me.oprHostAction("revert", 2);
				},
				iconCls : "dirac-icon-revert",
				scope : me
			}, '-' ]
		});

		if (("properties" in GLOBAL.USER_CREDENTIALS) && (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, "AlarmsManagement") != -1)) {

			oGridButtonsToolbar.add({
				text : 'Send e-mail',
				handler : function() {

					me.oprShowSendMessageForm(2);

				},
				scope : me,
				iconCls : "dirac-icon-mail"
			});

		}

		me.systemInfoGrid = Ext.create('Ext.grid.Panel', {
			region : "north",
			title : "Overall System Information",
			store : me.systemInfoDataStore,
			height : 300,
			header : false,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			dockedItems : [ oGridButtonsToolbar ],
			columns : [ {
				header : me.checkboxFunctionDefinition,
				width : 26,
				sortable : false,
				dataIndex : 'Host',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererChkBox(value);
				},
				hideable : false,
				fixed : true,
				menuDisabled : true,
				align : "center"
			}, {
				align : 'left',
				dataIndex : 'Host',
				header : 'Hostname',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Status',
				header : 'Status',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'DIRAC',
				header : 'Version',
				// renderer : releaseNotes,
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Load1',
				header : 'Load 1 minute',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Load5',
				header : 'Load 5 minutes',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Load15',
				header : 'Load 15 minutes',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Memory',
				fixed : true,
				header : 'Memory',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererValueBar(value);
				},
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Disk',
				header : 'Disk',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Swap',
				fixed : true,
				header : 'Swap',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererValueBar(value);
				},
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'CPUClock',
				header : 'CPUClock',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'CPUModel',
				header : 'CPUModel',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'CertificateDN',
				header : 'CertificateDN',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'CertificateIssuer',
				header : 'CertificateIssuer',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'CertificateValidity',
				header : 'CertificateValidity',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Cores',
				header : 'Cores',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'PhysicalCores',
				header : 'PhysicalCores',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'OpenFiles',
				header : 'OpenFiles',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'OpenPipes',
				header : 'OpenPipes',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'OpenSockets',
				header : 'OpenSockets',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Setup',
				header : 'Setup',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Uptime',
				header : 'Uptime',
				sortable : true
			} ],
			rendererChkBox : function(val) {
				return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
			},
			rendererValueBar : function(value) {

				if (!value) {
					return;
				}

				var id = Ext.id();
				var values = value.split('/');
				var text = values[1];
				var percent = values[0].replace('%', '');

				percent = percent.replace('.', '');

				if (percent.length < 2) {
					percent = '0' + percent;
				}

				percent = '.' + percent;

				var oFunc = function(id, text, percent) {
					new Ext.ProgressBar({
						height : 14,
						renderTo : id,
						text : text,
						value : percent,
						height : 18
					});
				};

				Ext.Function.defer(oFunc, 250, this, [ id, text, percent ]);

				return '<span id="' + id + '"></span>';
			},
			listeners : {

				beforecellcontextmenu : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
					e.preventDefault();
					me.overallContextMenu.showAt(e.xy);
					return false;
				},
				
				cellclick : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {

					if (cellIndex != 0) {
						me.hostGridStore.proxy.extraParams.hostname = record.get("Host");
						me.hostGridStore.load();
					}

				}

			}
		});

		me.createBottomGridToolbar(me.systemInfoGrid);

		/*
		 * Creating the context menus
		 */

		me.overallContextMenu = new Ext.menu.Menu({
			items : [ {
				handler : function() {
					me.oprHostAction("restart", 1);
				},
				text : 'Restart',
				iconCls : "dirac-icon-restart"
			}, {
				handler : function() {
					me.oprHostAction("revert", 1);
				},
				text : 'Revert',
				iconCls : "dirac-icon-revert"
			}, '-', {
				handler : function() {
					me.oprGetHostErrors();
				},
				text : 'Show Errors',
				iconCls : "dirac-icon-error"
			} ]
		});

		me.hostContextMenu = new Ext.menu.Menu({
			items : [ {
				handler : function() {
					var oRecord = this.up("menu").selected_record;
					me.oprGetHostLog(oRecord);
				},
				text : 'Log',
				iconCls : "dirac-icon-log"
			}, '-', {
				handler : function() {
					me.oprComponentAction("restart", 1);
				},
				text : 'Restart',
				iconCls : "dirac-icon-restart"
			}, {
				handler : function() {
					me.oprComponentAction("stop", 1);
				},
				text : 'Stop',
				iconCls : "dirac-icon-stop"
			}, {
				handler : function() {
					var oGrid = this.up("menu").grid;
					me.oprComponentAction("start", 1);
				},
				text : 'Start',
				iconCls : "dirac-icon-start"
			} ]
		});

		me.hostGridStore = new Ext.data.JsonStore({

			proxy : {
				type : 'ajax',
				url : GLOBAL.BASE_URL + 'SystemAdministration/getHostData',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000,
				extraParams : {
					"hostname" : ""
				}
			},
			groupField : 'Type',
			fields : [ {
				name : 'System'
			}, {
				name : 'Host'
			}, {
				name : 'Name'
			}, {
				name : 'Setup'
			}, {
				name : 'PID'
			}, {
				name : 'RunitStatus'
			}, {
				name : 'Module'
			}, {
				name : 'Installed'
			}, {
				name : 'Timeup'
			}, {
				name : 'Type'
			} ],
			remoteSort : true,
			pageSize : 10000,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "error");

					} else {

						if ("updateStamp" in oStore) {
							if ("date" in oStore.proxy.reader.rawData)
								oStore.updateStamp.setText('Updated: ' + oStore.proxy.reader.rawData["date"]);
							else
								oStore.updateStamp.setText(me.getUtcDate());
						}

					}

				}

			}
		});

		var sId = Ext.id();

		var sHtml = "";

		sHtml += '<input type="checkbox" value="" onchange="';
		sHtml += 'var oChecked=this.checked;';
		sHtml += 'var oElems=Ext.query(\'#' + sId + ' input.checkrow\');';
		sHtml += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
		sHtml += '" class="sa-main-check-box"/>';

		var oGroupingFeature = Ext.create('Ext.grid.feature.Grouping', {
			groupHeaderTpl : '{columnName}: {name} ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})',
			hideGroupedHeader : true,
			startCollapsed : false
		});

		var oGridButtonsToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'top',
			items : [ {
				xtype : "button",
				text : 'Restart',
				iconCls : "dirac-icon-restart",
				handler : function() {
					me.oprComponentAction("restart", 2);
				}
			}, {
				text : 'Start',
				iconCls : "dirac-icon-start",
				handler : function() {
					me.moduleObject.oprComponentAction("start", 2);
				}
			}, {
				text : 'Stop',
				iconCls : "dirac-icon-stop",
				handler : function() {
					me.moduleObject.oprComponentAction("stop", 2);
				}
			} ]
		});

		me.hostGrid = Ext.create('Ext.grid.Panel', {
			region : "center",
			store : me.hostGridStore,
			header : false,
			moduleObject : me,
			id : sId,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			features : [ oGroupingFeature ],
			dockedItems : [ oGridButtonsToolbar ],
			columns : [ {
				header : sHtml,
				width : 26,
				sortable : false,
				dataIndex : 'System',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererChkBox(record.get("Name") + "|||" + record.get("Host") + "|||" + record.get("System"));
				},
				hideable : false,
				fixed : true,
				menuDisabled : true,
				align : "center"
			}, {
				align : 'left',
				dataIndex : 'System',
				header : 'System',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Name',
				header : 'Name',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Module',
				header : 'Module',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Type',
				header : 'Type',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'RunitStatus',
				header : 'Status',
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'Timeup',
				header : 'Uptime',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererUptime(value, record);
				},
				sortable : true
			}, {
				align : 'left',
				dataIndex : 'PID',
				header : 'PID',
				sortable : true
			} ],
			rendererChkBox : function(val) {
				return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
			},
			rendererUptime : function(value, record) {
				if (record.get('RunitStatus') != 'Run') {
					return '<b>&mdash;</b>';
				}
				if (value < 30) {
					return '<b style="color:#FF3300">' + value + '</b>';
				}
				if (value < (60 * 5)) {
					return '<b style="color:#FFCC00">' + value + '</b>';
				}
				if (value < (60 * 10)) {
					return '<b style="color:#00CC00">' + value + '</b>';
				}
				return value;
			},
			listeners : {

				beforecellcontextmenu : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {

					e.preventDefault();
					me.hostContextMenu.selected_record = record;

					me.hostContextMenu.showAt(e.xy);
					return false;
				}

			}
		});

		me.createBottomGridToolbar(me.hostGrid);

		me.add([ me.systemInfoGrid, me.hostGrid ]);

	},

	oprGetHostLog : function(oRecord) {

		var me = this;
		var sHostName = oRecord.get("Host");
		var sComponent = oRecord.get("Name");
		var sSystem = oRecord.get("System");
		me.getContainer().body.mask("Wait ...");
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'SystemAdministration/getHostLog',
			params : {
				component : sComponent,
				host : sHostName,
				system : sSystem
			},
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);
				me.getContainer().body.unmask();
				if (response["success"] == "true") {
					response["result"] = response["result"].replace(new RegExp("<br>", 'g'), "\n");
					me.__oprPrepareAndShowWindowText(response["result"], "Log file for: " + sComponent + "/" + sSystem + "@" + sHostName);
				} else {

					GLOBAL.APP.CF.alert(response["error"], "error");

				}

			},
			failure : function(response) {
				me.getContainer().body.unmask();
				Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			}
		});

	},

	oprGetHostErrors : function() {

		var me = this;

		var sHostName = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.systemInfoGrid, "Host");
		me.getContainer().body.mask("Wait ...");
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'SystemAdministration/getHostErrors',
			params : {
				host : sHostName
			},
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);
				me.getContainer().body.unmask();

				if (response["success"] == "true") {

					me.__oprPrepareAndShowWindowGrid(response["result"], "Show errors for:" + sHostName, [ "Name", "ErrorsHour", "System", "ErrorsDay", "Host", "LastError" ], [ {
						text : 'System',
						sortable : false,
						dataIndex : 'System'
					}, {
						text : 'Component',
						sortable : false,
						dataIndex : 'Name'
					}, {
						text : 'Errors per day',
						sortable : false,
						dataIndex : 'ErrorsDay'
					}, {
						text : 'Errors per hour',
						sortable : false,
						dataIndex : 'ErrorsHour'
					}, {
						text : 'Last Error',
						sortable : false,
						dataIndex : 'LastError',
						flex : 1
					} ]);

				} else {

					GLOBAL.APP.CF.alert(response["error"], "error");

				}

			},
			failure : function(response) {
				me.getContainer().body.unmask();
				Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			}
		});

	},

	__oprPrepareAndShowWindowText : function(sTextToShow, sTitle) {

		var me = this;

		var oWindow = me.getContainer().createChildWindow(sTitle, false, 800, 500);

		var oTextArea = new Ext.create('Ext.form.field.TextArea', {
			value : sTextToShow,
			cls : "sa-textbox-help-window"
		});

		oWindow.add(oTextArea);
		oWindow.show();

	},

	__oprPrepareAndShowWindowGrid : function(oData, sTitle, oFields, oColumns) {

		var me = this;

		var oStore = new Ext.data.JsonStore({
			fields : oFields,
			data : oData
		});

		var oWindow = me.getContainer().createChildWindow(sTitle, false, 800, 500);

		var oGrid = Ext.create('Ext.grid.Panel', {
			store : oStore,
			columns : oColumns,
			width : '100%',
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			}
		});

		oWindow.add(oGrid);
		oWindow.show();

	},

	oprHostAction : function(sAction, sEventSource) {

		var me = this;
		var sHost = "";

		if (sEventSource == 1) {

			sHost = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.systemInfoGrid, "Host");

		} else {

			// collect all selected
			var oItems = [];
			var oElems = Ext.query("#" + me.systemInfoGrid.id + " input.checkrow");

			for ( var i = 0; i < oElems.length; i++)
				if (oElems[i].checked)
					oItems.push(oElems[i].value);

			if (oItems.length < 1) {
				GLOBAL.APP.CF.alert('No hosts were selected', "error");
				return;
			}

			sHost = oItems.join(",");

		}

		me.getContainer().body.mask("Wait ...");

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'SystemAdministration/hostAction',
			params : {
				action : sAction,
				host : sHost
			},
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);

				me.getContainer().body.unmask();
				if (response["success"] == "true") {

					GLOBAL.APP.CF.alert(response["result"], "info");

				} else {

					GLOBAL.APP.CF.alert(response["error"], "error");

				}

			},
			failure : function(response) {
				me.getContainer().body.unmask();
				Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			}
		});

	},

	oprComponentAction : function(sAction, sEventSource) {

		var me = this;

		var oParams = {
			action : sAction
		}

		if (sEventSource == 1) {

			var sHost = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.hostGrid, "Host");
			var sName = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.hostGrid, "Name");
			var sSystem = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.hostGrid, "System");

			oParams[sName + "@" + sHost] = [ sSystem ];

		} else {

			var oElems = Ext.query("#" + me.hostGrid.id + " input.checkrow");
			var iNumberSelected = 0;
			for ( var i = 0; i < oElems.length; i++)
				if (oElems[i].checked) {
					iNumberSelected++;
					var oVal = oElems[i].value.split("|||");
					var sTarget = oVal[0] + ' @ ' + oVal[1];
					if (!oParams[sTarget]) {
						oParams[sTarget] = [];
					}

					oParams[sTarget].push(oVal[2]);
				}

			if (iNumberSelected == 0) {
				GLOBAL.APP.CF.alert('No components were selected', "error");
				return;
			}

		}

		me.getContainer().body.mask("Wait ...");
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'SystemAdministration/componentAction',
			params : oParams,
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);

				me.getContainer().body.unmask();
				if (response["success"] == "true") {

					GLOBAL.APP.CF.alert(response["result"], "info");

				} else {

					GLOBAL.APP.CF.alert(response["error"], "error");

				}

			},
			failure : function(response) {
				me.getContainer().body.unmask();
				Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			}
		});

	},

	createBottomGridToolbar : function(oGrid) {
		var oToolbarItems = [ '-' ];

		var oTask = {
			run : function() {
				oGrid.getStore().load();
			},
			interval : 0
		}

		var oHeartbeat = new Ext.util.TaskRunner();

		var oAutoMenu = [ {
			handler : function() {
				this.setChecked(true);
				oHeartbeat.start(Ext.apply(oTask, {
					interval : 900000
				}));
			},
			group : 'refresh',
			text : '15 Minutes'
		}, {
			handler : function() {
				this.setChecked(true);
				oHeartbeat.start(Ext.apply(oTask, {
					interval : 1800000
				}));
			},
			group : 'refresh',
			text : '30 Minutes'
		}, {
			handler : function() {
				this.setChecked(true);
				oHeartbeat.start(Ext.apply(oTask, {
					interval : 3600000
				}));
			},
			group : 'refresh',
			text : 'One Hour'
		}, {
			checked : true,
			handler : function() {
				this.setChecked(true);
				oHeartbeat.stopAll();
			},
			group : 'refresh',
			text : 'Disabled'
		} ];

		for ( var i = 0; i < oAutoMenu.length; i++) {
			oAutoMenu[i] = new Ext.menu.CheckItem(oAutoMenu[i]);
		}

		var btnAutorefresh = new Ext.Button({
			menu : oAutoMenu,
			text : 'Disabled',
			tooltip : 'Click to set the time for autorefresh'
		});

		btnAutorefresh.on('menuhide', function(button, menu) {
			var length = menu.items.getCount();
			for ( var i = 0; i < length; i++) {
				if (menu.items.items[i].checked) {
					button.setText(menu.items.items[i].text);
				}
			}
		});

		oToolbarItems.push('Auto:');
		oToolbarItems.push(btnAutorefresh);

		var btnUpdateStamp = new Ext.Button({
			disabled : true,
			disabledClass : 'my-disabled',
			text : 'Updated: -'
		});

		oGrid.getStore().updateStamp = btnUpdateStamp;

		oToolbarItems.push(btnUpdateStamp);

		var oBbar = new Ext.PagingToolbar({
			dock : "bottom",
			displayInfo : true,
			items : oToolbarItems,
			pageSize : 10000,
			refreshText : 'Click to refresh current page',
			store : oGrid.getStore()
		});

		// hiding the first ten elemnts of the items

		for ( var i = 0; i < 10; i++)
			oBbar.items.removeAt(0);

		oGrid.addDocked(oBbar);

	},

	getUtcDate : function() {
		var d = new Date();

		var hh = d.getUTCHours();
		if (hh < 10) {
			hh = '0' + hh;
		}

		var mm = d.getUTCMinutes();
		if (mm < 10) {
			mm = '0' + mm;
		}

		var mon = d.getUTCMonth() + 1;
		if (mon < 10) {
			mon = '0' + mon;
		}

		var day = d.getUTCDate();
		if (day < 10) {
			day = '0' + day;
		}

		var dateText = 'Updated: ' + d.getUTCFullYear() + '-' + mon + '-' + day;

		return dateText + ' ' + hh + ':' + mm + ' [UTC]';
	},

	oprShowSendMessageForm : function(iType) {

		var me = this;

		me.getContainer().body.mask("Wait...");
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'SystemAdministration/getUsersGroups',
			params : {},
			scope : me,
			success : function(response) {

				var response = Ext.JSON.decode(response.responseText);

				me.getContainer().body.unmask();
				if (response["success"] == "true") {

					me.formSendMail(response["users"], response["groups"], response["email"], iType);

				}

			},
			failure : function(response) {
				me.getContainer().body.unmask();
				Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			}
		});

	},

	formSendMail : function(oUsers, oGroups, sMail, iType) {

		var me = this;

		var oUsers = Ext.create('Ext.dirac.utils.DiracBoxSelect', {
			fieldLabel : "Send to user(s)",
			queryMode : 'local',
			labelAlign : 'left',
			displayField : "value",
			valueField : "value",
			anchor : '100%',
			store : new Ext.data.ArrayStore({
				fields : [ 'value' ],
				data : oUsers
			})
		});

		var oGroups = Ext.create('Ext.dirac.utils.DiracBoxSelect', {
			fieldLabel : "Send to group(s)",
			queryMode : 'local',
			labelAlign : 'left',
			displayField : "value",
			valueField : "value",
			anchor : '100%',
			store : new Ext.data.ArrayStore({
				fields : [ 'value' ],
				data : oGroups
			})
		});

		var oSubject = Ext.create('Ext.form.field.Text', {
			fieldLabel : "Subject",
			labelAlign : 'left',
			anchor : '100%'
		});

		var oMessage = Ext.create('Ext.form.field.TextArea', {
			fieldLabel : "Message",
			labelAlign : 'left',
			grow : true,
			anchor : '100%',
			height : 150
		});
		
		var oResetBtn = new Ext.Button({

			text : 'Reset',
			margin : 3,
			handler : function() {
				oUsers.setValue([]);
				oGroups.setValue([]);
				oSubject.setValue("");
				oMessage.setValue("");
			},
			scope : me
		});

		var oSendBtn = new Ext.Button({

			text : ((iType == 1) ? 'Send message' : 'Send e-mail'),
			margin : 3,
			handler : function() {

				var bValid = true;

				if (Ext.util.Format.trim(oSubject.getValue()) == "") {

					GLOBAL.APP.CF.alert("Subject field is empty !", "warning");
					bValid = false;

				}

				if (Ext.util.Format.trim(oMessage.getValue()) == "") {

					GLOBAL.APP.CF.alert("Subject field is empty !", "warning");
					bValid = false;

				}

				var sUsers = ((oUsers.isInverseSelection()) ? oUsers.getInverseSelection() : oUsers.getValue().join(","));
				var sGroups = ((oGroups.isInverseSelection()) ? oGroups.getInverseSelection() : oGroups.getValue().join(","));

				if ((Ext.util.Format.trim(sUsers) == "") && (Ext.util.Format.trim(sGroups) == "")) {

					GLOBAL.APP.CF.alert("No users nor groups selected !", "warning");
					bValid = false;

				}

				if (bValid) {

					me.getContainer().body.mask("Sending mail ...");
					Ext.Ajax.request({
						url : GLOBAL.BASE_URL + 'SystemAdministration/sendMessage',
						params : {

							subject : oSubject.getValue(),
							message : oMessage.getValue(),
							users : sUsers,
							groups : sGroups

						},
						scope : me,
						success : function(response) {
							var response = Ext.JSON.decode(response.responseText);

							me.getContainer().body.unmask();
							if (response["success"] == "true") {

								GLOBAL.APP.CF.alert(response["result"], "info");

							} else {

								GLOBAL.APP.CF.alert(response["error"], "error");

							}
							
							oSendBtn.show();
							oResetBtn.show();
						}
					});
					
					oSendBtn.hide();
					oResetBtn.hide();
				}

			},
			scope : me
		});

		

		var oToolbar = new Ext.toolbar.Toolbar({
			border : false,
			layout : {
				pack : 'center'
			},
			items : [ oSendBtn, oResetBtn ]
		});

		var oMainPanel = new Ext.create('Ext.panel.Panel', {
			layout : "anchor",
			border : false,
			items : [ oUsers, oGroups, oSubject, oMessage ],
			bbar : oToolbar,
			bodyPadding : 10
		});

		var sTitle = "";

		if (iType == 1) {
			sTitle = "From " + GLOBAL.USER_CREDENTIALS["username"] + "@" + GLOBAL.USER_CREDENTIALS["group"];
		} else {
			sTitle = "From " + sMail;
		}

		var oWindow = Ext.create('widget.window', {
			height : 350,
			width : 550,
			title : sTitle,
			layout : 'fit',
			modal : true,
			items : [ oMainPanel ],
			iconCls : "dirac-icon-mail"
		});

		oWindow.show();

	}

});
