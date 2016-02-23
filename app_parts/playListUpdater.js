var needle = require('needle'),
	path = require('path'),
	fs = require('fs'),
	prependFile = require('prepend-file'),
	_ = require('underscore'),
	cheerio = require('cheerio'),
	mkdirp = require('mkdirp'),
	cf = require('./../config/config.js'),
	channels1 = require('./../files/UpdateChanList/js/channelList.js').channelList,
	channels2 = require('./../config/channelList2.js').channelList;

function Channel(params){
	this.channels = [];
	this.availableFlags = [{
			string: 'hd',
			property: 'isHd'
		},{
			string: 'req',
			property: 'isReq'
	}];
	this.channelCounter = 0;
	this.validList = '';

	this.generateInterval = '60'; //Value in minutes
	this.outputPath = '/UpdateChanList/LastValidPlaylist/server';
	this.playListName = 'TV_List.xspf';
	this.logName = 'log.txt';
	this.report = {
		updatedList: [],
		reqFailedList: [],
		failedList: []
	};
	this._report = _.template('Playlist updated.'+
		'\nUpdated: <%= updatedList.length %>'+
		'\nRequired failed: <%= reqFailedList.length %>'+
		'\nFailed: <%= failedList.length %>'+
		'\nFailed channel list:'+
		'<% _.each(failedList, function(item, index) { '+
			'var channelFullName = item.dName + (item.isHd ? " HD" : ""); %>'+
			'\n\t<%= index+1 %>. <%= channelFullName %>'+
		'<% }); %>');

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
			var instane = this.playlisGeneratorInstanses[i];
			instane.func.call(instane.that);
		}
	},
	logInfo: function(msg){
		prependFile(this.logPath, '[INFO - '+ this.getformatedDate(new Date) +'] '+ msg +'\n\n');
	},
	logErr: function(msg){
		prependFile(this.logPath, '[ERROR - '+ this.getformatedDate(new Date) +'] '+ msg +'\n\n');
	},
	init: function(channelsArray) {
		this.playlistPath = path.join(filesP, this.outputPath + '/'+ this.playListName);
		this.logPath = path.join(filesP, this.outputPath + '/'+ this.logName);
		
		this.createFolder(this.outputPath);
		this.setChannels(channelsArray);
		this.setChannelListConfig();
		this.getValidPlaylist();
		this.storeGenerator();

		//Scheduler for updating playlist
		this.setTimeoutCall(this.getOffsetNextHour());
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
	resetData: function() {
		this.report = {
			failedList: [],
			updatedList: [],
			reqFailedList: []
		};
		this.channelCounter = 0;
	},
	createFolder: function(folderPath){
		var fullFolderPath =  path.join(filesP, folderPath);

		mkdirp(fullFolderPath);
	},
	storeGenerator: function(){
		//Push playlist generator instance to global prototype property for further regeneration
		this.playlisGeneratorInstanses.push({
			that: this,
			func: this.getValidPlaylist
		});
	},
	setTimeoutCall: function(time){
		var that = this;

		setTimeout(function(){
			that.getValidPlaylist();

			that.setTimeoutCall(that.generateInterval * 60000);
		}, time);
	},
	setChannels: function(entryChannelArray){
		for(var i=0; i < entryChannelArray.length; i++){
			var channelListItem = this.getArrayCopy(entryChannelArray[i]);
			this.channels = this.channels.concat(channelListItem);
		}
	},
	setChannelListConfig: function() {
		for(var i=0; i < this.channels.length; i++){
			var channel = this.channels[i],
				flags = channel.flags ? channel.flags : '';

			this.extendObj(channel, this.getObjFromFlags(flags));
		}
	},
	getDom: function(html){
		return	cheerio.load(html, {decodeEntities: false}, { features: { QuerySelector: true }});
	},
	getTimeOnZone: function(time, tZone){
		return new Date(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate(),  time.getUTCHours() + tZone, time.getUTCMinutes(), time.getUTCSeconds());
	},
	getOffsetNextHour: function(){
		var now = new Date,
			nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()+1, 0, 0, 0);

		return nextHour - now;
	},
	getformatedDate: function(date){
		var now = this.getTimeOnZone(date, 2);

		return now.getDate() +'.'+ (now.getMonth()+1) +'.'+ now.getFullYear() +' '+ now.getHours() +':'+ ((now.getMinutes() < 10 ? '0' : '') + now.getMinutes());
	},
	getValidPlaylist: function(){
		var that = this;

		that.resetData();

		needle.request('GET', that.playlistUrl, null, {}, function(err, resp) {
			if (err || resp.statusCode !== 200){
				that.logErr('Error in getting valid playlist!');
				return;
			}

			that.storeValidList(resp);
			that.getList();
		});
	},
	getHdText: function(isHd){
		return isHd ? ' HD' : '';
	},
	getObjFromFlags: function(flagString) {
		var flags = flagString.split(' '),
			flagsObj = {},
			availableFlags = this.availableFlags;

		for(var i=0; i < availableFlags.length; i++)
			flagsObj[availableFlags[i].property] = flags.indexOf(availableFlags[i].string) != -1;

		return flagsObj;
	},
	getIdFromFrame: function(url, channel, callback){
		var that = this;

		needle.request('GET', url, null, {}, function(err, resp) {
			if (err || resp.statusCode !== 200){
				that.failed(channel);
				return;
			}
			var regExp = new RegExp('(?:this\.loadPlayer\\((?:"|\'))(.+)?(?:"|\')', 'im'),
				chanId = resp.body.match(regExp);

			callback(chanId && chanId[1] ? chanId[1] : false);
		});
	},
	getReport: function(){
		var report = this._report(this.report);

		this.logInfo(report);
	},
	getList: function() {
		var that = this;

		for (var i = 0; i < that.channels.length; i++) {
			var curChannel = that.channels[i];
			
			(function(channel){
				that.getChannelId(channel, function(ID){
					that.storeChannelItem(channel, ID)
				});
			})(curChannel);
		}
	},
	getArrayCopy: function(array){
		return JSON.parse(JSON.stringify(array));
	},
	formFullChannList: function(){
		var channels = '';

		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			if(channel.id){
				channels += this.formChannItem(channel);
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
				'\n\t\t\t<title>' + channel.dName + this.getHdText(channel.isHd) + '</title>' +
				'\n\t\t\t<location>' + channel.id.replace('\n', '') + '</location>' +
				'\n\t\t</track>';
	},
	storeChannelItem: function(channel, ID){
		this.channelCounter++

		channel.id = ID;

		this.report.updatedList.push(channel);

		//Finish playlist
		if(this.channelCounter >= this.channels.length)
			this.finishPlaylist();
	},
	savePlaylist: function(playlist){
		fs.writeFile(this.playlistPath, playlist);
	},
	failed: function(channel){
		this.channelCounter++

		channel.id = false;

		this.report.failedList.push(channel);
		if(channel.isReq)
			this.report.reqFailedList.push(channel);

		//Finish playlist
		if(this.channelCounter >= this.channels.length)
			this.finishPlaylist();
	},
	finishPlaylist: function(){
		this.savePlaylist(this.formFullChannList());
		this.getReport();
		this.resetData();
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
	getPLayerUrl: function(channel, callback){
		var that = this,
			channelPage = that.getChannelPage(channel);

		if(!channelPage){
			console.log('Channel not found on the page: '+ channel.dName);
			that.failed(channel);
			return;
		}

		needle.request('GET', channelPage, null, {}, function(err, resp) {
			if (err || resp.statusCode !== 200){
				that.logErr('Error in getting page for channel: '+ channel.dName);
				that.failed(channel);
				return;
			}
			var $ = that.getDom(resp.body),
				channelUrl = $('#Playerholder iframe').attr('src');

			callback(channelUrl);
		});
	},
	getChannelId: function(channel, callback){
		var that = this;

		that.getPLayerUrl(channel, function(url){
			that.getIdFromFrame(url, channel, function(chanId){
				if(!chanId){
					that.failed(channel);
					return;
				}
				callback(chanId);
			});
		});
	}
});

var channelTuchka = new Channel({
	playListName: 'TV_List_tuchka.xspf',
	logName: 'log_tuchka.txt',
	playlistUrl: 'http://tuchkatv.ru/player.html',
	playerUrl: 'http://1ttv.net/iframe.php?site=873&channel=',
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
	getPLayerUrl: function(channelNum){
		return this.playerUrl + channelNum;
	},
	getChannelId: function(channel, callback){
		var that = this,
			chanNum = this.getChannelNumb(channel),
			chanUrl = this.getPLayerUrl(chanNum);

		if(!chanNum){
			this.failed(channel);
			//console.log("Unable to find cnahhel's NUMBER: "+ channel.dName);
			return;
		}

		this.getIdFromFrame(chanUrl, channel, function(chanId){
			if(!chanId){
				that.failed(channel);
				return;
			}
			callback(chanId);
		});
	}
});

module.exports = {
	init: function(){
		channelTorrentStream.init([channels1]);
		channelTuchka.init([channels1, channels2]);
	},
	forceGeneratePlaylists: function(){
		Channel.prototype.forceGeneratePlaylists();
	}
}