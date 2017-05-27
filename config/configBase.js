var config = {
	email: process.env.EMAIL_LOGIN,
	emailPass: process.env.EMAIL_PASS,
	oneDay: 86400000,
	playlistEnabled: true,
	playListChannelChecker: true,
    isConsoleLogPlaylist: false,
	playlistOutputPath: '/UpdateChanList/LastValidPlaylist/server'
}

module.exports = config;