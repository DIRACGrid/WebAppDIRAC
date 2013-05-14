/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.dirac.core.Desktop This is an abstract class that has to be
 *        inherited by every module.
 * @mixin Ext.container.Container
 * 
 */
Ext.define('Ext.dirac.core.Module', {
    mixins : [ "Ext.dirac.core.Stateful", "Ext.dirac.utils.DiracFileLoad" ],
    extend : 'Ext.container.Container',

    _container : null,

    constructor : function(config) {

	this.launcher = {

	    title : 'Module',
	    iconCls : 'notepad',
	    width : 0,
	    height : 0,
	    maximized : true

	};

	//this.init();
	this.callParent();
	this.loadCSS();
    },

    setContainer : function(oContainer) {

	this._container = oContainer;

    },
    getContainer : function() {

	return this._container;

    },

    buildUI : Ext.emptyFn,

    loadCSS : function() {
	var me = this;
	var superClassName = me.superclass.self.getName();
	if (superClassName != "Ext.dirac.core.Module") {
	    var oParts = superClassName.split(".");
	    _app.mixins.fileLoader.loadFile([ "static/" + oParts[0] + "/" + oParts[1] + "/css/" + oParts[1] + ".css" ]);
	}

	var oParts = me.self.getName().split(".");
	_app.mixins.fileLoader.loadFile([ "static/" + oParts[0] + "/" + oParts[1] + "/css/" + oParts[1] + ".css" ], function() {

	    var me = this;

	    me.buildUI();

	}, me);

    }

});
