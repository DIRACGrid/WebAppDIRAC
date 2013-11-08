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

		
		
	}

});