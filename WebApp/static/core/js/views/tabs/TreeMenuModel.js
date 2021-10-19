/**
 *It is used to build the menu. The menu is built using the states which are saved to the database.
 */
Ext.define("Ext.dirac.views.tabs.TreeMenuModel", {
  extend: "Ext.data.Model",
  fields: ["text", "type", "application", "stateToLoad", "desktop", "isShared", "view", "stateType"],
  alias: "widget.treemenumodel",
});
