/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.ux.desktop.Desktop
 * This is an abstract class that has 
 * to be inherited by every module.
 * @mixin Ext.container.Container
 * 
 */
Ext.define('Ext.ux.desktop.Module', {
	mixins:["Ext.ux.desktop.Stateful"],
	extend: 'Ext.container.Container',
	
	/**
	 * @property {int} _UID The unique number assigned to the module, used as part of the defined id-s within the module
	 */
	_UID:0,
	
	launcher: {
		
		title : 'Module',
		iconCls : 'notepad',
		width:0,
		height:0,
		maximized:true
		
	},
	
	constructor : function(config) {
		console.log(config);
		this._baseUrl = config._baseUrl;
		this.init();
		this.callParent();
	},

	init : Ext.emptyFn,

	_baseUrl:"",

	/**
	 * Setter function for the property _UID
	 * @param {int} _UID
	 */
	setUID: function(_UID){
		
		this._UID=_UID;
		
	},
	
	/**
	 * Getter function for the property _UID
	 */
	getUID: function(){
		
		return this._UID;
		
	},
	
	/**
	 * This function can be used by 
	 * the developers of the module, so that they can use 
	 * id-s across the modules without worry of duplicating id-s 
	 */
	D_ID: function(id){
		
		return id+this._UID+this.id;
		
	}
	
});
