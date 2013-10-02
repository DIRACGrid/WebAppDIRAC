/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('DIRAC.ProxyUpload.classes.ProxyUpload', {
	extend : 'Ext.dirac.core.Module',

	requires : [ 'Ext.toolbar.Toolbar', 'Ext.button.Button', 'Ext.form.field.File', 'Ext.form.field.Text', 'Ext.panel.Panel', 'Ext.form.Panel' ],

	initComponent : function() {

		var me = this;

		me.launcher.title = "Proxy Upload";
		me.launcher.maximized = false;

		me.launcher.width = 400;
		me.launcher.height = 400;

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

		me.btnUpload = new Ext.Button({

			text : 'Upload',
			margin : 1,
			iconCls : "pu-upload-icon",
			handler : function() {

				var sFileName = me.uploadField.getValue();
				var sPassword = me.passwordField.getValue();

				if ((sFileName != "") && (sPassword != "")) {

					if (sFileName.substr(-4) != '.p12') {
						alert('You have to choose the *.p12 file with you credentials');
						return;
					}
					
					me.getContainer().body.mask("Wait ...");
					
					me.mainFormPanel.submit({

						url : GLOBAL.BASE_URL + 'ProxyUpload/proxyUpload',
						success : function(form, action) {
							me.getContainer().body.unmask();
							if (action.result.success == "false") {

								alert(action.result.error);

							} else {

								alert(action.result.result);

							}
							
							me.passwordField.setValue("");
						},
						failure : function(form, action) {
							me.getContainer().body.unmask();
						}
					});

				} else {
					alert("Both fields are mandatory !");
				}
			},
			scope : me

		});

		me.btnReset = new Ext.Button({

			text : 'Reset',
			margin : 1,
			iconCls : "pu-reset-icon",
			handler : function() {
				me.uploadField.setValue("");
				me.passwordField.setValue("");
			},
			scope : me

		});

		me.btnClose = new Ext.Button({

			text : 'Close',
			margin : 1,
			iconCls : "pu-close-icon",
			handler : function() {
				me.getContainer().close();
			},
			scope : me

		});

		var oPanelButtons = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'top',
			layout : {
				pack : 'center'
			},
			items : [ me.btnUpload, me.btnReset, me.btnClose ]
		});

		me.uploadField = new Ext.create('Ext.form.field.File', {
			fieldLabel : 'Certificate',
			anchor : '100%',
			buttonText : 'Browse',
			labelAlign : 'left'
		});

		me.passwordField = new Ext.create('Ext.form.field.Text', {
			fieldLabel : 'p12 Password',
			inputType : "password",
			anchor : '100%',
			labelAlign : 'left',
			name : "pass_p12"
		});

		me.mainFormPanel = new Ext.create('Ext.form.Panel', {
			floatable : false,
			region : "center",
			layout : "anchor",
			header : false,
			bodyPadding : 5,
			autoScroll : true,
			dockedItems : [ oPanelButtons ],
			items : [
					me.uploadField,
					me.passwordField,
					{
						html : "<div style='padding:5px;background-color:#FFFF94'>"
								+ "<b>Important !</b><br/><br/>We are not keeping neither your private key nor password for p12 file on our service. While we try to make this "
								+ "process as secure as possible by using " + "SSL to encrypt the p12 file with your credentials when it is sent to the server, "
								+ "for maximum security, we recommend that you manually convert and upload the proxy using DIRAC client commands:" + "<br/><br/><b>dirac-cert-convert.sh YOUR_P12_FILE_NAME.p12</b>"
								+ "<br/><b>dirac-proxy-init -U -g GROUP_NAME</b></div>",
						xtype : "box",
						anchor : '100%'
					} ]
		});

		me.add([ me.mainFormPanel ]);

	}

});
