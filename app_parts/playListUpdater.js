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


Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}
Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

/**
 * Extend objects
 * @param   {objects}
 * @returns {object}
 */
function extend(target) {
    var sources = [].slice.call(arguments, 1);

    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

/**
 * Main class for channel generator
 * @param {object} params object with properties and methods. If same name, will override existing.
 */
function Channel(params){
	this.oneDay = cf.oneDay;
    this.channelsArray = [];
	this.channels = [];
	this.report = {
		failedList: [],
		updatedList: [],
		reqFailedList: []
	};
	this.tempRestartCount = 0;
	this.isPlaylistFailed = false;
	this.backUpGen = undefined;
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
    this.isLog = cf.isConsoleLogPlaylist;
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
	 * Delay in restarting generation of playlist
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
    this.playerFrameUrl = this.playerDomain +'/acestream.php';
	this.playerDomainProxy = 'http://gf2hi5ronzsxi.nblz.ru'; //http://gf2hi5ronzsxi.nblz.ru  |  http://1ttv.net
    
    this.reqParams = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Host': '1ttv.net',
        }
    };
    
    //RegExps array for search channel id or url
    this.cRegExps = [
        new RegExp('(?:this\.loadPlayer\\((?:"|\'))(.+)?(?:"|\')', 'im'),
        new RegExp('(?:data-stream_url=(?:"|\'))(.+)?(?:"|\')', 'im')
    ];

	this.emailSubj = 'Playlist generator notifier';
	this.emailRecipient = 'aluaex@gmail.com';
	
	this.outputPath = cf.playlistOutputPath;
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
    this.init();
}

