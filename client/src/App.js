import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Lobby from './components/Lobby';
import Game from './components/Game';
import ClassicGame from './components/ClassicGame';
import AdminPanel from './components/AdminPanel';
import Icon from './components/ArcadeIcon';
import { playDropSound } from './components/JokerCards';
import CardVault, { RELIC_HASH } from './components/CardVault';
import AcademyGuide, { ACADEMY_HASH } from './components/AcademyGuide';
import PokeArena, { ARENA_HASH } from './components/PokeArena';
import PokeSwarm, { SWARM_HASH } from './components/PokeSwarm';
import SonicBonk, { BONK_HASH } from './components/SonicBonk';
import PokeRush, { RUSH_HASH } from './components/PokeRush';
import Portfolio, { PORTFOLIO_HASH } from './components/Portfolio';
import GameShelf, { GAMES_HASH } from './components/GameShelf';
import { useAccount, logout as accountLogout } from './components/account';
import AuthPanel from './components/AuthPanel';
import HubHome from './components/HubHome';
import LegalPage, { PRIVACY_HASH, TERMS_HASH } from './components/LegalPage';
import { readAdminSession, storeAdminSession, clearAdminSession } from './utils/adminSession';
import './index.css';

const socket = io(process.env.REACT_APP_SERVER_URL || window.location.origin);
const SEAT_KEY = 'animeQuizSeat';

// Lien partagé en /academy, /swarm… (pour un aperçu Discord adapté) : on repasse en #academy, #swarm…
const SECRET_PATHS = ['academy', 'swarm', 'arena', 'bonk', 'reliques', 'pokerush', 'portfolio', 'jeux', 'terms', 'privacy'];
(() => {
  const page = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (SECRET_PATHS.includes(page) && !window.location.hash) window.history.replaceState(null, '', `/${window.location.search}#${page}`);
})();

const secretViewFromHash = () => {
  if (window.location.hash === RELIC_HASH) return 'reliques';
  if (window.location.hash === ACADEMY_HASH) return 'academy';
  if (window.location.hash === ARENA_HASH) return 'arena';
  if (window.location.hash === SWARM_HASH) return 'swarm';
  if (window.location.hash === BONK_HASH) return 'bonk';
  if (window.location.hash === RUSH_HASH) return 'pokerush';
  if (window.location.hash === PORTFOLIO_HASH) return 'portfolio';
  if (window.location.hash === GAMES_HASH) return 'jeux';
  if (window.location.hash === TERMS_HASH) return 'terms';
  if (window.location.hash === PRIVACY_HASH) return 'privacy';
  return null;
};

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

const FULLSCREEN_VIEWS = ['home', 'modes', 'login', 'reliques', 'academy', 'bonk', 'pokerush', 'swarm', 'arena', 'terms', 'privacy', 'portfolio', 'jeux'];

