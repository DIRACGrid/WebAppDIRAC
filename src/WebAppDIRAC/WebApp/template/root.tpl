<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
    <title>{{title}}</title>
    <link rel="SHORTCUT ICON" href='{{iconUrl}}'>

    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript" src="{{base_url}}/static/core/js/utils/canvg-1.3/rgbcolor.js"></script>
	  <script type="text/javascript" src="{{base_url}}/static/core/js/utils/canvg-1.3/StackBlur.js"></script>
	  <script type="text/javascript" src="{{base_url}}/static/core/js/utils/canvg-1.3/canvg.js"></script>
	  <script type="text/javascript" src="{{base_url}}/static/core/js/utils/FileSaver/FileSaver.js"></script>
	  {% if bugReportURL!='' %}
	  {% for item in bugReportURL.split(',') %}
         <script type="text/javascript" src="{{escape(item)}}"></script>
       {% end %}
	  {% end %}

    <link rel="stylesheet" type="text/css" href="{{base_url}}/static/extjs/classic/theme-{{theme}}/resources/theme-{{theme}}-all.css" />

    <link rel="stylesheet" type="text/css" href="{{base_url}}/static/core/css/css.css" />
    <link rel="stylesheet" type="text/css" href="{{base_url}}/static/core/css/iconset.css" />
    <link rel="stylesheet" type="text/css" href="{{base_url}}/static/core/css/tabtheme.css" />

    {% autoescape None %}
    <!-- GC -->

    <!-- <x-compile> -->
    <!-- <x-bootstrap> -->

    {% if _dev %}
       {% if debug_level=='debug' %}
          <script type="text/javascript" src="{{base_url}}/static/extjs/ext-all-debug.js"></script>
       {% else %}
          <script type="text/javascript" src="{{base_url}}/static/extjs/{{ext_version}}/ext-all.js"></script>
       {% end %}
       <script type="text/javascript" src="{{base_url}}/static/extjs/ux-debug.js"></script>
    {% else %}
      <script type="text/javascript" src="{{base_url}}/static/extjs/ext-all.js"></script>
      <script type="text/javascript" src="{{base_url}}/static/core/build/all-classes.js"></script>
    {% end %}

    <script type="text/javascript" src="{{base_url}}/static/extjs/packages/charts/classic/charts.js"></script>
    <link rel="stylesheet" type="text/css"  href="{{base_url}}/static/extjs/packages/charts/classic/classic/resources/charts-all.css">

    <!-- </x-bootstrap> -->
    <script type="text/javascript">
      if (typeof google !== 'undefined') { // google is blocked in some locations
        google.load("visualization", "1", {packages:["corechart","annotatedtimeline"]});
      }

      //Wrap console.log if it does not exist
      if (typeof console == "undefined") {
        window.console = {
          log: function () {}
        };
      }

      {% import json %}

      var GLOBAL = {};
      GLOBAL.APP = null;
      GLOBAL.BASE_URL = "{{base_url}}/";
      GLOBAL.ROOT_URL = "{{root_url}}/";
      GLOBAL.EXTJS_VERSION = "{{ext_version}}";
      GLOBAL.DEV = 0;
      GLOBAL.URL_STATE = "{{url_state}}";
      GLOBAL.MOUSE_X = 0;
      GLOBAL.MOUSE_Y = 0;
      GLOBAL.IS_IE = false;
      GLOBAL.USER_CREDENTIALS = {{ json.dumps( credentials ) }};
      GLOBAL.WEB_THEME = "{{theme}}";
      GLOBAL.STATE_MANAGEMENT_ENABLED = true;
      GLOBAL.VIEW_ID = "{{view}}";
      GLOBAL.VALID_VIEWS = ["tabs"];
      GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION = 1;
      GLOBAL.OPEN_APP = "{{open_app}}";
      GLOBAL.BACKGROUND = "{{backgroundImage}}";

      {% if _dev %}
        Ext.Loader.setConfig({ disableCaching: false });
        Ext.Loader.setPath({
        {% for extName in extensions %}
          {% if extName != 'WebAppDIRAC' %}
            {{ escape( extName ) }}: "{{ escape( '%s/static/%s' % ( base_url, extName ) ) }}",
          {% end %}
        {% end %}
            'Ext.dirac.core': '{{base_url}}/static/core/js/core',
            'Ext.dirac.views': '{{base_url}}/static/core/js/views',
            'Ext.dirac.utils': '{{base_url}}/static/core/js/utils',
            'Ext.ux.form':'{{base_url}}/static/extjs/{{ext_version}}/packages/ux/classic/src/form',
            'Ext.ux':'{{base_url}}/static/extjs/{{ext_version}}/packages/ux/classic/src'
        });
        Ext.require(['Ext.dirac.core.App','Ext.*']);
        GLOBAL.DEV = 1;

      {% end %}
      Ext.onReady(function () {
        Ext.Ajax.setTimeout(600000);
        Ext.override(Ext.data.Connection, { timeout:600000 });
        GLOBAL.APP = new Ext.dirac.core.App();
        Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        setTimeout(function(){
          Ext.get("app-dirac-loading").hide();
          Ext.get("app-dirac-loading-msg").setHtml("Loading module. Please wait ...");
        },1000);
        if (location.protocol === 'http:') {
          var https_url = location.href.replace('http:', 'https:');
          https_url = https_url.replace(":{{ http_port }}/", ":{{ https_port }}/");
          Ext.dirac.system_info.msg(
            "Notification",
            'Running without authentication, did you mean: '+
            '<a href="'+https_url+'">'+https_url+'</a>?',
            false
          );
        };
      });
    </script>
    <!-- </x-compile> -->
</head>

<body>
  <div id="app-dirac-loading">
      <div class="app-dirac-loading-indicator">
        <table>
          <tr>
            <td style="width:100px;">
              <img src="{{logo}}" style="margin-right:8px;float:left;vertical-align:top;width:100%;"/>
            </td>
            <td style="width:300px;vertical-align:middle;text-align:left;padding:5px 0px 5px 15px;font-size:14px">
              DIRAC
                <br />
                <span id="app-dirac-loading-msg">Loading data and resources...</span>
            </td>
          </tr>
        </table>
      </div>
  </div>

  {{welcome}}

</body>
</html>
