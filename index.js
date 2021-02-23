
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

  var share = require('./js/share.js');

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
var request = require('request');

app.use('/favicon.ico', express.static('images/favicon.png'));

var nextTeamNumber = 1;

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

var data = {
  players: [{
      "id" : 0,
      "team" : 0,
      "score" : 0,
      "active" : false,
      "socketId" : "",
      "teamName" : null,
      "buzzOrder": 0,
      "HasBuzzd": false,
      "isCorrect": null,
      "answer" : null,
      "questionScore" : 0,
      "NumberOfWins": 0,
      "emote" : "",
      "confidenceLevel": 5
  }],
  status: {
    "isBuzzed" : false,
    "isBuzzActive" : false,
    "questionTime": 30,
    "winningTeamName" : null,
    "winningTeam" : null,
    "buzzList" : [],
    quizMasterId: 0,
    question : { // TODO: Defaultfrågan är hårdkodad tills vidare.
      questionNumber: 0,
      questionType : "BUZZ_RUSH",
      questionText: "Vem där?",
      correctAnswer: "",
      questionScore: 10,
      questionTime: 30,
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
  }],
  quizMasterPassword : '4552',
  "questionList": [{
    questionNumber: 0,
    questionType : "BUZZ_RUSH",
    questionText: "Vem där?",
    correctAnswer: "",
    questionScore: 10,
    questionClues : [{
      "clueScore" : 10,
      "clueText" : ""
    }]
  }]
}

data.players.pop();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/quizlist.html');
});

app.get('/quizmaster', function(req, res){
  res.sendFile(__dirname + '/quizmaster.html');
});

