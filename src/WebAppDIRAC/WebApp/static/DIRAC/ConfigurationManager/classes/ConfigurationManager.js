Ext.define("DIRAC.ConfigurationManager.classes.ConfigurationManager", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.util.*",
    "Ext.panel.Panel",
    "Ext.form.field.Text",
    "Ext.button.Button",
    "Ext.menu.Menu",
    "Ext.form.field.ComboBox",
    "Ext.layout.*",
    "Ext.form.field.Date",
    "Ext.form.field.TextArea",
    "Ext.form.field.Checkbox",
    "Ext.form.FieldSet",
    "Ext.Button",
    "Ext.dirac.utils.DiracMultiSelect",
    "Ext.util.*",
    "Ext.toolbar.Toolbar",
    "Ext.data.Record",
    "Ext.tree.Panel",
    "Ext.data.TreeStore",
    "Ext.data.NodeInterface",
    "Ext.form.field.TextArea",
    "Ext.Array",
    "Ext.data.proxy.LocalStorage",
    "DIRAC.ConfigurationManager.classes.HistoryGridPanel",
  ],

  loadState: function (oData) {
    var me = this;

    me.__postponedLoadState(oData);
  },

  __postponedLoadState: function (oData) {
    var me = this;

    if (!me.isConnectionEstablished) {
      setTimeout(function () {
        me.__postponedLoadState(oData);
      }, 1000);
    } else {
      me.__sendSocketMessage({
        op: "getBulkExpandedNodeData",
        nodes: oData.expandedNodes.join("<<||>>"),
      });
    }
  },

  getStateData: function () {
    var me = this;
    var oReturn = {};

    var oSerializedActions = [];

    if ("" in me.expansionState) me.__serializeExpansionAction("", me.expansionState[""], oSerializedActions);

    oReturn.expandedNodes = oSerializedActions;

    return oReturn;
  },

  initComponent: function () {
    var me = this;

    me.launcher.title = "Configuration Manager";
    me.launcher.maximized = false;
    var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

    me.launcher.height = oDimensions[1] / 2;
    me.launcher.width = oDimensions[0] / 2;

    /*
     * Ext.apply(me, { layout : 'border', bodyBorder : false, defaults : {
     * collapsible : true, split : true }, items : [], header : false });
     */
    Ext.apply(me, {
      layout: "card",
      bodyBorder: false,
    });
    me.callParent(arguments);
  },

  /*
   * This function is used only for ExtJS version 4.1.3
   */

  setNodeText: function (oNode, sNewText) {
    oNode.set("text", sNewText);

    oNode.data.text = sNewText;
  },
  __sendSocketMessage: function (oData) {
    var me = this;

    console.log(oData);

    if (!me.isConnectionEstablished) {
      var sMessage = "There is no connection established with the server.\nDo you want to reconnect now?";

      if (confirm(sMessage)) {
        // resetting the configuration
        me.socket = me.__createSocket("resetConfiguration");
        me.btnResetConfig.hide();
        me.getLayout().setActiveItem(0);
      }
    } else {
      me.socket.send(JSON.stringify(oData));
    }
  },
  __setChangeMade: function (bChange) {
    var me = this;

    if (bChange) {
      if (me.btnCommitConfiguration) me.btnCommitConfiguration.show();
    } else {
      if (me.btnCommitConfiguration) me.btnCommitConfiguration.hide();
    }

    me.changeMade = bChange;
  },
  __createSocket: function (sOnOpenFuncName) {
    var me = this;

    var sLoc = window.location;
    var sWsuri;

    if (sLoc.protocol === "https:") {
      sWsuri = "wss:";
    } else {
      sWsuri = "ws:";
    }
    sWsuri += "//" + sLoc.host + GLOBAL.BASE_URL + "ConfigurationManager";

    var socket = new WebSocket(sWsuri);

    socket.onopen = function (e) {
      console.log("CONNECTED");
      me.isConnectionEstablished = true;
      socket.send(
        JSON.stringify({
          op: sOnOpenFuncName,
        })
      );
    };

    socket.onerror = function (e) {
      console.log("ERR " + e.data);
      me.isConnectionEstablished = false;
    };

    socket.onclose = function (e) {
      me.isConnectionEstablished = false;
      var sMessage = "CONNECTION CLOSED";

      if (me.changeMade) sMessage += " - UNCOMMITED CHANGES ARE LOST";

      console.log("CLOSE");
      sMessage += "\nDo you want to reconnect now?";

      if (me.changeMade && me.dontShowMessageBeforeClose) {
        // only show the message when the CS modified.
        // we do not need to reconnect, because it will reconnect when we
        // click on a item in the CS.
        if (confirm(sMessage)) {
          // resetting the configuration
          me.socket = me.__createSocket("resetConfiguration");
          me.btnResetConfig.hide();
        }
      }
    };

    socket.onmessage = function (e) {
      var oResponse = JSON.parse(e.data);

      if (parseInt(oResponse.success, 10) == 0) {
        GLOBAL.APP.CF.alert(oResponse.message, "error");

        switch (oResponse.op) {
          case "moveNode":
            me.waitForMoveResponse = false;
            break;
          case "commitConfiguration":
            me.btnCommitConfiguration.show();
            me.treePanel.body.unmask();
            break;
        }
      } else {
        switch (oResponse.op) {
          case "init":
            me.setNodeText(me.treeStore.getRootNode(), oResponse.name + " [" + oResponse.version + "]");
            me.btnResetConfig.show();
            me.treePanel.getRootNode().expand();
            break;
          case "getSubnodes":
            me.__oprCreateSubnodes(oResponse);
            break;
          case "showConfigurationAsText":
            me.__showConfigTextInWindow(oResponse.text);
            break;
          case "showCurrentDiff":
            me.__showConfigDiffInWindow(oResponse);
            me.setLoading(false);
            break;
          case "showDiff":
            me.__showConfigDiffInWindow(oResponse);
            me.setLoading(false);
            break;
          case "resetConfiguration":
            me.setNodeText(me.treeStore.getRootNode(), oResponse.name + " [" + oResponse.version + "]");
            me.__cbResetConfigurationTree(oResponse.text);
            me.__clearValuePanel();
            me.copyNode = null;
            me.btnPasteButton.setDisabled(true);
            me.treePanel.body.unmask();
            me.__setChangeMade(false);
            me.getLayout().setActiveItem(0);
            me.history.setLoading(false);
            me.setLoading(false);
            break;
          case "getBulkExpandedNodeData":
            me.__cbGetBulkExpandedNodeData(oResponse);
            break;

          case "setOptionValue":
            var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);
            oNode.set("csValue", oResponse.value);
            me.valuePanel.csValue = oResponse.value;
            me.txtOptionValuePanelTextArea.setValue(me.__stringToList(oNode.get("csValue")).join("\n"));
            me.setNodeText(oNode, oNode.get("csName") + " = " + oNode.get("csValue"));
            me.__setChangeMade(true);
            break;
          case "setComment":
            var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);
            oNode.set("csComment", oResponse.comment);
            me.valuePanel.csComment = me.__commentToList(oNode.get("csComment")).join("\n");

            me.__setChangeMade(true);
            break;
          case "copyKey":
            me.__cbMenuCopyNode(oResponse);

            me.__setChangeMade(true);
            break;
          case "renameKey":
            me.__cbMenuRenameNode(oResponse);

            me.__setChangeMade(true);
            break;
          case "deleteKey":
            me.__cbMenuDeleteNode(oResponse);
            me.__clearValuePanel();
            me.__setChangeMade(true);
            break;
          case "createSection":
            me.__cbMenuCreateSubsection(oResponse);
            me.__setChangeMade(true);
            break;
          case "createOption":
            me.__cbMenuCreateOption(oResponse);
            me.__setChangeMade(true);
            break;
          case "commitConfiguration":
            GLOBAL.APP.CF.alert("The changes in the configuration have been successfuly commited !", "info");
            me.btnCommitConfiguration.show();
            me.__setChangeMade(false);
            me.__sendSocketMessage({
              op: "resetConfiguration",
            });
            me.btnResetConfig.hide();
            break;
          case "moveNode":
            me.__cbMoveNode(oResponse);
            me.__setChangeMade(true);
            break;
          case "showshowHistory":
            me.setLoading(false);
            me.history.getStore().loadData(oResponse.result.versions);
            me.history.initRadios();
            break;
          case "rollback":
            Ext.dirac.system_info.msg("Notification", "The version roll back to " + oResponse.version);
            break;
          case "download":
            try {
              var blob = new Blob([oResponse.result], {
                type: "text/plain;charset=utf-8",
              });
              saveAs(blob, oResponse.fileName);
            } catch (ex) {
              Ext.dirac.system_info.msg("Error Notification", "Download is not suported..." + ex);
            }
            break;
          case "showCommitDiff":
            var cb = function (window) {
              if (confirm("Do you want to apply the configuration changes you've done till now?")) {
                me.treePanel.body.mask("Committing the configuration changes...");

                me.__sendSocketMessage({
                  op: "commitConfiguration",
                });

                window.hide();
                me.btnCommitConfiguration.hide();
              }
            };
            me.__showConfigDiffInWindow(oResponse, cb);
            me.setLoading(false);
            break;
        }
      }
    };

    return socket;
  },

  buildUI: function () {
    var me = this;

    me.isConnectionEstablished = false;

    me.socket = me.__createSocket("init");

    me.btnViewConfigAsText = new Ext.Button({
      text: "View as Text",

      iconCls: "dirac-icon-text",
      handler: function () {
        me.__sendSocketMessage({
          op: "showConfigurationAsText",
        });

        me.btnViewConfigAsText.hide();
      },
      scope: me,
    });

    me.btnDownloadConfigAsText = new Ext.Button({
      text: "Download",

      iconCls: "dirac-icon-download",

      handler: function () {
        me.__sendSocketMessage({
          op: "download",
        });
      },
      scope: me,
    });

    me.btnResetConfig = new Ext.Button({
      text: "Reload",

      iconCls: "dirac-icon-reset",
      handler: function () {
        if (me.changeMade) {
          if (confirm("If you reload you might loose the changes you've might made.\nDo you want to reload?")) {
            me.__sendSocketMessage({
              op: "resetConfiguration",
            });
            me.btnResetConfig.hide();
            me.treePanel.body.mask("Loading ...");
          }
        } else {
          me.__sendSocketMessage({
            op: "resetConfiguration",
          });
          me.btnResetConfig.hide();
          me.treePanel.body.mask("Loading ...");
        }
      },
      scope: me,
    });

    me.treeStore = Ext.create("Ext.data.TreeStore", {
      proxy: {
        type: "localstorage",
        id: "localstorage" + me.id,
      },
      root: {
        text: "Configuration",
      },
      listeners: {
        nodebeforeexpand: function (oNode, eOpts) {
          if (!me.flagReset) {
            var oNodePath = me.__getNodePath(oNode);

            me.__sendSocketMessage({
              op: "getSubnodes",
              nodePath: oNodePath,
              node: oNode.getId(),
            });
          }
        },
        nodebeforecollapse: function (oNode, eOpts) {
          // remove the path from the
          var oNodePath = me.__getNodePath(oNode);
          oNode.removeAll();
          oNode.appendChild({});
          me.__oprUnsetPathAsExpanded(oNodePath);
        },
      },
    });

    var bBarElems = [me.btnViewConfigAsText, me.btnDownloadConfigAsText, me.btnResetConfig];

    if ("properties" in GLOBAL.USER_CREDENTIALS && Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, "CSAdministrator") != -1) {
      me.btnBrowseManage = new Ext.Button({
        text: "Manage",

        iconCls: "cm-to-manage-icon",
        handler: function () {
          if (me.editMode) {
            me.btnBrowseManage.setText("Manage");
            me.btnBrowseManage.setIconCls("cm-to-manage-icon");
            me.leafMenu.hide();
            me.sectionMenu.hide();
            me.valuePanel.hide();
            if (me.changeMade) {
              me.__setChangeMade(true);
            } else {
              me.__setChangeMade(true);
            }
          } else {
            me.btnBrowseManage.setText("Browse");
            me.btnBrowseManage.setIconCls("cm-to-browse-icon");
            me.valuePanel.show();
            me.valuePanel.expand(false);
          }
          me.editMode = !me.editMode;
        },
        scope: me,
      });

      me.btnCommitConfiguration = new Ext.Button({
        text: "Commit",

        iconCls: "dirac-icon-submit",
        handler: function () {
          me.setLoading("Creating the diff.... Please be patient...");
          me.__sendSocketMessage({
            op: "showCommitDiff",
          });
        },
        scope: me,
        hidden: true,
      });

      me.btnViewConfigDifference = new Ext.Button({
        text: "Show diff.",

        iconCls: "cm-to-browse-icon",
        handler: function () {
          me.setLoading("Creating the diff.... Please be patient...");
          me.__sendSocketMessage({
            op: "showCurrentDiff",
          });
          me.btnCommitConfiguration.hide();
        },
        scope: me,
        hidden: false,
      });

      me.btnShowHistory = new Ext.button.Button({
        text: "Show history",
        handler: function () {
          me.setLoading("Loading server history...");
          me.__sendSocketMessage({
            op: "showshowHistory",
          });
          me.getLayout().setActiveItem(1);
        },
        scope: me,
        hidden: false,
      });

      bBarElems.push("->");
      bBarElems.push(me.btnCommitConfiguration);
      bBarElems.push(me.btnViewConfigDifference);
      bBarElems.push(me.btnShowHistory);
      bBarElems.push(me.btnBrowseManage);
    }

    me.treePanel = new Ext.create("Ext.tree.Panel", {
      region: "center",
      store: me.treeStore,
      header: false,
      viewConfig: {
        plugins: {
          ptype: "treeviewdragdrop",
          containerScroll: true,
        },
      },
      tbar: bBarElems,
      listeners: {
        beforeitemcontextmenu: function (oView, oNode, item, index, e, eOpts) {
          if (me.editMode) {
            e.preventDefault();
            if (oNode.isLeaf()) {
              me.leafMenu.node = oNode;
              me.leafMenu.showAt(e.getXY());
            } else {
              me.sectionMenu.node = oNode;
              me.sectionMenu.showAt(e.getXY());
            }

            if (me.editMode) {
              if (oNode.getId() != "root") {
                me.__oprSetValuesForValuePanel(me, oNode);
              }
            }

            return false;
          } else {
            return true;
          }
        },

        beforecontainercontextmenu: function (oView, e, eOpts) {
          if (me.editMode) {
            return false;
          } else {
            return true;
          }
        },

        itemclick: function (oView, oNode, item, index, e, eOpts) {
          if (oNode.getId() != "root") {
            me.__oprSetValuesForValuePanel(me, oNode);
          }
        },
        beforeitemmove: function (oNode, oOldParent, oNewParent, iIndex, eOpts) {
          if (me.editMode) {
            if (!me.waitForMoveResponse) {
              me.__oprMoveNode(oNode, oOldParent, oNewParent, iIndex);
              return false;
            }
          } else {
            return false;
          }
        },
      },
    });

    me.btnValuePanelSubmit = new Ext.Button({
      text: "Submit",
      margin: 1,
      iconCls: "dirac-icon-submit",
      handler: me.__oprActionValuePanel,
      scope: me,
    });

    me.btnValuePanelReset = new Ext.Button({
      text: "Reset",
      margin: 1,
      iconCls: "dirac-icon-reset",
      handler: function () {
        if (me.valuePanel.csNode == null) return;

        me.txtOptionValuePanelTextArea.setValue(me.valuePanel.csValue);
        me.txtCommentValuePanelTextArea.setValue(me.valuePanel.csComment);
      },
      scope: me,
    });

    var oValuePanelToolbar = new Ext.toolbar.Toolbar({
      dock: "bottom",
      layout: {
        pack: "center",
      },
      items: [me.btnValuePanelSubmit, me.btnValuePanelReset],
    });

    me.txtOptionValuePanelTextArea = new Ext.create("Ext.form.field.TextArea", {
      fieldLabel: "Value",
      labelAlign: "top",
      flex: 1,
    });

    me.txtCommentValuePanelTextArea = new Ext.create("Ext.form.field.TextArea", {
      fieldLabel: "Comment",
      labelAlign: "top",
      flex: 1,
    });

    me.valuePanel = new Ext.create("Ext.panel.Panel", {
      title: "Path",
      region: "east",
      floatable: false,
      margins: "0",
      width: 250,
      minWidth: 230,
      maxWidth: 350,
      bodyPadding: 5,
      layout: {
        type: "vbox",
        align: "stretch",
        pack: "start",
      },
      autoScroll: true,
      collapsed: true,

      csNode: null,
      csPath: "",
      csValue: "",
      csComment: "",

      items: [me.txtOptionValuePanelTextArea, me.txtCommentValuePanelTextArea],

      listeners: {
        render: function (oPanel, eOpts) {
          oPanel.hide();
        },
      },
    });

    me.valuePanel.addDocked([oValuePanelToolbar]);

    me.history = Ext.create("DIRAC.ConfigurationManager.classes.HistoryGridPanel", {
      scope: me,
    });

    me.history.on("cancelled", me.__onHistoryCancel, me);

    me.browserPanel = new Ext.create("Ext.panel.Panel", {
      layout: "border",
      defaults: {
        collapsible: true,
        split: true,
      },
      items: [me.treePanel, me.valuePanel],
    });

    me.add([me.browserPanel, me.history]);

    me.leafMenu = new Ext.menu.Menu({
      width: 150,
      items: [
        {
          text: "Copy",
          listeners: {
            click: me.__oprMenuCopyNode,
          },
        },
        {
          text: "Rename",
          listeners: {
            click: me.__oprMenuRenameNode,
          },
        },
        {
          text: "Delete",
          listeners: {
            click: me.__oprMenuDeleteNode,
          },
        },
      ],
      moduleObject: me,
    });

    me.btnPasteButton = new Ext.menu.Item({
      text: "Paste",
      disabled: false,
      listeners: {
        click: me.__oprMenuPasteNode,
      },
    });

    me.sectionMenu = new Ext.menu.Menu({
      width: 150,
      items: [
        {
          text: "Create a subsection",
          listeners: {
            click: me.__oprMenuCreateSubsection,
          },
        },
        {
          text: "Create an option",
          listeners: {
            click: me.__oprMenuCreateOption,
          },
        },
        "-",
        {
          text: "Copy",
          listeners: {
            click: me.__oprMenuCopyNode,
          },
        },
        me.btnPasteButton,
        {
          text: "Rename",
          listeners: {
            click: me.__oprMenuRenameNode,
          },
        },
        {
          text: "Delete",
          listeners: {
            click: me.__oprMenuDeleteNode,
          },
        },
      ],
      moduleObject: me,
    });

    me.expansionState = {};
    me.counterNodes = 0;
    me.flagReset = false;
    me.waitForMoveResponse = false;
    me.editMode = false;
    me.copyNode = null;
    me.changeMade = false;
    me.dontShowMessageBeforeClose = true;
  },

  afterRender: function () {
    var me = this;

    me.__setDiracDestroyHandler();

    me.callParent();
  },
  __onHistoryCancel: function () {
    var me = this;
    me.getLayout().setActiveItem(0);
  },
  __setDiracDestroyHandler: function () {
    var me = this;

    me.on(
      "destroy",
      function (oComp, eOpts) {
        var oThisContainer = this;

        oThisContainer.dontShowMessageBeforeClose = false;
        oThisContainer.socket.close();
      },
      me
    );
  },

  __clearValuePanel: function () {
    var me = this;
    me.txtCommentValuePanelTextArea.setValue("");
    me.txtOptionValuePanelTextArea.setValue("");
    me.valuePanel.csValue = "";
    me.valuePanel.csComment = "";
    me.valuePanel.csNode = null;
    me.valuePanel.csPath = "";
    me.valuePanel.setTitle("[No node selected]");
  },

  __oprUnsetPathAsExpanded: function (sPath) {
    var me = this;
    var oParts = sPath.split("/");

    // The first element is always empty
    var oTemp = me.expansionState;
    var oStartIndex = 0;

    if (sPath == "/") oStartIndex = 1;

    for (var i = oStartIndex; i < oParts.length; i++) {
      if (oParts[i] in oTemp) {
        if (i == oParts.length - 1) {
          delete oTemp[oParts[i]];
        } else {
          oTemp = oTemp[oParts[i]];
        }
      }
    }
  },

  __oprPathAsExpanded: function (sPath, bInsertIntoStructure) {
    var me = this;
    var oParts = sPath.split("/");

    // The first element is always empty
    var oTemp = me.expansionState;
    var oFound = true;

    var oStartIndex = 0;

    if (sPath == "/") oStartIndex = 1;

    for (var i = oStartIndex; i < oParts.length; i++) {
      if (oParts[i] in oTemp) {
        oTemp = oTemp[oParts[i]];
      } else {
        oFound = false;

        if (bInsertIntoStructure) {
          oTemp[oParts[i]] = {};
        }

        break;
      }
    }

    return oFound;
  },
  __getNodePath: function (oNode) {
    var sPath = "";
    var oCopyRefNode = oNode;
    while (oCopyRefNode) {
      if (oCopyRefNode.get("csName")) sPath = "/" + oCopyRefNode.get("csName") + sPath;
      else break;
      oCopyRefNode = oCopyRefNode.parentNode;
    }
    if (!sPath) return "/";
    return sPath;
  },

  __generateNewNodeId: function () {
    var me = this;
    var sId = me.id + "-ynode-" + me.counterNodes;
    me.counterNodes++;
    return sId;
  },
  __oprCreateSubnodes: function (oResponse) {
    var me = this;

    var oParentNode = me.treeStore.getNodeById(oResponse.parentNodeId);

    if (!me.__oprPathAsExpanded(me.__getNodePath(oParentNode), true)) {
      /*
       * HACK for representation the plus/minus sign for none expanded node
       */
      oParentNode.removeAll();
      /*
       * END - HACK
       */

      for (var i = 0; i < oResponse.nodes.length; i++) {
        var oNodeData = oResponse.nodes[i];

        oNodeData.id = me.__generateNewNodeId();

        if ("qtipCfg" in oNodeData) oNodeData.qtip = oNodeData.qtipCfg.text;

        var oNewNode = oParentNode.createNode(oNodeData);

        /*
         * HACK for representation the plus/minus sign for none expanded
         * node
         */
        if (!oNodeData.leaf) oNewNode.appendChild({});
        /*
         * END - HACK
         */

        oParentNode.appendChild(oNewNode);
      }
    }
  },

  __showConfigTextInWindow: function (sTextToShow) {
    var me = this;

    var oWindow = me.getContainer().createChildWindow("Configuration As Text", false, 700, 500);
    // TODO: use the commented lines when it works
    /*
     * var oTextArea = new Ext.create('Ext.form.field.TextArea', { value :
     * sTextToShow, cls : "cm-textbox-help-window", height : 700, width :
     * 500, readOnly : true
     *
     * });
     */

    var oTextArea = new Ext.create("Ext.panel.Panel", {
      html: "<textarea rows='600' cols='400'>" + sTextToShow + "</textarea>",
      cls: "cm-textbox-help-window",
      height: 700,
      width: 500,
      readOnly: true,
      autoScroll: true,
    });

    oWindow.add(oTextArea);

    me.btnViewConfigAsText.show();

    oWindow.show();
  },

  __showConfigDiffInWindow: function (oResponse, cbFunction) {
    var me = this;

    var iWinHeight = 500;

    var oWindow = me.getContainer().createChildWindow("Current Configuration Difference", false, 700, iWinHeight);

    /*------------------------TEST------------------------*/
    /*
     * var sTestHtml = ''; var oTestLines = [];
     *
     * sTestHtml += '<table class="cm-config-diff">'; sTestHtml += '<tr>';
     * sTestHtml += "<th>Server's version</th>"; sTestHtml += "<th>User's
     * current version</th>"; sTestHtml += '</tr>';
     *
     * oResponse.totalLines = 300;
     *
     * for ( var i = 0; i < oResponse.totalLines; i++) {
     *
     * var cClass = ""; var fRandom = Math.random();
     *
     * if (fRandom < 0.5) cClass = ""; else if (fRandom < 0.6) cClass =
     * "del"; else if (fRandom < 0.7) cClass = "conflict"; else if (fRandom <
     * 0.8) cClass = "add"; else if (fRandom <= 1.0) cClass = "mod";
     *
     * if (cClass != "") oTestLines.push([ cClass, i ]);
     *
     * var sRow = Math.random().toString(36).substring(7);
     *
     * sTestHtml += '<tr ' + ((cClass != "") ? " id='diff-line-" + i + "' class='" + cClass + "'" : "") + '>';
     * sTestHtml += "<th>" + sRow + "</th>"; sTestHtml += "<th>" +
     * sRow + "</th>"; sTestHtml += '</tr>'; }
     *
     * sTestHtml += '</table>';
     *
     * oResponse.html = sTestHtml; oResponse.lines = oTestLines;
     */

    /*------------------------ END TEST------------------------*/

    oResponse.html = oResponse.html.replace(new RegExp("&amp;nbsp;", "g"), "&nbsp;");

    oResponse.html = oResponse.html.replace(new RegExp("id='", "g"), "id='" + me.id + "-");

    var oCodePanel = new Ext.create("Ext.panel.Panel", {
      region: "center",
      html: oResponse.html,
      layout: "fit",
      autoScroll: true,
      bodyPadding: 5,
    });

    var oBlocksPanel = new Ext.create("Ext.panel.Panel", {
      region: "east",
      layout: "absolute",
      codePanel: oCodePanel,
      width: 50,
      totalLines: oResponse.totalLines,
      listeners: {
        resize: function (oComp, width, height, oldWidth, oldHeight, eOpts) {
          var delta_pos = (1.0 * (height - 10)) / parseFloat(oComp.totalLines);

          for (var i = 0; i < oComp.items.length; i++) {
            var oItem = oComp.getComponent(i);

            oItem.setPosition(0, Math.ceil(delta_pos * parseFloat(oItem.lineNumber)));
          }
        },
      },
    });

    var oPanel = new Ext.create("Ext.panel.Panel", {
      layout: "border",
      autoScroll: false,
      bodyPadding: 0,
      items: [oCodePanel, oBlocksPanel],
    });

    if (cbFunction) {
      oPanel.addDocked([
        {
          xtype: "toolbar",
          dock: "top",
          items: [
            {
              text: "Commit",
              handler: function () {
                cbFunction(oWindow);
              },
            },
          ],
        },
      ]);
    }
    oWindow.add(oPanel);
    oWindow.show();
    oWindow.maximize();
    oWindow.getHeader().show();
    oWindow.on("close", function () {
      if (me.changeMade) {
        me.__setChangeMade(true);
      }
    });

    var delta_pos = (1.0 * (oBlocksPanel.getHeight() - 10)) / parseFloat(oResponse.totalLines);

    var oElem = Ext.query("table.cm-config-diff tr")[0];
    var iHeight = oElem.offsetHeight;

    var oBlocksToAdd = [];

    for (var i = 0; i < oResponse.lines.length; i++) {
      var sColor = "#ffffff";

      switch (oResponse.lines[i][0]) {
        case "del":
          sColor = "#FAA";
          break;
        case "mod":
          sColor = "#FFA";
          break;
        case "add":
          sColor = "#AFA";
          break;
        case "conflict":
          sColor = "#EEEEEE";
          break;
      }

      oBlocksToAdd.push({
        xtype: "panel",
        header: false,
        border: false,
        bodyStyle: {
          background: sColor,
        },
        width: 50,
        lineNumber: oResponse.lines[i][1],
        height: 1 + (delta_pos < 1.0 ? 1 : Math.ceil(delta_pos)),
        x: 0,
        y: Math.ceil(delta_pos * parseFloat(oResponse.lines[i][1])),
        layout: "fit",
        html: '<a href="#' + me.id + "-diff-line-" + oResponse.lines[i][1] + '" style="display:block;width:100%">&nbsp;</a>',
      });
    }

    oBlocksPanel.add(oBlocksToAdd);

    /*if(cbFunction){
        cbFunction();
       }*/
  },

  __cbResetConfigurationTree: function () {
    var me = this;

    var oSerializedActions = [];

    if ("" in me.expansionState) me.__serializeExpansionAction("", me.expansionState[""], oSerializedActions);

    me.__sendSocketMessage({
      op: "getBulkExpandedNodeData",
      nodes: oSerializedActions.join("<<||>>"),
    });

    me.btnResetConfig.show();
  },

  __findNodeByPath: function (sPathToNode) {
    var me = this;

    var oRoot = me.treeStore.getRootNode();

    var oParts = sPathToNode.split("/");

    if (oParts.length == 2 && oParts[1] == "") {
      return oRoot;
    } else {
      var oStartNode = oRoot;

      for (var i = 1; i < oParts.length; i++) {
        var oChildNodes = oStartNode.childNodes;

        for (var j = 0; j < oChildNodes.length; j++) {
          if (oChildNodes[j].get("csName") == oParts[i]) {
            oStartNode = oChildNodes[j];
            break;
          }
        }
      }

      return oStartNode;
    }
  },

  __serializeExpansionAction: function (sPathToLevel, oLevel, oColector) {
    var me = this;
    oColector.push(sPathToLevel.length == 0 ? "/" : sPathToLevel);

    for (sChild in oLevel) {
      me.__serializeExpansionAction(sPathToLevel + "/" + sChild, oLevel[sChild], oColector);
    }
  },
  __cbGetBulkExpandedNodeData: function (oResponse) {
    var me = this;

    me.treeStore.getRootNode().removeAll();

    // clean the expansionState
    if ("" in me.expansionState) {
      delete me.expansionState[""];
    }

    var oRetData = oResponse.data;
    me.flagReset = true;

    for (var i = 0; i < oRetData.length; i++) {
      var oPath = oRetData[i][0];
      var oData = oRetData[i][1];

      var oParentNode = me.__findNodeByPath(oPath);

      if (!me.__oprPathAsExpanded(me.__getNodePath(oParentNode), true)) {
        /*
         * HACK for representation the plus/minus sign for none expanded
         * node
         */
        oParentNode.removeAll();
        /*
         * END - HACK
         */

        for (var j = 0; j < oData.length; j++) {
          var oNodeData = oData[j];

          oNodeData.id = me.__generateNewNodeId();

          if ("qtipCfg" in oNodeData) oNodeData.qtip = oNodeData.qtipCfg.text;

          var oNewNode = oParentNode.createNode(oNodeData);

          /*
           * HACK for representation the plus/minus sign for none expanded
           * node
           */
          if (!oNodeData.leaf) oNewNode.appendChild({});
          /*
           * END - HACK
           */

          oParentNode.appendChild(oNewNode);
        }

        oParentNode.expand();
      }
    }

    me.flagReset = false;
  },

  __stringToList: function (stringValue, sep) {
    if (!sep) {
      sep = ",";
    } else {
      stringValue = stringValue.replace(new RegExp(",", "g"), sep);
    }

    var vList = stringValue.split(sep);
    var strippedList = [];
    for (var i = 0; i < vList.length; i++) {
      var trimmed = Ext.util.Format.trim(vList[i]);
      if (trimmed.length > 0) {
        strippedList.push(trimmed);
      }
    }
    return strippedList;
  },

  __commentToList: function (stringValue) {
    var vList = stringValue.trim().split("\n");
    var cList = [];
    for (var i = 0; i < vList.length; i++) {
      var trimmed = Ext.util.Format.trim(vList[i]);
      if (trimmed.length == 0) continue;
      if (i == vList.length - 1 && trimmed.indexOf("@@-") == 0) break;
      cList.push(trimmed);
    }
    return cList;
  },

  __oprSetValuesForValuePanel: function (oModule, oNode) {
    oModule.valuePanel.csNode = oNode;
    oModule.valuePanel.csComment = oModule.__commentToList(oNode.get("csComment")).join("\n");
    oModule.valuePanel.csPath = oModule.__getNodePath(oNode);
    oModule.valuePanel.setTitle("Node <br/>" + oModule.valuePanel.csPath);

    if (oNode.isLeaf()) {
      oModule.valuePanel.csValue = oModule.__stringToList(oNode.get("csValue")).join("\n");
      oModule.txtOptionValuePanelTextArea.setValue(oModule.valuePanel.csValue);
      oModule.txtCommentValuePanelTextArea.setValue(oModule.valuePanel.csComment);
      oModule.txtOptionValuePanelTextArea.show();
    } else {
      oModule.txtCommentValuePanelTextArea.setValue(oModule.valuePanel.csComment);
      oModule.txtOptionValuePanelTextArea.hide();
    }
  },

  __oprActionValuePanel: function (oButton, eOpts) {
    var oValuePanel = oButton.scope.valuePanel;
    var oModule = oButton.scope;
    var oNode = oValuePanel.csNode;

    if (oNode == null) return;

    if (oNode.isLeaf()) {
      var sNewValue = oModule.__stringToList(oModule.txtOptionValuePanelTextArea.getValue(), "\n").join(",");

      oModule.__sendSocketMessage({
        op: "setOptionValue",
        path: oModule.__getNodePath(oNode),
        value: sNewValue,
        parentNodeId: oNode.getId(),
      });
    }

    oModule.__sendSocketMessage({
      op: "setComment",
      path: oModule.__getNodePath(oNode),
      value: oModule.txtCommentValuePanelTextArea.getValue(),
      parentNodeId: oNode.getId(),
    });
  },

  __oprMenuCopyNode: function (oItem, e, eOpts) {
    var oModule = oItem.parentMenu.moduleObject;
    var oNode = oItem.parentMenu.node;

    // when press COPY
    oModule.copyNode = oNode;
    oModule.btnPasteButton.setDisabled(false);
  },

  __oprMenuPasteNode: function (oItem, e, eOpts) {
    var oModule = oItem.parentMenu.moduleObject;
    var oNode = oItem.parentMenu.node;

    if (oModule.copyNode != null) {
      // when press PASTE, if only the name repeats itself
      // First we have to check if there is a node with that name

      var sNewName = oModule.copyNode.get("csName");

      var bNameExists = oModule.__nameExists(oNode, sNewName);

      while (bNameExists) {
        sNewName = sNewName + "(copy)";
        sNewName = window.prompt("The name already exists. What's the name for the copy?", sNewName);

        if (sNewName == null) return;

        bNameExists = oModule.__nameExists(oNode, sNewName);
      }

      oModule.__sendSocketMessage({
        op: "copyKey",
        newName: sNewName,
        copyFromPath: oModule.__getNodePath(oModule.copyNode),
        copyToPath: oModule.__getNodePath(oNode),
        nodeId: oModule.copyNode.getId(),
        parentNodeToId: oNode.getId(),
      });
    }
  },

  __nameExists: function (oNode, sName) {
    var oChildNodes = oNode.childNodes;

    var bNameExists = false;

    for (var i = 0; i < oChildNodes.length; i++) {
      if (oChildNodes[i].get("csName") == sName) {
        bNameExists = true;
        break;
      }
    }

    return bNameExists;
  },

  __cbMenuCopyNode: function (oResponse) {
    var me = this;

    var newName = oResponse.newName;
    var oNode = me.treeStore.getNodeById(oResponse.nodeId);
    var oDestinationNode = me.treeStore.getNodeById(oResponse.parentNodeToId);

    var newCfg = {
      text: oNode.data.text,
      csName: newName,
      csComment: oNode.get("csComment"),
    };

    if (oNode.isLeaf()) {
      newCfg.leaf = true;
      newCfg.csValue = oNode.get("csValue");
      newCfg.csName = newName;
      newCfg.text = newName + " = " + oNode.get("csValue");
      newCfg.id = me.__generateNewNodeId();
      var oNewNode = oNode.createNode(newCfg);
      oDestinationNode.appendChild(oNewNode);
    } else {
      newCfg.text = newName;
      newCfg.csName = newName;
      newCfg.leaf = false;
      newCfg.id = me.__generateNewNodeId();
      var oNewNode = oNode.createNode(newCfg);
      oNewNode.appendChild({});
      oDestinationNode.appendChild(oNewNode);
    }
  },

  __oprMenuRenameNode: function (oItem, e, eOpts) {
    var oNode = oItem.parentMenu.node;
    var oModule = oItem.parentMenu.moduleObject;
    var sNewName = window.prompt("What's the new name for " + oNode.get("csName") + " ?");
    if (sNewName == null) return;

    oModule.__sendSocketMessage({
      op: "renameKey",
      path: oModule.__getNodePath(oNode),
      newName: sNewName,
      parentNodeId: oNode.getId(),
    });
  },

  __cbMenuRenameNode: function (oResponse) {
    var me = this;
    var newName = oResponse.newName;
    var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);

    oNode.set("csName", newName);

    if (oNode.isLeaf()) {
      me.setNodeText(oNode, oNode.get("csName") + " = " + oNode.get("csValue"));
    } else {
      me.setNodeText(oNode, newName);
    }
  },

  __oprMenuDeleteNode: function (oItem, e, eOpts) {
    var oNode = oItem.parentMenu.node;
    var oModule = oItem.parentMenu.moduleObject;
    if (!window.confirm("Are you sure you want to delete " + oModule.__getNodePath(oNode) + "?")) return;
    oModule.__sendSocketMessage({
      op: "deleteKey",
      path: oModule.__getNodePath(oNode),
      parentNodeId: oNode.getId(),
    });
  },

  __cbMenuDeleteNode: function (oResponse) {
    var me = this;

    var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);
    var oParentNode = oNode.parentNode;
    oParentNode.removeChild(oNode);
  },

  __oprMenuCreateSubsection: function (oItem, e, eOpts) {
    var oFunc = function (oModule, oNode) {
      oModule.__sendSocketMessage({
        op: "createSection",
        path: oModule.__getNodePath(oNode),
        name: oModule.txtElementName.getValue(),
        config: oModule.txtElementConfig.getValue(),
        parentNodeId: oNode.getId(),
      });
    };

    var oNode = oItem.parentMenu.node;
    var oModule = oItem.parentMenu.moduleObject;

    oModule.formCreateElement("subsection", oFunc, oNode);
  },

  __cbMenuCreateSubsection: function (oResponse) {
    var me = this;

    var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);

    var csData = oResponse.node;

    var newCfg = {
      text: csData.csName,
      csName: csData.csName,
      csComment: csData.csComment,
      leaf: false,
    };

    if (oNode.isLoaded()) {
      newCfg.id = me.__generateNewNodeId();

      var oNewNode = oNode.createNode(newCfg);
      oNewNode.appendChild({});
      oNode.appendChild(oNewNode);
    }

    oNode.expand();
  },

  __oprMenuCreateOption: function (oItem, e, eOpts) {
    var oFunc = function (oModule, oNode) {
      var sValue = oModule.__stringToList(oModule.txtElementValue.getValue(), "\n").join(",");

      oModule.__sendSocketMessage({
        op: "createOption",
        path: oModule.__getNodePath(oNode),
        name: oModule.txtElementName.getValue(),
        value: sValue,
        parentNodeId: oNode.getId(),
      });
    };

    var oNode = oItem.parentMenu.node;
    var oModule = oItem.parentMenu.moduleObject;

    oModule.formCreateElement("option", oFunc, oNode);
  },

  __cbMenuCreateOption: function (oResponse) {
    var me = this;
    var oNode = me.treeStore.getNodeById(oResponse.parentNodeId);
    var newCfg = {
      text: oResponse.optionName + " = " + oResponse.value,
      csName: oResponse.optionName,
      csValue: oResponse.value,
      csComment: oResponse.comment,
      leaf: true,
    };

    if (oNode.isLoaded()) {
      newCfg.id = me.__generateNewNodeId();

      var oNewNode = oNode.createNode(newCfg);
      oNode.appendChild(oNewNode);
    }

    oNode.expand();
  },

  __oprMoveNode: function (oNode, oOldParent, oNewParent, iIndex) {
    var me = this;

    me.__sendSocketMessage({
      op: "moveNode",

      nodePath: me.__getNodePath(oNode),
      newParentPath: me.__getNodePath(oNewParent),
      beforeOfIndex: iIndex,

      oldIndex: oOldParent.indexOf(oNode),
      nodeId: oNode.getId(),
      parentOldId: oOldParent.getId(),
      parentNewId: oNewParent.getId(),
    });

    me.waitForMoveResponse = true;
  },

  __cbMoveNode: function (oResponse) {
    var me = this;
    var oNode = me.treeStore.getNodeById(oResponse.nodeId);
    var oNewParent = me.treeStore.getNodeById(oResponse.parentNewId);

    oNewParent.insertChild(parseInt(oResponse.beforeOfIndex, 10), oNode);
    me.waitForMoveResponse = false;
  },

  formCreateElement: function (sType, funcCreateElement, oNode) {
    var me = this;

    me.txtElementName = Ext.create("Ext.form.field.Text", {
      fieldLabel: "Name",
      labelAlign: "left",
      allowBlank: false,
      margin: 10,
      anchor: "100%",
    });

    me.txtElementValue = Ext.create("Ext.form.field.Text", {
      fieldLabel: "Value",
      labelAlign: "left",
      margin: 10,
      width: 400,
      allowBlank: false,
      hidden: sType == "subsection" ? true : false,
      anchor: "100%",
    });

    me.txtElementConfig = Ext.create("Ext.form.field.TextArea", {
      fieldLabel: "Config",
      labelAlign: "left",
      margin: 10,
      width: 400,
      hidden: sType == "subsection" ? false : true,
      anchor: "100%",
    });

    // button for saving the state
    me.btnCreateElement = new Ext.Button({
      text: "Submit",
      margin: 3,
      iconCls: "dirac-icon-submit",
      handler: function () {
        var bValid = me.txtElementName.validate();

        if (sType == "option") bValid = bValid && me.txtElementValue.validate();

        if (bValid) {
          funcCreateElement(me, oNode);
          me.createElementWindow.close();
        }
      },
      scope: me,
    });

    // button to close the save form
    me.btnCancelCreateElement = new Ext.Button({
      text: "Cancel",
      margin: 3,
      iconCls: "toolbar-other-close",
      handler: function () {
        me.createElementWindow.close();
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      border: false,
    });

    oToolbar.add([me.btnCreateElement, me.btnCancelCreateElement]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      autoHeight: true,
      border: false,
      layout: "anchor",
      items: [oToolbar, me.txtElementName, me.txtElementValue, me.txtElementConfig],
    });

    var sTitle = "Create an option";
    var iHeight = 200;

    if (sType == "subsection") {
      sTitle = "Create a subsection";
      iHeight = 280;
    }

    // initializing window showing the saving form
    me.createElementWindow = Ext.create("widget.window", {
      height: iHeight,
      width: 500,
      title: sTitle,
      layout: "fit",
      modal: true,
      items: oPanel,
    });

    me.createElementWindow.show();
    me.txtElementName.focus();
  },
});
