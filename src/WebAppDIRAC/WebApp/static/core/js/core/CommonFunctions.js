/**
 * @class Ext.dirac.core.CommonFunctions This class manages the entire
 *        application platform
 * @mixins Ext.util.Observable
 *
 */

Ext.define("Ext.dirac.core.CommonFunctions", {
  requires: ["Ext.dirac.utils.Notification"],

  messages: [],

  getFieldValueFromSelectedRow: function (oGrid, oFieldName) {
    var oVal = "";
    if (oGrid) {
      var oSelectedRecords = oGrid.getSelectionModel().getSelection();

      if (oSelectedRecords.length > 0) oVal = oSelectedRecords[0].get(oFieldName);
    }
    return oVal;
  },

  getSelectedRecords: function (oGrid) {
    return oGrid.getSelectionModel().getSelection();
  },

  doubleItemValue: function (oList) {
    for (var i = 0; i < oList.length; i++) oList[i] = [oList[i], oList[i]];

    return oList;
  },

  getAuthorizationServerMetadata: function () {
    var meta = Ext.JSON.decode(sessionStorage.getItem("AuthServerMetadata"));
    if (meta == null) {
      console.log(GLOBAL.APP.configData.configuration.AuthorizationClient.issuer + "/.well-known/openid-configuration");
      Ext.Ajax.request({
        url: GLOBAL.APP.configData.configuration.AuthorizationClient.issuer + "/.well-known/openid-configuration",
        success: function (response) {
          meta = Ext.JSON.decode(response.responseText);
          Ext.Ajax.request({
            url: meta.jwks_uri,
            success: function (response) {
              meta.jwks = Ext.JSON.decode(response.responseText);
              sessionStorage.setItem("AuthServerMetadata", Ext.JSON.encode(meta));
              return meta;
            },
          });
        },
      });
    } else {
      return meta;
    }
  },

  fetchToken: function (access_token) {
    var me = this;
    var meta = me.getAuthorizationServerMetadata();
    // var keys = KJUR.jws.JWS.readSafeJSONString(meta.jwks.toString());
    var key = KEYUTIL.getKey(meta.jwks.keys[0]);
    // TODO: Check if group changed
    if (key.verify(null, access_token) == true) {
      return access_token;
    }
    Ext.Ajax.request({
      method: "GET",
      url: GLOBAL.BASE_URL + "fetchToken",
      params: {
        access_token: access_token,
      },
      success: function (response) {
        sessionStorage.setItem("access_token", response.responseText);
        return response.responseText;
      },
    });
  },

  rpcCall: function (url, method, args) {
    var me = this;
    // var meta = await getAuthorizationServerMetadata();
    var access_token = sessionStorage.getItem("access_token");
    if (access_token == null) {
      GLOBAL.APP.CF.alert("RPC call inpossible without access token. You need authorize through IdP.", "info");
      return;
    }
    access_token = me.fetchToken(access_token);
    Ext.Ajax.request({
      url: url,
      method: "POST",
      params: {
        method: method,
        args: args,
      },
      headers: { Authorization: "Bearer " + access_token },
      success: function (response) {
        return Ext.JSON.decode(response.responseText);
      },
    });
  },

  /**
   * Helper function to submit authentication flow and read status of it
   */
  auth: function (authProvider) {
    window.location = GLOBAL.BASE_URL + "login?provider=" + authProvider + "&next=" + window.location.href;
  },

  /**
   * More info: https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
   *
   * @param {String} text
   */
  copyToClipboard: function (text) {
    var me = this;
    var textArea = document.createElement("textarea");

    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a
    // flash, so some of these are just precautions. However in
    // Internet Explorer the element is visible whilst the popup
    // box asking the user for permission for the web page to
    // copy to the clipboard.
    //

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = "fixed";
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = "2em";
    textArea.style.height = "2em";

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = "transparent";

    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    var done = false;

    try {
      done = document.execCommand("copy");
    } catch (err) {}

    document.body.removeChild(textArea);
    return done;
  },

  alert: function (sMessage, sType, btnCopy) {
    var me = this;
    var btns = {
      yes: "OK",
    };

    if (sMessage == null) return;
    sMessage = sMessage.replace(new RegExp("\n", "g"), "<br/>");

    if (Object.is(btnCopy, undefined) || btnCopy) {
      btns["cancel"] = "Copy";
      closable = false;
    }

    var title, icon;
    switch (sType) {
      case "error":
        title = "Error";
        icon = Ext.MessageBox.ERROR;
        break;

      case "info":
        title = "Information";
        icon = Ext.MessageBox.INFO;
        break;

      case "warning":
        title = "Warning";
        icon = Ext.MessageBox.WARNING;
        break;

      default:
        title = "Error";
        icon = Ext.MessageBox.ERROR;
    }

    Ext.MessageBox.show({
      title: title,
      msg: sMessage,
      icon: icon,
      buttonText: btns,
      closable: closable,
      fn: function (oButton) {
        if (oButton == "cancel") {
          // copy
          if (me.copyToClipboard(sMessage)) {
            me.msg("info", "Text copied to clipboard. Please, use Ctrl+V to get it..");
            me.alert(sMessage, sType, true);
          } else {
            me.msg("info", "Oops, unable to copy..");
            me.alert(sMessage, sType, false);
          }
        } else if (oButton == "yes") {
          // agree and ignore
        }
      },
    });
  },

  job_status_palette: {
    Received: "#D9E7F8",
    Checking: "#FAFAFA",
    Staging: "#6190CD",
    Waiting: "#004EFF",
    Matched: "#FEF7AA",
    Running: "#FDEE65",
    Stalled: "#BC5757",
    Completed: "#00FF21",
    Done: "#238802",
    Failed: "#FF0000",
    failed: "#FF0000",
    Killed: "#111111",
  },

  job_minor_status_palette: {
    "AncestorDepth Not Found": "#BAA312",
    "Application Finished With Errors": "#BC2133",
    "BK Input Data Not Available": "#E6D600",
    "BK-LFC Integrity Check Failed": "#BC1143",
    "Can not get Active and Banned Sites from JobDB": "#84CBFF",
    "Chosen site is not eligible": "#B4A243",
    "Error Sending Staging Request": "#B4A243",
    "Exceeded Maximum Dataset Limit (100)": "#BA5C9D",
    "Exception During Execution": "#AA240C",
    "Execution Complete": "#338B39",
    "Failed to access database": "#FFE267",
    "File Catalog Access Failure": "#FF8000",
    "Illegal Job JDL": "#D96C00",
    "Impossible Site + InputData Requirement": "#BDA822",
    "Impossible Site Requirement": "#F87500",
    "Input Data Not Available": "#2822A6",
    "Input Data Resolution": "#FFBE94",
    "Input Sandbox Download": "#586CFF",
    "Input data contains //": "#AB7800",
    "Input data not correctly specified": "#6812D6",
    "Job Wrapper Initialization": "#FFFFCC",
    "Job has exceeded maximum wall clock time": "#FF33CC",
    "Job has insufficient disk space to continue": "#33FFCC",
    "Job has reached the CPU limit of the queue": "#AABBCC",
    "No Ancestors Found For Input Data": "#BDA544",
    "No candidate sites available": "#E2FFBC",
    "No eligible sites for job": "#A8D511",
    "Parameter not found": "#FFB80C",
    "Pending Requests": "#52FF4F",
    "Received Kill signal": "#FF312F",
    "Socket read timeout exceeded": "#B400FE",
    Stalled: "#FF655E",
    "Uploading Job Outputs": "#FE8420",
    "Watchdog identified this job as stalled": "#FFCC99",
  },
  /*************************************************************************
   * It uses the browser provided infrastructure to log the message. It is
   * recommended to use for debug the code.
   *
   * @param{String} logLevel it can be: log, error,info
   * @param{String} message The message what will appear in the debugger of
   *                the browser.
   * @param{Object} loggedObject An object what we want to log in the
   *                debugger of the browser.
   */
  log: function (logLevel, message, loggedObject) {
    var config = null;

    if (loggedObject) {
      config = {
        level: logLevel,
        dump: loggedObject,
      };
    } else {
      config = {
        level: logLevel,
      };
    }
    // <debug>
    Ext.log(config, message);
    // </debug>
  },
  zfill: function (number, zeros) {
    if (zeros > 0) {
      var str = "";
      nbzeros = zeros - number.toString().length;
      for (var i = 0; i < nbzeros; i++) {
        str += "0";
      }
      return str + number;
    } else {
      return number;
    }
  },
  getSelectedValue: function (oGrid) {
    var sVal = "";
    var oSelectedRecords = oGrid.getSelectionModel().getSelection();

    if (oSelectedRecords.length > 0) {
      var pos = oGrid.getSelectionModel().getCurrentPosition();
      var collumnIndex = pos.column;
      var sColumnName = oGrid.columns[collumnIndex].dataIndex;
      sVal = oSelectedRecords[0].get(sColumnName);
    }
    return sVal;
  },
  msg: function (type, message, autoClose) {
    var me = this;

    if (message === undefined) return;

    message = message.replace(new RegExp("\n", "g"), "<br/>");

    if (Ext.Array.contains(me.messages, message)) {
      return;
    } else {
      me.messages.push(message);
    }
    var config = {};

    switch (type) {
      case "Notification":
        config = {
          autoClose: autoClose === undefined ? true : autoClose,
          title: "Notification",
          position: "tl",
          manager: GLOBAL.APP.MAIN_VIEW ? GLOBAL.APP.MAIN_VIEW.Id : null,
          stickWhileHover: false,
          iconCls: "ux-notification-icon-information",
          html: message,
          message: message,
        };
        break;

      case "Error Notification":
        config = {
          autoClose: autoClose === undefined ? false : autoClose,
          title: "Error Notification",
          position: "tl",
          manager: GLOBAL.APP.MAIN_VIEW ? GLOBAL.APP.MAIN_VIEW.Id : null,
          iconCls: "ux-notification-icon-error",
          html: message,
          message: message,
        };

        break;

      case "info":
        config = {
          autoClose: autoClose === undefined ? true : autoClose,
          title: "Notification",
          position: "tl",
          manager: GLOBAL.APP.MAIN_VIEW ? GLOBAL.APP.MAIN_VIEW.Id : null,
          stickWhileHover: false,
          iconCls: "ux-notification-icon-information",
          html: message,
          message: message,
        };
        break;

      case "Error":
        config = {
          autoClose: autoClose === undefined ? false : autoClose,
          title: "Error Notification",
          position: "tl",
          manager: GLOBAL.APP.MAIN_VIEW ? GLOBAL.APP.MAIN_VIEW.Id : null,
          iconCls: "ux-notification-icon-error",
          html: message,
          message: message,
        };

        break;

      default:
        config = {
          autoClose: autoClose === undefined ? false : autoClose,
          title: "Error Notification",
          position: "tl",
          manager: GLOBAL.APP.MAIN_VIEW ? GLOBAL.APP.MAIN_VIEW.Id : null,
          iconCls: "ux-notification-icon-error",
          html: message,
          message: message,
        };
    }

    var notificationobj = Ext.create("widget.uxNotification", config);
    notificationobj.on("beforeclose", function (notification) {
      Ext.Array.remove(me.messages, notification.message);
    });
    notificationobj.show();
  },
  showAjaxErrorMessage: function (response) {
    var me = this;

    if (response.statusText == "transaction aborted") return;

    /*
     * if (response.statusText == "OK") { var result =
     * Ext.decode(responseText); }
     */
    if (response.timedout) {
      Ext.dirac.system_info.msg("Error Notification", "The request timed out! Please reload the application!!!");
    } else {
      if (response.responseText) {
        var message = response.responseText.split("\n");
        var shortMessage = "";
        if (message.length > 1) {
          // We have case when we have more than one line.
          // In that case we show the lates line.
          // We have this case when the handler of the application is
          // crashing...
          var messageLength = message.length - 2;
          shortMessage = message[messageLength];
        } else {
          shortMessage = response.responseText;
        }

        me.log("error", "Operation failed: " + response.statusText, response);
        if (response.status == 200) {
          Ext.dirac.system_info.msg("Notification", shortMessage + ".<br/>");
        } else {
          Ext.dirac.system_info.msg("Error Notification", "Operation failed: " + shortMessage + ".<br/>");
        }
      } else {
        Ext.dirac.system_info.msg("Error Notification", "The reason of the failure is unknown!");
      }
    }
  },
  chunkString: function (str, chunksize) {
    return str.match(new RegExp("[\\s\\S]{1," + +chunksize + "}", "g"));
  },
});
