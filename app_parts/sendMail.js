var email = require("emailjs"),
	cf = require('./../config/config.js');

var server = email.server.connect({
				   user: cf.email,
				   password: cf.emailPass,
				   host: "smtp.gmail.com",
				   ssl: true
				});

module.exports = {
	server: server,
	sendMail: function(to, mail, callback){
		server.send({
			text: 'Test text',
			from: 'Test mail engine',
			to: to,
			subject: 'Test mail',
			attachment: [{data: mail, alternative: true}]
		}, function(err, message) {
			callback(err, message);
		});
	}
}