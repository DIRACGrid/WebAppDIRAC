/**
 * @class Ext.dirac.core.App This class manages the entire application platform
 * @mixins Ext.util.Observable
 *
 */

Ext.define("Ext.dirac.core.App", {
  mixins: {
    observable: "Ext.util.Observable",
    fileLoader: "Ext.dirac.utils.DiracFileLoad",
  },

  requires: [
    "Ext.container.Viewport",
    "Ext.window.MessageBox",
    "Ext.dirac.core.CommonFunctions",
    "Ext.dirac.core.StateManagement",
    "Ext.dirac.utils.WelcomeWindow",
  ],

  /**
   * @property {boolean} isReady
   */
  isReady: false,

  validApplications: {},

  constructor: function () {
    var me = this;

    me.mixins.observable.constructor.call(this, undefined);

    Ext.dirac.system_info = (function () {
      var msgCt;

      function createBox(t, s) {
        return '<div class="msg"><h3>' + t + "</h3><p>" + s + "</p></div>";
      }
      return {
        msg: function (title, format) {
          if (!msgCt) {
            msgCt = Ext.DomHelper.insertFirst(
              document.body,
              {
                id: "msg-div",
              },
              true
            );
          }
          var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 1));
          var m = Ext.DomHelper.append(msgCt, createBox(title, s), true);
          m.hide();
          m.slideIn("t").ghost("t", {
            delay: 2000,
            remove: true,
          });
        },

        init: function () {
          if (!msgCt) {
            // It's better to create the msg-div here in order to
            // avoid re-layouts
            // later that could interfere with the HtmlEditor and
            // reset its iFrame.
            msgCt = Ext.DomHelper.insertFirst(
              document.body,
              {
                id: "msg-div",
              },
              true
            );
          }
        },
      };
    })();

    /*
     * Check if the authentification session is expired (every 3 seconds)
     */
    const authGrant = Ext.util.Cookies.get("authGrant");
    if (authGrant == "Session") {
      setInterval(function () {
        if (Ext.util.Cookies.get("session_id") == "expired") {
          Ext.util.Cookies.clear("authGrant");
          Ext.util.Cookies.clear("session_id");
          location.protocol = alert("Current session is expired, the page will reload, please login again.") ? "https" : "https";
        }
      }, 3000);
    }

    /*
     * Getting the configuration data from the server
     */
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + "getConfigData",
      params: {},
      scope: me,
      success: function (response) {
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
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
    });

    /*
     * Creating an object providing common functions
     */
    me.CF = new Ext.dirac.core.CommonFunctions();

    /*
     * Creating an object for state management
     */
    me.SM = new Ext.dirac.core.StateManagement();

    GLOBAL.IS_IE = document.all ? true : false;

    /*
     * Starting capturing the X, Y coordinates of the mouse cursor
     */
    document.addEventListener("mousemove", me.__getMouseXY);

    Ext.dirac.system_info = me.CF;

    me.callParent();
  },

  /**
   * @private Function to be called when the mouse changes its position
   * @param e
   */
  __getMouseXY: function (e) {
    if (GLOBAL.IS_IE) {
      // grab the x-y pos.s if browser is IE
      GLOBAL.MOUSE_X = event.clientX + document.body.scrollLeft;
      GLOBAL.MOUSE_Y = event.clientY + document.body.scrollTop;
    } else {
      // grab the x-y pos.s if browser is NS
      GLOBAL.MOUSE_X = e.pageX;
      GLOBAL.MOUSE_Y = e.pageY;
    }
    // catch possible negative values in NS4
    if (GLOBAL.MOUSE_X < 0) {
      GLOBAL.MOUSE_X = 0;
    }
    if (GLOBAL.MOUSE_Y < 0) {
      GLOBAL.MOUSE_Y = 0;
    }

    return true;
  },

  /**
   * @private Function used to extract a list of valid applications out of
   *          the config data
   */
  __readValidApplication: function () {
    var me = this;

    for (var i = 0; i < me.configData["menu"].length; i++) me.__getAppRecursivelyFromConfig(GLOBAL.APP.configData["menu"][i]);
  },

  /**
   * @private Main recursive function used to extract the names of the valid
   *          applications
   */
  __getAppRecursivelyFromConfig: function (item) {
    var me = this;

    if (item.length == 2) {
      for (var i = 0; i < item[1].length; i++) {
        me.__getAppRecursivelyFromConfig(item[1][i]);
      }
    } else {
      if (item[0] == "app") {
        var oParts = item[2].split(".");

        var sStartClass = oParts.length == 2 ? item[2] + ".classes." + oParts[1] : item[2];

        me.validApplications[sStartClass] = item[1];
      }
    }
  },

  /**
   * @private Initialization function setting the desktop
   */
  __init: function () {
    var me = this,
      desktopCfg;

    Ext.QuickTips.init();

    /*
     * Creating the main desktop obbject
     */

    me.MAIN_VIEW = null;

    /*
     * Creating the desktop object
     */

    var oConfig = {
      enabled: true,
      paths: {},
    };

    oConfig["paths"]["Ext.dirac.views." + GLOBAL.VIEW_ID] = "static/core/js/views/" + GLOBAL.VIEW_ID;

    Ext.Loader.setConfig(oConfig);

    Ext.require("Ext.dirac.views." + GLOBAL.VIEW_ID + ".Main", function () {
      me.MAIN_VIEW = Ext.create("Ext.dirac.views." + GLOBAL.VIEW_ID + ".Main", {});

      me.viewport = new Ext.container.Viewport({
        layout: "fit",
        items: [me.MAIN_VIEW],
      });

      Ext.getWin().on("beforeunload", me.onUnload, me);

      me.isReady = true; // only if there is no desktop state loaded
      me.fireEvent("ready", me);
    });
  },

  /**
   * Function that is used to check whether an application is valid or not
   *
   * @param {String}
   *          sAppName The class name of the application
   * @return {Boolean}
   */
  isValidApplication: function (sAppName) {
    return sAppName in this.validApplications;
  },

  /**
   * Function to get all application settings
   *
   * @param {String}
   *          sAppName The class name of the application
   * @return {}
   */
  getApplicationSettings: function (sAppName) {
    if (sAppName in GLOBAL.APP.configData.configuration) {
      return GLOBAL.APP.configData.configuration[sAppName];
    } else {
      return {};
    }
  },

  /**
   * Function that check application downtime settings
   *
   * @param {String}
   *          sAppName The class name of the application
   * @return {}
   */
  applicationInDowntime: function (sAppName) {
    if (this.isValidApplication(sAppName)) {
      var now = Date.now();
      var app = this.validApplications[sAppName];
      var downtime = this.getApplicationSettings(app).Downtime;

      if (downtime) {
        var startDate = Date.parse(downtime.start);
        var start = startDate ? new Date(startDate) : null;
        var endDate = Date.parse(downtime.end);
        var end = endDate ? new Date(endDate) : null;

        var message = "Sorry, " + app + " application is in downtime";
        // Add reason description
        message += downtime.reason ? message + ":\n" + downtime.reason : "";
        message += start ? "\n\n From: " + start.toUTCString() : "";
        message += end ? "\n To:   " + end.toUTCString() : "forever!";

        // Check time
        /*  The string format should be: YYYY-MM-DDTHH:mm:ss.sssZ, where:

            YYYY-MM-DD – is the date: year-month-day.
            The character "T" is used as the delimiter.
            HH:mm:ss.sss – is the time: hours, minutes, seconds and milliseconds.
            The optional 'Z' part denotes the time zone in the format +-hh:mm. A single letter Z would mean UTC+0.
            Shorter variants are also possible, like YYYY-MM-DDTHH:mm, YYYY-MM-DD or YYYY-MM or even YYYY.
        */
        return !end ? "" : (!start || now > start) && now < end ? message : "";
      } else {
        return "";
      }
    }
  },

  /**
   * Function that is used to get the title of an application
   *
   * @param {String}
   *          sAppName The class name of the application
   * @return {String}
   */
  getApplicationTitle: function (sAppName) {
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
  getDesktop: function () {
    return this.MAIN_VIEW;
  },

  onReady: function (fn, scope) {
    if (this.isReady) {
      fn.call(scope, this);
    } else {
      this.on({
        ready: fn,
        scope: scope,
        single: true,
      });
    }
  },

  onUnload: function (e) {
    if (this.fireEvent("beforeunload", this) === false) {
      e.stopEvent();
    }
  },
});
