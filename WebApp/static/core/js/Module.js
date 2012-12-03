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
 * @mixin Ext.util.Observable
 * 
 */
Ext.define('Ext.ux.desktop.Module', {
	mixins : {
		observable : 'Ext.container.Container'
	},
	/**
	 * @property {int} _UID The unique number assigned to the module, used as part of the defined id-s within the module
	 */
	_UID:0,
	
	constructor : function(config) {
		this.mixins.observable.constructor.call(this, config);
		this.init();
	},

	init : Ext.emptyFn,
	
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
	
	D_ID: function(id){
		
		return id+this._UID;
		
	},
	
	getStateData : function(){
		
						return {};
					},
	loadState : function(data){},
	
});
