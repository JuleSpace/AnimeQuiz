const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// Connexion MongoDB
const mongoUri = process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/animequiz';
console.log('🔗 Tentative de connexion MongoDB:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Masquer les credentials

mongoose.connect(mongoUri)
.then(() => {
  console.log('✅ Connexion MongoDB réussie');
})
.catch((error) => {
  console.error('❌ Erreur connexion MongoDB:', error.message);
  console.log('🔍 Vérifiez que la variable MONGODB_URI est correctement configurée');
  // Ne pas faire crash l'app si MongoDB n'est pas disponible
});

// Modèles
const RoomSchema = new mongoose.Schema({
  name: String,
  description: String,
  musicLinks: [String],
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const PlayerSchema = new mongoose.Schema({
  username: String,
  socketId: String,
  roomId: String,
  score: { type: Number, default: 0 },
  answers: [{
    questionIndex: Number,
    answer: String,
    isCorrect: Boolean,
    points: Number
  }]
});

const GameSessionSchema = new mongoose.Schema({
  roomId: String,
  players: [String],
  currentQuestion: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  results: [{
    playerId: String,
    answers: [Object],
    totalScore: Number
  }]
});

const Room = mongoose.model('Room', RoomSchema);
const Player = mongoose.model('Player', PlayerSchema);
const GameSession = mongoose.model('GameSession', GameSessionSchema);

// Variables globales pour gérer les lobbies
const lobbies = new Map();
const players = new Map();

// Route de healthcheck
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Routes API
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { name, description, musicLinks } = req.body;
    const room = new Room({ name, description, musicLinks });
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { musicLinks } = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, { musicLinks }, { new: true });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Salle supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route de test pour vérifier que l'app fonctionne
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // En production, servir les fichiers statiques
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  } else {
    // En développement, message simple
    res.json({ 
      message: 'AnimeQuiz Server is running!', 
      mode: 'development',
      frontend: 'http://localhost:3000'
    });
  }
});

