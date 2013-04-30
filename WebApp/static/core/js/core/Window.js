/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.dirac.core.Window This is a window widget with extended functionality
 * 								such as state management
 * @extend Ext.window.Window
 * 
 */
Ext.define(
			'Ext.dirac.core.Window',
			{
					extend : 'Ext.window.Window',
					requires : [ "Ext.dirac.utils.DiracToolButton", 
					             "Ext.menu.Menu",
					             "Ext.menu.Item",
					             "Ext.form.*",
					             "Ext.LoadMask"],
					
					/**
					 * @property {String} currentState The name of the current active desktop state
					 */             
					currentState : "",
					/**
					 * @property {Object} loadedObject The object of the module loaded within the window
					 */
					loadedObject:null,
					/**
					 * @property {Ext.LoadMask} loadMask The load mask used when a state is being loaded
					 */
					loadMask:null,
					/**
					 * @property {Ext.dirac.core.Desktop} desktop Reference to the desktop object
					 */
					desktop:null,
					
					initComponent:function(){
						
						var me=this;
						
						me.loadMask = new Ext.LoadMask(me,{msg:"Loading ..."});
						
						if(me.loadedObjectType == "app"){
							me.items=[me.loadedObject];
							me.appClassName = me.loadedObject.self.getName();
						}else if(me.loadedObjectType == "link"){
							me.items = [{
						        xtype : "component",
						        autoEl : {
						            tag : "iframe",
						            src : me.linkToLoad
						        }
						    }];
							me.appClassName = "link";
						}
						
						me.childWindows = [];
						me.bStatesLoaded = false;
						
						me.callParent();
						
					},
					
					afterRender:function(){
						
						var me = this;
						me.callParent();
						if(me.loadedObjectType == "app")
							me.setLoadedObject(me.setupData);
						else if(me.loadedObjectType == "link")
							me.setPropertiesWhenLink(me.setupData);
						
						_app.desktop.refreshUrlDesktopState();
						
						
					},
					
					/**
					 * Function to set a state of the loaded object and a state of the window itself
					 * @param {Object} setupData Setup data
					 */
					setLoadedObject:function(setupData){
						
						var me = this;
						
						if(setupData != null){
								
							if("maximized" in setupData){
								if(setupData["maximized"])
									me.maximize();	
							}else if("minimized" in setupData){
								
								if("width" in setupData)
									me.setWidth(parseInt(setupData.width));
							
								if("height" in setupData)
									me.setHeight(parseInt(setupData.height));
								
								me.desktop.minimizeWindow(me);
							
							}else { 
								
								
								
								if("x" in setupData)
									me.setPosition(parseInt(setupData.x),parseInt(setupData.y));

								
								if("width" in setupData)
									me.setWidth(parseInt(setupData.width));
							
								if("height" in setupData)
									me.setHeight(parseInt(setupData.height));

								
								if((!("height" in setupData))&&(!("width" in setupData))){
							
									if(!me.loadedObject.launcher.maximized){
										if("width" in me.loadedObject.launcher){
											
											me.setWidth(me.loadedObject.launcher.width);
											
										}else{
											
											me.setWidth(600);
											
										}
										
										if("height" in me.loadedObject.launcher){
											
											me.setHeight(me.loadedObject.launcher.height);
											
										}else{
											
											me.setHeight(400);
											
										}
									}else{
										
										me.maximize();
										
									}
								
								}
								
							}
							
							if("zIndex" in setupData){
								
								me.setZIndex(setupData.zIndex);
								
							}
							
							if("stateToLoad" in setupData){
								
								me.oprLoadAppStateFromCache(setupData["stateToLoad"]);
								
							}else{
								
								if("data" in setupData){
									
									me.currentState = setupData.currentState;
									me.loadedObject.loadState(setupData.data);
									
								}
								
							}
							
							
						}else{
							
							if(!me.loadedObject.launcher.maximized){
								
								if("width" in me.loadedObject.launcher){
									
									me.setWidth(me.loadedObject.launcher.width);
									
								}else{
									
									me.setWidth(600);
									
								}
								
								if("height" in me.loadedObject.launcher){
									
									me.setHeight(me.loadedObject.launcher.height);
									
								}else{
									
									me.setHeight(400);
									
								}
							}else{
								
								me.maximize();
							}

						}
						
						if(me.currentState == ""){
							
							me.setTitle(me.loadedObject.launcher.title+" [Untitled]");
							me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title+" [Untitled]",20));
							
						}else{
							me.setTitle(me.loadedObject.launcher.title+" ["+me.currentState+"]");
							me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title+" ["+me.currentState+"]",20));
						}
						
						me.setIconCls(me.loadedObject.launcher.iconCls);
						me.taskButton.setIconCls(me.loadedObject.launcher.iconCls);
						me.loadedObject.setContainer(me);
						
					},
					
					setPropertiesWhenLink:function(setupData){
						
						var me=this;

						if(setupData.x && setupData.y)
							me.setPosition(setupData.x,setupData.y);
						else{
							me.setPosition(0,0);
						}
						
						
						if(!setupData.width && !setupData.height)
							me.maximize();
						else{
							if(setupData.width)
								me.setWidth(setupData.width);
						
							if(setupData.height)
								me.setHeight(setupData.height);
						}
						
						me.setTitle(setupData.title);
						me.taskButton.setIconCls("notepad");
						me.taskButton.setText(Ext.util.Format.ellipsis(me.title,20));
						me.setIconCls("notepad");
						
						if(setupData.zIndex)
							me.setZIndex(setupData.zIndex);
						
						
					},
					
					/**
					 * Getter function for the class of the loaded object
					 * @return {String} The name of the class
					 */
					getAppClassName: function(){
						
						return this.appClassName;
						
					},
					
					/**
					 * Getter function for the current state of the loaded object
					 * @return {String} The name of the class
					 */
					getCurrentState: function(){
						
						return this.currentState;
						
					},
					oprShareState: function (sStateName) {
				        
						var me = this;
						
						Ext.Ajax.request({
						    url: me.desktop.getBaseUrl()+'UP/makePublicAppState',
						    params: {
						        app: 		me.appClassName,
						        obj: 		"application",
						        name: 		sStateName,
						        access: 	"ALL"
						    },
						    scope:me,
						    success: function(response){
						    	
						    	var me = this;

					    		var oStringToShow = "application|"
					    			+me.appClassName
					    			+"|"+_app.configData["user"]["username"]
					    			+"|"+_app.configData["user"]["group"]
					    			+"|"+sStateName;
					    		
					    		var oInfoWindow = me.oprGetChildWindow("Info for sharing the <span style='color:red'>"+sStateName+"</span> state:",true,800,120);
					    		var oHtml = "<div style='padding:5px'>The string you can send is as follows:</div>";
					    		oHtml+="<div style='padding:5px;font-weight:bold'>"+oStringToShow+"</div>";
					    		
					    		oInfoWindow.add({html: oHtml,xtype: "panel"});		
					    		
					    		oInfoWindow.show();
						    	
						    },
						    failure:function(response){
						    	
						    	var responseData = Ext.JSON.decode(response.responseText);
						    	Ext.example.msg("Notification", responseData["error"]);
						    }
						});	
						    	
				    },
					/**
					 * Overriden function, inherited from Ext.window.Window
					 * used to set up the buttons at the top right corner of the window
					 */
					addTools : function() {

						var me = this;
						
						me.bStatesLoaded = false;
						
						if(me.loadedObjectType=="app"){
							
							me.statesMenu = new Ext.menu.Menu();
							
							/*
							 * if the cache for the state of the started application exist
							 */
							if(me.appClassName in me.desktop.cache.windows){
								
								me.bStatesLoaded = true; 
									
								for (var stateName in me.desktop.cache.windows[me.appClassName]) {	
									
									var newItem = Ext.create('Ext.menu.Item', {
						    			  text: stateName,
						    			  handler: Ext.bind(me.oprLoadAppStateFromCache, me, [stateName], false),
						    			  scope:me,
						    			  iconCls:"system_state_icon",
						    			  menu:[{
						    				  		text:"Share state",
						    				  		handler:Ext.bind(me.oprShareState, me, [stateName], false),
						    				  		iconCls:"system_share_state_icon"
						    				  	}]
						    		});
									
									//newItem.getEl().on('contextmenu', me.onStateItemContextMenu, me);
									
									me.statesMenu.add(newItem);
									
								}
														
							}else{
								
								/*
								 * if the cache does not exist
								 */
								/*
								 * If the Ajax is not successful then no items 
								 * will be created within the cache and the list of states
								 */
								Ext.Ajax.request({
								    url: me.desktop.getBaseUrl()+'UP/listAppState',
								    params: {
								        app: 	me.appClassName,
								        obj: 	"application"
								    },
								    scope:me,
								    success: function(response){
								    	
								    	var me = this;
								    	var states = Ext.JSON.decode(response.responseText);
								    	me.desktop.cache.windows[me.appClassName]={};
								    	
								    	for (var stateName in states) {	
								    		
								    		var newItem = Ext.create('Ext.menu.Item', {
															    			  text: stateName,
															    			  handler: Ext.bind(me.oprLoadAppStateFromCache, me, [stateName], false),
															    			  scope:me,
															    			  iconCls:"system_state_icon",
															    			  menu:[{
														    				  		text:"Share state",
														    				  		handler:Ext.bind(me.oprShareState, me, [stateName], false),
														    				  		iconCls:"system_share_state_icon"
														    				  	}]
															    		});
								    		
								    		me.statesMenu.add(newItem);
								    		
								    		me.desktop.cache.windows[me.appClassName][stateName]=states[stateName];
								    		
								    	}
								    	
								    	me.bStatesLoaded = true;
								    	
								    },
								    failure:function(response){
								    	
								    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
								    }
								});
	
							}
													
							me.loadMenu = new Ext.menu.Menu({
								items : [ {
									text : "Load state",
									iconCls : "toolbar-other-load",
									menu : me.statesMenu
								}, {
									text : "Save",
									iconCls : "toolbar-other-save",
									handler:me.oprSaveAppState,
									scope: me
								},{
									text : "Save As ...",
									iconCls : "toolbar-other-save",
									handler : me.formSaveState,
									scope: me
								},{
									text : "Refresh states",
									iconCls : "toolbar-other-refresh",
									handler:me.oprRefreshAllAppStates,
									scope: me
								},{
									text : "Manage states ...",
									iconCls : "toolbar-other-manage",
									handler : me.formManageStates,
									scope: me
								} ]
							});
	
							me.addTool({
								xtype : "diracToolButton",
								type : "save",
								menu : me.loadMenu
							});

						
						}
						
						me.callParent();

					},
					/**
					 * Function that is called when the refresh button of the SAVE window menu is clicked
					 */
					oprRefreshAllAppStates: function(){
						
						var me = this;
						
						me.desktop.oprRefreshAllAppStates(me.appClassName);
						
						
					},
					/**
					 * Function for adding new state within the list of existing states
					 * @param {String} stateName The name of the state
					 */
					addNewState: function(stateName){
						
						var me = this;
						
						var newItem = Ext.create('Ext.menu.Item', {
			    			  text: stateName,
			    			  handler: Ext.bind(me.oprLoadAppStateFromCache, me, [stateName], false),
			    			  scope:me,
			    			  iconCls:"system_state_icon",
			    			  menu:[{
		    				  		text:"Share state",
		    				  		handler:Ext.bind(me.oprShareState, me, [stateName], false),
		    				  		iconCls:"system_share_state_icon"
		    				  	}]
			    		});

						me.statesMenu.add(newItem);
						
					},
					/**
					 * Function for removing a state from the list of existing states
					 * @param {String} stateName The name of the state
					 */
					removeState: function(stateName){
						
						var me = this;
						
						for(var i=0;i<me.statesMenu.items.length;i++){
							
							if(me.statesMenu.items.getAt(i).text==stateName){
								
								me.statesMenu.remove(me.statesMenu.items.getAt(i));
								break;
								
							}
							
						}
						
					},
					/**
					 * Function called when the Save As ... button
					 * from the SAVE window menu is clicked
					 */
					formSaveState : function() {
						
						var me = this;
	
						me.saveForm = Ext.widget(
								'form',
								{
									layout : {
										type : 'vbox',
										align : 'stretch'
									},
									border : false,
									bodyPadding : 10,

									fieldDefaults : {
										labelAlign : 'top',
										labelWidth : 100,
										labelStyle : 'font-weight:bold'
									},
									defaults : {
										margins : '0 0 5 0'
									},
									items : [
											{
												xtype : 'fieldcontainer',
												/*fieldLabel : 'State Name',
												labelStyle : 'font-weight:bold;padding:0',*/
												layout : 'hbox',
												defaultType : 'textfield',

												fieldDefaults : {
													labelAlign : 'left'
												},

												items : [{
															flex : 1,
															fieldLabel: 'State Name',
															name : 'state_name',
															validateOnChange: true,
															parentWindow:me,
															validateValue:function(value){
																
																value = Ext.util.Format.trim(value);
																
																if(value.length < 1){
													                 this.markInvalid("You must specify a name !");
													                 return false;
														             
														        }else{
														        	
														        	if(this.parentWindow.isExistingState(value)){
														        		
														        		this.markInvalid("The name you enetered already exists !");
														                return false;
														        		
														        	}else{
														        		
														        		this.clearInvalid();
														                return true;
														        		
														        	}
														        	
														        	
														        }
																
															}
														}]
											}],

									buttons : [
											{
												text : 'Save',
												handler : me.oprSaveAsAppState,
												scope: me
											},   
											{
												text : 'Cancel',
												handler : function() {
													me.saveForm.getForm().reset();						
													me.saveWindow.hide();
												},
												scope: me
											}
											 ]
								});
						
						me.saveWindow = Ext.create('widget.window', {
							height : 120,
							width : 500,
							title : 'Save state',
							layout : 'fit',
							modal: true,
							items : me.saveForm
						});
						
						
						me.saveWindow.show();

					},	
					
					/**
					 * Function to create and open the 
					 * form for managing the desktop states
					 */
					formManageStates: function(){
						
						var me = this;

						me.manageForm = Ext.widget(
								'form',
								{
									layout : {
										type : 'vbox',
										align : 'stretch'
									},
									border : false,
									bodyPadding : 10,

									fieldDefaults : {
										labelAlign : 'top',
										labelWidth : 100,
										labelStyle : 'font-weight:bold'
									},
									defaults : {
										margins : '0 0 10 0'
									},
									items : [
												{
													 html: "Application: <b>"+me.loadedObject.launcher.title+"</b>",
												    xtype: "box"
												},
												{
													 html: "<select size='10' multiple='multiple' style='width:100%'></select>",
											         xtype: "box"
												}
											],

									buttons : [
											{
												text : 'Delete selected states',
												handler : me.oprDeleteSelectedStates,
												scope: me
											},   
											{
												text : 'Cancel',
												handler : function() {
													me.manageWindow.hide();
												},
												scope: me
											}
											 ]
								});
						
						me.manageWindow = Ext.create('widget.window', {
							height : 300,
							width : 500,
							title : 'Manage states',
							layout : 'fit',
							modal: true,
							items : me.manageForm
						});
						
						me.manageWindow.show();
						me.fillSelectFieldWithStates();
						
						
					},
					
					/**
					 * Function to fill the select element 
					 * with the existing module states
					 */
					fillSelectFieldWithStates: function(){
						
						var me = this;
						var oSelectEl = document.getElementById(me.manageForm.getId()).getElementsByTagName("select")[0];
						
						for (i = oSelectEl.length - 1; i>=0; i--) 
							oSelectEl.remove(i);
						
						for(var stateName in me.desktop.cache.windows[me.appClassName]){
							
							  var elOptNew = document.createElement('option');
							  elOptNew.text = stateName;
							  elOptNew.value = stateName;
		
							  try {
								  oSelectEl.add(elOptNew, null); // standards compliant; doesn't work in IE
							  }
							  catch(ex) {
								  oSelectEl.add(elOptNew); // IE only
							  }
							  
						}
						  
					},
					
					/**
					 * Function that is executed when the Save button 
					 * of the Save As form is clicked 
					 */
					oprSaveAsAppState : function() {
						
						var me = this;
												
						if (me.saveForm.getForm().isValid()) {
							
							var stateName = me.saveForm.getForm().findField("state_name").getValue();
								
							me.oprSendDataForSave(stateName,true);
							
						}
						
					},
					
					/**
					 * Function to delete selected desktop states 
					 */
					oprDeleteSelectedStates: function(){
						
						var me = this;
						var oSelectField = document.getElementById(me.manageForm.getId()).getElementsByTagName("select")[0];
						
						for (var i = oSelectField.length - 1; i>=0; i--) {
						    if (oSelectField.options[i].selected) {
						    	
						    /*
						     * First we check whether there are instances of that 
						     * state that are active
						     */	

						      var oStateName=oSelectField.options[i].value;	
						    	
						      if(! me.desktop.isAnyActiveState(oStateName,me.appClassName)){
						    	  
						    	  /*
						    	   * If the Ajax is not successful then the item wont be deleted.
						    	   */
						    	  Ext.Ajax.request({
									    url: me.desktop.getBaseUrl()+'UP/delAppState',
									    params: {
									    	app: me.appClassName,
									    	name: 	oStateName,
									        obj: "application"
									    },
									    success:Ext.bind(me.oprDeleteSelectedStates_s, me, [i,oSelectField], false),
									    failure:function(response){
									    	
									    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
									    }
									});
						    	  
						      }else
						    	  Ext.MessageBox.alert('Message','The state <b>'+oSelectField.options[i].value+'</b> you are willing to delete is curently in use !');
						    	
						    	
						      
						    }
						}
						
					},
					
					/**
					 * Callback of the oprDeleteSelectedStates function
					 * @param {Integer} index index of the selected element
					 * @param {DOMObject} oSelectEl the select element of the management form 
					 */
					oprDeleteSelectedStates_s: function(index,oSelectEl){
						
						var me = this;
						
						var oStateName = oSelectEl.options[index].value;
						
						me.desktop.removeStateFromWindows(oStateName,me.appClassName);
						
						oSelectEl.remove(index);
						
					},
					
					/**
					 * Function to check if a state exists 
					 * among the list of desktop states
					 * @param {String} stateName The name of the state
					 */
					isExistingState:function(stateName){
						var me = this;

						if( stateName in me.desktop.cache.windows[me.appClassName])
							return true;
						else
							return false;
						
					},
					
					/**
					 * Function called when the Save button 
					 * from the SAVE window menu is clicked 
					 */
					oprSaveAppState : function() {
						
						var me = this;
						
						if(me.currentState == ""){
							
							me.formSaveState();
							
						}else{
							
							me.oprSendDataForSave(me.currentState,false);
						}
					},
					
					/**
					 * Function that is used to prepare and send 
					 * the data of the desktop state to the server.
					 * @param {String} stateName The name of the state
					 * @param {Boolean} isNewItem Parameter that says whether the state already exists or not 
					 */
					oprSendDataForSave: function (stateName,isNewItem){
						
						var me = this;
						
						var sendData = me.loadedObject.getStateData();
						/*
						 * We save those data in the database
						 */
						if(!Ext.isObject(sendData)){
							/*
							 * Here the data to be sent is not an object
							 */	
							return;
						}
						
						/*
						 * If the Ajax is not successful the state wont be saved.
						 */
						Ext.Ajax.request({
						    url: me.desktop.getBaseUrl()+'UP/saveAppState',
						    params: {
						        app: 	me.appClassName,
						        name: 	stateName,
						        state: 	Ext.JSON.encode(sendData),
						        obj: "application"
						    },
						    scope:me,
						    success: function(response){
						    	var me = this;
						    	Ext.example.msg("Notification", 'State saved successfully !');
						    	if(isNewItem){
						    		me.desktop.addStateToExistingWindows(stateName,me.appClassName,sendData);
						    		me.saveWindow.hide();
						    	}else
						    		me.desktop.cache.windows[me.appClassName][stateName]=sendData;
						    	
						    	me.currentState = stateName;
								me.setTitle(me.loadedObject.launcher.title+" ["+me.currentState+"]");
								me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title+" ["+stateName+"]",20));
								me.desktop.refreshUrlDesktopState();
						    },
						    failure:function(response){
						    	
						    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
						    }
						});
						
					},
					/**
					 * Function to refresh the states of a module. The states are read from the cash.
					 */
					oprRefreshAppStates:function(){
						
						var me = this;
						
						me.statesMenu.removeAll();
						
						for (var stateName in me.desktop.cache.windows[me.appClassName]) {	
							
							var newItem = Ext.create('Ext.menu.Item', {
				    			  text: stateName,
				    			  handler: Ext.bind(me.oprLoadAppStateFromCache, me, [stateName], false),
				    			  scope:me,
				    			  iconCls:"system_state_icon",
				    			  menu:[{
			    				  		text:"Share state",
			    				  		handler:Ext.bind(me.oprShareState, me, [stateName], false),
			    				  		iconCls:"system_share_state_icon"
			    				  	}]
				    		});

							me.statesMenu.add(newItem);
							
						}
						
					},
					
					/**
					 * Function to load module state with data from the cache
					 * @param {String} stateName The name of the state
					 */
					oprLoadAppStateFromCache : function(stateName) {
						
						var me = this;
						
						if(!me.bStatesLoaded){
							
							me.funcPostponedLoading = function(){
								
								me.oprLoadAppStateFromCache(stateName);
								
							}
							
							setTimeout(me.funcPostponedLoading,1000);
							
							return;
							
						}
						
						
						me.loadMask.show();
						
						me.closeAllChildWindows();
						me.loadedObject.loadState(me.desktop.cache.windows[me.appClassName][stateName]);
						me.currentState = stateName;
						
						_app.desktop.refreshUrlDesktopState();
						
						me.setTitle(me.loadedObject.launcher.title+" ["+stateName+"]");
						me.taskButton.setText(Ext.util.Format.ellipsis(me.loadedObject.launcher.title+" ["+stateName+"]",20));
						me.loadMask.hide();

					},
					
					oprGetChildWindow:function(sTitle,oModal,oWidth,oHeight){
						
						var me = this;
						
						var oWindow = me.desktop.createWindow({
							height : oHeight,
							width : oWidth,
							title : sTitle,
							modal: oModal,
							parentWindow:me,
							isChildWindow:true
						});
						
						me.childWindows.push(oWindow);
						
						return oWindow;
						
					},
					
					removeChildWindowFromList:function(oChildWindow){
						
						var me = this;
						var oNewList = [];
						
						for(var i=0;i<me.childWindows.length;i++){
							
							if(oChildWindow.id!=me.childWindows[i].id)
								oNewList.push(me.childWindows[i]);
							
						}
						
						me.childWindows = oNewList;
						
					},
					
					closeAllChildWindows: function(){
						
						var me = this;
						
						for(var i=me.childWindows.length-1;i>=0;i--)
							me.childWindows[i].close();
						
					},
					
					getUrlDescription:function(){
						
						var me = this;
						
						if(me.loadedObjectType=="link")
							return "";
						
						var oPos = me.getPosition();
						
						var oState = "0";
						if(me.minimized)
							oState = -1;
						else if(me.maximized)
							oState = 1;
								
						
						return me.loadedObject.self.getName()+":"+me.currentState+":"+oPos[0]+":"+oPos[1]+":"+me.getWidth()+":"+me.getHeight()+":"+oState;
						
					}
					
				});
