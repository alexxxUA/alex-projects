var needle = require('needle'),
	$url = require('url'),
	path = require('path'),
	fs = require('fs'),
	prependFile = require('prepend-file'),
	_ = require('underscore'),
	cheerio = require('cheerio'),
	mkdirp = require('mkdirp'),
	cf = require('./../config/config.js'),
	proxy = require('./proxy.js'),
	email = require('./sendMail.js'),
	channels1 = require('./../files/UpdateChanList/js/channelList.js').channelList,
	channels2 = require('./../config/channelList2.js').channelList;

function Channel(params){
	this.oneDay = cf.oneDay;
	this.channels = [];
	this.report = {
		failedList: [],
		updatedList: [],
		reqFailedList: []
	};
	this.tempRestartCount = 0;
	this.isPlaylistFailed = false;
	this.backUpGen = null;
	this.channelCounter = 0;
	this.availableFlags = [{
			string: 'hd',
			property: 'isHd'
		},{
			string: 'req',
			property: 'isReq'
		},{
			string: 'cod',
			property: 'isCoded'
	}];
	this.validList = '';
	/* Is getting channel's html through proxy */
	this.isProxy = cf.playlistGenProxy;
	this.idMinLength = 10;
	/**
	 * Used for defining if playlist generates once in specified time, or in intervals
	 * @Value true -> Generate playlist in specified time
	 * @Value false -> Generate in intervals
	 */
	this.isGenerateInTime = true;
	/**
	 * Used for using delay when getting channel's html per schedule update
	 * @Value in seconds
	 */
	this.scheduleGenDelay = 62;
	/**
	 * Used for using delay when getting channel's html per forced update
	 * @Value in seconds
	 */
	this.forceGenDelay = 7;
	/**
	 * How many times playlist will be generated per 24h after first generate time
	 * @Value int
	 */
	this.generateCountPer24h = 1;
	/**
	 * How many times playlist generation will be restarted if failed
	 * @Value int
	 */
	this.maxRestartCount = 5;
	
	this.maxRestartCountPerChannel = 1;
	/**
	 * Delay in restartin generation of playlist
	 * @Value in minutes
	 */
	this.restartDelay = 10;
	/**
	 * Generate in specified time (used if @isGenerateInTime = true)
	 * @Value in format: 4:00 (24h format)
	 */
	this.generateTime = '6:00';
	this.timeZone = 2;

	this.proxyUrl = 'http://smenip.ru/proxi/browse.php?';
	this.playerDomain = 'http://1ttv.net';
	this.playerDomainProxy = 'http://gf2hi5ronzsxi.nblz.ru'; //http://gf2hi5ronzsxi.nblz.ru  |  http://1ttv.net

	this.emailSubj = 'Playlist generator notifier';
	this.emailRecipient = 'aluaex@gmail.com';
	
	this.outputPath = cf.plaulistOutputPath;
	this.playListName = 'TV_List.xspf';
	this.logName = 'log.txt';
	this._report = _.template(
		'Playlist updated.'+
		'\nUpdated: <%= updatedList.length %>'+
		'<% if(reqFailedList.length){ %>'+
			'\nRequired failed: <%= reqFailedList.length %>'+
		'<% } if(failedList.length){ %>'+
			'\nFailed: <%= failedList.length %>'+
			'\nFailed channel list:'+
			'<% _.each(failedList, function(item, index) { '+
				'var channelFullName = item.dName + (item.isHd ? " HD" : ""); %>'+
				'\n  <%= index+1 %>. <%= channelFullName %> '+
				'<%= item.isReq ? "(Reg)" : "" %> - <%= item.errMsg.join("|") %>'+
			'<% }); %>'+
		'<% } %>'
	);

	//Init params
	for(var param in params){
		if (params.hasOwnProperty(param))
			this[param] = params[param];
	}
}
Channel.prototype = {
	playlisGeneratorInstanses: [],
	forceGeneratePlaylists: function(){
		for(var i=0; i < this.playlisGeneratorInstanses.length; i++){
			var instance = this.playlisGeneratorInstanses[i];
			instance.func.call(instance.that, true);
		}
	},
	logInfo: function(msg){
		prependFile(this.logPath, '[INFO - '+ this.getformatedDate(new Date) +'] '+ msg +'\n\n');
	},
	logErr: function(msg){
		prependFile(this.logPath, '[ERROR - '+ this.getformatedDate(new Date) +'] '+ msg +'\n\n');
	},
	init: function(channelsArray, callback, backUpGen) {
		this.generateInterval = 60 * (24/this.generateCountPer24h) * 60000; //Value in minutes
		this.backUpGen = backUpGen;
		this.playlistPath = path.join(filesP, this.outputPath + '/'+ this.playListName);
		this.logPath = path.join(filesP, this.outputPath + '/'+ this.logName);
		
		if(typeof this.initParams == 'function')
			this.initParams();
		if(typeof callback == 'function')
			this.callback = callback;
		this.createFolder(this.outputPath);
		this.setChannels(channelsArray);
		this.initChannelsObject();
		this.storeGenerateSpentTime();
		this.genValidPlaylist(true);
		this.storeGenerator();

		//Scheduler for updating playlist
		this.setTimeoutCall(this.getNextTimeOffset());
	},
	initChannelsObject: function(){
		this.updateChannelsObject(function(channel){
			this.updateFlags(channel);
			this.decodeChannelNames(channel);
		});
		this.resetChannelsObject();
	},
	extendObj: function(target) {
		var sources = [].slice.call(arguments, 1);

		sources.forEach(function (source) {
			for (var prop in source) {
				target[prop] = source[prop];
			}
		});
		return target;
	},
	/**
	 * Reset data before starting generate
	 * @param {boolean} isForce | indicate is generation forced or no
	 */
	resetData: function() {
		this.report = {
			failedList: [],
			updatedList: [],
			reqFailedList: []
		};
		this.channelCounter = 0;
		this.isPlaylistFailed = false;
		this.resetChannelsObject();
		delete this.callback;
	},
	resetChannelsObject: function(){
		this.updateChannelsObject(function(channel){
			channel.failedCount = 0;
			channel.errMsg = [];
		});
	},
	prepareData: function(isForce){
		this.genDelay = (isForce ? this.forceGenDelay : this.scheduleGenDelay) * 1000;
	},
	createFolder: function(folderPath){
		var fullFolderPath =  path.join(filesP, folderPath);

		mkdirp(fullFolderPath);
	},
	storeGenerator: function(){
		//Push playlist generator instance to global prototype property for further regeneration
		this.playlisGeneratorInstanses.push({
			that: this,
			func: this.genValidPlaylist
		});
	},
	setTimeoutCall: function(time){
		var that = this;

		setTimeout(function(){
			that.genValidPlaylist();

			that.setTimeoutCall(that.generateInterval);
		}, time);
	},
	setChannels: function(entryChannelArray){
		for(var i=0; i < entryChannelArray.length; i++){
			var channelListItem = this.getArrayOrObjCopy(entryChannelArray[i]);
			this.channels = this.channels.concat(channelListItem);
		}
	},
	updateChannelsObject: function(callback) {
		for(var i=0; i < this.channels.length; i++)
			callback.call(this, this.channels[i]);
	},
	updateFlags: function(channel){
		var flags = channel.flags ? channel.flags : '';

		this.extendObj(channel, this.getObjFromFlags(flags));
	},
	decodeChannelNames: function(channel){
		if(channel.isCoded){
			channel.sName = new Buffer(channel.sName, 'base64');
			channel.dName = new Buffer(channel.dName, 'base64');
		}
	},
	getNextTimeOffset: function(){
		var nextTimeOffset = (this.isGenerateInTime ? this.getOffsetTillTime(this.generateTime) : this.getOffsetNextHour()) - this.generationSpentTime;
		return nextTimeOffset > 0 ? nextTimeOffset : 0;
	},
	getDom: function(html){
		return	cheerio.load(html, {decodeEntities: false}, { features: { QuerySelector: true }});
	},
	getTimeOnZone: function(time, tZone){
		return new Date(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate(),  time.getUTCHours() + tZone, time.getUTCMinutes(), time.getUTCSeconds());
	},
	getNowOnTimeZone: function(){
		return this.getTimeOnZone(new Date(), this.timeZone);
	},
	getOffsetNextHour: function(){
		var now = new Date(),
			nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()+1, 0, 0, 0);

		return nextHour - now;
	},
	/**
	 * Getting offset time till time
	 * @param   {string} time | '4:00' or '18:30'
	 * @returns {number} miliseconds
	 */
	getOffsetTillTime: function(time){
		var now = this.getNowOnTimeZone(),
			timeArray = time.split(':'),
			tillHrs = parseInt(timeArray[0]),
			tillMins = parseInt(timeArray[1]),
			nextOrCurDay = now,
			tillTime = 0;

		if(now.getHours() > tillHrs || now.getHours() == tillHrs && now.getMinutes() > tillMins)
			nextOrCurDay = new Date(now.getTime() + this.oneDay);

		tillTime = new Date(nextOrCurDay.getFullYear(), nextOrCurDay.getMonth(), nextOrCurDay.getDate(), tillHrs, tillMins, 0, 0);

		return tillTime - now;
	},
	getformatedDate: function(date){
		var now = this.getTimeOnZone(date, this.timeZone);

		return now.getDate() +'.'+ (now.getMonth()+1) +'.'+ now.getFullYear() +' '+ now.getHours() +':'+ ((now.getMinutes() < 10 ? '0' : '') + now.getMinutes());
	},
	genValidPlaylist: function(isForce){
		var that = this;

		this.prepareData(isForce);
		
		//Save playlist page for backup
		if(this.backUpGen)
			this.backUpGen.getValidPlaylist();

		//Gen playlist
		this.getValidPlaylist(function(){
			that.getList();
		});
	},
	getValidPlaylist: function(callback){
		var that = this;

		needle.request('GET', that.playlistUrl, null, {}, function(err, resp) {
			if (err || resp.statusCode !== 200){
				that.isPlaylistFailed = true;
				that.logErr('Error in getting valid playlist!');
				that.playlistFinished();
				return;
			}
			that.storeValidList(resp);

			if(callback)
				callback(resp, err);			
		});
	},
	getHdText: function(isHd){
		return isHd ? ' HD' : '';
	},
	getFullChannelName: function(channel){
		return channel.dName + this.getHdText(channel.isHd);
	},
	getObjFromFlags: function(flagString) {
		var flags = flagString.split(' '),
			flagsObj = {},
			availableFlags = this.availableFlags;

		for(var i=0; i < availableFlags.length; i++)
			flagsObj[availableFlags[i].property] = flags.indexOf(availableFlags[i].string) != -1;

		return flagsObj;
	},
	getIdFromFrame: function(cUrl, channel, callback, _that){
		var _that = _that || this,
			that = this,
			newChanUrl = this.getUpdatedPlayerUrl(cUrl),
			reqParams = {
				url: this.proxyUrl,
				isCookies: 'true',
				data: {b: 5, u: newChanUrl}
			};

		function returnId(err, resp){
			if (err || resp.statusCode !== 200){
				_that.failed(channel, 'channel`s page/frame not available');
				return;
			}
			var regExp = new RegExp('(?:this\.loadPlayer\\((?:"|\'))(.+)?(?:"|\')', 'im'),
				chanId = resp.body.match(regExp);

			chanId = chanId && chanId[1] ? chanId[1] : false;
			
			if(!chanId)
				_that.failed(channel, 'id not found on the page/frame');
			else
				callback(chanId);
		}

		if(this.isProxy)
			proxy.makeProxyRequest(reqParams, null, null, returnId);
		else
			needle.request('GET', newChanUrl, null, {}, returnId);
	},
	printReport: function(){
		if(this.isPlaylistFailed)
			this.logErr('Generation of playlist failed');
		else
			this.logInfo( this._report(this.report) );
	},
	getList: function() {
		var that = this;

		for (var i = 0; i < that.channels.length; i++) {
			var curChannel = that.channels[i];

			(function(channel, j){
				setTimeout(function(){
					that.getChannelId(channel, function(ID){
						that.storeChannelItem(channel, ID)
					});
				}, j * that.genDelay);
			})(curChannel, i);
		}
	},
	getUpdatedPlayerUrl: function(urlPath){
		return (this.isProxy ? this.playerDomainProxy : this.playerDomain) + $url.parse(urlPath).path;
	},
	getArrayOrObjCopy: function(array){
		return JSON.parse(JSON.stringify(array));
	},
	formFullChannList: function(){
		var channels = '';

		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			if(channel.id && channel.id.length >= this.idMinLength){
				channels += this.formChannItem(channel);
			}
			else if(channel.id && channel.id.length < this.idMinLength){
				channel.errMsg.push('id shorter than '+ this.idMinLength +' symbols');
				this.pushToFailedList(channel);
			}
		}

		return '<?xml version="1.0" encoding="UTF-8"?>' +
				'\n<playlist version="1" xmlns="http://xspf.org/ns/0/">' +
				'\n\t<title>TV playlist: '+ this.getformatedDate(new Date()) +'; failed channels: '+ this.report.failedList.length +'</title>' +
				'\n\t<creator>Vasin Oleksiy</creator>' +
				'\n\t<trackList>' + channels + '\n\t</trackList>' +
				'\n</playlist>';
	},
	formChannItem: function(channel) {
		return '\n\t\t<track>' +
				'\n\t\t\t<title>' + this.getFullChannelName(channel) + '</title>' +
				'\n\t\t\t<location>' + channel.id + '</location>' +
				'\n\t\t</track>';
	},
	sendPlaylistGenFailedEmail: function(){
		var sbj = this.emailSubj +' ['+ this.getformatedDate(new Date) +']',
			msg = '<h2>Generation of playlist "'+ this.playListName +'" has been failed.</h2>';

		email.sendMail(sbj, this.emailRecipient, msg);
	},
	isAbleToRestartChan: function(channel){
		return typeof this.backUpGen != 'undefined' 
				&& this.backUpGen.validList.length 
				&& channel.failedCount < this.maxRestartCountPerChannel;
	},
	storeGenerateSpentTime: function(){
		this.generationSpentTime = this.channels.length * this.scheduleGenDelay * 1000;
	},
	storeChannelItem: function(channel, ID){
		this.channelCounter++

		channel.id = ID.replace('\n', '');

		this.report.updatedList.push(channel);

		//Finish playlist
		if(this.channelCounter >= this.channels.length)
			this.finishPlaylist();
	},
	savePlaylist: function(playlist){
		fs.writeFile(this.playlistPath, playlist);
	},
	failed: function(channel, errMsg){
		var that = this;
		
		channel.errMsg.push(errMsg);

		//Restart gen. of channel item using backup generator
		if( this.isAbleToRestartChan(channel) ){
			setTimeout(function(){
				channel.failedCount++;
				that.backUpGen.getChannelId(channel, function(ID){
					that.storeChannelItem(channel, ID)
				}, that);
			}, this.genDelay);
			return;
		}

		this.channelCounter++
		this.pushToFailedList(channel);

		//Finish playlist
		if(this.channelCounter >= this.channels.length)
			this.finishPlaylist();
	},
	pushToFailedList: function(channel){
		channel.id = false;
		this.report.failedList.push(channel);
		if(channel.isReq)
			this.report.reqFailedList.push(channel);
	},
	finishPlaylist: function(){
		this.isPlaylistFailed = this.channels.length == this.report.failedList.length;
		this.savePlaylist(this.formFullChannList());
		this.printReport();
		this.playlistFinished();
	},
	playlistFinished: function(){
		if(typeof this.callback == 'function') this.callback();
		
		if(this.isPlaylistFailed)
			this.playlistFailed();
		else
			this.tempRestartCount = 0;

		this.resetData();
	},
	playlistFailed: function(){
		var that = this;

		if(this.tempRestartCount < this.maxRestartCount){
			setTimeout(function(){
				that.genValidPlaylist();
			}, this.restartDelay * 1000 * 60);

			this.tempRestartCount++
		}
		else{
			this.sendPlaylistGenFailedEmail();
			this.tempRestartCount = 0;
		}
	}
}

