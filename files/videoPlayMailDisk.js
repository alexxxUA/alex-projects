javascript: (function(){
	var Video = {
	    listItemS: '.b-datalist__item',
	    hrefS: '.js-href.b-datalist__item__link, .js-href.b-thumb__name__link',
	    vidS: '.ico_filetype_video',
	    playBtnClass: 'play-btn',
	    width: 900,
	    playBtnTempl: function(){
	        return '<div class="'+ this.playBtnClass +'">Play</div>';
	    },
	    init: function(){
	        this.drawPlayBtns();
	        this.registerEvents();
	    },
	    drawPlayBtns: function(){
	        var self = this;
	        $(self.listItemS).each(function(){
	            var node = $(this);
	            if(node.find(self.vidS).length == 0 || node.find('.'+ self.playBtnClass).length > 0)
	                return true;

	            var playBtn = $(self.playBtnTempl()).data('vid-uri', self.getUrl(node));

	            node.append(playBtn)
	        });
	    },
	    registerEvents: function(){
	        var self = this;
	        $(document).delegate('.'+ this.playBtnClass, 'click', $.proxy(self, 'show'));
	        $(window).scroll($.proxy(self, 'drawPlayBtns'));
	    },
	    show: function(e){
	        var btn = $(e.currentTarget),
	            vidNode = this.getVidTemplate(btn.data('vid-uri'));

	        Modal.show(vidNode, this.videoReady);
	    },
	    videoReady: function(){
	    	$('#mailDiskVideo').one('loadeddata', function(){
	    		Modal.updatePosition();
	    	});
	    },
	    getUrl: function($nodeItem){
	        return $nodeItem.find(this.hrefS).attr('href');
	    },
	    getVidTemplate: function(url){
	        return '<video id="mailDiskVideo" name="media" autoplay controls preload="auto">'+
	                '<source src="'+ url +'"></source>'+
	            '</video>';
	    }
	};

	var Modal = {
		init: function(param){
			this.bgClass = 'bg';
			this.modalClass = 'modal';
			this.contentClass = 'container';
			this.closeClass = 'close';
			this.activeClass = 'active';

	        this.createDom();
			this.registerEvents();
		},
		createDom: function(){
	        $('body').append('<div class="'+ this.bgClass +'"></div>')
	            .append('<div class="'+ this.modalClass +'"><div class="'+ this.closeClass +'">x</div><div class="'+ this.contentClass +'"></div></div>')
		},
		registerEvents: function(){
			var self = this;

	        $(document).delegate('.'+ this.closeClass, 'click', $.proxy(self, 'hide'));
	        $(document).delegate('.'+ this.bgClass, 'click', $.proxy(self, 'hide'));
		},
		updatePosition: function(){
			var $modal = $('.'+ this.modalClass);

			if($modal.height() >= window.innerHeight){
				$modal.height(window.innerHeight - 150);
			}

			$modal.css({'margin-top': - $modal.height()/2});
		},
		show: function(content, callback){
			$('.'+ this.bgClass).addClass(this.activeClass);
			$('.'+ this.modalClass).addClass(this.activeClass).find('.'+ this.contentClass).html(content);
			if(callback) callback();
		},
		hide: function(){
		    $('.'+ this.bgClass).removeClass(this.activeClass);
			$('.'+ this.modalClass).removeClass(this.activeClass).css({'height':'', 'margin-top':''}).find('.'+ this.contentClass).html('');
		}
	};

	Modal.init();
	Video.init();

	var cssRules = '.'+ Modal.modalClass +'{display: none;position: fixed;width: '+ Video.width +'px;top: 50%;left: 50%;margin:-300px 0 0 -'+ Video.width/2 +'px;z-index: 999;background: #FFF;box-shadow: 0 0 3px 1px #4F4343;border-radius: 5px;}'+
	        '.'+ Modal.modalClass +'.'+ Modal.activeClass +'{display: block;}'+
	        '.'+ Modal.modalClass +' .'+ Modal.contentClass +'{width:90%; height: 90%;margin:5%;text-align:center;}'+
	        '.'+ Modal.modalClass +' video{width: auto;height: auto;max-width: 100%;max-height: 100%;}'+
	        '.'+ Modal.bgClass +'{position: fixed;width: 100%;height: 100%;background: #000;z-index: 999;top: 0;opacity: 0.5;display: none;}'+
	        '.'+ Modal.bgClass +'.'+ Modal.activeClass +'{display: block;}'+
	        '.'+ Modal.closeClass +'{position: absolute;right: 5px;top: 5px;width: 20px;height: 20px;color: #F24A4A;font-size: 16px;font-weight: bold;font-family: arial;text-align: center;cursor: pointer;}'+
	        '.'+ Video.playBtnClass +'{cursor:pointer;position: absolute;top: 15px;right: 30px;border-left: 20px solid #796E6E;border-top: 10px solid rgba(0, 0, 0, 0);border-bottom: 10px solid rgba(0, 0, 0, 0);font-size: 0;z-index: 16;width: 0;height: 0;}'+
	        '.b-datalist_files .'+ Video.playBtnClass +'{top: 7px;right: 3px;}';

	var css = $('<style>').attr('type', "text/css").html(cssRules);
	$('head').append(css);
})();