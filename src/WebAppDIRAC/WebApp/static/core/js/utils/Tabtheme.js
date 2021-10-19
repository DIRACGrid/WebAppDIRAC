/**
 * This class show different applications in a single panel.
 */
Ext.define("Ext.dirac.utils.Tabtheme", {
  extend: "Ext.panel.Panel",
  requires: ["Ext.dirac.utils.PanelDragDrop", "Ext.panel.Tool"],
  scrollable: true,
  frame: true,
  lastClickedImage: null,
  columnWidth: 3,
  maxColumns: 6,
  refreshCycle: 0,
  collapsible: false,
  tabheader: false,
  layout: "column",
  /*
   * layout : { type: 'table', columns : 3 }, defaults: { frame:true,
   * width:'70%', height: '70%', style: 'margin: 0 2px 2px 0' },
   */
  margins: "2 0 2 0",
  monitorResize: true,
  multiSelect: true,
  plugins: ["paneldragdrop"],
  listeners: {
    afterlayout: function (widget, layout, eOpts) {
      var me = this;
      me.setApplicationsHeader(me.tabheader);
    },
  },
  loadState: function (oData) {
    var me = this;

    if (oData.columnWidth) {
      me.columnWidth = oData.columnWidth;
    }
    me.setColumnWidth(me.columnWidth);

    if (oData.refreshCycle) {
      me.refreshCycle = oData.refreshCycle;
    }

    me.setRefreshCycle(me.refreshCycle);
    me.tabheader = oData.tabheader;
  },
  getStateData: function () {
    var me = this;
    var result = {
      data: [],
    };

    if (me.items.length > 0) {
      for (var i = 0; i < me.items.length; i++) {
        win = me.items.getAt(i);
        /*
         * Depends on the loadedObjectType
         */
        var oElem = null;

        if (win.loadedObjectType == "app") {
          result.data.push({
            module: win.getAppClassName(),
            data: win.loadedObject.getStateData(),
            currentState: win.currentState,
            loadedObjectType: win.loadedObjectType,
          });
        } else if (win.loadedObjectType == "link") {
          result.data.push({
            link: win.linkToLoad,
            loadedObjectType: win.loadedObjectType,
          });
        }
      }
    }
    result.tabheader = me.tabheader;
    result.columnWidth = me.columnWidth;
    result.refreshCycle = me.refreshCycle;

    return result;
  },
  initComponent: function () {
    var me = this;
    me.menuItems = {
      "Refresh Plots": -1,
      Disable: 0,
      "Each 15m": 60000, // 900000
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

    me.configurationTool = Ext.create("Ext.panel.Tool", {
      type: "gear",
      tooltip: "Change the column width",
      scope: this,
      callback: function (panel, tool) {
        var width = 99;
        delete panel.headerMenu;
        panel.columnMenu = null;
        panel.headerMenu = null;
        panel.columnMenu = new Ext.menu.Menu();
        for (i = 1; i < panel.maxColumns; i++) {
          var item = new Ext.menu.CheckItem({
            value: i, // ??? maybe there is a way to get the
            // position
            // of the item in a container??
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

        panel.headerMenu = Ext.menu.Menu({
          items: [
            {
              xtype: "menucheckitem",
              text: "Disable",
              checked: panel.tabheader == false ? true : false,
              group: "columnHeader",
              value: "menuDisable",
              checkHandler: function (item, checked) {
                if (checked) {
                  panel.tabheader = false;
                  panel.setApplicationsHeader(false);
                }
              },
            },
            {
              xtype: "menucheckitem",
              text: "Enable",
              group: "columnHeader",
              value: "menuEnable",
              checked: panel.tabheader == true ? true : true,
              checkHandler: function (item, checked) {
                if (checked) {
                  panel.tabheader = true;
                  panel.setApplicationsHeader(true);
                }
              },
            },
          ],
        });
        panel.menu = new Ext.menu.Menu({
          items: [
            {
              text: "Collumns",
              menu: panel.columnMenu,
            },
            {
              text: "Header",
              menu: panel.headerMenu,
            },
          ],
        });

        panel.menu.showBy(tool.el);
      },
    });
    me.tools = [me.refreshTool, me.configurationTool];
    me.callParent(arguments);
  },
  addImage: function (img) {
    var me = this;
    var width = 99 / me.columnWidth;
    width = "." + Math.round(width);

    Ext.apply(img, {
      columnWidth: width,
    });
    me.add(img);
    me.addClickEvent(img);
  },
  addClickEvent: function (img) {
    var el = img.getEl();
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
                text: "Delete",
                scope: this,
                handler: function () {
                  var me = this;
                  me.removeImage(img.id);
                },
              },
            ],
          });
          contextMenu.showAt(e.getXY());
        },
        this
      );
    } else {
      alert("Cannot add click event to the image!");
    }
  },
  unselectImage: function (img) {
    if (img) {
      img.setBorder(0);
      img.getEl().fadeIn({
        opacity: 100,
      }); // , duration: 2000});
      img.selected = false;
    }
  },
  selectImage: function (img) {
    var me = this;
    if (img) {
      img.el.applyStyles({
        borderColor: "red",
        borderStyle: "solid",
      });
      img.setBorder(2);
      if (img.selected) {
        img.getEl().fadeIn({
          opacity: 100,
        }); // , duration: 2000});
        img.selected = false;
      } else {
        img.getEl().fadeIn({
          opacity: 0.65,
        }); // , duration: 2000});
        img.selected = true;
      }
    }
    me.unselectImage(me.lastClickedImage);
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
    me.remove(id);
    me.updateLayout();
  },
  getLastClickedImage: function () {
    var me = this;
    return me.lastClickedImage;
  },
  replaceImage: function (oimgid, img) {
    var me = this;
    var oImg = me.getComponent(oimgid);
    oImg.setSrc(img.src);
  },
  setColumnWidth: function (column) {
    var me = this;
    if (me.layout.type == "table") {
      me.layout.columns = column;
      me.columnWidth = column;
    } else {
      me.columnWidth = column;
      width = Math.floor(99 / column);
      width = width - 1;
      width = "." + width;
      me.items.each(function (value, index) {
        value.columnWidth = width;
      });
      me.updateLayout();
    }
  },
  fullSizeImage: function (img) {
    var html = '<img src="' + img.src + '" />';
    var win = new Ext.Window({
      collapsible: true,
      constrain: true,
      constrainHeader: true,
      html: html,
      layout: "fit",
      minHeight: 200,
      minWidth: 320,
      title: img.title,
    });
    win.show();
  },
  setRefreshCycle: function (time) {
    var me = this;
    var UTCTime = null;
    if (me.updateTime) {
      var now = new Date();
      UTCTime = now.toUTCString();
      UTCTime = UTCTime.replace("GMT", "[UTC]");
    }
    if (time != -1) {
      me.refreshCycle = time;
    }
    if (time == -1) {
      if (me.updateTime) {
        me.updateTime.setText("Updated:" + UTCTime);
      }
      me.items.each(function (value, index) {
        if (me.updateTime) {
          me.updateTime.setText("Updated:" + UTCTime);
        }
        if (value.src) {
          if (value.src.search("&nocache") != -1) {
            var src = value.src.split("&nocache")[0];

            src += "&nocache=" + new Date().getTime();
          } else {
            src = value.src;
          }
          value.setSrc(src);
        }
      });
    } else if (time == 0) {
      me.items.each(function (value, index) {
        clearInterval(value.refreshTimeout);
      });
    } else {
      me.items.each(function (value, index) {
        clearInterval(value.refreshTimeout);
        value.refreshTimeout = setInterval(function () {
          if (me.updateTime) {
            me.updateTime.setText("Updated:" + UTCTime);
          }
          if (value.src) {
            if (value.src.search("&nocache") != -1) {
              var src = value.src.split("&nocache")[0];
              src += "&nocache=" + new Date().getTime();
            } else {
              src = value.src;
            }
            value.setSrc(src);
          }
        }, time);
      });
    }
  },
  isExist: function (state) {
    var me = this;
    var exist = false;
    me.items.each(function (value, index) {
      if (value.title == state) {
        exist = true;
        return;
      }
    });
    return exist;
  },
  setApplicationsHeader: function (value) {
    var me = this;
    for (var i = 0; i < me.items.length; i++) {
      var tab = me.items.getAt(i);
      if (tab && tab.header == null) continue;
      if (value == true) {
        tab.header.show();
      } else {
        tab.header.hide();
      }
    }
  },
  getPanel: function (name) {
    var me = this;
    me.items.find();
  },
  getApplicationsState: function () {
    var me = this;
    var states = [];
    me.items.each(function (value, index) {
      states.push({
        module: value.appClassName,
        currentState: value.currentState,
      });
    });
    return states;
  },
  replaceImg: function (oldImg, newImg) {
    var me = this;
    var index = me.items.findIndex("id", oldImg.id);
    if (index != -1) {
      me.remove(me.items.getAt(index));

      delete me.lastClickedImage;

      me.lastClickedImage = null;
      me.items.insert(index, newImg);
      me.updateLayout();

      me.addClickEvent(me.items.getAt(index));
      me.selectImage(me.items.getAt(index));
    } else {
      Ext.dirac.system_info.msg("Error Notification", "Please select again the image what you want to modify");
    }
  },
});
