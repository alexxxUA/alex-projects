var mime = require('mime-types');

function get(name){
	var mimeType = mime.lookup(name),
		fileType = mimeType ? mimeType.split('/')[0] : '',
		fileExt = name.split('.')[name.split('.').length-1],
		imgName = '';

	switch (fileExt) {
		case 'zip':
		case '7zip':
		case '7z':
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
		case "exe":
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
			imgName = 'txt';
			break;
		case "md":
		case "md":
			imgName = 'text';
			break;
		case "doc":
			imgName = 'doc';
			break;
		case "docx":
			imgName = 'docx';
			break;
		case "md":
		case "eot":
		case "ttf":
		case "woff":
			imgName = 'word';
			break;
		case "m3u":
		case "xspf":
			imgName = 'music';
			break;
		case "log":
			imgName = 'log';
			break;
		case "xml":
			imgName = 'xml';
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

	return imgName || 'blank';
}

module.exports.get = get;