const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['qcm', 'boolean', 'text', 'blank', 'music'],
    required: true
  },
  prompt: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  musicUrl: { type: String, default: '' },
  options: { type: [String], default: [] },
  correctIndexes: { type: [Number], default: [] },
  correctBoolean: { type: Boolean, default: true },
  acceptedAnswers: { type: [String], default: [] },
  blanks: { type: [String], default: [] },
  points: { type: Number, default: 1 },
  timeLimit: { type: Number, default: 20 }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  shuffle: { type: Boolean, default: false },
  questions: { type: [QuizQuestionSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

const quizLobbies = new Map();
const quizPlayers = new Map();
const quizTimers = new Map();

function normalizeAnswer(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function splitAlternatives(value) {
  return String(value ?? '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function acceptedList(raw) {
  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => splitAlternatives(entry));
  }
  return splitAlternatives(raw);
}

function matchesAny(value, accepted) {
  const normalized = normalizeAnswer(value);
  if (!normalized) return false;
  return acceptedList(accepted).some((candidate) => normalizeAnswer(candidate) === normalized);
}

function playableQuestions(questions) {
  return (questions || []).filter((question) => question.type !== 'blank');
}

function blankSlots(prompt) {
  const matches = String(prompt || '').match(/_{3,}/g);
  return matches ? matches.length : 0;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function isObjectiveCorrect(question, answer) {
  if (answer == null) return false;

  if (question.type === 'qcm') {
    const selected = (Array.isArray(answer) ? answer : [answer])
      .map((value) => Number(value))
      .sort((a, b) => a - b);
    const correct = [...(question.correctIndexes || [])]
      .map((value) => Number(value))
      .sort((a, b) => a - b);
    if (!selected.length || selected.some((value) => Number.isNaN(value))) return false;
    return selected.length === correct.length && selected.every((value, index) => value === correct[index]);
  }

  if (question.type === 'boolean') {
    return Boolean(answer) === Boolean(question.correctBoolean);
  }

  if (question.type === 'text' || question.type === 'music') {
    return matchesAny(answer, question.acceptedAnswers);
  }

  if (question.type === 'blank') {
    const given = Array.isArray(answer) ? answer : [];
    const expected = question.blanks || [];
    if (!expected.length || given.length !== expected.length) return false;
    return expected.every((slot, index) => matchesAny(given[index], [slot]));
  }

  return false;
}

function correctLabel(question) {
  if (question.type === 'qcm') {
    return (question.correctIndexes || [])
      .map((index) => question.options[index])
      .filter(Boolean)
      .join(' · ');
  }
  if (question.type === 'boolean') return question.correctBoolean ? 'Vrai' : 'Faux';
  if (question.type === 'text' || question.type === 'music') {
    const answers = acceptedList(question.acceptedAnswers);
    return answers.length ? answers.join(' / ') : 'Correction du chef';
  }
  if (question.type === 'blank') {
    let cursor = 0;
    return String(question.prompt || '').replace(/_{3,}/g, () => {
      const value = splitAlternatives(question.blanks[cursor] || '…')[0] || '…';
      cursor += 1;
      return value;
    });
  }
  return '';
}

function formatPlayerAnswer(question, answer) {
  if (answer == null || answer === '') return 'Pas de réponse';
  if (question.type === 'qcm') {
    const options = question.options || [];
    const indexes = Array.isArray(answer) ? answer : [answer];
    return indexes.map((index) => options[index] || '?').join(', ');
  }
  if (question.type === 'boolean') return answer ? 'Vrai' : 'Faux';
  if (question.type === 'blank') {
    return (Array.isArray(answer) ? answer : []).map((value) => value || '…').join(' | ');
  }
  return String(answer);
}

function publicQuestion(question, index, total) {
  return {
    index,
    total,
    type: question.type,
    prompt: question.prompt || '',
    imageUrl: question.imageUrl || '',
    videoUrl: question.type === 'music' ? '' : (question.videoUrl || ''),
    musicUrl: question.type === 'music' ? (question.musicUrl || '') : '',
    options: question.type === 'qcm' ? (question.options || []) : [],
    multiple: question.type === 'qcm' && (question.correctIndexes || []).length > 1,
    blankCount: question.type === 'blank' ? (question.blanks || []).length : 0,
    points: question.points || 1,
    timeLimit: question.timeLimit || 0
  };
}

function sanitizeQuestion(raw) {
  const type = raw.type;
  const rawOptions = Array.isArray(raw.options) ? raw.options : [];
  const options = [];
  const indexMap = new Map();

  rawOptions.forEach((option, index) => {
    const text = String(option ?? '').trim();
    if (!text) return;
    indexMap.set(index, options.length);
    options.push(text);
  });

  let correctIndexes = [...new Set((raw.correctIndexes || []).map((value) => Number(value)))]
    .map((index) => indexMap.get(index))
    .filter((index) => index !== undefined);

  if (raw.multiple === false) {
    correctIndexes = correctIndexes.slice(0, 1);
  }

  const acceptedAnswers = acceptedList(raw.acceptedAnswers);
  const blanks = (raw.blanks || [])
    .map((value) => String(value ?? '').trim())
    .filter((value) => value.length > 0);

  return {
    type,
    prompt: String(raw.prompt || '').trim(),
    imageUrl: String(raw.imageUrl || '').trim(),
    videoUrl: type === 'music' ? '' : String(raw.videoUrl || '').trim(),
    musicUrl: type === 'music' ? String(raw.musicUrl || '').trim() : '',
    options: type === 'qcm' ? options : [],
    correctIndexes: type === 'qcm' ? correctIndexes : [],
    correctBoolean: raw.correctBoolean !== false,
    acceptedAnswers: (type === 'text' || type === 'music') ? acceptedAnswers : [],
    blanks: type === 'blank' ? blanks : [],
    points: Math.max(1, Number(raw.points) || 1),
    timeLimit: Math.max(0, Number(raw.timeLimit) || 0)
  };
}

function validateQuestion(question, position) {
  const label = `Question ${position}`;
  const types = ['qcm', 'boolean', 'text', 'blank', 'music'];
  if (!types.includes(question.type)) return `${label} : type invalide`;

  const urlError = ['imageUrl', 'videoUrl', 'musicUrl'].map((field) => {
    const value = question[field];
    if (value && !isHttpUrl(value)) {
      return `${label} : le lien doit commencer par http:// ou https://`;
    }
    return null;
  }).find(Boolean);
  if (urlError) return urlError;

  const hasPrompt = String(question.prompt || '').trim();
  const hasImage = String(question.imageUrl || '').trim();
  if (!hasPrompt && !hasImage && question.type !== 'music') {
    return `${label} : ajoute un énoncé ou une image`;
  }

  if (question.type === 'qcm') {
    if ((question.options || []).length < 2) return `${label} : au moins 2 choix`;
    if (!(question.correctIndexes || []).length) return `${label} : indique la bonne réponse`;
  }

  if (question.type === 'text' && !(question.acceptedAnswers || []).length) {
    return `${label} : indique au moins une réponse acceptée`;
  }

  if (question.type === 'blank') {
    const slots = blankSlots(question.prompt);
    if (slots < 1) return `${label} : écris ___ à l'emplacement de chaque trou`;
    if ((question.blanks || []).length !== slots) {
      return `${label} : ${slots} trou(s) dans le texte, ${(question.blanks || []).length} réponse(s)`;
    }
  }

  if (question.type === 'music' && !String(question.musicUrl || '').trim()) {
    return `${label} : ajoute le lien du blind test`;
  }

  return null;
}

function playerSnapshot(lobby) {
  return lobby.players.map((player) => ({
    id: player.id,
    username: player.username,
    score: player.score || 0
  }));
}

function publicLobby(lobby) {
  const total = lobby.questions.length || lobby.totalQuestions || 0;
  return {
    roomId: lobby.quizId,
    quizName: lobby.quizName,
    mode: 'quiz',
    hostId: lobby.host?.id || null,
    hostName: lobby.host?.username || lobby.hostName || '',
    players: playerSnapshot(lobby),
    isGameStarted: lobby.isGameStarted,
    totalQuestions: total,
    totalSongs: total
  };
}

function isHostSocket(lobby, socketId) {
  return Boolean(lobby?.host && lobby.host.id === socketId);
}

function clearTimer(quizId) {
  const timer = quizTimers.get(quizId);
  if (timer) clearTimeout(timer);
  quizTimers.delete(quizId);
}

function scoreAnswer(question, answer) {
  const points = question.points || 1;
  if (question.type === 'blank') {
    const given = Array.isArray(answer) ? answer : [];
    const expected = question.blanks || [];
    if (!expected.length) return { gained: 0, correct: false };
    const hits = expected.filter((slot, index) => matchesAny(given[index], [slot])).length;
    return {
      gained: hits === expected.length ? points : Math.floor((points * hits) / expected.length),
      correct: hits > 0 && hits === expected.length
    };
  }
  const correct = isObjectiveCorrect(question, answer);
  return { gained: correct ? points : 0, correct };
}

function pointsFromChef(value) {
  const points = Math.round(Number(value));
  if (!Number.isFinite(points) || points < 0) return 0;
  return Math.min(99, points);
}

function applyScores(lobby, index, corrections) {
  lobby.players.forEach((player) => {
    const gained = pointsFromChef(corrections ? corrections[player.id] : 0);
    player.score = (player.score || 0) + gained;
    player.lastGain = gained;
    player.lastCorrect = gained > 0;
  });
}

function emitReveal(io, lobby, question, index) {
  if (!question) return;
  const payload = {
    questionIndex: index,
    hostId: lobby.host?.id || null,
    correctAnswer: correctLabel(question),
    correctIndexes: question.type === 'qcm' ? (question.correctIndexes || []) : [],
    correctBoolean: question.type === 'boolean' ? Boolean(question.correctBoolean) : null,
    players: lobby.players.map((player) => ({
      id: player.id,
      username: player.username,
      score: player.score || 0,
      answerText: formatPlayerAnswer(question, player.answers[index]),
      correct: Boolean(player.lastCorrect),
      pointsThisRound: player.lastGain || 0
    }))
  };
  lobby.phase = 'reveal';
  io.to(lobby.quizId).emit('quiz-reveal', payload);
}

function closeQuestion(io, quizId) {
  const lobby = quizLobbies.get(quizId);
  if (!lobby || lobby.phase !== 'answering') return;

  clearTimer(quizId);
  const index = lobby.currentQuestion;
  const question = lobby.questions[index];
  if (!question) return;

  lobby.players.forEach((player) => {
    if (!player.answered[index]) {
      player.answered[index] = true;
      player.answers[index] = null;
    }
  });

  lobby.phase = 'correction';
  const corrections = {};
  lobby.players.forEach((player) => {
    corrections[player.id] = 0;
  });
  lobby.pendingCorrections = corrections;
  io.to(quizId).emit('quiz-correction', {
    questionIndex: index,
    hostId: lobby.host?.id || null,
    expectedAnswer: correctLabel(question),
    suggestedPoints: question.points || 1,
    corrections,
    players: lobby.players.map((player) => ({
      id: player.id,
      username: player.username,
      score: player.score || 0,
      answerText: formatPlayerAnswer(question, player.answers[index])
    }))
  });
}

function questionPayload(lobby) {
  const question = lobby.questions[lobby.currentQuestion];
  const index = lobby.currentQuestion;
  return {
    quizName: lobby.quizName,
    hostId: lobby.host?.id || null,
    hostName: lobby.host?.username || lobby.hostName || '',
    question: publicQuestion(question, index, lobby.questions.length),
    questionIndex: index,
    totalQuestions: lobby.questions.length,
    players: playerSnapshot(lobby),
    deadline: lobby.deadline,
    answered: lobby.players.filter((entry) => entry.answered?.[index]).length,
    totalPlayers: lobby.players.length
  };
}

function sendQuestion(io, lobby) {
  const question = lobby.questions[lobby.currentQuestion];
  if (!question) return false;

  const timeLimit = question.timeLimit || 0;
  lobby.deadline = timeLimit ? Date.now() + timeLimit * 1000 : null;
  lobby.hintRequests = [];

  let payload;
  let expectedAnswer = '';
  try {
    expectedAnswer = correctLabel(question);
    payload = questionPayload(lobby);
  } catch (error) {
    return false;
  }

  lobby.phase = 'answering';
  io.to(lobby.quizId).emit('quiz-question', payload);
  if (lobby.host?.id) {
    io.to(lobby.host.id).emit('quiz-host-answer', {
      questionIndex: lobby.currentQuestion,
      expectedAnswer
    });
  }

  clearTimer(lobby.quizId);
  if (timeLimit) {
    quizTimers.set(
      lobby.quizId,
      setTimeout(() => closeQuestion(io, lobby.quizId), timeLimit * 1000)
    );
  }
  return true;
}

function syncQuizSocket(io, socket, lobby) {
  if (!lobby.isGameStarted || lobby.phase === 'lobby' || lobby.phase === 'ended') return;
  const question = lobby.questions[lobby.currentQuestion];
  if (!question) return;

  const person = quizPlayers.get(socket.id);
  socket.emit('quiz-question', {
    ...questionPayload(lobby),
    locked: Boolean(person && !person.isHost && person.answered?.[lobby.currentQuestion]),
    hintUsed: Boolean(person && !person.isHost && person.hintAsked?.[lobby.currentQuestion])
  });

  if (isHostSocket(lobby, socket.id)) {
    socket.emit('quiz-host-answer', {
      questionIndex: lobby.currentQuestion,
      expectedAnswer: correctLabel(question)
    });
    socket.emit('quiz-hint-requests', { requests: lobby.hintRequests || [] });
  } else if (person?.hints?.[lobby.currentQuestion]?.length) {
    const hints = person.hints[lobby.currentQuestion];
    socket.emit('quiz-hint', {
      questionIndex: lobby.currentQuestion,
      words: hints[hints.length - 1],
      hints
    });
  }

  if (lobby.phase === 'correction') {
    socket.emit('quiz-correction', {
      questionIndex: lobby.currentQuestion,
      hostId: lobby.host?.id || null,
      expectedAnswer: correctLabel(question),
      suggestedPoints: question.points || 1,
      corrections: lobby.pendingCorrections || {},
      players: lobby.players.map((entry) => ({
        id: entry.id,
        username: entry.username,
        score: entry.score || 0,
        answerText: formatPlayerAnswer(question, entry.answers[lobby.currentQuestion])
      }))
    });
  }

  if (lobby.phase === 'reveal') {
    emitReveal(io, lobby, question, lobby.currentQuestion);
  }
}

function removeQuizPlayer(io, socket) {
  const person = quizPlayers.get(socket.id);
  if (!person) return;

  const lobby = quizLobbies.get(person.roomId);
  if (lobby) {
    const wasHost = isHostSocket(lobby, socket.id);
    if (wasHost) lobby.host = null;
    lobby.players = lobby.players.filter((entry) => entry.id !== socket.id);
    socket.leave(person.roomId);

    if (!lobby.host && lobby.players.length === 0) {
      clearTimer(lobby.quizId);
      quizLobbies.delete(person.roomId);
    } else {
      io.to(person.roomId).emit('lobby-updated', publicLobby(lobby));
      const index = lobby.currentQuestion;
      if (!wasHost && lobby.phase === 'answering' && lobby.players.length > 0 && lobby.players.every((entry) => entry.answered[index])) {
        closeQuestion(io, lobby.quizId);
      }
    }
  }

  quizPlayers.delete(socket.id);
}

function attachQuiz(app, io) {
  app.get('/api/quizzes', async (req, res) => {
    try {
      const quizzes = await Quiz.find().sort({ createdAt: -1 });
      if (req.query.edit === '1') {
        res.json(quizzes);
        return;
      }
      res.json(quizzes.map((quiz) => ({
        _id: quiz._id,
        name: quiz.name,
        description: quiz.description,
        questionCount: playableQuestions(quiz.questions).length,
        createdAt: quiz.createdAt
      })));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/quizzes/:id', async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        res.status(404).json({ error: 'Quiz introuvable' });
        return;
      }
      if (req.query.edit !== '1') {
        res.json({
          _id: quiz._id,
          name: quiz.name,
          description: quiz.description,
          questionCount: playableQuestions(quiz.questions).length
        });
        return;
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/quizzes', async (req, res) => {
    try {
      const name = String(req.body.name || '').trim();
      if (!name) {
        res.status(400).json({ error: 'Le nom du quiz est requis' });
        return;
      }
      const quiz = new Quiz({
        name,
        description: String(req.body.description || '').trim(),
        shuffle: Boolean(req.body.shuffle),
        questions: []
      });
      await quiz.save();
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/quizzes/:id', async (req, res) => {
    try {
      const name = String(req.body.name || '').trim();
      if (!name) {
        res.status(400).json({ error: 'Le nom du quiz est requis' });
        return;
      }

      const questions = (req.body.questions || [])
        .filter((question) => question.type !== 'blank')
        .map(sanitizeQuestion);
      for (let index = 0; index < questions.length; index += 1) {
        const error = validateQuestion(questions[index], index + 1);
        if (error) {
          res.status(400).json({ error });
          return;
        }
      }

      const quiz = await Quiz.findByIdAndUpdate(
        req.params.id,
        {
          name,
          description: String(req.body.description || '').trim(),
          shuffle: Boolean(req.body.shuffle),
          questions
        },
        { new: true }
      );

      if (!quiz) {
        res.status(404).json({ error: 'Quiz introuvable' });
        return;
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/quizzes/:id', async (req, res) => {
    try {
      await Quiz.findByIdAndDelete(req.params.id);
      res.json({ message: 'Quiz supprimé' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-quiz-lobby', async (data) => {
      try {
        const username = String(data.username || '').trim();
        const quizId = String(data.quizId || '');
        if (!username) {
          socket.emit('join-error', { message: 'Pseudo manquant' });
          return;
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          socket.emit('join-error', { message: 'Quiz introuvable' });
          return;
        }
        const playable = playableQuestions(quiz.questions);
        if (!playable.length) {
          socket.emit('join-error', { message: 'Ce quiz ne contient aucune question' });
          return;
        }

        if (!quizLobbies.has(quizId)) {
          quizLobbies.set(quizId, {
            quizId,
            quizName: quiz.name,
            players: [],
            isGameStarted: false,
            totalQuestions: playable.length,
            questions: [],
            currentQuestion: 0,
            phase: 'lobby',
            host: null,
            hostName: ''
          });
        }

        const lobby = quizLobbies.get(quizId);
        const knownHost = lobby.hostName === username;
        const existingPlayer = lobby.players.find((entry) => entry.username === username);

        if (lobby.isGameStarted && !knownHost && !existingPlayer) {
          socket.emit('join-error', { message: 'La partie a déjà commencé' });
          return;
        }
        if (!lobby.isGameStarted && (existingPlayer || (knownHost && lobby.host))) {
          socket.emit('join-error', { message: 'Ce pseudo est déjà pris' });
          return;
        }

        const becomeHost = !lobby.host && (knownHost || (!lobby.hostName && lobby.players.length === 0));
        if (becomeHost || (knownHost && !lobby.host)) {
          lobby.hostName = username;
          lobby.host = { id: socket.id, username };
          const host = {
            id: socket.id,
            username,
            roomId: quizId,
            isHost: true,
            score: 0,
            answers: {},
            answered: {}
          };
          quizPlayers.set(socket.id, host);
          socket.join(quizId);
          socket.emit('joined-lobby', {
            lobby: publicLobby(lobby),
            player: { ...host, role: 'host' }
          });
          io.to(quizId).emit('lobby-updated', publicLobby(lobby));
          syncQuizSocket(io, socket, lobby);
          return;
        }

        if (existingPlayer && lobby.isGameStarted) {
          quizPlayers.delete(existingPlayer.id);
          existingPlayer.id = socket.id;
          quizPlayers.set(socket.id, existingPlayer);
          socket.join(quizId);
          socket.emit('joined-lobby', {
            lobby: publicLobby(lobby),
            player: { ...existingPlayer, role: 'player' }
          });
          io.to(quizId).emit('lobby-updated', publicLobby(lobby));
          syncQuizSocket(io, socket, lobby);
          return;
        }

        const player = {
          id: socket.id,
          username,
          roomId: quizId,
          isHost: false,
          score: 0,
          answers: {},
          answered: {},
          hints: {}
        };

        lobby.players.push(player);
        lobby.totalQuestions = playable.length;
        lobby.quizName = quiz.name;
        quizPlayers.set(socket.id, player);
        socket.join(quizId);
        socket.emit('joined-lobby', {
          lobby: publicLobby(lobby),
          player: { ...player, role: 'player' }
        });
        io.to(quizId).emit('lobby-updated', publicLobby(lobby));
      } catch (error) {
        socket.emit('join-error', { message: 'Impossible de rejoindre ce quiz' });
      }
    });

    socket.on('start-quiz', async (data) => {
      try {
        const quizId = String(data.quizId || '');
        const lobby = quizLobbies.get(quizId);
        const player = quizPlayers.get(socket.id);

        if (!lobby || !player || !isHostSocket(lobby, socket.id)) {
          socket.emit('start-error', { message: 'Seul le chef peut lancer la partie' });
          return;
        }
        if (!lobby.players.length) {
          socket.emit('start-error', { message: 'Il faut au moins un joueur en plus du chef' });
          return;
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          socket.emit('start-error', { message: 'Quiz introuvable' });
          return;
        }
        const playable = playableQuestions(quiz.questions);
        if (!playable.length) {
          socket.emit('start-error', { message: 'Aucune question dans ce quiz' });
          return;
        }

        let questions = playable.map((question) => question.toObject());
        if (quiz.shuffle) {
          questions = questions.sort(() => Math.random() - 0.5);
        }

        const requested = Number(data.numberOfQuestions);
        if (requested > 0 && requested < questions.length) {
          questions = questions.slice(0, requested);
        }

        lobby.questions = questions;
        lobby.currentQuestion = 0;
        lobby.isGameStarted = true;
        lobby.quizName = quiz.name;
        lobby.players.forEach((entry) => {
          entry.score = 0;
          entry.answers = {};
          entry.answered = {};
          entry.lastGain = 0;
          entry.lastCorrect = false;
        });

        sendQuestion(io, lobby);
      } catch (error) {
        socket.emit('start-error', { message: 'Impossible de démarrer la partie' });
      }
    });

    socket.on('submit-quiz-answer', (data) => {
      const player = quizPlayers.get(socket.id);
      if (!player || player.isHost) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby || lobby.phase !== 'answering') return;

      const index = lobby.currentQuestion;
      if (player.answered[index]) return;

      player.answers[index] = data.answer;
      player.answered[index] = true;

      const answered = lobby.players.filter((entry) => entry.answered[index]).length;
      io.to(lobby.quizId).emit('quiz-progress', {
        answered,
        totalPlayers: lobby.players.length
      });

      if (answered === lobby.players.length) {
        closeQuestion(io, lobby.quizId);
      }
    });

    socket.on('quiz-force-close', () => {
      const player = quizPlayers.get(socket.id);
      if (!player) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby || !isHostSocket(lobby, socket.id)) return;
      closeQuestion(io, lobby.quizId);
    });

    socket.on('update-quiz-corrections', (data) => {
      const player = quizPlayers.get(socket.id);
      if (!player) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby || lobby.phase !== 'correction' || !isHostSocket(lobby, socket.id)) return;

      const sanitized = {};
      Object.entries(data.corrections || {}).forEach(([id, value]) => {
        sanitized[id] = pointsFromChef(value);
      });
      lobby.pendingCorrections = sanitized;
      io.to(lobby.quizId).emit('quiz-corrections-updated', {
        corrections: lobby.pendingCorrections
      });
    });

    socket.on('submit-quiz-correction', (data) => {
      const player = quizPlayers.get(socket.id);
      if (!player) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby || !isHostSocket(lobby, socket.id)) return;

      const index = lobby.currentQuestion;
      const question = lobby.questions[index];
      if (!question) return;

      if (lobby.phase === 'reveal') {
        emitReveal(io, lobby, question, index);
        return;
      }
      if (lobby.phase !== 'correction') return;

      const corrections = data.corrections || lobby.pendingCorrections || {};
      applyScores(lobby, index, corrections);
      emitReveal(io, lobby, question, index);
    });

    socket.on('quiz-next', () => {
      const player = quizPlayers.get(socket.id);
      if (!player) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby || !isHostSocket(lobby, socket.id)) {
        socket.emit('quiz-error', { message: 'Seul le chef peut passer à la question suivante' });
        return;
      }

      if (lobby.phase === 'answering') {
        try {
          const question = lobby.questions[lobby.currentQuestion];
          io.to(lobby.quizId).emit('quiz-question', questionPayload(lobby));
          if (lobby.host?.id && question) {
            io.to(lobby.host.id).emit('quiz-host-answer', {
              questionIndex: lobby.currentQuestion,
              expectedAnswer: correctLabel(question)
            });
          }
        } catch (error) {
          socket.emit('quiz-error', { message: 'Impossible d\'afficher la question' });
        }
        return;
      }

      if (lobby.phase !== 'reveal') {
        socket.emit('quiz-error', { message: 'Valide d\'abord les points de cette question' });
        return;
      }

      const nextIndex = (lobby.currentQuestion || 0) + 1;
      if (nextIndex >= (lobby.questions || []).length) {
        const results = lobby.players
          .map((entry) => ({
            username: entry.username,
            totalScore: entry.score || 0
          }))
          .sort((a, b) => b.totalScore - a.totalScore);

        io.to(lobby.quizId).emit('quiz-ended', { results });
        lobby.phase = 'ended';
        return;
      }

      const previousIndex = lobby.currentQuestion;
      lobby.currentQuestion = nextIndex;
      if (!sendQuestion(io, lobby)) {
        lobby.currentQuestion = previousIndex;
        socket.emit('quiz-error', { message: 'Impossible d\'afficher la question suivante' });
      }
    });

    socket.on('quiz-request-hint', () => {
      const player = quizPlayers.get(socket.id);
      if (!player || player.isHost) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby || lobby.phase !== 'answering') return;

      const index = lobby.currentQuestion;
      if (!player.hintAsked) player.hintAsked = {};
      if (player.hintAsked[index]) return;
      player.hintAsked[index] = true;

      player.score = (player.score || 0) - 1;
      if (!lobby.hintRequests) lobby.hintRequests = [];
      lobby.hintRequests.push({
        id: `${player.id}-${index}`,
        playerId: player.id,
        username: player.username,
        questionIndex: index
      });
      io.to(lobby.quizId).emit('quiz-scores', { players: playerSnapshot(lobby) });
      if (lobby.host?.id) {
        io.to(lobby.host.id).emit('quiz-hint-requests', { requests: lobby.hintRequests });
      }
    });

    socket.on('quiz-send-hint', (data) => {
      const host = quizPlayers.get(socket.id);
      if (!host) return;
      const lobby = quizLobbies.get(host.roomId);
      if (!lobby || !isHostSocket(lobby, socket.id) || lobby.phase !== 'answering') return;

      const words = String(data.words || '').trim();
      if (!words) return;
      const target = lobby.players.find((entry) => entry.id === data.playerId);
      if (!target) return;

      const index = lobby.currentQuestion;
      if (!target.hints) target.hints = {};
      if (!target.hints[index]) target.hints[index] = [];
      target.hints[index].push(words);
      io.to(target.id).emit('quiz-hint', {
        questionIndex: index,
        words,
        hints: target.hints[index]
      });
    });

    socket.on('transfer-leadership', () => {
      // Le chef d'un quiz ne joue pas et ne se transmet pas comme au Music Quiz.
    });

    socket.on('leave-lobby', () => {
      removeQuizPlayer(io, socket);
    });

    socket.on('disconnect', () => {
      removeQuizPlayer(io, socket);
    });
  });
}

module.exports = {
  attachQuiz,
  normalizeAnswer,
  isObjectiveCorrect,
  sanitizeQuestion,
  validateQuestion,
  correctLabel,
  blankSlots,
  scoreAnswer
};
