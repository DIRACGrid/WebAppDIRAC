Ext.define('Ext.dirac.utils.DiracApplicationContextMenu',{
  extend:'Ext.menu.Menu',
  menuitems : null,
  items : [],
  constructor : function(oConfig){
    var me = this;
    me.callParent(arguments);
    if (oConfig.scope){
      Ext.apply(me, {scope:oConfig.scope});
    }
    if (oConfig){
      if(oConfig.menu && "Visible" in oConfig.menu && oConfig.menu.Visible.length>0){
        for(var i = 0; i< oConfig.menu.Visible.length; i++){
          var oMenuItem = null;
          if ("handler" in oConfig.menu.Visible[i]){
            oMenuItem = new Ext.menu.Item({text:oConfig.menu.Visible[i].text, handler: Ext.bind(oConfig.menu.Visible[i].handler, me.scope, oConfig.menu.Visible[i].arguments, false), scope : me.scope});
          }else if ("subMenu" in oConfig.menu.Visible[i]){
            oMenuItem = new Ext.menu.Item({text:oConfig.menu.Visible[i].text});
            me.__createSubmenu(oMenuItem, oConfig.menu.Visible[i].subMenu);
          }
          if (oConfig.menu.Visible[i].properties){
            Ext.apply(oMenuItem, oConfig.menu.Visible[i].properties);
          }
          me.add(oMenuItem);

        }
      }
    }
  },
  __createSubmenu : function(oMenu, subMenu){
    var me = this;
    oMenu.menu = new Ext.menu.Menu();
    if (subMenu == null){
      return;
    }else{
      if ("Visible" in subMenu){
        for(var i = 0; i<subMenu.Visible.length; i++){
          if ("handler" in subMenu.Visible[i]){
            var oMenuItem = new Ext.menu.Item({text:subMenu.Visible[i].text, handler: Ext.bind(subMenu.Visible[i].handler, me.scope, subMenu.Visible[i].arguments, false), scope : me.scope});
          }else if ("subMenu" in subMenu.Visible[i]){
            var oMenuItem = new Ext.menu.Item({text:oConfig.menu.Visible[i].text})
            me.__createSubmenu(oMenuItem, oConfig.menu.Visible[i].subMenu);
            oMenu.menu.add(oMenuItem);
          }
          if (subMenu.Visible[i].properties){
            Ext.apply(oMenuItem, subMenu.Visible[i].properties);
          }
          oMenu.menu.add(oMenuItem);
        }
      }else if ("Protected" in subMenu){
        for(var i = 0; i<subMenu.Protected.length; i++){
          var lDisable = ("properties" in GLOBAL.USER_CREDENTIALS) && (Ext.Array.indexOf(GLOBAL.USER_CREDENTIALS.properties, subMenu.Protected[i].property) != -1) == false? true:false;
          oMenu.disabled=lDisable;
          if ("handler" in subMenu.Protected[i]){
            var oMenuItem = new Ext.menu.Item({text:subMenu.Protected[i].text, handler: Ext.bind(subMenu.Protected[i].handler, me.scope, subMenu.Protected[i].arguments, false), scope : me.scope,disabled:lDisable});
          }else if ("subMenu" in subMenu.Protected[i]){
            var oMenuItem = new Ext.menu.Item({text:oConfig.menu.Protected[i].text, disabled:lDisable});
            me.__createSubmenu(oMenuItem, oConfig.menu.Protected[i].subMenu);
            oMenu.menu.add(oMenuItem);
          }
          if (subMenu.Protected[i].properties){
            Ext.apply(oMenuItem, subMenu.Protected[i].properties);
          }
          oMenu.menu.add(oMenuItem);
        }
      }

    }
  }

});
