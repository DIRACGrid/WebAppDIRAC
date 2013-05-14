/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('DIRAC.JobMonitor.classes.JobMonitor', {
    extend : 'Ext.dirac.core.Module',

    requires : [ // 'Ext.data.JsonStore',
    'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.CheckItem", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.toolbar.Paging",
	    "Ext.grid.Panel", "Ext.form.field.Date", "Ext.form.field.TextArea" ],

    loadState : function(data) {

	var me = this;

	for ( var i = 0; i < me.grid.columns.length; i++) {

	    var col = me.grid.columns[i];
	    col.setWidth(data.columns[col.getSortParam()].width);
	    if (data.columns[col.getSortParam()].hidden)
		col.hide();
	    else
		col.show();

	    var sortState = data.columns[col.getSortParam()].sortState;

	    if (sortState != null)
		col.setSortState(sortState);

	}

	for ( var i = 0; i < me.selectorMenu.items.length; i++) {

	    var item = me.selectorMenu.items.getAt(i);

	    item.setChecked(!data.leftMenu.selectors[item.relatedCmbField].hidden);

	    if (!data.leftMenu.selectors[item.relatedCmbField].hidden)
		me.cmbSelectors[item.relatedCmbField].show();
	    else
		me.cmbSelectors[item.relatedCmbField].hide();

	    /*
	     * this can be done only if the store is being loaded, otherwise has
	     * to be postponed
	     */
	    me.__oprPostponedValueSetUntilOptionsLoaded(me.cmbSelectors[item.relatedCmbField], data.leftMenu.selectors[item.relatedCmbField].data_selected);

	    me.cmbSelectors[item.relatedCmbField].setInverseSelection(data.leftMenu.selectors[item.relatedCmbField].not_selected);

	}

	me.textJobId.setValue(data.leftMenu.txtJobId);
	me.timeSearchPanel.cmbTimeSpan.setValue(data.leftMenu.cmbTimeSpan);
	me.timeSearchPanel.calenFrom.setValue(data.leftMenu.calenFrom);

	me.timeSearchPanel.cmbTimeFrom.setValue(data.leftMenu.cmbTimeFrom);
	me.timeSearchPanel.calenTo.setValue(data.leftMenu.calenTo);
	me.timeSearchPanel.cmbTimeTo.setValue(data.leftMenu.cmbTimeTo);

	// me.oprLoadGridData();

    },

    __oprPostponedValueSetUntilOptionsLoaded : function(oSelectionBox, oValues) {

	var me = this;

	if (me.bDataSelectionLoaded) {
	    oSelectionBox.setValue(oValues);
	} else {
	    Ext.Function.defer(me.__oprPostponedValueSetUntilOptionsLoaded, 1500, me, [ oSelectionBox, oValues ]);
	}

    },

    getStateData : function() {

	var me = this;
	var oReturn = {};

	// data for grid columns
	oReturn.columns = {};

	for ( var i = 0; i < me.grid.columns.length; i++) {

	    var col = me.grid.columns[i];
	    var oName = col.getSortParam();
	    oReturn.columns[oName] = {
		"width" : col.width,
		"hidden" : col.isHidden(),
		"sortState" : col.sortState
	    };

	}

	// show/hide for selectors and their selected data (including NOT
	// button)
	oReturn.leftMenu = {};
	oReturn.leftMenu.selectors = {};

	for ( var cmb in me.cmbSelectors) {

	    oReturn.leftMenu.selectors[cmb] = {
		hidden : me.cmbSelectors[cmb].isHidden(),
		data_selected : me.cmbSelectors[cmb].getValue(),
		not_selected : me.cmbSelectors[cmb].isInverseSelection()
	    }

	}

	// the state of the selectors, text fields and time
	oReturn.leftMenu.txtJobId = me.textJobId.getValue();
	oReturn.leftMenu.cmbTimeSpan = me.timeSearchPanel.cmbTimeSpan.getValue();
	oReturn.leftMenu.calenFrom = me.timeSearchPanel.calenFrom.getValue();
	oReturn.leftMenu.cmbTimeFrom = me.timeSearchPanel.cmbTimeFrom.getValue();
	oReturn.leftMenu.calenTo = me.timeSearchPanel.calenTo.getValue();
	oReturn.leftMenu.cmbTimeTo = me.timeSearchPanel.cmbTimeTo.getValue();

	return oReturn;

    },
    dataFields : [ {
	name : 'SystemPriority',
	type : 'float'
    }, {
	name : 'ApplicationNumStatus'
    }, {
	name : 'JobID',
	type : 'float'
    }, {
	name : 'LastSignOfLife',
	type : 'date',
	dateFormat : 'Y-m-d H:i:s'
    }, {
	name : 'VerifiedFlag'
    }, {
	name : 'RetrievedFlag'
    }, {
	name : 'Status'
    }, {
	name : 'StartExecTime',
	type : 'date',
	dateFormat : 'Y-m-d H:i:s'
    }, {
	name : 'RescheduleCounter'
    }, {
	name : 'JobSplitType'
    }, {
	name : 'MinorStatus'
    }, {
	name : 'ApplicationStatus'
    }, {
	name : 'SubmissionTime',
	type : 'date',
	dateFormat : 'Y-m-d H:i:s'
    }, {
	name : 'JobType'
    }, {
	name : 'MasterJobID'
    }, {
	name : 'KilledFlag'
    }, {
	name : 'RescheduleTime'
    }, {
	name : 'DIRACSetup'
    }, {
	name : 'FailedFlag'
    }, {
	name : 'CPUTime'
    }, {
	name : 'OwnerDN'
    }, {
	name : 'JobGroup'
    }, {
	name : 'JobName'
    }, {
	name : 'AccountedFlag'
    }, {
	name : 'OSandboxReadyFlag'
    }, {
	name : 'LastUpdateTime',
	type : 'date',
	dateFormat : 'Y-m-d H:i:s'
    }, {
	name : 'Site'
    }, {
	name : 'HeartBeatTime',
	type : 'date',
	dateFormat : 'Y-m-d H:i:s'
    }, {
	name : 'OwnerGroup'
    }, {
	name : 'ISandboxReadyFlag'
    }, {
	name : 'UserPriority'
    }, {
	name : 'Owner'
    }, {
	name : 'DeletedFlag'
    }, {
	name : 'TaskQueueID'
    }, {
	name : 'JobType'
    }, {
	name : 'JobIDcheckBox',
	mapping : 'JobID'
    }, {
	name : 'StatusIcon',
	mapping : 'Status'
    }, {
	name : 'OwnerGroup'
    } ],

    initComponent : function() {
	
	var me = this;

	me.launcher.title = "Job Monitor";
	me.launcher.maximized = true;
	
	Ext.apply(me, {
	    layout : 'border',
	    bodyBorder : false,
	    defaults : {
		collapsible : true,
		split : true
	    }
	});

	me.callParent(arguments);
	
	/*
	var oParts = me.self.getName().split(".");
	
	_app.mixins.fileLoader.loadFile([ "static/" + oParts[0] + "/" + oParts[1] + "/css/" + oParts[1] + ".css" ], function() {
	    
	    var me = this;
	    
	    me.buildUI();
	    
	},me);*/
	
    },
    
    buildUI : function() {

	var me = this;

	/*
	 * -----------------------------------------------------------------------------------------------------------
	 * DEFINITION OF THE LEFT PANEL
	 * -----------------------------------------------------------------------------------------------------------
	 */

	me.leftPanel = new Ext.create('Ext.panel.Panel', {
	    title : 'Selectors',
	    region : 'west',
	    floatable : false,
	    margins : '0',
	    width : 250,
	    minWidth : 230,
	    maxWidth : 350,
	    bodyPadding : 5,
	    layout : 'anchor',
	    autoScroll : true
	});

	me.cmbSelectors = {
	    site : null,
	    status : null,
	    minorStatus : null,
	    appStatus : null,
	    owner : null,
	    jobGroup : null,
	    jobType : null
	};

	var cmbTitles = {
	    site : "Site",
	    status : "Status",
	    minorStatus : "Minor Status",
	    appStatus : "Application Status",
	    owner : "Owner",
	    jobGroup : "Job Group",
	    jobType : "Job Type"
	};

	for ( var cmb in me.cmbSelectors) {

	    me.cmbSelectors[cmb] = Ext.create('Ext.dirac.utils.DiracBoxSelect', {
		fieldLabel : cmbTitles[cmb],
		queryMode : 'local',
		labelAlign : 'top',
		displayField : "text",
		valueField : "value",
		anchor : '100%'
	    });

	}

	me.bDataSelectionLoaded = false;

	me.leftPanel.add([ me.cmbSelectors.site, me.cmbSelectors.status, me.cmbSelectors.minorStatus, me.cmbSelectors.appStatus, me.cmbSelectors.owner, me.cmbSelectors.jobGroup,
		me.cmbSelectors.jobType ]);

	me.textJobId = Ext.create('Ext.form.field.Text', {

	    fieldLabel : "JobID(s)",
	    labelAlign : 'top',
	    anchor : "100%",
	    validator : function(value) {

		if (Ext.util.Format.trim(value) != "") {
		    var newValue = "";
		    for ( var i = 0; i < value.length; i++) {
			if (value.charAt(i) != ' ')
			    newValue += value.charAt(i);
		    }
		    var regExpr = /^(\d+|\d+-\d+)(,(\d+|\d+-\d+))*$/;

		    if (String(newValue).search(regExpr) != -1)
			return true;
		    else
			return "The IDs expression is not valid";

		} else
		    return true;

	    }
	});

	me.leftPanel.add(me.textJobId);

	// time search sub-panel

	me.timeSearchPanel = {};

	me.timeSearchPanel.cmbTimeSpan = new Ext.create('Ext.form.field.ComboBox', {
	    labelAlign : 'top',
	    fieldLabel : 'Time Span',
	    store : new Ext.data.SimpleStore({
		fields : [ 'value', 'text' ],
		data : [ [ 1, "Last Hour" ], [ 2, "Last Day" ], [ 3, "Last Week" ], [ 4, "Last Month" ], [ 5, "Manual Selection" ] ]
	    }),
	    displayField : "text",
	    valueField : "value",
	    anchor : "100%"
	});

	var oTimeData = [];
	for ( var i = 0; i < 24; i++) {
	    oTimeData.push([ ((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":00" ]);
	    oTimeData.push([ ((i.toString().length == 1) ? "0" + i.toString() : i.toString()) + ":30" ]);
	}

	me.timeSearchPanel.calenFrom = new Ext.create('Ext.form.field.Date', {
	    width : 100,
	    format : 'Y-m-d'
	});

	me.timeSearchPanel.cmbTimeFrom = new Ext.create('Ext.form.field.ComboBox', {
	    width : 70,
	    store : new Ext.data.SimpleStore({
		fields : [ 'value' ],
		data : oTimeData
	    }),
	    margin : "0 0 0 10",
	    displayField : 'value'
	});

	me.timeSearchPanel.calenTo = new Ext.create('Ext.form.field.Date', {
	    width : 100,
	    format : 'Y-m-d'
	});

	me.timeSearchPanel.cmbTimeTo = new Ext.create('Ext.form.field.ComboBox', {
	    width : 70,
	    store : new Ext.data.SimpleStore({
		fields : [ 'value' ],
		data : oTimeData
	    }),
	    margin : "0 0 0 10",
	    displayField : 'value'
	});

	me.timeSearchPanel.btnResetTimePanel = new Ext.Button({

	    text : 'Reset Time Panel',
	    margin : 3,
	    iconCls : "jm-reset-icon",
	    handler : function() {

		me.timeSearchPanel.cmbTimeTo.setValue(null);
		me.timeSearchPanel.cmbTimeFrom.setValue(null);
		me.timeSearchPanel.calenTo.setRawValue("");
		me.timeSearchPanel.calenFrom.setRawValue("");
		me.timeSearchPanel.cmbTimeSpan.setValue(null);
	    },
	    scope : me,
	    defaultAlign : "c"
	});

	var oTimePanel = new Ext.create('Ext.panel.Panel', {
	    width : 200,
	    autoHeight : true,
	    border : true,
	    bodyPadding : 5,
	    layout : "anchor",
	    anchor : "100%",
	    dockedItems : [ {
		xtype : 'toolbar',
		dock : 'bottom',
		items : [ me.timeSearchPanel.btnResetTimePanel ],
		layout : {
		    type : 'hbox',
		    pack : 'center'
		}
	    } ],
	    items : [ me.timeSearchPanel.cmbTimeSpan, {
		xtype : 'tbtext',
		text : "From:",
		padding : "3 0 3 0"
	    }, {
		xtype : "panel",
		layout : "column",
		border : false,
		items : [ me.timeSearchPanel.calenFrom, me.timeSearchPanel.cmbTimeFrom ]
	    }, {
		xtype : 'tbtext',
		text : "To:",
		padding : "3 0 3 0"
	    }, {
		xtype : "panel",
		layout : "column",
		border : false,
		items : [ me.timeSearchPanel.calenTo, me.timeSearchPanel.cmbTimeTo ]
	    } ]
	});

	me.leftPanel.add(oTimePanel);

	// Buttons at the bottom of the panel

	me.btnSubmit = new Ext.Button({

	    text : 'Submit',
	    margin : 3,
	    iconCls : "jm-submit-icon",
	    handler : function() {
		me.oprLoadGridData();
		// me.oprSelectorsRefreshWithSubmit(true);
	    },
	    scope : me

	});

	me.btnReset = new Ext.Button({

	    text : 'Reset',
	    margin : 3,
	    iconCls : "jm-reset-icon",
	    handler : function() {
		me.oprResetSelectionOptions();
	    },
	    scope : me

	});

	me.btnRefresh = new Ext.Button({

	    text : 'Refresh',
	    margin : 3,
	    iconCls : "jm-refresh-icon",
	    handler : function() {
		me.oprSelectorsRefreshWithSubmit(false);
	    },
	    scope : me

	});

	var oPanelButtons = new Ext.create('Ext.toolbar.Toolbar', {
	    items : [ me.btnSubmit, me.btnReset, me.btnRefresh ],
	    dock : 'bottom'
	});

	me.leftPanel.addDocked(oPanelButtons);

	Ext.Ajax.request({
	    url : _app_base_url + 'JobMonitor/getSelectionData',
	    params : {

	    },
	    scope : me,
	    success : function(response) {

		var me = this;
		var response = Ext.JSON.decode(response.responseText);

		me.__oprRefreshStoresForSelectors(response, false);
		me.bDataSelectionLoaded = true;

	    },
	    failure : function(response) {

		Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
	    }
	});

	/*
	 * -----------------------------------------------------------------------------------------------------------
	 * DEFINITION OF THE GRID
	 * -----------------------------------------------------------------------------------------------------------
	 */

	me.dataStore = new Ext.data.JsonStore({

	    proxy : {
		type : 'ajax',
		url : _app_base_url + 'JobMonitor/getJobData',
		reader : {
		    type : 'json',
		    root : 'result'
		}
	    },

	    // alternatively, a Ext.data.Model name can be given
	    // (see Ext.data.Store for an example)
	    fields : me.dataFields,
	    autoLoad : true,
	    remoteSort : true
	});

	me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
	me.checkboxFunctionDefinition += 'var oChecked=this.checked;';
	me.checkboxFunctionDefinition += 'var oElems=Ext.query(\'#' + me.id + ' input.checkrow\');';
	me.checkboxFunctionDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
	me.checkboxFunctionDefinition += '"/>';

	me.pagingToolbar = {};
	me.pagingToolbar.updateStamp = new Ext.Button({
	    disabled : true,
	    // disabledClass:'my-disabled',
	    text : 'Updated: -'
	});

	me.pagingToolbar.btnReset = new Ext.Button({
	    text : 'Reset',
	    iconCls : "jm-reset-button-icon",
	    handler : function() {

		var me = this;
		me.__oprJobAction("reset", "");

	    },
	    scope : me
	});

	me.pagingToolbar.btnReschedule = new Ext.Button({
	    text : 'Reschedule',
	    iconCls : "jm-reschedule-icon",
	    handler : function() {

		var me = this;
		me.__oprJobAction("reschedule", "");

	    },
	    scope : me
	});

	me.pagingToolbar.btnKill = new Ext.Button({
	    text : 'Kill',
	    iconCls : "jm-kill-icon",
	    handler : function() {

		var me = this;
		me.__oprJobAction("kill", "");

	    },
	    scope : me
	});

	me.pagingToolbar.btnDelete = new Ext.Button({
	    text : 'Delete',
	    iconCls : "jm-delete-icon",
	    handler : function() {

		var me = this;
		me.__oprJobAction("delete", "");

	    },
	    scope : me
	});

	me.pagingToolbar.pageSizeCombo = new Ext.form.field.ComboBox({
	    allowBlank : false,
	    displayField : 'number',
	    editable : false,
	    maxLength : 4,
	    maxLengthText : 'The maximum value for this field is 1000',
	    minLength : 1,
	    minLengthText : 'The minimum value for this field is 1',
	    mode : 'local',
	    store : new Ext.data.SimpleStore({
		fields : [ 'number' ],
		data : [ [ 25 ], [ 50 ], [ 100 ], [ 200 ], [ 500 ], [ 1000 ] ]
	    }),
	    triggerAction : 'all',
	    value : 25,
	    width : 50
	});

	me.pagingToolbar.pageSizeCombo.on("change", function(combo, newValue, oldValue, eOpts) {
	    var me = this;
	    me.oprLoadGridData();
	}, me);

	var pagingToolbarItems = [ me.pagingToolbar.btnReset, me.pagingToolbar.btnReschedule, me.pagingToolbar.btnKill, me.pagingToolbar.btnDelete, '-', '->', me.pagingToolbar.updateStamp, '-',
		'Items per page: ', me.pagingToolbar.pageSizeCombo, '-' ];

	me.pagingToolbar.toolbar = Ext.create('Ext.toolbar.Paging', {
	    store : me.dataStore,
	    displayInfo : true,
	    displayMsg : 'Displaying topics {0} - {1} of {2}',
	    items : pagingToolbarItems,
	    emptyMsg : "No topics to display",
	    prependButtons : true
	});

	me.contextGridMenu = new Ext.menu.Menu({
	    items : [ {
		handler : function() {
		    me.__oprGetJobData("getJDL");
		},
		text : 'JDL'
	    }, '-', {
		handler : function() {
		    me.__oprGetJobData("getBasicInfo");
		},
		text : 'Attributes'
	    }, {
		handler : function() {
		    me.__oprGetJobData("getParams");
		},
		text : 'Parameters'
	    }, {
		handler : function() {
		    me.__oprGetJobData("getLoggingInfo");
		},
		text : 'Logging info'
	    }, '-', {
		handler : function() {
		    me.__oprGetJobData("getStandardOutput");
		},
		text : 'Peek StandardOutput'
	    }, {
		handler : function() {
		    me.__oprGetJobData("getLogURL");
		},
		text : 'Get LogFile'
	    }, {
		handler : function() {
		    me.__oprGetJobData("getPending");
		},
		text : 'Get PendingRequest'
	    }, {
		handler : function() {
		    me.__oprGetJobData("getStagerReport");
		},
		text : 'Get StagerReport'
	    }, '-', {
		text : 'Actions',
		iconCls : "jm-action-gif-icon",
		menu : {
		    items : [ {
			handler : function() {

			    var me = this;
			    me.__oprJobAction("kill", _app._cf.getFieldValueFromSelectedRow(me.grid, "JobID"));

			},
			iconCls : "jm-kill-icon",
			text : 'Kill',
			scope : me
		    }, {
			handler : function() {

			    var me = this;
			    me.__oprJobAction("delete", _app._cf.getFieldValueFromSelectedRow(me.grid, "JobID"));

			},
			iconCls : "jm-delete-icon",
			text : 'Delete',
			scope : me
		    } ]
		}
	    }, {
		text : 'Pilot',
		menu : {
		    items : [ {
			handler : function() {
			    me.__oprGetJobData("getPilotStdOut");
			},
			text : 'Get StdOut'
		    }, {
			handler : function() {
			    me.__oprGetJobData("getPilotStdErr");
			},
			text : 'Get StdErr'
		    } ]
		}
	    }, {
		text : 'Sandbox',
		iconCls : "jm-addfile-gif-icon",
		menu : {
		    items : [ {
			handler : function() {
			},
			text : 'Get input file(s)'
		    }, {
			handler : function() {
			},
			text : 'Get output file(s)'
		    } ]
		}
	    } ]
	});

	me.grid = Ext.create('Ext.grid.Panel', {
	    region : 'center',
	    store : me.dataStore,
	    height : '600',
	    viewConfig : {
		stripeRows : true,
		enableTextSelection : true
	    },
	    columns : [ {
		header : me.checkboxFunctionDefinition,
		name : 'checkBox',
		id : 'checkBox',
		width : 26,
		sortable : false,
		dataIndex : 'JobIDcheckBox',
		renderer : function(value, metaData, record, row, col, store, gridView) {
		    return this.rendererChkBox(value);
		},
		hideable : false,
		fixed : true,
		menuDisabled : true
	    }, {
		header : 'JobId',
		sortable : true,
		dataIndex : 'JobID',
		align : 'left',
		hideable : false
	    }, {
		header : '',
		width : 26,
		sortable : false,
		dataIndex : 'StatusIcon',
		renderer : function(value, metaData, record, row, col, store, gridView) {
		    return this.rendererStatus(value);
		},
		hideable : false,
		fixed : true,
		menuDisabled : true
	    }, {
		header : 'Status',
		width : 70,
		sortable : true,
		dataIndex : 'Status',
		align : 'left'
	    }, {
		header : 'MinorStatus',
		sortable : true,
		dataIndex : 'MinorStatus',
		align : 'left'
	    }, {
		header : 'ApplicationStatus',
		sortable : true,
		dataIndex : 'ApplicationStatus',
		align : 'left'
	    }, {
		header : 'Site',
		sortable : true,
		dataIndex : 'Site',
		align : 'left'
	    }, {
		header : 'JobName',
		width : 200,
		sortable : true,
		dataIndex : 'JobName',
		align : 'left'
	    }, {
		header : 'LastUpdate [UTC]',
		width : 150,
		sortable : true,
		renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
		dataIndex : 'LastUpdateTime'
	    }, {
		header : 'LastSignOfLife [UTC]',
		width : 150,
		sortable : true,
		renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
		dataIndex : 'LastSignOfLife'
	    }, {
		header : 'SubmissionTime [UTC]',
		width : 150,
		sortable : true,
		renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
		dataIndex : 'SubmissionTime'
	    }, {
		header : 'DIRACSetup',
		sortable : true,
		dataIndex : 'DIRACSetup',
		align : 'left',
		hidden : true
	    }, {
		header : 'FailedFlag',
		sortable : true,
		dataIndex : 'FailedFlag',
		align : 'left',
		hidden : true
	    }, {
		header : 'RescheduleCounter',
		sortable : true,
		dataIndex : 'RescheduleCounter',
		align : 'left',
		hidden : true
	    }, {
		header : 'CPUTime',
		sortable : true,
		dataIndex : 'CPUTime',
		align : 'left',
		hidden : true
	    }, {
		header : 'OwnerDN',
		sortable : true,
		dataIndex : 'OwnerDN',
		align : 'left',
		hidden : true
	    }, {
		header : 'JobGroup',
		sortable : true,
		dataIndex : 'JobGroup',
		align : 'left',
		hidden : true
	    }, {
		header : 'JobType',
		sortable : true,
		dataIndex : 'JobType',
		align : 'left',
		hidden : true
	    }, {
		header : 'AccountedFlag',
		sortable : true,
		dataIndex : 'AccountedFlag',
		align : 'left',
		hidden : true
	    }, {
		header : 'OSandboxReadyFlag',
		sortable : true,
		dataIndex : 'OSandboxReadyFlag',
		align : 'left',
		hidden : true
	    }, {
		header : 'Owner',
		sortable : true,
		dataIndex : 'Owner',
		align : 'left'
	    }, {
		header : 'TaskQueueID',
		sortable : true,
		dataIndex : 'TaskQueueID',
		align : 'left',
		hidden : true
	    }, {
		header : 'OwnerGroup',
		sortable : true,
		dataIndex : 'OwnerGroup',
		align : 'left',
		hidden : true
	    } ],
	    rendererChkBox : function(val) {
		return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
	    },
	    rendererStatus : function(value) {
		if ((value == 'Done') || (value == 'Completed') || (value == 'Good') || (value == 'Active') || (value == 'Cleared') || (value == 'Completing')) {
		    return '<img src="static/DIRAC/JobMonitor/images/done.gif"/>';
		} else if (value == 'Bad') {
		    return '<img src="static/DIRAC/JobMonitor/images/bad.gif"/>';
		} else if ((value == 'Failed') || (value == 'Bad') || (value == 'Banned') || (value == 'Aborted')) {
		    return '<img src="static/DIRAC/JobMonitor/images/failed.gif"/>';
		} else if ((value == 'Waiting') || (value == 'Stopped') || (value == 'Poor') || (value == 'Probing')) {
		    return '<img src="static/DIRAC/JobMonitor/images/waiting.gif"/>';
		} else if (value == 'Deleted') {
		    return '<img src="static/DIRAC/JobMonitor/images/deleted.gif"/>';
		} else if (value == 'Matched') {
		    return '<img src="static/DIRAC/JobMonitor/images/matched.gif"/>';
		} else if ((value == 'Running') || (value == 'Active') || (value == 'Fair')) {
		    return '<img src="static/DIRAC/JobMonitor/images/running.gif"/>';
		} else if (value == 'NoMask') {
		    return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
		} else {
		    return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
		}
	    },
	    tbar : me.pagingToolbar.toolbar,
	    listeners : {

		itemclick : function(comp, record, item, index, e, eOpts) {

		    me.contextGridMenu.showAt(e.xy);

		}

	    }
	});

	/*
	 * -----------------------------------------------------------------------------------------------------------
	 * DEFINITION OF THE MAIN CONTAINER
	 * -----------------------------------------------------------------------------------------------------------
	 */
	me.add([ me.leftPanel, me.grid ]);

    },

    afterRender : function() {
	var me = this;

	var menuItems = [];
	for ( var cmb in me.cmbSelectors) {

	    menuItems.push({
		xtype : 'menucheckitem',
		text : me.cmbSelectors[cmb].getFieldLabel(),
		relatedCmbField : cmb,
		checked : true,
		handler : function(item, e) {

		    var me = this;

		    if (item.checked)
			me.cmbSelectors[item.relatedCmbField].show();
		    else
			me.cmbSelectors[item.relatedCmbField].hide();

		},
		scope : me
	    });

	}

	me.selectorMenu = new Ext.menu.Menu({
	    items : menuItems
	});

	me.leftPanel.getHeader().addTool({
	    xtype : "diracToolButton",
	    type : "down",
	    menu : me.selectorMenu
	});

	// Change the handler of the refresh button of the paging toolbar
	// me.pagingToolbar.toolbar.items

	for ( var i = 0; i < me.pagingToolbar.toolbar.items.length; i++) {

	    if (me.pagingToolbar.toolbar.items.getAt(i).itemId == "refresh") {

		me.pagingToolbar.toolbar.items.getAt(i).handler = function() {
		    me.oprLoadGridData();
		};
		break;

	    }

	}

	this.callParent();
    },

    __oprRefreshStoresForSelectors : function(oData, bRefreshStores) {

	var me = this;

	var map = [ [ "app", "appStatus" ], [ "minorstat", "minorStatus" ], [ "owner", "owner" ], [ "prod", "jobGroup" ], [ "site", "site" ], [ "status", "status" ], [ "types", "jobType" ] ];

	for ( var j = 0; j < map.length; j++) {

	    var dataOptions = [];
	    for ( var i = 0; i < oData[map[j][0]].length; i++)
		dataOptions.push([ oData[map[j][0]][i][0], oData[map[j][0]][i][0] ]);

	    if (bRefreshStores) {

		var oNewStore = new Ext.data.ArrayStore({
		    fields : [ 'value', 'text' ],
		    data : dataOptions
		});

		me.cmbSelectors[map[j][1]].refreshStore(oNewStore);

	    } else {
		me.cmbSelectors[map[j][1]].store = new Ext.data.ArrayStore({
		    fields : [ 'value', 'text' ],
		    data : dataOptions
		});
	    }

	}

    },

    __oprValidateBeforeSubmit : function() {

	var me = this;
	var bValid = true;

	if (!me.textJobId.validate())
	    bValid = false;

	return bValid;
    },

    oprSelectorsRefreshWithSubmit : function(bSubmit) {

	var me = this;

	if (bSubmit && !me.__oprValidateBeforeSubmit())
	    return;

	me.leftPanel.body.mask("Wait ...");
	// this var is used to know whether the options in the select boxes have
	// been loaded or not
	me.bDataSelectionLoaded = false;
	Ext.Ajax.request({
	    url : _app_base_url + 'JobMonitor/getSelectionData',
	    params : {

	    },
	    scope : me,
	    success : function(response) {

		var me = this;
		var response = Ext.JSON.decode(response.responseText);
		me.__oprRefreshStoresForSelectors(response, true);
		me.leftPanel.body.unmask();
		if (bSubmit)
		    me.oprLoadGridData();

		me.bDataSelectionLoaded = true;

	    },
	    failure : function(response) {

		Ext.example.msg("Notification", 'Operation failed due to a network error.<br/> Please try again later !');
	    }
	});

    },
    oprLoadGridData : function() {

	var me = this;

	if (me.__oprValidateBeforeSubmit()) {

	    // if a value in time span has been selected
	    var sStartDate = me.timeSearchPanel.calenFrom.getRawValue();
	    var sStartTime = me.timeSearchPanel.cmbTimeFrom.getValue();
	    var sEndDate = me.timeSearchPanel.calenTo.getRawValue();
	    var sEndTime = me.timeSearchPanel.cmbTimeTo.getValue();

	    var iSpanValue = me.timeSearchPanel.cmbTimeSpan.getValue();

	    if ((iSpanValue != null) && (iSpanValue != 5)) {

		var oNowJs = new Date();
		var oBegin = null;

		switch (iSpanValue) {
		case 1:
		    oBegin = Ext.Date.add(oNowJs, Ext.Date.HOUR, -1);
		    break;
		case 2:
		    oBegin = Ext.Date.add(oNowJs, Ext.Date.DAY, -1);
		    break;
		case 3:
		    oBegin = Ext.Date.add(oNowJs, Ext.Date.DAY, -7);
		    break;
		case 4:
		    oBegin = Ext.Date.add(oNowJs, Ext.Date.MONTH, -1);
		    break;
		}

		sStartDate = Ext.Date.format(oBegin, "Y-m-d");
		sEndDate = Ext.Date.format(oNowJs, "Y-m-d");
		sStartTime = Ext.Date.format(oBegin, "H:i");
		sEndTime = Ext.Date.format(oNowJs, "H:i");

	    }

	    // Collect data for filtration
	    var extraParams = {

		site : ((me.cmbSelectors.site.isInverseSelection()) ? me.cmbSelectors.site.getInverseSelection() : me.cmbSelectors.site.getValue().join(",")),
		status : ((me.cmbSelectors.status.isInverseSelection()) ? me.cmbSelectors.status.getInverseSelection() : me.cmbSelectors.status.getValue().join(",")),
		minorstat : ((me.cmbSelectors.minorStatus.isInverseSelection()) ? me.cmbSelectors.minorStatus.getInverseSelection() : me.cmbSelectors.minorStatus.getValue().join(",")),
		app : ((me.cmbSelectors.appStatus.isInverseSelection()) ? me.cmbSelectors.appStatus.getInverseSelection() : me.cmbSelectors.appStatus.getValue().join(",")),
		owner : ((me.cmbSelectors.owner.isInverseSelection()) ? me.cmbSelectors.owner.getInverseSelection() : me.cmbSelectors.owner.getValue().join(",")),
		prod : ((me.cmbSelectors.jobGroup.isInverseSelection()) ? me.cmbSelectors.jobGroup.getInverseSelection() : me.cmbSelectors.jobGroup.getValue().join(",")),
		types : ((me.cmbSelectors.jobType.isInverseSelection()) ? me.cmbSelectors.jobType.getInverseSelection() : me.cmbSelectors.jobType.getValue().join(",")),
		ids : me.textJobId.getValue(),
		limit : me.pagingToolbar.pageSizeCombo.getValue(),
		startDate : sStartDate,
		startTime : sStartTime,
		endDate : sEndDate,
		endTime : sEndTime

	    };

	    // set those data as extraParams in
	    me.grid.store.proxy.extraParams = extraParams;
	    me.grid.store.load();
	}

    },
    oprResetSelectionOptions : function() {

	var me = this;
	me.cmbSelectors.site.setValue([]);
	me.cmbSelectors.status.setValue([]);
	me.cmbSelectors.minorStatus.setValue([]);
	me.cmbSelectors.appStatus.setValue([]);
	me.cmbSelectors.owner.setValue([]);
	me.cmbSelectors.jobGroup.setValue([]);
	me.cmbSelectors.jobType.setValue([]);
	me.textJobId.setValue("");

	me.oprLoadGridData();

    },
    __oprJobAction : function(oAction, oId) {

	var me = this;
	var oItems = [];

	if ((oId == null) || (oId == '') || (oId == undefined)) {

	    var oElems = Ext.query("#" + me.id + " input.checkrow");

	    for ( var i = 0; i < oElems.length; i++)
		if (oElems[i].checked)
		    oItems.push(oElems[i].value);

	    if (oItems.length < 1) {
		alert('No jobs were selected');
		return;
	    }

	} else {
	    oItems[0] = oId;
	}

	var c = false;

	if (oItems.length == 1)
	    c = confirm('Are you sure you want to ' + oAction + ' ' + oItems[0] + '?');
	else
	    c = confirm('Are you sure you want to ' + oAction + ' these jobs?');

	if (c === false)
	    return;

	Ext.Ajax.request({
	    url : _app_base_url + 'JobMonitor/jobAction',
	    method : 'POST',
	    params : {
		action : oAction,
		ids : oItems.join(",")
	    },
	    success : function(response) {
		var jsonData = Ext.JSON.decode(response.responseText);
		if (jsonData['success'] == 'false') {
		    alert('Error: ' + jsonData['error']);
		    return;
		} else {
		    if (jsonData.showResult) {
			var html = '';
			for ( var i = 0; i < jsonData.showResult.length; i++) {
			    html = html + jsonData.showResult[i] + '<br>';
			}
			Ext.Msg.alert('Result:', html);
		    }
		}
	    }
	});
    },
    __oprGetJobData : function(oDataKind) {

	var me = this;
	var oId = _app._cf.getFieldValueFromSelectedRow(me.grid, "JobID");
	me.getContainer().body.mask("Wait ...");
	Ext.Ajax.request({
	    url : _app_base_url + 'JobMonitor/jobData',
	    method : 'POST',
	    params : {
		data_kind : oDataKind,
		id : oId
	    },
	    scope : me,
	    success : function(response) {

		me.getContainer().body.unmask();
		var jsonData = Ext.JSON.decode(response.responseText);

		if (jsonData["success"] == "true") {

		    if (oDataKind == "getJDL") {
			// text
			me.__oprPrepareAndShowWindowText(jsonData["result"], "JDL for JobID:" + oId);

		    } else if (oDataKind == "getBasicInfo") {
			// grid
			me.__oprPrepareAndShowWindowGrid(jsonData["result"], "Attributes for JobID:" + oId, [ "name", "value" ], [ {
			    text : 'Name',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'name'
			}, {
			    text : 'Value',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'value'
			} ]);

		    } else if (oDataKind == "getParams") {
			// grid
			me.__oprPrepareAndShowWindowGrid(jsonData["result"], "Parameters for JobID:" + oId, [ "name", "value" ], [ {
			    text : 'Name',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'name'
			}, {
			    text : 'Value',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'value'
			} ]);

		    } else if (oDataKind == "getLoggingInfo") {
			// grid
			me.__oprPrepareAndShowWindowGrid(jsonData["result"], "Attributes for JobID:" + oId, [ "status", "minor_status", "app_status", "date_time", "source" ], [ {
			    text : 'Source',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'source'
			}, {
			    text : 'Status',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'status'
			}, {
			    text : 'Minor Status',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'minor_status'
			}, {
			    text : 'Application Status',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'app_status'
			}, {
			    text : 'Date Time',
			    flex : 1,
			    sortable : false,
			    dataIndex : 'date_time'
			} ]);

		    } else if (oDataKind == "getStandardOutput") {
			// text
			me.__oprPrepareAndShowWindowText(jsonData["result"], "Standard output for JobID:" + oId);
		    } else if (oDataKind == "getLogURL") {
			// ?

		    } else if (oDataKind == "getPending") {
			// ?

		    } else if (oDataKind == "getStagerReport") {
			// ?

		    } else if (oDataKind == "getPilotStdOut") {
			// text
			me.__oprPrepareAndShowWindowText(jsonData["result"], "Pilot StdOut for JobID:" + oId);

		    } else if (oDataKind == "getPilotStdErr") {
			// text
			me.__oprPrepareAndShowWindowText(jsonData["result"], "Pilot StdErr for JobID:" + oId);

		    }

		} else {

		    alert(jsonData["error"]);

		}

	    }
	});
    },
    __oprPrepareAndShowWindowText : function(sTextToShow, sTitle) {

	var me = this;

	var oWindow = me.getContainer().oprGetChildWindow(sTitle, false, 700, 500);

	var oTextArea = new Ext.create('Ext.form.field.TextArea', {
	    value : sTextToShow,
	    cls : "jm-textbox-help-window"

	});

	oWindow.add(oTextArea);
	oWindow.show();

    },
    __oprPrepareAndShowWindowGrid : function(oData, sTitle, oFields, oColumns) {

	var me = this;

	var oStore = new Ext.data.ArrayStore({
	    fields : oFields,
	    data : oData
	});

	var oWindow = me.getContainer().oprGetChildWindow(sTitle, false, 700, 500);

	var oGrid = Ext.create('Ext.grid.Panel', {
	    store : oStore,
	    columns : oColumns,
	    width : '100%',
	    viewConfig : {
		stripeRows : true,
		enableTextSelection : true
	    }
	});

	oWindow.add(oGrid);
	oWindow.show();

    }

});
