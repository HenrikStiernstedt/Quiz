

/*
 Okay, jag har ingen aning om hur jag gör det här egentligen. 

 Jag vill ha följande.

 En klass kallad QuizGame som håller state och funktioner för ett quiz-spel.
 Den skall kunna använda hjälpfunktioner från andra moduler.
 Den skall kunna använda egna privata metoder (som skulle kunna få vara publika om de måste.)


*/

//'use strict';

const share = require('./share.js');
const fs = require('fs');

class Game {
  /*
  id;
  io;
  nextTeamNumber = 0;
  
  
  fs = require('fs');
  */

  /*
   module.exports = {
      "data": data
  } 
  */

  constructor(id, io_master, quizMasterPassword) {
    //this.data = data;
    //data.players.pop();
    this.data = {
      players: [{
        "id": 0,
        "team": 0,
        "score": 0,
        "active": false,
        "socketId": "",
        "teamName": null,
        "buzzOrder": 0,
        "HasBuzzd": false,
        "isCorrect": null,
        "answer": null,
        "questionScore": 0,
        "NumberOfWins": 0,
        "emote": "",
        "confidenceLevel": 5
      }],
      status: {
        "isBuzzed": false,
        "isBuzzActive": false,
        "questionTime": 30,
        "winningTeamName": null,
        "winningTeam": null,
        "buzzList": [],
        "gameSettings": {
          "reversedScoring": false
        },
        quizMasterId: null,
        question: { // TODO: Defaultfrågan är hårdkodad tills vidare.
          questionNumber: 0,
          questionType: "WELCOME",
          questionText: "",
          correctAnswer: "",
          questionScore: 10,
          //questionTime: "",
          questionClues: [{
            "clueScore": 10,
            "clueText": ""
          }]
        },
        pendingAnswers: [{
          "id": 0,
          "answer": "",
          "questionScore": 0,
          "clueScore": 0
        }]
      },
      answers: [{
        "id": 0,
        "answer": "",
        "questionScore": 0,
        "clueScore": 0
      }],
      quizMasterPassword: '4552',
      "questionList": [{
        questionNumber: 0,
        questionType: "BUZZ_RUSH",
        questionText: "Vem där?",
        correctAnswer: "",
        questionScore: 10,
        questionClues: [{
          "clueScore": 10,
          "clueText": ""
        }]
      }]
    };

    this.data.players.pop();
    this.data.quizMasterPassword = quizMasterPassword;
    this.nextTeamNumber = 0;

    this.id = id;
    console.log("Skapar game-objekt med id: " + id);

    //var data = this.data; // Todo: Orkar inte skriva "this" överallt...

    //io = io_base.of('/'+id);

    this.io = io_master.of('/' + id);

    //this.socket = this.io;

    
    // Infinit loop to keep track of countdowns.
    setInterval(this.updateCountdown.bind(this), 1000);

    this.io.on('connection', socket => {
      console.log('someone connected');
      socket.join('/' + id);



      console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' connected. Team: ' + socket.request.session.team);
      if (socket.request.session.team) {
        console.log('Returning user ' + socket.request.session.team);
        var player = this.getCurrentPlayer(socket.request.session.team);
        if (player != undefined) {
          player.active = true;
          player.socketId = socket.id;
          player.teamName = socket.request.session.teamName != null ? socket.request.session.teamName : "Team " + socket.request.session.team;
          //      player.score = 0;
          socket.request.session.save();
          this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
        }
        else {
          // We have a session, but no player entry. A state caused by purge.
          console.log("Error restoring session. No entry in Players-object for team " + socket.request.session.team);
          player = {
            "id": socket.request.session.team,
            "team": socket.request.session.team,
            "score": 0,
            "active": true,
            "socketId": socket.id,
            "teamName": "Team " + socket.request.session.teamName != null ? socket.request.session.teamName : "Team " + socket.request.session.team,
            "NumberOfWins": 0
          };
          this.data.players.push(player);
        }
      } else {
        // New player
        socket.request.session.team = this.nextTeamNumber++;
        socket.request.session.save();
        console.log("New user " + socket.request.session.team);
        var emote = share.getEmoteFromConfidenceLevel(0);
        player = {
          "id": socket.request.session.team,
          "team": socket.request.session.team,
          "score": 0,
          "active": true,
          "socketId": socket.id,
          "teamName": "Team " + socket.request.session.team,
          "HasBuzzd": false,
          "buzzOrder": null,
          "isCorrect": null,
          "answer": null,
          "questionScore": 0,
          "NumberOfWins": 0,
          "emote": emote,
          "confidenceLevel": 0
        };
        this.data.players.push(player);

        //io.sockets.connected[socket.id].emit('Ping',  new Date().getTime());
        this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
      }

      this.io.to(socket.id).emit('Welcome',
        {
          id: player.id,
          teamName: player.teamName,
          answer: "",
          pendingAnswer: "",
          isQuizMaster: (player.id == this.data.status.quizMasterId ? true : false),
          answer: null, // TODO: Hur återställer vi "answer" vid reconnect? //getCurrentObject(this.data.answers, socket.request.session.team) ? getCurrentObject(this.data.answers, socket.request.session.team).answer : null,
          confidenceLevel: player.confidenceLevel
        }
      );
    

    socket.on('new chat message', (msgJson) => {
      msgJson.date = new Date();
      this.io.emit('chat message', msgJson);
      chatHistory.push(msgJson);
    });

    socket.on('Purge', function () {
      if (!this.verifyQM(socket.request.session.team, "Purge")) {
        return;
      }
      this.data.players = this.data.players.filter(obj => obj.active);
      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
    });

    socket.on('SetName', (name) => {
      if (!name || name == "") {
        return;
      }
      /*
      if(Object.values(Array.from(players.values())).includes(name)) // BUGG: Kontrollen verkar inte fungera.
      {
        return;
      }
      */
      var player = this.getCurrentPlayer(socket.request.session.team);
      player.teamName = name;
      //players.get(socket.request.session.team).teamName = name;
      socket.request.session.teamName = name;
      socket.request.session.save();
      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
    });
/*
    socket.on('SetConfidenceLevel', (confidenceLevel) => {
      var player = this.getCurrentPlayer(socket.request.session.team);
      player.confidenceLevel = confidenceLevel;
      player.emote = share.getEmoteFromConfidenceLevel(confidenceLevel);
      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
    });
    */
    socket.on('SetConfidenceLevel', (confidenceLevel) => {
      var player = this.getCurrentPlayer(socket.request.session.team);
      player.confidenceLevel = confidenceLevel;
      player.emote = share.getEmoteFromConfidenceLevel(confidenceLevel);
      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
    });
/*
    socket.on('disconnect', function () {
      console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' disconnected');

      console.log(this.data.players);

      //    players.get(socket.request.session.team).active = false;
      var player = this.getCurrentPlayer(socket.request.session.team);
      if (player) {
        player.active = false;
        this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
      }
    });
*/
    socket.on('disconnect', () => {
      console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' disconnected');
      
      console.log(this.data.players);
      
      // players.get(socket.request.session.team).active = false;
      var player = this.getCurrentPlayer(socket.request.session.team);
      if (player) {
        player.active = false;
        this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
      }
    });

    socket.on('StartPing', function () {
      console.log('Ping Request from QM.')

      var allConnectedClients = Object.keys(io.sockets.connected);
      //var clients_in_the_room = this.io.sockets.adapter.rooms[roomId];
      //console.log(allConnectedClients);
      //console.log(Object.keys(io.sockets.connected));
      for (var clientId in allConnectedClients) {
        var client = this.io.sockets.connected[allConnectedClients[clientId]];
        //console.log(client);
        //var client_socket = this.io.sockets.connected[clientId];//Do whatever you want with this
        console.log('client: %s', client.id); //Seeing is believing
        //console.log(client_socket); //Seeing is believing
      }

      console.log('List all players:');
      console.log('Team #  Id                   Ping TeamName');
      this.io.emit('Ping', new Date().getTime());

      let dataToSave = JSON.stringify(this.data);
      fs.writeFileSync('data.json', dataToSave);
    });

    socket.on('PingResponse', (pingResponse) => {
      console.log(
        socket.request.session.team.toString().padStart(6, " ") + "  " + socket.id + " " +
        (new Date().getTime() - pingResponse.pingTime).toString().padStart(4, " ") + " " + pingResponse.teamName
      );
      //players.get(socket.request.session.team).teamName = pingResponse.teamName;
      //socket.request.session.teamName = pingResponse.teamName;
      var player = this.getCurrentPlayer(socket.request.session.team);
      player.teamName = pingResponse.teamName;
      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
    });

    // Quizmaster functions below.
    socket.on('MakeMeQuizMaster', (password) => {
      var player = this.getCurrentPlayer(socket.request.session.team);
      console.log(`Player ${player.teamName} wants to be QuizMaster`);
      if (password == this.data.quizMasterPassword) {
        this.data.status.quizMasterId = socket.request.session.team;
        player.teamName = 'QuizMaster';
        socket.request.session.teamName = player.teamName;

        this.io.to(player.socketId).emit('Welcome', // TODO: Skickaar nu til alla, inte bara current user.
          {
            id: player.id,
            teamName: player.teamName,
            answer: "",
            pendingAnswer: "",
            isQuizMaster: true,
            confidenceLevel: 0
          }
        );

        this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
      }
      else {
        console.log("Wrong password: " + password);
      }

    });

    socket.on('Save', (filename) => {
      if (!this.verifyQM(socket.request.session.team, "Save")) { return; }
      if (!filename) {
        filename = 'data';
      }
      let dataToSave = JSON.stringify(this.data);
      try {
        fs.writeFileSync('saves/' + filename + '.json', dataToSave);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('Load', (filename) => {
      if (!this.verifyQM(socket.request.session.team, "Load")) { return; }
      if (!filename) {
        filename = 'data';
      }
      try {
        let dataToLoad = fs.readFileSync('saves/' + filename + '.json', null);
        this.data = JSON.parse(dataToLoad);
        this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
      } catch (error) {
        console.error(error);
      }
    });

    /*
    * Load server side with questions from a file and return the full list to the QM.
    */

    socket.on('LoadQuestions',  (filename) => {
      if (!this.verifyQM(socket.request.session.team, "LoadQuestions")) { return; }
      if (!filename) {
        filename = 'question';
      }
      try {
        let dataToLoad = fs.readFileSync('games/' + filename + '.json', null);
        this.data.questionList = JSON.parse(dataToLoad);
        console.log("Loaded questions");
        console.log(this.data.questionList);
        var player = this.getCurrentPlayer(socket.request.session.team);
        this.io.to(player.socketId).emit("ReturnLoadQuestions", this.data.questionList);

      } catch (error) {
        console.error(error);
      }
    });

    // TODO: Verify this with game rooms.
    socket.on('SaveQuestions', ({ questionList, filename }) => {
      if (!this.verifyQM(socket.request.session.team, "SaveQuestions")) { return; }
      if (!filename) {
        filename = 'question';
      }
      let dataToSave = JSON.stringify(questionList, null, '\t');

      try {
        fs.writeFileSync('games/' + filename + '.json', dataToSave);

        this.data.questionList = questionList;
        this.io.to(player.socketId).emit("ReturnLoadQuestions", this.data.questionList);

      } catch (error) {
        console.error(error);
      }
    });

    /*
    * Update general game settings, not specific to any individual question. 
    */
    socket.on('UpdateGameSettings', (gameSettings) => {
      if (!this.verifyQM(socket.request.session.team, "LoadQuestions")) { return; }
      console.log("Update gamesettings:");
      console.log(gameSettings);

      this.data.status.gameSettings = gameSettings;

      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });

    });


    /******************************************************************************
    * socket.io code for GAME EVENTS
    ******************************************************************************/

    socket.on('Buzz', (answer, fn) => {
      var player = this.getCurrentPlayer(socket.request.session.team);
      var teamName = player.teamName;

      if (!this.data.status.isBuzzActive) {
        console.log("Answer from team " + player.teamName + " out of question time.");
        return;
      }

      if (this.data.status.question.questionType == 'RED_THREAD' || this.data.status.question.questionType == 'MAJOR_VICTORY' || this.data.status.question.questionType == 'QUIZ') {
        addOrReplace(this.data.answers, {
          "id": socket.request.session.team,
          "answer": answer,
          "questionScore": this.data.status.question.questionScore,
          "clueScore": null
        });

        var player = this.getCurrentPlayer(socket.request.session.team);
        player.questionScore = this.data.status.question.questionScore;

        this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });

        console.log(this.data.status);

        if (typeof fn === 'function') {
          fn(answer);
        }
        else {
          console.log("No callback function in buzz. Hacker?");
        }
        return;
      }
      else if (this.data.status.question.questionType == 'BUZZ_RUSH') {

        if (this.data.status.buzzList.includes(socket.request.session.team)) {
          console.log('Extra buzz from ' + teamName);
          fn('Extra buzz from ' + teamName);
          return;
        }
        else {
          this.data.status.buzzList.push(socket.request.session.team);
        }

        if (this.data.status.isBuzzed) {
          console.log('Too slow buzz from ' + teamName + '. In queue as #' + (this.data.status.buzzList.length + 1));
          //io.emit('UpdatePlayers', {status: this.data.status, players: this.data.players } );
        }
        else if (!this.data.status.isBuzzActive) {
          console.log('Random buzz from ' + teamName);
        }
        else if (player.HasBuzzed) {
          console.log('Double buzz from ' + teamName + '. Has already buzzed this round.');
          return;
        } else {
          console.log('Buzz from ' + teamName);
          this.data.status.isBuzzed = true;
          this.data.status.isBuzzActive = false;
          this.data.status.winningTeamName = teamName;
          this.data.status.winningTeam = socket.request.session.team;
          this.data.status.winningId = socket.id;
          player.HasBuzzed = true;

          addOrReplace(this.data.answers, {
            "id": socket.request.session.team,
            "answer": null,
            "questionScore": this.data.status.question.questionScore,
            "clueScore": null
          });

          fn("Buzz!");
         this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });

          //io.emit('Buzzed', {id : this.data.status.winningTeam, teamName: teamName, status: this.data.status, players: this.data.players});
        }
      }
      else {
        console.log("WARN: Buzz with unknown question type.");
        fn("WARN: Buzz with unknown question type.");
      }

    });

    // UPDATE a question without triggering calculation of scores or anything.
    // Or start a NEW question on a clean sheet.
    socket.on('UpdateQuestion', (action, question) => {
      console.log(action);
      console.log(question);
      if (!this.verifyQM(socket.request.session.team, "UpdateQuestion")) {
        return;
      }

      if (question == null) {
        console.log("Missing question in call to UpdateQuestion");
        return;
      }

      var clientAction = 'none';

      if (action == 'NEW') {
        clientAction = "clear";
        if (question.questionNumber == "" || question.questionNumber == "0") {
          console.log("Old value");
          console.log(this.data.status.question.questionNumber);
          console.log(this.data.status.question.questionNumber + 1);
          question.questionNumber = (parseInt(this.data.status.question.questionNumber) + 1);
        }

        this.resetPlayers(false);
      }
      else if (question.questionNumber == "" || question.questionNumber == "0") {
        // Se till att behålla frågenummer även om vi uppdaterar frågan med blankt.
        question.questionNumber = this.data.status.question.questionNumber
      }


      if (this.data.status.question.questionType == "BUZZ_RUSH") {
        this.data.status.isBuzzed = false;
        this.data.status.isBuzzActive = true;
        this.data.status.winningTeamName = null;
        this.data.status.winningTeam = null;
        this.data.status.buzzList = [];  // TODO: poppa buzz list, eller hur skall den här fungera egentligen?
        //io.emit('ResetBuzz', {status: this.data.status});
      }
      else {
        this.data.status.isBuzzActive = true;
      }

      this.data.status.question = question;

      this.data.status.questionTime = question.questionTime;
      if (this.data.status.questionTime && this.data.status.questionTime != 0) {
        // Start the countdown again
        this.data.status.questionTime = question.questionTime;
      }
      //io.emit('QuestionUpdated', this.data.status.question);

      if (this.data.status.gameSettings.reversedScoring) {
        // Sort player array according to reversed score, lower is better
        this.data.players.sort(function (a, b) {
          if (a.score > b.score) {
            return 1;
          }
          if (b.score > a.score) {
            return -1;
          }
          return 0;
        });
      }
      else {
        // Sort player array according to score.
        this.data.players.sort(function (a, b) {
          if (a.score > b.score) {
            return -1;
          }
          if (b.score > a.score) {
            return 1;
          }
          return 0;
        });
      }
     this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players, action: clientAction });

    });

    // If we have our own start countdwn function, this will be it.
    socket.on("StartCountdown", (noOfSeconds) => {
      this.data.status.questionTime = noOfSeconds;
     this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });

     this.io.emit("Countdown", { "state": "started", "noOfSeconds": noOfSeconds });
      //setTimeout(updateCountdown, 1000, noOfSeconds);
    });


    socket.on('CompleteQuestion', (playerList) => {
      if (!this.verifyQM(socket.request.session.team, "CompleteQuestion")) { return; }

      this.completeQuestion();

    });

    socket.on("AutoCorrect", (correctAnswer) => {
      if (!this.verifyQM(socket.request.session.team, "AutoCorrect")) { return; }
      // Autocorrect only works on public answers at the moment. Use "Avsluta fråga" först.

      if (this.data.status.question.answerType === "0-100") {
        // In 0-100, you get points based on how far from the answer you guessed.
        // Exact answer gives a bonus of 10.
        // No answer will be treated as the answer 0 and scored accordingly. 
        // This answerType is not compatible with all question types.

        this.data.players.forEach(player => {

          var currentScore = this.data.status.question.questionScore;
          var answerInt = parseInt(player.answer, 10);
          if (isNaN(answerInt) || answerInt < 0) {
            answerInt = 0;
          }
          if (answerInt > 100) {
            answerInt = 100;
          }

          var answerDiff = Math.abs(parseInt(correctAnswer) - answerInt);
          if (answerDiff == 0) {
            answerDiff -= 10;

          }

          player.questionScore = answerDiff;

          if (!player.isCorrect) {
            player.score += answerDiff;
            player.isCorrect = true;
          }
          else {
            player.score -= answerDiff;
            player.isCorrect = false;
          }


        });



      }
      else if (this.data.status.question.questionType == "RED_THREAD" || this.data.status.question.questionType == "QUIZ") {
        // This is the standard where you get points if you answered correctly. 
        // In case of RED_THREAD, you get the number of points of your last used clue.
        console.log("AutoCorrecting with answer: " + correctAnswer);
        if (correctAnswer == null) { return; }

        this.data.players.forEach(player => {

          var currentScore = parseInt(player.questionScore ? player.questionScore : this.data.status.question.questionScore);

          if (player.answer && share.cleanString(player.answer) === share.cleanString(correctAnswer)) {
            if (!player.isCorrect) {
              player.score += currentScore; // TODO: Remove this score calculation. It should be done at a later stage instead. 
            }
            player.isCorrect = true;
          }
          else {
            if (player.isCorrect) {
              player.score -= currentScore; // TODO: Remove this score calculation. It should be done at a later stage instead. 
            }
            player.isCorrect = false;
          }
        });
      }
      else if (this.data.status.question.questionType == "MAJOR_VICTORY") {
        console.log("AutoCorrecting for  majority rules");

        // Count the number of each similar answer.
        // Check what palayers answered the most common answer, which can be two different answers if they get the same count
        // Give out points.

        var answers = [];
        var maxNumberOfAnswers = 0;

        this.data.answers.forEach(answer => {
          console.log("Investigating: " + answer.answer);
          if (answer.answer == undefined || answer.answer == null || answer.answer == "") {
            console.log("No valid answer found");
          }
          else {

            console.log("CurrentAnswer = " + currentAnswer);
            var currentAnswer = getCurrentObject(answers, share.cleanString(answer.answer));

            if (!currentAnswer && currentAnswer == undefined) {
              answers.push({
                "id": share.cleanString(answer.answer),
                "count": 1,
                "playerIds": [answer.id]
              });
              if (maxNumberOfAnswers == 0) {
                maxNumberOfAnswers = 1;
              }
            }
            else {
              currentAnswer.count++;
              currentAnswer.playerIds.push(answer.id);

              if (maxNumberOfAnswers < currentAnswer.count) {
                maxNumberOfAnswers = currentAnswer.count;
              }
            }
          }
        });

        console.log(answers);

        answers.forEach(answer => {
          console.log(answer.count);
          if (answer.count == maxNumberOfAnswers) {
            console.log("Players answering with answer " + answer.id);
          }

          answer.playerIds.forEach(playerId => {


            var player = this.getCurrentPlayer(playerId);
            var currentScore = parseInt(player.questionScore ? player.questionScore : this.data.status.question.questionScore);

            if (answer.count == maxNumberOfAnswers) {
              if (!player.isCorrect) {
                player.score += currentScore; // TODO: Remove this score calculation. It should be done at a later stage instead. 
              }
              player.isCorrect = true;
            }
            else {
              if (player.isCorrect) {
                player.score -= currentScore; // TODO: Remove this score calculation. It should be done at a later stage instead. 
              }
              player.isCorrect = false;
            }
          });
        });
      }

      this.data.status.question.correctAnswer = correctAnswer;
     this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players, action: "ShowCorrectAnswer" });
    });

    socket.on('ResetBuzz', function () {
      this.data.status.isBuzzed = false;
      this.data.status.isBuzzActive = true;
      this.data.status.winningTeamName = null;
      this.data.status.winningTeam = null;
      this.data.status.buzzList = [];
      console.log(this.data.players);
      this.io.emit('ResetBuzz', null);
    });

    // If scoreValue > 0, count as a win.
    // If scoreValue <= 0, cont as a fail and proceede to next player in queue.
    socket.on('AwardPoints', (scoreValue) => {
      if (!this.verifyQM(socket.request.session.team, "AwardPoints")) {
        return;
      }

      if (this.data.status.winningTeam) {
        console.log("Awarding points: " + scoreValue);
        this.getCurrentPlayer(this.data.status.winningTeam).score += scoreValue;
        //players.get(status.winningTeam).score += scoreValue;
        if (scoreValue <= 0) {
          this.data.status.buzzOrder++;
        }
      }
      else {
        console.log("No winning team");
      }
      console.log(this.data.players);
      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
      this.io.emit('ScorePoint', { team: this.data.status.winningTeam, scoreValue: scoreValue });
    });

    socket.on('AwardPointsToTeam', (score, teamId, isCorectAnswer) => {
      if (!this.verifyQM(socket.request.session.team, "AwardPointsToTeam")) { return; }

      var player = this.getCurrentPlayer(teamId);

      // if we are to update correctness, make it a toggle.  If false, just update the score directly.


      if (player != undefined) {
        if (!player.score) {
          player.score = 0;
        }

        if (isCorectAnswer) {
          player.isCorrect = !player.isCorrect;
          if (!player.isCorrect) {
            score = -parseInt(score);
          }
        }


        player.score += parseInt(score);


      }
      else {
        console.log("No player with id = " + teamId);
      }
      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
    });

    socket.on('NewGame', () => {
      if (!this.verifyQM(socket.request.session.team, "NewGame")) { return; }
      resetPlayers(true);

      // Sort player array according to number of wins.
      this.data.players.sort(function (a, b) {
        if (a.NumberOfWins > b.NumberOfWins) {
          return -1;
        }
        if (b.NumberOfWins > a.NumberOfWins) {
          return 1;
        }
        return 0;
      });

      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players, action: 'clear' });
    });

    // Unused for now.
    socket.on('ListPlayers', function () {
      this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
      var allConnectedClients = Object.keys(io.sockets.connected);
      //var clients_in_the_room = this.io.sockets.adapter.rooms[roomId];
      for (var clientId in allConnectedClients) {
        console.log('client: %s', clientId); //Seeing is believing
        var client_socket = this.io.sockets.connected[clientId];//Do whatever you want with this
      }
    });

    /*
    * Skapa nytt spel och pusha till listan.
    * Ej fungerande.
    */
    socket.on('AddGame', (game) => {
      gameList.data.games.push({ "room": game, "active": true })
      games.push(new Game.game(game));
      this.io.emit('UpdateGameList', { "games": gameList.data.games });
    });


  });
    //return this;
  }

  /********************************************************************************************
  * Helper functions
  ********************************************************************************************/

  getCurrentPlayer(teamId) {
    return this.data.players.filter(obj => obj.team == teamId)[0];
  }

  verifyQM(teamId, action) {
    if (this.data.status.quizMasterId == teamId) {
      return true;
    }
    console.log("WARN: Unauthorized attempt to " + action + " from " + teamId);
    return false;
  }

  resetPlayers(endTheGame) {
    this.data.status.isBuzzed = false;
    this.data.status.questionTime = "";
    this.data.status.isBuzzActive = true;
    this.data.status.winningTeamName = null;
    this.data.status.winningTeam = null;
    this.data.status.buzzList = [];
  
    // Clear any previously entered answers.
    this.data.status.pendingAnswers = [{}];
    this.data.answers = [{}];
  
    var winningScore;
    if (endTheGame) {
      if (this.data.status.gameSettings.reversedScoring) {
        winningScore = Math.min.apply(Math, this.data.players.map(function (o) { return o.score; }))
      }
      else {
        winningScore = Math.max.apply(Math, this.data.players.map(function (o) { return o.score; }))
      }
    }
  
  
    this.data.players.forEach(player => {
      player.buzzOrde = 0,
        player.isCorrect = null,
        player.answer = null,
        player.HasBuzzed = false,
        //player.emote = 0),
        player.emote = share.getEmoteFromConfidenceLevel(endTheGame && player.score == winningScore ? 100 : player.confidenceLevel),
        player.confidenceLevel = 0;
        player.questionScore = 0,
        player.NumberOfWins += (endTheGame && player.score == winningScore ? 1 : 0), // Om vi avslutar spelet får winnaren en pinne i totalen.
        player.score = (endTheGame ? 0 : player.score) // Om vi avslutar spelet, nolla allas poäng.
  
    });
  
  }

  completeQuestion() {
    console.log("Avslutar frågan.");
    this.data.status.isBuzzActive = false;
  
    this.data.players.forEach(player => {
      // TODO: Aslo check if the answer was correct.
      if (this.data.answers != null) {
        var answer = getCurrentObject(this.data.answers, player.team);
        if (answer == null || answer == undefined) {
          return;
        }
        player.answer = answer.answer;
      }
      //player.score += answer.questionScore;
      //player.questionScore = 0;
    });
  
    this.data.status.questionTimeActive = false;
  
    this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
  }

