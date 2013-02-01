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
					extend : 'Ext.ux.desktop.Module',

					requires : [ 'Ext.data.JsonStore',
					             'Ext.util.*', 
					             'Ext.panel.Panel',
					             "Ext.ux.desktop.ToolButton",
					             "Ext.ux.form.MultiSelect",
					             "Ext.ux.desktop.DiracMultiSelect",
					             "Ext.ux.form.field.BoxSelect"],					

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
					
					dataColumns : [
//					               {header:'',name:'checkBox',id:'checkBox',width:26,sortable:false,dataIndex:'JobIDcheckBox',renderer:chkBox,hideable:false,fixed:true,menuDisabled:true},
								    {header:'JobId',sortable:true,dataIndex:'JobID',align:'left',hideable:false},
//								    {header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:status,hideable:false,fixed:true,menuDisabled:true},
								    {header:'Status',width:60,sortable:true,dataIndex:'Status',align:'left'},
								    {header:'MinorStatus',sortable:true,dataIndex:'MinorStatus',align:'left'},
								    {header:'ApplicationStatus',sortable:true,dataIndex:'ApplicationStatus',align:'left'},
								    {header:'Site',sortable:true,dataIndex:'Site',align:'left'},
								    {header:'JobName',sortable:true,dataIndex:'JobName',align:'left'},
								    {header:'LastUpdate [UTC]',sortable: true,renderer:"date",dataIndex:'LastUpdateTime'},
								    {header:'LastSignOfLife [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'LastSignOfLife'},
								    {header:'SubmissionTime [UTC]',sortable:true,renderer:Ext.util.Format.dateRenderer('Y-m-d H:i'),dataIndex:'SubmissionTime'},
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
					dataFields:[
					            {name:'SystemPriority', type: 'float'},
					            {name:'ApplicationNumStatus'},
					            {name:'JobID', type: 'float'},
					            {name:'LastSignOfLife',type:'date',dateFormat:'Y-n-j h:i:s'},
					            {name:'VerifiedFlag'},
					            {name:'RetrievedFlag'},
					            {name:'Status'},
					            {name:'StartExecTime',type:'date',dateFormat:'Y-n-j h:i:s'},
					            {name:'RescheduleCounter'},
					            {name:'JobSplitType'},
					            {name:'MinorStatus'},
					            {name:'ApplicationStatus'},
					            {name:'SubmissionTime',type:'date',dateFormat:'Y-n-j h:i:s'},
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
					            {name:'LastUpdateTime',type:'date',dateFormat:'Y-n-j h:i:s'},
					            {name:'Site'},
					            {name:'HeartBeatTime',type:'date',dateFormat:'Y-n-j h:i:s'},
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
							
							me.cmbSelectors[cmb] = Ext.create('Ext.ux.form.field.BoxSelect', {
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
									return String(newValue).search (regExpr) != -1;
						    	}else
						    		return true;
								
						    }

						});
						
						me.leftPanel.add(me.textJobId);
						
						me.textRunNumber = Ext.create('Ext.form.field.Text',{
							
							fieldLabel: "RunNumber",
						    labelAlign:'top',
						    width:220

						});
						
						me.leftPanel.add(me.textRunNumber);
						
						
						me.btnSubmit = new Ext.Button({
							
							text: 'Submit',
							margin:3
							
						});
						
						me.btnReset = new Ext.Button({
							
							text: 'Reset',
							margin:3
							
						});
						
						var oPanelButtons = new Ext.create('Ext.panel.Panel',{
						    autoHeight:true,
						    border:false,
							items:[me.btnSubmit,me.btnReset]
						});
						
						me.leftPanel.add(oPanelButtons);
						
//						me.leftPanel.add([me.cmbSelectors.site,
//						                  me.cmbSelectors.status, 
//						                  me.cmbSelectors.minorStatus, 
//						                  me.cmbSelectors.appStatus,
//						                  me.cmbSelectors.owner, 
//						                  me.cmbSelectors.jobGroup, 
//						                  me.cmbSelectors.jobType]);
						
						Ext.Ajax.request({
						    url: me._baseUrl+'JobMonitor/getSelectionData',
						    params: {

						    },
						    scope:me,
						    success: function(response){
						    	
						    	var me = this;
						    	var response = Ext.JSON.decode(response.responseText);
						    	//console.log(response);
						    	//site - options
						    	
						    	var map = [["app","appStatus"],
						    	           ["minorstat","minorStatus"],
						    	           ["owner","owner"],
						    	           ["prod","jobGroup"],
						    	           ["site","site"],
						    	           ["status","status"],
						    	           ["types","jobType"]];
						    	
						    	for(var j=0;j<map.length;j++){
						    	
							    	var dataOptions = [];
							    	for(var i=0;i<response[map[j][0]].length;i++)
							    		dataOptions.push([response[map[j][0]][i][0],response[map[j][0]][i][0]]);
							    	
							    	
							    	me.cmbSelectors[map[j][1]].store=new Ext.data.ArrayStore({
																				                  fields : ['value', 'text'],
																				                  data   : dataOptions 
																				              });
						    	
						    	}
						    	
						    },
						    failure:function(response){
						    	
						    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
						    }
						});
						
//						var oInverseButton = new Ext.Button({
//						    text: 'Inverse',
//						    listeners:{
//						    	
//						    	click: function(btn,e,eOpt) {
//						    		
//								    		var oBoundList=btn.multiListRef.boundList;
//						    				var oSelectionModel = oBoundList.getSelectionModel();
//						    				var oAllRecords = oBoundList.getRecords(oBoundList.getNodes());
//						    				var oSelectedRecords = oBoundList.getRecords(oBoundList.getSelectedNodes());
//						    				
//						    				var oInverseRecords=[];
//						    				
//						    				for(var i=0;i<oAllRecords.length;i++)
//						    					if(!(oSelectionModel.isSelected(oAllRecords[i])))
//						    						oInverseRecords.push(oAllRecords[i]);
//						 
//						    				oSelectionModel.select(oInverseRecords);
//						    	
//						    	}
//						
//						    },
//						    multiListRef:me.exampleMultiSelect
//						});
		
						
//						me.newCombo2 = new Ext.ux.form.field.BoxSelect({
//					         
//					          displayField: "text",
//					          valueField: "value",
//					          width: 220,
//					          store: new Ext.data.ArrayStore({
//				                  fields : ['value', 'text'],
//				                  data   : [
//				                      ["AL", "Alabama"],
//				                      ["AK", "Alaska"],
//				                      ["AZ", "Arizona"],
//				                      ["MK", "Makedonija"]
//				                  ]
//				              }),
//					          queryMode: "local"
//					       });
//				
//						me.leftPanel.add(me.newCombo2);
						

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

						    //alternatively, a Ext.data.Model name can be given (see Ext.data.Store for an example)
						    fields: me.dataFields,
						    autoLoad : true
						});
						
						me.grid = Ext.create('Ext.grid.Panel', {
							region: 'center',
						    store: me.dataStore,
						    columns: me.dataColumns
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
							xtype : "toolButton",
							type : "save",
							menu : me.selectorMenu
						});
						
						this.callParent();
					}

				});
