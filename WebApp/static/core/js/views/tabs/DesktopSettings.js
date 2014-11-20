Ext.define("Ext.dirac.views.tabs.DesktopSettings", {
      extend : 'Ext.form.Panel',
      title : 'Activ desktop configuration',
      layout : 'fit',
      bodyPadding : 10,
      width : 400,
      layout : {
        type : 'table',
        columns : 2,
        tdAttrs : {
          style : 'padding: 5px 10px;'
        }
      },
      defaults : {
        width : 150,
        textAlign : 'left'
      },
      items : [{
            xtype : 'label',
            text : 'Name:'
          }, {
            xtype : 'label',
            text : "None"
          }, {
            xtype : 'label',
            text : "Automatic tab change"
          }],
      initComponent : function() {
        var me = this;
        me.menuItems = {
          'Disable' : 0,
          'Each 5m' : 60000, // 60000,//900000,
          'Each 10m' : 900000, // 60000,//900000,
          'Each 15m' : 900000, // 60000,//900000,
          'Each hour' : 3600000,
          'Each day' : 86400000
        };
        me.callParent(arguments);
        me.autoChange = Ext.create('Ext.menu.Menu', {
              listeners : {
                click : function(menu, menuItem, e, eOpts) {
                  me.setTabChange(menuItem.value, menuItem.text);
                }
              }
            });

        for (var i in me.menuItems) {
          var item = null;

          item = new Ext.menu.CheckItem({
                checked : false,
                group : 'column',
                value : me.menuItems[i],
                text : i
              });
          me.autoChange.add(item);
        }
        me.add({
              xtype : 'button',
              text : 'Disable',
              menu : me.autoChange
            });
      
      },
      setTabChange : function(value, text) {
        var me = this;
        me.items.getAt(3).setText(text);
      },
      setTabChangePeriod : function(value){
        var me = this;
        for (i in me.menuItems){
          if (me.menuItems[i] == value){
            me.items.getAt(3).setText(i);
            me.autoChange.items.each(function(item){
              if(item.value == value){
                item.checked = true;
              }
            });
          }
        };
      },
      setDesktopName : function(name){
        var me = this;
        me.items.getAt(1).setText(name);
      }
    });
