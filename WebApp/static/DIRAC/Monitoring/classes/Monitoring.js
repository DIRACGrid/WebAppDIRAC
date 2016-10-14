/*******************************************************************************
 * It is allow to manage more than one plots in a single application. The
 * RightPanle is replaced to a Presenter widget.
 */
Ext.define('DIRAC.Monitoring.classes.Monitoring', {
      extend : 'Ext.dirac.utils.PlotView',
      timeout : 7200000, // 2 hours
      initComponent : function() {
        var me = this;

        me.title = "Monitoring";
        me.webHandler = "Monitoring";

        me.descPlotType = {
          WMSHistory : {
            title : "WMS History",
            selectionConditions : [["User", "User"], ["UserGroup", "User Group"], ["Status", "Major Status"], ["MinorStatus", "Minor Status"], ["ApplicationStatus", "Application Status"], ["Site", "Site"], ["JobGroup", "Job Group"], ["JobSplitType", "Job Split Type"]]

          },

          ComponentMonitoring : {
            title : "Component Monitoring",
            selectionConditions : [["host", "Host"], ["component", "Component"], ["pid", "PID"], ["status", "Status"]]

          }
        };

        me.dateSelector = [[3600, "Last Hour"], [86400, "Last Day"], [604800, "Last Week"], [2592000, "Last Month"], [-1, "Manual Selection"], [-2, "By Quarter"]]
        me.reports = [["WMSHistory", "WMS Monitoring"], ["ComponentMonitoring", "Component Monitoring"]]
        me.callParent();
      }
    });
