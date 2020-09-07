
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

const fs = require('fs');

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

var nextTeamNumber = 1;

//var players = new Map();

var chatHistory =
[
  {
    date : new Date(),
    name : 'Server',
    text : 'Server started.'
  }
];

var data = {
  players: [{
      "id" : 0,
      "team" : 0,
      "score" : 0,
      "active" : false,
      "socketId" : "",
      "teamName" : null,
      "buzzOrder": 0,
      "isCorrect": null,
      "answer" : null,
      "questionScore" : 0
  }],
  status: {
    "isBuzzed" : false,
    "isBuzzActive" : true,
    "winningTeamName" : null,
    "winningTeam" : null,
    "buzzList" : [],
    question : {
      questionType : "RED_THREAD",
      questionText: "Vem där?",
      correctAnswer: "",
      questionScore: 10,
      questionClues : [{
        "clueScore" : 10,
        "clueText" : ""
      }]
    },
    pendingAnswers: [{
      "id" : 0,
      "answer": "",
      "questionScore": 0,
      "clueScore": 0
    }]
  },
  answers: [{
    "id" : 0,
    "answer": "",
    "questionScore": 0,
    "clueScore": 0
  }]
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/quiz.html');
});

app.get('/quizmaster', function(req, res){
  res.sendFile(__dirname + '/quizmaster.html');
});

// Ovanstående prylar känns onödigt nu när den här tar in alla filer.
app.use(express.static(__dirname + '/'));

// Specialare för AJAX och annat som inte behöver pushas ut.
app.get('/status', function(req, res){
  res.json(
    {
      question : data.status.question,
      status: data.status,
      players: data.players,
      nameRequired: {
        id: req.session.team,
        name: req.session.teamName
      }
    }
  );
});

app.get('/chatHistory', function(req, res){
  res.json(chatHistory);
});

// Helper functions
function getCurrentPlayer(teamId)
{
   return data.players.filter( obj => obj.team == teamId)[0];
}

function getCurrentObject(array, id) {
  return array.filter( obj => obj.id == id)[0];
}

function addOrReplace(array, obj) {
  var index = -1;
  array.filter((el, pos) => {
    if( el.id == obj.id )
      delete array[index = pos];
    return true;
  });

  // put in place, or append to list
  if( index == -1 )
    array.push(obj);
  else
    array[index] = obj;
}

function upsert(array, item) { // (1)
  const i = array.findIndex(_item => _item.id == item.id);
  if (i > -1) array[i] = item; // (2)
  else array.push(item);
}

