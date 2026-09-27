import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Lobby from './components/Lobby';
import Game from './components/Game';
import ClassicGame from './components/ClassicGame';
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
  const [quizzes, setQuizzes] = useState([]);
  const [playMode, setPlayMode] = useState('music');
  const [adminAuth, setAdminAuth] = useState({ username: '', password: '' });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Vérifier si un utilisateur est déjà connecté au chargement
  useEffect(() => {
    const savedUsername = localStorage.getItem('animeQuizUsername');
    
    if (savedUsername) {
      setUsername(savedUsername);
      setIsLoggedIn(true);
      setCurrentView('modes');
    }
  }, []);

  // Gérer la fermeture/rafraîchissement de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (player && lobby) {
        // Émettre un événement pour quitter le lobby proprement
        socket.emit('leave-lobby');
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [player, lobby]);

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
      if (lobby?.mode === 'quiz') {
        setGameData((prev) => {
          if (!prev || prev.mode !== 'quiz') return prev;
          const ids = new Set((lobby.players || []).map((entry) => entry.id));
          return {
            ...prev,
            hostId: lobby.hostId,
            totalPlayers: (lobby.players || []).length,
            players: (prev.players || []).filter((entry) => ids.has(entry.id))
          };
        });
      }
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

    socket.on('quiz-question', (data) => {
      setPlayMode('quiz');
      setGameData({
        mode: 'quiz',
        quizName: data.quizName,
        hostId: data.hostId,
        question: data.question,
        questionIndex: data.questionIndex,
        totalQuestions: data.totalQuestions,
        players: data.players,
        deadline: data.deadline,
        answered: data.answered,
        totalPlayers: data.totalPlayers,
        phase: 'answering',
        reveal: null,
        corrections: null,
        expectedAnswer: ''
      });
      setCurrentView('quiz-game');
      setError('');
    });

    socket.on('quiz-progress', (data) => {
      setGameData((prev) => (
        prev ? { ...prev, answered: data.answered, totalPlayers: data.totalPlayers } : prev
      ));
    });

    socket.on('quiz-correction', (data) => {
      setGameData((prev) => (
        prev ? {
          ...prev,
          phase: 'correction',
          hostId: data.hostId,
          expectedAnswer: data.expectedAnswer,
          suggestedPoints: data.suggestedPoints || 1,
          corrections: data.corrections,
          players: data.players
        } : prev
      ));
    });

    socket.on('quiz-corrections-updated', (data) => {
      setGameData((prev) => (prev ? { ...prev, corrections: data.corrections } : prev));
    });

    socket.on('quiz-reveal', (data) => {
      setGameData((prev) => (
        prev ? {
          ...prev,
          phase: 'reveal',
          reveal: data,
          players: data.players,
          hostId: data.hostId || prev.hostId
        } : prev
      ));
    });

    socket.on('quiz-ended', (data) => {
      setGameData((prev) => ({ ...(prev || {}), results: data.results }));
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
      socket.off('quiz-question');
      socket.off('quiz-progress');
      socket.off('quiz-correction');
      socket.off('quiz-corrections-updated');
      socket.off('quiz-reveal');
      socket.off('quiz-ended');
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

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get('/api/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des quiz:', error);
    }
  };

  const handleLogin = (mode) => {
    if (!username.trim()) {
      setError('Veuillez entrer un pseudo');
      return;
    }

    const cleanName = username.trim();
    localStorage.setItem('animeQuizUsername', cleanName);
    setUsername(cleanName);
    setIsLoggedIn(true);
    setPlayMode(mode);
    setCurrentView(mode === 'quiz' ? 'quiz-menu' : 'menu');
    setError('');
    setSuccess(`Bienvenue ${cleanName} !`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const chooseMode = (mode) => {
    setPlayMode(mode);
    setCurrentView(mode === 'quiz' ? 'quiz-menu' : 'menu');
    setError('');
  };

  useEffect(() => {
    if (currentView === 'quiz-menu') {
      fetchQuizzes();
    }
  }, [currentView]);

  const handleLogout = () => {
    // Émettre l'événement pour quitter le lobby proprement côté serveur si on est dans un lobby
    if (player && lobby) {
      socket.emit('leave-lobby');
    }
    
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
    
    setPlayMode('music');
    socket.emit('join-lobby', { username: username.trim(), roomId: roomId });
  };

  const handleJoinQuiz = (quizId) => {
    if (!username.trim()) {
      setError('Veuillez entrer un nom d\'utilisateur');
      return;
    }
    setPlayMode('quiz');
    socket.emit('join-quiz-lobby', { username: username.trim(), quizId });
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

  const handleStartQuiz = (numberOfQuestions) => {
    if (lobby && player) {
      socket.emit('start-quiz', { quizId: player.roomId, numberOfQuestions });
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

  const handleTransferLeadership = (newLeaderId) => {
    if (lobby && player) {
      socket.emit('transfer-leadership', { 
        roomId: player.roomId, 
        newLeaderId 
      });
    }
  };

  const resetGame = () => {
    // Émettre l'événement pour quitter le lobby proprement côté serveur
    if (player && lobby) {
      socket.emit('leave-lobby');
    }
    
    // Retourner au menu si l'utilisateur est connecté, sinon à la page de connexion
    if (isLoggedIn && username) {
      setCurrentView(playMode === 'quiz' ? 'quiz-menu' : 'menu');
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
    fetchRooms();
    fetchQuizzes();
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
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setError('Choisis Quiz ou Music Quiz');
                  }}
                  className="input"
                  style={{ 
                    marginBottom: '20px',
                    fontSize: '1.1rem',
                    padding: '15px',
                    textAlign: 'center'
                  }}
                />

                <button
                  onClick={() => handleLogin('quiz')}
                  className="button mode-card"
                  style={{ width: '100%', marginBottom: '12px' }}
                >
                  <span className="mode-card-title">📝 Quiz</span>
                  <span>Questions, images, vidéos, textes à trous et blind tests</span>
                </button>

                <button
                  onClick={() => handleLogin('music')}
                  className="button mode-card"
                  style={{ width: '100%' }}
                >
                  <span className="mode-card-title">🎵 Music Quiz</span>
                  <span>Blind test musical, corrigé par le chef</span>
                </button>

                <div style={{ 
                  marginTop: '30px', 
                  paddingTop: '20px', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <button 
                    onClick={() => setCurrentView('admin-login')}
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

      case 'modes':
        return (
          <div className="container">
            <div className="card">
              <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Que veux-tu jouer ?</h1>
              <p style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.85 }}>
                Connecté en tant que {username}
              </p>
              <div className="mode-grid">
                <button type="button" className="mode-card" onClick={() => chooseMode('quiz')}>
                  <span className="mode-card-title">📝 Quiz</span>
                  <span>Questions à choix, vrai/faux, texte libre, images, vidéos, textes à trous, et quelques blind tests.</span>
                </button>
                <button type="button" className="mode-card" onClick={() => chooseMode('music')}>
                  <span className="mode-card-title">🎵 Music Quiz</span>
                  <span>Extraits masqués. Tout le monde écrit, le chef corrige.</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'quiz-menu':
        return (
          <div className="container">
            <div className="card">
              <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Quiz</h1>
              <p style={{ textAlign: 'center', marginBottom: '16px', opacity: 0.85 }}>
                Choisis un quiz, puis attends que le chef lance la partie.
              </p>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button type="button" className="btn" onClick={() => setCurrentView('modes')}>
                  ← Changer de mode
                </button>
              </div>
              {quizzes.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.8 }}>Aucun quiz disponible pour le moment.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {quizzes.map((quiz) => (
                    <button
                      key={quiz._id}
                      type="button"
                      disabled={!quiz.questionCount}
                      onClick={() => quiz.questionCount && handleJoinQuiz(quiz._id)}
                      style={{
                        textAlign: 'left',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                        color: 'white',
                        border: '2px solid rgba(255,255,255,0.12)',
                        borderRadius: '18px',
                        padding: '22px',
                        cursor: quiz.questionCount ? 'pointer' : 'not-allowed',
                        opacity: quiz.questionCount ? 1 : 0.55,
                        fontFamily: 'inherit'
                      }}
                    >
                      <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 8 }}>{quiz.name}</div>
                      <div style={{ opacity: 0.85, minHeight: 40 }}>{quiz.description}</div>
                      <div style={{ marginTop: 12, color: '#51cf66' }}>
                        {quiz.questionCount ? `${quiz.questionCount} questions` : 'Pas encore de questions'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginTop: '5px' }}>
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
                
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>📋 Quiz musicaux :</h3>
                
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <button type="button" className="btn" onClick={() => setCurrentView('modes')}>
                    ← Changer de mode
                  </button>
                </div>
                
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
            variant={playMode}
            onStartGame={playMode === 'quiz' ? handleStartQuiz : handleStartGame}
            onLeave={resetGame}
            onTransferLeadership={handleTransferLeadership}
          />
        );

      case 'quiz-game':
        return (
          <ClassicGame
            gameData={gameData}
            player={player}
            onSubmitAnswer={(answer) => socket.emit('submit-quiz-answer', { answer })}
            onForceClose={() => socket.emit('quiz-force-close')}
            onUpdateCorrections={(corrections) => socket.emit('update-quiz-corrections', { corrections })}
            onSubmitCorrection={(corrections) => socket.emit('submit-quiz-correction', { corrections })}
            onNext={() => socket.emit('quiz-next')}
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
                  {playMode === 'quiz' ? 'Retour aux quiz' : 'Nouvelle Partie'}
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
                  onClick={() => setCurrentView('login')} 
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
              // Réinitialiser l'authentification admin et retourner à la page de connexion
              setIsAdminAuthenticated(false);
              setAdminAuth({ username: '', password: '' });
              setCurrentView('login');
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
      {/* Bouton de déconnexion global */}
      {isLoggedIn && username && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000
        }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
            }}
          >
            🚪 Déconnexion ({username})
          </button>
        </div>
      )}

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
