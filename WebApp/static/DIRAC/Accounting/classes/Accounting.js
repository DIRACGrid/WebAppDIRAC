/*******************************************************************************
 * It is allow to manage more than one plots in a single application. The RightPanle is replaced to a Presenter
 * widget.
 */
Ext.define('DIRAC.Accounting.classes.Accounting', {
      extend : 'DIRAC.AccountingPlot.classes.AccountingPlot',
      requires : ['DIRAC.AccountingPlot.classes.AccountingPlot', 'DIRAC.Accounting.classes.Presenter', "DIRAC.Accounting.classes.Image"],
      timeout : 7200000, // 2 hours
      loadState : function(oData) {
        var me = this;
        me.rightPanel.loadState(oData);
      },
      getStateData : function() {
        var me = this;
        var oReturn = me.rightPanel.getStateData();

        return oReturn;
      },
      buildUI : function() {
        var me = this;
        me.callParent();

        me.rightPanel.removeAll()
        me.remove(me.rightPanel);

        me.rightPanel = Ext.create('DIRAC.Accounting.classes.Presenter', {
              region : "center",
              floatable : false,
              header : true,
              margins : '0',
              bodyPadding : 0,
              parent : me
            });

        try {
          me.add(me.rightPanel);
        } catch (e) {
          GLOBAL.APP.CF.log("error", e);
          GLOBAL.APP.CF.log("error", "In order do not see this error, please do not run debug mode the application!");
        }

        me.btnPlot = new Ext.Button({
              tooltip : 'It creates a new plot',
              text : 'New',
              margin : 3,
              iconCls : "accp-submit-icon",
              handler : function() {

                me.__generatePlot(null, null, true);
              },
              scope : me

            });

        me.btnReset = new Ext.Button({
              tooltip : 'It reset the Selection panel.',
              text : 'Reset',
              margin : 3,
              iconCls : "accp-reset-icon",
              handler : function() {
                me.__resetSelectionWindow();
              },
              scope : me

            });

        me.btnRefresh = new Ext.Button({
              tooltip : 'It refreshes the Selection panel.',
              text : 'Refresh',
              margin : 3,
              iconCls : "accp-refresh-icon",
              handler : function() {

                me.leftPanel.body.mask("Wait ...");
                Ext.Ajax.request({
                      url : GLOBAL.BASE_URL + 'AccountingPlot/getSelectionData',
                      timeout : me.timeout,
                      method : 'POST',
                      params : {
                        type : me.cmbDomain.getValue()
                      },
                      scope : me,
                      success : function(response) {

                        var oResult = Ext.JSON.decode(response.responseText);

                        if (oResult["success"] == "true")
                          me.applySpecialConditions(oResult);
                        else
                          alert(oResult["error"]);
                        me.leftPanel.body.unmask();
                      },
                      failure : function(response, opt) {
                        GLOBAL.APP.CF.showAjaxErrorMessage(response);
                        me.rightPanel.body.unmask();
                        me.leftPanel.body.unmask();
                      }
                    });

              },
              scope : me

            });

        /*
         * This button is used to refresh any previously selected plot that is
         * already generated.
         */
        me.btnRefreshPlot = new Ext.Button({
              tooltip : 'It updates the selected plot.',
              text : 'Apply',
              margin : 3,
              iconCls : "dirac-icon-upload",
              handler : function() {
                image = me.rightPanel.getLastClickedImage();
                if (image != null){
                  me.__generatePlot(image, null);
                }else{
                  Ext.dirac.system_info.msg("Notification", 'Please select an image what you want to change!');
                }
              },
              scope : me

            });

        me.btnApplyAll = new Ext.Button({
              tooltip : 'The time span will be applied to all plots',
              text : 'ApplyAll',
              margin : 3,
              iconCls : "dirac-icon-upload",
              handler : function() {
                var me = this;
                var oParamsData = me.__getSelectionParametars("show_plot");
                me.rightPanel.applyTimeSpan(oParamsData);
              },
              scope : me
            });

        var oPanelButtons = new Ext.create('Ext.toolbar.Toolbar', {
              items : [me.btnPlot, me.btnRefreshPlot, me.btnReset, me.btnRefresh, me.btnApplyAll],
              layout : 'column',
              columnWidth : 3,
              dock : 'bottom'
            });
        me.leftPanel.destroyDockedItems();
        me.leftPanel.addDocked(oPanelButtons);

      },
      __generatePlot : function(image, oLoadState, selectAddedPlot) {

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

          oParams = me.__getSelectionParametars("show_plot");

        } else {

          oParams = oLoadState["params"];

        }

        if (image) {
          image.setLoading(true);
          Ext.Ajax.request({
                url : GLOBAL.BASE_URL + 'AccountingPlot/generatePlot',
                timeout : me.timeout,
                params : oParams,
                scope : me,
                success : function(response) {
                  var me = this;

                  me.leftPanel.body.unmask();

                  var response = Ext.JSON.decode(response.responseText);

                  if (response["success"]) {

                    var src = GLOBAL.BASE_URL + "AccountingPlot/getPlotImg?file=" + response["data"]; 

                    var params = {
                      'src' : src,
                      'params' : oParams
                    };
                    me.rightPanel.replaceImage(image, params);

                  } else {
                    GLOBAL.APP.CF.alert(response["errors"], "error");
                  }

                },
                failure : function(response, opt) {

                  GLOBAL.APP.CF.showAjaxErrorMessage(response);

                  if (me.rightPanel.body) {
                    me.rightPanel.body.unmask();
                  }
                  if (me.leftPanel.body) {
                    me.leftPanel.body.unmask();
                  }

                }
              });
        } else {

          if (me.rightPanel.body) {
            me.rightPanel.body.unmask();
          }
          if (me.leftPanel.body) {
            me.leftPanel.body.unmask();
          }

          var width = 99 / me.rightPanel.columnWidth;
          width = '.' + Math.round(width);
          var oImg = Ext.create('DIRAC.Accounting.classes.Image', {
                plotParams : oParams,
                columnWidth : width,
                rightPanel : me.rightPanel,
                leftPanel : me.leftPanel,
                listeners : {

                  afterrender : function(me) {
                    me.el.on({
                          load : function(evt, ele, opts) {
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
                          }
                        });
                  },

                  added : function(container, pos, eOpts) {
                    var me = this;
                    
                    Ext.Ajax.request({
                          url : GLOBAL.BASE_URL + 'AccountingPlot/generatePlot',
                          timeout : me.timeout,
                          params : oParams,
                          scope : me,
                          success : function(response) {
                            var me = this;

                            if (me.leftPanel.body){
                              me.leftPanel.body.unmask();
                            }

                            var response = Ext.JSON.decode(response.responseText);

                            if (response["success"]) {

                              var src = GLOBAL.BASE_URL + "AccountingPlot/getPlotImg?file=" + response["data"];

                              me.setSrc(src);
                              
                              me.setLoading(true);

                            } else {
                              GLOBAL.APP.CF.alert(response["errors"], "error");
                            }

                          },
                          failure : function(response, opt) {

                            GLOBAL.APP.CF.showAjaxErrorMessage(response);

                            if (me.rightPanel.body) {
                              me.rightPanel.body.unmask();
                            }
                            if (me.leftPanel.body) {
                              me.leftPanel.body.unmask();
                            }
                            
                            me.setLoading(false);

                          }
                        });

                  }
                }
              });
          
          me.rightPanel.addImage(oImg);

        }

      },
      __loadSelectionData : function(oParams) {

        var me = this;

        me.plotParams = oParams;

        if (!("_typeName" in oParams))
          return;

        me.__additionalDataLoad = function() {

          me.cmbGroupBy.setValue(oParams["_grouping"]);
          me.cmbPlotGenerate.setValue(oParams["_plotName"]);
          me.cmbTimeSpan.setValue(oParams["_timeSelector"]);

          me.calendarFrom.hide();
          me.calendarTo.hide();
          me.cmbQuarter.hide();

          switch (oParams["_timeSelector"]) {

            case -1 :
              me.calendarFrom.setValue(oParams["_startTime"]);
              me.calendarTo.setValue(oParams["_endTime"]);
              me.calendarFrom.show();
              me.calendarTo.show();
              break;

            case -2 :
              var oNewQuartersArray = [];

              for (var i = 0; i < oParams["_quarters"].length; i++)
                oNewQuartersArray.push(parseInt(oParams["_quarters"][i].replace(" Q", "")));

              me.cmbQuarter.setValue(oNewQuartersArray);
              me.cmbQuarter.show();
              break;

          }

          me.advancedPlotTitle.setValue(oParams["_plotTitle"]);

          if ("_pinDates" in oParams) {

            if (oParams["_pinDates"] == "true")
              me.advancedPin.setValue(true);
            else
              me.advancedPin.setValue(false);

          } else
            me.advancedPin.setValue(false);

          if ("_ex_staticUnits" in oParams) {

            if (oParams["_ex_staticUnits"] == "true")
              me.advancedNotScaleUnits.setValue(true);
            else
              me.advancedNotScaleUnits.setValue(false);

          } else
            me.advancedNotScaleUnits.setValue(false);

          for (var i = 0; i < me.fsetSpecialConditions.items.length; i++) {

            me.fsetSpecialConditions.items.getAt(i).setValue(null);

          }

          var oStandardParamsList = ["_grouping", "_plotName", "_typeName", "_timeSelector", "_startTime", "_endTime", "_plotTitle", "_pinDates", "_ex_staticUnits"];

          for (var oParam in oParams) {

            // first we check whether the param is not someone form the
            // default ones
            var oFound = false;

            for (var i = 0; i < oStandardParamsList.length; i++) {

              if (oParam == oStandardParamsList[i]) {

                oFound = true;
                break;

              }

            }

            if (!oFound) {

              for (var i = 0; i < me.fsetSpecialConditions.items.length; i++) {

                var oNewUnderlinedName = "_" + me.fsetSpecialConditions.items.getAt(i).getName();

                if (oNewUnderlinedName == oParam) {

                  me.fsetSpecialConditions.items.getAt(i).setInverseSelection((oParams[oParam][0] == 1));
                  me.fsetSpecialConditions.items.getAt(i).setValue(oParams[oParam].split(","));

                  break;

                }

              }

            }

          }

        };

        if (me.cmbDomain.getValue() == oParams["_typeName"]) {

          me.__additionalDataLoad();
          me.__additionalDataLoad = null;
        } else {
          me.cmbDomain.setValue(oParams["_typeName"]);
        }

      }
    });
