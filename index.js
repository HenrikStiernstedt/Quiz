


var
  express = require('express'),
  app = express(),
  server  = require("http").createServer(app),
  io = require("socket.io")(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: true
  }),
  sessionMiddleware = require("express-session")({
    secret: "my-secret123",
    resave: false,
    saveUninitialized: true
  });
  sharedsession = require("express-socket.io-session");

  var share = require('./js/share.js');

const fs = require('fs');

// Attach session
app.use(sessionMiddleware);
/*
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
*/
// Share session with io sockets
/*
io.use(sharedsession(session, {
    autoSave:true
}));
*/

io.engine.use(sessionMiddleware);

var gameList = require('./js/gameListBackend.js');

//require('js/game.js');
//console.log(gameList);


server.listen(3000, function(){
  console.log('listening on *:3000');
});
var request = require('request');

app.use('/favicon.ico', express.static('images/favicon.png'));


/******************************************************************************
 * Data structures
 ******************************************************************************/
var chatHistory =
[
  {
    date : new Date(),
    name : 'Server',
    text : 'Server started.'
  }
];


var games = []; 
var Game = require('./js/game.js'); 

games.push(new Game.game('ABCD', io, '4552'));

var game = games[0];

//gameList.data.games.push(game); // TODO: Red ut röran av game och gamelist.
gameList.data.games.push({"name": game.data.id});

//console.log(game);

//game.data.players.pop();

var data = game.data;

//var rooms = [];

app.get('/room/:room', function(req, res){
  //upsert(rooms, req.params.room);
  //rooms.push(req.params.room);
  console.log("room: " + req.params.room);

  console.log(gameList.data.games);
  res.sendFile(__dirname + '/quizlist.html');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/quizmaster', function(req, res){
  res.sendFile(__dirname + '/quizmaster.html');
});

// Ovanstående prylar känns onödigt nu när den här tar in alla filer.
app.use(express.static(__dirname + '/', {
    maxage: 0
}));

// Specialare för AJAX och annat som inte behöver pushas ut.
app.get('/room/:room/status', function(req, res){
  console.log("room: " + req.params.room);
  console.log(games);
  room = req.params.room;
  console.log(getCurrentObject(games, room));
  res.json(
    {
      question : getCurrentObject(games, room).data.status.question,
      status: getCurrentObject(games, room).data.status,
      players: getCurrentObject(games, room).data.players,
      nameRequired: {
        id: req.session.team,
        name: req.session.teamName
      }
    }
  );
});

// Specialare för AJAX och annat som inte behöver pushas ut.
app.get('/room/:room/create', function(req, res){
  console.log("room: " + req.params.room);
  console.log(games);
  room = req.params.room;
  //console.log(getCurrentObject(games, room));
  games.push(new Game.game(room, io, '4552'));
  res.json(
    {
      question : getCurrentObject(games, room).data.status.question,
      status: getCurrentObject(games, room).data.status,
      players: getCurrentObject(games, room).data.players,
      nameRequired: {
        id: req.session.team,
        name: req.session.teamName
      }
    }
  );
});


// AJAX-endpoint för spellistan.
// Ny endpoint för en ny generell välkomstsida med framtida rumsväljare. Kommer att kräva en helt ny sida (index.html) och sessionshantering.
app.get('/game-list', function(req, res){
  res.json(
    {
      gameList: gameList.data,
      nameRequired: {
        id: req.session.team,
        name: req.session.teamName
      }
    }
  );
});

app.get('/room/:room/chatHistory', function(req, res){
  res.json(chatHistory);
});

/********************************************************************************************
 * Helper functions
 ********************************************************************************************/
function getCurrentPlayer(teamId)
{
   return data.players.filter( obj => obj.team == teamId)[0];
}

function verifyQM(teamId, action) {
  if(data.status.quizMasterId == teamId) {
    return true;
  }
  console.log("WARN: Unauthorized attempt to " + action + " from " + teamId);
  return false;

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

/******************************************************************************
 * Socket.io code for ADMINISTRATIVE EVENTS
 ******************************************************************************/

io.on('connection', function(socket){
  


});
