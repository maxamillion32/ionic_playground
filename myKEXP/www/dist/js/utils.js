'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

angular.module('kexp.utils', []).factory('$localstorage', ['$window', function ($window) {
  return {
    set: function set(key, val) {
      $window.localStorage.setItem(key, value);
    },
    get: function get(key, defaultVal) {
      return $window.localStorage.getItem(key) || defaultVal;
    },
    setObject: function setObject(key, val) {
      $window.localStorage.setItem(key, JSON.stringify(val));
    },
    getObject: function getObject(key) {
      return JSON.parse($window.localStorage.getItem(key));
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
      for (var _iterator = list.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2);

        var i = _step$value[0];
        var _song = _step$value[1];

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
      },
      spotify: null
    };
  }

  return {
    includes: includes,
    getBlankUser: getBlankUser
  };
}]);