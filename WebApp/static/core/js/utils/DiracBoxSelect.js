Ext.define('Ext.dirac.utils.DiracBoxSelect', {
      extend : "Ext.form.field.Tag",
      // filterPickList : true,
      scrollable : true,
      resisable : true,
      multiSelect : true,
      labelStyle : "width:10;word-wrap:break-word;",
      isInverseSelection : function() {
        return false;
      },
      setInverseSelection : function(bInverseSelection) {
        if (bInverseSelection) {
          Ext.Logger.warn("Invers selection is not supported in extjs 6!");
        }
      },
      loadData : function(data) {
        var me = this;
        var store = me.getStore();
        store.loadData(data);
      }
    });