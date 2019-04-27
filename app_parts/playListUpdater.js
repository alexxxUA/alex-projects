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
	this.logoRelativeUrl = 'http://avasin.ml/UpdateChanList/App/Sources/Channel_icons/';
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

    //RegExps array for search channel id or url
    this.cRegExps = [
		// Search in .m3u playlist with URL contains "kyivstar"
		channel => {
			var isHd = this.getHdForRegexp(channel);
			return new RegExp('(?:EXTINF\:-?\\d,\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*\\n+(.*?kyivstar.*))', 'img');
		},
		// Search in .m3u playlist with URL contains "streams"
		channel => {
			var isHd = this.getHdForRegexp(channel);
			return new RegExp('(?:EXTINF\:-?\\d,\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*\\n+(.*?streams.*))', 'img');
		},
		// Search in .m3u playlist with URL contains "play/"
		channel => {
			var isHd = this.getHdForRegexp(channel);
			return new RegExp('(?:EXTINF\:-?\\d,\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*\\n+(.*?play/.*))', 'img');
		},
		// Search in .m3u playlist
		channel => {
			var isHd = this.getHdForRegexp(channel);
			return new RegExp('(?:EXTINF\:-?\\d,\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*\\n+(.*))', 'img');
		},
		// search in JSON
		channel => new RegExp(`(?:"${this.getBaseChannelRegExp(channel)}","url":"(.+?)?")`, 'img'),
        new RegExp('(?:acestream\:\/\/(.+)?(?:"|\'))', 'img'),
        new RegExp('(?:this\.loadPlayer\\((?:"|\'))(.+)?(?:"|\')', 'img'),
        new RegExp('(?:this\.loadTorrent\\((?:"|\'))(.+)?(?:"|\')', 'img'),
        new RegExp('(?:data-stream_url=(?:"|\'))(.+)?(?:"|\')', 'img'),
		new RegExp('(?:player\\.php\\?[^=]*=)([^\'"<]+)', 'img'),
        //Search for id in jsonp response from "this.torApiUrl"
		new RegExp('(?:id":")(.+)?(?:",)', 'img'),
		channel => {
			var isHd = this.getHdForRegexp(channel);
			return new RegExp('(?:<location>)(.*?)(?:</location>\\s*\\n*\\s*<title>\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*</title>)', 'img');
		}
    ];

	this.emailSubj = 'Playlist generator notifier';
	this.emailRecipient = 'aluaex@gmail.com';

	this.outputPath = cf.playlistOutputPath;
	this.logsOutputPath = `${cf.playlistOutputPath}/Logs`
	this.playListName = 'TV_List';
	this.playlistExt = 'xspf'
	this.proxyPlaylistExt = 'm3u'
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
    this.init();
}

