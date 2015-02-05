function initMaster() {
  var socket = io();
  /*

  $('form').submit(function(){
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
  });
  */
  /*
  socket.on('ResetBuzz', function() {
    $('#BuzzButton').addClass('Active');
    $('#BuzzButton').removeClass('won lost');
  })
  */
  socket.on('Buzzed', function(winningTeamName) {
    $('#ChatBox').append($('<div class="list-group-item">').text(
      new Date().toLocaleTimeString('sv-SE') + ' ' +
      'Winning buzz by ' + winningTeamName));

    $('#ResetBuzzButton').addClass('btn-warning');
    $('#ResetBuzzButton').removeClass('btn-success btn-danger');
  })

  $('#ResetBuzzButton').click(function(){
    socket.emit('ResetBuzz');
    $('#ResetBuzzButton').removeClass('btn-warning');

  });

}
