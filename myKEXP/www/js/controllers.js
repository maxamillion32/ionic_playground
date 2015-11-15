angular.module('kexp.controllers', ['ionic', 'kexp.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})


// Currently playing song.
.controller('CurrentCtrl', function($scope, Song, User) {

  $scope.$on('$ionicView.enter', function(e) {

    // Fetch current song and add to $scope.
    Song.getCurrentlyPlaying().then(function() {
      var currentSong = Song.getCurrent();

      $scope.song = currentSong;

      if (!currentSong.airBreak) {
        User.addSongToFetched(currentSong);
      }
    });
  });

  $scope.addToFavorites = function(song) {
    User.addSongToFavorites(song);
  };

  $scope.removeFromFavorites = function(song) {
    User.removeSongFromFavorites(song);
  };
})


// Previously fetched songs.
.controller('SongsCtrl', function($scope, User) {
  $scope.songs = User.getFetched();
})


// Song detail page.
.controller('SongCtrl', function($scope, $stateParams) {
});
