const fs = require("fs");
const https = require("https");
const express	= require('express');
const app	= express();
const bodyParser = require("body-parser");
const path = require('path');
const mongoose = require("mongoose");

//Set globals
global.filesP = path.join(__dirname, 'files'); 

const cf = require('./config/config.js');
const routes = require('./app_parts/routes.js');
const playlist = require('./app_parts/playListUpdater.js');
const notification = require('./app_parts/notification.js');
const notificationWatcher = require('./app_parts/notificationWatcher');

// Connect to DB
mongoose.connect(`mongodb://${cf.mongoUrl}`, {
	useMongoClient: true
}, err => {
	if (err) throw err;
});

// New call to compress content
app.use(express.compress());

//Cookie
app.use(express.cookieParser());

//POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//set path to the views (template) directory
app.set('views', path.join(__dirname, 'views'));

//set path to static files
app.use(express.static(path.join(__dirname, 'static'), {maxAge: cf.oneDay}));

//Init Explorer app and routes
routes.init(app);

//Init playlist updater
playlist.init();

//Init notification
notification.init({
	publicKey: cf.pushNotificationPublicKey,
	privateKey: cf.pushNotificationPrivateKey
});

// Init notification watcher and pass notification class
// in order to send notifications
notificationWatcher.init(notification);

//Start the server
let server = app;
if (cf.isLocal) {
	// Add certificate for local server
	const serverOptions = {
		key: fs.readFileSync('./certificate/cert.key', 'utf-8'),
		cert: fs.readFileSync('./certificate/cert.crt', 'utf-8')
	};

	server = https.createServer(serverOptions, app)
}

server.listen(cf.port, err => {
	if(err) throw error;

	console.log(`Server started on port: https://${cf.ip}:${cf.port}`);
});
