'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

angular.module('kexp.services', ['kexp.utils', 'firebase']).constant('FIREBASE_URL', 'https://kexp.firebaseio.com/').constant('SPOTIFY_API_URL', 'https://api.spotify.com/v1')

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
  var _user = $localstorage.getObject('user') || $helpers.getBlankUser();

  // Object to return.
  var u = {};

  // Set user information in memory.
  u.setSession = function (user) {
    _user = user;
  };

  // Load user info from Firebase using uid.
  // Update songs list with songs that were fetched before login.
  u.load = function () {

    return new Promise(function (resolve, reject) {
      userRefs.private.child(_user.auth.uid).on('value', function (data) {

        // Get new user info.
        var user = data.val();

        // If user was initially loaded as guest (empty localStorage) then
        // add songs that were fetched before login to beginning of list.
        var list = _user.isGuestUser ? [].concat(_toConsumableArray(_user.songs.list), _toConsumableArray(user.songs.list)) : _user.songs.list;

        _user = user;
        _user.songs.list = list;
        _user.isGuestUser = false;
        resolve(_user);
      });
    });
  };

  // Update localStorage/Firebase.
  u.save = function () {
    $localstorage.setObject('user', _user);

    if (u.isLoggedIn()) {
      userRefs.private.set(_defineProperty({}, _user.auth.uid, _user));
    }

    return Promise.resolve(_user);
  };

  // True if user existing or in localhost.
  u.checkSession = function () {
    return new Promise(function (resolve, reject) {

      if (_user.uid) {
        resolve(true);
      } else {
        var user = $localstorage.getObject('user');

        if (user && user.uid) {
          u.setSession(user);
          resolve(true);
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
      u.save();
    }
  };

  // Remove from list.
  u.removeSongFromFetched = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (found, i) {
      _user.songs.list.splice(i, 1);
      u.save();
    });
  };

  // Keep list of favorites.
  u.addSongToFavorites = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (s) {
      s.favorite = true;
      u.save();
    });
  };

  // Remove from favorites.
  u.removeSongFromFavorites = function (song) {
    if (!song) return;

    return includes(_user.songs.list, song, function (s) {
      s.favorite = false;
      u.save();
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

  // Set given prop on _user to given value.
  u.set = function (prop, val) {
    _user[prop] = val;
  };

  // Return id of current user.
  u.getId = function () {
    return _user.auth.uid;
  };

  // Login and load user.
  u.login = function (credentials) {

    return new Promise(function (resolve, reject) {
      auth.$authWithPassword(credentials).then(function (authData) {
        _user.auth = {
          token: authData.token,
          uid: authData.uid,
          provider: authData.provider
        };

        // Get songs, add any that were fetched before login, then save.
        return u.load().then(u.save).then(function (user) {
          resolve(user);
        });
      }).catch(function (err) {
        console.error('Login error', JSON.stringify(err));
        reject(err);
      });
    });
  };

  // Update Spotify access token.
  u.setAccessToken = function (_ref2) {
    var access_token = _ref2.access_token;

    _user.spotify.tokens.access_token = access_token;
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
      u.save();
    }).catch(function (err) {
      console.error('Error while authenticating: ' + err);
    });
  };

  u.isLoggedIn = function () {
    return !!_user.auth.uid;
  };

  // Return a copy of the user object.
  u.getUser = function () {
    return Object.assign({}, _user);
  };

  return u;
})

