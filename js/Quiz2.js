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
      new Date().toLocaleTimeString('sv-SE') + ' ' +
      $('#TeamName').val() + ': ' + $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
  });
  socket.on('ResetBuzz', function() {
    $('#BuzzButton').addClass('Active');
    $('#BuzzButton').removeClass('won lost');
  })
  socket.on('Buzzed', function(winningTeamName) {
    $('#BuzzButton').removeClass('Active');
    if(winningTeamName == $('#TeamName').val()) {
      $('#BuzzButton').addClass('won');
    } else {
      $('#BuzzButton').addClass('lost');
    }
  })

  $('#BuzzButton').click(function(){
    socket.emit('Buzz', $('#TeamName').val());
  });

}
