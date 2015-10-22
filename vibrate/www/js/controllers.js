angular.module('starter.controllers', [])

.controller('VibrateCtrl', function($scope) {
  document.addEventListener("deviceready", function() {
    $scope.vibrate = navigator.vibrate;
  }, false);

});
