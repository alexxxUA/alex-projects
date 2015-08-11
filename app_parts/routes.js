var mime = require('mime'),
	fs 	= require('fs'),
	needle = require('needle'),
	mkdirp = require('mkdirp'),
	rmdir = require('rimraf'),
	path = require('path'),
	fbgraph = require('fbgraphapi'),
	cf = require('./../config/config.js'),
	auth = require('./auth.js'),
	read = require('./readFileFolder.js'),
	User = require('./user.js'),
	playlist = require('./playListUpdater.js');

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
		var reqOptions = {
				headers: {
					'Accept': 'text/html'
				},
				method: 'HEAD'
			};

		//console.log('\nType: '+ req.query.type +'\nURL: '+req.query.url +'\nData: '+ req.query.data +'\n');

		needle.request(req.query.type, req.query.url, req.query.data, reqOptions, function(err, resp) {
			if (err || resp.statusCode == 404 || resp.statusCode == 500){
				res.status(500).send(req.query.url);
				return;
			}
			var data = {
				body: resp.body.toString('utf8'),
				lModified: resp.headers['last-modified'],
				length: resp.headers['content-length']
			};
			res.send(data);
		});
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
