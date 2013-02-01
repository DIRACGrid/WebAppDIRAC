/**
 * A control that allows selection of multiple items in a list
 */
Ext.define('Ext.ux.desktop.DiracMultiSelect', {
    
    extend: 'Ext.ux.form.MultiSelect',
    alias: ['widget.diracmultiselectfield', 'widget.diracmultiselect'],
    
    ddReorder: false,
    
    listConfig: {
    	selModel:new Ext.selection.DataViewModel({
            mode: "MULTI",
            selectWithEvent: function(record, e, keepExisting) {
                var me = this;

                switch (me.selectionMode) {
                    case 'MULTI':
                        if (e.ctrlKey && me.isSelected(record)) {
                            me.doDeselect(record, false);
                        } else if (e.shiftKey && me.lastFocused) {
                            me.selectRange(me.lastFocused, record, e.ctrlKey);
                        } else if (e.ctrlKey) {
                            me.doSelect(record, true, false);
                        } else if (me.isSelected(record) && !e.shiftKey && !e.ctrlKey){
        					me.doDeselect(record, false);
                        } else {
                            me.doSelect(record, false);
                        }
                        break;
                    case 'SIMPLE':
                        if (me.isSelected(record)) {
                            me.doDeselect(record);
                        } else {
                            me.doSelect(record, true);
                        }
                        break;
                    case 'SINGLE':
                        // if allowDeselect is on and this record isSelected, deselect it
                        if (me.allowDeselect && me.isSelected(record)) {
                            me.doDeselect(record);
                        // select the record and do NOT maintain existing selections
                        } else {
                            me.doSelect(record, false);
                        }
                        break;
                }
            },
            
            selectRange : function(startRow, endRow, keepExisting, dir){
                var me = this,
                    store = me.store,
                    selectedCount = 0,
                    i,
                    tmp,
                    dontDeselect,
                    records = [];

                if (me.isLocked()){
                    return;
                }


                if (!keepExisting) {
                    me.deselectAll(false);
                }


                if (!Ext.isNumber(startRow)) {
                    startRow = store.indexOf(startRow);
                }
                if (!Ext.isNumber(endRow)) {
                    endRow = store.indexOf(endRow);
                }

                // swap values
                if (startRow > endRow){
                    tmp = endRow;
                    endRow = startRow;
                    startRow = tmp;
                }
                
                
                for (i = startRow; i <= endRow; i++) {
                    if (me.isSelected(store.getAt(i))) {
                        selectedCount++;
                    }
                }

                if (!dir) {
                    dontDeselect = -1;
                } else {
                    dontDeselect = (dir == 'up') ? startRow : endRow;
                }

                for (i = startRow; i <= endRow; i++){
                    if (selectedCount == (endRow - startRow + 1)) {
                        if (i != dontDeselect) {
                            me.doDeselect(i, true);
                        }
                    } else {
                        records.push(store.getAt(i));
                    }
                }

                me.doMultiSelect(records, true);
                
            }
         }),
        // Custom rendering template for each item
        getInnerTpl: function(displayField) {
        	
        	return '<div class="multselector-checkbox" style="float:left"></div><div style="float:left;padding:4px 0px 0px 5px">{'+displayField+'}</div><div style="clear:both"></div>';

        },
        listeners : {				                	

        	//beforeselect:function(viewModel, record, eOpts){
        	select:function(r, record, eOpts){
        						                		
        		console.log("RECORD::SELECT");
        		var node = this.getNode(record);
        		
                if (node) {
                	var oPomElemId = Ext.fly(node).down("table").id;
                	var oCheckBox = Ext.getCmp(oPomElemId);
                	oCheckBox.setValue(true);

                }

        	},
        	
        	deselect:function(r, record, eOpts){
        		
        		console.log("RECORD::DESELECT::");
        		
        		var node = this.getNode(record);
        		
                if (node) {
                	var oPomElemId = Ext.fly(node).down("table").id;
                	var oCheckBox = Ext.getCmp(oPomElemId);
                	
                	oCheckBox.setValue(false);
                		                  	
                }
        		
        	},
        	
        	itemclick: function(viewObject, record, item, index, e, eOpts){
        			
                if(e.target.nodeName=="INPUT")
                	e.ctrlKey = true;

        	},
        	refresh:function(){
        		
        		var me = this;
    	        var renderSelector = Ext.query("#"+me.id+' div.multselector-checkbox'); 
	            for(var i in renderSelector){
	                Ext.create('Ext.form.field.Checkbox',{
	                    renderTo:renderSelector[i],
	                    multiListRef: me.exampleMultiSelect
	                });   
	            } 
    	    }
        }
    	
        	
    }
    
});
