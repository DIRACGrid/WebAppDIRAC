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
          text: "Theme:",
        },
        me.addThemeButton(),
      ],
    });
    return form;
  },

  addAuthsButton: function () {
    var me = this;
    var oListAuth = [];

    // Generate list of login buttons
    if (GLOBAL.APP.configData.configuration.TypeAuths) {
      oListAuth = Object.keys(GLOBAL.APP.configData.configuration.TypeAuths);
    }
    var currentAuth = Ext.util.Cookies.get("authGrant");
    if (currentAuth == null) {
      currentAuth = "Certificate";
    }

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
      if (currentAuth != "Session") {
        // List of IdPs
        for (var i = 0; i < oListAuth.length; i++) {
          // if (oListAuth[i] != currentAuth) {
          button_usrname.menu.push({
            text: oListAuth[i],
            handler: function () {
              GLOBAL.APP.CF.auth(this.text);
            },
          });
          // }
        }
      }
      // Default authentication method
      if (currentAuth != "Certificate") {
        button_usrname.menu.push({
          text: "Certificate",
          handler: function () {
            Ext.util.Cookies.set("authGrant", this.text);
            window.location.protocol = "https";
          },
        });
      }
      // Log out section
      if (currentAuth != "Visitor") {
        button_usrname.menu.push({ xtype: "menuseparator" });
        button_usrname.menu.push({
          text: "Log out",
          handler: function () {
            sessionStorage.removeItem("access_token");
            Ext.util.Cookies.set("authGrant", "Visitor");
            if (currentAuth == "Certificate") {
              window.location.protocol = "https";
            } else {
              window.location = GLOBAL.BASE_URL + "logout";
            }
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
    // var data = GLOBAL.APP.configData["groupsStatuses"];
    for (i in GLOBAL.APP.configData.validGroups) {
      // for (group in data) {
      //   const status = data[group].Status;
      //   const dn = data[group].DN;
      //   const comment = data[group].Comment;
      //   const action = data[group].Action;
      // if (status == "ready") {
      button_group.menu.push({
        group: GLOBAL.APP.configData.validGroups[i],
        text: GLOBAL.APP.configData.validGroups[i],
        handler: function () {
          var me = this;
          var oHref = location.href;
          var oQPosition = oHref.indexOf("?");
          if (oQPosition != -1) {
            location.href = oHref.substr(0, oQPosition) + "changeGroup?to=" + me.group;
          } else {
            location.href = oHref + "changeGroup?to=" + me.group;
          }
        },
      });
      // } else {
      //   if (group == GLOBAL.APP.configData["user"]["group"]) {
      //     GLOBAL.APP.CF.alert(comment, "warning", true, action);
      //   }
      //   button_group.menu.push({
      //     title: status,
      //     msg: comment,
      //     group: group,
      //     text: group,
      //     iconCls: "dirac-icon-logout",
      //     handler: function() {
      //       Ext.Msg.show({
      //         closeAction: "destroy",
      //         title: this.title,
      //         message: this.msg,
      //         icon: Ext.Msg.INFO
      //       });
      //     }
      //   });
      // }
    }

    return new Ext.button.Button(button_group);
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
