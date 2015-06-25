Ext.data.JsonP.DIRAC_ProxyManager_classes_ProxyManager({"tagname":"class","name":"DIRAC.ProxyManager.classes.ProxyManager","autodetected":{"aliases":true,"alternateClassNames":true,"extends":true,"mixins":true,"requires":true,"uses":true,"members":true,"code_type":true},"files":[{"filename":"ProxyManager.js","href":"ProxyManager.html#DIRAC-ProxyManager-classes-ProxyManager"}],"aliases":{},"alternateClassNames":[],"extends":"Ext.dirac.core.Module","mixins":[],"requires":["Ext.dirac.utils.DiracAjaxProxy","Ext.dirac.utils.DiracApplicationContextMenu","Ext.dirac.utils.DiracBaseSelector","Ext.dirac.utils.DiracBoxSelect","Ext.dirac.utils.DiracGridPanel","Ext.dirac.utils.DiracIdListButton","Ext.dirac.utils.DiracJsonStore","Ext.dirac.utils.DiracPageSizeCombo","Ext.dirac.utils.DiracPagingToolbar","Ext.dirac.utils.DiracToolButton","Ext.form.field.TextArea","Ext.panel.Panel","Ext.panel.Panel"],"uses":[],"members":[{"name":"dataFields","tagname":"property","owner":"DIRAC.ProxyManager.classes.ProxyManager","id":"property-dataFields","meta":{"private":true}},{"name":"constructor","tagname":"method","owner":"Ext.dirac.core.Module","id":"method-constructor","meta":{}},{"name":"__deleteProxyes","tagname":"method","owner":"DIRAC.ProxyManager.classes.ProxyManager","id":"method-__deleteProxyes","meta":{"private":true}},{"name":"buildUI","tagname":"method","owner":"DIRAC.ProxyManager.classes.ProxyManager","id":"method-buildUI","meta":{"private":true}},{"name":"getContainer","tagname":"method","owner":"Ext.dirac.core.Module","id":"method-getContainer","meta":{"private":true}},{"name":"getHelpText","tagname":"method","owner":"Ext.dirac.core.Module","id":"method-getHelpText","meta":{"private":true}},{"name":"getStateData","tagname":"method","owner":"DIRAC.ProxyManager.classes.ProxyManager","id":"method-getStateData","meta":{"private":true}},{"name":"initComponent","tagname":"method","owner":"DIRAC.ProxyManager.classes.ProxyManager","id":"method-initComponent","meta":{"private":true}},{"name":"loadCSS","tagname":"method","owner":"Ext.dirac.core.Module","id":"method-loadCSS","meta":{"private":true}},{"name":"loadState","tagname":"method","owner":"DIRAC.ProxyManager.classes.ProxyManager","id":"method-loadState","meta":{"private":true}},{"name":"setContainer","tagname":"method","owner":"Ext.dirac.core.Module","id":"method-setContainer","meta":{"private":true}},{"name":"setHelpText","tagname":"method","owner":"Ext.dirac.core.Module","id":"method-setHelpText","meta":{"private":true}}],"code_type":"ext_define","id":"class-DIRAC.ProxyManager.classes.ProxyManager","component":false,"superclasses":["Ext.container.Container","Ext.dirac.core.Module"],"subclasses":[],"mixedInto":[],"parentMixins":["Ext.container.Container"],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'>Ext.container.Container<div class='subclass '><a href='#!/api/Ext.dirac.core.Module' rel='Ext.dirac.core.Module' class='docClass'>Ext.dirac.core.Module</a><div class='subclass '><strong>DIRAC.ProxyManager.classes.ProxyManager</strong></div></div></div><h4>Inherited mixins</h4><div class='dependency'>Ext.container.Container</div><h4>Requires</h4><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracAjaxProxy' rel='Ext.dirac.utils.DiracAjaxProxy' class='docClass'>Ext.dirac.utils.DiracAjaxProxy</a></div><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracApplicationContextMenu' rel='Ext.dirac.utils.DiracApplicationContextMenu' class='docClass'>Ext.dirac.utils.DiracApplicationContextMenu</a></div><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracBaseSelector' rel='Ext.dirac.utils.DiracBaseSelector' class='docClass'>Ext.dirac.utils.DiracBaseSelector</a></div><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracBoxSelect' rel='Ext.dirac.utils.DiracBoxSelect' class='docClass'>Ext.dirac.utils.DiracBoxSelect</a></div><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracGridPanel' rel='Ext.dirac.utils.DiracGridPanel' class='docClass'>Ext.dirac.utils.DiracGridPanel</a></div><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracIdListButton' rel='Ext.dirac.utils.DiracIdListButton' class='docClass'>Ext.dirac.utils.DiracIdListButton</a></div><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracJsonStore' rel='Ext.dirac.utils.DiracJsonStore' class='docClass'>Ext.dirac.utils.DiracJsonStore</a></div><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracPageSizeCombo' rel='Ext.dirac.utils.DiracPageSizeCombo' class='docClass'>Ext.dirac.utils.DiracPageSizeCombo</a></div><div class='dependency'><a href='#!/api/Ext.dirac.utils.DiracPagingToolbar' rel='Ext.dirac.utils.DiracPagingToolbar' class='docClass'>Ext.dirac.utils.DiracPagingToolbar</a></div><div class='dependency'>Ext.dirac.utils.DiracToolButton</div><div class='dependency'>Ext.form.field.TextArea</div><div class='dependency'>Ext.panel.Panel</div><div class='dependency'>Ext.panel.Panel</div><h4>Files</h4><div class='dependency'><a href='source/ProxyManager.html#DIRAC-ProxyManager-classes-ProxyManager' target='_blank'>ProxyManager.js</a></div></pre><div class='doc-contents'><hr />\n\n<p>It is the transformation monitor class.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-dataFields' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='DIRAC.ProxyManager.classes.ProxyManager'>DIRAC.ProxyManager.classes.ProxyManager</span><br/><a href='source/ProxyManager.html#DIRAC-ProxyManager-classes-ProxyManager-property-dataFields' target='_blank' class='view-source'>view source</a></div><a href='#!/api/DIRAC.ProxyManager.classes.ProxyManager-property-dataFields' class='name expandable'>dataFields</a> : Array<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<p>Defaults to: <code>[{name: &#39;proxyid&#39;}, {name: &#39;UserName&#39;}, {name: &#39;UserDN&#39;}, {name: &#39;UserGroup&#39;}, {name: &#39;ExpirationTime&#39;, type: &#39;date&#39;, dateFormat: &#39;Y-m-d H:i:s&#39;}, {name: &#39;PersistentFlag&#39;}]</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Ext.dirac.core.Module' rel='Ext.dirac.core.Module' class='defined-in docClass'>Ext.dirac.core.Module</a><br/><a href='source/Module.html#Ext-dirac-core-Module-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/Ext.dirac.core.Module-method-constructor' class='name expandable'>DIRAC.ProxyManager.classes.ProxyManager</a>( <span class='pre'>config</span> ) : <a href=\"#!/api/Ext.dirac.core.Module\" rel=\"Ext.dirac.core.Module\" class=\"docClass\">Ext.dirac.core.Module</a><span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>config</span> : Object<div class='sub-desc'></div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Ext.dirac.core.Module\" rel=\"Ext.dirac.core.Module\" class=\"docClass\">Ext.dirac.core.Module</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-__deleteProxyes' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='DIRAC.ProxyManager.classes.ProxyManager'>DIRAC.ProxyManager.classes.ProxyManager</span><br/><a href='source/ProxyManager.html#DIRAC-ProxyManager-classes-ProxyManager-method-__deleteProxyes' target='_blank' class='view-source'>view source</a></div><a href='#!/api/DIRAC.ProxyManager.classes.ProxyManager-method-__deleteProxyes' class='name expandable'>__deleteProxyes</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-buildUI' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='DIRAC.ProxyManager.classes.ProxyManager'>DIRAC.ProxyManager.classes.ProxyManager</span><br/><a href='source/ProxyManager.html#DIRAC-ProxyManager-classes-ProxyManager-method-buildUI' target='_blank' class='view-source'>view source</a></div><a href='#!/api/DIRAC.ProxyManager.classes.ProxyManager-method-buildUI' class='name expandable'>buildUI</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<p>Overrides: <a href=\"#!/api/Ext.dirac.core.Module-method-buildUI\" rel=\"Ext.dirac.core.Module-method-buildUI\" class=\"docClass\">Ext.dirac.core.Module.buildUI</a></p></div></div></div><div id='method-getContainer' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Ext.dirac.core.Module' rel='Ext.dirac.core.Module' class='defined-in docClass'>Ext.dirac.core.Module</a><br/><a href='source/Module.html#Ext-dirac-core-Module-method-getContainer' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.core.Module-method-getContainer' class='name expandable'>getContainer</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-getHelpText' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Ext.dirac.core.Module' rel='Ext.dirac.core.Module' class='defined-in docClass'>Ext.dirac.core.Module</a><br/><a href='source/Module.html#Ext-dirac-core-Module-method-getHelpText' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.core.Module-method-getHelpText' class='name expandable'>getHelpText</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-getStateData' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='DIRAC.ProxyManager.classes.ProxyManager'>DIRAC.ProxyManager.classes.ProxyManager</span><br/><a href='source/ProxyManager.html#DIRAC-ProxyManager-classes-ProxyManager-method-getStateData' target='_blank' class='view-source'>view source</a></div><a href='#!/api/DIRAC.ProxyManager.classes.ProxyManager-method-getStateData' class='name expandable'>getStateData</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-initComponent' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='DIRAC.ProxyManager.classes.ProxyManager'>DIRAC.ProxyManager.classes.ProxyManager</span><br/><a href='source/ProxyManager.html#DIRAC-ProxyManager-classes-ProxyManager-method-initComponent' target='_blank' class='view-source'>view source</a></div><a href='#!/api/DIRAC.ProxyManager.classes.ProxyManager-method-initComponent' class='name expandable'>initComponent</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-loadCSS' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Ext.dirac.core.Module' rel='Ext.dirac.core.Module' class='defined-in docClass'>Ext.dirac.core.Module</a><br/><a href='source/Module.html#Ext-dirac-core-Module-method-loadCSS' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.core.Module-method-loadCSS' class='name expandable'>loadCSS</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-loadState' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='DIRAC.ProxyManager.classes.ProxyManager'>DIRAC.ProxyManager.classes.ProxyManager</span><br/><a href='source/ProxyManager.html#DIRAC-ProxyManager-classes-ProxyManager-method-loadState' target='_blank' class='view-source'>view source</a></div><a href='#!/api/DIRAC.ProxyManager.classes.ProxyManager-method-loadState' class='name expandable'>loadState</a>( <span class='pre'>data</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>data</span> : Object<div class='sub-desc'></div></li></ul></div></div></div><div id='method-setContainer' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Ext.dirac.core.Module' rel='Ext.dirac.core.Module' class='defined-in docClass'>Ext.dirac.core.Module</a><br/><a href='source/Module.html#Ext-dirac-core-Module-method-setContainer' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.core.Module-method-setContainer' class='name expandable'>setContainer</a>( <span class='pre'>oContainer</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>oContainer</span> : Object<div class='sub-desc'></div></li></ul></div></div></div><div id='method-setHelpText' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Ext.dirac.core.Module' rel='Ext.dirac.core.Module' class='defined-in docClass'>Ext.dirac.core.Module</a><br/><a href='source/Module.html#Ext-dirac-core-Module-method-setHelpText' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.core.Module-method-setHelpText' class='name expandable'>setHelpText</a>( <span class='pre'>data</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>data</span> : Object<div class='sub-desc'></div></li></ul></div></div></div></div></div></div></div>","meta":{}});