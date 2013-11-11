/**
 * @class Ext.dirac.core.StateManagement This class manages the entire
 *        application platform
 * @mixins Ext.util.Observable
 * 
 */

Ext.define('Ext.dirac.views.desktop.TranformationData', {
	requires : [],

	/**
	 * Function for main view data transformation from version 0 to version 1.
	 * 
	 * Old version of main view data structure:
	 * 
	 * <pre>
	 * {
	 * 	data:	[{
	 * 					name:,
	 * 					currentState:,
	 * 					data:,
	 * 					x:,
	 * 					y:,
	 * 					width:,
	 * 					height:,
	 * 					maximized:,
	 * 					zIndex:,
	 * 					loadedObjectType:,
	 * 					desktopStickMode:,
	 * 					headerHidden:,
	 * 					i_x:,
	 * 					i_y:,
	 * 					ic_x:,
	 * 					ic_y:,
	 * 					_before_pin_state:
	 * 				}*],
	 *   desktopGranularity: [nX, nY]
	 * }
	 * </pre>
	 * 
	 * New version of main view data structure:
	 * 
	 * <pre>
	 * {
	 * 	dirac_view:,
	 * 	version:,
	 * 	data: [{
	 * 					module:,
	 * 					data:,
	 * 					currentState:
	 * 				}*],
	 * 	views:{
	 * 		desktop:{
	 * 			
	 * 		},
	 * 		tabs:{
	 * 
	 * 
	 * 		}
	 * 	}
	 * }
	 * </pre>
	 */
	oprMainViewGoFrom0To1 : function(oData) {

		var oResponse = {
			dirac_view : 1,
			version : 1,
			data : [],
			views : {
				desktop : {
					version : GLOBAL.APP.MAIN_VIEW.stateDataStructureVersion,
					desktopGranularity : oData.desktopGranularity,
					positions : []
				}
			}
		};

		for ( var i = 0; i < oData.data.length; i++) {

			var oItem = oData.data[i];

			oResponse.data.push({
				module : oItem.name,
				data : oItem.data,
				currentState : oItem.currentState
			});

			oResponse.data.views.desktop.positions.push({
				x : oItem.x,
				y : oItem.y,
				width : oItem.width,
				height : oItem.height,
				maximized : oItem.maximized,
				minimized : false,
				zIndex : oItem.zIndex,
				loadedObjectType : oItem.loadedObjectType,
				desktopStickMode : oItem.desktopStickMode,
				headerHidden : oItem.headerHidden,
				i_x : oItem.i_x,
				i_y : oItem.i_y,
				ic_x : oItem.ic_x,
				ic_y : oItem.ic_y,
				_before_pin_state : oItem._before_pin_state
			});

		}
		
		return oResponse;

	}



});