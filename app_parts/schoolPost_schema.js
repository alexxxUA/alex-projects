var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema;

var SchoolPostSchema = new Schema({
	id: String,
	title: String,
	url: String,
	day: String,
	month: String,
	year: String
});

module.exports = mongoose.model('SchoolPost', SchoolPostSchema);