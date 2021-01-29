var mime = require('mime-types'),
	fs 	= require('fs'),
	mkdirp = require('mkdirp'),
	rmdir = require('rimraf'),
	path = require('path'),
	fbgraph = require('fbgraphapi'),
	needle = require('needle'),
	legacy = require('legacy-encoding'),
	cf = require('./../config/config.js'),
	auth = require('./auth.js'),
	read = require('./readFileFolder.js'),
	getMap = require('./routeAliasesMap.js'),
	User = require('./user_schema.js'),
	Aliases = require('./aliases_schema.js'),
	playlist = require('./playListUpdater.js'),
	proxy = require('./proxy.js'),
	email = require('./sendMail.js'),
	extract = require('./extract.js'),
	aliasesMap = {};

function setAliasMap(){
	getMap(function(map){
		aliasesMap = map;
	});
}
function init({ app, notificationWatcher }){
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
		Aliases.find({}, null, {sort: {alias: 1}}, function(err, aliases){
			if(err) throw err;
			
			User.find({}, function(err, users){
				if(err) throw err;

				res.render('adminPanel.jade', {
						title: 'Admin panel',
						user: res.user,
						cf: cf,
						aliases: aliases,
						users: users
				});
			});
			
		});
	});

	app.get('/playlistForceGenerate', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		playlist.forceGeneratePlaylists(res);
	});

	app.post('/upload', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		var fName = req.header('x-file-name'),
			fPath = req.header('x-file-path'),
			fRelativePath = path.join(fPath, fName),
			fFullPath = decodeURI(path.join(filesP, fRelativePath)),
			wStream = fs.createWriteStream(fFullPath);

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
	
	app.get('/removeAlias', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		Aliases.findByIdAndRemove(req.query.alias_id, function(err){
			if(err) throw err;
			
			//Update alias map
			setAliasMap()
			res.send();
		});
	});
    
    app.get('/removeUser', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		User.findByIdAndRemove(req.query.user_id, function(err){
			if(err) throw err;

			res.send();
		});
	});
	
	app.get('/updateAlias', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		Aliases.findById(req.query.alias_id, function(err, alias){
			if(err) throw err;

			alias.alias = req.query.alias_url;
			alias.path = req.query.alias_real_url;
			alias.save(err => {
				if(err) console.error(err);

				//Update alias map
				setAliasMap()
				res.send();
			});
		});
	});
    
    app.get('/updateUser', auth.isLogged, auth.isHaveEditAccess, function(req, res){
        User.findById(req.query.user_id, function(err, user){
            if(err) throw err;

            user.isAdmin = req.query.user_isadmin;
            user.save();

            res.send();
        });
	});
	
	app.get('/addAlias', auth.isLogged, auth.isHaveEditAccess, function(req, res){
        Aliases.findOne({alias: req.query.alias_url}, function(err, result){
			if(err) throw err;
			if(result != null)
				res.status('500').send('Alias already exist.');
			else{
				var alias = new Aliases({
                    alias: req.query.alias_url,
                    path: req.query.alias_real_url
                });

                alias.save(function(err, col){
                    if(err) throw err;

                    //Update alias map
                    setAliasMap();
                    res.send(col);
                });
			}
		});
	});
	
	app.post('/sendMail', auth.isLogged, auth.isHaveEditAccess, function(req, res){
		var mail = req.body.mail,
			mailUrl = req.body['mail-url'],
			subj = 'Test mail',
			to = req.body.to,
			method = req.body.method;
		
		function callback(res, err){
			if(err){
				return res.status('401').send(`Email was not send: ${err}`);
			}

			res.send('Message successfully sended!');
		}
		if(method == 'url'){
			needle.get(mailUrl, function(err, resp) {
				if (err || resp.statusCode == 404 || resp.statusCode == 500){
					res.status('500').send('Content not found by specified url.');
					return;
				}
				mail = legacy.decode(resp.raw, 'utf8', {
					mode: 'html'
				});
				email.sendMail(subj, to, mail, err => callback(res, err));
				
			});
		}
		else{
			email.sendMail(subj, to, mail, err => callback(res, err));
		}
	});

	app.get('/proxy', function(req, res){
		//Make proxy request
		proxy.makeProxyRequest(req.query, res);
	});

	app.get('/extractXz', extract.xz.bind(extract));

	app.post('/subscribe-to-notifications',
		auth.isLogged,
		auth.isHaveEditAccess,
		notificationWatcher.subscribe.bind(notificationWatcher)
	);

	app.get('/offline', function(req, res){
		res.render('offline.jade');
	});

	app.get('/error404', function(req, res){
		res.status(404).render('error404.jade');
	});

	app.get('*', function(req, res){
		var p =  decodeURI(path.join(filesP, req.path)),
			pathArray = req.path.split('/'),
			aliasPath = aliasesMap[req.path];

		if(typeof aliasPath != 'undefined' && aliasPath != ''){
			res.redirect(aliasPath);
			return;
		}

		fs.stat(p, function(err, stat){
			if(!err && !res.getHeader('Content-Type') ){
				var file = {
					name: pathArray[pathArray.length-1],
					total: stat.size,
					mtime: new Date(stat.mtime.toUTCString()),
					contentType: mime.contentType(path.extname(p))
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
//Init aliases map
setAliasMap();

module.exports.init = init;