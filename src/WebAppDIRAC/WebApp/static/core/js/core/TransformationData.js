/**
 * @class Ext.dirac.core.StateManagement This class manages the entire
 *        application platform
 * @mixins Ext.util.Observable
 *
 */

Ext.define("Ext.dirac.core.TransformationData", {
  requires: [],

  /**
   * Function to verify the structure of the saved data and its version
   */
  oprVerifyDataStructure: function (oData) {
    if (oData && "version" in oData) {
      if (oData.version == GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },

  /**
   *
   */
  oprTransformMainViewDataToCurrentVersion: function (oData) {
    var me = this;

    var startVersion = 0;

    if (oData && "version" in oData) {
      startVersion = oData.version;
    }

    if (startVersion < GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION) {
      for (var i = startVersion; i < GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION; i++) {
        var oResponse = me.oprTransformMainViewDataToNextVersion(i, oData);

        if (!oResponse) {
          return false;
        } else {
          oData = oResponse;
        }
      }
    }

    return oData;
  },

  oprTransformMainViewDataToNextVersion: function (iVersion, oData) {
    var me = this;

    if (iVersion >= GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION) {
      GLOBAL.APP.CF.alert("You can use this method for version value below " + GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION, "info");
      return false;
    }

    var iNextVersion = iVersion + 1;
    var sTransformation = "" + iVersion + "-" + iNextVersion;

    var oResultData = null;

    switch (sTransformation) {
      case "0-1":
        var oRes = me.oprMainViewGoFrom0To1(oData);
        if (oRes.success) {
          oResultData = oRes.data;
        } else {
          return false;
        }
        break;
    }

    return oResultData;
  },
  /**
   * Function for main view data transformation from version 0 to version 1.
   * Only this transformation has to rely on specific methods of the views. For
   * the other transformations this invocation is not needed.
   *
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
  oprMainViewGoFrom0To1: function (oData) {
    var oResponse = {
      success: false,
      data: null,
    };

    if ("TD" in GLOBAL.APP.MAIN_VIEW) {
      if ("oprMainViewGoFrom0To1" in GLOBAL.APP.MAIN_VIEW.TD) {
        oResponse.data = GLOBAL.APP.MAIN_VIEW.TD.oprMainViewGoFrom0To1(oData);
        oResponse.success = true;
      }
    }

    return oResponse;
  },
});
