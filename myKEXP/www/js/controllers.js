angular.module('kexp.controllers', ['ionic', 'kexp.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, User, Spotify) {

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
  $scope.doLogin = function(loginData, signingUp) {
    if (signingUp) {
      User.signup(loginData);
    } else {
      User.login(loginData)
          .then((user) => {
            if (user.spotify) {
              let { tokens: { refresh_token }} = user.spotify;

              Spotify.refreshTokens(refresh_token)
                     .then((tokens) => {
                       User.setAccessToken(tokens);
                       User.save();
                     })
                     .catch((err) => {
                       console.error(`Error while refreshing tokens: ${JSON.stringify(err)}`);
                     });
            }
          });
    }
    $scope.closeLogin();
  };
})


// Currently playing song.
.controller('CurrentCtrl', function($scope, Song, User, Spotify) {

  $scope.$on('$ionicView.enter', function(e) {
    $scope.refresh();
  });

  // Fetch currently playing song and add to scope.
  $scope.refresh = function() {
    Song.getCurrentlyPlaying()
      .then(() => {
        var currentSong = Song.getCurrent(),
            prevSong = $scope.song;

        // Don't continue if fetched song is same as previous one.
        if (prevSong && prevSong.ArtistName === currentSong.ArtistName) {
          return;
        }

        $scope.song = currentSong;

        if (!currentSong.airBreak) User.addSongToFetched(currentSong);
      })
      .finally(() => {
        $scope.$broadcast('scroll.refreshComplete'); // Stop spinner
      });
  };

  $scope.addToFavorites = function(song) {
    User.addSongToFavorites(song);
  };

  $scope.removeFromFavorites = function(song) {
    User.removeSongFromFavorites(song);
  };

  $scope.searchForTrack = function(song) {
    Spotify.searchForTrack(song)
      .then((result) => {
        let { tracks: { items: tracks }} = result;

        if (!tracks.length) {
          console.log('Nothing found.');
          // Handle nothing found.
        } else {
          // Use myKEXP playlist id for now.
          // Eventually, allow user to choose which of their playlists
          // to add. Also build out template to show list of matched
          // tracks and let user pick which track to add.
          let { id: trackId } = tracks[0];
          let playlistId = '3bTSpMFQZs3809GfOPG4ua';
          let user = User.getUser();

          return Spotify.addToPlaylist(user, trackId, playlistId);
        }
      })
      .catch((err) => {
        console.error(`Error while searching for track: ${err}`);
      });
  }
})


// Spotify playlists.
.controller('PlaylistsCtrl', function($scope, $ionicModal, User, Spotify) {

  $scope.$on('$ionicView.enter', function(e) {
    $scope.refresh();
  });

  // Load user's playlists.
  $scope.refresh = () => {
    let user = User.getUser();

    Spotify.getUserPlaylists(user)
      .then((data) => {
        let { items: playlists } = data;
        $scope.playlists = playlists;
      })
      .catch((err) => {
        $scope.err = err;
      });
  };

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/createPlaylist.html', {
    scope: $scope
  }).then((modal) => {
    $scope.modal = modal;
  });

  $scope.close = () => {
    $scope.modal.hide();
  };

  $scope.open = () => {
    $scope.modal.show();
  };

  $scope.createPlaylist = (name) => {
    let user = User.getUser();

    Spotify.createPlaylist(name, user)
      .then(
        (res) => {
          $scope.refresh();
        },
        (err) => {
          $scope.err = err;
        });

    $scope.close();
  }

  $scope.getPublic = () => {
    $scope.playlists = Spotify.getPublicPlaylists();
  };

  $scope.getPrivate = () => {
    $scope.playlists = Spotify.getPrivatePlaylists();
  };

  $scope.getAll = () => {
    $scope.playlists = Spotify.getAllPlaylists();
  }
})


.controller('PlaylistCtrl', function($scope, $stateParams, User, Spotify) {
  $scope.tracks = [];
  $scope.err = null;
  $scope.playlist = {};

  $scope.$on('$ionicView.enter', function(e) {
    $scope.refresh();
  });

  $scope.refresh = () => {
    let user = User.getUser();

    Spotify.getPlaylistTracks(user, $stateParams.playlistId)
      .then(
        (res) => {
          $scope.tracks = res.data.items.map(t => t.track);
        },
        (err) => {
          $scope.err = err;
        }
      );
  };

  $scope.removeFromPlaylist = (track) => {
    let user = User.getUser();

    Spotify.removeFromPlaylist(user, track.id, $stateParams.playlistId)
      .then(
        () => {
          $scope.refresh();
        },
        (err) => {
          $scope.err = err;
        }
      );
  };
})


// Previously fetched songs.
.controller('SongsCtrl', function($scope, User) {

  $scope.$on('$ionicView.enter', function(e) {
    $scope.songs = User.getFetched();
  });

  $scope.getFetched = function() {
    $scope.songs = User.getFetched();
  };

  $scope.getFavorites = function() {
    $scope.songs = User.getFavorites();
  };

  $scope.getLocal = function() {
    $scope.songs = User.getLocal();
  };

  $scope.addToFavorites = User.addSongToFavorites;
  $scope.removeSong = User.removeSongFromFetched;
})


// Song detail page.
.controller('SongCtrl', function($scope, $stateParams, User) {

  $scope.song = User.getSong($stateParams.songId);

  $scope.addToFavorites = function(song) {
    User.addSongToFavorites(song);
  };

  $scope.removeFromFavorites = function(song) {
    User.removeSongFromFavorites(song);
  };
})

// Spotify authorization.
.controller('SpotifyCtrl', function($scope, $stateParams, User, Spotify) {

  // Authenticate with Spotify, then save tokens in localStorage and Firebase.
  $scope.authenticate = () => {
    Spotify.authenticate().then((spotify) => {
        User.set('spotify', spotify);
        User.save();
        // Then redirect to...?
      });
  };
});
