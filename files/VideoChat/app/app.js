var app = angular.module('videoChat', []),
    comm = new Icecomm('wxnPQomF6jnKHT1U4Tb4a5ISdWIYjNhESQLBAOtBxyUgkSCS');

app.config(function ($locationProvider) {
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: false,
		rewriteLinks: false
	});
});