angular.module('starter.controllers', [])

.controller('VibrateCtrl', function($scope) {
  $scope.vibrate = function(n) {
    var pattern = [];

    if (n > 0 && typeof n === 'number') {
      for (var i = 0; i < n; i++) {
        pattern.push(1000, 1000); // Time to vibrate, time to pause
      }
    }

    if (n.constructor === Array) {
      pattern = n;
    }

    navigator.vibrate(pattern);
  };
});
