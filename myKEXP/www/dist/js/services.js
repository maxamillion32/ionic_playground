'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
      id: btoa(unescape(encodeURIComponent(id)))
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

    return $http(req).then(
    // Success
    function (res) {
      var data = res.data;

      if (!data.ArtistName && !data.TrackName) {
        song.current = { airBreak: true };
      } else {
        song.current = angular.extend(s.getDefault(data), data);
      }
    },
    // Error
    function (res) {
      song.current = null;
    });
  };

  s.getCurrent = function () {
    return song.current;
  };

  return s;
})

// User data
.factory('User', function ($localstorage, FIREBASE_URL, $helpers, $firebaseAuth) {
  var getBlankUser = $helpers.getBlankUser;
  var includes = $helpers.includes;

  // Firebase

  var ref = new Firebase(FIREBASE_URL),
      auth = $firebaseAuth(ref);

  var userRefs = {
    private: ref.child('users/private'),
    public: ref.child('users/public')
  };

  // User object.
  var _user = $helpers.getBlankUser();

  // Object to return.
  var u = {};

  // Set user information in memory and in localhost.
  u.setSession = function (user) {
    _user = user;

    $localstorage.setObject('user', _user);
  };

  // Load user info from Firebase using uid.
  u.loadUser = function () {
    userRefs.private.child(_user.auth.uid).on('value', function (data) {
      var user = data.val();

      _user.email = user.email;
      _user.songs = user.songs;

      $localstorage.setObject('user', _user);
    });
  };

  // True if user existing or in localhost.
  u.checkSession = function () {
    return new Promise(function (resolve, reject) {

      if (_user.uid) {
        resolve(true);
      } else {
        var user = $localstorage.getObject('user');

        if (user.uid) {
          u.setSession(user);
          u.fetchSongs().then(function () {
            resolve(true);
          });
        }
      }

      resolve(false);
    });
  };

  u.destroySession = function () {
    _user = getBlankUser();
    $localstorage.setObject('user', _user);
  };

  // Keep list of all fetched songs
  u.addSongToFetched = function (song) {
    if (!song) return;

    // Only add song if not already in queue.
    if (!includes(_user.songs.list, song)) {
      _user.songs.list.unshift(song);
    }

    userRefs.private.child(_user.auth.uid + '/songs').update({ list: _user.songs.list });
  };

  // Remove from list.
  u.removeSongFromFetched = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (found, i) {
      _user.songs.list.splice(i, 1);
      userRefs.private.child(_user.auth.uid + '/songs').set({ list: _user.songs.list });
    });
  };

  // Keep list of favorites.
  u.addSongToFavorites = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (s) {
      s.favorite = true;
      userRefs.private.child(_user.auth.uid + '/songs').set({ list: _user.songs.list });
    });
  };

  // Remove from favorites.
  u.removeSongFromFavorites = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (s) {
      s.favorite = false;
      userRefs.private.child(_user.auth.uid + '/songs').set({ list: _user.songs.list });
    });
  };

  // Return all songs user has fetched.
  u.getFetched = function () {
    return _user.songs.list;
  };

  // Return all songs user has favorited.
  u.getFavorites = function () {
    return _user.songs.list.filter(function (song, i) {
      return song.favorite;
    });
  };

  // Get all local songs user has fetched.
  u.getLocal = function () {
    return _user.songs.list.filter(function (song, i) {
      return song.IsLocal;
    });
  };

  // Get song with current id.
  u.getSong = function (id) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _user.songs.list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var song = _step.value;

        if (id === song.id) return song;
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

    return null;
  };

  u.includes = includes;

  u.login = function (credentials) {
    auth.$authWithPassword(credentials).then(function (authData) {
      _user.auth = {
        token: authData.token,
        uid: authData.uid,
        provider: authData.provider
      };

      // Fetch songs from Firebase and load.
      u.loadUser();
    }).catch(function (err) {
      console.error(err);
    });
  };

  u.logout = auth.$unauth;

  u.signup = function (credentials) {
    auth.$createUser(credentials).then(function (userData) {

      return auth.$authWithPassword(credentials);
    }).then(function (authData) {
      var uid = authData.uid;

      _user.email = credentials.email;
      _user.auth = {
        token: authData.token,
        uid: authData.uid,
        provider: authData.provider
      };

      // Store private/public user data.
      userRefs.public.set(_defineProperty({}, uid, _user));
      userRefs.private.set(_defineProperty({}, uid, _user));

      console.log('Logged in as: ', _user);
    }).catch(function (err) {
      console.error('Error while authenticating: ' + err);
    });
  };

  return u;
})

// Spotify
.factory('Spotify', function ($localstorage, FIREBASE_URL, $firebaseAuth) {
  // get playlist
  // post to playlist
  // remove from playlist
});