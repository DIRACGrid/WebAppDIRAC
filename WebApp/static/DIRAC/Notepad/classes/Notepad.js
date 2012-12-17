/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext
		.define(
				'DIRAC.Notepad.classes.Notepad',
				{
					extend : 'Ext.ux.desktop.Module',

					requires : [ 'Ext.form.field.HtmlEditor'],

					initComponent : function() {

						var me = this;
						
						me.launcher.title = "Notepad";
						
						me.editor = new Ext.form.field.HtmlEditor(
								{
									value : [
											'Some <b>rich</b> <font color="red">text</font> goes <u>here</u><br>',
											'Give it a try!' ].join('')
									
								});

						Ext.apply(me, {
							layout : 'fit',
							items : [ me.editor ]
						});

						me.callParent(arguments);

					},

					loadState : function(data) {

						var me = this;
						me.editor.setValue(data["text"]);

					},

					getStateData : function() {

						var me = this;
						return {
							text : me.editor.getValue()
						};

					}
				});
