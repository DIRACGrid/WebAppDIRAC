/**
 * @class Ext.ux.core.Stateful This is an abstract class that has to be
 *        inherited by every module.
 * @mixin Ext.container.Container
 *
 */
Ext.define("Ext.dirac.core.Stateful", {
  currentState: "",

  /**
   * Function that can be overriden by a module and it is used to get the data
   * defining the current state of a module instance
   *
   * @return {Object}
   */
  getStateData: function () {
    return {};
  },
  /**
   * Function that can be overriden by a module and it is used to load saved
   * state of a module
   *
   * @param {Object}
   *          data Data used to set up the state
   */
  loadState: function (oData) {},
  getHelpText: function () {
    return {};
  },
  setHelpText: function (text) {},
});
