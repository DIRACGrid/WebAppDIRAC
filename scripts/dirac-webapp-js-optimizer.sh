#!/bin/bash

BASE_PATH="/home/niksa/workspace/diracRoot/WebAppDIRAC/WebApp"
DEBUG=false

echo "START JAVASCRIPT OPTIMIZATION"

#optimizing JavaScript for the core
sencha -sdk $BASE_PATH/static/extjs/ext-4.1.1a/src compile -classpath=$BASE_PATH/static/extjs/ext-4.1.1a/examples/ux/form,$BASE_PATH/static/core/js/utils,$BASE_PATH/static/core/js/core -debug=$DEBUG page -yui  -in $BASE_PATH/template/build_core/root.tpl -out $BASE_PATH/static/core/build/index.html

#removing the generated files
rm -r $BASE_PATH/static/core/build/index.html

#--------------------------------------------------------------------------------------------------------------------------
#optimizing JavaScript for the JobMonitor app
sencha -sdk $BASE_PATH/static/extjs/ext-4.1.1a/src compile -classpath=$BASE_PATH/static/extjs/ext-4.1.1a/examples/ux/form,$BASE_PATH/static/core/js/utils,$BASE_PATH/static/core/js/core,$BASE_PATH/static/DIRAC/JobMonitor/classes -debug=$DEBUG page -yui  -in $BASE_PATH/template/JobMonitor/standalone.tpl -out $BASE_PATH/static/DIRAC/JobMonitor/build/index.html

#removing the first line of the generated javascript file
rm -r $BASE_PATH/static/DIRAC/JobMonitor/build/JobMonitor.js

sed 1d $BASE_PATH/static/DIRAC/JobMonitor/build/all-classes.js > $BASE_PATH/static/DIRAC/JobMonitor/build/JobMonitor.js

#removing the generated files
rm -r $BASE_PATH/static/DIRAC/JobMonitor/build/all-classes.js
rm -r $BASE_PATH/static/DIRAC/JobMonitor/build/index.html

echo "JAVASCRIPT OPTIMIZATION FINISHED"
