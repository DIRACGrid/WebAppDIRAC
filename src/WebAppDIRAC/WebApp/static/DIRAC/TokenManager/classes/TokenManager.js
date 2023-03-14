/*******************************************************************************
 * It is the transformation monitor class.
 */
Ext.define("DIRAC.TokenManager.classes.TokenManager", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.panel.Panel",
    "Ext.dirac.utils.DiracBoxSelect",
    "Ext.form.field.TextArea",
    "Ext.dirac.utils.DiracGridPanel",
    "Ext.dirac.utils.DiracIdListButton",
    "Ext.dirac.utils.DiracPageSizeCombo",
    "Ext.dirac.utils.DiracPagingToolbar",
    "Ext.dirac.utils.DiracJsonStore",
    "Ext.dirac.utils.DiracAjaxProxy",
    "Ext.dirac.utils.DiracApplicationContextMenu",
    "Ext.dirac.utils.DiracBaseSelector",
  ],

  loadState: function (data) {
    var me = this;

    me.grid.loadState(data);

    me.leftPanel.loadState(data);

    if (data.leftPanelCollapsed) {
      me.leftPanel.collapse();
    }
  },

  getStateData: function () {
    var me = this;
    var oStates = {};

    oStates = {
      grid: me.grid.getStateData(),
      leftMenu: me.leftPanel.getStateData(),
    };

    oStates.leftPanelCollapsed = me.leftPanel.collapsed;

    return oStates;
  },
  dataFields: [
    {
      name: "tokenid",
    },
    {
      name: "UserName",
    },
    {
      name: "UserID",
    },
    {
      name: "Provider",
    },
    {
      name: "ExpirationTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
    {
      name: "RefreshTokenExpirationTime",
      type: "date",
      dateFormat: "Y-m-d H:i:s",
    },
  ],

  initComponent: function () {
    var me = this;

    GLOBAL.APP.CF.log("debug", "create the widget(initComponent)...");

    me.launcher.title = "Token Manager";
    me.launcher.maximized = false;

    if (GLOBAL.VIEW_ID == "desktop") {
      var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

      me.launcher.width = oDimensions[0];
      me.launcher.height = oDimensions[1];

      me.launcher.x = 0;
      me.launcher.y = 0;
    }

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

    GLOBAL.APP.CF.log("debug", "create the widget...(buildUI)");

    var selectors = {
      username: "User",
    };

    var map = [["username", "username"]];

    me.leftPanel = new Ext.create("Ext.dirac.utils.DiracBaseSelector", {
      scope: me,
      cmbSelectors: selectors,
      datamap: map,
      hasTimeSearchPanel: false,
      url: "TokenManager/getSelectionData",
    });

    /*
     * -----------------------------------------------------------------------------------------------------------
     * DEFINITION OF THE GRID
     * -----------------------------------------------------------------------------------------------------------
     */
    var oProxy = Ext.create("Ext.dirac.utils.DiracAjaxProxy", {
      url: GLOBAL.BASE_URL + me.applicationName + "/getTokenManagerData",
    });

    me.diffValues = {};
    me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
      proxy: oProxy,
      fields: me.dataFields,
      groupField: "UserName",
      scope: me,
      remoteSort: false,
    });

    var pagingToolbar = null;

    var toolButtons = {
      Visible: [
        {
          text: "Delete",
          handler: me.__deleteTokens,
          properties: {
            tooltip: "Click to delete the selected tokens!",
            iconCls: "dirac-icon-delete",
          },
        },
      ],
    };

    pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
      toolButtons: toolButtons,
      store: me.dataStore,
      scope: me,
    });

    var oColumns = {
      checkBox: {
        dataIndex: "TokenId",
      },
      User: {
        dataIndex: "UserName",
        properties: {
          width: 100,
          sortable: true,
        },
      },
      ID: {
        dataIndex: "UserID",
        properties: {
          width: 650,
          sortable: true,
        },
      },
      Provider: {
        dataIndex: "Provider",
        properties: {
          width: 100,
          sortable: true,
        },
      },
      "Access Token Expiration (UTC)": {
        dataIndex: "ExpirationTime",
        properties: {
          width: 150,
          sortable: true,
        },
        renderer: function (value, metadata, record, rowIndex, colIndex, store) {
          var expEpoch = record.data.ExpirationTime.getTime();
          /* eslint-disable */
          var nowEpoch = Ext.Date.now();
          /* eslint-enable */
          var secsLeft = expEpoch - nowEpoch;

          var msDay = 60 * 60 * 24 * 1000;
          var secsLeft = Math.floor((expEpoch - nowEpoch) / msDay);

          var timeLimit = 30; // 30 days before expiration

          if (secsLeft < timeLimit) {
            return '<span style="color:red">' + Ext.Date.format(record.data.ExpirationTime, "Y-m-d H:i:s") + " (" + secsLeft + ")" + "</span>";
          } else {
            return '<span style="color:green">' + Ext.Date.format(record.data.ExpirationTime, "Y-m-d H:i:s") + "</span>";
          }
        },
      },
      "Refresh Token Expiration (UTC)": {
        dataIndex: "RefreshTokenExpirationTime",
        properties: {
          width: 150,
          sortable: true,
        },
        renderer: function (value, metadata, record, rowIndex, colIndex, store) {
          var expEpoch = record.data.RefreshTokenExpirationTime.getTime();
          /* eslint-disable */
          var nowEpoch = Ext.Date.now();
          /* eslint-enable */
          var secsLeft = expEpoch - nowEpoch;

          var msDay = 60 * 60 * 24 * 1000;
          var secsLeft = Math.floor((expEpoch - nowEpoch) / msDay);

          var timeLimit = 30; // 30 days before expiration

          if (secsLeft < timeLimit) {
            return (
              '<span style="color:red">' + Ext.Date.format(record.data.RefreshTokenExpirationTime, "Y-m-d H:i:s") + " (" + secsLeft + ")" + "</span>"
            );
          } else {
            return '<span style="color:green">' + Ext.Date.format(record.data.RefreshTokenExpirationTime, "Y-m-d H:i:s") + "</span>";
          }
        },
      },
    };

    var menuitems = {
      Visible: [
        {
          text: "Access Token",
          handler: me.__oprGetTokenData,
          arguments: ["getAccessToken"],
          properties: {
            tooltip: "Click to show the decoded Access Token of the selected token.",
          },
        },
        {
          text: "Refresh Token",
          handler: me.__oprGetTokenData,
          arguments: ["getRefreshToken"],
          properties: {
            tooltip: "Click to show the decoded Refresh Token of the selected token.",
          },
        },
      ],
    };

    me.contextGridMenu = new Ext.dirac.utils.DiracApplicationContextMenu({
      menu: menuitems,
      scope: me,
    });

    me.grid = Ext.create("Ext.dirac.utils.DiracGridPanel", {
      store: me.dataStore,
      features: [
        {
          ftype: "grouping",
        },
      ],
      oColumns: oColumns,
      contextMenu: me.contextGridMenu,
      pagingToolbar: pagingToolbar,
      scope: me,
    });

    me.leftPanel.setGrid(me.grid);

    me.add([me.leftPanel, me.grid]);
  },
  __oprGetTokenData: function (oDataKind) {
    var me = this;

    var oId = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "UserID");

    me.getContainer().body.mask("Wait ...");
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.applicationName + "/tokenData?userid=" + oId,
      method: "POST",
      params: {
        data_kind: oDataKind,
        id: oId,
      },
      scope: me,
      success: function (response) {
        me.getContainer().body.unmask();
        var jsonData = Ext.JSON.decode(response.responseText);

        if (jsonData["success"] == "true") {
          if (oDataKind == "getAccessToken") {
            // text
            me.getContainer().oprPrepareAndShowWindowText(jsonData["result"], "Access Token:" + oId);
          } else if (oDataKind == "getRefreshToken") {
            // text
            me.getContainer().oprPrepareAndShowWindowText(jsonData["result"], "Refresh Token:" + oId);
          }
        } else {
          GLOBAL.APP.CF.alert(jsonData["error"], "error");
        }
      },
    });
  },
  __deleteTokens: function () {
    var me = this;
    var items = [];
    var elememts = Ext.query("#" + me.id + " input.checkrow");

    for (var i = 0; i < elememts.length; i++) if (elememts[i].checked) items.push(elememts[i].value);

    if (items && items.length > 0) {
      msg = "tokens";

      if (window.confirm("Are you sure you want to delete selected tokens?"))
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + me.applicationName + "/deleteTokens",
          params: {
            idList: Ext.JSON.encode(items),
          },
          success: function (oResponse) {
            if (oResponse.status == 200) {
              response = Ext.JSON.decode(oResponse.responseText);
              if (response.success == "false") {
                Ext.dirac.system_info.msg("Error", response.error);
              } else {
                Ext.dirac.system_info.msg("Notification", "Deleted " + response.result + " tokens");
              }
            } else {
              GLOBAL.APP.CF.showAjaxErrorMessage(response);
            }
          },
          failure: function (response) {
            GLOBAL.APP.CF.showAjaxErrorMessage(response);
          },
        });
    }
  },
});
