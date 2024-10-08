const socket = io();

// Load QR code and display it
fetch('/qrcode')
  .then(response => response.json())
  .then(data => {
    document.getElementById('qrcode').src = data.qrCode;
  });

// Listen for new questions
socket.on('newQuestion', (question) => {
  document.getElementById('question').innerText = question;
});

// Display correct answer message
socket.on('correctAnswer', (data) => {
  document.getElementById('result').innerText = data.message;
});

// End game when no more questions
socket.on('gameOver', (data) => {
  document.getElementById('question').innerText = data.message;
});
