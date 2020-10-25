var needle = require('needle'),
	$url = require('url'),
	path = require('path'),
	fs = require('fs'),
	prependFile = require('prepend-file'),
	_ = require('underscore'),
	cheerio = require('cheerio'),
	mkdirp = require('mkdirp'),
	translit = require('./translitModule'),
	cf = require('./../config/config.js'),
	email = require('./sendMail.js'),
	channels1 = require('./../files/UpdateChanList/js/channelList.js').channelList,
	channels2 = require('./../config/channelList2.js').channelList,
	channelListSk = require('./../config/channelList_sk').channelListSk,
    generationInProgress = false;


Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}
Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
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
		},{
			string: 'm3',
			property: 'isM3uOnly'
	}];
	this.validList = '';
	/* Is getting channel's html through proxy */
	this.isProxy = cf.playlistGenProxy;
	this.idMinLength = 10;
    this.isLog = cf.isConsoleLogPlaylist;
    this.isGenOnStart = cf.playlistGenOnStart;
	this.isCheckIdForUrl = false;

	this.saveProxyList = true;
	this.proxyListPrefix = 'http://localhost:6878/ace/getstream?';
	this.aceliveGetter = 'http://91.92.66.82/trash/ttv-list/acelive/';

	/**
	 * Relative URL for icons in m3u format playlist. In attribute tvg-logo="..."
	 * @Value relative URL where icons located
	 */
	this.logoRelativeUrl = 'http://avasin.herokuapp.com/UpdateChanList/App/Sources/Channel_icons/';
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
	 * Generate in specified time
	 * @Value in format: 5:45 (24h format)
	 */
	this.generateTime = null;
	this.timeZone = 1;

    this.torApiUrl = 'http://api.torrentstream.net/upload/jsonp?callback=c&url=';

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
	
	// Additional channel attributes to be found / included into playlist output
	this.channelDataAttrs = [
		'catchup', 'catchup-days', 'timeshift', 'tvg-id'
	];

	//--- RegExps array for search channel id or url

	// Search in .m3u playlist with URL contains "ygk.info" - voron source
	this.voronRegExp = channel => {
		var isHd = this.getHdForRegexp(channel);
		return new RegExp('(?:EXTINF\:-?\\d,\\s*(?:' + channel.sName + ')\\s*' + isHd + '\\s*\\n+(?<id>.*?ygk\.info.*))', 'img');
	};

	// Search in .m3u playlist
	this.m3uRegExp = channel => {
		var isHd = this.getHdForRegexp(channel);
		return new RegExp('(?:EXTINF\:[^,]+,\\s*(?:' + channel.sName + ')\\s*' + isHd + '\\s*\\n+(?<id>.*))', 'img');
	};

    this.cRegExps = [
		this.voronRegExp,
		// search in JSON
		channel => new RegExp(`(?:"${this.getBaseChannelRegExp(channel)}","url":"(?<id>.+?)?")`, 'img'),
		this.m3uRegExp,
        new RegExp('(?:acestream\:\/\/(?<id>.+)?(?:"|\'))', 'img'),
        new RegExp('(?:this\.loadPlayer\\((?:"|\'))(?<id>.+)?(?:"|\')', 'img'),
        new RegExp('(?:this\.loadTorrent\\((?:"|\'))(?<id>.+)?(?:"|\')', 'img'),
        new RegExp('(?:data-stream_url=(?:"|\'))(?<id>.+)?(?:"|\')', 'img'),
		new RegExp('(?:player\\.php\\?[^=]*=)(?<id>[^\'"<]+)', 'img'),
        //Search for id in jsonp response from "this.torApiUrl"
		new RegExp('(?:id":")(?<id>.+)?(?:",)', 'img'),
		// JW player
		new RegExp('(?:file\:\\s*?(?:"|\')(?<id>.+)?(?:"|\'))', 'img'),
		channel => {
			var isHd = this.getHdForRegexp(channel);
			return new RegExp('(?:<location>)(?<id>.*?)(?:</location>\\s*\\n*\\s*<title>\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*</title>)', 'img');
		}
    ];

	this.emailSubj = 'Playlist generator notifier';
	this.emailRecipient = 'aluaex@gmail.com';

	this.outputPath = cf.playlistOutputPath;
	this.logsOutputPath = `${cf.playlistOutputPath}/Logs`
	this.playListName = 'TV_List';
	this.playlistExt = 'xspf'
	this.proxyPlaylistExt = 'm3u8'
	this.logName = '';
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
				'\n\t<%= index+1 %>. <%= channelFullName %>'+
				'<%= item.isReq ? "(Req)" : "" %> - <%= item.errMsg.join("|") %>'+
			'<% }); %>'+
		'<% } %>'
	);

	//Init params
	for(var param in params){
		if (params.hasOwnProperty(param))
			this[param] = params[param];
	}
	if(this.instanceInit) {
		this.instanceInit();
	}

    this.init();
}

