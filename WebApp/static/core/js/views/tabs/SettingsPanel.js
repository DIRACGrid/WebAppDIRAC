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
        if (GLOBAL.APP.configData.user.username) {
          Ext.apply(me, {
                items : [me.addUserForm(), me.desktopSettings]
              });
        } else {
          var userName = null;
          GLOBAL.STATE_MANAGEMENT_ENABLED = false;
          /*
           * If the user is not registered
           */
          if (location.protocol === 'http:') {

            var oHref = location.href;
            var oQPosition = oHref.indexOf("?");
            var sAddr = "";

            if (oQPosition != -1) {

              sAddr = oHref.substr(0, oQPosition);

            } else {

              sAddr = oHref;

            }

            userName = me.addUserName("Visitor (<a href='https://" + location.host.replace("8080", "8443") + location.pathname + "'>Secure connection</a>)");

          } else {
            userName = me.addUserName("Visitor");
          }

          Ext.apply(me, {
                items : [userName, me.desktopSettings]
              });
        }
        
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
                  }, {
                    xtype : 'label',
                    text : GLOBAL.APP.configData.user.username
                  }, {
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
      addDesktopConfiguration : function() {
        var me = this;

        var form = Ext.create('Ext.form.Panel', {
              title : 'Activ desktop configuration',
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
                    text : 'Desktop Name:'
                  }, {
                    xtype : 'label',
                    text : "None"
                  }]
            });
        return form;
      }
    });
