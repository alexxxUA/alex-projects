var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema;

var UserSchema = new Schema({
	id: String,
	name: String,
	email: String,
	avatar: String,
	isAdmin: Boolean
});

module.exports = mongoose.model('User', UserSchema);