/**
 * General methods for Channel class
**/
Channel.prototype = {
	playlistGeneratorInstances: [],
	cache: {
		'/constant/sk': `
			#EXTINF:-1, Kosice dnes\nhttp://lb.streaming.sk/tvnasa/stream/playlist.m3u8
			#EXTINF:-1, JOJ\nhttps://nn.geo.joj.sk/live/hls/joj-540.m3u8
			#EXTINF:-1, JOJ Family\nhttp://nn.geo.joj.sk/hls/family-540.m3u8
			#EXTINF:-1, JOJ Plus\nhttps://nn.geo.joj.sk/live/hls/jojplus-540.m3u8
			#EXTINF:-1, Jojko\nhttps://nn.geo.joj.sk/live/hls/rik-540.m3u8
			#EXTINF:-1, WAU\nhttps://nn.geo.joj.sk/live/hls/wau-540.m3u8
		`
	},
	// Cache lifeTime = 5 minutes
	cacheLifeTime: 1000 * 60 * 5,
	// Dynamic offset start time
	// Each new playlist instance will be started with time offset
	currentStartOffset: 0,
	startOffset: 65*1000,
	forceGeneratePlaylists: function(){
        var playlists = this.playlistGeneratorInstances,
            playlistsLength = playlists.length;

        //Return if no playlists instances found
        if(!playlistsLength) return;

        for(var i=0; i < playlistsLength ; i++){
            (function(j){
                var instance = playlists[j],
                    nextInstance = playlists[j+1];

                if(nextInstance){
                    instance.that.callback = function(){
                        nextInstance.func.call(nextInstance.that, true);
                    }
                }
            })(i);
        }

        playlists[0].func.call(playlists[0].that, true);
	},
    cLog: function(msg){
        if(this.isLog) console.log(`${this.playListName} - ${msg}`);
    },
	logInfo: function(msg){
		this.cLog(`*INFO* : ${msg}`);
		prependFile(this.logPath, '[INFO - '+ this.getFormatedDate(new Date, true) +'] '+ msg +'\n\n');
	},
	logErr: function(msg){
		this.cLog(`*ERROR* : ${msg}`);
		prependFile(this.logPath, '[ERROR - '+ this.getFormatedDate(new Date, true) +'] '+ msg +'\n\n');
	},
    logStartGeneration: function(){
        var now = new Date(),
            approxEndGenMs = now.getTime() + this.generationSpentTime,
            approxEndDateString = this.getFormatedDate( new Date(approxEndGenMs), true ),
            genTimeString = this.getGenTime().string;

        this.logInfo('Generation started and will take ~ '+ genTimeString +'. End time ~ '+ approxEndDateString +'.');
	},
	writeFileCallback: function(err) {
		if(err) console.console.error(err);
	},
	init: function() {
		this.generateInterval = 60 * (24/this.generateCountPer24h) * 60000; //Value in minutes
		this.playlistPath = path.join(filesP, `${this.outputPath}/${this.playListName}.${this.playlistExt}`);
		this.proxyPlaylistPath = path.join(filesP, `${this.outputPath}/Proxy-${this.playListName}.${this.proxyPlaylistExt}`);
		this.logPath = path.join(filesP, `${this.logsOutputPath}/${this.logName || this.playListName}.log`);

		if(typeof this.initParams == 'function') this.initParams();

		this.createFolder(this.outputPath);
		this.createFolder(this.logsOutputPath);
		this.setChannels(this.channelsArray);
		this.initChannelsObject();
	},
    start: function(callback){
		// Save callback to property
		if(typeof callback == 'function') {
			this.callback = callback;
		}

        if(this.isGenOnStart){
			this.genValidPlaylist(true);
        }
        else if (callback){
			callback();
        }

		this.storeGenerator();

		//Scheduler for updating playlist
		this.setTimeoutCall(this.getNextTimeOffset());
    },
	initChannelsObject: function(){
		this.updateChannelsObject(function(channel){
			this.updateFlags(channel);
			this.decodeChannelNames(channel);
            this.updateChannelSname(channel);
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
		this.channelCounter = 0;
		this.isPlaylistFailed = false;
		this.resetChannelsObject();
        generationInProgress = false;
		delete this.callback;
	},
	resetChannelsObject: function(){
		this.updateChannelsObject(function(channel){
			channel.failedCount = 0;
			channel.errMsg = [];
		});
	},
	prepareData: function(isForce){
        generationInProgress = true;
		this.genDelay = (isForce ? this.forceGenDelay : this.scheduleGenDelay) * 1000;
        this.generationSpentTime = this.getGenTime().time;
	},
	createFolder: function(folderPath){
		var fullFolderPath =  path.join(filesP, folderPath);

		mkdirp(fullFolderPath);
	},
	storeGenerator: function(){
		//Push playlist generator instance to global prototype property for further regeneration
		this.playlistGeneratorInstances.push({
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
		channel.flags = channel.flags ? channel.flags : '';

		Object.assign(channel, this.getObjFromFlags(channel.flags));
	},
    updateChannelSname: function(channel){
		var encodedDName = channel.dName.replace(/(\(|\))/g, '\\$1');
		var translitName = translit(encodedDName);

		//Check if sName exist. If no -> add default one from dName property
		channel.sName = channel.sName ? channel.sName : encodedDName;

		//Add translit value of dName property
		if(this.translitEnabled) {
			channel.sName += '|' + translitName;
		}
		//Code spaces with regExp
        channel.sName = channel.sName.replace(/\s+/g, '(?:\\s|-)*');
    },
	decodeChannelNames: function(channel){
		if(channel.isCoded){
			channel.sName = (new Buffer(channel.sName, 'base64')).toString();
			channel.dName = (new Buffer(channel.dName, 'base64')).toString();
		}
	},
    /**
     * Return object with data about how much time generation of playlist will take
     * @param   {boolean} isForce not required
     * @returns {object}
     */
    getGenTime: function(isForce){
        var genDelay = 'undefined' != typeof isForce ? (isForce ? this.forceGenDelay : this.scheduleGenDelay)*1000 : this.genDelay,
            time = this.channels.length * genDelay,
            date = new Date(time),
            h = date.getUTCHours(),
            m = date.getUTCMinutes(),
            s = date.getUTCSeconds(),
            hString = h ? `${h}h ` : '',
            mString = m ? `${m}m ` : '',
            sString = s ? `${s}s ` : '',
            string = hString + mString + sString;

        return {
            time: +time.toFixed(2),
            h: h,
            m: m,
            string: string.slice(0, string.length-1) || 'few seconds'
        }
	},
	/**
     * Return milliseconds till next hour 
     * @returns {number} milliseconds
     */
	getNextTimeOffset: function(){
		const generationSpentTime = this.getGenTime(false).time,
            nextTimeOffset = (this.generateTime ? this.getOffsetTillTime(this.generateTime) : this.getOffsetNextHour()) - generationSpentTime + this.currentStartOffset;

		// Update offset time for next playlist instances
		this.__proto__.currentStartOffset = this.currentStartOffset + this.startOffset;

		return nextTimeOffset > 0 ? nextTimeOffset : nextTimeOffset + 60*60*1000;
	},
	getDom: function(html){
		return cheerio.load(html, {decodeEntities: false}, { features: { QuerySelector: true }});
	},
    getTimeZone: function(){
        return this.timeZone + (this.isDst() ? 1 : 0);
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
	getFormatedDate: function(date, isNeedConvert){
		var now = isNeedConvert ? this.getDateOnZone(date) : date;

		return now.getDate() +'.'+ (now.getMonth()+1) +'.'+ now.getFullYear() +' '+ now.getHours() +':'+ ((now.getMinutes() < 10 ? '0' : '') + now.getMinutes());
	},
	genValidPlaylist: function(isForce){
		var that = this;

		this.prepareData(isForce);
        this.logStartGeneration();

		//Gen playlist function
		const genPlaylist = () => {
			this.getValidPlaylist(() => this.getList());
		};

		//Save playlist page for backup generator
		// -> than do main logic
		if(this.backUpGen){
			this.backUpGen.getValidPlaylist(genPlaylist);
		} else {
			// If no backup Generator defined
			// -> proceed to main logic
			genPlaylist();
		}
	},
	getPlaylistParts: function (playlistUrl, isGenInProgress, callback) {
		if (callback) {
			callback(typeof playlistUrl === 'string' ? [playlistUrl] : playlistUrl)
		}
	},
	getValidPlaylist: function(callback){
		const that = this;
		const isGenInProgress = !!callback;

		// reset valid list
		that.resetValidList();

		that.getPlaylistParts(that.playlistUrl, isGenInProgress, function(urls) {
			const urlsCount = urls.length;
			let urlsIndex = 0;
			const loopFunction = () => {
				urlsIndex++
				//Call callback in case all parts collected
				if(callback && urlsIndex === urlsCount && that.validList) {
					setTimeout(function(){
						that.cLog('All playlist\'s parts are downloaded. Starting generation.');
						callback();
					}, that.minReqDelay);
				}
			}

            for(var i = 0; i < urlsCount; i++){
				var pageUrl = urls[i];
				
				(function(j, url){
					if(url) {
						setTimeout(function(){
							that.getValidPlaylistPart(url, isGenInProgress, function(resp, isFromCache) {
								that.storeValidList(resp);
								that.cLog(`Page: ${(j+1)};  ${url}. ${isFromCache ? 'Taken from CACHE' : 'Downloaded'}.`);
								loopFunction();
							});
						}, j * that.minReqDelay);
					} else {
						that.logErr(`Page with index: ${(j+1)} NOT FOUND!`);
						loopFunction();
					}
				})(i, pageUrl);
            }
        });
	},
	resetValidList: function() {
		this.validList = ''
	},
	storeValidList: function (respString){
		const list = respString
			.replace(/#EXTGRP[^$]+?\n/gm, '')
			.replace(/\s+group-title=".+"\s+/gm, '');

		this.validList += list;
	},
    getValidPlaylistPart: function (url, isGenInProgress, callback) {
		const that = this,
			cacheResp = that.cache[url];

		// check global cache
		if (cacheResp) {
			callback(cacheResp, true);
		} else {
			// If no cache response found -> do fresh request
			needle.request('GET', url, null, {compressed: true, follow_max: 5}, function(err, resp) {
				if (err || resp.statusCode !== 200){
					const errMsg = resp && resp.body || err.message;
					that.logErr(`Error in getting valid playlist for: ${url} .\n Response: ${errMsg.slice(0, 100)}`);

					// Finish generation of playlist
					// only in case generation in progress - not Backup generator call
					if (isGenInProgress) {
						that.isPlaylistFailed = true;
						that.playlistFinished();
					}
					return;
				}
	
				// Parse response
				const respString = resp.parser === 'json' ? JSON.stringify(resp.body) : resp.body.toString();
				// Save response for further use
				that.cache[url] = respString;
				// Delete cached response after timeout
				setTimeout(() => {
					delete that.cache[url];
				}, that.cacheLifeTime);


				// Run callback with response
				if(callback) {
					callback(respString);
				}
			});
		}

    },
	getHdText: function(isHd){
		return isHd ? ' HD' : '';
	},
    getHdForRegexp: function(channel){
        return channel.isHd ? '(?:\\s*-*hd|\\s*-*cee|\\s*-*hq)' : '(?!\\s*-*hd)';
	},
	getBaseChannelRegExp: function (channel) {
		const isHd = this.getHdForRegexp(channel);
		return `(?:${channel.sName})\\s*${isHd}\\s*`
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
	getChannelPageUrl: function(channel, _that, isSkipLog){
		var that = _that || this,
			isHd = this.getHdForRegexp(channel),
			regExpArray = [
				new RegExp('(?:<a.*?href="((?:[^"]+)?(?:'+ channel.sName +')'+ isHd +'(?:\\.(?:html|php))?)?")', 'im'),
				new RegExp('(?:<a.*?href="(.*?)")(?:.+)?(?:(?:'+ channel.sName +')'+ isHd +')(?:.+)?(?:<\/a>)', 'im'),
				new RegExp('(?:<a.*?href="(.*?)".*?>)(?:\\s*(?:.*' + channel.sName + ')' + isHd + '\\s*<\/a>)', 'im'),
				new RegExp('(?:<option\\s+value="([0-9]*)"\\s*>)(?:\\s*(?:.*' + channel.sName + ')' + isHd + '\\s*<\/option>)', 'im')
			],
			i = 0,
			chanPageUrl;

		while(!chanPageUrl && i < regExpArray.length){
			chanPageUrl = this.validList.match(regExpArray[i]);
			chanPageUrl = chanPageUrl && chanPageUrl[1] ? chanPageUrl[1] : false;
			i++;
		}

		//If not found -> failed channel then
		if(!chanPageUrl){
			if(isSkipLog) {
				return false;
			} else {
				that.failed(channel, 'not found on the playlist page');
			}
		}
		//If chanPageUrl with relative path -> add domain value for it
		else if(!this.isStringUrl(chanPageUrl)){
			chanPageUrl = this.playlistDomain + chanPageUrl;
		}

		return chanPageUrl;
	},
    getChannelId: function(channel, callback, _that){
		var that = _that || this;

		this.getPlayerUrl(channel, url => {
			this.getIdFromFrame(url, channel, chanData => callback(chanData), that);
		}, that);
	},
	getIdFromFrame: function(cUrl, channel, callback, _that, isSkipUrlUpdate){
		var that = this,
			updChanUrl = isSkipUrlUpdate ? cUrl : that.getUpdatedPlayerUrl(cUrl),
            reqParams = Object.assign({}, this.reqParams);

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
	getRegExpMatchData: function(regExp, string){
		let output = [],
			matches;

		while (matches = regExp.exec(string)) {
			output.push({
				groups: matches.groups || {},
				match: matches[0]
			});
		}

		return output.length ? output : null;
	},
    getIdFromFrameRespCallback: function(err, resp, channel, callback, _that){
		var _that = _that || this;
        if (err || resp.statusCode !== 200){
            _that.failed(channel, 'channel`s page/frame not available');
            return;
        }
        
		const chanData = this.getDataFromSourceString(resp.body, channel);

        if(!chanData.id){
            _that.failed(channel, 'id not found on the page/frame');
        }
        else{
            //If channel id is URL && check for URL enabled -> make request and get real id value
            if(this.isStringUrl(chanData.id) && this.isCheckIdForUrl){
                const chanIdUrl = this.torApiUrl + chanData.id;

                this.getIdFromFrame(chanIdUrl, channel, callback, _that, true);
            }
            else {
                callback(chanData);
            }
        }
	},
	getDataFromSourceString: function(source, channel){
		let i = 0,
			data = {};

		while(!data.id && i < this.cRegExps.length){
			var regExp = typeof this.cRegExps[i] === 'function' ? this.cRegExps[i].call(this, channel) : this.cRegExps[i];

			const chanData = this.getRegExpMatchData(regExp, source);

			if (chanData) {
				let firstMatch = chanData[0];
				data = {
					// channel ID
					...firstMatch.groups,
					// get additional channel data
					...this.getAdditionalChannelData(firstMatch.match)
				}
			}

            i++;
        }
        //Check if ID string contains numbers. If not -> failed.
		data.id = /[0-9]+/.test(data.id || '') ? data.id : false;

		return data;
	},
	getAdditionalChannelData: function (chanMatch) {
		return this.channelDataAttrs.reduce((data, attr) => {
			let regExp = new RegExp(`${attr}="(?<${this.toCamelCase(attr)}>.*?)"`, 'igm')
			let match = regExp.exec(chanMatch);

			if (match && match.groups) {
				data = {
					...data,
					...match.groups
				}
			}

			return data;
		}, {});
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
					that.getChannelId(channel, chanData => that.storeChannelItem(channel, chanData));
				}, j * that.genDelay);
			})(curChannel, i);
		}
	},
	getUpdatedPlayerUrl: function(urlPath){
        var domain = this.isProxy ? this.playerDomainProxy : this.playerDomain;

		return this.getUpdatedDomain(urlPath, domain);
	},
    getUpdatedDomain: function(url, domain){
        return domain + $url.parse(url).path;
    },
	getArrayOrObjCopy: function(array){
		return JSON.parse(JSON.stringify(array));
	},
	getLogoUrl: function(name){
		return `${this.logoRelativeUrl}${name.replace(/\./g, '').replace(/:/g, '').replace(/\s/g, '_')}.png`
	},
	getProxyUrl: function(cId) {
		const isAceliveId = !!cId.match(/\.|-|_/);

		return isAceliveId ? `${this.proxyListPrefix}url=${this.aceliveGetter}${cId}` : `${this.proxyListPrefix}id=${cId}`
	},
	toCamelCase: function (str) {
		return str.replace(/\W(\w)/g, $1 => $1.toUpperCase()).replace(/\W/g, '');
	},
	formFullChannList: function(playListExt){
		var channels = '';

		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];

			if(channel.id && channel.id.length >= this.idMinLength)
				channels += this.formChannItem(channel, playListExt);
			else if(channel.id && channel.id.length < this.idMinLength)
                this.failed(channel, 'id shorter than '+ this.idMinLength +' symbols');
		}

		switch (playListExt) {
			case 'xspf':
				return '<?xml version="1.0" encoding="UTF-8"?>' +
						'\n<playlist version="1" xmlns="http://xspf.org/ns/0/">' +
						'\n\t<title>TV playlist: '+ this.getFormatedDate(new Date(), true) +'; failed channels: '+ this.report.failedList.length +'</title>' +
						'\n\t<creator>Vasin Oleksiy</creator>' +
						'\n\t<trackList>' + channels + '\n\t</trackList>' +
						'\n</playlist>';
			case 'm3u':
			case 'm3u8':
				return '#EXTM3U'+
						'\n'+ channels
		}
	},
	formChannItem: function(channel, playListExt) {
		const cName = this.getFullChannelName(channel);
		const { id, isM3uOnly } = channel;

		switch (playListExt) {
			case 'xspf':
				if (isM3uOnly) {
					return '';
				} else {
					return '\n\t\t<track>' +
							'\n\t\t\t<title>' + cName + '</title>' +
							'\n\t\t\t<location>' + id + '</location>' +
							'\n\t\t</track>';
				}
			case 'm3u':
			case 'm3u8':
				const attrStr = this.formM3uAttrs(channel);
				const tvgName = !channel.tvgId ? ` tvg-name="${channel.tvgName || cName}"` : '';
				const tvgLogo = ` tvg-logo="${this.getLogoUrl(cName)}"`;
				const cUrl = this.isStringUrl(id) ? id : this.getProxyUrl(id);

				return '\n#EXTINF:-1 '+ attrStr + tvgName + tvgLogo +','+ cName +
						'\n'+ cUrl
		}
	},

	formM3uAttrs: function(channel) {
		return this.channelDataAttrs.reduce((attrStr, attr) => {
			const val = channel[this.toCamelCase(attr)];

			if (val) {
				attrStr += ` ${attr}="${val}"`;
			}
			return attrStr;
		}, '');
	},
	sendPlaylistGenFailedEmail: function(){
		var sbj = this.emailSubj +' ['+ this.getFormatedDate(new Date, true) +']',
			msg = '<h2>Generation of playlist "'+ this.playListName +'" has been failed.</h2>';

		email.sendMail(sbj, this.emailRecipient, msg);
	},
    isStringUrl: function(url){
        return !!$url.parse(url).hostname;
    },
    isDst: function(){
        return new Date().dst();
    },
	isAbleToRestartChan: function(channel){
		return this.backUpGen && channel.failedCount < this.maxRestartCountPerChannel;
	},
	storeChannelItem: function(channel, channelData){
		this.channelCounter++

		// Assign founded data to the channel
		Object.assign(channel, channelData);

		// clean-up ID
		channel.id = channelData.id.replace('\n', '');

		this.report.updatedList.push(channel);

		//Finish playlist
		if(this.channelCounter >= this.channels.length)
			this.finishPlaylist();
	},
	savePlaylist: function(playlist, isProxyList){
		var playListPath = isProxyList ? this.proxyPlaylistPath : this.playlistPath;

		fs.writeFile(playListPath, playlist, this.writeFileCallback);
	},
	failed: function(channel, errMsg){
		var that = this;

        this.cLog(channel.dName +': '+ errMsg +'\t\t\t:'+ channel.sName);
		channel.errMsg.push(errMsg);

		//Restart gen. of channel item using backup generator
		if( this.isAbleToRestartChan(channel) ){
			setTimeout(function(){
				channel.failedCount++;
				that.backUpGen.getChannelId(channel, chanData => that.storeChannelItem(channel, chanData), that);
			}, this.genDelay || 3000);
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
		this.savePlaylist(this.formFullChannList(this.playlistExt));

		// save same playlist for proxy
		if (this.saveProxyList) {
			this.savePlaylist(this.formFullChannList(this.proxyPlaylistExt), true);
		}
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
        //Send email notification about failed generation
		else{
			this.sendPlaylistGenFailedEmail();
            this.logErr('Attempts of generating playlist have stopped. You can manually restart generation of playlist later in the admin panel.');
			this.tempRestartCount = 0;
		}
	}
}


/**
 * CONFIGS
 */

/**
 * Main config for "Tuchka" player page
**/
var TuchkaPlayerPageConfig = {
    playlistUrl: 'http://tuchkatv.ru/player.html',
	playerUrlPath: '/iframe.php?site=873&channel=',
	storeValidList: function(resp){
		var $ = this.getDom(resp),
			playlist = $('#sidebar select').html();

		this.validList = playlist;
	},
	getPlayerUrl: function(chanNum){
		return this.playerUrlPath + chanNum;
	},
	getChannelId: function(channel, callback, _that){
		var _that = _that || this,
			chanNum = that.getChannelPageUrl(channel, _that),
			chanUrl = this.getPlayerUrl(chanNum);

		if(!chanNum){
		    return;
		}

		this.getIdFromFrame(chanUrl, channel, chanData => callback(chanData), _that);
	}
}

/**
 * Main config for parsing channels from pages - "Tuchka"
**/
var HomepageParserConfig = {
    scheduleGenDelay: 15,
    forceGenDelay: 7,
	maxRestartCount: 2,
    minReqDelay: 2000,
    playlistDomain: 'http://tuchkatv.org',
    linksSel: '#slidemenu a:not([target="_blank"])',
    playlistPartSel: '#dle-content',
    initParams: function(){
        this.playlistUrl = this.playlistDomain;
    },
    getPlaylistParts: function (url, isGenInProgress, callback) {
        var that = this;

        that.getValidPlaylistPart(url, isGenInProgress, function(resp) {
            var $ = that.getDom(resp),
                $links = $(that.linksSel),
                linksArray = [];

            $links.each(function(){
                var url = that.getUpdatedDomain(this.attribs.href, that.playlistDomain);
                linksArray.push(url);
            });
            that.cLog(linksArray);
            if(callback) callback(linksArray);
        });
    },
	storeValidList: function(resp){
		var $ = this.getDom(resp),
			playlistPart = $(this.playlistPartSel).html();

        this.pagesCount++;
		this.validList += playlistPart;
	},
    getPlayerUrl: function(channel, callback, _that){
		var _that = _that || this,
			channelPageUrl = this.getChannelPageUrl(channel, _that);

		if(!channelPageUrl){
			return;
		}

        if(callback) callback(channelPageUrl);
	},
    getIdFromFrame: function(cUrl, channel, callback, _that, isSkipUrlUpdate){
        var _that = _that || this,
			that = this,
			newChanUrl = isSkipUrlUpdate ? cUrl : that.getUpdatedDomain(cUrl, that.playlistDomain);

        that.cLog('Request to: '+ newChanUrl);
        needle.request('GET', newChanUrl, null, {}, function(err, resp){
            that.getIdFromFrameRespCallback(err, resp, channel, callback, _that)
        });
	},
}

/**
 * Main config for generating from source
**/
var SOURCE_CONFIG = {
	generateCountPer24h: 48,
	forceGenDelay: 0,
	scheduleGenDelay: 0,
	minReqDelay: 0,
    playlistUrl: [
		'http://database.freetuxtv.net/WebStreamExport/index?format=m3u&type=1&status=2&lng=sk&country=sk&isp=all',
		'http://91.92.66.82/trash/ttv-list/as.json',
		'/constant/sk'
	],
	getChannelId: function(channel, callback, _that, source = this.validList, isSkipPageUrl){
		let that = _that || this;
		const chanData = this.getDataFromSourceString(source, channel);
		const channelPageUrl = this.getChannelPageUrl(channel, that, true);

		if (chanData.id) {
			callback(chanData);
		} else if (channelPageUrl && !isSkipPageUrl) {
			needle.request('GET', channelPageUrl, null, {compressed: true, follow_max: 5}, (err, resp) => {
				if (err || resp.statusCode !== 200){
					that.failed(channel, 'error in getting page for channel');
					return;
				}
				that.getChannelId(channel, callback, that, resp.body, true);
			});
		} else {
            that.failed(channel, 'id not found on the page/frame');
		}
	}
}

/*
 * Main config for working with JSON
*/
const JSON_CONFIG = {
	generateCountPer24h: 48,
	forceGenDelay: 0,
	scheduleGenDelay: 0,
	minReqDelay: 0,
	playlistUrl: 'http://91.92.66.82/trash/ttv-list/acelive.json',
	storeValidList: function (resp) {
		try {
			this.validList = JSON.parse(resp);
		} catch (err) {
			this.isPlaylistFailed = true;
			this.logErr('Error in parsing JSON!');
			this.playlistFinished();
		}
	},
	getIdFromJson: function(json, channel) {
		const regExp = new RegExp(`${this.getBaseChannelRegExp(channel)}$`, 'i');
		const result = json.filter(({name}) => name && name.match(regExp));

		return result.length ? result[result.length-1].fname : null;
	},
	getChannelId: function (channel, callback, _that) {
		var _that = _that || this,
			id = this.getIdFromJson(this.validList, channel);

		if (!id) {
			_that.failed(channel, 'id not found on the page/frame');
		} else {
			callback({id});
		}
	}
}

/*
    INIT Generator instances
*/

const TorrentAC_SOURCE = new Channel(Object.assign({}, SOURCE_CONFIG, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-List-AS'
}));

const MainPlaylist_ACELIVE = new Channel(Object.assign({}, JSON_CONFIG, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-acelive',
	backUpGen: TorrentAC_SOURCE
}));

