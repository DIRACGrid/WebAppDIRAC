Ext.define('Ext.dirac.utils.DiracAjaxProxy',{
  extend: 'Ext.data.proxy.Ajax',
  type : 'ajax',
  reader : {
    type : 'json',
    root : 'result'
  },
  timeout : 1800000,
  dontLoadOnCreation : false,
  listeners : {
    exception : function(proxy, response, operation) {
      var jsonData = Ext.JSON.decode(response.responseText);
      if (jsonData && jsonData["success"] == "false") {
        GLOBAL.APP.CF.alert(jsonData["error"], "info");
      }
    }
  }
});

