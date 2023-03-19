

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
            "teamName": ""
        }
    },
    methods:
    {
        createGame: function (game) {
            console.log("Uppdaterar Skapar spel '"+game+"'");
            socket.emit('AddGame', game);
        },
        gotoRoom: function (gameId) {
            console.log(gameId);
            location.href='room/'+gameId;
        }
    },
});

//var socket = io('/game-list');
var socket = io();


function initGameList()
{
    console.log("Init gamelist!");
    getStatusUpdate();

    socket.on('UpdateGameList', function(games){
        console.log("UpdateGameList: ");
        console.log(games.games);
        vm.games = games.games;
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