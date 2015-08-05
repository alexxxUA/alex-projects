var ip = require('ip');

var config = {
	port: 8888,
	ip: ip.address(),
	mongoUrl: 'localhost:27017/explorer',
	oneDay: 86400000,
	FBappId: '998511046825943',
	FBsecret: '4092b64b251eb9491a59f79c1dca0350',
	FBv: 'v2.2'
}

module.exports = config;