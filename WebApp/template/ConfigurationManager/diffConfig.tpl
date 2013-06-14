<table class="cm-config-diff">
	<tr>
    	<th>{{titles[0]}}</th>
    	<th>{{titles[1]}}</th>
 	</tr>
{% for line in diffList %}
	<tr class='{{line[0]}}'>
    	<td>{{line[1].replace( " ", "&nbsp;" )}}</td>
    	<td>{{line[2].replace( " ", "&nbsp;" )}}</td>
   </tr>
{% end %}
</table>
 