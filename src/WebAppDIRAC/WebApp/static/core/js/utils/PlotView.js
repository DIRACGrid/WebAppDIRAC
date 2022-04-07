/*******************************************************************************
 * It is allow to manage more than one plots in a single application. The
 * RightPanle is replaced to a Presenter widget.
 */
Ext.define("Ext.dirac.utils.PlotView", {
  extend: "Ext.dirac.core.Module",
  requires: [
    "Ext.dirac.utils.Presenter",
    "Ext.dirac.utils.Image",
    "Ext.util.*",
    "Ext.panel.Panel",
    "Ext.form.field.Text",
    "Ext.button.Button",
    "Ext.menu.Menu",
    "Ext.form.field.ComboBox",
    "Ext.layout.*",
    "Ext.form.field.Date",
    "Ext.form.field.TextArea",
    "Ext.form.field.Checkbox",
    "Ext.form.FieldSet",
    "Ext.Button",
    "Ext.dirac.utils.DiracMultiSelect",
    "Ext.util.*",
    "Ext.toolbar.Toolbar",
    "Ext.data.Record",
  ],
  timeout: 7200000, // 2 hours
  title: "",
  reports: {},
  reportsDesc: {},
  reportTypes: [
    ["Accounting", "Accounting"],
    ["Monitoring", "Monitoring"],
  ],
  handlers: {},
  actualReport: null,
  loadState: function (oData) {
    var me = this;
    me.rightPanel.loadState(oData);
  },
  getStateData: function () {
    var me = this;
    var oReturn = me.rightPanel.getStateData();

    return oReturn;
  },

  initComponent: function () {
    var me = this;

    me.loadFile(["static/core/js/utils/css/PlotView.css"], function () {}, me);

    me.launcher.title = me.title;
    me.launcher.maximized = false;

    var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();
    var iDim = Math.floor(Math.min(oDimensions[0], oDimensions[1]) / 2);
    me.launcher.width = 2 * iDim;
    me.launcher.height = iDim;

    me.launcher.x = 0;
    me.launcher.y = 0;

    Ext.apply(me, {
      layout: "border",
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    me.callParent(arguments);
  },

  buildUI: function () {
    var me = this;
    me.callParent();

    me.leftPanel = new Ext.create("Ext.panel.Panel", {
      region: "west",
      floatable: false,
      header: false,
      margins: "0",
      width: 350,
      minWidth: 330,
      maxWidth: 550,
      bodyPadding: 5,
      layout: "anchor",
      scrollable: true,
    });

    me.rightPanel = Ext.create("Ext.dirac.utils.Presenter", {
      region: "center",
      floatable: false,
      header: true,
      margins: "0",
      bodyPadding: 0,
      parent: me,
      reportType: "",
      scope: me,
      collapsible: false,
    });

    me.cmbReportType = Ext.create("Ext.form.field.ComboBox", {
      fieldLabel: "Reports",
      queryMode: "local",
      labelAlign: "top",
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: me.reportTypes,
      }),
      listeners: {
        change: function (field, newValue, oldValue, eOpts) {
          if (newValue == null) return;

          me.leftPanel.body.mask("Wait ...");
          me.cmbDomain.suspendEvent("change");
          me.__resetSelectionWindow();
          me.applyReportType(newValue);
          me.leftPanel.body.unmask();
          me.cmbDomain.resumeEvent("change");
        },
      },
    });

    me.cmbDomain = Ext.create("Ext.form.field.ComboBox", {
      fieldLabel: "Category",
      queryMode: "local",
      labelAlign: "top",
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      store: new Ext.data.ArrayStore({
        fields: ["value", "text"],
        data: [],
      }),
      listeners: {
        change: function (field, newValue, oldValue, eOpts) {
          if (newValue == null) return;

          me.leftPanel.body.mask("Wait ...");
          Ext.Ajax.request({
            url: GLOBAL.BASE_URL + me.handlers[me.actualReport] + "/getSelectionData",
            timeout: me.timeout,
            method: "POST",
            params: {
              type: newValue,
            },
            scope: me,
            success: function (response) {
              var oResult = Ext.JSON.decode(response.responseText);
              if (oResult["success"] == "true") {
                me.applyDataToSelection(oResult, newValue, me.actualReport);
                me.cmbReportType.resumeEvent("change");
              } else GLOBAL.APP.CF.alert(oResult["error"], "error");
              me.leftPanel.body.unmask();
            },
          });
        },
      },
    });

    me.cmbPlotGenerate = Ext.create("Ext.form.field.ComboBox", {
      fieldLabel: "Plot To Generate",
      queryMode: "local",
      labelAlign: "top",
      displayField: "text",
      valueField: "value",
      anchor: "100%",
    });

    me.cmbGroupBy = Ext.create("Ext.form.field.ComboBox", {
      fieldLabel: "Group By",
      queryMode: "local",
      labelAlign: "top",
      displayField: "text",
      valueField: "value",
      anchor: "100%",
    });

    me.fsetTimeSpan = Ext.create("Ext.form.FieldSet", {
      title: "Time Span",
      collapsible: true,
      layout: "anchor",
    });

    me.cmbTimeSpanStore = new Ext.data.ArrayStore({
      fields: ["value", "text"],
      data: me.dataSelectors["Accounting"]["dataSelector"],
    });

    me.cmbTimeSpan = Ext.create("Ext.form.field.ComboBox", {
      queryMode: "local",
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      value: me.dataSelectors["Accounting"]["dataSelector"][0][0],
      store: me.cmbTimeSpanStore,
      listeners: {
        change: function (field, newValue, oldValue, eOpts) {
          me.calendarFrom.hide();
          me.calendarTo.hide();
          me.cmbQuarter.hide();

          switch (newValue) {
            case -1:
              me.calendarFrom.show();
              me.calendarTo.show();
              break;
            case -2:
              me.__fillComboQuarter();
              me.cmbQuarter.show();
              break;
          }
        },
      },
    });

    me.calendarFrom = new Ext.create("Ext.form.field.Date", {
      width: 100,
      format: "Y-m-d",
      fieldLabel: "Initial Date",
      labelAlign: "top",
      hidden: true,
    });

    me.calendarTo = new Ext.create("Ext.form.field.Date", {
      width: 100,
      format: "Y-m-d",
      fieldLabel: "End Date",
      labelAlign: "top",
      hidden: true,
    });

    me.cmbQuarter = Ext.create("Ext.dirac.utils.DiracBoxSelect", {
      fieldLabel: "",
      displayField: "text",
      valueField: "value",
      anchor: "100%",
      hidden: true,
    });

    me.fsetTimeSpan.add([me.cmbTimeSpan, me.calendarFrom, me.calendarTo, me.cmbQuarter]);

    me.fsetSpecialConditions = Ext.create("Ext.form.FieldSet", {
      title: "Selection Conditions",
      collapsible: true,
      layout: "anchor",
    });

    me.fsetAdvanced = Ext.create("Ext.form.FieldSet", {
      title: "Advanced Options",
      collapsible: true,
      layout: "anchor",
    });

    me.advancedPlotTitle = Ext.create("Ext.form.field.Text", {
      fieldLabel: "Plot Title",
      labelAlign: "top",
      anchor: "100%",
    });

    me.advancedPin = Ext.create("Ext.form.field.Checkbox", {
      boxLabel: "Pin Dates",
    });

    me.advancedNotScaleUnits = Ext.create("Ext.form.field.Checkbox", {
      boxLabel: "Do not scale units",
    });

    me.fsetAdvanced.add([me.advancedPlotTitle, me.advancedPin, me.advancedNotScaleUnits]);

    me.leftPanel.add([me.cmbReportType, me.cmbDomain, me.cmbPlotGenerate, me.cmbGroupBy, me.fsetTimeSpan, me.fsetSpecialConditions, me.fsetAdvanced]);

    me.btnPlot = new Ext.Button({
      tooltip: "It creates a new plot",
      text: "New",
      margin: 3,
      iconCls: "accp-submit-icon",
      handler: function () {
        me.__generatePlot(null, null, true);
      },
      scope: me,
    });

    me.btnReset = new Ext.Button({
      tooltip: "It reset the Selection panel.",
      text: "Reset",
      margin: 3,
      iconCls: "accp-reset-icon",
      handler: function () {
        me.__resetSelectionWindow();
      },
      scope: me,
    });

    me.btnRefresh = new Ext.Button({
      tooltip: "It refreshes the Selection panel.",
      text: "Refresh",
      margin: 3,
      iconCls: "accp-refresh-icon",
      handler: function () {
        me.leftPanel.body.mask("Wait ...");
        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + me.handlers[me.actualReport] + "/getSelectionData",
          timeout: me.timeout,
          method: "POST",
          params: {
            type: me.cmbDomain.getValue(),
          },
          scope: me,
          success: function (response) {
            var oResult = Ext.JSON.decode(response.responseText);

            if (oResult["success"] == "true") me.applySpecialConditions(oResult);
            else alert(oResult["error"]);
            me.leftPanel.body.unmask();
          },
          failure: function (response, opt) {
            GLOBAL.APP.CF.showAjaxErrorMessage(response);
            me.rightPanel.body.unmask();
            me.leftPanel.body.unmask();
          },
        });
      },
      scope: me,
    });

    /*
     * This button is used to refresh any previously selected plot that is
     * already generated.
     */
    me.btnRefreshPlot = new Ext.Button({
      tooltip: "It updates the selected plot.",
      text: "Apply",
      margin: 3,
      iconCls: "dirac-icon-upload",
      handler: function () {
        image = me.rightPanel.getLastClickedImage();
        if (image != null) {
          me.__generatePlot(image, null);
        } else {
          Ext.dirac.system_info.msg("Notification", "Please select an image what you want to change!");
        }
      },
      scope: me,
    });

    me.btnApplyAll = new Ext.Button({
      tooltip: "The time span will be applied to all plots",
      text: "ApplyAll",
      margin: 3,
      iconCls: "dirac-icon-upload",
      handler: function () {
        var me = this;
        var oParamsData = me.__getSelectionParameters("show_plot");
        me.rightPanel.applyTimeSpan(oParamsData);
      },
      scope: me,
    });

    var oPanelButtons = new Ext.create("Ext.toolbar.Toolbar", {
      items: [me.btnPlot, me.btnRefreshPlot, me.btnReset, me.btnRefresh, me.btnApplyAll],
      layout: "column",
      columnWidth: 3,
      dock: "bottom",
    });

    me.leftPanel.addDocked(oPanelButtons);
    me.add([me.leftPanel, me.rightPanel]);
  },
  __generatePlot: function (image, oLoadState, selectAddedPlot) {
    var me = this;
    var oParams = null;
    if (oLoadState == null) {
      if (!me.__validateConditions(true)) {
        if (me.rightPanel.body) {
          me.rightPanel.body.unmask();
        }
        if (me.leftPanel.body) {
          me.leftPanel.body.unmask();
        }
        return;
      }

      oParams = me.__getSelectionParameters("show_plot");
    } else {
      oParams = oLoadState["params"];
      if ("reportType" in oLoadState) {
        me.actualReport = oLoadState["reportType"];
      } else {
        me.actualReport = oLoadState["Accounting"];
      }
    }

    if (image) {
      image.setLoading(true);
      var requestHandler = me.handlers["Accounting"];
      if (image.reportType) {
        selectorReportType = me.cmbReportType.getValue();
        if (image.reportType != selectorReportType) {
          requestHandler = me.handlers[selectorReportType];
          image.reportType = selectorReportType;
        } else {
          requestHandler = me.handlers[image.reportType];
        }
      }
      Ext.Ajax.request({
        url: GLOBAL.BASE_URL + requestHandler + "/generatePlot",
        timeout: me.timeout,
        params: oParams,
        scope: me,
        success: function (response) {
          var me = this;

          me.leftPanel.body.unmask();

          var response = Ext.JSON.decode(response.responseText);

          if (response["success"]) {
            var src = GLOBAL.BASE_URL + requestHandler + "/getPlotImg?fileName=" + response["data"];
            me.rightPanel.replaceImage(image, src, oParams);
          } else {
            GLOBAL.APP.CF.alert(response["errors"], "error");
          }
        },
        failure: function (response, opt) {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);

          if (me.rightPanel.body) {
            me.rightPanel.body.unmask();
          }
          if (me.leftPanel.body) {
            me.leftPanel.body.unmask();
          }
        },
      });
    } else {
      if (me.rightPanel.body) {
        me.rightPanel.body.unmask();
      }
      if (me.leftPanel.body) {
        me.leftPanel.body.unmask();
      }

      var width = 99 / me.rightPanel.columnWidth;
      width = "." + Math.round(width);
      requestHandler = me.handlers["Accounting"];
      if (me.actualReport) {
        requestHandler = me.handlers[me.actualReport];
      }
      var oImg = Ext.create("Ext.dirac.utils.Image", {
        plotParams: oParams,
        reportType: me.actualReport != null ? me.actualReport : "Accounting", //in principle actualReport can not be null
        columnWidth: width,
        rightPanel: me.rightPanel,
        leftPanel: me.leftPanel,
        scope: me,
        listeners: {
          afterrender: function (me) {
            me.el.on({
              load: function (evt, ele, opts) {
                me.setLoading(false);
                if (me.isSetSrc) {
                  if (me.rightPanel.body) {
                    me.rightPanel.body.unmask();
                  }
                  if (me.leftPanel.body) {
                    me.leftPanel.body.unmask();
                  }
                  me.isSetSrc = false;
                } else {
                  if (selectAddedPlot) {
                    var lastClickedImg = me.rightPanel.getLastClickedImage();
                    if (lastClickedImg) {
                      me.rightPanel.unselectImage(lastClickedImg);
                    }
                    me.rightPanel.selectImage(me);
                  }
                }
              },
            });
          },

          // When new plot added on the wall generate image
          added: function (container, pos, eOpts) {
            var me = this;
            me.setLoading(true);
            Ext.Ajax.request({
              url: GLOBAL.BASE_URL + requestHandler + "/generatePlot",
              timeout: me.timeout,
              params: oParams,
              scope: me,
              success: function (response) {
                var me = this;

                if (me.leftPanel.body) {
                  me.leftPanel.body.unmask();
                }

                var response = Ext.JSON.decode(response.responseText);

                if (response["success"]) {
                  var src = GLOBAL.BASE_URL + me.scope.handlers[me.reportType] + "/getPlotImg?fileName=" + response["data"];

                  me.setSrc(src);

                  me.setLoading(true);
                } else {
                  GLOBAL.APP.CF.alert(response["errors"], "error");
                }
              },
              failure: function (response, opt) {
                GLOBAL.APP.CF.showAjaxErrorMessage(response);

                if (me.rightPanel.body) {
                  me.rightPanel.body.unmask();
                }
                if (me.leftPanel.body) {
                  me.leftPanel.body.unmask();
                }

                me.setLoading(false);
              },
            });
          },
        },
      });

      me.rightPanel.addImage(oImg);
    }
  },
  __loadSelectionData: function (oParams) {
    var me = this;

    me.plotParams = oParams;

    if (!("typeName" in oParams)) return;

    me.__additionalDataLoad = function () {
      me.cmbGroupBy.setValue(oParams["grouping"]);
      me.cmbPlotGenerate.setValue(oParams["plotName"]);
      me.cmbTimeSpan.setValue(oParams["timeSelector"]);

      me.calendarFrom.hide();
      me.calendarTo.hide();
      me.cmbQuarter.hide();

      switch (oParams["timeSelector"]) {
        case -1:
          me.calendarFrom.setValue(oParams["startTime"]);
          me.calendarTo.setValue(oParams["endTime"]);
          me.calendarFrom.show();
          me.calendarTo.show();
          break;

        case -2:
          var oNewQuartersArray = [];

          for (var i = 0; i < oParams["quarters"].length; i++) oNewQuartersArray.push(parseInt(oParams["quarters"][i].replace(" Q", "")));

          me.cmbQuarter.setValue(oNewQuartersArray);
          me.cmbQuarter.show();
          break;
      }

      me.advancedPlotTitle.setValue(oParams["plotTitle"]);

      if ("pinDates" in oParams) {
        if (oParams["pinDates"] == "true") me.advancedPin.setValue(true);
        else me.advancedPin.setValue(false);
      } else me.advancedPin.setValue(false);

      if ("ex_staticUnits" in oParams) {
        if (oParams["ex_staticUnits"] == "true") me.advancedNotScaleUnits.setValue(true);
        else me.advancedNotScaleUnits.setValue(false);
      } else me.advancedNotScaleUnits.setValue(false);

      for (var i = 0; i < me.fsetSpecialConditions.items.length; i++) {
        me.fsetSpecialConditions.items.getAt(i).setValue(null);
      }

      var oStandardParamsList = [
        "grouping",
        "plotName",
        "typeName",
        "timeSelector",
        "startTime",
        "endTime",
        "plotTitle",
        "pinDates",
        "ex_staticUnits",
      ];

      for (var oParam in oParams) {
        // first we check whether the param is not someone form the default ones
        if (!oStandardParamsList.includes(oParam)) {
          for (var i = 0; i < me.fsetSpecialConditions.items.length; i++) {
            if (me.fsetSpecialConditions.items.getAt(i).getName() == oParam) {
              me.fsetSpecialConditions.items.getAt(i).setInverseSelection(oParams[oParam][0] == 1);
              try {
                me.fsetSpecialConditions.items.getAt(i).setValue(Ext.JSON.decode(oParams[oParam]));
              } catch (err) {
                me.fsetSpecialConditions.items.getAt(i).setValue(oParams[oParam].split(","));
              }

              break;
            }
          }
        }
      }
    };

    if (me.cmbDomain.getValue() == oParams["typeName"]) {
      me.__additionalDataLoad();
      me.__additionalDataLoad = null;
    } else {
      me.cmbReportType.suspendEvent("change");
      me.cmbDomain.setValue(oParams["typeName"]);
    }
  },
  __getSelectionParameters: function (sIntention) {
    var me = this;

    var sDomain = me.cmbDomain.getValue();

    var oParams = {
      grouping: me.cmbGroupBy.getValue(),
      plotName: me.cmbPlotGenerate.getValue(),
      typeName: sDomain,
      timeSelector: me.cmbTimeSpan.getValue(),
    };

    var fixTime = function (st) {
      var year = st.getFullYear().toString();
      var month = st.getMonth() + 1;
      month = (month < 10 ? "0" : "") + month;
      var day = st.getDate();
      day = (day < 10 ? "0" : "") + day;
      return year + "-" + month + "-" + day;
    };

    // Time Selector
    if (oParams.timeSelector == -1) {
      oParams.startTime = fixTime(me.calendarFrom.getValue());
      if (me.calendarTo.getValue() != null) oParams.endTime = fixTime(me.calendarTo.getValue());
    } else if (oParams.timeSelector == -2) {
      var oSelectedQuarters = me.cmbQuarter.getValue();
      var oMinQuarter = Ext.Array.min(oSelectedQuarters);
      var oMaxQuarter = Ext.Array.max(oSelectedQuarters);

      var oYear = Math.floor(oMinQuarter / 10);
      var oMonth = ((oMinQuarter % 10) - 1) * 3 + 1;

      oParams.startTime = oYear.toString() + "-" + (oMonth < 10 ? "0" : "") + oMonth.toString() + "-01";

      var oYear = Math.floor(oMaxQuarter / 10);
      var oMonth = (oMaxQuarter % 10) * 3;
      var oDay = oMonth == 6 ? 30 : 31;

      oParams.endTime = oYear.toString() + "-" + (oMonth < 10 ? "0" : "") + oMonth.toString() + "-" + oDay.toString();

      var oRawSelection = me.cmbQuarter.getRawValue().split(",");
      var oQuarters = [];

      for (var i = 0; i < oRawSelection.length; i++) oQuarters.push(Ext.util.Format.trim(oRawSelection[i]));

      oParams.quarters = oQuarters;
    }

    // Special condition selection
    for (var i = 0; i < me.fsetSpecialConditions.items.length; i++) {
      var oCondItem = me.fsetSpecialConditions.items.getAt(i);
      if (oCondItem.getValue().length != 0) {
        isInverseSelection = typeof oCondItem.isInverseSelection == "function" && oCondItem.isInverseSelection();
        if (sIntention == "show_plot") {
          param = isInverseSelection ? oCondItem.getInverseSelection() : oCondItem.getValue();
          oParams[oCondItem.getName()] = Ext.JSON.encode(param);
        } else if (sIntention == "save_state") {
          oParams[oCondItem.getName()] = [isInverseSelection ? 1 : 0, oCondItem.getValue().join(",")];
        }
      }
    }

    if (Ext.util.Format.trim(me.advancedPlotTitle.getValue()) != "") {
      oParams["plotTitle"] = me.advancedPlotTitle.getValue();
      sTitle = me.advancedPlotTitle.getValue();
    }

    if (me.advancedPin.checked) oParams["pinDates"] = "true";

    if (me.advancedNotScaleUnits.checked) oParams["ex_staticUnits"] = "true";

    return oParams;
  },
  __fillComboQuarter: function () {
    var me = this;

    var oStore = me.cmbQuarter.getStore();
    oStore.removeAll();

    var now = new Date();

    var currentQ = Math.floor(now.getUTCMonth() / 3) + 1;
    var currentYear = now.getUTCFullYear();

    var oRecords = [];

    do {
      var recLabel = "" + currentYear + " Q" + currentQ;
      var recValue = currentYear * 10 + currentQ;

      oRecords.push([recValue, recLabel]);

      currentQ = currentQ - 1;

      if (currentQ == 0) {
        currentQ = 4;
        currentYear = currentYear - 1;
      }
    } while (oRecords.length < 8);

    var oNewStore = new Ext.data.ArrayStore({
      fields: ["value", "text"],
      data: oRecords,
    });

    me.cmbQuarter.bindStore(oNewStore);
  },
  __resetSelectionWindow: function () {
    var me = this;

    me.cmbGroupBy.setValue(null);
    me.cmbPlotGenerate.setValue(null);
    me.calendarFrom.setValue(null);
    me.calendarTo.setValue(null);
    var defaultTime = 86400;
    if (me.actualReport) {
      defaultTime = me.dataSelectors[me.actualReport]["defaultTime"];
    }
    me.cmbTimeSpan.setValue(defaultTime);
    me.advancedPin.setValue(false);
    me.advancedNotScaleUnits.setValue(false);
    me.advancedPlotTitle.setValue("");
    me.fsetSpecialConditions.removeAll();
    me.cmbDomain.setValue(null);
  },
  applyDataToSelection: function (oData, sValue, reportType) {
    var me = this;

    me.cmbReportType.setValue(reportType);
    var oList = oData["result"]["plotsList"];

    me.__oprDoubleElementItemList(oList);

    var oStore = new Ext.data.ArrayStore({
      fields: ["value", "text"],
      data: oList,
    });

    me.cmbPlotGenerate.setValue(null);

    me.cmbPlotGenerate.bindStore(oStore);

    var oSelectionData = oData["result"]["selectionValues"];

    var oSelectionOptions = me.reportsDesc[me.actualReport][sValue]["selectionConditions"];
    oSelectionOptions.sort();
    me.fsetSpecialConditions.removeAll();

    var oListForGroup = [];

    for (var i = 0; i < oSelectionOptions.length; i++) {
      oListForGroup.push([oSelectionOptions[i][0], oSelectionOptions[i][0]]);

      if (oSelectionOptions[i][0] == "User" || oSelectionOptions[i][0] == "UserGroup") {
        var allowedProperties = [
          "CSAdministrator",
          "JobAdministrator",
          "JobMonitor",
          "AccountingMonitor",
          "UserManager",
          "Operator",
          "ProductionManagement",
        ];
        var found = false;
        for (var j = 0; j < allowedProperties.length; j++) {
          // Only
          // powerfull
          // users can
          // choose the
          // User and
          // UserGroup
          if (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, allowedProperties[j]) != -1) {
            found = true;
            break;
          }
        }
        if (!found) {
          continue;
        }
      }

      var oList = oSelectionData[oSelectionOptions[i][0]];

      me.__oprDoubleElementItemList(oList);

      // When items more than 10000 then rendering block all application for a long time
      // See issue https://github.com/DIRACGrid/WebAppDIRAC/issues/609
      if (oList.length > 10000) {
        var oMultiList = {
          xtype: "textfield",
          anchor: "100%",
          labelAlign: "top",
          fieldLabel: oSelectionOptions[i][1],
          name: oSelectionOptions[i][0],
        };
      } else {
        var oMultiList = Ext.create("Ext.dirac.utils.DiracBoxSelect", {
          fieldLabel: oSelectionOptions[i][1],
          displayField: "text",
          valueField: "value",
          anchor: "100%",
          // See https://docs.sencha.com/extjs/7.3.1/classic/Ext.form.field.Tag.html#cfg-filterPickList
          filterPickList: true,
          // See https://docs.sencha.com/extjs/7.3.1/classic/Ext.form.field.Tag.html#cfg-createNewOnEnter
          createNewOnEnter: true,
          forceSelection: false,
          store: new Ext.data.ArrayStore({
            fields: ["value", "text"],
            data: oList,
          }),
          labelAlign: "top",
          name: oSelectionOptions[i][0],
          queryMode: "local",
        });
      }

      me.fsetSpecialConditions.add(oMultiList);
    }

    if (sValue == "DataOperation") {
      // It has to added afterward as we can not select it from
      // the selection condition.
      oListForGroup.push(["Channel", "Channel"]);
    }

    if (sValue == "Job") {
      oListForGroup.push(["Country", "Country"]);
      oListForGroup.push(["Grid", "Grid"]);
    }

    var oStore = new Ext.data.ArrayStore({
      fields: ["value", "text"],
      data: oListForGroup,
    });

    me.cmbGroupBy.setValue(null);

    me.cmbGroupBy.bindStore(oStore);
    me.cmbGroupBy.store.sort("text", "ASC");

    // we call the additional function
    if (me.__additionalDataLoad != null) {
      me.__additionalDataLoad();
      me.__additionalDataLoad = null;
    } else {
      me.advancedPlotTitle.setValue("");
    }
  },
  applySpecialConditions: function (oData) {
    var me = this;

    var oSelectionData = oData["result"]["selectionValues"];

    for (var i = 0; i < me.fsetSpecialConditions.items.length; i++) {
      var oBox = me.fsetSpecialConditions.items.getAt(i);

      var oList = oSelectionData[oBox.getName()];
      me.__oprDoubleElementItemList(oList);

      oBox.loadData(oList);
    }
  },
  __oprDoubleElementItemList: function (oList) {
    for (var i = 0; i < oList.length; i++) oList[i] = [oList[i], oList[i]];
  },
  __validateConditions: function (bWithMessages) {
    var me = this;
    var bValid = true;

    // check if the plot type is chosen
    if (me.cmbDomain.getValue() == null || Ext.util.Format.trim(me.cmbDomain.getValue()) == "") {
      if (bWithMessages) GLOBAL.APP.CF.alert("No category defined !", "warning");

      bValid = false;
    } else if (me.cmbPlotGenerate.getValue() == null || Ext.util.Format.trim(me.cmbPlotGenerate.getValue()) == "") {
      if (bWithMessages) GLOBAL.APP.CF.alert("No plot type defined !", "warning");

      bValid = false;
    } else if (me.cmbGroupBy.getValue() == null || Ext.util.Format.trim(me.cmbGroupBy.getValue()) == "") {
      if (bWithMessages) GLOBAL.APP.CF.alert("No data grouping defined !", "warning");

      bValid = false;
    }

    // checking the time span selection

    switch (me.cmbTimeSpan.getValue()) {
      case -1:
        if (me.calendarFrom.getValue() == null) {
          if (bWithMessages) GLOBAL.APP.CF.alert("No start date selected !", "warning");

          bValid = false;
        }

        if (me.calendarFrom.getValue() != null && me.calendarTo.getValue() != null) {
          if (me.calendarFrom.getValue() > me.calendarTo.getValue()) {
            if (bWithMessages) GLOBAL.APP.CF.alert("Selected dates are not valid !", "warning");

            bValid = false;
          }
        }
        break;
      case -2:
        if (me.cmbQuarter.getValue().length == 0) {
          if (bWithMessages) GLOBAL.APP.CF.alert("No quarters selected !", "warning");

          bValid = false;
        }
        break;
    }

    return bValid;
  },
  applyReportType: function (reportType) {
    var me = this;

    var categoryStore = new Ext.data.ArrayStore({
      fields: ["value", "text"],
      data: me.reports[reportType],
    });
    //me.cmbDomain.setValue(null);
    me.cmbDomain.bindStore(categoryStore);
    me.cmbDomain.store.sort("text", "ASC");
    me.actualReport = reportType;
    me.rightPanel.reportType = me.handlers[reportType];

    var timeSelector = new Ext.data.ArrayStore({
      fields: ["value", "text"],
      data: me.dataSelectors[me.actualReport]["dataSelector"],
    });
    me.cmbTimeSpan.bindStore(timeSelector);
  },
});
