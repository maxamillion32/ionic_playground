angular.module('kexp.services', [])

  // Song currently playing on KEXP.
  .factory('Song', function($http, $q) {

    var song = {
      current: {}
    };

    // Pull data on currently playing song from KEXP.
    song.getCurrentlyPlaying = function() {

      var req = {
        method: 'GET',
        url: 'http://localhost:3000',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      return $http(req).then(
        function(res) { // Success
          song.current = res.data;
        },
        function(res) { // Error
          song.current = null;
        }
      );
    };

    return song;

    // Check if currently playing is in user favorites
    //  Yes? Button = Add to favorites
    //  No?  Button = Remove from favorites
  })


  // User data
  .factory('User', function() {
    // Favorite song
    // Unfavorite song
    // Add to fetched songs
    // Remove from fetched songs
    // Login/Logout stuff
  });