// Socket.io code for events
io.on('connection', function(socket){
  console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' connected. Team: ' + socket.handshake.session.team);
  if (socket.handshake.session.team) {
    console.log('Returning user ' + socket.handshake.session.team);
    //var player = data.players.filter( obj => obj.team === socket.handshake.session.team)[0];
    var player = getCurrentPlayer(socket.handshake.session.team);
    if(player != undefined)
    {
      player.active = true;
      player.socketId = socket.id;
      player.teamName = socket.handshake.session.teamName != null ? socket.handshake.session.teamName : "Team " + socket.handshake.session.team;
//      player.score = 0;
      socket.handshake.session.save();
    }
    else {
      console.log("Error restoring session. No entry in Players-object for team "+socket.handshake.session.team);
    }
  } else {
    // New player
    socket.handshake.session.team = nextTeamNumber++;
    socket.handshake.session.save();
    console.log("New user " + socket.handshake.session.team);
    player =  {
            "id" : socket.handshake.session.team,
            "team" : socket.handshake.session.team,
            "score" : 0,
            "active" : true,
            "socketId" : socket.id,
            "teamName" : "Team " + socket.handshake.session.team
          };
    data.players.push(player);

    //io.sockets.connected[socket.id].emit('Ping',  new Date().getTime());
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
  }

  io.sockets.connected[socket.id].emit('Welcome',
    {
        id: player.id,
        teamName: player.teamName,
        answer: "",
        pendingAnswer: ""
    }
  );

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
    /*
    if(Object.values(Array.from(players.values())).includes(name)) // BUGG: Kontrollen verkar inte fungera.
    {
      return;
    }
    */
    var player = getCurrentPlayer(socket.handshake.session.team);
    player.teamName = name;
    //players.get(socket.handshake.session.team).teamName = name;
    socket.handshake.session.save();
    io.emit('UpdatePlayers', {status: data.status, players: data.players});
  });

  socket.on('disconnect', function(){
    console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' disconnected');
//    players.get(socket.handshake.session.team).active = false;
    var player = getCurrentPlayer(socket.handshake.session.team);
    player.active = false;
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
  });

  socket.on('Buzz', function(answer){
    var player = getCurrentPlayer(socket.handshake.session.team);
    teamName = player.teamName;

    if(data.status.question.questionType == 'RED_THREAD')
    {
      addOrReplace(data.answers, {
        "id" : socket.handshake.session.team,
        "answer": answer,
        "questionScore": data.status.question.questionScore,
        "clueScore": null
      });

      var player = getCurrentPlayer(socket.handshake.session.team);
      player.questionScore = data.status.question.questionScore;

      io.emit('UpdatePlayers', {status: data.status, players: data.players } );

      console.log(data.status);
      return;

    }


    if(status.buzzList.includes(socket.handshake.session.team))
    {
      console.log('Extra buzz from ' + teamName);
      return;
    }
    else {
      status.buzzList.push(socket.handshake.session.team);
    }
    if(status.isBuzzed)
    {
      console.log('Too slow buzz from ' + teamName + '. In queue as #' + (status.buzzList.length + 1));
      io.emit('UpdatePlayers', {status: status, players: data.players } );
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

      io.emit('Buzzed', {id : status.winningTeam, teamName: teamName, status: status, players: data.players});
    }
  });

  socket.on('PingResponse', function(pingResponse) {
    console.log(
      socket.handshake.session.team.toString().padStart(6, " ") + "  " + socket.id + " " +
      (new Date().getTime() - pingResponse.pingTime).toString().padStart(4, " ") + " " + pingResponse.teamName
    );
    //players.get(socket.handshake.session.team).teamName = pingResponse.teamName;
    //socket.handshake.session.teamName = pingResponse.teamName;
    var player = getCurrentPlayer(socket.handshake.session.team);
    player.teamName = pingResponse.teamName;
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
  });

  // Quizmaster functions below.

  socket.on('setQuestion', function(question) {
    // TODO: Only open for quiz master.
    console.log(question);
    data.status.question = question;
    /*
    question : {
      questionType : "",
      questionText: "",
      correctAnswer: "",
      questionScore: 0,
      questionClues : [{
        "clueScore" : 0,
        "clueText" : ""
      }]
    }
    */

    //io.emit('QuestionUpdated', data.status.question);
    io.emit('UpdatePlayers', {status: data.status, players: data.players });

  });

  socket.on('CompleteQuestion', function(playerList) {
    data.players.forEach(player => {
      // TODO: Aslo check if the answer was correct.
      var answer = getCurrentObject(data.answers, player.team);
      if(answer == null || answer == undefined) {
        return;
      }
      player.answer = answer.answer;
      player.score += answer.questionScore;
      //player.questionScore = 0;
    });

    io.emit('UpdatePlayers', {status: data.status, players: data.players });

  });

  socket.on('ResetBuzz', function() {
    data.status.isBuzzed = false;
    data.status.isBuzzActive = true;
    data.status.winningTeamName = null;
    data.status.winningTeam = null;
    data.status.buzzList = [];
    console.log(data.players);
    io.emit('ResetBuzz', null);
  });

  // If scoreValue > 0, count as a win.
  // If scoreValue <= 0, cont as a fail and proceede to next player in queue.
  socket.on('AwardPoints', function(scoreValue) {

    if(data.status.winningTeam)
    {
      console.log("Awarding points: " + scoreValue);
      getCurrentPlayer(data.status.winningTeam).score += scoreValue;
      //players.get(status.winningTeam).score += scoreValue;
      if(scoreValue <= 0)
      {
        data.status.buzzOrder++;
      }
    }
    else {
      console.log("No winning team");
    }
    console.log(data.players);
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
    io.emit('ScorePoint', { team: data.status.winningTeam, scoreValue: scoreValue });
  });

  socket.on('AwardPointsToTeam', function(score, teamId) {
    var player = getCurrentPlayer(teamId);
    if(player != undefined)
    {
      player.score += score;
    }
    else {
      console.log("No player with id = " + teamId);
    }
    io.emit('UpdatePlayers', { status: data.status, players: data.players });
  });

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

    let dataToSave = JSON.stringify(data);
    fs.writeFileSync('data.json', dataToSave);
  });

  // Unused for now.
  socket.on('ListPlayers', function() {
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
    var allConnectedClients = Object.keys(io.sockets.connected);
    //var clients_in_the_room = io.sockets.adapter.rooms[roomId];
    for (var clientId in allConnectedClients ) {
      console.log('client: %s', clientId); //Seeing is believing
      var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
    }
  });
});
