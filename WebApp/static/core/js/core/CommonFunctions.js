/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

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

	}
});
