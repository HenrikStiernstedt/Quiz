
var vm = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    players: [{
        "id" : 0,
        "team" : 0,
        "score" : 0,
        "active" : false,
        "socketId" : "",
        "teamName" : null
    }],
    status: {
      "isBuzzed" : false,
      "isBuzzActive" : true,
      "winningTeamName" : null,
      "winningTeam" : null,
      "buzzList" : []
    }
  }
});

function getStatusUpdate()
{
  var status = null;
  status = $.ajax({
    dataType: "json",
    url: '/status',
    data: null,
    success: function(serverStatus) {
      console.log(serverStatus.players);
      vm.status = (serverStatus.status);
      handleStatusUpdate(serverStatus.status);
      vm.players = (serverStatus.players);
      updatePlayers(serverStatus.players);
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

function initQuizlist() {
  var socket = io();


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

  socket.on('ResetBuzz', function() {
    resetBuzzButton();
    lastWinner = null;
    $('#table').bootstrapTable('refreshOptions', {});
  })

  socket.on('Buzzed', function(response)
  {
    if(response.id != null)
    {
      buzzed(response.teamName);
      lastWinner = response.id;
    }
    updatePlayers(response.players);
    $('#table').bootstrapTable('refreshOptions', {});

  })

  $('#BuzzButton').click(function(){
    socket.emit('Buzz', $('#TeamName').val());
  });

  socket.on('Ping', function(pingTime) {
    var teamName = $('#TeamName').val();
    console.log("Pinged!");
    socket.emit('PingResponse',
      {
          pingTime: pingTime,
          teamName: teamName
      });
  });

  socket.on('UpdatePlayers', function(status)
  {
    console.log("Players:");
    console.log(status.players);

    vm.players = status.players;
    updatePlayers(status.players);

  });

  socket.on('ScorePoint', function(scoreInfo)
  {
    //getTeamTableRow(scoreInfo.team).addClass('table-success');
    console.log(scoreInfo);
    if(scoreInfo.scoreValue > 0)
    {
      getTeamTableRow(scoreInfo.team).find('td:nth-child(2)').html(getTeamTableRow(scoreInfo.team).find('td:nth-child(2)').html() + ' <i class="fas fa-trophy"></i>');
    }
    else {
      //getTeamTableRow(scoreInfo.team).find('td:nth-child(2)').html(getTeamTableRow(scoreInfo.team).find('td:nth-child(2)').html() + ' <i class="far fa-angry"></i>');
      // Om man vill använda inbyggda funktioner i bootstrapTable istället kan man göra enligt nedanstående.
      var teamName = _players.filter( obj => obj.id === scoreInfo.team)[0].teamName;
      $("#table").bootstrapTable('updateCellByUniqueId', {id: scoreInfo.teamId, field: 'teamName', value: teamName + ' <i class="far fa-angry"></i>'});
    }
  });

  getStatusUpdate();
  getChatHistory();

}