function App() {
  const [currentView, setCurrentView] = useState(() => secretViewFromHash() || 'login');
  const [username, setUsername] = useState('');
  const account = useAccount();
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
  const [adminSession, setAdminSession] = useState(readAdminSession);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => Boolean(readAdminSession()));
  const [dash, setDash] = useState(0);
  const firstView = useRef(true);

  // Changement de page : une bande bleue et or traverse l'écran, la page arrive dans son sillage.
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return undefined;
    }
    const id = Date.now();
    setDash(id);
    const timer = setTimeout(() => setDash((current) => (current === id ? 0 : current)), 950);
    return () => clearTimeout(timer);
  }, [currentView]);

  // Vérifier si un utilisateur est déjà connecté au chargement
  useEffect(() => {
    const secret = secretViewFromHash();
    if (secret) {
      setCurrentView(secret);
      return undefined;
    }
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

  }, []);

  // Compte obligatoire : connecté → page d'accueil avec le pseudo du compte
  useEffect(() => {
    if (!account.ready) return;
    if (account.user) {
      setUsername(account.user.name);
      setIsLoggedIn(true);
      setCurrentView((view) => (view === 'login' || view === 'modes' ? 'home' : view));
    } else {
      setIsLoggedIn(false);
      setCurrentView((view) => (view === 'home' || view === 'modes' ? 'login' : view));
    }
  }, [account.ready, account.user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onHash = () => {
      const secret = secretViewFromHash();
      if (secret) setCurrentView(secret);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
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
        jokersEnabled: data.jokersEnabled !== false,
        solo: Boolean(data.solo),
        teams: data.teams || [],
        teamChat: [],
        deadline: data.deadline,
        answered: data.answered,
        answeredIds: data.answeredIds || [],
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
        timelineStart: '',
        timelineEnd: '',
        correctIndexes: [],
        hostAnswer: '',
        hostSolution: null,
        hints: [],
        hintRequests: [],
        locked: Boolean(data.locked),
        hintUsed: Boolean(data.hintUsed),
        myJoker: prev?.myJoker || null,
        jokerRoster: prev?.jokerRoster || null,
        copiedAnswer: null,
        rumors: null,
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
        rumors: null,
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
          timelineStart: data.full ? (data.timelineStart || '') : (prev.timelineStart || ''),
          timelineEnd: data.full ? (data.timelineEnd || '') : (prev.timelineEnd || ''),
          correctIndexes: data.full ? (data.correctIndexes || []) : [],
          suggestedPoints: data.suggestedPoints || prev.suggestedPoints
        } : prev
      ));
    });

    socket.on('quiz-copied-answer', (data) => {
      setGameData((prev) => (prev ? { ...prev, copiedAnswer: data } : prev));
    });

    socket.on('quiz-rumor', (data) => {
      setGameData((prev) => (prev ? { ...prev, rumors: data } : prev));
    });

    socket.on('quiz-unsilenced', (data) => {
      setGameData((prev) => (
        prev && prev.questionIndex === data.questionIndex ? { ...prev, silenced: false } : prev
      ));
    });

    socket.on('quiz-silenced', (data) => {
      playDropSound('silence');
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
        prev ? { ...prev, answered: data.answered, answeredIds: data.answeredIds || [], totalPlayers: data.totalPlayers } : prev
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
          expectedAnswer: data.expectedAnswer || '',
          answerImageUrl: data.answerImageUrl || '',
          answerVideoUrl: data.answerVideoUrl || '',
          solutionItems: data.solutionItems || [],
          layoutImageUrl: data.layoutImageUrl || '',
          timelineStart: data.timelineStart || prev.timelineStart || '',
          timelineEnd: data.timelineEnd || prev.timelineEnd || '',
          correctIndexes: data.correctIndexes || []
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
          timelineStart: data.timelineStart || prev.timelineStart || '',
          timelineEnd: data.timelineEnd || prev.timelineEnd || '',
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

    socket.on('quiz-table-card', (data) => {
      const id = Date.now();
      const card = data.card || 'melange';
      setGameData((prev) => (
        prev ? { ...prev, tableShow: { id, card, username: data.username || '' } } : prev
      ));
      setTimeout(() => {
        setGameData((prev) => (
          prev && prev.tableShow?.id === id ? { ...prev, tableShow: null } : prev
        ));
      }, 4200);
    });

    socket.on('join-error', (data) => {
      clearSeat();
      setError(data.message);
      setCurrentView((view) => (view === 'rejoin' ? 'home' : view));
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
      socket.off('quiz-rumor');
      socket.off('quiz-unsilenced');
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
      socket.off('quiz-table-card');
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
    accountLogout();
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

  const handleAdminAuth = async () => {
    try {
      const response = await axios.post('/api/admin/login', {
        username: adminAuth.username.trim(),
        password: adminAuth.password
      });
      const session = storeAdminSession(response.data);
      setAdminSession(session);
      setIsAdminAuthenticated(true);
      setCurrentView('admin');
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Identifiants incorrects');
    }
  };

  const handleStartGame = (numberOfSongs) => {
    if (lobby && player) {
      socket.emit('start-game', { roomId: player.roomId, numberOfSongs });
    }
  };

  const handleStartQuiz = (numberOfQuestions, options = {}) => {
    if (lobby && player) {
      socket.emit('start-quiz', {
        quizId: player.roomId,
        numberOfQuestions,
        solo: Boolean(options.solo)
      });
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
    fetchRooms();
    fetchQuizzes();
  };

  const renderHome = () => (
    <HubHome
      name={account.user?.name || username}
      onQuiz={() => chooseMode('quiz')}
      onMusic={() => chooseMode('music')}
      onAdmin={() => setCurrentView(adminSession?.token ? 'admin' : 'admin-login')}
      onShelf={() => { window.location.hash = GAMES_HASH; setCurrentView('jeux'); }}
      onPortfolio={() => { window.location.hash = PORTFOLIO_HASH; setCurrentView('portfolio'); }}
      onGame={(game) => {
        if (!game.hash) { chooseMode('quiz'); return; }
        window.location.hash = game.hash;
        setCurrentView(secretViewFromHash() || 'home');
      }}
    />
  );

  const renderCurrentView = () => {
    // Pages ouvertes à tous ; le reste demande un compte
    const PUBLIC_VIEWS = ['login', 'portfolio', 'jeux', 'terms', 'privacy', 'academy', 'admin-login', 'admin', 'rejoin'];
    if (!PUBLIC_VIEWS.includes(currentView) && !account.user) {
      return (
        <div className="container">
          <div className="card">
            {account.ready ? (
              <div style={{ maxWidth: '420px', margin: '0 auto', padding: '10px' }}>
                <p className="auth-gate">Un compte est nécessaire pour jouer : connecte-toi ou crée-le en dix secondes.</p>
                <AuthPanel returnHash={window.location.hash} title="Connecte-toi pour jouer" />
                <div className="login-games">
                  <button type="button" className="btn btn-quiet" onClick={() => { window.history.replaceState(null, '', '/'); setCurrentView('login'); }}>Retour à l’accueil</button>
                </div>
              </div>
            ) : <div className="loading">Chargement</div>}
          </div>
        </div>
      );
    }
    switch (currentView) {
      case 'rejoin':
        return (
          <div className="container">
            <div className="card">
              <div className="loading">Reconnexion à la partie</div>
            </div>
          </div>
        );

      case 'home':
      case 'modes':
        return renderHome();

      case 'login':
        if (account.user) return renderHome();
        return (
          <div className="container">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <h1 className="stage-title">
                  Bully's Lair
                </h1>
              </div>

              <p style={{ textAlign: 'center', marginBottom: '15px', fontSize: '1.2rem', opacity: 0.9 }}>
                Fais toi bully par tes potes avec un maximum de plaisir toujours :)
              </p>

              <div className="login-games">
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => { window.location.hash = GAMES_HASH; setCurrentView('jeux'); }}
                >
                  <Icon name="pad" />Voir les jeux
                </button>
                <button
                  type="button"
                  className="login-portfolio"
                  onClick={() => { window.location.hash = PORTFOLIO_HASH; setCurrentView('portfolio'); }}
                >
                  Portfolio
                </button>
              </div>

              <div style={{ maxWidth: '420px', margin: '0 auto', padding: '20px 10px' }}>
                <AuthPanel />

                <div className="login-split">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setCurrentView(adminSession?.token ? 'admin' : 'admin-login')}
                  >
                    <Icon name="lock" />Connexion Admin
                  </button>
                </div>
                <p className="login-legal">
                  <a href="/#terms">Conditions d’utilisation</a> · <a href="/#privacy">Confidentialité</a>
                </p>
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
                <button type="button" className="btn" onClick={() => setCurrentView('home')}>
                  <Icon name="back" />Accueil
                </button>
              </div>
              {quizzes.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.8 }}>
                  <Icon name="quiz" tone="hero" />
                  <p>Aucun quiz disponible pour le moment.</p>
                </div>
              ) : (
                <div className="pick-grid">
                  {quizzes.map((quiz) => (
                    <button
                      key={quiz._id}
                      type="button"
                      className="pick-card"
                      disabled={!quiz.questionCount}
                      onClick={() => quiz.questionCount && handleJoinQuiz(quiz._id)}
                    >
                      <div className="pick-title">{quiz.name}</div>
                      <div className="pick-desc">{quiz.description}</div>
                      <div className="pick-meta">
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
                <div className="ce-user-panel">
                  <div>
                    <span className="ce-user-label">Connecté en tant que</span>
                    <div className="ce-user-name">
                      <Icon name="pad" tone="cyan" />{username}
                    </div>
                  </div>
                  <button type="button" className="btn btn-danger" onClick={handleLogout}>
                    <Icon name="exit" />Déconnexion
                  </button>
                </div>
                
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}><Icon name="list" tone="mark" />Quiz musicaux</h3>
                
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <button type="button" className="btn" onClick={() => setCurrentView('home')}>
                    <Icon name="back" />Changer de mode
                  </button>
                </div>
                
                {rooms.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: 0.8, padding: '20px' }}>
                    <Icon name="music" tone="hero" />
                    <p>Aucun quiz disponible pour le moment</p>
                  </div>
                ) : (
                  <div className="pick-grid" style={{ marginBottom: '30px' }}>
                    {rooms.map(room => (
                      <div
                        key={room._id}
                        className="pick-card"
                        onClick={() => handleJoinLobby(room._id)}
                      >
                        <div className="pick-count">
                          <Icon name="music" bare /> {room.musicLinks.length}
                        </div>
                        <h4 className="pick-title">{room.name}</h4>
                        {room.description && (
                          <p className="pick-desc">{room.description}</p>
                        )}
                        <div className="pick-meta">
                          <Icon name="play" bare />Cliquer pour rejoindre
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
            onSetJokers={(enabled) => socket.emit('set-jokers', { enabled })}
            onSetJokerPool={(cards) => socket.emit('set-joker-pool', { cards })}
            onChooseTeam={(team) => socket.emit('choose-team', { team })}
            onChooseAvatar={(avatar) => socket.emit('choose-avatar', { avatar })}
          />
        );

      case 'quiz-game':
        return (
          <ClassicGame
            gameData={gameData}
            lobby={lobby}
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
                  placeholder="Nom"
                  value={adminAuth.username}
                  onChange={(e) => setAdminAuth({ ...adminAuth, username: e.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleAdminAuth();
                  }}
                  className="input"
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={adminAuth.password}
                  onChange={(e) => setAdminAuth({ ...adminAuth, password: e.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleAdminAuth();
                  }}
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

      case 'reliques':
        return (
          <CardVault onClose={() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setCurrentView('login');
          }} />
        );

      case 'academy':
        return (
          <AcademyGuide onClose={() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setCurrentView('login');
          }} />
        );

      case 'bonk':
        return (
          <SonicBonk onClose={() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setCurrentView('login');
          }} />
        );

      case 'terms':
      case 'privacy':
        return (
          <LegalPage
            doc={currentView}
            onClose={() => { window.history.replaceState(null, '', '/' + window.location.search); setCurrentView('login'); }}
            onOther={() => { window.location.hash = currentView === 'terms' ? PRIVACY_HASH : TERMS_HASH; }}
          />
        );

      case 'portfolio':
      case 'jeux': {
        const toLogin = () => {
          window.history.replaceState(null, '', '/' + window.location.search);
          setCurrentView('login');
        };
        const openGame = (game) => {
          if (!game.hash) { toLogin(); return; }
          window.location.hash = game.hash;
          setCurrentView(secretViewFromHash() || 'login');
        };
        const showGames = () => { window.location.hash = GAMES_HASH; setCurrentView('jeux'); };
        const showPortfolio = () => { window.location.hash = PORTFOLIO_HASH; setCurrentView('portfolio'); };
        return currentView === 'portfolio'
          ? <Portfolio onClose={toLogin} onGames={showGames} onOpen={openGame} />
          : <GameShelf onClose={toLogin} onOpen={openGame} onPortfolio={showPortfolio} />;
      }

      case 'pokerush':
        return (
          <PokeRush onClose={() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setCurrentView('login');
          }} />
        );

      case 'swarm':
        return (
          <PokeSwarm onClose={() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setCurrentView('login');
          }} />
        );

      case 'arena':
        return (
          <PokeArena onClose={() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setCurrentView('login');
          }} />
        );

      case 'admin':
        return (
          <AdminPanel
            admin={adminSession}
            onBack={() => {
              clearAdminSession();
              setAdminSession(null);
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
    <div className={isLoggedIn && username && !FULLSCREEN_VIEWS.includes(currentView) ? 'App has-logout' : 'App'}>
      {/* Bouton de déconnexion global (les jeux plein écran ont leur propre menu de compte) */}
      {isLoggedIn && username && !FULLSCREEN_VIEWS.includes(currentView) && (
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
      <div className="ce-page" key={currentView}>
        {renderCurrentView()}
      </div>
      {dash ? <i key={dash} className="ce-dash" aria-hidden="true" /> : null}
    </div>
  );
}

export default App;
