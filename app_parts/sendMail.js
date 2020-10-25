const { SMTPClient } = require('emailjs');
	cf = require('./../config/config.js');

var server = new SMTPClient({
	user: cf.email,
	password: cf.emailPass,
	host: `smtp.gmail.com`,
	ssl: true,
	port: '587'
});

module.exports = {
	server: server,
	sendMail: function(subj, to, mail, callback){
		server.send({
			from: 'Alex',
			to: to,
			subject: subj,
			attachment: [{data: mail, alternative: true}]
		}, function(err, message) {
			if(callback) callback(err, message);
		});
	}
}