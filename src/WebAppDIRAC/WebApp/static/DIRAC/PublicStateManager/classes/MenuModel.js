Ext.define("DIRAC.PublicStateManager.classes.MenuModel", {
  extend: "Ext.data.Model",
  fields: [
    {
      name: "name",
      type: "string",
    },
    {
      name: "type",
      type: "string",
    },
    {
      name: "user",
      type: "string",
    },
    {
      name: "group",
      type: "string",
    },
    {
      name: "vo",
      type: "string",
    },
    {
      name: "app",
      type: "string",
    },
  ],
});
