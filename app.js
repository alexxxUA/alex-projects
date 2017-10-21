var	express	= require('express'),
	app	= express(),
	path = require('path'),
	open = require('open'),
	ip = require('ip'),
	mongoose = require("mongoose");

//Set globals
global.filesP = path.join(__dirname, 'files'); 

var cf = require('./config/config.js'),
	routes = require('./app_parts/routes.js'),
	playlist = require('./app_parts/playListUpdater.js');

// Connect to DB
mongoose.connect(`mongodb://${cf.mongoUrl}`, {
	useMongoClient: true
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
playlist.init();

//listen server
app.listen(cf.port, function(err){
	if(err) throw error;

	console.log(`Server started on: ${cf.port}`);
	//open('http://'+ cf.ip +':'+ cf.port);
});