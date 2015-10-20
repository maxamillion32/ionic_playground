angular.module('songhop.services', [])
  .factory('User', function() {

    var o = {
      favorites: []
    };

    o.addSongToFavorites = function(song) {
      if (!song) return false;

      o.favorites.unshift(song);
    }

    o.removeSongFromFavorites = function(song, index) {
      if (!song) return false;

      o.favorites.splice(index, 1);
    }

    return o;
  })
  .factory('Recommendations', function($http, SERVER, $q) {

    var media;

    var o = {
      queue: []
    };

    o.init = function() {
      if (o.queue.length === 0) {
        return o.getNextSongs();

      } else {
        return o.playCurrentSong();
      }
    };

    o.getNextSongs = function() {
      return $http({
        method: 'GET',
        url: SERVER.url + '/recommendations'
      }).success(function(data){
        o.queue = o.queue.concat(data);
      });
    };

    o.nextSong = function() {
      o.queue.shift();

      o.haltAudio();

      if (o.queue.length <= 3) {
        o.getNextSongs();
      }
    };

    o.playCurrentSong = function() {
      var defer = $q.defer();

      media = new Audio(o.queue[0].preview_url);

      media.addEventListener("loadeddata", function() {
        defer.resolve();
      });

      media.play();

      return defer.promise;
    };

    o.haltAudio = function() {
      if (media) media.pause();
    }

    return o;
  })
