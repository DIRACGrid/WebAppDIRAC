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

    requires : [ 'Ext.util.*',
                 'Ext.panel.Panel',
                 "Ext.form.field.Text", "Ext.button.Button",
                 "Ext.menu.Menu", "Ext.form.field.ComboBox",
                 "Ext.layout.*", "Ext.form.field.Date",
                 "Ext.form.field.TextArea",
                 "Ext.form.field.Checkbox", "Ext.form.FieldSet",
                 "Ext.Button", "Ext.dirac.utils.DiracMultiSelect",
                 "Ext.ux.form.MultiSelect",
                 "Ext.util.*",
                 "Ext.toolbar.Toolbar",
                 "Ext.dirac.utils.DiracBoxSelect","Ext.form.field.Text",
                 "Ext.Img",
                 "Ext.form.*"],

					loadState : function(oData) {
						
						var me = this;
						
						var oWins = oData.childWindows;
						var oFirstWindow = null;
						
						for(var i=0;i<oWins.length;i++){
							
							var oItem = oWins[i];
							
							me.__generatePlot(null, oItem);
							
							
							
						}

					},
					
					
					
					getStateData : function() {

						var me = this;
						var oReturn = {};

						var oWins = me.getContainer().childWindows;
						
						oReturn.childWindows = [];
						
						for(var i=0;i<oWins.length;i++){
							
							var oPos = oWins[i].getPosition();
							
							var oItem = {
									
									params: oWins[i].items.getAt(0).plotParams,
									position_x: oPos[0],
									position_y: oPos[1],
									width: oWins[i].getWidth(),
									height: oWins[i].getHeight(),
									title: oWins[i].title
									
							};
							
							oReturn.childWindows.push(oItem);
							
						}
						
						return oReturn;

					},
					
					initComponent : function() {

						var me = this;
						me.launcher.title = "Accounting Plot";
						me.launcher.width = 350;
						
						var oDimensions = _app.getDesktopDimensions();
						
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
											fieldLabel : "Category",
											queryMode : 'local',
											labelAlign : 'top',
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
													
														if(newValue==null)
															return;
														
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

							text : 'New',
							margin : 3,
							iconCls : "accp-submit-icon",
							handler : function() {
								me.__generatePlot(null,null);	
							},
							scope : me

						});

						me.btnReset = new Ext.Button({

							text : 'Reset',
							margin : 3,
							iconCls : "accp-reset-icon",
							handler : function() {
								
								me.cmbGroupBy.setValue(null);
								me.cmbPlotGenerate.setValue(null);
								me.calendarFrom.setValue(null);
								me.calendarTo.setValue(null);
								me.cmbTimeSpan.setValue(86400);
								
								me.advancedPin.setValue(false);	
								me.advancedNotScaleUnits.setValue(false);
								me.advancedPlotTitle.setValue("");
								me.fsetSpecialConditions.removeAll();
								me.cmbDomain.setValue(null);
								
								
							},
							scope : me

						});

						me.btnRefresh = new Ext.Button({

							text : 'Refresh',
							margin : 3,
							iconCls : "accp-refresh-icon",
							handler : function() {
								
								me.leftPanel.body.mask("Wait ...");
								Ext.Ajax
									.request({
										url : me._baseUrl
												+ 'AccountingPlot/getSelectionData',
										method : 'POST',
										params : {
											type : me.cmbDomain.getValue()
										},
										scope : me,
										success : function(response) {

											var oResult = Ext.JSON
													.decode(response.responseText);

											if (oResult["success"] == "true")
												me.applySpecialConditions(oResult);
											else
												alert(oResult["error"]);
											me.leftPanel.body.unmask();
										}
									});
								
							},
							scope : me

						});
						
						/*
						 * This button is used to refresh any previously selected plot
						 * that is already generated.
						 * */
						me.btnRefreshPlot = new Ext.Button({

							text : 'Update',
							margin : 3,
							iconCls : "accp-refresh-icon",
							handler : function() {
								me.__generatePlot(me.__childWindowFocused,null);
							},
							scope : me

						});
						
						var oPanelButtons = new Ext.create('Ext.toolbar.Toolbar',{
							items:[me.btnPlot, me.btnRefreshPlot , me.btnReset, me.btnRefresh],
							dock: 'bottom'
						});
						
						me.leftPanel.addDocked(oPanelButtons);
						
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
					__resetSelectionWindow:function(){
						
						var me = this;
						
						me.cmbGroupBy.setValue(null);
						me.cmbPlotGenerate.setValue(null);
						me.calendarFrom.setValue(null);
						me.calendarTo.setValue(null);
						me.cmbTimeSpan.setValue(86400);
						
						me.advancedPin.setValue(false);	
						me.advancedNotScaleUnits.setValue(false);
						me.advancedPlotTitle.setValue("");
						me.fsetSpecialConditions.removeAll();
						me.cmbDomain.setValue(null);
						
					},
					applyDataToSelection : function(oData, sValue) {
						
						var me = this;
												
//						var oParentWindow = me.getContainer();
//						
//						oParentWindow["__dirac_destroy"] = function(oParentWindow){
//							
//							//var me = this;
//							var oWins = me.getContainer().childWindows;
//							
//							for(var i=0;i<oWins.length;i++){
//								oWins[i].__dirac_activate = null;
//							}
//							
//						};
						
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
					
					applySpecialConditions : function(oData) {

						var me = this;

						var oSelectionData = Ext.JSON.decode(oData["result"]["selectionValues"]);

						for ( var i = 0; i < me.fsetSpecialConditions.items.length; i++) {
							
							var oBox = me.fsetSpecialConditions.items.getAt(i);
							
							
							var oList = oSelectionData[oBox.getName()];
							me.__oprDoubleElementItemList(oList);
							var oNewStore = new Ext.data.SimpleStore(
									{
										fields : [
												'value',
												'text' ],
										data : oList
									});
							
							oBox.refreshStore(oNewStore);
							
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
							
							alert("No category defined !");
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
					
					__getParamsFromSelectionWindow:function(){
						
						var me = this;
						
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
							if(oCondItem.getValue().length != 0)
								oParams["_"+oCondItem.getName()] = ((oCondItem.isInverseSelection())?oCondItem.getInverseSelection():oCondItem.getValue().join(","));
							
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
						
						return [oParams,sTitle];
						
						
					},
					
					__generatePlot : function(oDestinationWindow,oLoadState) {
						
						var me = this;
						
						var oParams = null;
						var sTitle = null;
						
						if(oLoadState == null){
						
							if(!me.__validateConditions())
								return;
							
							var oParamsData = me.__getParamsFromSelectionWindow();
							
							oParams = oParamsData[0];
							sTitle = oParamsData[1];
						}else{
							
							oParams = oLoadState["params"];
							sTitle = oLoadState["title"];
							
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
											
											var oPlotWindow = null;
											
											if(oDestinationWindow==null){
												oPlotWindow = me.getContainer().oprGetChildWindow(sTitle,false, 700, 500);
												me.__childWindowFocused = oPlotWindow;
												
												
												
												/*
												 * when the child window gets the focus,
												 * the accounting plot is filled with
												 * selection data stored in the panel of this window
												 */ 
												oPlotWindow.__dirac_activate=function(oChildWindow){
													
													//var me = this;
													
													me.loadSelectionData(oChildWindow);
													
													//do the indication icon
													
													var oWins = me.getContainer().childWindows;
													
													for(var i=0;i<oWins.length;i++){
														
														oWins[i].setIconCls("accp-child-window-gif-notfocus");
														
													}
													
													oChildWindow.setIconCls("accp-child-window-gif-focus");
													
												};
												
												oPlotWindow.__dirac_destroy=function(oChildWindow){
													
													//var me = this;
													oChildWindow.__dirac_activate = null;
													
//													var oWins = me.getContainer().childWindows;
//													var oFirstNonMe = null;
//													
//													for(var i=0;i<oWins.length;i++){
//														
//														
//														if(oWins[i].id!=oChildWindow.id){
//															oWins[i].setIconCls("accp-child-window-gif-notfocus");
//															if(oFirstNonMe==null)
//																oFirstNonMe=oWins[i];
//														}
//														
//													}
//													
//													oFirstNonMe.setIconCls("accp-child-window-gif-focus");
													
												};
												
												
												oPlotWindow.on("resize",function(oChildWindow,iWidth,iHeight,eOpts){
													
													var oImg=oChildWindow.items.getAt(0).items.getAt(1);
													
													
													
													if(oImg.noResizeAtLoad<2){
														oImg.noResizeAtLoad++;
														return;
													}
													
													
													
													var a = oImg.getWidth();
													var b = oImg.getHeight();
													
													var a1 = iWidth-30;
													var b1 = iHeight-70;
													
													if(b<=b1){
														
														if(a<=a1){
															
															if((a1/a)<=(b1/b)){
																
																oImg.setWidth(a1);
																oImg.setHeight(parseInt(a1/a*b));
																
															}else{
																
																oImg.setHeight(b1);
																oImg.setWidth(parseInt(b1/b*a));
																
															}
															
														}else{
															
															oImg.setWidth(a1);
															oImg.setHeight(parseInt(a1/a*b));
														}
														
														
													}else{
														
														if(a<=a1){
															
															oImg.setHeight(b1);
															oImg.setWidth(parseInt(b1/b*a));
														}else{
															
															if((a1/a)<=(b1/b)){
																
																oImg.setHeight(b1);
																oImg.setWidth(parseInt(b1/b*a));
															}else{
																
																oImg.setWidth(a1);
																oImg.setHeight(parseInt(a1/a*b));
															}
															
															
														}
														
														
													}
													
												},me);
												
											}else
												oPlotWindow = oDestinationWindow;	
											
											var oImg = Ext.create('Ext.Img', {
												noResizeAtLoad:0,
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
												            	if(oLoadState!=null){
																	
																	oPlotWindow.setPosition([oLoadState["position_x"],oLoadState["position_y"]]);
																	oPlotWindow.setWidth(oLoadState["width"]);
																	oPlotWindow.setHeight(oLoadState["height"]);
																	
																}
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
												items:	[
												      	{ xtype:"button",
														  text:"Refresh",
														  handler:function(){
															  
															  var oThisButton = this;
															  var oPanel = oThisButton.up('panel');
															  
															  Ext.Ajax
																.request({
																	url : me._baseUrl
																			+ 'AccountingPlot/generatePlot',
																	params : oPanel.plotParams,
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
															  
														  }
														}
												      	 ,{ xtype:"button",
															menu:oRefreshMenu,
															text:"Auto refresh :  Disabled"
														   },
														   '->'
														   ,
														   "<a target='_blank' href='"+me._baseUrl+"AccountingPlot/getCsvPlotData?"+oHrefParams+"'>CSV data</a>"
												      	 ]
											});
											
											oPlotWindow.removeAll();
											
											var oPanel = new Ext.create('Ext.panel.Panel', {
												autoHeight : true,
												border : false,
												items : [ oToolbar, oImg ],
												plotParams: oParams
											});
											
											oPlotWindow.add(oPanel);
											
											if(oDestinationWindow==null)
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
									me.advancedNotScaleUnits.setValue(true);
								else
									me.advancedNotScaleUnits.setValue(false);	
								
							}else
								me.advancedNotScaleUnits.setValue(false);
							
							for(var i=0;i<me.fsetSpecialConditions.items.length;i++){
								
								me.fsetSpecialConditions.items.getAt(i).setValue(null);
								
							}
							
							
							var oStandardParamsList = ["_grouping","_plotName","_typeName","_timeSelector","_startTime","_endTime", "_plotTitle","_pinDates","_ex_staticUnits"]; 
							
							for(var oParam in oParams){
								
								//first we check whether the param is not someone form the default ones
								var oFound = false;
								
								for(var i=0;i<oStandardParamsList.length;i++){
									
									if(oParam==oStandardParamsList[i]){
										
										oFound = true;
										break;
										
									}
									
								}
								
								
								if(!oFound){
									
									for(var i=0;i<me.fsetSpecialConditions.items.length;i++){
										
									    var oNewUnderlinedName = "_"+me.fsetSpecialConditions.items.getAt(i).getName();
										
										if(oNewUnderlinedName==oParam){
											
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
