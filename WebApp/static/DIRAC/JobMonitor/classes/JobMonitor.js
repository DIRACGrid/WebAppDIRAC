Ext.define('DIRAC.JobMonitor.classes.JobMonitor', {
	extend : 'Ext.dirac.core.Module',

	requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.CheckItem", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.toolbar.Paging",
			"Ext.grid.Panel", "Ext.form.field.Date", "Ext.form.field.TextArea", "Ext.dirac.utils.DiracToolButton" ],

	loadState : function(data) {

		var me = this;

		var bToReload = false;

		if (data.columns) {
			for ( var i = 0; i < me.grid.columns.length; i++) {

				var col = me.grid.columns[i];
				col.setWidth(data.columns[col.getSortParam()].width);
				if (data.columns[col.getSortParam()].hidden)
					col.hide();
				else
					col.show();

				var sortState = data.columns[col.getSortParam()].sortState;

				if (sortState != null)
					col.setSortState(sortState);

			}
		}

		if (data.leftMenu.selectors) {
			for ( var i = 0; i < me.selectorMenu.items.length - 1; i++) {

				var item = me.selectorMenu.items.getAt(i);

				item.setChecked(!data.leftMenu.selectors[item.relatedCmbField].hidden);

				if (!data.leftMenu.selectors[item.relatedCmbField].hidden)
					me.cmbSelectors[item.relatedCmbField].show();
				else
					me.cmbSelectors[item.relatedCmbField].hide();

				/*
				 * this can be done only if the store is being loaded, otherwise has to
				 * be postponed
				 */
				me.__oprPostponedValueSetUntilOptionsLoaded(me.cmbSelectors[item.relatedCmbField], data.leftMenu.selectors[item.relatedCmbField].data_selected, (i == me.selectorMenu.items.length - 2));

				me.cmbSelectors[item.relatedCmbField].setInverseSelection(data.leftMenu.selectors[item.relatedCmbField].not_selected);

			}
		} else {

			bToReload = true;

		}
		// For the time span searching sub-panel
		var item = me.selectorMenu.items.getAt(me.selectorMenu.items.length - 1);

		item.setChecked(!data.leftMenu.timeSearchPanelHidden);

		if (!data.leftMenu.timeSearchPanelHidden)
			me.timeSearchPanel.show();
		else
			me.timeSearchPanel.hide();
		// END - For the time span searching sub-panel

		me.textJobId.setValue(data.leftMenu.txtJobId);
		me.timeSearchElementsGroup.cmbTimeSpan.setValue(data.leftMenu.cmbTimeSpan);
		me.timeSearchElementsGroup.calenFrom.setValue(data.leftMenu.calenFrom);

		me.timeSearchElementsGroup.cmbTimeFrom.setValue(data.leftMenu.cmbTimeFrom);
		me.timeSearchElementsGroup.calenTo.setValue(data.leftMenu.calenTo);
		me.timeSearchElementsGroup.cmbTimeTo.setValue(data.leftMenu.cmbTimeTo);

		if (data.pageSize) {

			me.pagingToolbar.pageSizeCombo.suspendEvents(false);
			me.pagingToolbar.pageSizeCombo.setValue(data.pageSize);
			me.pagingToolbar.pageSizeCombo.resumeEvents();

		}

		if (data.leftPanelCollapsed) {

			if (data.leftPanelCollapsed)
				me.leftPanel.collapse();

		}

		if ("centralGridPanelVisible" in data) {

			if (!data.centralGridPanelVisible) {

				me.centralWorkPanel.getLayout().setActiveItem(1);

			}

		}

		if ("statisticsSelectionPanelCollapsed" in data) {

			if (data.statisticsSelectionPanelCollapsed) {

				me.statisticsSelectionGrid.collapse();

			}

		}

		if ("statisticsSelectionValues" in data) {

			me.statisticsGridComboMain.suspendEvents(false);
			me.statisticsGridCombo.suspendEvents(false);
			me.statisticsGridComboMain.setValue(data.statisticsSelectionValues[0]);
			me.statisticsGridCombo.setValue(data.statisticsSelectionValues[1]);
			me.statisticsGridComboMain.resumeEvents();
			me.statisticsGridCombo.resumeEvents();

		}

		if (bToReload) {

			me.oprLoadGridData();

		}

	},

	__cancelPreviousDataRequest : function() {

		var me = this;

		if (me.dataStore.loading && me.dataStore.lastDataRequest) {
			var oRequests = Ext.Ajax.requests;
			for (id in oRequests) {
				if (oRequests.hasOwnProperty(id) && (oRequests[id].options == me.dataStore.lastDataRequest.request)) {
					Ext.Ajax.abort(oRequests[id]);
				}
			}
		}

	},

	__oprPostponedValueSetUntilOptionsLoaded : function(oSelectionBox, oValues, bLastOne) {

		var me = this;

		if (me.bDataSelectionLoaded) {

			if (bLastOne) {
				me.__cancelPreviousDataRequest();

				me.oprLoadGridData();
			}

			oSelectionBox.setValue(oValues);

		} else {

			Ext.Function.defer(me.__oprPostponedValueSetUntilOptionsLoaded, 1500, me, [ oSelectionBox, oValues, bLastOne ]);

		}

	},

	getStateData : function() {

		var me = this;
		var oReturn = {};

		// data for grid columns
		oReturn.columns = {};

		for ( var i = 0; i < me.grid.columns.length; i++) {

			var col = me.grid.columns[i];
			var oName = col.getSortParam();
			oReturn.columns[oName] = {
				"width" : col.width,
				"hidden" : col.isHidden(),
				"sortState" : col.sortState
			};

		}

		// show/hide for selectors and their selected data (including NOT
		// button)
		oReturn.leftMenu = {};
		oReturn.leftMenu.selectors = {};

		for ( var cmb in me.cmbSelectors) {

			oReturn.leftMenu.selectors[cmb] = {
				hidden : me.cmbSelectors[cmb].isHidden(),
				data_selected : me.cmbSelectors[cmb].getValue(),
				not_selected : me.cmbSelectors[cmb].isInverseSelection()
			};

		}

		// the state of the selectors, text fields and time
		oReturn.leftMenu.txtJobId = me.textJobId.getValue();
		oReturn.leftMenu.cmbTimeSpan = me.timeSearchElementsGroup.cmbTimeSpan.getValue();
		oReturn.leftMenu.calenFrom = me.timeSearchElementsGroup.calenFrom.getValue();
		oReturn.leftMenu.cmbTimeFrom = me.timeSearchElementsGroup.cmbTimeFrom.getValue();
		oReturn.leftMenu.calenTo = me.timeSearchElementsGroup.calenTo.getValue();
		oReturn.leftMenu.cmbTimeTo = me.timeSearchElementsGroup.cmbTimeTo.getValue();
		oReturn.leftMenu.timeSearchPanelHidden = me.timeSearchPanel.hidden;

		oReturn.pageSize = me.pagingToolbar.pageSizeCombo.getValue();
		oReturn.leftPanelCollapsed = me.leftPanel.collapsed;
		oReturn.centralGridPanelVisible = !me.grid.hidden;
		oReturn.statisticsSelectionPanelCollapsed = me.statisticsSelectionGrid.collapsed;
		oReturn.statisticsSelectionValues = [ me.statisticsGridComboMain.getValue(), me.statisticsGridCombo.getValue() ];

		return oReturn;

	},
	dataFields : [ {
		name : 'SystemPriority',
		type : 'float'
	}, {
		name : 'ApplicationNumStatus'
	}, {
		name : 'JobID',
		type : 'int'
	}, {
		name : 'LastSignOfLife',
		type : 'date',
		dateFormat : 'Y-m-d H:i:s'
	}, {
		name : 'VerifiedFlag'
	}, {
		name : 'RetrievedFlag'
	}, {
		name : 'Status'
	}, {
		name : 'StartExecTime',
		type : 'date',
		dateFormat : 'Y-m-d H:i:s'
	}, {
		name : 'RescheduleCounter'
	}, {
		name : 'JobSplitType'
	}, {
		name : 'MinorStatus'
	}, {
		name : 'ApplicationStatus'
	}, {
		name : 'SubmissionTime',
		type : 'date',
		dateFormat : 'Y-m-d H:i:s'
	}, {
		name : 'JobType'
	}, {
		name : 'MasterJobID'
	}, {
		name : 'KilledFlag'
	}, {
		name : 'RescheduleTime'
	}, {
		name : 'DIRACSetup'
	}, {
		name : 'FailedFlag'
	}, {
		name : 'CPUTime'
	}, {
		name : 'OwnerDN'
	}, {
		name : 'JobGroup'
	}, {
		name : 'JobName'
	}, {
		name : 'AccountedFlag'
	}, {
		name : 'OSandboxReadyFlag'
	}, {
		name : 'LastUpdateTime',
		type : 'date',
		dateFormat : 'Y-m-d H:i:s'
	}, {
		name : 'Site'
	}, {
		name : 'HeartBeatTime',
		type : 'date',
		dateFormat : 'Y-m-d H:i:s'
	}, {
		name : 'OwnerGroup'
	}, {
		name : 'ISandboxReadyFlag'
	}, {
		name : 'UserPriority'
	}, {
		name : 'Owner'
	}, {
		name : 'DeletedFlag'
	}, {
		name : 'TaskQueueID'
	}, {
		name : 'JobType'
	}, {
		name : 'JobIDcheckBox',
		mapping : 'JobID'
	}, {
		name : 'StatusIcon',
		mapping : 'Status'
	}, {
		name : 'OwnerGroup'
	} ],

	initComponent : function() {

		var me = this;

		if (GLOBAL.VIEW_ID == "desktop") {

			me.launcher.title = "Job Monitor";
			me.launcher.maximized = false;

			var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

			me.launcher.width = oDimensions[0];
			me.launcher.height = oDimensions[1];

			me.launcher.x = 0;
			me.launcher.y = 0;

		}

		if (GLOBAL.VIEW_ID == "tabs") {

			me.launcher.title = "Job Monitor";
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

		/*
		 * -----------------------------------------------------------------------------------------------------------
		 * DEFINITION OF THE LEFT PANEL
		 * -----------------------------------------------------------------------------------------------------------
		 */

		me.leftPanel = new Ext.create('Ext.panel.Panel', {
			title : 'Selectors',
			region : 'west',
			floatable : false,
			margins : '0',
			width : 250,
			minWidth : 230,
			maxWidth : 350,
			bodyPadding : 5,
			layout : 'anchor',
			autoScroll : true
		});

		me.statisticsPanel = new Ext.create('Ext.panel.Panel', {
			header : false,
			region : 'center',
			floatable : false,
			// autoScroll : true,
			hidden : true,
			collapsible : false,
			layout : "border",
			defaults : {
				collapsible : true,
				split : true
			}
		});

		me.cmbSelectors = {
			site : null,
			status : null,
			minorStatus : null,
			appStatus : null,
			owner : null,
			jobGroup : null,
			jobType : null
		};

		var cmbTitles = {
			site : "Site",
			status : "Status",
			minorStatus : "Minor Status",
			appStatus : "Application Status",
			owner : "Owner",
			jobGroup : "Job Group",
			jobType : "Job Type"
		};

		for ( var cmb in me.cmbSelectors) {

			me.cmbSelectors[cmb] = Ext.create('Ext.dirac.utils.DiracBoxSelect', {
				fieldLabel : cmbTitles[cmb],
				queryMode : 'local',
				labelAlign : 'top',
				displayField : "text",
				valueField : "value",
				anchor : '100%'
			});

		}

		me.bDataSelectionLoaded = false;

		me.leftPanel
				.add([ me.cmbSelectors.site, me.cmbSelectors.status, me.cmbSelectors.minorStatus, me.cmbSelectors.appStatus, me.cmbSelectors.owner, me.cmbSelectors.jobGroup, me.cmbSelectors.jobType ]);

		me.textJobId = Ext.create('Ext.form.field.Text', {

			fieldLabel : "JobID(s)",
			labelAlign : 'top',
			anchor : "100%",
			validator : function(value) {

				if (Ext.util.Format.trim(value) != "") {
					var newValue = "";
					for ( var i = 0; i < value.length; i++) {
						if (value.charAt(i) != ' ')
							newValue += value.charAt(i);
					}
					var regExpr = /^(\d+|\d+-\d+)(,(\d+|\d+-\d+))*$/;

					if (String(newValue).search(regExpr) != -1)
						return true;
					else
						return "The IDs expression is not valid";

				} else
					return true;

			},
			enableKeyEvents : true,
			listeners : {

				keypress : function(oTextField, e, eOpts) {

					if (e.getCharCode() == 13) {

						me.oprLoadGridData();

					}

				}

			}
		});

		me.leftPanel.add(me.textJobId);

		// time search sub-panel

		me.timeSearchElementsGroup = {};

		me.timeSearchElementsGroup.cmbTimeSpan = new Ext.create('Ext.form.field.ComboBox', {
			labelAlign : 'top',
			fieldLabel : 'Time Span',
			store : new Ext.data.SimpleStore({
				fields : [ 'value', 'text' ],
				data : [ [ 1, "Last Hour" ], [ 2, "Last Day" ], [ 3, "Last Week" ], [ 4, "Last Month" ], [ 5, "Manual Selection" ] ]
			}),
			displayField : "text",
			valueField : "value",
			anchor : "100%"
		});

		var oTimeData = [];
		for ( var i = 0; i < 24; i++) {
			oTimeData.push([ ((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":00" ]);
			oTimeData.push([ ((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":30" ]);
		}

		me.timeSearchElementsGroup.calenFrom = new Ext.create('Ext.form.field.Date', {
			width : 100,
			format : 'Y-m-d'
		});

		me.timeSearchElementsGroup.cmbTimeFrom = new Ext.create('Ext.form.field.ComboBox', {
			width : 70,
			store : new Ext.data.SimpleStore({
				fields : [ 'value' ],
				data : oTimeData
			}),
			margin : "0 0 0 10",
			displayField : 'value'
		});

		me.timeSearchElementsGroup.calenTo = new Ext.create('Ext.form.field.Date', {
			width : 100,
			format : 'Y-m-d'
		});

		me.timeSearchElementsGroup.cmbTimeTo = new Ext.create('Ext.form.field.ComboBox', {
			width : 70,
			store : new Ext.data.SimpleStore({
				fields : [ 'value' ],
				data : oTimeData
			}),
			margin : "0 0 0 10",
			displayField : 'value'
		});

		me.timeSearchElementsGroup.btnResetTimePanel = new Ext.Button({

			text : 'Reset Time Panel',
			margin : 3,
			iconCls : "dirac-icon-reset",
			handler : function() {

				me.timeSearchElementsGroup.cmbTimeTo.setValue(null);
				me.timeSearchElementsGroup.cmbTimeFrom.setValue(null);
				me.timeSearchElementsGroup.calenTo.setRawValue("");
				me.timeSearchElementsGroup.calenFrom.setRawValue("");
				me.timeSearchElementsGroup.cmbTimeSpan.setValue(null);
			},
			scope : me,
			defaultAlign : "c"
		});

		me.timeSearchPanel = new Ext.create('Ext.panel.Panel', {
			width : 200,
			autoHeight : true,
			border : true,
			bodyPadding : 5,
			layout : "anchor",
			anchor : "100%",
			dockedItems : [ {
				xtype : 'toolbar',
				dock : 'bottom',
				items : [ me.timeSearchElementsGroup.btnResetTimePanel ],
				layout : {
					type : 'hbox',
					pack : 'center'
				}
			} ],
			items : [ me.timeSearchElementsGroup.cmbTimeSpan, {
				xtype : 'tbtext',
				text : "From:",
				padding : "3 0 3 0"
			}, {
				xtype : "panel",
				layout : "column",
				border : false,
				items : [ me.timeSearchElementsGroup.calenFrom, me.timeSearchElementsGroup.cmbTimeFrom ]
			}, {
				xtype : 'tbtext',
				text : "To:",
				padding : "3 0 3 0"
			}, {
				xtype : "panel",
				layout : "column",
				border : false,
				items : [ me.timeSearchElementsGroup.calenTo, me.timeSearchElementsGroup.cmbTimeTo ]
			} ]
		});

		me.leftPanel.add(me.timeSearchPanel);

		// Buttons at the top of the panel

		var oPanelButtons = new Ext.create('Ext.toolbar.Toolbar', {
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
				me.oprLoadGridData();
			},
			scope : me

		});

		oPanelButtons.add(me.btnSubmit);

		me.btnReset = new Ext.Button({

			text : 'Reset',
			margin : 3,
			iconCls : "dirac-icon-reset",
			handler : function() {
				me.oprResetSelectionOptions();
			},
			scope : me

		});

		oPanelButtons.add(me.btnReset);

		me.btnRefresh = new Ext.Button({

			text : 'Refresh',
			margin : 3,
			iconCls : "dirac-icon-refresh",
			handler : function() {
				me.oprSelectorsRefreshWithSubmit(false);
			},
			scope : me

		});

		oPanelButtons.add(me.btnRefresh);

		me.leftPanel.addDocked(oPanelButtons);

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'JobMonitor/getSelectionData',
			params : {

			},
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);

				me.__oprRefreshStoresForSelectors(response, false);

				if (me.currentState == "") {
					if ("properties" in GLOBAL.USER_CREDENTIALS) {
						if ((Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, "NormalUser") != -1) && (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, "JobSharing") == -1)) {
							me.cmbSelectors["owner"].setValue([ GLOBAL.USER_CREDENTIALS.username ]);
						}
					}

				}

				me.bDataSelectionLoaded = true;

			},
			failure : function(response) {

				Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			}
		});

		/*
		 * -----------------------------------------------------------------------------------------------------------
		 * DEFINITION OF THE GRID
		 * -----------------------------------------------------------------------------------------------------------
		 */

		me.dataStore = new Ext.data.JsonStore({

			proxy : {
				type : 'ajax',
				url : GLOBAL.BASE_URL + 'JobMonitor/getJobData',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000
			},
			fields : me.dataFields,
			remoteSort : true,
			pageSize : 100,
			dontLoadOnCreation : false,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "info");

						if (parseInt(oStore.proxy.reader.rawData["total"], 10) == 0) {

							me.dataStore.removeAll();

						}

					} else {
						if (oStore.proxy.reader.rawData)
							me.pagingToolbar.updateStamp.setText('Updated: ' + oStore.proxy.reader.rawData["date"]);

						me.dataStore.remoteSort = false;
						me.dataStore.sort();
						me.dataStore.remoteSort = true;

					}

				},

				beforeload : function(oStore, oOperation, eOpts) {

					me.dataStore.lastDataRequest = oOperation;

					if (!oStore.dontLoadOnCreation) {
						oStore.dontLoadOnCreation = true;
						return false;
					} else {
						return true;
					}

				}

			}
		});

		me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
		me.checkboxFunctionDefinition += 'var oChecked=this.checked;';
		me.checkboxFunctionDefinition += 'var oElems=Ext.query(\'#' + me.id + ' input.checkrow\');';
		me.checkboxFunctionDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
		me.checkboxFunctionDefinition += '" class="jm-main-check-box"/>';

		me.pagingToolbar = {};
		me.pagingToolbar.updateStamp = new Ext.Button({
			disabled : true,
			text : 'Updated: -'
		});

		me.pagingToolbar.btnReset = null;

		if (("properties" in GLOBAL.USER_CREDENTIALS) && (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, "JobAdministrator") != -1)) {
			me.pagingToolbar.btnReset = new Ext.Button({
				text : '',
				iconCls : "jm-red-reset-icon",
				handler : function() {

					var me = this;
					me.__oprJobAction("reset", "");

				},
				scope : me,
				tooltip : "Reset"
			});
		}

		me.pagingToolbar.btnReschedule = new Ext.Button({
			text : '',
			iconCls : "dirac-icon-reschedule",
			handler : function() {

				var me = this;
				me.__oprJobAction("reschedule", "");

			},
			scope : me,
			tooltip : "Reschedule"
		});

		me.pagingToolbar.btnKill = new Ext.Button({
			text : '',
			iconCls : "dirac-icon-kill",
			handler : function() {

				var me = this;
				me.__oprJobAction("kill", "");

			},
			scope : me,
			tooltip : "Kill"
		});

		me.pagingToolbar.btnDelete = new Ext.Button({
			text : '',
			iconCls : "dirac-icon-delete",
			handler : function() {

				var me = this;
				me.__oprJobAction("delete", "");

			},
			scope : me,
			tooltip : "Delete"
		});

		me.pagingToolbar.btnGoToStatistics = new Ext.Button({
			text : '',
			iconCls : "dirac-icon-pie",
			handler : function() {
				me.centralWorkPanel.getLayout().setActiveItem(1);
			},
			tooltip : "Go to the statistics panel"
		});

		me.pagingToolbar.btnGetIdList = new Ext.Button({
			text : '',
			iconCls : "dirac-icon-list",
			handler : function() {

				var oItems = [];

				var oElems = Ext.query("#" + me.id + " input.checkrow");

				for ( var i = 0; i < oElems.length; i++)
					if (oElems[i].checked)
						oItems.push(oElems[i].value);

				if (oItems.length < 1) {
					GLOBAL.APP.CF.alert('No jobs were selected', "error");
					return;
				} else {

					var oWindow = me.getContainer().createChildWindow("IDs of selected jobs", false, 700, 500);

					var oTextArea = new Ext.create('Ext.form.field.TextArea', {
						value : oItems.join(","),
						cls : "jm-textbox-help-window",
						flex : 1
					});

					var oCombo = new Ext.form.field.ComboBox({
						allowBlank : false,
						displayField : 'character',
						editable : false,
						mode : 'local',
						store : new Ext.data.SimpleStore({
							fields : [ 'character' ],
							data : [ [ "SEMI-COLON" ], [ "COMMA" ], [ "EMPTY SPACE" ] ]
						}),
						triggerAction : 'all',
						value : "COMMA",
						width : 200,
						idsItems : oItems,
						textArea : oTextArea,
						listeners : {

							"change" : function(combo, newValue, oldValue, eOpts) {

								switch (newValue) {

								case "SEMI-COLON":
									combo.textArea.setValue(combo.idsItems.join(";"));
									break;
								case "COMMA":
									combo.textArea.setValue(combo.idsItems.join(","));
									break;
								case "EMPTY SPACE":
									combo.textArea.setValue(combo.idsItems.join(" "));
									break;

								}

							}

						}
					});

					var oToolb = new Ext.create('Ext.toolbar.Toolbar', {
						dock : "top",
						idsItems : oItems,
						textArea : oTextArea,
						items : [ {
							xtype : "button",
							text : 'COMMA',
							handler : function() {

								var me = this;
								var parent = me.up("toolbar");

								parent.textArea.setValue(parent.idsItems.join(","));

							},
							toggleGroup : me.id + "-ids-separator",
							allowDepress : false
						}, {
							xtype : "button",
							text : 'SEMI-COLON',
							handler : function() {

								var me = this;
								var parent = me.up("toolbar");

								parent.textArea.setValue(parent.idsItems.join(";"));

							},
							toggleGroup : me.id + "-ids-separator",

							allowDepress : false
						}, {
							xtype : "button",
							text : 'EMPTY SPACE',
							handler : function() {
								var me = this;
								var parent = me.up("toolbar");

								parent.textArea.setValue(parent.idsItems.join(" "));
							},
							toggleGroup : me.id + "-ids-separator",

							allowDepress : false
						} ]
					});

					oToolb.items.getAt(0).toggle();

					oWindow.add(new Ext.create('Ext.panel.Panel', {
						floatable : false,
						autoScroll : true,
						autoHeight : true,
						layout : {
							type : 'vbox',
							align : 'stretch',
							pack : 'start'
						},
						dockedItems : [ oToolb ],
						items : [ oTextArea ]
					}));

					oWindow.show();

				}

			},
			scope : me,
			tooltip : "Get Selected IDs"
		});

		me.pagingToolbar.pageSizeCombo = new Ext.form.field.ComboBox({
			allowBlank : false,
			displayField : 'number',
			editable : false,
			maxLength : 4,
			maxLengthText : 'The maximum value for this field is 1000',
			minLength : 1,
			minLengthText : 'The minimum value for this field is 1',
			mode : 'local',
			store : new Ext.data.SimpleStore({
				fields : [ 'number' ],
				data : [ [ 25 ], [ 50 ], [ 100 ], [ 200 ], [ 500 ], [ 1000 ] ]
			}),
			triggerAction : 'all',
			value : 100,
			width : 50
		});

		me.pagingToolbar.pageSizeCombo.on("change", function(combo, newValue, oldValue, eOpts) {
			var me = this;
			me.dataStore.pageSize = newValue;
			me.oprLoadGridData();
		}, me);

		var pagingToolbarItems = [];

		if (me.pagingToolbar.btnReset != null) {

			pagingToolbarItems = [ me.pagingToolbar.btnGoToStatistics, '-', me.pagingToolbar.btnGetIdList, '-', me.pagingToolbar.btnReset, me.pagingToolbar.btnReschedule, me.pagingToolbar.btnKill,
					me.pagingToolbar.btnDelete, '-', '->', me.pagingToolbar.updateStamp, '-', 'Items per page: ', me.pagingToolbar.pageSizeCombo, '-' ];

		} else {

			pagingToolbarItems = [ me.pagingToolbar.btnGoToStatistics, '-', me.pagingToolbar.btnGetIdList, '-', me.pagingToolbar.btnReschedule, me.pagingToolbar.btnKill, me.pagingToolbar.btnDelete, '-',
					'->', me.pagingToolbar.updateStamp, '-', 'Items per page: ', me.pagingToolbar.pageSizeCombo, '-' ];

		}

		me.pagingToolbar.toolbar = Ext.create('Ext.toolbar.Paging', {
			store : me.dataStore,
			displayInfo : true,
			displayMsg : 'Displaying topics {0} - {1} of {2}',
			items : pagingToolbarItems,
			emptyMsg : "No topics to display",
			prependButtons : true,
			layout : {
				overflowHandler : 'Scroller'
			}
		});

		if (me.pagingToolbar.btnReset != null) {

			/*
			 * PAY ATTENTION TO TOOLBAR ITEMS REORDERING: ANY OTHER NEW ELEMENT MAY
			 * HAVE UNPREDICTED OUTCOME OF THE CODE THAT FOLLOWS
			 */
			me.pagingToolbar.toolbar.items.insert(8, me.pagingToolbar.toolbar.items.items[25]);
			me.pagingToolbar.toolbar.items.insert(26, me.pagingToolbar.toolbar.items.items[27]);
			me.pagingToolbar.toolbar.items.insert(28, me.pagingToolbar.toolbar.items.items[11]);
			me.pagingToolbar.toolbar.items.insert(8, me.pagingToolbar.toolbar.items.items[11]);
			/*
			 * -------------------------------END-------------------------------
			 */

		} else {

			/*
			 * PAY ATTENTION TO TOOLBAR ITEMS REORDERING: ANY OTHER NEW ELEMENT MAY
			 * HAVE UNPREDICTED OUTCOME OF THE CODE THAT FOLLOWS
			 */
			me.pagingToolbar.toolbar.items.insert(7, me.pagingToolbar.toolbar.items.items[24]);
			me.pagingToolbar.toolbar.items.insert(25, me.pagingToolbar.toolbar.items.items[26]);
			me.pagingToolbar.toolbar.items.insert(27, me.pagingToolbar.toolbar.items.items[10]);
			me.pagingToolbar.toolbar.items.insert(7, me.pagingToolbar.toolbar.items.items[10]);
			/*
			 * -------------------------------END-------------------------------
			 */

		}

		me.contextGridMenu = new Ext.menu.Menu({
			items : [ {
				handler : function() {
					me.__oprGetJobData("getJDL");
				},
				text : 'JDL'
			}, '-', {
				handler : function() {
					me.__oprGetJobData("getBasicInfo");
				},
				text : 'Attributes'
			}, {
				handler : function() {
					me.__oprGetJobData("getParams");
				},
				text : 'Parameters'
			}, {
				handler : function() {
					me.__oprGetJobData("getLoggingInfo");
				},
				text : 'Logging info'
			}, '-', {
				handler : function() {
					me.__oprGetJobData("getStandardOutput");
				},
				text : 'Peek StandardOutput'
			}, {
				iconCls : "dirac-icon-download",
				handler : function() {
					me.__oprGetJobData("getLogURL");
				},
				text : 'Get LogFile'
			}, {
				iconCls : "dirac-icon-download",
				handler : function() {
					me.__oprGetJobData("getPending");
				},
				text : 'Get PendingRequest'
			}, {
				iconCls : "dirac-icon-download",
				handler : function() {
					me.__oprGetJobData("getStagerReport");
				},
				text : 'Get StagerReport'
			}, '-', {
				text : 'Actions',
				iconCls : "dirac-icon-action",
				menu : {
					items : [ {
						handler : function() {

							var me = this;
							me.__oprJobAction("kill", GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID"));

						},
						iconCls : "dirac-icon-kill",
						text : 'Kill',
						scope : me
					}, {
						handler : function() {

							var me = this;
							me.__oprJobAction("delete", GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID"));

						},
						iconCls : "dirac-icon-delete",
						text : 'Delete',
						scope : me
					} ]
				}
			}, {
				text : 'Pilot',
				menu : {
					items : [ {
						iconCls : "dirac-icon-download",
						handler : function() {
							me.__oprGetJobData("getPilotStdOut");
						},
						text : 'Get StdOut'
					}, {
						iconCls : "dirac-icon-download",
						handler : function() {
							me.__oprGetJobData("getPilotStdErr");
						},
						text : 'Get StdErr'
					} ]
				}
			}, {
				text : 'Sandbox',
				iconCls : "jm-icon-sandbox",
				menu : {
					items : [ {
						iconCls : "dirac-icon-download",
						handler : function() {

							me.__getSandbox(GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID"), "Input");

						},
						text : 'Get input file(s)'
					}, {
						iconCls : "dirac-icon-download",
						handler : function() {

							me.__getSandbox(GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID"), "Output");

						},
						text : 'Get output file(s)'
					} ]
				}
			} ]
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
			columns : [ {
				header : me.checkboxFunctionDefinition,
				name : 'checkBox',
				//id : 'checkBox',
				width : 26,
				sortable : false,
				dataIndex : 'JobIDcheckBox',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererChkBox(value);
				},
				hideable : false,
				fixed : true,
				menuDisabled : true,
				align : "center"
			}, {
				header : 'JobId',
				sortable : true,
				dataIndex : 'JobID',
				align : 'left',
				hideable : false
			}, {
				header : '',
				width : 26,
				sortable : false,
				dataIndex : 'StatusIcon',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererStatus(value);
				},
				hideable : false,
				fixed : true,
				menuDisabled : true
			}, {
				header : 'Status',
				width : 100,
				sortable : true,
				dataIndex : 'Status',
				align : 'left'
			}, {
				header : 'MinorStatus',
				sortable : true,
				dataIndex : 'MinorStatus',
				align : 'left',
				flex : 1
			}, {
				header : 'ApplicationStatus',
				sortable : true,
				dataIndex : 'ApplicationStatus',
				align : 'left'
			}, {
				header : 'Site',
				sortable : true,
				dataIndex : 'Site',
				align : 'left'
			}, {
				header : 'JobName',
				width : 200,
				sortable : true,
				dataIndex : 'JobName',
				align : 'left',
				flex : 1
			}, {
				header : 'LastUpdate [UTC]',
				width : 150,
				sortable : true,
				renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
				dataIndex : 'LastUpdateTime'
			}, {
				header : 'LastSignOfLife [UTC]',
				width : 150,
				sortable : true,
				renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
				dataIndex : 'LastSignOfLife'
			}, {
				header : 'SubmissionTime [UTC]',
				width : 150,
				sortable : true,
				renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
				dataIndex : 'SubmissionTime'
			}, {
				header : 'DIRACSetup',
				sortable : true,
				dataIndex : 'DIRACSetup',
				align : 'left',
				hidden : true
			}, {
				header : 'FailedFlag',
				sortable : true,
				dataIndex : 'FailedFlag',
				align : 'left',
				hidden : true
			}, {
				header : 'RescheduleCounter',
				sortable : true,
				dataIndex : 'RescheduleCounter',
				align : 'left',
				hidden : true
			}, {
				header : 'CPUTime',
				sortable : true,
				dataIndex : 'CPUTime',
				align : 'left',
				hidden : true
			}, {
				header : 'OwnerDN',
				sortable : true,
				dataIndex : 'OwnerDN',
				align : 'left',
				hidden : true
			}, {
				header : 'JobGroup',
				sortable : true,
				dataIndex : 'JobGroup',
				align : 'left',
				hidden : true
			}, {
				header : 'JobType',
				sortable : true,
				dataIndex : 'JobType',
				align : 'left',
				hidden : true
			}, {
				header : 'AccountedFlag',
				sortable : true,
				dataIndex : 'AccountedFlag',
				align : 'left',
				hidden : true
			}, {
				header : 'OSandboxReadyFlag',
				sortable : true,
				dataIndex : 'OSandboxReadyFlag',
				align : 'left',
				hidden : true
			}, {
				header : 'Owner',
				sortable : true,
				dataIndex : 'Owner',
				align : 'left'
			}, {
				header : 'TaskQueueID',
				sortable : true,
				dataIndex : 'TaskQueueID',
				align : 'left',
				hidden : true
			}, {
				header : 'OwnerGroup',
				sortable : true,
				dataIndex : 'OwnerGroup',
				align : 'left',
				hidden : true
			} ],
			rendererChkBox : function(val) {
				return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
			},
			rendererStatus : function(value) {
				if ((value == 'Done') || (value == 'Completed') || (value == 'Good') || (value == 'Active') || (value == 'Cleared') || (value == 'Completing')) {
					return '<img src="static/DIRAC/JobMonitor/images/done.gif"/>';
				} else if (value == 'Bad') {
					return '<img src="static/DIRAC/JobMonitor/images/bad.gif"/>';
				} else if ((value == 'Failed') || (value == 'Bad') || (value == 'Banned') || (value == 'Aborted')) {
					return '<img src="static/DIRAC/JobMonitor/images/failed.gif"/>';
				} else if ((value == 'Waiting') || (value == 'Stopped') || (value == 'Poor') || (value == 'Probing')) {
					return '<img src="static/DIRAC/JobMonitor/images/waiting.gif"/>';
				} else if (value == 'Deleted') {
					return '<img src="static/DIRAC/JobMonitor/images/deleted.gif"/>';
				} else if (value == 'Matched') {
					return '<img src="static/DIRAC/JobMonitor/images/matched.gif"/>';
				} else if ((value == 'Running') || (value == 'Active') || (value == 'Fair')) {
					return '<img src="static/DIRAC/JobMonitor/images/running.gif"/>';
				} else if (value == 'NoMask') {
					return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
				} else {
					return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
				}
			},
			tbar : me.pagingToolbar.toolbar,
			listeners : {

				// cellclick : function(oTable, td, cellIndex, record, tr, rowIndex, e,
				// eOpts) {
				//
				// if (cellIndex != 0) {
				// me.contextGridMenu.showAt(e.xy);
				// }
				//
				// },

				beforecellcontextmenu : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
					e.preventDefault();
					me.contextGridMenu.showAt(e.xy);
					return false;
				}

			}
		});

		me.grid.columns[1].setSortState("DESC");

		for ( var i = 0; i < me.pagingToolbar.toolbar.items.length; i++) {

			if (me.pagingToolbar.toolbar.items.getAt(i).itemId == "refresh") {

				me.pagingToolbar.toolbar.items.getAt(i).setIconCls("dirac-icon-submit");
				me.pagingToolbar.toolbar.items.getAt(i).setTooltip("Submit");
				break;

			}

		}

		/* Definition of the statistics panel */

		me.statisticsGridComboMain = new Ext.form.field.ComboBox({
			allowBlank : false,
			displayField : 'set',
			editable : false,
			mode : 'local',
			store : new Ext.data.SimpleStore({
				fields : [ 'set' ],
				data : [ [ "Selected Statistics" ], [ "Global Statistics" ] ]
			}),
			triggerAction : 'all',
			value : "Selected Statistics",
			flex : 1,
			listeners : {

				"change" : function(combo, newValue, oldValue, eOpts) {

					var me = combo.moduleObject;
					me.oprLoadGridData();

				}

			},
			moduleObject : me
		});

		me.statisticsGridCombo = new Ext.form.field.ComboBox({
			allowBlank : false,
			displayField : 'category',
			editable : false,
			mode : 'local',
			store : new Ext.data.SimpleStore({
				fields : [ 'category' ],
				data : [ [ "Status" ], [ "Site" ], [ "Minor Status" ], [ "Application Status" ], [ "Owner" ], [ "Job Group" ] ]
			}),
			triggerAction : 'all',
			value : "Status",
			flex : 1,
			listeners : {

				"change" : function(combo, newValue, oldValue, eOpts) {

					var me = combo.moduleObject;
					me.oprLoadGridData();

				}

			},
			moduleObject : me
		});

		var oButtonGoToGrid = new Ext.Button({

			margin : 0,
			iconCls : "jm-grid-icon",
			handler : function() {
				me.centralWorkPanel.getLayout().setActiveItem(0);
			},
			scope : me

		});

		me.btnShowPlotAsPng = new Ext.Button({

			margin : 0,
			iconCls : "dirac-icon-save",
			handler : function() {

				me.oprSavePieAsPng();

			},
			scope : me,
			tooltip : "Save pie chart as PNG image"
		});

		me.btnPlotSettings = new Ext.Button({

			margin : 0,
			iconCls : "dirac-icon-pie",
			handler : function() {

				me.formPlotSettings();

			},
			scope : me,
			tooltip : "Plot settings"
		});

		/*-----------AUTO REFRESH---------------*/
		var oTask = {
			run : function() {
				me.oprLoadGridData();
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
			text : 'Auto Refresh: Disabled',
			tooltip : 'Click to set the time for autorefresh'
		});

		var btnRefreshStats = new Ext.Button({
			iconCls : "dirac-icon-refresh",
			tooltip : 'Click to refresh the statistics',
			handler : function() {
				me.oprLoadGridData();
			}
		});

		btnAutorefresh.on('menuhide', function(button, menu) {
			var length = menu.items.getCount();
			for ( var i = 0; i < length; i++) {
				if (menu.items.items[i].checked) {
					button.setText("Auto Refresh: " + menu.items.items[i].text);
				}
			}
		});
		/*---------------------------------------------------*/

		me.statisticsSelectionGrid = Ext.create('Ext.grid.Panel', {
			region : 'west',
			store : new Ext.data.ArrayStore({
				fields : [ "key", "value", "code", "color" ],
				data : []
			}),
			width : 300,
			header : false,
			border : 0,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			dockedItems : [ new Ext.create('Ext.toolbar.Toolbar', {
				dock : "top",
				items : [ oButtonGoToGrid, me.btnShowPlotAsPng, me.btnPlotSettings, '-', btnRefreshStats, '-', btnAutorefresh ]
			}), new Ext.create('Ext.toolbar.Toolbar', {
				dock : "top",
				items : [ me.statisticsGridComboMain ]
			}), new Ext.create('Ext.toolbar.Toolbar', {
				dock : "top",
				items : [ me.statisticsGridCombo ]
			}) ],
			columns : [ {
				header : '',
				width : 26,
				sortable : false,
				dataIndex : 'key',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererStatus(value);
				},
				hideable : false,
				fixed : true,
				menuDisabled : true
			}, {
				header : 'Key',
				sortable : true,
				dataIndex : 'key',
				align : 'left',
				hideable : false,
				width : 150
			}, {
				header : 'Value',
				flex : 1,
				sortable : true,
				dataIndex : 'value',
				align : 'left'
			} ],
			rendererStatus : function(value) {
				if ((value == 'Done') || (value == 'Completed') || (value == 'Good') || (value == 'Active') || (value == 'Cleared') || (value == 'Completing')) {
					return '<img src="static/DIRAC/JobMonitor/images/done.gif"/>';
				} else if (value == 'Bad') {
					return '<img src="static/DIRAC/JobMonitor/images/bad.gif"/>';
				} else if ((value == 'Failed') || (value == 'Bad') || (value == 'Banned') || (value == 'Aborted')) {
					return '<img src="static/DIRAC/JobMonitor/images/failed.gif"/>';
				} else if ((value == 'Waiting') || (value == 'Stopped') || (value == 'Poor') || (value == 'Probing')) {
					return '<img src="static/DIRAC/JobMonitor/images/waiting.gif"/>';
				} else if (value == 'Deleted') {
					return '<img src="static/DIRAC/JobMonitor/images/deleted.gif"/>';
				} else if (value == 'Matched') {
					return '<img src="static/DIRAC/JobMonitor/images/matched.gif"/>';
				} else if ((value == 'Running') || (value == 'Active') || (value == 'Fair')) {
					return '<img src="static/DIRAC/JobMonitor/images/running.gif"/>';
				} else if (value == 'NoMask') {
					return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
				} else {
					return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
				}
			}
		});

		me.statisticsPlotPanel = new Ext.create('Ext.panel.Panel', {
			region : 'center',
			floatable : false,
			layout : 'fit',
			header : false,
			items : [ {
				html : "<div id='" + me.id + "-statistics-plot' style='width:100%;'></div>",
				xtype : "box",
				cls : 'jm-statistics-plot-background'
			} ]
		});

		me.statisticsPlotPanel.onResize = function(width, height, oldWidth, oldHeight) {

			me.createPlotFromGridData(me.statisticsGridComboMain.getValue() + " :: " + me.statisticsGridCombo.getValue());

		};

		me.statisticsPanel.add([ me.statisticsSelectionGrid, me.statisticsPlotPanel ]);

		/* END - Definition of the statistics panel */

		/*
		 * -----------------------------------------------------------------------------------------------------------
		 * DEFINITION OF THE MAIN CONTAINER
		 * -----------------------------------------------------------------------------------------------------------
		 */

		me.centralWorkPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			layout : 'card',
			region : "center",
			header : false,
			border : false,
			items : [ me.grid, me.statisticsPanel ]
		});

		me.add([ me.leftPanel, me.centralWorkPanel ]);

	},

	oprSavePieAsPng : function() {

		var me = this;

		var sSvgElement = document.getElementById(me.id + "-statistics-plot").getElementsByTagName("svg")[0].parentNode.innerHTML;

		var iHeight = me.statisticsPlotPanel.getHeight();

		var iWidth = me.statisticsPlotPanel.getWidth();

		var canvas = document.createElement('canvas');
		canvas.setAttribute('width', iWidth);
		canvas.setAttribute('height', iHeight);

		var oContext = canvas.getContext("2d");

		oContext.beginPath();
		oContext.rect(0, 0, iWidth, iHeight);
		oContext.fillStyle = "#FFFFFF";
		oContext.fill();

		var oImage = new Image();
		oImage.src = GLOBAL.ROOT_URL + 'static/core/img/wallpapers/dirac_jobmonitor_background.png';

		oImage.onload = function() {

			oContext.drawImage(oImage, 0, 0, iWidth, iHeight);

			oContext.drawSvg(sSvgElement, 0, 0);

			var imgData = canvas.toDataURL("image/png");
			window.location = imgData.replace("image/png", "image/octet-stream");

		}

	},

	formPlotSettings : function() {

		var me = this;

		if (!"plotSettings" in me)
			me.plotSettings = {};

		me.plotSettings.txtPlotTitle = Ext.create('Ext.form.field.Text', {

			fieldLabel : "Title",
			labelAlign : 'left',
			allowBlank : false,
			margin : 10,
			anchor : '100%',
			value : me.plotSettings.backupSettings.title

		});

		me.plotSettings.cmbLegendPosition = new Ext.create('Ext.form.field.ComboBox', {
			labelAlign : 'left',
			fieldLabel : 'Legend position',
			store : new Ext.data.SimpleStore({
				fields : [ 'value', 'text' ],
				data : [ [ "right", "right" ], [ "left", "left" ], [ "top", "top" ], [ "bottom", "bottom" ], [ "none", "none" ] ]
			}),
			displayField : "text",
			valueField : "value",
			anchor : "100%",
			margin : 10,
			value : me.plotSettings.backupSettings.legend
		});

		// button for saving the state
		me.plotSettings.btnApplySettings = new Ext.Button({

			text : 'Submit',
			margin : 3,
			iconCls : "dirac-icon-submit",
			handler : function() {
				var me = this;
				me.createPlotFromGridData(me.plotSettings.txtPlotTitle.getValue(), me.plotSettings.cmbLegendPosition.getValue());
			},
			scope : me

		});

		var oToolbar = new Ext.toolbar.Toolbar({
			border : false
		});

		oToolbar.add([ me.plotSettings.btnApplySettings ]);

		var oPanel = new Ext.create('Ext.panel.Panel', {
			autoHeight : true,
			border : false,
			layout : "anchor",
			items : [ oToolbar, me.plotSettings.txtPlotTitle, me.plotSettings.cmbLegendPosition, me.txtElementConfig ]
		});

		// initializing window showing the saving form
		Ext.create('widget.window', {
			height : 300,
			width : 500,
			title : "Plot Settings",
			layout : 'fit',
			modal : true,
			items : oPanel
		}).show();

	},

	funcOnChangeEitherCombo : function() {

		var me = this;

		var sSet = me.statisticsGridComboMain.getValue();
		var sCategory = me.statisticsGridCombo.getValue();

		me.statisticsGridComboMain.setDisabled(true);
		me.statisticsGridCombo.setDisabled(true);

		if (sSet == "Selected Statistics") {

			var oData = me.getSelectionData();
			oData.statsField = sCategory;

			me.statisticsSelectionGrid.body.mask("Wait ...");

			Ext.Ajax.request({
				url : GLOBAL.BASE_URL + 'JobMonitor/getStatisticsData',
				params : oData,
				scope : me,
				success : function(response) {
					var response = Ext.JSON.decode(response.responseText);

					if (response["success"] == "true") {
						me.statisticsSelectionGrid.store.removeAll();

						me.statisticsSelectionGrid.store.add(response["result"]);

						me.createPlotFromGridData(sSet + " :: " + sCategory);

					} else {
						GLOBAL.APP.CF.alert(response["error"], "error");
					}

					me.statisticsSelectionGrid.body.unmask();
					me.statisticsGridComboMain.setDisabled(false);
					me.statisticsGridCombo.setDisabled(false);
				},
				failure : function(response) {
					me.statisticsGridComboMain.setDisabled(false);
					me.statisticsGridCombo.setDisabled(false);
					me.statisticsSelectionGrid.body.unmask();
					Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
				}
			});
		} else {

			me.statisticsSelectionGrid.body.mask("Wait ...");

			Ext.Ajax.request({
				url : GLOBAL.BASE_URL + 'JobMonitor/getStatisticsData',
				params : {
					statsField : sCategory,
					globalStat : true
				},
				scope : me,
				success : function(response) {
					var response = Ext.JSON.decode(response.responseText);

					if (response["success"] == "true") {
						me.statisticsSelectionGrid.store.removeAll();

						me.statisticsSelectionGrid.store.add(response["result"]);

						me.createPlotFromGridData(sSet + " :: " + sCategory);

					} else {
						GLOBAL.APP.CF.alert(response["error"], "error");
					}
					me.statisticsSelectionGrid.body.unmask();
					me.statisticsGridComboMain.setDisabled(false);
					me.statisticsGridCombo.setDisabled(false);
				},
				failure : function(response) {
					me.statisticsSelectionGrid.body.unmask();
					me.statisticsGridComboMain.setDisabled(false);
					me.statisticsGridCombo.setDisabled(false);
					Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
				}
			});

		}

	},

	createPlotFromGridData : function(sTitle, sLegendPosition) {

		var me = this;

		if (!sLegendPosition) {
			if (("plotSettings" in me) && ("backupSettings" in me.plotSettings)) {
				sLegendPosition = me.plotSettings.backupSettings.legend;
			} else {
				sLegendPosition = "right";
			}
		}

		var oStore = me.statisticsSelectionGrid.getStore();
		var oData = [ [ "Key", "Value" ] ];
		var oColors = [];

		for ( var i = 0; i < oStore.getCount(); i++) {

			oData.push([ oStore.getAt(i).get("key"), oStore.getAt(i).get("value") ]);
			oColors.push(oStore.getAt(i).get("color"));

		}

		var data = google.visualization.arrayToDataTable(oData);

		var oNow = new Date();

		var options = {
			title : sTitle + " (" + oNow.toString() + ")",
			legend : {
				position : sLegendPosition
			},
			colors : oColors,
			backgroundColor : "transparent",
			chartArea : {
				width : "80%",
				height : "80%"
			}
		};

		if (!("plotSettings" in me))
			me.plotSettings = {};

		me.plotSettings.backupSettings = {
			"title" : sTitle,
			"legend" : sLegendPosition
		};

		var iHeight = me.statisticsPlotPanel.getHeight() - 20;
		document.getElementById(me.id + "-statistics-plot").style.height = "" + iHeight + "px";

		var iWidth = me.statisticsPlotPanel.getWidth() - 20;
		document.getElementById(me.id + "-statistics-plot").style.width = "" + iWidth + "px";

		var chart = new google.visualization.PieChart(document.getElementById(me.id + "-statistics-plot"));
		chart.draw(data, options);

	},

	afterRender : function() {
		var me = this;

		var menuItems = [];
		for ( var cmb in me.cmbSelectors) {

			menuItems.push({
				xtype : 'menucheckitem',
				text : me.cmbSelectors[cmb].getFieldLabel(),
				relatedCmbField : cmb,
				checked : true,
				handler : function(item, e) {

					var me = this;

					if (item.checked)
						me.cmbSelectors[item.relatedCmbField].show();
					else
						me.cmbSelectors[item.relatedCmbField].hide();

				},
				scope : me
			});

		}

		menuItems.push({
			xtype : 'menucheckitem',
			text : "Time Span",
			checked : true,
			handler : function(item, e) {

				var me = this;

				if (item.checked)
					me.timeSearchPanel.show();
				else
					me.timeSearchPanel.hide();

			},
			scope : me
		});

		me.selectorMenu = new Ext.menu.Menu({
			items : menuItems
		});

		me.leftPanel.getHeader().addTool({
			xtype : "diracToolButton",
			type : "down",
			menu : me.selectorMenu
		});

		// Change the handler of the refresh button of the paging toolbar
		// me.pagingToolbar.toolbar.items

		for ( var i = 0; i < me.pagingToolbar.toolbar.items.length; i++) {

			if (me.pagingToolbar.toolbar.items.getAt(i).itemId == "refresh") {

				me.pagingToolbar.toolbar.items.getAt(i).handler = function() {
					me.oprLoadGridData();
				};

				break;

			}

		}

		this.callParent();

		me.statisticsPlotPanel.body.on("dblclick", function(e, t, eOpts) {
			me.oprSavePieAsPng();
			e.stopPropagation();
			e.stopEvent();
		});

	},

	__oprRefreshStoresForSelectors : function(oData, bRefreshStores) {

		var me = this;

		var map = [ [ "app", "appStatus" ], [ "minorstat", "minorStatus" ], [ "owner", "owner" ], [ "prod", "jobGroup" ], [ "site", "site" ], [ "status", "status" ], [ "types", "jobType" ] ];

		for ( var j = 0; j < map.length; j++) {

			var dataOptions = [];
			for ( var i = 0; i < oData[map[j][0]].length; i++)
				dataOptions.push([ oData[map[j][0]][i][0], oData[map[j][0]][i][0] ]);

			if (bRefreshStores) {

				var oNewStore = new Ext.data.ArrayStore({
					fields : [ 'value', 'text' ],
					data : dataOptions
				});

				me.cmbSelectors[map[j][1]].refreshStore(oNewStore);

			} else {
				me.cmbSelectors[map[j][1]].store = new Ext.data.ArrayStore({
					fields : [ 'value', 'text' ],
					data : dataOptions
				});
			}

		}

	},

	__oprValidateBeforeSubmit : function() {

		var me = this;
		var bValid = true;

		if (!me.textJobId.validate())
			bValid = false;

		return bValid;
	},

	oprSelectorsRefreshWithSubmit : function(bSubmit) {

		var me = this;

		if (bSubmit && !me.__oprValidateBeforeSubmit())
			return;

		me.leftPanel.body.mask("Wait ...");
		// this var is used to know whether the options in the select boxes have
		// been loaded or not
		me.bDataSelectionLoaded = false;
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'JobMonitor/getSelectionData',
			params : {

			},
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);
				me.__oprRefreshStoresForSelectors(response, true);
				me.leftPanel.body.unmask();
				if (bSubmit)
					me.oprLoadGridData();

				me.bDataSelectionLoaded = true;

			},
			failure : function(response) {

				Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			}
		});

	},

	getSelectionData : function() {

		var me = this;

		// if a value in time span has been selected
		var sStartDate = me.timeSearchElementsGroup.calenFrom.getRawValue();
		var sStartTime = me.timeSearchElementsGroup.cmbTimeFrom.getValue();
		var sEndDate = me.timeSearchElementsGroup.calenTo.getRawValue();
		var sEndTime = me.timeSearchElementsGroup.cmbTimeTo.getValue();

		var iSpanValue = me.timeSearchElementsGroup.cmbTimeSpan.getValue();

		if ((iSpanValue != null) && (iSpanValue != 5)) {

			var oNowJs = new Date();
			var oBegin = null;

			switch (iSpanValue) {
			case 1:
				oBegin = Ext.Date.add(oNowJs, Ext.Date.HOUR, -1);
				break;
			case 2:
				oBegin = Ext.Date.add(oNowJs, Ext.Date.DAY, -1);
				break;
			case 3:
				oBegin = Ext.Date.add(oNowJs, Ext.Date.DAY, -7);
				break;
			case 4:
				oBegin = Ext.Date.add(oNowJs, Ext.Date.MONTH, -1);
				break;
			}

			sStartDate = Ext.Date.format(oBegin, "Y-m-d");
			sEndDate = Ext.Date.format(oNowJs, "Y-m-d");
			sStartTime = Ext.Date.format(oBegin, "H:i");
			sEndTime = Ext.Date.format(oNowJs, "H:i");

		}

		// Collect data for filtration
		var extraParams = {

			site : ((me.cmbSelectors.site.isInverseSelection()) ? me.cmbSelectors.site.getInverseSelection() : me.cmbSelectors.site.getValue().join(",")),
			status : ((me.cmbSelectors.status.isInverseSelection()) ? me.cmbSelectors.status.getInverseSelection() : me.cmbSelectors.status.getValue().join(",")),
			minorstat : ((me.cmbSelectors.minorStatus.isInverseSelection()) ? me.cmbSelectors.minorStatus.getInverseSelection() : me.cmbSelectors.minorStatus.getValue().join(",")),
			app : ((me.cmbSelectors.appStatus.isInverseSelection()) ? me.cmbSelectors.appStatus.getInverseSelection() : me.cmbSelectors.appStatus.getValue().join(",")),
			owner : ((me.cmbSelectors.owner.isInverseSelection()) ? me.cmbSelectors.owner.getInverseSelection() : me.cmbSelectors.owner.getValue().join(",")),
			prod : ((me.cmbSelectors.jobGroup.isInverseSelection()) ? me.cmbSelectors.jobGroup.getInverseSelection() : me.cmbSelectors.jobGroup.getValue().join(",")),
			types : ((me.cmbSelectors.jobType.isInverseSelection()) ? me.cmbSelectors.jobType.getInverseSelection() : me.cmbSelectors.jobType.getValue().join(",")),
			ids : me.textJobId.getValue(),
			limit : me.pagingToolbar.pageSizeCombo.getValue(),
			startDate : sStartDate,
			startTime : sStartTime,
			endDate : sEndDate,
			endTime : sEndTime

		};

		return extraParams;

	},

	oprLoadGridData : function() {

		var me = this;

		if (me.__oprValidateBeforeSubmit()) {

			// set those data as extraParams in
			me.grid.store.proxy.extraParams = me.getSelectionData();
			me.grid.store.currentPage = 1;
			me.grid.store.load();

			var oCheckbox = Ext.query("#" + me.id + " input.jm-main-check-box");

			if (oCheckbox[0])
				oCheckbox[0].checked = false;

			me.funcOnChangeEitherCombo();
		}

	},
	oprResetSelectionOptions : function() {

		var me = this;
		me.cmbSelectors.site.setValue([]);
		me.cmbSelectors.status.setValue([]);
		me.cmbSelectors.minorStatus.setValue([]);
		me.cmbSelectors.appStatus.setValue([]);
		me.cmbSelectors.owner.setValue([]);
		me.cmbSelectors.jobGroup.setValue([]);
		me.cmbSelectors.jobType.setValue([]);
		me.textJobId.setValue("");

		me.timeSearchElementsGroup.cmbTimeSpan.setValue("");
		me.timeSearchElementsGroup.calenFrom.setValue("");
		me.timeSearchElementsGroup.calenTo.setValue("");
		me.timeSearchElementsGroup.cmbTimeFrom.setValue("");
		me.timeSearchElementsGroup.cmbTimeTo.setValue("");

	},
	__oprJobAction : function(oAction, oId) {

		var me = this;
		var oItems = [];

		if ((oId == null) || (oId == '') || (oId == undefined)) {

			var oElems = Ext.query("#" + me.id + " input.checkrow");

			for ( var i = 0; i < oElems.length; i++)
				if (oElems[i].checked)
					oItems.push(oElems[i].value);

			if (oItems.length < 1) {
				GLOBAL.APP.CF.alert('No jobs were selected', "error");
				return;
			}

		} else {
			oItems[0] = oId;
		}

		var c = false;

		if (oItems.length == 1)
			c = confirm('Are you sure you want to ' + oAction + ' ' + oItems[0] + '?');
		else
			c = confirm('Are you sure you want to ' + oAction + ' these jobs?');

		if (c === false)
			return;

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'JobMonitor/jobAction',
			method : 'POST',
			params : {
				action : oAction,
				ids : oItems.join(",")
			},
			success : function(response) {
				var jsonData = Ext.JSON.decode(response.responseText);
				if (jsonData['success'] == 'false') {
					GLOBAL.APP.CF.alert('Error: ' + jsonData['error'], "error");
					return;
				} else {
					if (jsonData.showResult) {
						var html = '';
						for ( var i = 0; i < jsonData.showResult.length; i++) {
							html = html + jsonData.showResult[i] + '<br>';
						}
						Ext.Msg.alert('Result:', html);
					}

					me.oprLoadGridData();
				}
			}
		});
	},
	__oprGetJobData : function(oDataKind) {

		var me = this;
		var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "JobID");
		me.getContainer().body.mask("Wait ...");
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'JobMonitor/jobData',
			method : 'POST',
			params : {
				data_kind : oDataKind,
				id : oId
			},
			scope : me,
			success : function(response) {

				me.getContainer().body.unmask();
				var jsonData = Ext.JSON.decode(response.responseText);

				if (jsonData["success"] == "true") {

					if (oDataKind == "getJDL") {
						// text
						me.__oprPrepareAndShowWindowText(jsonData["result"], "JDL for JobID:" + oId);

					} else if (oDataKind == "getBasicInfo") {
						// grid
						me.__oprPrepareAndShowWindowGrid(jsonData["result"], "Attributes for JobID:" + oId, [ "name", "value" ], [ {
							text : 'Name',
							flex : 1,
							sortable : false,
							dataIndex : 'name'
						}, {
							text : 'Value',
							flex : 1,
							sortable : false,
							dataIndex : 'value'
						} ]);

					} else if (oDataKind == "getParams") {
						// grid
						me.__oprPrepareAndShowWindowGrid(jsonData["result"], "Parameters for JobID:" + oId, [ "name", "value" ], [ {
							text : 'Name',
							flex : 1,
							sortable : false,
							dataIndex : 'name'
						}, {
							text : 'Value',
							flex : 1,
							sortable : false,
							dataIndex : 'value'
						} ]);

					} else if (oDataKind == "getLoggingInfo") {
						// grid
						me.__oprPrepareAndShowWindowGrid(jsonData["result"], "Attributes for JobID:" + oId, [ "status", "minor_status", "app_status", "date_time", "source" ], [ {
							text : 'Source',
							flex : 1,
							sortable : false,
							dataIndex : 'source'
						}, {
							text : 'Status',
							flex : 1,
							sortable : false,
							dataIndex : 'status'
						}, {
							text : 'Minor Status',
							flex : 1,
							sortable : false,
							dataIndex : 'minor_status'
						}, {
							text : 'Application Status',
							flex : 1,
							sortable : false,
							dataIndex : 'app_status'
						}, {
							text : 'Date Time',
							flex : 1,
							sortable : false,
							dataIndex : 'date_time'
						} ]);

					} else if (oDataKind == "getStandardOutput") {
						// text
						me.__oprPrepareAndShowWindowText(jsonData["result"], "Standard output for JobID:" + oId);
					} else if (oDataKind == "getLogURL") {
						// ?

					} else if (oDataKind == "getPending") {
						// ?

					} else if (oDataKind == "getStagerReport") {
						// ?

					} else if (oDataKind == "getPilotStdOut") {
						// text
						me.__oprPrepareAndShowWindowText(jsonData["result"], "Pilot StdOut for JobID:" + oId);

					} else if (oDataKind == "getPilotStdErr") {
						// text
						me.__oprPrepareAndShowWindowText(jsonData["result"], "Pilot StdErr for JobID:" + oId);

					}

				} else {

					GLOBAL.APP.CF.alert(jsonData["error"], "error");

				}

			}
		});
	},
	__oprPrepareAndShowWindowText : function(sTextToShow, sTitle) {

		var me = this;

		var oWindow = me.getContainer().createChildWindow(sTitle, false, 700, 500);

		var oTextArea = new Ext.create('Ext.form.field.TextArea', {
			value : sTextToShow,
			cls : "jm-textbox-help-window"

		});

		oWindow.add(oTextArea);
		oWindow.show();

	},
	__oprPrepareAndShowWindowGrid : function(oData, sTitle, oFields, oColumns) {

		var me = this;

		var oStore = new Ext.data.ArrayStore({
			fields : oFields,
			data : oData
		});

		var oWindow = me.getContainer().createChildWindow(sTitle, false, 700, 500);

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

	__getSandbox : function(sId, sType) {

		var me = this;

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'JobMonitor/getSandbox',
			params : {
				jobID : sId,
				sandbox : sType,
				check : 1
			},
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);

				if (response["success"] == "true") {

					var sUrl = GLOBAL.BASE_URL + 'JobMonitor/getSandbox?jobID=' + sId + '&sandbox=' + sType;
					window.open(sUrl, 'Input Sandbox file', 'width=400,height=200');

				} else {

					GLOBAL.APP.CF.alert(response["error"], "error");

				}

			},
			failure : function(response) {
				Ext.dirac.system_info.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			}
		});

	}

});
