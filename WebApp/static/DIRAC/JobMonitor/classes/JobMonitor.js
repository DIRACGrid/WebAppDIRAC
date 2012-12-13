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

					requires : [ 'Ext.data.JsonStore','Ext.util.*'],

					launcher: {
						
						text : 'Job Monitor',
						iconCls : 'notepad'
						
					},
					

					loadState : function(data) {
						
						var me = this;
						
						for(var i=0;i<me.grid.columns.length;i++){
							
							var col=me.grid.columns[i];
							col.setWidth(data.columns[col.getSortParam()].width);
							if(data.columns[col.getSortParam()].hidden)
								col.hide();
							else
								col.show();
							
						}
						
						
					},

					getStateData : function() {
						
						
						var me = this;
						var oReturn = {};
						
						oReturn.columns={};
						
						for(var i=0;i<me.grid.columns.length;i++){
						
							var col=me.grid.columns[i];
							var oName = col.getSortParam();
							oReturn.columns[oName]={"width":col.width,"hidden":col.isHidden()};
							
						
						}
						
						return oReturn;

					},
					examplem:function(val){
						
						return "OK";
						
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
					dataUrl: 'JobMonitor/getJobData',
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
						
						
						me.dataStore = new Ext.data.JsonStore({
						    proxy: {
						        type: 'ajax',
						        url: me.dataUrl,
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
						    store: me.dataStore,
						    columns: me.dataColumns
						});
						
						Ext.apply(me, {
							layout : 'fit',
							items : [ me.grid ]
						});

						me.callParent(arguments);

					},

				});
