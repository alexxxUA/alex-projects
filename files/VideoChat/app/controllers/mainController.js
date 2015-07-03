app.controller('ChatController', function ($cookies, $scope, $location, $sce, $log, $timeout) {
	$scope.isHasWebCam = false;
	$scope.isHasMic = false;
	$scope.room = $location.hash();
    $scope.myName = $cookies['myName'] || '';
	$scope.isLogget = $scope.myName ? true : false;
	$scope.isChatOpen = false;
	$scope.isShowLogin = false;
	$scope.local = null;
	$scope.peers = {};
	$scope.isUnreadMsg = false;
	$scope.msgs = [];
	$scope.init = function(){
		//Update WebCam and Mic support
		DetectRTC.load(function(){
			$timeout(function () {
				$scope.isHasWebCam = DetectRTC.hasWebcam == true ? true : false;
				$scope.isHasMic = DetectRTC.hasMicrophone == true ? true : false;
			});
		});
		$scope.registerEvents();
	};
	$scope.registerEvents = function(){
		//Track if window close within session
		window.onbeforeunload = $scope.onTabClose;
		
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
	};
	$scope.onTabClose = function(){
		if($scope.local)
			return 'You want to leave the room?';
	};
	$scope.connect = function (isVideo) {
		var isVideo = isVideo ? true : false;

		comm.connect($scope.room, {
			audio: $scope.isHasMic,
			video: isVideo,
			limit: 7
		});
	};
	$scope.pushMsg = function (msg, isLocal){
		var message = isLocal ? angular.extend({}, msg, {isLocal: true}) : msg;
		
		$scope.msgs.push(message);
	};
	$scope.msgReceived = function(msg){
		$scope.pushMsg(msg);
		$scope.isUnreadMsg = true;
	};
	$scope.chatTriggerChange = function(){
		if(!$scope.isLogget){
			$scope.isShowLogin = true;
		}
		else{
			$scope.isUnreadMsg = false;
		}	
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
					$scope.msgReceived(data);
				break;
			default:
				$log.log('Income data has no route.');
				break;
			}
		});
	};
	
	$scope.init();
});