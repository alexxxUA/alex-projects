app.controller('ChatController', function ($scope, $location, $sce, $log, $timeout) {
    $scope.room = $location.hash();
    $scope.local = null;
    $scope.peers = [];
    $scope.peerCont = $('.peers-container');
    $scope.getVideo = function(data){
        return '<video autoplay src="'+ data.trustStream +'" id="'+ data.ID +'"></video>';
    };
    $scope.appendVideo = function($cont, data){
        $cont.append($scope.getVideo(data));
    };
    $scope.removeVideo = function(ID){
        $('#'+ ID).remove();
    };
    $scope.connect = function () {
        comm.connect($scope.room, {
            audio: false
        });
    };
    $scope.leave = function () {
        comm.leave();
        $scope.peers = [];
        $scope.local = null;
    };
    $scope.getTrustStream = function (peerArray){
        angular.forEach(peerArray, function(val, key) {
            val.trustStream = $sce.trustAsResourceUrl(val.stream);
        });
        
        return peerArray;
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
            
        if(forID != undefined && forID != $scope.local.ID)
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
    $scope.addPeer = function(peer){
        
    };
    comm.on('data', $scope.routeData);
    comm.on('local', function (peer) {
        $scope.local = $scope.getTrustStream([peer])[0];

        $scope.$apply();
    });
    comm.on('connected', function(peer){
        $scope.peers.push($scope.getTrustStream([peer])[0]);
        $scope.appendVideo($scope.peerCont, peer);
    });
    comm.on('disconnect', function (peer) {
        $scope.peers.splice($scope.peers.indexOf(peer), 1);
        
        $scope.removeVideo(peer.ID);
    });
});