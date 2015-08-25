// ==UserScript==
// @name         FS.UA proxy video viewer
// @namespace    http://your.homepage/
// @version      0.1
// @description  FS.UA proxy video viewer from non UA coutries
// @author       You
// @match        http://brb.to/*
// @grant        none
// ==/UserScript==
debugger;

var FS = {
    mainFilesSel: '.b-files-folders',
    filesSel: '.b-filelist',
    folderSel: '.folder',
	folderLinkSel: 'a[rel*=parent_id]',
    proxyUrl: 'http://192.168.44.147:8888/proxy',
    uaProxyUrl: 'http://www.anonym.pp.ua/browse.php?',
    fsFilmBaseUrl: 'http://fs.to'+ location.pathname +'?ajax&',
    init: function(){
        var that = this;
		
		that.registerEvents();

        that.getFolderHtml('0', function(res, xhr, dataObj){
            var redirectUrl = xhr.getResponseHeader('Redirect-To'),
                $mainHolder = $(that.mainFilesSel),
                $files = $(that.filesSel);

            if(redirectUrl !== null && redirectUrl !== 'undefined'){
                var path =  that.getURLParameter(redirectUrl, 'u');
                $files.html(path);
            }
            else{
                $files.html(that.getCleanDom(res));
            }
            $mainHolder.css('display', 'block');
        });
    },
    registerEvents: function(){
        $(document).on('click', this.folderSel +' '+ this.folderLinkSel, $.proxy(this.showFolderContent, this));
    },
    getFolderHtml(id, callback){
        var that = this;

        that.proxyRequest({
            type: 'GET',
            url: that.uaProxyUrl,
            isCookies: true,
            data: {
                'u': that.fsFilmBaseUrl +'folder='+ id
            }
        }, function(res, xhr, dataObj){
            callback(res, xhr, dataObj);
        });
    },
    getCleanDom: function(html){
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
        e.stopPropagation();
		var that = this,
			$target = $(e.currentTarget),
            metadata = $target.metadata({type: "attr", name: "rel"}),
			folderId = metadata.parent_id,
			$folder = $target.closest(that.folderSel);
		
		that.getFolderHtml(folderId, function(res, xhr, dataObj){
			$folder.append(that.getCleanDom(res))
		});
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
        
        dataObj['_'] = (new Date()).getTime();
        
        /*
        aja().
        .url(this.proxyUrl)
        .type('GET')
        .data($.param(dataObj))
        .on('success', function(response, status, xhr){
            if(onSuccess) onSuccess.call(that, response, xhr, dataObj);
		})
        .on('error', function(err){
            console.error(err.statusText);
            if(onError) onError.call(that, err, dataObj);
        });
        */
		$.ajax({
		type: 'GET',
			url: this.proxyUrl,
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