/**
 * General methods for Channel class
**/
Channel.prototype = {
	playlisGeneratorInstanses: [],
	forceGeneratePlaylists: function(){
		for(var i=0; i < this.playlisGeneratorInstanses.length; i++){
			var instance = this.playlisGeneratorInstanses[i];
			instance.func.call(instance.that, true);
		}
	},
    cLog: function(msg){
        if(this.isLog) console.log(msg);
    },
	logInfo: function(msg){
		prependFile(this.logPath, '[INFO - '+ this.getformatedDate(new Date, true) +'] '+ msg +'\n\n');
	},
	logErr: function(msg){
		prependFile(this.logPath, '[ERROR - '+ this.getformatedDate(new Date, true) +'] '+ msg +'\n\n');
	},
    logStartGeneration: function(){
        var now = new Date(),
            approxEndGenMs = now.getTime() + this.generationSpentTime,
            approxEndDateString = this.getformatedDate( new Date(approxEndGenMs), true ),
            genTimeString = this.getGenTime().string;

        this.logInfo('Generation started and will take ~ '+ genTimeString +'. End time ~ '+ approxEndDateString +'.');
    },
	init: function() {
		this.generateInterval = 60 * (24/this.generateCountPer24h) * 60000; //Value in minutes
		this.playlistPath = path.join(filesP, this.outputPath + '/'+ this.playListName);
		this.logPath = path.join(filesP, this.outputPath + '/'+ this.logName);
		
		if(typeof this.initParams == 'function') this.initParams();

		this.createFolder(this.outputPath);
		this.setChannels(this.channelsArray);
		this.initChannelsObject();

        //Save playlist page for backup
		if(this.backUpGen)
            this.backUpGen.getValidPlaylist.call(this.backUpGen);
	},
    start: function(callback){
        if(typeof callback == 'function') this.callback = callback;

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
        this.validList = '';
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
        this.generationSpentTime = this.getGenTime().time;
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
    setCookie: function(url, channel, callback){
        var that = this;

        needle.request('GET', url, null, that.reqParams, function(err, resp){
            if (err || resp.statusCode !== 200){
                that.failed(channel, 'channel`s page/frame not available');
                return;
            }            
            var cookie = resp.headers['set-cookie'];

            if(callback) callback(cookie ? cookie : '');
        });
    },
	updateChannelsObject: function(callback) {
		for(var i=0; i < this.channels.length; i++)
			callback.call(this, this.channels[i]);
	},
	updateFlags: function(channel){
		var flags = channel.flags ? channel.flags : '';

		extend(channel, this.getObjFromFlags(flags));
	},
	decodeChannelNames: function(channel){
		if(channel.isCoded){
			channel.sName = new Buffer(channel.sName, 'base64');
			channel.dName = new Buffer(channel.dName, 'base64');
		}
	},
    getGenTime: function(){
        var time = this.channels.length * this.genDelay,
            date = new Date(time),
            h = date.getUTCHours(),
            m = date.getUTCMinutes(),
            s = date.getUTCSeconds(),
            hString = h ? h+'h ' : '',
            mString = m ? m+'m ' : '',
            sString = s ? s+'s ' : '',
            string = hString + mString + sString;

        return {
            time: +time.toFixed(2),
            h: h,
            m: m,
            string: string.slice(0, string.length-1)
        }
    },
	getNextTimeOffset: function(){
		var nextTimeOffset = (this.isGenerateInTime ? this.getOffsetTillTime(this.generateTime) : this.getOffsetNextHour()) - this.generationSpentTime;
		return nextTimeOffset > 0 ? nextTimeOffset : 0;
	},
	getDom: function(html){
		return	cheerio.load(html, {decodeEntities: false}, { features: { QuerySelector: true }});
	},
    getTimeZone: function(){
        return this.timeZone - (this.isDst ?  1 : 0);
    },
	getDateOnZone: function(time, tZone){
        var tZone = typeof tZone != 'undefined' ? tZone : this.getTimeZone();
		return new Date(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate(),  time.getUTCHours() + tZone, time.getUTCMinutes(), time.getUTCSeconds());
	},
	getNowOnTimeZone: function(){
		return this.getDateOnZone(new Date());
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
	getformatedDate: function(date, isNeedConvert){
		var now = isNeedConvert ? this.getDateOnZone(date) : date;

		return now.getDate() +'.'+ (now.getMonth()+1) +'.'+ now.getFullYear() +' '+ now.getHours() +':'+ ((now.getMinutes() < 10 ? '0' : '') + now.getMinutes());
	},
	genValidPlaylist: function(isForce){
		var that = this;

		this.prepareData(isForce);
        this.logStartGeneration();

		//Gen playlist
		this.getValidPlaylist(function(){
			that.getList();
		});
	},
	getValidPlaylist: function(callback){
        var that = this;

        that.getValidPlaylistPart(that.playlistUrl, function(resp){
            that.storeValidList(resp);
            if(callback) callback();
        });
	},
    getValidPlaylistPart: function(url, callback){
        var that = this;

		needle.request('GET', url, null, {}, function(err, resp) {
			if (err || resp.statusCode !== 200){
				that.isPlaylistFailed = true;
				that.logErr('Error in getting valid playlist! Source: '+ url +' .');
				that.playlistFinished();
				return;
			}

			if(callback) callback(resp);			
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
    getChannelId: function(channel, callback, _that){
		var _that = _that || this,
			that = this;

		that.getPlayerUrl(channel, function(url){
			that.getIdFromFrame(url, channel, function(chanId){
				callback(chanId);
			}, _that);
		}, _that);
	},
	getIdFromFrame: function(cUrl, channel, callback, _that){
		var that = this,
			updChanUrl = that.getUpdatedPlayerUrl(cUrl),
            reqParams = extend({}, this.reqParams);

        reqParams.headers.Referer = updChanUrl;

        function getIdReq(cookie){
            //Set cookie
            reqParams.headers.Cookie = cookie;
            //Send request
            needle.request('GET', that.playerFrameUrl , null, reqParams, function(err, resp){
                that.getIdFromFrameRespCallback(err, resp, channel, callback, _that)
            });
        }
        that.setCookie(updChanUrl, channel, getIdReq);
	},
    getIdFromFrameRespCallback: function(err, resp, channel, callback, _that){
        if (err || resp.statusCode !== 200){
            _that.failed(channel, 'channel`s page/frame not available');
            return;
        }

        var _that = _that || this,
            i = 0,
            chanId;

        while(!chanId && i < this.cRegExps.length){
            chanId = resp.body.match(this.cRegExps[i]);
            chanId = chanId && chanId[1] ? chanId[1] : false;
            i++;
        }
        //Check if ID string contains numbers. If not -> failed.
        chanId = /[0-9]+/.test(chanId) ? chanId : false;

        if(!chanId)
            _that.failed(channel, 'id not found on the page/frame');
        else
            callback(chanId);
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

			if(channel.id && channel.id.length >= this.idMinLength)
				channels += this.formChannItem(channel);
			else if(channel.id && channel.id.length < this.idMinLength)
                this.failed(channel, 'id shorter than '+ this.idMinLength +' symbols');
		}

		return '<?xml version="1.0" encoding="UTF-8"?>' +
				'\n<playlist version="1" xmlns="http://xspf.org/ns/0/">' +
				'\n\t<title>TV playlist: '+ this.getformatedDate(new Date(), true) +'; failed channels: '+ this.report.failedList.length +'</title>' +
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
		var sbj = this.emailSubj +' ['+ this.getformatedDate(new Date, true) +']',
			msg = '<h2>Generation of playlist "'+ this.playListName +'" has been failed.</h2>';

		email.sendMail(sbj, this.emailRecipient, msg);
	},
    isDst: function(){
        return new Date().dst();
    },
	isAbleToRestartChan: function(channel){
		return typeof this.backUpGen != 'undefined'
				&& this.backUpGen.validList.length 
				&& channel.failedCount < this.maxRestartCountPerChannel;
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
		
        this.cLog(channel.dName +': '+ errMsg);
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

        //Restart getting of playlist page using same generator
		if(this.tempRestartCount < this.maxRestartCount){
			setTimeout(function(){
				that.genValidPlaylist();
			}, this.restartDelay * 1000 * 60);

			this.tempRestartCount++
		}
        //Restart getting of playlist page using BACKUP generator
        else if (typeof this.backUpGen != 'undefined'){
            this.backUpGen.genValidPlaylist.call(this.backUpGen, true);
            this.tempRestartCount = 0;
        }
        //Send email notification about failed generation
		else{
			this.sendPlaylistGenFailedEmail();
            this.logErr('Attempts of generating playlist have stopped. You can manually restart generation of playlist later in the admin panel.');
			this.tempRestartCount = 0;
		}
	}
}

/**
 * Main config for "Torrent stream" source
**/
var TorStreamMainConfig = {
    playlistDomain: 'https://torrentstream.tv',
    initParams: function(){
        this.playlistUrl = this.playlistDomain +'/videos/browse';
    },
	storeValidList: function(resp){
		this.validList = resp.body;
	},
	getChannelPage: function(channel){
		var isHd = channel.isHd ? '(?:hd|cee)' : '',
			regExp = new RegExp('(?:<a.*?href="(.*?)".*?>)(?:\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*<\/a>)', 'im'),
			chanPage = this.validList.match(regExp);

		return chanPage && chanPage[1] ? this.playlistDomain + chanPage[1] : false;
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
				channelUrl = $('#Lnk').attr('href');

            if(channelUrl)
                callback(channelUrl);
            else
                _that.failed(channel, 'players src not found in frame on page');
		});
	}
};

/**
 * Main config for "Tuchka" source
**/
var TuckaMainConfig = {
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
}

/**
 * Main config for "Tuchka" source from homepage
**/
var TuckaHomepageConfig = {
    playlistUrl: 'http://tuchkatv.ru/page/',
    getValidPlaylist: function(callback){
        var that = this;
        that.pagesCount = 0;
        that.validList = '';

        that.getPagesCount(that.playlistUrl +'1', function(count){            
            for(var i=1; i<=count; i++){
                (function(j){
                    setTimeout(function(){
                        that.getValidPlaylistPart(that.playlistUrl + j, function(resp){
                            that.storeValidList(resp);

                            //Call callback in case all parts collected
                            if(callback && that.pagesCount == count) callback();
                        });
                    }, j * 500);
                })(i);
            }
        });
        
	},
    getPagesCount: function(url, callback){
        var that = this;

        that.getValidPlaylistPart(url, function(resp){
            var $ = that.getDom(resp.body),
                count = $('.navigation_n > a').last().text();

            if(callback) callback(+count);
        });
    },
	storeValidList: function(resp){
		var $ = this.getDom(resp.body),
			playlistPart = $('#dle-content').html();

        this.pagesCount++;
		this.validList += playlistPart;
	},
    getPlayerUrl: function(channel, callback, _that){
		var _that = _that || this,
			that = this,
            isHd = channel.isHd ? '(?:hd|cee)' : '',
			regExp = new RegExp('(?:<a.*?href="(.*?)")(?:.+)?(?:'+ channel.sName +'\\s*'+ isHd +')(?:.+)?(?:<\/a>)', 'im'),
			chanUrl = this.validList.match(regExp);

        chanUrl = chanUrl && chanUrl[1] ? chanUrl[1] : false;

		if(!chanUrl){
			_that.failed(channel, 'not found on the playlist page');
			return;
		}

        if(callback) callback(chanUrl);
	},
    getIdFromFrame: function(cUrl, channel, callback, _that){
        var _that = _that || this,
			that = this,
			newChanUrl = that.getUpdatedPlayerUrl(cUrl);

        needle.request('GET', cUrl, null, {}, function(err, resp){
            that.getIdFromFrameRespCallback(err, resp, channel, callback, _that)
        });
	},
}

/*
    INIT Genarator instances
*/
var MainPlaylistHomepage_tucka = new Channel(extend({}, TuckaHomepageConfig, {
	channelsArray: [channels1],
    playListName: 'TV_List_torrent_stream.xspf',
	logName: 'log_torrent_stream.txt'
}));
var SecondaryPlaylist_tucka = new Channel(extend({}, TuckaMainConfig, {
	channelsArray: [channels2],
    generateTime: '6:20',
	playListName: 'TV_List_tuchka.xspf',
	logName: 'log_tuchka.txt'
}));
var MainPlaylist_tucka = new Channel(extend({}, TuckaMainConfig, {
	channelsArray: [channels1],
    playListName: 'TV_List_torrent_stream.xspf',
	logName: 'log_torrent_stream.txt'
}));
var MainPlaylist_torStream = new Channel(extend({}, TorStreamMainConfig, {
	channelsArray: [channels1],
    playListName: 'TV_List_torrent_stream.xspf',
	logName: 'log_torrent_stream.txt',
    backUpGen: MainPlaylist_tucka
}));
var ChannelChangeTracker_tucka = new Channel(extend({}, TuckaMainConfig, {
    channelsArray: [{dName: '1+1', sName: '1\\+1', flags: ''}],
	firstChannelId: false,
	isGenerateInTime: false,
	generateCountPer24h: 24,
	logName: 'log_channelChecker.txt',
	getChannelChangeEmailContent: function(channel){
		return '<h2>Channel\'s id has been changed:</h2>'+
			'<strong>Time:</strong> '+ this.getformatedDate(new Date, true) +
			'<br><strong>Channel:</strong> '+ this.getFullChannelName(channel) +
			'<br><strong>Old ID value:</strong> '+ this.firstChannelId +
			'<br><strong>New ID value:</strong> '+ channel.id;
	},
	sendChannelChangeEmail: function(channel){
		var sbj = this.emailSubj +' ['+ this.getformatedDate(new Date, true) +']';
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
}));


module.exports = {
	init: function(){
		if(cf.playlistEnabled){
			MainPlaylistHomepage_tucka.start(function(){
				SecondaryPlaylist_tucka.start();
			});
		}
		if(cf.playListChannelChecker){
			ChannelChangeTracker_tucka.start()
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