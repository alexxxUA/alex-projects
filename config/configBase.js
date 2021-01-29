var config = {
	port: process.env.PORT || 8080,
	ip: 'localhost',
	mongoUrl: `alex:${process.env.MONGO_PASS}@cluster0-shard-00-00-ercra.mongodb.net:27017,cluster0-shard-00-01-ercra.mongodb.net:27017,cluster0-shard-00-02-ercra.mongodb.net:27017/explorer?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin`,
	email: process.env.EMAIL_LOGIN,
	emailPass: process.env.EMAIL_PASS,
	oneDay: 86400000,
	FBv: 'v2.7',
	playlistGenOnStart: false,
	playlistEnabled: true,
	playListChannelChecker: false,
    isConsoleLogPlaylist: false,
	playlistOutputPath: '/UpdateChanList/LastValidPlaylist/server',
	hiddenPaths: [
		'/UpdateChanList/LastValidPlaylist'
	],
	IpStreamUrl: process.env.IP_STREAM_URL,
	// Configuration from FireBase -> cloud messaging
	pushNotificationPublicKey: process.env.PUSH_NOTIFICATION_PUBLIC_KEY,
	pushNotificationPrivateKey: process.env.PUSH_NOTIFICATION_PRIVATE_KEY,
	watchSchoolPosts: true
}

module.exports = config;