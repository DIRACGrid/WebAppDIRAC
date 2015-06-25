Ext.data.JsonP.Ext_dirac_views_desktop_Window({"tagname":"class","name":"Ext.dirac.views.desktop.Window","autodetected":{"aliases":true,"alternateClassNames":true,"mixins":true,"requires":true,"uses":true,"members":true,"code_type":true},"files":[{"filename":"Window.js","href":"Window.html#Ext-dirac-views-desktop-Window"}],"extends":"Ext.window.Window","aliases":{},"alternateClassNames":[],"mixins":["Ext.dirac.core.Container"],"requires":["Ext.LoadMask","Ext.dirac.utils.DiracToolButton","Ext.form.*","Ext.menu.Item","Ext.menu.Menu"],"uses":[],"members":[{"name":"Configuration","tagname":"cfg","owner":"Ext.dirac.views.desktop.Window","id":"cfg-Configuration","meta":{}},{"name":"currentState","tagname":"property","owner":"Ext.dirac.views.desktop.Window","id":"property-currentState","meta":{}},{"name":"desktop","tagname":"property","owner":"Ext.dirac.views.desktop.Window","id":"property-desktop","meta":{}},{"name":"loadMask","tagname":"property","owner":"Ext.dirac.views.desktop.Window","id":"property-loadMask","meta":{}},{"name":"loadedObject","tagname":"property","owner":"Ext.dirac.views.desktop.Window","id":"property-loadedObject","meta":{}},{"name":"addNewState","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-addNewState","meta":{}},{"name":"addTools","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-addTools","meta":{}},{"name":"afterShow","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-afterShow","meta":{"private":true}},{"name":"closeAllChildWindows","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-closeAllChildWindows","meta":{}},{"name":"createChildWindow","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-createChildWindow","meta":{}},{"name":"getAppClassName","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-getAppClassName","meta":{}},{"name":"getCurrentState","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-getCurrentState","meta":{}},{"name":"getUrlDescription","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-getUrlDescription","meta":{}},{"name":"initComponent","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-initComponent","meta":{"private":true}},{"name":"loadWindowFrameState","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-loadWindowFrameState","meta":{}},{"name":"openHelpWindow","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-openHelpWindow","meta":{"private":true}},{"name":"oprLoadAppStateFromCache","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-oprLoadAppStateFromCache","meta":{}},{"name":"oprRefreshAllAppStates","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-oprRefreshAllAppStates","meta":{}},{"name":"oprRefreshAppStates","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-oprRefreshAppStates","meta":{}},{"name":"removeChildWindowFromList","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-removeChildWindowFromList","meta":{}},{"name":"removeState","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-removeState","meta":{}},{"name":"setLoadedObject","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-setLoadedObject","meta":{}},{"name":"setPropertiesWhenLink","tagname":"method","owner":"Ext.dirac.views.desktop.Window","id":"method-setPropertiesWhenLink","meta":{}}],"code_type":"ext_define","id":"class-Ext.dirac.views.desktop.Window","component":false,"superclasses":["Ext.window.Window"],"subclasses":[],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'>Ext.window.Window<div class='subclass '><strong>Ext.dirac.views.desktop.Window</strong></div></div><h4>Mixins</h4><div class='dependency'>Ext.dirac.core.Container</div><h4>Requires</h4><div class='dependency'>Ext.LoadMask</div><div class='dependency'>Ext.dirac.utils.DiracToolButton</div><div class='dependency'>Ext.form.*</div><div class='dependency'>Ext.menu.Item</div><div class='dependency'>Ext.menu.Menu</div><h4>Files</h4><div class='dependency'><a href='source/Window.html#Ext-dirac-views-desktop-Window' target='_blank'>Window.js</a></div></pre><div class='doc-contents'><p>This is a window widget with extended\n       functionality such as state management</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-Configuration' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-cfg-Configuration' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-cfg-Configuration' class='name expandable'>Configuration</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'><p>property that sets the resizable borders of\n     a window</p>\n</div><div class='long'><p>property that sets the resizable borders of\n     a window</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-currentState' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-property-currentState' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-property-currentState' class='name expandable'>currentState</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>The name of the current active desktop\n          state ...</div><div class='long'><p>The name of the current active desktop\n          state</p>\n<p>Defaults to: <code>&quot;&quot;</code></p></div></div></div><div id='property-desktop' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-property-desktop' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-property-desktop' class='name expandable'>desktop</a> : <a href=\"#!/api/Ext.dirac.views.desktop.Main\" rel=\"Ext.dirac.views.desktop.Main\" class=\"docClass\">Ext.dirac.views.desktop.Main</a><span class=\"signature\"></span></div><div class='description'><div class='short'><p>Reference to the\n          desktop object</p>\n</div><div class='long'><p>Reference to the\n          desktop object</p>\n</div></div></div><div id='property-loadMask' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-property-loadMask' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-property-loadMask' class='name expandable'>loadMask</a> : Ext.LoadMask<span class=\"signature\"></span></div><div class='description'><div class='short'><p>The load mask used when a state is\n          being loaded</p>\n</div><div class='long'><p>The load mask used when a state is\n          being loaded</p>\n</div></div></div><div id='property-loadedObject' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-property-loadedObject' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-property-loadedObject' class='name expandable'>loadedObject</a> : Object<span class=\"signature\"></span></div><div class='description'><div class='short'><p>The object of the module loaded within\n          the window</p>\n</div><div class='long'><p>The object of the module loaded within\n          the window</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-addNewState' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-addNewState' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-addNewState' class='name expandable'>addNewState</a>( <span class='pre'>, </span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function for adding new state within the list of existing states ...</div><div class='long'><p>Function for adding new state within the list of existing states</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'></span> : String<div class='sub-desc'><p>stateType The type of the state [application|reference]</p>\n</div></li><li><span class='pre'></span> : String<div class='sub-desc'><p>stateName The name of the state</p>\n</div></li></ul></div></div></div><div id='method-addTools' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-addTools' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-addTools' class='name expandable'>addTools</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Overriden function, inherited from Ext.window.Window used to set up the\nbuttons at the top right corner of the window ...</div><div class='long'><p>Overriden function, inherited from Ext.window.Window used to set up the\nbuttons at the top right corner of the window</p>\n</div></div></div><div id='method-afterShow' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-afterShow' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-afterShow' class='name expandable'>afterShow</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-closeAllChildWindows' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-closeAllChildWindows' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-closeAllChildWindows' class='name expandable'>closeAllChildWindows</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to close all child windows ...</div><div class='long'><p>Function to close all child windows</p>\n</div></div></div><div id='method-createChildWindow' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-createChildWindow' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-createChildWindow' class='name expandable'>createChildWindow</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to load module state with data from the cache ...</div><div class='long'><p>Function to load module state with data from the cache</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'></span> : String<div class='sub-desc'><p>stateName The name of the state</p>\n</div></li></ul></div></div></div><div id='method-getAppClassName' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-getAppClassName' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-getAppClassName' class='name expandable'>getAppClassName</a>( <span class='pre'></span> ) : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Getter function for the class of the loaded object ...</div><div class='long'><p>Getter function for the class of the loaded object</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'><p>The name of the class</p>\n</div></li></ul></div></div></div><div id='method-getCurrentState' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-getCurrentState' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-getCurrentState' class='name expandable'>getCurrentState</a>( <span class='pre'></span> ) : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Getter function for the current state of the loaded object ...</div><div class='long'><p>Getter function for the current state of the loaded object</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'><p>The name of the class</p>\n</div></li></ul></div></div></div><div id='method-getUrlDescription' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-getUrlDescription' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-getUrlDescription' class='name expandable'>getUrlDescription</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to get the data describing the state of the window at the\ndesktop area ...</div><div class='long'><p>Function to get the data describing the state of the window at the\ndesktop area</p>\n</div></div></div><div id='method-initComponent' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-initComponent' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-initComponent' class='name expandable'>initComponent</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-loadWindowFrameState' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-loadWindowFrameState' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-loadWindowFrameState' class='name expandable'>loadWindowFrameState</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function invoked when the window gets restored to the previous state at\nthe desktop. ...</div><div class='long'><p>Function invoked when the window gets restored to the previous state at\nthe desktop. The function is used in the Desktop object.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'></span> : Object<div class='sub-desc'><p>oData Data to be applied</p>\n</div></li></ul></div></div></div><div id='method-openHelpWindow' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-openHelpWindow' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-openHelpWindow' class='name expandable'>openHelpWindow</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-oprLoadAppStateFromCache' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-oprLoadAppStateFromCache' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-oprLoadAppStateFromCache' class='name expandable'>oprLoadAppStateFromCache</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to load module state with data from the cache ...</div><div class='long'><p>Function to load module state with data from the cache</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'></span> : String<div class='sub-desc'><p>stateName The name of the state</p>\n</div></li></ul></div></div></div><div id='method-oprRefreshAllAppStates' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-oprRefreshAllAppStates' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-oprRefreshAllAppStates' class='name expandable'>oprRefreshAllAppStates</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function that is called when the refresh button of the SAVE window menu\nis clicked ...</div><div class='long'><p>Function that is called when the refresh button of the SAVE window menu\nis clicked</p>\n</div></div></div><div id='method-oprRefreshAppStates' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-oprRefreshAppStates' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-oprRefreshAppStates' class='name expandable'>oprRefreshAppStates</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to refresh the states of a module. ...</div><div class='long'><p>Function to refresh the states of a module. The states are read from\nthe cash.</p>\n</div></div></div><div id='method-removeChildWindowFromList' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-removeChildWindowFromList' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-removeChildWindowFromList' class='name expandable'>removeChildWindowFromList</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to remove a child window from the list of child windows ...</div><div class='long'><p>Function to remove a child window from the list of child windows</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'></span> : <a href=\"#!/api/Ext.dirac.views.desktop.Window\" rel=\"Ext.dirac.views.desktop.Window\" class=\"docClass\">Ext.dirac.views.desktop.Window</a><div class='sub-desc'><p>oChildWindow Rference to the child window</p>\n</div></li></ul></div></div></div><div id='method-removeState' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-removeState' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-removeState' class='name expandable'>removeState</a>( <span class='pre'>, </span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function for removing a state from the list of existing states ...</div><div class='long'><p>Function for removing a state from the list of existing states</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'></span> : String<div class='sub-desc'><p>stateType The type of the state [application|reference]</p>\n</div></li><li><span class='pre'></span> : String<div class='sub-desc'><p>stateName The name of the state</p>\n</div></li></ul></div></div></div><div id='method-setLoadedObject' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-setLoadedObject' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-setLoadedObject' class='name expandable'>setLoadedObject</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to set a state of the loaded object and a state of the window\nitself ...</div><div class='long'><p>Function to set a state of the loaded object and a state of the window\nitself</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'></span> : Object<div class='sub-desc'><p>setupData Setup data</p>\n</div></li></ul></div></div></div><div id='method-setPropertiesWhenLink' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.desktop.Window'>Ext.dirac.views.desktop.Window</span><br/><a href='source/Window.html#Ext-dirac-views-desktop-Window-method-setPropertiesWhenLink' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.desktop.Window-method-setPropertiesWhenLink' class='name expandable'>setPropertiesWhenLink</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to set a state of the window where a link has been loaded ...</div><div class='long'><p>Function to set a state of the window where a link has been loaded</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'></span> : Object<div class='sub-desc'><p>setupData Setup data</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{}});