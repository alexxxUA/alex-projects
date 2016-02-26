var email = require("emailjs");

module.exports = email.server.connect({
					   user: "product.db.helper@gmail.com",
					   password: "produ80938858233ct",
					   host: "smtp.gmail.com",
					   ssl: true
					});