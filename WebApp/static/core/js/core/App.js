/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.dirac.core.App This class manages the entire application platform
 * @mixins Ext.util.Observable
 * 
 */

Ext.define('Ext.dirac.core.App', {
    mixins : {
	observable : 'Ext.util.Observable',
	fileLoader : 'Ext.dirac.utils.DiracFileLoad'
    },

    requires : [ 'Ext.container.Viewport', 'Ext.dirac.core.Desktop', 'Ext.window.MessageBox', 'Ext.dirac.core.ShortcutModel', 'Ext.dirac.core.CommonFunctions', 'Ext.dirac.core.StateManagement' ],
    /**
     * @property {boolean} isReady
     */
    isReady : false,

    /**
     * @property {List} useQuickTips ?
     */

    useQuickTips : true,

    validApplications : {},

    constructor : function() {

	var me = this;
	
	me.addEvents('ready', 'beforeunload');

	me.mixins.observable.constructor.call(this, undefined);

	Ext.example = function() {
	    var msgCt;

	    function createBox(t, s) {
		return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
	    }
	    return {
		msg : function(title, format) {
		    if (!msgCt) {
			msgCt = Ext.DomHelper.insertFirst(document.body, {
			    id : 'msg-div'
			}, true);
		    }
		    var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 1));
		    var m = Ext.DomHelper.append(msgCt, createBox(title, s), true);
		    m.hide();
		    m.slideIn('t').ghost("t", {
			delay : 1000,
			remove : true
		    });

		},

		init : function() {
		    if (!msgCt) {
			// It's better to create the msg-div here in order to
			// avoid re-layouts
			// later that could interfere with the HtmlEditor and
			// reset its iFrame.
			msgCt = Ext.DomHelper.insertFirst(document.body, {
			    id : 'msg-div'
			}, true);
		    }
		}
	    };
	}();

	Ext.Ajax.request({
	    url : GLOBAL.BASE_URL + 'getConfigData',
	    params : {},
	    scope : me,
	    success : function(response) {

		var configData = Ext.JSON.decode(response.responseText);
		
		me.configData = configData;
		
		me.__readValidApplication();

		if (Ext.isReady) {
		    Ext.Function.defer(me.init, 10, me);
		} else {
		    Ext.onReady(me.init, me);
		}
	    },
	    failure : function(response) {

		Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
	    }
	});

	me.CF = new Ext.dirac.core.CommonFunctions();
	me.SM = new Ext.dirac.core.StateManagement();

	me.callParent();

    },
    
    __readValidApplication:function(){
	
	var me = this;
	
	for ( var i = 0; i < me.configData["menu"].length; i++)
	   me.__getAppRecursivelyFromConfig(GLOBAL.APP.configData["menu"][i]);
	
    },
    
    __getAppRecursivelyFromConfig:function(item){
	
	var me = this;
	
	if (item.length == 2) {

	    for ( var i = 0; i < item[1].length; i++){
		me.__getAppRecursivelyFromConfig(item[1][i]);
	    }
	    
	} else {
	    if (item[0] == "app") {
		
		var oParts = item[2].split(".");
		
		var sStartClass = "";
		if (oParts.length == 2)
		    sStartClass = item[2] + ".classes." + oParts[1];
		else
		    sStartClass = item[2];
		
		me.validApplications[sStartClass]=item[1]; 
		
	    }

	}
	
    },
    
    init : function() {

	var me = this, desktopCfg;

	/*
	 * ?
	 */
	if (me.useQuickTips) {
	    Ext.QuickTips.init();
	}

	/*
	 * Creating the main desktop obbject
	 */
	desktopCfg = {
	    contextMenuItems : [
	    // {
	    // text : 'Change Settings',
	    // handler : me.onSettings,
	    // scope : me
	    // }
	    ],
	    shortcuts : Ext.create('Ext.data.Store', {
		model : 'Ext.dirac.core.ShortcutModel',
		data : {}
	    }),
	    wallpaper : '/DIRAC/static/core/img/wallpapers/dirac_background_6.png',
	    wallpaperStretch : false
	};

	me.desktop = null;

	me.desktop = new Ext.dirac.core.Desktop(desktopCfg);

	me.viewport = new Ext.container.Viewport({
	    layout : 'fit',
	    items : [ me.desktop ]
	});

	Ext.EventManager.on(window, 'beforeunload', me.onUnload, me);

	me.isReady = true;// only if there is no desktop state loaded
	me.fireEvent('ready', me);
    },
    
    isValidApplication:function(sAppName){
	
	return (sAppName in this.validApplications); 
	
    },
    
    getApplicationTitle:function(sAppName){
	
	if(sAppName in this.validApplications){
	    return this.validApplications[sAppName];
	}else{
	    return "DESKTOP";
	}
	
    },
    
    getDesktop : function() {
	return this.desktop;
    },

    onReady : function(fn, scope) {
	if (this.isReady) {
	    fn.call(scope, this);
	} else {
	    this.on({
		ready : fn,
		scope : scope,
		single : true
	    });
	}
    },

    onUnload : function(e) {
	if (this.fireEvent('beforeunload', this) === false) {
	    e.stopEvent();
	}
    }

});
