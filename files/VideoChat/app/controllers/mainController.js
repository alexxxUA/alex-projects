app.controller('ChatController', function ($scope, $location, $sce) {
	$scope.room = $location.hash();
	$scope.local = null;
	$scope.peers = [];
	$scope.connect = function () {
		comm.connect($scope.room);
	};
	$scope.leave = function () {
		comm.leave();
		$scope.local = null;
	};

	comm.on('local', function (peer) {
		peer.stream = $sce.trustAsResourceUrl(peer.stream);
		$scope.local = peer;

		$scope.$apply();
	});

	comm.on('connected', function (peer) {
		peer.stream = $sce.trustAsResourceUrl(peer.stream);
		$scope.peers.push(peer);

		$scope.$apply();
	});

	comm.on('disconnect', function (peer) {
		$scope.peers.splice($scope.peers.indexOf(peer), 1);

		$scope.$apply();
	});
});