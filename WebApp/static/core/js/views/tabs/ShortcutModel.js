/**
 * @class Ext.ux.desktop.ShortcutModel
 * @extends Ext.data.Model This model defines the minimal set of fields for
 *          desktop shortcuts.
 */
Ext.define('Ext.dirac.views.tabs.ShortcutModel', {
	extend : 'Ext.data.Model',
	fields : [ {
		name : 'name'
	}, {
		name : 'iconCls'
	}, {
		name : 'module'
	} ]
});
