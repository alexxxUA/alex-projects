var config = {
	port: process.env.OPENSHIFT_NODEJS_PORT,
	ip: process.env.OPENSHIFT_NODEJS_IP,
	mongoUrl: process.env.OPENSHIFT_MONGODB_DB_URL,
	oneDay: 86400000,
	FBappId: process.env.FB_APP_ID,
	FBsecret: process.env.FB_SECRET,
	FBv: process.env.FB_VERSION
}

module.exports = config;