/**
 * @class Ext.dirac.core.StateManagement This class manages the state management
 *        within the Desktop view
 *
 */

Ext.define("Ext.dirac.core.Container", {
  createChildWindow: function (sTitle, bModal, iWidth, iHeight) {},
  oprPrepareAndShowWindowGrid: function (oData, sTitle, oFields, oColumns, menu) {
    var me = this;

    var oStore = new Ext.data.ArrayStore({
      fields: oFields,
      data: oData,
    });

    var oWindow = me.createChildWindow(sTitle, false, 700, 500);

    var oGrid = Ext.create("Ext.grid.Panel", {
      store: oStore,
      columns: oColumns,
      stateful: true,
      stateId: "ContainerGrid",
      width: "100%",
      viewConfig: {
        stripeRows: true,
        enableTextSelection: true,
        listeners: {
          render: function (view) {
            var grid = this;

            // record the current cellIndex
            grid.mon(view, {
              uievent: function (type, view, cell, recordIndex, cellIndex, e) {
                grid.cellIndex = cellIndex;
                grid.recordIndex = recordIndex;
              },
            });

            grid.tip = Ext.create("Ext.tip.ToolTip", {
              target: view.el,
              delegate: ".x-grid-cell",
              trackMouse: true,
              renderTo: Ext.getBody(),
              listeners: {
                beforeshow: function updateTipBody(tip) {
                  if (!Ext.isEmpty(grid.cellIndex) && grid.cellIndex !== -1) {
                    header = grid.headerCt.getGridColumns()[grid.cellIndex];
                    tip.update(grid.getStore().getAt(grid.recordIndex).get(header.dataIndex));
                  }
                },
              },
            });
          },
          destroy: function (view) {
            delete view.tip; // Clean up this property on destroy.
          },
        },
      },
      menu: null,
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
    });

    if (menu) {
      var oMenu = new Ext.menu.Menu();
      for (var i in menu) {
        oMenu.add({
          text: menu[i].text,
          handler: menu[i].handler.bind(oGrid, ...(menu[i].arguments || [])),
        });
      }
      oGrid.menu = oMenu;
    }

    oWindow.add(oGrid);
    oWindow.show().removeCls("x-unselectable"); // Todo: this can be removed after ext-6.2.0;
  },
  showValue: function (grid) {
    var me = this;
    var sValue = GLOBAL.APP.CF.getSelectedValue(grid);
    Ext.Msg.minWidth = 360;
    Ext.Msg.alert("Cell value is:", sValue);
  },
  showInWindow: function (sTitle, panel) {
    var me = this;
    var oWindow = me.createChildWindow(sTitle, false, 700, 500);
    oWindow.add(panel);
    oWindow.show().removeCls("x-unselectable"); // Todo: this can be removed after ext-6.2.0;
  },
  oprPrepareAndShowWindowText: function (sTextToShow, sTitle) {
    var me = this;

    var oWindow = me.createChildWindow(sTitle, false, 700, 500);

    var oTextArea = Ext.create("Ext.form.field.TextArea", {
      value: sTextToShow,
      cls: "jm-textbox-help-window",
    });

    oWindow.add(oTextArea);
    oWindow.show().removeCls("x-unselectable"); // Todo: this can be removed after ext-6.2.0;
  },
  /**
   * it is used to show an URL in a window.
   *
   * @param {String}
   *          url
   * @param {String}
   *          title is the title of the window
   */
  oprPrepareAndShowWindowHTML: function (url, title) {
    var me = this;
    var window = me.createChildWindow(title, false, 700, 500);
    var htmlPanel = Ext.create("Ext.panel.Panel", {
      layout: "fit",
      items: [
        {
          xtype: "component",

          autoEl: {
            tag: "iframe",
            src: url,
          },
        },
      ],
    });
    window.add(htmlPanel);
    window.show().removeCls("x-unselectable"); // Todo: this can be removed after ext-6.2.0;
  },

  oprShowInNewTab: function (url, title) {
    var win = window.open(url, "_blank");
    if (win == null || typeof win == "undefined") {
      Ext.dirac.system_info.msg("Error Notification", 'Please disable your pop-up blocker and click the "same component" again.');
    } else {
      win.focus();
    }
  },
  oprPrepareAndShowWindowTpl: function (tplMarkup, tplData, sTitle) {
    var me = this;

    var oWindow = me.createChildWindow(sTitle, false, 700, 400);

    var tpl = new Ext.Template(tplMarkup);

    var oPanel = Ext.create("Ext.panel.Panel", {
      html: tpl.apply(tplData),
      scrollable: true,
    });
    oWindow.add(oPanel);
    oWindow.show().removeCls("x-unselectable"); // Todo: this can be removed after ext-6.2.0
  },
});
