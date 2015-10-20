angular.module('songhop.controllers', ['ionic', 'songhop.services'])


/*
Controller for the discover page
*/
.controller('DiscoverCtrl', function($scope, $ionicLoading, $timeout, User, Recommendations) {

  var showLoading = function() {
    $ionicLoading.show({
      template: 'i class="ion-loading-c"></i>',
      noBackdrop: true
    });
  }

  var hideLoading = funciton() {
    $ionicLoading.hide();
  };

  showLoading();

  Recommendations.init()
    .then(function() {
      $scope.currentSong = Recommendations.queue[0];
    //  return Recommendations.playCurrentSong();
    })
    .then(function(){
      hideLoading();
      $scope.currentSong.loaded = true;
    });

  $scope.sendFeedback = function(bool) {

    if (bool) User.addSongToFavorites($scope.currentSong);

    $scope.currentSong.rated = bool;
    $scope.currentSong.hide = true;

    Recommendations.nextSong();

    $timeout(function() {
      $scope.currentSong = Recommendations.queue[0];
      $scope.currentSong.loaded = false;
    }, 250);

    /*
    Recommendations.playCurrentSong().then(function() {
      $scope.currentSong.loaded = true;
    });
    */
  };

  $scope.nextAlbumImg = function() {
    if (Recommendations.queue.length > 1) {
      return Recommendations.queue[1].image_large;
    }

    return '';
  }

})


/*
Controller for the favorites page
*/
.controller('FavoritesCtrl', function($scope, User, $window) {
  $scope.favorites = User.favorites;

  $scope.removeSong = function(song, index) {
    User.removeSongFromFavorites(song, index);
  };

  $scope.openSong = function(song) {
    $window.open(song.open_url, "_system");
  };

})


/*
Controller for our tab bar
*/
.controller('TabsCtrl', function($scope, User, Recommendations) {
  $scope.enteringFavorites = function() {
    User.newFavorites = 0;
    Recommendations.haltAudio();
  };

  $scope.leavingFavorites = function() {
    Recommendations.init();
  };

  $scope.favCount = User.favoriteCount;
});