// Spotify
.factory('Spotify', function ($window, FIREBASE_URL, SPOTIFY_API_URL, $q, $http) {

  var s = {};

  var redirect_uri = 'http://localhost/callback';
  var CLIENT_ID = '05f018422a7f4c6f9820f782e55dd398';

  var ref = new Firebase(FIREBASE_URL);

  var userRefs = {
    private: ref.child('users/private'),
    public: ref.child('users/public')
  };

  // Authenticate with Spotify.
  var auth = function auth() {
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
          resolve(requestToken);
        }
      });
    });
  };

  // Get tokens from Spotify.
  var getTokens = function getTokens(requestToken) {
    var url = 'http://kexp.lyleblack.com/tokens',
        params = { code: requestToken };

    return new Promise(function (resolve, reject) {
      $http.get(url, { params: params }).then(function (res) {
        resolve(res.data.tokens);
      }, function (err) {
        reject(err);
      });
    });
  };

  // Get user Spotify info.
  var getUser = function getUser(tokens) {
    var _getEndpoint$getUser = getEndpoint().getUser;
    var url = _getEndpoint$getUser.url;
    var method = _getEndpoint$getUser.method;
    var access_token = tokens.access_token;

    return new Promise(function (resolve, reject) {

      var config = {
        url: url,
        method: method,
        headers: {
          Authorization: 'Bearer ' + access_token
        }
      };

      $http(config).then(function (res) {
        var user = res.data;
        resolve({ user: user, tokens: tokens });
      }, function (err) {
        reject(err);
      });
    });
  };

  // Get refresh tokens.
  s.refreshTokens = function (refresh_token) {
    var url = 'http://kexp.lyleblack.com/refresh_token',
        params = { refresh_token: refresh_token };

    return new Promise(function (resolve, reject) {
      $http.get(url, { params: params }).then(function (res) {
        resolve(res.data);
      }, function (err) {
        reject(err);
      });
    });
  };

  // Find playlist with given name in given list of playlists.
  var findPlaylist = function findPlaylist(playlists, name) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = playlists[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var playlist = _step2.value;

        if (playlist.name === name) return playlist;
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return false;
  };

  // Return uri and method of requested endpoint.
  var getEndpoint = function getEndpoint(user_id, playlist_id) {
    var url = SPOTIFY_API_URL;

    return {
      getUser: {
        url: url + '/me',
        method: 'GET'
      },
      getPlaylists: {
        url: url + '/me/playlists',
        method: 'GET'
      },
      createPlaylist: {
        url: url + '/users/' + user_id + '/playlists',
        method: 'POST'
      },
      addToPlaylist: {
        url: url + '/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
        method: 'POST'
      },
      removeFromPlaylist: {
        url: url + '/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
        method: 'DELETE'
      },
      search: {
        url: url + '/search?',
        method: 'GET'
      }
    };
  };

  // Load tokens and user object from Spotify.
  s.authenticate = function () {
    return auth().then(getTokens).then(getUser).catch(function (err) {
      console.error('Error while authenticating with Spotify: ' + err);
    });
  };

  var buildQuery = function buildQuery(_ref3) {
    var ArtistName = _ref3.ArtistName;
    var TrackName = _ref3.TrackName;
    var ReleaseName = _ref3.ReleaseName;

    var album = ReleaseName ? 'album:' + ReleaseName + ' ' : '',
        artist = ArtistName ? 'artist:' + ArtistName + ' ' : '',
        track = TrackName ? 'track:' + TrackName + ' ' : '',
        query = '';

    [album, artist, track].forEach(function (type, i) {
      if (type) query += type;
    });

    return query.trimRight();
  };

  // Search for song.
  s.searchForTrack = function (song) {
    var url = getEndpoint().search.url;

    return new Promise(function (resolve, reject) {
      var params = { type: 'track', q: buildQuery(song) };

      $http.get(url, { params: params }).then(function (res) {
        console.log('Search res: ', res);
        resolve(res.data);
      }, function (err) {
        reject(err);
      });
    });
  };

  // Return user's playlists.
  s.getUserPlaylists = function (user) {
    var access_token = user.spotify.tokens.access_token;
    var _getEndpoint$getPlayl = getEndpoint().getPlaylists;
    var url = _getEndpoint$getPlayl.url;
    var method = _getEndpoint$getPlayl.method;

    return new Promise(function (resolve, reject) {

      var headers = {
        Authorization: 'Bearer ' + access_token
      };

      $http.get(url, { headers: headers }).then(function (res) {
        console.log('Get playlists: ', res);
        resolve(res.data);
      }, function (err) {
        reject(err);
      });
    });
  };

  // Create playlist with given name.
  s.createPlaylist = function (playlistName, user) {
    var _user$spotify = user.spotify;
    var id = _user$spotify.user.id;
    var access_token = _user$spotify.tokens.access_token;
    var _getEndpoint$createPl = getEndpoint(id).createPlaylist;
    var url = _getEndpoint$createPl.url;
    var method = _getEndpoint$createPl.method;

    return new Promise(function (resolve, reject) {

      var config = {
        headers: {
          Authorization: 'Bearer ' + access_token,
          'Content-Type': 'application/json'
        },
        data: {
          name: playlistName,
          'public': true
        }
      };

      $http.post(url, config).then(function (res) {
        resolve(res.data);
      }, function (err) {
        reject(err);
      });
    });
  };

  // Add song to playlist.
  s.addToPlaylist = function (user, trackId, playlistId) {
    var _user$spotify2 = user.spotify;
    var id = _user$spotify2.user.id;
    var access_token = _user$spotify2.tokens.access_token;
    var _getEndpoint$addToPla = getEndpoint(id, playlistId).addToPlaylist;
    var url = _getEndpoint$addToPla.url;
    var method = _getEndpoint$addToPla.method;

    var config = {
      url: url,
      method: method,
      headers: {
        Authorization: 'Bearer ' + access_token,
        'Content-Type': 'application/json'
      },
      data: {
        uris: ['spotify:track:' + trackId]
      }
    };

    return $http(config);
  };

  // Remove song from playlist
  s.removeFromPlaylist = function (user, trackId, playlistId) {
    var _user$spotify3 = user.spotify;
    var id = _user$spotify3.user.id;
    var access_token = _user$spotify3.tokens.access_token;
    var _getEndpoint$removeFr = getEndpoint(id, playlistId).removeFromPlaylist;
    var url = _getEndpoint$removeFr.url;
    var method = _getEndpoint$removeFr.method;

    var config = {
      url: url,
      method: method,
      headers: {
        Authorization: 'Bearer ' + access_token,
        'Content-Type': 'application/json'
      },
      data: {
        tracks: [{ uri: 'spotify:track:' + trackId }]
      }
    };

    return $http(config);
  };

  return s;
});