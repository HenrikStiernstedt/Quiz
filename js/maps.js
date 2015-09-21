

module.exports = {
  createMapURL : createMapURL,
  getMapFromId : getMapFromId,
  guessMap : guessMap
}

var request = require('request');
//var gm = require('gm');
var fs = require('fs');

// Returns a url showing a map of a city. Use a zoom of 10 or 12 for best result.
function createMapURL(city, zoom, showLables)
{
  var urlpattern = 'http://maps.google.com/maps/api/staticmap?sensor=false&size=640x640&center=[city]&zoom=[zoom]&style=feature:all|element:labels|visibility:';
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
    //testMapFunction();
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
    console.log('Guessed "'+guess+'" for city "' + maps[mapId][0]  + '"');
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

// GM did not work at all when I started working on a new computer. Disabled it for now.
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
    ['Dubai, DU, United Arab Emirates', 10],
    ['Istanbul, IB, Turkey', 10],
    ['Tijuana, MX, Mexico', 12],
    ['Malmö', 10],  // Skumt
    ['Cape Town, WC, South Africa', 10],
    ['Jerusalem, JM, Israel', 10],
    ['Hong Kong, HK, Hong Kong (SAR)', 10],
    ['Saint Petersburg, SP, Russia', 10],
    ['London, EN, United Kingdom', 10],
    ['Moscow, MC, Russia', 12],
    ['Singapore, SG, Singapore', 10],
    ['Gothenburg, VG, Sweden', 10],
    ['Amsterdam, NH, Netherlands', 14],
    ['Rome, LA, Italy', 12],
    ['Los Angeles, CA, United States', 10],
    ['Venice, VE, Italy', 12],
    ['Shanghai, SH, China', 10],
    ['Barcelona, CT, Spain', 12],
    ['New York, NY, United States', 10],
    ['Cydney, Australia', 12],  // Skumt
    ['Honolulu, HI, United States', 11],
    ['Budapest, BU, Hungary', 13],
    ['Tokyo, TY, Japan', 10],
    ['Washington DC', 13],  // Skumt
    ['Lisbon, LI, Portugal', 10],
    ['Geneva, GE, Switzerland', 10],
    ['Helsinki, ES, Finland', 11],
    ['Gibraltar, GI, Gibraltar', 12]

  ]
