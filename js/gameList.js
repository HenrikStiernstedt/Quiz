

var vm = new Vue({
    el: '#app',
    data: {
        "status": {
            "header" : "Välkommen",
            "message": null,
        },
        "games": [{
            "id": "Spelnamn",
            "game": {
                // The complete game object goes here.
                "players": [{"name": "test"}],
                "id": "Spelnamn"
            }
        }],
        "player": {
            "id" : 0,
            "team" : 0,
            "teamName": "",
            "gameName": null,
            "quizMasterPassword": null
        }
    },
    methods:
    {
        createGame: function () {
            console.log(`Skapar spel med namn ${vm.player.gameName}.`);
            //console.log("Skapar spel '"+game+"'");
            //socket.emit('AddGame', game);
            $.get({

            url: `/room/${vm.player.gameName}/create/${vm.player.quizMasterPassword}`,  
            
            }).done(function(data, status) {
                alert("Anropet lyckades: " + data.message);
            }).fail(function(data, status) {
                alert("Anropen misslyckades: " + data.responseJSON.message);
            });

        },
        gotoRoom: function (gameId) {
            console.log(gameId);
            location.href='room/'+gameId;
        }
    },
});



function initGameList()
{
    console.log("Init gamelist!");
    getStatusUpdate();

    var socket = io('/game-list');
    //var socket = io();

    socket.on('UpdateGameList', function(games){
        console.log("UpdateGameList: ");
        console.log(games);
        vm.games = games;
    });

}

function getStatusUpdate()
{
  var status = null;
  status = $.ajax({
    dataType: "json",
    url: 'game-list',
    data: null,
    success: function(serverStatus) {
        console.log(serverStatus);
        vm.status = (serverStatus.gameList.status);
        vm.games = (serverStatus.gameList.games);
        vm.nameRequired = (serverStatus.gameList.nameRequired);

      // Trying to get team name restored after a reload.
      //vm.player.teamName = status.nameRequired.name;
    }
  });
}