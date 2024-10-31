const express = require('express');
const WebSocket = require('ws');

const app = express();
app.use(express.json());
const port = 3000;

const wss = new WebSocket.Server({ noServer: true });

let players = {
    "1": { balance: 100, activePlay: false }
};

app.get('/wallet', (req, res) => {
    const clientId = req.query.clientId;
    const player = players[clientId];
    if (player) {
      res.json({ balance: player.balance });
    } else {
      res.status(404).json({ error: "Player not found" });
    }
});

app.post('/play', (req, res) => {
    const { clientId, betAmount, betType } = req.body;
    const player = players[clientId];
  
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    if (player.activePlay) {
      return res.status(400).json({ error: "End current play before starting a new one" });
    }
    if (player.balance < betAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    if (betType < 1 || betType > 6) {
      return res.status(400).json({ error: "Invalid bet type. Choose a number between 1 and 6." });
    }
  
    const numberRolled = Math.floor(Math.random() * 6) + 1;
    const won = (betType === numberRolled);
  
    player.balance -= betAmount;
    player.activePlay = true;
  
    res.json({ number: numberRolled, result: won ? "win" : "lose" });
});
  
  
app.post('/endplay', (req, res) => {
    const { clientId } = req.body;
    const player = players[clientId];
  
    if (!player || !player.activePlay) {
      return res.status(400).json({ error: "No active play to end" });
    }
  
    if (player.result === "win") {
      player.balance += player.betAmount * 2;
    }
  
    player.activePlay = false;
    res.json({ balance: player.balance });
});
  
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


  




