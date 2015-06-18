(function($){
    $.fn.scroller = function(options){
        options = $.extendet({
            imgSrc = 'img/scroll-up.png',
            pageHeight = 1.5
        }, options);

        return this.each(function(){
            var $this = $(this),
                pageHeight = $this.height(),
                scrollContent = '<div class="scrollUp"><img src="'+options.imgSrc+'" title="To top"/></div>',
                scrollUp = $(content).appendTo('body');

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
                hover(function(){
                    $(this).css('cursor', 'pointer');
                })
            });
        });
    };
}){jQuery};