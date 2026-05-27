/*
 * ! Ext JS Library 4.0 Copyright(c) 2006-2011 Sencha Inc. licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define("DIRAC.Notepad.classes.Notepad", {
  extend: "Ext.dirac.core.Module",

  requires: ["Ext.form.field.TextArea"],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Notepad";
    me.launcher.maximized = false;
    me.launcher.width = 400;
    me.launcher.height = 400;

    me.editor = new Ext.form.field.TextArea({
      value: ["Some text goes here.", "Give it a try!"].join("\n"),
      grow: true,
      growMin: 200,
      enableKeyEvents: true,
    });

    Ext.apply(me, {
      layout: "fit",
      items: [me.editor],
    });

    me.callParent(arguments);
  },

  loadState: function (data) {
    var me = this;

    if ("helptext" in data) {
      me.editor.setValue(String(data["helptext"] || ""));
    }
    if ("text" in data) {
      me.editor.setValue(String(data["text"] || ""));
    }
  },

  getStateData: function () {
    var me = this;
    return {
      text: me.editor.getValue(),
    };
  },
  getValue: function () {
    var me = this;
    return me.editor.getValue();
  },
});
