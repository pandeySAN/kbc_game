const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Track players' status
let playersStatus = {};

// Questions array
const questions = [
  {
    text: 'What is the capital of France?',
    answer: 'Paris',
    options: ['Paris', 'London', 'Berlin', 'Madrid']
  },
  {
    text: 'Who is the CEO of Tesla?',
    answer: 'Elon Musk',
    options: ['Jeff Bezos', 'Elon Musk', 'Bill Gates', 'Mark Zuckerberg']
  },
  {
    text: 'What is the largest planet in our solar system?',
    answer: 'Jupiter',
    options: ['Earth', 'Mars', 'Jupiter', 'Saturn']
  },
  {
    text: 'Which is the longest river in India?',
    answer: 'Ganges',
    options: ['Ganges', 'Yamuna', 'Godawari', 'Tapti']
  },
  {
    text: 'Who wrote the Hindu mythological book "Ramayana"?',
    answer: 'Maharishi Valmiki',
    options: ['Ved Vyas', 'Tulsi Das', 'Maharishi Valmiki', 'Rishi Agastya']
  }
];

// Shuffle function to randomize the order of questions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

// Handle QR code generation
app.get('/qrcode', (req, res) => {
  const gameUrl = 'http://localhost:3000/mobile.html'; // URL for players to join
  QRCode.toDataURL(gameUrl, (err, url) => {
    if (err) return res.status(500).send('Error generating QR code');
    res.json({ qrCode: url });
  });
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A player connected');

  // Shuffle questions when a new player connects
  const shuffledQuestions = [...questions]; // Copy questions array
  shuffleArray(shuffledQuestions);
  
  // Track the current question index for this session
  let currentQuestionIndex = 0;

  // Send the first question to the client
  socket.emit('newQuestion', shuffledQuestions[currentQuestionIndex]);

  // Handle player's answer submission
  socket.on('playerAnswer', (data) => {
    const { playerName, answer } = data;

    // Initialize player's status if not present
    if (!playersStatus[playerName]) {
      playersStatus[playerName] = {
        correctAnswers: 0,
        lost: false
      };
    }

    if (playersStatus[playerName].lost) {
      socket.emit('gameOver', { message: 'You already lost!' });
      return;
    }

    // Check if the player's answer is correct
    if (answer === shuffledQuestions[currentQuestionIndex].answer) {
      playersStatus[playerName].correctAnswers++;

      // Emit congratulatory message to the player
      socket.emit('congratulations', { message: `Congratulations ${playerName}! Correct answer!` });

      // If this is the last question, check if the player has won
      if (currentQuestionIndex === shuffledQuestions.length - 1) {
        if (playersStatus[playerName].correctAnswers === shuffledQuestions.length) {
          socket.emit('gameWon', { message: 'Congratulations! You won 5 crores!' });
        }
      } else {
        // Move to the next question
        currentQuestionIndex++;
        sendNextQuestion();
      }
    } else {
      playersStatus[playerName].lost = true;
      socket.emit('gameLost', { message: 'Oops! This one is wrong.' }); // Emit game lost message
    }
  });

  function sendNextQuestion() {
    if (currentQuestionIndex < shuffledQuestions.length) {
      io.emit('newQuestion', shuffledQuestions[currentQuestionIndex]);
    }
  }
});

// Start server
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
