<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
    <title>ExtTop - Desktop Sample App</title>

    <link rel="stylesheet" type="text/css" href="/DIRAC/static/extjs/{{ext_version}}/resources/css/ext-all.css" />
    <link rel="stylesheet" type="text/css" href="/DIRAC/static/core/css/css.css" />
	{% autoescape None %}
    <!-- GC -->

    <!-- <x-compile> -->
    <!-- <x-bootstrap> -->
 
    {% if _dev %}
    	<script type="text/javascript" src="/DIRAC/static/extjs/{{ext_version}}/ext-all.js"></script>
    {% else %}
    	<script type="text/javascript" src="/DIRAC/static/core/build/all-classes.js"></script>
    {% end %}
    <!-- </x-bootstrap> -->
    <script type="text/javascript">
		{% if _dev %}
	        Ext.Loader.setPath({
	        	'DIRAC': '/DIRAC/static/DIRAC',
	            'Ext.dirac.core': '/DIRAC/static/core/js/core',
	            'Ext.dirac.utils': '/DIRAC/static/core/js/utils',
	            'Ext.ux.form':'/DIRAC/static/extjs/{{ext_version}}/examples/ux/form'
	        });
	        
	
	        Ext.require(['Ext.dirac.core.App','Ext.*']);
			
			
	        var _app=null;
	        var _app_base_url = "";
	        var _dev = 1;
	        
	        Ext.onReady(function () {
	        	_app_base_url = "{{base_url}}/";
	            _app = new Ext.dirac.core.App();
	            setTimeout(function(){ 
	            	Ext.get("app-dirac-loading").hide();
	            	Ext.get("app-dirac-loading-msg").setHTML("Loading module. Please wait ..."); 
	            },1000);
	        });
	    {% else %}
	    	var _app=null;
	        var _app_base_url = "";
	        var _dev = 0;
	        
	        Ext.onReady(function () {
	        	_app_base_url = "{{base_url}}/";
	            _app = new Ext.dirac.core.App();
	            setTimeout(function(){ 
	            	Ext.get("app-dirac-loading").hide();
	            	Ext.get("app-dirac-loading-msg").setHTML("Loading module. Please wait ..."); 
	            },1000);
	        });
	    {% end %}
    </script>
    <!-- </x-compile> -->
</head>

<body>
	<div id="app-dirac-loading">
	    <div class="app-dirac-loading-indicator">
	    	<table>
	    		<tr>
	    			<td style="width:100px;">
	    				<img src="/DIRAC/static/core/img/icons/system/_logo_waiting.gif" style="margin-right:8px;float:left;vertical-align:top;width:100%;"/>
	    			</td>
	    			<td style="width:200px;vertical-align:middle;text-align:left;padding:5px 0px 5px 15px;font-size:14px">
	    				DIRAC
	        			<br />
	        			<span id="app-dirac-loading-msg">Loading data and resources...</span>
	    			</td>
	    		</tr>
	    	</table>
	        
	    </div>
	</div>

</body>
</html>
