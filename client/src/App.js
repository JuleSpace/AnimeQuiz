import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Lobby from './components/Lobby';
import Game from './components/Game';
import AdminPanel from './components/AdminPanel';
import './index.css';

const socket = io(process.env.REACT_APP_SERVER_URL || window.location.origin);

function App() {
  const [currentView, setCurrentView] = useState('menu');
  const [username, setUsername] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [player, setPlayer] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rooms, setRooms] = useState([]);
  const [adminAuth, setAdminAuth] = useState({ username: '', password: '' });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Charger les salles disponibles
    fetchRooms();

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
      setGameData(prev => ({ 
        ...prev, 
        currentQuestion: data.questionIndex,
        players: data.players,
        isCorrectionPhase: false
      }));
    });

    socket.on('start-correction', (data) => {
      setGameData(prev => ({ 
        ...prev, 
        isCorrectionPhase: true, 
        questionIndex: data.questionIndex,
        players: data.players 
      }));
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

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des salles:', error);
    }
  };

  const handleJoinLobby = (roomId) => {
    if (!username.trim()) {
      setError('Veuillez entrer un nom d\'utilisateur');
      return;
    }
    
    socket.emit('join-lobby', { username: username.trim(), roomId: roomId });
  };

  const handleAdminAuth = () => {
    if (adminAuth.username === 'admin' && adminAuth.password === 'admin') {
      setIsAdminAuthenticated(true);
      setCurrentView('admin');
      setError('');
    } else {
      setError('Identifiants admin incorrects');
    }
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
    setSelectedRoom(null);
    setLobby(null);
    setPlayer(null);
    setGameData(null);
    setError('');
    setSuccess('');
    setIsAdminAuthenticated(false);
    setAdminAuth({ username: '', password: '' });
    fetchRooms(); // Recharger les salles
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
              
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  style={{ marginBottom: '20px' }}
                />
                
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>📋 Quiz disponibles :</h3>
                
                {rooms.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.8, padding: '20px' }}>
                    Aucun quiz disponible pour le moment
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                    {rooms.map(room => (
                      <div key={room._id} style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        padding: '20px', 
                        borderRadius: '15px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                      onClick={() => handleJoinLobby(room._id)}
                      >
                        <h4 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>{room.name}</h4>
                        {room.description && (
                          <p style={{ margin: '0 0 10px 0', opacity: 0.8 }}>{room.description}</p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            {room.musicLinks.length} musique(s)
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#51cf66' }}>
                            Cliquer pour rejoindre
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ textAlign: 'center' }}>
                  <button 
                    onClick={() => setCurrentView('admin-login')} 
                    className="btn"
                    style={{ marginTop: '20px' }}
                  >
                    🔐 Connexion Admin
                  </button>
                </div>
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

      case 'admin-login':
        return (
          <div className="container">
            <div className="card">
              <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
                🔐 Connexion Administrateur
              </h2>
              
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <input
                  type="text"
                  placeholder="Nom d'utilisateur admin"
                  value={adminAuth.username}
                  onChange={(e) => setAdminAuth({ ...adminAuth, username: e.target.value })}
                  className="input"
                />
                <input
                  type="password"
                  placeholder="Mot de passe admin"
                  value={adminAuth.password}
                  onChange={(e) => setAdminAuth({ ...adminAuth, password: e.target.value })}
                  className="input"
                />
                <button onClick={handleAdminAuth} className="btn btn-success">
                  Se connecter
                </button>
                <button onClick={() => setCurrentView('menu')} className="btn">
                  Retour
                </button>
              </div>
            </div>
          </div>
        );

      case 'admin':
        return (
          <AdminPanel 
            onBack={() => {
              setCurrentView('menu');
              setIsAdminAuthenticated(false);
              setAdminAuth({ username: '', password: '' });
            }}
            onRoomUpdate={fetchRooms}
          />
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
