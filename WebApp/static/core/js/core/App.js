/**
 * @class Ext.dirac.core.App This class manages the entire application platform
 * @mixins Ext.util.Observable
 * 
 */

Ext.define('Ext.dirac.core.App', {
      mixins : {
        observable : 'Ext.util.Observable',
        fileLoader : 'Ext.dirac.utils.DiracFileLoad'
      },

      requires : ['Ext.container.Viewport', 'Ext.window.MessageBox', 'Ext.dirac.core.CommonFunctions', 'Ext.dirac.core.StateManagement'],

      /**
       * @property {boolean} isReady
       */
      isReady : false,

      validApplications : {},

      constructor : function() {

        var me = this;

        me.mixins.observable.constructor.call(this, undefined);

        Ext.dirac.system_info = function() {
          var msgCt;

          function createBox(t, s) {
            return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
          }
          return {
            msg : function(title, format) {
              if (!msgCt) {
                msgCt = Ext.DomHelper.insertFirst(document.body, {
                      id : 'msg-div'
                    }, true);
              }
              var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 1));
              var m = Ext.DomHelper.append(msgCt, createBox(title, s), true);
              m.hide();
              m.slideIn('t').ghost("t", {
                    delay : 2000,
                    remove : true
                  });

            },

            init : function() {
              if (!msgCt) {
                // It's better to create the msg-div here in order to
                // avoid re-layouts
                // later that could interfere with the HtmlEditor and
                // reset its iFrame.
                msgCt = Ext.DomHelper.insertFirst(document.body, {
                      id : 'msg-div'
                    }, true);
              }
            }
          };
        }();

        /*
         * Getting the configuration data from the server
         */
        Ext.Ajax.request({
              url : GLOBAL.BASE_URL + 'getConfigData',
              params : {},
              scope : me,
              success : function(response) {

                var configData = Ext.JSON.decode(response.responseText);

                me.configData = configData;

                /*
                 * After the config data are being received from the server, we
                 * have to extract the list of valid application that a user can
                 * start through the start menu
                 */

                me.__readValidApplication();

                /*
                 * After the valid applications have been extracted, the
                 * initialization method has to be called
                 */
                if (Ext.isReady) {
                  Ext.Function.defer(me.__init, 10, me);
                } else {
                  Ext.onReady(me.__init, me);
                }
              },
              failure : function(response) {

                GLOBAL.APP.CF.showAjaxErrorMessage(response);

              }
            });

        /*
         * Creating an object providing common functions
         */
        me.CF = new Ext.dirac.core.CommonFunctions();

        /*
         * Creating an object for state management
         */
        me.SM = new Ext.dirac.core.StateManagement();

        GLOBAL.IS_IE = document.all ? true : false

        /*
         * Starting capturing the X, Y coordinates of the mouse cursor
         */
        // If NS -- that is, !IE -- then set up for mouse capture
        if (!GLOBAL.IS_IE)
          document.captureEvents(Event.MOUSEMOVE)

        // Set-up to use getMouseXY function onMouseMove
        document.onmousemove = me.__getMouseXY;

        Ext.dirac.system_info = me.CF;

        me.callParent();

      },

      /**
       * @private Function to be called when the mouse changes its position
       * @param e
       */
      __getMouseXY : function(e) {

        if (GLOBAL.IS_IE) { // grab the x-y pos.s if browser is IE
          GLOBAL.MOUSE_X = event.clientX + document.body.scrollLeft
          GLOBAL.MOUSE_Y = event.clientY + document.body.scrollTop
        } else { // grab the x-y pos.s if browser is NS
          GLOBAL.MOUSE_X = e.pageX
          GLOBAL.MOUSE_Y = e.pageY
        }
        // catch possible negative values in NS4
        if (GLOBAL.MOUSE_X < 0) {
          GLOBAL.MOUSE_X = 0
        }
        if (GLOBAL.MOUSE_Y < 0) {
          GLOBAL.MOUSE_Y = 0
        }

        return true
      },

      /**
       * @private Function used to extract a list of valid applications out of
       *          the config data
       */
      __readValidApplication : function() {

        var me = this;

        for (var i = 0; i < me.configData["menu"].length; i++)
          me.__getAppRecursivelyFromConfig(GLOBAL.APP.configData["menu"][i]);

      },

      /**
       * @private Main recursive function used to extract the names of the valid
       *          applications
       */
      __getAppRecursivelyFromConfig : function(item) {

        var me = this;

        if (item.length == 2) {

          for (var i = 0; i < item[1].length; i++) {
            me.__getAppRecursivelyFromConfig(item[1][i]);
          }

        } else {
          if (item[0] == "app") {

            var oParts = item[2].split(".");

            var sStartClass = "";
            if (oParts.length == 2)
              sStartClass = item[2] + ".classes." + oParts[1];
            else
              sStartClass = item[2];

            me.validApplications[sStartClass] = item[1];

          }

        }

      },

      /**
       * @private Initialization function setting the desktop
       */
      __init : function() {

        var me = this, desktopCfg;

        Ext.QuickTips.init();

        /*
         * Creating the main desktop obbject
         */

        me.MAIN_VIEW = null;

        /*
         * Creating the desktop object
         */

        var oConfig = {
          enabled : true,
          paths : {}
        };

        oConfig["paths"]["Ext.dirac.views." + GLOBAL.VIEW_ID] = "static/core/js/views/" + GLOBAL.VIEW_ID;

        Ext.Loader.setConfig(oConfig);

        Ext.require("Ext.dirac.views." + GLOBAL.VIEW_ID + ".Main", function() {

              me.MAIN_VIEW = Ext.create("Ext.dirac.views." + GLOBAL.VIEW_ID + ".Main", {});

              me.viewport = new Ext.container.Viewport({
                    layout : 'fit',
                    items : [me.MAIN_VIEW]
                  });

              Ext.getWin().on('beforeunload', me.onUnload, me);

              me.isReady = true;// only if there is no desktop state loaded
              me.fireEvent('ready', me);

            });

      },

      /**
       * Function that is used to check whether an application is valid or not
       * 
       * @param {String}
       *          sAppName The class name of the application
       * @return {Boolean}
       */
      isValidApplication : function(sAppName) {

        return (sAppName in this.validApplications);

      },

      /**
       * Function that is used to get the title of an application
       * 
       * @param {String}
       *          sAppName The class name of the application
       * @return {String}
       */
      getApplicationTitle : function(sAppName) {

        if (sAppName in this.validApplications) {
          return this.validApplications[sAppName];
        } else {
          return "DESKTOP";
        }

      },

      /**
       * Function that is used to get a reference to the desktop object
       * 
       * @return {Ext.dirac.core.AppView}
       * 
       */
      getDesktop : function() {
        return this.MAIN_VIEW;
      },

      onReady : function(fn, scope) {
        if (this.isReady) {
          fn.call(scope, this);
        } else {
          this.on({
                ready : fn,
                scope : scope,
                single : true
              });
        }
      },

      onUnload : function(e) {
        if (this.fireEvent('beforeunload', this) === false) {
          e.stopEvent();
        }
      }

    });
