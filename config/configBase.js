var config = {
	email: process.env.EMAIL_LOGIN,
	emailPass: process.env.EMAIL_PASS,
	oneDay: 86400000,
	playlistEnabled: true,
	playListChannelChecker: false,
	plaulistOutputPath: '/UpdateChanList/LastValidPlaylist/server'
}

module.exports = config;