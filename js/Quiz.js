function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}

function getTeamTableRow(teamId)
{
  return $('.table tr td:first-child:contains("'+teamId+'")').parent();
}

function resetBuzzButton()
{
  $('#BuzzButton').addClass('btn-warning');
  $('#BuzzButton').removeClass('btn-success btn-danger');
  $('#TimeBar').addClass('active');
}
function buzzed(winningTeamName) {
  $('#BuzzButton').removeClass('btn-warning');
  $('#TimeBar').removeClass('active');
  if(winningTeamName == $('#TeamName').val()) {
    $('#BuzzButton').addClass('btn-success');
  } else {
    $('#BuzzButton').addClass('btn-danger');
  }
}

function getStatusUpdate()
{
  var status = null;
  status = $.ajax({
    dataType: "json",
    url: '/status',
    data: null,
    success: function(status) {
      handleStatusUpdate(status.status);
      updatePlayers(status.players);
      if(!status.nameRequired.name)
      {
        showNamePrompt();
      }

    }
  });
}

function showNamePrompt()
{
  $('#myModal').on('shown.bs.modal', function () {
    $('#myInput').trigger('focus')
  });
}


function updatePlayers(players)
{
  $('#table').bootstrapTable("destroy");
  $('#table').bootstrapTable({
    columns: [{
      field: 'id',
      title: '#',
      sortable: true
    },{
      field: 'teamName',
      title: 'Team',
      sortable: true,
      'data-cell-style': "cellStyle"
    }, {
      field: 'active',
      title: 'Active'
    }, {
      field: 'score',
      title: 'Score',
      sortable: true
    }],
    data: players
  });

  
}

var lastWinner = null;

function rowStyle(row, index) {
  if(row.id == lastWinner)
  {
    return {
      classes: 'text-nowrap lastWinner',
      css: {"background-color": "yellow" }
    };
  }
  else
  {
    return {
      classes: 'text-nowrap normal',
      css: {}
    };
  }
}

function handleStatusUpdate(status) {
  if(status.isBuzzed)
  {
    buzzed(status.winningTeamName);
    return 1;
  }
  else if (status.isBuzzActive)
  {
    resetBuzzButton();
    return 2;
  }
  return 0;
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

function init() {
  var socket = io();

  $('#SaveNameButton').click(function(){
    var newName = $('#TeamName').val();
    console.log("New name: "+ newName);
    if(newName)
    {
      setCookie('name', newName);
      socket.emit('SetName', newName);

    }
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
