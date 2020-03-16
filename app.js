const express = require('express');
const app	= express();
const http = require('http').createServer(app);
const path = require('path');
const mongoose = require("mongoose");

//Set globals
global.filesP = path.join(__dirname, 'files'); 

const cf = require('./config/config.js');
const routes = require('./app_parts/routes.js');
const playlist = require('./app_parts/playListUpdater.js');
const io = require('./app_parts/io.js');

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
app.use(express.bodyParser());

//set path to the views (template) directory
app.set('views', path.join(__dirname, 'views'));

//set path to static files
app.use(express.static(path.join(__dirname, 'static'), {maxAge: cf.oneDay}));

//Init Explorer app and routes
routes.init(app);

//Init playlist updater
playlist.init(http);

// Init IO events
io.init();

//listen server
http.listen(cf.port, function(err){
	if(err) throw error;

	console.log(`Server started on port: http://${cf.ip}:${cf.port}`);
});