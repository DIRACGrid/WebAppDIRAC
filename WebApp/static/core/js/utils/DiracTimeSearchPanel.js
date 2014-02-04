/***
 * This widget is used by the Ext.dirac.utils.DiracBaseSelector widget. It allows to select time in the selector.
 */
Ext.define('Ext.dirac.utils.DiracTimeSearchPanel',{
  extend : 'Ext.panel.Panel',
  width : 200,
  autoHeight : true,
  border : true,
  bodyPadding : 5,
  layout : "anchor",
  anchor : "100%",
  timeSearchElementsGroup : {},

  initComponent : function(){
    var me = this;
    me.timeSearchElementsGroup.cmbTimeSpan = new Ext.create('Ext.form.field.ComboBox', {
      labelAlign : 'top',
      fieldLabel : 'Time Span',
      store : new Ext.data.SimpleStore({
        fields : [ 'value', 'text' ],
        data : [ [ 1, "Last Hour" ], [ 2, "Last Day" ], [ 3, "Last Week" ], [ 4, "Last Month" ], [ 5, "Manual Selection" ] ]
      }),
      displayField : "text",
      valueField : "value",
      anchor : "100%"
    });

    var oTimeData = [];
    for ( var i = 0; i < 24; i++) {
      oTimeData.push([ ((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":00" ]);
      oTimeData.push([ ((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":30" ]);
    }

    me.timeSearchElementsGroup.calenFrom = new Ext.create('Ext.form.field.Date', {
      width : 100,
      format : 'Y-m-d'
    });

    me.timeSearchElementsGroup.cmbTimeFrom = new Ext.create('Ext.form.field.ComboBox', {
      width : 70,
      store : new Ext.data.SimpleStore({
        fields : [ 'value' ],
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
      store : new Ext.data.SimpleStore({
        fields : [ 'value' ],
        data : oTimeData
      }),
      margin : "0 0 0 10",
      displayField : 'value'
    });

    me.timeSearchElementsGroup.btnResetTimePanel = new Ext.Button({

      text : 'Reset Time Panel',
      margin : 3,
      iconCls : "tm-reset-button-icon",
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
      dockedItems : [ {
      xtype : 'toolbar',
      dock : 'bottom',
      items : [ me.timeSearchElementsGroup.btnResetTimePanel ],
      layout : {
        type : 'hbox',
        pack : 'center'
      }
    }],
    items :[ me.timeSearchElementsGroup.cmbTimeSpan, {
      xtype : 'tbtext',
      text : "From:",
      padding : "3 0 3 0"
    }, {
      xtype : "panel",
      layout : "column",
      border : false,
      items : [ me.timeSearchElementsGroup.calenFrom, me.timeSearchElementsGroup.cmbTimeFrom ]
    }, {
      xtype : 'tbtext',
      text : "To:",
      padding : "3 0 3 0"
    }, {
      xtype : "panel",
      layout : "column",
      border : false,
      items : [ me.timeSearchElementsGroup.calenTo, me.timeSearchElementsGroup.cmbTimeTo ]
    } ]
    });
    me.callParent(arguments);
  }
});