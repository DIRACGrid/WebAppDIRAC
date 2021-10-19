/**
 * @class Ext.dirac.utils.WelcomeWindow This is a welcome window widget
 * @extends Ext.Welcome.Window
 */
Ext.define("Ext.dirac.utils.WelcomeWindow", {
  constructor: function () {
    var usr = GLOBAL.APP.configData["user"]["username"];
    var mainDiv = document.getElementById("app-dirac-welcome");
    var closeBtn = document.getElementById("app-dirac-welcome-close");
    var visitorDiv = document.getElementById("app-dirac-welcome-visitor");
    if (mainDiv && closeBtn && visitorDiv) {
      if (!Ext.util.Cookies.get("frstEntrUsrs") || Ext.util.Cookies.get("frstEntrUsrs").indexOf(usr) == -1) {
        mainDiv.style.display = "block";
        closeBtn.onclick = function () {
          mainDiv.style.display = "none";
        };
        if (!GLOBAL.APP.configData.user.username) {
          visitorDiv.style.display = "block";
        }
      }
      if (!Ext.util.Cookies.get("frstEntrUsrs")) {
        Ext.util.Cookies.set("frstEntrUsrs", usr);
      } else {
        var frstEntrUsrs = [];
        frstEntrUsrs.push(Ext.util.Cookies.get("frstEntrUsrs"), usr);
        Ext.util.Cookies.set("frstEntrUsrs", frstEntrUsrs);
      }
      return frstEntrUsrs;
    }
  },
});
