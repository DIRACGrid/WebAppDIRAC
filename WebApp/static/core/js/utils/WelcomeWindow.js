/**
 * @class Ext.dirac.views.desktop.WelcomeWindow This is a welcome window widget 
 * @extends Ext.Welcome.Window 
 */
Ext.define('Ext.dirac.utils.WelcomeWindow', {
	constructor : function() {
        var usr = "visitor"
        if (GLOBAL.APP.configData["user"]["username"]) {
            usr = GLOBAL.APP.configData["user"]["username"]
        }
        var welcome = GLOBAL.WELCOME
        var frstEntrUsrs = []
        if (Ext.util.Cookies.get('frstEntrUsrs')) {
            frstEntrUsrs = Ext.util.Cookies.get('frstEntrUsrs').split(",")
        }
        if ((frstEntrUsrs.indexOf(usr) === -1) && (welcome.show != "False")) {
            frstEntrUsrs.push(usr)
            Ext.util.Cookies.set('frstEntrUsrs',frstEntrUsrs)

            var maindiv = document.createElement('div');
            maindiv.id = "app-dirac-welcome"
            maindiv.style = welcome.style
            var textdiv = document.createElement('div')
            textdiv.className = "app-dirac-welcome-text"
            textdiv.innerHTML = '<h1>' + welcome.title + '</h1>' + welcome.text
            // If not registred user
            if (!GLOBAL.APP.configData.user.username) {
                var addtextdiv = document.createElement('div')
                addtextdiv.id = "app-dirac-welcome-visitor"
                addtextdiv.innerHTML = '<h2>' + welcome.visitor_title + '</h2>' + welcome.visitor_text
                textdiv.appendChild(addtextdiv)
            }
            var closebtn = document.createElement('button')
            closebtn.id = "app-dirac-welcome-close"
            closebtn.textContent = 'x'
            closebtn.onclick = function(){maindiv.style.visibility = "hidden"}
            maindiv.append(textdiv)
            maindiv.append(closebtn)
            document.body.appendChild(maindiv)
        }
    }
});