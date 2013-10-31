Ext.define('DIRAC.SystemAdministration.classes.SystemAdministration', {
	extend : 'Ext.dirac.core.Module',

	requires : [ 'Ext.tab.Panel', 'Ext.ProgressBar', 'Ext.grid.feature.Grouping', 'Ext.data.ArrayStore' ],

	initComponent : function() {

		var me = this;

		if (GLOBAL.VIEW_ID == "desktop") {

			me.launcher.title = "System Administration";
			me.launcher.maximized = false;

			var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

			me.launcher.width = oDimensions[0];
			me.launcher.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar.getHeight();

			me.launcher.x = 0;
			me.launcher.y = 0;

		}

		if (GLOBAL.VIEW_ID == "tabs") {

			me.launcher.title = "System Administration";
			me.launcher.maximized = false;

			var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

			me.launcher.width = oDimensions[0];
			me.launcher.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar.getHeight();

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

						// GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"],
						// "info");

						if (parseInt(oStore.proxy.reader.rawData["total"]) == 0) {

							me.systemInfoDataStore.removeAll();

						}

					} else {
						/*
						 * if (oStore.proxy.reader.rawData)
						 * me.pagingToolbar.updateStamp.setText('Updated: ' +
						 * oStore.proxy.reader.rawData["date"]);
						 */

						if (!oStore.createTabsOnce) {

							for ( var i = 0; i < oStore.proxy.reader.rawData["result"].length; i++) {
								me.createHostTab(oStore.proxy.reader.rawData["result"][i]["Host"]);
							}

							oStore.createTabsOnce = true;
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
			items : [ "->", {
				xtype : "button",
				text : 'Restart',
				iconCls : "sa-restart-button-icon",
				handler : function() {
					me.oprHostAction("restart", 2);
				},
				scope : me
			}, {
				text : 'Revert',
				iconCls : "sa-revert-button-icon",
				handler : function() {
					me.oprHostAction("revert", 2);
				},
				scope : me
			} ]
		});

		me.systemInfoGrid = Ext.create('Ext.grid.Panel', {

			store : me.systemInfoDataStore,
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
				}

			}
		});

		me.mainTabPanel = Ext.create('Ext.tab.Panel', {
			region : "center",
			header : false,
			items : [ {
				title : 'Overall System Information',
				items : [ me.systemInfoGrid ],
				autoScroll : true,
				layout : "fit"
			} ]
		});

		/*
		 * Creating the context menus
		 */

		me.overallContextMenu = new Ext.menu.Menu({
			items : [ {
				handler : function() {
					me.oprHostAction("restart", 1);
				},
				text : 'Restart'
			}, {
				handler : function() {
					me.oprHostAction("revert", 1);
				},
				text : 'Revert'
			}, {
				handler : function() {
					me.oprGetHostErrors();
				},
				text : 'Show Errors'
			} ]
		});

		me.hostContextMenu = new Ext.menu.Menu({
			items : [ {
				handler : function() {
					var oRecord = this.up("menu").selected_record;
					me.oprGetHostLog(oRecord);
				},
				text : 'Log'
			}, {
				handler : function() {
					var oGrid = this.up("menu").grid;
					me.oprComponentAction(oGrid, "restart", 1);
				},
				text : 'Restart'
			}, {
				handler : function() {
					var oGrid = this.up("menu").grid;
					me.oprComponentAction(oGrid, "stop", 1);
				},
				text : 'Stop'
			}, {
				handler : function() {
					var oGrid = this.up("menu").grid;
					me.oprComponentAction(oGrid, "start", 1);
				},
				text : 'Start'
			} ]
		});

		me.add(me.mainTabPanel);

	},

	createHostTab : function(sHostName) {

		var me = this;

		var sTabId = Ext.id();

		var oNewStore = new Ext.data.JsonStore({

			proxy : {
				type : 'ajax',
				url : GLOBAL.BASE_URL + 'SystemAdministration/getHostData',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000,
				autoLoad : true,
				extraParams : {
					"hostname" : sHostName
				}
			},
			groupField : 'Type',
			autoLoad : true,
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
			tabPanelId : sTabId,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						me.mainTabPanel.remove(oStore.tabPanelId);

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
			startCollapsed : true,
			id : 'directoryGrouping',
			startCollapsed : false
		});

		var oGridButtonsToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'top',
			items : [ "->", {
				xtype : "button",
				text : 'Restart',
				iconCls : "sa-restart-button-icon",
				handler : function() {
					var oGrid = this.up("grid");

					oGrid.moduleObject.oprComponentAction(oGrid, "restart", 2);
				}
			}, {
				text : 'Start',
				iconCls : "sa-start-button-icon",
				handler : function() {
					var oGrid = this.up("grid");
					oGrid.moduleObject.oprComponentAction(oGrid, "start", 2);
				}
			}, {
				text : 'Stop',
				iconCls : "sa-stop-button-icon",
				handler : function() {
					var oGrid = this.up("grid");
					oGrid.moduleObject.oprComponentAction(oGrid, "stop", 2);
				}
			} ]
		});

		var oGrid = Ext.create('Ext.grid.Panel', {
			store : oNewStore,
			header : false,
			moduleObject : me,
			id : sId,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			features : [ oGroupingFeature ],
			dockedItems : [ oGridButtonsToolbar ],
			hostName : sHostName,
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
					return '<b>&mdash;</b>'
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
					me.hostContextMenu.grid = this;

					me.hostContextMenu.showAt(e.xy);
					return false;
				}

			}
		});

		me.mainTabPanel.add({
			title : sHostName,
			items : [ oGrid ],
			autoScroll : true,
			layout : "fit",
			id : sTabId
		});

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

	oprComponentAction : function(oGrid, sAction, sEventSource) {

		var oParams = {
			action : sAction
		}

		if (sEventSource == 1) {

			var sHost = GLOBAL.APP.CF.getFieldValueFromSelectedRow(oGrid, "Host");
			var sName = GLOBAL.APP.CF.getFieldValueFromSelectedRow(oGrid, "Name");
			var sSystem = GLOBAL.APP.CF.getFieldValueFromSelectedRow(oGrid, "System");

			oParams[sName + "@" + sHost] = [ sSystem ];

		} else {

			
			var oElems = Ext.query("#" + oGrid.id + " input.checkrow");
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

	}

});
