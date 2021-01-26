(function(){
	if(typeof conf === 'undefined') {
		console.error('Configuration for FB not found!')
		return;
	}

	//Init FB
	window.fbAsyncInit = function() {
		FB.init({
			appId : conf.FBappId,
			cookie : true,  // enable cookies to allow the server to access the session
			xfbml : true,  // parse social plugins on this page
			version : 'v9.0'
		});
	};

	// Load the SDK asynchronously
	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) return;
		js = d.createElement(s); js.id = id;
		js.src = "//connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	//Main FB object
	const FbLogin = {
		scope: 'email',
		init: function() {
			this.registerEvents();
		},

		registerEvents: function(){
			$(document).on('click', '.js-fb-logIn', this.doLogin.bind(this));
			$(document).on('click', '.js-fb-logOut', this.logOut.bind(this));
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

		loggedIn: function(){
			location.reload();
		},

		logOut: function(){
			FB.getLoginStatus(function(resp) {
				if (resp.status !== 'unknown') {
					FB.logout(function(){
						location.reload();
					});
				} else {
					location.reload();
				}
			})
		}
	}
	
	FbLogin.init();
})();