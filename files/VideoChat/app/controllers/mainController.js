app.controller('ChatController', function ($scope, $location, $sce, $log, $timeout) {
	$scope.isHasWebCam = false;
	$scope.isHasMic = false;
	$scope.isNotificationAvailable = typeof Notification != 'undefined' ? true : false;
	$scope.isNotificationEnabled = $scope.isNotificationAvailable && Notification.permission == 'granted' ? true : false;
	$scope.isChatOpen = false;
	$scope.isShowLogin = false;
	$scope.isUnreadMsg = false;
	$scope.relativePath = '//'+ location.host +'/'+ location.pathname.replace('index.html', '');
	$scope.logoImg = $scope.relativePath +'img/min/logo.png';
	$scope.msgAudio = new Audio($scope.relativePath +'media/message.mp3');
	$scope.room = $location.hash();
    $scope.myName = localStorage.myName || '';
	$scope.isLogget = $scope.myName ? true : false;
	$scope.local = null;
	$scope.peers = {};
	$scope.msgs = [];
	$scope.init = function(){
		DetectRTC.load(function(){
		//Update WebCam and Mic support
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
				//Check and set notification settings
				$scope.checkNotificationService();
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
	$scope.checkNotificationService = function (){
		if($scope.isNotificationAvailable && Notification.permission == 'default'){
			Notification.requestPermission(function(result){
				$scope.isNotificationEnabled = result == 'granted' ? true : false;
			});
		}
	};
	$scope.onTabClose = function(){
		if($scope.local)
			return 'You want to leave the room?';
	};
	$scope.onMsgKeyUp = function(e){
		if(e.keyCode == 13){
			if(e.ctrlKey)
				$scope.insertEnter(e);
			else
				$scope.sendMsg();				
		}
	};
	$scope.insertEnter = function(e){
		var element = e.target;
		
		element.value = element.value +'\n';
	};
	$scope.connect = function (isVideo) {
		var isVideo = isVideo ? true : false;

		comm.connect($scope.room, {
			audio: true,
			video: isVideo,
			limit: 7
		});
	};
	$scope.pushMsg = function (msg){
		var msg = $scope.parseMsg(msg);
		
		$scope.msgs.push(msg);
	};
	$scope.msgReceived = function(msg){
		$scope.pushMsg(msg);
		$scope.isUnreadMsg = true;
		
		//Send notification if window has no focus
		if(!document.hasFocus()){
			$scope.sendNotification(msg.name +' send you a message.', msg.msg, $scope.logoImg);
		}
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
            localStorage.myName = $scope.myName; 
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
	$scope.parseMsg = function(msg){
		msg.trustMsg = $sce.trustAsHtml(msg.msg.replace(/\n/gm, '<br>'));
		
		return msg;
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
		$scope.pushMsg(msg);
		//Send msg
		$scope.sendData(msg, 'msg');
		//Reset msg
		$scope.msg = '';
	};
	$scope.sendNotification = function(title, body, icon){
		var anNotification = new Notification(title, {
			body: body,
			icon: icon
		});
		//Play notification audio
		$scope.msgAudio.play();
		//Autoclose notification msg
		setTimeout(anNotification.close.bind(anNotification), 4000);
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