var config = {};

if(process.env.NODE_IS_DEVELOPMENT == 'true')
	config = require('./configDev.js');
else
	config = require('./configProd.js');

module.exports = config;