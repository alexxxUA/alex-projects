define("iqstore/LazyLoadYoutube", [
	"dojo/query",
	"dojo/dom-class",
	"iqstore/helpers",
	"dojox/NodeList/delegate",
	"dojo/NodeList-dom"
], function(query, domClass, helpers) {
	window.yTubApi = {
		//Dom Selectors
		slideItemSelector: '.js_slideItem',
		urlSelector: '.js-youtube-url',
		mainContSelector: '.js-youtube-container',
		playerWrapSelector: '.js-youtube-player-wrap',
		prevContSelector: '.js-youtube-preview',
		prevImgSelector: '.js-youtube-preview-img',
		loadedVideoClass: 'js-youtube-loaded',
		thumbnailTemplate: location.protocol +'//img.youtube.com/vi/',
		thumbnailTypes: ['0','1','2','3','default','hqdefault','mqdefault', 'sddefault', 'maxresdefault'], //'sddefault' and  'maxresdefault' may not exist.
		mobileThumbnailType: 'mqdefault',
		desktopThumbnailType: 'hqdefault',
		getPlayerTemplate: function(url){
			//Info: Autoplay don't work on mobile devices
			return '<iframe class="js-youtube-player" src="//www.youtube.com/embed/'+ this.getId(url) +'?enablejsapi=1&autoplay=1" frameborder="0" allowfullscreen></iframe>';
		},
		init: function(){
			var self = this;

			self.drawThumbnails();
			self.registerEvents();
		},
		registerEvents: function(){
			var self = this;
			query('body').delegate(self.mainContSelector +':not(.'+ self.loadedVideoClass +')', 'click', function(e){
				self.loadVideo(e);
			});
		},
		getId: function(url){
			var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/,
				match = url.match(regExp);
			if(match && match[7].length==11)
				return match[7];
			else
				console.log('Incorect youtube URL \n'+ url);
		},
		getThumbnails: function(url){
			var self = this,
				id = self.getId(url),
				thumbnails = {};
			for(var i=0; i<self.thumbnailTypes.length; i++){
				thumbnails[self.thumbnailTypes[i]] = self.thumbnailTemplate + id +'/'+ self.thumbnailTypes[i] +'.jpg';
			}
			return thumbnails;
		},
		drawThumbnails: function(){
			var self = this;
			query(self.urlSelector).forEach(function(vidUrl){
				var thumbnails = self.getThumbnails(vidUrl.value),
					curTumbnailType = helpers.isMobile ? self.mobileThumbnailType : self.desktopThumbnailType,
					img = query(vidUrl).siblings(self.prevContSelector).query(self.prevImgSelector);

				img.addClass('img-'+ curTumbnailType)[0].src = thumbnails[curTumbnailType];
			});
		},
		playPause: function(iframeNodes, action){//Action - play/pause
			var actionType = action == 'pause' ? 'pauseVideo' : 'playVideo';
			iframeNodes.forEach(function(node){
				node.contentWindow.postMessage('{"event":"command","func":"' + actionType + '","args":""}','*');
			});
		},
		play: function(iframeNodes){
			this.playPause(iframeNodes);
		},
		pause: function(iframeNodes){
			this.playPause(iframeNodes,'pause');
		},
		loadVideo: function(e){
			var self = this,
				node = query(e.target),
				slideItem = node.closest(self.slideItemSelector),
				mainCont = node.closest(self.mainContSelector),
				vidUrl = mainCont.query(self.urlSelector)[0].value;

			slideItem.addClass(self.loadedVideoClass +'-wrap');
			mainCont.addClass(self.loadedVideoClass).query(self.playerWrapSelector)[0].innerHTML = self.getPlayerTemplate(vidUrl);
		}
	}

	//yTubApi.init();
});