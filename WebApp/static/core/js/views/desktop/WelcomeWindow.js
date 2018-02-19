/**
 * @class Ext.dirac.views.desktop.WelcomeWindow This is a welcome window widget 
 * @extends Ext.Welcome.Window 
 */
Ext.define('Ext.dirac.views.desktop.WelcomeWindow', {
	constructor : function() {
        var usr = GLOBAL.APP.configData["user"]["username"];
        if ((!Ext.util.Cookies.get('frstEntrUsrs')) || (Ext.util.Cookies.get('frstEntrUsrs').indexOf(usr) == -1)) {
            Ext.get("app-dirac-welcome").show();
            Ext.get("app-dirac-welcome-close").on('click',function(){Ext.get("app-dirac-welcome").hide()});
            if (!GLOBAL.APP.configData.user.username) {
                Ext.get("app-dirac-welcome-visitor").show();
            }
        };
        if (!Ext.util.Cookies.get('frstEntrUsrs')) {
            Ext.util.Cookies.set('frstEntrUsrs',usr);
        } else {
            var frstEntrUsrs = [];
            frstEntrUsrs.push(Ext.util.Cookies.get('frstEntrUsrs'),usr);
            Ext.util.Cookies.set('frstEntrUsrs',frstEntrUsrs);
        };
        return(frstEntrUsrs);
    }
});