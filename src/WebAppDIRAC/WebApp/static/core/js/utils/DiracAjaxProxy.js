/*******************************************************************************
 * This class is used to create an Ajax proxy to retrieve data from the server.
 * NOTE: In order to use it you have to specify the URL. The following example
 * describes how it can be used within DIRAC framework. This proxy has to be set
 * to a JsonStore. We propose to use {@link DiracJsonStore} as it has predefined
 * methods.
 *
 * <pre>
 * var oProxy = Ext.create('Ext.dirac.utils.DiracAjaxProxy', {
 *       url : GLOBAL.BASE_URL + 'JobMonitor/getJobData'
 *     });
 * me.dataStore = Ext.create(&quot;Ext.dirac.utils.DiracJsonStore&quot;, {
 *       proxy : oProxy,
 *       fields : me.dataFields,
 *       scope : me
 *     });
 * </pre>
 */
Ext.define("Ext.dirac.utils.DiracAjaxProxy", {
  extend: "Ext.data.proxy.Ajax",
  type: "ajax",
  autoLoad: true,
  reader: {
    keepRawData: true,
    type: "json",
    rootProperty: "result",
    metaProperty: "extra",
  },
  /**
   * @cfg{Number} timeout default timeout is 2 minutes (120000 millisecond).
   */
  timeout: 120000,
  /**
   * @cfg{url} url default is an empty string. You have to provide a URL
   *           where to retrieve the data. The URL is the full path of the
   *           web controller.
   */
  url: "",
  /**
   * @cfg{dontLoadOnCreation} This is used to cancel the request to the web
   *                          controller.
   */
  dontLoadOnCreation: false,
  listeners: {
    exception: function (proxy, response, operation) {
      GLOBAL.APP.CF.showAjaxErrorMessage(response);
    },
  },
});
