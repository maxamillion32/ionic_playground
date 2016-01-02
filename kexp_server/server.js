var express = require('express'),
    request = require('request'),
    querystring = require('querystring'),
    firebase = require('firebase'),
    cheerio = require('cheerio'),
    app = express();

var PORT = process.env.PORT || 80,
    KEXP_URL = 'http://kexp.org/playlist';

var CLIENT_ID = process.env.SPOTIFY_CLIENT_ID,
    CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

var redirect_uri = 'http://localhost/callback';


// Return JSON of currently playing song.
app.get('/', function(req, res) {

  request(KEXP_URL, function(err, request, body) {
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


// Get access tokens from Spotify.
app.get('/tokens', function(req, res) {
  var url = 'https://accounts.spotify.com/api/token',
      auth = new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');

  var config = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + auth
    },
    form: {
      code: req.query.code,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri
    },
    json: true
  };

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers',
             'Origin, X-Requested-With, Content-Type, Accept');

  request.post(config, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      return res.send({ tokens: body });
    }
    res.status(response.statusCode).json(error);
  });
});


// Get new refresh token.
app.get('/refresh', function(req, res) {

  var refresh_token = req.query.refresh_token,
      auth = new Buffer(CLIENT_SECRET + ':' + CLIENT_SECRET).toString('base64');

  var config = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + auth },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(config, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      return res.send({ tokens: body });
    }
    res.status(response.statusCode).json(error);
  });
});


console.log('Server listening at %s...', PORT);
app.listen(PORT);
