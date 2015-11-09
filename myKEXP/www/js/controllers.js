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

  // Fetch data.
  Song.getCurrentlyPlaying();

  // Default value.
  $scope.song = {};

  // Update $scope.song whenever service updates.
  $scope.$watch(function() { return Song.current; },
    function(newValue, oldValue) {
      if (typeof newValue !== 'undefined') {
        User.addSongToFetched(Song.current);
        console.log('fetched', User.fetchedSongs)
        $scope.song = Song.current;
      }
  });


  $scope.addToFavorites = function(song) {
    User.addSongToFavorites(song);
  };

  $scope.imgSrc = $scope.song.ReleaseImageUri || 'img/default.jpg';
})


// Previously fetched songs.
.controller('SongsCtrl', function($scope, User) {
  $scope.songs = User.fetchedSongs;
})


// Song detail page.
.controller('SongCtrl', function($scope, $stateParams) {
});
