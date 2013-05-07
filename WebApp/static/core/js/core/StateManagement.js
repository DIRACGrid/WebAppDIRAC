/**
 * @class Ext.dirac.core.StateManagement
 * This class manages the entire application platform
 * @mixins Ext.util.Observable
 * 
 */

Ext.define('Ext.dirac.core.StateManagement',
	{
		requires : [ ],
	
		cache:{	
				application:{},
				reference:{}
			  },
			  
		activeStates:[],
		
		oprReadApplicationStatesAndReferences:function(sAppName,funcCallBack){
			
			var me = this;
			
			Ext.Ajax.request({
			    url: _app_base_url+'UP/listAppState',
			    params: {
			        app: 	sAppName,
			        obj: 	"application"	
			    },
			    success: function(response){
			    	
			    	var oStates = Ext.JSON.decode(response.responseText);
			    	me.cache["application"][sAppName]={};
			    	
			    	for (var sStateName in oStates) {	
			    		
			    		me.cache["application"][sAppName][sStateName]=oStates[sStateName];
			    		
			    	}
			    	
			
			    	Ext.Ajax.request({
					    url: _app_base_url+'UP/listAppState',
					    params: {
					        app: 	sAppName,
					        obj: 	"reference"
					    },
					    success: function(response){
					    	
					    	var oStates = Ext.JSON.decode(response.responseText);
					    	me.cache["reference"][sAppName]={};
					    	
					    	for (var sStateName in oStates) {	
					    		
					    		me.cache["reference"][sAppName][sStateName]=oStates[sStateName];
					    		
					    	}
			
					    	funcCallBack();
					    	
					    },
					    failure:function(response){
					    	me.cache["reference"][sAppName]={};
					    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
					    }
					});
			    	
			    },
			    failure:function(response){
			    	
			    	me.cache[sStateType][sAppName]={};
			    	me.cache["reference"][sAppName]={};
			    	
			    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			    }
			});
			
		},
			  
		isStateLoaded:function(sStateType,sAppName,sStateName){
			
			var me = this;
			
			if(sAppName in me.cache[sStateType]){
				
				if(sStateName in me.cache[sStateType][sAppName]){
					
					return 1;
					
				}else{
					
					return -1;
					
				}
				
			}else{
				return -2;
			}
			
		},
		
		getStateData:function(sStateType,sAppName,sStateName){
			
			var me = this;
			var oValidation = me.isStateLoaded(sStateType, sAppName, sStateName); 
			
			if(oValidation==1){
				
				return me.cache[sStateType][sAppName][sStateName];
				
			}else
				return oValidation;	
			
		},
		
		isExistingState:function(sStateType,sAppName,sStateName){
			
			var me = this;
			
			if((sAppName in me.cache[sStateType])&&(sStateName in me.cache[sStateType][sAppName]))
				return true;
			else
				return false;
			
		},
		
		/**
		 * Function called when the Save As ... button
		 * from the SAVE window menu is clicked
		 */
		formSaveState : function(sStateType, sAppName, oAppObject, funcCallBack) {
			
			var me = this;

			me.__oAppObject 	= 	oAppObject;
			me.__cbAfterSave 	= 	funcCallBack;
			me.__sStateType 	= 	sStateType;
			me.__sAppName 		= 	sAppName;
			
			me.saveForm = Ext.widget('form',{
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
												validateValue:function(sValue){
													
													sValue = Ext.util.Format.trim(sValue);
													
													if(sValue.length < 1){
										                 this.markInvalid("You must specify a name !");
										                 return false;
											             
											        }else{
											        	console.log(me.__sStateType +" :: "+ me.__sAppName+" :: "+sValue);
											        	
											        	if(me.isExistingState(me.__sStateType,me.__sAppName,sValue)){
											        		
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
										handler : function() {
																	
											if (me.saveForm.getForm().isValid()) {
												
												var sStateName = me.saveForm.getForm().findField("state_name").getValue();
													
												me.oprSendDataForSave(sStateName,true);
												
											}
											
										},
										scope: me
									},   
									{
										text : 'Cancel',
										handler : function() {
											me.saveForm.getForm().reset();
											me.__oAppObject 	= 	null;
											me.__cbAfterSave 	= 	null;
											me.__sStateType 	= 	null;
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
		 * Function called when the Save button 
		 * from the SAVE window menu is clicked 
		 */
		oprSaveAppState : function(sStateType,sAppName,oAppObject,funcCallBack) {
			
			var me = this;
			
			if(oAppObject.currentState == ""){
				
				me.formSaveState(sStateType,sAppName,oAppObject,funcCallBack);
				
			}else{
				
				me.__oAppObject 	= 	oAppObject;
				me.__cbAfterSave 	= 	funcCallBack;
				me.__sStateType 	= 	sStateType;
				me.__sAppName 		= 	sAppName;
				
				me.oprSendDataForSave(oAppObject.currentState,false);
			}
		},
		
		/**
		 * Function that is used to prepare and send 
		 * the data of the desktop state to the server.
		 * @param {String} stateName The name of the state
		 * @param {Boolean} isNewItem Parameter that says whether the state already exists or not 
		 */
		oprSendDataForSave: function (sStateName,bNewItem){
			
			var me = this;
			
			var oSendData = me.__oAppObject.getStateData();
			/*
			 * We save those data in the database
			 */
			if(!Ext.isObject(oSendData)){
				/*
				 * Here the data to be sent is not an object
				 */	
				return;
			}
			
			/*
			 * If the Ajax is not successful the state wont be saved.
			 */
			Ext.Ajax.request({
			    url: _app_base_url+'UP/saveAppState',
			    params: {
			        app: 		me.__sAppName,
			        name: 		sStateName,
			        state: 		Ext.JSON.encode(oSendData),
			        obj: 		me.__sStateType
			    },
			    scope:me,
			    success: function(oResponse){
			    	var me = this;
			    	Ext.example.msg("Notification", 'State saved successfully !');
			    	
			    	me.cache[me.__sStateType][me.__sAppName][sStateName] = oSendData;
			    	
			    	if(bNewItem){
			    		me.__cbAfterSave(me.__sAppName,sStateName);
			    		me.saveWindow.hide();
			    	}

			    },
			    failure:function(response){
			    	
			    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			    }
			});
			
		},
		
		
		/**
		 * Function to create and open the 
		 * form for managing the desktop states
		 */
		formManageStates: function(sAppName,funcAfterRemove){
			
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
						appName:sAppName,
						cbAfterRemove: funcAfterRemove,
						items : [
									{
										 html: "Application: <b>"+sAppName+"</b>",
									     xtype: "box"
									},
									{xtype:"panel",
									       layout:"column",
									       border:false,
									       items:[
											{
												xtype      : 'radiofield',
												boxLabel  : 'States',
								                inputValue: 's',
								                name: "manage_state_type",
								                width:150,
								                checked:true,
								                listeners:{
								                	
								                	change:function(cmp, newValue, oldValue, eOpts){
								                		
								                		var oSelectElStates = me.manageForm.items.getAt(2);
								                		var oSelectElLinks = me.manageForm.items.getAt(3);
								                		
								                		if(newValue){
								                			
								                			oSelectElStates.show();
								                			oSelectElLinks.hide();
								                			
								                		}else{
								                			
								                			oSelectElStates.hide();
								                			oSelectElLinks.show();
								                			
								                		}
								                		
								                	}
								                	
								                }
											},
											{
												xtype      : 'radiofield',
												boxLabel  : 'Links',
								                inputValue: 'l',
								                name: "manage_state_type",
								                width:150
											}
											]
									},
									{
										 html: "<select size='10' multiple='multiple' style='width:100%'></select>",
								         xtype: "box"
									},
									{
										 html: "<select size='10' multiple='multiple' style='width:100%;'></select>",
								         xtype: "box",
								         hidden: true
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
			
			me.__oprFillSelectFieldWithStates();
			
		},
		
		/**
		 * Function to fill the select element 
		 * with the existing module states
		 */
		__oprFillSelectFieldWithStates: function(){
			
			var me = this;
			var oSelectEl = document.getElementById(me.manageForm.getId()).getElementsByTagName("select")[0];
			
			for (i = oSelectEl.length - 1; i>=0; i--) 
				oSelectEl.remove(i);
			
			for(var sStateName in me.cache.application[me.manageForm.appName]){
				
				  var elOptNew = document.createElement('option');
				  
				  elOptNew.text = sStateName;
				  elOptNew.value = sStateName;

				  try {
					  oSelectEl.add(elOptNew, null); // standards compliant; doesn't work in IE
				  }
				  catch(ex) {
					  oSelectEl.add(elOptNew); // IE only
				  }
				  
			}
			
			oSelectEl = document.getElementById(me.manageForm.getId()).getElementsByTagName("select")[1];
			
			for (i = oSelectEl.length - 1; i>=0; i--) 
				oSelectEl.remove(i);
			
			for(var sStateName in me.cache.reference[me.manageForm.appName]){
				
				  var elOptNew = document.createElement('option');
				  
				  elOptNew.text = sStateName;
				  elOptNew.value = sStateName;

				  try {
					  oSelectEl.add(elOptNew, null); // standards compliant; doesn't work in IE
				  }
				  catch(ex) {
					  oSelectEl.add(elOptNew); // IE only
				  }
				  
			}
			  
		},
		
		isAnyActiveState:function(sAppName,sStateName){
			
			var me = this;
			var oFound = false;
			
			for(var i=0;i<me.activeStates.length;i++){
				
				if((sStateName==me.activeStates[i][1])&&(sAppName==me.activeStates[i][0])){
					
					oFound = true;
					break;
					
				}
			}
			
			return oFound;
			
		},
		
		addActiveState:function(sAppName,sStateName){
			
			var me = this;
			
			me.activeStates.push([sAppName,sStateName]);
			
		},
		
		removeActiveState:function(sAppName,sStateName){
			
			var me = this;
			var iIndex = -1;
			for(var i=me.activeStates.length-1;i>=0;i--){
				if((sStateName==me.activeStates[i][1])&&(sAppName==me.activeStates[i][0])){
					iIndex = i;
					break;
				}
			}
			if(iIndex != -1)
				me.activeStates.splice(iIndex,1);
		},
		
		oprDeleteSelectedStates: function(){
			
			var me = this;
			
			var iWhoSelect = 0;
			
			if(me.manageForm.items.getAt(1).items.getAt(1).getValue())
				iWhoSelect = 1;
			
			var oSelectField = document.getElementById(me.manageForm.getId()).getElementsByTagName("select")[iWhoSelect];
			
			for (var i = oSelectField.length - 1; i>=0; i--) {
			    if (oSelectField.options[i].selected) {
			    	
				    /*
				     * First we check whether there are instances of that 
				     * state that are active
				     */	
				    var oStateName=oSelectField.options[i].value;	
				    if(iWhoSelect == 0){	
				    	  	
					      if(! me.isAnyActiveState(me.manageForm.appName,oStateName)){
					    	  
					    	  /*
					    	   * If the Ajax is not successful then the item wont be deleted.
					    	   */
					    	  Ext.Ajax.request({
								    url: _app_base_url+'UP/delAppState',
								    params: {
								    	app: me.manageForm.appName,
								    	name: 	oStateName,
								        obj: "application"
								    },
								    success:Ext.bind(me.cbDeleteSelectedStates, me, [i,oSelectField,iWhoSelect], false),
								    failure:function(response){
								    	
								    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
								    }
								});
					    	  
					      }else
					    	  Ext.MessageBox.alert('Message','The state <b>'+oSelectField.options[i].value+'</b> you are willing to delete is curently in use !');
				    	
				      }else{
				    	  
				    	  Ext.Ajax.request({
							    url: _app_base_url+'UP/delAppState',
							    params: {
							    	app: me.manageForm.appName,
							    	name: 	oStateName,
							        obj: "reference"
							    },
							    success:Ext.bind(me.cbDeleteSelectedStates, me, [i,oSelectField,iWhoSelect], false),
							    failure:function(response){
							    	
							    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
							    }
							});
				    	  
				    	  
				      }
			      
			    }
			}
			
		},
		
		/**
		 * Callback of the oprDeleteSelectedStates function
		 * @param {Integer} index index of the selected element
		 * @param {DOMObject} oSelectEl the select element of the management form 
		 */
		cbDeleteSelectedStates: function(index,oSelectEl,iWhoSelect){
			
			var me = this;
			
			var sStateName = oSelectEl.options[index].value;
			
			if(iWhoSelect == 0)
				delete me.cache["application"][me.manageForm.appName][sStateName];
			else
				delete me.cache["reference"][me.manageForm.appName][sStateName];
			
			me.manageForm.cbAfterRemove(((iWhoSelect==0)?"application":"reference"),sStateName,me.manageForm.appName);
			
			oSelectEl.remove(index);
			
		},

		
	});
