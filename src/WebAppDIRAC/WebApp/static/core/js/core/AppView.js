/**
 * @class Ext.dirac.core.AppView
 * @extends Ext.panel.Panel
 *
 * This class manages the wallpaper, shortcuts, taskbar, desktop states, and the
 * broadcast part for the window states.
 *
 */
Ext.define("Ext.dirac.core.AppView", {
  extend: "Ext.panel.Panel",
  mixins: ["Ext.dirac.core.Stateful"],

  ID: "",

  getViewMainDimensions: function () {
    return [0, 0];
  },

  getViewId: function () {
    return this.ID;
  },

  createNewModuleContainer: function (oData) {},
});
