/*******************************************************************************
 * It is a simple GridPanel.
 */
Ext.define("Ext.dirac.utils.GridPanel", {
  extend: "Ext.grid.Panel",
  requires: ["Ext.data.ArrayStore"],
  width: "100%",
  viewConfig: {
    stripeRows: true,
    enableTextSelection: true,
    getRowClass: function () {
      return this.enableTextSelection ? "x-selectable" : "";
    },
  },
  menu: null,
  scrollable: true,
  listeners: {
    beforecellcontextmenu: function (oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
      e.preventDefault();
      var me = this;
      if (me.menu) {
        me.menu.showAt(e.getXY());
      }
      return false;
    },
  },
  initComponent: function () {
    var me = this;

    me.dataStore = new Ext.data.JsonStore({
      params: me.params,
      proxy: {
        type: "ajax",
        url: me.url,
        extraParams: me.params,
        reader: {
          type: "json",
          rootProperty: "result",
        },
        timeout: 1800000,
        listeners: {
          exception: function (proxy, response, operation) {
            GLOBAL.APP.CF.showAjaxErrorMessage(response);
          },
        },
      },

      // alternatively, a Ext.data.Model name can be given
      // (see Ext.data.Store for an example)
      fields: me.oFields,
      autoLoad: true,
      remoteSort: false,
      pageSize: 25,
      listeners: {
        load: function (oStore, records, successful, eOpts) {
          if (oStore.proxy.reader.rawData) me.pagingToolbar.updateStamp.setText("Updated: " + oStore.proxy.reader.rawData["date"]);

          me.dataStore.remoteSort = false;
          me.dataStore.sort();
          me.dataStore.remoteSort = true;
        },

        beforeload: function (oStore, oOperation, eOpts) {
          me.dataStore.lastDataRequest = oOperation;
        },
      },
    });

    me.pagingToolbar = {};
    me.pagingToolbar.updateStamp = new Ext.Button({
      disabled: true,
      // disabledClass:'my-disabled',
      text: "Updated: -",
    });

    me.pagingToolbar.pageSizeCombo = new Ext.form.field.ComboBox({
      allowBlank: false,
      displayField: "number",
      editable: false,
      maxLength: 4,
      maxLengthText: "The maximum value for this field is 1000",
      minLength: 1,
      minLengthText: "The minimum value for this field is 1",
      mode: "local",
      store: new Ext.data.ArrayStore({
        fields: ["number"],
        data: [[25], [50], [100], [200], [500], [1000]],
      }),
      triggerAction: "all",
      value: 25,
      width: 50,
    });

    me.pagingToolbar.pageSizeCombo.on(
      "change",
      function (combo, newValue, oldValue, eOpts) {
        var me = this;
        me.dataStore.pageSize = newValue;
        me.oprLoadGridData();
      },
      me
    );

    var pagingToolbarItems = ["->", me.pagingToolbar.updateStamp, "-", "Items per page: ", me.pagingToolbar.pageSizeCombo, "-"];

    me.pagingToolbar.toolbar = Ext.create("Ext.toolbar.Paging", {
      store: me.dataStore,
      displayInfo: true,
      displayMsg: "Displaying topics {0} - {1} of {2}",
      items: pagingToolbarItems,
      emptyMsg: "No topics to display",
      prependButtons: true,
      scrollable: true,
    });

    Ext.apply(me, {
      tbar: me.pagingToolbar.toolbar,
      store: me.dataStore,
      columns: me.oColumns,
    });
    me.callParent(arguments);
  },
  oprLoadGridData: function () {
    var me = this;
    me.store.proxy.extraParams.limit = me.pagingToolbar.pageSizeCombo.getValue();
    me.store.load();
  },
});
