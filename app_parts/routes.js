var mime 		= require('mime'),
	fs 			= require('fs'),
	needle		= require('needle'),
	mkdirp 		= require('mkdirp'),
	rmdir 		= require('rimraf'),
	path 		= require('path'),
	read 		= require('./readFileFolder.js');

function init(app){
	app.post('/upload', function(req, res){
		var fName = req.header('x-file-name'),
			fPath = req.header('x-file-path'),
			fRelativePath = path.join(fPath, fName),
			fFullPath = decodeURI(path.join(filesP, fRelativePath));
			body = '';

		req.pipe( fs.createWriteStream(fFullPath) );
		res.send("Success!");
	});

	app.get('/create', function(req, res){
		var folderPath = path.join(filesP, req.query.oldPath, req.query.name);

		mkdirp(folderPath, function(err){
			if(err)
				res.send({error: err});
			else
				res.send("Success!");
		});

	});
	app.get('/rename', function(req, res){
		var fileOldPath = path.join(filesP, req.query.oldPath, req.query.oldName),
			filePath = path.join(filesP, req.query.oldPath, req.query.name);

		fs.rename(fileOldPath, filePath, function(err){
			if(err)
				res.send({error: err});
			else
				res.send("Success!");
		});
	});
	app.get('/delete', function(req, res){
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
				res.status(500).send({url: req.query.url});
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
		res.render('error404.jade');
	});

	app.get('*', function(req, res){
		var p =  decodeURI(path.join(filesP, req.path));

		fs.stat(p, function(err, stat){
			if(!err && !res.getHeader('Content-Type') ){
				var file = {
					total: stat.size,
					type: mime.lookup(p),
					charset: mime.charsets.lookup(this.type)
				}

				if(stat.isDirectory())
					read.readFolder(req, res);
				else
					read.readFile(req, res, file);
			}
			else
				res.redirect('/error404');
		});
	});
}

module.exports.init = init;