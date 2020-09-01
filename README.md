# Quiz
Quiz-support sytem with buzzers using websockets.

Requires node.js. Download and install.

Run
npm install express
npm install socket.io
npm install request
npm install gm

The server will now listen to port 3000.

Visit localhost:3000/ to get to the player view
Visit localhost:3000/quizmaster.html to get to the admin interface

Visit localhost:3000/mapgame.html to get to the map game mode.


TODO:
=====
* Add modal for name prompt if no name has been entered for the session.
* Add answering list in order to let players queue up answers.
* Add button for rejecting an answer and preventing the player from buzzing again this round.


* New game modes!
* "Röda tråden"-style. Start on 5 points and get clues all the way down to 1 point.
   May shose to change answer, but last edited point level is the final score.
   Everyone types in their answers on their phones hidden from each others.

* Majority Wins. Everyone types in their answers they think most others also have
  answered. Points to all players with the most same answer.

* Majority fails. Everyone types in a hopefully unique item from a list of items.
  Ie. A car beginning with A. Everyone who have typed in a unique car model gets a point.


* New public score board and question display.
  This one is supposed to be streamed online or just let everyone have surf to the page
  directly. To be used in tandem with the phone.
