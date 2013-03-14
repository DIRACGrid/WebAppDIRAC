<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
    <title>ExtTop - Desktop Sample App</title>

    <link rel="stylesheet" type="text/css" href="/DIRAC/static/extjs/ext-4.1.1a/resources/css/ext-all.css" />
    <link rel="stylesheet" type="text/css" href="/DIRAC/static/core/css/css.css" />
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
</body>
</html>
