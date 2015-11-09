var express = require('express'),
    fetch = require('fetch'),
    cheerio = require('cheerio'),
    app = express();

var PORT = process.env.PORT || 3000,
    KEXP_URL = 'http://kexp.org/playlist';

app.get('/', function(req, res) {

  fetch.fetchUrl(KEXP_URL, function(err, meta, body) {
    if (err) return res.json(err);

    var $ = cheerio.load(body.toString('utf8')),
        currentSong = $('#PlaylistItems').children().first(),
        data = currentSong.data('playlistitem');

    return res.json(data);
  });
});

console.log('Server listening at %s...', PORT);
app.listen(PORT);
