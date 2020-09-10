

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
        "isCorrect": null,
        "answer" : null,
        "questionScore" : 0
    }],
    status: {
      "isBuzzed" : false,
      "isBuzzActive" : false,
      "winningTeamName" : null,
      "winningTeam" : null,
      "buzzList" : [0],
      quizMasterId: 0,
      question : {
        questionType : "BUZZ_RUSH",
        questionText: "",
        questionScore: 0,
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
      "isQuizMaster": false,
      "quizMasterPassword": ""
    },
    quizMaster :
    {
      pendingQuestion : {
        questionType : "",
        questionText: "",
        questionScore: 0,
        questionClues : [{
          "clueScore" : 0,
          "clueText" : ""
        }]
      }
    }
  },
  methods: {
    say: function (message) {
      alert(message)
    },
    updateQuestion: function () {
      console.log("Uppdaterar frågan!");
      console.log(vm.quizMaster.pendingQuestion);
      socket.emit('UpdateQuestion', 'UPDATE', vm.quizMaster.pendingQuestion);
    },
    completeQuestion: function () {
      console.log("Avslutar frågan!");
      console.log(vm.quizMaster.pendingQuestion);
      socket.emit('CompleteQuestion', vm.quizMaster.pendingQuestion);
    },
    newQuestion: function () {
      console.log("Ny fråga!");
      console.log(vm.quizMaster.pendingQuestion);
      socket.emit('UpdateQuestion', 'NEW', vm.quizMaster.pendingQuestion);
    },
    buzz: function () {
      socket.emit('Buzz', vm.player.pendingAnswer);
      vm.player.pendingAnswer = "";
      /*
      if(vm.status.question.questionType == "BUZZ_RUSH")
      {
        buzzAudioElement.play();
      }
      */
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

function loadSounds() {
  buzzAudioElement.setAttribute('src', 'buzzer.mp3');
  $('.play').click(function() {
  buzzAudioElement.play();
  });
}

function initQuizlist() {

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

  $('#RenameButton').click(function(){
    console.log("New name sent");
    socket.emit('SetName', vm.player.teamName);
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
    console.log("Players:");
    console.log(statusHolder.players);

    vm.players = statusHolder.players;
    vm.status = statusHolder.status;
  });



  $('#MakeMeQuizMaster').click(function(){
    socket.emit('MakeMeQuizMaster', vm.player.quizMasterPassword);
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
