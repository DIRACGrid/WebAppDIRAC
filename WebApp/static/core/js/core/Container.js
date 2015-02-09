/**
 * @class Ext.dirac.core.StateManagement This class manages the state management
 *        within the Desktop view
 * 
 */

Ext.define('Ext.dirac.core.Container', {
      createChildWindow : function(sTitle, bModal, iWidth, iHeight) {
      },
      oprPrepareAndShowWindowGrid : function(oData, sTitle, oFields, oColumns, menu) {
        var me = this;

        var oStore = new Ext.data.ArrayStore({
              fields : oFields,
              data : oData
            });

        var oWindow = me.createChildWindow(sTitle, false, 700, 500);

        var oGrid = Ext.create('Ext.grid.Panel', {
              store : oStore,
              columns : oColumns,
              width : '100%',
              viewConfig : {
                stripeRows : true,
                enableTextSelection : true
              },
              menu : null,
              listeners : {

                beforecellcontextmenu : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {
                  e.preventDefault();
                  var me = this;
                  if (me.menu) {
                    me.menu.showAt(e.xy);
                  }
                  return false;
                }

              }
            });

        if (menu) {
          var oMenu = new Ext.menu.Menu();
          for (var i in menu) {
            oMenu.add({
                  'text' : menu[i].text,
                  handler : Ext.bind(menu[i].handler, oGrid, menu[i].arguments, false)
                });
          }
          oGrid.menu = oMenu;
        }

        oWindow.add(oGrid);
        oWindow.show();

      },
      showValue : function(grid) {
        var me = this;
        var sValue = GLOBAL.APP.CF.getSelectedValue(grid);
        Ext.Msg.minWidth = 360;
        Ext.Msg.alert('Cell value is:', sValue);
      },
      showInWindow : function(sTitle, panel) {
        var me = this;
        var oWindow = me.createChildWindow(sTitle, false, 700, 500);
        oWindow.add(panel);
        oWindow.show();
      },
      oprPrepareAndShowWindowText : function(sTextToShow, sTitle) {

        var me = this;

        var oWindow = me.createChildWindow(sTitle, false, 700, 500);

        var oTextArea = Ext.create('Ext.form.field.TextArea', {
              value : sTextToShow,
              cls : "jm-textbox-help-window"

            });

        oWindow.add(oTextArea);
        oWindow.show();

      },
      /**
       * it is used to show an URL in a window.
       * 
       * @param {String}
       *          url
       * @param {String}
       *          title is the title of the window
       */
      oprPrepareAndShowWindowHTML : function(url, title) {
        var me = this;
        var window = me.createChildWindow(title, false, 700, 500);
        var htmlPanel = Ext.create('Ext.panel.Panel', {
              layout : 'fit',
              items : [{
                    xtype : "component",

                    autoEl : {
                      tag : "iframe",
                      src : url
                    }
                  }]
            });
        window.add(htmlPanel);
        window.show();
      },
      oprShowInNewTab : function (url){
        var win = window.open(url, '_blank');
        win.focus();
      }
    });
