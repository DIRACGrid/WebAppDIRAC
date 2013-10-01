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
				object : null,
				value : 'DIRAC_' + GLOBAL.USER_CREDENTIALS.username + '_' + Math.floor(Math.random() * 1000001)
			},
			"Executable" : {
				mandatory : true,
				object : null,
				value : "/bin/ls"
			},
			"Arguments" : {
				mandatory : true,
				object : null,
				value : "-ltrA"
			},
			"OutputSandbox" : {
				mandatory : true,
				object : null,
				value : "std.out, std.err"
			},
			"InputData" : {
				mandatory : false,
				object : null,
				value : ""
			},
			"OutputData" : {
				mandatory : false,
				object : null,
				value : ""
			},
			"OutputSE" : {
				mandatory : false,
				object : null,
				value : "DIRAC-USER"
			},
			"OutputPath" : {
				mandatory : false,
				object : null,
				value : ""
			},
			"CPUTime" : {
				mandatory : false,
				object : null,
				value : "86400"
			},
			"Site" : {
				mandatory : false,
				object : null,
				value : ""
			},
			"BannedSite" : {
				mandatory : false,
				object : null,
				value : ""
			},
			"Platform" : {
				mandatory : false,
				object : null,
				value : "Linux_x86_64_glibc-2.5"
			},
			"Priority" : {
				mandatory : false,
				object : null,
				value : "5"
			},
			"StdError" : {
				mandatory : false,
				object : null,
				value : "std.err"
			},
			"StdOutput" : {
				mandatory : false,
				object : null,
				value : "std.out"
			},
			"Parameters" : {
				mandatory : false,
				object : null,
				value : "0"
			},
			"ParameterStart" : {
				mandatory : false,
				object : null,
				value : "0"
			},
			"ParameterStep" : {
				mandatory : false,
				object : null,
				value : "1"
			}
		};

		me.btnAddParameters = new Ext.Button({

			text : 'Add Parameters',
			iconCls : "jl-plus-icon",
			handler : function() {

			},
			scope : me,
			menu : [],
			tooltip : 'Click to add more parameters to the JDL'

		});

		for ( var sKey in me.textualFields) {

			if (me.textualFields[sKey].mandatory) {

				me.textualFields[sKey].object = new Ext.create('Ext.form.field.Text', {
					fieldLabel : sKey,
					anchor : '100%',
					labelAlign : 'left',
					value : me.textualFields[sKey].value,
					name : sKey
				});

			} else {

				me.textualFields[sKey].object = new Ext.create('Ext.form.field.Text', {
					fieldLabel : sKey,
					anchor : '100%',
					labelAlign : 'left',
					value : me.textualFields[sKey].value,
					hidden : true,
					name : sKey
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

		me.btnProxyStatus = new Ext.Button({

			text : 'Proxy Status',
			handler : function() {
				me.proxyCheckerFunction();
			},
			scope : me,
			tooltip : 'Proxy status updates automatically once per day'

		});

		var oTopToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'top',
			items : [ me.btnProxyStatus, '->', me.btnAddParameters ]
		});

		me.btnSubmit = new Ext.Button({

			text : 'Submit',
			margin : 1,
			iconCls : "jl-submit-icon",
			handler : function() {
				me.mainFormPanel.submit({
					url : GLOBAL.BASE_URL + 'JobLaunchpad/jobSubmit',
					success : function(form, action) {
						alert("CHECK");
					},
					failure : function(form, action) {
						alert("ERROR");
					}

				});
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
				me.getContainer().close();
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

		me.mainFormPanel = new Ext.create('Ext.form.Panel', {
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

		me.add([ me.mainFormPanel ]);

		me.proxyCheckerFunction();

	},

	oprAddNewFileField : function() {

		var me = this;

		var sFileFieldName = "fileField" + me.fsetInputSandboxSection.items.getCount();

		var oFileField = new Ext.create('Ext.form.field.File', {
			anchor : '100%',
			buttonText : 'Browse',
			moduleObject : me,
			name : sFileFieldName,
			listeners : {

				change : function(oComp, sValue, eOpts) {

					/*
					 * First we check wheather there are empty file fields. If there is an
					 * empty field, new field is not added to the list.
					 */

					var iLength = oComp.moduleObject.fsetInputSandboxSection.items.getCount();
					var bAddFile = true;

					for ( var i = 0; i < iLength; i++) {
						var oItem = oComp.moduleObject.fsetInputSandboxSection.getComponent(i);
						if (!oItem.getValue()) {
							var bAddFile = false;
						}
					}
					if (bAddFile) {

						oComp.moduleObject.oprAddNewFileField();

					}

					/*
					 * Then we calculate the size of the files. the function bytesToSize
					 * is used here.
					 */

					var iSize = 0;

					for ( var i = 0; i < iLength; i++) {
						var oItem = oComp.moduleObject.fsetInputSandboxSection.getComponent(i);
						var iFileSize = oComp.moduleObject.getFileSize(oItem.fileInputEl.dom);

						if (iFileSize >= 0) {
							iSize = iSize + iFileSize;
						}
					}

					console.log("Number of files " + iLength);
					console.log("The size of all files: " + oComp.moduleObject.bytesToSize(iSize, 2));

				}

			}
		});

		me.fsetInputSandboxSection.add(oFileField);

	},

	bytesToSize : function(bytes, precision) {
		var kilobyte = 1024;
		var megabyte = kilobyte * 1024;
		var gigabyte = megabyte * 1024;
		var terabyte = gigabyte * 1024;
		if ((bytes >= 0) && (bytes < kilobyte)) {
			return bytes + ' B';
		} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
			return (bytes / kilobyte).toFixed(precision) + ' KB';
		} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
			return (bytes / megabyte).toFixed(precision) + ' MB';
		} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
			return (bytes / gigabyte).toFixed(precision) + ' GB';
		} else if (bytes >= terabyte) {
			return (bytes / terabyte).toFixed(precision) + ' TB';
		} else {
			return bytes + ' B';
		}
	},

	getFileSize : function(oInputFile) {

		/*
		 * Can't use `typeof FileReader === "function"` because apparently it comes
		 * back as "object" on some browsers. So just see if it's there at all
		 */

		if (!window.FileReader) {
			// The file API isn't supported on this browser yet
			return -5;
		}

		if (!oInputFile) {
			return -4;
		} else if (!oInputFile.files) {
			return -3;
		} else if (!oInputFile.files[0]) {
			return -2;
		} else {
			var oFile = oInputFile.files[0];
			return oFile.size;
		}
	},
	setUpParameters : function() {
		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'JobLaunchpad/getLaunchpadOpts',
			method : 'POST',
			success : function(response) {
				console.log(response.responseText);
			},
			failure : function(response) {
				me.showProxyStatus('neutral');
			}
		});
	},
	proxyCheckerFunction : function() {

		var me = this;

		me.showProxyStatus('check');

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'JobLaunchpad/getProxyStatus',
			method : 'POST',
			success : function(response) {

				var jsonData = Ext.JSON.decode(response.responseText);

				if (jsonData['success'] == 'false') {

					me.showProxyStatus('false');

				} else {

					if (jsonData['result'] == 'false') {

						me.showProxyStatus('false');

					} else {

						me.showProxyStatus('true');

					}
				}
			},
			failure : function(response) {
				me.showProxyStatus('neutral');
			}
		});
	},

	showProxyStatus : function(sMode) {

		var me = this, sBtnText = 'Proxy Status: ';

		if (sMode == 'true') {
			sBtnText = sBtnText + '<span style="color:#009900; font-weight:bold">Valid</span>';
		} else if (sMode == 'false') {
			sBtnText = sBtnText + '<span style="color:#FF0000; font-weight:bold">Not Valid</span>';
		} else if (sMode == 'check') {
			sBtnText = sBtnText + '<span style="color:#FF9900; font-weight:bold">Checking</span>';
		} else {
			sBtnText = sBtnText + '<span style="font-weight:bold">Unknown</span>';
		}

		me.btnProxyStatus.setText(sBtnText);

	}

});
