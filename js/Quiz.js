function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}

function init() {
  var socket = io();

  $('form').submit(function(){
    socket.emit('chat message',
    {
      date : new Date(),
      name : $('#TeamName').val(),
      text : $('#m').val()
    });
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function(msgJson){
    //$('#messages').append($('<li>').text(msg));
    $('#ChatBox').append($('<div class="list-group-item">').text(
      new Date().toLocaleTimeString('sv-SE') + ' ' +
      msgJson.name + ': ' +
      msgJson.text
    ));

  });

  socket.on('ResetBuzz', function() {
    $('#BuzzButton').addClass('btn-warning');
    $('#BuzzButton').removeClass('btn-success btn-danger');
    $('#TimeBar').addClass('active');
  })
  socket.on('Buzzed', function(winningTeamName) {
    $('#BuzzButton').removeClass('btn-warning');
    $('#TimeBar').removeClass('active');
    if(winningTeamName == $('#TeamName').val()) {
      $('#BuzzButton').addClass('btn-success');
    } else {
      $('#BuzzButton').addClass('btn-danger');
    }
  })

  $('#BuzzButton').click(function(){
    socket.emit('Buzz', $('#TeamName').val());
  });

  socket.on('Ping', function(pingTime) {
    socket.emit('PingResponse', pingTime);
  });
  

}