var channelTorrentStream = new Channel({
	playListName: 'TV_List_torrent_stream.xspf',
	logName: 'log_torrent_stream.txt',
	playlistUrl: 'http://torrentstream.tv/browse-vse-kanali-tv-videos-1-date.html',
	storeValidList: function(resp){
		this.validList = resp.body;
	},
	getChannelPage: function(channel){
		var isHd = channel.isHd ? '(?:hd|cee)' : '',
			regExp = new RegExp('(?:<a.*?href="(.*?)".*?>)(?:\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*<\/a>)', 'im'),
			chanPage = this.validList.match(regExp);

		return chanPage && chanPage[1] ? chanPage[1] : false;
	},
	getPlayerUrl: function(channel, callback, _that){
		var _that = _that || this,
			that = this,
			channelPage = that.getChannelPage(channel);

		if(!channelPage){
			_that.failed(channel, 'not found on the playlist page');
			return;
		}

		needle.request('GET', channelPage, null, {}, function(err, resp) {
			if (err || resp.statusCode !== 200){
				_that.failed(channel, 'error in getting page for channel');
				return;
			}
			var $ = that.getDom(resp.body),
				channelUrl = $('#Playerholder iframe').attr('src');

            if(channelUrl)
                callback(channelUrl);
            else
                _that.failed(channel, 'players src not found in frame on page');
		});
	},
	getChannelId: function(channel, callback, _that){
		var _that = _that || this,
			that = this;

		that.getPlayerUrl(channel, function(url){
			that.getIdFromFrame(url, channel, function(chanId){
				callback(chanId);
			}, _that);
		}, _that);
	}
});

