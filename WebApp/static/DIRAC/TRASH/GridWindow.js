/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('DIRAC.GridWindow', {
	extend : 'Ext.ux.desktop.Module',

	requires : [ 'Ext.data.JsonStore', 'Ext.util.Format', 'Ext.grid.Panel',
			'Ext.grid.RowNumberer' ],

	init : function(parentApp) {
		this.app = parentApp;
		this.launcher = {
			text : 'Grid Window',
			iconCls : 'icon-grid'
		};
	},

	createWindow : function() {
		var desktop = this.app.getDesktop();

		win = desktop.createWindow({
			title : 'Grid Window',
			width : 740,
			height : 480,
			iconCls : 'icon-grid',
			animCollapse : false,
			constrainHeader : true,
			layout : 'fit',
			items : [ {
				border : false,
				xtype : 'grid',
				store : new Ext.data.Store({
					fields : [ {
						name : 'company'
					}, {
						name : 'price',
						type : 'float'
					}, {
						name : 'change',
						type : 'float'
					}, {
						name : 'pctChange',
						type : 'float'
					} ],
					proxy : {
						type : 'ajax',
						url : 'gridwindow/getGridData',
						reader : {
							type : 'json'
						}
					},
					autoLoad : true
				}),
				columns : [ new Ext.grid.RowNumberer(), {
					text : "Company",
					flex : 1,
					sortable : true,
					dataIndex : 'company'
				}, {
					text : "Price",
					width : 70,
					sortable : true,
					renderer : Ext.util.Format.usMoney,
					dataIndex : 'price'
				}, {
					text : "Change",
					width : 70,
					sortable : true,
					dataIndex : 'change'
				}, {
					text : "% Change",
					width : 70,
					sortable : true,
					dataIndex : 'pctChange'
				} ]
			} ],
			tbar : [ {
				text : 'Add Something',
				tooltip : 'Add a new row',
				iconCls : 'add'
			}, '-', {
				text : 'Options',
				tooltip : 'Modify options',
				iconCls : 'option'
			}, '-', {
				text : 'Remove Something',
				tooltip : 'Remove the selected item',
				iconCls : 'remove'
			} ]
		});

		return win;
	}
});
