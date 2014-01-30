Ext.define('Ext.dirac.utils.DiracGridPanel',{
  extend : 'Ext.grid.Panel',
  mixins : [ "Ext.dirac.core.Stateful"],
  region : 'center',
  height : '600',
  header : false,
  viewConfig : {
    stripeRows : true,
    enableTextSelection : true
  },
  defaultColumnsProperties : {sortable:true,align:'left',hidden:true},
  columns : [ ],
  renderers : ["rendererChkBox", "rendererStatus","diffValues"],
  loadState : function(data) {

    var me = this;

    if (data.columns) {
      for ( var i = 0; i < me.columns.length; i++) {

        var col = me.columns[i];
        if (Ext.Array.contains(data.columns, col.getSortParam())){
          col.setWidth(data.columns[col.getSortParam()].width);
          if (data.columns[col.getSortParam()].hidden)
            col.hide();
          else
            col.show();

          var sortState = data.columns[col.getSortParam()].sortState;

          if (sortState != null)
            col.setSortState(sortState);
        }
      }
    }
    if (data.columns && data.columns.groupers){
      me.store.groupers.clear();
      me.store.groupers.addAll(me.store.decodeGroupers(data.columns.groupers));
    }
    if (data.columns && data.columns.sorters){
      me.store.sorters.clear();
      me.store.sorters.addAll(me.store.decodeSorters(data.columns.sorters));
    }
  },
  getRenderers : function(){
    var me = this;

  },
  getStateData : function() {

    var me = this;
    var oReturn = {};

    // data for grid columns
    oReturn.columns = {};

    for ( var i = 0; i < me.columns.length; i++) {

      var col = me.columns[i];
      var oName = col.getSortParam();
      oReturn.columns[oName] = {
          "width" : col.width,
          "hidden" : col.isHidden(),
          "sortState" : col.sortState
      };

    }

    oReturn.columns.sorters = [];
    oReturn.columns.groupers = [];

    me.store.sorters.each(function(key, value){
      GLOBAL.APP.CF.log('debug',":",key);
      GLOBAL.APP.CF.log('debug',":",value);
      oReturn.columns.sorters.push({"property":key.property, "direction":key.direction});
    });

    me.store.groupers.each(function(key, value){
      GLOBAL.APP.CF.log('debug',":",key);
      GLOBAL.APP.CF.log('debug',":",value);
      oReturn.columns.groupers.push({"property":key.property, "direction":key.direction});
    });

    return oReturn;

  },
  initComponent : function(arguments){
    var me = this;
    GLOBAL.APP.CF.log("debug", "init function", me.columns);
    me.callParent(arguments);
  },
  constructor : function(config){
    var me = this;

    GLOBAL.APP.CF.log("debug","Create panel...");
    me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
    me.checkboxFunctionDefinition += 'var oChecked=this.checked;';
    me.checkboxFunctionDefinition += 'var oElems=Ext.query(\'#' + me.id + ' input.checkrow\');';
    me.checkboxFunctionDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
    me.checkboxFunctionDefinition += '" class="jm-main-check-box"/>';

    var oColumn = {};
    for (i in config.oColumns){
      oColumn = {};
      if (i == "checkBox"){
        oColumn = {
            header : me.checkboxFunctionDefinition,
            name : "checkBox",
            width : 26,
            sortable : false,
            dataIndex : 'TransformationIDcheckBox',
            renderer : function(value, metaData, record, row, col, store, gridView) {
              return me.rendererChkBox(value);
            },
            hideable : false,
            fixed : true,
            menuDisabled : true,
            align:"center"
        };
      }else{
        oColumn = {sortable:true,align:'left',hidden:false};
        if (i == "None"){
          Ext.apply(oColumn, {header: "", dataIndex:config.oColumns[i]["dataIndex"]});
        }else{
          Ext.apply(oColumn, {header: i, dataIndex:config.oColumns[i]["dataIndex"]});
        }

        if ("properties" in config.oColumns[i]){
          Ext.apply(oColumn, config.oColumns[i]["properties"]);
        }

        if ("renderFunction" in config.oColumns[i]){
          var func = null;
          if (config.oColumns[i]["renderFunction"] == "rendererStatus"){
            func = function(value,metaData,record,rowIndex,colIndex,store){
              return me.rendererStatus(value,metaData,record,rowIndex,colIndex,store);
            };
          }else if (config.oColumns[i]["renderFunction"] == "diffValues"){
            func = function(value,metaData,record,rowIndex,colIndex,store){
              return me.diffValues(value,metaData,record,rowIndex,colIndex,store);
            };
          }else{
            var message = config.oColumns[i]["renderFunction"] + " render function does not exists!!!"
            GLOBAL.APP.CF.log("error", message);
          }
          Ext.apply(oColumn, {"renderer" : func});
        }
        if ("renderer" in config.oColumns[i]){
          Ext.apply(oColumn, {"renderer":config.oColumns[i]["renderer"]});
        }
      }
      if (config.columns){//Only when the oColumns are provided: we may have a case when we need to provide all columns.
        Ext.Array.push(config.columns, oColumn);
      }else{
        config.columns = [];
        Ext.Array.push(config.columns, oColumn);
      }

    }
    GLOBAL.APP.CF.log("debug", "Grid columns:", me.columns);
    if (config.contextMenu){
      Ext.apply(me,   { "listeners" : {

        cellclick : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {

          if(cellIndex!=0){
            config.contextMenu.showAt(e.xy);
          }

        }
      }});
    }
    me.callParent(arguments);
  },
  rendererChkBox : function(val) {
    return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
  },
  rendererStatus : function(value) {
    if ((value == 'Done') || (value == 'Completed') || (value == 'Good') || (value == 'Active') || (value == 'Cleared') || (value == 'Completing')) {
      return '<img src="static/DIRAC/JobMonitor/images/done.gif"/>';
    } else if (value == 'Bad') {
      return '<img src="static/DIRAC/JobMonitor/images/bad.gif"/>';
    } else if ((value == 'Failed') || (value == 'Bad') || (value == 'Banned') || (value == 'Aborted')) {
      return '<img src="static/DIRAC/JobMonitor/images/failed.gif"/>';
    } else if ((value == 'Waiting') || (value == 'Stopped') || (value == 'Poor') || (value == 'Probing')) {
      return '<img src="static/DIRAC/JobMonitor/images/waiting.gif"/>';
    } else if (value == 'Deleted') {
      return '<img src="static/DIRAC/JobMonitor/images/deleted.gif"/>';
    } else if (value == 'Matched') {
      return '<img src="static/DIRAC/JobMonitor/images/matched.gif"/>';
    } else if ((value == 'Running') || (value == 'Active') || (value == 'Fair')) {
      return '<img src="static/DIRAC/JobMonitor/images/running.gif"/>';
    } else if (value == 'NoMask') {
      return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
    }else if (value = 'Completed'){
      return '<img src="static/LHCbDIRAC/TransformationMonitor/images/completed.gif"/>';
    }else if (value = 'Idle'){
      return '<img src="static/LHCbDIRAC/TransformationMonitor/images/idle.gif"/>';
    }else {
      return '<img src="static/DIRAC/JobMonitor/images/unknown.gif"/>';
    }
  },
  diffValues : function (value,metaData,record,rowIndex,colIndex,store){
    var me = this;
    var id = record.data.TransformationID;
    var diffValues = me.store.getDiffValues();
    if (diffValues){
      if(id && diffValues[id]){
        var field = metaData.column.dataIndex;
        try{
          var diff = value - diffValues[id][field];
          var test = diff + '';
          if(test.indexOf(".") > 0){
            diff = diff.toFixed(1);
          }
          if(diff > 0){
            return value + ' <font color="#00CC00">(+' + diff + ')</font>';
          }else if(diff < 0){
            return value + ' <font color="#FF3300">(' + diff + ')</font>';
          }else{
            return value;
          }
        }catch(e){
          return value;
        }
      }else{
        return value;
      }

    }
  }
});