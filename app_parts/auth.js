var fbParser = require('fb-signed-parser'),
	User = require('./user.js'),
	cf = require('./../config/config.js');

var auth = {
	isLogged: function(req, res, next){
		var that = auth,
			token = req.cookies['fbsr_'+ cf.FBappId],
			userId = token ? fbParser.parse(token, cf.FBsecret).user_id : '';

		User.findOne({id: userId}, function(err, user){
			if(err) throw err;

			if(user && user._doc){
				res.user = user._doc;
				res.user.isLogged = true;
				res.user.accessEdit = that.getEditAccessVal(req, user);
			}
			else{
				res.user = {
					isLogged: false,
					accessEdit: false
				};
			}
			if(typeof next != 'undefined')
				next();
		});
	},
	isHaveEditAccess: function(req, res, next){
		if(!res.user.accessEdit)
			res.redirect('error404');
		else
			next();
	},
	getEditAccessVal: function(req, user){
		var accessEdit = false;
		if(user.isAdmin)
			accessEdit = true;

		return accessEdit;
	},
	newUser: function(userData, res){
		var user = new User({
			id: userData.id,
			name: userData.name,
			email: userData.email,
			avatar: userData.picture.data.url,
			isAdmin: false
		});

		user.save();
		res.send({isLogged: true});
	},
	updateCurrentUser: function(user, userData, res){
		user.name = userData.name;
		user.email = userData.email;
		user.avatar = userData.picture.data.url;

		user.save();
		res.send({isLogged: true});
	}
}

module.exports = auth;