
/*
 * This calss holds one array with all current games. It is instansiated once for a server, serving multiple games. 
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
 
 module.exports.gameList = function(io_master) {

    io = io_master.of('/game-list');
    io.on('connection', socket => {
        console.log('someone connected');
        socket.join('/game-list');
        console.log(new Date().toLocaleTimeString() + ' ' + socket.id + ' connected. Team: ' + socket.request.session.team);

    });

    socket.on('new chat message', function(msgJson){
        msgJson.date = new Date();
        io.to('/game-list').emit('chat message', msgJson);
        //chatHistory.push(msgJson);
    });

    return this;

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
