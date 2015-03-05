

module.exports = {
  createMapURL : createMapURL,
  getMapFromId : getMapFromId,
  guessMap : guessMap
}

var request = require('request');
var gm = require('gm');
var fs = require('fs');

// Returns a url showing a map of a city. Use a zoom of 10 or 12 for best result.
function createMapURL(city, zoom, showLables)
{
  var urlpattern = 'http://maps.google.com/maps/api/staticmap?sensor=false&size=640x640&center=[city]&zoom=[zoom]&style=feature:all|element:labels|visibility:';
  console.log(showLables);
  if (showLables) {
    urlpattern += 'on';
  } else {
    urlpattern += 'off';
  }
//  urlPattern += (showLables != null ? 'on' : 'off');
  return url = urlpattern.replace('[city]', encodeURIComponent(city)).replace('[zoom]', encodeURIComponent(zoom));
}

// Crude method for returning a map from id.
// Should be replaced with returing a json with url and errorMsg instead.
function getMapFromId(mapId, req, res) {
  if(mapId >= 0 && mapId < maps.length)
  {
    testMapFunction();
    request(createMapURL(maps[mapId][0], maps[mapId][1], false)).pipe(res);
  }
  else
  {
    res.send('No such map available');
  }
}

// Very crude compare. Must be replaced with something less explicit.
// 1: OK
// 0: Not OK
// -1: Error
function guessMap(mapId, guess) {
  if(mapId >= 0 && mapId < maps.length) {
    if(maps[mapId][0] == guess)
    {
      return 1;
    } else {
      return 0;
    }
  } else {
    return -1;
  }

}

function testMapFunction() {
  //var readStream = fs.createReadStream('henrik.jpg');

  gm('../henrik.jpg')
  .identify(function (err, data) {
    if (!err) console.log(data)
    else console.log('err: ' + err);
  });
  /*
  gm(readStream, 'henrik.jpg')
  .size({bufferStream: true}, function(err, size) {
    this.resize(size.width / 2, size.height / 2)
    this.write('henrik2.jpg', function (err) {
      if (!err) console.log('done');
      else console.log('err: ' + err);
    });
  });
  */
}

// This is for displaying a map, without displaying the true source.
var maps =
  [
    ['Dubai', 10],
    ['Istanbul', 10],
    ['Tijuana', 12],
    ['Malmö', 10],
    ['Cape Town', 10],
    ['Jerusalem', 10],
    ['Hong Kong', 10],
    ['St Petersburg', 10],
    ['London', 10],
    ['Moscow', 12],
    ['Singhapore', 10],
    ['Göteborg', 10],
    ['Amsterdam', 14],
    ['Rome', 12],
    ['Los Angeles', 10],
    ['venice', 12],
    ['Shanghai', 10],
    ['Barcelona', 12],
    ['New York', 10],
    ['Cydney Australia', 12],
    ['Honolulu', 11],
    ['Budapest', 13],
    ['Tokyo', 10],
    ['Washington DC', 13],
    ['Lisabon', 10],
    ['Geneva', 10],
    ['Helsinki', 11],
    ['Gibraltar', 12]

  ]
