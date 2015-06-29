Ext.data.JsonP.Ext_dirac_utils_DiracArrayStore({"tagname":"class","name":"Ext.dirac.utils.DiracArrayStore","autodetected":{"aliases":true,"alternateClassNames":true,"extends":true,"mixins":true,"requires":true,"uses":true,"members":true,"code_type":true},"files":[{"filename":"DiracArrayStore.js","href":"DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore"}],"aliases":{},"alternateClassNames":[],"extends":"Ext.data.ArrayStore","mixins":[],"requires":[],"uses":[],"members":[{"name":"diffValues","tagname":"cfg","owner":"Ext.dirac.utils.DiracArrayStore","id":"cfg-diffValues","meta":{}},{"name":"doAddDiff","tagname":"property","owner":"Ext.dirac.utils.DiracArrayStore","id":"property-doAddDiff","meta":{}},{"name":"lastDataRequest","tagname":"property","owner":"Ext.dirac.utils.DiracArrayStore","id":"property-lastDataRequest","meta":{}},{"name":"listeners","tagname":"property","owner":"Ext.dirac.utils.DiracArrayStore","id":"property-listeners","meta":{"private":true}},{"name":"oDiffFields","tagname":"property","owner":"Ext.dirac.utils.DiracArrayStore","id":"property-oDiffFields","meta":{"private":true}},{"name":"getDiffId","tagname":"method","owner":"Ext.dirac.utils.DiracArrayStore","id":"method-getDiffId","meta":{}},{"name":"getDiffValues","tagname":"method","owner":"Ext.dirac.utils.DiracArrayStore","id":"method-getDiffValues","meta":{}}],"code_type":"ext_define","id":"class-Ext.dirac.utils.DiracArrayStore","short_doc":"It creates an Dirac specific ArrayStore. ...","component":false,"superclasses":["Ext.data.ArrayStore"],"subclasses":[],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'>Ext.data.ArrayStore<div class='subclass '><strong>Ext.dirac.utils.DiracArrayStore</strong></div></div><h4>Files</h4><div class='dependency'><a href='source/DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore' target='_blank'>DiracArrayStore.js</a></div></pre><div class='doc-contents'><hr />\n\n<p>It creates an Dirac specific ArrayStore. It can be used to see the different\nin a grid panel.</p>\n\n<pre>var dataStore = Ext.create(&quot;<a href=\"#!/api/Ext.dirac.utils.DiracArrayStore\" rel=\"Ext.dirac.utils.DiracArrayStore\" class=\"docClass\">Ext.dirac.utils.DiracArrayStore</a>&quot;, {\n      fields : [&quot;key&quot;, &quot;value&quot;, &quot;code&quot;, &quot;color&quot;],\n      oDiffFields : {\n        'Id' : 'key',\n        'Fields' : [&quot;value&quot;]\n      },\n      scope : me\n    });\n</pre>\n\n\n<p>The dataStore is used by <a href=\"#!/api/Ext.dirac.utils.DiracGridPanel\" rel=\"Ext.dirac.utils.DiracGridPanel\" class=\"docClass\">Ext.dirac.utils.DiracGridPanel</a> oDiffFields\nhas two keys. The Id is the row identifier while the Fields a list which\ncontains a list of columns... -scope: it is a pointer to the application.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-diffValues' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.utils.DiracArrayStore'>Ext.dirac.utils.DiracArrayStore</span><br/><a href='source/DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore-cfg-diffValues' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.utils.DiracArrayStore-cfg-diffValues' class='name expandable'>diffValues</a> : Object<span class=\"signature\"></span></div><div class='description'><div class='short'>it stores the values which are given by\n             oDiffFields before refresh. ...</div><div class='long'><p>it stores the values which are given by\n             oDiffFields before refresh.</p>\n<p>Defaults to: <code>{}</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-doAddDiff' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.utils.DiracArrayStore'>Ext.dirac.utils.DiracArrayStore</span><br/><a href='source/DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore-property-doAddDiff' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.utils.DiracArrayStore-property-doAddDiff' class='name expandable'>doAddDiff</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>It is a private member, which used to not save the difference when a\nremove operation is performed. ...</div><div class='long'><p>It is a private member, which used to not save the difference when a\nremove operation is performed.</p>\n<p>Defaults to: <code>true</code></p></div></div></div><div id='property-lastDataRequest' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.utils.DiracArrayStore'>Ext.dirac.utils.DiracArrayStore</span><br/><a href='source/DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore-property-lastDataRequest' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.utils.DiracArrayStore-property-lastDataRequest' class='name expandable'>lastDataRequest</a> : Ext.data.Operation<span class=\"signature\"></span></div><div class='description'><div class='short'>it stores the latest\n                              Ext.data.Operation, which is\n                              used to...</div><div class='long'><p>it stores the latest\n                              Ext.data.Operation, which is\n                              used to cancel the AJAX request.</p>\n</div></div></div><div id='property-listeners' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.utils.DiracArrayStore'>Ext.dirac.utils.DiracArrayStore</span><br/><a href='source/DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore-property-listeners' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.utils.DiracArrayStore-property-listeners' class='name expandable'>listeners</a> : Object<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>\n</div><div class='long'>\n</div></div></div><div id='property-oDiffFields' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.utils.DiracArrayStore'>Ext.dirac.utils.DiracArrayStore</span><br/><a href='source/DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore-property-oDiffFields' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.utils.DiracArrayStore-property-oDiffFields' class='name expandable'>oDiffFields</a> : Object<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>\n</div><div class='long'>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-getDiffId' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.utils.DiracArrayStore'>Ext.dirac.utils.DiracArrayStore</span><br/><a href='source/DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore-method-getDiffId' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.utils.DiracArrayStore-method-getDiffId' class='name expandable'>getDiffId</a>( <span class='pre'></span> ) : String<span class=\"signature\"></span></div><div class='description'><div class='short'>It returns the row identifier. ...</div><div class='long'><p>It returns the row identifier.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'><p>it is the DataIndex of a row.</p>\n</div></li></ul></div></div></div><div id='method-getDiffValues' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Ext.dirac.utils.DiracArrayStore'>Ext.dirac.utils.DiracArrayStore</span><br/><a href='source/DiracArrayStore.html#Ext-dirac-utils-DiracArrayStore-method-getDiffValues' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Ext.dirac.utils.DiracArrayStore-method-getDiffValues' class='name expandable'>getDiffValues</a>( <span class='pre'></span> ) : Object<span class=\"signature\"></span></div><div class='description'><div class='short'>it returns the values for a given fields. ...</div><div class='long'><p>it returns the values for a given fields.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'><p>returns the saved values.</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{}});