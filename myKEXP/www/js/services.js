angular.module('kexp.services', ['kexp.utils'])

  // Song currently playing on KEXP.
  .factory('Song', function($http, $q) {

    var s = {};

    var song = { current: null };

    s.getDefault = function(song) {
      return {
        favorite: false,
        id: JSON.stringify(song)
      };
    };

    // Pull data on currently playing song from KEXP.
    s.getCurrentlyPlaying = function() {

      var req = {
        method: 'GET',
        url: 'http://kexp.lyleblack.com',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      return $http(req).then(
        function(res) { // Success
          var data = res.data;

          if (!data.ArtistName && !data.TrackName) {
            song.current = { airBreak: true };
          } else {
            song.current = angular.extend(s.getDefault(data), data);
          }
        },
        function(res) { // Error
          song.current = null;
        }
      );
    };


    s.getCurrent = function() {
      return song.current;
    };

    return s;
  })


  // User data
  .factory('User', function($localstorage) {

    var u = {};

    var songs = $localstorage.getObject('songs');

    songs.list = songs.list || [];

    // Keep list of all fetched songs
    u.addSongToFetched = function(song) {
      if (!song) return;

      // Only add song if not already in queue.
      if (!includes(songs.list, song)) {
        songs.list.unshift(song);
      }

      $localstorage.setObject('songs', songs);
    };


    // Remove from list.
    u.removeSongFromFetched = function(song) {
      if (!song) return;

      return includes(songs.list, song, function(found, i) {
        songs.list.splice(i, 1);
        $localstorage.setObject('songs', songs);
      });
    };


    // Keep list of favorites.
    u.addSongToFavorites = function(song) {
      if (!song) return;

      return includes(songs.list, song, function(s) {
        s.favorite = true;
        $localstorage.setObject('songs', songs);
      });
    };


    // Remove from favorites.
    u.removeSongFromFavorites = function(song) {
      if (!song) return;

      return includes(songs.list, song, function(s) {
        s.favorite = false;
        $localstorage.setObject('songs', songs);
      });
    };


    // Return all songs user has fetched.
    u.getFetched = function() {
      return songs.list;
    };


    // Return all songs user has favorited.
    u.getFavorites = function() {
      return songs.list.filter(function(song, i) {
        return song.favorite;
      });
    };


    // Get all local songs user has fetched.
    u.getLocal = function() {
      return songs.list.filter(function(song, i) {
        return song.IsLocal;
      })
    };


    u.includes = includes;

    // Helper that returns true if song is in list.
    // Calls cb on found item if cb passed in.
    function includes(list, song, cb) {
      for (var i = 0; i < list.length; i++) {
        if (song.id === list[i].id) {
          if (cb && typeof cb === 'function') {
            cb(list[i], i);
          }
          return true;
        }
      }
      return false;
    }

    /* TODO Login/Logout stuff */

    return u;
  });
