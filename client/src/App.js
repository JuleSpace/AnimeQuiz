import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Lobby from './components/Lobby';
import Game from './components/Game';
import AdminPanel from './components/AdminPanel';
import './index.css';

const socket = io(process.env.REACT_APP_SERVER_URL || window.location.origin);

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [player, setPlayer] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rooms, setRooms] = useState([]);
  const [adminAuth, setAdminAuth] = useState({ username: '', password: '' });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Vérifier si un utilisateur est déjà connecté au chargement
  useEffect(() => {
    const savedUsername = localStorage.getItem('animeQuizUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setIsLoggedIn(true);
      setCurrentView('menu');
    }
  }, []);

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
        totalQuestions: data.totalQuestions,
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

    socket.on('scores-updated', (data) => {
      setGameData(prev => ({
        ...prev,
        players: prev.players.map(player => {
          const updatedPlayer = data.players.find(p => p.id === player.id);
          return updatedPlayer ? { ...player, score: updatedPlayer.score } : player;
        })
      }));
    });

    socket.on('corrections-updated', (data) => {
      setGameData(prev => ({
        ...prev,
        currentCorrections: data.corrections
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

  const handleLogin = () => {
    if (!username.trim()) {
      setError('Veuillez entrer un pseudo');
      return;
    }
    
    // Sauvegarder le pseudo dans localStorage
    localStorage.setItem('animeQuizUsername', username.trim());
    setIsLoggedIn(true);
    setCurrentView('menu');
    setError('');
    setSuccess(`Bienvenue ${username.trim()} ! 🎮`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('animeQuizUsername');
    setUsername('');
    setIsLoggedIn(false);
    setCurrentView('login');
    setLobby(null);
    setPlayer(null);
    setGameData(null);
    setSuccess('Déconnexion réussie ! 👋');
    setTimeout(() => setSuccess(''), 3000);
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

  const handleStartGame = (numberOfSongs) => {
    if (lobby && player) {
      socket.emit('start-game', { roomId: player.roomId, numberOfSongs });
    }
  };

  const handleSubmitAnswer = (answer, questionIndex) => {
    socket.emit('submit-answer', { answer, questionIndex });
  };

  const handleSubmitCorrection = (questionIndex, corrections) => {
    socket.emit('submit-correction', { questionIndex, corrections });
  };

  const handleUpdateCorrections = (questionIndex, corrections) => {
    socket.emit('update-corrections', { questionIndex, corrections });
  };

  const resetGame = () => {
    // Retourner au menu si l'utilisateur est connecté, sinon à la page de connexion
    if (isLoggedIn && username) {
      setCurrentView('menu');
    } else {
      setCurrentView('login');
    }
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
      case 'login':
        return (
          <div className="container">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', gap: '20px' }}>
                <img 
                  src="https://media.tenor.com/PxudDH41WKcAAAAj/pepe-music-pepe-listening-to-music.gif" 
                  alt="Pepe Music"
                  style={{ width: '60px', height: '60px', borderRadius: '10px' }}
                />
                <h1 style={{ fontSize: '2.5rem', margin: 0 }}>
                  Music Quiz
                </h1>
                <img 
                  src="https://media.tenor.com/-oEgnxYtci4AAAAj/kirby-dancing-bop.gif" 
                  alt="Kirby Dancing"
                  style={{ width: '60px', height: '60px', borderRadius: '10px' }}
                />
              </div>
              
              <p style={{ textAlign: 'center', marginBottom: '15px', fontSize: '1.2rem', opacity: 0.9 }}>
                Fais toi bully par tes potes avec un maximum de plaisir toujours :)
              </p>
              
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <img 
                  src="https://media1.tenor.com/m/8o5zzcKRkRAAAAAC/bully-soccer.gif" 
                  alt="Bully"
                  style={{ width: '80px', height: '64px', borderRadius: '10px' }}
                />
              </div>

              <div style={{ maxWidth: '400px', margin: '0 auto', padding: '30px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#667eea' }}>
                  🎮 Connexion
                </h2>
                
                <p style={{ textAlign: 'center', marginBottom: '20px', opacity: 0.8 }}>
                  Choisis ton pseudo pour commencer à jouer !
                </p>

                <input
                  type="text"
                  placeholder="Entre ton pseudo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="input"
                  style={{ 
                    marginBottom: '20px',
                    fontSize: '1.1rem',
                    padding: '15px',
                    textAlign: 'center'
                  }}
                />
                
                <button 
                  onClick={handleLogin}
                  className="button"
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                  }}
                >
                  🎵 Commencer à jouer
                </button>

                <div style={{ 
                  marginTop: '30px', 
                  paddingTop: '20px', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <button 
                    onClick={() => setCurrentView('admin')}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    🔐 Connexion Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="container">
            <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', gap: '20px' }}>
              <img 
                src="https://media.tenor.com/PxudDH41WKcAAAAj/pepe-music-pepe-listening-to-music.gif" 
                alt="Pepe Music"
                style={{ width: '60px', height: '60px', borderRadius: '10px' }}
              />
              <h1 style={{ fontSize: '2.5rem', margin: 0 }}>
                Music Quiz
              </h1>
              <img 
                src="https://media.tenor.com/-oEgnxYtci4AAAAj/kirby-dancing-bop.gif" 
                alt="Kirby Dancing"
                style={{ width: '60px', height: '60px', borderRadius: '10px' }}
              />
            </div>
            <p style={{ textAlign: 'center', marginBottom: '15px', fontSize: '1.2rem', opacity: 0.9 }}>
              Fais toi bully par tes potes avec un maximum de plaisir toujours :)
            </p>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <img 
                src="https://media1.tenor.com/m/8o5zzcKRkRAAAAAC/bully-soccer.gif" 
                alt="Bully"
                style={{ width: '80px', height: '64px', borderRadius: '10px' }}
              />
            </div>
              
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px',
                  padding: '15px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(102, 126, 234, 0.3)'
                }}>
                  <div>
                    <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>Connecté en tant que :</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea', marginTop: '5px' }}>
                      🎮 {username}
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    🚪 Déconnexion
                  </button>
                </div>
                
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>📋 Quiz disponibles :</h3>
                
                {rooms.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.8, padding: '20px' }}>
                    Aucun quiz disponible pour le moment
                  </p>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '30px' 
                  }}>
                    {rooms.map(room => (
                      <div 
                        key={room._id} 
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                          padding: '25px', 
                          borderRadius: '20px',
                          border: '2px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                          e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onClick={() => handleJoinLobby(room._id)}
                      >
                        {/* Badge de nombre de musiques */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(255, 215, 0, 0.9)',
                          color: '#000',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          🎵 {room.musicLinks.length}
                        </div>

                        <h4 style={{ 
                          margin: '0 0 15px 0', 
                          color: '#ffd700', 
                          fontSize: '1.3rem',
                          fontWeight: 'bold',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                        }}>
                          {room.name}
                        </h4>
                        
                        {room.description && (
                          <p style={{ 
                            margin: '0 0 15px 0', 
                            opacity: 0.9,
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            textAlign: 'center'
                          }}>
                            {room.description}
                          </p>
                        )}
                        
                        <div style={{ 
                          textAlign: 'center',
                          marginTop: '15px',
                          paddingTop: '15px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          <span style={{ 
                            fontSize: '0.9rem', 
                            color: '#51cf66',
                            fontWeight: 'bold'
                          }}>
                            ▶️ Cliquer pour rejoindre
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              onUpdateCorrections={handleUpdateCorrections}
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
                <button 
                  onClick={() => setCurrentView('menu')} 
                  className="btn"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff6b6b, #c92a2a)',
                    border: '2px solid rgba(255, 107, 107, 0.5)',
                    boxShadow: '0 4px 15px rgba(201, 42, 42, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(201, 42, 42, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(201, 42, 42, 0.3)';
                  }}
                >
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
