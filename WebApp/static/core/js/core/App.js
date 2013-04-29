/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.dirac.core.App
 * This class manages the entire application platform
 * @mixins Ext.util.Observable
 * 
 */

Ext.define(
	'Ext.dirac.core.App',
	{
		mixins : {
			observable : 'Ext.util.Observable',
			fileLoader: 'Ext.dirac.utils.DiracFileLoad'
		},

		requires : [ 'Ext.container.Viewport',
		             'Ext.dirac.core.Desktop', 
		             'Ext.window.MessageBox',
		             'Ext.dirac.core.ShortcutModel', 
		             'Ext.dirac.core.CommonFunctions'
		           ],
		/**
		 * @property {boolean} isReady
		 */
		isReady : false,

		/**
		 * @property {List} useQuickTips ?
		 */			

		useQuickTips : true,
		

		constructor : function() {

			var me = this;

			me.addEvents('ready', 'beforeunload');
			
			me.mixins.observable.constructor.call(this, undefined);
			
			Ext.example = function(){
			    var msgCt;

			    function createBox(t, s){
			       return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
			    }
			    return {
			        msg : function(title, format){
			            if(!msgCt){
			                msgCt = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
			            }
			            var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 1));
			            var m = Ext.DomHelper.append(msgCt, createBox(title, s), true);
			            m.hide();
			            m.slideIn('t').ghost("t", { delay: 1000, remove: true});
			        },

			        init : function(){
			            if(!msgCt){
			                // It's better to create the msg-div here in order to avoid re-layouts 
			                // later that could interfere with the HtmlEditor and reset its iFrame.
			                msgCt = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
			            }
			        }
			    };
			}();
		
			Ext.Ajax.request({
			    url: _app_base_url+'getConfigData',
			    params: {},
			    scope:me,
			    success: function(response){
			    	
			    	var configData = Ext.JSON.decode(response.responseText);
			    	me.configData = configData;
			    	
			    	if (Ext.isReady) {
						Ext.Function.defer(me.init, 10, me);
					} else {
						Ext.onReady(me.init, me);
					}
					
			    },
			    failure:function(response){
			    	
			    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			    }
			});
			
			me._cf = new Ext.dirac.core.CommonFunctions();
			
			me.callParent();

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
			desktopCfg = me.getDesktopConfig();
			me.desktop = new Ext.dirac.core.Desktop(desktopCfg);

			me.viewport = new Ext.container.Viewport({
				layout : 'fit',
				items : [ me.desktop ]
			});

			Ext.EventManager.on(window, 'beforeunload',
					me.onUnload, me);
			
			me.isReady = true;//only if there is no desktop state loaded
			me.fireEvent('ready', me);
		},

		/**
		 * This method returns the configuration object for the
		 * Desktop object.
		 * 
		 * @return Object
		 */
		getDesktopConfig : function() {
			var me = this, cfg = {
				app : me,//only if there is no desktop state loaded
				taskbarConfig : me.getTaskbarConfig()
			};

			Ext.apply(cfg, me.desktopConfig);

			return Ext
					.apply(
							cfg,
							{

								contextMenuItems : [ 
//								   {
//									text : 'Change Settings',
//									handler : me.onSettings,
//									scope : me
//								   } 
								  ],

								shortcuts : Ext
										.create(
												'Ext.data.Store',
												{
													model : 'Ext.dirac.core.ShortcutModel',
													data : {}
												}),

								wallpaper : '/DIRAC/static/core/img/wallpapers/desk.jpg',
								wallpaperStretch : true
							});

			return cfg;
		},

		/**
		 * This method returns the configuration object for the
		 * TaskBar.
		 * 
		 * @return Object
		 */
		getTaskbarConfig : function() {
			var me = this, cfg = {
				app : me,
				startConfig : me.getStartConfig()
			};

			Ext.apply(cfg, me.taskbarConfig);

			return Ext.apply(cfg, {
				quickStart : [ 
//				{
//					name : 'Accordion Window',
//					iconCls : 'accordion',
//					module : 'DIRAC.AccordionWindow'
//				}, {
//					name : 'Grid Window',
//					iconCls : 'icon-grid',
//					module : 'DIRAC.GridWindow'
//				} 
				]
//				,trayItems : [ {
//					xtype : 'trayclock',
//					flex : 1
//				} ]
			});

			return cfg;
		},
		/**
		 * This method is used to recursively read the data about the start menu
		 * @return {Object}
		 */
		getMenuStructureRec:function(item){
			
			var me=this;
			
			if(item.length==2){
				
				var result = {text:item[0],menu:[]};
				
				for(var i=0;i<item[1].length;i++)
					result.menu.push(me.getMenuStructureRec(item[1][i]));
				
				return result;
				
			}else{
				if(item[0]=="app"){
					var oParts = item[2].split(".");
					var sStartClass="";
					if(oParts.length==2)
						sStartClass=item[2]+".classes."+oParts[1];
					else
						sStartClass=item[2];
					
					return {
							text:item[1],
							minWidth:200,
							//handler:Ext.bind(me.createWindow, me,[item[0],item[2],((item[0]=="app")?null:{title:item[1]})]),
							menu:[{text:"Default",handler:Ext.bind(me.createWindow, me,[item[0],item[2],null]),minWidth:200},'-'],
							isStateMenuLoaded:0,
							appClassName:sStartClass,
							listeners:{
								render:function(oMenu, eOpts){
									_app.desktop.registerStartAppMenu(oMenu,oMenu.appClassName);
								},
								focus:function(cmp,e,eOpts){
									/*
									 * if the cache for the state of the started application exist
									 */
									/*
									var oParts = item[2].split(".");
									var sStartClass="";
									if(oParts.length==2)
										sStartClass=item[2]+".classes."+oParts[1];
									else
										sStartClass=item[2];
									*/
									if(sStartClass in me.desktop.cache.windows){

										if(cmp.isStateMenuLoaded != 2){
											for (var stateName in me.desktop.cache.windows[sStartClass]) {	
												
												var newItem = Ext.create('Ext.menu.Item', {
									    			  text: stateName,
									    			  handler: Ext.bind(me.createWindow, me, ["app",sStartClass,{stateToLoad:stateName}], false),
									    			  scope:me,
									    			  iconCls:"system_state_icon",
									    			  menu:[{
								    				  		text:"Share state",
								    				  		handler:Ext.bind(_app.oprShareState, _app, [stateName,sStartClass], false)
								    				  	}]
									    		});
					
												cmp.menu.add(newItem);
												
											}
											cmp.isStateMenuLoaded=2;
										}
																
									}else{
										if(cmp.isStateMenuLoaded==0){	
											Ext.Ajax.request({
											    url: me.desktop.getBaseUrl()+'UP/listAppState',
											    params: {
											        app: 	sStartClass,
											        obj: 	"application"
											    },
											    
											    success: function(response){
											    	
											    	var states = Ext.JSON.decode(response.responseText);
											    	me.desktop.cache.windows[sStartClass]={};
											    	
											    	for (var stateName in states) {	
											    		
											    		var newItem = Ext.create('Ext.menu.Item', {
																		    			  text: stateName,
																		    			  handler: Ext.bind(me.createWindow, me, ["app",sStartClass,{stateToLoad:stateName}], false),
																		    			  scope:me,
																		    			  iconCls:"system_state_icon",
																		    			  menu:[{
																	    				  		text:"Share state",
																	    				  		handler:Ext.bind(_app.oprShareState, _app, [stateName,sStartClass], false)
																	    				  	}]
																		    		});
											    		
											    		cmp.menu.add(newItem);
											    		
											    		me.desktop.cache.windows[sStartClass][stateName]=states[stateName];
											    		
											    	}
											    	
											    	cmp.isStateMenuLoaded=2;
											    	
											    	
											    },
											    failure:function(response){
											    	
											    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
											    }
											});
											
											cmp.isStateMenuLoaded = 1;
										}
			
									}
									
									
								}
								
							},
							addNewState: function(stateName){
								
								var oThisMenu = this;
								
								var newItem = Ext.create('Ext.menu.Item', {
					    			  text: stateName,
					    			  handler: Ext.bind(_app.createWindow, _app, ["app",oThisMenu.appClassName,{stateToLoad:stateName}], false),
					    			  scope:me,
					    			  iconCls:"system_state_icon",
					    			  menu:[{
				    				  		text:"Share state",
				    				  		handler:Ext.bind(_app.oprShareState, _app, [stateName,oThisMenu.appClassName], false)
				    				  	}]
					    		});

								oThisMenu.menu.add(newItem);
								
							},
							removeState: function(stateName){
								
								var me = this;
								
								for(var i=2;i<me.menu.items.length;i++){
									
									if(me.menu.items.getAt(i).text==stateName){
										
										me.menu.remove(me.menu.items.getAt(i));
										break;
										
									}
									
								}
								
							},
							oprRefreshAppStates:function(){
								
								var oThisMenu = this;
								
								oThisMenu.menu.removeAll();
								oThisMenu.menu.add([{text:"Default",handler:Ext.bind(_app.createWindow, _app,["app",oThisMenu.appClassName,null]),minWidth:200},'-']);
								
								for (var stateName in _app.desktop.cache.windows[oThisMenu.appClassName]) {	
									
									var newItem = Ext.create('Ext.menu.Item', {
						    			  text: stateName,
						    			  handler: Ext.bind(_app.createWindow, _app, ["app",oThisMenu.appClassName,{stateToLoad:stateName}], false),
						    			  scope:me,
						    			  iconCls:"system_state_icon",
						    			  menu:[{
					    				  		text:"Share state",
					    				  		handler:Ext.bind(_app.oprShareState, _app, [stateName,oThisMenu.appClassName], false)
					    				  	}]
						    		});

									oThisMenu.menu.add(newItem);
									
								}
								
							}
						};
						
				}else{
					
					return {
						text:item[1],
						handler:Ext.bind(me.createWindow, me,[item[0],item[2],{title:item[1]}]),
						minWidth:200
					};
					
					
				}
				
			}
			
		},
		
		/**
		 * This method returns the configuration object for the
		 * Start Button.
		 * 
		 * @return {Object}
		 */
		getStartConfig : function() {
			var me = this, cfg = {
				app : me,
				menu : []
			}, launcher;
			
			Ext.apply(cfg, me.startConfig);
			
			for(var j=0;j<me.configData["menu"].length;j++)
				cfg.menu.push(me.getMenuStructureRec(me.configData["menu"][j]));
			
			return Ext.apply(cfg, {
				title : ((me.configData.user.username)?me.configData["user"]["username"]+"@"+me.configData["user"]["group"]:"Anonymous"),
				iconCls : 'user',
				height : 300,
				toolConfig : {
					width : 100,
//					items : [ 
//					{
//						text : 'Settings',
//						iconCls : 'settings',
//						handler : me.onSettings,
//						scope : me
//					}, '-', {
//						text : 'Logout',
//						iconCls : 'logout',
//						handler : me.onLogout,
//						scope : me
//					} ]
				}
			});

			return cfg;
		},

		/**
		 * Function to create a window and to load the module
		 * defined by the moduleName
		 * 
		 * @param {String}
		 *            moduleName The name of the module (the
		 *            JavaScript class) to be loaded
		 */
		createWindow : function(loadedObjectType,moduleName,setupData) {
			
			Ext.get("app-dirac-loading").show();
			
			if(loadedObjectType =="app"){
				
				var oParts = moduleName.split(".");
				var sStartClass="";
				
				if(oParts.length==2)
					sStartClass=moduleName+".classes."+oParts[1];
				else
					sStartClass=moduleName;
				
				if(_dev == 0){
					
					var oConfig = {
							enabled: true,
							paths: {}
						};
					
					oConfig["paths"]["DIRAC."+oParts[1]+".classes"] = "static/DIRAC/"+oParts[1]+"/build"; 
					
					Ext.Loader.setConfig(oConfig);
					
				}
					 
				
				Ext.require(sStartClass, function() {
					
					var me = this;
					
					me.mixins.fileLoader.loadFile(["static/DIRAC/"+oParts[1]+"/css/"+oParts[1]+".css"],function(){
						
						var me = this;
						
						var instance = Ext.create(sStartClass,{_baseUrl:me.configData.baseURL+"/"});
						
						var config = {
								desktop: me.desktop,
								setupData: setupData,
								loadedObject:instance,
								loadedObjectType:"app"
							};
						
						
						var window = me.desktop.createWindow(config);
						window.show();
						
					},me);
					
				},this);
				
			
			}else if(loadedObjectType == "link"){
				
				var window = this.desktop.createWindow({
				  setupData:setupData,
                  loadedObjectType:"link",
                  linkToLoad:moduleName
                });

				window.show();
				
			}
			
		},
		
		oprShareState: function (sStateName,sAppName) {
	        
			var me = this;
			
			Ext.Ajax.request({
			    url: _app_base_url+'UP/makePublicAppState',
			    params: {
			        app: 		sAppName,
			        obj: 		"application",
			        name: 		sStateName,
			        access: 	"ALL"
			    },
			    scope:me,
			    success: function(response){
			    	
			    	var me = this;

		    		var oStringToShow = "application|"+sAppName
		    			+"|"+_app.configData["user"]["username"]
		    			+"|"+_app.configData["user"]["group"]
		    			+"|"+sStateName;
		    		
		    		var oInfoWindow = Ext.create('widget.window', {
						height : 120,
						width : 800,
						title : "Info for sharing the <span style='color:red'>"+sStateName+"</span> state:",
						layout : 'fit',
						modal: true
					});
		    		
		    		var oHtml = "<div style='padding:5px'>The string you can send is as follows:</div>";
		    		oHtml+="<div style='padding:5px;font-weight:bold'>"+oStringToShow+"</div>";
		    		
		    		oInfoWindow.add({html: oHtml,xtype: "panel"});		
		    		
		    		oInfoWindow.show();
			    	
			    },
			    failure:function(response){
			    	
			    	var responseData = Ext.JSON.decode(response.responseText);
			    	Ext.example.msg("Notification", responseData["error"]);
			    }
			});	
			    	
	    },

		/**
		 * Getter of the desktop object
		 * 
		 * @return {Ext.dirac.core.Desktop}
		 */
		getDesktop : function() {
			return this.desktop;
		},
		
		getDesktopDimensions: function(){
			
			var me=this;
			
			return [me.desktop.getWidth(),me.desktop.getHeight()];
			
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
		},

		onLogout : function() {
			Ext.Msg.confirm('Logout',
					'Are you sure you want to logout?');
		}

	});
