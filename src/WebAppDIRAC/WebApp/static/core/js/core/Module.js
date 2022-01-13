/**
 * @class Ext.dirac.core.Module This is an abstract class that has to be
 *        inherited by every module.
 * @mixin Ext.container.Container
 *
 */
Ext.define("Ext.dirac.core.Module", {
  mixins: ["Ext.dirac.core.Stateful", "Ext.dirac.utils.DiracFileLoad"],
  extend: "Ext.container.Container",

  constructor: function (config) {
    this.launcher = config.launcherElements;
    this.applicationName = config.launcherElements.applicationName;
    this._container = null;
    this.text = "";

    this.callParent();
    this.loadCSS();
  },

  setContainer: function (oContainer) {
    this._container = oContainer;
  },

  getContainer: function () {
    return this._container;
  },

  buildUI: Ext.emptyFn,

  loadCSS: function () {
    var me = this;
    var oSuperClass = me;
    var oCssFilesStack = [];

    do {
      var oParts = oSuperClass.self.getName().split(".");
      oCssFilesStack.push("static/" + oParts[0] + "/" + oParts[1] + "/css/" + oParts[1] + ".css");
      oSuperClass = oSuperClass.superclass;
    } while (oSuperClass.self.getName() != "Ext.dirac.core.Module");

    oCssFilesStack.reverse();

    GLOBAL.APP.mixins.fileLoader.loadFile(
      oCssFilesStack,
      function () {
        var me = this;

        me.buildUI();
      },
      me
    );
  },
  setHelpText: function (data) {
    var me = this;
    if (data.text) {
      me.helptext = data.text;
    }
    if (data.helptext) {
      me.helptext = data.helptext;
    }
  },
  getHelpText: function () {
    var me = this;
    var result = {};
    if (me.helptext) {
      result = {
        helptext: me.helptext,
      };
    }
    return result;
  },
});
