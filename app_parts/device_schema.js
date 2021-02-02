const { pushNotificationOptions } = require('./../config/config.js');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schemaObject = {
	subscription: Object,
}
// Add Schema dynamically from config file
pushNotificationOptions.forEach(({ key }) => schemaObject[key] = String );

const DeviceSchema = new Schema(schemaObject);

module.exports = mongoose.model('Device', DeviceSchema);
