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
    comm.on('local', function (peer) {
        $scope.local = $scope.getTrustStream([peer])[0];

        $scope.$apply();
    });
    comm.on('connected', function(peer){
        $timeout(function() {
            $scope.peers.push($scope.getTrustStream([peer])[0]);            
        });
    });
    comm.on('data', $scope.routeData);

    comm.on('disconnect', function (peer) {
        $timeout(function() {
            $scope.peers.splice($scope.peers.indexOf(peer), 1);            
        });
    });
});