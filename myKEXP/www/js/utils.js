angular.module('kexp.utils', [])

  .factory('$localstorage', ['$window', function($window) {
    return {
      set: function(key, val) {
        $window.localStorage[key] = value;
      },
      get: function(key, defaultVal) {
        return $window.localStorage[key] || defaultVal;
      },
      setObject: function(key, val) {
        $window.localStorage[key] = JSON.stringify(val);
      },
      getObject: function(key) {
        return JSON.parse($window.localStorage[key] || '{}');
      }
    };
  }]);
