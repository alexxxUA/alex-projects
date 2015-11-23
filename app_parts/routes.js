var mime = require('mime'),
	fs 	= require('fs'),
	mkdirp = require('mkdirp'),
	rmdir = require('rimraf'),
	path = require('path'),
	fbgraph = require('fbgraphapi'),
	cf = require('./../config/config.js'),
	auth = require('./auth.js'),
	read = require('./readFileFolder.js'),
	getMap = require('./routeAliasesMap.js'),
	User = require('./user_schema.js'),
	Aliases = require('./aliases_schema.js'),
	playlist = require('./playListUpdater.js'),
	proxy = require('./proxy.js'),
	aliasesMap = {};

function setAliasMap(){
	getMap(function(map){
		aliasesMap = map;
	});
}
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
		Aliases.find({}, function(err, aliases){
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
		Aliases.findOne({alias: req.query.alias_url}, function(err, result){
			if(err) throw err;
			
			if(result != null)
				res.status('500').send('Alias already exist.');
			else{
				Aliases.findById(req.query.alias_id, function(err, alias){
					if(err) throw err;

					alias.alias = req.query.alias_url;
					alias.path = req.query.alias_real_url;
					alias.save();
					
					//Update alias map
					setAliasMap()
					res.send();
				});
			}
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
		var alias = new Aliases({
			alias: req.query.alias_url,
			path: req.query.alias_real_url
		});
		
		alias.save(function(err, col){
			if(err) throw err;
			
			//Update alias map
			setAliasMap();
			res.send(col);
		})
	});

	app.get('/proxy', function(req, res){
		//Make proxy request
		proxy.makeProxyRequest(req, res);
	});

	app.get('/error404', function(req, res){
		res.status(404).render('error404.jade');
	});

	app.get('*', function(req, res){
		var p =  decodeURI(path.join(filesP, req.path)),
			pathArray = req.path.split('/'),
			aliasPath = aliasesMap[req.path.slice(1)];
		
		if(typeof aliasPath != 'undefined' && aliasPath != ''){
			res.redirect('/'+ aliasPath);
			return;
		}

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
//Init aliases map
setAliasMap();

module.exports.init = init;