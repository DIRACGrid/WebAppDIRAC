Ext.define('DIRAC.Accounting.classes.Accounting', {
      extend : 'Ext.dirac.utils.PlotView',
      timeout : 7200000, // 2 hours
      initComponent : function() {
        var me = this;

        me.descPlotType = {
          DataOperation : {
            title : "Data Operation",
            selectionConditions : [["OperationType", "Operation Type"], ["User", "User"], ["ExecutionSite", "Execution Site"], ["Source", "Source SE"], ["Destination", "Destination SE"], ["Protocol", "Protocol"], ["FinalStatus", "Final Transfer Status"]]

          },
          Job : {
            title : "Job",
            selectionConditions : [["JobGroup", "Job Group"], ["JobType", "Job Type"], ["JobClass", "Job Class"], ["Site", "Site"], ["ProcessingType", "Processing Type"], ["FinalMajorStatus", "Final Major Status"], ["FinalMinorStatus", "Final Minor Status"], ["User", "User"],
                ["UserGroup", "User Group"]]

          },
          WMSHistory : {
            title : "WMS History",
            selectionConditions : [["User", "User"], ["UserGroup", "User Group"], ["Status", "Major Status"], ["MinorStatus", "Minor Status"], ["ApplicationStatus", "Application Status"], ["Site", "Site"], ["JobGroup", "Job Group"], ["JobSplitType", "Job Split Type"]]

          },
          Pilot : {
            title : "Pilot",
            selectionConditions : [["User", "User"], ["UserGroup", "User Group"], ["Site", "Site"], ["GridCE", "Grid CE"], ["GridMiddleware", "Grid Middleware"], ["GridResourceBroker", "Grid Resource Broker"], ["GridStatus", "Grid Status"]]

          },
          SRMSpaceTokenDeployment : {
            title : "SRM Space Token Deployment",
            selectionConditions : [["Site", "Site"], ["Hostname", "Hostname"], ["SpaceTokenDesc", "Space Token Description"]]

          }

        };

        me.reports = [["DataOperation", "Data Operation"], ["Job", "Job"], ["WMSHistory", "WMS History"], ["Pilot", "Pilot"], ["SRMSpaceTokenDeployment", "SRM Space Token Deployment"]]

        me.webHandler = "AccountingPlot";
        me.title = 'Accounting';
        me.callParent();
      }

    });
