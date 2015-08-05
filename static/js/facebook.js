// Load the SDK asynchronously
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


(function(){
	//Init FB
	window.fbAsyncInit = function() {
		FB.init({
			appId : conf.FBappId,
			cookie : true,  // enable cookies to allow the server to access the session
			status: true,
			xfbml : true,  // parse social plugins on this page
			version : 'v2.2' // use version 2.2
		});
	};

	//Main FB object
	var fbLogin = {
		registerEvents: function(){
			var that = this;

			$(document).on('click', '.js-fb-logIn', $.proxy(this.doLogin, this));
			$(document).on('click', '.js-fb-logOut', function(){
				FB.logout(function(){
					location.reload();
				});
			});
		},
		doLogin: function(){
			var that = this;

			FB.login(function(response){
				if (response.authResponse)
					that.login(response.authResponse.accessToken);
			});
		},
		login: function(token){
			var that = this,
				data = {
					token: token
				};

			$.ajax({
				url: '/login',
				type: 'POST',
				data: data,
				success: function(response){
					that.loggedIn(response);
				},
				error: function(err){
					console.log(err);
				}
			});
		},
		loggedIn: function(response){
			location.reload();
		}
	}
	
	fbLogin.registerEvents();

	window.checkLoginState = function(){
		fbLogin.checkLoginState.apply(fbLogin);
	};
})();