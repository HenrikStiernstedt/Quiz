

module.exports = {
  createMapURL : createMapURL,
  getMapFromId : getMapFromId
}

var request = require('request');

// Returns a url showing a map of a city. Use a zoom of 10 or 12 for best result.
function createMapURL(city, zoom)
{
  var urlpattern = 'http://maps.google.com/maps/api/staticmap?sensor=false&size=512x512&center=[city]&zoom=[zoom]&style=feature:all|element:labels|visibility:off';
  return url = urlpattern.replace('[city]', encodeURIComponent(city)).replace('[zoom]', encodeURIComponent(zoom));
}

// Crude method for returning a map from id.
// Should be replaced with returing a json with url and errorMsg instead.
function getMapFromId(mapId, req, res) {
  if(mapId >= 0 && mapId < maps.length)
  {
    request(createMapURL(maps[mapId][0], maps[mapId][1])).pipe(res);
  }
  else
  {
    res.send('No such map available');
  }
}

// This is for displaying a map, without displaying the true source.
var maps =
  [
    ['Dubai', 10],
    ['istanbul', 10],
    ['Mexico City', 10],
    ['Malmö', 10],
    ['Cape Town', 10],
    ['Jerusalem', 10],
    ['Hong Kong', 10],
    ['St Petersburg', 10],
    ['London', 10],
    ['Moscow', 12],
    ['Göteborg', 10],
    ['Rome', 12],
    ['Los Angeles', 10],
    ['venice', 12],
    ['Shanghai', 10],
  ]
