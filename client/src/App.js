import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Lobby from './components/Lobby';
import Game from './components/Game';
import AdminPanel from './components/AdminPanel';
import './index.css';

const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');

function App() {
  const [currentView, setCurrentView] = useState('menu');
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [lobby, setLobby] = useState(null);
  const [player, setPlayer] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Écouter les événements du socket
    socket.on('joined-lobby', (data) => {
      setLobby(data.lobby);
      setPlayer(data.player);
      setCurrentView('lobby');
      setError('');
    });

    socket.on('lobby-updated', (lobby) => {
      setLobby(lobby);
    });

    socket.on('game-started', (data) => {
      setGameData(data);
      setCurrentView('game');
    });

    socket.on('next-question', (data) => {
      setGameData(prev => ({ ...prev, currentQuestion: data.questionIndex }));
    });

    socket.on('start-correction', (data) => {
      setGameData(prev => ({ ...prev, isCorrectionPhase: true, questionIndex: data.questionIndex }));
    });

    socket.on('game-ended', (data) => {
      setGameData(prev => ({ ...prev, results: data.results }));
      setCurrentView('results');
    });

    socket.on('join-error', (data) => {
      setError(data.message);
    });

    socket.on('start-error', (data) => {
      setError(data.message);
    });

    return () => {
      socket.off('joined-lobby');
      socket.off('lobby-updated');
      socket.off('game-started');
      socket.off('next-question');
      socket.off('start-correction');
      socket.off('game-ended');
      socket.off('join-error');
      socket.off('start-error');
    };
  }, []);

  const handleJoinLobby = () => {
    if (!username.trim() || !roomId.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    socket.emit('join-lobby', { username: username.trim(), roomId: roomId.trim() });
  };

  const handleStartGame = () => {
    if (lobby && player) {
      socket.emit('start-game', { roomId: player.roomId });
    }
  };

  const handleSubmitAnswer = (answer, questionIndex) => {
    socket.emit('submit-answer', { answer, questionIndex });
  };

  const handleSubmitCorrection = (questionIndex, corrections) => {
    socket.emit('submit-correction', { questionIndex, corrections });
  };

  const resetGame = () => {
    setCurrentView('menu');
    setUsername('');
    setRoomId('');
    setLobby(null);
    setPlayer(null);
    setGameData(null);
    setError('');
    setSuccess('');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <div className="container">
            <div className="card">
              <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '2.5rem' }}>
                🎵 AnimeQuiz 🎵
              </h1>
              <p style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.2rem', opacity: 0.8 }}>
                Rejoins un lobby et devine les musiques avec tes amis !
              </p>
              
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="ID de la salle"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="input"
                />
                <button onClick={handleJoinLobby} className="btn">
                  Rejoindre le Lobby
                </button>
                <button onClick={() => setCurrentView('admin')} className="btn">
                  Panneau Admin
                </button>
              </div>
            </div>
          </div>
        );

      case 'lobby':
        return (
          <Lobby
            lobby={lobby}
            player={player}
            onStartGame={handleStartGame}
            onLeave={resetGame}
          />
        );

      case 'game':
        return (
          <Game
            gameData={gameData}
            player={player}
            onSubmitAnswer={handleSubmitAnswer}
            onSubmitCorrection={handleSubmitCorrection}
          />
        );

      case 'results':
        return (
          <div className="container">
            <div className="card">
              <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
                🏆 Résultats Finaux 🏆
              </h2>
              <div className="results-container">
                <div className="score-board">
                  {gameData.results
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((result, index) => (
                      <div key={result.username} className={`score-card ${index === 0 ? 'winner' : ''}`}>
                        <h3>{result.username}</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: index === 0 ? '#ffd700' : 'white' }}>
                          {result.totalScore} pts
                        </div>
                        {index === 0 && <div style={{ color: '#ffd700' }}>🏆 Gagnant !</div>}
                      </div>
                    ))}
                </div>
                <button onClick={resetGame} className="btn">
                  Nouvelle Partie
                </button>
              </div>
            </div>
          </div>
        );

      case 'admin':
        return (
          <AdminPanel onBack={() => setCurrentView('menu')} />
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      {error && (
        <div className="error" style={{ margin: '20px auto', maxWidth: '600px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="success" style={{ margin: '20px auto', maxWidth: '600px' }}>
          {success}
        </div>
      )}
      {renderCurrentView()}
    </div>
  );
}

export default App;
