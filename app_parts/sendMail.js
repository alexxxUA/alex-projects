const { SMTPClient } = require('emailjs');
	cf = require('./../config/config.js');

var server = new SMTPClient({
	user: cf.email,
	password: cf.emailPass,
	host: "smtp.gmail.com",
	ssl: true
});

module.exports = {
	server: server,
	sendMail: function(subj, to, mail, callback){
		server.send({
			text: 'Test text',
			from: 'Test mail engine',
			to: to,
			subject: subj,
			attachment: [{data: mail, alternative: true}]
		}, function(err, message) {
			if(callback) callback(err, message);
		});
	}
}