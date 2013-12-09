Ext.define('DIRAC.ActivityMonitor.classes.ActivityMonitor', {
	extend : 'Ext.dirac.core.Module',
	requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.form.field.Date",
			"Ext.form.field.TextArea", "Ext.form.field.Checkbox", "Ext.form.FieldSet", "Ext.dirac.utils.DiracMultiSelect", "Ext.util.*", "Ext.toolbar.Toolbar", "Ext.data.Record", 'Ext.Array' ],

	initComponent : function() {

		var me = this;

		if (GLOBAL.VIEW_ID == "desktop") {

			me.launcher.title = "Activity Monitor";
			me.launcher.maximized = true;

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

	buildUI : function() {

		var me = this;

		me.mainPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			layout : 'card',
			region : "center",
			header : false,
			border : false,
			items : []
		});

		me.__buildActivityMonitor();

		me.add([ me.mainPanel ]);

	},

	__buildActivityMonitor : function() {

		var me = this;

		me.activityMonitorDataStore = new Ext.data.JsonStore({

			proxy : {
				type : 'ajax',
				url : GLOBAL.BASE_URL + 'ActivityMonitor/getActivityData',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000
			},
			fields : [ {
				name : 'sources_id',
				type : 'int'
			}, 'sources_site', 'sources_componentType', 'sources_componentLocation', 'sources_componentName', {
				name : 'activities_id',
				type : 'int'
			}, 'activities_name', 'activities_category', 'activities_unit', 'activities_type', 'activities_description', {
				name : 'activities_bucketLength',
				type : 'int'
			}, 'activities_filename', {
				name : 'activities_lastUpdate',
				type : 'float'
			} ],
			remoteSort : true,
			pageSize : 100,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "info");

						if (parseInt(oStore.proxy.reader.rawData["total"], 10) == 0) {

							me.dataStore.removeAll();

						}

					} else {

						me.dataStore.remoteSort = false;
						me.dataStore.sort();
						me.dataStore.remoteSort = true;

					}

				}

			}
		});

		me.activityMonitorToolbar = Ext.create('Ext.toolbar.Paging', {
			store : me.activityMonitorDataStore,
			displayInfo : true,
			displayMsg : 'Displaying topics {0} - {1} of {2}',
			items : [],
			emptyMsg : "No topics to display",
			// prependButtons : true,
			layout : {
				overflowHandler : 'Scroller'
			}
		});

		var sCheckboxDefinition = "";
		sCheckboxDefinition += '<input type="checkbox" value="" onchange="';
		sCheckboxDefinition += 'var oChecked=this.checked;';
		sCheckboxDefinition += 'var oElems=Ext.query(\'#' + me.id + ' input.checkrow\');';
		sCheckboxDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
		sCheckboxDefinition += '" class="jm-main-check-box"/>';

		me.activityMonitorPanel = Ext.create('Ext.grid.Panel', {
			store : me.activityMonitorDataStore,
			header : false,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			columns : [ {
				header : sCheckboxDefinition,
				name : 'checkBox',
				width : 26,
				sortable : false,
				dataIndex : 'source_id',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererChkBox(value);
				},
				hideable : false,
				fixed : true,
				menuDisabled : true,
				align : "center"
			}, {
				header : "Site",
				sortable : true,
				dataIndex : 'sources_site'
			}, {
				header : "Component Type",
				sortable : true,
				dataIndex : 'sources_componentType'
			}, {
				header : "Location",
				sortable : true,
				dataIndex : 'sources_componentLocation'
			}, {
				header : "Component name",
				sortable : true,
				dataIndex : 'sources_componentName'
			}, {
				header : "Activity name",
				sortable : true,
				dataIndex : 'activities_name'
			}, {
				header : "Category",
				sortable : true,
				dataIndex : 'activities_category'
			}, {
				header : "Unit",
				sortable : true,
				dataIndex : 'activities_unit'
			}, {
				header : "Activity type",
				sortable : true,
				dataIndex : 'activities_type'
			}, {
				header : "Description",
				sortable : true,
				dataIndex : 'activities_description'
			}, {
				header : "Bucket size",
				sortable : true,
				dataIndex : 'activities_bucketLength'
			}, {
				header : "File",
				sortable : true,
				dataIndex : 'activities_filename'
			}, {
				header : "Last update",
				sortable : true,
				dataIndex : 'activities_lastUpdate',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.renderLastUpdate(value, metaData, record, row, col, store, gridView);
				}
			} ],
			rendererChkBox : function(val) {
				return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
			},
			renderLastUpdate : function(value, metadata, record, rowIndex, colIndex, store) {
				var lastUpdated = record.data.activities_lastUpdate;
				var timeLimit = 86400 * 30;
				if (lastUpdated > timeLimit)
					lastUpdated = timeLimit;
				var green = parseInt(200 * (timeLimit - lastUpdated) / timeLimit);
				var red = parseInt(200 * (lastUpdated) / timeLimit);
				return '<span style="color: rgb(' + red + ',' + green + ',0);">' + lastUpdated + '</span>';
			},
			tbar : me.activityMonitorToolbar
		});

		me.mainPanel.add([ me.activityMonitorPanel ]);

	},

	__buildPlotManagement : function() {

	},

	__buildPlotViewer : function() {

		var me = this;

		me.plotViewerMainPanel = new Ext.create('Ext.panel.Panel', {
			title : 'Views',
			floatable : false,
			layout : 'border',
			header : false,
			border : false,
			items : []
		});

		me.plotViewerListStorePanel = new Ext.data.JsonStore({

			proxy : {
				type : 'ajax',
				url : GLOBAL.BASE_URL + 'ActivityMonitor/getActivityData',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000
			},
			fields : [ "name" ],
			remoteSort : true,
			pageSize : 100,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "info");

					}
				}

			}
		});

		me.plotViewerListPanel = Ext.create('Ext.grid.Panel', {
			store : me.plotViewerListStorePanel,
			header : false,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			columns : [ {
				header : "Click on a view to plot it",
				sortable : true,
				dataIndex : 'name'
			} ],
			listeners : {

				cellclick : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
					
					me.plotViewerResultPanel.removeAll();
					var oNewPlots = me.__buildPlotView(record.get("name"), "");
					me.plotViewerResultPanel.add(oNewPlots);
					
				}

			}

		});

		me.plotViewerResultPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			region : "center",
			header : false,
			border : false,
			items : []
		});

		me.plotViewerMainPanel.add([ me.plotViewerListPanel, me.plotViewerResultPanel ]);
		me.add([me.plotViewerMainPanel]);

	},

	__buildPlotView : function(sViewId, sVariableData) {

		var me = this;

		var oMainPanel = new Ext.create('Ext.panel.Panel', {
			title : 'Activity view options',
			floatable : false,
			layout : 'border',
			header : false,
			border : false,
			items : [],
			viewId : sViewId
		});

		var oLeftPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			region : "west",
			header : false,
			border : false,
			width : 300,
			items : []
		});

		var oRightPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			region : "center",
			header : false,
			border : false,
			items : []
		});

		var oCalenFrom = new Ext.create('Ext.form.field.Date', {
			width : 100,
			format : 'Y-m-d',
			fieldLabel : "From",
			labelAlign : "left",
			hidden : true
		});

		var oCalenTo = new Ext.create('Ext.form.field.Date', {
			width : 100,
			format : 'Y-m-d',
			fieldLabel : "To",
			labelAlign : "left",
			hidden : true
		});

		var oTimeSpan = new Ext.create('Ext.form.field.ComboBox', {
			labelAlign : 'left',
			fieldLabel : 'Time Span',
			store : new Ext.data.SimpleStore({
				fields : [ 'value', 'text' ],
				data : [ [ 3600, "Last Hour" ], [ 86400, "Last Day" ], [ 604800, "Last Week" ], [ 2592000, "Last Month" ], [ -1, "Manual Selection" ] ]
			}),
			displayField : "text",
			valueField : "value",
			anchor : "100%",
			value : 1,
			listeners : {
				change : function(field, newValue, oldValue, eOpts) {

					oCalenFrom.hide();
					oCalenTo.hide();

					switch (newValue) {

					case -1:
						oCalenFrom.show();
						oCalenTo.show();
						break;
					}

				}
			}
		});

		var oPlotSize = new Ext.create('Ext.form.field.ComboBox', {
			labelAlign : 'left',
			fieldLabel : 'Plot Size',
			store : new Ext.data.SimpleStore({
				fields : [ 'value', 'text' ],
				data : [ [ 0, "Small" ], [ 1, "Medium" ], [ 2, "Big" ], [ 3, "Very Big" ] ]
			}),
			displayField : "text",
			valueField : "value",
			anchor : "100%",
			value : 1
		});

		oLeftPanel.add([ oTimeSpan, oCalenFrom, oCalenTo, oPlotSize ]);

		var oToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'bottom',
			layout : {
				pack : 'center'
			},
			items : []
		});

		var oSubmitBtn = new Ext.Button({

			text : 'Submit',
			margin : 3,
			iconCls : "dirac-icon-submit",
			handler : function() {

				var oParams = {};

				oParams["id"] = sViewId;

				if (oTimeSpan.getValue() == -1) {

					if (Ext.util.Format.trim(oCalenFrom.getValue()) == "") {
						GLOBAL.APP.CF.alert("Select a from date", "warning");
						return;
					}

					if (Ext.util.Format.trim(oCalenTo.getValue()) == "") {
						GLOBAL.APP.CF.alert("Select a to date", "warning");
						return;
					}

					oParams["timespan"] = -1;
					oParams["fromDate"] = oCalenFrom.getValue();
					oParams["toDate"] = oCalenTo.getValue();

				} else {

					oParams["timespan"] = oTimeSpan.getValue();

				}

				oParams["size"] = oPlotSize.getValue();

				Ext.Ajax.request({
					url : GLOBAL.BASE_URL + 'ActivityMonitor/plotView',
					params : oParams,
					scope : me,
					success : function(response) {

						var me = this;
						var response = Ext.JSON.decode(response.responseText);

						if (response.success == "true") {

							var plotsList = response.data;
							if (plotsList.length) {
								var panelEl = oRightPanel.getEl();
								var child = panelEl.first();
								while (child) {
									child.remove();
									child = panelEl.first();
								}
								panelEl.clean(true);
								for ( var i = 0; i < plotsList.length; i++) {
									var imgEl = document.createElement('img');
									imgEl.src = "getPlotImg?file=" + plotsList[i];
									imgEl.id = plotsList[i];
									var extEl = new Ext.Element(imgEl);
									extEl.setStyle("margin", "1px");
									extEl.setStyle("display", "block");
									panelEl.appendChild(extEl);
								}
								// var img = panelEl.first('img');
								// img.addListener('load', this.__resizeMainPanel, this,
								// panelEl);

							}

						} else {

							GLOBAL.APP.CF.alert(response.error, "warning");

						}
					}
				});
			}
		});

		var oResetBtn = new Ext.Button({

			text : 'Reset',
			margin : 3,
			iconCls : "dirac-icon-reset",
			handler : function() {
			}
		});

		oToolbar.add([ oSubmitBtn, oResetBtn ]);

		oLeftPanel.addDocked([ oToolbar ]);

		oMainPanel.add([ oLeftPanel, oRightPanel ]);

		return oMainPanel;

	}

});
