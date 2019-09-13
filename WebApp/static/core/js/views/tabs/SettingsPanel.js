/**
 * To be defined!!
 */
Ext.define('Ext.dirac.views.tabs.SettingsPanel', {
      extend : 'Ext.panel.Panel',
      required : ['Ext.form.Panel', 'Ext.dirac.views.tabs.DesktopSettings'],
      title : 'Settings',
      frame : false,
      width : 200,
      minWidth : 150,
      maxWidth : 400,
      collapsible : true,
      useArrows : true,
      iconCls : 'settings',
      // animCollapse: true,
      border : false,
      scrollable : true,
      layout : 'vbox',
      initComponent : function() {
        var me = this;
        me.desktopSettings = Ext.create("Ext.dirac.views.tabs.DesktopSettings");
        if (!GLOBAL.APP.configData.user.username) {
          GLOBAL.STATE_MANAGEMENT_ENABLED = false;
        };
        Ext.apply(me, {
          items : [me.addUserForm(), me.desktopSettings]
        });

        me.callParent(arguments);
      },
      addUserName : function(name) {
        var userName = Ext.create('Ext.form.Panel', {
              maxWidth : 300,
              layout : 'fit',
              // bodyPadding: 10,
              layout : {
                type : 'hbox',
                align : 'middle'
              },
              items : [{
                    xtype : 'label',
                    text : 'UserName:'
                  }, {
                    xtype : 'tbtext',
                    text : name
                  }]
            });
        return userName;
      },
      addUserForm : function() {
        var me = this;

        var form = Ext.create('Ext.form.Panel', {
              title : 'Portal configuration',
              layout : 'fit',
              bodyPadding : 10,
              width : 400,
              layout : {
                type : 'table',
                columns : 2,
                tdAttrs : {
                  style : 'padding: 5px 10px;'
                }
              },
              defaults : {
                width : 150,
                textAlign : 'left'
              },
              items : [{
                    xtype : 'label',
                    text : 'User:'
                  }, me.addAuthsButton(), {
                    xtype : 'label',
                    text : 'Group:'
                  }, me.addGroupsButton(), {
                    xtype : 'label',
                    text : 'Setup:'
                  }, me.addSetupButton(), {
                    xtype : 'label',
                    text : 'Theme:'
                  }, me.addThemeButton(), {
                    xtype : 'label',
                    text : ""
                  }, me.addViewButton()]
            });
        return form;
      },

      /**
       * Helper function to submit authentication flow and read status of it
       */
      auth : function(AuthType) {
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + 'Authentication/auth',
          params: {
            typeauth: AuthType
          },
          success: function(response) {
            if (!response.status == 200) {
              return GLOBAL.APP.CF.alert(response.statusText, 'error');
            } else {
              var result = Ext.decode(response.responseText);
              if (!result.OK) {
                return GLOBAL.APP.CF.alert("Authentication was ended with error: \n" + result.Message, 'error');
              } else if (result.Value.Action == 'reload') {
                return location.protocol = "https:";
              } else if (result.Value.Action == 'popup') {
                if (!result.Value.URL || !result.Value.Session) {
                  return GLOBAL.APP.CF.alert('We cannot get authorization URL.', 'error');
                } else {
                  authorizationURL = result.Value.URL;
                  session = result.Value.Session;
                  
                  //Open popup
                  GLOBAL.APP.CF.log("debug", 'Open authorization URL: "' + authorizationURL + '"');
                  var oAuthReqWin = open(authorizationURL, "popupWindow", "hidden=yes,height=570,width=520,scrollbars=yes,status=yes");
                  oAuthReqWin.focus();
                  
                  // Send request to redirect URL about success authorization
                  Ext.get("app-dirac-loading").show();
                  Ext.get("app-dirac-loading-msg").setHtml("Waiting when authentication will be finished...");
                  GLOBAL.APP.CF.log("debug", 'Watch when popup window will be close');
                  var res = (function waitPopupClosed (i, r) {
                    if (r==='closed') {
                      return Ext.Ajax.request({
                        url: GLOBAL.BASE_URL + 'Authentication/waitOAuthStatus',
                        params: { 
                          typeauth: AuthType,
                          session: session
                        },
                        async: false,
                        success: function(response) {
                          var msg, title;
                          var icon = Ext.Msg.INFO;
                          var result = Ext.decode(response.responseText);
                          if (!result.OK) {
                            icon = Ext.Msg.ERROR;
                            title = 'Authentication error.';
                            msg = result.Message.replace(/\n/g, "<br>");
                          } else {
                            title = 'Authenticated successfully.'
                            msg = result.Value.Comment ? result.Value.Comment.replace(/\n/g, "<br>") : "";
                            if (result.Value.Status == 'failed') {
                              icon = Ext.Msg.ERROR;
                              title = 'Authentication error.';
                            } else if (result.Value.Status == 'authed') {
                              return location.protocol = "https:";
                            } else if (result.Value.Status == 'visitor') {
                              msg = 'You have permissions as Visitor.\n' + msg;
                            } else if (result.Value.Status == 'authed and reported') {
                              msg = 'Admins was notified about you.\n' + msg;
                            }
                          }
                          // Hide load icon
                          Ext.get("app-dirac-loading").hide();
                          Ext.get("app-dirac-loading-msg").setHtml("Loading module. Please wait ...");
                          return Ext.Msg.show({
                            closeAction: 'destroy',
                            title: title,
                            message: msg,
                            icon: icon
                          });
                        },
                        failure: function(form, action) {
                          // Hide load icon
                          Ext.get("app-dirac-loading").hide();
                          Ext.get("app-dirac-loading-msg").setHtml("Loading module. Please wait ...");
                          return GLOBAL.APP.CF.alert('Request was ended with error: ' + form + action, 'error');
                        }
                      });
                    } else {
                      setTimeout(function () {
                        if (--i) {
                          if (oAuthReqWin===undefined) {
                            GLOBAL.APP.CF.log("debug", 'Popup window was closed.');
                            return waitPopupClosed(0, 'closed');
                          }
                          if (oAuthReqWin) {
                            if (oAuthReqWin.closed) {
                              GLOBAL.APP.CF.log("debug", 'Popup window was closed.');
                              return waitPopupClosed(0, 'closed');
                            } else {
                              oAuthReqWin.focus();
                              return waitPopupClosed(i);
                            }
                          } else {
                            return waitPopupClosed(i);
                          }
                        } else {
                          return waitPopupClosed(120);
                        }
                      }, 1000);
                    }
                  })(120,'opened');
                }
              } else {
                return GLOBAL.APP.CF.alert('Cannot submit authorization flow.', 'error');
              }
            }
          },
          failure: function(form, action) {
            // Hide load icon
            Ext.get("app-dirac-loading").hide();
            Ext.get("app-dirac-loading-msg").setHtml("Loading module. Please wait ...");
            return GLOBAL.APP.CF.alert('Request was ended with error: ' + form + action, 'error');
          }
        });
      },

      // Generate list of login buttons
      getListAuth : function() { 
        req = Ext.Ajax.request({
          url: GLOBAL.BASE_URL + 'Authentication/getAuthNames',
          async: false
        }).responseText;
        var res = Ext.decode(req);
        if (Object.keys(res).includes('Value')) {
          res = res.Value;
        }
        return res;
      },

      addAuthsButton : function() {
        var me = this;
        
        // Generate list of login buttons
        var oListAuth = me.getListAuth();
        var currentAuth = Ext.Ajax.request({
          url: GLOBAL.BASE_URL + 'Authentication/getCurrentAuth',
          perams: {},
          async: false
        }).responseText;

        var button_usrname = {
          "text" : "Visitor",
          "menu" : []
        };

        // HTTP used only for visitors
        if (location.protocol === 'http:') {
          button_usrname.menu.push({
            text : 'Log in (switch to https://)',
            handler: function() {location.protocol = "https:";}
          });
        } else {
          if (Array.isArray(oListAuth) || (currentAuth == "Visitor")) {
            button_usrname.menu.push({
              xtype: 'tbtext',
              text : 'Log in:'
            });
          }
          // List of IdPs
          for (var i = 0; i < oListAuth.length; i++) {
            if (oListAuth[i] != currentAuth) {
              button_usrname.menu.push({
                text : oListAuth[i],
                'handler' : function() { me.auth(this.text); }
              });
            }
          }
          // Default authentication method
          if (currentAuth != "Certificate") {
            button_usrname.menu.push({
              'text' : "Certificate",
              'handler' : function() { me.auth("Certificate"); }
            });
          }
          // Log out section
          if (currentAuth != 'Visitor') {
            if (Array.isArray(oListAuth)) {
              button_usrname.menu.push({ xtype: 'menuseparator' });
            }
            button_usrname.menu.push({
              'text' : 'Log out',
              'handler' : function() { me.auth('Log out'); }
            });
            button_usrname.menu.push();
          }
        }
        
        // If the user is registered
        if (GLOBAL.APP.configData.user.username) {
          button_usrname.text = GLOBAL.APP.configData["user"]["username"];
        }  
        return new Ext.button.Button(button_usrname);

      },

      addGroupsButton : function() {
        var me = this;

        var button_data = {
          "text" : GLOBAL.APP.configData["user"]["group"],
          "menu" : []
        };

        for (var i = 0; i < GLOBAL.APP.configData["validGroups"].length; i++)
          button_data.menu.push({
                text : GLOBAL.APP.configData["validGroups"][i],
                handler : function() {

                  var me = this;

                  var oHref = location.href;

                  var oQPosition = oHref.indexOf("?");

                  if (oQPosition != -1) {

                    location.href = oHref.substr(0, oQPosition) + 'changeGroup?to=' + me.text;
                  } else {

                    location.href = oHref + 'changeGroup?to=' + me.text;
                  }

                }
              });
        return new Ext.button.Button(button_data);
      },
      addSetupButton : function() {
        var setup_data = {
          "text" : GLOBAL.APP.configData["setup"],
          "menu" : []
        };

        for (var i = 0; i < GLOBAL.APP.configData["validSetups"].length; i++)
          setup_data.menu.push({
                text : GLOBAL.APP.configData["validSetups"][i],
                handler : function() {

                  var me = this;

                  location.href = GLOBAL.BASE_URL + 'changeSetup?to=' + me.text;

                }
              });

        return new Ext.button.Button(setup_data);
      },
      addThemeButton : function() {
        var me = this;

        var sButtonThemeText = "Crisp";

        if (GLOBAL.WEB_THEME == "neptune")
          sButtonThemeText = "Neptune";

        if (GLOBAL.WEB_THEME == "classic")
          sButtonThemeText = "Classic";
        
        if (GLOBAL.WEB_THEME == "triton")
          sButtonThemeText = "Triton";
        
        if (GLOBAL.WEB_THEME == "gray")
          sButtonThemeText = "Gray";

        var button_theme = {
          "text" : sButtonThemeText,
          "menu" : []
        };

        var oListTheme = ["Gray", "Neptune", "Classic","Triton", "Crisp"];

        for (var i = 0; i < oListTheme.length; i++) {
          button_theme.menu.push({
                text : oListTheme[i],
                handler : function() {

                  var me = this;

                  var oHref = location.href;

                  var oQPosition = oHref.indexOf("?");

                  var sState_related_url = "";
                  if (GLOBAL.APP.MAIN_VIEW._state_related_url.length > 0) {
                    sState_related_url = "&url_state=1|" + GLOBAL.APP.MAIN_VIEW._state_related_url[0];
                    for (var i = 1; i < GLOBAL.APP.MAIN_VIEW._state_related_url.length; i++) {
                      sState_related_url += ',' + GLOBAL.APP.MAIN_VIEW._state_related_url[i];
                    }
                  }
                  if (oQPosition != -1) {

                    location.href = oHref.substr(0, oQPosition) + '?theme=' + me.text + "&view=" + GLOBAL.VIEW_ID + sState_related_url;
                  } else {
                    location.href = oHref + '?theme=' + me.text + "&view=" + GLOBAL.VIEW_ID + sState_related_url;
                  }

                }
              });
        }
        return new Ext.button.Button(button_theme);
      },
      addViewButton : function() {
        var sButtonThemeText = "Gray";

        if (GLOBAL.WEB_THEME == "ext-all-neptune")
          sButtonThemeText = "Neptune";

        if (GLOBAL.WEB_THEME == "ext-all")
          sButtonThemeText = "Classic";

        var button_views = {
          "text" : GLOBAL.VIEW_ID,
          "menu" : []
        };

        var oListViews = ["desktop", "tabs"];

        for (var i = 0; i < oListViews.length; i++) {
          button_views.menu.push({
                text : oListViews[i],
                handler : function() {

                  var me = this;

                  var oHref = location.href;

                  var oQPosition = oHref.indexOf("?");

                  if (oQPosition != -1) {
                    location.href = oHref.substr(0, oQPosition) + '?view=' + me.text + "&theme=" + sButtonThemeText;
                  } else {
                    location.href = oHref + '?view=' + me.text + "&theme=" + sButtonThemeText;
                  }

                }
              });
        }
        return new Ext.button.Button(button_views);
      },
      
      getDesktopSettingsPanel : function() {
        var me = this;
        return me.desktopSettings;
      }
    });
