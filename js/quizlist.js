
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
      "isBuzzActive" : true,
      "winningTeamName" : null,
      "winningTeam" : null,
      "buzzList" : [0],
      question : {
        questionType : "",
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
      "teamName" : "Henrik Hård",
      "answer" : "",
      "pendingAnswer": ""
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

function givePoints(score, team)
{
  console.log(score + " points to " + team);
  socket.emit('AwardPointsToTeam', score, team);
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
    vm.status.question = question;
  });

  socket.on('ResetBuzz', function() {
    resetBuzzButton();
    lastWinner = null;
    $('#table').bootstrapTable('refreshOptions', {});
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

  $('#BuzzButton').click(function(){
    socket.emit('Buzz', vm.player.pendingAnswer);
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

  $('#UpdateQuestion').click(function(){
    console.log("Uppdaterar frågan!");
    console.log(vm.quizMaster.pendingQuestion);
    socket.emit('setQuestion', vm.quizMaster.pendingQuestion);
  });


  getStatusUpdate();
  getChatHistory();

}