const MainPlaylistFromM3u = new Channel(Object.assign({}, SOURCE_CONFIG, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-List-VK+Voron',
	playlistUrl: [
		// 'http://voron.info/media/download/8e4febeaa69785bf1c6ee5f6ba0117a6/playlist.m3u8',
		'http://urlcut.ru/t.m3u',
		'http://91.92.66.82/trash/ttv-list/as.json',
		'http://database.freetuxtv.net/WebStreamExport/index?format=m3u&type=1&status=2&lng=sk&country=sk&isp=all',
		'/constant/sk'
	],
	generateCountPer24h: 24
}));

const MainPlaylistHomepage_tuchka = new Channel(Object.assign({}, HomepageParserConfig, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-List-tuchka',
	generateCountPer24h: 24,
	backUpGen: TorrentAC_SOURCE
}));

const EdemList = new Channel(Object.assign({}, SOURCE_CONFIG, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-List-E',
	playlistUrl: [
		// 'http://voron.info/media/download/8e4febeaa69785bf1c6ee5f6ba0117a6/playlist.m3u8',
		'http://bf1808d1d378.aikonkz.ru/playlists/uplist/92b702c1ad801722c02723d0fc095aa7/playlist.m3u8',
		'http://database.freetuxtv.net/WebStreamExport/index?format=m3u&type=1&status=2&lng=sk&country=sk&isp=all',
		'/constant/sk'
	],
	generateCountPer24h: 24,
	instanceInit() {
		this.cRegExps = [
			this.voronRegExp,
			this.m3uRegExp
		]
	}
}));

