function extendObj(target) {
	var sources = [].slice.call(arguments, 1);

	sources.forEach(function (source) {
		for (var prop in source) {
			target[prop] = source[prop];
		}
	});
	return target;
}

var config = require('./configBase.js');

if(process.env.NODE_IS_DEVELOPMENT == 'true')
	config = extendObj(config, require('./configDev.js'));
else
	config = extendObj(config, require('./configProd.js'));

module.exports = config;