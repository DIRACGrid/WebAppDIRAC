/***
 * It is a text filed which is used by the selector.
 */
Ext.define('Ext.dirac.utils.DiracTextField',{
  extend : 'Ext.form.field.Text',
  fieldLabel : "",
  labelAlign : 'top',
  anchor : "100%",
  validator : function(value) {

    if (Ext.util.Format.trim(value) != "") {
      var newValue = "";
      for ( var i = 0; i < value.length; i++) {
        if (value.charAt(i) != ' ')
          newValue += value.charAt(i);
      }
      var regExpr = /^(\d+|\d+-\d+)(,(\d+|\d+-\d+))*$/;

      if (String(newValue).search(regExpr) != -1)
        return true;
      else
        return "The IDs expression is not valid";

    } else
      return true;

  },
  enableKeyEvents : true,
  listeners : {

    keypress : function(oTextField, e, eOpts) {

      if (e.getCharCode() == 13) {

        me.oprLoadGridData();

      }

    }
  }
});