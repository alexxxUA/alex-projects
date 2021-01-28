var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema;

var DeviceSchema = new Schema({
	subscription: Object,
	school: String
});

module.exports = mongoose.model('Device', DeviceSchema);