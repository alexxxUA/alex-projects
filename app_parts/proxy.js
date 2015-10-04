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
	getReferer: function(req){
		return req.query.url +'?'+ this.serializeObj(req.query.data);
	},
	isValidCookies: function(req){
		var isValid = false,
			curTime = (new Date()).getTime(),
			domain = req.query.url,
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
	requestCookies: function(req, res){
		var that = this;

		needle.request(req.query.type, req.query.url, req.query.data, that.reqOptions, function(err, resp) {
			if (err || resp.statusCode == 404 || resp.statusCode == 500){
				console.log('Error in sending request for cookies.');
				res.status(500).send(req.query.url);
				return;
			}

			that.storeCookies(req.query.url, resp.headers['set-cookie']);
			that.makeProxyRequest(req, res, true);
		});
	},
	sendRequest: function(req, res, options){
		var that = this;
		
		//Return if URL not specified.
		if(typeof req.query.url == 'undefined'){
			res.staus(404).send('Url not specified.')
			return;
		}

		needle.request(req.query.type, req.query.url, req.query.data, options, function(err, resp) {
			if (err || resp.statusCode == 404 || resp.statusCode == 500){
				res.header(that.respHeaders).status(500).send(req.query.url);
				return;
			}

			var respBody = legacy.decode(resp.raw, 'utf8', {
				mode: 'html'
			});

			res.header(that.extendObj({}, that.respHeaders, {				
				'Content-Weight': resp.headers['content-length'],
				'Last-Modified': resp.headers['last-modified'],
				'Redirect-To': decodeURIComponent(resp.headers['location'])
			}));
			res.send(respBody);
		});
	},
	makeProxyRequest: function(req, res, skipCookieCheck){
		if(!skipCookieCheck && req.query.isCookies == 'true' && !this.isValidCookies(req)){
			this.requestCookies(req, res);
			return;
		}

		var optionsInstance = this.extendObj({}, this.reqOptions);

		optionsInstance.headers['Cookie'] = this.getCookie(req.query.url);
		optionsInstance.headers['Referer'] = this.getReferer(req);

		//Set proxy if it was requested
		if(typeof req.query.proxy != undefined)
			optionsInstance.proxy = req.query.proxy;

		//Send request
		this.sendRequest(req, res, optionsInstance);
	}
};

module.exports = Proxy;