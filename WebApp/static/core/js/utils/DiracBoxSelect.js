Ext.define("Ext.dirac.utils.DiracBoxSelect", {
  extend: "Ext.form.field.Tag",
  scrollable: true,
  resizable: true,
  multiSelect: true,
  isInverseSelection: function () {
    return false;
  },
  setInverseSelection: function (bInverseSelection) {
    if (bInverseSelection) {
      Ext.Logger.warn("Invers selection is not supported in extjs 6!");
    }
  },
  loadData: function (data) {
    var me = this;
    var store = me.getStore();
    store.loadData(data);
  },
});
