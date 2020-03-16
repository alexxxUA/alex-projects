var fbParser = require('fb-signed-parser'),
	User = require('./user_schema.js'),
	cf = require('./../config/config.js');

var auth = {
	isLogged: function(req, res, next){
		if (!cf.FBappId || !cf.FBsecret) {
			throw Error('FBappId or FBsecret is not configured. Please check config / ENV variables!');
		}

		const that = auth,
			token = req.cookies['fbsr_'+ cf.FBappId],
			{user_id: userId} = token ? (fbParser.parse(token, cf.FBsecret) || {}) : {};

		User.findOne({id: userId}, function(err, user){
			if(err) throw err;

			if(user && user._doc){
				res.user = user._doc;
				res.user.isLogged = true;
				res.user.accessEdit = that.getEditAccessVal(req, user);
			} else if (cf.isLocal) {
				res.user = {
					name: 'Developer',
					isLogged: true,
					accessEdit: true
				};
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