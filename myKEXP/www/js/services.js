angular.module('kexp.services', [])

  // Song currently playing on KEXP.
  .factory('Song', function($http, $q) {

    var song = {
      current: {}
    };

    var defaultSong = {
      favorite: false,
      id: '' + Date.now() + Math.floor((Math.random() * 1000))
    };


    // Pull data on currently playing song from KEXP.
    song.getCurrentlyPlaying = function() {

      var req = {
        method: 'GET',
        url: 'http://kexp.lyleblack.com',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      return $http(req).then(
        function(res) { // Success
          song.current = angular.extend(defaultSong, res.data);
        },
        function(res) { // Error
          song.current = null;
        }
      );
    };

    return song;

    /* TODO
    Check if currently playing song is already in user
    favorites. Yes? Button = 'Add to favorites'
    No? Button = 'Remove from favorites' */
  })


  // User data
  .factory('User', function() {

    var user = {
      fetchedSongs: []
    };

    // Keep list of all fetched songs
    user.addSongToFetched = function(song) {
      if (!song) return;
      user.fetchedSongs.unshift(song);
    };


    // Remove from list.
    user.removeSongFromFetched = function(song) {
      if (!song) return;

      for (var i = 0; i < user.fetchedSongs.length; i++) {
        if (song.id === user.fetchedSongs[i].id) {
          user.fetchedSongs.splice(i, 1);
          break;
        }
      }
    };


    // Keep list of favorites.
    user.addSongToFavorites = function(song) {
      if (!song) return;

      for (var i = 0; i < user.fetchedSongs.length; i++) {
        if (song.id === user.fetchedSongs[i].id) {
          console.log(user.fetchedSongs[i])
          user.fetchedSongs[i].favorite = true;
          break;
        }
      }
    };


    // Remove from favorites.
    user.removeSongFromFavorites = function(song) {
      if (!song) return;

      for (var i = 0; i < user.fetchedSongs.length; i++) {
        if (song.id === user.fetchedSongs[i].id) {
          user.fetchedSongs[i].favorite = false;
          break;
        }
      }
    };


    // Return all songs user has fetched.
    user.getFetched = function() {
      return user.fetchedSongs;
    };


    // Return all songs user has favorited.
    user.getFavorites = function() {
      return user.fetchedSongs.filter(function(song, i) {
        return song.favorite;
      });
    };


    // Get all local songs user has fetched.
    user.getLocal = function() {
      return user.fetchedSongs.filter(function(song, i) {
        return song.IsLocal;
      })
    };

    /* TODO Login/Logout stuff */

    return user;
  });
