/**
 * @class Ext.dirac.core.StateManagement This class manages the entire
 *        application platform
 * @mixins Ext.util.Observable
 *
 */

Ext.define("Ext.dirac.core.StateManagement", {
  requires: ["Ext.dirac.core.TransformationData"],

  /*
   * Cache serves to save the application states and references
   */
  cache: {
    application: {},
    reference: {},
    sharedDesktop: {},
  },

  /*
   * A list of active states on the desktop
   */
  activeStates: [],

  constructor: function () {
    var me = this;
    me.TD = new Ext.dirac.core.TransformationData();
    this.callParent();
  },

  /**
   * Function that checks whether a state has been loaded or not.
   *
   * @param {String}
   *          sStateType The type of the state. Possible values:
   *          application, reference.
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateName The name of the state or the reference.
   * @return {int} (1) - state exists in the cache (-1) - state does not
   *         exist (-2) - the application cache has not been loaded yet
   */
  isStateLoaded: function (sStateType, sAppName, sStateName) {
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
   * Function for getting a list of existing state names of an application.
   *
   * @param {String}
   *          sStateType The type of the state. Possible values:
   *          application, reference.
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @return {Array} Array of strings representing the state/reference
   *         names.
   *
   */
  getApplicationStates: function (sStateType, sAppName) {
    var me = this;
    var oAppStates = [];

    for (var key in me.cache[sStateType][sAppName]) oAppStates.push(key);

    return oAppStates;
  },

  /**
   * Function for getting the data related to a state
   *
   * @param {String}
   *          sStateType The type of the state. Possible values:
   *          application, reference.
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateName The name of the state or the reference.
   * @return {Object|boolean} False is returned in case when the state is
   *         non existing or has not been loaded yet
   */
  getStateData: function (sStateType, sAppName, sStateName) {
    var me = this;
    var oValidation = me.isStateLoaded(sStateType, sAppName, sStateName);

    if (oValidation == 1) {
      return me.cache[sStateType][sAppName][sStateName];
    } else return oValidation;
  },

  /**
   * Function for reading the states and references of an application from
   * the server
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {Function}
   *          cbAfterRefresh The callback function called on success or on
   *          failure of the request for states and references.
   */
  oprReadApplicationStatesAndReferences: function (sAppName, cbAfterRefresh) {
    var me = this;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "UP/listAppState",
      params: {
        app: sAppName,
        obj: "application",
      },
      success: function (response) {
        if (response.status == 200) {
          var oStates = Ext.JSON.decode(response.responseText);
          me.cache["application"][sAppName] = {};

          if (sAppName == "desktop") {
            for (var sStateName in oStates) {
              if (me.TD.oprVerifyDataStructure(oStates[sStateName])) {
                me.cache["application"][sAppName][sStateName] = oStates[sStateName];
              } else {
                var oNewData = me.TD.oprTransformMainViewDataToCurrentVersion(oStates[sStateName]);

                me.cache["application"][sAppName][sStateName] = oNewData;

                // sending the transformed data to the server

                Ext.Ajax.request({
                  url: GLOBAL.BASE_URL + "UP/saveAppState",
                  params: {
                    app: sAppName,
                    name: sStateName,
                    state: Ext.JSON.encode(oNewData),
                    obj: "application",
                  },
                  scope: me,
                  success: function (oResponse) {
                    if (oResponse.status != 200) {
                      me.cache["application"][sAppName][sStateName] = oStates[sStateName];
                    }
                  },
                  failure: function (response) {
                    me.cache["application"][sAppName][sStateName] = oStates[sStateName];
                    GLOBAL.APP.CF.showAjaxErrorMessage(response);
                  },
                });
              }
            }
          } else {
            for (var sStateName in oStates) {
              me.cache["application"][sAppName][sStateName] = oStates[sStateName];
            }
          }

          Ext.Ajax.request({
            url: GLOBAL.BASE_URL + "UP/listAppState",
            params: {
              app: sAppName,
              obj: "reference",
            },
            success: function (response) {
              if (response.status == 200) {
                var oStates = Ext.JSON.decode(response.responseText);
                me.cache["reference"][sAppName] = {};

                for (var sStateName in oStates) {
                  me.cache["reference"][sAppName][sStateName] = oStates[sStateName];
                }

                cbAfterRefresh(1, sAppName);
              } else {
                me.cache["reference"][sAppName] = {};
                cbAfterRefresh(-1, sAppName);
                GLOBAL.APP.CF.showAjaxErrorMessage(response);
              }
            },
            failure: function (response) {
              me.cache["reference"][sAppName] = {};
              cbAfterRefresh(-2, sAppName);
              GLOBAL.APP.CF.showAjaxErrorMessage(response);
            },
          });
        } else {
          me.cache["application"][sAppName] = {};
          me.cache["reference"][sAppName] = {};
          cbAfterRefresh(-3, sAppName);

          GLOBAL.APP.CF.showAjaxErrorMessage(response);
        }
      },
      failure: function (response) {
        me.cache["application"][sAppName] = {};
        me.cache["reference"][sAppName] = {};
        cbAfterRefresh(-4, sAppName);

        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
    });
  },

  /**
   * Function that checks whether a state name is valid or not
   *
   * @param {String}
   *          sStateName The name of the state or the reference.
   * @return {boolean}
   */
  isValidStateName: function (sStateName) {
    var regExpr = /^([0-9a-zA-Z\.\_\-\ ]+)+$/;

    return String(sStateName).search(regExpr) != -1;
  },

  /**
   * Function used to prepare and to send the state data of an application
   * or a main view to the server.
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {Object}
   *          oAppObject The application object.
   * @param {String}
   *          sStateType The type of the state. Possible values:
   *          application, reference.
   * @param {String}
   *          sStateName The name of the state or the reference.
   * @param {Function}
   *          cbAfterSave The callback function called on success or on
   *          failure of the request for saving a state or a reference.
   */
  oprSendDataForSave: function (sAppName, oAppObject, sStateType, sStateName, cbAfterSave) {
    var me = this;

    var oSendData = oAppObject.getStateData();

    if (oAppObject.getHelpText && oSendData) {
      if (oAppObject.up("panel") && oAppObject.up("panel").childWindows && oAppObject.up("panel").childWindows.length > 0) {
        for (var i = 0; i < oAppObject.up("panel").childWindows.length; i++) {
          if (oAppObject.up("panel").childWindows[i].type == "help") {
            // The Notepad is open. The text has to be retrieved
            // from the notepad...
            var helptext = {
              helptext: oAppObject.up("panel").childWindows[i].items.getAt(0).getValue(),
            };
            Ext.apply(oSendData, helptext);
          }
        }
      } else {
        Ext.apply(oSendData, oAppObject.getHelpText());
      }
    }

    if (!oSendData) return; // we do not have the data which has to be saved...

    console.log(oSendData);

    if ("dirac_view" in oSendData) {
      // preserve the data for other views if the state already exists

      if (sAppName in me.cache[sStateType]) {
        if (sStateName in me.cache[sStateType][sAppName]) {
          // preserving is done only if the version number is the same

          var oCurrentObject = me.cache[sStateType][sAppName][sStateName];

          if ("version" in oCurrentObject) {
            if (oSendData.version === oCurrentObject.version) {
              for (var sViewType in oCurrentObject.views) {
                if (GLOBAL.VIEW_ID != sViewType) {
                  oSendData.views[sViewType] = oCurrentObject.views[sViewType];
                }
              }
            }
          }
        }
      }
    }

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
      url: GLOBAL.BASE_URL + "UP/saveAppState",
      params: {
        app: sAppName,
        name: sStateName,
        state: Ext.JSON.encode(oSendData),
        obj: sStateType,
      },
      scope: me,
      success: function (oResponse) {
        if (oResponse.status == 200) {
          var me = this;
          Ext.dirac.system_info.msg("Notification", "State saved successfully !");

          if (me.cache[sStateType][sAppName]) {
            me.cache[sStateType][sAppName][sStateName] = oSendData;
          } else {
            me.cache[sStateType][sAppName] = {};
            me.cache[sStateType][sAppName][sStateName] = oSendData;
          }

          cbAfterSave(1, sAppName, sStateType, sStateName);
        } else if (oResponse.status == 400) {
          Ext.dirac.system_info.msg("Error Notification", "Operation failed: " + oResponse.responseText + ".<br/> Please try again later !");
          cbAfterSave(-1, sAppName, sStateType, sStateName);
        } else {
          Ext.dirac.system_info.msg("Error Notification", "Operation failed: " + oResponse.statusText + ".<br/> Please try again later !");
          cbAfterSave(-2, sAppName, sStateType, sStateName);
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);

        if (response.status == 400) {
          cbAfterSave(-3, sAppName, sStateType, sStateName);
        } else {
          cbAfterSave(-4, sAppName, sStateType, sStateName);
        }
      },
    });
  },

  /**
   * Function to check whether a state is active i.e. loaded into the
   * application
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateName The name of the state
   *
   */
  isAnyActiveState: function (sAppName, sStateName) {
    var me = this;
    var oFound = false;

    for (var i = 0; i < me.activeStates.length; i++) {
      if (sStateName == me.activeStates[i][1] && sAppName == me.activeStates[i][0]) {
        oFound = true;
        break;
      }
    }

    return oFound;
  },

  /**
   * Function to register a state as an active one
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateName The name of the state
   *
   */
  oprAddActiveState: function (sAppName, sStateName) {
    var me = this;

    me.activeStates.push([sAppName, sStateName]);
  },

  /**
   * Function to remove a state out of the active states list
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateName The name of the state
   *
   */
  oprRemoveActiveState: function (sAppName, sStateName) {
    var me = this;
    var iIndex = -1;
    for (var i = me.activeStates.length - 1; i >= 0; i--) {
      if (sStateName == me.activeStates[i][1] && sAppName == me.activeStates[i][0]) {
        iIndex = i;
        break;
      }
    }
    if (iIndex != -1) me.activeStates.splice(iIndex, 1);
  },

  /**
   * Function to delete a saved state or a saved reference on the server
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateType The type of the state. Possible values:
   *          application, reference.
   * @param {String}
   *          sStateName The name of the state or the reference
   * @param {Function}
   *          cbAfterDelete The callback function called on success or on
   *          failure of the request for deleting a state or a reference.
   *
   */
  oprDeleteState: function (sAppName, sStateType, sStateName, cbAfterDelete) {
    var me = this;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "UP/delAppState",
      params: {
        app: sAppName,
        name: sStateName,
        obj: sStateType,
      },
      success: function (response) {
        if (response.status == 200) {
          delete me.cache[sStateType][sAppName][sStateName];

          cbAfterDelete(1, sAppName, sStateType, sStateName);
        } else {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);

          if (response.status == 400) {
            cbAfterDelete(-1, sAppName, sStateType, sStateName);
          } else {
            cbAfterDelete(-2, sAppName, sStateType, sStateName);
          }
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);

        if (response.status == 400) {
          cbAfterDelete(-3, sAppName, sStateType, sStateName);
        } else {
          cbAfterDelete(-4, sAppName, sStateType, sStateName);
        }
      },
    });
  },

  /*-----------------------------------------------SHARE STATE-----------------------------------------------*/

  /**
   * Function that is used to share a state with other users.
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateName The name of the state.
   * @param {Function}
   *          cbAfterShare The callback function called on success or on
   *          failure of the request for sharing a state.
   *
   */
  oprShareState: function (sAppName, sStateName, cbAfterShare) {
    var me = this;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "UP/makePublicAppState",
      params: {
        obj: "application",
        app: sAppName,
        name: sStateName,
        access: "ALL",
      },
      scope: me,
      success: function (response) {
        if (response.status == 200) {
          var me = this;

          var sStringToShow =
            sAppName + "|" + GLOBAL.APP.configData["user"]["username"] + "|" + GLOBAL.APP.configData["user"]["group"] + "|" + sStateName;

          cbAfterShare(1, sAppName, sStateName, sStringToShow);
        } else {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);

          if (response.status == 400) {
            cbAfterShare(-1, sAppName, sStateName, "");
          } else cbAfterShare(-2, sAppName, sStateName, "");
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);

        if (response.status == 400) {
          cbAfterShare(-3, sAppName, sStateName, "");
        } else {
          cbAfterShare(-4, sAppName, sStateName, "");
        }
      },
    });
  },
  /**
   * Function that is used to share a state with other users.
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateName The name of the state.
   * @param {Function}
   *          cbAfterShare The callback function called on success or on
   *          failure of the request for sharing a state.
   *
   */
  oprPublishState: function (sAppName, sStateName) {
    var me = this;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "UP/publishAppState",
      params: {
        obj: "application",
        app: sAppName,
        name: sStateName,
        access: "ALL",
      },
      scope: me,
      success: function (response) {
        if (response.status == 200) {
          GLOBAL.APP.CF.msg("Notification", sStateName + " is available to the public!");
        } else {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
    });
  },

  /**
   * Function that is used to take the data of a shared state from the
   * server
   *
   * @param {Object}
   *          sLinkDescription Description of a shared state. This
   *          description can be used to load a shared state.
   * @param {Function}
   *          cbAfterLoadSharedState The callback function called on success
   *          or on failure of the request for retrieving the shared state
   *          data.
   *
   */
  oprLoadSharedState: function (sLinkDescription, cbAfterLoadSharedState, stateName) {
    var me = this;

    var oDataItems = sLinkDescription.split("|");

    if (oDataItems.length != 4) {
      GLOBAL.APP.CF.alert("The 'Load' data you entered is not valid !", "warning");
      return;
    }

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "UP/loadUserAppState",
      params: {
        obj: "application",
        app: oDataItems[0],
        user: oDataItems[1],
        group: oDataItems[2],
        name: oDataItems[3],
      },
      scope: me,
      success: function (response) {
        if (response.status == 200) {
          var me = this;
          var oDataReceived = Ext.JSON.decode(response.responseText);

          if (cbAfterLoadSharedState != null) cbAfterLoadSharedState(1, sLinkDescription, oDataReceived, stateName);
        } else {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);

          if (response.status == 400) {
            if (cbAfterLoadSharedState != null) cbAfterLoadSharedState(-1, sLinkDescription, "", stateName);
          } else {
            if (cbAfterLoadSharedState != null) cbAfterLoadSharedState(-2, sLinkDescription, "", stateName);
          }
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);

        if (response.status == 400) {
          if (cbAfterLoadSharedState != null) cbAfterLoadSharedState(-3, sLinkDescription, "", stateName);
        } else {
          if (cbAfterLoadSharedState != null) cbAfterLoadSharedState(-4, sLinkDescription, "", stateName);
        }
      },
    });
  },

  /**
   * Function executed when the shared state has to be saved on the server
   * as a reference
   *
   * @param {String}
   *          sRefName The name of the reference.
   * @param {String}
   *          sRef Description of a shared state. This description can be
   *          used to load a shared state.
   * @param {Function}
   *          cbAfterSaveSharedState The callback function called on success
   *          or on failure of the request for saving shared state as a
   *          reference.
   */
  oprSaveSharedState: function (sRefName, sRef, cbAfterSaveSharedState) {
    var me = this;

    var oDataItems = sRef.split("|");

    if (me.isStateLoaded("reference", oDataItems[0], sRefName) == 1) {
      GLOBAL.APP.CF.alert("The name for the link already exists !", "warning");
      return;
    }

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "UP/saveAppState",
      params: {
        app: oDataItems[0],
        name: sRefName,
        state: Ext.JSON.encode({
          link: sRef,
        }),
        obj: "reference",
      },
      scope: me,
      success: function (response) {
        if (response.status == 200) {
          Ext.dirac.system_info.msg("Notification", "The shared state has been saved successfully !");

          me.cache.reference[oDataItems[0]][sRefName] = {
            link: sRef,
          };

          if (cbAfterSaveSharedState != null) {
            cbAfterSaveSharedState(1, sRefName, sRef);
          }
        } else {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);

          if (response.status == 400) {
            if (cbAfterSaveSharedState != null) {
              cbAfterSaveSharedState(-1, sRefName, sRef);
            }
          } else {
            if (cbAfterSaveSharedState != null) {
              cbAfterSaveSharedState(-2, sRefName, sRef);
            }
          }
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);

        if (response.status == 400) {
          if (cbAfterSaveSharedState != null) {
            cbAfterSaveSharedState(-3, sRefName, sRef);
          }
        } else {
          if (cbAfterSaveSharedState != null) {
            cbAfterSaveSharedState(-4, sRefName, sRef);
          }
        }
      },
    });
  },
  /**
   * Function for reading the states and references of an application from
   * the server
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {Function}
   *          cbAfterRefresh The callback function called on success or on
   *          failure of the request for states and references.
   */
  oprReadSharedDesktops: function (sAppName, cbAfterRefresh) {
    var me = this;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "UP/listPublicDesktopStates",
      params: {
        app: sAppName,
        obj: "application",
      },
      success: function (response) {
        if (response.status == 200) {
          var oStates = Ext.JSON.decode(response.responseText);

          if (me.cache["sharedDesktop"][sAppName] == null) {
            me.cache["sharedDesktop"][sAppName] = {};
          }

          for (var sStateName in oStates) {
            me.cache["sharedDesktop"][sAppName][sStateName] = oStates[sStateName];
            for (var oState in oStates[sStateName]) {
              if (oState != "Metadata") {
                me.cache["application"][sAppName][oState] = oStates[sStateName][oState];
              }
            }
          }

          cbAfterRefresh(1, sAppName);
        } else {
          me.cache["sharedDesktop"][sAppName] = {};
          cbAfterRefresh(-3, sAppName);
          GLOBAL.APP.CF.showAjaxErrorMessage(response);
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
        me.cache["sharedDesktop"][sAppName] = {};
      },
    });
  },

  /*-----------------------------------------------END - SHARE STATE-----------------------------------------------*/
  // make private a shared state
  /**
   * Function that is used to share a state with other users.
   *
   * @param {String}
   *          sAppName The class name of the application. The only exception
   *          is the case of the main view: in this case the value of this
   *          parameter is “desktop”.
   * @param {String}
   *          sStateName The name of the state.
   * @param {Function}
   *          cbAfterShare The callback function called on success or on
   *          failure of the request for sharing a state.
   *
   */
  oprChangeSharedStateToPrivate: function (sAppName, sStateName, cbAfterShare) {
    var me = this;
    me.__changeAccess(sAppName, sStateName, cbAfterShare, "USER");
  },
  /*************************************************************************
   * It used to change the access of an desktop/application
   *
   * @param {String}
   *          sAppName
   * @param {String}
   *          sStateName
   * @param {Function}
   *          cbAfterShare
   * @param {String}
   *          access
   */
  __changeAccess: function (sAppName, sStateName, cbAfterShare, access) {
    var me = this;

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "UP/makePublicAppState",
      params: {
        obj: "application",
        app: sAppName,
        name: sStateName,
        access: access,
      },
      scope: me,
      success: function (response) {
        if (response.status == 200) {
          var me = this;

          var sStringToShow =
            sAppName + "|" + GLOBAL.APP.configData["user"]["username"] + "|" + GLOBAL.APP.configData["user"]["group"] + "|" + sStateName;

          cbAfterShare(1, sAppName, sStateName, sStringToShow);
        } else {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);

          if (response.status == 400) {
            cbAfterShare(-1, sAppName, sStateName, "");
          } else cbAfterShare(-2, sAppName, sStateName, "");
        }
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);

        if (response.status == 400) {
          cbAfterShare(-3, sAppName, sStateName, "");
        } else {
          cbAfterShare(-4, sAppName, sStateName, "");
        }
      },
    });
  },
  addApplicationStates: function (appName, stateName, data) {
    var me = this;
    var loaded = me.isStateLoaded("application", appName, stateName);
    if (loaded != 1) {
      me.cache["application"][appName][stateName] = {
        data: [],
      };
    }

    me.cache["application"][appName][stateName].data.push(data);
  },
  createDesktop: function (appName, stateName, data) {
    var me = this;
    me.cache["application"][appName][stateName] = data;
  },
});
