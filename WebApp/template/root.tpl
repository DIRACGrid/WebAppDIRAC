<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
    <title>ExtTop - Desktop Sample App</title>

    <link rel="stylesheet" type="text/css" href="/DIRAC/static/extjs/ext-4.1.1a/resources/css/ext-all.css" />
    <link rel="stylesheet" type="text/css" href="/DIRAC/static/core/css/desktop.css" />
	{% autoescape None %}
    <!-- GC -->

    <!-- <x-compile> -->
    <!-- <x-bootstrap> -->
    <script type="text/javascript" src="/DIRAC/static/extjs/ext-4.1.1a/ext.js"></script>
    <script type="text/javascript" src="/DIRAC/static/core/js/HelpFunctions.js"></script>
    <!-- </x-bootstrap> -->
    <script type="text/javascript">
		
        Ext.Loader.setPath({
            'Ext.ux.desktop': '/DIRAC/static/core/js',
            'DIRAC': '/DIRAC/static/DIRAC'
        });

        Ext.require('Ext.ux.desktop.App');

        var myDesktopApp;
        Ext.onReady(function () {
            myDesktopApp = new Ext.ux.desktop.App({{ config_data }});
            setTimeout(function(){ Ext.get("loading").hide(); },1000);
            
        });
    </script>
    <!-- </x-compile> -->
    <style type="text/css">
	    #loading{
	        height:auto;
	        position:absolute;
	        left:45%;
	        top:40%;
	        padding:2px;
	        z-index:20001;
	    }
	    #loading a {
	        color:#225588;
	    }
	    #loading .loading-indicator{
	        background:none;
	        color:#444;
	        font:bold 13px Helvetica, Arial, sans-serif;
	        height:auto;
	        margin:0;
	        padding:10px;
	        width:300px;
	        
	    }
	    #loading-msg {
	        font-size: 12px;
	        font-weight: normal;
	    }
    </style>
</head>

<body>
	<div id="loading">
	    <div class="loading-indicator">
	    	<table>
	    		<tr>
	    			<td style="width:100px;">
	    				<img src="/DIRAC/static/core/images/logo_waiting.gif" style="margin-right:8px;float:left;vertical-align:top;width:100%;height:100%"/>
	    			</td>
	    			<td style="width:200px;vertical-align:middle;text-align:left;padding:5px 0px 5px 15px;font-size:14px">
	    				DIRAC
	        			<br />
	        			<span id="loading-msg">Loading data and resources...</span>
	    			</td>
	    		</tr>
	    	</table>
	        
	    </div>
	</div>

</body>
</html>