const IpStream = new Channel(Object.assign({}, SOURCE_CONFIG, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-Ipstream',
	playlistUrl: [
		cf.IpStreamUrl,
		'http://database.freetuxtv.net/WebStreamExport/index?format=m3u&type=1&status=2&lng=sk&country=sk&isp=all',
		'/constant/sk'
	],
	generateCountPer24h: 24
}));

const PlusPlaylist_SOURCE = new Channel(Object.assign({}, SOURCE_CONFIG, {
	channelsArray: [channels2],
    playListName: 'TV-plus',
	translitEnabled: true
}));

const PlusPlaylist_tuchka = new Channel(Object.assign({}, HomepageParserConfig, {
	channelsArray: [channels2],
    generateTime: '6:30',
	playListName: 'TV-plus-tuchka'
}));

const MainPlaylist_PlayerPageTuchka = new Channel(Object.assign({}, TuchkaPlayerPageConfig, {
	channelsArray: [channels1],
    playListName: 'TV-List-tuchka-player'
}));

const ChannelChangeTracker_tuchka = new Channel(Object.assign({}, HomepageParserConfig, {
    channelsArray: [{dName: 'СТБ', sName: 'СТБ|СТБ Украина|СТБ \\(UA\\)'}],
	firstChannelId: false,
	generateCountPer24h: 48,
    scheduleGenDelay: 10,
    forceGenDelay: 10,
	maxRestartCount: 0,
    minReqDelay: 5000,
	logName: 'log_channelChecker.txt',
	getChannelChangeEmailContent: function(channel){
		return '<h2>Channel\'s id has been changed:</h2>'+
			'<strong>Time:</strong> '+ this.getFormatedDate(new Date, true) +
			'<br><strong>Channel:</strong> '+ this.getFullChannelName(channel) +
			'<br><strong>Old ID value:</strong> '+ this.firstChannelId +
			'<br><strong>New ID value:</strong> '+ channel.id;
	},
	sendChannelChangeEmail: function(channel){
		var sbj = this.emailSubj +' ['+ this.getFormatedDate(new Date, true) +']';
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
			changedText = isChanged ? ' :CHANGED' : '',
            logMsg = this.getFullChannelName(firstChannel) +': '+ firstChannel.id + changedText;

		this.logInfo(logMsg);
        this.cLog(logMsg);
		if(isChanged) this.sendChannelChangeEmail(firstChannel);

		this.firstChannelId = firstChannel.id;
		this.playlistFinished();
	}
}));

