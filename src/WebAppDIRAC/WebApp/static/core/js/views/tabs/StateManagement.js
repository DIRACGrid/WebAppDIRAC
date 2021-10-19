/**
 * @class Ext.dirac.core.StateManagement This class manages the state management
 *        within the Desktop view
 *
 */

Ext.define("Ext.dirac.views.tabs.StateManagement", {
  requires: ["Ext.form.field.Text", "Ext.button.Button", "Ext.toolbar.Toolbar", "Ext.panel.Panel", "Ext.window.Window"],

  /**
   * Function called when the Save As ... button from the SAVE window menu
   * is clicked
   *
   * @param {String}
   *          sStateType The type of the state [application|reference]
   * @param {String}
   *          sAppName Application class name
   * @param {Object}
   *          oAppObject The application object
   * @param {Function}
   *          cbAfterSave Function that is executed after the save has been
   *          saved
   */
  formSaveState: function (sStateType, sAppName, oAppObject, cbAfterSave) {
    var me = this;

    me.txtStateName = Ext.create("Ext.form.field.Text", {
      fieldLabel: "State Name:",
      labelAlign: "left",
      margin: 10,
      width: 400,
      enableKeyEvents: true,
      validateValue: function (sValue) {
        sValue = Ext.util.Format.trim(sValue);

        if (sValue.length < 1) {
          this.markInvalid("You must specify a name !");
          return false;
        } else {
          if (GLOBAL.APP.SM.isStateLoaded(sStateType, sAppName, sValue) == 1) {
            this.markInvalid("The name you enetered already exists !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.', ' '");
              return false;
            }
          }
        }
      },
      validateOnChange: true,
      validateOnBlur: false,
      listeners: {
        keypress: function (oTextField, e, eOpts) {
          if (e.getCharCode() == 13) {
            if (me.txtStateName.isValid()) {
              var sStateName = me.txtStateName.getValue();

              GLOBAL.APP.SM.oprSendDataForSave(sAppName, oAppObject, sStateType, sStateName, cbAfterSave);
            }
          }
        },
      },
    });

    // button for saving the state
    me.btnSaveState = new Ext.Button({
      text: "Save",
      margin: 3,
      iconCls: "dirac-icon-save",
      handler: function () {
        if (me.txtStateName.isValid()) {
          var sStateName = me.txtStateName.getValue();

          GLOBAL.APP.SM.oprSendDataForSave(sAppName, oAppObject, sStateType, sStateName, cbAfterSave);
        }
      },
      scope: me,
    });

    // button to close the save form
    me.btnCancelSaveState = new Ext.Button({
      text: "Cancel",
      margin: 3,
      iconCls: "toolbar-other-close",
      handler: function () {
        me.txtStateName.setValue("");
        me.saveWindow.hide();
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      border: false,
    });

    oToolbar.add([me.btnSaveState, me.btnCancelSaveState]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      autoHeight: true,
      border: false,
      items: [oToolbar, me.txtStateName],
    });

    // initializing window showing the saving form
    me.saveWindow = Ext.create("widget.window", {
      height: 120,
      width: 500,
      title: "Save state",
      layout: "fit",
      modal: true,
      items: oPanel,
    });

    me.saveWindow.show();
    me.txtStateName.focus();
  },

  /**
   * Function called when the Save As ... button from the SAVE context menu
   * is clicked
   *
   * @param {String}
   *          sStateType The type of the state [application|reference]
   * @param {String}
   *          sAppName Application class name
   * @param {Object}
   *          oAppObject The application object
   * @param {Function}
   *          cbAfterSave Function that is executed after the save has been
   *          saved
   */
  formSaveAsStateOfData: function (desktop, selectedStateName, sStateType, sAppName, cbAfterSave) {
    var me = this;

    me.txtStateName = Ext.create("Ext.form.field.Text", {
      fieldLabel: "State Name:",
      labelAlign: "left",
      margin: 10,
      width: 400,
      enableKeyEvents: true,
      validateValue: function (sValue) {
        sValue = Ext.util.Format.trim(sValue);

        if (sValue.length < 1) {
          this.markInvalid("You must specify a name !");
          return false;
        } else {
          if (GLOBAL.APP.SM.isStateLoaded(sStateType, sAppName, sValue) == 1) {
            this.markInvalid("The name you enetered already exists !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.', ' '");
              return false;
            }
          }
        }
      },
      validateOnChange: true,
      validateOnBlur: false,
      listeners: {
        keypress: function (oTextField, e, eOpts) {
          if (e.getCharCode() == 13) {
            if (me.txtStateName.isValid()) {
              var sStateName = me.txtStateName.getValue();

              var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", desktop);
              var duplicateState = {};
              for (var i = 0; i < desktops.data.length; i++) {
                if (desktops.data[i].currentState == selectedStateName && desktops.data[i].module == sAppName) {
                  duplicateState = Ext.clone(desktops.data[i]);
                  duplicateState.currentState = sStateName;
                  duplicateState.desktop = desktop;
                  break;
                }
              }
              desktops.data.push(duplicateState);
              me.oprSendDataForSave("desktop", desktops, "application", desktop, function (iCode, appName, stateType, stateName) {
                cbAfterSave(iCode, appName, stateType, sStateName);
              });
            }
          }
        },
      },
    });

    // button for saving the state
    me.btnSaveState = new Ext.Button({
      text: "Save",
      margin: 3,
      iconCls: "dirac-icon-save",
      handler: function () {
        if (me.txtStateName.isValid()) {
          var sStateName = me.txtStateName.getValue();

          var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", desktop);
          var duplicateState = {};
          for (var i = 0; i < desktops.data.length; i++) {
            if (desktops.data[i].currentState == selectedStateName && desktops.data[i].module == sAppName) {
              duplicateState = Ext.clone(desktops.data[i]);
              duplicateState.currentState = sStateName;
              duplicateState.desktop = desktop;
              break;
            }
          }
          desktops.data.push(duplicateState);
          me.oprSendDataForSave("desktop", desktops, "application", desktop, function (iCode, appName, stateType, stateName) {
            cbAfterSave(iCode, appName, stateType, sStateName);
          });
        }
      },
      scope: me,
    });

    // button to close the save form
    me.btnCancelSaveState = new Ext.Button({
      text: "Cancel",
      margin: 3,
      iconCls: "toolbar-other-close",
      handler: function () {
        me.txtStateName.setValue("");
        me.saveWindow.hide();
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      border: false,
    });

    oToolbar.add([me.btnSaveState, me.btnCancelSaveState]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      autoHeight: true,
      border: false,
      items: [oToolbar, me.txtStateName],
    });

    // initializing window showing the saving form
    me.saveWindow = Ext.create("widget.window", {
      height: 120,
      width: 500,
      title: "Save state",
      layout: "fit",
      modal: true,
      items: oPanel,
    });

    me.saveWindow.show();
    me.txtStateName.focus();
  },
  /**
   * Function called when the Save button from the SAVE window menu is
   * clicked
   *
   * @param {String}
   *          sStateType The type of the state [application|reference]
   * @param {String}
   *          sAppName Application class name
   * @param {Object}
   *          oAppObject The application object
   * @param {Function}
   *          cbAfterSave Function that is executed after the save has been
   *          saved
   */
  oprSaveAppState: function (sStateType, sAppName, oAppObject, cbAfterSave) {
    var me = this;

    if (oAppObject.title == "" || oAppObject.title == "Default" || oAppObject.currentState == "") {
      // It is the default desktop or an application which is not saved
      me.formSaveState(sStateType, sAppName, oAppObject, cbAfterSave);
    } else {
      var stateName = "";
      if (sAppName == "desktop") {
        stateName = oAppObject.title;
      } else {
        stateName = oAppObject.currentState;
      }

      GLOBAL.APP.SM.oprSendDataForSave(sAppName, oAppObject, sStateType, stateName, cbAfterSave);
    }
  },

  /**
   * Function to create and open the form for managing the desktop states
   *
   * @param {String}
   *          sAppName Application class name
   * @param {Function}
   *          cbAfterRemove A function to be executed after a state has been
   *          removed
   *
   */
  formManageStates: function (sAppName, cbAfterRemove) {
    var me = this;

    me.btnDeleteState = new Ext.Button({
      text: "Delete",
      margin: 3,
      iconCls: "toolbar-other-close",
      handler: me.oprDeleteSelectedStates,
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      region: "north",
      border: false,
    });

    oToolbar.add([me.btnDeleteState]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      region: "center",
      border: false,
      bodyPadding: 5,
      autoHeight: true,
      layout: {
        type: "vbox",
        align: "stretch",
      },
      appName: sAppName,
      cbAfterRemove: cbAfterRemove,
      items: [
        {
          xtype: "panel",
          layout: "column",
          border: false,
          items: [
            {
              xtype: "radiofield",
              boxLabel: "States",
              inputValue: "s",
              name: "manage_state_type",
              width: 150,
              padding: "0 0 5 0",
              checked: true,
              listeners: {
                change: function (cmp, newValue, oldValue, eOpts) {
                  var oSelectElStates = me.manageWindow.items.getAt(1).items.getAt(1);
                  var oSelectElLinks = me.manageWindow.items.getAt(1).items.getAt(2);

                  if (newValue) {
                    oSelectElStates.show();
                    oSelectElLinks.hide();
                  } else {
                    oSelectElStates.hide();
                    oSelectElLinks.show();
                  }
                },
              },
            },
            {
              xtype: "radiofield",
              boxLabel: "Links",
              inputValue: "l",
              padding: "0 0 5 0",
              name: "manage_state_type",
              width: 150,
            },
          ],
        },
        {
          html: "<select multiple='multiple' style='width:100%;height:175px'></select>",
          xtype: "box",
        },
        {
          html: "<select multiple='multiple' style='width:100%;height:175px'></select>",
          xtype: "box",
          hidden: true,
        },
      ],
    });

    // creating the window
    me.manageWindow = Ext.create("widget.window", {
      height: 280,
      width: 500,
      title: "Manage states :: " + GLOBAL.APP.getApplicationTitle(sAppName),
      layout: "border",
      modal: true,
      resizable: false,
      items: [oToolbar, oPanel],
    });

    me.manageWindow.show();

    // filling the lists of the form with states and references
    me.oprFillSelectFieldWithStates();
  },

  /**
   * Function to fill the select element with the existing module states
   */
  oprFillSelectFieldWithStates: function () {
    var me = this;
    var oSelectEl = document.getElementById(me.manageWindow.getId()).getElementsByTagName("select")[0];

    for (var i = oSelectEl.length - 1; i >= 0; i--) {
      oSelectEl.remove(i);
    }

    var sAppName = me.manageWindow.items.getAt(1).appName;

    var oAppStates = GLOBAL.APP.SM.getApplicationStates("application", sAppName);

    for (var i = 0; i < oAppStates.length; i++) {
      if (oAppStates[i] != "Default") {
        var elOptNew = document.createElement("option");

        elOptNew.text = oAppStates[i];
        elOptNew.value = oAppStates[i];

        try {
          oSelectEl.add(elOptNew, null); // standards compliant;
          // doesn't
          // work in IE
        } catch (ex) {
          oSelectEl.add(elOptNew); // IE only
        }
      }
    }

    oSelectEl = document.getElementById(me.manageWindow.getId()).getElementsByTagName("select")[1];

    for (var i = oSelectEl.length - 1; i >= 0; i--) {
      oSelectEl.remove(i);
    }

    var oAppRefs = GLOBAL.APP.SM.getApplicationStates("reference", sAppName);

    for (var i = 0; i < oAppRefs.length; i++) {
      var elOptNew = document.createElement("option");

      elOptNew.text = oAppRefs[i];
      elOptNew.value = oAppRefs[i];

      try {
        oSelectEl.add(elOptNew, null); // standards compliant; doesn't
        // work in IE
      } catch (ex) {
        oSelectEl.add(elOptNew); // IE only
      }
    }
  },

  /**
   * Function to delete all selected states or references from the form
   * lists
   */
  oprDeleteSelectedStates: function () {
    var me = this;

    var iWhoSelect = 0;

    var sAppName = me.manageWindow.items.getAt(1).appName;

    if (me.manageWindow.items.getAt(1).items.getAt(0).items.getAt(1).getValue()) iWhoSelect = 1;

    var oSelectField = document.getElementById(me.manageWindow.getId()).getElementsByTagName("select")[iWhoSelect];

    for (var i = oSelectField.length - 1; i >= 0; i--) {
      if (oSelectField.options[i].selected) {
        /*
         * First we check whether there are instances of that state that are
         * active
         */
        var oStateName = oSelectField.options[i].value;

        if (iWhoSelect == 0) {
          if (!GLOBAL.APP.SM.isAnyActiveState(sAppName, oStateName)) {
            var cbFunc = function (rCode, rAppName, rStateType, rStateName) {
              if (rCode == 1) {
                me.manageWindow.items.getAt(1).cbAfterRemove("application", rAppName, rStateName);
                for (var j = oSelectField.length - 1; j >= 0; j--) {
                  if (rStateName == oSelectField.options[j].value) {
                    oSelectField.remove(j);
                    break;
                  }
                }
              }
            };

            GLOBAL.APP.SM.oprDeleteState(sAppName, "application", oStateName, cbFunc);
          } else
            GLOBAL.APP.CF.alert("The state <b>" + oSelectField.options[i].value + "</b> you are willing to delete is curently in use !", "warning");
        } else {
          var cbFunc = function (rCode, rAppName, rStateType, rStateName) {
            if (rCode == 1) {
              me.manageWindow.items.getAt(1).cbAfterRemove("reference", rAppName, rStateName);
              for (var j = oSelectField.length - 1; j >= 0; j--) {
                if (rStateName == oSelectField.options[j].value) {
                  oSelectField.remove(j);
                  break;
                }
              }
            }
          };

          GLOBAL.APP.SM.oprDeleteState(sAppName, "reference", oStateName, cbFunc);
        }
      }
    }
  },

  /**
   * Function to create and show the form for saving or loading a shared
   * state
   *
   * @param {Function}
   *          cbAfterLoad Function to be executed after the shared state has
   *          been loaded
   * @param {Function}
   *          cbAfterSave Function to be executed after the shared state has
   *          been saved
   *
   */
  formStateLoader: function (cbAfterLoad, cbAfterSave) {
    var me = this;

    me.txtLoadText = Ext.create("Ext.form.field.Text", {
      fieldLabel: "Shared State:",
      labelAlign: "left",
      margin: 10,
      width: 400,
      validate: function () {
        var me = this;
        var sValue = me.getValue();
        if (Ext.util.Format.trim(sValue) != "" && sValue.split("|").length == 4) {
          return true;
        } else {
          GLOBAL.APP.CF.alert("The value in the 'Shared State' field is not valid !", "warning");
          return false;
        }
      },
      validateOnChange: false,
      validateOnBlur: false,
    });

    me.txtRefName = Ext.create("Ext.form.field.Text", {
      fieldLabel: "Name:",
      labelAlign: "left",
      margin: 10,
      width: 400,
      validate: function () {
        var me = this;

        if (Ext.util.Format.trim(me.getValue()) != "") {
          return true;
        } else {
          GLOBAL.APP.CF.alert("The 'Name' field cannot be empty !", "warning");
          return false;
        }
      },
      validateOnChange: false,
      validateOnBlur: false,
    });

    me.btnLoadSharedState = new Ext.Button({
      text: "Load",
      margin: 3,
      iconCls: "toolbar-other-load",
      handler: function () {
        if (me.txtLoadText.validate()) {
          GLOBAL.APP.MAIN_VIEW.currentState = "";
          GLOBAL.APP.SM.oprLoadSharedState(me.txtLoadText.getValue(), cbAfterLoad, me.txtRefName.getValue());
          me.manageWindow.hide();
        }
      },
      scope: me,
    });

    me.btnSaveSharedState = new Ext.Button({
      text: "Create Link",
      margin: 3,
      iconCls: "toolbar-other-save",
      handler: function () {
        var oValid = true;

        if (!me.txtLoadText.validate()) oValid = false;

        if (!me.txtRefName.validate()) oValid = false;

        if (oValid) {
          GLOBAL.APP.SM.oprSaveSharedState(me.txtRefName.getValue(), me.txtLoadText.getValue(), cbAfterSave);
          me.manageWindow.hide();
        }
      },
      scope: me,
    });

    me.btnLoadAndSaveSharedState = new Ext.Button({
      text: "Load &amp; Create Link",
      margin: 3,
      iconCls: "toolbar-other-load",
      handler: function () {
        var oValid = true;

        if (!me.txtLoadText.validate()) oValid = false;

        if (!me.txtRefName.validate()) oValid = false;

        if (oValid) {
          GLOBAL.APP.MAIN_VIEW.currentState = "";
          GLOBAL.APP.SM.oprLoadSharedState(me.txtLoadText.getValue(), cbAfterLoad, me.txtRefName.getValue());
          GLOBAL.APP.SM.oprSaveSharedState(me.txtRefName.getValue(), me.txtLoadText.getValue(), cbAfterSave);
          me.manageWindow.hide();
        }
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      border: false,
    });

    oToolbar.add([me.btnLoadSharedState, me.btnSaveSharedState, me.btnLoadAndSaveSharedState]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      autoHeight: true,
      border: false,
      items: [oToolbar, me.txtLoadText, me.txtRefName],
    });

    me.manageWindow = Ext.create("widget.window", {
      height: 200,
      width: 500,
      title: "State Loader",
      layout: "fit",
      modal: true,
      items: [oPanel],
      iconCls: "system_state_icon",
    });

    me.manageWindow.show();
  },
  /**
   * It is used when we want to crate a new desktop.
   *
   * @param {String}
   *          dialogtext the name of the dialog.
   * @param {Function}
   *          cbAfterSave Function that is executed after the save has been
   *          saved
   */
  formSaveDialog: function (sStateType, sAppName, oAppObject, cbAfterSave, dialogtext, save) {
    var me = this;

    me.txtStateName = Ext.create("Ext.form.field.Text", {
      fieldLabel: dialogtext,
      labelAlign: "left",
      margin: 10,
      width: 400,
      enableKeyEvents: true,
      validateValue: function (sValue) {
        sValue = Ext.util.Format.trim(sValue);

        if (sValue.length < 1) {
          this.markInvalid("You must specify a name !");
          return false;
        } else {
          if (GLOBAL.APP.SM.isStateLoaded(sStateType, sAppName, sValue) == 1) {
            this.markInvalid("The name you enetered already exists !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.', ' '");
              return false;
            }
          }
        }
      },
      validateOnChange: true,
      validateOnBlur: false,
      listeners: {
        keypress: function (oTextField, e, eOpts) {
          if (e.getCharCode() == 13) {
            if (me.txtStateName.isValid()) {
              var sStateName = me.txtStateName.getValue();

              if (save) {
                GLOBAL.APP.SM.oprSendDataForSave(sAppName, oAppObject, sStateType, sStateName, cbAfterSave);
              } else {
                cbAfterSave(sStateName);
              }
            }
          }
        },
      },
    });

    // button for saving the state
    me.btnSaveState = new Ext.Button({
      text: "Save",
      margin: 3,
      iconCls: "dirac-icon-save",
      handler: function () {
        if (me.txtStateName.isValid()) {
          var sStateName = me.txtStateName.getValue();

          if (save) {
            GLOBAL.APP.SM.oprSendDataForSave(sAppName, oAppObject, sStateType, sStateName, cbAfterSave);
          } else {
            cbAfterSave(sStateName);
          }
        }
      },
      scope: me,
    });

    // button to close the save form
    me.btnCancelSaveState = new Ext.Button({
      text: "Cancel",
      margin: 3,
      iconCls: "toolbar-other-close",
      handler: function () {
        me.txtStateName.setValue("");
        me.saveWindow.hide();
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      border: false,
    });

    oToolbar.add([me.btnSaveState, me.btnCancelSaveState]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      autoHeight: true,
      border: false,
      items: [oToolbar, me.txtStateName],
    });

    // initializing window showing the saving form
    me.saveWindow = Ext.create("widget.window", {
      height: 120,
      width: 500,
      title: dialogtext,
      layout: "fit",
      modal: true,
      items: oPanel,
    });

    me.saveWindow.show();
    me.txtStateName.focus();
  },
  deleteState: function (sAppName, stateName, cbFunc) {
    if (!GLOBAL.APP.SM.isAnyActiveState(sAppName, stateName, cbFunc)) {
      GLOBAL.APP.SM.oprDeleteState(sAppName, "application", stateName, cbFunc);
    } else {
      GLOBAL.APP.CF.alert("The state <b>" + stateName + "</b> you are willing to delete is curently in use !", "warning");
    }
  },
  deleteStateFromDesktop: function (desktop, appName, stateName, cbAfterSave) {
    var me = this;
    if (!GLOBAL.APP.SM.isAnyActiveState(appName, stateName, cbAfterSave)) {
      var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", desktop);
      for (var i = 0; i < desktops.data.length; i++) {
        if (desktops.data[i].currentState == stateName && desktops.data[i].module == appName) {
          Ext.Array.erase(desktops.data, i, 1);
          break;
        }
      }
      me.oprSendDataForSave("desktop", desktops, "application", desktop, cbAfterSave);
    } else {
      GLOBAL.APP.CF.alert("The state <b>" + stateName + "</b> you are willing to delete is curently in use !", "warning");
    }
  },

  oprSendDataForSave: function (sAppName, oSendData, sStateType, sStateName, cbAfterSave) {
    var me = this;
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

          GLOBAL.APP.SM.cache[sStateType][sAppName][sStateName] = oSendData;

          cbAfterSave(1, sAppName, sStateType, sStateName);
        } else {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);

          if (oResponse.status == 400) {
            cbAfterSave(-1, sAppName, sStateType, sStateName);
          } else {
            cbAfterSave(-2, sAppName, sStateType, sStateName);
          }
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
  saveState: function (desktop, app, state, cbFunc) {
    var me = this;
    var desktop = desktop == "" ? "Default" : desktop;
    var appContainer = GLOBAL.APP.MAIN_VIEW.getRightContainer();
    if (appContainer) {
      var tab = appContainer.getTabFromApplicationContainer(desktop);
      if (tab && tab.isLoaded) {
        var appTab = tab.getPanel(state);
        if (appTab && appTab.isLoaded) {
          if (desktop == "Default") {
            var activeDesktop = GLOBAL.APP.MAIN_VIEW.getActiveDesktop();

            var appl = activeDesktop.getActiveTab();

            var funcAfterSave = function (returnCode, appName, stateType, stateName) {
              if (returnCode == 1 && appl.currentState != stateName) {
                me.__changeActiveState(appl, appName, stateType, stateName);
              }
            };

            GLOBAL.APP.MAIN_VIEW.SM.oprSaveAppState("application", appl.loadedObject.self.getName(), appl.loadedObject, funcAfterSave);
          } else {
            var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", desktop);
            var found = false;
            if (desktops != -1) {
              for (var i = 0; i < desktops.data.length; i++) {
                if (desktops.data[i].module == app && desktops.data[i].currentState == state) {
                  desktops.data[i].data = appTab.loadedObject.getStateData();
                  if (appTab.childWindows.length > 0) {
                    // we have to save the help text automatically.
                    for (var i = 0; i < appTab.childWindows.length; i++) {
                      if (appTab.childWindows[i].type == "help") {
                        // The Notepad is open. The text has to be retrieved
                        // from the notepad...
                        var helptext = {
                          helptext: appTab.childWindows[i].items.getAt(0).getValue(),
                        };
                        Ext.apply(desktops.data[i].data, helptext);
                      }
                    }
                  } else {
                    Ext.apply(desktops.data[i].data, appTab.loadedObject.getHelpText());
                  }
                  found = true;
                  break;
                }
              }
            }

            if (!found) {
              me.formSaveStateOfData(desktop, appTab, "application", app, function (returnCode, sAppName, sStateType, sStateName) {
                // cbFunc(desktop, app, sStateName);
                if (returnCode == 1 && appTab.loadedObject.currentState != sStateName) {
                  GLOBAL.APP.SM.oprRemoveActiveState(sAppName, appTab.loadedObject.currentState);

                  appTab.loadedObject.currentState = sStateName;
                  appTab.currentState = sStateName;
                  GLOBAL.APP.SM.oprAddActiveState(sAppName, sStateName);
                  appTab.setTitle(appTab.loadedObject.launcher.title + " [" + appTab.loadedObject.currentState + "]");

                  if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow) GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
                }

                GLOBAL.APP.MAIN_VIEW.addApplicationToDesktopMenu(desktop, sStateName, app);
              });
            } else {
              me.oprSendDataForSave("desktop", desktops, "application", desktop, cbFunc);
            }
          }
        } else {
          // The state is not loaded. We do not have to save...
          Ext.dirac.system_info.msg("Notification", state + " is not modified! It is already saved!");
        }
      } else {
        // the application state is not loaded...
        var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", desktop);

        for (var i = 0; i < desktops.data.length; i++) {
          if (desktops.data[i].currentState == state && desktops.data[i].module == app) {
            desktops.data[i] = appTab.loadedObject.getStateData();
            if (appTab.childWindows.length > 0) {
              // we have to save the help text automatically.
              for (var i = 0; i < appTab.childWindows.length; i++) {
                if (appTab.childWindows[i].type == "help") {
                  // The Notepad is open. The text has to be retrieved
                  // from the notepad...
                  var helptext = {
                    helptext: appTab.childWindows[i].items.getAt(0).getValue(),
                  };
                  Ext.apply(desktops.data[i].data, helptext);
                }
              }
            } else {
              Ext.apply(desktops.data[i].data, appTab.loadedObject.getHelpText());
            }

            break;
          }
        }

        me.oprSendDataForSave("desktop", desktops, "application", desktop, cbFunc);
      }
    } else {
      cbFunc(desktop, app, state);
    }
  },
  saveAsState: function (desktop, app, state, cbFunc) {
    var me = this;
    var desktop = desktop == "" ? "Default" : desktop;
    var appContainer = GLOBAL.APP.MAIN_VIEW.getRightContainer();
    if (appContainer) {
      var tab = appContainer.getTabFromApplicationContainer(desktop);
      if (tab && tab.isLoaded) {
        var appTab = tab.getPanel(state);
        if (appTab && appTab.isLoaded) {
          if (desktop == "Default") {
            // we are on the default desktop

            var activeDesktop = GLOBAL.APP.MAIN_VIEW.getActiveDesktop();

            var appl = activeDesktop.getActiveTab();

            var funcAfterSave = function (returnCode, appName, stateType, stateName) {
              if (returnCode == 1 && appl.currentState != sStateName) {
                me.__changeActiveState(appl, appName, stateType, stateName);
              }
            };

            GLOBAL.APP.MAIN_VIEW.SM.formSaveState("application", app, appl.loadedObject, funcAfterSave);
          } else {
            // we have to add to the menu and we have to save it...
            me.formSaveAsStateOfData(desktop, state, "application", app, function (iCode, sAppName, sStateType, sStateName) {
              cbFunc(desktop, app, sStateName);
              GLOBAL.APP.MAIN_VIEW.addApplicationToDesktopMenu(desktop, sStateName, app);
            });
          }
        } else {
          me.formSaveAsStateOfData(desktop, state, "application", app, function (iCode, sAppName, sStateType, sStateName) {
            cbFunc(desktop, app, sStateName);
            GLOBAL.APP.MAIN_VIEW.addApplicationToDesktopMenu(desktop, sStateName, app);
          });
        }
      } else {
        me.formSaveAsStateOfData(desktop, state, "application", app, function (iCode, sAppName, sStateType, sStateName) {
          cbFunc(desktop, app, sStateName);
          GLOBAL.APP.MAIN_VIEW.addApplicationToDesktopMenu(desktop, sStateName, app);
        });
      }
    }
  },
  __changeActiveState: function (appObj, appName, stateType, stateName) {
    var me = this;
    var oldApplicationUrl = appObj.getUrlDescription();
    GLOBAL.APP.MAIN_VIEW.getRightContainer().addStateToExistingWindows(stateName, appName);

    if (appObj.currentState != "") GLOBAL.APP.SM.oprRemoveActiveState(appName, appObj.currentState);

    appObj.loadedObject.currentState = stateName;
    appObj.currentState = stateName;
    GLOBAL.APP.SM.oprAddActiveState(appName, stateName);
    appObj.setTitle(appObj.loadedObject.launcher.title + " [" + appObj.loadedObject.currentState + "]");

    if (GLOBAL.APP.MAIN_VIEW.SM.saveWindow) GLOBAL.APP.MAIN_VIEW.SM.saveWindow.close();
    Ext.Array.remove(GLOBAL.APP.MAIN_VIEW._default_desktop_state, oldApplicationUrl);

    GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();
  },
  /**
   * Function called when the Save... button from the SAVE context menu is
   * clicked
   *
   * @param {String}
   *          sStateType The type of the state [application|reference]
   * @param {String}
   *          sAppName Application class name
   * @param {Object}
   *          oAppObject The application object
   * @param {Function}
   *          cbAfterSave Function that is executed after the save has been
   *          saved
   */
  formSaveStateOfData: function (desktop, appObj, sStateType, sAppName, cbAfterSave) {
    var me = this;

    me.txtStateName = Ext.create("Ext.form.field.Text", {
      fieldLabel: "State Name:",
      labelAlign: "left",
      margin: 10,
      width: 400,
      enableKeyEvents: true,
      validateValue: function (sValue) {
        sValue = Ext.util.Format.trim(sValue);

        if (sValue.length < 1) {
          this.markInvalid("You must specify a name !");
          return false;
        } else {
          if (GLOBAL.APP.SM.isStateLoaded(sStateType, sAppName, sValue) == 1) {
            this.markInvalid("The name you enetered already exists !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.', ' '");
              return false;
            }
          }
        }
      },
      validateOnChange: true,
      validateOnBlur: false,
      listeners: {
        keypress: function (oTextField, e, eOpts) {
          if (e.getCharCode() == 13) {
            if (me.txtStateName.isValid()) {
              var sStateName = me.txtStateName.getValue();

              var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", desktop);
              var data = {
                data: appObj.loadedObject.getStateData(),
                module: appObj.loadedObject.self.getName(),
                currentState: sStateName,
              };
              if (appObj.childWindows.length > 0) {
                // we have to save the help text automatically.
                for (var i = 0; i < appObj.childWindows.length; i++) {
                  if (appObj.childWindows[i].type == "help") {
                    // The Notepad is open. The text has to be retrieved
                    // from the notepad...
                    var helptext = {
                      helptext: appObj.childWindows[i].items.getAt(0).getValue(),
                    };
                    Ext.apply(data.data, helptext);
                  }
                }
              } else {
                Ext.apply(data.data, appObj.loadedObject.getHelpText());
              }

              desktops.data.push(data);
              me.oprSendDataForSave("desktop", desktops, "application", desktop, function (iCode, appName, stateType, stateName) {
                cbAfterSave(iCode, appObj.loadedObject.self.getName(), stateType, sStateName);
              });
            }
          }
        },
      },
    });

    // button for saving the state
    me.btnSaveState = new Ext.Button({
      text: "Save",
      margin: 3,
      iconCls: "dirac-icon-save",
      handler: function () {
        if (me.txtStateName.isValid()) {
          var sStateName = me.txtStateName.getValue();

          var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", desktop);

          var data = {
            data: appObj.loadedObject.getStateData(),
            module: appObj.loadedObject.self.getName(),
            currentState: sStateName,
          };

          if (appObj.childWindows.length > 0) {
            // we have to save the help text automatically.
            for (var i = 0; i < appObj.childWindows.length; i++) {
              if (appObj.childWindows[i].type == "help") {
                // The Notepad is open. The text has to be retrieved
                // from the notepad...
                var helptext = {
                  helptext: appObj.childWindows[i].items.getAt(0).getValue(),
                };
                Ext.apply(data.data, helptext);
              }
            }
          } else {
            Ext.apply(data.data, appObj.loadedObject.getHelpText());
          }

          desktops.data.push(data);

          me.oprSendDataForSave("desktop", desktops, "application", desktop, function (iCode, appName, stateType, stateName) {
            cbAfterSave(iCode, appObj.loadedObject.self.getName(), stateType, sStateName);
          });
        }
      },
      scope: me,
    });

    // button to close the save form
    me.btnCancelSaveState = new Ext.Button({
      text: "Cancel",
      margin: 3,
      iconCls: "toolbar-other-close",
      handler: function () {
        me.txtStateName.setValue("");
        me.saveWindow.hide();
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      border: false,
    });

    oToolbar.add([me.btnSaveState, me.btnCancelSaveState]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      autoHeight: true,
      border: false,
      items: [oToolbar, me.txtStateName],
    });

    // initializing window showing the saving form
    me.saveWindow = Ext.create("widget.window", {
      height: 120,
      width: 500,
      title: "Save state",
      layout: "fit",
      modal: true,
      items: oPanel,
    });

    me.saveWindow.show();
    me.txtStateName.focus();
  },
  moveAppState: function (stateName, moduleName, fromDesktopName, toDesktopName) {
    var me = this;
    var data = {};

    if (fromDesktopName == "Default") {
      Ext.apply(data, {
        data: GLOBAL.APP.SM.getStateData("application", moduleName, stateName),
        currentState: stateName,
        module: moduleName,
        loadedObjectType: "app",
      });

      me.addStateToDesktop(toDesktopName, data, function () {
        me.deleteState(moduleName, stateName, function () {});
      });
    } else {
      var fromDsktop = GLOBAL.APP.SM.getStateData("application", "desktop", fromDesktopName);
      if (fromDsktop != -1) {
        for (var i = 0; i < fromDsktop.data.length; i++) {
          if (fromDsktop.data[i].module == moduleName && fromDsktop.data[i].currentState == stateName) {
            data = fromDsktop.data[i];
            break;
          }
        }
      }
      me.addStateToDesktop(toDesktopName, data, function () {
        me.deleteStateFromDesktop(fromDesktopName, moduleName, stateName, function () {});
      });
    }
  },
  addStateToDesktop: function (desktopName, data, cbAfterSave) {
    var me = this;

    if (desktopName == "Default") {
      GLOBAL.APP.SM.oprSendDataForSave("application", data.data, data.module, data.currentState, cbAfterSave);
    } else {
      var desktops = GLOBAL.APP.SM.getStateData("application", "desktop", desktopName);
      desktops.data.push(data);
      me.oprSendDataForSave("desktop", desktops, "application", desktopName, cbAfterSave);
    }
  },
});
