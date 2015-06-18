var needle		= require('needle'),
	express		= require('express'),
	app			= express(),
	fs 			= require('fs'),
	mkdirp 		= require('mkdirp'),
	rmdir 		= require('rimraf'),
	path 		= require('path'),
	mime 		= require('mime'),
	open		= require('open'),
	ip 			= require('ip');

var filesP = path.join(__dirname, 'files'),
	port = process.env.OPENSHIFT_NODEJS_PORT || 8888,
	ip = process.env.OPENSHIFT_NODEJS_IP || ip.address(),
	oneDay = 86400000;

// New call to compress content
app.use(express.compress());

//set path to the views (template) directory
app.set('views', path.join(__dirname, 'views'));

//set path to static files
app.use(express.static(path.join(__dirname, 'static'), {maxAge: oneDay}));

//POST
app.use(express.bodyParser());


function readFolder(req, res){
	var p =  decodeURI(path.join(filesP, req.path)),
		isReload = req.query.reload == 'true' ? true : false,
		dom = {
			dirTree: [
				{
					link: ['/'],
					title: ['Home']
				}
			],
			dirs: [],
			files: []
		},
		reqDirs = req.path.split('/'),
		reqDirsLength = reqDirs[reqDirs.length-1] == '' ? reqDirs.length-1 : reqDirs.length;

	function finishReadDir(){
		if(isReload){
			res.render('explorer.jade', {
				dirTree: dom.dirTree,
				dirs: dom.dirs,
				files: dom.files
			});
		}
		else{
			res.render('explorerInc.jade', {
				dirTree: dom.dirTree,
				dirs: dom.dirs,
				files: dom.files
			});
		}
	};

	if(req.path !== '/'){
		for(var i=1; i < reqDirsLength; i++){
			var dir = [];
			for(var j=0; j <= i; j++){
				dir.push(reqDirs[j]);
			}
			dom.dirTree.push({
				link: path.normalize(dir.join('/') + '/'),
				title: decodeURI(reqDirs[i])
			});
		}
	}

	fs.readdir(p, function (err, files) {
	    if (err)
	        throw err;

	    if(files.length == 0)
	    	finishReadDir();

	    files.forEach(function(file, i){
	    	var stat = fs.statSync(path.join(p, file));

    		if(stat.isDirectory()){
    			dom.dirs.push({
    				link: path.join(req.path, file +'/'),
    				title: file
    			});
    		}
    		else if(stat.isFile()){
    			dom.files.push({
    				link: path.join(req.path, file),
    				title: file,
    				imageName: getFileTypeIcon(file)
    			});
    		}
    		if(files.length-1 == i)
    			finishReadDir();
	    });

	});
}

function readFile(req, res, file){
	var p =  decodeURI(path.join(filesP, req.path));

	if (req.headers['range']) {
		var range = req.headers.range,
			parts = range.replace(/bytes=/, "").split("-"),
			partialStart = parts[0],
			partialEnd = parts[1];

		var start = parseInt(partialStart, 10),
			end = partialEnd ? parseInt(partialEnd, 10) : file.total-1,
			chunkSize = (end-start)+1;

		//console.log('"'+ req.path +'" - RANGE: ' + start + ' - ' + end + ' = ' + chunkSize);

		res.writeHead(206, {
			'Content-Range': 'bytes ' + start + '-' + end + '/' + file.total,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunkSize,
			'Content-Type': file.type + (file.charset ? '; charset=' + file.charset : '')
		});
		fs.createReadStream(p, {start: start, end: end}).pipe(res);

	} else {
		//console.log('"'+ req.path +'" - TOTAL: '+ file.total);
		res.writeHead(200, {
			'Content-Length': file.total,
			'Content-Type': file.type + (file.charset ? '; charset=' + file.charset : '')
		});
		fs.createReadStream(p).pipe(res);
	}
};

function getFileTypeIcon(name){
	var mimeType = mime.lookup(name),
		fileType = mimeType.split('/')[0],
		fileExt = name.split('.')[name.split('.').length-1],
		imgName = '';

	switch (fileExt) {
		case 'zip':
		case '7zip':
		case 'rar':
			imgName = 'compressed';
			break;
		case "css":
		case "scss":
		case "less":
			imgName = 'css';
			break;
		case "js":
		case "json":
		case "bat":
			imgName = 'developer';
			break;
		case "exel":
			imgName = 'exel';
			break;
		case "flv":
		case "flash":
			imgName = 'flash';
			break;
		case "html":
		case "jade":
		case "isml":
			imgName = 'html';
			break;
		case "pdf":
			imgName = 'pdf';
			break;
		case "psd":
			imgName = 'photoshop';
			break;
		case "txt":
		case "md":
		case "md":
			imgName = 'text';
			break;
		case "doc":
		case "docx":
		case "md":
		case "eot":
		case "ttf":
		case "woff":
			imgName = 'word';
			break;
	}

	if(imgName == ''){
		switch (fileType) {
			case 'image':
				imgName = 'image';
				break;
			case "video":
			case "movie":
				imgName = 'movie';
				break;
			case "audio":
				imgName = 'music';
				break;
		}
	}
	if(imgName == '')
		imgName = 'blank';

	return imgName;
}

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
				readFolder(req, res);
			else
				readFile(req, res, file);
		}
		else
			res.redirect('/error404');
    });
});

//listen server
app.listen(port, ip, function(err){
	if(err) throw error;

	console.log('Server started on: '+ ip +':'+ port);
	//open('http://'+ ip +':'+ port);
});