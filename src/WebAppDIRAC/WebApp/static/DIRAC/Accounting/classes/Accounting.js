Ext.define("DIRAC.Accounting.classes.Accounting", {
  extend: "Ext.dirac.utils.PlotView",
  timeout: 7200000, // 2 hours
  initComponent: function () {
    var me = this;

    me.reportsDesc = {
      Accounting: {
        DataOperation: {
          title: "Data Operation",
          selectionConditions: [
            ["OperationType", "Operation Type"],
            ["User", "User"],
            ["ExecutionSite", "Execution Site"],
            ["Source", "Source SE"],
            ["Destination", "Destination SE"],
            ["Protocol", "Protocol"],
            ["FinalStatus", "Final Transfer Status"],
          ],
        },
        Job: {
          title: "Job",
          selectionConditions: [
            ["JobGroup", "Job Group"],
            ["JobType", "Job Type"],
            ["JobClass", "Job Class"],
            ["Site", "Site"],
            ["ProcessingType", "Processing Type"],
            ["FinalMajorStatus", "Final Major Status"],
            ["FinalMinorStatus", "Final Minor Status"],
            ["User", "User"],
            ["UserGroup", "User Group"],
          ],
        },
        WMSHistory: {
          title: "WMS History",
          selectionConditions: [
            ["User", "User"],
            ["UserGroup", "User Group"],
            ["Status", "Major Status"],
            ["MinorStatus", "Minor Status"],
            ["ApplicationStatus", "Application Status"],
            ["Site", "Site"],
            ["JobGroup", "Job Group"],
            ["JobSplitType", "Job Split Type"],
          ],
        },
        Pilot: {
          title: "Pilot",
          selectionConditions: [
            ["User", "User"],
            ["UserGroup", "User Group"],
            ["Site", "Site"],
            ["GridCE", "Grid CE"],
            ["GridMiddleware", "Grid Middleware"],
            ["GridResourceBroker", "Grid Resource Broker"],
            ["GridStatus", "Grid Status"],
          ],
        },
        PilotSubmission: {
          title: "Pilot Submission",
          selectionConditions: [
            ["Site", "Site"],
            ["HostName", "HostName"],
            ["SiteDirector", "SiteDirector"],
            ["CE", "CE"],
            ["Queue", "Queue"],
            ["Status", "Status"],
          ],
        },
        StorageOccupancy: {
          title: "Storage Occupancy",
          selectionConditions: [
            ["Endpoint", "Endpoint"],
            ["Site", "Site"],
            ["StorageElement", "StorageElement"],
          ],
        },
      },
      Monitoring: {
        WMSHistory: {
          title: "WMS History",
          selectionConditions: [
            ["User", "User"],
            ["UserGroup", "User Group"],
            ["Status", "Major Status"],
            ["MinorStatus", "Minor Status"],
            ["ApplicationStatus", "Application Status"],
            ["Site", "Site"],
            ["JobGroup", "Job Group"],
            ["JobSplitType", "Job Split Type"],
          ],
        },
        RMSMonitoring: {
          title: "RMS Monitoring",
          selectionConditions: [
            ["host", "Host"],
            ["objectType", "Object Type"],
            ["operationType", "Operation Type"],
            ["status", "Status"],
          ],
        },
      },
    };

    me.reports = {
      Accounting: [
        ["DataOperation", "Data Operation"],
        ["Job", "Job"],
        ["WMSHistory", "WMS History"],
        ["Pilot", "Pilot"],
        ["PilotSubmission", "Pilot Submission"],
        ["StorageOccupancy", "Storage Occupancy"],
      ],
      Monitoring: [
        ["WMSHistory", "WMS Monitoring"],
        ["RMSMonitoring", "RMS Monitoring"],
      ],
    };

    me.handlers = {
      Accounting: "Accounting",
      Monitoring: "Monitoring",
    };

    me.title = "Accounting";

    me.dataSelectors = {
      Accounting: {
        dataSelector: [
          [86400, "Last Day"],
          [604800, "Last Week"],
          [2592000, "Last Month"],
          [-1, "Manual Selection"],
          [-2, "By Quarter"],
        ],
        defaultTime: 86400,
      },
      Monitoring: {
        dataSelector: [
          [3600, "Last Hour"],
          [86400, "Last Day"],
          [604800, "Last Week"],
          [2592000, "Last Month"],
          [-1, "Manual Selection"],
          [-2, "By Quarter"],
        ],
        defaultTime: 86400,
      },
    };

    me.callParent();

    me.callParent();
  },
});
