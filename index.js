var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var status =
  {
    isBuzzed : false,
    isBuzzActive : false,
    winningTeamName : null
  };
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

// Ovanstående prylar känns onödigt nu när den här tar in alla filer.
app.use(express.static(__dirname + '/'));


io.on('connection', function(socket){
  console.log('a user connected');
  console.log(socket.id);

  socket.on('chat message', function(msgJson){
    io.emit('chat message', msgJson);
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
