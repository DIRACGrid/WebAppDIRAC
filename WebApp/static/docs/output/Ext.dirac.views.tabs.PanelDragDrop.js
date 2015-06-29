Ext.data.JsonP.Ext_dirac_views_tabs_PanelDragDrop({"tagname":"class","name":"Ext.dirac.views.tabs.PanelDragDrop","autodetected":{"aliases":true,"alternateClassNames":true,"extends":true,"mixins":true,"requires":true,"uses":true,"members":true,"code_type":true},"files":[{"filename":"PanelDragDrop.js","href":"PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop"}],"aliases":{"plugin":["paneldragdrop"]},"alternateClassNames":[],"extends":"Ext.AbstractPlugin","mixins":[],"requires":[],"uses":["Ext.dd.DragZone","Ext.dd.DropZone"],"members":[{"name":"applyEmptyText","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-applyEmptyText","meta":{}},{"name":"containerScroll","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-containerScroll","meta":{}},{"name":"ddGroup","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-ddGroup","meta":{}},{"name":"dragText","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-dragText","meta":{}},{"name":"dropBackgroundColor","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-dropBackgroundColor","meta":{}},{"name":"emptyText","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-emptyText","meta":{}},{"name":"enableDrag","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-enableDrag","meta":{}},{"name":"enableDrop","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-enableDrop","meta":{}},{"name":"enforceType","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-enforceType","meta":{}},{"name":"noDropBackgroundColor","tagname":"cfg","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"cfg-noDropBackgroundColor","meta":{}},{"name":"destroy","tagname":"method","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"method-destroy","meta":{"private":true}},{"name":"disable","tagname":"method","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"method-disable","meta":{"private":true}},{"name":"enable","tagname":"method","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"method-enable","meta":{"private":true}},{"name":"init","tagname":"method","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"method-init","meta":{"private":true}},{"name":"onViewRender","tagname":"method","owner":"Ext.dirac.views.tabs.PanelDragDrop","id":"method-onViewRender","meta":{"private":true}}],"code_type":"ext_define","id":"class-Ext.dirac.views.tabs.PanelDragDrop","short_doc":"This plugin can enable a cell to cell drag and drop operation within the same grid view. ...","component":false,"superclasses":["Ext.AbstractPlugin"],"subclasses":[],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'>Ext.AbstractPlugin<div class='subclass '><strong>Ext.dirac.views.tabs.PanelDragDrop</strong></div></div><h4>Uses</h4><div class='dependency'>Ext.dd.DragZone</div><div class='dependency'>Ext.dd.DropZone</div><h4>Files</h4><div class='dependency'><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop' target='_blank'>PanelDragDrop.js</a></div></pre><div class='doc-contents'><p>This plugin can enable a cell to cell drag and drop operation within the same grid view.</p>\n\n<p>Note that the plugin must be added to the grid view, not to the grid panel. For example, using viewConfig:</p>\n\n<pre><code> viewConfig: {\n     plugins: {\n         ptype: 'celldragdrop',\n\n         // Remove text from source cell and replace with value of emptyText.\n         applyEmptyText: true,\n\n         //emptyText: Ext.String.htmlEncode('&lt;&lt;foo&gt;&gt;'),\n\n         // Will only allow drops of the same type.\n         enforceType: true\n     }\n }\n</code></pre>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-applyEmptyText' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-applyEmptyText' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-applyEmptyText' class='name expandable'>applyEmptyText</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>If true, then use the value of emptyText to replace the drag record's value after a node drop. ...</div><div class='long'><p>If <code>true</code>, then use the value of <a href=\"#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-emptyText\" rel=\"Ext.dirac.views.tabs.PanelDragDrop-cfg-emptyText\" class=\"docClass\">emptyText</a> to replace the drag record's value after a node drop.\nNote that, if dropped on a cell of a different type, it will convert the default text according to its own conversion rules.</p>\n\n<p>Defaults to <code>false</code>.</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='cfg-containerScroll' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-containerScroll' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-containerScroll' class='name expandable'>containerScroll</a> : Object/Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>True to register this container with the Scrollmanager for auto scrolling during drag operations. ...</div><div class='long'><p>True to register this container with the Scrollmanager for auto scrolling during drag operations.\nA Ext.dd.ScrollManager configuration may also be passed.</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='cfg-ddGroup' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-ddGroup' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-ddGroup' class='name expandable'>ddGroup</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>A named drag drop group to which this object belongs. ...</div><div class='long'><p>A named drag drop group to which this object belongs. If a group is specified, then both the DragZones and\nDropZone used by this plugin will only interact with other drag drop objects in the same group.</p>\n<p>Defaults to: <code>&quot;GridDD&quot;</code></p></div></div></div><div id='cfg-dragText' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-dragText' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-dragText' class='name expandable'>dragText</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>The text to show while dragging. ...</div><div class='long'><p>The text to show while dragging.</p>\n\n<p>Two placeholders can be used in the text:</p>\n\n<ul>\n<li><code>{0}</code> The number of selected items.</li>\n<li><code>{1}</code> 's' when more than 1 items (only useful for English).</li>\n</ul>\n\n</div></div></div><div id='cfg-dropBackgroundColor' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-dropBackgroundColor' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-dropBackgroundColor' class='name expandable'>dropBackgroundColor</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>The default background color for when a drop is allowed. ...</div><div class='long'><p>The default background color for when a drop is allowed.</p>\n\n<p>Defaults to green.</p>\n<p>Defaults to: <code>&#39;green&#39;</code></p></div></div></div><div id='cfg-emptyText' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-emptyText' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-emptyText' class='name expandable'>emptyText</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>If applyEmptyText is true, then this value as the drag record's value after a node drop. ...</div><div class='long'><p>If <a href=\"#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-applyEmptyText\" rel=\"Ext.dirac.views.tabs.PanelDragDrop-cfg-applyEmptyText\" class=\"docClass\">applyEmptyText</a> is <code>true</code>, then this value as the drag record's value after a node drop.</p>\n\n<p>Defaults to an empty string.</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></div></div><div id='cfg-enableDrag' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-enableDrag' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-enableDrag' class='name expandable'>enableDrag</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Set to false to disallow dragging items from the View. ...</div><div class='long'><p>Set to <code>false</code> to disallow dragging items from the View.</p>\n<p>Defaults to: <code>true</code></p></div></div></div><div id='cfg-enableDrop' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-enableDrop' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-enableDrop' class='name expandable'>enableDrop</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Set to false to disallow the View from accepting drop gestures. ...</div><div class='long'><p>Set to <code>false</code> to disallow the View from accepting drop gestures.</p>\n<p>Defaults to: <code>true</code></p></div></div></div><div id='cfg-enforceType' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-enforceType' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-enforceType' class='name expandable'>enforceType</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Set to true to only allow drops of the same type. ...</div><div class='long'><p>Set to <code>true</code> to only allow drops of the same type.</p>\n\n<p>Defaults to <code>false</code>.</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='cfg-noDropBackgroundColor' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-cfg-noDropBackgroundColor' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-cfg-noDropBackgroundColor' class='name expandable'>noDropBackgroundColor</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>The default background color for when a drop is not allowed. ...</div><div class='long'><p>The default background color for when a drop is not allowed.</p>\n\n<p>Defaults to red.</p>\n<p>Defaults to: <code>&#39;red&#39;</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-destroy' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-method-destroy' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-method-destroy' class='name expandable'>destroy</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-disable' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-method-disable' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-method-disable' class='name expandable'>disable</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-enable' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-method-enable' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-method-enable' class='name expandable'>enable</a>( <span class='pre'></span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-init' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-method-init' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-method-init' class='name expandable'>init</a>( <span class='pre'>view</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>view</span> : Object<div class='sub-desc'></div></li></ul></div></div></div><div id='method-onViewRender' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.views.tabs.PanelDragDrop'>Ext.dirac.views.tabs.PanelDragDrop</span><br/><a href='source/PanelDragDrop.html#Ext-dirac-views-tabs-PanelDragDrop-method-onViewRender' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.views.tabs.PanelDragDrop-method-onViewRender' class='name expandable'>onViewRender</a>( <span class='pre'>view</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>view</span> : Object<div class='sub-desc'></div></li></ul></div></div></div></div></div></div></div>","meta":{}});