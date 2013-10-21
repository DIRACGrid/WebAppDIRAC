/**
	 * @class Ext.dirac.core.StateManagement This class manages the entire
	 *        application platform
	 * @mixins Ext.util.Observable
	 * 
	 */

Ext.define('Ext.dirac.core.StateManagement', {
	requires : [],

	/*
	 * Cache serves to save the application states and references
	 */
	cache : {
		application : {},
		reference : {}
	},

	/*
	 * A list of active states on the desktop
	 */
	activeStates : [],

	/**
	 * Function that serves to check whether a state has been loaded or not
	 * 
	 * @param {String}
	 *          sStateType The type of the state [application|reference]
	 * @param {String}
	 *          sAppName Application class name
	 * @param {String}
	 *          sStateName The name of the state
	 * @return {int} 1 - state exists in the cache -1 - state does not exist -2 -
	 *         the application cache has not been loaded yet
	 */
	isStateLoaded : function(sStateType, sAppName, sStateName) {

		var me = this;

		if (sAppName in me.cache[sStateType]) {

			if (sStateName in me.cache[sStateType][sAppName]) {

				return 1;

			} else {

				return -1;

			}

		} else {
			return -2;
		}

	},

	/**
	 * Function for getting a list of existing state names
	 * 
	 * @param {String}
	 *          sStateType The type of the state [application|reference]
	 * @param {String}
	 *          sAppName Application class name
	 * @return {Array}
	 * 
	 */
	getApplicationStates : function(sStateType, sAppName) {

		var me = this;
		var oAppStates = [];

		for ( var key in me.cache[sStateType][sAppName])
			oAppStates.push(key);

		return oAppStates;

	},

	/**
	 * Function for getting the data related to a state
	 * 
	 * @param {String}
	 *          sStateType The type of the state [application|reference]
	 * @param {String}
	 *          sAppName Application class name
	 * @param {String}
	 *          sStateName The name of the state
	 * @return {Object|boolean} False is returned in case when the state is non
	 *         existing or has not been loaded yet
	 */
	getStateData : function(sStateType, sAppName, sStateName) {

		var me = this;
		var oValidation = me.isStateLoaded(sStateType, sAppName, sStateName);

		if (oValidation == 1) {

			return me.cache[sStateType][sAppName][sStateName];

		} else
			return oValidation;

	},

	/**
	 * Function for reading the states and references from the server
	 * 
	 * @param {String}
	 *          sAppName Application class name
	 * @param {Function}
	 *          cbAfterRefresh A function to be executed after the states and
	 *          references have been successfully read
	 */
	oprReadApplicationStatesAndReferences : function(sAppName, cbAfterRefresh) {

		var me = this;

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'UP/listAppState',
			params : {
				app : sAppName,
				obj : "application"
			},
			success : function(response) {

				if (response.status == 200) {

					var oStates = Ext.JSON.decode(response.responseText);
					me.cache["application"][sAppName] = {};

					for ( var sStateName in oStates) {

						me.cache["application"][sAppName][sStateName] = oStates[sStateName];

					}

					Ext.Ajax.request({
						url : GLOBAL.BASE_URL + 'UP/listAppState',
						params : {
							app : sAppName,
							obj : "reference"
						},
						success : function(response) {

							if (response.status == 200) {

								var oStates = Ext.JSON.decode(response.responseText);
								me.cache["reference"][sAppName] = {};

								for ( var sStateName in oStates) {

									me.cache["reference"][sAppName][sStateName] = oStates[sStateName];

								}

								cbAfterRefresh(1, sAppName);

							} else {

								me.cache["reference"][sAppName] = {};
								cbAfterRefresh(-1, sAppName);
								Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');

							}

						},
						failure : function(response) {
							me.cache["reference"][sAppName] = {};
							cbAfterRefresh(-2, sAppName);
							Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
						}
					});

				} else {

					me.cache["application"][sAppName] = {};
					me.cache["reference"][sAppName] = {};
					cbAfterRefresh(-3, sAppName);
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + ' .<br/> Please try again later !');

				}

			},
			failure : function(response) {

				me.cache["application"][sAppName] = {};
				me.cache["reference"][sAppName] = {};
				cbAfterRefresh(-4, sAppName);
				Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + ' .<br/> Please try again later !');
			}
		});

	},

	

	

	/**
	 * Function for checking whether a state name is valid or not
	 * 
	 * @param {String}
	 *          sStateName The name of the state
	 * @return {boolean}
	 */
	isValidStateName : function(sStateName) {

		var regExpr = /^([0-9a-zA-Z\.\_\-]+)+$/;

		return (String(sStateName).search(regExpr) != -1);

	},

	/**
	 * Function that is used to prepare and send the data of the desktop state to
	 * the server.
	 * 
	 * @param {String}
	 *          stateName The name of the state
	 * @param {Boolean}
	 *          isNewItem Parameter that says whether the state already exists or
	 *          not
	 */
	oprSendDataForSave : function(oAppObject, sStateType, sStateName, cbAfterSave) {

		var me = this;

		var oSendData = oAppObject.getStateData();
		/*
		 * We save those data in the database
		 */
		if (!Ext.isObject(oSendData)) {
			/*
			 * Here the data to be sent is not an object
			 */
			return;
		}

		/*
		 * If the Ajax is not successful the state wont be saved.
		 */
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'UP/saveAppState',
			params : {
				app : oAppObject.self.getName(),
				name : sStateName,
				state : Ext.JSON.encode(oSendData),
				obj : sStateType
			},
			scope : me,
			success : function(oResponse) {

				if (oResponse.status == 200) {
					var me = this;
					Ext.example.msg("Notification", 'State saved successfully !');

					me.cache[me.__sStateType][me.__sAppName][sStateName] = oSendData;

					cbAfterSave(1, oAppObject.self.getName(), sStateType, sStateName);					
					
				} else if (oResponse.status == 400) {

					Ext.example.msg("Error Notification", 'Operation failed: ' + oResponse.responseText + '.<br/> Please try again later !');
					cbAfterSave(-1, oAppObject.self.getName(), sStateType, sStateName);					

				} else {

					Ext.example.msg("Error Notification", 'Operation failed: ' + oResponse.statusText + '.<br/> Please try again later !');
					cbAfterSave(-2, oAppObject.self.getName(), sStateType, sStateName);					

				}

			},
			failure : function(response) {

				if (response.status == 400){
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
					cbAfterSave(-3, oAppObject.self.getName(), sStateType, sStateName);					
				}else{
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
					cbAfterSave(-4, oAppObject.self.getName(), sStateType, sStateName);					
				}
			}
		});

	},

	

	/**
	 * Function to check whether a state is active i.e. loaded into the
	 * application
	 * 
	 * @param {String}
	 *          sAppName Application class name
	 * @param {String}
	 *          sStateName The name of the state
	 * 
	 */
	isAnyActiveState : function(sAppName, sStateName) {

		var me = this;
		var oFound = false;

		for ( var i = 0; i < me.activeStates.length; i++) {

			if ((sStateName == me.activeStates[i][1]) && (sAppName == me.activeStates[i][0])) {

				oFound = true;
				break;

			}
		}

		return oFound;

	},

	/**
	 * Function to register new state as an active one
	 * 
	 * @param {String}
	 *          sAppName Application class name
	 * @param {String}
	 *          sStateName The name of the state
	 * 
	 */
	oprAddActiveState : function(sAppName, sStateName) {

		var me = this;

		me.activeStates.push([ sAppName, sStateName ]);

	},

	/**
	 * Function to remove a state out of the activeStates list
	 * 
	 * @param {String}
	 *          sAppName Application class name
	 * @param {String}
	 *          sStateName The name of the state
	 * 
	 */
	oprRemoveActiveState : function(sAppName, sStateName) {

		var me = this;
		var iIndex = -1;
		for ( var i = me.activeStates.length - 1; i >= 0; i--) {
			if ((sStateName == me.activeStates[i][1]) && (sAppName == me.activeStates[i][0])) {
				iIndex = i;
				break;
			}
		}
		if (iIndex != -1)
			me.activeStates.splice(iIndex, 1);
	},

	
	oprDeleteState: function(sAppName, sStateType, sStateName, cbAfterDelete){
		
		var me = this;
		
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'UP/delAppState',
			params : {
				app : sAppName,
				name : sStateName,
				obj : sStateType
			},
			success : function(response){
				
				if (response.status == 200) {

					delete me.cache[sStateType][sAppName][sStateName];
					
					cbAfterDelete(1, sAppName, sStateType, sStateName);

				} else {

					if (response.status == 400){
						Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
						cbAfterDelete(-1, sAppName, sStateType, sStateName);
					}else{
						Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
						cbAfterDelete(-2, sAppName, sStateType, sStateName);
					}

				}
			
			},
			failure : function(response) {

				if (response.status == 400){
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
					cbAfterDelete(-3, sAppName, sStateType, sStateName);
				}else{
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
					cbAfterDelete(-4, sAppName, sStateType, sStateName);
				}
			}
		});
	
	},
	

	/*-----------------------------------------------SHARE STATE-----------------------------------------------*/

	/**
	 * Function called when we want to share a state.
	 * 
	 * @param {String}
	 *          sAppName Application class name
	 * @param {String}
	 *          sStateName The name of the state
	 * 
	 */
	oprShareState : function(sAppName, sStateName, cbAfterShare) {

		var me = this;

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'UP/makePublicAppState',
			params : {
				obj : "application",
				app : sAppName,
				name : sStateName,
				access : "ALL"
			},
			scope : me,
			success : function(response) {

				if (response.status == 200) {

					var me = this;

					var sStringToShow = sAppName + "|" + GLOBAL.APP.configData["user"]["username"] + "|" + GLOBAL.APP.configData["user"]["group"] + "|" + sStateName;
					
					cbAfterShare(1, sAppName, sStateName, sStringToShow);
					

				} else {

					if (response.status == 400){
						Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
						cbAfterShare(-1, sAppName, sStateName, "");
					}else
						Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
						cbAfterShare(-2, sAppName, sStateName, "");

				}

			},
			failure : function(response) {

				if (response.status == 400){
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
					cbAfterShare(-3, sAppName, sStateName, "");
				}else{
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
					cbAfterShare(-4, sAppName, sStateName, "");
				}
			}
		});

	},

	
	/**
	 * Function executed when the shared state has to be loaded
	 * 
	 * @param {Object}
	 *          sLinkDescription String describing the shared state
	 * @param {Function}
	 *          cbAfterLoadSharedState Function to be executed after the shared
	 *          state has been loaded
	 * 
	 */
	oprLoadSharedState : function(sLinkDescription, cbAfterLoadSharedState) {

		var me = this;

		var oDataItems = sLinkDescription.split("|");

		if (oDataItems.length != 4) {

			GLOBAL.APP.CF.alert("The 'Load' data you entered is not valid !", "warning");
			return;

		}

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'UP/loadUserAppState',
			params : {
				obj : "application",
				app : oDataItems[0],
				user : oDataItems[1],
				group : oDataItems[2],
				name : oDataItems[3]
			},
			scope : me,
			success : function(response) {

				if (response.status == 200) {
					var me = this;
					var oDataReceived = Ext.JSON.decode(response.responseText);

					if (cbAfterLoadSharedState != null)
						cbAfterLoadSharedState(1, sLinkDescription, oDataReceived);

				} else {

					if (response.status == 400){
						Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
						if (cbAfterLoadSharedState != null)
							cbAfterLoadSharedState(-1, sLinkDescription, "");
					}else{
						Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
						if (cbAfterLoadSharedState != null)
							cbAfterLoadSharedState(-2, sLinkDescription, "");
					}

				}

			},
			failure : function(response) {

				if (response.status == 400){
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
					if (cbAfterLoadSharedState != null)
							cbAfterLoadSharedState(-3, sLinkDescription, "");	
				}else{
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
					if (cbAfterLoadSharedState != null)
							cbAfterLoadSharedState(-4, sLinkDescription, "");
				}

			}
		});

	},

	/**
	 * Function executed when the shared state has to be saved
	 * 
	 * @param {String}
	 *          sRefName The name for the shared state
	 * @param {String}
	 *          sRef The description link for the shared state
	 * @param {Function}
	 *          cbAfterSaveSharedState Function to be executed after the shared
	 *          state has been saved
	 */
	oprSaveSharedState : function(sRefName, sRef, cbAfterSaveSharedState) {

		var me = this;

		var oDataItems = sRef.split("|");

		if (me.isStateLoaded("reference", oDataItems[0], sRefName) == 1) {

			GLOBAL.APP.CF.alert("The name for the link already exists !", "warning");
			return;
		}

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'UP/saveAppState',
			params : {
				app : oDataItems[0],
				name : sRefName,
				state : Ext.JSON.encode({
					link : sRef
				}),
				obj : "reference"
			},
			scope : me,
			success : function(response) {

				if (response.status == 200) {
					Ext.example.msg("Notification", 'The shared state has been saved successfully !');

					me.cache.reference[oDataItems[0]][sRefName] = {
						link : sRef
					};

					if (cbAfterSaveSharedState != null) {
						cbAfterSaveSharedState(1, sRefName, sRef);
					}
				} else {

					if (response.status == 400){
						Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
						if (cbAfterSaveSharedState != null) {
							cbAfterSaveSharedState(-1, sRefName, sRef);
						}
					}else{
						Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
						if (cbAfterSaveSharedState != null) {
							cbAfterSaveSharedState(-2, sRefName, sRef);
						}
					}

				}

			},
			failure : function(response) {

				if (response.status == 400){
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.responseText + '.<br/> Please try again later !');
					if (cbAfterSaveSharedState != null) {
						cbAfterSaveSharedState(-3, sRefName, sRef);
					}
				}else{
					Ext.example.msg("Error Notification", 'Operation failed: ' + response.statusText + '.<br/> Please try again later !');
					if (cbAfterSaveSharedState != null) {
						cbAfterSaveSharedState(-4, sRefName, sRef);
					}
				}
			}
		});

	}

/*-----------------------------------------------END - SHARE STATE-----------------------------------------------*/

});