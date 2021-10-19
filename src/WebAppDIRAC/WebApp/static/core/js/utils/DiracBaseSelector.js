/*******************************************************************************
 * This widget can be used to create a selector. It allows to easily configure
 * the selector. It provides all the methods which are needed to save/restore
 * the widget state. The following example show how to create a selector:
 *
 * <pre>
 * me.leftPanel = new Ext.create('Ext.dirac.utils.DiracBaseSelector', {
 *       scope : me,
 *       cmbSelectors : selectors,
 *       textFields : textFields,
 *       datamap : map,
 *       url : &quot;TransformationMonitor/getSelectionData&quot;
 *     });
 * </pre>
 *
 * Parameters:
 *
 * -scope: the parent widget. We have some functionalities which required access
 * to the main class. -cmbSelectors: It is a dictionary which contains the
 * selector values. These are the selectors which will be seen as combo box. You
 * can define a selector as the following:
 *
 * <pre>
 * var selectors = {
 *   status : &quot;Status&quot;,
 *   agentType : &quot;Agent Type&quot;,
 *   type : &quot;Type&quot;,
 *   group : &quot;Group&quot;,
 *   plugin : &quot;Plugin&quot;
 * };
 * </pre>
 *
 * -textFields is dictionary which contains the text field name and the text
 * which will appears in the widget. The following example shows how to
 * implement a text field:
 *
 * <pre>
 * var textFields = {
 *   'transformationId' : {
 *      name :&quot;ProductionID(s)&quot;,
 *      type :&quot;number&quot;
 *   }
 *   'requestId' :{
 *      name: &quot;RequestID(s)&amp;quot,
 *      type : &quot;number&quot;
 *   }
 * };
 * </pre>
 *
 * -timeSearchPanel in case if we want to have the time selector. -datamap is a
 * list which contains the map, because we may have a situation when the name is
 * different in the widget than the value which is returned by the controller.
 *
 * <pre>
 * var map = [[&quot;agentType&quot;, &quot;agentType&quot;], [&quot;productionType&quot;, &quot;type&quot;], [&quot;transformationGroup&quot;, &quot;group&quot;], [&quot;plugin&quot;, &quot;plugin&quot;], [&quot;prodStatus&quot;, &quot;status&quot;]];
 * </pre>
 *
 * -url is a String which contains the url used to fill the selector widget.
 */
