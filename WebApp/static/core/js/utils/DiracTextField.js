/*******************************************************************************
 * It is a text filed which is used by the selector.
 */
Ext.define('Ext.dirac.utils.DiracTextField', {
      extend : 'Ext.form.field.Text',
      fieldLabel : "",
      labelAlign : 'top',
      anchor : "100%",
      canDisable : true,

      validator : function(value) {
        var me = this;

        if (Ext.util.Format.trim(value) != "") {
          me.scope.disableElements(me);
          return true;

        } else {
          me.scope.enableElements();
          return true;
        }
      },
      enableKeyEvents : true,
      listeners : {

        keypress : function(oTextField, e, eOpts) {
          var me = this;

          //it disables all the widgets except this.
          if (e.getCharCode() == 13) {

            me.scope.oprLoadGridData();

          }

        }
      }
    });