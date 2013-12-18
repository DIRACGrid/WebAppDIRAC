Ext.define('DIRAC.PilotMonitor.classes.PilotMonitor', {
	extend : 'Ext.dirac.core.Module',

	requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.CheckItem", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.toolbar.Paging",
			"Ext.grid.Panel", "Ext.form.field.Date", "Ext.form.field.TextArea","Ext.dirac.utils.DiracToolButton" ],

	loadState : function(data) {

		var me = this;

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

		for ( var i = 0; i < me.selectorMenu.items.length - 1; i++) {

			var item = me.selectorMenu.items.getAt(i);

			item.setChecked(!data.leftMenu.selectors[item.relatedCmbField].hidden);

			if (!data.leftMenu.selectors[item.relatedCmbField].hidden)
				me.cmbSelectors[item.relatedCmbField].show();
			else
				me.cmbSelectors[item.relatedCmbField].hide();

			/*
			 * this can be done only if the store is being loaded, otherwise has to be
			 * postponed
			 */
			me.__oprPostponedValueSetUntilOptionsLoaded(me.cmbSelectors[item.relatedCmbField], data.leftMenu.selectors[item.relatedCmbField].data_selected, ((i == me.selectorMenu.items.length - 2) ? true
					: false));

			me.cmbSelectors[item.relatedCmbField].setInverseSelection(data.leftMenu.selectors[item.relatedCmbField].not_selected);

		}

		// For the time span searching sub-panel
		var item = me.selectorMenu.items.getAt(me.selectorMenu.items.length - 1);

		item.setChecked(!data.leftMenu.timeSearchPanelHidden);

		if (!data.leftMenu.timeSearchPanelHidden)
			me.timeSearchPanel.show();
		else
			me.timeSearchPanel.hide();
		// END - For the time span searching sub-panel

		me.textTaskQueueId.setValue(data.leftMenu.textTaskQueueId);
		me.textJobReference.setValue(data.leftMenu.textJobReference);
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
		oReturn.leftMenu.textTaskQueueId = me.textTaskQueueId.getValue();
		oReturn.leftMenu.textJobReference = me.textJobReference.getValue();
		oReturn.leftMenu.cmbTimeSpan = me.timeSearchElementsGroup.cmbTimeSpan.getValue();
		oReturn.leftMenu.calenFrom = me.timeSearchElementsGroup.calenFrom.getValue();
		oReturn.leftMenu.cmbTimeFrom = me.timeSearchElementsGroup.cmbTimeFrom.getValue();
		oReturn.leftMenu.calenTo = me.timeSearchElementsGroup.calenTo.getValue();
		oReturn.leftMenu.cmbTimeTo = me.timeSearchElementsGroup.cmbTimeTo.getValue();
		oReturn.leftMenu.timeSearchPanelHidden = me.timeSearchPanel.hidden;

		oReturn.pageSize = me.pagingToolbar.pageSizeCombo.getValue();
		oReturn.leftPanelCollapsed = me.leftPanel.collapsed;

		return oReturn;

	},
	dataFields : [ {
		name : 'Status'
	}, {
		name : 'OwnerGroup'
	}, {
		name : 'LastUpdateTime',
		type : 'date',
		dateFormat : 'Y-m-d H:i:s'
	}, {
		name : 'DestinationSite'
	}, {
		name : 'GridType'
	}, {
		name : 'TaskQueueID'
	}, {
		name : 'CurrentJobID'
	}, {
		name : 'BenchMark',
		type : 'float'
	}, {
		name : 'Broker'
	}, {
		name : 'OwnerDN'
	}, {
		name : 'GridSite'
	}, {
		name : 'PilotID'
	}, {
		name : 'ParentID'
	}, {
		name : 'SubmissionTime',
		type : 'date',
		dateFormat : 'Y-m-d H:i:s'
	}, {
		name : 'PilotJobReference'
	}, {
		name : 'Owner'
	} ],

	initComponent : function() {

		var me = this;

		if (GLOBAL.VIEW_ID == "desktop") {

			me.launcher.title = "Pilot Monitor";
			me.launcher.maximized = false;

			var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

			me.launcher.width = oDimensions[0];
			me.launcher.height = oDimensions[1];

			me.launcher.x = 0;
			me.launcher.y = 0;

		}

		if (GLOBAL.VIEW_ID == "tabs") {

			me.launcher.title = "Pilot Monitor";
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

		me.cmbSelectors = {
			site : null,
			status : null,
			computingElement : null,
			ownerGroup : null,
			owner : null,
			broker : null
		};

		var cmbTitles = {
			site : "Site",
			status : "Status",
			computingElement : "Computing Element",
			ownerGroup : "Owner Group",
			owner : "Owner",
			broker : "Broker"
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

		me.leftPanel.add([ me.cmbSelectors.site, me.cmbSelectors.status, me.cmbSelectors.computingElement, me.cmbSelectors.ownerGroup, me.cmbSelectors.owner, me.cmbSelectors.broker ]);

		me.textTaskQueueId = Ext.create('Ext.form.field.Text', {

			fieldLabel : "Task Queue ID",
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

			}
		});

		me.textJobReference = Ext.create('Ext.form.field.Text', {

			fieldLabel : "Pilot Job Reference",
			labelAlign : 'top',
			anchor : "100%"

		});

		me.leftPanel.add([ me.textTaskQueueId, me.textJobReference ]);

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
			url : GLOBAL.BASE_URL + 'PilotMonitor/getSelectionData',
			params : {

			},
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);

				me.__oprRefreshStoresForSelectors(response, false);

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
				url : GLOBAL.BASE_URL + 'PilotMonitor/getJobData',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000
			},
			fields : me.dataFields,
			autoLoad : true,
			remoteSort : true,
			pageSize : 100,
			dontLoadOnCreation : false,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "error");

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
		me.checkboxFunctionDefinition += '" class="pm-main-check-box"/>';

		me.pagingToolbar = {};
		me.pagingToolbar.updateStamp = new Ext.Button({
			disabled : true,
			// disabledClass:'my-disabled',
			text : 'Updated: -'
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

		me.btnPilotInJobMonitor = new Ext.Button({
			text : '',
			iconCls : "dirac-icon-list",
			handler : function() {

				var me = this;

				var oElems = Ext.query('#' + me.id + ' input.checkrow');

				var oValues = "";
				for ( var i = 0; i < oElems.length; i++) {

					if (oElems[i].checked && (oElems[i].value != '-'))
						oValues += ((oValues == "") ? "" : ",") + oElems[i].value;
				}

				if (oValues != "") {

					if (GLOBAL.VIEW_ID == "desktop") {
						var oSetupData = {};
						var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();
						oSetupData.x = 0;
						oSetupData.y = 0;
						oSetupData.width = oDimensions[0];
						oSetupData.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar.getHeight();
						oSetupData.currentState = "";

						oSetupData.desktopStickMode = 0;
						oSetupData.hiddenHeader = 1;
						oSetupData.i_x = 0;
						oSetupData.i_y = 0;
						oSetupData.ic_x = 0;
						oSetupData.ic_y = 0;

						oSetupData.data = {
							leftMenu : {
								txtJobId : oValues
							}
						};

						GLOBAL.APP.MAIN_VIEW.createNewModuleContainer({
							objectType : "app",
							moduleName : "DIRAC.JobMonitor.classes.JobMonitor",
							setupData : oSetupData
						});
					}
				}

			},
			scope : me,
			tooltip : "Show Jobs in JobMonitor"
		});

		var pagingToolbarItems = [ me.btnPilotInJobMonitor, '->', me.pagingToolbar.updateStamp, '-', 'Items per page: ', me.pagingToolbar.pageSizeCombo, '-' ];

		me.pagingToolbar.toolbar = Ext.create('Ext.toolbar.Paging', {
			store : me.dataStore,
			displayInfo : true,
			displayMsg : 'Displaying topics {0} - {1} of {2}',
			items : pagingToolbarItems,
			emptyMsg : "No topics to display",
			prependButtons : true
		});

		me.contextGridMenu = new Ext.menu.Menu({
			items : [ {
				handler : function() {

					var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "CurrentJobID");
					if (oId != '-') {

						if (GLOBAL.VIEW_ID == "desktop") {
							var oSetupData = {};
							var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();
							oSetupData.x = 0;
							oSetupData.y = 0;
							oSetupData.width = oDimensions[0];
							oSetupData.height = oDimensions[1] - GLOBAL.APP.MAIN_VIEW.taskbar.getHeight();
							oSetupData.currentState = "";

							oSetupData.desktopStickMode = 0;
							oSetupData.hiddenHeader = 1;
							oSetupData.i_x = 0;
							oSetupData.i_y = 0;
							oSetupData.ic_x = 0;
							oSetupData.ic_y = 0;

							var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "CurrentJobID");

							oSetupData.data = {
								leftMenu : {
									txtJobId : oId
								}
							};

							GLOBAL.APP.MAIN_VIEW.createNewModuleContainer({
								objectType : "app",
								moduleName : "DIRAC.JobMonitor.classes.JobMonitor",
								setupData : oSetupData
							});
						}
					}
				},
				text : 'Show Job'
			}, '-', {
				handler : function() {
					me.__oprGetJobData("getPilotOutput");
				},
				text : 'Pilot Output'
			}, {
				handler : function() {
					me.__oprGetJobData("getPilotError");
				},
				text : 'Pilot Error'
			}, {
				handler : function() {
					me.__oprGetJobData("getLoggingInfo");
				},
				text : 'Logging info'
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
				id : 'checkBox',
				width : 26,
				sortable : false,
				dataIndex : 'CurrentJobID',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererChkBox(value);
				},
				hideable : false,
				fixed : true,
				menuDisabled : true,
				align : "center"
			}, {
				header : '',
				width : 26,
				sortable : false,
				dataIndex : 'Status',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererStatus(value);
				},
				hideable : false
			}, {
				header : 'PilotJobReference',
				sortable : true,
				dataIndex : 'PilotJobReference',
				align : 'left',
				flex : 1
			}, {
				header : 'Status',
				sortable : true,
				dataIndex : 'Status',
				align : 'left'
			}, {
				header : 'Site',
				sortable : true,
				dataIndex : 'GridSite',
				align : 'left',
				flex : 1
			}, {
				header : 'ComputingElement',
				sortable : true,
				dataIndex : 'DestinationSite',
				align : 'left',
				flex : 1
			}, {
				header : 'Broker',
				sortable : true,
				dataIndex : 'Broker',
				align : 'left',
				flex : 1
			}, {
				header : 'CurrentJobID',
				sortable : true,
				dataIndex : 'CurrentJobID',
				align : 'left'
			}, {
				header : 'GridType',
				sortable : true,
				dataIndex : 'GridType',
				align : 'left',
				hidden : true
			}, {
				header : 'TaskQueueID',
				sortable : true,
				dataIndex : 'TaskQueueID',
				align : 'left',
				hidden : true
			}, {
				header : 'BenchMark',
				sortable : true,
				dataIndex : 'BenchMark',
				align : 'left',
				hidden : true
			}, {
				header : 'Owner',
				sortable : true,
				dataIndex : 'Owner',
				align : 'left',
				hidden : true
			}, {
				header : 'OwnerDN',
				sortable : true,
				dataIndex : 'OwnerDN',
				align : 'left',
				hidden : true
			}, {
				header : 'OwnerGroup',
				sortable : true,
				dataIndex : 'OwnerGroup',
				align : 'left'
			}, {
				header : 'PilotID',
				sortable : true,
				dataIndex : 'PilotID',
				align : 'left',
				hidden : true
			}, {
				header : 'ParentID',
				sortable : true,
				dataIndex : 'ParentID',
				align : 'left',
				hidden : true
			}, {
				header : 'LastUpdateTime [UTC]',
				sortable : true,
				dataIndex : 'LastUpdateTime',
				align : 'left',
				renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
				width : 150
			}, {
				header : 'SubmissionTime [UTC]',
				sortable : true,
				dataIndex : 'SubmissionTime',
				align : 'left',
				renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
				width : 150
			} ],
			rendererChkBox : function(val) {
				return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
			},
			rendererStatus : function(value) {
				if ((value == 'Done') || (value == 'Completed') || (value == 'Good') || (value == 'Active') || (value == 'Cleared') || (value == 'Completing')) {
					return '<img src="static/DIRAC/PilotMonitor/images/done.gif"/>';
				} else if (value == 'Bad') {
					return '<img src="static/DIRAC/PilotMonitor/images/bad.gif"/>';
				} else if ((value == 'Failed') || (value == 'Bad') || (value == 'Banned') || (value == 'Aborted')) {
					return '<img src="static/DIRAC/PilotMonitor/images/failed.gif"/>';
				} else if ((value == 'Waiting') || (value == 'Stopped') || (value == 'Poor') || (value == 'Probing')) {
					return '<img src="static/DIRAC/PilotMonitor/images/waiting.gif"/>';
				} else if (value == 'Deleted') {
					return '<img src="static/DIRAC/PilotMonitor/images/deleted.gif"/>';
				} else if (value == 'Matched') {
					return '<img src="static/DIRAC/PilotMonitor/images/matched.gif"/>';
				} else if ((value == 'Running') || (value == 'Active') || (value == 'Fair')) {
					return '<img src="static/DIRAC/PilotMonitor/images/running.gif"/>';
				} else if (value == 'NoMask') {
					return '<img src="static/DIRAC/PilotMonitor/images/unknown.gif"/>';
				} else {
					return '<img src="static/DIRAC/PilotMonitor/images/unknown.gif"/>';
				}
			},
			tbar : me.pagingToolbar.toolbar,
			listeners : {

				// cellclick : function(oTable, td, cellIndex, record, tr, rowIndex, e,
				// eOpts) {
				//
				// if (cellIndex != 0) {
				//
				// var oJobId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid,
				// "CurrentJobID");
				// var oStatus = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid,
				// "Status");
				//
				// var items = me.contextGridMenu.items.items;
				//
				// items[0].setDisabled(oJobId == '-');
				// items[2].setDisabled(oStatus != 'Done');
				// items[3].setDisabled(oStatus != 'Done');
				//
				// me.contextGridMenu.showAt(e.xy);
				// }
				//
				// },

				beforecellcontextmenu : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
					e.preventDefault();
					var oJobId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "CurrentJobID");
					var oStatus = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "Status");

					var items = me.contextGridMenu.items.items;

					items[0].setDisabled(oJobId == '-');
					items[2].setDisabled(oStatus != 'Done');
					items[3].setDisabled(oStatus != 'Done');

					me.contextGridMenu.showAt(e.xy);
					return false;
				}

			}
		});

		// me.grid.columns[1].setSortState("DESC");

		/*
		 * -----------------------------------------------------------------------------------------------------------
		 * DEFINITION OF THE MAIN CONTAINER
		 * -----------------------------------------------------------------------------------------------------------
		 */
		me.add([ me.leftPanel, me.grid ]);

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
	},

	__oprRefreshStoresForSelectors : function(oData, bRefreshStores) {

		var me = this;

		var map = [ "computingElement", "broker", "owner", "ownerGroup", "site", "status" ];

		for ( var j = 0; j < map.length; j++) {

			var dataOptions = [];
			for ( var i = 0; i < oData[map[j]].length; i++)
				dataOptions.push([ oData[map[j]][i][0], oData[map[j]][i][0] ]);

			if (bRefreshStores) {

				var oNewStore = new Ext.data.ArrayStore({
					fields : [ 'value', 'text' ],
					data : dataOptions
				});

				me.cmbSelectors[map[j]].refreshStore(oNewStore);

			} else {
				me.cmbSelectors[map[j]].store = new Ext.data.ArrayStore({
					fields : [ 'value', 'text' ],
					data : dataOptions
				});
			}

		}

	},

	__oprValidateBeforeSubmit : function() {

		var me = this;
		var bValid = true;

		if (!me.textTaskQueueId.validate())
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
			url : GLOBAL.BASE_URL + 'PilotMonitor/getSelectionData',
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
	oprLoadGridData : function() {

		var me = this;

		if (me.__oprValidateBeforeSubmit()) {

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
				computingElement : ((me.cmbSelectors.computingElement.isInverseSelection()) ? me.cmbSelectors.computingElement.getInverseSelection() : me.cmbSelectors.computingElement.getValue().join(",")),
				ownerGroup : ((me.cmbSelectors.ownerGroup.isInverseSelection()) ? me.cmbSelectors.ownerGroup.getInverseSelection() : me.cmbSelectors.ownerGroup.getValue().join(",")),
				owner : ((me.cmbSelectors.owner.isInverseSelection()) ? me.cmbSelectors.owner.getInverseSelection() : me.cmbSelectors.owner.getValue().join(",")),
				broker : ((me.cmbSelectors.broker.isInverseSelection()) ? me.cmbSelectors.broker.getInverseSelection() : me.cmbSelectors.broker.getValue().join(",")),

				pilotId : me.textJobReference.getValue(),
				taskQueueId : me.textTaskQueueId.getValue(),
				limit : me.pagingToolbar.pageSizeCombo.getValue(),
				startDate : sStartDate,
				startTime : sStartTime,
				endDate : sEndDate,
				endTime : sEndTime

			};

			// set those data as extraParams in
			me.grid.store.proxy.extraParams = extraParams;
			me.grid.store.currentPage = 1;
			me.grid.store.load();

			var oCheckbox = Ext.query("#" + me.id + " input.pm-main-check-box");
			oCheckbox[0].checked = false;
		}

	},
	oprResetSelectionOptions : function() {

		var me = this;
		me.cmbSelectors.site.setValue([]);
		me.cmbSelectors.status.setValue([]);
		me.cmbSelectors.computingElement.setValue([]);
		me.cmbSelectors.ownerGroup.setValue([]);
		me.cmbSelectors.owner.setValue([]);
		me.cmbSelectors.broker.setValue([]);

		me.textJobReference.setValue("");
		me.textTaskQueueId.setValue("");

	},

	__oprGetJobData : function(oDataKind) {

		var me = this;
		var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "PilotJobReference");

		me.getContainer().body.mask("Wait ...");

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'PilotMonitor/getJobInfoData',
			method : 'POST',
			params : {
				data_kind : oDataKind,
				data : oId
			},
			scope : me,
			success : function(response) {

				me.getContainer().body.unmask();
				var jsonData = Ext.JSON.decode(response.responseText);

				if (jsonData["success"] == "true") {

					if (oDataKind == "getPilotOutput") {

						me.__oprPrepareAndShowWindowText(jsonData["result"], "Pilot Output for Job Reference:" + oId);

					} else if (oDataKind == "getPilotError") {

						me.__oprPrepareAndShowWindowText(jsonData["result"], "Pilot Error for Job Reference:" + oId);

					} else if (oDataKind == "getLoggingInfo") {

						me.__oprPrepareAndShowWindowText(jsonData["result"], "Pilot Logging Info for Job Reference:" + oId);

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
			cls : "pm-textbox-help-window"

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

	}

});
