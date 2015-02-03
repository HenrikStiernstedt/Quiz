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
    $('#ResetBuzzButton').addClass('Active');
    $('#messages').append($('<li>').text('Winning buzz by ' + winningTeamName));

  })

  $('#ResetBuzzButton').click(function(){
    socket.emit('ResetBuzz');
    $('#ResetBuzzButton').removeClass('Active');

  });

}