var channelTuchka = new Channel({
	generateTime: '6:20',
	playListName: 'TV_List_tuchka.xspf',
	logName: 'log_tuchka.txt',
	playlistUrl: 'http://tuchkatv.ru/player.html',
	playerUrlPath: '/iframe.php?site=873&channel=',
	storeValidList: function(resp){
		var $ = this.getDom(resp.body),
			playlist = $('#sidebar select').html();

		this.validList = playlist;
	},
	getChannelNumb: function(channel){
		var isHd = channel.isHd ? '(?:hd|cee)' : '',
			regExp = new RegExp('(?:<option\\s+value="([0-9]*)"\\s*>)(?:\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*<\/option>)', 'im'),
			chanNum = this.validList.match(regExp);

		return chanNum && chanNum[1] ? chanNum[1] : false;
	},
	getPlayerUrl: function(chanNum){
		return this.playerUrlPath + chanNum;
	},
	getChannelId: function(channel, callback, _that){
		var _that = _that || this,
			chanNum = this.getChannelNumb(channel),
			chanUrl = this.getPlayerUrl(chanNum);

		if(!chanNum){
			_that.failed(channel, 'number not found on playlist page');
			return;
		}

		this.getIdFromFrame(chanUrl, channel, function(chanId){
			callback(chanId);
		}, _that);
	}
});
var channelChangeTracker = new Channel({
	firstChannelId: false,
	isGenerateInTime: false,
	generateCountPer24h: 24,
	logName: 'log_channelChecker.txt',
	playlistUrl: 'http://tuchkatv.ru/player.html',
	playerUrlPath: '/iframe.php?site=873&channel=',
	storeValidList: function(resp){
		var $ = this.getDom(resp.body),
			playlist = $('#sidebar select').html();

		this.validList = playlist;
	},
	getChannelNumb: function(channel){
		var isHd = channel.isHd ? '(?:hd|cee)' : '',
			regExp = new RegExp('(?:<option\\s+value="([0-9]*)"\\s*>)(?:\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*<\/option>)', 'im'),
			chanNum = this.validList.match(regExp);

		return chanNum && chanNum[1] ? chanNum[1] : false;
	},
	getPlayerUrl: function(chanNum){
		return this.playerUrlPath + chanNum;
	},
	getChannelId: function(channel, callback){
		var that = this,
			chanNum = this.getChannelNumb(channel),
			chanUrl = this.getPlayerUrl(chanNum);

		if(!chanNum){
			this.failed(channel, 'number not found on playlist page');
			return;
		}

		this.getIdFromFrame(chanUrl, channel, function(chanId){
			callback(chanId);
		});
	},
	getChannelChangeEmailContent: function(channel){
		return '<h2>Channel\'s id has been changed:</h2>'+
			'<strong>Time:</strong> '+ this.getformatedDate(new Date) +
			'<br><strong>Channel:</strong> '+ this.getFullChannelName(channel) +
			'<br><strong>Old ID value:</strong> '+ this.firstChannelId +
			'<br><strong>New ID value:</strong> '+ channel.id;
	},
	sendChannelChangeEmail: function(channel){
		var sbj = this.emailSubj +' ['+ this.getformatedDate(new Date) +']';
		email.sendMail(sbj, this.emailRecipient, this.getChannelChangeEmailContent(channel));
	},
	isChannelChanged: function(channel){
		var isChanged = false;
		
		if(channel.id && this.firstChannelId && channel.id != this.firstChannelId)
			isChanged = true;
		
		return isChanged;
	},
	finishPlaylist: function(){
		var firstChannel = this.channels[0],
			isChanged = this.isChannelChanged(firstChannel),
			changedText = isChanged ? ' :CHANGED' : '';

		this.logInfo(this.getFullChannelName(firstChannel) +': '+ firstChannel.id + changedText);
		if(isChanged) this.sendChannelChangeEmail(firstChannel);

		this.firstChannelId = firstChannel.id;
		this.playlistFinished();
	}
});

module.exports = {
	init: function(){
		if(cf.playlistEnabled){
			channelTorrentStream.init([channels1], function(){
				channelTuchka.init([channels2]);
			}, channelTuchka);
		}
		if(cf.playListChannelChecker){
			channelChangeTracker.init([{dName: '1+1', sName: '1\\+1', flags: ''}])
		}
	},
	forceGeneratePlaylists: function(res){
		if(cf.playlistEnabled){
			Channel.prototype.forceGeneratePlaylists();
			res.send('Generation started!');
		}
		else{
			res.status(503).send('Playlist generation disabled!');
		}
	}
}