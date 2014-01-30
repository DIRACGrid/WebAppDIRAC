Ext.define('Ext.dirac.utils.DiracJsonStore',{
  extend:'Ext.data.JsonStore',
  autoLoad : true,
  remoteSort : true,
  pageSize : 25,
  oDiffFields : null,
  diffValues : {},
  getDiffValues : function(){
    var me = this;
    return me.diffValues;
  },
  listeners : {

    load : function(oStore, records, successful, eOpts) {
      var me = this;

      var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

      if (!bResponseOK) {

        GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "info");

        if (parseInt(oStore.proxy.reader.rawData["total"]) == 0) {

          me.removeAll();

        }

      } else {
        if (oStore.proxy.reader.rawData)
          me.scope.pagingToolbar.toolbar.updateStamp.setText('Updated: ' + oStore.proxy.reader.rawData["date"]);

        me.remoteSort = false;
        me.sort();
        me.remoteSort = true;

      }

    },

    beforeload : function(oStore, oOperation, eOpts) {
      var me = this;

      if (me.oDiffFields){//this is for marking the values in the table...
        if(oStore.proxy.reader.rawData && oStore.proxy.reader.rawData["total"] > 0){
          for(var i = 0; i < oStore.proxy.reader.rawData["total"]; i++){
            var record = oStore.getAt(i);
            try{
              me.diffValues[record.data[me.oDiffFields.Id]] = {};
              for (var j = 0; j< me.oDiffFields.Fields.length; j++){
                me.diffValues[record.data[me.oDiffFields.Id]][me.oDiffFields.Fields[j]] = record.data[me.oDiffFields.Fields[j]];
              }
            }catch(e){}
          }
        }
      }

      me.lastDataRequest = oOperation;

      if (!oStore.dontLoadOnCreation) {
        oStore.dontLoadOnCreation = true;
        return false;
      } else {
        return true;
      }

    }

  }
});