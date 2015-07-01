app.controller('ChatController', function ($scope, $location, $sce, $log, $timeout, $compile) {
	$scope.room = $location.hash();
	$scope.local = null;
	$scope.peers = {};
	$scope.peerCont = angular.element(document.querySelector('.peers-container'));
	$scope.connect = function () {
		comm.connect($scope.room, {
			audio: false
		});
	};
	$scope.leave = function () {
		comm.leave();
		$scope.peers = {};
		$scope.local = null;
	};
	$scope.savePeer = function(peer){
		var peerToSave = {};
		peerToSave[peer.ID] = peer;
		angular.extend($scope.peers, peerToSave);
	};
	$scope.getTrustStream = function (peer) {
		if(peer.stream)
			peer.trustStream = $sce.trustAsResourceUrl(peer.stream);
		else{
			angular.forEach(peer, function (val, key) {
				val.trustStream = $sce.trustAsResourceUrl(val.stream);
			});
		}

		return peer;
	};
	$scope.sendData = function (data, type, ID) {
		var sendData = angular.extend({}, {
			data: data,
			type: type,
			forID: ID
		});

		comm.send(sendData);
	};
	$scope.routeData = function (res) {
		var dataType = res.data.type,
			forID = res.data.forID,
			data = res.data.data;

		if (forID != undefined && forID != $scope.local.ID)
			return;

		$log.debug(data);

		switch (dataType) {
		case 'connected':
			$scope.peerConnected(data);
			break;
		case 'setPeers':
			$scope.setPeers(data);
			break;
		default:
			$log.debug('Income data has no route.');
			break;
		}
	};
	comm.on('data', $scope.routeData);
	comm.on('local', function (peer) {
		$timeout(function () {
			$scope.local = $scope.getTrustStream([peer])[0];
		});
	});
	comm.on('connected', function (peer) {
		$timeout(function () {
			$scope.savePeer($scope.getTrustStream(peer));
		});
	});
	comm.on('disconnect', function (peer) {
		$timeout(function () {
			delete $scope.peers[peer.ID];
		});
	});
});