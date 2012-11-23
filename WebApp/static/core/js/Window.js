/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.ux.desktop.Desktop This is an abstract class that has to be
 *        inherited by every module.
 * @mixin Ext.util.Observable
 * 
 */
Ext.define(
			'Ext.ux.desktop.Window',
			{
					extend : 'Ext.window.Window',
					requires : [ "Ext.ux.desktop.ToolButton", 
					             "Ext.menu.Menu",
					             "Ext.form.*",
					             "Ext.LoadMask"],

					/*
					 * This window has to have a reference to the module object
					 * so that it can take its state, or load its state
					 */

					currentState : "",
					loadedObject:null,
					loadMask:null,
					
					initComponent:function(){
						
						var me=this;
						
						me.loadMask = new Ext.LoadMask(me,{msg:"Loading ..."});
						
						
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
										margins : '0 0 10 0'
									},
									items : [
											{
												xtype : 'fieldcontainer',
												fieldLabel : 'State Name',
												labelStyle : 'font-weight:bold;padding:0',
												layout : 'hbox',
												defaultType : 'textfield',

												fieldDefaults : {
													labelAlign : 'top'
												},

												items : [{
															flex : 1,
															name : 'state_name',
															allowBlank : false
														}]
											}],

									buttons : [
											{
												text : 'Cancel',
												handler : function() {
													me.saveForm.getForm().reset();						
													me.saveWindow.hide();
												},
												scope: me
											},
											{
												text : 'Save',
												handler : me.oprSaveAppState,
												scope: me
											} ]
								});
						
						me.saveWindow = Ext.create('widget.window', {
							height : 200,
							width : 500,
							title : 'Save state',
							layout : 'fit',
							modal: true,
							items : me.saveForm
						});
						
						me.callParent();
						
					},
					
					setLoadedObject:function(loadedObject){
						
						this.loadedObject=loadedObject;
						
						if(this.currentState == ""){
							
							this.title = this.loadedObject.launcher.text+" [Untitled]";
							
						}
						
						this.iconCls = this.loadedObject.launcher.iconCls;
						
					},
					
					addTools : function() {

						var me = this;

						var statesMenu = new Ext.menu.Menu({
							items : [ {
								text : "State 1"
							}, {
								text : "State 2"
							} ]
						});
						var mainMenu = new Ext.menu.Menu({
							items : [ {
								text : "Load state",
								iconCls : "toolbar-other-load",
								menu : statesMenu
							}, {
								text : "Save",
								iconCls : "toolbar-other-save",
								scope: me
							},{
								text : "Save As ...",
								iconCls : "toolbar-other-save",
								handler : me.formSaveState,
								scope: me
							},{
								text : "Manage states ...",
								iconCls : "toolbar-other-manage"
							} ]
						});

						me.addTool({
							xtype : "toolButton",
							type : "save",
							menu : mainMenu
						});

						me.callParent();

					},

					formSaveState : function() {
						
						var me = this;
						me.saveForm.getForm().reset();						
						me.saveWindow.show();

					},

					oprSaveAppState : function() {
						
						var me = this;
						
//						alert(me.saveForm.getForm().findField("state_name").getValue());
//						return;
						
						if (me.saveForm.getForm().isValid()) {
						
							var sendData = this.loadedObject.getStateData();
							/*
							 * We save those data in the database
							 */
							if(!Ext.isObject(sendData)){
								/*
								 * Here the data to be sent is not an object
								 */	
								return;
							}
							
							Ext.Ajax.request({
							    url: 'up/saveAppState',
							    params: {
							        app: 	this.loadedObject.self.getName(),
							        name: 	me.saveForm.getForm().findField("state_name").getValue(),
							        state: 	Ext.JSON.encode(sendData)
							    },
							    scope:me,
							    success: function(response){
							    	Ext.MessageBox.alert('Message','State saved successfully !');
							    	this.refreshSavedStatesLists();
							    }
							});
							
							me.saveForm.getForm().reset();
							me.saveWindow.hide();
						}
						
					},
					
					refreshSavedStatesLists:function(){
						
						
						
						
					},

					oprLoadAppState : function(stateName) {
						
						var me = this;
						
						me.loadMask.show();
						
						/*
						 * We read the data saved in the database 
						 * 
						 */
						Ext.Ajax.request({
						    url: 'up/loadAppState',
						    params: {
						        app: 	me.loadedObject.self.getName(),
						        name:	stateName
						    },
						    scope:me,
						    success: function(response){
						    	var me = this;
						    	me.loadedObject.loadState(Ext.JSON.decode(response.responseText));
								me.currentState = stateName;
								me.title = me.loadedObject.launcher.text+" ["+stateName+"]";
								me.loadMask.hide();
						    }
						});

					},

					formManageStates : function() {

					}

				});
