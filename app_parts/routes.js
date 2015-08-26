var mime = require('mime'),
	fs 	= require('fs'),
	needle = require('needle'),
	mkdirp = require('mkdirp'),
	rmdir = require('rimraf'),
	path = require('path'),
	fbgraph = require('fbgraphapi'),
	legacy = require('legacy-encoding'),
	cf = require('./../config/config.js'),
	auth = require('./auth.js'),
	read = require('./readFileFolder.js'),
	User = require('./user.js'),
	playlist = require('./playListUpdater.js');


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
	cookieValid: 1000*60*60*5,
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
	setCookie: function(domain, cookieArray){
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
			for (var prop in source) {
				target[prop] = source[prop];
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

			that.setCookie(req.query.url, resp.headers['set-cookie']);
			that.makeProxyRequest(req, res, true);
		});
	},
	sendRequest: function(req, res, options){
		var that = this;

		needle.request(req.query.type, req.query.url, req.query.data, options, function(err, resp) {
			var respHeaders = that.extendObj({}, that.respHeaders);

			if (err || resp.statusCode == 404 || resp.statusCode == 500){
				res.header(respHeaders).status(500).send(req.query.url);
				return;
			}

			var respBody = legacy.decode(resp.raw, 'utf8', {
				mode: 'html'
			});

			res.header(that.extendObj(respHeaders, {				
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

function init(app){
	app.post('/login', function(req, res){
		var fb = new fbgraph.Facebook(req.body.token, cf.FBv);

		fb.graph('/me?fields=id,name,picture,email', function(err, userData) {
			if(err){
				res.status(500).send('User not found on facebook');
				return;
			}

			User.findOne({id: userData.id}, function(err, user){
				if(err) throw err;
				
				if(user && user._doc)
					auth.updateCurrentUser(user, userData, res);
				else
					auth.newUser(userData, res);
			});
		});
	});

	app.get('/admin', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		res.render('adminPanel.jade', {
				title: 'Admin panel',
				user: res.user,
				cf: cf
		});
	});

	app.get('/playlistForceGenerate', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		playlist.forceGeneratePlaylists();
		res.send('Generation started!');
	});

	app.post('/upload', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		var fName = req.header('x-file-name'),
			fPath = req.header('x-file-path'),
			fRelativePath = path.join(fPath, fName),
			fFullPath = decodeURI(path.join(filesP, fRelativePath)),
			wStream = fs.createWriteStream(fFullPath),
			body = '';

		req.pipe( wStream );
		wStream.on('finish', function(){
			res.send("Success!");
		});
		wStream.on('error', function(){
			res.status(500).send("Error in saving file.");
		});
	});

	app.get('/create', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		var folderPath = path.join(filesP, req.query.oldPath, req.query.name);

		mkdirp(folderPath, function(err){
			if(err)
				res.send({error: err});
			else
				res.send("Success!");
		});
	});

	app.get('/rename', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		var fileOldPath = path.join(filesP, req.query.oldPath, req.query.oldName),
			filePath = path.join(filesP, req.query.oldPath, req.query.name);

		fs.rename(fileOldPath, filePath, function(err){
			if(err)
				res.send({error: err});
			else
				res.send("Success!");
		});
	});

	app.get('/delete', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		var filePath = path.join(filesP, req.query.oldPath, req.query.oldName);

		rmdir(filePath, function(err){
			if(err)
				res.send({error: err});
			else
				res.send("Success!");
		});
	});

	app.get('/proxy', function(req, res){
		//Make proxy request
		Proxy.makeProxyRequest(req, res);
	});

	app.get('/error404', function(req, res){
		res.status(404).render('error404.jade');
	});

	app.get('*', function(req, res){
		var p =  decodeURI(path.join(filesP, req.path)),
			pathArray = req.path.split('/');

		fs.stat(p, function(err, stat){
			if(!err && !res.getHeader('Content-Type') ){
				var file = {
					name: pathArray[pathArray.length-1],
					total: stat.size,
					mtime: new Date(stat.mtime.toUTCString()),
					type: mime.lookup(p),
					charset: mime.charsets.lookup(this.type)
				}

				if(stat.isDirectory()){
					auth.isLogged(req, res, function(){
						read.readFolder(req, res);
					});
				}
				else{
					read.readFile(req, res, file);
				}
			}
			else
				res.redirect('/error404');
		});
	});
}

module.exports.init = init;



