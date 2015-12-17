angular.module('kexp.utils', [])

  .factory('$localstorage', ['$window', function($window) {
    return {
      set: function(key, val) {
        $window.localStorage.setItem(key, value);
      },
      get: function(key, defaultVal) {
        return $window.localStorage.getItem(key) || defaultVal;
      },
      setObject: function(key, val) {
        $window.localStorage.setItem(key, JSON.stringify(val));
      },
      getObject: function(key) {
        return JSON.parse($window.localStorage.getItem(key));
      }
    };
  }])


  .factory('$helpers', [() => {

    // Helper that returns true if song is in list.
    // Calls cb on found item if cb passed in.
    function includes(list, song, cb) {
      for (let [i, _song] of list.entries()) {
        if (song.id === _song.id) {
          if (cb && typeof cb === 'function') {
            cb(_song, i);
          }
          return true;
        }
      }
      return false;
    }


    // Helper that returns blank user object.
    function getBlankUser() {
      return {
        email: null,
        songs: {
          meta: {},
          list: []
        },
        auth: {
          uid: null,
          provider: null,
          token: null
        },
        spotify: null
      };
    }

    return {
      includes,
      getBlankUser
    };
  }]);
