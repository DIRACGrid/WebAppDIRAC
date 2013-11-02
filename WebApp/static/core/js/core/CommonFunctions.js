/**
 * @class Ext.dirac.core.CommonFunctions This class manages the entire
 *        application platform
 * @mixins Ext.util.Observable
 * 
 */

Ext.define('Ext.dirac.core.CommonFunctions', {
	requires : [],

	getFieldValueFromSelectedRow : function(oGrid, oFieldName) {

		var oVal = "";
		var oSelectedRecords = oGrid.getSelectionModel().getSelection();

		if (oSelectedRecords.length > 0)
			oVal = oSelectedRecords[0].get(oFieldName);

		return oVal;
	},

	doubleItemValue : function(oList) {

		for ( var i = 0; i < oList.length; i++)
			oList[i] = [ oList[i], oList[i] ];

		return oList;

	},

	alert : function(sMessage, sType) {
		
		sMessage = sMessage.replace(new RegExp("\n", 'g'), "<br/>");
		
		switch (sType) {

		case "error":
			Ext.MessageBox.show({
				title : 'Error',
				msg : sMessage,
				buttons : Ext.MessageBox.OK,
				icon : Ext.MessageBox.ERROR
			});
			break;

		case "info":
			Ext.MessageBox.show({
				title : 'Information',
				msg : sMessage,
				buttons : Ext.MessageBox.OK,
				icon : Ext.MessageBox.INFO
			});
			break;

		case "warning":
			Ext.MessageBox.show({
				title : 'Warning',
				msg : sMessage,
				buttons : Ext.MessageBox.OK,
				icon : Ext.MessageBox.WARNING
			});
			break;

		}

	},

	job_status_palette : {
		'Received' : '#D9E7F8',
		'Checking' : '#FAFAFA',
		'Staging' : '#6190CD',
		'Waiting' : '#004EFF',
		'Matched' : '#FEF7AA',
		'Running' : '#FDEE65',
		'Stalled' : '#BC5757',
		'Completed' : '#00FF21',
		'Done' : '#238802',
		'Failed' : '#FF0000',
		'failed' : '#FF0000',
		'Killed' : '#111111'
	},

	job_minor_status_palette : {
		"AncestorDepth Not Found" : '#BAA312',
		'Application Finished With Errors' : '#BC2133',
		'BK Input Data Not Available' : '#E6D600',
		'BK-LFC Integrity Check Failed' : '#BC1143',
		'Can not get Active and Banned Sites from JobDB' : '#84CBFF',
		'Chosen site is not eligible' : '#B4A243',
		'Error Sending Staging Request' : '#B4A243',
		'Exceeded Maximum Dataset Limit (100)' : '#BA5C9D',
		'Exception During Execution' : '#AA240C',
		'Execution Complete' : '#338B39',
		'Failed to access database' : '#FFE267',
		'File Catalog Access Failure' : '#FF8000',
		'Illegal Job JDL' : '#D96C00',
		'Impossible Site + InputData Requirement' : '#BDA822',
		'Impossible Site Requirement' : '#F87500',
		'Input Data Not Available' : '#2822A6',
		'Input Data Resolution' : '#FFBE94',
		'Input Sandbox Download' : '#586CFF',
		'Input data contains //' : '#AB7800',
		'Input data not correctly specified' : '#6812D6',
		'Job Wrapper Initialization' : '#FFFFCC',
		'Job has exceeded maximum wall clock time' : '#FF33CC',
		'Job has insufficient disk space to continue' : '#33FFCC',
		'Job has reached the CPU limit of the queue' : '#AABBCC',
		'No Ancestors Found For Input Data' : '#BDA544',
		'No candidate sites available' : '#E2FFBC',
		'No eligible sites for job' : '#A8D511',
		'Parameter not found' : '#FFB80C',
		'Pending Requests' : '#52FF4F',
		'Received Kill signal' : '#FF312F',
		'Socket read timeout exceeded' : '#B400FE',
		'Stalled' : '#FF655E',
		'Uploading Job Outputs' : '#FE8420',
		'Watchdog identified this job as stalled' : '#FFCC99'
	}
});
