/**
 * @class Ext.dirac.views.desktop.StartMenu Startmenu as a part of the taskbar.
 *        An object of this class has two main parts: - Menu (on the left side) -
 *        Toolbar (on the right side)
 * @extends Ext.panel.Panel
 */
Ext.define('Ext.dirac.views.desktop.StartMenu', {
      extend : 'Ext.ux.desktop.StartMenu',

      floating : true,

      shadow : true,

      /*
       * We have to hardcode a width because the internal Menu cannot drive our
       * width. This is combined with changing the align property of the menu's
       * layout from the typical 'stretchmax' to 'stretch' which allows the the
       * items to fill the menu area.
       */
      width : 230,

      initComponent : function() {
        var me = this;

        /*
         * Structuring the Start menu
         */

        me.title = ((GLOBAL.APP.configData.user.username) ? GLOBAL.APP.configData["user"]["username"] + "@" + GLOBAL.APP.configData["user"]["group"] : "Anonymous");
        me.callParent();

      },

      afterRender : function() {

        var me = this;

        for (var j = 0; j < GLOBAL.APP.configData["menu"].length; j++)
          me.add(me.getMenuStructureRec(GLOBAL.APP.configData["menu"][j]));

        if (GLOBAL.STATE_MANAGEMENT_ENABLED) {

          me.add(['-', {
                text : 'State Loader',
                iconCls : 'dirac-icon-state',
                handler : function() {
                  GLOBAL.APP.MAIN_VIEW.SM.formStateLoader(GLOBAL.APP.MAIN_VIEW.cbAfterLoadSharedState, GLOBAL.APP.MAIN_VIEW.cbAfterSaveSharedState);
                }
              }]);

        }

        this.callParent();
      },

      showBy : function(cmp, pos, off) {
        var me = this;

        if (me.floating && cmp) {
          me.layout.autoSize = true;
          me.show();

          // Component or Element
          cmp = cmp.el || cmp;

          // Convert absolute to floatParent-relative coordinates if
          // necessary.
          var xy = me.el.getAlignToXY(cmp, pos || me.defaultAlign, off);
          if (me.floatParent) {
            var r = me.floatParent.getTargetEl().getViewRegion();
            xy[0] -= r.x;
            xy[1] -= r.y;
          }
          me.showAt(xy);
          me.doConstrain();
        }
        return me;
      },

      /**
       * This method is used to recursively read the data about the start menu
       * 
       * @return {Object}
       */
      getMenuStructureRec : function(item) {

        var me = this;

        if (item.length == 2) {

          var result = {
            text : item[0],
            menu : [],
            iconCls : "system_folder"
          };

          for (var i = 0; i < item[1].length; i++)
            result.menu.push(me.getMenuStructureRec(item[1][i]));

          return result;

        } else {
          if (item[0] == "app") {
            var oParts = item[2].split(".");
            var sStartClass = "";
            if (oParts.length == 2)
              sStartClass = item[2] + ".classes." + oParts[1];
            else
              sStartClass = item[2];

            return {
              text : item[1],
              minWidth : 200,
              menu : [],
              isStateMenuLoaded : 0,
              appClassName : sStartClass,
              iconCls : "notepad",
              listeners : {
                render : function(oMenuItem, eOpts) {

                  GLOBAL.APP.MAIN_VIEW.registerStartAppMenu(oMenuItem, oMenuItem.appClassName);

                  oMenuItem.menu.on("beforeshow", function(oMenu, eOpts) {

                        if (oMenu.items.length <= 1) {
                          var oElem = Ext.get(oMenuItem.id + '-arrowEl');

                          if (oElem) {

                            oElem.hide();

                          }
                          return false;
                        } else {
                          var oElem = Ext.get(oMenuItem.id + '-arrowEl');

                          if (oElem) {

                            oElem.show();

                          }
                          return true;
                        }

                      });

                  var oElem = Ext.get(oMenuItem.id + '-arrowEl');

                  if (oElem) {

                    oElem.hide();

                  }

                },
                activate : function(oMenuItem, eOpts) {

                },
                click : Ext.bind(GLOBAL.APP.MAIN_VIEW.createWindow, GLOBAL.APP.MAIN_VIEW, [item[0], item[2], null]),
                focus : function(cmp, e, eOpts) {

                  if (!GLOBAL.STATE_MANAGEMENT_ENABLED)
                    return;

                  /*
                   * if the cache for the state of the started application exist
                   */

                  /*
                   * A call to isStateLoaded can be used to see whether the
                   * application states have been loaded
                   */

                  var iAppStatesLoaded = GLOBAL.APP.SM.isStateLoaded("application", sStartClass, "|");// OK

                  if (iAppStatesLoaded != -2) {

                    if (cmp.isStateMenuLoaded != 2) {

                      cmp.oprRefreshAppStates();
                      cmp.isStateMenuLoaded = 2;
                    }

                  } else {
                    if (cmp.isStateMenuLoaded == 0) {
                      cmp.setIconCls("loading_item");
                      var oFunc = function(iCode, sAppName) {

                        cmp.oprRefreshAppStates();
                        cmp.isStateMenuLoaded = 2;
                        cmp.setIconCls("notepad");

                        if (cmp.menu.items.length <= 1) {
                          var oElem = Ext.get(cmp.id + '-arrowEl');

                          if (oElem) {

                            oElem.hide();

                          }

                        } else {
                          var oElem = Ext.get(cmp.id + '-arrowEl');

                          if (oElem) {

                            oElem.show();

                          }

                        }

                        /*
                         * var oPos = cmp.getPosition(); var oSize =
                         * cmp.getSize();
                         * 
                         * cmp.menu.showAt(oPos[0] + oSize.width, oPos[1]);
                         */

                      };

                      GLOBAL.APP.SM.oprReadApplicationStatesAndReferences(sStartClass, oFunc);// OK

                      cmp.isStateMenuLoaded = 1;

                    }

                  }

                }

              },
              addNewState : function(stateType, stateName) {

                var oThisMenu = this;
                var oNewItem = null;

                if (stateType == "application") {

                  oNewItem = Ext.create('Ext.menu.Item', {
                        text : stateName,
                        handler : Ext.bind(GLOBAL.APP.MAIN_VIEW.createWindow, GLOBAL.APP.MAIN_VIEW, ["app", oThisMenu.appClassName, {
                                  stateToLoad : stateName
                                }], false),
                        scope : me,
                        iconCls : "dirac-icon-state",
                        stateType : stateType,
                        minWidth : 200,
                        menu : [{
                              text : "Share state",
                              stateName : stateName,
                              handler : function() {
                                var oThisItem = this;

                                GLOBAL.APP.SM.oprShareState(oThisMenu.appClassName, oThisItem.stateName, function(rCode, rAppName, rStateName, rMessage) {

                                      if (rCode == 1) {

                                        var oHtml = "";
                                        oHtml += "<div style='padding:5px'>The string you can send is as follows:</div>";
                                        oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

                                        Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + rStateName + "</span> state:", oHtml);

                                      }

                                    });

                              },
                              iconCls : "dirac-icon-share"
                            }, {
                              text : "Make public",
                              stateName : stateName,
                              handler : function() {
                                var oThisItem = this;

                                GLOBAL.APP.SM.oprPublishState(oThisMenu.appClassName, oThisItem.stateName);

                              },
                              iconCls : "dirac-icon-share"
                            }]
                      });

                  oThisMenu.menu.insert(0, oNewItem);

                } else if (stateType == "reference") {

                  oNewItem = Ext.create('Ext.menu.Item', {
                        text : stateName,
                        minWidth : 200,
                        handler : Ext.bind(GLOBAL.APP.MAIN_VIEW.loadSharedStateByName, GLOBAL.APP.MAIN_VIEW, [oThisMenu.appClassName, stateName], false),
                        scope : me,
                        iconCls : "dirac-icon-link",
                        stateType : stateType
                      });

                  oThisMenu.menu.add(oNewItem);

                }

              },
              removeState : function(stateType, stateName) {

                var me = this;

                var iStartingIndex = 0;

                switch (stateType) {

                  case "application" :
                    for (var i = 0; i < me.menu.items.length; i++) {

                      if (me.menu.items.getAt(i).self.getName() == "Ext.menu.Separator")
                        break;

                      if (me.menu.items.getAt(i).text == stateName) {

                        me.menu.remove(me.menu.items.getAt(i));
                        break;

                      }

                    }

                    break;
                  case "reference" :
                    for (var i = me.menu.items.length - 1; i >= 0; i--) {

                      if (me.menu.items.getAt(i).self.getName() == "Ext.menu.Separator")
                        break;

                      if (me.menu.items.getAt(i).text == stateName) {

                        me.menu.remove(me.menu.items.getAt(i));
                        break;

                      }

                    }
                    break;

                }

              },
              oprRefreshAppStates : function() {

                var oThisMenu = this;

                oThisMenu.menu.removeAll();

                var oStates = GLOBAL.APP.SM.getApplicationStates("application", oThisMenu.appClassName);// OK

                for (var i = 0, len = oStates.length; i < len; i++) {

                  var stateName = oStates[i];

                  var newItem = Ext.create('Ext.menu.Item', {
                        text : stateName,
                        minWidth : 200,
                        handler : Ext.bind(GLOBAL.APP.MAIN_VIEW.createWindow, GLOBAL.APP.MAIN_VIEW, ["app", oThisMenu.appClassName, {
                                  stateToLoad : stateName
                                }], false),
                        scope : me,
                        iconCls : "dirac-icon-state",
                        stateType : "application",
                        menu : [{
                              text : "Share state",
                              stateName : stateName,
                              handler : function() {

                                var oThisItem = this;

                                GLOBAL.APP.SM.oprShareState(oThisMenu.appClassName, oThisItem.stateName, function(rCode, rAppName, rStateName, rMessage) {

                                      if (rCode == 1) {

                                        var oHtml = "";
                                        oHtml += "<div style='padding:5px'>The string you can send is as follows:</div>";
                                        oHtml += "<div style='padding:5px;font-weight:bold'>" + rMessage + "</div>";

                                        Ext.MessageBox.alert("Info for sharing the <span style='color:red'>" + rStateName + "</span> state:", oHtml);

                                      }

                                    });

                              },
                              iconCls : "dirac-icon-share"
                            }, {
                              text : "Make public",
                              stateName : stateName,
                              handler : function() {

                                var oThisItem = this;

                                GLOBAL.APP.SM.oprPublishState(oThisMenu.appClassName, oThisItem.stateName);

                              },
                              iconCls : "dirac-icon-share"
                            }]
                      });

                  oThisMenu.menu.add(newItem);

                }

                var oRefs = GLOBAL.APP.SM.getApplicationStates("reference", oThisMenu.appClassName);// OK

                // if((oStates.length>0)||(oRefs.length>0))
                oThisMenu.menu.add("-");

                for (var i = 0, len = oRefs.length; i < len; i++) {

                  var stateName = oRefs[i];

                  var newItem = Ext.create('Ext.menu.Item', {
                        text : stateName,
                        handler : Ext.bind(GLOBAL.APP.MAIN_VIEW.loadSharedStateByName, GLOBAL.APP.MAIN_VIEW, [oThisMenu.appClassName, stateName], false),
                        scope : me,
                        iconCls : "dirac-icon-link",
                        minWidth : 200,
                        stateType : "reference"
                      });

                  oThisMenu.menu.add(newItem);

                }

              }
            };

          } else {

            return {
              text : item[1],
              handler : Ext.bind(GLOBAL.APP.MAIN_VIEW.createWindow, GLOBAL.APP.MAIN_VIEW, [item[0], item[2], {
                        title : item[1]
                      }]),
              minWidth : 200,
              iconCls : "system_web_window"
            };

          }

        }

      }

    });
