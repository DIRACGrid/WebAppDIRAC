/*******************************************************************************
 * It is a text filed which is used by the selector.
 */
Ext.define("Ext.dirac.utils.DiracTextField", {
  extend: "Ext.form.field.Text",
  fieldLabel: "",
  labelAlign: "top",
  anchor: "100%",
  canDisable: true,
  disableValidator: false,
  validator: function (value) {
    var me = this;

    if (!me.canDisable) return true;
    if (me.disableValidator) return true;
    if (Ext.util.Format.trim(value) != "") {
      me.scope.disableElements(me);
      return true;
    } else {
      me.disableValidator = true;
      me.scope.enableElements();
      return true;
    }
  },
  enableKeyEvents: true,
  listeners: {
    keypress: function (oTextField, e, eOpts) {
      var me = this;
      me.disableValidator = false;
      // it disables all the widgets except this.
      if (e.getCharCode() == 13) {
        me.scope.oprLoadGridData();
      }
    },
  },
});
