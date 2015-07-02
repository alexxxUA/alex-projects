app.controller('ChatController', function ($cookies, $scope, $location, $sce, $log, $timeout) {
	$scope.room = $location.hash();
    $scope.myName = $cookies['myName'] || '';
	$scope.isLogget = $scope.myName ? true : false;
	$scope.local = null;
	$scope.peers = {};
	$scope.msgs = [];
	$scope.peerCont = angular.element(document.querySelector('.peers-container'));
	$scope.connect = function () {
		comm.connect($scope.room, {
			audio: false
		});
	};
	$scope.pushMsg = function (msg, isLocal){
		var message = isLocal ? angular.extend({}, msg, {isLocal: true}) : msg;
		
		$scope.msgs.push(message);
	};
    $scope.login = function(e){
		if($scope.chatForm.$valid){
            $scope.isLogget = true;
            $cookies['myName'] = $scope.myName; 
        }
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
	$scope.sendMsg = function (){
		if(!$scope.sendMsgForm.$valid)
			return;
		
		var msg = {
			name: $scope.myName,
			ID: $scope.local.ID,
			msg: $scope.msg,
			time: new Date().getTime()
		}
		//Save msg
		$scope.pushMsg(msg, true);
		//Send msg
		$scope.sendData(msg, 'msg');
		//Reset msg
		$scope.msg = '';
	};
	$scope.routeData = function (res) {
		var dataType = res.data.type,
			forID = res.data.forID,
			data = res.data.data;

		if (forID != undefined && forID != $scope.local.ID)
			return;

		//$log.log(data);
		
		$timeout(function () {
			switch (dataType) {
			case 'msg':
					$scope.pushMsg(data);
				break;
			default:
				$log.log('Income data has no route.');
				break;
			}
		});
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