/***
 *  It makes easier to create the data store data from JSON. It provides DIRAC specific functionalities.
 *  USAGE:
 *
 *     var oProxy = Ext.create('Ext.dirac.utils.DiracAjaxProxy',{
 *        url : GLOBAL.BASE_URL + 'JobMonitor/getJobData'
 *     });
 *
 *      me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore",{
 *        proxy : oProxy,
 *        fields : me.dataFields,
 *        scope: me});
 *  Parameters:
 *  -oProxy can be any kind of data proxy. But we propose to use {@link Ext.dirac.utils.DiracAjaxProxy}
 *  -fields is a list of data fields. For example:
 *    dataFields : [
 *         {name : 'SystemPriority', type : 'float'},
 *         {name : 'ApplicationNumStatus'},
 *         {name : 'JobID',type : 'int'}]
 *  -scope: it is a pointer to the application.
 */
Ext.define('Ext.dirac.utils.DiracJsonStore',{
  extend:'Ext.data.JsonStore',
  autoLoad : true,
  remoteSort : true,
  /**
   * @property{Number} pageSize
   * It is the number of rows. Default value is 25.
   */
  pageSize : 25,
  /***
   * @cfg{Ext.dirac.utils.DiracAjaxProxy} proxy
   * It is an Ajax proxy used to load and save data. It can be other types of proxy as well. More info: {@link Ext.data.proxy.Proxy}
   */
  proxy : null,
  /***
   * @cfg{Object} oDiffFields
   * It contains a list of columns used to see difference of a given value after the refresh. The Fields list are the dataIndex.
   * For example:
   *    oDiffFields :{'Id':'TransformationID','Fields':['Jobs_Created',
   *                                                      'Jobs_TotalCreated',
   *                                                      'Jobs_Done',
   *                                                      'Jobs_Failed',
   *                                                      'Jobs_Running',
   *                                                      'Jobs_Stalled',
   *                                                      'Jobs_Submitted',
   *                                                      'Jobs_Waiting',
   *                                                      'Jobs_Completed',
   *                                                      'Files_PercentProcessed',
   *                                                      'Files_Total',
   *                                                      'Files_Unused',
   *                                                      'Files_Assigned',
   *                                                      'Files_Processed',
   *                                                      'Files_Problematic',
   *                                                      'Files_MaxReset']},
   *                                                      scope: me});
   */
  oDiffFields : null,
  /***
   * @cfg{Object} diffValues
   * it stores the values which are given by oDiffFields before refresh.
   */
  diffValues : {},
  /***
   * @property{Ext.data.Operation} lastDataRequest
   * it stores the latest {@link Ext.data.Operation}, which is used to cancel the AJAX request.
   */
  lastDataRequest : null,
  /***
   * it returns the values for a given fields.
   * @return{Object} returns the saved values.
   */
  getDiffValues : function(){
    var me = this;
    return me.diffValues;
  },
  /***
   * @property{String} groupField
   * The values will be grouped by this field.
   */
  groupField : null,
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
          me.scope.grid.pagingToolbar.updateStamp.setText('Updated: ' + oStore.proxy.reader.rawData["date"]);

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