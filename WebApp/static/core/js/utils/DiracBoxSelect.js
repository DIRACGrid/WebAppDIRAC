Ext.define('Ext.dirac.utils.DiracBoxSelect', {
      extend : "Ext.form.field.Tag",
      requires : ["Ext.form.field.Tag"],
      filterPickList : true,
      multiSelect : true,
      isInverseSelection : function() {
        return false;
      },
      setInverseSelection : function(bInverseSelection) {
        if (bInverseSelection) {
          Ext.Logger.warn("Invers selection is not supported in extjs 6!");
        }
      }
    });