/**
 * This is used to present different plots.
 */
Ext.define("Ext.dirac.utils.Presenter", {
  extend: "Ext.panel.Panel",
  requires: ["Ext.dirac.utils.PanelDragDrop", "Ext.panel.Tool"],
  scrollable: true,
  frame: true,
  lastClickedImage: null,
  columnWidth: 3,
  maxColumns: 6,
  refreshCycle: 0,
  collapsible: false,
  layout: "column",
  margins: "2 0 2 0",
  monitorResize: true,
  multiSelect: true,
  timeout: 7200000, // // 2 hours
  plugins: ["paneldragdrop"],
  tools: [],
  reportType: null,
  refreshTimeout: null,
  /*
   * listeners : { render : function(oElem, eOpts) { var me = this;
   * me.header.hide(); me.mon(oElem.el, 'mouseover', function(event, html,
   * eOpts) { me.header.show(); me.parent.leftPanel.show(); }, me);
   * me.mon(oElem.el, 'mouseout', function(event, html, eOpts) {
   * me.header.hide(); if (me.parent.leftPanel.isCollaspsed) {
   * Ext.Function.defer(function() { me.parent.leftPanel.hide(); }, 2000,
   * me); } }, me); } },
   */
  loadState: function (oData) {
    var me = this;
    me.columnWidth = oData.columnWidth;
    me.setColumnWidth(me.columnWidth);

    if (oData.refreshCycle) {
      me.refreshCycle = oData.refreshCycle;
    }

    for (var i in oData.plots) {
      me.parent.__generatePlot(null, oData.plots[i]);
    }

    if (oData.leftPanelCollapsed) {
      me.parent.leftPanel.collapse();
    }

    me.setRefreshCycle(me.refreshCycle);
    me.autoRefresh.items.getAt(me.autoRefresh.items.findIndex("value", me.refreshCycle)).setChecked(true);

    var now = new Date();
    var UTCTime = now.toUTCString();
    UTCTime = UTCTime.replace("GMT", "[UTC]");
    me.updateTime.setText("Updated:" + UTCTime);
  },
  getStateData: function () {
    var me = this;
    var oReturn = {};
    oReturn.plots = [];
    oReturn.columnWidth = me.columnWidth;
    oReturn.refreshCycle = me.refreshCycle;
    oReturn.leftPanelCollapsed = me.parent.leftPanel.collapsed;

    me.items.each(function (value, index) {
      var item = {
        params: value.plotParams,
        reportType: value.reportType,
      };
      oReturn.plots.push(item);
    });
    return oReturn;
  },
  initComponent: function () {
    var me = this;
    me.menuItems = {
      Disable: 0,
      "Each 15m": 900000, // 60000,//900000,
      "Each hour": 3600000,
      "Each day": 86400000,
    };

    me.autoRefresh = Ext.create("Ext.menu.Menu", {
      listeners: {
        click: function (menu, menuItem, e, eOpts) {
          me.setRefreshCycle(menuItem.value);
        },
      },
    });

    for (var i in me.menuItems) {
      var item = null;
      if (me.menuItems[i] == "-1") {
        item = Ext.create("Ext.menu.Item", {
          text: i,
          value: me.menuItems[i],
        });
      } else {
        item = new Ext.menu.CheckItem({
          checked: me.menuItems[i] == me.refreshCycle ? true : false,
          group: "column",
          value: me.menuItems[i],
          text: i,
        });
      }
      me.autoRefresh.add(item);
    }

    me.refreshTool = Ext.create("Ext.panel.Tool", {
      type: "refresh",
      iconCls: Ext.baseCSSPrefix + "tbar-loading",
      tooltip: "Setting the refresh period",
      handler: function () {
        if (!me.refreshMenu) {
          // when the button is not pressed very long...
          me.setRefreshCycle(-1);
        }
      },
    });
    me.refreshTool.on("render", function (oElem, eOpts) {
      me.mon(
        oElem.el,
        "mouseup",
        function (event, html, eOpts) {
          me.mouseup = true;
        },
        me
      );
      me.mon(
        oElem.el,
        "mousedown",
        function (e, t, eOpts) {
          me.mouseup = false;
          Ext.defer(
            function () {
              if (me.mouseup == false) {
                // show menu
                me.autoRefresh.items.getAt(me.autoRefresh.items.findIndex("value", me.refreshCycle)).setChecked(true);
                me.autoRefresh.showBy(oElem.el);
                me.refreshMenu = true;
              } else {
                me.mouseup = false;
              }
            },
            1500,
            me
          );
        },
        me
      );
    });
    me.refreshTool.on("click", function () {
      if (me.refreshMenu) {
        me.refreshMenu = false;
        return false;
      }
    });
    me.updateTime = Ext.create("Ext.form.Label", {
      xtype: "label",
      text: "Updated: -",
      style: GLOBAL.WEB_THEME == "ext-all-neptune" ? "font-weight:bold;color:#FFFFFF;" : "font-weight:bold;color:#666666;",
      // #990066;', //#666666;'
      // html: "<span style='color:red'>Updated: - </span>"
    });

    me.configurationTool = Ext.create("Ext.panel.Tool", {
      type: "gear",
      tooltip: "Change the column width",
      scope: this,
      callback: function (panel, tool) {
        var width = 99;
        delete panel.columnMenu;
        panel.columnMenu = null;
        panel.columnMenu = new Ext.menu.Menu();
        for (i = 1; i < panel.maxColumns; i++) {
          var item = new Ext.menu.CheckItem({
            value: i, // ??? maybe there is a way to get the
            // position of the
            // item in a container??
            checked: i == panel.columnWidth ? true : false,
            checkHandler: function (item, checked) {
              if (checked) {
                panel.setColumnWidth(item.value);
              }
            },
            group: "column",
            text: i > 1 ? i + " Columns" : i + " Column",
          });
          panel.columnMenu.add(item);
        }
        panel.columnMenu.showBy(tool.el);
      },
    });
    me.tools = [me.refreshTool, me.updateTime, me.configurationTool];
    var now = new Date();
    var UTCTime = now.toUTCString();
    UTCTime = UTCTime.replace("GMT", "[UTC]");
    me.updateTime.setText("Updated:" + UTCTime);
    me.callParent(arguments);
  },
  addImage: function (img) {
    var me = this;
    me.add(img);
    me.addClickEvent(img);
    me.updateLayout();
  },
  addClickEvent: function (img) {
    var el = img.getEl();
    var isDoubleClickEvent;
    if (el) {
      el.on(
        "click",
        function (e, t, eOpts, me) {
          var me = this;
          isDoubleClickEvent = false;
          var singeClickAction = function () {
            if (!isDoubleClickEvent) {
              // We have to make a difference between a click and double
              // click.
              var img = me.getImage(t.id);
              if (img) {
                me.fullSizeImage(img);
              }
            }
          };
          setTimeout(singeClickAction, 500);
        },
        this
      );
      el.on(
        "dblclick",
        function (e, t, eOpts, me) {
          var me = this;
          isDoubleClickEvent = true;
          var img = me.getImage(t.id);
          if (img) {
            me.parent.__resetSelectionWindow();
            me.scope.actualReport = img.reportType != null ? img.reportType : "Accounting";
            me.selectImage(img);
            var oParams = img.plotParams;
            me.parent.__loadSelectionData(oParams);
          }
        },
        this
      );
      el.on(
        "contextmenu",
        function (e, t, eOpts) {
          e.stopEvent(); // we do not want to see the browser context
          // menu!
          contextMenu = Ext.create("Ext.menu.Menu", {
            scope: this,
            items: [
              {
                text: "Edit",
                scope: this,
                handler: function () {
                  var me = this;
                  if (img) {
                    me.selectImage(img);
                    var oParams = img.plotParams;
                    me.scope.actualReport = me.scope.handlers[img.reportType];
                    me.parent.__loadSelectionData(oParams);
                  }
                },
              },
              {
                text: "Open",
                scope: this,
                handler: function () {
                  var me = this;
                  me.fullSizeImage(img);
                },
              },
              {
                text: "Save",
                handler: function () {
                  window.open(img.src);
                },
              },
              {
                scope: this,
                text: "Save CSV data",
                handler: function () {
                  var me = this;
                  var oParams = img.plotParams;
                  var oHrefParams = "";

                  for (var oParam in oParams) {
                    oHrefParams += (oHrefParams == "" ? "" : "&") + oParam + "=" + encodeURIComponent(oParams[oParam]);
                  }

                  window.open(GLOBAL.BASE_URL + me.scope.handlers[img.reportType] + "/getCsvPlotData?" + oHrefParams);
                },
              },
              {
                text: "Delete",
                scope: this,
                handler: function () {
                  var me = this;
                  me.removeImage(img.id);
                },
              },
              {
                text: "Show url",
                scope: this,
                handler: function () {
                  var me = this;
                  var url = window.location.protocol + "//" + window.location.host + img.src;
                  me.parent.getContainer().oprPrepareAndShowWindowText(url, "URL");
                },
              },
            ],
          });
          contextMenu.showAt(e.getXY());
        },
        this
      );
    } else {
      Ext.Function.defer(this.addClickEvent, 4000, this, [img]);
    }
  },
  unselectImage: function (img) {
    var me = this;
    if (img) {
      img.el.applyStyles({
        borderColor: "white",
        border: 3,
        borderStyle: "solid",
      });
      img.getEl().fadeIn({
        opacity: 100,
      }); // , duration: 2000});
      img.selected = false;
      me.lastClickedImage = null;
    }
  },
  selectImage: function (img) {
    var me = this;
    if (img) {
      img.el.applyStyles({
        borderColor: "red",
        border: 1,
        borderStyle: "solid",
      });
      if (img.selected) {
        img.getEl().fadeIn({
          opacity: 100,
        }); // , duration: 2000});
        img.selected = false;
        me.unselectImage(me.lastClickedImage);
      } else {
        img.getEl().fadeIn({
          opacity: 0.65,
        }); // , duration: 2000});
        if (me.lastClickedImage && me.lastClickedImage.id != img.id) {
          me.unselectImage(me.lastClickedImage);
        }
        img.selected = true;
      }
    }

    me.lastClickedImage = img; // the last clicked always the active
    // selection.
  },
  getImage: function (id) {
    var me = this;
    var img = me.getComponent(id);
    return img;
  },
  removeImage: function (id) {
    var me = this;
    if (me.lastClickedImage && me.lastClickedImage.id == id) {
      me.lastClickedImage = null;
    }
    var image = me.getImage(id);
    if (image) {
      me.unselectImage(image);
    }
    me.remove(id);
    me.updateLayout();
  },
  getLastClickedImage: function () {
    var me = this;
    return me.lastClickedImage;
  },
  // When you apply new input data for example, need to update image
  replaceImage: function (image, src, plotParams) {
    var me = this;
    if (typeof src === "object") {
      plotParams = src.params;
      src = src.src;
    }
    var img = me.getImage(image.id);
    plotParams && (img.plotParams = plotParams);
    src != img.src ? img.setSrc(src) : img.updateSrc(src);
  },
  setColumnWidth: function (column) {
    var me = this;
    me.columnWidth = column;
    width = Math.floor(99 / column);
    width = width - 1;
    width = "." + width;
    me.items.each(function (value, index) {
      value.columnWidth = width;
    });
    me.updateLayout();
  },
  fullSizeImage: function (img) {
    var me = this;

    var panel = Ext.create("Ext.panel.Panel", {
      constrainHeader: false,
      constrain: true,
      layout: "fit",
      height: 600,
      width: 834,
    });

    var maxImage = Ext.create("Ext.Img", {
      src: img.src,
    });
    panel.add(maxImage);
    var win = me.up("panel").createChildWindow(img.plotParams._typeName + "::" + img.plotParams._plotTitle, false, 850, 650);
    win.add(panel);
    win.show();
  },
  setRefreshCycle: function (time) {
    var me = this;
    var now = new Date();
    var UTCTime = now.toUTCString();
    UTCTime = UTCTime.replace("GMT", "[UTC]");
    if (time != -1) {
      me.refreshCycle = time;
    }
    if (time == 0) {
      clearInterval(me.refreshTimeout);
    } else if (time == -1) {
      me.updateTime.setText("Updated:" + UTCTime);
      me.items.each(function (value, index) {
        var now = new Date();
        var UTCTime = now.toUTCString();
        UTCTime = UTCTime.replace("GMT", "[UTC]");
        me.updateTime.setText("Updated:" + UTCTime);
        value.setLoading("Refreshing image...");

        Ext.Ajax.request({
          url: GLOBAL.BASE_URL + me.scope.handlers[value.reportType] + "/generatePlot",
          timeout: me.timeout,
          params: value.plotParams,
          success: function (responseImg) {
            responseImg = Ext.JSON.decode(responseImg.responseText);
            if (responseImg["success"]) {
              me.replaceImage(value, GLOBAL.BASE_URL + me.scope.handlers[value.reportType] + "/getPlotImg?fileName=" + responseImg["data"]);
            }
          },
          failure: function (response, opt) {
            GLOBAL.APP.CF.showAjaxErrorMessage(response);
            value.setLoading(false);
          },
        });
      });
    } else {
      clearInterval(me.refreshTimeout);
      me.refreshTimeout = setInterval(function () {
        var now = new Date();
        var UTCTime = now.toUTCString();
        UTCTime = UTCTime.replace("GMT", "[UTC]");
        me.updateTime.setText("Updated:" + UTCTime);

        me.items.each(function (value, index) {
          value.setLoading("Refreshing image...");

          Ext.Ajax.request({
            url: GLOBAL.BASE_URL + me.scope.handlers[value.reportType] + "/generatePlot",
            timeout: me.timeout,
            params: value.plotParams,
            success: function (responseImg) {
              responseImg = Ext.JSON.decode(responseImg.responseText);
              if (responseImg["success"]) {
                me.replaceImage(value, GLOBAL.BASE_URL + me.scope.handlers[value.reportType] + "/getPlotImg?fileName=" + responseImg["data"]);
              }
            },
            failure: function (response, opt) {
              GLOBAL.APP.CF.showAjaxErrorMessage(response);
              value.setLoading(false);
            },
          });
        });
      }, me.refreshCycle);
    }
  },
  applyTimeSpan: function (oParams) {
    var me = this;
    var oStandardParamsList = ["timeSelector", "startTime", "endTime", "pinDates", "quarters"];

    me.items.each(function (value, index) {
      var oNewParams = {};
      var params = value.plotParams;

      for (var i in params) {
        if (!Ext.Array.contains(oStandardParamsList, i)) {
          oNewParams[i] = params[i];
        }
      }
      var sKeys = Object.keys(oParams);
      for (var i = 0; i < oStandardParamsList.length; i++) {
        if (Ext.Array.contains(sKeys, oStandardParamsList[i])) {
          oNewParams[oStandardParamsList[i]] = oParams[oStandardParamsList[i]];
        }
      }
      value.setLoading("Loading images...");
      value.plotParams = oNewParams;
      Ext.Ajax.request({
        url: GLOBAL.BASE_URL + me.scope.handlers[value.reportType] + "/generatePlot",
        timeout: me.timeout,
        params: oNewParams,
        success: function (responseImg) {
          responseImg = Ext.JSON.decode(responseImg.responseText);

          if (responseImg["success"]) {
            value.setSrc(GLOBAL.BASE_URL + me.scope.handlers[value.reportType] + "/getPlotImg?fileName=" + responseImg["data"]);
          }
        },
        failure: function (response, opt) {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);
          value.setLoading(false);
        },
      });
    });
  },
});