Ext.define("Ext.dirac.utils.DiracBaseSelector", {
  extend: "Ext.panel.Panel",
  requires: [
    "Ext.dirac.utils.DiracBoxSelect",
    "Ext.dirac.utils.DiracTextField",
    "Ext.dirac.utils.DiracNumericField",
    "Ext.dirac.utils.DiracTimeSearchPanel",
    "Ext.form.field.Checkbox",
    "Ext.dirac.utils.DiracToolButton",
  ],
  title: "Selectors",
  region: "west",
  floatable: false,
  margins: "0",
  width: 250,
  minWidth: 230,
  maxWidth: 350,
  bodyPadding: 5,
  layout: "anchor",
  scrollable: true,
  /**
   * @property{Boolean} allowMultipleSelect It allows to use all the textfield in the selector. By defauld only one textfield is used.
   */
  disableTextFields: true,
  /**
   * @cfg{Object}cmbSelectors It stores the combo box selectors.
   */
  cmbSelectors: {},
  /**
   * @cfg{Object} textFields It stores the text field selectors.
   */
  textFields: {},
  /**
   * @cfg{Ext.dirac.utils.DiracTimeSearchPanel} timeSearchPanel It stores
   *                                            the time panel.
   */
  timeSearchPanel: null,
  /**
   * @property{Boolean} hasTimeSearchPanel It is used to add/remove the time
   *                    search panel to the selector. The time selector is
   *                    available by default.
   */
  hasTimeSearchPanel: true,
  /**
   * @cfg{List} datamap It contains the map in case when the selector name
   *            is different than the returned value.
   */
  datamap: [],
  /**
   * @cfg{String} url This url used to fill the selectors.
   */
  url: "",
  /**
   * @cfg{Ext.menu.Menu} selectorMenu This menu used to hide and show the
   *                     selector widgets.
   */
  selectorMenu: null,
  /**
   * @cfg{Boolean} panelButtons If it is false, the buttons(submmit, reset,
   *               etc) of the panel will be not added.
   */
  panelButtons: true,
  /**
   *
   * @cfg{Object} We can accociate a DiracGridPanel.
   */
  grid: null,

  constructor: function (oConfig) {
    var me = this;
    me.callParent(arguments);

    if (oConfig.datamap == null) {
      GLOBAL.APP.CF.log("error", "The datamap must be given!!!");
    }
    if (oConfig.url == null) {
      GLOBAL.APP.CF.log("error", "You have to provide an URL used to fill the selectors!");
    }
    if (oConfig.cmbSelectors) {
      for (var cmb in oConfig.cmbSelectors) {
        me.cmbSelectors[cmb] = Ext.create("Ext.dirac.utils.DiracBoxSelect", {
          fieldLabel: oConfig.cmbSelectors[cmb],
          queryMode: "local",
          labelAlign: "top",
          displayField: "text",
          valueField: "value",
          anchor: "100%",
        });
      }
    }
    for (var selector in me.cmbSelectors) {
      me.add(me.cmbSelectors[selector]);
    }

    // setting the selector menu
    if (Object.keys(me.cmbSelectors).length > 0) {
      var menuItems = [];
      for (var cmb in me.cmbSelectors) {
        menuItems.push({
          xtype: "menucheckitem",
          text: me.cmbSelectors[cmb].getFieldLabel(),
          relatedCmbField: cmb,
          checked: true,
          handler: function (item, e) {
            var me = this;

            if (item.checked) me.cmbSelectors[item.relatedCmbField].show();
            else me.cmbSelectors[item.relatedCmbField].hide();
          },
          scope: me,
        });
      }

      menuItems.push({
        xtype: "menucheckitem",
        text: "Time Span",
        checked: true,
        handler: function (item, e) {
          var me = this;

          if (item.checked) me.timeSearchPanel.show();
          else me.timeSearchPanel.hide();
        },
        scope: me,
      });

      me.selectorMenu = new Ext.menu.Menu({
        items: menuItems,
      });
    }

    if (oConfig.hasTimeSearchPanel != null) {
      me.hasTimeSearchPanel = oConfig.hasTimeSearchPanel;
    }
    if (me.hasTimeSearchPanel) {
      me.timeSearchPanel = Ext.create("Ext.dirac.utils.DiracTimeSearchPanel");
      me.add(me.timeSearchPanel);
    }

    if (oConfig.textFields) {
      for (field in oConfig.textFields) {
        var textFieldWidget = null;
        if (oConfig.textFields[field]["type"] == "number" || oConfig.textFields[field]["type"] == "Number") {
          textFieldWidget = Ext.create("Ext.dirac.utils.DiracNumericField", {
            fieldLabel: oConfig.textFields[field]["name"],
            scope: me,
            type: oConfig.textFields[field]["type"],
          });
        } else if (oConfig.textFields[field]["type"] == "Checkbox" || oConfig.textFields[field]["type"] == "checkbox") {
          textFieldWidget = Ext.create("Ext.form.field.Checkbox", {
            fieldLabel: oConfig.textFields[field]["fieldLabel"],
            name: oConfig.textFields[field]["name"],
            scope: me,
            type: oConfig.textFields[field]["type"],
          });
        } else {
          textFieldWidget = Ext.create("Ext.dirac.utils.DiracTextField", {
            fieldLabel: oConfig.textFields[field]["name"],
            scope: me,
            type: oConfig.textFields[field]["type"],
          });
        }
        if (oConfig.textFields[field]["properties"]) {
          Ext.apply(textFieldWidget, oConfig.textFields[field]["properties"]);
        }
        me.textFields[field] = textFieldWidget;
      }
    }

    for (var field in me.textFields) {
      me.add(me.textFields[field]);
    }

    if (me.panelButtons) {
      // Buttons at the top of the panel
      var oPanelButtons = new Ext.create("Ext.toolbar.Toolbar", {
        dock: "bottom",
        layout: {
          pack: "center",
        },
        items: [],
      });

      me.btnSubmit = new Ext.Button({
        text: "Submit",
        margin: 3,
        iconCls: "dirac-icon-submit",
        handler: function () {
          me.oprLoadGridData();
        },
        scope: me,
      });

      oPanelButtons.add(me.btnSubmit);

      me.btnReset = new Ext.Button({
        text: "Reset",
        margin: 3,
        iconCls: "dirac-icon-reset",
        handler: function () {
          me.oprResetSelectionOptions();
        },
        scope: me,
      });

      oPanelButtons.add(me.btnReset);

      me.btnRefresh = new Ext.Button({
        text: "Refresh",
        margin: 3,
        iconCls: "dirac-icon-refresh",
        handler: function () {
          me.oprSelectorsRefreshWithSubmit(false);
        },
        scope: me,
      });

      oPanelButtons.add(me.btnRefresh);

      me.addDocked(oPanelButtons);
    }

    me.grid = oConfig.grid;
  },
  initComponent: function () {
    var me = this;
    me.bDataSelectionLoaded = false;
    me.callParent(arguments);
  },
  afterRender: function () {
    var me = this;
    if (me.selectorMenu) {
      me.getHeader().addTool({
        xtype: "diracToolButton",
        type: "down",
        menu: me.selectorMenu,
      });
    }
    me.__loadSelectorData();
    me.callParent();
  },
  /**
   * It returns the data which has to be saved in the User Profile.
   *
   * @return{Object}
   */
  getStateData: function () {
    var me = this;

    // show/hide for selectors and their selected data (including NOT
    // button)
    var leftMenu = {};

    if (me.timeSearchPanel) {
      leftMenu = me.timeSearchPanel.getStateData();
    }

    leftMenu.selectors = {};

    for (var cmb in me.cmbSelectors) {
      leftMenu.selectors[cmb] = {
        hidden: me.cmbSelectors[cmb].isHidden(),
        data_selected: me.cmbSelectors[cmb].getValue(),
        not_selected: me.cmbSelectors[cmb].isInverseSelection(),
      };
    }

    // the state of the selectors, text fields and time
    for (var field in me.textFields) {
      leftMenu[field] = me.textFields[field].getValue();
    }

    return leftMenu;
  },
  /**
   * This function is used to load the data which is saved in the User
   * Profile.
   *
   * @param{Object}data it contains the saved values.
   */
  loadState: function (data) {
    var me = this;

    var bToReload = false;

    var item = null;
    // For the time span searching sub-panel
    if (me.selectorMenu) {
      item = me.selectorMenu.items.getAt(me.selectorMenu.items.length - 1);
    }

    if (me.timeSearchPanel) {
      item.setChecked(!data.leftMenu.timeSearchPanelHidden);
      me.timeSearchPanel.loadState(data.leftMenu);
    }

    for (var field in me.textFields) {
      me.textFields[field].setValue(data.leftMenu[field]);
    }

    if (data.leftMenu.selectors && me.selectorMenu) {
      for (var i = 0; i < me.selectorMenu.items.length - 1; i++) {
        var item = me.selectorMenu.items.getAt(i);

        if (item.relatedCmbField in data.leftMenu.selectors) {
          // in case
          // if a
          // selector is
          // missing in the
          // data
          item.setChecked(!data.leftMenu.selectors[item.relatedCmbField].hidden);

          if (!data.leftMenu.selectors[item.relatedCmbField].hidden) me.cmbSelectors[item.relatedCmbField].show();
          else me.cmbSelectors[item.relatedCmbField].hide();

          /*
           * this can be done only if the store is being loaded, otherwise
           * has to be postponed
           */
          me.__oprPostponedValueSetUntilOptionsLoaded(
            me.cmbSelectors[item.relatedCmbField],
            data.leftMenu.selectors[item.relatedCmbField].data_selected,
            i == me.selectorMenu.items.length - 2 || Object.keys(data.leftMenu.selectors).length == 1 ? true : false
          );

          me.cmbSelectors[item.relatedCmbField].setInverseSelection(data.leftMenu.selectors[item.relatedCmbField].not_selected);
        }
      }
    } else {
      bToReload = true;
    }

    if (bToReload) {
      me.oprLoadGridData();
    }
  },
  /**
   * @private In case the selector is not loaded we have to postpone the
   *          setting of the value.
   * @param{Ext.dirac.utils.DiracBoxSelect} oSelectionBox the combo box
   *                                        widget
   * @param{Object}oValues the value which has to be set to the
   *                       oSelectionBox
   * @param{Boolean} it used to cancel the previous request
   */
  __oprPostponedValueSetUntilOptionsLoaded: function (oSelectionBox, oValues, bLastOne) {
    var me = this;
    GLOBAL.APP.CF.log("debug", "pospone request", bLastOne);
    if (me.bDataSelectionLoaded) {
      oSelectionBox.setValue(oValues);

      if (bLastOne) {
        me.__cancelPreviousDataRequest();
        me.oprLoadGridData();
      }
    } else {
      Ext.Function.defer(me.__oprPostponedValueSetUntilOptionsLoaded, 1500, me, [oSelectionBox, oValues, bLastOne]);
    }
  },
  /*************************************************************************
   * @private It cancel the AJAX request.
   */
  __cancelPreviousDataRequest: function () {
    var me = this;

    if (me.grid && me.grid.store.loading && me.grid.store.lastDataRequest) {
      var oRequests = Ext.Ajax.requests;
      for (id in oRequests) {
        if (oRequests.hasOwnProperty(id) && oRequests[id].options == me.grid.store.lastDataRequest.request) {
          Ext.Ajax.abort(oRequests[id]);
        }
      }
    }
  },
  /**
   * It return the Time search panel
   *
   * @retun{Ext.dirac.utils.DiracTimeSearchPanel}
   */
  getTimeSearch: function () {
    var me = this;
    return me.timeSearchPanel;
  },
  /*************************************************************************
   * @private It loads the Selector data using AJAX request.
   */
  __loadSelectorData: function () {
    var me = this;

    if (Object.keys(me.cmbSelectors).length > 0) {
      // only load the
      // selector
      // data if exist!
      me.body.mask("Loading selectors...");
      Ext.Ajax.request({
        url: GLOBAL.BASE_URL + me.url,
        params: {},
        scope: me,
        success: function (response) {
          var me = this;

          me.body.unmask();

          var response = Ext.JSON.decode(response.responseText);

          if (response.success == "false") {
            Ext.dirac.system_info.msg("Error", response.error);
            return;
          }

          me.__oprRefreshStoresForSelectors(response, false);

          if (me.properties) {
            if (me.scope.currentState == "") {
              if ("properties" in GLOBAL.USER_CREDENTIALS) {
                for (var i = 0; i < me.properties.length; i++) {
                  if (
                    Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, me.properties[i][0]) != -1 &&
                    Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, me.properties[i][1]) == -1
                  ) {
                    me.cmbSelectors[me.properties[i][2]].setValue([GLOBAL.USER_CREDENTIALS.username]);
                  }
                }
              }
            }
          }

          me.bDataSelectionLoaded = true;
        },
        failure: function (response) {
          GLOBAL.APP.CF.showAjaxErrorMessage(response);
          me.body.unmask();
        },
      });
    }
  },
  /*************************************************************************
   * It refresh the selectors.
   *
   * @param{Object}oData data used by the selectors.
   * @param{Boolean}bRefreshStores to create new store.
   */
  __oprRefreshStoresForSelectors: function (oData, bRefreshStores) {
    var me = this;

    for (var j = 0; j < me.datamap.length; j++) {
      var dataOptions = [];
      if (oData[me.datamap[j][0]] == null) continue;
      for (var i = 0; i < oData[me.datamap[j][0]].length; i++)
        dataOptions.push({ text: oData[me.datamap[j][0]][i][0], value: oData[me.datamap[j][0]][i][0] });

      var dataStore = new Ext.data.Store({
        fields: ["value", "text"],
        data: dataOptions,
      });

      me.cmbSelectors[me.datamap[j][1]].setStore(dataStore);
    }
  },
  /**
   * It returns the data which is selected by the user.
   *
   * @return{Object}
   */
  getSelectionData: function () {
    var me = this;

    var extraParams = {};
    var foundTextSelector = false;

    for (var i in me.textFields) {
      var param = [];
      if (me.textFields[i].type == "checkbox" || me.textFields[i].type == "Checkbox") {
        var val = me.textFields[i].getValue();
        extraParams[i] = Ext.JSON.encode([val]);
        continue;
      }
      if (me.textFields[i].getValue() != "") {
        if (me.textFields[i].getValue().search(",") != -1) {
          param = me.textFields[i].getValue().split(",");
        } else if (me.textFields[i].getValue().search(" ") != -1) {
          param = me.textFields[i].getValue().split(" ");
        } else {
          param.push(me.textFields[i].getValue());
        }
      }

      // var param = me.textFields[i].getValue().split(',')[0] !=
      // ""?me.textFields[i].getValue():'';
      // extraParams[i] = param;

      if (param.length != 0 && me.textFields[i].type != "originalText") {
        var interval = [];
        for (var j = 0; j < param.length; j++) {
          if (param[j].split("-").length > 1) {
            var intervalStart = parseInt(param[j].split("-")[0]);
            var intervalEnd = parseInt(param[j].split("-")[1]);
            for (var k = intervalStart; k < intervalEnd + 1; k++) {
              interval.push(k);
            }
          } else {
            interval.push(param[j]);
          }
        }
        foundTextSelector = true;
        extraParams[i] = Ext.JSON.encode(interval);
      } else {
        extraParams[i] = Ext.JSON.encode(param);
      }
    }

    if (!foundTextSelector) {
      if (me.grid && me.grid.pagingToolbar) {
        extraParams["limit"] = me.grid.pagingToolbar.pageSizeCombo.getValue();
      }
      if (me.hasTimeSearchPanel) {
        var timeSearchData = me.timeSearchPanel.getSelectedData();
        Ext.merge(extraParams, timeSearchData);
      }
      for (var i in me.cmbSelectors) {
        var param = me.cmbSelectors[i].isInverseSelection() ? me.cmbSelectors[i].getInverseSelection() : me.cmbSelectors[i].getValue();
        if (param.length != 0) {
          extraParams[i] = Ext.JSON.encode(param);
        }
      }
    }

    return extraParams;
  },
  /**
   * It loads data to the grid panel.
   */
  oprLoadGridData: function () {
    var me = this;

    if (me.grid && me.__oprValidateBeforeSubmit()) {
      // set those data as extraParams in
      me.grid.store.proxy.extraParams = me.getSelectionData();
      me.grid.store.currentPage = 1;
      me.grid.store.load();

      var oCheckbox = Ext.query("#" + me.scope.id + " input.dirac-table-main-check-box");
      if (oCheckbox.length > 0) {
        oCheckbox[0].checked = false;
      }

      if (me.scope.funcOnChangeEitherCombo) {
        me.scope.funcOnChangeEitherCombo(); // if we have statistical window
      }
    }

    if (me.grid && me.grid.expandedGridPanel) {
      // delete the targetId
      me.grid.expandedGridPanel.destroy();
      delete me.grid.expandedGridPanel;
    }
  },
  /**
   * It validates the selected values. It is used to make sure the values
   * which are selected are correct.
   */
  __oprValidateBeforeSubmit: function () {
    var me = this;
    var bValid = true;

    for (var field in me.textFields) {
      if (!me.textFields[field].validate()) {
        bValid = false;
        break;
      }
    }
    return bValid;
  },
  /**
   * It is used to reset the selectors.
   */
  oprResetSelectionOptions: function () {
    var me = this;
    for (var selector in me.cmbSelectors) {
      me.cmbSelectors[selector].setValue([]);
    }

    for (var field in me.textFields) {
      me.textFields[field].setValue("");
    }
  },
  /**
   * It is used to refresh the selectors.
   *
   * @param{Boolean} create a Ajax request and refresh the selectors.
   */
  oprSelectorsRefreshWithSubmit: function (bSubmit) {
    var me = this;

    if (bSubmit && !me.__oprValidateBeforeSubmit()) return;

    me.body.mask("Wait ...");
    // this var is used to know whether the options in the select boxes have
    // been loaded or not
    me.bDataSelectionLoaded = false;
    Ext.Ajax.request({
      url: GLOBAL.BASE_URL + me.url,
      params: {},
      scope: me,
      success: function (response) {
        var me = this;
        var response = Ext.JSON.decode(response.responseText);
        me.__oprRefreshStoresForSelectors(response, true);
        me.body.unmask();
        if (bSubmit) me.oprLoadGridData();

        me.bDataSelectionLoaded = true;
      },
      failure: function (response) {
        GLOBAL.APP.CF.showAjaxErrorMessage(response);
      },
    });
  },
  /**
   * This is used to add a new textfield (selector) to the panel.
   *
   * @param {Object}
   *          data it is an object which contains the name of the textfield
   *          and the type. For example:
   *
   * <pre>
   *  var textFields = {
   *  'ids' :{
   *   name : &quot;JobID(s)&quot;,
   *   type : &quot;number&quot;
   *  }
   *
   * </pre>
   */

  addTextFieldSelector: function (data) {
    var me = this;
    var textFieldWidget = null;
    for (var field in data) {
      if (data[field]["type"] == "Number") {
        textFieldWidget = Ext.create("Ext.dirac.utils.DiracNumericField", {
          fieldLabel: data[field]["name"],
          scope: me,
        });
      } else if (data[field]["type"] == "Checkbox" || data[field]["type"] == "checkbox") {
        textFieldWidget = Ext.create("Ext.form.field.Checkbox", {
          fieldLabel: data[field]["fieldLabel"],
          name: data[field]["name"],
          scope: me,
          type: data[field]["type"],
        });
      } else {
        textFieldWidget = Ext.create("Ext.dirac.utils.DiracTextField", {
          fieldLabel: data[field]["name"],
          scope: me,
        });
      }
      me.textFields[field] = textFieldWidget;

      me.add(me.textFields[field]);
    }
  },
  /**
   * You can add a new combo box selector the the panel.
   *
   * @param {Object}
   *          data it is dictionary which contains the configuration of the
   *          selector(s). For example:
   *
   * <pre>
   * var selector = {
   *   example : &quot;Exampleee&quot;
   * };
   * </pre>
   *
   * @param{Object} map is used to define data maping for example:
   *
   * <pre>
   * varmap = [&quot;Example&quot;,[&quot;example&quot;]
   * </pre>
   */
  addComboSelector: function (data, map) {
    var me = this;
    for (var cmb in data) {
      me.cmbSelectors[cmb] = Ext.create("Ext.dirac.utils.DiracBoxSelect", {
        fieldLabel: data[cmb],
        queryMode: "local",
        labelAlign: "top",
        displayField: "text",
        valueField: "value",
        anchor: "100%",
      });

      me.add(me.cmbSelectors[cmb]);

      // setting the selector menu
      me.selectorMenu.add({
        xtype: "menucheckitem",
        text: me.cmbSelectors[cmb].getFieldLabel(),
        relatedCmbField: cmb,
        checked: true,
        handler: function (item, e) {
          var me = this;

          if (item.checked) me.cmbSelectors[item.relatedCmbField].show();
          else me.cmbSelectors[item.relatedCmbField].hide();
        },
        scope: me,
      });
    }
    if (map) {
      me.datamap.push(map);
    } else {
      for (var i in data) {
        me.datamap.push([i, i]);
      }
    }
  },
  /**
   * It disables the selectors execpt the selector which is in use.
   *
   * @param {Object}
   *          noToDisable it is the selector object which will be not
   *          disabled...
   */
  disableElements: function (notToDisable) {
    var me = this;

    if (me.timeSearchPanel) {
      me.timeSearchPanel.disable();
    }

    for (var cmb in me.cmbSelectors) {
      me.cmbSelectors[cmb].disable();
    }
    if (me.disableTextFields) {
      for (var field in me.textFields) {
        if (me.textFields[field].canDisable && me.textFields[field].getFieldLabel() != notToDisable.getFieldLabel()) {
          me.textFields[field].disable();
        }
      }
    }
  },
  enableElements: function () {
    var me = this;

    if (me.timeSearchPanel) {
      me.timeSearchPanel.enable();
    }

    for (var cmb in me.cmbSelectors) {
      me.cmbSelectors[cmb].enable();
    }

    for (var field in me.textFields) {
      if (me.textFields[field].isDisabled()) {
        me.textFields[field].enable();
      }
    }
  },
  setGrid: function (grid) {
    var me = this;
    me.grid = grid;
  },
});
