angular.module('kexp.services', ['kexp.utils', 'firebase'])

  .constant('FIREBASE_URL', 'https://mykexp.firebaseio.com/')

  // Song currently playing on KEXP.
  .factory('Song', ($http, $q) => {
    let s = {};

    let song = { current: null };

    s.getDefault = (song) => {

      // Since some of the attributes in the song object change frequently,
      // grab the relevant data and use it to make a unique (enough) id.
      let id = song.ArtistName +
               song.ReleaseName +
               song.TrackName +
               song.ReleaseImageUri;

      return {
        favorite: false,
        id: btoa(unescape(encodeURIComponent(id)))
      };
    };

    // Pull data on currently playing song from KEXP.
    s.getCurrentlyPlaying = () => {

      let req = {
        method: 'GET',
        url: 'http://kexp.lyleblack.com',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      return $http(req).then(
        // Success
        (res) => {
          let data = res.data;

          if (!data.ArtistName && !data.TrackName) {
            song.current = { airBreak: true };
          } else {
            song.current = angular.extend(s.getDefault(data), data);
          }
        },
        // Error
        (res) => {
          song.current = null;
        }
      );
    };


    s.getCurrent = () => {
      return song.current;
    };

    return s;
  })


  // User data
  .factory('User', ($localstorage, FIREBASE_URL, $helpers, $firebaseAuth, $http) => {

    let { getBlankUser, includes } = $helpers;

    // Firebase
    let ref = new Firebase(FIREBASE_URL),
        auth = $firebaseAuth(ref);

    let userRefs = {
      private: ref.child(`users/private`),
      public: ref.child(`users/public`)
    };

    // User object.
    let _user = $helpers.getBlankUser();

    // Object to return.
    let u = {};


    // Set user information in memory and in localhost.
    u.setSession = (user) => {
      _user = user;

      $localstorage.setObject('user', _user);
    };


    // Load user info from Firebase using uid.
    u.load = () => {
      userRefs.private.child(_user.auth.uid).on('value', (data) => {
        _user = data.val();

        $localstorage.setObject('user', _user);
      });
    };


    // True if user existing or in localhost.
    u.checkSession = () => {
      return new Promise((resolve, reject) => {

        if (_user.uid) {
           resolve(true);
        } else {
          let user = $localstorage.getObject('user');

          if (user.uid) {
            u.setSession(user);
            u.fetchSongs().then(() => {
              resolve(true);
            });
          }
        }

        resolve(false);
      });
    };


    u.destroySession = () => {
      _user = getBlankUser();
      $localstorage.setObject('user', _user);
    };



    // Keep list of all fetched songs
    u.addSongToFetched = (song) => {
      if (!song) return;

      // Only add song if not already in queue.
      if (!includes(_user.songs.list, song)) {
        _user.songs.list.unshift(song);
      }

      userRefs.private.child(`${_user.auth.uid}/songs`)
                      .update({list: _user.songs.list});
    };


    // Remove from list.
    u.removeSongFromFetched = (song) => {
      if (!song) return;

      return includes(_user.songs.list, song, (found, i) => {
        _user.songs.list.splice(i, 1);
        userRefs.private.child(`${_user.auth.uid}/songs`)
                        .set({list: _user.songs.list});
      });
    };


    // Keep list of favorites.
    u.addSongToFavorites = (song) => {
      if (!song) return;

      return includes(_user.songs.list, song, (s) => {
        s.favorite = true;
        userRefs.private.child(`${_user.auth.uid}/songs`)
                        .set({list: _user.songs.list});
      });
    };


    // Remove from favorites.
    u.removeSongFromFavorites = (song) => {
      if (!song) return;

      return includes(_user.songs.list, song, (s) => {
        s.favorite = false;
        userRefs.private.child(`${_user.auth.uid}/songs`)
                        .set({list: _user.songs.list});
      });
    };


    // Return all songs user has fetched.
    u.getFetched = () => {
      return _user.songs.list;
    };


    // Return all songs user has favorited.
    u.getFavorites = () => {
      return _user.songs.list.filter((song, i) => {
        return song.favorite;
      });
    };


    // Get all local songs user has fetched.
    u.getLocal = () => {
      return _user.songs.list.filter((song, i) => {
        return song.IsLocal;
      })
    };


    // Get song with current id.
    u.getSong = (id) => {
      for (let song of _user.songs.list) {
        if (id === song.id) return song;
      }

      return null;
    }


    u.includes = includes;


    // Return id of current user.
    u.getId = () => {
      return _user.auth.uid;
    };


    // Login and load user.
    u.login = (credentials) => {
      auth.$authWithPassword(credentials)
          .then((authData) => {
            _user.auth = {
              token: authData.token,
              uid: authData.uid,
              provider: authData.provider
            }

            // Fetch songs from Firebase and load.
            u.load();
          })
          .catch((err) => {
            console.error(err);
          });
    };


    u.logout = auth.$unauth;


    // Create account in Firebase.
    u.signup = (credentials) => {
      auth.$createUser(credentials)
          .then((userData) => {

            return auth.$authWithPassword(credentials);
          }).then((authData) => {
            let { uid } = authData ;

            _user.email = credentials.email;
            _user.auth = {
              token: authData.token,
              uid: authData.uid,
              provider: authData.provider
            };

            // Store private/public user data.
            userRefs.public.set({ [uid]: _user });
            userRefs.private.set({ [uid]: _user });

            console.log('Logged in as: ', _user);
          }).catch((err) => {
            console.error(`Error while authenticating: ${err}`);
          });
    };

    return u;

  })

  // Spotify
  .factory('Spotify', ($window, FIREBASE_URL, $q, $http) => {

    let s = {};

    let redirect_uri = 'http://localhost/callback';
    let CLIENT_ID = '05f018422a7f4c6f9820f782e55dd398';

    let ref = new Firebase(FIREBASE_URL);

    let userRefs = {
      private: ref.child(`users/private`),
      public: ref.child(`users/public`)
    };


    // Authenticate with Spotify.
    let auth = (userId) => {
      let scope = 'playlist-modify-public';

      let url = 'https://accounts.spotify.com/authorize' +
                '?response_type=code' +
                '&client_id=' + CLIENT_ID +
                '&scope=' + encodeURIComponent(scope) +
                '&redirect_uri=' + encodeURIComponent(redirect_uri);

      return $q((resolve, reject) => {
        let _ref = cordova.InAppBrowser.open(url, '_blank', 'location=no');


        _ref.addEventListener('loadstart', (e) => {
          let url = e.url,
              code = /\?code=(.+)$/.exec(url);

          if (code) {
            if ((url).includes('error')) return reject();
            let requestToken = code[1];
            _ref.close();
            resolve(requestToken, userId);
          }
        });
      });
    };


    // Get tokens from Spotify.
    let getTokens = (requestToken, userId) => {
      let url = 'http://kexp.lyleblack.com/tokens',
          params = { code: requestToken };

      return $http.get(url, { params });
    };


    // Store tokens in Firebase.
    let storeTokens = (res, userId) => {
      userRefs.private.child(`${userId}/spotify`).set({tokens: res.data.tokens});

      return $q((resolve, reject) => {
        if (res.status === 200) {
          resolve(res.data.tokens);
        }
        reject();
      });
    };


    // Exposed method.
    s.authenticate = (userId) => {
      return auth(userId).then(getTokens)
                   .then((res) => {
                     return storeTokens(res, userId);
                   });
    };

    return s;
  });
