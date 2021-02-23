

var vm = new Vue({
  el: '#app',
  data: {
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
        "confidenceLevel": 0
    }],
    status: {
      "isBuzzed" : false,
      "isBuzzActive" : false,
      "questionTime": 30,
      "winningTeamName" : null,
      "winningTeam" : null,
      "buzzList" : [0],
      quizMasterId: 0,
      question : {
        questionNumber: 0,
        questionType : "BUZZ_RUSH",
        questionText: "",
        correctAnswer: "",
        questionScore: 0,
        questionTime: 30,
        questionClues : [{
          "clueScore" : 0,
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
    player:
    {
      "id" : 0,
      "teamName" : "",
      "answer" : "",
      "pendingAnswer": "",
      "submittedAnswer": "",
      "isQuizMaster": false,
      "quizMasterPassword": "",
      "confidenceLevel": 0
    },
    quizMaster :
    {
      "pendingQuestion" : {
        "questionNumber": 0,
        "questionType" : "BUZZ_RUSH",
        "questionText": "",
        "correctAnswer": "",
        "questionScore": 2,
        "questionTime": 30,
        "questionClues" : [{
          "clueScore" : 0,
          "clueText" : ""
        }]
      },
      "savegame": "game",
      "loadQuestions": "2020",
      "QuestionListNumber": 0,
      "questionList": [{
        "questionNumber": 0,
        "questionType" : "BUZZ_RUSH",
        "questionText": "",
        "correctAnswer": "",
        "questionScore": 2,
        "questionTime": "",
        "questionClues" : [{
          "clueScore" : 0,
          "clueText" : ""
        }]
      }]
    },
    environment :
    {
      maxConfidence: 2,
      minConfidence: -3
    }
  },
  methods: {
    say: function (message) {
      alert(message)
    },
    updateName : function() {
      console.log("New name sent");
      socket.emit('SetName', vm.player.teamName);
      $('#playerSettingsModal').modal('hide');
    },

    SetConfidenceLevel : function(confidenceLevel) {
      console.log("SetConfidenceLevel: " + confidenceLevel);
      vm.player.confidenceLevel = confidenceLevel;
      socket.emit('SetConfidenceLevel', confidenceLevel);
    },

    MakeMeQuizMaster : function() {
      socket.emit('MakeMeQuizMaster', vm.player.quizMasterPassword);
      $('#QMSettingsModal').modal('hide');
    },
    purge : function() {
      if(confirm("Är du säker?"))
      {
        console.log("Purge initiated.");
        socket.emit('Purge');
      }
    },
    givePoints : givePoints,

    updateQuestion: function () {
      console.log("Uppdaterar frågan!");
      console.log(vm.quizMaster.pendingQuestion);
      socket.emit('UpdateQuestion', 'UPDATE', vm.quizMaster.pendingQuestion);
    },
    lowerQuestionScore: function() {
      console.log("Uppdaterar frågan. Sänker poängen");
      vm.quizMaster.pendingQuestion.questionScore -= 1;
    },
    completeQuestion: function () {
      console.log("Avslutar frågan!");
      console.log(vm.quizMaster.pendingQuestion);
      socket.emit('CompleteQuestion', vm.quizMaster.pendingQuestion);
    },
    autoCorrect: function() {
      console.log("Autocorrecting with answer: " + vm.quizMaster.pendingQuestion.correctAnswer);
      socket.emit("AutoCorrect", vm.quizMaster.pendingQuestion.correctAnswer);
    },
    loadNextQuestion: function() {
      if(vm.quizMaster.QuestionListNumber < vm.quizMaster.questionList.length)
      {
        console.log("Hämtar nästa fråga: " + vm.quizMaster.QuestionListNumber);
        vm.quizMaster.pendingQuestion = vm.quizMaster.questionList[vm.quizMaster.QuestionListNumber];
        vm.quizMaster.QuestionListNumber++;
      }
      else
      {
        console.log("Slut på frågor att hämta.");
      }
    },
    newQuestion: function () {
      console.log("Ny fråga!");
      console.log(vm.quizMaster.pendingQuestion);
      socket.emit('UpdateQuestion', 'NEW', vm.quizMaster.pendingQuestion);
      popAudioElement.play();
    },
    loadQuestions: function() {
      console.log("Ladda ny Quiz!");
      socket.emit("LoadQuestions", vm.quizMaster.loadQuestions);
    },

    newGame: function() {
      if(confirm("Är du säker?"))
      {
        console.log("Ny omgång!");
        socket.emit('NewGame');
        popAudioElement.play();
      }
    },
    saveGame: function() {
      socket.emit("Save", vm.quizMaster.savegame);
      console.log("Game saved with name " + vm.quizMaster.savegame + " at " + new Date().toLocaleDateString('se-SV', {hour: '2-digit', minute: '2-digit'}));
    },
    loadGame: function() {
      if(confirm("Är du säker på att du vill ladda in sparat spel?"))
      {
        socket.emit("Load", vm.quizMaster.savegame);
      }
    },
    buzz: function () {
      if(vm.status.question.questionType != "BUZZ_RUSH" && !vm.player.pendingAnswer)
      {
        return;
      }
      socket.emit('Buzz', vm.player.pendingAnswer, function (answer)
        {
          console.log("You answered " + answer);
          // vm.player.submittedAnswer = answer;

        });
      vm.player.submittedAnswer = vm.player.pendingAnswer;
      vm.player.pendingAnswer = "";
      /*
      if(vm.status.question.questionType == "BUZZ_RUSH")
      {
        buzzAudioElement.play();
      }
      */
    },
    getCurrentPlayer: function(array, id) {
      return array.filter( obj => obj.team == id)[0];
    }
  }
});




/*
  // För att ersätta ett player-objekt med ett annat.
  Vue.set(vm.players, 1, ({ });
*/
function getStatusUpdate()
{
  var status = null;
  status = $.ajax({
    dataType: "json",
    url: '/status',
    data: null,
    success: function(serverStatus) {
      vm.status = (serverStatus.status);
      vm.players = (serverStatus.players);

      // Trying to get team name restored after a reload.
      //vm.player.teamName = status.nameRequired.name;
    }
  });
}

function getChatHistory()
{
  $.ajax({
    dataType: "json",
    url: '/chatHistory',
    data: null,
    success: function(history) {
      handleChatHistory(history)
    }
  });
}

function handleChatHistory(history)
{
  for(var i = history.length-1; i>=0; i--) {
    var value = history[i];
    $('#ChatBox').append($('<div class="list-group-item">').text(
      new Date(value.date).toLocaleTimeString('sv-SE') + ' ' +
      value.name + ': ' +
      value.text
    ));
  }
}

function getThisPlayer() {
  return vm.players.filter( obj => obj.team == vm.player.id)[0];
}

var socket = io();

function givePoints(score, team, isCorrectAnswer)
{
  console.log(score + " points to " + team + '. ' + isCorrectAnswer ? 'Answer is markes as corect' : '');
  if(score == NaN)
  {
    score = 0;
  }
  socket.emit('AwardPointsToTeam', parseInt(score), team, isCorrectAnswer);
}

var buzzAudioElement = document.createElement('audio');
var popAudioElement = document.createElement('audio');

function loadSounds() {
  buzzAudioElement.setAttribute('src', 'buzzer.mp3');
  $('.play').click(function() {
    buzzAudioElement.play();
  });
  popAudioElement.setAttribute('src', 'pop.mp4');
  $('.play').click(function() {
    popAudioElement.play();
  });
}

function initQuizlist() {

  /*
   //DEBUG-method that will come n a future version of socket.io
  socket.onAny((eventName, ...args) => {
    console.log("CALL: " + eventName);
  });
  */

  socket.on('chat message', function(msgJson){
    //$('#messages').append($('<li>').text(msg));

    var newChatRow = $('<div class="list-group-item" style="display:none">').text(
      new Date(msgJson.date).toLocaleTimeString('sv-SE') + ' ' +
      msgJson.name + ': ' +
      msgJson.text
    );

    newChatRow.insertAfter($('#ChatHeader'));
    newChatRow.show('slow');
  });

  socket.on('QuestionUpdated', function(question) {
    console.log("Incomming updated question");
    console.log(question);
    vm.status.question = question;
  });

  socket.on('ReturnLoadQuestions', function(questionList) {
    console.log("Nya frågor inlästa!");
    console.log(questionList);
    vm.quizMaster.QuestionListNumber = 0;
    vm.quizMaster.questionList = questionList;
  });

  socket.on('ResetBuzz', function(status) {
    //resetBuzzButton();
    vm.status = status;
  });

  socket.on('Buzzed', function(response)
  {
    if(response.id != null)
    {
      buzzed(response.teamName);
      lastWinner = response.id;
    }
    //updatePlayers(response.players);
    vm.players = response.players;
    vm.status = response.status;

  });

  socket.on('Ping', function(pingTime) {
    console.log("Pinged!");
    socket.emit('PingResponse',
      {
          pingTime: pingTime,
          teamName: vm.player.teamName
      });
  });

  socket.on("Welcome", function(player) {
    console.log("Welcomed!");
    console.log(player);
    vm.player = player;
  });

  socket.on('UpdatePlayers', function(statusHolder)
  {
  //  console.log("status:");
  //  console.log(statusHolder.status);

    vm.players = statusHolder.players;
    vm.status = statusHolder.status;

    if(statusHolder.action == 'clear')
    {
      vm.player.submittedAnswer = "";
    }
    if(statusHolder.action == "ShowCorrectAnswer")
    {
      $('.flip-card-inner').toggleClass('flipped');
    }

    // Update this player
    var p = getThisPlayer();
    vm.player.confidenceLevel = p?.confidenceLevel || 0;
    
  });

  $('form').submit(function(){
    socket.emit('new chat message',
    {
      date : null, // Let the server set the time.
      name : $('#TeamName').val(),
      text : $('#m').val()
    });
    $('#m').val('');
    return false;
  });

  socket.on('chat message', function(msgJson){
    //$('#messages').append($('<li>').text(msg));


    var newChatRow = $('<div class="list-group-item" style="display:none">').text(
      new Date(msgJson.date).toLocaleTimeString('sv-SE') + ' ' +
      msgJson.name + ': ' +
      msgJson.text
    );

    newChatRow.insertAfter($('#ChatHeader'));
    newChatRow.show('slow');
  });

  getStatusUpdate();
  getChatHistory();
  loadSounds();


}
