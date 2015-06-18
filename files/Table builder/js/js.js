$(document).ready(function(){
	//Functions
		//Check for NUMB
		function validateNumber(x) {
			var regexp = /^\b\d+\b$/;

			if(regexp.test(x) && x.length != 0) {
				return +(x);
			}
			return x;
		};
		
		//Build table
		function buildTable(){
			
			var col = $('#col').val(),
				rows = $('#row').val();
			
			col = validateNumber(col);
			rows = validateNumber(rows);
			
			if(typeof(col) == 'number' && col !== 0 && typeof(rows) == 'number' && rows !== 0){
			
				$('#body').append('<div class="table"><a href="#" id="get-gode">Get html code of this table</a><a href="#" id="clear">clear</a><table style="border-collapse:collapse;"></table></div>');
				for(i=0; i<col; i++){
					$('#body table:last').append('<tr></tr>');
					
					for(j=0; j<rows; j++){
					
						$('#body tr:last').append('<td spellcheck="false" style="border:1px solid red; background:#C3FFF8; vertical-align:top;">Some text</td>');
					
					}
				}
			}
			else alert('Введите число (не =0)');
		};
		//Fade out modal
		function fadeOutMask(){
			$('#mask').fadeOut();
			$('.show-code').fadeOut();
		};
	
	//Actions
	$('#build-table').click(function(){
		buildTable();
		return false;
		
	});
	
	//Edit text
	$('td').live('dblclick', function(){
	
		$(this).attr({contenteditable:"true"});
		
		$(this).live('blur', function(){
		
			$(this).removeAttr('contenteditable');
		
		});
	
	});
	
	//Get gode
	$('#get-gode').live('click', function(){
		var code = $(this).siblings('table').html();

		$('.show-code div').text('<table style="border-collapse:collapse;">'+code+'</table>');
		$('.show-code').slideDown();
		$('#mask').css({'opacity':'0'});
		$('#mask').fadeTo(700,0.8);
		
		$('.close, #mask').click(function(){
			fadeOutMask();
		});
	});
	
	//Clear Table
	$('#clear').live('click', function(){
		$(this).parent('.table').slideUp(500, function(){
			$(this).remove();
		});
		return false;
	});
	
});