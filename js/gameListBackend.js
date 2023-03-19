
/*
 * This calss holds one aray with all current games. It is instansiated once for a server, serving multiple games. 
 * It does not have any vue stuff. 
 */


var data = 
{
    "status": {
        "header" : "Välkommen",
        "message": null,
    },
    "games": [
        
    ],
 };
 //var io;

 module.exports = {
    "data": data
    //io = options;
 }
/*
 io.on('connection', function(socket){
    console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' connected to game list. Team: ' + socket.handshake.session.team);

    
    // Skapa nytt spel och pusha till listan.
    socket.on('NewGame', function(game){
        data.games.push(game);
        io.emit('UpdateGameList', data.games);
      });

});
*/
