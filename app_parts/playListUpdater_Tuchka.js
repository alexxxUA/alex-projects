var needle = require('needle'),
	path = require('path'),
	fs = require('fs'),
	prependFile = require('prepend-file'),
	_ = require('underscore'),
	cheerio = require('cheerio'),
	cf = require('./../config/config.js'),
	channels = require('./../files/UpdateChanList/js/channelList.js').channelList;

var Channel = {
	channels: [],
	getRegExp: '',
	availableFlags: [{
			string: 'hd',
			property: 'isHd'
		},{
			string: 'req',
			property: 'isReq'
	}],
	channelCounter: 0,
	validList: '',
	generateInterval: '60', //Value in minutes
	playlistPath: path.join(filesP, '/UpdateChanList/LastValidPlaylist/server/TV_List.xspf'),
	logPath: path.join(filesP, '/UpdateChanList/LastValidPlaylist/server/log.txt'),
	playlistUrl: 'http://tuchkatv.ru/player.html',
	playerUrl: 'http://1ttv.net/iframe.php?site=873&channel=',
	_report: _.template('Playlist updated.'+
		'\nUpdated: <%= updatedList.length %>'+
		'\nRequired failed: <%= reqFailedList.length %>'+
		'\nFailed: <%= failedList.length %>'+
		'\nFailed channel list:'+
		'<% _.each(failedList, function(item, index) { '+
			'var channelFullName = item.dName + (item.isHd ? " HD" : ""); %>'+
			'\n\t<%= index+1 %>. <%= channelFullName %>'+
		'<% }); %>'),
	report: {
		updatedList: [],
		reqFailedList: [],
		failedList: []
	},
	logInfo: function(msg){
		prependFile(this.logPath, '[INFO - '+ this.getformatedDate(new Date) +'] '+ msg +'\n\n');
	},
	logErr: function(msg){
		prependFile(this.logPath, '[ERROR - '+ this.getformatedDate(new Date) +'] '+ msg +'\n\n');
	},
	init: function() {
		this.setChannelListConfig(channels);
		this.getValidPlaylist();

		//Scheduler for updating playlist
		this.setTimeoutCall(this.getOffsetNextHour());
	},
	storeValidList: function(resp){
		var $ = this.getDom(resp.body),
			playlist = $('#sidebar select').html();

		this.validList = playList;
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
	setTimeoutCall: function(time){
		var that = this;

		setTimeout(function(){
			that.getValidPlaylist();

			that.setTimeoutCall(that.generateInterval * 60000);
		}, time);
	},
	setChannelListConfig: function(channelListObj) {
		for(var i=0; i < channelListObj.length; i++){
			var channel = channelListObj[i],
				flags = channel.flags ? channel.flags : '';

			this.extendObj(channel, this.getObjFromFlags(flags));
		}
		this.channels = channelListObj;
	},
	getDom: function(html){
		return	cheerio.load(html, {decodeEntities: false}, { features: { QuerySelector: true }});
	},
	getPLayerUrl: function(channelNum){
		return this.playerUrl + channelNum;
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

		needle.request('GET', that.playlistUrl, null, {}, function(err, resp) {
			if (err || resp.statusCode == 404 || resp.statusCode == 500){
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
	getChannelNumb: function(channel){
		var isHd = channel.isHd ? '(?:hd|cee)' : '',
			regExp = new RegExp('(?:<option\\s+value="([0-9]*)"\\s*>)(?:\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*<\/option>)', 'im'),
			chanNum = this.validList.match(regExp);

		return chanNum && chanNum[1] ? chanNum[1] : false;
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
	},
	getIdFromFrame: function(url, channel, callback){
		var that = this;

		needle.request('GET', url, null, {}, function(err, resp) {
			if (err || resp.statusCode == 404 || resp.statusCode == 500){
				that.failed(channel);
				return;
			}
			var regExp = new RegExp('(?:this.loadPlayer\\((?:"|\'))([0-9a-f]+)', 'im'),
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
module.exports.channel = Channel;