'use strict';

angular.module('kexp.services', ['kexp.utils', 'firebase']).constant('FIREBASE_URL', 'https://mykexp.firebaseio.com/')

// Song currently playing on KEXP.
.factory('Song', function ($http, $q) {

  var s = {};

  var song = { current: null };

  s.getDefault = function (song) {

    // Since some of the attributes in the song object change frequently,
    // grab the relevant data and use it to make a unique (enough) id.
    var id = song.ArtistName + song.ReleaseName + song.TrackName + song.ReleaseImageUri;

    return {
      favorite: false,
      id: btoa(id)
    };
  };

  // Pull data on currently playing song from KEXP.
  s.getCurrentlyPlaying = function () {

    var req = {
      method: 'GET',
      url: 'http://kexp.lyleblack.com',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return $http(req).then(function (res) {
      // Success
      var data = res.data;

      if (!data.ArtistName && !data.TrackName) {
        song.current = { airBreak: true };
      } else {
        song.current = angular.extend(s.getDefault(data), data);
      }
    }, function (res) {
      // Error
      song.current = null;
    });
  };

  s.getCurrent = function () {
    return song.current;
  };

  return s;
})

// User data
.factory('User', function ($localstorage, $firebaseAuth, FIREBASE_URL) {

  var u = { session_id: false };
  var ref = new Firebase(FIREBASE_URL);
  var songs = $localstorage.getObject('songs');

  songs.list = songs.list || [];

  /*
  User signs up, this creates firebase acct.
  User object populated with firebase info.
  User object contains songs.
  On add to fetched, user.songs is updated and firebase is updated.
  */

  u.setSession = function (uuid, session_id) {
    //  if (username) u.
  };

  // Keep list of all fetched songs
  u.addSongToFetched = function (song) {
    if (!song) return;

    // Only add song if not already in queue.
    if (!includes(songs.list, song)) {
      songs.list.unshift(song);
    }

    $localstorage.setObject('songs', songs);
  };

  // Remove from list.
  u.removeSongFromFetched = function (song) {
    if (!song) return;

    return includes(songs.list, song, function (found, i) {
      songs.list.splice(i, 1);
      $localstorage.setObject('songs', songs);
    });
  };

  // Keep list of favorites.
  u.addSongToFavorites = function (song) {
    if (!song) return;

    return includes(songs.list, song, function (s) {
      s.favorite = true;
      $localstorage.setObject('songs', songs);
    });
  };

  // Remove from favorites.
  u.removeSongFromFavorites = function (song) {
    if (!song) return;

    return includes(songs.list, song, function (s) {
      s.favorite = false;
      $localstorage.setObject('songs', songs);
    });
  };

  // Return all songs user has fetched.
  u.getFetched = function () {
    return songs.list;
  };

  // Return all songs user has favorited.
  u.getFavorites = function () {
    return songs.list.filter(function (song, i) {
      return song.favorite;
    });
  };

  // Get all local songs user has fetched.
  u.getLocal = function () {
    return songs.list.filter(function (song, i) {
      return song.IsLocal;
    });
  };

  // Get song with current id.
  u.getSong = function (id) {
    for (var i = 0; i < songs.list.length; i++) {
      if (id === songs.list[i].id) {
        return songs.list[i];
      }
    }
    return null;
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

  u.login = function (loginData) {
    // loginData: { email: '', password: ''}
    ref.authWithPassword(loginData, function (err, authData) {
      if (err) return console.log('Login err: ', err);
      console.log('data', authData);
    });
  };

  u.logout = function () {
    ref.unauth();
  };

  u.signup = function (email, password) {
    var credentials = {
      email: email,
      password: password
    };

    ref.createUser(credentials, function (err, userData) {
      if (err) {
        console.log('err: ', err);
      } else {
        console.log('auth data', userData);
      }
    });
  };

  return u;
});