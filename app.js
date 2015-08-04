var	express	= require('express'),
	app	= express(),
	fbgraph = require('fbgraphapi'),
	path = require('path'),
	open = require('open'),
	ip = require('ip'),
	mongoose 	= require("mongoose");

//Store global variables
global.filesP = path.join(__dirname, 'files');

//Load custom files
var	routes		= require('./app_parts/routes.js'),
	playlist	= require('./app_parts/playListUpdater.js');


var port = process.env.OPENSHIFT_NODEJS_PORT || 8888,
	ip = process.env.OPENSHIFT_NODEJS_IP || ip.address(),
	mongoUrl = process.env.OPENSHIFT_MONGODB_DB_URL || 'localhost:27017',
	oneDay = 86400000;


// Connect to DB
mongoose.connect('mongodb://'+ mongoUrl +'/explorer');

// New call to compress content
app.use(express.compress());

//Cookie
app.use(express.cookieParser());

//POST
app.use(express.bodyParser());

//set path to the views (template) directory
app.set('views', path.join(__dirname, 'views'));

//set path to static files
app.use(express.static(path.join(__dirname, 'static'), {maxAge: oneDay}));

//Init Explorer app and routes
routes.init(app, fbgraph);

//Init playlist updater
playlist.channel.init();

//listen server
app.listen(port, ip, function(err){
	if(err) throw error;

	console.log('Server started on: '+ ip +':'+ port);
	//open('http://'+ ip +':'+ port);
});