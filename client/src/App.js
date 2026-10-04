import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Lobby from './components/Lobby';
import Game from './components/Game';
import ClassicGame from './components/ClassicGame';
import AdminPanel from './components/AdminPanel';
import Icon from './components/ArcadeIcon';
import './index.css';

const socket = io(process.env.REACT_APP_SERVER_URL || window.location.origin);
const SEAT_KEY = 'animeQuizSeat';

function readSeat() {
  try {
    const seat = JSON.parse(sessionStorage.getItem(SEAT_KEY) || 'null');
    if (!seat?.id || !seat?.username) return null;
    return seat;
  } catch (error) {
    return null;
  }
}

function saveSeat(seat) {
  sessionStorage.setItem(SEAT_KEY, JSON.stringify(seat));
}

function clearSeat() {
  sessionStorage.removeItem(SEAT_KEY);
}

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
    const seat = readSeat();

    if (seat?.username && seat.id) {
      setUsername(seat.username);
      setIsLoggedIn(true);
      setPlayMode(seat.mode === 'quiz' ? 'quiz' : 'music');
      setCurrentView('rejoin');
      const join = () => {
        if (seat.mode === 'quiz') {
          socket.emit('join-quiz-lobby', { username: seat.username, quizId: seat.id });
        } else {
          socket.emit('join-lobby', { username: seat.username, roomId: seat.id });
        }
      };
      if (socket.connected) join();
      else socket.once('connect', join);
      return;
    }

    if (savedUsername) {
      setUsername(savedUsername);
      setIsLoggedIn(true);
      setCurrentView('modes');
    }
  }, []);

  useEffect(() => {
    // Charger les salles disponibles
    fetchRooms();

    // Écouter les événements du socket
    socket.on('joined-lobby', (data) => {
      const roomId = data.player?.roomId || data.lobby?.roomId;
      if (roomId && data.player?.username) {
        saveSeat({
          mode: data.lobby?.mode === 'quiz' ? 'quiz' : 'music',
          id: roomId,
          username: data.player.username
        });
      }
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
          return {
            ...prev,
            hostId: lobby.hostId,
            hostName: lobby.hostName || prev.hostName,
            teamMode: Boolean(lobby.teamMode),
            totalPlayers: (lobby.players || []).length,
            players: (lobby.players || []).map((entry) => {
              const previous = (prev.players || []).find((item) => item.id === entry.id);
              return previous ? { ...previous, ...entry } : entry;
            })
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
      setGameData((prev) => ({
        mode: 'quiz',
        quizName: data.quizName,
        hostId: data.hostId,
        hostName: data.hostName || '',
        question: data.question,
        questionIndex: data.questionIndex,
        totalQuestions: data.totalQuestions,
        players: data.players,
        teamMode: Boolean(data.teamMode),
        teams: data.teams || [],
        teamChat: [],
        deadline: data.deadline,
        answered: data.answered,
        totalPlayers: data.totalPlayers,
        phase: 'answering',
        reveal: null,
        corrections: null,
        gainPreview: [],
        expectedAnswer: '',
        answerImageUrl: '',
        answerVideoUrl: '',
        solutionItems: [],
        layoutMode: 'timeline',
        layoutImageUrl: '',
        hostAnswer: '',
        hostSolution: null,
        hints: [],
        hintRequests: [],
        locked: Boolean(data.locked),
        hintUsed: Boolean(data.hintUsed),
        myJoker: prev?.myJoker || null,
        jokerRoster: prev?.jokerRoster || null,
        copiedAnswer: null,
        silenced: false,
        roundNotes: [],
        booster: null,
        lateBooster: prev?.lateBooster || null
      }));
      setCurrentView('quiz-game');
      setError('');
    });

    socket.on('quiz-booster-start', (data) => {
      setPlayMode('quiz');
      setGameData((prev) => ({
        ...(prev || {}),
        mode: 'quiz',
        phase: 'booster',
        quizName: data.quizName,
        hostId: data.hostId,
        hostName: data.hostName || '',
        question: null,
        questionIndex: data.questionIndex,
        totalQuestions: data.totalQuestions,
        players: data.players,
        booster: { validFrom: data.validFrom, validTo: data.validTo },
        reveal: null,
        copiedAnswer: null,
        silenced: false,
        roundNotes: [],
        expectedAnswer: '',
        myJoker: prev?.myJoker && prev.phase === 'booster' ? prev.myJoker : null,
        jokerRoster: prev?.jokerRoster || null,
        lateBooster: null
      }));
      setCurrentView('quiz-game');
      setError('');
    });

    socket.on('quiz-own-joker', (data) => {
      setGameData((prev) => (prev ? { ...prev, myJoker: data.joker } : prev));
    });

    socket.on('quiz-catchup-booster', (data) => {
      setGameData((prev) => (prev ? {
        ...prev,
        lateBooster: {
          card: data.card,
          validFrom: data.validFrom,
          validTo: data.validTo,
          sittingOut: Boolean(data.sittingOut)
        }
      } : prev));
    });

    socket.on('quiz-jokers', (data) => {
      setGameData((prev) => (prev ? { ...prev, jokerRoster: data.players || [] } : prev));
    });

    socket.on('quiz-hold', (data) => {
      setGameData((prev) => (
        prev ? {
          ...prev,
          phase: 'hold',
          questionIndex: data.questionIndex,
          hostId: data.hostId || prev.hostId,
          players: data.players,
          teamMode: typeof data.teamMode === 'boolean' ? data.teamMode : Boolean(prev.teamMode),
          teams: Array.isArray(data.teams) ? data.teams : (prev.teams || []),
          answersVisible: Boolean(data.answersVisible),
          expectedAnswer: data.full ? (data.expectedAnswer || '') : '',
          hostAnswer: data.full ? (data.expectedAnswer || '') : '',
          answerImageUrl: data.full ? (data.answerImageUrl || '') : '',
          answerVideoUrl: data.full ? (data.answerVideoUrl || '') : '',
          solutionItems: data.full ? (data.solutionItems || []) : [],
          layoutMode: data.layoutMode || prev.layoutMode || 'timeline',
          layoutImageUrl: data.full ? (data.layoutImageUrl || '') : '',
          suggestedPoints: data.suggestedPoints || prev.suggestedPoints
        } : prev
      ));
    });

    socket.on('quiz-copied-answer', (data) => {
      setGameData((prev) => (prev ? { ...prev, copiedAnswer: data } : prev));
    });

    socket.on('quiz-silenced', (data) => {
      setGameData((prev) => (
        prev && prev.questionIndex === data.questionIndex ? { ...prev, silenced: true } : prev
      ));
    });

    socket.on('quiz-round-note', (data) => {
      setGameData((prev) => (
        prev ? { ...prev, roundNotes: data.notes || [] } : prev
      ));
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
          answersVisible: false,
          hostId: data.hostId,
          layoutMode: data.layoutMode || prev.layoutMode || 'timeline',
          suggestedPoints: data.suggestedPoints || prev.suggestedPoints || 1,
          corrections: data.full ? (data.corrections || {}) : {},
          gainPreview: data.full ? (data.preview || []) : [],
          players: data.players,
          teamMode: typeof data.teamMode === 'boolean' ? data.teamMode : Boolean(prev.teamMode),
          teams: Array.isArray(data.teams) ? data.teams : (prev.teams || []),
          expectedAnswer: data.full ? (data.expectedAnswer || '') : '',
          answerImageUrl: data.full ? (data.answerImageUrl || '') : '',
          answerVideoUrl: data.full ? (data.answerVideoUrl || '') : '',
          solutionItems: data.full ? (data.solutionItems || []) : [],
          layoutImageUrl: data.full ? (data.layoutImageUrl || '') : ''
        } : prev
      ));
    });

    socket.on('quiz-corrections-updated', (data) => {
      setGameData((prev) => (
        prev ? { ...prev, corrections: data.corrections, gainPreview: data.preview || [] } : prev
      ));
    });

    socket.on('quiz-reveal', (data) => {
      setGameData((prev) => (
        prev ? {
          ...prev,
          phase: 'reveal',
          reveal: data,
          answerImageUrl: data.answerImageUrl || prev.answerImageUrl || '',
          answerVideoUrl: data.answerVideoUrl || prev.answerVideoUrl || '',
          solutionItems: data.solutionItems || prev.solutionItems || [],
          layoutMode: data.layoutMode || prev.layoutMode || 'timeline',
          layoutImageUrl: data.layoutImageUrl || prev.layoutImageUrl || '',
          players: data.players,
          hostId: data.hostId || prev.hostId
        } : prev
      ));
    });

    socket.on('quiz-ended', (data) => {
      setGameData((prev) => ({ ...(prev || {}), results: data.results }));
      setCurrentView('results');
    });

    socket.on('quiz-scores', (data) => {
      setGameData((prev) => {
        if (!prev || prev.mode !== 'quiz') return prev;
        const scores = new Map((data.players || []).map((entry) => [entry.id, entry.score]));
        return {
          ...prev,
          players: (prev.players || []).map((entry) => (
            scores.has(entry.id) ? { ...entry, score: scores.get(entry.id) } : entry
          ))
        };
      });
    });

    socket.on('quiz-hint', (data) => {
      setGameData((prev) => (
        prev && prev.questionIndex === data.questionIndex
          ? { ...prev, hints: data.hints || [] }
          : prev
      ));
    });

    socket.on('quiz-hint-requests', (data) => {
      setGameData((prev) => (prev ? { ...prev, hintRequests: data.requests || [] } : prev));
    });

    socket.on('quiz-host-answer', (data) => {
      setGameData((prev) => (
        prev && prev.questionIndex === data.questionIndex
          ? { ...prev, hostAnswer: data.expectedAnswer || '', hostSolution: data.solution || null }
          : prev
      ));
    });

    socket.on('team-chat', (data) => {
      setGameData((prev) => (
        prev ? { ...prev, teamChat: data.messages || [], teamChatTeam: data.team || null } : prev
      ));
    });

    socket.on('quiz-error', (data) => {
      setError(data.message || 'Action impossible');
    });

    socket.on('quiz-melange', (data) => {
      const id = Date.now();
      setGameData((prev) => (
        prev ? { ...prev, melange: { id, username: data.username || '' } } : prev
      ));
      setTimeout(() => {
        setGameData((prev) => (
          prev && prev.melange?.id === id ? { ...prev, melange: null } : prev
        ));
      }, 3800);
    });

    socket.on('join-error', (data) => {
      clearSeat();
      setError(data.message);
      setCurrentView((view) => (view === 'rejoin' ? 'modes' : view));
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
      socket.off('quiz-booster-start');
      socket.off('quiz-catchup-booster');
      socket.off('quiz-own-joker');
      socket.off('quiz-jokers');
      socket.off('quiz-hold');
      socket.off('quiz-copied-answer');
      socket.off('quiz-silenced');
      socket.off('quiz-round-note');
      socket.off('quiz-progress');
      socket.off('quiz-correction');
      socket.off('quiz-corrections-updated');
      socket.off('quiz-reveal');
      socket.off('quiz-ended');
      socket.off('quiz-scores');
      socket.off('quiz-hint');
      socket.off('quiz-hint-requests');
      socket.off('quiz-host-answer');
      socket.off('quiz-error');
      socket.off('quiz-melange');
      socket.off('team-chat');
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

  const handleLogin = () => {
    if (!username.trim()) {
      setError('Veuillez entrer un pseudo');
      return;
    }

    const cleanName = username.trim();
    localStorage.setItem('animeQuizUsername', cleanName);
    setUsername(cleanName);
    setIsLoggedIn(true);
    setCurrentView('modes');
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
    
    clearSeat();
    localStorage.removeItem('animeQuizUsername');
    setUsername('');
    setIsLoggedIn(false);
    setCurrentView('login');
    setLobby(null);
    setPlayer(null);
    setGameData(null);
    setSuccess('Déconnexion réussie !');
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
    clearSeat();
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
      case 'rejoin':
        return (
          <div className="container">
            <div className="card">
              <h2 style={{ textAlign: 'center' }}>Reconnexion à la partie...</h2>
            </div>
          </div>
        );

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
                <h1 className="stage-title">
                  Bully's Lair
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
                  <Icon name="pad" tone="mark" />Connexion
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
                    if (e.key === 'Enter') handleLogin();
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
                  type="button"
                  onClick={handleLogin}
                  className="btn btn-success"
                  style={{ width: '100%', margin: 0 }}
                >
                  <Icon name="go" />Entrer
                </button>

                <div style={{ 
                  marginTop: '30px', 
                  paddingTop: '20px', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <button type="button" className="btn btn-danger" onClick={() => setCurrentView('admin-login')}>
                    <Icon name="lock" />Connexion Admin
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
                  <span className="mode-card-title"><Icon name="quiz" tone="mark" />Quiz</span>
                  <span>Questions à choix, vrai/faux, texte libre, images, vidéos, et quelques blind tests.</span>
                </button>
                <button type="button" className="mode-card" onClick={() => chooseMode('music')}>
                  <span className="mode-card-title"><Icon name="music" tone="cyan" />Music Quiz</span>
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
              <h1 style={{ textAlign: 'center', marginBottom: '8px' }}><Icon name="quiz" tone="mark" />Quiz</h1>
              <p style={{ textAlign: 'center', marginBottom: '16px', opacity: 0.85 }}>
                Choisis un quiz. Une partie déjà lancée se rejoint en cours.
              </p>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button type="button" className="btn" onClick={() => setCurrentView('modes')}>
                  <Icon name="back" />Changer de mode
                </button>
              </div>
              {quizzes.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.8 }}>
                  <Icon name="quiz" tone="hero" />
                  <p>Aucun quiz disponible pour le moment.</p>
                </div>
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
                        background: '#14141c',
                        color: 'white',
                        border: '3px solid #ff2347',
                        borderRadius: '4px',
                        boxShadow: '5px 5px 0 #1f6dff',
                        padding: '22px',
                        cursor: quiz.questionCount ? 'pointer' : 'not-allowed',
                        opacity: quiz.questionCount ? 1 : 0.55,
                        fontFamily: 'inherit'
                      }}
                    >
                      <div style={{ color: '#ff2347', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 8 }}>{quiz.name}</div>
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
              <h1 className="stage-title">
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
                  background: '#14141c',
                  borderRadius: '10px',
                  border: '3px solid #1f6dff'
                }}>
                  <div>
                    <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>Connecté en tant que :</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginTop: '5px' }}>
                      <Icon name="pad" tone="cyan" />{username}
                    </div>
                  </div>
                  <button type="button" className="btn btn-danger" onClick={handleLogout}>
                    <Icon name="exit" />Déconnexion
                  </button>
                </div>
                
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}><Icon name="list" tone="mark" />Quiz musicaux</h3>
                
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <button type="button" className="btn" onClick={() => setCurrentView('modes')}>
                    <Icon name="back" />Changer de mode
                  </button>
                </div>
                
                {rooms.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: 0.8, padding: '20px' }}>
                    <Icon name="music" tone="hero" />
                    <p>Aucun quiz disponible pour le moment</p>
                  </div>
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
                          background: '#14141c',
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
                          e.currentTarget.style.boxShadow = '6px 6px 0 #ff2347';
                          e.currentTarget.style.borderColor = '#ff2347';
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
                          background: 'rgba(255, 35, 71, 0.9)',
                          color: '#000',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          <Icon name="music" bare /> {room.musicLinks.length}
                        </div>

                        <h4 style={{ 
                          margin: '0 0 15px 0', 
                          color: '#ff2347', 
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
                            <Icon name="play" tone="cyan" />Cliquer pour rejoindre
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
            onSetTeamMode={(enabled) => socket.emit('set-team-mode', { enabled })}
            onChooseTeam={(team) => socket.emit('choose-team', { team })}
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
            onRequestHint={() => socket.emit('quiz-request-hint')}
            onSendHint={(playerId, words) => socket.emit('quiz-send-hint', { playerId, words })}
            onPlayJoker={(payload) => socket.emit('play-joker', payload)}
            onTeamChat={(text) => socket.emit('team-chat', { text })}
            onChooseTeam={(team) => socket.emit('choose-team', { team })}
            onDismissCatchup={() => setGameData((prev) => (prev ? { ...prev, lateBooster: null } : prev))}
            onBeginScoring={() => socket.emit('quiz-begin-scoring')}
            onStartQuestion={() => socket.emit('quiz-booster-done')}
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
                <Icon name="trophy" tone="mark" />Résultats finaux
              </h2>
              <div className="results-container">
                <div className="score-board">
                  {gameData.results
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((result, index) => (
                      <div key={result.username} className={`score-card ${index === 0 ? 'winner' : ''}`}>
                        <h3>{result.username}</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: index === 0 ? '#111318' : 'white' }}>
                          {result.totalScore} pts
                        </div>
                        {index === 0 && <div><Icon name="crown" />Gagnant</div>}
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
                <Icon name="lock" tone="mark" />Connexion administrateur
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
                <button type="button" className="btn btn-danger" onClick={() => setCurrentView('login')}>
                  <Icon name="back" />Retour
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
    <div className={isLoggedIn && username ? 'App has-logout' : 'App'}>
      {/* Bouton de déconnexion global */}
      {isLoggedIn && username && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000
        }}>
          <button type="button" className="btn btn-danger" onClick={handleLogout} style={{ margin: 0 }}>
            <Icon name="exit" />Déconnexion ({username})
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
