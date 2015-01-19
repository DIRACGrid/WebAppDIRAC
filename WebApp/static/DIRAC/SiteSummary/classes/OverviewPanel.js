Ext.define("DIRAC.SiteSummary.classes.OverviewPanel", {
      extend : "Ext.panel.Panel",
      title : 'Overview',
      region : 'east',
      autoScroll : true,
      collapsible : true,
      split : true,
      region : 'east',
      margins : '2 0 2 0',
      cmargins : '2 2 2 2',
      bodyStyle : 'padding: 5px',
      width : 600,
      labelAlign : 'top',
      minWidth : 200,
      hidden : true,
      layout : "column",
      columnWidth : 2,
      tools : [{
            type : 'maximize',
            tooltip : 'Maximize the application.',
            handler : function(event, toolEl, panelHeader) {
              var me = this;

              var widget = me.up("panel");
              var parent = me.up("panel").parentWidget;

              parent.grid.hide();
              parent.leftPanel.hide();

              for (var i = 0; i < widget.tools.length; i++) {
                if (widget.tools[i].type == 'maximize' || widget.tools[i].type == 'close' || widget.tools[i].type == "collapse-right") {
                  widget.tools[i].hide();
                } else if (widget.tools[i].type == 'minimize') {
                  widget.tools[i].show();
                }
              }

              widget.panelSize = {
                height : widget.getHeight(),
                width : widget.getWidth()
              };

              widget.setHeight(widget.maximizedSize.height);
              widget.setWidth(widget.maximizedSize.width);
            }
          }, {
            type : 'minimize',
            tooltip : 'Minimize the application.',
            hidden : true,
            handler : function(event, toolEl, panelHeader) {
              var me = this;

              var parent = me.up("panel").parentWidget;
              var widget = me.up("panel");

              parent.grid.show();
              parent.leftPanel.show();

              for (var i = 0; i < widget.tools.length; i++) {
                if (widget.tools[i].type == 'maximize' || widget.tools[i].type == 'close' || widget.tools[i].type == "collapse-right") {
                  widget.tools[i].show();
                } else if (widget.tools[i].type == 'minimize') {
                  widget.tools[i].hide();
                }
              }

              widget.setHeight(widget.panelSize.height);
              widget.setWidth(widget.panelSize.width);
            }
          }],
      listeners : {
        collapse : function(panel, eOpts) {
          panel.hide();
          panel.parentWidget.grid.show();
          panel.parentWidget.leftPanel.show();
        }
      },
      initComponent : function() {
        var me = this;

        me.dataFields = [{
              name : 'Name'
            }, {
              name : 'StatusType'
            }, {
              name : 'Status'
            }, {
              name : 'ElementType'
            }, {
              name : 'Reason'
            }, {
              name : 'DateEffective'
            }, {
              name : 'LastCheckTime'
            }, {
              name : 'TokenOwner'
            }, {
              name : 'TokenExpiration'
            }];

        var viewStore = Ext.create('Ext.data.Store', {
              fields : me.dataFields
            });
        var tpl = new Ext.XTemplate('<tpl for=".">', '<div style="margin-bottom: 10px;" class="dataset-statistics">', '<b>Name:</b> {Name}<br/>', '<b>Status Type:</b> {StatusType}<br/>', '<b>Status:</b> {Status}<br/>', '<b>ElementType:</b> {ElementType}<br/>',
            '<b>Reason:</b> {Reason}<br/>', '<b>DateEffective:</b> {DateEffective} <br><b>LastCheckTime:</b> {LastCheckTime}<br/> <b>TokenOwner:</b> {TokenOwner}<br/>', '<b>TokenExpiration:</b> {TokenExpiration}<br/>', '</div>', '</tpl>');

        me.view = new Ext.view.View({
              columnWidth : 1 / 3,
              tpl : tpl,
              store : viewStore,
              itemSelector : 'div.dataset-statistics',
              autoHeight : true
            });

        me.viewPanel = Ext.create("Ext.panel.Panel", {
              "title" : "Details",
              columnWidth : 1 / 3,
              items : me.view,
              layout : 'fit',
              resizable : true
            });

        me.callParent(arguments);
        me.add([me.viewPanel]);

      },
      loadData : function(selection) {
        var me = this;

        me.viewPanel.body.mask("Loading ...");
        Ext.Ajax.request({
              url : GLOBAL.BASE_URL + me.applicationName + '/action',
              method : 'POST',
              params : {
                action : Ext.JSON.encode(["Info"]),
                name : Ext.JSON.encode([selection.name]),
                elementType : Ext.JSON.encode([selection.elementType]),
                statusType : Ext.JSON.encode([selection.statusType]),
                element : (selection.element ? Ext.JSON.encode([selection.element]) : Ext.JSON.encode(["Resource"]))
              },
              scope : me,
              failure : function(response) {
                GLOBAL.APP.CF.showAjaxErrorMessage(response);
                me.viewPanel.body.unmask();
              },
              success : function(response) {

                var jsonData = Ext.JSON.decode(response.responseText);

                if (jsonData["success"] == "true") {
                  me.setTitle(jsonData["result"]["Name"]);
                  me.view.getStore().loadData([jsonData["result"]]);
                  me.viewPanel.body.unmask();
                } else {
                  GLOBAL.APP.CF.msg("error", jsonData["error"]);
                }
              }
            });

      },
      gocdb_to_elog_site_name : function(name) {
        switch (name) {
          case 'CERN-PROD' :
            return 'CERN';
          case 'INFN-T1' :
            return 'CNAF';
          case 'FZK-LCG2' :
            return 'GridKa';
          case 'IN2P3-CC' :
            return 'IN2P3';
          case 'NIKHEF-ELPROD' :
            return 'NIKHEF';
          case 'pic' :
            return 'PIC';
          case 'RAL-LCG2' :
            return 'RAL';
          case 'SARA-MATRIX' :
            return 'SARA';

          default :
            return '';
        }
      }

    });
