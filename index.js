var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var isBuzzed = false;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/quiz.html');
});

app.get('/quizmaster', function(req, res){
  res.sendFile(__dirname + '/quizmaster.html');
});

// Ovanstående prylar känns onödigt nu när den här tar in alla filer.
app.use(express.static(__dirname + '/'));


io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('chat message', function(msgJson){
    io.emit('chat message', msgJson);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('Buzz', function(teamName){
    if(isBuzzed)
    {
      console.log('Too slow buzz from ' + teamName);
    } else {
      console.log('Buzz from ' + teamName);
      isBuzzed = true;
      io.emit('Buzzed', teamName);
    }
  });

  // Quizmaster functions below.
  socket.on('ResetBuzz', function() {
    isBuzzed = false;
    io.emit('ResetBuzz', null);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
