var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema;

var routeAliases = new Schema({
    path: String,
	alias: String
});

module.exports = mongoose.model('RouteAliases', routeAliases);