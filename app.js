var	express		= require('express'),
	app			= express(),
	path 		= require('path'),
	open		= require('open'),
	ip 			= require('ip'),
	routes		= require('./app_parts/routes.js');

global.filesP = path.join(__dirname, 'files');

var port = process.env.OPENSHIFT_NODEJS_PORT || 8888,
	ip = process.env.OPENSHIFT_NODEJS_IP || ip.address(),
	oneDay = 86400000;

// New call to compress content
app.use(express.compress());

//set path to the views (template) directory
app.set('views', path.join(__dirname, 'views'));

//set path to static files
app.use(express.static(path.join(__dirname, 'static'), {maxAge: oneDay}));

//POST
app.use(express.bodyParser());

//Init Explorer app and routes
routes.init(app);

//listen server
app.listen(port, ip, function(err){
	if(err) throw error;

	console.log('Server started on: '+ ip +':'+ port);
	//open('http://'+ ip +':'+ port);
});