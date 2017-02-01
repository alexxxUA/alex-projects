var ip = require('ip');

var config = {
	isLocal: true,
	port: 8888,
	ip: ip.address(),
	mongoUrl: 'localhost:27017/explorer',
	FBappId: '998511046825943',
	FBsecret: '4092b64b251eb9491a59f79c1dca0350',
	FBv: 'v2.2',
	playlistEnabled: true,
	playlistGenProxy: false,
    isConsoleLogPlaylist: true
}

module.exports = config;