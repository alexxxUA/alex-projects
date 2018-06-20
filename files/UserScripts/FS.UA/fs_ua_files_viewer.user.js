// ==UserScript==
// @name			FS.UA files viewer
// @version			6.1
// @description		FS.UA files (video, audio, games, etc...) viewer from non UA/RU coutries
// @author			Alexey
// @require			http://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js
// @include			/https?\:\/\/brb\.to.*/
// @include			/https?\:\/\/fs\.to.*/
// @updateURL		http://avasin.cf/UserScripts/FS.UA/fs_ua_files_viewer.user.js
// ==/UserScript==

var $ = jQuery;

//Metadata plugin
$.extend({
	metadata : {
		defaults : {
			type: 'class',
			name: 'metadata',
			cre: /({.*})/,
			single: 'metadata'
		},
		setType: function( type, name ){
			this.defaults.type = type;
			this.defaults.name = name;
		},
		get: function( elem, opts ){
			var settings = $.extend({},this.defaults,opts);
			// check for empty string in single property
			if ( !settings.single.length ) settings.single = 'metadata';
			
			var data = $.data(elem, settings.single);
			// returned cached data if it already exists
			if ( data ) return data;
			
			data = "{}";
			
			if ( settings.type == "class" ) {
				var m = settings.cre.exec( elem.className );
				if ( m )
					data = m[1];
			} else if ( settings.type == "elem" ) {
				if( !elem.getElementsByTagName )
					return undefined;
				var e = elem.getElementsByTagName(settings.name);
				if ( e.length )
					data = $.trim(e[0].innerHTML);
			} else if ( elem.getAttribute != undefined ) {
				var attr = elem.getAttribute( settings.name );
				if ( attr )
					data = attr;
			}
			
			if ( data.indexOf( '{' ) <0 )
			data = "{" + data + "}";
			
			data = eval("(" + data + ")");
			
			$.data( elem, settings.single, data );
			return data;
		}
	}
});
$.fn.metadata = function( opts ){
	return $.metadata.get( this[0], opts );
};

/* MODAL CLASS */
var Modal = function(params){
	this.bgClass = 'b-modal';
	this.modalClass = 'modal';
	this.contentClass = 'container';
	this.closeClass = 'close';
	this.activeClass = 'active';
	this.contentWidth = 500;

	//Init entry params
	this.initParams(params);
	
	//Base init
	this.init();
}

Modal.prototype.initParams = function(params){
	for(var param in params){
		if (params.hasOwnProperty(param))
			this[param] = params[param];
	}
}
Modal.prototype.init = function(param){
	this.createDom();
	this.addCustomStyles();
	this.registerEvents();
}
Modal.prototype.addCustomStyles = function(){
	this.insertCss(
		'.'+ this.modalClass +'{display: none;position: fixed;width: '+ this.contentWidth +'px;top: 50%;left: 50%;margin: -200px 0 0 -'+ this.contentWidth/2 +'px;z-index: 99999;background: #000;box-shadow: 0 0 4px 1px #00A08D;border-radius: 5px;}'+
		'.'+ this.modalClass +'.'+ this.activeClass +'{display: block;}'+
		'.'+ this.modalClass +' .'+ this.contentClass +'{width:100%; height: 100%;padding: 3%;box-sizing: border-box;text-align:center;}'+
		'.'+ this.modalClass +' video{width: auto;height: auto;max-width: 100%;max-height: 100%;}'+
		'.'+ this.bgClass +'{position: fixed;width: 100%;height: 100%;background: #000;z-index: 99999;top: 0;opacity: 0.5;display: none;}'+
		'.'+ this.bgClass +'.'+ this.activeClass +'{display: block;}'+
		'.'+ this.closeClass +'{position: absolute;right: 10px;top: 5px;color: #C9F2F9;font: normal 20px arial;cursor: pointer;}'
	);
}	
Modal.prototype.createDom = function(){
	$('body').append('<div class="'+ this.bgClass +'"></div>')
		.append('<div class="'+ this.modalClass +'"><div class="'+ this.closeClass +'">✖</div><div class="'+ this.contentClass +'"></div></div>')
}
Modal.prototype.registerEvents = function(){
	$(document).on('click', '.'+ this.closeClass, $.proxy(this, 'hide'));
	$(document).on('click', '.'+ this.bgClass, $.proxy(this, 'hide'));
}
Modal.prototype.updatePosition = function(){
	var $modal = $('.'+ this.modalClass);

	if($modal.height() >= window.innerHeight){
		$modal.height(window.innerHeight - 150);
	}

	$modal.css({'margin-top': - $modal.height()/2});
}
Modal.prototype.show = function(content, callback){
	$('.'+ this.bgClass).addClass(this.activeClass);
	$('.'+ this.modalClass).addClass(this.activeClass).find('.'+ this.contentClass).html(content);
	this.videoReady();
	if(callback) callback();
}
Modal.prototype.videoReady = function(){
	$('.'+ this.modalClass +' video').each(function(){
		$(this).one('loadeddata', function(){
			modal.updatePosition();
		});
	});
}
Modal.prototype.removeVideos = function(){
	$('.'+ this.modalClass +' video').each(function(){
		this.pause();
		this.src = '';
		$(this).remove();
	});
}
Modal.prototype.hide = function(){
	this.removeVideos();
	$('.'+ this.bgClass).removeClass(this.activeClass);
	$('.'+ this.modalClass).removeClass(this.activeClass).css({'height':'', 'margin-top':''}).find('.'+ this.contentClass).html('');
}

