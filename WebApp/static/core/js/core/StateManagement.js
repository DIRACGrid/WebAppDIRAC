/**
 * @class Ext.dirac.core.StateManagement
 * This class manages the entire application platform
 * @mixins Ext.util.Observable
 * 
 */

Ext.define('Ext.dirac.core.StateManagement',
	{
		requires : [ ],
	
		cache:{	application:{},
				desktop:{},
				reference:{}
			  },
			  
		oprReadApplicationStates:function(sAppName,sStateType,funcCallBack){
			
			var me = this;
			
			Ext.Ajax.request({
			    url: _app_base_url+'UP/listAppState',
			    params: {
			        app: 	sAppName,
			        obj: 	sStateType
			    },
			    success: function(response){
			    	
			    	var oStates = Ext.JSON.decode(response.responseText);
			    	me.cache[sStateType][sAppName]={};
			    	
			    	for (var sStateName in oStates) {	
			    		
			    		me.cache[sStateType][sAppName][sStateName]=oStates[sStateName];
			    		
			    	}
			    	
			    	funcCallBack();
			    	
			    },
			    failure:function(response){
			    	
			    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			    }
			});
			
		},
		
		oprReadApplicationStatesAndReferences:function(sAppName,funcCallBack){
			
			var me = this;
			
			var sStateType = ((sAppName=="desktop")?"desktop":"application"); 
			
			Ext.Ajax.request({
			    url: _app_base_url+'UP/listAppState',
			    params: {
			        app: 	sAppName,
			        obj: 	sStateType	
			    },
			    success: function(response){
			    	
			    	var oStates = Ext.JSON.decode(response.responseText);
			    	me.cache[sStateType][sAppName]={};
			    	
			    	for (var sStateName in oStates) {	
			    		
			    		me.cache[sStateType][sAppName][sStateName]=oStates[sStateName];
			    		
			    	}
			    	
			    	Ext.Ajax.request({
					    url: _app_base_url+'UP/listAppState',
					    params: {
					        app: 	sAppName,
					        obj: 	"reference"
					    },
					    success: function(response){
					    	
					    	var oStates = Ext.JSON.decode(response.responseText);
					    	me.cache["reference"][sAppName]={};
					    	
					    	for (var sStateName in oStates) {	
					    		
					    		me.cache["reference"][sAppName][sStateName]=oStates[sStateName];
					    		
					    	}
			    	
					    	funcCallBack();
					    	
					    },
					    failure:function(response){
					    	me.cache["reference"][sAppName]={};
					    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
					    }
					});
			    	
			    },
			    failure:function(response){
			    	
			    	me.cache[sStateType][sAppName]={};
			    	me.cache["reference"][sAppName]={};
			    	
			    	Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
			    }
			});
			
		},
			  
		isStateLoaded:function(sStateType,sAppName,sStateName){
			
			var me = this;
			
			if(sAppName in me.cache[sStateType]){
				
				if(sStateName in me.cache[sStateType][sAppName]){
					
					return 1;
					
				}else{
					
					return -1;
					
				}
				
			}else{
				return -2;
			}
			
		},
		
		getStateData:function(sStateType,sAppName,sStateName){
			
			var me = this;
			var oValidation = me.isStateLoaded(sStateType, sAppName, sStateName); 
			
			if(oValidation==1){
				
				return me.cache[sStateType][sAppName][sStateName];
				
			}else
				return oValidation;	
			
		}
		
	});
