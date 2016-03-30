var needle = require('needle'),
	legacy = require('legacy-encoding');

/*
cookieList: {
	domain: {
		validTill: milisec,
		cookies: []
	},
	......
}
*/
var Proxy = {
	cookieValid: 1000*60*60*3,
	cookieList: {},
	reqOptions: {
		headers: {
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
		},
		method: 'HEAD'
	},
	respHeaders: {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Expose-Headers': 'Redirect-To'
	},
	storeCookies: function(domain, cookieArray){
		var newCookieArray = [];

		if(typeof cookieArray == 'undefined' || cookieArray.length <= 0){
			console.log('Nothing to set. Empty cookie array!');
			return;
		}

		cookieArray.forEach(function (elem) {
			newCookieArray.push(elem.split(';')[0]);
		});

		this.cookieList[domain] = {
			cookies: newCookieArray.join('; '),
			validTill: (new Date()).getTime() + this.cookieValid
		}
	},
	getCookie: function(domain){
		var cookiesObj = this.cookieList[domain];
		
		return typeof cookiesObj != 'undefined' ? cookiesObj.cookies : '';
	},
	getReferer: function(params){
		return params.url +'?'+ this.serializeObj(params.data);
	},
	isValidCookies: function(params){
		var isValid = false,
			curTime = (new Date()).getTime(),
			domain = params.url,
			cookies = this.cookieList[domain];
		
		if(typeof cookies != 'undefined' && cookies.validTill > curTime)
			isValid = true;
		
		return isValid;
	},
	serializeObj: function(obj){
		var str = '';
		for (var key in obj) {
			if (str != '') {
				str += '&';
			}
			str += key + '=' + encodeURIComponent(obj[key]);
		}
		return str;
	},
	extendObj: function(target) {
		var sources = [].slice.call(arguments, 1);

		sources.forEach(function (source) {
			var unlinkedSource = JSON.parse(JSON.stringify(source));
			for (var prop in unlinkedSource){
				target[prop] = unlinkedSource[prop];
			}
		});
		return target;
	},
	requestCookies: function(params, res, callback){
		var that = this,
			reqType = params.type ? params.type : 'GET',
			errCookieMsg = 'Error in sending request for cookies.';

		needle.request(reqType, params.url, params.data, that.reqOptions, function(err, resp) {
			if (err || resp.statusCode == 404 || resp.statusCode == 500){
				if(callback)
					callback(new Error(errCookieMsg), {});
				else if(res)
					res.status(500).send(params.url);
				return;
			}

			that.storeCookies(params.url, resp.headers['set-cookie']);
			that.makeProxyRequest(params, res, true, callback);
		});
	},
	sendRequest: function(params, res, options, callback){
		var that = this,
			reqType = params.type ? params.type : 'GET',
			errUrlMsg = 'Url not specified.';
		
		//Return if URL not specified.
		if(typeof params.url == 'undefined'){
			if(callback)
				callback(new Error(errUrlMsg), {});
			else if(res)
				res.staus(404).send(errUrlMsg)
			return;
		}

		needle.request(reqType, params.url, params.data, options, function(err, resp) {
			if (err || resp.statusCode == 404 || resp.statusCode == 500){
				var gErr = err ? err : new Error('Unavailable');
				if(callback)
					callback(gErr, resp)
				else if(res)
					res.header(that.respHeaders).status(500).send(params.url);
				return;
			}

			resp.body = legacy.decode(resp.raw, 'utf8', {
				mode: 'html'
			});

			if(callback){
				callback(null, resp)
			}
			else if(res){
				res.header(that.extendObj({}, that.respHeaders, {				
					'Content-Weight': resp.headers['content-length'],
					'Last-Modified': resp.headers['last-modified'],
					'Redirect-To': decodeURIComponent(resp.headers['location'])
				}));
				res.send(resp.body);
			}
		});
	},
	makeProxyRequest: function(params, res, skipCookieCheck, callback){
		if(!skipCookieCheck && params.isCookies == 'true' && !this.isValidCookies(params)){
			this.requestCookies(params, res, callback);
			return;
		}

		var optionsInstance = this.extendObj({}, this.reqOptions);

		optionsInstance.headers['Cookie'] = this.getCookie(params.url);
		optionsInstance.headers['Referer'] = this.getReferer(params);

		//Set proxy if it was requested
		if(typeof params.proxy != undefined)
			optionsInstance.proxy = params.proxy;

		//Send request
		this.sendRequest(params, res, optionsInstance, callback);
	}
};

module.exports = Proxy;