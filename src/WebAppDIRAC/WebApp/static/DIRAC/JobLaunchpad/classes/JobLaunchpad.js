Ext.define("DIRAC.JobLaunchpad.classes.JobLaunchpad", {
  extend: "Ext.dirac.core.Module",

  requires: [
    "Ext.panel.Panel",
    "Ext.form.FieldSet",
    "Ext.menu.CheckItem",
    "Ext.button.Button",
    "Ext.toolbar.Toolbar",
    "Ext.form.Panel",
    "Ext.tree.Panel",
    "Ext.data.TreeStore",
    "Ext.menu.Menu",
  ],

  loadState: function (data) {
    var me = this;

    for (var key in data) {
      if (key in me.textualFields) {
        me.__destroyJdlField(key);
      }
      me.textualFields[key] = {};
      me.textualFields[key].value = data[key];
      me.__createJdlField(key, data[key], true);
    }
  },

  initComponent: function () {
    var me = this;

    me.launcher.title = "Job Launchpad";
    me.launcher.maximized = false;

    me.launcher.width = 600;
    me.launcher.height = 600;

    me.launcher.x = 0;
    me.launcher.y = 0;

    Ext.apply(me, {
      layout: "border",
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    me.callParent(arguments);
  },

  buildUI: function () {
    var me = this;

    me.fsetPredefinedSetsSection = Ext.create("Ext.form.FieldSet", {
      title: "Predefined Sets of Launchpad Values",
      collapsible: true,
      layout: "anchor",
      padding: 5,
    });

    me.fsetJdlSection = Ext.create("Ext.form.FieldSet", {
      title: "JDL",
      collapsible: true,
      layout: "anchor",
      padding: 5,
    });

    me.fsetInputSandboxSection = Ext.create("Ext.form.FieldSet", {
      title: "Input Sandbox",
      collapsible: true,
      layout: "anchor",
      padding: 5,
    });

    me.fsetInputSandboxSection.add(me.uploadField);

    me.textualFields = {};

    me.btnAddParameters = new Ext.Button({
      text: "Add Parameters",
      iconCls: "dirac-icon-plus",
      scope: me,
      menu: [],
      tooltip: "Click to add more parameters to the JDL",
    });

    me.btnProxyStatus = new Ext.Button({
      text: "Proxy Status",
      handler: function () {
        me.proxyCheckerFunction();
      },
      scope: me,
      tooltip: "Proxy status updates automatically once per day",
    });

    var oTopToolbar = new Ext.create("Ext.toolbar.Toolbar", {
      dock: "top",
      items: [me.btnProxyStatus, "->", me.btnAddParameters],
    });

    me.btnSubmit = new Ext.Button({
      text: "Submit",
      margin: 1,
      iconCls: "dirac-icon-submit",
      handler: function () {
        me.getContainer().body.mask("Wait ...");
        me.mainFormPanel.submit({
          url: GLOBAL.BASE_URL + "JobLaunchpad/jobSubmit",
          success: function (form, action) {
            me.getContainer().body.unmask();
            if (action.result.success == "false") {
              GLOBAL.APP.CF.alert("Error: " + action.result.error, "error");
            } else {
              var sIds = "";

              var bPlural = true;

              if (action.result.result instanceof Array) {
                sIds = action.result.result.join(", ");
              } else {
                sIds = action.result.result;
                bPlural = false;
              }

              var bMultiIds = false;
              if (action.result.result.length > 1) bMultiIds = true;

              var oWarn = Ext.MessageBox.show({
                title: "Success",
                msg: "Your Job ID" + (bPlural ? "s are " : " is ") + sIds,
                buttons: Ext.MessageBox.OKYES,
                buttonText: {
                  ok: "OK",
                  no: "Show Job",
                },
                fn: function (oButton) {
                  oWarn.hide();
                },
                animateTarget: "mb4",
                icon: Ext.MessageBox.QUESTION,
              });
            }
          },
          failure: function (form, action) {
            GLOBAL.APP.CF.alert("Error", "error");
          },
        });
      },
      scope: me,
    });

    me.btnReset = new Ext.Button({
      text: "Reset",
      margin: 1,
      iconCls: "dirac-icon-reset",
      handler: function () {
        // first go through all optional fields and see if they are
        // checked,
        // remove and unchecked
        for (var i = 0; i < me.btnAddParameters.menu.items.length; i++) {
          var oItem = me.btnAddParameters.menu.items.getAt(i);

          if (oItem.checked) {
            oItem.setChecked(false);
            me.__destroyJdlField(oItem.text);
          }
        }

        // go through the text fields and set the default values of the
        // mandatory fields
        for (var sKey in me.textualFields) {
          if (me.textualFields[sKey].mandatory) {
            me.textualFields[sKey].object.setValue(me.textualFields[sKey].value);
          }
        }

        // second remove all items from input sandbox container
        me.fsetInputSandboxSection.removeAll();
        me.oprAddNewFileField();
        me.oprAddNewLfnTextField();
        me.proxyCheckerFunction();
      },
      scope: me,
    });

    var oBottomToolbar = new Ext.create("Ext.toolbar.Toolbar", {
      dock: "bottom",
      layout: {
        pack: "center",
      },
    });

    if ("properties" in GLOBAL.USER_CREDENTIALS) {
      if (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, "NormalUser") != -1) {
        oBottomToolbar.add([me.btnSubmit, me.btnReset]);
      } else {
        oBottomToolbar.add([
          {
            xtype: "tbtext",
            text: "<b style='color:red'>The selected group is not allowed to submit new jobs !</b>",
          },
        ]);
      }
    } else {
      oBottomToolbar.add([
        {
          xtype: "tbtext",
          text: "<b style='color:red'>The selected group is not allowed to submit new jobs !</b>",
        },
      ]);
    }

    me.mainFormPanel = new Ext.create("Ext.form.Panel", {
      floatable: false,
      region: "center",
      layout: "anchor",
      header: false,
      bodyPadding: 5,
      autoScroll: true,
      dockedItems: [oTopToolbar, oBottomToolbar],
      items: [me.fsetPredefinedSetsSection, me.fsetJdlSection, me.fsetInputSandboxSection],
    });

    me.predefinedSetsMenu = new Ext.menu.Menu({
      width: 250,
      items: [
        {
          text: "Apply to the selected parameters",
          moduleObject: me,
          listeners: {
            click: me.__oprApplyToJdl,
          },
        },
      ],
    });

    me.oprAddNewFileField();
    me.oprAddNewLfnTextField();

    me.add([me.mainFormPanel]);

    me.setUpParametersAndPredefinedConfig();
    me.proxyCheckerFunction();
  },

  __oprApplyToJdl: function () {
    var me = this.moduleObject;

    var sPredefinedSet = me.predefinedSetsMenu.node.data.text;

    for (var sKey in me.predefinedSets[sPredefinedSet]) {
      if (sKey != "InputSandbox") {
        if (sKey in me.textualFields) {
          if (me.textualFields[sKey].object != null) {
            me.textualFields[sKey].object.setValue(me.predefinedSets[sPredefinedSet][sKey]);
          } else {
            me.__createJdlField(sKey, me.predefinedSets[sPredefinedSet][sKey], true);
          }
        }
      } else {
        // remove all text fields and create new ones from the value to be
        // applied

        for (var i = me.fsetInputSandboxSection.items.length - 1; i >= 0; i--) {
          var oItem = me.fsetInputSandboxSection.getComponent(i);

          if (oItem.self.getName() == "Ext.form.field.Text") {
            me.fsetInputSandboxSection.remove(oItem);
            Ext.destroy(oItem);
          }
        }

        // now create new ones
        var oLfns = me.predefinedSets[sPredefinedSet][sKey].split(",");

        for (var i = 0; i < oLfns.length; i++) {
          me.oprAddNewLfnTextField(oLfns[i].substr(4));
        }
      }
    }
  },

  oprAddNewFileField: function () {
    var me = this;

    var sFileFieldName = "fileField" + me.fsetInputSandboxSection.items.getCount();

    var oFileField = new Ext.create("Ext.form.field.File", {
      anchor: "100%",
      buttonText: "Browse",
      moduleObject: me,
      name: sFileFieldName,
      listeners: {
        change: function (oComp, sValue, eOpts) {
          /*
           * First we check wheather there are empty file fields. If
           * there is an empty field, new field is not added to the
           * list.
           */

          var iLength = oComp.moduleObject.fsetInputSandboxSection.items.getCount();
          var bAddFile = true;
          var iIndex = 0;

          for (var i = 0; i < iLength; i++) {
            var oItem = oComp.moduleObject.fsetInputSandboxSection.getComponent(i);

            if (oItem.self.getName() != "Ext.form.field.Text") {
              if (!oItem.getValue()) {
                bAddFile = false;
              }

              iIndex++;
            }
          }

          if (bAddFile) {
            oComp.moduleObject.oprAddNewFileField();
          }

          /*
           * Then we calculate the size of the files. the function
           * bytesToSize is used here.
           */

          var iSize = 0;

          for (var i = 0; i < iLength; i++) {
            var oItem = oComp.moduleObject.fsetInputSandboxSection.getComponent(i);

            if (oItem.self.getName() != "Ext.form.field.Text") {
              var iFileSize = oComp.moduleObject.getFileSize(oItem.fileInputEl.dom);

              if (iFileSize >= 0) {
                iSize = iSize + iFileSize;
              }
            }
          }

          // console.log("Number of files " + iLength);
          // console.log("The size of all files: " +
          // oComp.moduleObject.bytesToSize(iSize, 2));
        },
      },
    });

    var iLength = me.fsetInputSandboxSection.items.getCount();
    var iWhereInsert = 0;

    for (var i = 0; i < iLength; i++) {
      var oItem = me.fsetInputSandboxSection.getComponent(i);
      if (oItem.self.getName() == "Ext.form.field.Text") {
        break;
      } else {
        iWhereInsert++;
      }
    }

    me.fsetInputSandboxSection.insert(iWhereInsert, oFileField);
  },

  oprAddNewLfnTextField: function (sValue) {
    var me = this;

    var sLfnTextFieldName = "lfnField" + me.fsetInputSandboxSection.items.getCount();

    var oLfnTextField = new Ext.create("Ext.form.field.Text", {
      fieldLabel: "LFN",
      anchor: "100%",
      labelAlign: "left",
      labelWidth: 30,
      name: sLfnTextFieldName,
      value: sValue ? sValue : "",
      enableKeyEvents: true,
      listeners: {
        keypress: function (oTextField, e, eOpts) {
          if (e.getCharCode() == 13) {
            if (oTextField.getValue() != "") {
              var oItem = me.oprAddNewLfnTextField();
              oItem.focus();
            }
          }
        },
      },
    });

    me.fsetInputSandboxSection.add(oLfnTextField);

    return oLfnTextField;
  },

  bytesToSize: function (bytes, precision) {
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;
    if (bytes >= 0 && bytes < kilobyte) {
      return bytes + " B";
    } else if (bytes >= kilobyte && bytes < megabyte) {
      return (bytes / kilobyte).toFixed(precision) + " KB";
    } else if (bytes >= megabyte && bytes < gigabyte) {
      return (bytes / megabyte).toFixed(precision) + " MB";
    } else if (bytes >= gigabyte && bytes < terabyte) {
      return (bytes / gigabyte).toFixed(precision) + " GB";
    } else if (bytes >= terabyte) {
      return (bytes / terabyte).toFixed(precision) + " TB";
    } else {
      return bytes + " B";
    }
  },

  getFileSize: function (oInputFile) {
    /*
     * Can't use `typeof FileReader === "function"` because apparently it
     * comes back as "object" on some browsers. So just see if it's there at
     * all
     */

    if (!window.FileReader) {
      // The file API isn't supported on this browser yet
      return -5;
    }

    if (!oInputFile) {
      return -4;
    } else if (!oInputFile.files) {
      return -3;
    } else if (!oInputFile.files[0]) {
      return -2;
    } else {
      var oFile = oInputFile.files[0];
      return oFile.size;
    }
  },

  processResponse: function (response) {
    var me = this;

    for (var sKey in response["result"]) {
      me.textualFields[sKey] = {};
      me.textualFields[sKey].value = response["result"][sKey][1];

      // special treatment of the case JobName
      if (sKey == "JobName") {
        me.textualFields[sKey].value =
          me.textualFields[sKey].value + "_" + GLOBAL.USER_CREDENTIALS.username + "_" + Math.floor(Math.random() * 1000001);
      }

      if (parseInt(response["result"][sKey][0], 10) == 1) {
        me.textualFields[sKey].mandatory = true;

        me.textualFields[sKey].object = new Ext.create("Ext.form.field.Text", {
          fieldLabel: sKey,
          anchor: "100%",
          labelAlign: "left",
          value: me.textualFields[sKey].value,
          name: sKey,
        });
      } else {
        me.textualFields[sKey].mandatory = false;

        me.btnAddParameters.menu.add({
          xtype: "menucheckitem",
          text: sKey,
          relatedCmbField: sKey,
          checked: false,
          handler: function (item, e) {
            var me = this;

            if (item.checked) me.__createJdlField(item.relatedCmbField);
            else me.__destroyJdlField(item.relatedCmbField);
          },
          scope: me,
        });
      }

      me.fsetJdlSection.add(me.textualFields[sKey].object);
    }

    me.__createPrededinedSetsTree(response["predefinedSets"]);
  },

  setUpParametersAndPredefinedConfig: function () {
    var me = this;

    if (typeof me.launcher.oResponse == "undefined") {
      Ext.Ajax.request({
        url: GLOBAL.BASE_URL + "JobLaunchpad/getLaunchpadOpts",
        method: "POST",
        success: function (response) {
          var response = Ext.JSON.decode(response.responseText);

          me.processResponse(response);
        },
        failure: function (response) {
          me.showProxyStatus("neutral");
        },
      });
    } else {
      me.processResponse(me.launcher.oResponse);
    }
  },

  __createPrededinedSetsTree: function (oPredefinedSets) {
    var me = this;

    me.predefinedSets = oPredefinedSets;

    var iNumberOfSets = 0;

    for (var sKey in me.predefinedSets) iNumberOfSets++;

    // if there are predefined sets we show those within a section
    // if not, the section is not shown
    if (iNumberOfSets > 0) {
      me.predefinedSetsTreeStore = Ext.create("Ext.data.TreeStore", {
        proxy: {
          type: "localstorage",
          // A unique ID is now required
          id: "Available Sets",
        },
        root: {
          text: "Available Sets",
        },
      });

      var oRoot = me.predefinedSetsTreeStore.getRootNode();

      for (var sKeySet in me.predefinedSets) {
        var oNewSetNode = oRoot.createNode({
          text: sKeySet,
          leaf: false,
          predefinedSets: true,
        });

        oRoot.appendChild(oNewSetNode);

        for (var sKeyOption in me.predefinedSets[sKeySet]) {
          var oNewOptionNode = oRoot.createNode({
            text: sKeyOption + " = " + me.predefinedSets[sKeySet][sKeyOption],
            leaf: true,
          });

          oNewSetNode.appendChild(oNewOptionNode);
        }
      }

      oRoot.expand();

      me.predefinedSetsTreePanel = new Ext.create("Ext.tree.Panel", {
        store: me.predefinedSetsTreeStore,
        header: false,
        bodyBorder: false,
        border: false,
        listeners: {
          beforeitemcontextmenu: function (oView, oNode, item, index, e, eOpts) {
            if (oNode.data.predefinedSets) {
              e.preventDefault();

              me.predefinedSetsMenu.node = oNode;
              me.predefinedSetsMenu.showAt(e.getXY());

              return false;
            } else {
              return true;
            }
          },

          beforecontainercontextmenu: function (oView, e, eOpts) {
            return false;
          },
        },
      });

      me.fsetPredefinedSetsSection.add(me.predefinedSetsTreePanel);
    } else {
      me.fsetPredefinedSetsSection.hide();
    }
  },

  proxyCheckerFunction: function () {
    var me = this;

    me.showProxyStatus("check");

    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "JobLaunchpad/getProxyStatus",
      method: "POST",
      success: function (response) {
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "false") {
          me.showProxyStatus("false");
        } else {
          if (jsonData["result"] == "false") {
            me.showProxyStatus("false");
          } else {
            me.showProxyStatus("true");
          }
        }
      },
      failure: function (response) {
        me.showProxyStatus("neutral");
      },
    });
  },

  showProxyStatus: function (sMode) {
    var me = this,
      sBtnText = "Proxy Status: ";

    if (sMode == "true") {
      sBtnText = sBtnText + '<span style="color:#009900; font-weight:bold">Valid</span>';
    } else if (sMode == "false") {
      sBtnText = sBtnText + '<span style="color:#FF0000; font-weight:bold">Not Valid</span>';
    } else if (sMode == "check") {
      sBtnText = sBtnText + '<span style="color:#FF9900; font-weight:bold">Checking</span>';
    } else {
      sBtnText = sBtnText + '<span style="font-weight:bold">Unknown</span>';
    }

    me.btnProxyStatus.setText(sBtnText);
  },

  __createJdlField: function (sFieldName, sValue, bSetCheckbox) {
    var me = this;

    var sCalValue = "";

    if (sValue) {
      sCalValue = sValue;
    } else {
      sCalValue = me.textualFields[sFieldName].value;
    }

    if (!bSetCheckbox) bSetCheckbox = false;

    me.textualFields[sFieldName].object = new Ext.create("Ext.form.field.Text", {
      fieldLabel: sFieldName,
      anchor: "100%",
      labelAlign: "left",
      value: sCalValue,
      name: sFieldName,
    });

    me.fsetJdlSection.add(me.textualFields[sFieldName].object);

    if (bSetCheckbox) {
      for (var i = 0; i < me.btnAddParameters.menu.items.length; i++) {
        var oItem = me.btnAddParameters.menu.items.getAt(i);

        if (oItem.text == sFieldName) {
          oItem.setChecked(true);
          break;
        }
      }
    }
  },

  __destroyJdlField: function (sFieldName) {
    var me = this;

    me.fsetJdlSection.remove(me.textualFields[sFieldName].object);
    Ext.destroy(me.textualFields[sFieldName].object);
    me.textualFields[sFieldName].object = null;
  },
});
