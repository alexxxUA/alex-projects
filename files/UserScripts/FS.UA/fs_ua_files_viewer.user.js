// ==UserScript==
// @name         FS.UA files viewer
// @version      3.0
// @description  FS.UA files (video, audio, games, etc...) viewer from non UA/RU coutries
// @author       Alexey
// @match        http://brb.to/*
// @match        http://fs.to/*
// @updateURL	 http://avasin.ml/UserScripts/FS.UA/fs_ua_files_viewer.user.js
// ==/UserScript==

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
	var $styles = $("<style/>").html(
		'.'+ this.modalClass +'{display: none;position: fixed;width: '+ this.contentWidth +'px;top: 50%;left: 50%;margin: -200px 0 0 -'+ this.contentWidth/2 +'px;z-index: 99999;background: #000;box-shadow: 0 0 4px 1px #00A08D;border-radius: 5px;}'+
		'.'+ this.modalClass +'.'+ this.activeClass +'{display: block;}'+
		'.'+ this.modalClass +' .'+ this.contentClass +'{width:100%; height: 100%;padding: 3%;box-sizing: border-box;text-align:center;}'+
		'.'+ this.modalClass +' video{width: auto;height: auto;max-width: 100%;max-height: 100%;}'+
		'.'+ this.bgClass +'{position: fixed;width: 100%;height: 100%;background: #000;z-index: 99999;top: 0;opacity: 0.5;display: none;}'+
		'.'+ this.bgClass +'.'+ this.activeClass +'{display: block;}'+
		'.'+ this.closeClass +'{position: absolute;right: 10px;top: 5px;color: #C9F2F9;font: normal 20px arial;cursor: pointer;}'
	);
	$('head').append($styles);
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
	this.internalProxyUrl = 'http://avasin.ml/proxy';
	this.externalProxyUrl = 'http://213.108.74.236:8081';  //Site with proxy list --->  http://www.proxynova.com/proxy-server-list/country-ua
	this.browserProxyUrl = 'http://www.anonym.pp.ua/browse.php?';
	this.isBrowserProxy = false;
	
	//Init entry params
	this.initParams(params);
	
	//Base init
	this.init();
}

Proxy.prototype.initParams = function(params){
	for(var param in params){
		if (params.hasOwnProperty(param))
			this[param] = params[param];
	}
}
Proxy.prototype.removeScriptFromString = function(string){
	return string.replace(/<.*?script.*?>.*?<\/.*?script.*?>/igm, '');
}
Proxy.prototype.cleanHref = function(href){
	var newHref = href.replace(/\/browse\.php\?u=/, '');
	newHref = newHref.replace(/http\:\/\/www\.anonym\.pp\.ua/, '');

	return newHref;
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
			console.error(err.statusText);
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
			console.error(err.statusText);
			if(onError) onError.call(that, err, dataObj);
		}
	});
}


//Greate FS instance and init()
var FS = new Proxy({
    mainFilesSel: '.b-files-folders',
    filesSel: '.b-filelist',
    folderSel: '.folder',
	subContentSel: '.filelist',
    disableClickSel: '.b-file-new__link-material, .material-video-quality',
	folderLinkSel: 'a[rel*=parent_id]',
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
	videoWidth: 900,
	isBrowserProxy: true,
	slideTime: 200,
	torrentImgUrl: 'https://maxcdn.icons8.com/Color/PNG/48/Logos/utorrent-48.png',
	rutorSearchUrl: 'http://rutor.org/search/',
    internalProxyUrl: 'http://avasin.ml/proxy',
	externalProxyUrl: 'http://94.45.65.94:3128',  //Site with proxy list --->  http://www.proxynova.com/proxy-server-list/country-ua
	fsDomain: 'http://fs.to',
    fsBasePath: location.pathname +'?ajax&',
    fsFilmBaseUrl: '',
    init: function(){
        var that = this;
        
		//Store base content url
        this.fsFilmBaseUrl = this.fsDomain + this.fsBasePath;

		this.registerEvents();
        this.addCustomStyles();
		this.showFirstFolder();
        this.showRutorLinks();
    },
    registerEvents: function(){
		//Show folder content
        $(document).on('click', this.folderSel +' '+ this.folderLinkSel +':not(.loaded)', $.proxy(this.showFolderContent, this));
        //Toggle content
		$(document).on('click', this.folderSel +' '+ this.folderLinkSel +'.loaded', $.proxy(this.contentToggle, this));
        //Play video
		$(document).on('click', '.'+ this.playBtnClass, $.proxy(this.showVideo, this));
		//Prevent click
        $(document).on('click', this.disableClickSel, function(e){
            e.preventDefault();
        });
    },
    addCustomStyles: function(){
        var $styles = $("<style/>").html(
			'body .m-file-new_type_video .b-file-new__link-material-filename {background: none; padding: 0; cursor: default;}'+
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
        $('head').append($styles);
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
		var cleanTitle = this.getCleanTitle(title);

		return '<a href="'+ this.rutorSearchUrl + cleanTitle +'" title="'+ title +'" class="rutor-poster-link" target="_blank">'+
					'<img src="'+ this.torrentImgUrl +'">'+
				'</a>';
	},
    getFolderHtml(id, onSuccess, onError){
        var that = this;

        that.proxyRequest({
			type: 'GET',
            url: that.fsFilmBaseUrl +'folder='+ id
        }, function(response, xhr, dataObj){
			if(onSuccess) onSuccess.call(that, response, xhr, dataObj);
		}, function(err, dataObj){
			if(onError) onError.call(that, err, dataObj);
		});
    },
	getCleanTitle: function(title){
		var newTitle = title.replace(/\n+|\t+|\v+/g, '');	//Remove "enters" and "tabs"

		return newTitle.replace(/\s+/g, '%20'); //Convert spaces
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
		
		//Do not run showing folder in case file's placeholder not found
        if($(that.mainFilesSel).length == 0)
            return;

		that.getFolderHtml('0', function(res, xhr, dataObj){
            var $mainHolder = $(that.mainFilesSel),
                $files = $(that.filesSel);

            that.contentPreparing(res, function($html){
                $files.append($html);
                $mainHolder.slideDown(that.slideTime);
            });
        });
	},
	showFolderContent: function(e){
        e.preventDefault();
		var that = this,
			$target = $(e.currentTarget),
            metadata = $target.metadata({type: "attr", name: "rel"}),
			folderId = metadata.parent_id,
			$folder = $target.closest(that.folderSel);
		
		that.getFolderHtml(folderId, function(res, xhr, dataObj){
			that.show($target, res);
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
						$$link.attr('href', that.cleanHref(redirectUrl));
						//console.log('Download URL was found! '+ that.cleanHref(redirectUrl));
					}

					//Callback functionality
					counter++;
					if(counter >= $links.length){
						//Finish to parse links
						callback();
					}
				}, function(err){
					$$link.addClass('error');
					console.log(err);

					//Callback functionality
					counter++;
					if(counter >= $links.length){
						//Finish to parse links
						callback();
					}
				});
			})($link);
		}
	}
});

//Greate Modal instance and init()
var modal = new Modal({
	contentWidth: FS.videoWidth
});