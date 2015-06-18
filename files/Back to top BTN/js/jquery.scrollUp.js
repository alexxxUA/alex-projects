(function($){
    $.fn.scroller = function(options){
        options = $.extend({
            imgSrcTop       : 'img/scroll-up.png',
            imgSrcBottom    : 'img/scroll-bottom.png',
            scrollTop       : 'top',
            scrollBottom       : 'bottom',
            pageHeight      : 1.5
        }, options);

        return this.each(function(){
            var $this = $(this),
                pageHeight = $this.height(),
                scrollContent = '<div class="scrollUp"><img src="'+options.imgSrcTop+'" title="To top"/></div>',
                scrollUp = $(scrollContent).appendTo('body');

            $this.scroll(function(){
                if($(this).scrollTop() >= pageHeight*options.pageHeight){
                    $(scrollUp).fadeIn();
                }
                else{
                    $(scrollUp).fadeOut();
                }
            });

            scrollUp.bind('click', function(){
                $('html, body').animate({scrollTop:0}, 500);

            }).hover(function(){
                $(this).css('cursor', 'pointer');
            });
        });
    };
})(jQuery);