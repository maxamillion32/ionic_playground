'use strict';

angular.module('kexp.utils', []).factory('$localstorage', ['$window', function ($window) {
  return {
    set: function set(key, val) {
      $window.localStorage[key] = value;
    },
    get: function get(key, defaultVal) {
      return $window.localStorage[key] || defaultVal;
    },
    setObject: function setObject(key, val) {
      $window.localStorage[key] = JSON.stringify(val);
    },
    getObject: function getObject(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  };
}]).factory('$helpers', [function () {

  // Helper that returns true if song is in list.
  // Calls cb on found item if cb passed in.
  function includes(list, song, cb) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _song = _step.value;

        if (song.id === _song.id) {
          if (cb && typeof cb === 'function') {
            cb(_song, i);
          }
          return true;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
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
      }
    };
  }

  return {
    includes: includes,
    getBlankUser: getBlankUser
  };
}]);