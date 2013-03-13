/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext
		.define(
				'DIRAC.AccountingPlot.classes.AccountingPlot',
				{
					extend : 'Ext.dirac.core.Module',

					requires : [ 
					             'Ext.util.*', 
					             'Ext.panel.Panel',
					             "Ext.form.field.Text",
					             "Ext.button.Button",
					             "Ext.menu.Menu",
					             "Ext.form.field.ComboBox",
					             "Ext.layout.*",
					             "Ext.form.field.Date",
					             "Ext.form.field.TextArea",
					             "Ext.form.field.Checkbox",
					             "Ext.form.FieldSet",
					             "Ext.Button"],					
					             
					loadState : function(data) {
						
					},

					getStateData : function() {
						
						
						var me = this;
						var oReturn = {};
						
						return oReturn;

					},
					            
					initComponent : function() {
						
						var me = this;
						me.launcher.title = "Accounting Plot";
						
						/*
						 * -----------------------------------------------------------------------------------------------------------
						 * DEFINITION OF THE LEFT PANEL
						 * -----------------------------------------------------------------------------------------------------------
						 */
						
						me.leftPanel = new Ext.create('Ext.panel.Panel',{
						    title: 'Selectors',
						    region:'west',
						    floatable: false,
						    margins: '0',
						    width: 280,
						    minWidth: 230,
						    maxWidth: 350,
						    bodyPadding: 5,
						    layout:'anchor'
						});
						
						me.descPlotType = {
								data_operation:{
										title:"Data Operation",
										selectionConditions:[
										                     "Operation Type",
										                     "User",
										                     "Execution Site",
										                     "Source Site",
										                     "Destination Site",
										                     "Protocol",
										                     "Final Transfer Status"
										                     ]
									
								},
								job:{
									title:"Job",
									selectionConditions:[
									                     "Job Group",
									                     "Job Type",
									                     "Job Class",
									                     "Site",
									                     "Processing Type",
									                     "Final Major Status",
									                     "Final Minor Status"
									                     ]
								
								},
								wms_history:{
									title:"WMS History",
									selectionConditions:[
									                     "User",
									                     "User Group",
									                     "Major Status",
									                     "Minor Status",
									                     "Application Status",
									                     "Site",
									                     "Job Group",
									                     "Job Split Type"
									                     ]
								
								},
								pilot:{
									title:"Pilot",
									selectionConditions:[
									                     "Site",
									                     "Grid CE",
									                     "Grid Middleware",
									                     "Grid Resource Broker",
									                     "Grid Status"
									                     ]
								
								},
								srm_space_token_dep:{
									title:"SRM Space Token Deployment",
									selectionConditions:[
									                     "Site",
									                     "Hostname",
									                     "Space Token Description",
									                     ]
								
								}
								
						};
						
						me.cmbDomain = Ext.create('Ext.form.field.ComboBox', {
						    fieldLabel: "Domain",
						    queryMode: 'local',
						    labelAlign:'top',
						    //width:260,
						    displayField: "text",
						    valueField: "value",
						    anchor:'100%',
						    store:new Ext.data.SimpleStore({
							        fields:['value','text'],
							        data:[["data_operation","Data Operation"],
							              ["job","Job"],
							              ["wms_history","WMS History"],
							              ["pilot","Pilot"],
							              ["srm_space_token_dep","SRM Space Token Deployment"]]
							      })
						});
						
						
						me.cmbPlotGenerate = Ext.create('Ext.form.field.ComboBox', {
						    fieldLabel: "Plot To Generate",
						    queryMode: 'local',
						    labelAlign:'top',
						    displayField: "text",
						    valueField: "value",
						    anchor: '100%'
						});
						
						me.cmbGroupBy = Ext.create('Ext.form.field.ComboBox', {
						    fieldLabel: "Group By",
						    queryMode: 'local',
						    labelAlign:'top',
						    displayField: "text",
						    valueField: "value",
						    anchor: '100%'
						});
						
						
						me.fsetTimeSpan = Ext.create('Ext.form.FieldSet', {
							 title: 'Time Span',
							 collapsible: true,
							 layout: 'anchor'
						}); 
						
						
						me.cmbTimeSpan = Ext.create('Ext.form.field.ComboBox', {
						    queryMode: 'local',
						    displayField: "text",
						    valueField: "value",
						    anchor: '100%',
						    store:new Ext.data.SimpleStore({
						        fields:['value','text'],
						        data:[["last_day","Last Day"],
						              ["last_week","Last Week"],
						              ["last_month","Last Month"],
						              ["manual","Manual Selection"],
						              ["by_quarter","By Quarter"]]
						      })
						}); 
						
						me.calendarFrom = new Ext.create('Ext.form.field.Date',{
							width:100,
							format:'Y-m-d',
							fieldLabel: "Initial Date",
							labelAlign:'top'
							
						});
						
						me.calendarTo = new Ext.create('Ext.form.field.Date',{
							width:100,
							format:'Y-m-d',
							fieldLabel: "End Date",
							labelAlign:'top'
						});
						
						me.fsetTimeSpan.add([me.cmbTimeSpan,me.calendarFrom,me.calendarTo]);
						
						
						me.fsetAdvanced = Ext.create('Ext.form.FieldSet', {
							 title: 'Advanced Options',
							 collapsible: true,
							 layout: 'anchor'
						}); 
						
						me.advancedPilotTitle = Ext.create('Ext.form.field.Text',{
							
							fieldLabel: "Pilot Title",
						    labelAlign:'top',
						    anchor:"100%"
						});
						
						me.advancedPin = Ext.create('Ext.form.field.Checkbox',{
							 boxLabel  : 'Pin Dates'
						});
							
						me.advancedNotScaleUnits = Ext.create('Ext.form.field.Checkbox',{
							 boxLabel  : 'Do not scale units'
						});
						
						me.fsetAdvanced.add([me.advancedPilotTitle,
						                     me.advancedPin,
						                     me.advancedNotScaleUnits]);
						
						me.leftPanel.add([me.cmbDomain,
						                  me.cmbPlotGenerate,
						                  me.cmbGroupBy,
						                  me.fsetTimeSpan, 
						                  me.fsetAdvanced]);
						
						me.btnPlot = new Ext.Button({
							
							text: 'Plot',
							margin:3,
							iconCls:"jm-submit-icon",
							handler: function() {
								
							},
							scope:me
							
						});
						
						me.btnPlotNewTab = new Ext.Button({
							
							text: 'Plot in new tab',
							margin:3,
							iconCls:"jm-reset-icon",
							handler: function() {
								
							},
							scope:me
							
						});
						
						me.btnReset = new Ext.Button({
							
							text: 'Reset',
							margin:3,
							iconCls:"jm-refresh-icon",
							handler: function() {
								
							},
							scope:me
							
						});
						
						me.btnRefresh = new Ext.Button({
							
							text: 'Refresh',
							margin:3,
							iconCls:"jm-refresh-icon",
							handler: function() {
								
							},
							scope:me
							
						});
						
						var oPanelButtons = new Ext.create('Ext.panel.Panel',{
							bodyPadding: 5,
						    autoHeight:true,
						    border:false,
							items:[me.btnPlot,
							       me.btnPlotNewTab,
							       me.btnReset,
							       me.btnRefresh]
						});
						
						me.leftPanel.add(oPanelButtons);
						
						/*
						 * -----------------------------------------------------------------------------------------------------------
						 * DEFINITION OF THE MAIN CONTAINER
						 * -----------------------------------------------------------------------------------------------------------
						 */
						Ext.apply(me, {
							layout : 'border',
							bodyBorder: false,
							defaults: {
							    collapsible: true,
							    split: true
							},
							items : [ me.leftPanel ]
						});

						me.callParent(arguments);
						
					}
				});
