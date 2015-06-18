function customizeRadioBtns(radioSelector, customRadioClass, wrapClass, checkedClass, radio){
	$(radioSelector).each(function(i){
		var isChecked = '';

		if($(this).is(':checked'))
			isChecked = checkedClass;			
		
		$(this).wrap('<div class="'+ wrapClass +'"></div>').before('<span class="'+ customRadioClass +' '+ isChecked +'"></span>');
	});

	$('.'+customRadioClass).live('click', function(){
		$(this).siblings(radioSelector).trigger('click');
		if(radio){
			$('.'+customRadioClass).removeClass(checkedClass);
			$(this).addClass(checkedClass);
		}
		else
			$(this).toggleClass(checkedClass);	
	});
}

customizeRadioBtns('#reg-form .radio-button', 'chekbox', 'wrap', 'checked');