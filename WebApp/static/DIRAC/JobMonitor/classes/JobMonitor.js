/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext
		.define(
				'DIRAC.JobMonitor.classes.JobMonitor',
				{
					extend : 'Ext.dirac.core.Module',

					requires : [ //'Ext.data.JsonStore',
					             'Ext.util.*', 
					             'Ext.panel.Panel',
					             "Ext.form.field.Text",
					             "Ext.button.Button",
					             "Ext.menu.CheckItem",
					             "Ext.menu.Menu",
					             "Ext.form.field.ComboBox",
					             "Ext.layout.*",
					             "Ext.toolbar.Paging",
					             "Ext.grid.Panel"],					

					loadState : function(data) {
						
						var me = this;
						
						for(var i=0;i<me.grid.columns.length;i++){
							
							var col=me.grid.columns[i];
							col.setWidth(data.columns[col.getSortParam()].width);
							if(data.columns[col.getSortParam()].hidden)
								col.hide();
							else
								col.show();
							
							var sortState = data.columns[col.getSortParam()].sortState;
							
							if(sortState!=null)
								col.setSortState(sortState);
							
						}
						http://ntt.cc/2008/02/10/4-ways-to-dynamically-load-external-javascriptwith-source.html
						
						for(var i=0;i<me.selectorMenu.items.length;i++){
							
							var item=me.selectorMenu.items.getAt(i);
							
							item.setChecked(!data.selectors[item.relatedCmbField]);
							
							if(!data.selectors[item.relatedCmbField])
								me.cmbSelectors[item.relatedCmbField].show();
							else
								me.cmbSelectors[item.relatedCmbField].hide();
							
						}
						
						
						
					},

					getStateData : function() {
						
						
						var me = this;
						var oReturn = {};
						
						oReturn.columns={};
						
						for(var i=0;i<me.grid.columns.length;i++){
						
							var col=me.grid.columns[i];
							var oName = col.getSortParam();
							oReturn.columns[oName]={"width":col.width,"hidden":col.isHidden(),"sortState":col.sortState};
							
						}
						
						oReturn.selectors={};
						
						for(var cmb in me.cmbSelectors){
							
							oReturn.selectors[cmb]=me.cmbSelectors[cmb].isHidden();
							
						}
						
						return oReturn;

					},
					dataFields:[
					            {name:'SystemPriority', type: 'float'},
					            {name:'ApplicationNumStatus'},
					            {name:'JobID', type: 'float'},
					            {name:'LastSignOfLife',type:'date',dateFormat:'Y-m-d H:i:s'},
					            {name:'VerifiedFlag'},
					            {name:'RetrievedFlag'},
					            {name:'Status'},
					            {name:'StartExecTime',type:'date',dateFormat:'Y-m-d H:i:s'},
					            {name:'RescheduleCounter'},
					            {name:'JobSplitType'},
					            {name:'MinorStatus'},
					            {name:'ApplicationStatus'},
					            {name:'SubmissionTime',type:'date',dateFormat:'Y-m-d H:i:s'},
					            {name:'JobType'},
					            {name:'MasterJobID'},
					            {name:'KilledFlag'},
					            {name:'RescheduleTime'},
					            {name:'DIRACSetup'},
					            {name:'FailedFlag'},
					            {name:'CPUTime'},
					            {name:'OwnerDN'},
					            {name:'JobGroup'},
					            {name:'JobName'},
					            {name:'AccountedFlag'},
					            {name:'OSandboxReadyFlag'},
					            {name:'LastUpdateTime',type:'date',dateFormat:'Y-m-d H:i:s'},
					            {name:'Site'},
					            {name:'HeartBeatTime',type:'date',dateFormat:'Y-m-d H:i:s'},
					            {name:'OwnerGroup'},
					            {name:'ISandboxReadyFlag'},
					            {name:'UserPriority'},
					            {name:'Owner'},
					            {name:'DeletedFlag'},
					            {name:'TaskQueueID'},
					            {name:'JobType'},
					            {name:'JobIDcheckBox',mapping:'JobID'},
					            {name:'StatusIcon',mapping:'Status'},
					            {name:'OwnerGroup'}],
					
					initComponent : function() {

						var me = this;
						me.launcher.title = "Job Monitor";
						/*
						 * Definition of containers
						 */
						
						me.leftPanel = new Ext.create('Ext.panel.Panel',{
						    title: 'Selectors',
						    region:'west',
						    floatable: false,
						    margins: '0',
						    width: 250,
						    minWidth: 230,
						    maxWidth: 350,
						    bodyPadding: 5
						});

						/*
						 * Definition of combo boxes
						 */
					
						me.cmbSelectors={site:null,
										status:null,
										minorStatus:null,
										appStatus:null,
										owner:null,
										jobGroup:null,
										jobType:null};
						
						var cmbTitles={site:"Site",
								status:"Status",
								minorStatus:"Minor Status",
								appStatus:"Application Status",
								owner:"Owner",
								jobGroup:"Job Group",
								jobType:"Job Type"};
						
						for(var cmb in me.cmbSelectors){
							
							me.cmbSelectors[cmb] = Ext.create('Ext.dirac.utils.DiracBoxSelect', {
							    fieldLabel: cmbTitles[cmb],
							    queryMode: 'local',
							    labelAlign:'top',
							    width:220,
							    displayField: "text",
							    valueField: "value"
							});
							
						}
						
						me.leftPanel.add([me.cmbSelectors.site,
						                  me.cmbSelectors.status, 
						                  me.cmbSelectors.minorStatus, 
						                  me.cmbSelectors.appStatus,
						                  me.cmbSelectors.owner, 
						                  me.cmbSelectors.jobGroup, 
						                  me.cmbSelectors.jobType]);
						
						me.textJobId = Ext.create('Ext.form.field.Text',{
							
							fieldLabel: "JobID",
						    labelAlign:'top',
						    width:220,
						    validator: function(value){
						    	
						    	if(Ext.util.Format.trim(value)!=""){
							    	var newValue="";
							    	for(var i=0;i<value.length;i++){
							    		if(value.charAt(i)!=' ')
							    			newValue+=value.charAt(i);
							    	}
							    	var regExpr     = /^(\d+|\d+-\d+)(,(\d+|\d+-\d+))*$/;
							    	
							    	if(String(newValue).search (regExpr) != -1)
							    		return true;
							    	else
							    		return "The IDs expression is not valid";	

						    	}else
						    		return true;
								
						    }
						});
						
						me.leftPanel.add(me.textJobId);
						
						me.btnSubmit = new Ext.Button({
							
							text: 'Submit',
							margin:3,
							iconCls:"jm-submit-icon",
							handler: function() {
								me.oprSelectorsRefreshWithSubmit(true);
							},
							scope:me
							
						});
						
						me.btnReset = new Ext.Button({
							
							text: 'Reset',
							margin:3,
							iconCls:"jm-reset-icon",
							handler: function() {
								me.oprResetSelectionOptions();
							},
							scope:me
							
						});
						
						me.btnRefresh = new Ext.Button({
							
							text: 'Refresh',
							margin:3,
							iconCls:"jm-refresh-icon",
							handler: function() {
								me.oprSelectorsRefreshWithSubmit(false);
							},
							scope:me
							
						});
						
						var oPanelButtons = new Ext.create('Ext.panel.Panel',{
						    autoHeight:true,
						    border:false,
							items:[me.btnSubmit,me.btnReset,me.btnRefresh]
						});
						
						me.leftPanel.add(oPanelButtons);
						
						Ext.Ajax.request({
						    url: me._baseUrl+'JobMonitor/getSelectionData',
						    params: {

						    },
						    scope:me,
						    success: function(response){
						    	
						    	var me = this;
						    	var response = Ext.JSON.decode(response.responseText);
						    	
						    	me.__oprRefreshStoresForSelectors(response,false);
						    	
						    },
						    failure:function(response){
						    	
						    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
						    }
						});
						

						/*
						 * Definition of grid
						 */
						
						me.dataStore = new Ext.data.JsonStore({
							
						    proxy: {
						        type: 'ajax',
						        url: this._baseUrl+'JobMonitor/getJobData',
						        reader: {
						            type: 'json',
						            root: 'result'
						        }
						    },

						    // alternatively, a Ext.data.Model name can be given
							// (see Ext.data.Store for an example)
						    fields: me.dataFields,
						    autoLoad : true
						});
						
						me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
						me.checkboxFunctionDefinition += 'var oChecked=this.checked;';
						me.checkboxFunctionDefinition += 'var oElems=Ext.query(\'#'+me.id+' input.checkrow\');';
						me.checkboxFunctionDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
						me.checkboxFunctionDefinition += '"/>';
						
						
						me.pagingToolbar = {};
						me.pagingToolbar.updateStamp = new Ext.Button({
														    disabled:true,
														    // disabledClass:'my-disabled',
														    text:'Updated: -'
														  });
						
						me.pagingToolbar.btnReschedule = new Ext.Button({
						    text:'Reschedule',
						    iconCls: "jm-reschedule-icon",
						    handler:function(){
						    	
						    	var me = this;
						    	me.__oprJobAction("reschedule","");
						    	
						    },
						    scope:me
						});
						
						me.pagingToolbar.btnKill = new Ext.Button({
						    text:'Kill',
						    iconCls: "jm-kill-icon",
						    handler:function(){
						    	
						    	var me = this;
						    	me.__oprJobAction("kill","");
						    	
						    },
						    scope:me
						});
						
						me.pagingToolbar.btnDelete = new Ext.Button({
						    text:'Delete',
						    iconCls: "jm-delete-icon",
						    handler:function(){
						    	
						    	var me = this;
						    	me.__oprJobAction("delete","");
						    	
						    },
						    scope:me
						});
						
						me.pagingToolbar.pageSizeCombo = new Ext.form.field.ComboBox({
															    allowBlank:false,
															    displayField:'number',
															    editable:false,
															    maxLength:4,
															    maxLengthText:'The maximum value for this field is 1000',
															    minLength:1,
															    minLengthText:'The minimum value for this field is 1',
															    mode:'local',
															    store:new Ext.data.SimpleStore({
																        fields:['number'],
																        data:[[25],[50],[100],[200],[500],[1000]]
																      }),
															    triggerAction:'all',
															    value:25,
															    width:50
															  });
						
						me.pagingToolbar.pageSizeCombo.on("change",function(combo, newValue, oldValue, eOpts){var me = this; me.oprLoadGridData();},me);
						
						var pagingToolbarItems = [me.pagingToolbar.btnReschedule,
						                          me.pagingToolbar.btnKill,
						                          me.pagingToolbar.btnDelete,
						                          '-',
						                          '->',
						                          me.pagingToolbar.updateStamp,
						                          '-',
						                          'Items per page: ',
						                          me.pagingToolbar.pageSizeCombo,
						                          '-'];
						
						me.pagingToolbar.toolbar = Ext.create('Ext.toolbar.Paging', {
										               store : me.dataStore,
										               displayInfo : true,
										               displayMsg : 'Displaying topics {0} - {1} of {2}',
										               items: pagingToolbarItems,
										               emptyMsg : "No topics to display",
										               prependButtons: true
										             });
						
						me.grid = Ext.create('Ext.grid.Panel', {
							region: 'center',
						    store: me.dataStore,
						    height:'600',
						    columns: [
								{header:me.checkboxFunctionDefinition,name:'checkBox',id:'checkBox',width:26,sortable:false,dataIndex:'JobIDcheckBox',renderer:function (value, metaData, record, row, col, store, gridView){return this.rendererChkBox(value);},hideable:false,fixed:true,menuDisabled:true},
								{header:'JobId',sortable:true,dataIndex:'JobID',align:'left',hideable:false},
								{header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:function (value, metaData, record, row, col, store, gridView){return this.rendererStatus(value);},hideable:false,fixed:true,menuDisabled:true},
								{header:'Status',width:70,sortable:true,dataIndex:'Status',align:'left'},
								{header:'MinorStatus',sortable:true,dataIndex:'MinorStatus',align:'left'},
								{header:'ApplicationStatus',sortable:true,dataIndex:'ApplicationStatus',align:'left'},
								{header:'Site',sortable:true,dataIndex:'Site',align:'left'},
								{header:'JobName',width:200,sortable:true,dataIndex:'JobName',align:'left'},
								{header:'LastUpdate [UTC]',width:150,sortable: true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i:s'),dataIndex:'LastUpdateTime'},
								{header:'LastSignOfLife [UTC]',width:150,sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i:s'),dataIndex:'LastSignOfLife'},
								{header:'SubmissionTime [UTC]',width:150,sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i:s'),dataIndex:'SubmissionTime'},
								{header:'DIRACSetup',sortable:true,dataIndex:'DIRACSetup',align:'left',hidden:true},
								{header:'FailedFlag',sortable:true,dataIndex:'FailedFlag',align:'left',hidden:true},
								{header:'RescheduleCounter',sortable:true,dataIndex:'RescheduleCounter',align:'left',hidden:true},
								{header:'CPUTime',sortable:true,dataIndex:'CPUTime',align:'left',hidden:true},
								{header:'OwnerDN',sortable:true,dataIndex:'OwnerDN',align:'left',hidden:true},
								{header:'JobGroup',sortable:true,dataIndex:'JobGroup',align:'left',hidden:true},
								{header:'JobType',sortable:true,dataIndex:'JobType',align:'left',hidden:true},
								{header:'AccountedFlag',sortable:true,dataIndex:'AccountedFlag',align:'left',hidden:true},
								{header:'OSandboxReadyFlag',sortable:true,dataIndex:'OSandboxReadyFlag',align:'left',hidden:true},
								{header:'Owner',sortable:true,dataIndex:'Owner',align:'left'},
								{header:'TaskQueueID',sortable:true,dataIndex:'TaskQueueID',align:'left',hidden:true},
								{header:'OwnerGroup',sortable:true,dataIndex:'OwnerGroup',align:'left',hidden:true}
							],
						    rendererChkBox : function(val) {
					           return '<input value="' + val + '" type="checkbox" class="checkrow"/>';
					         },
					        rendererStatus : function(value){
					           if ((value == 'Done') || (value == 'Completed')
					               || (value == 'Good') || (value == 'Active')
					               || (value == 'Cleared') || (value == 'Completing')) {
					             return '<img src="static/DIRAC/JobMonitor/images/done.gif"/>';
					           } else if (value == 'Bad') {
					             return '<img src="static/DIRAC/JobMonitor/images/bad.gif"/>';
					           } else if ((value == 'Failed') || (value == 'Bad')
					               || (value == 'Banned') || (value == 'Aborted')) {
					             return '<img src="static/DIRAC/JobMonitor/images/failed.gif"/>';
					           } else if ((value == 'Waiting') || (value == 'Stopped')
					               || (value == 'Poor') || (value == 'Probing')) {
					             return '<img src="static/DIRAC/JobMonitor/images/waiting.gif"/>';
					           } else if (value == 'Deleted') {
					             return '<img src="static/DIRAC/JobMonitor/images/deleted.gif"/>';
					           } else if (value == 'Matched') {
					             return '<img src="static/DIRAC/JobMonitor/images/matched.gif"/>';
					           } else if ((value == 'Running') || (value == 'Active')
					               || (value == 'Fair')) {
					             return '<img src="static/DIRAC/JobMonitor/images/running.gif"/>';
					           } else if (value == 'NoMask') {
					             return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
					           } else {
					             return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
					           }
					         },
						    bbar : me.pagingToolbar.toolbar
						});
						
						
						/*
						 * Structuring the main container
						 */
						Ext.apply(me, {
							layout : 'border',
							bodyBorder: false,
							defaults: {
							    collapsible: true,
							    split: true
							},
							items : [ me.leftPanel,me.grid ]
						});

						me.callParent(arguments);
						
					},
					
					afterRender:function(){
						var me=this;
						
						var menuItems=[];
						for(var cmb in me.cmbSelectors){
							
							menuItems.push({
						        xtype: 'menucheckitem',
						        text: me.cmbSelectors[cmb].getFieldLabel(),
						        relatedCmbField:cmb,
						        checked:true,
						        handler: function(item,e){
						        	
						        	var me=this;
						        	
						        	if(item.checked)
						        		me.cmbSelectors[item.relatedCmbField].show();
						        	else
						        		me.cmbSelectors[item.relatedCmbField].hide();
						        	
						        },
						        scope:me
						    });
							
						}
						
						me.selectorMenu = new Ext.menu.Menu({
							items : menuItems
						});
						
						me.leftPanel.getHeader().addTool({
							xtype : "diracToolButton",
							type : "down",
							menu : me.selectorMenu
						});
						
						this.callParent();
					},
					
					__oprRefreshStoresForSelectors:function(oData,bRefreshStores){
						
						var me = this;
						
						var map = [["app","appStatus"],
				    	           ["minorstat","minorStatus"],
				    	           ["owner","owner"],
				    	           ["prod","jobGroup"],
				    	           ["site","site"],
				    	           ["status","status"],
				    	           ["types","jobType"]];
				    	
				    	for(var j=0;j<map.length;j++){
				    	
					    	var dataOptions = [];
					    	for(var i=0;i<oData[map[j][0]].length;i++)
					    		dataOptions.push([oData[map[j][0]][i][0],oData[map[j][0]][i][0]]);

					    	if(bRefreshStores){
					    		
					    		var oNewStore = new Ext.data.ArrayStore({
					                  fields : ['value', 'text'],
					                  data   : dataOptions 
					              });
					    		
					    		me.cmbSelectors[map[j][1]].refreshStore(oNewStore);
					    		
					    		
					    	}else{
						    	me.cmbSelectors[map[j][1]].store = new Ext.data.ArrayStore({
																			                  fields : ['value', 'text'],
																			                  data   : dataOptions 
																			              });
					    	}
				    	
				    	}
						
					},
					
					__oprValidateBeforeSubmit: function(){
						
						var me = this;
						var bValid = true;
						
						if(!me.textJobId.validate())
							bValid = false;
						
						return bValid;
					},
					
					oprSelectorsRefreshWithSubmit: function(bSubmit){
						
						var me = this;
						
						if(bSubmit && !me.__oprValidateBeforeSubmit())
							return;
						
						me.leftPanel.body.mask("Wait ...");
						Ext.Ajax.request({
						    url: me._baseUrl+'JobMonitor/getSelectionData',
						    params: {

						    },
						    scope:me,
						    success: function(response){
						    	
						    	var me = this;
						    	var response = Ext.JSON.decode(response.responseText);
						    	me.__oprRefreshStoresForSelectors(response,true);
						    	me.leftPanel.body.unmask();
						    	if(bSubmit)
						    		me.oprLoadGridData();
						    	
						    },
						    failure:function(response){
						    	
						    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
						    }
						});
						
					},
					oprLoadGridData:function(){
						
						var me = this;
						
						if(me.__oprValidateBeforeSubmit()){
							
							// Collect data for filtration
							var extraParams = {
									
									site:			((me.cmbSelectors.site.isInverseSelection())?me.cmbSelectors.site.getInverseSelection():me.cmbSelectors.site.getValue().join(",")),
									status:			((me.cmbSelectors.status.isInverseSelection())?me.cmbSelectors.status.getInverseSelection():me.cmbSelectors.status.getValue().join(",")),
									minorstat:		((me.cmbSelectors.minorStatus.isInverseSelection())?me.cmbSelectors.minorStatus.getInverseSelection():me.cmbSelectors.minorStatus.getValue().join(",")),
									app:			((me.cmbSelectors.appStatus.isInverseSelection())?me.cmbSelectors.appStatus.getInverseSelection():me.cmbSelectors.appStatus.getValue().join(",")),
									owner:			((me.cmbSelectors.owner.isInverseSelection())?me.cmbSelectors.owner.getInverseSelection():me.cmbSelectors.owner.getValue().join(",")),
									prod:			((me.cmbSelectors.jobGroup.isInverseSelection())?me.cmbSelectors.jobGroup.getInverseSelection():me.cmbSelectors.jobGroup.getValue().join(",")),
									types:			((me.cmbSelectors.jobType.isInverseSelection())?me.cmbSelectors.jobType.getInverseSelection():me.cmbSelectors.jobType.getValue().join(",")),
									ids:			me.textJobId.getValue(),
									limit:			me.pagingToolbar.pageSizeCombo.getValue()
									
							};
							
							// set those data as extraParams in
							me.grid.store.proxy.extraParams = extraParams;
							me.grid.store.load();
						}
						
					},
					oprResetSelectionOptions: function(){
						
						var me = this;
						me.cmbSelectors.site.setValue([]);
						me.cmbSelectors.status.setValue([]);
						me.cmbSelectors.minorStatus.setValue([]);
						me.cmbSelectors.appStatus.setValue([]);
						me.cmbSelectors.owner.setValue([]);
						me.cmbSelectors.jobGroup.setValue([]);
						me.cmbSelectors.jobType.setValue([]);
						me.textJobId.setValue("");
						
						me.oprLoadGridData();
						
					},
					__oprJobAction:function(oAction,oId){
						
						var me = this;
						var oItems = [];
						  
						if((oId == null) || (oId == '') || (oId == undefined)){
							  
							var oElems = Ext.query("#"+me.id+" input.checkrow");
							
							for(var i=0;i<oElems.length;i++)
								if(oElems[i].checked)
									oItems.push(oElems[i].value);
							
						    if (oItems.length < 1){
						    	alert('No jobs were selected');
						    	return;
						    }
						    
						}else{
						    oItems[0] = oId;
						}
						  
						var c = false;
						  
						if (oItems.length == 1)
							c = confirm ('Are you sure you want to ' + oAction + ' ' + items[0] + '?');
						else
							c = confirm ('Are you sure you want to ' + oAction + ' these jobs?');
						  
						if(c === false) return;
						  
						Ext.Ajax.request({
							url: me._baseUrl+'JobMonitor/jobAction',
							method:'POST',
						    params:{
						    	action:oAction,
						    	ids:oItems.join(",")
						    },
						    success:function(response){
						    	var jsonData = Ext.JSON.decode(response.responseText);
						    	if(jsonData['success'] == 'false'){
						    		alert('Error: ' + jsonData['error']);
						    		return;
						    	}else{
						    		if(jsonData.showResult){
						    			var html = '';
						    			for(var i = 0; i < jsonData.showResult.length; i++){
						    				html = html + jsonData.showResult[i] + '<br>';
						    			}
						    			Ext.Msg.alert('Result:',html);
							        }
						    	}
						    }});
						}

				});
