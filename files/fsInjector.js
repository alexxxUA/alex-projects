// ==UserScript==
// @name         FS.UA proxy video viewer
// @version      1.0
// @description  FS.UA proxy video viewer from non UA coutries
// @author       Alexey
// @match        http://brb.to/*
// @match        http://fs.to/*
// @downloadURL	 http://avasin.ml/fsInjector.js
// ==/UserScript==

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

var FS = new Proxy({
    styles: 'body .m-file-new_type_video .b-file-new__link-material-filename {background: none; padding: 0; cursor: default;}'+
			'body .b-files-folders .b-filelist .material-video-quality {background-color: inherit; color: inherit; cursor: default;}'+
			'body .b-filelist .folder-filelist, .filelist m-current {display: none}'+
			'body .b-filelist .filelist .filelist {margin-left: -7px; padding-left: 0;}'+
			'body .b-filelist .filelist li.b-file-new {margin-left: 7px;}'+
			'body .b-file-new__link-material-download.error, body .error .b-file-new__link-material-size {color: #FF5757;}',
    mainFilesSel: '.b-files-folders',
    filesSel: '.b-filelist',
    folderSel: '.folder',
	subContentSel: '.filelist',
    disableClickSel: '.b-file-new__link-material, .material-video-quality',
	folderLinkSel: 'a[rel*=parent_id]',
    downloadLinkSel: '.b-file-new__link-material-download',
	isBrowserProxy: true,
	slideTime: 200,
    internalProxyUrl: 'http://192.168.0.156:8888/proxy',
	externalProxyUrl: 'http://94.45.65.94:3128',  //Site with proxy list --->  http://www.proxynova.com/proxy-server-list/country-ua
	fsDomain: 'http://fs.to',
    fsBasePath: location.pathname +'?ajax&',
    fsFilmBaseUrl: '',
    init: function(){
        var that = this;
        
		//Store base content url
        that.fsFilmBaseUrl = that.fsDomain + that.fsBasePath;
		
        //Do not run script in case files placeholder not found
        if($(that.mainFilesSel).length == 0)
            return;

		that.registerEvents();
        that.addCustomStyles();

        that.getFolderHtml('0', function(res, xhr, dataObj){
            var $mainHolder = $(that.mainFilesSel),
                $files = $(that.filesSel);

            that.contentPreparing(res, function($html){
                $files.append($html);
                $mainHolder.slideDown(that.slideTime);
            });
        });
    },
    registerEvents: function(){
		//Show folder content
        $(document).on('click', this.folderSel +' '+ this.folderLinkSel +':not(.loaded)', $.proxy(this.showFolderContent, this));
        //Toggle content
		$(document).on('click', this.folderSel +' '+ this.folderLinkSel +'.loaded', $.proxy(this.contentToggle, this));
        //Prevent click
        $(document).on('click', this.disableClickSel, function(e){
            e.preventDefault();
        });
    },
    addCustomStyles: function(){
        var $styles = $("<style/>").html(this.styles);
        $('head').append($styles);
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
	contentPreparing: function(html, callback){
		var $html = $(html),
            $downloadLinks = $html.find(this.downloadLinkSel),
			$subContent = $html.find(this.subContentSel),
			$folderLink = $html.find(this.folderLinkSel);

        //Show content for loaded subfolder
		if($subContent.length > 0){
			this.showContent($folderLink);
		}
        
		//Parse download links
        if($downloadLinks.length > 0){
			this.parseDownloads($downloadLinks, function(){
				callback($html);
			});
		}
		else{
			callback($html);
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