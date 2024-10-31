const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {
    "1": { balance: 100, activePlay: false }
};

// Função para lidar com mensagens recebidas via WebSocket
wss.on('connection', (ws) => {
    console.log('Novo cliente conectado.');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch(data.type) {
            case 'wallet':
                handleWallet(ws, data.clientId);
                break;
            case 'play':
                handlePlay(ws, data.clientId, data.betAmount, data.betType);
                break;
            case 'endplay':
                handleEndPlay(ws, data.clientId);
                break;
            default:
                ws.send(JSON.stringify({ error: 'Invalid action type' }));
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado.');
    });
});

// Função para consultar o saldo
function handleWallet(ws, clientId) {
    const player = players[clientId];
    if (player) {
        ws.send(JSON.stringify({ type: 'wallet', balance: player.balance }));
    } else {
        ws.send(JSON.stringify({ error: "Player not found" }));
    }
}

// Função para jogar
function handlePlay(ws, clientId, betAmount, betType) {
    const player = players[clientId];

    if (!player) {
        return ws.send(JSON.stringify({ error: "Player not found" }));
    }
    if (player.activePlay) {
        return ws.send(JSON.stringify({ error: "End current play before starting a new one" }));
    }
    if (player.balance < betAmount) {
        return ws.send(JSON.stringify({ error: "Insufficient balance" }));
    }
    if (betType < 1 || betType > 6) {
        return ws.send(JSON.stringify({ error: "Invalid bet type. Choose a number between 1 and 6." }));
    }

    const numberRolled = Math.floor(Math.random() * 6) + 1;
    const won = (betType === numberRolled);

    player.balance -= betAmount;
    player.activePlay = true;
    player.lastBet = { betAmount, won };

    ws.send(JSON.stringify({ type: 'play', number: numberRolled, result: won ? "win" : "lose" }));
}

// Função para encerrar a jogada
function handleEndPlay(ws, clientId) {
    const player = players[clientId];

    if (!player || !player.activePlay) {
        return ws.send(JSON.stringify({ error: "No active play to end" }));
    }

    if (player.lastBet && player.lastBet.won) {
        player.balance += player.lastBet.betAmount * 2;
    }

    player.activePlay = false;
    player.lastBet = null;

    ws.send(JSON.stringify({ type: 'endplay', balance: player.balance }));
}

// Iniciar o servidor
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
