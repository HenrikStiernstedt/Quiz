var buzzAudioElement = document.createElement('audio');

function loadSounds() {

  buzzAudioElement.setAttribute('src', 'buzzer.mp3');
  //audioElement.setAttribute('autoplay', 'autoplay');
  //audioElement.load()
  /*
  $.get();
  audioElement.addEventListener("load", function() {
  audioElement.play();
  }, true);
  */
  $('.play').click(function() {
  buzzAudioElement.play();
  });

/*
  $('.pause').click(function() {
  audioElement.pause();
  });
  */
}


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
  socket.on('Buzzed', function(winningTeam) {
    $('#ChatBox').append($('<div class="list-group-item">').text(
      new Date().toLocaleTimeString('sv-SE') + ' ' +
      'Winning buzz by ' + winningTeam.teamName));

    $('#ResetBuzzButton').addClass('btn-warning');
    $('#ResetBuzzButton').removeClass('btn-success btn-danger');

    buzzAudioElement.play();

  })

  $('#ResetBuzzButton').click(function(){
    socket.emit('ResetBuzz');
    $('#ResetBuzzButton').removeClass('btn-warning');

  });

  $('#PingButton').click(function(){
    socket.emit('StartPing');
  });

  $('#CorrectButton').click(function(){
    socket.emit('AwardPoints', 1);
  });

  $('#IncorrectButton').click(function(){
    socket.emit('AwardPoints', 0);
  });

  $('#UpdateButton').click(function(){
    socket.emit('ListPlayers');
  });

  loadSounds();
}
