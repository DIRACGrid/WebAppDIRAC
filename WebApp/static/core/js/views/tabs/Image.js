/*******************************************************************************
 * It used to show an image in a panel. class Ext.dirac.views.tabs.Image extends
 * Ext.Img
 */
Ext.define("Ext.dirac.views.tabs.Image", {
  extend: "Ext.Img",
  cls: "pointer",
  frame: true,
  panel: null,
  listeners: {
    render: function (oElem, eOpts) {
      var me = this;
      oElem.el.on({
        load: function (evt, ele, opts) {
          var me = this;
          me.panel.setLoading(false);
        },
        scope: me,
      });
    },
  },
  setPanel: function (p) {
    var me = this;
    me.panel = p;
  },
  // resizable: true, we can forget this!!!
});
