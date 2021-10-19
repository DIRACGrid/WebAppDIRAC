Ext.define("DIRAC.RegistryManager.classes.RegistryManager", {
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
    "Ext.Array",
  ],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Registry Manager";

    Ext.apply(me, {
      layout: "border",
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
      items: [],
      header: false,
    });

    me.callParent(arguments);
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
    sWsuri += "//" + sLoc.host + GLOBAL.BASE_URL + "RegistryManager";

    var socket = new WebSocket(sWsuri);

    socket.onopen = function (e) {
      console.log("CONNECTED");
      me.isConnectionEstablished = true;
      socket.send(
        JSON.stringify({
          op: sOnOpenFuncName,
        })
      );

      if (sOnOpenFuncName == "init") {
        me.grid.body.mask("Loading ...");
        me.__sendSocketMessage({
          op: "getData",
          type: "users",
        });

        me.__getGroupList();
      }
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

      if (me.dontShowMessageBeforeClose) {
        if (confirm(sMessage)) {
          // resetting the configuration
          me.socket = me.__createSocket("resetConfiguration");
        }
      }
    };

    socket.onmessage = function (e) {
      var oResponse = JSON.parse(e.data);
      // console.log("RESPONSE");
      // console.log(oResponse);

      if (parseInt(oResponse.success, 10) == 0) {
        GLOBAL.APP.CF.alert(oResponse.message, "error");

        switch (oResponse.op) {
          case "init":
            break;
          case "getData":
            me.grid.body.unmask();
            break;
          case "addItem":
            break;
          case "editItem":
            break;
          case "deleteItem":
            break;
          case "editRegistryProperties":
            break;
          case "commitChanges":
            me.getContainer().body.unmask();
            break;
        }
      } else {
        switch (oResponse.op) {
          case "init":
            break;
          case "resetConfiguration":
            me.rightPanel.removeAll();
            me.rightPanel.setTitle("");
            me.rightPanel.currentRecord = null;
            me.rightPanel.currentType = "";
            me.grid.body.mask("Loading ...");

            me.__sendSocketMessage({
              op: "getData",
              type: me.getSelectedType(),
            });
            break;
          case "getData":
            if (oResponse.type == "voms") {
              me.vomsGrid.store.removeAll();

              me.dataVomsStore = new Ext.data.JsonStore({
                fields: me.gridFields[oResponse.type],
                data: oResponse.data,
              });

              me.vomsGrid.reconfigure(me.dataVomsStore, undefined);
              me.vomsGrid.store.sort([
                {
                  property: "name",
                  direction: "ASC",
                },
              ]);

              me.otherDataMenu.setText("VOMS Servers");
            } else if (oResponse.type == "servers") {
              me.serversGrid.store.removeAll();

              me.dataServersStore = new Ext.data.JsonStore({
                fields: me.gridFields[oResponse.type],
                data: oResponse.data,
              });

              me.serversGrid.reconfigure(me.dataServersStore, undefined);
              me.serversGrid.store.sort([
                {
                  property: "name",
                  direction: "ASC",
                },
              ]);

              me.otherDataMenu.setText("VOMS Servers");
            } else {
              me.grid.store.removeAll();

              me.dataStore = new Ext.data.JsonStore({
                fields: me.gridFields[oResponse.type],
                data: oResponse.data,
              });

              me.grid.reconfigure(me.dataStore, me.gridColumns[oResponse.type]);
              me.grid.store.sort([
                {
                  property: "name",
                  direction: "ASC",
                },
              ]);

              switch (oResponse.type) {
                case "hosts":
                  me.otherDataMenu.setText("Hosts");
                  break;
                case "users":
                  me.otherDataMenu.setText("Users");
                  break;
                case "groups":
                  me.otherDataMenu.setText("Groups");
                  break;
              }

              if (!me.firstTimeReadUsers) {
                for (var i = 0; i < oResponse.data.length; i++) {
                  me.userList.push(oResponse.data[i]["name"]);
                }

                me.firstTimeReadUsers = true;
              }
            }

            me.grid.body.unmask();
            me.serversGrid.body.unmask();

            break;
          case "addItem":
            me.grid.body.mask("Loading ...");

            var oDataToSend = {
              op: "getData",
              type: me.rightPanel.currentType,
            };

            if (me.rightPanel.currentType == "servers") {
              oDataToSend.vom = me.serversGrid.vom;
            }

            me.__sendSocketMessage(oDataToSend);

            me.rightPanel.removeAll();
            me.rightPanel.setTitle("");
            me.rightPanel.currentRecord = null;
            me.rightPanel.currentType = "";

            me.rightPanel.dockedItems.getAt(1).show();

            break;
          case "editItem":
            me.grid.body.mask("Loading ...");

            var oDataToSend = {
              op: "getData",
              type: me.rightPanel.currentType,
            };

            if (me.rightPanel.currentType == "servers") {
              oDataToSend.vom = me.serversGrid.vom;
            }

            me.__sendSocketMessage(oDataToSend);
            me.rightPanel.dockedItems.getAt(1).show();

            break;
          case "deleteItem":
            me.grid.body.mask("Loading ...");
            var oDataToSend = {
              op: "getData",
              type: me.rightPanel.currentType,
            };

            if (me.rightPanel.currentType == "servers") {
              oDataToSend.vom = me.serversGrid.vom;
            }

            me.__sendSocketMessage(oDataToSend);

            me.rightPanel.removeAll();
            me.rightPanel.setTitle("");
            me.rightPanel.currentRecord = null;
            me.rightPanel.currentType = "";

            break;
          case "editRegistryProperties":
            break;
          case "commitChanges":
            GLOBAL.APP.CF.alert("The changes in the configuration have been successfuly commited !", "info");
            me.__sendSocketMessage({
              op: "resetConfiguration",
            });
            me.getContainer().body.unmask();
            break;
          case "getGroupList":
            me.groupList = oResponse.data;
            break;
          case "getRegistryProperties":
            me.getContainer().body.unmask();
            me.__createRegistryPropertiesForm(oResponse.data);
            break;
          case "getVomsMapping":
            me.getContainer().body.unmask();
            me.__createVomsMappingForm(oResponse.data);
            break;
        }
      }
    };

    return socket;
  },

  __setChangeMade: function (bChange) {
    var me = this;

    if (bChange && me.canDoChanges) {
      me.btnCommitChanges.show();
    } else {
      me.btnCommitChanges.hide();
    }

    me.changeMade = bChange;
  },

  buildUI: function () {
    var me = this;

    me.isConnectionEstablished = false;

    me.socket = me.__createSocket("init");

    me.rightPanel = new Ext.create("Ext.panel.Panel", {
      region: "east",
      margins: "0",
      width: 350,
      minWidth: 300,
      maxWidth: 450,
      layout: "anchor",
      autoDestroy: false,
      currentRecord: null,
    });

    me.otherDataMenu = new Ext.Button({
      text: "Users",
      menu: [
        {
          handler: function () {
            me.otherDataMenu.setText("Users");

            me.grid.body.mask("Loading ...");
            me.__sendSocketMessage({
              op: "getData",
              type: "users",
            });

            me.centralWorkPanel.getLayout().setActiveItem(0);
          },
          text: "Users",
        },
        {
          handler: function () {
            me.otherDataMenu.setText("Groups");

            me.grid.body.mask("Loading ...");
            me.__sendSocketMessage({
              op: "getData",
              type: "groups",
            });

            me.centralWorkPanel.getLayout().setActiveItem(0);
          },
          text: "Groups",
        },
        {
          handler: function () {
            me.otherDataMenu.setText("Hosts");

            me.grid.body.mask("Loading ...");
            me.__sendSocketMessage({
              op: "getData",
              type: "hosts",
            });

            me.centralWorkPanel.getLayout().setActiveItem(0);
          },
          text: "Hosts",
        },
        {
          handler: function () {
            me.otherDataMenu.setText("VOMS Servers");
            me.__sendSocketMessage({
              op: "getData",
              type: "voms",
            });
            me.centralWorkPanel.getLayout().setActiveItem(1);
          },
          text: "VOMS Servers",
        },
        "-",
        {
          handler: function () {
            me.getContainer().body.mask("Loading ...");
            me.__sendSocketMessage({
              op: "getRegistryProperties",
            });
          },
          text: "Registry Properties",
        },
        {
          handler: function () {
            me.getContainer().body.mask("Loading ...");
            me.__sendSocketMessage({
              op: "getVomsMapping",
            });
          },
          text: "VOMS Mapping",
        },
      ],
    });

    me.btnCommitChanges = new Ext.Button({
      text: "Commit",
      iconCls: "dirac-icon-submit",
      handler: function () {
        if (confirm("Do you want to apply the configuration changes you've done till now?")) {
          me.getContainer().body.mask("Loading ...");
          me.__sendSocketMessage({
            op: "commitChanges",
          });
        }
      },
      scope: me,
      hidden: true,
    });

    var oLeftPanelTopToolbar = new Ext.toolbar.Toolbar({
      dock: "top",
      items: [me.otherDataMenu, "->", me.btnCommitChanges],
    });

    me.gridFields = {
      users: [
        {
          name: "name",
        },
        {
          name: "dn",
        },
        {
          name: "ca",
        },
        {
          name: "email",
        },
      ],
      groups: [
        {
          name: "name",
        },
        {
          name: "users",
        },
        {
          name: "properties",
        },
        {
          name: "vomsrole",
        },
        {
          name: "autouploadproxy",
        },
        {
          name: "autouploadpilotproxy",
        },
        {
          name: "autoaddvoms",
        },
        {
          name: "jobshare",
        },
      ],
      hosts: [
        {
          name: "name",
        },
        {
          name: "dn",
        },
        {
          name: "properties",
        },
      ],
      voms: [
        {
          name: "name",
        },
      ],
      servers: [
        {
          name: "name",
        },
        {
          name: "dn",
        },
        {
          name: "port",
        },
        {
          name: "ca",
        },
      ],
    };

    me.gridColumns = {
      users: [
        {
          header: "Name",
          sortable: true,
          dataIndex: "name",
          align: "left",
          hideable: false,
          width: 200,
          sortState: "DESC",
        },
        {
          header: "DN",
          sortable: true,
          dataIndex: "dn",
          align: "left",
          hideable: false,
          flex: 1,
        },
        {
          header: "CA",
          sortable: true,
          dataIndex: "ca",
          align: "left",
          hideable: false,
          flex: 1,
        },
        {
          header: "E-Mail",
          sortable: true,
          dataIndex: "email",
          align: "left",
          hideable: false,
          flex: 1,
        },
      ],
      groups: [
        {
          header: "Name",
          sortable: true,
          dataIndex: "name",
          align: "left",
          hideable: false,
          width: 200,
          sortState: "DESC",
        },
        {
          header: "Users",
          sortable: true,
          dataIndex: "users",
          align: "left",
          hideable: false,
          flex: 1,
        },
        {
          header: "Properties",
          sortable: true,
          dataIndex: "properties",
          align: "left",
          hideable: false,
          flex: 1,
        },
        {
          header: "VOMS Role",
          sortable: true,
          dataIndex: "vomsrole",
          align: "left",
          hideable: false,
        },
        {
          header: "Auto Upload Proxy",
          sortable: true,
          dataIndex: "autouploadproxy",
          align: "left",
          hideable: false,
        },
        {
          header: "Auto Upload Pilot Proxy",
          sortable: true,
          dataIndex: "autouploadpilotproxy",
          align: "left",
          hideable: false,
        },
        {
          header: "Auto Add VOMS",
          sortable: true,
          dataIndex: "autoaddvoms",
          align: "left",
          hideable: false,
        },
        {
          header: "Job Share",
          sortable: true,
          dataIndex: "jobshare",
          align: "left",
          hideable: false,
        },
      ],
      hosts: [
        {
          header: "Name",
          sortable: true,
          dataIndex: "name",
          align: "left",
          hideable: false,
          width: 200,
          sortState: "DESC",
        },
        {
          header: "DN",
          sortable: true,
          dataIndex: "dn",
          align: "left",
          hideable: false,
          flex: 1,
        },
        {
          header: "Properties",
          sortable: true,
          dataIndex: "properties",
          align: "left",
          hideable: false,
          flex: 1,
        },
      ],
      servers: [
        {
          header: "Name",
          sortable: true,
          dataIndex: "name",
          align: "left",
          hideable: false,
          width: 200,
          sortState: "DESC",
        },
        {
          header: "DN",
          sortable: true,
          dataIndex: "dn",
          align: "left",
          hideable: false,
          flex: 1,
        },
        {
          header: "Port",
          sortable: true,
          dataIndex: "port",
          align: "left",
          hideable: false,
          flex: 1,
        },
        {
          header: "CA",
          sortable: true,
          dataIndex: "ca",
          align: "left",
          hideable: false,
          flex: 1,
        },
      ],
      voms: [
        {
          header: "Name",
          sortable: true,
          dataIndex: "name",
          align: "left",
          hideable: false,
          flex: 1,
          sortState: "DESC",
        },
      ],
    };

    me.dataStore = new Ext.data.JsonStore({
      fields: me.gridFields["users"],
      data: [],
    });

    me.grid = Ext.create("Ext.grid.Panel", {
      store: me.dataStore,
      height: "600",
      sateful: true,
      stateId: "RegistryManagerGrid",
      header: false,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      columns: me.gridColumns["users"],
      bufferedRenderer: false,
      listeners: {
        cellclick: function (oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
          switch (me.getSelectedType()) {
            case "users":
              me.__createUserForm(record);
              break;
            case "groups":
              me.__createGroupForm(record);
              break;
            case "hosts":
              me.__createHostForm(record);
              break;
          }
        },
      },
    });

    me.vomsServersPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      header: false,
      border: false,
      items: [],
      layout: "border",
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    me.dataVomsStore = new Ext.data.JsonStore({
      fields: me.gridFields["voms"],
      data: [],
    });

    me.vomsGrid = Ext.create("Ext.grid.Panel", {
      region: "north",
      store: me.dataVomsStore,
      height: 200,
      header: false,
      border: false,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      columns: me.gridColumns["voms"],
      listeners: {
        cellclick: function (oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
          me.serversGrid.vom = record.get("name");

          me.serversGrid.body.mask("Loading ...");
          me.__sendSocketMessage({
            op: "getData",
            type: "servers",
            vom: record.get("name"),
          });

          me.__createVomsForm(record);
        },
      },
    });

    me.dataServersStore = new Ext.data.JsonStore({
      fields: me.gridFields["servers"],
      data: [],
    });

    me.serversGrid = Ext.create("Ext.grid.Panel", {
      region: "center",
      store: me.dataServersStore,
      header: false,
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
      },
      columns: me.gridColumns["servers"],
      listeners: {
        cellclick: function (oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
          me.__createServerForm(record);
        },
      },
    });

    me.vomsServersPanel.add([me.vomsGrid, me.serversGrid]);

    me.centralWorkPanel = new Ext.create("Ext.panel.Panel", {
      floatable: false,
      layout: "card",
      region: "center",
      header: false,
      border: false,
      items: [me.grid, me.vomsServersPanel],
    });

    me.centralWorkPanel.addDocked(oLeftPanelTopToolbar);

    me.gridContextMenu = new Ext.menu.Menu({
      items: [
        {
          handler: function () {
            if (me.gridContextMenu.selectedType == "voms" || me.gridContextMenu.selectedType == "servers") {
              switch (me.gridContextMenu.selectedType) {
                case "voms":
                  me.__createVomsForm(null);
                  break;
                case "servers":
                  me.__createServerForm(null);
                  break;
              }
            } else {
              switch (me.getSelectedType()) {
                case "users":
                  me.__createUserForm(null);
                  break;
                case "groups":
                  me.__createGroupForm(null);
                  break;
                case "hosts":
                  me.__createHostForm(null);
                  break;
              }
            }
          },
          iconCls: "dirac-icon-plus",
          text: "New user",
        },
        {
          handler: function () {
            if (me.gridContextMenu.selectedType == "voms" || me.gridContextMenu.selectedType == "servers") {
              switch (me.gridContextMenu.selectedType) {
                case "voms":
                  var record = GLOBAL.APP.CF.getSelectedRecords(me.vomsGrid)[0];
                  me.__createVomsForm(record);
                  break;
                case "servers":
                  var record = GLOBAL.APP.CF.getSelectedRecords(me.serversGrid)[0];
                  me.__createServerForm(record);
                  break;
              }
            } else {
              var record = GLOBAL.APP.CF.getSelectedRecords(me.grid)[0];

              switch (me.getSelectedType()) {
                case "users":
                  me.__createUserForm(record);
                  break;
                case "groups":
                  me.__createGroupForm(record);
                  break;
                case "hosts":
                  me.__createHostForm(record);
                  break;
              }
            }
          },
          iconCls: "dirac-icon-edit",
          text: "Edit user",
        },
        {
          handler: function () {
            if (me.gridContextMenu.selectedType == "voms" || me.gridContextMenu.selectedType == "servers") {
              var sName = "";

              if (me.gridContextMenu.selectedType == "voms") {
                sName = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.vomsGrid, "name");
              } else if (me.gridContextMenu.selectedType == "servers") {
                sName = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.serversGrid, "name");
              }

              me.__deleteItem(sName, me.gridContextMenu.selectedType);
            } else {
              var sName = GLOBAL.APP.CF.getFieldValueFromSelectedRow(me.grid, "name");
              me.__deleteItem(sName, me.getSelectedType());
            }
          },
          iconCls: "dirac-icon-delete",
          text: "Delete user",
        },
      ],
    });

    me.canDoChanges = false;

    if ("properties" in GLOBAL.USER_CREDENTIALS && Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, "CSAdministrator") != -1) {
      me.canDoChanges = true;

      var oRightPanelButtons = new Ext.create("Ext.toolbar.Toolbar", {
        dock: "bottom",
        layout: {
          pack: "center",
        },
        items: [],
      });

      me.btnSubmit = new Ext.Button({
        text: "Submit",
        margin: 3,
        iconCls: "dirac-icon-submit",
        handler: function () {
          if (me.rightPanel.items.length > 0) {
            if (me.rightPanel.currentType == "registry") {
              var oDataToSend = me.__collectRegistryProperties();
              oDataToSend.op = "saveRegistryProperties";
              me.__sendSocketMessage(oDataToSend);
              me.__setChangeMade(true);
            } else if (me.rightPanel.currentType == "voms_mapping") {
              var oDataToSend = me.__collectRegistryProperties();
              oDataToSend.op = "saveVomsMapping";
              me.__sendSocketMessage(oDataToSend);
              me.__setChangeMade(true);
            } else {
              var oDataToSend = {};
              var bValid = true;

              switch (me.rightPanel.currentType) {
                case "users":
                  if (me.userForm.txtName.validate()) {
                    oDataToSend.name = me.userForm.txtName.getValue();
                    oDataToSend.dn = me.userForm.txtDn.getValue();
                    oDataToSend.ca = me.userForm.txtCa.getValue();
                    oDataToSend.email = me.userForm.txtEmail.getValue();
                  } else {
                    bValid = false;
                  }
                  break;
                case "groups":
                  if (me.groupForm.txtName.validate()) {
                    oDataToSend.name = me.groupForm.txtName.getValue();
                    oDataToSend.jobshare = me.groupForm.txtJobShare.getValue();
                    oDataToSend.properties = me.groupForm.msProperties.getValues();
                    oDataToSend.users = me.groupForm.msUsers.getValues();
                    oDataToSend.autouploadproxy = me.groupForm.cbAutoUploadProxy.getValue();
                    oDataToSend.autouploadpilotproxy = me.groupForm.cbAutoUploadPilotProxy.getValue();
                    oDataToSend.autoaddvoms = me.groupForm.cbAutoAddVoms.getValue();
                  } else {
                    bValid = false;
                  }
                  break;
                case "hosts":
                  if (me.groupForm.txtName.validate()) {
                    oDataToSend.name = me.hostForm.txtName.getValue();
                    oDataToSend.dn = me.hostForm.txtDn.getValue();
                    oDataToSend.properties = me.hostForm.msProperties.getValues();
                  } else {
                    bValid = false;
                  }
                  break;
                case "servers":
                  if (me.serverForm.txtName.validate()) {
                    oDataToSend.name = me.serverForm.txtName.getValue();
                    oDataToSend.dn = me.serverForm.txtDn.getValue();
                    oDataToSend.ca = me.serverForm.txtCa.getValue();
                    oDataToSend.port = me.serverForm.txtPort.getValue();
                    oDataToSend.vom = me.serversGrid.vom;
                  } else {
                    bValid = false;
                  }
                  break;
                case "voms":
                  if (me.vomsForm.txtName.validate()) {
                    oDataToSend.name = me.vomsForm.txtName.getValue();
                  } else {
                    bValid = false;
                  }
                  break;
              }
              if (bValid) {
                if (me.rightPanel.currentRecord == null) {
                  // in this case it means that we are creating new item
                  oDataToSend.op = "addItem";
                } else {
                  // in this case it means that we are updating an existing
                  // item
                  oDataToSend.op = "editItem";
                }

                oDataToSend.type = me.rightPanel.currentType;
                // console.log("DATA TO SEND");
                // console.log(oDataToSend);
                me.__sendSocketMessage(oDataToSend);
                me.__setChangeMade(true);

                me.rightPanel.dockedItems.getAt(1).hide();
              }
            }
          }
        },
        scope: me,
      });

      oRightPanelButtons.add(me.btnSubmit);

      me.btnReset = new Ext.Button({
        text: "Reset",
        margin: 3,
        iconCls: "dirac-icon-reset",
        handler: function () {
          var oRecord = me.rightPanel.currentRecord;

          if (me.rightPanel.currentType == "voms") {
            me.__createVomsForm(oRecord);
          } else if (me.rightPanel.currentType == "servers") {
            me.__createServerForm(oRecord);
          } else if (me.rightPanel.currentType == "registry") {
            me.getContainer().body.mask("Loading ...");
            me.__sendSocketMessage({
              op: "getRegistryProperties",
            });
          } else if (me.rightPanel.currentType == "voms_mapping") {
            me.getContainer().body.mask("Loading ...");
            me.__sendSocketMessage({
              op: "getVomsMapping",
            });
          } else {
            switch (me.getSelectedType()) {
              case "users":
                me.__createUserForm(oRecord);
                break;
              case "groups":
                me.__createGroupForm(oRecord);
                break;
              case "hosts":
                me.__createHostForm(oRecord);
                break;
            }
          }
        },
        scope: me,
      });

      oRightPanelButtons.add(me.btnReset);

      me.rightPanel.addDocked(oRightPanelButtons);
    }

    me.add([me.centralWorkPanel, me.rightPanel]);

    me.dontShowMessageBeforeClose = true;
    me.firstTimeReadUsers = false;
    me.userList = [];
    me.groupList = [];
    me.changeMade = false;
  },

  getSelectedType: function () {
    var me = this;
    var sResponse = "";

    switch (me.otherDataMenu.text) {
      case "Users":
        sResponse = "users";
        break;
      case "Groups":
        sResponse = "groups";
        break;
      case "Hosts":
        sResponse = "hosts";
        break;
      default:
        sResponse = "";
    }

    return sResponse;
  },

  afterRender: function () {
    var me = this;

    me.__setDiracDestroyHandler();

    this.callParent();

    me.serversGrid.body.on("contextmenu", function (e, t, eOpts) {
      e.preventDefault();

      me.gridContextMenu.items.getAt(0).setText("New server");
      me.gridContextMenu.items.getAt(1).setText("Edit server");
      me.gridContextMenu.items.getAt(2).setText("Delete server");
      me.gridContextMenu.selectedType = "servers";
      me.gridContextMenu.showAt(GLOBAL.MOUSE_X, GLOBAL.MOUSE_Y);

      e.stopPropagation();
      e.stopEvent();
    });

    me.vomsGrid.body.on("contextmenu", function (e, t, eOpts) {
      e.preventDefault();

      me.gridContextMenu.items.getAt(0).setText("New VOMS");
      me.gridContextMenu.items.getAt(1).setText("Edit VOMS");
      me.gridContextMenu.items.getAt(2).setText("Delete VOMS");
      me.gridContextMenu.selectedType = "voms";
      me.gridContextMenu.showAt(GLOBAL.MOUSE_X, GLOBAL.MOUSE_Y);

      e.stopPropagation();
      e.stopEvent();
    });

    me.grid.body.on("contextmenu", function (e, t, eOpts) {
      e.preventDefault();
      var sNewNoun = me.getSelectedType().substr(0, me.getSelectedType().length - 1);

      me.gridContextMenu.items.getAt(0).setText("New " + sNewNoun);
      me.gridContextMenu.items.getAt(1).setText("Edit " + sNewNoun);
      me.gridContextMenu.items.getAt(2).setText("Delete " + sNewNoun);
      me.gridContextMenu.selectedType = me.getSelectedType();

      me.gridContextMenu.showAt(GLOBAL.MOUSE_X, GLOBAL.MOUSE_Y);

      e.stopPropagation();
      e.stopEvent();
    });
  },

  __getGroupList: function () {
    var me = this;

    me.__sendSocketMessage({
      op: "getGroupList",
    });
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

  __createGroupForm: function (oRecord) {
    var me = this;

    if ("groupForm" in me) {
      me.groupForm.txtName.setValue("");
      me.groupForm.txtJobShare.setValue("");
      me.groupForm.msProperties.multiList.store.removeAll();
      me.groupForm.msUsers.multiList.store.removeAll();
    } else {
      me.groupForm = {};

      me.groupForm.txtName = Ext.create("Ext.form.field.Text", {
        fieldLabel: "Name:",
        labelAlign: "left",
        margin: 5,
        labelWidth: 80,
        anchor: "100%",
        validateValue: function (sValue) {
          sValue = Ext.util.Format.trim(sValue);

          if (sValue.length < 1) {
            this.markInvalid("You must specify a name !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
              return false;
            }
          }
        },
      });

      me.groupForm.cbAutoUploadProxy = Ext.create("Ext.form.field.ComboBox", {
        fieldLabel: "Auto Upload Proxy",
        queryMode: "local",
        labelAlign: "left",
        displayField: "value",
        valueField: "value",
        width: 200,
        store: new Ext.data.SimpleStore({
          fields: ["value"],
          data: [["None"], ["True"], ["False"]],
        }),
        margin: 5,
        labelWidth: 80,
        editable: false,
      });

      me.groupForm.cbAutoUploadPilotProxy = Ext.create("Ext.form.field.ComboBox", {
        fieldLabel: "Auto Upload Pilot Proxy",
        queryMode: "local",
        labelAlign: "left",
        displayField: "value",
        valueField: "value",
        width: 200,
        store: new Ext.data.SimpleStore({
          fields: ["value"],
          data: [["None"], ["True"], ["False"]],
        }),
        margin: 5,
        labelWidth: 80,
        editable: false,
      });

      me.groupForm.cbAutoAddVoms = Ext.create("Ext.form.field.ComboBox", {
        fieldLabel: "Auto Add VOMS",
        queryMode: "local",
        labelAlign: "left",
        displayField: "value",
        valueField: "value",
        width: 200,
        store: new Ext.data.SimpleStore({
          fields: ["value"],
          data: [["None"], ["True"], ["False"]],
        }),
        margin: 5,
        labelWidth: 80,
        editable: false,
      });

      me.groupForm.txtJobShare = Ext.create("Ext.form.field.Number", {
        fieldLabel: "Job Share:",
        labelAlign: "left",
        margin: 5,
        labelWidth: 80,
        width: 200,
      });

      me.groupForm.msProperties = me.__createMultiListWithButtons("Properties", [], null);
      me.groupForm.msUsers = me.__createMultiListWithButtons("Users", [], function (sNewUser) {
        if (Ext.Array.indexOf(me.userList, sNewUser) != -1) {
          return true;
        } else {
          GLOBAL.APP.CF.alert("The user does not exists !", "warning");
          return false;
        }
      });
    }

    if (oRecord != null && oRecord != undefined) {
      me.groupForm.txtName.setValue(oRecord.get("name"));
      me.groupForm.cbAutoUploadProxy.setValue(oRecord.get("autouploadproxy"));
      me.groupForm.cbAutoUploadPilotProxy.setValue(oRecord.get("autouploadpilotproxy"));
      me.groupForm.cbAutoAddVoms.setValue(oRecord.get("autoaddvoms"));
      me.groupForm.txtJobShare.setValue(oRecord.get("jobshare"));

      var oData = oRecord.get("properties").split(",");

      for (var i = 0; i < oData.length; i++)
        me.groupForm.msProperties.multiList.store.add({
          value: Ext.util.Format.trim(oData[i]),
        });

      oData = oRecord.get("users").split(",");

      for (var i = 0; i < oData.length; i++)
        me.groupForm.msUsers.multiList.store.add({
          value: Ext.util.Format.trim(oData[i]),
        });

      me.rightPanel.setTitle("Group: " + oRecord.get("name"));
      me.rightPanel.currentRecord = oRecord;
      me.groupForm.txtName.setReadOnly(true);
    } else {
      me.rightPanel.setTitle("New Group");
      me.rightPanel.currentRecord = null;
      me.groupForm.txtName.setReadOnly(false);
    }

    me.rightPanel.currentType = "groups";

    me.rightPanel.removeAll();
    me.rightPanel.add([
      me.groupForm.txtName,
      me.groupForm.msUsers,
      me.groupForm.msProperties,
      me.groupForm.cbAutoUploadProxy,
      me.groupForm.cbAutoUploadPilotProxy,
      me.groupForm.cbAutoAddVoms,
      me.groupForm.txtJobShare,
    ]);
  },

  __createUserForm: function (oRecord) {
    var me = this;

    if ("userForm" in me) {
      me.userForm.txtName.setValue("");
      me.userForm.txtDn.setValue("");
      me.userForm.txtCa.setValue("");
      me.userForm.txtEmail.setValue("");
    } else {
      me.userForm = {};

      me.userForm.txtName = Ext.create("Ext.form.field.Text", {
        fieldLabel: "Name:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
        validateValue: function (sValue) {
          sValue = Ext.util.Format.trim(sValue);

          if (sValue.length < 1) {
            this.markInvalid("You must specify a name !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
              return false;
            }
          }
        },
      });

      me.userForm.txtDn = Ext.create("Ext.form.field.Text", {
        fieldLabel: "DN:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
      });

      me.userForm.txtCa = Ext.create("Ext.form.field.Text", {
        fieldLabel: "CA:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
      });

      me.userForm.txtEmail = Ext.create("Ext.form.field.Text", {
        fieldLabel: "E-Mail:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
      });
    }

    if (oRecord != null && oRecord != undefined) {
      me.userForm.txtName.setValue(oRecord.get("name"));
      me.userForm.txtDn.setValue(oRecord.get("dn"));
      me.userForm.txtCa.setValue(oRecord.get("ca"));
      me.userForm.txtEmail.setValue(oRecord.get("email"));

      me.rightPanel.setTitle("User: " + oRecord.get("name"));
      me.rightPanel.currentRecord = oRecord;
      me.userForm.txtName.setReadOnly(true);
    } else {
      me.rightPanel.setTitle("New User");
      me.rightPanel.currentRecord = null;
      me.userForm.txtName.setReadOnly(false);
    }

    me.rightPanel.currentType = "users";

    me.rightPanel.removeAll();
    me.rightPanel.add([me.userForm.txtName, me.userForm.txtDn, me.userForm.txtCa, me.userForm.txtEmail]);
  },

  __createHostForm: function (oRecord) {
    var me = this;

    if ("hostForm" in me) {
      me.hostForm.txtName.setValue("");
      me.hostForm.txtDn.setValue("");
      me.hostForm.msProperties.multiList.store.removeAll();
    } else {
      me.hostForm = {};

      me.hostForm.txtName = Ext.create("Ext.form.field.Text", {
        fieldLabel: "Name:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 80,
        validateValue: function (sValue) {
          sValue = Ext.util.Format.trim(sValue);

          if (sValue.length < 1) {
            this.markInvalid("You must specify a name !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
              return false;
            }
          }
        },
      });

      me.hostForm.txtDn = Ext.create("Ext.form.field.Text", {
        fieldLabel: "DN:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 80,
      });

      me.hostForm.msProperties = me.__createMultiListWithButtons("Properties", [], null);
    }

    if (oRecord != null && oRecord != undefined) {
      me.hostForm.txtName.setValue(oRecord.get("name"));
      me.hostForm.txtDn.setValue(oRecord.get("dn"));

      var oData = oRecord.get("properties").split(",");

      for (var i = 0; i < oData.length; i++)
        me.hostForm.msProperties.multiList.store.add({
          value: Ext.util.Format.trim(oData[i]),
        });

      me.rightPanel.setTitle("Host: " + oRecord.get("name"));
      me.rightPanel.currentRecord = oRecord;
      me.hostForm.txtName.setReadOnly(true);
    } else {
      me.rightPanel.setTitle("New Host");
      me.rightPanel.currentRecord = null;
      me.hostForm.txtName.setReadOnly(false);
    }

    me.rightPanel.currentType = "hosts";

    me.rightPanel.removeAll();
    me.rightPanel.add([me.hostForm.txtName, me.hostForm.txtDn, me.hostForm.msProperties]);
  },

  __createServerForm: function (oRecord) {
    var me = this;

    if ("serverForm" in me) {
      me.serverForm.txtName.setValue("");
      me.serverForm.txtDn.setValue("");
      me.serverForm.txtCa.setValue("");
      me.serverForm.txtPort.setValue("");
    } else {
      me.serverForm = {};

      me.serverForm.txtName = Ext.create("Ext.form.field.Text", {
        fieldLabel: "Name:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
        validateValue: function (sValue) {
          sValue = Ext.util.Format.trim(sValue);

          if (sValue.length < 1) {
            this.markInvalid("You must specify a name !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
              return false;
            }
          }
        },
      });

      me.serverForm.txtDn = Ext.create("Ext.form.field.Text", {
        fieldLabel: "DN:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
      });

      me.serverForm.txtCa = Ext.create("Ext.form.field.Text", {
        fieldLabel: "CA:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
      });

      me.serverForm.txtPort = Ext.create("Ext.form.field.Text", {
        fieldLabel: "Port:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
      });
    }

    if (oRecord != null && oRecord != undefined) {
      me.serverForm.txtName.setValue(oRecord.get("name"));
      me.serverForm.txtDn.setValue(oRecord.get("dn"));
      me.serverForm.txtCa.setValue(oRecord.get("ca"));
      me.serverForm.txtPort.setValue(oRecord.get("port"));

      me.rightPanel.setTitle("Server: " + oRecord.get("name"));
      me.rightPanel.currentRecord = oRecord;
      me.serverForm.txtName.setReadOnly(true);
    } else {
      me.rightPanel.setTitle("New Server");
      me.rightPanel.currentRecord = null;
      me.serverForm.txtName.setReadOnly(false);
    }

    me.rightPanel.currentType = "servers";

    me.rightPanel.removeAll();
    me.rightPanel.add([me.serverForm.txtName, me.serverForm.txtDn, me.serverForm.txtPort, me.serverForm.txtCa]);
  },

  __createVomsForm: function (oRecord) {
    var me = this;

    if ("vomsForm" in me) {
      me.vomsForm.txtName.setValue("");
    } else {
      me.vomsForm = {};

      me.vomsForm.txtName = Ext.create("Ext.form.field.Text", {
        fieldLabel: "Name:",
        labelAlign: "left",
        margin: 5,
        anchor: "100%",
        labelWidth: 50,
        validateValue: function (sValue) {
          sValue = Ext.util.Format.trim(sValue);

          if (sValue.length < 1) {
            this.markInvalid("You must specify a name !");
            return false;
          } else {
            if (GLOBAL.APP.SM.isValidStateName(sValue)) {
              this.clearInvalid();
              return true;
            } else {
              this.markInvalid("Allowed characters are: 0-9, a-z, A-Z, '_', '-', '.'");
              return false;
            }
          }
        },
      });
    }

    if (oRecord != null && oRecord != undefined) {
      me.vomsForm.txtName.setValue(oRecord.get("name"));

      me.rightPanel.setTitle("VOMs: " + oRecord.get("name"));
      me.rightPanel.currentRecord = oRecord;
      me.vomsForm.txtName.setReadOnly(true);
    } else {
      me.rightPanel.setTitle("New Voms");
      me.rightPanel.currentRecord = null;
      me.vomsForm.txtName.setReadOnly(false);
    }

    me.rightPanel.currentType = "voms";

    me.rightPanel.removeAll();
    me.rightPanel.add([me.vomsForm.txtName]);
  },

  __createMultiListWithButtons: function (sTitle, oData, funcOnAddValidationFunction) {
    var me = this;

    var oMultiSelect = new Ext.ux.form.MultiSelect({
      fieldLabel: sTitle,
      queryMode: "local",
      labelAlign: "left",
      displayField: "value",
      valueField: "value",
      anchor: "100%",
      store: new Ext.data.SimpleStore({
        fields: ["value"],
        data: oData,
      }),
      height: 150,
      margin: "0 5 5 5",
      labelWidth: 80,
    });

    var oAddButton = new Ext.Button({
      iconCls: "dirac-icon-plus",
      handler: function () {
        Ext.MessageBox.prompt("New Item", "Enter the name of the new item :", function (btn, text) {
          if (btn == "ok") {
            text = Ext.util.Format.trim(text);
            if (text != "") {
              // first we check whether the item exists or not
              var oStore = oMultiSelect.store;
              var bFound = false;

              for (var i = 0; i < oStore.getCount(); i++) {
                if (oStore.getAt(i).get("value") == text) {
                  bFound = true;
                  break;
                }
              }

              if (!bFound) {
                if (funcOnAddValidationFunction != null) {
                  if (funcOnAddValidationFunction(text)) {
                    oStore.add({
                      value: text,
                    });
                  }
                } else {
                  oStore.add({
                    value: text,
                  });
                }
              } else {
                GLOBAL.APP.CF.alert("The item already exists in the list !", "warning");
              }
            }
          }
        });
      },
      scope: me,
    });

    var oDeleteButton = new Ext.Button({
      iconCls: "dirac-icon-delete",
      handler: function () {
        var oStore = oMultiSelect.store;
        var oSelectedValues = oMultiSelect.getValue();

        for (var i = 0; i < oSelectedValues.length; i++) {
          var sItem = oSelectedValues[i];

          for (var j = 0; j < oStore.getCount(); j++) {
            if (oStore.getAt(j).get("value") == sItem) {
              oStore.removeAt(j);
              break;
            }
          }
        }
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      dock: "top",
      items: ["->", oAddButton, oDeleteButton],
      cls: "rm-clean-background",
      border: 0,
    });

    var oMultiSelectBox = new Ext.create("Ext.panel.Panel", {
      anchor: "100%",
      margins: "0",
      multiList: oMultiSelect,
      items: [oToolbar, oMultiSelect],
      border: 0,
      getValues: function () {
        var oStore = oMultiSelect.store;
        var sRet = "";

        for (var i = 0; i < oStore.getCount(); i++) {
          sRet += (sRet == "" ? "" : ",") + oStore.getAt(i).get("value");
        }

        return sRet;
      },
    });

    return oMultiSelectBox;
  },
  __sendSocketMessage: function (oData) {
    var me = this;
    // console.log("SEND");
    // console.log(oData);
    if (!me.isConnectionEstablished) {
      var sMessage = "There is no connection established with the server.\nDo you want to reconnect now?";

      if (confirm(sMessage)) {
        // resetting the configuration
        me.socket = me.__createSocket("resetConfiguration");
      }
    } else {
      me.socket.send(JSON.stringify(oData));
    }
  },

  __deleteItem: function (sName, sType) {
    var me = this;

    var oDataToSend = {
      op: "deleteItem",
      type: sType,
      name: sName,
    };

    if (me.gridContextMenu.selectedType == "servers") {
      oDataToSend.vom = me.serversGrid.vom;
    }

    me.rightPanel.currentType = me.gridContextMenu.selectedType;

    me.__sendSocketMessage(oDataToSend);
  },

  __createRegistryPropertiesForm: function (oData) {
    var me = this;

    me.rightPanel.currentType = "registry";

    me.rightPanel.removeAll();
    me.rightPanel.setTitle("Registry Properties");

    var oRegistryToolbar = new Ext.toolbar.Toolbar({
      border: 0,
      items: [
        "->",
        {
          xtype: "button",
          iconCls: "dirac-icon-plus",
          margin: 3,
          tooltip: "Create option",
          handler: function () {
            me.__showFormForRegistryOption();
          },
        },
      ],
    });

    me.rightPanel.add(oRegistryToolbar);

    for (var sElem in oData) {
      me.rightPanel.add(me.__createRegistryProperty(sElem, oData[sElem]));
    }
  },
  __createRegistryProperty: function (sName, sValue) {
    var me = this;

    var oField = Ext.create("Ext.form.field.Text", {
      fieldLabel: sName,
      labelAlign: "left",
      margin: 5,
      anchor: "100%",
      labelWidth: 140,
      value: sValue,
    });

    var oPanel = Ext.create("Ext.container.Container", {
      layout: {
        type: "hbox",
        margin: 3,
      },
      blockType: "string",
      items: [
        oField,
        {
          xtype: "button",
          iconCls: "dirac-icon-delete",
          margin: 3,
          handler: function () {
            me.rightPanel.remove(this.up("container"));
          },
          tooltip: "Remove this item",
        },
      ],
    });

    return oPanel;
  },
  __showFormForRegistryOption: function () {
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
      anchor: "100%",
    });

    // button for saving the state
    me.btnCreateElement = new Ext.Button({
      text: "Submit",
      margin: 3,
      iconCls: "dirac-icon-submit",
      handler: function () {
        var bValid = me.txtElementName.validate();

        if (bValid) {
          me.rightPanel.add(me.__createRegistryProperty(me.txtElementName.getValue(), me.txtElementValue.getValue()));
          me.createElementWindow.close();
        }
      },
      scope: me,
    });

    var oToolbar = new Ext.toolbar.Toolbar({
      border: false,
    });

    oToolbar.add([me.btnCreateElement]);

    var oPanel = new Ext.create("Ext.panel.Panel", {
      autoHeight: true,
      border: false,
      layout: "anchor",
      items: [oToolbar, me.txtElementName, me.txtElementValue],
    });

    var sTitle = "Create an option";
    var iHeight = 200;

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

  __collectRegistryProperties: function () {
    var me = this;
    var oData = {};

    if (me.rightPanel.items.length > 1) {
      for (var i = 1; i < me.rightPanel.items.length; i++) {
        var oItem = me.rightPanel.items.getAt(i).items.getAt(0);

        oData[oItem.fieldLabel] = oItem.getValue();
      }
    }

    return oData;
  },
  __createVomsMappingForm: function (oData) {
    var me = this;

    me.rightPanel.currentType = "voms_mapping";

    me.rightPanel.removeAll();
    me.rightPanel.setTitle("VOMS Mapping");

    var oRegistryToolbar = new Ext.toolbar.Toolbar({
      border: 0,
      items: [
        "->",
        {
          xtype: "button",
          iconCls: "dirac-icon-plus",
          margin: 3,
          tooltip: "Create option",
          handler: function () {
            me.__showFormForRegistryOption();
          },
        },
      ],
    });

    me.rightPanel.add(oRegistryToolbar);

    for (var i = 0; i < oData.length; i++) {
      me.rightPanel.add(me.__createRegistryProperty(oData[i]["name"], oData[i]["value"]));
    }
  },
});