/**
 * General methods for Channel class
**/
Channel.prototype = {
	playlistGeneratorInstances: [],
	cache: {},
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
        if(this.isLog) console.log(msg);
    },
	logInfo: function(msg){
		this.cLog('INFO: '+ msg);
		prependFile(this.logPath, '[INFO - '+ this.getFormatedDate(new Date, true) +'] '+ msg +'\n\n');
	},
	logErr: function(msg){
		this.cLog('ERROR: '+ msg);
		prependFile(this.logPath, '[ERROR - '+ this.getFormatedDate(new Date, true) +'] '+ msg +'\n\n');
	},
    logStartGeneration: function(){
        var now = new Date(),
            approxEndGenMs = now.getTime() + this.generationSpentTime,
            approxEndDateString = this.getFormatedDate( new Date(approxEndGenMs), true ),
            genTimeString = this.getGenTime().string;

        this.logInfo('Generation started and will take ~ '+ genTimeString +'. End time ~ '+ approxEndDateString +'.');
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
        if(this.isGenOnStart){
			if(typeof callback == 'function') this.callback = callback;
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

		//Gen playlist
		this.getValidPlaylist(function(){
			that.getList();
		});
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

		//Save playlist page for backup
		if(that.backUpGen){
			that.backUpGen.getValidPlaylist.call(that.backUpGen);
		}

		that.getPlaylistParts(that.playlistUrl, isGenInProgress, function(urls) {
			const urlsCount = urls.length;
			let urlsIndex = 0;

            for(var i = 0; i < urlsCount; i++){
                var pageUrl = urls[i];

                (function(j, url){
                    setTimeout(function(){
                        that.getValidPlaylistPart(url, isGenInProgress, function(resp, isFromCache) {
							urlsIndex++
                            that.storeValidList(resp);
                            that.cLog(`Page: ${(j+1)};  ${url}. ${isFromCache ? 'Taken from CACHE' : 'Downloaded'}.`);
                            //Call callback in case all parts collected
                            if(callback && urlsIndex === urlsCount) {
                                setTimeout(function(){
                                    that.cLog('All playlist\'s parts are downloaded. Starting generation.');
                                    callback();
                                }, that.minReqDelay);
                            }
                        });
                    }, j * that.minReqDelay);
                })(i, pageUrl);
            }
        });
	},
	resetValidList: function() {
		this.validList = ''
	},
	storeValidList: function (respString){
		this.validList += respString;
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
	getChannelPageUrl: function(channel, _that){
		var _that = _that || this,
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
			_that.failed(channel, 'not found on the playlist page');
		}
		//If chanPageUrl with relative path -> add domain value for it
		else if(!this.isStringUrl(chanPageUrl)){
			chanPageUrl = this.playlistDomain + chanPageUrl;
		}

		return chanPageUrl;
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
	getRegExpMatchArray: function(regExp, string){
		var output = [],
			matches;

		while (matches = regExp.exec(string)) {
			output.push(matches[1]);
		}
		return output;
	},
    getIdFromFrameRespCallback: function(err, resp, channel, callback, _that){
        if (err || resp.statusCode !== 200){
            _that.failed(channel, 'channel`s page/frame not available');
            return;
        }

        var _that = _that || this,
            chanId = this.getIdFromSourceString(resp.body, channel);

        if(!chanId){
            _that.failed(channel, 'id not found on the page/frame');
        }
        else{
            //If channel id is URL && check for URL enabled -> make request and get real id value
            if(this.isStringUrl(chanId) && this.isCheckIdForUrl){
                var chanIdUrl = this.torApiUrl + chanId;

                this.getIdFromFrame(chanIdUrl, channel, callback, _that, true);
            }
            else {
                callback(chanId);
            }
        }
	},
	getIdFromSourceString: function(source, channel){
		var i = 0,
			chanId;

		while(!chanId && i < this.cRegExps.length){
			var regExp = typeof this.cRegExps[i] === 'function' ? this.cRegExps[i].call(this, channel) : this.cRegExps[i];

            chanId = this.getRegExpMatchArray(regExp, source);
            chanId = chanId.length ? chanId[0] : false;
            i++;
        }
        //Check if ID string contains numbers. If not -> failed.
		chanId = /[0-9]+/.test(chanId) ? chanId : false;

		return chanId;
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
		return `${this.logoRelativeUrl}${name.replace(/\./g, '').replace(/\s/g, '_')}.png`
	},
	getProxyUrl: function(cId) {
		const isAceliveId = !!cId.match(/\.|-|_/);

		return isAceliveId ? `${this.proxyListPrefix}url=${this.aceliveGetter}${cId}` : `${this.proxyListPrefix}id=${cId}`
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
				return '#EXTM3U'+
						'\n'+ channels
		}
	},
	formChannItem: function(channel, playListExt) {
		var cName = this.getFullChannelName(channel),
			cId = channel.id;

		switch (playListExt) {
			case 'xspf':
				if (channel.isM3uOnly) {
					return '';
				} else {
					return '\n\t\t<track>' +
							'\n\t\t\t<title>' + cName + '</title>' +
							'\n\t\t\t<location>' + cId + '</location>' +
							'\n\t\t</track>';
				}
			case 'm3u':
				var tvgName = channel.pName || cName.replace(/\s/g, '_'),
					cUrl = this.isStringUrl(cId) ? cId : this.getProxyUrl(cId);

				return '\n#EXTINF:-1 tvg-name="'+ tvgName +'" tvg-logo="'+ this.getLogoUrl(cName) +'",'+ cName +
						'\n'+ cUrl
		}
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
		return typeof this.backUpGen != 'undefined'
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
	savePlaylist: function(playlist, isProxyList){
		var playListPath = isProxyList ? this.proxyPlaylistPath : this.playlistPath;

		fs.writeFile(playListPath, playlist);
	},
	failed: function(channel, errMsg){
		var that = this;

        this.cLog(channel.dName +': '+ errMsg +'\t\t\t:'+ channel.sName);
		channel.errMsg.push(errMsg);

		//Restart gen. of channel item using backup generator
		if( this.isAbleToRestartChan(channel) ){
			setTimeout(function(){
				channel.failedCount++;
				that.backUpGen.getChannelId(channel, function(ID){
					that.storeChannelItem(channel, ID)
				}, that);
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
 * Main config for "Torrent stream" source
**/
var TorStreamMainConfig = {
    playlistDomain: 'http://torrentstream.tv',
    initParams: function(){
        this.playlistUrl = this.playlistDomain +'/browse-vse-kanali-tv-videos-1-date.html';
    },
	getPlayerUrl: function(channel, callback, _that){
		var _that = _that || this,
			that = this,
			channelPageUrl = that.getChannelPageUrl(channel, _that);

		if(!channelPageUrl){
			return;
		}

		needle.request('GET', channelPageUrl, null, {}, function(err, resp) {
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

		this.getIdFromFrame(chanUrl, channel, function(chanId){
			callback(chanId);
		}, _that);
	}
}

/**
 * Main config for "Tuchka" source from homepage
**/
var TuchkaHomepageConfig = {
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
 * Main config for generating from source ttv.json
**/
var SOURCE_CONFIG = {
	generateCountPer24h: 48,
	forceGenDelay: 0,
	scheduleGenDelay: 0,
	minReqDelay: 0,
    playlistUrl: [
		'http://database.freetuxtv.net/WebStreamExport/index?format=m3u&type=1&status=2&lng=sk&country=sk&isp=all',
		'http://91.92.66.82/trash/ttv-list/as.json'
	],
	getChannelId: function(channel, callback, _that){
		var _that = _that || this,
			chanId = this.getIdFromSourceString(this.validList, channel);

		if(!chanId){
            _that.failed(channel, 'id not found on the page/frame');
        } else {
			callback(chanId);
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
			chanId = this.getIdFromJson(this.validList, channel);

		if (!chanId) {
			_that.failed(channel, 'id not found on the page/frame');
		} else {
			callback(chanId);
		}
	}
}

/*
    INIT Generator instances
*/

const BackUpGen_SOURCE = new Channel(Object.assign({}, SOURCE_CONFIG, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-List-AS'
}));

const MainPlaylistFromM3u = new Channel(Object.assign({}, SOURCE_CONFIG, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-List-VK+Voron',
	playlistUrl: [
		'http://urlcut.ru/t.m3u',
		//'http://voron.info/media/download/8e4febeaa69785bf1c6ee5f6ba0117a6/playlist.m3u8'
	],
	generateCountPer24h: 24,
	backUpGen: BackUpGen_SOURCE
}));

const MainPlaylist_SOURCE = new Channel(Object.assign({}, SOURCE_CONFIG, {
	playlistUrl: 'http://91.92.66.82/trash/ttv-list/ttv.json',
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-List-TTV',
	generateTime: '8:00',
	generateCountPer24h: 1,
	maxRestartCount: 1
}));

const MainPlaylist_SOURCE_JSON = new Channel(Object.assign({}, JSON_CONFIG, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-acelive'
}));

const SecondaryPlaylist_SOURCE = new Channel(Object.assign({}, SOURCE_CONFIG, {
	channelsArray: [channels2],
    playListName: 'TV-plus',
	translitEnabled: true
}));

const MainPlaylistHomepage_tuchka = new Channel(Object.assign({}, TuchkaHomepageConfig, {
	channelsArray: [channels1, channelListSk],
	playListName: 'TV-List-tuchka',
	generateCountPer24h: 24,
	backUpGen: BackUpGen_SOURCE
}));

const MainPlaylist_torStream = new Channel(Object.assign({}, TorStreamMainConfig, {
	channelsArray: [channels1],
    playListName: 'TV-List-torrent-stream'
}));

const MainPlaylistHomepage_torStreamRu = new Channel(Object.assign({}, TuchkaHomepageConfig, {
	forceGenDelay: 4,
	isCheckIdForUrl: true,
	channelsArray: [channels1],
	playListName: 'TV-List-torrent-stream',
	playlistDomain: 'http://www.torrent-stream.ru',
	linksSel: '.menu-iconmenu li:not(.first):not(.last):not(.jsn-icon-mail):not(.jsn-icon-mountain) a',
	playlistPartSel: '#jsn-mainbody'
}));

const SecondaryPlaylist_tucka = new Channel(Object.assign({}, TuchkaHomepageConfig, {
	channelsArray: [channels2],
    generateTime: '6:30',
	playListName: 'TV-List-tuchka-plus'
}));

const MainPlaylist_tucka = new Channel(Object.assign({}, TuckaMainConfig, {
	channelsArray: [channels1],
    playListName: 'TV-List-tuchka-player'
}));

const ChannelChangeTracker_tucka = new Channel(Object.assign({}, TuchkaHomepageConfig, {
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

module.exports = {
	init: function(){
		if(cf.playlistEnabled){
			MainPlaylistFromM3u.start(function () {
				BackUpGen_SOURCE.start(function () {
					MainPlaylist_SOURCE_JSON.start(function(){
							MainPlaylistHomepage_tuchka.start(function () {
								if(cf.playListChannelChecker){
									ChannelChangeTracker_tucka.start();
								}
							});
						});
					});
				});
		} else if (cf.playListChannelChecker) {
            ChannelChangeTracker_tucka.start();
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