startCountdown(noOfSeconds) {
  this.data.status.questionTime = noOfSeconds;
}

updateCountdown() {
  var data = this.data
  if(data == undefined)
  {
    return;
  }

  if (!data.status.isBuzzActive) {
    // If the countdown isn't active anymore for wahtever reason, do nothing.   
    return;
  }

  if (data.status.questionTime === "" || data.status.questionTime == NaN || data.status.questionTime == undefined) {
    return;
  }

  if (this.data.status.questionTime <= 0) {
    console.log("Countdown stoped");
    this.io.emit("Countdown", { "state": "ended", "noOfSeconds": 0 });
    this.completeQuestion();
  }
  else {
    console.log("Countdown to " + this.data.status.questionTime);

    this.io.emit("Countdown", { "state": "countdown", "noOfSeconds": this.data.status.questionTime });
    --this.data.status.questionTime;
    this.io.emit('UpdatePlayers', { status: this.data.status, players: this.data.players });
  }
}


}
//module.exports.game = game;

/********************************************************************************************
* Helper functions
********************************************************************************************/
/*
function getCurrentPlayer(teamId)
{
 return this.data.players.filter( obj => obj.team == teamId)[0];
}
*/


function getCurrentObject(array, id) {
  return array.filter(obj => obj.id == id)[0];
}

function addOrReplace(array, obj) {
  var index = -1;
  array.filter((el, pos) => {
    if (el.id == obj.id)
      delete array[index = pos];
    return true;
  });

  // put in place, or append to list
  if (index == -1)
    array.push(obj);
  else
    array[index] = obj;
}

function upsert(array, item) { // (1)
  const i = array.findIndex(_item => _item.id == item.id);
  if (i > -1) array[i] = item; // (2)
  else array.push(item);
}




module.exports = Game;





