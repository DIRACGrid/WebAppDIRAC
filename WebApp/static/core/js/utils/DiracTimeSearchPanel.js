/*******************************************************************************
 * This widget is used by the Ext.dirac.utils.DiracBaseSelector widget. It
 * allows to select time in the selector.
 */
Ext.define("Ext.dirac.utils.DiracTimeSearchPanel", {
  extend: "Ext.panel.Panel",
  requires: ["Ext.data.ArrayStore"],
  width: 200,
  autoHeight: true,
  border: true,
  bodyPadding: 5,
  layout: "anchor",
  anchor: "100%",
  /*************************************************************************
   * @property{It is the time stamp widget which contains a list with Last hour, Last Day...}
   */
  cmbTimeSpan: null,
  /**
   *
   * @property{calenFrom} it is a calendar used to select the date.
   */
  calenFrom: null,
  /**
   *
   * @property{cmbTimeFrom} is is a combo box which contains the hours.
   */
  cmbTimeFrom: null,
  /**
   *
   * @property{calenTo} is a calendar used to select the dat.
   */
  calenTo: null,
  /**
   *
   * @property{cmbTimeTo} is a combo box used to select the time in a given day.
   */
  cmbTimeTo: null,
  /**
   *
   * @property{timeSearchPanelHidden} is a boolean which is true when the time search panel is hidden...
   */
  timeSearchPanelHidden: null,
  getStateData: function () {
    var me = this;
    var data = {
      cmbTimeSpan: me.cmbTimeSpan.getValue(),
      calenFrom: me.calenFrom.getValue(),
      cmbTimeFrom: me.cmbTimeFrom.getValue(),
      calenTo: me.calenTo.getValue(),
      cmbTimeTo: me.cmbTimeTo.getValue(),
      timeSearchPanelHidden: me.hidden,
    };
    return data;
  },
  loadState: function (data) {
    var me = this;

    data.timeSearchPanelHidden ? me.hide : me.show();
    // END - For the time span searching sub-panel

    if (data.cmbTimeSpan) {
      me.cmbTimeSpan.setValue(data.cmbTimeSpan);
    }

    if (data.calenFrom) {
      me.calenFrom.setValue(data.calenFrom);
    }
    if (data.cmbTimeFrom) {
      me.cmbTimeFrom.setValue(data.cmbTimeFrom);
    }

    if (data.calenTo) {
      me.calenTo.setValue(data.calenTo);
    }
    if (data.cmbTimeTo) {
      me.cmbTimeTo.setValue(data.cmbTimeTo);
    }
  },
  constructor: function () {
    var me = this;
    me.cmbTimeSpan = new Ext.create("Ext.form.field.ComboBox", {
      labelAlign: "top",
      fieldLabel: "Time Span",
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: [
          [0, "For all time"],
          [1, "Last Hour"],
          [2, "Last Day"],
          [3, "Last Week"],
          [4, "Last Month"],
          [5, "Manual Selection"],
        ],
      }),
      emptyText: "For all time?",
      editable: false,
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      onChange: function (newVal) {
        if (newVal == 5) {
          me.fromDate.items.forEach((e) => e.show());
          me.toDate.items.forEach((e) => e.show());
          if (me.calenFrom.getRawValue() || me.cmbTimeFrom.getValue() || me.calenTo.getRawValue() || me.cmbTimeTo.getValue()) {
            me.resetDate.items.forEach((e) => e.show());
          }
        } else {
          me.fromDate.items.forEach((e) => e.hide());
          me.toDate.items.forEach((e) => e.hide());
          me.resetDate.items.forEach((e) => e.hide());
        }
      },
    });

    me.calenFrom = new Ext.create("Ext.form.field.Date", {
      labelAlign: "top",
      fieldLabel: "From",
      flex: 3,
      format: "Y-m-d",
      hidden: true,
      onChange: function (newVal) {
        if (newVal) {
          me.resetDate.items.forEach((e) => e.show());
        }
      },
    });

    me.cmbTimeFrom = new Ext.create("Ext.form.field.Time", {
      format: "H:i",
      flex: 2,
      increment: 30,
      margin: "0 0 0 10",
      hidden: true,
      onChange: function (newVal) {
        if (!me.calenFrom.getValue()) {
          me.calenFrom.setValue(new Date());
        }
      },
    });

    me.fromDate = {
      xtype: "panel",
      layout: {
        type: "hbox",
        align: "bottom",
      },
      border: false,
      margin: "0 0 5 0",
      items: [me.calenFrom, me.cmbTimeFrom],
    };

    me.calenTo = new Ext.create("Ext.form.field.Date", {
      labelAlign: "top",
      fieldLabel: "To",
      labelStyle: "width:20px",
      flex: 3,
      format: "Y-m-d",
      hidden: true,
      onChange: function (newVal) {
        if (newVal) {
          me.resetDate.items.forEach((e) => e.show());
        }
      },
    });

    me.cmbTimeTo = new Ext.create("Ext.form.field.Time", {
      format: "H:i",
      flex: 2,
      increment: 30,
      margin: "0 0 0 10",
      hidden: true,
      onChange: function (newVal) {
        if (!me.calenTo.getValue()) {
          me.calenTo.setValue(new Date());
        }
      },
    });

    me.toDate = {
      xtype: "panel",
      layout: {
        type: "hbox",
        align: "bottom",
      },
      border: false,
      margin: "0 0 5 0",
      items: [me.calenTo, me.cmbTimeTo],
    };

    me.btnResetTimePanel = new Ext.Button({
      text: "Reset Time Panel",
      margin: 3,
      iconCls: "dirac-icon-reset",
      handler: function () {
        me.cmbTimeTo.setValue(null);
        me.cmbTimeFrom.setValue(null);
        me.calenTo.setRawValue("");
        me.calenFrom.setRawValue("");
        me.btnResetTimePanel.hide();
      },
      scope: me,
      hidden: true,
    });

    me.resetDate = {
      xtype: "toolbar",
      layout: {
        type: "hbox",
        pack: "center",
      },
      border: false,
      items: [me.btnResetTimePanel],
    };

    Ext.apply(me, {
      items: [me.cmbTimeSpan, me.fromDate, me.toDate, me.resetDate],
    });
    me.callParent(arguments);
  },
  /*************************************************************************
   * This function returns the selected timestamp.
   *
   * @return {Object}
   */
  getSelectedData: function () {
    var me = this;
    var data = {};
    // if a value in time span has been selected
    var sStartDate, sStartTime, sEndDate, sEndTime;

    var iSpanValue = me.cmbTimeSpan.getValue();

    if (iSpanValue == null && iSpanValue == 0) {
      sStartDate = null;
      sStartTime = null;
      sEndDate = null;
      sEndTime = null;
    } else if (iSpanValue == 5) {
      sStartDate = me.calenFrom.getRawValue();
      sStartTime = me.cmbTimeFrom.getValue();
      sEndDate = me.calenTo.getRawValue();
      sEndTime = me.cmbTimeTo.getValue();
    } else {
      var oLocalNowJs = new Date();
      var oNowJs = Ext.Date.add(oLocalNowJs, Ext.Date.MINUTE, oLocalNowJs.getTimezoneOffset());
      var oBegin = null;

      switch (iSpanValue) {
        case 1:
          oBegin = Ext.Date.add(oNowJs, Ext.Date.HOUR, -1);
          break;
        case 2:
          oBegin = Ext.Date.add(oNowJs, Ext.Date.DAY, -1);
          break;
        case 3:
          oBegin = Ext.Date.add(oNowJs, Ext.Date.DAY, -7);
          break;
        case 4:
          oBegin = Ext.Date.add(oNowJs, Ext.Date.MONTH, -1);
          break;
      }

      sStartDate = Ext.Date.format(oBegin, "Y-m-d");
      sEndDate = Ext.Date.format(oNowJs, "Y-m-d");
      sStartTime = Ext.Date.format(oBegin, "H:i");
      sEndTime = Ext.Date.format(oNowJs, "H:i");
    }

    // Collect data for filtration
    data["startDate"] = sStartDate;
    data["startTime"] = sStartTime && !(typeof sStartTime === "string") ? sStartTime.getHours() + ":" + sStartTime.getMinutes() : sStartTime;
    data["endDate"] = sEndDate;
    data["endTime"] = sEndTime && !(typeof sEndTime === "string") ? sEndTime.getHours() + ":" + sEndTime.getMinutes() : sEndTime;
    return data;
  },
});
