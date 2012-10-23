<html>
  <head>
    <title>{% block title %}Default title{% end %}</title>
    <script src='//ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.2.min.js'></script>
    <script>
			$(document).ready(function(){
				var a = {'a':[1,2,3]};
				$.ajax({ 
					url: '/DIRAC/up/saveAppState',
					data: {
						app : 'potato',
						name: 'asda',
						state: JSON.stringify( { 'a': [1,2,3] } )
					},
				}).done(function(){
					var datadiv = $('#data');
					datadiv.append( "initial<br/" );
					$.ajax({
						url: '/DIRAC/up/listAppState',
						data: { app: 'potato' }
					}).done(function( data ){
						datadiv.append( " | " +JSON.stringify( data ) );
						$.ajax({
							url: '/DIRAC/up/loadAppState',
							data: { app: 'potato', name: 'asda' }
						}).done(function( data ){
							datadiv.append( " | " +JSON.stringify( data ) );
						});
					});
				});
			});
    </script>
  </head>
  <body>
   <h1> Placeholder for DIRAC </h1>
   <div id='data'></div>
  </body>
</html>