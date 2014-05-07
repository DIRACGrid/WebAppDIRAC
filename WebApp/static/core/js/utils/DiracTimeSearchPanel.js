/*******************************************************************************
 * This widget is used by the Ext.dirac.utils.DiracBaseSelector widget. It
 * allows to select time in the selector.
 */
Ext.define('Ext.dirac.utils.DiracTimeSearchPanel', {
      extend : 'Ext.panel.Panel',
      requires : ['Ext.data.ArrayStore'],
      width : 200,
      autoHeight : true,
      border : true,
      bodyPadding : 5,
      layout : "anchor",
      anchor : "100%",
      timeSearchElementsGroup : {},
      getStateData : function() {
        var me = this;
        var data = {
          cmbTimeSpan : me.timeSearchElementsGroup.cmbTimeSpan.getValue(),
          calenFrom : me.timeSearchElementsGroup.calenFrom.getValue(),
          cmbTimeFrom : me.timeSearchElementsGroup.cmbTimeFrom.getValue(),
          calenTo : me.timeSearchElementsGroup.calenTo.getValue(),
          cmbTimeTo : me.timeSearchElementsGroup.cmbTimeTo.getValue(),
          timeSearchPanelHidden : me.hidden
        };
        return data;
      },
      loadState : function(data) {
        var me = this;
        if (data.timeSearchPanelHidden) {
          if (!data.timeSearchPanelHidden)
            me.show();
          else
            me.hide();
        }
        // END - For the time span searching sub-panel

        if (data.cmbTimeSpan) {
          me.timeSearchElementsGroup.cmbTimeSpan.setValue(data.cmbTimeSpan);
        }

        if (data.calenFrom) {
          me.timeSearchElementsGroup.calenFrom.setValue(data.calenFrom);
        }
        if (data.cmbTimeFrom) {
          me.timeSearchElementsGroup.cmbTimeFrom.setValue(data.cmbTimeFrom);
        }

        if (data.calenTo) {
          me.timeSearchElementsGroup.calenTo.setValue(data.calenTo);
        }
        if (data.cmbTimeTo) {
          me.timeSearchElementsGroup.cmbTimeTo.setValue(data.cmbTimeTo);
        }

      },
      constructor : function() {
        var me = this;
        me.timeSearchElementsGroup.cmbTimeSpan = new Ext.create('Ext.form.field.ComboBox', {
              labelAlign : 'top',
              fieldLabel : 'Time Span',
              store : new Ext.data.ArrayStore({
                    fields : ['value', 'text'],
                    data : [[1, "Last Hour"], [2, "Last Day"], [3, "Last Week"], [4, "Last Month"], [5, "Manual Selection"]]
                  }),
              displayField : "text",
              valueField : "value",
              anchor : "100%",
              listeners : {
                change : function(cmb, newValue, oldValue, eOpts) {
                  alert('change');
                }
              }
            });

        var oTimeData = [];
        for (var i = 0; i < 24; i++) {
          oTimeData.push([((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":00"]);
          oTimeData.push([((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":30"]);
        }

        me.timeSearchElementsGroup.calenFrom = new Ext.create('Ext.form.field.Date', {
              width : 100,
              format : 'Y-m-d'
            });

        me.timeSearchElementsGroup.cmbTimeFrom = new Ext.create('Ext.form.field.ComboBox', {
              width : 70,
              store : new Ext.data.ArrayStore({
                    fields : ['value'],
                    data : oTimeData
                  }),
              margin : "0 0 0 10",
              displayField : 'value'
            });

        me.timeSearchElementsGroup.calenTo = new Ext.create('Ext.form.field.Date', {
              width : 100,
              format : 'Y-m-d'
            });

        me.timeSearchElementsGroup.cmbTimeTo = new Ext.create('Ext.form.field.ComboBox', {
              width : 70,
              store : new Ext.data.ArrayStore({
                    fields : ['value'],
                    data : oTimeData
                  }),
              margin : "0 0 0 10",
              displayField : 'value'
            });

        me.timeSearchElementsGroup.btnResetTimePanel = new Ext.Button({

              text : 'Reset Time Panel',
              margin : 3,
              iconCls : "dirac-icon-reset",
              handler : function() {

                me.timeSearchElementsGroup.cmbTimeTo.setValue(null);
                me.timeSearchElementsGroup.cmbTimeFrom.setValue(null);
                me.timeSearchElementsGroup.calenTo.setRawValue("");
                me.timeSearchElementsGroup.calenFrom.setRawValue("");
                me.timeSearchElementsGroup.cmbTimeSpan.setValue(null);
              },
              scope : me,
              defaultAlign : "c"
            });
        Ext.apply(me, {
              dockedItems : [{
                    xtype : 'toolbar',
                    dock : 'bottom',
                    items : [me.timeSearchElementsGroup.btnResetTimePanel],
                    layout : {
                      type : 'hbox',
                      pack : 'center'
                    }
                  }],
              items : [me.timeSearchElementsGroup.cmbTimeSpan, {
                    xtype : 'tbtext',
                    text : "From:",
                    padding : "3 0 3 0"
                  }, {
                    xtype : "panel",
                    layout : "column",
                    border : false,
                    items : [me.timeSearchElementsGroup.calenFrom, me.timeSearchElementsGroup.cmbTimeFrom]
                  }, {
                    xtype : 'tbtext',
                    text : "To:",
                    padding : "3 0 3 0"
                  }, {
                    xtype : "panel",
                    layout : "column",
                    border : false,
                    items : [me.timeSearchElementsGroup.calenTo, me.timeSearchElementsGroup.cmbTimeTo]
                  }]
            });
        me.callParent(arguments);
      },
      getSelectedData : function() {
        var me = this;
        var data = {};
        // if a value in time span has been selected
        var sStartDate = me.timeSearchElementsGroup.calenFrom.getRawValue();
        var sStartTime = me.timeSearchElementsGroup.cmbTimeFrom.getValue();
        var sEndDate = me.timeSearchElementsGroup.calenTo.getRawValue();
        var sEndTime = me.timeSearchElementsGroup.cmbTimeTo.getValue();

        var iSpanValue = me.timeSearchElementsGroup.cmbTimeSpan.getValue();

        if ((iSpanValue != null) && (iSpanValue != 5)) {

          var oNowJs = new Date();
          var oBegin = null;

          switch (iSpanValue) {
            case 1 :
              oBegin = Ext.Date.add(oNowJs, Ext.Date.HOUR, -1);
              break;
            case 2 :
              oBegin = Ext.Date.add(oNowJs, Ext.Date.DAY, -1);
              break;
            case 3 :
              oBegin = Ext.Date.add(oNowJs, Ext.Date.DAY, -7);
              break;
            case 4 :
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
        data["startTime"] = sStartTime;
        data["endDate"] = sEndDate;
        data["endTime"] = sEndTime;
        return data;
      }
    });