/**
 * Class which run playlist generation
 */
class Playlists {
	constructor(playlists = [], callback) {
		this.playlists = playlists;
		this.callback = callback;

		this.init();
	}

	init () {
		if(this.playlists.length) {
			this.startPlaylists();
		} else {
			this.runCallback();
			console.info('No playlists defined for generation.');
		}
	}

	startPlaylists() {
		const playlists = this.playlists,
            playlistsLength = playlists.length;

        for(let i=0; i < playlistsLength ; i++){
			const instance = playlists[i],
				nextInstance = playlists[i+1];

			if(nextInstance){
				instance.callback = () => nextInstance.start();
			} else {
				this.runCallback();
			}
        }

		// Start first playlist -> others will be generated in a chain
        playlists[0].start();
	}

	runCallback() {
		if(typeof this.callback === 'function') {
			this.callback();
		}
	}
};

module.exports = {
	init: function(){
		const channelChecker = () => {
			if (cf.playListChannelChecker) {
				ChannelChangeTracker_tuchka.start();
			}
		}

		if(cf.playlistEnabled){
			const playlists = new Playlists([
				IpStream
			], channelChecker);
		} else {
            channelChecker();
        }
	},
	forceGeneratePlaylists: function(res){
        var errMsg;

        //Check for errors
        if(generationInProgress){
            errMsg = 'Playlist generation in progress now. Please try later.';
        }
        else if(!cf.playlistEnabled){
            errMsg = 'Playlist generation disabled!';
        }

        //Generate or send error message if exist
		if(!errMsg){
			Channel.prototype.forceGeneratePlaylists();
			res.send('Generation started!');
		}
		else{
			res.status(503).send(errMsg);
		}
	}
}