/* PROXY CLASS */
function Proxy(params){
	this.ajaxLoaderClass = 'js-ajax-loader';
	this.ajaxErrorClass = 'js-ajax-error';
	this.ajaxImgUrl = 'http://avasin.cf/img/ajax-loader.gif';
	this.internalProxyUrl = location.protocol +'//avasin.cf/proxy';
	this.externalProxyUrl = location.protocol +'//213.108.74.236:8081';  //Site with proxy list --->  http://www.proxynova.com/proxy-server-list/country-ua

	this.browserProxyDomain = 'http://cloud.lntu.info'; //'http://smenip.ru'
	this.browserProxyPath = '/browse.php?'; //'/proxi/browse.php?'

	this.isBrowserProxy = false;
	this.readSpeed = 600; //Symbols per minute

	//Init entry params
	this.initParams(params);

	//Init associate params
	this.initAssociateParams();

	//Base init
	this.baseInit();

	//Custom init
	this.init();
}
Proxy.prototype.init = function(){}
Proxy.prototype.initParams = function(params){
	for(var param in params){
		if (params.hasOwnProperty(param))
			this[param] = params[param];
	}
}
Proxy.prototype.initAssociateParams = function(){
	//Set params based on another params
	this.$ajaxLoader = $('<div class="'+ this.ajaxLoaderClass +'"><img src="'+ this.ajaxImgUrl +'"></div>');
	this.$ajaxError = $('<div class="'+ this.ajaxErrorClass +'"></div>');
	this.browserProxyUrl = this.browserProxyDomain + this.browserProxyPath;
}
Proxy.prototype.baseInit = function(){
	this.initAjaxLoader();
	this.baseRegisterEvents();
};
Proxy.prototype.baseRegisterEvents = function(){
	this.$ajaxError.on('click', $.proxy(this.hideError, this));
}
//Ajax loader
Proxy.prototype.initAjaxLoader = function(){
	$('body').append(this.$ajaxLoader).append(this.$ajaxError);
};
Proxy.prototype.showError = function(msg){
	var that = this,
		estimatedTime = that.getEstimatedReadTime(msg);

	this.hideError();
	this.hideLoader();

	setTimeout(function(){
		$(window).on('mousemove', $.proxy(that.setLoaderPos, that));
		that.$ajaxError.text(msg).show();

		//Hide error after timeout
		that.errTimeOut = setTimeout(function(){
			that.hideError();
		}, estimatedTime);
	}, 200);
}
Proxy.prototype.hideError = function(){
	clearTimeout(this.errTimeOut);
	this.$ajaxError.hide().text('');
	$(window).off('mousemove');
}
Proxy.prototype.showLoader = function(){
	this.hideError();
	this.hideLoader();

	$(window).on('mousemove', $.proxy(this.setLoaderPos, this));
	this.$ajaxLoader.show();
}
Proxy.prototype.hideLoader = function(){
	this.$ajaxLoader.hide();
	$(window).off('mousemove');
}
Proxy.prototype.setLoaderPos = function(e){
	var position = {
		'top' : e.pageY - $(window).scrollTop(),
		'left' : e.pageX - $(window).scrollLeft()
	}

	this.$ajaxLoader.css(position);
	this.$ajaxError.css(position);
}
Proxy.prototype.removeScriptFromString = function(string){
	return string.replace(/<.*?script.*?>.*?<\/.*?script.*?>/igm, '');
}
Proxy.prototype.cleanHref = function(href){
	var regExpPath = this.getRegExpFromString(this.browserProxyPath +'u='),
		regExpDomain = this.getRegExpFromString(this.browserProxyDomain);
	
	href = href.replace(regExpPath, '');
	href = href.replace(regExpDomain, '');
	href = href.replace(/&.*$/gm, '');

	return href;
}
Proxy.prototype.cleanLinks = function($html){
	var that = this,
		$links = $html.find('[href]');

	$links.each(function(){
		var $link = $(this);

		$link.attr('href', that.cleanHref($link.attr('href')));
	});

	return $html;
}
Proxy.prototype.getRegExpFromString = function(str){
	var str = str.replace(/\:/gm, '\\:');
	str = str.replace(/\//gm, '\\/');
	str = str.replace(/\./gm, '\\.');
	str = str.replace(/\?/gm, '\\?');

	return new RegExp(str);
} 
Proxy.prototype.getEstimatedReadTime = function(string){
	return (string.length / this.readSpeed * 60000).toFixed() ;
}
Proxy.prototype.getCleanResponse = function(html){
	var $htmlWrap = $('<div/>').html(this.removeScriptFromString(html));
	
	//Remove part of static DOM
	$htmlWrap.find('#include').remove();
	$htmlWrap.find('style').remove();

	//Clean href on links
	$htmlWrap = this.cleanLinks($htmlWrap);

	return $htmlWrap.html();
}
Proxy.prototype.getURLParameter = function(url, name) {
	return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
}
/*
Object for server side request
@dataOgj: {
	type: 'GET'/'POST', 	-req
	url: '', 				-req
	data: '',
	isCookies: true/false
}	
*/
Proxy.prototype.proxyRequest = function(dataObj, onSuccess, onError){
	if(this.isBrowserProxy)
		this.browserProxyRequest(dataObj, onSuccess, onError);
	else
		this.externalProxyRequest(dataObj, onSuccess, onError);
}
Proxy.prototype.externalProxyRequest = function(dataObj, onSuccess, onError){
	var that = this;
	
	$.extend(dataObj, {
		proxy: that.externalProxyUrl
	});

	$.ajax({
		type: 'GET',
		url: that.internalProxyUrl,
		crossDomain: true,
		data: $.param(dataObj),
		success: function(response, status, xhr){
			if(onSuccess) onSuccess.call(that, response, xhr, dataObj);
		},
		error: function(err){
			//Show error message
			var errMsg = typeof dataObj.errMsg != 'undefined' ? dataObj.errMsg : err.statusText;
			that.showError(errMsg);
			//Load callback
			if(onError) onError.call(that, err, dataObj);
		}
	});
}
Proxy.prototype.browserProxyRequest = function(dataObj, onSuccess, onError){
	var that = this;
	
	$.extend(dataObj, {
		url: that.browserProxyUrl,
		data: {
			u: dataObj.url,
			b: '28'
		},
		isCookies: true
	});

	$.ajax({
		type: 'GET',
		url: that.internalProxyUrl,
		crossDomain: true,
		data: $.param(dataObj),
		success: function(response, status, xhr){
			if(onSuccess) onSuccess.call(that, that.getCleanResponse(response), xhr, dataObj);
		},
		error: function(err){
			//Show error message
			var errMsg = typeof dataObj.errMsg != 'undefined' ? dataObj.errMsg : err.statusText;
			that.showError(errMsg);
			//Load callback
			if(onError) onError.call(that, err, dataObj);
		}
	});
}


//Greate FS instance and init()
var FS = new Proxy({
	ajaxLoaderClass: 'b-ajax-loader',
    ajaxErrorClass: 'b-ajax-error',
    mainFilesSel: '.b-files-folders',
    filesSel: '.b-filelist',
    folderSel: '.folder',
	subContentSel: '.filelist',
    disableClickSel: '.material-video-quality, .disabled',
	folderLinkSel: 'a[rel*=parent_id]',
	materialLinkSel: '.b-file-new__link-material',
    downloadLinkSel: '.b-file-new__link-material-download',
	vidListItemSel: '.m-file-new_type_video',
	posterItemSel: '.b-poster-tile, .b-poster-new, .l-tab-item-content, .b-main__new-item, .b-main__top-commentable-item-wrap, .b-poster-detail',
	posterTitleSel: '.b-poster-tile__title-short,'+
					'.m-poster-new__short_title,'+
					'.b-tab-item__title-inner span,'+
					'.b-tab-item__title-inner h1,'+
					'.b-tab-item__title-origin,'+
					'.b-main__new-item-title,'+
					'.b-poster-detail__title,'+
					'.b-main__top-commentable-item-title-value',
	playBtnClass: 'play-btn',
	$head: $('head'),
	//cssArray: ['//vjs.zencdn.net/5.0.0/video-js.css'],
	//jsArray: ['//vjs.zencdn.net/5.0.0/video.js'],
	videoWidth: 900,
	isBrowserProxy: true,
	slideTime: 200,
	torrentImgUrl: 'https://maxcdn.icons8.com/Color/PNG/48/Logos/utorrent-48.png',
	rutorSearchUrl: 'http://new-rutor.org/search/',
    //internalProxyUrl: 'http://192.168.0.135:8888/proxy',
	externalProxyUrl: 'http://94.45.65.94:3128',  //Site with proxy list --->  http://www.proxynova.com/proxy-server-list/country-ua
	fsDomain: 'http://fs.to',
    fsBasePath: location.pathname +'?ajax&',
    fsFilmBaseUrl: '',
    init: function(){
		//Load css and js files
		this.loadCss();
		this.loadJs();
        
		//Store base content url
        this.fsFilmBaseUrl = this.fsDomain + this.fsBasePath;
		this.isShowFiles = $(this.mainFilesSel).length != 0 && $('.b-files-folders-link').length == 0;

        this.addCustomStyles();
        this.showRutorLinks();
		
		//Do not run showing folder in case file's placeholder not found or folders not hidden
		if(!this.isShowFiles)
			return;

		this.registerEvents();
		this.showFirstFolder();
    },
    registerEvents: function(){
		//Show folder content
        $(document).on('click', this.folderSel +' '+ this.folderLinkSel +':not(.loaded):not(.disabled)', $.proxy(this.showFolderContent, this));
        //Toggle content
		$(document).on('click', this.folderSel +' '+ this.folderLinkSel +'.loaded', $.proxy(this.contentToggle, this));
        //Play video
		$(document).on('click', '.'+ this.playBtnClass, $.proxy(this.showVideo, this));
		//Prevent click
        $(document).on('click', this.disableClickSel, function(e){
            e.preventDefault();
        });
    },
	insertCss: function(css){
		var id = typeof unsafeWindow.FS_PROXY != 'undefined' ? unsafeWindow.FS_PROXY.dataId : '';

		$("<style/>").html(css).attr('data-id', id).appendTo('head');
	},
    addCustomStyles: function(){
		this.insertCss(
			'.'+ this.ajaxLoaderClass +' {position: fixed; width:30px; height:30px; z-index:999999; left:50%; top:50%; margin:12px 0 0 12px; display:none;}'+
			'.'+ this.ajaxLoaderClass +' img {width: 100%; height: 100%;}'+
			'.'+ this.ajaxErrorClass +' {position:fixed; display:none; left:50%; top:50%; z-index:999999; min-width:100px; max-width:200px; color:#FF7D7D; background:#00013F; border-radius:0 10px 10px; padding:10px; text-align:center; margin:12px 0 0 12px;}'+
			'body .m-file-new_type_video .b-file-new__link-material-filename {background: none; padding: 0;}'+
			'body .b-files-folders .b-filelist .material-video-quality {background-color: inherit; color: inherit; cursor: default;}'+
			'body .b-filelist .folder-filelist, .filelist m-current {display: none}'+
			'body .b-filelist .filelist .filelist {margin-left: -7px; padding-left: 0;}'+
			'body .b-filelist .filelist li.b-file-new {margin-left: 7px;}'+
			'body .b-file-new__link-material-download.error, body .error .b-file-new__link-material-size {color: #FF5757;}'+
			'.'+ this.playBtnClass +'{cursor:pointer;position: absolute;top: 11px;right: -23px;border-left: 18px solid #2E6DB1;border-top: 9px solid transparent;border-bottom: 9px solid transparent;font-size: 0;z-index: 16;width: 0;height: 0;}'+
			this.posterItemSel +'{position: relative;}'+
			'.b-main__top-commentable-item-wrap .rutor-poster-link {top: 25px;}'+
			'.b-poster-new .rutor-poster-link {top: -10px; left: -10px;}'+
			'.b-poster-detail .rutor-poster-link {top: -5px; left: -5px;}'+
			'.l-tab-item-content .rutor-poster-link {top: -15px; left: -15px; width: 48px; height: 48px;}'+
			'.rutor-poster-link img {width: 100%;}'+
            '.b-poster-tile__link:hover + .rutor-poster-link, .b-poster-detail__link:hover + .rutor-poster-link {z-index: 999}'+
			'.rutor-poster-link {position: absolute; top: 0; left: 0; z-index: 100; width: 35px; height: 35px;}'+
			'.rutor-poster-link + .rutor-poster-link {top: 30px;}'
		);
    },
	loadCss: function(){
		var cssArray = typeof this.cssArray != 'undefined' ? this.cssArray : [];

		for(var i=0; i<cssArray.length; i++)
			this.$head.append('<link rel="stylesheet" href="'+ cssArray[i] +'">');
	},
	loadJs: function(){
		var jsArray = typeof this.jsArray != 'undefined' ? this.jsArray : [];

		for(var i=0; i<jsArray.length;  i++)
			this.$head.append('<script src="'+ jsArray[i] +'"><\/script>');
	},
	getPlayBtnNode: function(url){
		return '<a class="'+ this.playBtnClass +'" href="'+ url +'" title="Play">Play</a>';
	},
	getVidTemplate: function(url){
		return '<video name="media" autoplay controls preload="auto">'+
				'<source src="'+ url +'"></source>'+
			'</video>';
	},
	getRutorLink: function(title){
		var cleanTitle = this.getCleanTitle(title),
			escapedTitle = cleanTitle.replace(/\s+/g, '%20');

		return '<a href="'+ this.rutorSearchUrl + escapedTitle +'#index" title="'+ cleanTitle +'" class="rutor-poster-link" target="_blank">'+
					'<img src="'+ this.torrentImgUrl +'">'+
				'</a>';
	},
    getFolderHtml(params){
        var that = this;

        //Show loader
		that.showLoader();
		//Proxy reqest
		that.proxyRequest({
			type: 'GET',
            url: that.fsFilmBaseUrl +'folder='+ params.id,
			errMsg: params.errMsg
        }, function(response, xhr, dataObj){
			that.hideLoader();
			if(params.onSuccess) params.onSuccess.call(that, response, xhr, dataObj);
		}, function(err, dataObj){
			that.hideLoader();
			if(params.onError) params.onError.call(that, err, dataObj);
		});
    },
	getCleanTitle: function(title){
		return title.replace(/\n+|\t+|\v+/g, '');	//Remove "enters" and "tabs"
	},
	showRutorLinks: function(){
		var that = this,
			$posters = $(this.posterItemSel);

		$posters.each(function(){
			var $poster = $(this),
				$title = $poster.find(that.posterTitleSel);

			$title.each(function(){
				var title = $(this).text();

				$poster.append(that.getRutorLink(title));
			});
		});
	},
	showVideo: function(e){
		e.preventDefault();
		var that = this,
			$btn = $(e.currentTarget),
			vidNode = this.getVidTemplate($btn.attr('href'));

		modal.show(vidNode);
	},
	showFirstFolder: function(){
		var that = this;

		that.getFolderHtml({
			id: '0',
			errMsg: 'Error in loading content. Try to refresh the page.',
			onSuccess: function(res, xhr, dataObj){
				var $mainHolder = $(that.mainFilesSel),
					$files = $(that.filesSel);

				that.contentPreparing(res, function($html){
					$files.append($html);
					$mainHolder.slideDown(that.slideTime);
            	});
			}						 
        });
	},
	showFolderContent: function(e){
        e.preventDefault();
		var that = this,
			$target = $(e.currentTarget),
            metadata = $target.metadata({type: "attr", name: "rel"}),
			folderId = metadata.parent_id,
			$folder = $target.closest(that.folderSel);
		
		//Prevent multi clicks
		$target.addClass('disabled');
		
		//Load folder HTML
		that.getFolderHtml({
			id: folderId,
			errMsg: 'Error in loading folder "'+ $target.text() +'". Please try again.',
			onSuccess: function(res, xhr, dataObj){
				that.show($target, res);
			},
			onError: function(){
				//Reenable folder link
				$target.removeClass('disabled');
			}
		});
	},
	showContent: function($folderLinks){
		var that = this;

		$folderLinks.each(function(){
			var $folderLink = $(this),
				$content = $folderLink.closest(that.folderSel).find(that.subContentSel).first();
			
			if($content.length !== 0){
				$folderLink.addClass('loaded');
				$content.slideDown(that.slideTime);		
			}
		});
	},
	show: function($folderLink, res){
		var that = this,
            $folder = $folderLink.closest(that.folderSel);

		that.contentPreparing(res, function($html){
			$folder.append($html);
			that.showContent($folderLink);

			//Reenable folder link
			$folderLink.removeClass('disabled');
		});
	},
	contentToggle: function(e){
		e.preventDefault();
		var $target = $(e.currentTarget),
			$content = $target.closest(this.folderSel).find(this.subContentSel).first();
		
		$content.slideToggle(this.slideTime);
	},
	addPlayBtn: function($html){
		var that = this,
			$vidListItems = $html.find(this.vidListItemSel);
		//debugger;
		$vidListItems.each(function(){
			var $vidListItem = $(this),
				$downloadLink = $vidListItem.find(that.downloadLinkSel);
			
			//Add play button
			$vidListItem.append(that.getPlayBtnNode($downloadLink.attr('href')));
		});
		
		return $html;
	},
	contentPreparing: function(html, callback){
		var that= this,
			$html = $(html),
            $downloadLinks = $html.find(that.downloadLinkSel),
			$subContent = $html.find(that.subContentSel),
			$folderLink = $html.find(that.folderLinkSel);

        //Show content for loaded subfolder
		that.showContent($folderLink);
        
		//Parse download links
        if($downloadLinks.length > 0){
			that.parseDownloads($downloadLinks, function(){
				callback(that.addPlayBtn($html));
			});
		}
		else{
			callback(that.addPlayBtn($html));
		}
	},
	parseDownloads: function($links, callback){
		var that = this,
			linksLensth = $links.length,
			counter = 0;
		
		//Show AJAX loader
		that.showLoader();

		for(var i=0; i < linksLensth; i++){
			var $link = $($links[i]),
				oldUrl = $link.attr('href'),
				reqUrl = that.isBrowserProxy ? oldUrl : that.fsDomain + oldUrl;
			
			(function($$link){
				that.proxyRequest({
					type: 'GET',
					url: reqUrl
				}, function(res, xhr, dataObj){
					var redirectUrl = xhr.getResponseHeader('Redirect-To');

					if(redirectUrl !== null && redirectUrl !== 'undefined'){
						var url = that.cleanHref(redirectUrl),
							$titleLink = $$link.siblings(that.materialLinkSel);

						$$link.attr('href', url);
						$titleLink.attr({'href': url, 'class': ''});
					}

					//Callback functionality
					counter++;
					if(counter >= $links.length){
						//Finish to parse links
						callback();
						//Hide AJAX loader
						that.hideLoader();
					}
				}, function(err){
					$$link.addClass('error');

					//Callback functionality
					counter++;
					if(counter >= $links.length){
						//Finish to parse links
						callback();
						//Hide AJAX loader
						that.hideLoader();
					}
				});
			})($link);
		}
	}
});

//Greate Modal instance and init()
var modal = new Modal({
	contentWidth: FS.videoWidth,
	insertCss: FS.insertCss
});