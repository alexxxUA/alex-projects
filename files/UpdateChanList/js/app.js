var Channel = {
	channels: {},
	availableFlags: [{
			string: 'hd',
			property: 'isHd'
		},{
			string: 'req',
			property: 'isReq'
	}],
	supportedTypes: ['m3u', 'xspf'],
	validList: {},
	genChannList: '',
	genFullChannList: '',
	searchChanelUrl: 'http://torrentstream.tv/search.php?keywords=',
	ajaxSearchChanelUrl: 'http://torrentstream.tv/ajax_search.php',
	report: {
		updatedList: [],
		failedList: [],
		reqFailedList: []
	},
	mainContextSel: '.playlist-main-context',
	_channelIframe: '<iframe class="channel-frame" src="<%= url %>" frameborder="0" scrolling="no"></iframe>',
	_pureM3uChannelItem: '\n#EXTINF:0,<%= name %>'+
					'\nacestream://<%= id %>',
	_pureXspfChannelItem: '\n<location>acestream://<%= id %></location>\n<title><%= name %></title>',
	_errorList: '<ul class="list-group">' +
				'<% _.each(list, function(item, index) { '+
					'var channelFullName = item.dName + Channel.getHdText(item.isHd);%>'+
					'<li class="list-group-item <% if(item.isReq){%>list-group-item-danger<% }else{ %>list-group-item-warning<% } %>">'+
						'<a class="show-channel-popup" href="<%= Channel.getSearchChannelUrl(channelFullName) %>" title="<%=channelFullName%>"><%= channelFullName %></a>'+
						'<span class="add-channel label label-info" data-failed-index="<%=index%>" title="Add channel to the generated list.">ADD</span>'+
						'<form class="add-channel-form">'+
							'<div class="input-group">'+
								'<span class="input-group-btn">'+
									'<input class="btn btn-primary add-cansel" type="button" value="Cansel">'+
								'</span>'+
								'<input class="add-channel-input form-control" data-channel="<%= channelFullName %>" type="text" placeholder="ID for \'<%= channelFullName %>\'" required>'+
								'<span class="input-group-btn">'+
									'<input class="btn btn-primary add-submit" type="submit" value="ADD">'+
								'</span>'+
							'</div>'+
						'</form>'+
					'</li>' +
				'<% }); %></ul>',
	_playlistDate: 'Playlist\'s date: <strong><%= lModified.toLocaleDateString() %> <%= lModified.toLocaleTimeString() %></strong>',
	_modal: '<div class="modal">'+
				'<div class="modal-close close">×</div>'+
				'<div class="modal-container">'+
					'<%= content %>'+
				'</div>'+
			'</div>',
	_errorModal: '<div class="alert alert-danger">'+
					'<strong>ERROR!</strong> <%= msg %>'+
				'</div>',
	init: function() {
		this.registerEvents();
		this.setChannelListConfig(channelList);
		this.updateContextWithData($(this.mainContextSel), {
			'playlist-formats': {
				data: this.supportedTypes.join(' & ')
			}
		});

		if (this.isFileApiSupport())
			$('body').addClass('upload');

	},
	registerEvents: function() {
		var that = this;

		$(document).on('change', '.valid-list', $.proxy(this.getList, this));
		$(document).on('click', '.save-list', $.proxy(this.saveAsFile, this));
		$(document).on('click', '.show-channel-popup', $.proxy(this.showChannel, this));
		$(document).on('click', '.add-channel', $.proxy(this.showAddForm, this));
		$(document).on('click', '.modal-close', $.proxy(this.hideModal, this));
		$(document).on('submit', '.add-channel-form', $.proxy(this.addChannelManually, this));
		$(document).on('click', '.add-cansel', $.proxy(this.hideAddForm, this));
		$(document).on('submit', '.get-playlist-form', $.proxy(this.getValidPlaylistFromUrl, this));
		//On file selected
		$(document).on('change', '.play-list', $.proxy(this.readFile, this));
	},
	storeValidList: function(name, playList, date){
		this.validList = {
			name: name,
			type: this.getFileType(name),
			list: playList,
			lModified: date
		};
	},
	resetData: function() {
		this.report = {
			failedList: [],
			updatedList: [],
			reqFailedList: []
		};
		this.genFullChannList = '';
		this.genChannList = '';
	},
	isFileApiSupport: function() {
		return window.File && window.FileList && window.FileReader;
	},
	isSupportedPlaylist: function(type){
		var supportedTypes = this.supportedTypes,
			isSupported = supportedTypes.indexOf(type) != -1 ? true : false;

		return isSupported;
	},
	readFile: function(e) {
		e.preventDefault();

		var that = this,
			input = e.currentTarget,
			file = input.files[0],
			reader = new FileReader();

		if( !this.onStartLoadPlaylist(file.name) )
			return;

		reader.addEventListener("load", function(event) {
			that.storeValidList(file.name, event.target.result, file.lastModifiedDate);
			that.getList();
		});
		reader.readAsText(file);
	},
	saveAsFile: function(e) {
		e.preventDefault();

		var blob = new Blob([this.genFullChannList], {
			type: "text/plain;charset=utf-8"
		});
		saveAs(blob, "TV_List.xspf");
	},
	addChannelManually: function(e){
		e.preventDefault();

		var $this = $(e.currentTarget),
			$input = $this.find('.add-channel-input');
			name = $input.attr('data-channel'),
			id = $input.val();

		this.addPureChannelItem(name, id);
		this.hideAddForm(e);
		this.resetData();
		this.getList();
	},
	addPureChannelItem: function(name, id){
		var template = this._pureM3uChannelItem;

		if(this.validList.type == 'xspf')
			template = this._pureXspfChannelItem;

		this.validList.list += _.template(template, {
			'name': name,
			'id': id
		});
	},
	setChannelListConfig: function(channelListObj) {
		for(var i=0; i < channelListObj.length; i++){
			var channel = channelListObj[i],
				flags = channel.flags ? channel.flags : '';

			$.extend(channel, this.getObjFromFlags(flags));
		}
		this.channels = channelListObj;
	},
	getFileType: function(playlistName){
		var playlist = playlistName.split('.'),
			playlistType = playlist[playlist.length-1];

		return playlistType.toLocaleLowerCase();
	},
	getHdText: function(isHd){
		return isHd ? ' HD' : '';
	},
	getEstimatedReadTime: function(string){
		var readSpeed = 600, //500 symbols per minute
			time = (string.length / 500 * 60).toFixed();

		return time;
	},
	getObjFromFlags: function(flagString) {
		var flags = flagString.split(' '),
			flagsObj = {},
			availableFlags = this.availableFlags;

		for(var i=0; i < availableFlags.length; i++)
			flagsObj[availableFlags[i].property] = flags.indexOf(availableFlags[i].string) != -1;

		return flagsObj;
	},
	getRegExp: function(channel, isReserve) {
		var isHd = channel.isHd ? '(?:hd|cee)' : '',
			reserve = isReserve ? '(?:.+резерв.+)' : '',
			regExp = null;

		if(this.validList.type == 'm3u')
			regExp = new RegExp('(?:EXTINF\:0,\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*' + reserve + '\\s*\\n*(?:[^acestream].*\n*)*)(?:acestream://)(.*)', 'im');
		else if(this.validList.type == 'xspf')
			regExp = new RegExp('(?:acestream://)(.*?)(?:</location>\\s*\\n*\\s*<title>\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*' + reserve + '\\s*</title>)', 'im');

		return regExp;
	},
	getChannelId: function(channelName){
		var chanId = this.validList.list.match(this.getRegExp(channelName)),
		chanId = chanId ? chanId : this.validList.list.match(this.getRegExp(channelName, true)); //Check for резерв channel

		return chanId && chanId[1] ? chanId[1] : false;
	},
	getCustomList: function() {
		var that = this;

		for (var i = 0; i < that.channels.length; i++) {
			var curChannel = that.channels[i],
				channelId = that.getChannelId(curChannel);

			if (channelId) {
				that.genChannList += that.formChannItem(curChannel, channelId);
				that.report.updatedList.push(curChannel);
			} else {
				that.report.failedList.push(curChannel);
				if(curChannel.isReq)
					that.report.reqFailedList.push(curChannel);
			}
		}
		that.genFullChannList = '<?xml version="1.0" encoding="UTF-8"?>' +
			'\n<playlist version="1" xmlns="http://xspf.org/ns/0/">' +
			'\n\t<trackList>' + this.genChannList + '\n\t</trackList>' +
			'\n</playlist>';
	},
	getValidPlaylistFromUrl: function(e){
		e.preventDefault();

		var that = this,
			form = e.currentTarget,
			data = { url: form.elements.url.value };

		if( !this.onStartLoadPlaylist(data.url) )
			return;

		that.proxyRequest(data, function(res){
			that.storeValidList(data.url, res.body, new Date(res.lModified));
			that.getList();
		},
		function(err){
            var isNotFound = err.responseText == data.url,
                errMsg = isNotFound ? 'Playlist not found at: '+ data.url +'.' : 'Error in geting playlist: ' + data.url +'.<br> Server is not responding.';
			
            that.showErrorModal(errMsg);
		});
	},
	getSearchChannelUrl: function(channelName) {
		return this.searchChanelUrl + encodeURIComponent(channelName);
	},
	getChannelPlayerUrl: function(channelName, callBack){
		var that = this,
			data = {
				url: this.ajaxSearchChanelUrl,
				type: 'POST',
				data: {
					queryString: channelName
				}
			};

		that.proxyRequest(data,
			function(response){
				var channelUrl = $(response.body).find('a:first').attr('href');

				if(typeof channelUrl == 'undefined'){
					callBack.call(that, false);
					return;
				}

				that.proxyRequest({url: channelUrl},
					function(response){
						var $res = $(response.body),
							$player = $res.find('#Playerholder iframe'),
							url = $player.attr('src');

						callBack.call(that, url);
					},
					function(err){
						callBack.call(that, false);
					}
				);
			},
			function(err){
				callBack.call(that, false);
			}
		);
	},
	formChannItem: function(channel, newChannelId) {
		return '\n\t\t<track>' +
				'\n\t\t\t<title>' + channel.dName + this.getHdText(channel.isHd) + '</title>' +
				'\n\t\t\t<location>' + newChannelId.replace('\n', '') + '</location>' +
				'\n\t\t</track>';
	},
	updateContextWithData: function($context, dataObj) {
		var $params = $context.find('[data-name]');

		$params.each(function() {
			var $this = $(this),
				dName = $this.attr('data-name');
			if (typeof dataObj[dName] !== 'undefined') {
				if ($this[0].tagName == 'INPUT' || $this[0].tagName == 'TEXTAREA') {
					$this.val(dataObj[dName].data);
				} else {
					if (typeof dataObj[dName].template != 'undefined')
						$this.html(_.template(dataObj[dName].template, dataObj[dName].data));
					else
						$this.text(dataObj[dName].data);
				}
			}
		});
	},
	showResult: function() {
		var $context = $(this.mainContextSel);

		$context.addClass('result');
		if(this.report.failedList.length > 0)
			$context.addClass('result-failed');
	},
	showModal: function(content, autocloseTime){
		var that = this,
			$modal = $(_.template(this._modal, {'content': content})),
			$modalHolder = $('.modal-holder'),
			offsetTop = window.scrollY,
			screenHeight = window.innerHeight,
			styles = {};

		$modalHolder.append($modal);

		var modalWidth = $modal.outerWidth(),
			modalHeight = $modal.outerHeight();

		styles.top = ((screenHeight-modalHeight)/2)+offsetTop;
		styles.top = styles.top < 5 ? 5 : styles.top;
		styles.left = '50%';
		styles['margin-left'] = -modalWidth/2;
		styles.visibility = 'visible';
		styles.display = 'block';

		$modal.css(styles);
		if (autocloseTime){
			setTimeout(function(){
				that.hideModal(null, $modal);
			}, autocloseTime * 1000);
		}
	},
	showChannel: function(e){
		e.preventDefault();
		var that = this,
			$this = $(e.currentTarget),
			channelName = $this.text(),
			modalContent = '';

		this.getChannelPlayerUrl(channelName, function(url){
			if(url){
				modalContent = _.template(this._channelIframe, {'url': url});
				that.showModal(modalContent);
				that.showAddForm(e);
			}
			else{
				window.open(that.getSearchChannelUrl(channelName) , '_blank');
			}
		});
	},
	showAddForm: function(e){
		var $this = $(e.currentTarget),
			$addForm = $this.siblings('.add-channel-form');

		$addForm.slideDown();
	},
	showErrorModal: function(msg){
		var errorMsg = _.template(this._errorModal, {msg: msg});
		this.showModal(errorMsg, this.getEstimatedReadTime(msg));
	},
	hideResult: function() {
		var $context = $(this.mainContextSel);

		$context.removeClass('result result-failed');
	},
	hideModal: function(e, $modal){
		if(e)
			$modal = $(e.currentTarget).closest('.modal');

		$modal.fadeOut('fast', function(){
			$modal.remove();
		});
	},
	hideAddForm: function(e){
		e.preventDefault();
		var $this = $(e.currentTarget),
			$addForm = $this.closest('.add-channel-form');

		$addForm.slideUp();
	},
	proxyRequest: function(dataObj, onSuccess, onError){
		var that = this;

		$.ajax({
			type: 'GET',
			url: location.protocol +'//'+ location.host +'/proxy',
			data: $.param(dataObj),
			dataType: 'html',
			success: function(response){
				var response = JSON.parse(response);
				if(onSuccess) onSuccess.call(that, response);
			},
			error: function(err){
				if(onError) onError.call(that, err);
			}
		});
	},
	onStartLoadPlaylist: function(fileName){
		var fileType = this.getFileType(fileName),
			isSupported = this.isSupportedPlaylist(fileType),
			fileInput = $('.play-list')[0];

		this.hideResult();
		this.resetData();
		fileInput.value = null;

		if(!isSupported)
			this.showErrorModal('Playlist with format: "'+ fileType +'" is unsupported.');

		return isSupported;
	},
	getList: function() {
		var updateData = {},
			$form = $(this.mainContextSel);

		this.getCustomList();
		updateData = {
			'playlist-date': {
				data: {
					lModified: this.validList.lModified
				},
				template: this._playlistDate
			},
			'generated-list': {
				data: this.genFullChannList
			},
			'failed-count': {
				data: this.report.failedList.length
			},
			'updated-count': {
				data: this.report.updatedList.length
			},
			'req-failed-count': {
				data: this.report.reqFailedList.length
			},
			'failed-list': {
				data: {
					list: this.report.failedList
				},
				template: this._errorList
			}
		}
		this.updateContextWithData($form, updateData);
		this.showResult();
	}
}
Channel.init();