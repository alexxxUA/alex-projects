var email = require("emailjs"),
	cf = require('./../config/config.js');

module.exports = email.server.connect({
					   user: cf.email,
					   password: cf.emailPass,
					   host: "smtp.gmail.com",
					   ssl: true
					});