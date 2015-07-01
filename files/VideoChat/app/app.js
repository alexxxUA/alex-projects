var app = angular.module('videoChat', ['ngCookies']),
    comm = new Icecomm('wxnPQomF6jnKHT1U4Tb4a5ISdWIYjNhESQLBAOtBxyUgkSCS');

app.config(function ($locationProvider) {
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: false,
		rewriteLinks: false
	});
}).run(function($rootScope){
    $rootScope.objectSize = function(obj){
        return Object.keys(obj).length;
    };
});