angular.module('kexy.services', [])


  // Song currently playing on KEXP.
  .factory('CurrentlyPlaying', function($http, $q) {

    var cp = {
      artist: null,
      album: null,
      track: null,
      lastUpdated: null,
      picUrl: null,
      url: null,
      program: null
    };

    cp.setCurrentTrack = function() {
    };


  // User data.
  .factory('User', function($http, $q $localstorage) {

    var user = {
      username: false,
      session_id: false,
      favorites: [],
      newFavorites: 0
    };

    user.setSession = function(username, session_id, favorites) {
    }

    user.addSongToFavorites = function(song) {
    };

    user.removeSongFromFavorites = function(song, index) {
    };

    user.populateFavorites = function() {
    };

    user.favoriteCount = function() {
    };

    user.auth = function(username, signingUp) {
    };

    user.checkSession = function() {
    };

    user.destroySession = function() {
    };

    return user;
  });
