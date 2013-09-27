/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('DIRAC.JobLaunchpad.classes.JobLaunchpad', {
	extend : 'Ext.dirac.core.Module',

	requires : [ 'Ext.panel.Panel', 'Ext.form.FieldSet', "Ext.menu.CheckItem", 'Ext.button.Button', 'Ext.toolbar.Toolbar', 'Ext.form.Panel' ],

	initComponent : function() {

		var me = this;

		me.launcher.title = "Job Launchpad";
		me.launcher.maximized = false;

		me.launcher.width = 600;
		me.launcher.height = 600;

		me.launcher.x = 0;
		me.launcher.y = 0;

		Ext.apply(me, {
			layout : 'border',
			bodyBorder : false,
			defaults : {
				collapsible : true,
				split : true
			}
		});

		me.callParent(arguments);

	},

	buildUI : function() {

		var me = this;

		me.fsetJdlSection = Ext.create('Ext.form.FieldSet', {
			title : 'JDL',
			collapsible : true,
			layout : 'anchor',
			padding : 5
		});

		me.fsetInputSandboxSection = Ext.create('Ext.form.FieldSet', {
			title : 'Input Sandbox',
			collapsible : true,
			layout : 'anchor',
			padding : 5
		});

		me.fsetInputSandboxSection.add(me.uploadField);

		me.textualFields = {
			"JobName" : {
				mandatory : true,
				object : null
			},
			"Executable" : {
				mandatory : true,
				object : null
			},
			"Arguments" : {
				mandatory : true,
				object : null
			},
			"OutputSandbox" : {
				mandatory : true,
				object : null
			},
			"InputData" : {
				mandatory : false,
				object : null
			},
			"OutputData" : {
				mandatory : false,
				object : null
			},
			"OutputSE" : {
				mandatory : false,
				object : null
			},
			"OutputPath" : {
				mandatory : false,
				object : null
			},
			"CPUTime" : {
				mandatory : false,
				object : null
			},
			"Site" : {
				mandatory : false,
				object : null
			},
			"BannedSite" : {
				mandatory : false,
				object : null
			},
			"Platform" : {
				mandatory : false,
				object : null
			},
			"Priority" : {
				mandatory : false,
				object : null
			},
			"StdError" : {
				mandatory : false,
				object : null
			},
			"StdOutput" : {
				mandatory : false,
				object : null
			},
			"Parameters" : {
				mandatory : false,
				object : null
			},
			"ParameterStart" : {
				mandatory : false,
				object : null
			},
			"ParameterStep" : {
				mandatory : false,
				object : null
			}
		};

		me.btnAddParameters = new Ext.Button({

			text : 'Add Parameters',
			iconCls : "jl-plus-icon",
			handler : function() {

			},
			scope : me,
			menu : []

		});

		for ( var sKey in me.textualFields) {

			if (me.textualFields[sKey].mandatory) {

				me.textualFields[sKey].object = new Ext.create('Ext.form.field.Text', {
					fieldLabel : sKey,
					anchor : '100%',
					labelAlign : 'left'
				});

			} else {

				me.textualFields[sKey].object = new Ext.create('Ext.form.field.Text', {
					fieldLabel : sKey,
					anchor : '100%',
					labelAlign : 'left',
					hidden : true
				});

				me.btnAddParameters.menu.add({
					xtype : 'menucheckitem',
					text : sKey,
					relatedCmbField : sKey,
					checked : false,
					handler : function(item, e) {

						var me = this;

						if (item.checked)
							me.textualFields[item.relatedCmbField].object.show();
						else
							me.textualFields[item.relatedCmbField].object.hide();

					},
					scope : me
				});

			}

			me.fsetJdlSection.add(me.textualFields[sKey].object);

		}

		var oTopToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'top',
			items : [ {
				xtype : "button",
				text : "Proxy Status:",

			}, '->', me.btnAddParameters ]
		});

		me.btnSubmit = new Ext.Button({

			text : 'Submit',
			margin : 1,
			iconCls : "jl-submit-icon",
			handler : function() {

			},
			scope : me

		});

		me.btnReset = new Ext.Button({

			text : 'Reset',
			margin : 1,
			iconCls : "jl-reset-icon",
			handler : function() {

			},
			scope : me

		});

		me.btnClose = new Ext.Button({

			text : 'Close',
			margin : 1,
			iconCls : "jl-close-icon",
			handler : function() {

			},
			scope : me

		});

		var oBottomToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'bottom',
			layout : {
				pack : 'center'
			},
			items : [ me.btnSubmit, me.btnReset, me.btnClose ]
		});

		var oMainPanel = new Ext.create('Ext.form.Panel', {
			floatable : false,
			region : "center",
			layout : "anchor",
			header : false,
			bodyPadding : 5,
			autoScroll : true,
			dockedItems : [ oTopToolbar, oBottomToolbar ],
			items : [ me.fsetJdlSection, me.fsetInputSandboxSection ]
		});
		
		me.oprAddNewFileField();
		
		me.add([ oMainPanel ]);

	},

	oprAddNewFileField : function() {
		
		var me = this;
		
		var oFileField = new Ext.create('Ext.form.field.File', {
			anchor : '100%',
			buttonText : 'Browse',
			moduleObject: me,
			listeners:{
				
				change:function( oComp, sValue, eOpts ){
					
					if(sValue!="")
						oComp.moduleObject.oprAddNewFileField();
					
				}
				
			}
		});

		me.fsetInputSandboxSection.add(oFileField);

	}

});