// Ovanstående prylar känns onödigt nu när den här tar in alla filer.
app.use(express.static(__dirname + '/', {
    maxage: 0
}));

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
      io.emit('UpdatePlayers', {status: data.status, players: data.players });
    }
    else {
      // We have a session, but no player entry. A state caused by purge.
      console.log("Error restoring session. No entry in Players-object for team "+socket.handshake.session.team);
      player =  {
              "id" : socket.handshake.session.team,
              "team" : socket.handshake.session.team,
              "score" : 0,
              "active" : true,
              "socketId" : socket.id,
              "teamName" : "Team " + socket.handshake.session.teamName != null ? socket.handshake.session.teamName : "Team " + socket.handshake.session.team,
              "NumberOfWins": 0
            };
      data.players.push(player);
    }
  } else {
    // New player
    socket.handshake.session.team = nextTeamNumber++;
    socket.handshake.session.save();
    console.log("New user " + socket.handshake.session.team);
    var emote = share.getEmoteFromConfidenceLevel(0);
    player =  {
            "id" : socket.handshake.session.team,
            "team" : socket.handshake.session.team,
            "score" : 0,
            "active" : true,
            "socketId" : socket.id,
            "teamName" : "Team " + socket.handshake.session.team,
            "HasBuzzd": false,
            "buzzOrder": null,
            "isCorrect": null,
            "answer" : null,  
            "questionScore" : 0,
            "NumberOfWins": 0,
            "emote": emote,
            "confidenceLevel": 0
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
        pendingAnswer: "",
        isQuizMaster: (player.id == data.status.quizMasterId ? true : false),
        answer: null, // TODO: Hur återställer vi "answer" vid reconnect? //getCurrentObject(data.answers, socket.handshake.session.team) ? getCurrentObject(data.answers, socket.handshake.session.team).answer : null,
        confidenceLevel: player.confidenceLevel
    }
  );

  socket.on('new chat message', function(msgJson){
    msgJson.date = new Date();
    io.emit('chat message', msgJson);
    chatHistory.push(msgJson);
  });

  socket.on('Purge', function()
  {
    if(!verifyQM(socket.handshake.session.team, "Purge")) {
      return;
    }
    data.players = data.players.filter( obj => obj.active);
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
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
    socket.handshake.session.teamName = name;
    socket.handshake.session.save();
    io.emit('UpdatePlayers', {status: data.status, players: data.players});
  });

  socket.on('SetConfidenceLevel', function(confidenceLevel)
  {
    var player = getCurrentPlayer(socket.handshake.session.team);
    player.confidenceLevel = confidenceLevel;
    player.emote = share.getEmoteFromConfidenceLevel(confidenceLevel);
    io.emit('UpdatePlayers', {status: data.status, players: data.players});
  });

  socket.on('disconnect', function(){
    console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' disconnected');
//    players.get(socket.handshake.session.team).active = false;
    var player = getCurrentPlayer(socket.handshake.session.team);
    if(player)
    {
      player.active = false;
      io.emit('UpdatePlayers', {status: data.status, players: data.players });
    }
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
  socket.on('MakeMeQuizMaster', function(password) {
    var player = getCurrentPlayer(socket.handshake.session.team);
    console.log(`Player ${player.teamName} wants to be QuizMaster`);
    if(password == data.quizMasterPassword)
    {
      data.status.quizMasterId = socket.handshake.session.team;
      player.teamName = 'QuizMaster';
      socket.handshake.session.teamName = player.teamName;

      io.sockets.connected[socket.id].emit('Welcome',
        {
            id: player.id,
            teamName: player.teamName,
            answer: "",
            pendingAnswer: "",
            isQuizMaster: true,
            confidenceLevel: 0
        }
      );

      io.emit('UpdatePlayers', {status: data.status, players: data.players });
    }
    else {
      console.log("Wrong password: " + password);
    }

  });

  socket.on('Save', function(filename) {
    if(!verifyQM(socket.handshake.session.team, "Save")) { return; }
    if(!filename) {
      filename = 'data';
    }
    let dataToSave = JSON.stringify(data);
    try {
      fs.writeFileSync('saves/'+filename+'.json', dataToSave);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('Load', function(filename)
  {
    if(!verifyQM(socket.handshake.session.team, "Load")) { return; }
    if(!filename) {
      filename = 'data';
    }
    try {
      let dataToLoad = fs.readFileSync('saves/'+filename+'.json', null);
      data = JSON.parse(dataToLoad);
      io.emit('UpdatePlayers', {status: data.status, players: data.players } );
    } catch (error) {
      console.error(error);
    }
  });

  /*
   * Load server side with questions from a file and return the full list to the QM.
   */
  
  socket.on('LoadQuestions', function(filename)
  {
    if(!verifyQM(socket.handshake.session.team, "LoadQuestions")) { return; }
    if(!filename) {
      filename = 'question';
    }
    try {
      let dataToLoad = fs.readFileSync('games/'+filename+'.json', null);
      data.questionList = JSON.parse(dataToLoad);
      console.log("Loaded questions");
      console.log(data.questionList);
//      var player = getCurrentPlayer(socket.handshake.session.team);
//      io.to(player.socketId).emit("ReturnLoadQuestions", data.questionList);
      
      io.sockets.connected[socket.id].emit("ReturnLoadQuestions", data.questionList);

    } catch (error) {
      console.error(error);
    }
  });
  


/******************************************************************************
 * Socket.io code for GAME EVENTS
 ******************************************************************************/

  socket.on('Buzz', function(answer, fn){
    var player = getCurrentPlayer(socket.handshake.session.team);
    teamName = player.teamName;

    if(!data.status.isBuzzActive)
    {
      console.log("Answer from team " + player.teamName + " out of question time.");
      return;
    }

    if(data.status.question.questionType == 'RED_THREAD' || data.status.question.questionType == 'MAJOR_VICTORY' || data.status.question.questionType == 'QUIZ')
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
      
      if (typeof fn === 'function')
      {
        fn(answer);
      }
      else{
        console.log("No callback function in buzz. Hacker?");
      }
      return;
    }
    else if(data.status.question.questionType == 'BUZZ_RUSH')
    {

      if(data.status.buzzList.includes(socket.handshake.session.team))
      {
        console.log('Extra buzz from ' + teamName);
        fn('Extra buzz from ' + teamName);
        return;
      }
      else {
        data.status.buzzList.push(socket.handshake.session.team);
      }

      if(data.status.isBuzzed)
      {
        console.log('Too slow buzz from ' + teamName + '. In queue as #' + (data.status.buzzList.length + 1));
        //io.emit('UpdatePlayers', {status: data.status, players: data.players } );
      }
      else if (!data.status.isBuzzActive) {
        console.log('Random buzz from ' + teamName);
      }
      else if(player.HasBuzzed)
      {
        console.log('Double buzz from '+ teamName +'. Has already buzzed this round.');
        return;
      } else {
        console.log('Buzz from ' + teamName);
        data.status.isBuzzed = true;
        data.status.isBuzzActive = false;
        data.status.winningTeamName = teamName;
        data.status.winningTeam = socket.handshake.session.team;
        data.status.winningId = socket.id;
        player.HasBuzzed = true;

        addOrReplace(data.answers, {
          "id" : socket.handshake.session.team,
          "answer": null,
          "questionScore": data.status.question.questionScore,
          "clueScore": null
        });

        fn("Buzz!");
        io.emit('UpdatePlayers', {status: data.status, players: data.players } );

        //io.emit('Buzzed', {id : data.status.winningTeam, teamName: teamName, status: data.status, players: data.players});
      }
    }
    else {
      console.log("WARN: Buzz with unknown question type.");
      fn("WARN: Buzz with unknown question type.");
    }

  });

  // UPDATE a question without triggering calculation of scores or anything.
  // Or start a NEW question on a clean sheet.
  socket.on('UpdateQuestion', function(action, question) {
    console.log(action);
    console.log(question);
    if(!verifyQM(socket.handshake.session.team, "UpdateQuestion")) {
      return;
    }

    if(question == null)
    {
      console.log("Missing question in call to UpdateQuestion");
      return;
    }

    var clientAction = 'none';

    if(action == 'NEW')
    {
      clientAction = "clear";
      if(question.questionNumber == "" || question.questionNumber == "0")
      {
        console.log("Old value");
        console.log(data.status.question.questionNumber);
        console.log(data.status.question.questionNumber + 1);
        question.questionNumber = (parseInt(data.status.question.questionNumber) + 1);
      }

      resetPlayers(false);
    }
    else if(question.questionNumber == "" || question.questionNumber == "0")
    {
        // Se till att behålla frågenummer även om vi uppdaterar frågan med blankt.
      question.questionNumber = data.status.question.questionNumber
    }


    if(data.status.question.questionType == "BUZZ_RUSH")
    {
      data.status.isBuzzed = false;
      data.status.isBuzzActive = true;
      data.status.winningTeamName = null;
      data.status.winningTeam = null;
      data.status.buzzList = [];  // TODO: poppa buzz list, eller hur skall den här fungera egentligen?
      //io.emit('ResetBuzz', {status: data.status});
    }
    else
    {
      data.status.isBuzzActive = true;
    }

    data.status.question = question;

    data.status.questionTime = question.questionTime;
    if(data.status.questionTime && data.status.questionTime != 0)
    {
      // Start the countdown again
      data.status.questionTime = question.questionTime;
    }
    //io.emit('QuestionUpdated', data.status.question);

    // Sort player array according to score.
    data.players.sort(function (a, b) {
      if (a.score > b.score) {
          return -1;
      }
      if (b.score > a.score) {
          return 1;
      }
      return 0;
  });
    io.emit('UpdatePlayers', {status: data.status, players: data.players, action: clientAction });

  });

  // If we have our own start countdwn function, this will be it.
  socket.on("StartCountdown", function(noOfSeconds)
  {
    data.status.questionTime = noOfSeconds;
    io.emit('UpdatePlayers', {status: data.status, players: data.players });

    io.emit("Countdown", { "state": "started", "noOfSeconds": noOfSeconds });
    //setTimeout(updateCountdown, 1000, noOfSeconds);
  });


  socket.on('CompleteQuestion', function(playerList) {
    if(!verifyQM(socket.handshake.session.team, "CompleteQuestion")) { return; }

    completeQuestion();

  });

  socket.on("AutoCorrect", function(correctAnswer)  {
    if(!verifyQM(socket.handshake.session.team, "AutoCorrect")) { return; }
    // Autocorrect only works on public answers at the moment. User "Avsluta fråga" först.

    if(data.status.question.questionType == "RED_THREAD" || data.status.question.questionType == "QUIZ")
    {
      console.log("AutoCorrecting with answer: " + correctAnswer);
      if(correctAnswer == null) {return; }

      data.players.forEach(player => {

        var currentScore = parseInt(player.questionScore ? player.questionScore : data.status.question.questionScore);

        if(player.answer && share.cleanString(player.answer) == share.cleanString(correctAnswer)) {
          if(!player.isCorrect)
          {
            player.score += currentScore; // TODO: Remove this score calculation. It should be done at a later stage instead. 
          }
          player.isCorrect = true;
        } 
        else
        {
          if(player.isCorrect)
          {
            player.score -= currentScore; // TODO: Remove this score calculation. It should be done at a later stage instead. 
          }
          player.isCorrect = false;
        }
      });
    }
    else if(data.status.question.questionType == "MAJOR_VICTORY")
    {
      console.log("AutoCorrecting for  majority rules");

      // Count the number of each similar answer.
      // Check what palayers answered the most common answer, which can be two different answers if they get the same count
      // Give out points.
      
      var answers = [];
      var maxNumberOfAnswers = 0;

      data.answers.forEach(answer => {
        console.log("Investigating: " + answer.answer);
        if(answer.answer == undefined || answer.answer == null || answer.answer == "")
        {
          console.log("No valid answer found");
        }
        else
        {

          console.log("CurrentAnswer = " + currentAnswer );
          var currentAnswer = getCurrentObject(answers, share.cleanString(answer.answer));  

          if(!currentAnswer && currentAnswer == undefined)
          {
            answers.push({
              "id": share.cleanString(answer.answer),
              "count": 1,
              "playerIds": [ answer.id ]
            });
            if(maxNumberOfAnswers == 0)
            {
              maxNumberOfAnswers = 1;
            }
          }
          else {
            currentAnswer.count++;
            currentAnswer.playerIds.push(answer.id);

            if(maxNumberOfAnswers < currentAnswer.count)
            {
              maxNumberOfAnswers = currentAnswer.count;
            }
          }
        }
      });

      console.log(answers);

      answers.forEach(answer => {
        console.log(answer.count);
        if(answer.count == maxNumberOfAnswers)
        {
          console.log("Players answering with answer " + answer.id);
        }
        
        answer.playerIds.forEach(playerId => {
          

          var player = getCurrentPlayer(playerId);
          var currentScore = parseInt(player.questionScore ? player.questionScore : data.status.question.questionScore);

          if(answer.count == maxNumberOfAnswers) {
            if(!player.isCorrect)
            {
              player.score += currentScore; // TODO: Remove this score calculation. It should be done at a later stage instead. 
            }
            player.isCorrect = true;
          } 
          else
          {
            if(player.isCorrect)
            {
              player.score -= currentScore; // TODO: Remove this score calculation. It should be done at a later stage instead. 
            }
            player.isCorrect = false;
          }
        });
      });
    }
    
    data.status.question.correctAnswer = correctAnswer;
    io.emit('UpdatePlayers', {status: data.status, players: data.players, action: "ShowCorrectAnswer"  });
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
    if(!verifyQM(socket.handshake.session.team, "AwardPoints")) {
      return;
    }

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

  socket.on('AwardPointsToTeam', function(score, teamId, isCorectAnswer) {
    if(!verifyQM(socket.handshake.session.team, "AwardPointsToTeam")) { return; }

    var player = getCurrentPlayer(teamId);

    // if we are to update correctness, make it a toggle.  If false, just update the score directly.


    if(player != undefined)
    {
      if(!player.score)
      {
        player.score = 0;
      }

      if(isCorectAnswer)
      {
        player.isCorrect = !player.isCorrect;
        if(!player.isCorrect)
        {
          score = -parseInt(score);
        }
      }


      player.score += parseInt(score);


    }
    else {
      console.log("No player with id = " + teamId);
    }
    io.emit('UpdatePlayers', { status: data.status, players: data.players });
  });

  socket.on('NewGame', function() {
    if(!verifyQM(socket.handshake.session.team, "NewGame")) { return; }
    resetPlayers(true);

    // Sort player array according to score.
    data.players.sort(function (a, b) {
      if (a.NumberOfWins > b.NumberOfWins) {
          return -1;
      }
      if (b.NumberOfWins > a.NumberOfWins) {
          return 1;
      }
      return 0;
    });

    io.emit('UpdatePlayers', { status: data.status, players: data.players, action: 'clear' });
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

function resetPlayers(endTheGame) {
  data.status.isBuzzed = false;
  data.status.questionTime = "";
  data.status.isBuzzActive = true;
  data.status.winningTeamName = null;
  data.status.winningTeam = null;
  data.status.buzzList = [];

  // Clear any previously entered answers.
  data.status.pendingAnswers = [{}];
  data.answers = [{}];

  var winningScore;
  if(endTheGame)
  {
    winningScore = Math.max.apply(Math, data.players.map(function(o) { return o.score; }))
  }


  data.players.forEach(player => {
    player.buzzOrde = 0,
    player.isCorrect = null,
    player.answer = null,
    player.HasBuzzed = false,
    player.confidenceLevel = 0,
    //player.emote = 0),
    player.emote = share.getEmoteFromConfidenceLevel(endTheGame && player.score == winningScore ? 100 : 0),
    player.confidenceLevel = 0;
    player.questionScore = 0,
    player.NumberOfWins += (endTheGame && player.score == winningScore ? 1 : 0), // Om vi avslutar spelet får winnaren en pinne i totalen.
    player.score = (endTheGame ? 0 : player.score) // Om vi avslutar spelet, nolla allas poäng.

  });

}

// Infinit loop to keep track of countdowns.
setInterval(updateCountdown, 1000);


function startCountdown(noOfSeconds) {
  data.status.questionTime = noOfSeconds;
}

function updateCountdown() {
  if(!data.status.isBuzzActive)
  {
    // If the countdown isn't active anymore for wahtever reason, do nothing.   
    return;
  }

  if(data.status.questionTime === "")
  {
    return;
  }

  if(data.status.questionTime <= 0)
  {
    console.log("Countdown stoped");
    io.emit("Countdown", { "state": "ended", "noOfSeconds": 0 });
    completeQuestion();
  }
  else
  {
    console.log("Countdown to " + data.status.questionTime);

    io.emit("Countdown", { "state": "countdown", "noOfSeconds": data.status.questionTime });
    --data.status.questionTime;
    io.emit('UpdatePlayers', {status: data.status, players: data.players });
  }
}

function completeQuestion() {
  console.log("Avslutar frågan.");
  data.status.isBuzzActive = false;

  data.players.forEach(player => {
    // TODO: Aslo check if the answer was correct.
    if(data.answers != null)
    {
      var answer = getCurrentObject(data.answers, player.team);
      if(answer == null || answer == undefined) {
        return;
      }
      player.answer = answer.answer;
    }
    //player.score += answer.questionScore;
    //player.questionScore = 0;
  });

  data.status.questionTimeActive = false;

  io.emit('UpdatePlayers', {status: data.status, players: data.players });
}