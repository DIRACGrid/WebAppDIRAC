<table class="cm-config-diff">
	<tr>
    	<th>{{titles[0]}}</th>
    	<th>{{titles[1]}}</th>
 	</tr>
{% for line in diffList %}
{% if line[0]!="" %}
	<tr id='diff-line-{{line[3]}}' class='{{line[0]}}'>
{% else %}
	<tr>
{% end %}
    	<td>{{line[1].replace( " ", "&nbsp;" )}}</td>
    	<td>{{line[2].replace( " ", "&nbsp;" )}}</td>
   </tr>
{% end %}
</table>
