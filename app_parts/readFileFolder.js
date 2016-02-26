var fs = require('fs'),
	path = require('path'),
	cf = require('./../config/config.js'),
	fileTypeIcon = require('./fileTypeIcon.js');

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
			res.render('mainExplorerView.jade', {
				dirTree: dom.dirTree,
				dirs: dom.dirs,
				files: dom.files,
				user: res.user,
				cf: cf
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
				link: dir.join('/') + '/',
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
			var stat = fs.statSync(path.join(p, file)),
				normalizedPath = path.join(req.path, file).replace(/\\/g, '/');

			if(stat.isDirectory()){
				dom.dirs.push({
					link: normalizedPath +'/',
					title: file
				});
			}
			else if(stat.isFile()){
				dom.files.push({
					link: normalizedPath,
					title: file,
					imageName: fileTypeIcon.get(file)
				});
			}
			if(files.length-1 == i)
				finishReadDir();
		});

	});
}

function readFile(req, res, file){
	var p =  decodeURI(path.join(filesP, req.path)),
		headerModDate = req.headers['if-modified-since'],
		modDate = headerModDate ? new Date(new Date(headerModDate).toUTCString()).getTime() : 0;

	if(modDate == file.mtime.getTime()){
		//console.log('Load cached file: '+ file.name);
		res.writeHead(304, {
			'Last-Modified': file.mtime.toUTCString()
		});
		res.end();
	}
	else{
		//console.log('Not cached file: '+ file.name);
		if (req.headers['range']) {
			var range = req.headers.range,
				parts = range.replace(/bytes=/, "").split("-"),
				partialStart = parts[0],
				partialEnd = parts[1];

			var start = parseInt(partialStart, 10),
				end = partialEnd ? parseInt(partialEnd, 10) : file.total-1,
				chunkSize = (end-start)+1;

			res.writeHead(206, {
				'Content-Range': 'bytes ' + start + '-' + end + '/' + file.total,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunkSize,
				'Last-Modified': file.mtime.toUTCString(),
				'Content-Type': file.contentType ? file.contentType : ''
			});
			fs.createReadStream(p, {start: start, end: end}).pipe(res);

		}
		else {
			res.writeHead(200, {
				'Content-Length': file.total,
				'Last-Modified': file.mtime.toUTCString(),
				'Content-Type': file.contentType ? file.contentType : ''
			});
			fs.createReadStream(p).pipe(res);
		}
	}
};

module.exports.readFile = readFile;
module.exports.readFolder = readFolder;