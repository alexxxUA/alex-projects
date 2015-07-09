// Load the SDK asynchronously
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

//Init FB
window.fbAsyncInit = function() {
	FB.init({
		appId : fbLogin.apID,
		cookie : true,  // enable cookies to allow the server to access the session
		status: true,
		xfbml : true,  // parse social plugins on this page
		version : 'v2.2' // use version 2.2
	});

	fbLogin.getStatus();
};

//Main FB object
var fbLogin = {
	apID: 984466578230390,
	user: {
		id: undefined,
		name: '',
		email: '',
		pictureUrl: ''
	},
	getStatus: function(){
		var that = this;
		
		FB.getLoginStatus(function(response){
			that.statusChanged(response);
		});
	},
	statusChanged: function(response){
		if (response.status === 'connected'){
			this.loggedIn();
		}
	},
	checkLoginState: function(){
		this.getStatus()
	},
	loggedIn: function(){
		var that = this;
		
		FB.api('/me', function(response) {
			that.user.id = response.id;
			that.user.name = response.name;
			that.user.email = response.email;

			console.log(that.user);
		});
		FB.api('/me/picture', function(response) {
			that.user.pictureUrl = response.data.url;
			
			that.login();
		});
	},
	login: function(){
		var that = this;
		
		console.log(that.user);
		$.ajax({
			url: '/login',
			type: 'POST',
			data: that.user,
			success: function(response){
				console.log(response);
			},
			error: function(err){
				console.log(err);
			}
		})
	}
}

