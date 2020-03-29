
var
  express = require('express'),
  app = express(),
  server  = require("http").createServer(app),
  io = require("socket.io")(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: true
  }),
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
io.use(sharedsession(session, {
    autoSave:true
}));

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

app.use('/favicon.ico', express.static('images/favicon.png'));

var maps = require('./js/maps.js');
var nextTeamNumber = 1;

var players = new Map();

var status =
{
  isBuzzed : false,
  isBuzzActive : false,
  winningTeamName : null,
  winningTeam : null,
  buzzList : {},
  buzzOrder : 0,
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
  res.json({ status: status, players : Array.from(players.values())});
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
  console.log(socket.id + ' connected. Team: ' +socket.handshake.session.team);
  if (socket.handshake.session.team){
    console.log('Returning user ' + socket.handshake.session.team);
    if(players.get(socket.handshake.session.team))
    {
      players.get(socket.handshake.session.team).active = true;
      players.get(socket.handshake.session.team).socketId = socket.id;
      socket.handshake.session.save();
    }
    else {
      console.log("Error restoring session. No entry in Players-object for team "+socket.handshake.session.team);
    }
  } else {

    socket.handshake.session.team = nextTeamNumber++;
    socket.handshake.session.save();
    console.log("New user " + socket.handshake.session.team);
    players.set(socket.handshake.session.team,
      {
        "id" : socket.handshake.session.team,
        "team" : socket.handshake.session.team,
        "score" : 0,
        "active" : true,
        "socketId" : socket.id,
        "teamName" : null
      }
    );
  }

  socket.on('new chat message', function(msgJson){
    msgJson.date = new Date();
    io.emit('chat message', msgJson);
    chatHistory.push(msgJson);
  });


  socket.on('SetName', function(name) {
    if(!name || name == "")
    {
      return;
    }
    if(Object.values(Array.from(players.values())).includes(name)) // BUGG: Kontrollen verkar inte fungera.
    {
      return;
    }
    players.get(socket.handshake.session.team).teamName = name;
    socket.handshake.session.save();
    io.emit('UpdatePlayers',  Array.from(players.values()));
  });

  socket.on('disconnect', function(){
    console.log(socket.id + ' disconnected');
    players.get(socket.handshake.session.team).active = false;
  });

  // TODO: Replace teamName with session.teamName...
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
      status.winningTeam = socket.handshake.session.team;
      status.winningId = socket.id;
      io.emit('Buzzed', {id : status.winningTeam, teamName: teamName});
    }
  });

  socket.on('PingResponse', function(pingResponse) {
    console.log(
      socket.handshake.session.team.toString().padStart(6, " ") + "  " + socket.id + " " +
      (new Date().getTime() - pingResponse.pingTime).toString().padStart(4, " ") + " " + pingResponse.teamName
    );
    players.get(socket.handshake.session.team).teamName = pingResponse.teamName;
    socket.handshake.session.teamName = pingResponse.teamName;
  });

  // Quizmaster functions below.
  socket.on('ResetBuzz', function() {
    status.isBuzzed = false;
    status.isBuzzActive = true;
    status.winningTeamName = null;
    status.winningTeam = null;
    console.log(players);
    io.emit('ResetBuzz', null);
  });

  socket.on('AwardPoints', function() {
    if(status.winningTeam)
    {
      console.log("Awarding points");
      players.get(status.winningTeam).score += 1;
    }
    else {
      console.log("No winning team");
    }
    console.log(Array.from(players.values()));
    io.emit('UpdatePlayers',  Array.from(players.values()));
  })

  socket.on('StartPing', function() {
    console.log('Ping Request from QM.')

    var allConnectedClients = Object.keys(io.sockets.connected);
    //var clients_in_the_room = io.sockets.adapter.rooms[roomId];
    //console.log(allConnectedClients);
    //console.log(Object.keys(io.sockets.connected));
    for (var clientId in allConnectedClients ) {
      var client = io.sockets.connected[allConnectedClients[clientId]];
      //console.log(client);
      //var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
      console.log('client: %s', client.id); //Seeing is believing
      //console.log(client_socket); //Seeing is believing
    }

    console.log('List all players:');
    console.log ('Team #  Id                   Ping TeamName');
    io.emit('Ping', new Date().getTime());
  });

  // Unused for now.
  socket.on('ListPlayers', function() {
    io.emit('UpdatePlayers',  Array.from(players.values()));
    var allConnectedClients = Object.keys(io.sockets.connected);
    //var clients_in_the_room = io.sockets.adapter.rooms[roomId];
    for (var clientId in allConnectedClients ) {
      console.log('client: %s', clientId); //Seeing is believing
      var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
    }
  });
});
