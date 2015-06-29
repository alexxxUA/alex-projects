app.controller('ChatController', function ($scope) {
    $scope.text = 'Some test string';
    $scope.connect = function () {
        comm.connect('publicRoom');
    };
});