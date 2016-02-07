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
.controller('CurrentCtrl', function ($scope, Song, User, Spotify) {

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

      if (!currentSong.airBreak) User.addSongToFetched(currentSong);
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

  $scope.searchForTrack = function (song) {
    Spotify.searchForTrack(song).then(function (result) {
      var tracks = result.tracks.items;

      if (!tracks.length) {
        console.log('Nothing found.');
        // Handle nothing found.
      } else {
          // Use myKEXP playlist id for now.
          // Eventually, allow user to choose which of their playlists
          // to add. Also build out template to show list of matched
          // tracks and let user pick which track to add.
          var trackId = tracks[0].id;

          var playlistId = '3bTSpMFQZs3809GfOPG4ua';
          var user = User.getUser();

          return Spotify.addToPlaylist(user, trackId, playlistId);
        }
    }).catch(function (err) {
      console.error('Error while searching for track: ' + err);
    });
  };
})

// Spotify playlists.
.controller('PlaylistsCtrl', function ($scope, $ionicModal, User, Spotify) {

  $scope.$on('$ionicView.enter', function (e) {
    $scope.refresh();
  });

  // Load user's playlists.
  $scope.refresh = function () {
    var user = User.getUser();

    Spotify.getUserPlaylists(user).then(function (data) {
      var playlists = data.items;

      $scope.playlists = playlists;
    }).catch(function (err) {
      $scope.err = err;
    });
  };

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/createPlaylist.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });

  $scope.close = function () {
    $scope.modal.hide();
  };

  $scope.open = function () {
    $scope.modal.show();
  };

  $scope.createPlaylist = function (name) {
    var user = User.getUser();

    Spotify.createPlaylist(name, user).then(function (res) {
      console.log('res', res);
      $scope.refresh();
    }, function (err) {
      $scope.err = err;
    });

    $scope.close();
  };

  $scope.getPublic = function () {
    $scope.playlists = Spotify.getPublicPlaylists();
  };

  $scope.getPrivate = function () {
    $scope.playlists = Spotify.getPrivatePlaylists();
  };

  $scope.getAll = function () {
    $scope.playlists = Spotify.getAllPlaylists();
  };
}).controller('PlaylistCtrl', function ($scope, $stateParams, User, Spotify) {
  $scope.tracks = [];
  $scope.err = null;
  $scope.playlist = {};

  $scope.$on('$ionicView.enter', function (e) {
    $scope.refresh();
  });

  $scope.refresh = function () {
    var user = User.getUser();

    Spotify.getPlaylistTracks(user, $stateParams.playlistId).then(function (res) {
      $scope.tracks = res.data.items.map(function (t) {
        return t.track;
      });
    }, function (err) {
      $scope.err = err;
    });
  };

  $scope.removeFromPlaylist = function (track) {
    var user = User.getUser();

    Spotify.removeFromPlaylist(user, track.id, $stateParams.playlistId).then(function () {
      $scope.refresh();
    }, function (err) {
      $scope.err = err;
    });
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