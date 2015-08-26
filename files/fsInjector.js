// ==UserScript==
// @name         FS.UA proxy video viewer
// @namespace    
// @version      2
// @description  FS.UA proxy video viewer from non UA coutries
// @author       Alexey
// @match        http://brb.to/*
// @downloadURL	 http://192.168.44.147:8888/fsInjector.js
// @grant        none
// ==/UserScript==

var FS = {
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
	slideTime: 200,
    internalProxyUrl: 'http://192.168.0.135:8888/proxy',
	externalProxyUrl: 'http://213.108.74.236:8081',
    browserProxyUrl: 'http://www.anonym.pp.ua/browse.php?',
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
    getFolderHtml(id, callback){
        var that = this;

        that.proxyRequest({
            type: 'GET',
			proxy: that.externalProxyUrl,
            url: that.fsFilmBaseUrl +'folder='+ id
        }, function(res, xhr, dataObj){
            callback(res, xhr, dataObj);
        });
    },
    cleanResponse: function(html){
        var $htmlWrap = $('<div/>').html(html);
        
        $htmlWrap.find('#include').remove();
        $htmlWrap.find('style').remove();
        
        return $htmlWrap.html();
    },
    getURLParameter: function(url, name) {
		return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
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
	showContent: function($folderLink){
		var $content = $folderLink.closest(this.folderSel).find(this.subContentSel);

		$folderLink.addClass('loaded');
		$content.slideDown(this.slideTime);			
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
				//Finish to parse links
				console.log('Finish parsing links!');
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
				oldUrl = $link.attr('href');
			
			(function($$link){
				that.proxyRequest({
					type: 'GET',
					proxy: that.externalProxyUrl,
					url: that.fsDomain + oldUrl
				}, function(res, xhr, dataObj){
					var redirectUrl = xhr.getResponseHeader('Redirect-To');

					if(redirectUrl !== null && redirectUrl !== 'undefined'){
						$$link.attr('href', redirectUrl);
						console.log('Download URL was found! '+ redirectUrl);
					}
					else{
						$$link.addClass('error');
						console.log('Download url for link not found!');
					}

					//Callback functionality
					counter++;
					if(counter >= $links.length)
						callback();
				}, function(err){
					console.log(err);
					//Callback functionality
					counter++;
					if(counter >= $links.length)
						callback();
				});
			})($link);
		}
	},
    /*
	@dataOgj: {
		type: 'GET'/'POST', 	-req
		url: '', 				-req
		data: '',
		isCookies: true/false
	}	
	*/
	proxyRequest: function(dataObj, onSuccess, onError){
		var that = this;

		jQuery.ajax({
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
}

FS.init();