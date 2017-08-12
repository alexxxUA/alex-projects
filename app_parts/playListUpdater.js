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
	proxy = require('./proxy.js'),
	email = require('./sendMail.js'),
	channels1 = require('./../files/UpdateChanList/js/channelList.js').channelList,
	channels2 = require('./../config/channelList2.js').channelList,
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
    this.isGenOnStart = cf.playlistGenOnStart;
	this.isCheckIdForUrl = false;
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
	this.generateTime = '5:45';
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
        new RegExp('(?:this\.loadPlayer\\((?:"|\'))(.+)?(?:"|\')', 'img'),
        new RegExp('(?:this\.loadTorrent\\((?:"|\'))(.+)?(?:"|\')', 'img'),
        new RegExp('(?:data-stream_url=(?:"|\'))(.+)?(?:"|\')', 'img'),
		new RegExp('(?:player\\.php\\?[^=]*=)([^\'"<]*)', 'img'),
        //Search for id in jsonp responce from "this.torApiUrl"
        new RegExp('(?:id":")(.+)?(?:",)', 'img')
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
	playlisGeneratorInstanses: [],
	forceGeneratePlaylists: function(){
        var playlists = this.playlisGeneratorInstanses,
            playlistsLength = playlists.length,
            playlistsCallStack;

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
		prependFile(this.logPath, '[INFO - '+ this.getformatedDate(new Date, true) +'] '+ msg +'\n\n');
	},
	logErr: function(msg){
		this.cLog('ERROR: '+ msg);
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

	},
    start: function(callback){
        //Save playlist page for backup
		if(this.backUpGen){
            this.backUpGen.getValidPlaylist.call(this.backUpGen);
        }
        if(this.isGenOnStart){
            if(typeof callback == 'function') this.callback = callback;
            this.genValidPlaylist(true);
        }
        else{
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
        this.validList = '';
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
		channel.flags = channel.flags ? channel.flags : '';

		extend(channel, this.getObjFromFlags(channel.flags));
	},
    updateChannelSname: function(channel){
		var translitName = translit(channel.dName);

		//Check if sName exist. If no -> add default one from dName property
		channel.sName = channel.sName ? channel.sName : channel.dName;
		//Add translit value of dName property
		channel.sName += '|' + translitName;
		//Code spaces with regExp
        channel.sName = channel.sName.replace(/\s+/g, '\\s*-*');
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
		var generationSpentTime = this.getGenTime(false).time,
            nextTimeOffset = (this.isGenerateInTime ? this.getOffsetTillTime(this.generateTime) : this.getOffsetNextHour()) - generationSpentTime;
        return nextTimeOffset > 0 ? nextTimeOffset : 0;
	},
	getDom: function(html){
		return	cheerio.load(html, {decodeEntities: false}, { features: { QuerySelector: true }});
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
    getHdForRegexp: function(channel){
        return channel.isHd ? '(?:\\s*-*hd|\\s*-*cee)' : '(?!\\s*-*hd)';
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
			regExpAray = [
				new RegExp('(?:<a.*?href="((?:[^"]+)?(?:'+ channel.sName +')'+ isHd +'(?:\\.(?:html|php))?)?")', 'im'),
				new RegExp('(?:<a.*?href="(.*?)")(?:.+)?(?:(?:'+ channel.sName +')'+ isHd +')(?:.+)?(?:<\/a>)', 'im'),
				new RegExp('(?:<a.*?href="(.*?)".*?>)(?:\\s*(?:.*' + channel.sName + ')' + isHd + '\\s*<\/a>)', 'im'),
				new RegExp('(?:<option\\s+value="([0-9]*)"\\s*>)(?:\\s*(?:.*' + channel.sName + ')' + isHd + '\\s*<\/option>)', 'im')
			],
			i = 0,
			chanPageUrl;

		while(!chanPageUrl && i < regExpAray.length){
			chanPageUrl = this.validList.match(regExpAray[i]);
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
            i = 0,
            chanId;

        while(!chanId && i < this.cRegExps.length){
            chanId = this.getRegExpMatchArray(this.cRegExps[i], resp.body);
            chanId = chanId.length ? chanId[chanId.length - 1] : false;
            i++;
        }
        //Check if ID string contains numbers. If not -> failed.
        chanId = /[0-9]+/.test(chanId) ? chanId : false;

        if(!chanId){
            _that.failed(channel, 'id not found on the page/frame');
        }
        else{
            //If channel id is URL && check for URL enabled -> make request and get real id value
            if( this.isStringUrl(chanId) && this.isCheckIdForUrl){
                var chanIdUrl = this.torApiUrl + chanId;

                this.getIdFromFrame(chanIdUrl, channel, callback, _that, true);
            }
            else {
                callback(chanId);
            }
        }
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
    isStringUrl: function(url){
        return !!$url.parse(url).hostname;
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

        this.cLog(channel.dName +': '+ errMsg +'\t\t\t:'+ channel.sName);
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
    playlistDomain: 'http://torrentstream.tv',
    initParams: function(){
        this.playlistUrl = this.playlistDomain +'/browse-vse-kanali-tv-videos-1-date.html';
    },
	storeValidList: function(resp){
		this.validList = resp.body;
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
		var $ = this.getDom(resp.body),
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
var TuckaHomepageConfig = {
    scheduleGenDelay: 15,
    forceGenDelay: 7,
	maxRestartCount: 2,
    minReqDelay: 2000,
    playlistDomain: 'http://tuchkatv.ru',
    linksSel: '#slidemenu a:not([target="_blank"])',
    playlistPartSel: '#dle-content',
    initParams: function(){
        this.playlistUrl = this.playlistDomain;
    },
    getValidPlaylist: function(callback){
        var that = this;
        that.pagesCount = 0;
        that.validList = '';

        that.getPagesArray(that.playlistUrl, function(pages){
            var pagesTotal = pages.length;

            for(var i=0; i<pagesTotal; i++){
                var pageUrl = pages[i];

                (function(j, url){
                    setTimeout(function(){
                        that.getValidPlaylistPart(url, function(resp){
                            that.storeValidList(resp);
                            that.cLog('Page: '+ (j+1) +';  '+ url +'. Downloaded');
                            //Call callback in case all parts collected
                            if(callback && that.pagesCount == pagesTotal) {
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
    getPagesArray: function(url, callback){
        var that = this;

        that.getValidPlaylistPart(url, function(resp){
            var $ = that.getDom(resp.body),
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
		var $ = this.getDom(resp.body),
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

/*
    INIT Genarator instances
*/
var MainPlaylist_torStream = new Channel(extend({}, TorStreamMainConfig, {
	channelsArray: [channels1],
    playListName: 'TV_List_torrent_stream.xspf',
	logName: 'log_torrent_stream.txt'
}));
var MainPlaylistHomepage_torStreamRu = new Channel(extend({}, TuckaHomepageConfig, {
    forceGenDelay: 4,
	isCheckIdForUrl: true,
	channelsArray: [channels1],
    playListName: 'TV_List_torrent_stream.xspf',
	logName: 'log_torrent_stream.txt',
    playlistDomain: 'http://www.torrent-stream.ru',
    linksSel: '.menu-iconmenu li:not(.first):not(.last):not(.jsn-icon-mail):not(.jsn-icon-mountain) a',
    playlistPartSel: '#jsn-mainbody'
}));
var MainPlaylistHomepage_tucka = new Channel(extend({}, TuckaHomepageConfig, {
	channelsArray: [channels1],
    playListName: 'TV_List_torrent_stream.xspf',
	logName: 'log_torrent_stream.txt',
    backUpGen: MainPlaylistHomepage_torStreamRu
}));
var SecondaryPlaylist_tucka = new Channel(extend({}, TuckaHomepageConfig, {
	channelsArray: [channels2],
    generateTime: '6:30',
	playListName: 'TV_List_tuchka.xspf',
	logName: 'log_tuchka.txt'
}));
var MainPlaylist_tucka = new Channel(extend({}, TuckaMainConfig, {
	channelsArray: [channels1],
    playListName: 'TV_List_torrent_stream.xspf',
	logName: 'log_torrent_stream.txt'
}));
var ChannelChangeTracker_tucka = new Channel(extend({}, TuckaHomepageConfig, {
    channelsArray: [{dName: 'СТБ', sName: 'СТБ|СТБ Украина|СТБ \\(UA\\)'}],
	firstChannelId: false,
	isGenerateInTime: false,
	generateCountPer24h: 48,
    scheduleGenDelay: 10,
    forceGenDelay: 10,
	maxRestartCount: 0,
    minReqDelay: 5000,
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
			MainPlaylistHomepage_tucka.start(function(){
				SecondaryPlaylist_tucka.start(function(){
                    if(cf.playListChannelChecker){
                        ChannelChangeTracker_tucka.start();
                    }
                });
			});
		}
        if(!cf.playlistEnabled && cf.playListChannelChecker){
            ChannelChangeTracker_tucka.start();
        }
	},
	forceGeneratePlaylists: function(res){
        var errMsg;

        //Check for errors
        if(generationInProgress){
            errMsg = 'Playlist generation inprogress now. Please try later.';
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
