var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var request = require('request');

var status =
{
  isBuzzed : false,
  isBuzzActive : false,
  winningTeamName : null
};

var chatHistory =
[
  {
    date : new Date(),
    name : 'Server',
    text : 'Server started.'
  }
];

/*
var players =
  {
    "id" : null
    "name" : null
  }
*/
app.get('/', function(req, res){
  res.sendFile(__dirname + '/quiz.html');
});

app.get('/quizmaster', function(req, res){
  res.sendFile(__dirname + '/quizmaster.html');
});

// Specialare för AJAX och annat som inte behöver pushas ut.
app.get('/status', function(req, res){
  res.json(status);
});

app.get('/chatHistory', function(req, res){
  res.json(chatHistory);
});

// Ovanstående prylar känns onödigt nu när den här tar in alla filer.
app.use(express.static(__dirname + '/'));

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

app.get('/map/:mapId', function(req, res) {
  var mapId = req.param("mapId");
  if(mapId >= 0 && mapId < maps.length)
  {
    request(createMapURL(maps[mapId][0], maps[mapId][1])).pipe(res);
  }
  else
  {
    res.send('No such map available');
  }
});

app.get('/map/:zoom/:city', function(req, res) {
    request(createMapURL(req.param("city"), req.param("zoom"))).pipe(res);
});

function createMapURL(city, zoom)
{
  var urlpattern = 'http://maps.google.com/maps/api/staticmap?sensor=false&size=512x512&center=[city]&zoom=[zoom]&style=feature:all|element:labels|visibility:off';
  return url = urlpattern.replace('[city]', encodeURIComponent(city)).replace('[zoom]', encodeURIComponent(zoom));
}

// Socket.io code for events
io.on('connection', function(socket){
  console.log('a user connected');
  console.log(socket.id);

  socket.on('new chat message', function(msgJson){
    msgJson.date = new Date();
    io.emit('chat message', msgJson);
    chatHistory.push(msgJson);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('Buzz', function(teamName){
    if(status.isBuzzed)
    {
      console.log('Too slow buzz from ' + teamName);
    }
    else if (!status.isBuzzActive) {
      console.log('Random buzz from ' + teamName);
    } else {
      console.log('Buzz from ' + teamName);
      status.isBuzzed = true;
      status.isBuzzActive = false;
      status.winningTeamName = teamName;
      io.emit('Buzzed', teamName);
    }
  });

  socket.on('PingResponse', function(pingTime) {
    console.log(new Date().getTime() - pingTime);
  });

  // Quizmaster functions below.
  socket.on('ResetBuzz', function() {
    status.isBuzzed = false;
    status.isBuzzActive = true;
    status.winningTeamName = null;
    io.emit('ResetBuzz', null);
  });

  socket.on('StartPing', function() {
    console.log('Ping Request from QM.')
    io.emit('Ping', new Date().getTime());
  });


});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
