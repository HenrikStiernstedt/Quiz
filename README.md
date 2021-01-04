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

# Game modes
* "Röda tråden"-style. Start on 5 points and get clues all the way down to 1 point.
   May chose to change answer, but last edited point level is the final score.
   Everyone types in their answers on their phones hidden from each others.

* Majority Wins. Everyone types in their answers they think most others also have
  answered. Points to all players with the most same answer. This mode can also be
  used for classic quiz style questions where correct answers are given points.

* Buzz! Whoever buzzes first is allowed to answer. Points are awarded manually.

# TODO:

## Player GUI
* [ ] Add modal for name prompt if no name has been entered for the session.

* [ ] Store a players old name in a cookie for next time.

* [ ] Hide the QuizMaster-password field as it is not important for the majority of players.

* "I'm ready"-notification for players to signal that we're ready to move on to the next question.
  - [x] Smileys exists now and it can be used for this.

* "I'm confident"-taunt emotion indicator as well as "I have no clue"-indicator. Just for fun, or maybe with some penalty if a confident player guesses wrong. Maybe a counter for most taunts in a game? 
  - [x] Partly implemented, with no impact on the game.

* [ ] Multiple answers for combo questions. PRIORITY!

* [ ] Help sections for the rules for all game modes.

* [ ] Countdown timers for answering.

* [ ] Sounds

## QuizMaster GUI
* Automatic score calculations.
  - [x] Based on QuizMaster's answer.
  - [x] Based on majority rules answer 
  - [ ] (with possible override?).
  - [ ] Multiple correct answers.

* [ ] New public score board and question display.
  This one is supposed to be streamed online or just let everyone have surf to the page
  directly. To be used in tandem with the phone. So far you can always use an
  unused client as the scoreboard.

* [ ] More automatication for question types. Maybe with some kind of template to follow, or just skip 
some of the freedom the Quizmaster has today that really is not needed. 

* [x] Preconfigured questions.

* [ ] Better flow when displaying the correct answer and more satisfying animations when you get points. Sounds! Stars!

* [ ] Postpone the adding of correct stores to the total score. Give all points at the same time and then reorder the player list. PRIORITY!

* [ ] Save/load functions. 
  - [x] Save/load within existing game.
  - [ ] "Restore session" function if the server crashes, and reconnect existing users to their old users.

* [ ] Comments field to pending question.

* [ ] Displayment of the correct answer.


## Scoreboard only mode
* [ ] A way to only show questions and score board.
* [ ] A way to not be part of the score board, but still recieve game updates.

## Game modes
### Buzz
* [ ] Add answering list in order to let players queue up answers.
* [x] Add button for rejecting an answer and preventing the player from buzzing again this round.
  - Solved by clicking "uppdatera fråga" after an answer. 

### Röda tråden

### Quiz
  - [x] Standard quiz mode where every correct answer gives a point.
  - [ ] Other scoring mechanism with autoscoring where closest number gives points.
  - [ ] Other scoring mechanism with autoscoring where closeness to the correct answer gives graduately lower/higher score. 

### More game modes
  - [ ] Majority fails/minority rules. Everyone types in a hopefully unique item from a list of items.
  Ie. A car beginning with A. Everyone who have typed in a unique car model gets 2 points.
  Failing to enter a car model gives no points. Having the same answer as anyone else gives
  1 point.

## Technical
* [ ] Use Bootstrap-vue?
* [ ] Make use of vue components
* [ ] Use vuex for state?
* [ ] Upgrade to newer versions of socket.io.
  
# How to run as QuizMaster
Tanken är att frågenummer skall räkans upp automatiskt om man bara lämnar det blankt. Sen måste man välja en frågetyp. Den är inte vad från början då det blir lite skumt innan amn tryckt på "Ny fråga" en gång efter omstart. Sen får man fylla i poäng så att den är något vettigt, t.ex. 10. Fältet "Fråga" är helt frivilligt, men det skrivs då ut på frågekortet. "Svar" används inte alls än. 
 
Det som man sen behöver ha koll på är att använda "uppdatera fråga" om man behöver rätta något eller vill sänka poängen inför nästa ledtråd i På spåret. "Avsluta fråga" visar upp vad alla har svarat och då kan man anävnda stjärnan i spelarlistan för att markera vilka spelare som svarat rätt. De får då så många poäng som de svarat på, alternativt så många poäng som frågan är värd om man kör "buzzer"-frågetypen. När man är redo för nästa fråga är det viktigt att ställa in alla fält rätt först och sen trycka på "Ny fråga". Då animeras det så att den gamla frågan försvinner och en ny kommer in. 

Det jag oftast gör fel på är att trycka "Ny fråga" innan jag ställt in alla fält rätt först. Men det går att justera fälten och trycka på "uppdatera fråga" för att komma undan med det... men det är inte lika snyggt.

Till sist har du "pil upp" och "pil ned" som ger respektive tar poäng av en spelare rakt av om man behöver korrigera något.

Om man trycker på "Ny omgång" får de med högst poäng en guldpeng och i övrigt nollställs allas poäng. 
