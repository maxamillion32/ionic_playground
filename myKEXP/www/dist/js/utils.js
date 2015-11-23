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
}]);