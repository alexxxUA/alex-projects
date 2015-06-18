jQuery(function($) {
	//Mobile device detection
	var isMobile = {
	    Android: function() {
	        return navigator.userAgent.match(/Android/i);
	    },
	    BlackBerry: function() {
	        return navigator.userAgent.match(/BlackBerry/i);
	    },
	    iOS: function() {
	        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	    },
	    Opera: function() {
	        return navigator.userAgent.match(/Opera Mini/i);
	    },
	    Windows: function() {
	        return navigator.userAgent.match(/IEMobile/i);
	    },
	    any: function() {
	        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	    }
	};

	//Mobile code
	if(isMobile.any()){
		//Set img' size
		var innerWidth = window.innerWidth;
		$('.img-container img').width(innerWidth);

		//Nav menu
		var navMenu = {
			init: function(){
				$('body').prepend( $('#nav'));
				this.registerEvents();
			},
			registerEvents: function(){
				var obj = this;
				$(document).delegate('.nav-btn:not(.active)', 'click', $.proxy(obj, 'show'));
				$(document).delegate('.nav-btn.active', 'click', $.proxy(obj, 'hide'));
			},
			show: function(e){
				e.preventDefault();
				$(e.currentTarget).addClass('active');
				$('#nav').animate({
					right: 0
				}, 500);
				$('.container').animate({
					left: -220
				}, 500);
			},
			hide: function(e){
				e.preventDefault();
				$(e.currentTarget).removeClass('active');
				$('#nav').animate({
					right: -220
				}, 500);
				$('.container').animate({
					left: 0
				}, 500);
			}
		}
		navMenu.init();

	}

	//Date picker init
	var curDate = new Date(),
		lastYearDate = new Date(curDate.getFullYear(), 11, 31);
		
	var picker = new Pikaday({
        field: document.getElementById('datepicker'),
        firstDay: 1,
        minDate: curDate,
        maxDate: lastYearDate
    });
    $(document).delegate('#datepicker', 'change', function(){
    	var val = $(this).val().split(' ')
    		newDate = val[2] +' '+ val[1];
    	$(this).val(newDate);
    });

	//Slider init
	$('.bxslider').bxSlider({
		minSlides: 1,
		maxSlides: 1,
		slideMargin: 0,
		pause: 2000,
		speed: 500,
		auto: true,
		autoHover: true
	});
	
	//Custom select
	$(document).delegate('.custom-select select', 'change', function(e){
		var val = $(this).val();		
		$(this).closest('.list-item-wrap').find('.js-val').html(val);
	});

});
