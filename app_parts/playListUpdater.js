var needle = require('needle'),
	path = require('path'),
	fs = require('fs'),
	_ = require('underscore'),
	channels = require('./../files/UpdateChanList/js/channelList.js').channelList;

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
	validList: '',
	genChannList: '',
	genFullChannList: '',
	generateInterval: '60', //Value in minutes
	playlistPath: path.join(filesP, '/UpdateChanList/LastValidPlaylist/server/TV_List.xspf'),
	logPath: path.join(filesP, '/UpdateChanList/LastValidPlaylist/server/log.txt'),
	playlistUrl: 'http://www.trambroid.com/playlist.xspf',
	_report: _.template('Playlist updated.'+
		'\nUpdated count: <%= updatedList.length %>'+
		'\nRequired count: <%= reqFailedList.length %>'+
		'\nFailed count: <%= failedList.length %>'+
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
	createLogStream: function(){
		this.logStream = fs.createWriteStream(this.logPath, {
			flags: 'a'
		});
	},
	logInfo: function(msg){
		this.logStream.write('\n\n[INFO - '+ this.getformatedDate(new Date) +'] '+ msg);
	},
	logErr: function(msg){
		this.logStream.write('\n\n[ERROR - '+ this.getformatedDate(new Date) +'] '+ msg);
	},
	init: function() {
		this.createLogStream();
		this.setChannelListConfig(channels);
		this.getValidPlaylist('GET', this.playlistUrl);

		//Scheduler for updating playlist
		this.setTimeoutCall(this.getOffsetNextHour());
	},
	storeValidList: function(name, playList, date){
		this.validList = {
			name: name,
			type: this.getFileType(name),
			list: playList,
			lModified: date
		};
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
		this.genFullChannList = '';
		this.genChannList = '';
	},
	setTimeoutCall: function(time){
		var that = this;

		setTimeout(function(){
			that.getValidPlaylist('GET', that.playlistUrl);

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
	getTimeOnZone: function(time, tZone){
		return curTime = new Date(time.getMonth() +' '+ time.getDate() +', '+ time.getYear() +' '+ time.getHours() +':'+ time.getMinutes() +':01 GMT+'+ tZone +'00');
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
	getValidPlaylist: function(reqType, url){
		var that = this,
			reqOptions = {
				headers: {
					'Accept': 'text/html'
				},
				method: 'HEAD'
			};

		needle.request(reqType, url, null, reqOptions, function(err, resp) {
			if (err || resp.statusCode == 404 || resp.statusCode == 500){
				this.logErr('Error in getting valid playlist!');
				return;
			}
			that.storeValidList(url, resp.body.toString('utf8'), resp.headers['last-modified']);
			that.getList();
		});
	},
	getFileType: function(playlistName){
		var playlist = playlistName.split('.'),
			playlistType = playlist[playlist.length-1];

		return playlistType.toLocaleLowerCase();
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
			'\n\t<title>TV playlist: '+ this.getformatedDate(new Date()) +'; failed channels: '+ this.report.failedList.length +'</title>' +
			'\n\t<creator>Vasin Oleksiy</creator>' +
			'\n\t<trackList>' + this.genChannList + '\n\t</trackList>' +
			'\n</playlist>';
	},
	getReport: function(){
		var report = this._report(this.extendObj(this.report, {date: this.getformatedDate(new Date())} ));

		this.logInfo(report);
	},
	formChannItem: function(channel, newChannelId) {
		return '\n\t\t<track>' +
				'\n\t\t\t<title>' + channel.dName + this.getHdText(channel.isHd) + '</title>' +
				'\n\t\t\t<location>' + newChannelId.replace('\n', '') + '</location>' +
				'\n\t\t</track>';
	},
	savePlaylist: function(){
		fs.writeFile(this.playlistPath, this.genFullChannList);
	},
	getList: function() {
		this.getCustomList();
		this.savePlaylist();
		this.getReport();

		this.resetData();
	}
}
module.exports.channel = Channel;