// Servir l'application React pour toutes les autres routes en production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// WebSocket pour les lobbies et le jeu
io.on('connection', (socket) => {
  console.log('Nouveau joueur connecté:', socket.id);

  // Rejoindre un lobby
  socket.on('join-lobby', async (data) => {
    const { username, roomId } = data;
    
    if (!lobbies.has(roomId)) {
      lobbies.set(roomId, {
        players: [],
        isGameStarted: false,
        roomId
      });
    }

    const lobby = lobbies.get(roomId);
    
    // Vérifier si le joueur existe déjà
    const existingPlayer = lobby.players.find(p => p.username === username);
    if (existingPlayer) {
      socket.emit('join-error', { message: 'Ce nom d\'utilisateur est déjà pris' });
      return;
    }

    const player = {
      id: socket.id,
      username,
      roomId,
      score: 0,
      answers: []
    };

    lobby.players.push(player);
    players.set(socket.id, player);

    socket.join(roomId);
    socket.emit('joined-lobby', { lobby, player });
    io.to(roomId).emit('lobby-updated', lobby);

    console.log(`${username} a rejoint le lobby ${roomId}`);
  });

  // Démarrer le jeu (seulement le premier joueur)
  socket.on('start-game', async (data) => {
    const { roomId } = data;
    const lobby = lobbies.get(roomId);
    const player = players.get(socket.id);

    if (!lobby || !player || lobby.players.length < 2) {
      socket.emit('start-error', { message: 'Il faut au moins 2 joueurs pour commencer' });
      return;
    }

    // Vérifier que c'est le premier joueur
    if (lobby.players[0].id !== socket.id) {
      socket.emit('start-error', { message: 'Seul le premier joueur peut lancer la partie' });
      return;
    }

    // Récupérer les liens musicaux de la salle
    const room = await Room.findById(roomId);
    if (!room || !room.musicLinks.length) {
      socket.emit('start-error', { message: 'Aucune musique configurée dans cette salle' });
      return;
    }

    lobby.isGameStarted = true;
    lobby.currentQuestion = 0;
    lobby.musicLinks = room.musicLinks;

    // Créer une session de jeu
    const gameSession = new GameSession({
      roomId,
      players: lobby.players.map(p => p.id),
      currentQuestion: 0,
      isActive: true
    });
    await gameSession.save();

    io.to(roomId).emit('game-started', {
      totalQuestions: room.musicLinks.length,
      currentQuestion: 0,
      musicLinks: room.musicLinks
    });

    console.log(`Jeu démarré dans le lobby ${roomId}`);
  });

  // Soumettre une réponse
  socket.on('submit-answer', async (data) => {
    const { answer, questionIndex } = data;
    const player = players.get(socket.id);
    
    if (!player) return;

    const lobby = lobbies.get(player.roomId);
    if (!lobby || !lobby.isGameStarted) return;

    // Stocker la réponse
    player.answers[questionIndex] = answer;

    // Vérifier si tous les joueurs ont répondu
    const allAnswered = lobby.players.every(p => p.answers && p.answers[questionIndex]);
    
    if (allAnswered) {
      // Déclencher la correction
      io.to(player.roomId).emit('start-correction', { questionIndex });
    }
  });

  // Système de correction automatique
  socket.on('submit-correction', async (data) => {
    const { questionIndex, corrections } = data;
    const player = players.get(socket.id);
    
    if (!player) return;

    const lobby = lobbies.get(player.roomId);
    if (!lobby) return;

    // Stocker les corrections du joueur
    if (!player.corrections) player.corrections = {};
    player.corrections[questionIndex] = corrections;

    // Vérifier si tous les joueurs ont corrigé
    const allCorrected = lobby.players.every(p => p.corrections && p.corrections[questionIndex]);
    
    if (allCorrected) {
      // Calculer les scores finaux pour cette question
      const finalScores = calculateFinalScores(lobby.players, questionIndex);
      
      // Mettre à jour les scores
      lobby.players.forEach(p => {
        const score = finalScores[p.id] || 0;
        p.score += score;
        if (!p.answers[questionIndex]) p.answers[questionIndex] = {};
        p.answers[questionIndex].points = score;
      });

      // Passer à la question suivante ou terminer
      lobby.currentQuestion++;
      
      if (lobby.currentQuestion >= lobby.musicLinks.length) {
        // Fin du jeu
        const finalResults = lobby.players.map(p => ({
          username: p.username,
          totalScore: p.score,
          answers: p.answers
        }));

        io.to(player.roomId).emit('game-ended', { results: finalResults });
      } else {
        // Question suivante
        io.to(player.roomId).emit('next-question', {
          questionIndex: lobby.currentQuestion,
          totalQuestions: lobby.musicLinks.length
        });
      }
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      const lobby = lobbies.get(player.roomId);
      if (lobby) {
        lobby.players = lobby.players.filter(p => p.id !== socket.id);
        io.to(player.roomId).emit('lobby-updated', lobby);
        
        if (lobby.players.length === 0) {
          lobbies.delete(player.roomId);
        }
      }
      players.delete(socket.id);
    }
    console.log('Joueur déconnecté:', socket.id);
  });
});

// Fonction pour calculer les scores finaux
function calculateFinalScores(players, questionIndex) {
  const scores = {};
  
  // Pour chaque joueur, calculer son score basé sur les corrections des autres
  players.forEach(player => {
    if (!player.corrections || !player.corrections[questionIndex]) return;
    
    const corrections = player.corrections[questionIndex];
    let totalPoints = 0;
    
    Object.keys(corrections).forEach(playerId => {
      if (corrections[playerId]) {
        totalPoints += 10; // 10 points par bonne correction
      }
    });
    
    scores[player.id] = totalPoints;
  });
  
  return scores;
}

// Debug des variables d'environnement
console.log('🔧 Variables d\'environnement:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'non définie');
console.log('- PORT:', process.env.PORT || 'non définie');
console.log('- CLIENT_URL:', process.env.CLIENT_URL || 'non définie');
console.log('- MONGO_PUBLIC_URL:', process.env.MONGO_PUBLIC_URL ? 'définie' : 'non définie');
console.log('- MONGO_URL:', process.env.MONGO_URL ? 'définie' : 'non définie');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'définie' : 'non définie');

// Vérifier que le dossier build existe en production
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const buildPath = path.join(__dirname, 'client/build');
  if (fs.existsSync(buildPath)) {
    console.log('✅ Dossier client/build trouvé');
  } else {
    console.log('❌ Dossier client/build manquant - le build frontend a échoué');
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
