angular.module('kexp.services', ['kexp.utils', 'firebase'])

  .constant('FIREBASE_URL', 'https://kexp.firebaseio.com/')

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
    let _user = $localstorage.getObject('user') || $helpers.getBlankUser();

    // Object to return.
    let u = {};

    // Set user information in memory.
    u.setSession = (user) => {
      _user = user;
    };


    // Load user info from Firebase using uid.
    // Update songs list with songs that were fetched before login.
    u.load = () => {

      return new Promise((resolve, reject) => {
        userRefs.private.child(_user.auth.uid).on('value', (data) => {

          // Get new user info.
          let user = data.val();

          // If user was initially loaded as guest (empty localStorage) then
          // add songs that were fetched before login to beginning of list.
          let list = _user.isGuestUser ?
                     [..._user.songs.list, ...user.songs.list] :
                     _user.songs.list;

          _user = user;
          _user.songs.list = list;
          _user.isGuestUser = false;
          resolve(_user);
        });
      });
    };


    // Update localStorage/Firebase.
    u.save = () => {
      $localstorage.setObject('user', _user);

      if (u.isLoggedIn()) {
        userRefs.private.set({ [_user.auth.uid]: _user });
      }

      return Promise.resolve(_user);
    };


    // True if user existing or in localhost.
    u.checkSession = () => {
      return new Promise((resolve, reject) => {

        if (_user.uid) {
           resolve(true);
        } else {
          let user = $localstorage.getObject('user');

          if (user && user.uid) {
            u.setSession(user);
            resolve(true);
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
        u.save();
      }

    };


    // Remove from list.
    u.removeSongFromFetched = (song) => {
      if (!song) return;

      return includes(_user.songs.list, song, (found, i) => {
        _user.songs.list.splice(i, 1);
        u.save();
      });
    };


    // Keep list of favorites.
    u.addSongToFavorites = (song) => {
      if (!song) return;

      return includes(_user.songs.list, song, (s) => {
        s.favorite = true;
        u.save();
      });
    };


    // Remove from favorites.
    u.removeSongFromFavorites = (song) => {
      if (!song) return;

      return includes(_user.songs.list, song, (s) => {
        s.favorite = false;
        u.save();
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

      return new Promise((resolve, reject) => {
        auth.$authWithPassword(credentials)
            .then((authData) => {
              _user.auth = {
                token: authData.token,
                uid: authData.uid,
                provider: authData.provider
              }

              // Get songs, add any that were fetched before login, then save.
              return u.load()
                      .then(u.save)
                      .then((user) => {
                        resolve(user);
                      });
            })
            .catch((err) => {
              console.error(err);
              reject(err);
            });
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
            u.save();

          }).catch((err) => {
            console.error(`Error while authenticating: ${err}`);
          });
    };


    u.isLoggedIn = () => {
      return !!_user.auth.uid;
    };


    // Return a copy of the user object.
    u.getUser = () => {
      return Object.assign({}, _user);
    }


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
    let auth = () => {
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
            resolve(requestToken);
          }
        });
      });
    };


    // Get tokens from Spotify.
    let getTokens = (requestToken) => {
      let url = 'http://kexp.lyleblack.com/tokens',
          params = { code: requestToken };

      return new Promise((resolve, reject) => {
        $http.get(url, { params })
             .then((res) => {
               resolve(res.data.tokens);
             })
             .catch((err) => {
               reject(err);
             });
        });
    };


    // Get refresh tokens.
    let refresh = (refresh_token) => {
      let url = 'http://kexp.lyleblack.com/refresh',
          params = { refresh_token };

      return $http.get(url, { params });
    };


    // Store tokens on user object.
    let storeTokens = (tokens, user) => {
      user.spotify.tokens = tokens;
      return Promise.resolve(user);
    };


    // Find playlist with given name in given list of playlists.
    let findPlaylist = (playlists, name) => {
      for (let playlist of playlists) {
        if (playlist.name === name) return playlist;
      }
      return false;
    };


    // Return uri and method of requested endpoint.
    let getEndpoint = (user_id, playlist_id) => {
      let url = 'https://api.spotify.com/v1';

      return {
        getUser: {
          url: `https://api.spotify.com/v1/me`,
          method: 'GET'
        },
        getPlaylists: {
          url: `${url}/me/playlists`,
          method: 'GET'
        },
        createPlaylist: {
          url: `${url}/users/${user_id}/playlists`,
          method: 'POST'
        },
        addToPlaylist: {
          url: `${url}/users/${user_id}/playlists/${playlist_id}/tracks`,
          method: 'POST'
        },
        removeFromPlaylist: {
          url: `${url}/users/${user_id}/playlists/${playlist_id}/tracks`,
          method: 'DELETE'
        }
      };
    };


    // Load tokens and then save on user object.
    s.authenticate = (user) => {
      return auth().then(getTokens)
                   .then((tokens) => {
                     return storeTokens(tokens, user);
                   })
                   .catch((err) => {
                     console.error(err);
                   });
    };


    // Load refresh tokens and save on user object.
    s.refreshTokens = (user) => {
      return refresh(user.spotify.request_token).then((res) => {
        return storeTokens(res, user);
      });
    };


    // Search for song.
    s.searchForTrack = (song) => {
      // Pull out track name, artist name, album name.
      // Construct query.
      // Fire off query.
      // Return first result or ...?
    }


    // Get user Spotify info.
    s.getUser = () => {
      let { url, method } = getEndpoint().getUser;

      return new Promise((resolve, reject) => {

        let config = {
          url,
          method,
          headers: {
            Authorization: `Bearer ${user.spotify.access_token}`
          }
        };

        $http(config).then((res) => {
          resolve(res.data);
        }, (err) => {
          reject(err);
        });
      });
    }


    // Return user's playlists.
    s.getUserPlaylists = (user) => {
      let { tokens: { access_token }} = user.spotify;
      let { url, method } = getEndpoint().getPlaylists;

      return new Promise((resolve, reject) => {

        let config = {
          url,
          method,
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        };

        $http(config).then((res) => {
          resolve(res.data);
        }, (err) => {
          reject(err);
        });
      });
    }


    // Create playlist with given name.
    s.createPlaylist = (name, user) => {
      let { user: { id }, tokens: { access_token }} = user.spotify;
      let { uri, method } = getEndpoint(id).createPlaylist;

      let config = {
        url,
        method,
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        data: {
          name: 'myKEXP',
          'public': true
        }
      };

      return $http(config);
    };


    // Add song to playlist.
    s.addToPlaylist = (user, trackId, playlistId) => {
      let { user: { id }, tokens: { access_token }} = user.spotify;
      let { uri, method } = getEndpoint(id, playlistId).addToPlaylist;

      let config = {
        url,
        method,
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        data: {
          uris: [`spotify:track:${trackId}`]
        }
      };

      return  $http(config);
    }


    // Remove song from playlist
    s.removeFromPlaylist = (user, trackId, playlistId) => {
      let { user: { id }, tokens: { access_token }} = user.spotify;
      let { uri, method } = getEndpoint(id, playlistId).removeFromPlaylist;

      let config = {
        url,
        method,
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        data: {
          tracks: [{ uri: `spotify:track:${trackId}`}]
        }
      };

      return  $http(config);
    }


    return s;
  });
