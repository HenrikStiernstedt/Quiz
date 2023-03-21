


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

app.disable('x-powered-by');

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

/*
 * Add trailing spaces if missing.
 */
app.use((req, res, next) => {
  if (req.path.slice(-1) === '/' && req.path.length > 1) {
    const query = req.url.slice(req.path.length)
    const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
    res.redirect(301, safepath + query)
  } else {
    next()
  }
})


io.engine.use(sessionMiddleware);

var gameList = require('./js/gameListBackend.js');

//require('js/game.js');
//console.log(gameList);


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

server.listen(port, function(){
  console.log('listening on *:' + port);
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
gameList.data.games.push(
  {
      "id": game.id, 
      "game": game.data,
  }
);

//console.log(game);

//game.data.players.pop();

//var data = game.data;

//var rooms = [];

app.get('/room/:room', function(req, res){
  //upsert(rooms, req.params.room);
  //rooms.push(req.params.room);
  console.log("room: " + req.params.room);

  console.log(gameList.data.games);
  res.sendFile(__dirname + '/quizlist.html');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/gamelist.html');
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
  var newGame = new Game.game(room, io, '4552');
  games.push(newGame);
  gameList.data.games.push(
    {
        "id": newGame.id, 
        "game": newGame.data,
    }
  );

  io.of("game-list").emit("UpdateGameList", gameList.data.games);

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
