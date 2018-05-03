function extendObj(target) {
	var sources = [].slice.call(arguments, 1);

	sources.forEach(function (source) {
		for (var prop in source) {
			target[prop] = source[prop];
		}
	});
	return target;
}

let config = require('./configBase.js'),
	configType = 'Prod';

if(process.env.NODE_IS_DEVELOPMENT == 'true'){
	configType = 'Dev';
}

config = extendObj(config, require(`./config${configType}.js`));
console.log(`Using "${configType}" config`);

module.exports = config;