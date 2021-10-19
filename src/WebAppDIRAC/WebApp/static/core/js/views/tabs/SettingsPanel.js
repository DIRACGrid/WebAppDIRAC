/**
 * To be defined!!
 */
Ext.define("Ext.dirac.views.tabs.SettingsPanel", {
  extend: "Ext.panel.Panel",
  requires: ["Ext.form.Panel", "Ext.dirac.views.tabs.DesktopSettings"],
  title: "Settings",
  frame: false,
  width: 200,
  minWidth: 150,
  maxWidth: 400,
  collapsible: true,
  useArrows: true,
  iconCls: "settings",
  // animCollapse: true,
  border: false,
  scrollable: true,
  layout: "vbox",
  initComponent: function () {
    var me = this;
    me.desktopSettings = Ext.create("Ext.dirac.views.tabs.DesktopSettings");
    if (!GLOBAL.APP.configData.user.username) {
      GLOBAL.STATE_MANAGEMENT_ENABLED = false;
    }
    Ext.apply(me, {
      items: [me.addUserForm(), me.desktopSettings],
    });

    me.callParent(arguments);
  },
  addUserName: function (name) {
    var userName = Ext.create("Ext.form.Panel", {
      maxWidth: 300,
      layout: "fit",
      // bodyPadding: 10,
      layout: {
        type: "hbox",
        align: "middle",
      },
      items: [
        {
          xtype: "label",
          text: "UserName:",
        },
        {
          xtype: "tbtext",
          text: name,
        },
      ],
    });
    return userName;
  },
  addUserForm: function () {
    var me = this;

    var form = Ext.create("Ext.form.Panel", {
      title: "Portal configuration",
      layout: "fit",
      bodyPadding: 10,
      width: 400,
      layout: {
        type: "table",
        columns: 2,
        tdAttrs: {
          style: "padding: 5px 10px;",
        },
      },
      defaults: {
        width: 150,
        textAlign: "left",
      },
      items: [
        {
          xtype: "label",
          text: "User:",
        },
        me.addAuthsButton(),
        {
          xtype: "label",
          text: "Group:",
        },
        me.addGroupsButton(),
        {
          xtype: "label",
          text: "Setup:",
        },
        me.addSetupButton(),
        {
          xtype: "label",
          text: "Theme:",
        },
        me.addThemeButton(),
      ],
    });
    return form;
  },

  getAuthCFG: function (Auth, Value) {
    var req = Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "Authentication/getAuthCFG",
      params: {
        typeauth: Auth === undefined ? "" : Auth,
        value: Value === undefined ? "" : Value,
      },
      async: false,
    }).responseText;
    res = JSON.parse(req);
    if (Object.keys(res).includes("Value")) {
      res = res.Value;
    }
    return res;
  },

  // OIDC login method
  oAuth2LogIn: function (settings, name) {
    var manager = new Oidc.UserManager(settings);
    manager.events.addUserLoaded(function (loadedUser) {
      console.log(loadedUser);
    });
    manager.events.addSilentRenewError(function (error) {
      GLOBAL.APP.CF.log("error", "error while renewing the access token");
    });
    manager.events.addUserSignedOut(function () {
      GLOBAL.APP.CF.alert("The user has signed out", "info");
    });
    manager.events.addUserLoaded(function (loadedUser) {
      if (loadedUser && typeof loadedUser === "string") {
        loadedUser = JSON.parse(data);
      }
      if (loadedUser) {
        loadedUser = JSON.stringify(loadedUser, null, 2);
      }
      var aJson = JSON.parse(loadedUser);
      var access_token = aJson["access_token"];
      Ext.Ajax.request({
        url: GLOBAL.BASE_URL + "Authentication/auth",
        params: {
          typeauth: name,
          value: access_token,
        },
        success: function (response) {
          var response = Ext.JSON.decode(response.responseText);
          if (response.value == "Done") {
            location.protocol = "https:";
          } else {
            Ext.create("Ext.window.Window", {
              title: "Welcome",
              layout: "fit",
              preventBodyReset: true,
              closable: true,
              html:
                "<br><b>Welcome to the DIRAC service " +
                response.profile["given_name"] +
                "!</b><br><br>Sorry, but You are not registred as a DIRAC user.<br>",
              buttons: [
                {
                  text: "Registration",
                  handler: function () {
                    Ext.Ajax.request({
                      url: GLOBAL.BASE_URL + "Authentication/sendRequest",
                      params: {
                        typeauth: name,
                        value: response.profile,
                      },
                      success: function () {
                        GLOBAL.APP.CF.alert("Your request was sent.", "info");
                      },
                    });
                    this.up("window").close();
                  },
                },
              ],
            }).show();
          }
        },
      });
    });
    manager.signinPopup().catch(function (error) {
      GLOBAL.APP.CF.log("error", "error while logging in through the popup");
    });
  },

  addAuthsButton: function () {
    var me = this;

    // Generate list of login buttons
    var oListAuth = me.getAuthCFG();
    var currentAuth = Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "Authentication/getCurrentAuth",
      perams: {},
      async: false,
    }).responseText;
    var button_usrname = {
      text: "Visitor",
      menu: [],
    };

    // HTTP used only for visitors
    if (location.protocol === "http:") {
      button_usrname.menu.push({
        text: "Log in (switch to https://)",
        handler: function () {
          location.protocol = "https:";
        },
      });
      // HTTPS
      // Log in section
    } else {
      // List of IdPs
      if (Array.isArray(oListAuth) || currentAuth == "Visitor") {
        button_usrname.menu.push({
          xtype: "tbtext",
          text: "Log in:",
        });
      }
      for (var i = 0; i < oListAuth.length; i++) {
        var name = oListAuth[i];
        var settings = me.getAuthCFG(name, "all");
        if (name != currentAuth) {
          button_usrname.menu.push({
            text: name,
            settings: settings,
            handler: function () {
              if (this.settings.method == "oAuth2") {
                me.oAuth2LogIn(this.settings, this.text);
              } else if (settings.method) {
                GLOBAL.APP.CF.alert("Authentication method " + settings.method + " is not supported.", "error");
              } else {
                GLOBAL.APP.CF.alert("Authentication method is not set.", "error");
              }
            },
          });
        }
      }
      // Default authentication method
      if (currentAuth != "Certificate") {
        button_usrname.menu.push({
          text: "Certificate",
          handler: function () {
            Ext.Ajax.request({
              url: GLOBAL.BASE_URL + "Authentication/auth",
              params: {
                typeauth: "Certificate",
                value: "",
              },
              success: function () {
                location.protocol = "https:";
              },
            });
          },
        });
      }
      // Log out section
      if (currentAuth != "Visitor") {
        if (Array.isArray(oListAuth)) {
          button_usrname.menu.push({ xtype: "menuseparator" });
        }
        button_usrname.menu.push({
          text: "Log out",
          handler: function () {
            Ext.Ajax.request({
              url: GLOBAL.BASE_URL + "Authentication/auth",
              params: {
                typeauth: "Logout",
                value: "None",
              },
              success: function (response) {
                console.log(response.responseText);
                location.protocol = "https:";
              },
            });
          },
        });
        button_usrname.menu.push();
      }
    }

    if (GLOBAL.APP.configData.user.username) {
      /**
       * If the user is registered
       */
      button_usrname.text = GLOBAL.APP.configData["user"]["username"];
    }
    return new Ext.button.Button(button_usrname);
  },

  addGroupsButton: function () {
    var button_group = {
      text: GLOBAL.APP.configData["user"]["group"],
      menu: [],
    };

    for (var i = 0; i < GLOBAL.APP.configData["validGroups"].length; i++)
      button_group.menu.push({
        text: GLOBAL.APP.configData["validGroups"][i],
        handler: function () {
          var me = this;
          var oHref = location.href;
          var oQPosition = oHref.indexOf("?");
          if (oQPosition != -1) {
            location.href = oHref.substr(0, oQPosition) + "changeGroup?to=" + me.text;
          } else {
            location.href = oHref + "changeGroup?to=" + me.text;
          }
        },
      });
    return new Ext.button.Button(button_group);
  },
  addSetupButton: function () {
    var setup_data = {
      text: GLOBAL.APP.configData["setup"],
      menu: [],
    };

    for (var i = 0; i < GLOBAL.APP.configData["validSetups"].length; i++)
      setup_data.menu.push({
        text: GLOBAL.APP.configData["validSetups"][i],
        handler: function () {
          var me = this;

          location.href = GLOBAL.BASE_URL + "changeSetup?to=" + me.text;
        },
      });

    return new Ext.button.Button(setup_data);
  },
  addThemeButton: function () {
    var me = this;

    var sButtonThemeText = "Crisp";

    if (GLOBAL.WEB_THEME == "neptune") sButtonThemeText = "Neptune";

    if (GLOBAL.WEB_THEME == "classic") sButtonThemeText = "Classic";

    if (GLOBAL.WEB_THEME == "triton") sButtonThemeText = "Triton";

    if (GLOBAL.WEB_THEME == "gray") sButtonThemeText = "Gray";

    var button_theme = {
      text: sButtonThemeText,
      menu: [],
    };

    var oListTheme = ["Gray", "Neptune", "Classic", "Triton", "Crisp"];

    for (var i = 0; i < oListTheme.length; i++) {
      button_theme.menu.push({
        text: oListTheme[i],
        handler: function () {
          var me = this;

          var oHref = location.href;

          var oQPosition = oHref.indexOf("?");

          var sState_related_url = "";
          if (GLOBAL.APP.MAIN_VIEW._state_related_url.length > 0) {
            sState_related_url = "&url_state=1|" + GLOBAL.APP.MAIN_VIEW._state_related_url[0];
            for (var i = 1; i < GLOBAL.APP.MAIN_VIEW._state_related_url.length; i++) {
              sState_related_url += "," + GLOBAL.APP.MAIN_VIEW._state_related_url[i];
            }
          }
          if (oQPosition != -1) {
            location.href = oHref.substr(0, oQPosition) + "?theme=" + me.text + sState_related_url;
          } else {
            location.href = oHref + "?theme=" + me.text + sState_related_url;
          }
        },
      });
    }
    return new Ext.button.Button(button_theme);
  },

  getDesktopSettingsPanel: function () {
    var me = this;
    return me.desktopSettings;
  },
});
