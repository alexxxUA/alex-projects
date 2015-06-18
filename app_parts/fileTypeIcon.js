var mime = require('mime');

function get(name){
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

module.exports.get = get;