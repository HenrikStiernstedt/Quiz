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
Enter the QuizMaster password to enter as Quiz Master to control the game.
The QuizMaster does not see anything the other player sees, so he can join the
quiz. But the quiz master controls all scoring.

Game modes
===========
* "Röda tråden"-style. Start on 5 points and get clues all the way down to 1 point.
   May chose to change answer, but last edited point level is the final score.
   Everyone types in their answers on their phones hidden from each others.

* Majority Wins. Everyone types in their answers they think most others also have
  answered. Points to all players with the most same answer. This mode can also be
  used for classic quiz style questions where correct answers are given points.

* Buzz! Whoever buzzes first is allowed to answer. Points are awarded manually.

TODO:
=====
* Add modal for name prompt if no name has been entered for the session.

* Add answering list in order to let players queue up answers.

* Add button for rejecting an answer and preventing the player from buzzing again this round.

* More game modes!

* Automatic score calculations.

* Majority fails. Everyone types in a hopefully unique item from a list of items.
  Ie. A car beginning with A. Everyone who have typed in a unique car model gets 2 points.
  Failing to enter a car model gives no points. Having the same answer as anyone else gives
  1 point.

* New public score board and question display.
  This one is supposed to be streamed online or just let everyone have surf to the page
  directly. To be used in tandem with the phone. So far you can always use an
  unused client as the scoreboard.
