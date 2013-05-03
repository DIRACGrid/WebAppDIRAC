/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('LHCbDIRAC.LHCbJobMonitor.classes.LHCbJobMonitor',{
    extend:'DIRAC.JobMonitor.classes.JobMonitor',
    initComponent : function() {

	var me = this;
	me.callParent();
	me.launcher.title = "LHCb Job Monitor";
	me.textRunNumber = Ext.create('Ext.form.field.Text',{

	    fieldLabel: "Run Number(s)",
	    labelAlign:'top',
	    anchor:"100%",
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
			return "The run number(s) expression is not valid";

		}else
		    return true;

	    }
	});

	me.leftPanel.add(me.textRunNumber);

	me.lhcbFields = ['SystemPriority','VerifiedFlag','RetrievedFlag','StartExecTime','JobSplitType',
	                 'ApplicationNumStatus','MasterJobID','KilledFlag','RescheduleTime','RunNumber',
	                 'ISandboxReadyFlag','HeartBeatTime','EndExecTime','UserPriority','DeletedFlag',
	                 'TaskQueueID'];
	var dataFieldsLength = me.dataFields.length;
	var columnsLength = me.grid.columns.length;
	for (var i = 0; i<me.lhcbFields.length; i++){
	    if (!me.__isDataFieldContains(me.dataFields, me.lhcbFields[i])){
		me.dataFields[dataFieldsLength] =  {name:me.lhcbFields[i]};
		dataFieldsLength++;
	    }
	    if (!me.__isCoulmnsContains(me.grid.columns, me.lhcbFields[i])){
		me.grid.columns[columnsLength] = Ext.create("Ext.grid.column.Column",{header:me.lhcbFields[i],sortable:true,dataIndex:me.lhcbFields[i],align:'left',hidden:true});
		columnsLength++;
	    }
	}
	//refresh the data store fields list.
	me.dataStore.fields = me.dataFields;
    },
    __isDataFieldContains: function(list, value){
	var found = false;
	i = 0;
	while (!(found = (list[i].name == value)) && i<list.length - 1) i++;
	return found;
    },
    __isCoulmnsContains: function(columns, value){
	var found = false;
	i = 0;
	while (!(found = (columns[i].dataIndex == value)) && i<columns.length - 1) i++;
	return found;
    },
    __oprValidateBeforeSubmit: function(){

	var me = this;
	var bValid = true;
	bValid = me.callParent(); //.__oprValidateBeforeSubmit();

	if(!me.textRunNumber.validate())
	    bValid = false;

	return bValid;
    },
    //add the new parameter to the selection
    oprLoadGridData : function(){
	var me = this;
	me.callParent();
	me.grid.store.proxy.extraParams['RunNumbers'] = me.textRunNumber.getValue();
	console.log(me.grid.store.proxy.extraParams);
	//reload the grid
	me.grid.store.load();


    }
});

