app.controller('ChatController', function ($scope, $location, $sce, $log, $timeout) {
    $scope.room = $location.hash();
    $scope.local = null;
    $scope.peers = [];
    $scope.connect = function () {
        comm.connect($scope.room, {
            audio: false
        });
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
    $scope.peerConnected = function (peer) {
        var sendPeers = $scope.peers.concat($scope.local);
        if( comm.isHost() )
            $scope.sendData(sendPeers, 'setPeers', peer.ID);

        peer.trustStream = $sce.trustAsResourceUrl(peer.stream);
        $scope.peers.push(peer);

        $scope.$apply();
    };
    $scope.setPeers = function (peers) {
        $scope.peers = $scope.getTrustStream(peers);
        $scope.$apply();
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
    $scope.leave = function () {
        comm.leave();
        $scope.local = null;
    };
    $scope.sendOnLocalConnect = function (peer) {
        $scope.sendData(peer, 'connected');
        $log.debug(peer.ID);
    };

    comm.on('local', function (peer) {
        $scope.local = $scope.getTrustStream([peer])[0];
        $timeout(function () {
            $scope.sendOnLocalConnect(peer);
        }, 500);

        //$scope.$apply();
    });

    comm.on('data', $scope.routeData);

    comm.on('disconnect', function (peer) {
        $timeout(function() {
            $scope.peers.splice($scope.peers.indexOf(peer), 1);            
        });
        //$scope.$apply();
    });
});