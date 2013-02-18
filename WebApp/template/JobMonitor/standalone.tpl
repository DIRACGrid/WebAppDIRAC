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
   
    <!-- </x-bootstrap> -->
    <script type="text/javascript">
		
        Ext.Loader.setPath({
            'DIRAC': '/DIRAC/static/DIRAC',
            'Ext.dirac.core': '/DIRAC/static/core/js/core',
            'Ext.dirac.utils': '/DIRAC/static/core/js/utils',
            'Ext.ux.form':'/DIRAC/static/extjs/ext-4.1.1a/examples/ux/form'
        });

        Ext.require('DIRAC.JobMonitor.classes.JobMonitor');
        
    </script>
    <!-- </x-compile> -->
</head>

<body>
	<div id="loading">
	    <div class="loading-indicator">
	    	<table>
	    		<tr>
	    			<td style="width:100px;">
	    				<img src="/DIRAC/static/core/images/logo_waiting.gif" style="margin-right:8px;float:left;vertical-align:top;width:100%;"/>
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
