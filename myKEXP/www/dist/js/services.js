'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
.factory('User', function ($localstorage, FIREBASE_URL, $helpers, $firebaseAuth, $http) {
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
  // Update Firebase with songs that were fetched before login.
  u.load = function () {
    userRefs.private.child(_user.auth.uid).on('value', function (data) {

      // Get new user info.
      var user = data.val();

      // Add songs fetched before login to beginning of list.
      var list = [].concat(_toConsumableArray(_user.songs.list), _toConsumableArray(user.songs.list));

      _user = user;
      _user.songs.list = list;

      // Update localStorage/Firebase with user
      $localstorage.setObject('user', _user);
      userRefs.public.set(_defineProperty({}, uid, _user));
      userRefs.private.set(_defineProperty({}, uid, _user));
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

    // Update Firebase if logged in.
    if (undefined.isLoggedIn()) {
      userRefs.private.child(_user.auth.uid + '/songs').update({ list: _user.songs.list });
    }
  };

  // Remove from list.
  u.removeSongFromFetched = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (found, i) {
      _user.songs.list.splice(i, 1);

      // Update Firebase if logged in.
      if (undefined.isLoggedIn()) {
        userRefs.private.child(_user.auth.uid + '/songs').set({ list: _user.songs.list });
      }
    });
  };

  // Keep list of favorites.
  u.addSongToFavorites = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (s) {
      s.favorite = true;

      // Update Firebase if logged in.
      if (undefined.isLoggedIn()) {
        userRefs.private.child(_user.auth.uid + '/songs').set({ list: _user.songs.list });
      }
    });
  };

  // Remove from favorites.
  u.removeSongFromFavorites = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (s) {
      s.favorite = false;

      // Update Firebase if logged in.
      if (undefined.isLoggedIn()) {
        userRefs.private.child(_user.auth.uid + '/songs').set({ list: _user.songs.list });
      }
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

  // Return id of current user.
  u.getId = function () {
    return _user.auth.uid;
  };

  // Login and load user.
  u.login = function (credentials) {
    auth.$authWithPassword(credentials).then(function (authData) {
      _user.auth = {
        token: authData.token,
        uid: authData.uid,
        provider: authData.provider
      };

      // Fetch songs from Firebase and load.
      u.load();
    }).catch(function (err) {
      console.error(err);
    });
  };

  u.logout = auth.$unauth;

  // Create account in Firebase.
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

  u.isLoggedIn = function () {
    return !!_user.auth.uid;
  };

  return u;
})

// Spotify
.factory('Spotify', function ($window, FIREBASE_URL, $q, $http) {

  var s = {};

  var redirect_uri = 'http://localhost/callback';
  var CLIENT_ID = '05f018422a7f4c6f9820f782e55dd398';

  var ref = new Firebase(FIREBASE_URL);

  var userRefs = {
    private: ref.child('users/private'),
    public: ref.child('users/public')
  };

  // Authenticate with Spotify.
  var auth = function auth(userId) {
    var scope = 'playlist-modify-public';

    var url = 'https://accounts.spotify.com/authorize' + '?response_type=code' + '&client_id=' + CLIENT_ID + '&scope=' + encodeURIComponent(scope) + '&redirect_uri=' + encodeURIComponent(redirect_uri);

    return $q(function (resolve, reject) {
      var _ref = cordova.InAppBrowser.open(url, '_blank', 'location=no');

      _ref.addEventListener('loadstart', function (e) {
        var url = e.url,
            code = /\?code=(.+)$/.exec(url);

        if (code) {
          if (url.includes('error')) return reject();
          var requestToken = code[1];
          _ref.close();
          resolve(requestToken, userId);
        }
      });
    });
  };

  // Get tokens from Spotify.
  var getTokens = function getTokens(requestToken, userId) {
    var url = 'http://kexp.lyleblack.com/tokens',
        params = { code: requestToken };

    return $http.get(url, { params: params });
  };

  // Store tokens in Firebase.
  var storeTokens = function storeTokens(res, userId) {
    userRefs.private.child(userId + '/spotify').set({ tokens: res.data.tokens });

    return $q(function (resolve, reject) {
      if (res.status === 200) {
        resolve(res.data.tokens);
      }
      reject();
    });
  };

  // Exposed method.
  s.authenticate = function (userId) {
    return auth(userId).then(getTokens).then(function (res) {
      return storeTokens(res, userId);
    });
  };

  return s;
});