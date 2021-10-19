/*******************************************************************************
 * It creates an Dirac specific ArrayStore. It can be used to see the different
 * in a grid panel.
 *
 *
 * <pre>
 * var dataStore = Ext.create(&quot;Ext.dirac.utils.DiracArrayStore&quot;, {
 *       fields : [&quot;key&quot;, &quot;value&quot;, &quot;code&quot;, &quot;color&quot;],
 *       oDiffFields : {
 *         'Id' : 'key',
 *         'Fields' : [&quot;value&quot;]
 *       },
 *       scope : me
 *     });
 * </pre>
 *
 * The dataStore is used by {@link Ext.dirac.utils.DiracGridPanel} oDiffFields
 * has two keys. The Id is the row identifier while the Fields a list which
 * contains a list of columns... -scope: it is a pointer to the application.
 */
Ext.define("Ext.dirac.utils.DiracArrayStore", {
  extend: "Ext.data.ArrayStore",

  oDiffFields: null,
  /**
   * @cfg{Object} diffValues it stores the values which are given by
   *              oDiffFields before refresh.
   */
  diffValues: {},
  /**
   * @property{Ext.data.Operation} lastDataRequest it stores the latest
   *                               {@link Ext.data.Operation}, which is
   *                               used to cancel the AJAX request.
   */
  lastDataRequest: null,
  /**
   * it returns the values for a given fields.
   *
   * @return{Object} returns the saved values.
   */
  getDiffValues: function () {
    var me = this;
    return me.diffValues;
  },
  /**
   * It returns the row identifier.
   * @return {String} it is the DataIndex of a row.
   */
  getDiffId: function () {
    var me = this;
    return me.oDiffFields["Id"];
  },
  /**
   * It is a private member, which used to not save the difference when a
   * remove operation is performed.
   *
   * @type Boolean
   */
  doAddDiff: true,

  listeners: {
    beforeload: function (oStore, oOperation, eOpts) {
      var me = this;

      var me = this;

      if (me.oDiffFields) {
        for (var i = 0; i < records.length; i++) {
          me.diffValues[records[i].data[me.oDiffFields.Id]] = {};
          for (var j = 0; j < me.oDiffFields.Fields.length; j++) {
            me.diffValues[records[i].data[me.oDiffFields.Id]][me.oDiffFields.Fields[j]] = records[i].data[me.oDiffFields.Fields[j]];
          }
        }
      }
    },
    add: function (store, records, index, eOpts) {
      var me = this;

      if (me.doAddDiff) {
        if (me.oDiffFields) {
          for (var i = 0; i < records.length; i++) {
            me.diffValues[records[i].data[me.oDiffFields.Id]] = {};
            for (var j = 0; j < me.oDiffFields.Fields.length; j++) {
              me.diffValues[records[i].data[me.oDiffFields.Id]][me.oDiffFields.Fields[j]] = records[i].data[me.oDiffFields.Fields[j]];
            }
          }
        }
      }
    },

    clear: function (store, records, indexes, isMove, eOpts) {
      var me = this;
      me.doAddDiff = false;
      if (me.oDiffFields) {
        for (var i = 0; i < records.length; i++) {
          me.diffValues[records[i].data[me.oDiffFields.Id]] = {};
          for (var j = 0; j < me.oDiffFields.Fields.length; j++) {
            me.diffValues[records[i].data[me.oDiffFields.Id]][me.oDiffFields.Fields[j]] = records[i].data[me.oDiffFields.Fields[j]];
          }
        }
      }
    },
  },
});
