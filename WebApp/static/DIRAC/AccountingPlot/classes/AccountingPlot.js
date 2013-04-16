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

					requires : [ 'Ext.util.*', 'Ext.panel.Panel',
							"Ext.form.field.Text", "Ext.button.Button",
							"Ext.menu.Menu", "Ext.form.field.ComboBox",
							"Ext.layout.*", "Ext.form.field.Date",
							"Ext.form.field.TextArea",
							"Ext.form.field.Checkbox", "Ext.form.FieldSet",
							"Ext.Button", "Ext.dirac.utils.DiracMultiSelect",
							"Ext.ux.form.MultiSelect",
							"Ext.util.*"],

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
						me.launcher.width = 300;
						
						var oDimensions = _app.getDesktopDimensions();
						//console.log(oDimensions);
						
						me.launcher.height = oDimensions[1]-50;
						me.launcher.maximized = false;
						

						/*
						 * -----------------------------------------------------------------------------------------------------------
						 * DEFINITION OF THE LEFT PANEL
						 * -----------------------------------------------------------------------------------------------------------
						 */

						me.leftPanel = new Ext.create('Ext.panel.Panel', {
							//title : 'Selectors',
							floatable : false,
							margins : '0',
							minWidth : 230,
							bodyPadding : 5,
							layout : 'anchor',
							autoScroll : true
						});

						me.descPlotType = {
							DataOperation : {
								title : "Data Operation",
								selectionConditions : [
										[ "OperationType", "Operation Type" ],
										[ "User", "User" ],
										[ "ExecutionSite", "Execution Site" ],
										[ "Source", "Source Site" ],
										[ "Destination", "Destination Site" ],
										[ "Protocol", "Protocol" ],
										[ "FinalStatus",
												"Final Transfer Status" ] ]

							},
							Job : {
								title : "Job",
								selectionConditions : [
										[ "JobGroup", "Job Group" ],
										[ "JobType", "Job Type" ],
										[ "JobClass", "Job Class" ],
										[ "Site", "Site" ],
										[ "ProcessingType", "Processing Type" ],
										[ "FinalMajorStatus",
												"Final Major Status" ],
										[ "FinalMinorStatus",
												"Final Minor Status" ],
										[ "User", "User" ],
										[ "UserGroup", "User Group" ] ]

							},
							WMSHistory : {
								title : "WMS History",
								selectionConditions : [
										[ "User", "User" ],
										[ "UserGroup", "User Group" ],
										[ "Status", "Major Status" ],
										[ "MinorStatus", "Minor Status" ],
										[ "ApplicationStatus",
												"Application Status" ],
										[ "Site", "Site" ],
										[ "JobGroup", "Job Group" ],
										[ "JobSplitType", "Job Split Type" ] ]

							},
							Pilot : {
								title : "Pilot",
								selectionConditions : [
										[ "User", "User" ],
										[ "UserGroup", "User Group" ],
										[ "Site", "Site" ],
										[ "GridCE", "Grid CE" ],
										[ "GridMiddleware", "Grid Middleware" ],
										[ "GridResourcesBroker",
												"Grid Resource Broker" ],
										[ "GridStatus", "Grid Status" ] ]

							},
							SRMSpaceTokenDeployment : {
								title : "SRM Space Token Deployment",
								selectionConditions : [
										[ "Site", "Site" ],
										[ "Hostname", "Hostname" ],
										[ "SpaceTokenDesc",
												"Space Token Description" ], ]

							}

						};
						
						me.cmbDomain = Ext
								.create(
										'Ext.form.field.ComboBox',
										{
											fieldLabel : "Domain",
											queryMode : 'local',
											labelAlign : 'top',
											// width:260,
											displayField : "text",
											valueField : "value",
											anchor : '100%',
											store : new Ext.data.SimpleStore(
													{
														fields : [ 'value',
																'text' ],
														data : [
																[
																		"DataOperation",
																		"Data Operation" ],
																[ "Job", "Job" ],
																[ "WMSHistory",
																		"WMS History" ],
																[ "Pilot",
																		"Pilot" ],
																[
																		"SRMSpaceTokenDeployment",
																		"SRM Space Token Deployment" ] ]
													}),
											listeners : {
												change : function(field,
														newValue, oldValue,
														eOpts) {

														me.leftPanel.body.mask("Wait ...");
														Ext.Ajax
															.request({
																url : me._baseUrl
																		+ 'AccountingPlot/getSelectionData',
																method : 'POST',
																params : {
																	type : newValue
																},
																scope : me,
																success : function(
																		response) {

																	var oResult = Ext.JSON
																			.decode(response.responseText);

																	if (oResult["success"] == "true")
																		me.applyDataToSelection(oResult,newValue);
																	else
																		alert(oResult["error"]);
																	me.leftPanel.body.unmask();
																}
															});

												}
											}
										});

						me.cmbPlotGenerate = Ext.create(
								'Ext.form.field.ComboBox', {
									fieldLabel : "Plot To Generate",
									queryMode : 'local',
									labelAlign : 'top',
									displayField : "text",
									valueField : "value",
									anchor : '100%'
								});

						me.cmbGroupBy = Ext.create('Ext.form.field.ComboBox', {
							fieldLabel : "Group By",
							queryMode : 'local',
							labelAlign : 'top',
							displayField : "text",
							valueField : "value",
							anchor : '100%'
						});

						me.fsetTimeSpan = Ext.create('Ext.form.FieldSet', {
							title : 'Time Span',
							collapsible : true,
							layout : 'anchor'
						});

						me.cmbTimeSpan = Ext
								.create(
										'Ext.form.field.ComboBox',
										{
											queryMode : 'local',
											displayField : "text",
											valueField : "value",
											anchor : '100%',
											value: 86400,
											store : new Ext.data.SimpleStore(
													{
														fields : [ 'value',
																'text' ],
														data : [
																[ 86400,
																		"Last Day" ],
																[ 604800,
																		"Last Week" ],
																[ 2592000,
																		"Last Month" ],
																[ -1,
																		"Manual Selection" ],
																[ -2,
																		"By Quarter" ] ]
													})
										});

						me.calendarFrom = new Ext.create('Ext.form.field.Date',
								{
									width : 100,
									format : 'Y-m-d',
									fieldLabel : "Initial Date",
									labelAlign : 'top'

								});

						me.calendarTo = new Ext.create('Ext.form.field.Date', {
							width : 100,
							format : 'Y-m-d',
							fieldLabel : "End Date",
							labelAlign : 'top'
						});

						me.fsetTimeSpan.add([ me.cmbTimeSpan, me.calendarFrom,
								me.calendarTo ]);

						me.fsetSpecialConditions = Ext.create(
								'Ext.form.FieldSet', {
									title : 'Special Conditions',
									collapsible : true,
									layout : 'anchor'
								});

						me.fsetAdvanced = Ext.create('Ext.form.FieldSet', {
							title : 'Advanced Options',
							collapsible : true,
							layout : 'anchor'
						});

						me.advancedPlotTitle = Ext.create(
								'Ext.form.field.Text', {

									fieldLabel : "Pilot Title",
									labelAlign : 'top',
									anchor : "100%"
								});

						me.advancedPin = Ext.create('Ext.form.field.Checkbox',
								{
									boxLabel : 'Pin Dates'
								});

						me.advancedNotScaleUnits = Ext.create(
								'Ext.form.field.Checkbox', {
									boxLabel : 'Do not scale units'
								});

						me.fsetAdvanced.add([ me.advancedPlotTitle,
								me.advancedPin, me.advancedNotScaleUnits ]);

						me.leftPanel.add([ me.cmbDomain, me.cmbPlotGenerate,
								me.cmbGroupBy, me.fsetTimeSpan,
								me.fsetSpecialConditions, me.fsetAdvanced ]);

						me.btnPlot = new Ext.Button({

							text : 'Plot',
							margin : 3,
							iconCls : "jm-submit-icon",
							handler : function() {
								me.__generatePlot();	
							},
							scope : me

						});

						me.btnReset = new Ext.Button({

							text : 'Reset',
							margin : 3,
							iconCls : "jm-refresh-icon",
							handler : function() {

							},
							scope : me

						});

						me.btnRefresh = new Ext.Button({

							text : 'Refresh',
							margin : 3,
							iconCls : "jm-refresh-icon",
							handler : function() {

							},
							scope : me

						});
						
						/*
						 * This button is used to release any related 
						 * plot.
						 * 
						 * */
						me.btnNewPlot = new Ext.Button({

							text : 'New Plot',
							margin : 3,
							iconCls : "jm-refresh-icon",
							handler : function() {

							},
							scope : me

						});

						var oPanelButtons = new Ext.create('Ext.panel.Panel', {
							bodyPadding : 5,
							autoHeight : true,
							border : false,
							items : [ me.btnPlot, me.btnReset, me.btnRefresh ]
						});

						me.leftPanel.add(oPanelButtons);
						
						me.__childWindowFocused = null;
						me.__additionalDataLoad = null;

						/*
						 * -----------------------------------------------------------------------------------------------------------
						 * DEFINITION OF THE MAIN CONTAINER
						 * -----------------------------------------------------------------------------------------------------------
						 */
						Ext.apply(me, {
							layout : 'fit',//'border',
							bodyBorder : false,
							defaults : {
								collapsible : true,
								split : true
							},
							items : [ me.leftPanel ]
						});

						me.callParent(arguments);

					},
					
					applyDataToSelection : function(oData, sValue) {

						var me = this;
						var oList = Ext.JSON.decode(oData["result"]["plotsList"]);
						
						me.__oprDoubleElementItemList(oList);
						
						var oStore = new Ext.data.SimpleStore({
							fields : [ 'value','text' ],
							data : oList
						});
						
						me.cmbPlotGenerate.setValue(null);
						
						me.cmbPlotGenerate.bindStore(oStore);

						var oSelectionData = Ext.JSON.decode(oData["result"]["selectionValues"]);
						
						var oSelectionOptions = me.descPlotType[sValue]["selectionConditions"];

						me.fsetSpecialConditions.removeAll();
						
						var oListForGroup = [];
						
						for ( var i = 0; i < oSelectionOptions.length; i++) {
							
							oListForGroup.push([oSelectionOptions[i][0],oSelectionOptions[i][0]]);
							
							if ((oSelectionOptions[i][0] == "User")
									|| (oSelectionOptions[i][0] == "UserGroup")) {

								// to be taken from _app._cf

							} else {

								var oList = oSelectionData[oSelectionOptions[i][0]];
								me.__oprDoubleElementItemList(oList);

								var oMultiList = Ext
										.create(
												'Ext.dirac.utils.DiracBoxSelect',
												{
													fieldLabel : oSelectionOptions[i][1],
													displayField : "text",
													valueField : "value",
													anchor : '100%',
													store : new Ext.data.SimpleStore(
															{
																fields : [
																		'value',
																		'text' ],
																data : oList
															}),
													labelAlign : 'top',
													name: oSelectionOptions[i][0]
												});

								me.fsetSpecialConditions.add(oMultiList);

							}

						}
						
						var oStore = new Ext.data.SimpleStore({
							fields : [ 'value','text' ],
							data : oListForGroup
						});
						
						me.cmbGroupBy.setValue(null);
						
						me.cmbGroupBy.bindStore(oStore);
						
						//we call the additional function
						if(me.__additionalDataLoad!=null){
							me.__additionalDataLoad();
							me.__additionalDataLoad = null;
						}

					},

					__oprDoubleElementItemList : function(oList) {

						for ( var i = 0; i < oList.length; i++)
							oList[i] = [ oList[i], oList[i] ];

					},
				
					__validateConditions:function(){
						
						var me = this;
						var bValid = true;
						
						//check if the plot type is chosen
						if((me.cmbDomain.getValue()==null)||(Ext.util.Format.trim(me.cmbDomain.getValue())=="")){
							
							alert("No domain defined !");
							bValid = false;
							
						}else if((me.cmbPlotGenerate.getValue()==null)||(Ext.util.Format.trim(me.cmbPlotGenerate.getValue())=="")){
							
							alert("No plot type defined !");
							bValid = false;
							
						}else if((me.cmbGroupBy.getValue()==null)||(Ext.util.Format.trim(me.cmbGroupBy.getValue())=="")){
							
							alert("No data grouping defined !");
							bValid = false;
							
						}
						
						return bValid;
						
					},
					
					__generatePlot : function(oDestination) {
						
						var me = this;
						
						if(!me.__validateConditions())
							return;
						
						var sDomain = me.cmbDomain.getValue();
						
						var oParams = {
								
								_grouping:me.cmbGroupBy.getValue(),
								_plotName:me.cmbPlotGenerate.getValue(),
								_typeName:sDomain
								
						};
						
						var sTitle = me.cmbDomain.getDisplayValue()+" :: "+me.cmbPlotGenerate.getDisplayValue()+" :: GROUP BY : "+me.cmbGroupBy.getDisplayValue();
						
						//Time Selector
						
						iTimeSpan = me.cmbTimeSpan.getValue();
						
						if(iTimeSpan == -1){
							
							oParams._timeSelector = -1;
							
							oParams._startTime = me.calendarFrom.getValue();
							oParams._endTime = me.calendarTo.getValue(); 
							
						}else if(iTimeSpan == -2){
							
							oParams._timeSelector = -2;
							
						}else{
							
							oParams._timeSelector = iTimeSpan;
							
						}
						
						//Special condition selection
						for(var i=0;i<me.fsetSpecialConditions.items.length;i++){
							
							var oCondItem = me.fsetSpecialConditions.items.getAt(i);
							oParams[oCondItem.getName()] = ((oCondItem.isInverseSelection())?oCondItem.getInverseSelection():oCondItem.getValue().join(","));
							
						}
						
						if(Ext.util.Format.trim(me.advancedPlotTitle.getValue())!=""){
							oParams["_plotTitle"] = me.advancedPlotTitle.getValue();
							sTitle = me.advancedPlotTitle.getValue();
						}
						
						if(me.advancedPin.checked){
							
							oParams["_pinDates"] = "true";
							
						}
						
						if(me.advancedNotScaleUnits.checked){
							
							oParams["_ex_staticUnits"] = "true";
							
						}
						
						Ext.Ajax
								.request({
									url : me._baseUrl
											+ 'AccountingPlot/generatePlot',
									params : oParams,
									scope : me,
									success : function(response) {

										var me = this;
										var response = Ext.JSON
												.decode(response.responseText);
										
										if (response["success"]) {

											/*
											 * This should go into the
											 * container, where we have to load
											 * the image
											 */
											
											
											var oPlotWindow = me.getContainer()
													.oprGetChildWindow(sTitle,
															false, 700, 500);
											
											/*
											 * when the child window gets the focus,
											 * the accounting plot is filled with
											 * selection data stored in the panel of this window
											 */ 
											oPlotWindow.on("activate",function(oChildWindow,oEventObject,eOpts){
												
												var me = this;
												console.log(me);
												me.loadSelectionData(oChildWindow);
												
											},me);
											
											var oImg = Ext.create('Ext.Img', {
												src : me._baseUrl
												+ "AccountingPlot/getPlotImg?file="
														+ response["data"]
														+ "&nocache="
														+ (new Date())
																.getTime(),
												listeners:{
													
													render:function(oElem,eOpts){
														oElem.el.on({
												            load: function (evt, ele, opts) {
												            	oPlotWindow.setWidth(oElem.getWidth()+30);
												            	oPlotWindow.setHeight(oElem.getHeight()+70);
												            	oPlotWindow.setLoading(false);
												            }
											            });
														
														
													}
													
													
												}
												
											});
											var oRefreshMenu = new Ext.menu.Menu({
									  			items : [ { text : 'Disabled', value : 0 },
									  					  { text : 'Each 15m', value : 60000},//900000 },
									  					  { text : 'Each hour', value : 3600000 },
									  					  { text : 'Each day', value : 86400000 }
									  				    ],
									  			listeners : { 
									  				click : function( menu, menuItem, e, eOpts ){
									  					var oPanel = menuItem.parentMenu.up('panel');
									  					
									  					if( menuItem.value == 0 ){
									  						clearInterval(oPanel.refreshTimeout);
										  				}else{
										  					clearInterval(oPanel.refreshTimeout);
										  					oPanel.refreshTimeout = setInterval(function(){
										  						
										  						Ext.Ajax
																.request({
																	url : me._baseUrl
																			+ 'AccountingPlot/generatePlot',
																	params : oParams,
																	success : function(responseImg) {
																		
																		responseImg = Ext.JSON
																				.decode(responseImg.responseText);
																		
																		if (responseImg["success"]) {
										  						
													  						oPanel.items.getAt(1).setSrc(me._baseUrl+ "AccountingPlot/getPlotImg?file="
																					+ responseImg["data"]+ "&nocache="+ (new Date()).getTime());
													  						oPanel.up('window').setLoading('Loading Image ...');
													  						
																		}
																	}
																});
										  						
										  					},menuItem.value);
										  				}
									  					
			  											menuItem.parentMenu.up('button').setText( "Auto refresh : " + menuItem.text );
			  						 				} 
									  			},
									  			plotParams : {}
									  		});
											
											var oHrefParams="";
											
											for(var oParam in oParams){
												
												oHrefParams+=((oHrefParams=="")?"":"&")+oParam+"="+encodeURIComponent(oParams[oParam]);
												
											}
											
											var oToolbar = new Ext.toolbar.Toolbar({
												items:	["<a target='_blank' href='"+me._baseUrl+"AccountingPlot/getCsvPlotData?"+oHrefParams+"'>CSV data</a>"
												      	 ,{ xtype:"button",
															menu:oRefreshMenu,
															text:"Auto refresh :  Disabled"
														   }
												      	 ]
											});
											
											
											var oPanel = new Ext.create('Ext.panel.Panel', {
												autoHeight : true,
												border : false,
												items : [ oToolbar, oImg ],
												plotParams: oParams
											});
											
											oPlotWindow.add(oPanel);
											
											oPlotWindow.show();
											oPlotWindow.setLoading('Loading Image ...');
											

										} else {
											alert(response["errors"]);
										}

									},
									failure : function(response) {

										Ext.example
												.msg("Notification",
														'Operation failed due to a network error.<br/> Please try again later !');
									}
								});

					},
					loadSelectionData: function(oChildWindow){
						//console.log(oChildWindow);
						var me = this;
						
						me.__childWindowFocused = oChildWindow; 
						
						var oParams = oChildWindow.items.getAt(0).plotParams;
						
						me.__additionalDataLoad = function(){
							
							me.cmbGroupBy.setValue(oParams["_grouping"]);
							me.cmbPlotGenerate.setValue(oParams["_plotName"]);
							me.cmbTimeSpan.setValue(oParams["_timeSelector"]);
							
							if(oParams["_timeSelector"]==-1){
								
								me.calendarFrom.setValue(oParams["_startTime"]);
								me.calendarTo.setValue(oParams["_endTime"]);
								
							}
							
							me.advancedPlotTitle.setValue(oParams["_plotTitle"]);
							
							if("_pinDates" in oParams){
								
								if(oParams["_pinDates"]=="true")
									me.advancedPin.setValue(true);	
								else
									me.advancedPin.setValue(false);	
								
							}else
								me.advancedPin.setValue(true);
							
							
							if("_ex_staticUnits" in oParams){
								
								if(oParams["_ex_staticUnits"]=="true")
									me.advancedPin.setValue(true);
								else
									me.advancedPin.setValue(false);	
								
							}else
								me.advancedPin.setValue(false);
							
							
							for(var oParam in oParams){
								
								if(oParam.charAt(0)!='_'){
									
									for(var i=0;i<me.fsetSpecialConditions.items.length;i++){
										
										if(me.fsetSpecialConditions.items.getAt(i).getName()==oParam){
											console.log(oParams[oParam]);
											me.fsetSpecialConditions.items.getAt(i).setValue(oParams[oParam]);
											break;
											
										}
										
									}

								}
								
							}

							
						};
						
						
						if(me.cmbDomain.getValue()==oParams["_typeName"]){
							
							me.__additionalDataLoad();
							me.__additionalDataLoad = null;
							
							
						}
						
						me.cmbDomain.setValue(oParams["_typeName"]);
						
					}

				});
