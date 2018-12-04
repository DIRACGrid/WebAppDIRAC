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
      autoScroll : true,
      layout : 'vbox',
      initComponent : function() {
        var me = this;
        me.desktopSettings = Ext.create("Ext.dirac.views.tabs.DesktopSettings");
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

      getAuthCFG : function(Auth = '',Value = ''){
        var req = Ext.Ajax.request({
          url: GLOBAL.BASE_URL + 'Authentication/getAuthCFG',
          params: {
            typeauth: Auth,
            value: Value
          },
          async: false
        }).responseText
        res = JSON.parse(req)
        if (Object.keys(res).includes('Value')) {
          res = res.Value
        }
        return res
      },
  
      // OIDC login method
      oAuth2LogIn : function(settings,name) {
        var manager = new Oidc.UserManager(settings);
        manager.events.addUserLoaded(function (loadedUser) { console.log(loadedUser) });
        manager.events.addSilentRenewError(function (error) {
          GLOBAL.APP.CF.log("error", "error while renewing the access token");
        });
        manager.events.addUserSignedOut(function () {
          GLOBAL.APP.CF.alert('The user has signed out',"info");
        });
        manager.events.addUserLoaded(function(loadedUser) {
          if (loadedUser && typeof loadedUser === 'string') {
            loadedUser = JSON.parse(data);
          }
          if (loadedUser) {
            loadedUser = JSON.stringify(loadedUser, null, 2);
          }
          var aJson = JSON.parse(loadedUser);
          var access_token = aJson["access_token"];
          Ext.Ajax.request({
            url: GLOBAL.BASE_URL + 'Authentication/auth',
            params: { 
              typeauth: name,
              value: access_token
            },
            success: function(response){
              var response = Ext.JSON.decode(response.responseText);
              if (response.value == 'Done') {location.protocol = "https:"} 
              else { 
                Ext.create('Ext.window.Window', {
                  title: 'Welcome',
                  layout: 'fit',
                  preventBodyReset: true,
                  closable: true,
                  html: '<br><b>Welcome to the DIRAC service '+ response.profile['given_name'] +'!</b><br><br>Sorry, but You are not registred as a DIRAC user.<br>',
                  buttons : [
                    {
                      text    : 'Registration',
                      handler : function() {
                        Ext.Ajax.request({
                          url: GLOBAL.BASE_URL + 'Authentication/sendRequest',
                          params: { 
                            typeauth: name,
                            value: response.profile
                          },
                          success: function() { GLOBAL.APP.CF.alert('Your request was sent.','info')	}
                        });
                        this.up('window').close();
                      }
                    }
                  ]
                }).show();
              }
            }
          });
        });
        manager.signinPopup().catch(function(error){
          GLOBAL.APP.CF.log("error", 'error while logging in through the popup');
        });
      },

      addAuthsButton : function() {
        var me = this;
        
        // Generate list of login buttons
        var oListAuth = me.getAuthCFG()
        var currentAuth = Ext.Ajax.request({
          url: GLOBAL.BASE_URL + 'Authentication/getCurrentAuth',
          perams: {},
          async: false
        }).responseText
        var button_usrname = {
          "text" : "Visitor",
          "menu" : []
        };

        // HTTP used only for visitors
        if (location.protocol === 'http:') {
          button_usrname.menu.push({
            text : 'Log in (switch to https://)',
            handler: function() {location.protocol = "https:"}
          });
        } else {
          if (Array.isArray(oListAuth) || (currentAuth == "Visitor")) {
            button_usrname.menu.push({
              xtype: 'tbtext',
              text : 'Log in:'
            });
          }
          for (var i = 0; i < oListAuth.length; i++) {
            var name = oListAuth[i]
            var settings = me.getAuthCFG(name,'all')
            if (name != currentAuth) {
              button_usrname.menu.push({
                'text' : name,
                'settings': settings,
                'handler' : function() {
                  if (this.settings.method == 'oAuth2') { me.oAuth2LogIn(this.settings,this.text) }
                  else if (settings.method) {
                    GLOBAL.APP.CF.alert("Authentication method " + settings.method + " is not supported." ,'error')
                  }
                  else {
                    GLOBAL.APP.CF.alert("Authentication method is not set." ,'error')
                  }
                }
              })
            }
          }
          // default authentication method
          if (currentAuth != "Certificate") {
            button_usrname.menu.push({
              'text' : "Certificate",
              'handler' : function() {
                Ext.Ajax.request({
                    url: GLOBAL.BASE_URL + 'Authentication/auth',
                    params: {
                      typeauth: 'Certificate',
                      value: ''
                    },
                    success: function() { location.protocol = "https:" }
                })
              }
            })
          }
          if (currentAuth != 'Visitor') {
            if (Array.isArray(oListAuth)) {
              button_usrname.menu.push({xtype: 'menuseparator'})
            }
            button_usrname.menu.push({
              text : 'Log out',
              handler : function(){
                Ext.Ajax.request({
                  url: GLOBAL.BASE_URL + 'Authentication/auth',
                  params: {
                    typeauth: 'Logout',
                    value: 'None'
                  },
                  success: function(response){
                    console.log(response.responseText)
                    location.protocol = "https:"
                  }
                });
              }
            });
            button_usrname.menu.push()
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

        var sButtonThemeText = "Grey";

        if (GLOBAL.WEB_THEME == "ext-all-neptune")
          sButtonThemeText = "Neptune";

        if (GLOBAL.WEB_THEME == "ext-all")
          sButtonThemeText = "Classic";

        var button_theme = {
          "text" : sButtonThemeText,
          "menu" : []
        };

        var oListTheme = ["Grey", "Neptune", "Classic"];

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
        var sButtonThemeText = "Grey";

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
