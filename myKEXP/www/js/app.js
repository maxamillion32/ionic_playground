angular.module('kexp', ['ionic', 'kexp.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  // Currently playing page.
  .state('app.current', {
    url: '/current',
    views: {
      'menuContent': {
        templateUrl: 'templates/current.html',
        controller: 'CurrentCtrl'
      }
    }
  })

  // Previously fetched songs.
  .state('app.songs', {
    url: '/songs',
    views: {
      'menuContent': {
        templateUrl: 'templates/songs.html',
        controller: 'SongsCtrl'
      }
    }
  })

  // Song page.
  .state('app.song', {
    url: '/songs/:songId',
    views: {
      'menuContent': {
        templateUrl: 'templates/song.html',
        controller: 'SongCtrl'
      }
    }
  })

  // Spotify authorization page.
  .state('app.spotify', {
    url: '/spotify',
    views: {
      'menuContent': {
        templateUrl: 'templates/spotify.html',
        controller: 'SpotifyCtrl'
      }
    }
  })

  // Spotify song search results.
  .state('app.search', {
    url: '/spotify/search',
    views: {
      'menuContent': {
        templateUrl: 'templates/search.html',
        controller: 'SpotifyCtrl'
      }
    }
  })

  // Spotify playlists page.
  .state('app.playlists', {
    url: '/spotify/playlists',
    views: {
      'menuContent': {
        templateUrl: 'templates/playlists.html',
        controller: 'PlaylistsCtrl'
      }
    }
  })

  // Spotify playlist page.
  .state('app.playlist', {
    url: '/spotify/playlists/:playlistId',
    views: {
      'menuContent': {
        templateUrl: 'templates/playlist.html',
        controller: 'PlaylistCtrl'
      }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/current');
});
