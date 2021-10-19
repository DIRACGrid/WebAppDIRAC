/**
 * This class used to expand a row in a Grid Panel. It allows to configure which
 * rows can be expanded:
 *
 * @example
 * me.grid = Ext.create('Ext.dirac.utils.DiracGridPanel', {
 *         store : me.dataStore,
 *         columnLines : true,
 *         enableLocking : true,
 *         width : 600,
 *         height : 300,
 *         oColumns : oColumns,
 *         tbar : pagingToolbar,
 *         contextMenu : me.contextGridMenu,
 *         pagingToolbar : pagingToolbar,
 *         scope : me,
 *         plugins : [{
 *           ptype : 'diracrowexpander',
 *           checkField : {
 *             'CE' : 'Multiple'
 *           },
 *           rowBodyTpl : ['<div id="expanded-Grid-{Site}"> </div>']
 *         }]
 *       });
 */
Ext.define("Ext.dirac.utils.DiracRowExpander", {
  extend: "Ext.grid.plugin.RowExpander",

  alias: "plugin.diracrowexpander",

  checkField: null,

  containValue: null,

  selectRowOnExpand: true,

  getHeaderConfig: function () {
    var me = this;

    return {
      width: 28,
      lockable: false,
      sortable: false,
      resizable: false,
      draggable: false,
      hideable: false,
      menuDisabled: true,
      tdCls: Ext.baseCSSPrefix + "grid-cell-special",
      innerCls: Ext.baseCSSPrefix + "grid-cell-inner-row-expander",
      /*renderer : function(value, metadata) {
           if (!me.grid.ownerLockable) {
                    metadata.tdAttr += ' rowspan="2"';
                }
                return '<div class="' + Ext.baseCSSPrefix + 'grid-row-expander"></div>';
          },*/
      renderer: function (value, metadata) {
        // Only has to span 2 rows if it is not in a lockable grid.
        if (!me.grid.ownerLockable) {
          metadata.tdAttr += ' rowspan="2"';
        }

        if (me.checkField) {
          var html = "";
          for (var key in me.checkField) {
            if (metadata.record.data[key] == me.checkField[key]) {
              html = '<div class="' + Ext.baseCSSPrefix + 'grid-row-expander" role="presentation"></div>';
            }
          }
          return html;
        } else if (me.containValue) {
          var html = "";
          for (var key in me.containValue) {
            if (~metadata.record.data[key].indexOf(me.containValue[key])) {
              html = '<div class="' + Ext.baseCSSPrefix + 'grid-row-expander" role="presentation"></div>';
            }
          }
          return html;
        } else if (me.boolValue) {
          for (var key in me.boolValue) {
            if (metadata.record.data[key] == me.boolValue[key]) {
              html = '<div class="' + Ext.baseCSSPrefix + 'grid-row-expander" role="presentation"></div>';
            }
          }
          return html;
        } else {
          return '<div class="' + Ext.baseCSSPrefix + 'grid-row-expander" role="presentation"></div>';
        }
      },
      processEvent: function (type, view, cell, rowIndex, cellIndex, e, record) {
        if (type == "mousedown" && e.getTarget("." + Ext.baseCSSPrefix + "grid-row-expander")) {
          me.toggleRow(rowIndex, record);
          return me.selectRowOnExpand;
        }
      },
    };
  },
});
