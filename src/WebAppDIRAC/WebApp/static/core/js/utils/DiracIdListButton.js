/***
 * This widget is used to show the selected values in a window.You can use it when you click on the first button on the paging tool bar. This class used by {@link Ext.dirac.utils.DiracPagingToolbar}
 *
 */
Ext.define("Ext.dirac.utils.DiracIdListButton", {
  extend: "Ext.Button",
  mixins: ["Ext.dirac.core.Stateful"],
  requires: ["Ext.toolbar.Toolbar", "Ext.panel.Panel", "Ext.data.ArrayStore"],
  text: "",
  iconCls: "dirac-icon-list",
  handler: function () {
    var me = this;
    var oItems = [];

    var oElems = Ext.query("#" + me.id + " input.checkrow");

    for (var i = 0; i < oElems.length; i++) if (oElems[i].checked) oItems.push(oElems[i].value);

    if (oItems.length < 1) {
      GLOBAL.APP.CF.alert("No jobs were selected", "error");
      return;
    } else {
      var oWindow = me.getContainer().createChildWindow("IDs of selected jobs", false, 700, 500);

      var oTextArea = new Ext.create("Ext.form.field.TextArea", {
        value: oItems.join(","),
        cls: "jm-textbox-help-window",
        flex: 1,
      });

      var oCombo = new Ext.form.field.ComboBox({
        allowBlank: false,
        displayField: "character",
        editable: false,
        mode: "local",
        store: new Ext.data.ArrayStore({
          fields: ["character"],
          data: [["SEMI-COLON"], ["COMMA"], ["EMPTY SPACE"]],
        }),
        triggerAction: "all",
        value: "COMMA",
        width: 200,
        idsItems: oItems,
        textArea: oTextArea,
        listeners: {
          change: function (combo, newValue, oldValue, eOpts) {
            switch (newValue) {
              case "SEMI-COLON":
                combo.textArea.setValue(combo.idsItems.join(";"));
                break;
              case "COMMA":
                combo.textArea.setValue(combo.idsItems.join(","));
                break;
              case "EMPTY SPACE":
                combo.textArea.setValue(combo.idsItems.join(" "));
                break;
            }
          },
        },
      });

      var oToolb = new Ext.create("Ext.toolbar.Toolbar", {
        dock: "top",
        idsItems: oItems,
        textArea: oTextArea,
        items: [
          {
            xtype: "button",
            text: "COMMA",
            handler: function () {
              var me = this;
              var parent = me.up("toolbar");

              parent.textArea.setValue(parent.idsItems.join(","));
            },
            toggleGroup: me.id + "-ids-separator",
            allowDepress: false,
          },
          {
            xtype: "button",
            text: "SEMI-COLON",
            handler: function () {
              var me = this;
              var parent = me.up("toolbar");

              parent.textArea.setValue(parent.idsItems.join(";"));
            },
            toggleGroup: me.id + "-ids-separator",

            allowDepress: false,
          },
          {
            xtype: "button",
            text: "EMPTY SPACE",
            handler: function () {
              var me = this;
              var parent = me.up("toolbar");

              parent.textArea.setValue(parent.idsItems.join(" "));
            },
            toggleGroup: me.id + "-ids-separator",

            allowDepress: false,
          },
        ],
      });

      oToolb.items.getAt(0).toggle();

      oWindow.add(
        new Ext.create("Ext.panel.Panel", {
          floatable: false,
          scrollable: true,
          autoHeight: true,
          layout: {
            type: "vbox",
            align: "stretch",
            pack: "start",
          },
          dockedItems: [oToolb],
          items: [oTextArea],
        })
      );

      oWindow.show();
    }
  },
  tooltip: "Get Selected IDs",
});
