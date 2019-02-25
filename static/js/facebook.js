// Load the SDK asynchronously
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


(function(){
	if(typeof conf === 'undefined') {
		return;
	}

	//Init FB
	window.fbAsyncInit = function() {
		FB.init({
			appId : conf.FBappId,
			cookie : true,  // enable cookies to allow the server to access the session
			status: true,
			xfbml : true,  // parse social plugins on this page
			version : 'v2.7'  // use version 2.7
		});
	};

	//Main FB object
	const fbLogin = {
		scope: 'email',
		registerEvents: function(){
			$(document).on('click', '.js-fb-logIn', this.doLogin.bind(this));
			$(document).on('click', '.js-fb-logOut', function(){
				FB.logout(function(){
					location.reload();
				});
			});
		},
		doLogin: function(){
			const that = this;

			FB.login(function(response){
				if (response.authResponse)
					that.login(response.authResponse.accessToken);
			},{ scope: that.scope });
		},
		login: function(token){
			$.ajax({
				url: '/login',
				type: 'POST',
				data: { token: token },
				success: this.loggedIn.bind(this),
				error: console.error
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