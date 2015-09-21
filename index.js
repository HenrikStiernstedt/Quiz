
var
  express = require('express'),
  app = express(),
  server  = require("http").createServer(app),
  io = require("socket.io")(server),
  session = require("express-session")({
    secret: "my-secret123",
    resave: true,
    saveUninitialized: true
  }),
  sharedsession = require("express-socket.io-session");

  // No cache
  app.use(function (req, res, next) {
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');
      next()
  });


// Attach session
app.use(session);

// Share session with io sockets

io.use(sharedsession(session));

// I guess I have to ditch those two examples...
io.on("connection", function(socket) {
    // Accept a login event with user's data
    socket.on("login", function(userdata) {
        socket.handshake.session.userdata = userdata;
    });
    socket.on("logout", function(userdata) {
        if (socket.handshake.session.userdata) {
            delete socket.handshake.session.userdata;
        }
    });
});


server.listen(3000, function(){
  console.log('listening on *:3000');
});
/////////

/*
var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
*/
var request = require('request');

var maps = require('./js/maps.js');

var status =
{
  isBuzzed : false,
  isBuzzActive : false,
  winningTeamName : null,
  score : null
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
    "returnCode": maps.guessMap(mapId, req.params["city"])
  }
  res.json(response);
});

app.get('/map/:mapId', function(req, res) {
  var mapId = req.params["mapId"];

  if(mapId === 'next') {
    if(req.session.currentMapId == null) {
      req.session.currentMapId = 0;
    } else {
      req.session.currentMapId++;
    }
    mapId = req.session.currentMapId;
  }
  if(mapId === 'prev') {
    if(req.session.currentMapId == null) {
      req.session.currentMapId = 0;
    } else {
      req.session.currentMapId--;
    }
    mapId = req.session.currentMapId;
  }

  maps.getMapFromId(mapId, req, res);
});

app.get('/map/:zoom/:city', function(req, res) {
    request(maps.createMapURL(req.params["city"], req.params["zoom"])).pipe(res);
});

// Socket.io code for events
io.on('connection', function(socket){
  console.log('a user connected');
  console.log(socket.id);
  //req.session.socketId = socket.id;

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
