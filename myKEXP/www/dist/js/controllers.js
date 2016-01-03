'use strict';

angular.module('kexp.controllers', ['ionic', 'kexp.services']).controller('AppCtrl', function ($scope, $ionicModal, $timeout, User, Spotify) {

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function () {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function () {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function (loginData, signingUp) {
    if (signingUp) {
      User.signup(loginData);
    } else {
      User.login(loginData).then(function (user) {
        if (user.spotify) {
          var refresh_token = user.spotify.tokens.refresh_token;

          Spotify.refreshTokens(refresh_token).then(function (tokens) {
            User.setAccessToken(tokens);
            User.save();
          }).catch(function (err) {
            console.error('Error while refreshing tokens: ' + JSON.stringify(err));
          });
        }
      });
    }
    $scope.closeLogin();
  };
})

// Currently playing song.
.controller('CurrentCtrl', function ($scope, Song, User) {

  $scope.$on('$ionicView.enter', function (e) {
    $scope.refresh();
  });

  // Fetch currently playing song and add to scope.
  $scope.refresh = function () {
    Song.getCurrentlyPlaying().then(function () {
      var currentSong = Song.getCurrent(),
          prevSong = $scope.song;

      // Don't continue if fetched song is same as previous one.
      if (prevSong && prevSong.ArtistName === currentSong.ArtistName) {
        return;
      }

      $scope.song = currentSong;

      if (!currentSong.airBreak) {
        User.addSongToFetched(currentSong);
      }
    }).finally(function () {
      $scope.$broadcast('scroll.refreshComplete'); // Stop spinner
    });
  };

  $scope.addToFavorites = function (song) {
    User.addSongToFavorites(song);
  };

  $scope.removeFromFavorites = function (song) {
    User.removeSongFromFavorites(song);
  };
})

// Previously fetched songs.
.controller('SongsCtrl', function ($scope, User) {

  $scope.$on('$ionicView.enter', function (e) {
    $scope.songs = User.getFetched();
  });

  $scope.getFetched = function () {
    $scope.songs = User.getFetched();
  };

  $scope.getFavorites = function () {
    $scope.songs = User.getFavorites();
  };

  $scope.getLocal = function () {
    $scope.songs = User.getLocal();
  };

  $scope.addToFavorites = User.addSongToFavorites;
  $scope.removeSong = User.removeSongFromFetched;
})

// Song detail page.
.controller('SongCtrl', function ($scope, $stateParams, User) {

  $scope.song = User.getSong($stateParams.songId);

  $scope.addToFavorites = function (song) {
    User.addSongToFavorites(song);
  };

  $scope.removeFromFavorites = function (song) {
    User.removeSongFromFavorites(song);
  };
})

// Spotify authorization.
.controller('SpotifyCtrl', function ($scope, $stateParams, User, Spotify) {

  // Authenticate with Spotify, then save tokens in localStorage and Firebase.
  $scope.authenticate = function () {
    Spotify.authenticate().then(function (spotify) {
      User.set('spotify', spotify);
      User.save();
      // Then redirect to...?
    });
  };
});