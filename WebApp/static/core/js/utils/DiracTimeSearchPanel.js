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
      /*************************************************************************
       * @property{It is the time stamp widget which contains a list with Last
       *              hour, Last Day...}
       */
      cmbTimeSpan : null,
      /**
       * 
       * @property{calenFrom} it is a calendar used to select the date.
       */
      calenFrom : null,
      /**
       * 
       * @property{cmbTimeFrom} is is a combo box which contains the hours.
       */
      cmbTimeFrom : null,
      /**
       * 
       * @property{calenTo} is a calendar used to select the dat.
       */
      calenTo : null,
      /**
       * 
       * @property{cmbTimeTo} is a combo box used to select the time in a given
       *                      day.
       */
      cmbTimeTo : null,
      /**
       * 
       * @property{timeSearchPanelHidden} is a boolean which is true when the
       *                                  time search panel is hidden...
       */
      timeSearchPanelHidden : null,
      getStateData : function() {
        var me = this;
        var data = {
          cmbTimeSpan : me.cmbTimeSpan.getValue(),
          calenFrom : me.calenFrom.getValue(),
          cmbTimeFrom : me.cmbTimeFrom.getValue(),
          calenTo : me.calenTo.getValue(),
          cmbTimeTo : me.cmbTimeTo.getValue(),
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
      constructor : function() {
        var me = this;
        me.cmbTimeSpan = new Ext.create('Ext.form.field.ComboBox', {
              labelAlign : 'top',
              fieldLabel : 'Time Span',
              store : new Ext.data.ArrayStore({
                    fields : ['value', 'text'],
                    data : [[1, "Last Hour"], [2, "Last Day"], [3, "Last Week"], [4, "Last Month"], [5, "Manual Selection"]]
                  }),
              displayField : "text",
              valueField : "value",
              anchor : "100%"
            });

        var oTimeData = [];
        for (var i = 0; i < 24; i++) {
          oTimeData.push([((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":00"]);
          oTimeData.push([((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":30"]);
        }

        me.calenFrom = new Ext.create('Ext.form.field.Date', {
              width : 100,
              format : 'Y-m-d'
            });

        me.cmbTimeFrom = new Ext.create('Ext.form.field.ComboBox', {
              width : 70,
              store : new Ext.data.ArrayStore({
                    fields : ['value'],
                    data : oTimeData
                  }),
              margin : "0 0 0 10",
              displayField : 'value'
            });

        me.calenTo = new Ext.create('Ext.form.field.Date', {
              width : 100,
              format : 'Y-m-d'
            });

        me.cmbTimeTo = new Ext.create('Ext.form.field.ComboBox', {
              width : 70,
              store : new Ext.data.ArrayStore({
                    fields : ['value'],
                    data : oTimeData
                  }),
              margin : "0 0 0 10",
              displayField : 'value'
            });

        me.btnResetTimePanel = new Ext.Button({

              text : 'Reset Time Panel',
              margin : 3,
              iconCls : "dirac-icon-reset",
              handler : function() {

                me.cmbTimeTo.setValue(null);
                me.cmbTimeFrom.setValue(null);
                me.calenTo.setRawValue("");
                me.calenFrom.setRawValue("");
                me.cmbTimeSpan.setValue(null);
              },
              scope : me,
              defaultAlign : "c"
            });
        Ext.apply(me, {
              dockedItems : [{
                    xtype : 'toolbar',
                    dock : 'bottom',
                    items : [me.btnResetTimePanel],
                    layout : {
                      type : 'hbox',
                      pack : 'center'
                    }
                  }],
              items : [me.cmbTimeSpan, {
                    xtype : 'tbtext',
                    text : "From:",
                    padding : "3 0 3 0"
                  }, {
                    xtype : "panel",
                    layout : "column",
                    border : false,
                    items : [me.calenFrom, me.cmbTimeFrom]
                  }, {
                    xtype : 'tbtext',
                    text : "To:",
                    padding : "3 0 3 0"
                  }, {
                    xtype : "panel",
                    layout : "column",
                    border : false,
                    items : [me.calenTo, me.cmbTimeTo]
                  }]
            });
        me.callParent(arguments);
      },
      /***
       * This function returns the selected timestamp.
       * @return {Object}
       */
      getSelectedData : function() {
        var me = this;
        var data = {};
        // if a value in time span has been selected
        var sStartDate = me.calenFrom.getRawValue();
        var sStartTime = me.cmbTimeFrom.getValue();
        var sEndDate = me.calenTo.getRawValue();
        var sEndTime = me.cmbTimeTo.getValue();

        var iSpanValue = me.cmbTimeSpan.getValue();

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