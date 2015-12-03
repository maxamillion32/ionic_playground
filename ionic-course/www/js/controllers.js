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

  var hideLoading = function() {
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
  $scope.username = User.username;

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
.controller('TabsCtrl', function($scope, $window, User, Recommendations) {
  $scope.enteringFavorites = function() {
    User.newFavorites = 0;
    Recommendations.haltAudio();
  };

  $scope.leavingFavorites = function() {
    Recommendations.init();
  };

  $scope.favCount = User.favoriteCount;

  $scope.logout = function() {
    User.destroySession();

    $window.location.href = 'index.html';
  };
});


/*
Controller for our spash page
*/
.controller('SplashCtrl', function($scope, $state, User) {
  // attempt to signup/login via User.auth
  $scope.submitForm = function(username, signingUp) {
    User.auth(username, signingUp).then(function(){
      // session is now set, so lets redirect to discover page
      $state.go('tab.discover');

    }, function() {
      // error handling here
      alert('Hmm... try another username.');

    });
  }

});
