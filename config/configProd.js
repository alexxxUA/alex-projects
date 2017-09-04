var config = {
	port: process.env.PORT || 8080,
	FBappId: process.env.FB_APP_ID,
	FBsecret: process.env.FB_SECRET,
	FBv: process.env.FB_VERSION,
	playlistGenProxy: false
}

module.exports = config;