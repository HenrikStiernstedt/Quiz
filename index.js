var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var request = require('request');

var maps = require('./js/maps.js');

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

app.get('/mapgame', function(req, res) {
  res.sendFile(__dirname + '/mapgame.html');
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

// Mapgame server suport
app.get('/map/guess/:mapId/:city', function(req, res) {
  var mapId = req.params["mapId"];
  var response =
  {
    "returnCode": maps.guessMap(mapId, req.param("city"))
  }
  res.json(response);
});

app.get('/map/:mapId', function(req, res) {
  var mapId = req.params["mapId"];
  maps.getMapFromId(mapId, req, res);
});

app.get('/map/:zoom/:city', function(req, res) {
    request(maps.createMapURL(req.param("city"), req.param("zoom"))).pipe(res);
});




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
