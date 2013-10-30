Ext.define('DIRAC.SystemAdministration.classes.SystemAdministration', {
	extend : 'Ext.dirac.core.Module',

	requires : [ 'Ext.tab.Panel', 'Ext.ProgressBar', 'Ext.grid.feature.Grouping' ],

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

				},
				scope : me
			}, {
				text : 'Revert',
				iconCls : "sa-revert-button-icon",
				handler : function() {

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

				},
				text : 'Restart'
			}, {
				handler : function() {

				},
				text : 'Revert'
			}, {
				handler : function() {

				},
				text : 'Show Errors'
			} ]
		});

		me.hostContextMenu = new Ext.menu.Menu({
			items : [ {
				handler : function() {

				},
				text : 'Log'
			}, {
				handler : function() {

				},
				text : 'Restart'
			}, {
				handler : function() {

				},
				text : 'Stop'
			}, {
				handler : function() {

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
			id : 'directoryGrouping'
		});

		var oGridButtonsToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'top',
			items : [ "->", {
				xtype : "button",
				text : 'Restart',
				iconCls : "sa-restart-button-icon",
				handler : function() {

				},
				scope : me
			}, {
				text : 'Start',
				iconCls : "sa-start-button-icon",
				handler : function() {

				},
				scope : me
			}, {
				text : 'Stop',
				iconCls : "sa-stop-button-icon",
				handler : function() {

				},
				scope : me
			} ]
		});

		var oGrid = Ext.create('Ext.grid.Panel', {
			store : oNewStore,
			header : false,
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
					return this.rendererChkBox(value);
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

	}

});
