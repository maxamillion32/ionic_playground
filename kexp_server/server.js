var express = require('express'),
    request = require('request'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser'),
    firebase = require('firebase'),
    cheerio = require('cheerio'),
    app = express();

app.use(cookieParser());

var PORT = process.env.PORT || 80,
    KEXP_URL = 'http://kexp.org/playlist';

var CLIENT_ID = process.env.SPOTIFY_CLIENT_ID,
    CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

var redirect_uri = 'http://localhost:' + PORT + '/callback';

// Return JSON of currently playing song.
app.get('/', function(req, res) {

  request(KEXP_URL, function(err, res, body) {
    if (err) return res.json(err);

    var $ = cheerio.load(body.toString('utf8')),
        currentSong = $('#PlaylistItems').children().first(),
        data = currentSong.data('playlistitem');

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers',
               'Origin, X-Requested-With, Content-Type, Accept');

    return res.json(data);
  });
});


// Spotify callback: uses auth code to get tokens and saves tokens to Firebase.
app.get('/callback', function(req, res) {

  var code = req.query.code || null,
      state = req.query.state;

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
    },
    json: true
  };

  // Trade in code for tokens.
  request.post(authOptions, function(err, res, body) {
    if (!error && response.statusCode === 200) {

      var fb_url = 'https://mykexp.firebaseio.com/users/private/' + state.user;

      var auth = {
        access_token: body.access_token,
        refresh_token: body.refresh_token
      };

      var ref = new firebase(fb_url);

      // Save tokens to Firebase user object.
      ref.set({spotify: auth}, function(err) {
        if (err) return res.json(err);

        return res.statusCode(200);
      });
    }
  });
});

// Get new refresh token.
app.get('/refresh_token', function(req, res) {

  var refresh_token = req.query.refresh_token,
      auth = new Buffer(CLIENT_SECRET + ':' + CLIENT_SECRET).toString('base64');

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + auth },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {

      res.send({
        'access_token': body.access_token
      });
    }
  });
});

console.log('Server listening at %s...', PORT);
app.listen(PORT);
