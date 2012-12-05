/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.ux.desktop.TaskBar
 * The taskbar class. An object of this class 
 * has three main parts: 
 *  - Start menu
 *  - Quick start menu
 *  - Window bar (syn. task bar)
 * @extends Ext.toolbar.Toolbar
 */
Ext.define('Ext.ux.desktop.TaskBar', {
    extend: 'Ext.toolbar.Toolbar', // TODO - make this a basic hbox panel...

    requires: [
        'Ext.button.Button',
        'Ext.resizer.Splitter',
        'Ext.menu.Menu',
        'Ext.ux.desktop.StartMenu',
        'Ext.toolbar.TextItem'
    ],

    alias: 'widget.taskbar',

    cls: 'ux-taskbar',

    /**
	 * @cfg {String} startBtnText The text for the Start Button.
	 */
    startBtnText: 'Start',

    initComponent: function () {
    	
        var me = this;
        
        me.startMenu = new Ext.ux.desktop.StartMenu(me.startConfig);

        me.quickStart = new Ext.toolbar.Toolbar(me.getQuickStart());

        me.windowBar = new Ext.toolbar.Toolbar(me.getWindowBarConfig());
        
        var button_data={
        		"text":me.app.configData["user_config"]["group"],
        		"menu":[]
        };
        
        me.items = [
                    {
                        xtype: 'button',
                        cls: 'ux-start-button',
                        iconCls: 'ux-start-button-icon',
                        menu: me.startMenu,
                        menuAlign: 'bl-tl',
                        text: me.startBtnText
                    },
                    me.quickStart,
                    {
                        xtype: 'splitter', html: '&#160;',
                        height: 14, width: 2, // TODO - there should be a CSS way here
                        cls: 'x-toolbar-separator x-toolbar-separator-horizontal'
                    },
                    me.windowBar
                   ];
        
        
        if(me.app.configData["user_config"]){
        	
        	/*
             * If the user is registered
             */
	        for(var i=0;i<me.app.configData["user_config"]["groups"].length;i++)
	        	button_data.menu.push({	text:me.app.configData["user_config"]["groups"][i]});
	        
	        me.group_button = new Ext.button.Button(button_data);
	        
	        
	        var setup_data={
	        		"text":me.app.configData["user_config"]["setup"],
	        		"menu":[]
	        };
	        
	        for(var i=0;i<me.app.configData["user_config"]["setups"].length;i++)
	        	setup_data.menu.push({	text:me.app.configData["user_config"]["setups"][i]});
	        
	        me.setup_button = new Ext.button.Button(setup_data);
	        me.items.push('-');
	        me.items.push({
	              xtype: 'tbtext', 
	              text:me.app.configData["user_config"]["username"]+"@"
	          });
	        me.items.push(me.group_button);
	        me.items.push('-');
	        me.items.push(me.setup_button);
	        
        }else{
        	
        	/*
             * If the user is not registered
             */
        	me.items.push('-');
        	me.items.push({
				              xtype: 'tbtext', 
				              text:"Anonymous"
				          });
        }

        me.callParent();
    },

    afterLayout: function () {
        var me = this;
        me.callParent();
        me.windowBar.el.on('contextmenu', me.onButtonContextMenu, me);
    },

    /**
	 * This method returns the configuration object for the Quick Start toolbar.
	 * A derived class can override this method, call the base version to build
	 * the config and then modify the returned object before returning it.
	 */
    getQuickStart: function () {
        var me = this, ret = {
            minWidth: 20,
            width: 60,
            items: [],
            enableOverflow: true
        };

        Ext.each(this.quickStart, function (item) {
            ret.items.push({
                tooltip: { text: item.name, align: 'bl-tl' },
                // tooltip: item.name,
                overflowText: item.name,
                iconCls: item.iconCls,
                module: item.module,
                handler: me.onQuickStartClick,
                scope: me
            });
        });

        return ret;
    },
    
    /**
     * Event handler executed when a button 
     * from the quick bar is clicked
     * 
     * @param {Ext.button.Button} btn Button that has been clicked 
     */
    onQuickStartClick: function (btn) {
//        var module = this.app.getModule(btn.module),
//            window;
//
//        if (module) {
//            window = module.createWindow();
//            window.show();
//        }
    	/*
    	 * This to be implemented
    	 */
    },
    
    /**
	 * This method returns the configuration object for the Tray toolbar. A
	 * derived class can override this method, call the base version to build
	 * the config and then modify the returned object before returning it.
	 */
    getTrayConfig: function () {
        var ret = {
            width: 80,
            items: this.trayItems
        };
        delete this.trayItems;
        return ret;
    },

    getWindowBarConfig: function () {
        return {
            flex: 1,
            cls: 'ux-desktop-windowbar',
            items: [ '&#160;' ],
            layout: { overflowHandler: 'Scroller' }
        };
    },

    getWindowBtnFromEl: function (el) {
        var c = this.windowBar.getChildByElement(el);
        return c || null;
    },
    
    onButtonContextMenu: function (e) {
        var me = this, t = e.getTarget(), btn = me.getWindowBtnFromEl(t);
        if (btn) {
            e.stopEvent();
            me.windowMenu.theWin = btn.win;
            me.windowMenu.showBy(t);
        }
    },

    /**
     * Function to add a (task) button 
     * within the task bar
     * @param {Ext.window.Window} win The window to be referenced by the button
     * @return {Ext.button.Button} Button object added to the task bar
     */
    addTaskButton: function(win) {
        var config = {
            iconCls: win.iconCls,
            enableToggle: true,
            toggleGroup: 'all',
            width: 140,
            margins: '0 2 0 3',
            text: Ext.util.Format.ellipsis(win.title, 20),
            listeners: {
                click: this.onWindowBtnClick,
                scope: this
            },
            win: win
        };
        var cmp = this.windowBar.add(config);
        cmp.toggle(true);
        return cmp;
    },
    
    /**
     * Event handler executed when a button is clicked
     * 
     * @param {Ext.button.Button} btn Button that has been clicked 
     */
    onWindowBtnClick: function (btn) {
        var win = btn.win;

        if (win.minimized || win.hidden) {
            win.show();
        } else if (win.active) {
            win.minimize();
        } else {
            win.toFront();
        }
    },
    
    /**
     * Function to remove a (task) button 
     * within the task bar
     * @param {Ext.button.Button} btn The button to be removed
     * @return {Ext.button.Button} Button object removed from the task bar
     */
    removeTaskButton: function (btn) {
        var found, me = this;
        me.windowBar.items.each(function (item) {
            if (item === btn) {
                found = item;
            }
            return !found;
        });
        if (found) {
            me.windowBar.remove(found);
        }
        return found;
    },
    
    /**
     * Function to activate a button
     * 
     * @param {Ext.button.Button} btn The button to be removed
     */
    setActiveButton: function(btn) {
        if (btn) {
            btn.toggle(true);
        } else {
            this.windowBar.items.each(function (item) {
                if (item.isButton) {
                    item.toggle(false);
                }
            });
        }
    }
});