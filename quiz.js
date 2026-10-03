const mongoose = require('mongoose');
const {
  PACK_EVERY,
  JOKER_IDS,
  TARGET_JOKERS,
  drawJoker,
  freshJoker,
  pointsFromChef,
  jokerPlayed,
  resolveGains
} = require('./jokers');

const QuizQuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['qcm', 'boolean', 'text', 'blank', 'music', 'order', 'layout'],
    required: true
  },
  prompt: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  answerImageUrl: { type: String, default: '' },
  answerVideoUrl: { type: String, default: '' },
  musicUrl: { type: String, default: '' },
  options: { type: [String], default: [] },
  correctIndexes: { type: [Number], default: [] },
  correctBoolean: { type: Boolean, default: true },
  acceptedAnswers: { type: [String], default: [] },
  blanks: { type: [String], default: [] },
  points: { type: Number, default: 1 },
  timeLimit: { type: Number, default: 20 },
  layoutMode: { type: String, enum: ['timeline', 'schema'], default: 'timeline' },
  layoutImageUrl: { type: String, default: '' },
  items: {
    type: [{
      id: { type: String, default: '' },
      text: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
      x: { type: Number, default: 50 },
      y: { type: Number, default: 50 }
    }],
    default: []
  }
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
  if (question.type === 'order') {
    return (question.items || [])
      .map((item, index) => `${index + 1}. ${item.text || 'Image'}`)
      .join(' · ');
  }
  if (question.type === 'layout') {
    return question.layoutMode === 'schema' ? 'Placement sur le schéma' : 'Placement sur la frise';
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
  if (question.type === 'order') {
    const ids = Array.isArray(answer?.ids) ? answer.ids : [];
    if (!ids.length) return 'Pas de réponse';
    const catalog = new Map((question.items || []).map((item) => [item.id, item]));
    return ids.map((id, index) => `${index + 1}. ${catalog.get(id)?.text || 'Image'}`).join(' · ');
  }
  if (question.type === 'layout') {
    const places = Array.isArray(answer?.places) ? answer.places : [];
    if (!places.length) return 'Pas de réponse';
    const catalog = new Map((question.items || []).map((item) => [item.id, item]));
    return places
      .slice()
      .sort((a, b) => a.x - b.x)
      .map((place) => catalog.get(place.id)?.text || 'Élément')
      .join(' → ');
  }
  return String(answer);
}

function stableShuffle(items, seed) {
  const list = [...items];
  let state = (Number(seed) || 1) >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

function publicItems(question) {
  const items = (question.items || []).map((item) => ({
    id: item.id,
    text: item.text || '',
    imageUrl: item.imageUrl || ''
  }));
  if (question.type !== 'order' && question.type !== 'layout') return [];
  const shuffled = stableShuffle(items, items.map((item) => item.id).join('|').length + 17);
  const sameOrder = shuffled.every((item, index) => item.id === items[index]?.id);
  if (sameOrder && shuffled.length > 1) {
    const [first] = shuffled.splice(0, 1);
    shuffled.push(first);
  }
  return shuffled;
}

function hostSolution(question) {
  if (!question || (question.type !== 'order' && question.type !== 'layout')) return null;
  return {
    type: question.type,
    items: solutionItems(question),
    layoutMode: question.layoutMode === 'schema' ? 'schema' : 'timeline',
    layoutImageUrl: question.layoutImageUrl || ''
  };
}

function solutionItems(question) {
  return (question.items || []).map((item) => ({
    id: item.id,
    text: item.text || '',
    imageUrl: item.imageUrl || '',
    x: Number(item.x) || 0,
    y: Number(item.y) || 0
  }));
}

function sanitizeStoredAnswer(question, answer) {
  if (!question || (question.type !== 'order' && question.type !== 'layout')) return answer;
  const known = new Set((question.items || []).map((item) => item.id));
  if (question.type === 'order') {
    const ids = Array.isArray(answer?.ids) ? answer.ids.map((id) => String(id)) : [];
    return { ids: ids.filter((id) => known.has(id)) };
  }
  const places = Array.isArray(answer?.places) ? answer.places : [];
  return {
    places: places
      .filter((place) => known.has(String(place?.id)))
      .map((place) => ({
        id: String(place.id),
        x: Math.max(0, Math.min(100, Number(place.x) || 0)),
        y: Math.max(0, Math.min(100, Number(place.y) || 0))
      }))
  };
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
    timeLimit: question.timeLimit || 0,
    items: publicItems(question),
    layoutMode: question.layoutMode === 'schema' ? 'schema' : 'timeline',
    layoutImageUrl: question.type === 'layout' && question.layoutMode === 'schema'
      ? (question.layoutImageUrl || '')
      : ''
  };
}

function cleanItems(rawItems) {
  const used = new Set();
  return (Array.isArray(rawItems) ? rawItems : []).slice(0, 8).map((item, index) => {
    let id = String(item?.id || `item-${index + 1}`).trim().slice(0, 40);
    if (!id || used.has(id)) id = `item-${index + 1}-${used.size + 1}`;
    used.add(id);
    const x = Number(item?.x);
    const y = Number(item?.y);
    return {
      id,
      text: String(item?.text || '').trim(),
      imageUrl: String(item?.imageUrl || '').trim(),
      x: Number.isFinite(x) ? Math.max(0, Math.min(100, x)) : 50,
      y: Number.isFinite(y) ? Math.max(0, Math.min(100, y)) : 50
    };
  }).filter((item) => item.text || item.imageUrl);
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
    answerImageUrl: String(raw.answerImageUrl || '').trim(),
    answerVideoUrl: String(raw.answerVideoUrl || '').trim(),
    musicUrl: type === 'music' ? String(raw.musicUrl || '').trim() : '',
    options: type === 'qcm' ? options : [],
    correctIndexes: type === 'qcm' ? correctIndexes : [],
    correctBoolean: raw.correctBoolean !== false,
    acceptedAnswers: (type === 'text' || type === 'music') ? acceptedAnswers : [],
    blanks: type === 'blank' ? blanks : [],
    points: Math.max(1, Number(raw.points) || 1),
    timeLimit: Math.max(0, Number(raw.timeLimit) || 0),
    layoutMode: raw.layoutMode === 'schema' ? 'schema' : 'timeline',
    layoutImageUrl: String(raw.layoutImageUrl || '').trim(),
    items: cleanItems(raw.items)
  };
}

function validateQuestion(question, position) {
  const label = `Question ${position}`;
  const types = ['qcm', 'boolean', 'text', 'blank', 'music', 'order', 'layout'];
  if (!types.includes(question.type)) return `${label} : type invalide`;

  const urlError = ['imageUrl', 'videoUrl', 'answerImageUrl', 'answerVideoUrl', 'musicUrl', 'layoutImageUrl'].map((field) => {
    const value = question[field];
    if (value && !isHttpUrl(value)) {
      return `${label} : le lien doit commencer par http:// ou https://`;
    }
    return null;
  }).find(Boolean);
  if (urlError) return urlError;

  const hasPrompt = String(question.prompt || '').trim();
  const hasImage = String(question.imageUrl || '').trim();
  if (!hasPrompt && !hasImage && !['music', 'order', 'layout'].includes(question.type)) {
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

  if (question.type === 'order' && (question.items || []).length < 2) {
    return `${label} : ajoute au moins 2 éléments à classer`;
  }

  if (question.type === 'layout') {
    if ((question.items || []).length < 2) return `${label} : ajoute au moins 2 éléments à placer`;
    if (question.layoutMode === 'schema' && !String(question.layoutImageUrl || '').trim()) {
      return `${label} : ajoute l'image du schéma`;
    }
  }

  const badItemImage = (question.items || []).find((item) => item.imageUrl && !isHttpUrl(item.imageUrl));
  if (badItemImage) return `${label} : le lien d'image d'un élément doit commencer par http:// ou https://`;

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

function applyScores(lobby, index, corrections) {
  const resolved = resolveGains(lobby.players, lobby.questions[index], index, corrections);
  lobby.players.forEach((player) => {
    const info = resolved[player.id] || { gain: 0, notes: [] };
    player.score = (player.score || 0) + info.gain;
    player.lastGain = info.gain;
    player.lastCorrect = info.gain > 0;
    player.lastNotes = info.notes || [];
  });
  return resolved;
}

function emitReveal(io, lobby, question, index) {
  if (!question) return;
  const payload = {
    questionIndex: index,
    hostId: lobby.host?.id || null,
    correctAnswer: correctLabel(question),
    answerImageUrl: question.answerImageUrl || '',
    answerVideoUrl: question.answerVideoUrl || '',
    solutionItems: solutionItems(question),
    layoutMode: question.layoutMode === 'schema' ? 'schema' : 'timeline',
    layoutImageUrl: question.layoutImageUrl || '',
    correctIndexes: question.type === 'qcm' ? (question.correctIndexes || []) : [],
    correctBoolean: question.type === 'boolean' ? Boolean(question.correctBoolean) : null,
    players: lobby.players.map((player) => ({
      id: player.id,
      username: player.username,
      score: player.score || 0,
      answerText: formatPlayerAnswer(question, player.answers[index]),
      answer: (question.type === 'order' || question.type === 'layout') ? (player.answers[index] || null) : null,
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

  const corrections = {};
  lobby.players.forEach((player) => {
    corrections[player.id] = 0;
  });
  lobby.pendingCorrections = corrections;
  emitHold(io, lobby);
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
  lobby.io = io;
  io.to(lobby.quizId).emit('quiz-question', payload);
  if (lobby.host?.id) {
    io.to(lobby.host.id).emit('quiz-host-answer', {
      questionIndex: lobby.currentQuestion,
      expectedAnswer,
      solution: hostSolution(question)
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

function answeredPlayers(lobby, index, withAnswers) {
  const question = lobby.questions[index];
  return lobby.players.map((player) => {
    const row = {
      id: player.id,
      username: player.username,
      score: player.score || 0
    };
    if (!withAnswers || !question) return row;
    return {
      ...row,
      answerText: formatPlayerAnswer(question, player.answers[index]),
      answer: (question.type === 'order' || question.type === 'layout') ? (player.answers[index] || null) : null
    };
  });
}

function privateAnswerFields(lobby) {
  const index = lobby.currentQuestion;
  const question = lobby.questions[index];
  if (!question) return {};
  return {
    expectedAnswer: correctLabel(question),
    answerImageUrl: question.answerImageUrl || '',
    answerVideoUrl: question.answerVideoUrl || '',
    solutionItems: solutionItems(question),
    layoutMode: question.layoutMode === 'schema' ? 'schema' : 'timeline',
    layoutImageUrl: question.layoutImageUrl || '',
    suggestedPoints: question.points || 1
  };
}

function holdPayload(lobby, full) {
  const index = lobby.currentQuestion;
  return {
    questionIndex: index,
    hostId: lobby.host?.id || null,
    full: Boolean(full),
    players: answeredPlayers(lobby, index, full),
    ...(full ? privateAnswerFields(lobby) : {})
  };
}

function previewList(lobby, index) {
  const resolved = resolveGains(
    lobby.players,
    lobby.questions[index],
    index,
    lobby.pendingCorrections || {}
  );
  return lobby.players.map((player) => ({
    id: player.id,
    gain: resolved[player.id]?.gain || 0,
    tags: resolved[player.id]?.tags || []
  }));
}

function correctionPayload(lobby, full) {
  const index = lobby.currentQuestion;
  const payload = {
    questionIndex: index,
    hostId: lobby.host?.id || null,
    full: Boolean(full),
    players: answeredPlayers(lobby, index, full)
  };
  if (!full) return payload;
  return {
    ...payload,
    ...privateAnswerFields(lobby),
    corrections: lobby.pendingCorrections || {},
    preview: previewList(lobby, index)
  };
}

function ownJokerPayload(joker) {
  if (!joker) return null;
  return {
    card: joker.card,
    used: Boolean(joker.used),
    usedOn: joker.usedOn,
    targetId: joker.targetId || null,
    targetName: joker.targetName || '',
    note: joker.note || (joker.used ? 'Jouée' : 'En main'),
    redoSpent: Boolean(joker.redoSpent),
    seenText: joker.seenText || '',
    seenName: joker.seenName || ''
  };
}

function rosterJoker(joker) {
  const view = ownJokerPayload(joker);
  if (!view) return null;
  delete view.seenText;
  delete view.seenName;
  return view;
}

function jokerRoster(lobby) {
  return lobby.players.map((player) => ({
    id: player.id,
    username: player.username,
    joker: rosterJoker(player.joker)
  }));
}

function emitJokerRoster(io, lobby) {
  if (!lobby.host?.id) return;
  io.to(lobby.host.id).emit('quiz-jokers', { players: jokerRoster(lobby) });
}

function boosterPayload(lobby) {
  const from = lobby.currentQuestion + 1;
  const to = Math.min(lobby.questions.length, lobby.currentQuestion + PACK_EVERY);
  return {
    quizName: lobby.quizName,
    hostId: lobby.host?.id || null,
    hostName: lobby.host?.username || lobby.hostName || '',
    questionIndex: lobby.currentQuestion,
    totalQuestions: lobby.questions.length,
    players: playerSnapshot(lobby),
    validFrom: from,
    validTo: to
  };
}

function dealBoosters(io, lobby) {
  clearTimer(lobby.quizId);
  lobby.phase = 'booster';
  lobby.io = io;
  lobby.players.forEach((player) => {
    player.joker = freshJoker(drawJoker());
  });
  io.to(lobby.quizId).emit('quiz-booster-start', boosterPayload(lobby));
  lobby.players.forEach((player) => {
    io.to(player.id).emit('quiz-own-joker', { joker: ownJokerPayload(player.joker) });
  });
  emitJokerRoster(io, lobby);
}

function openRound(io, lobby) {
  lobby.io = io;
  if (lobby.currentQuestion % PACK_EVERY === 0) {
    dealBoosters(io, lobby);
    return true;
  }
  return sendQuestion(io, lobby);
}

function emitHold(io, lobby) {
  lobby.phase = 'hold';
  lobby.io = io;
  lobby.players.forEach((player) => {
    io.to(player.id).emit('quiz-hold', holdPayload(lobby, false));
  });
  if (lobby.host?.id) {
    io.to(lobby.host.id).emit('quiz-hold', holdPayload(lobby, true));
  }
}

function emitCorrection(io, lobby) {
  lobby.phase = 'correction';
  lobby.io = io;
  lobby.players.forEach((player) => {
    io.to(player.id).emit('quiz-correction', correctionPayload(lobby, false));
  });
  if (lobby.host?.id) {
    io.to(lobby.host.id).emit('quiz-correction', correctionPayload(lobby, true));
  }
}

function publishCopies(io, lobby, source) {
  const index = lobby.currentQuestion;
  const question = lobby.questions[index];
  if (!question) return;
  let changed = false;
  lobby.players.forEach((watcher) => {
    if (!jokerPlayed(watcher, index, 'copie')) return;
    if (watcher.joker.targetId !== source.id) return;
    if (watcher.answered[index]) return;
    const text = formatPlayerAnswer(question, source.answers[index]);
    watcher.joker.seenText = text;
    watcher.joker.seenName = source.username;
    watcher.joker.note = `A vu ${source.username}`;
    changed = true;
    io.to(watcher.id).emit('quiz-copied-answer', {
      questionIndex: index,
      username: source.username,
      text
    });
    io.to(watcher.id).emit('quiz-own-joker', { joker: ownJokerPayload(watcher.joker) });
  });
  if (changed) emitJokerRoster(io, lobby);
}

function maybeCloseIfComplete(io, lobby) {
  const index = lobby.currentQuestion;
  if (lobby.phase !== 'answering') return;
  if (lobby.players.length > 0 && lobby.players.every((entry) => entry.answered[index])) {
    closeQuestion(io, lobby.quizId);
  }
}

function syncQuizSocket(io, socket, lobby) {
  if (!lobby.isGameStarted || lobby.phase === 'lobby' || lobby.phase === 'ended') return;
  lobby.io = io;

  const person = quizPlayers.get(socket.id);

  if (lobby.phase === 'booster') {
    socket.emit('quiz-booster-start', boosterPayload(lobby));
    if (person && !person.isHost) {
      socket.emit('quiz-own-joker', { joker: ownJokerPayload(person.joker) });
    }
    if (isHostSocket(lobby, socket.id)) {
      socket.emit('quiz-jokers', { players: jokerRoster(lobby) });
    }
    return;
  }

  const question = lobby.questions[lobby.currentQuestion];
  if (!question) return;

  socket.emit('quiz-question', {
    ...questionPayload(lobby),
    locked: Boolean(person && !person.isHost && person.answered?.[lobby.currentQuestion]),
    hintUsed: Boolean(person && !person.isHost && person.hintAsked?.[lobby.currentQuestion])
  });

  if (isHostSocket(lobby, socket.id)) {
    socket.emit('quiz-host-answer', {
      questionIndex: lobby.currentQuestion,
      expectedAnswer: correctLabel(question),
      solution: hostSolution(question)
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

  if (person && !person.isHost && person.silencedOn === lobby.currentQuestion && lobby.phase === 'answering') {
    socket.emit('quiz-silenced', { questionIndex: lobby.currentQuestion });
  }

  if (
    person
    && !person.isHost
    && person.joker?.seenText
    && person.joker.usedOn === lobby.currentQuestion
    && !person.answered?.[lobby.currentQuestion]
  ) {
    socket.emit('quiz-copied-answer', {
      questionIndex: lobby.currentQuestion,
      username: person.joker.seenName,
      text: person.joker.seenText
    });
  }

  if (lobby.phase === 'hold') {
    socket.emit('quiz-hold', holdPayload(lobby, isHostSocket(lobby, socket.id)));
  }

  if (lobby.phase === 'correction') {
    socket.emit('quiz-correction', correctionPayload(lobby, isHostSocket(lobby, socket.id)));
  }

  if (lobby.phase === 'reveal') {
    emitReveal(io, lobby, question, lobby.currentQuestion);
  }

  if (person && !person.isHost) {
    socket.emit('quiz-own-joker', { joker: ownJokerPayload(person.joker) });
  }
  if (isHostSocket(lobby, socket.id)) {
    socket.emit('quiz-jokers', { players: jokerRoster(lobby) });
  }
}

function isOnline(io, socketId) {
  const live = socketId && io.sockets.sockets.get(socketId);
  return Boolean(live && live.connected);
}

function clearDrop(person) {
  if (person?.dropTimer) {
    clearTimeout(person.dropTimer);
    person.dropTimer = null;
  }
}

function removeQuizPlayer(io, socket) {
  const person = quizPlayers.get(socket.id);
  if (!person) return;
  clearDrop(person);

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
      emitJokerRoster(io, lobby);
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

        if (knownHost) {
          const oldId = lobby.host?.id;
          if (oldId && oldId !== socket.id && isOnline(io, oldId)) {
            socket.emit('join-error', { message: 'Ce pseudo est déjà pris' });
            return;
          }
          const previous = oldId && quizPlayers.get(oldId);
          clearDrop(previous);
          if (oldId) quizPlayers.delete(oldId);
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

        if (existingPlayer) {
          if (existingPlayer.id !== socket.id && isOnline(io, existingPlayer.id)) {
            socket.emit('join-error', { message: 'Ce pseudo est déjà pris' });
            return;
          }
          clearDrop(existingPlayer);
          quizPlayers.delete(existingPlayer.id);
          existingPlayer.id = socket.id;
          quizPlayers.set(socket.id, existingPlayer);
          socket.join(quizId);
          socket.emit('joined-lobby', {
            lobby: publicLobby(lobby),
            player: { ...existingPlayer, role: 'player' }
          });
          io.to(quizId).emit('lobby-updated', publicLobby(lobby));
          if (lobby.isGameStarted) syncQuizSocket(io, socket, lobby);
          return;
        }

        if (lobby.isGameStarted) {
          socket.emit('join-error', { message: 'La partie a déjà commencé' });
          return;
        }

        const becomeHost = !lobby.host && !lobby.hostName && lobby.players.length === 0;
        if (becomeHost) {
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
          hints: {},
          hintAsked: {},
          joker: null,
          silencedOn: null
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
          entry.hints = {};
          entry.hintAsked = {};
          entry.joker = null;
          entry.silencedOn = null;
          entry.lastGain = 0;
          entry.lastCorrect = false;
          entry.lastNotes = [];
        });

        openRound(io, lobby);
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
      if (player.silencedOn === index) {
        socket.emit('quiz-error', { message: 'Tu es réduit au silence' });
        return;
      }

      const canRedo = player.answered[index]
        && jokerPlayed(player, index, 'seconde')
        && !player.joker.redoSpent;
      if (player.answered[index] && !canRedo) return;

      const question = lobby.questions[index];
      if (canRedo) {
        player.joker.redoSpent = true;
        player.joker.note = 'Réponse modifiée';
        io.to(player.id).emit('quiz-own-joker', { joker: ownJokerPayload(player.joker) });
        emitJokerRoster(io, lobby);
      }

      player.answers[index] = sanitizeStoredAnswer(question, data.answer);
      player.answered[index] = true;
      publishCopies(io, lobby, player);

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
      io.to(lobby.host.id).emit('quiz-corrections-updated', {
        corrections: lobby.pendingCorrections,
        preview: previewList(lobby, lobby.currentQuestion)
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
      lobby.players.forEach((entry) => {
        const notes = entry.lastNotes || [];
        if (notes.length) {
          io.to(entry.id).emit('quiz-round-note', { questionIndex: index, notes });
        }
      });
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
              expectedAnswer: correctLabel(question),
              solution: hostSolution(question)
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
      if (!openRound(io, lobby)) {
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
        questionIndex: index,
        free: false
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

    socket.on('quiz-booster-done', () => {
      const player = quizPlayers.get(socket.id);
      if (!player) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby || !isHostSocket(lobby, socket.id) || lobby.phase !== 'booster') return;
      if (!sendQuestion(io, lobby)) {
        socket.emit('quiz-error', { message: 'Impossible d\'afficher la question' });
      }
    });

    socket.on('quiz-begin-scoring', () => {
      const player = quizPlayers.get(socket.id);
      if (!player) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby || !isHostSocket(lobby, socket.id) || lobby.phase !== 'hold') return;
      emitCorrection(io, lobby);
    });

    socket.on('play-joker', (data) => {
      const player = quizPlayers.get(socket.id);
      if (!player || player.isHost) return;
      const lobby = quizLobbies.get(player.roomId);
      if (!lobby) return;

      const index = lobby.currentQuestion;
      const card = String(data?.card || '');
      const joker = player.joker;
      if (!joker || !JOKER_IDS.includes(card) || joker.card !== card || joker.used) {
        socket.emit('quiz-error', { message: 'Cette carte n\'est pas jouable' });
        return;
      }

      if (card === 'vol') {
        if (lobby.phase !== 'hold') {
          socket.emit('quiz-error', { message: 'Vol se joue juste avant les points du chef' });
          return;
        }
      } else if (lobby.phase !== 'answering' || player.answered[index]) {
        socket.emit('quiz-error', { message: 'Joue la carte avant de répondre' });
        return;
      }

      let target = null;
      if (TARGET_JOKERS.has(card)) {
        target = lobby.players.find((entry) => entry.id === data.targetId);
        if (!target || target.id === player.id) {
          socket.emit('quiz-error', { message: 'Choisis un autre joueur' });
          return;
        }
        if (
          card === 'vol'
          && lobby.players.some((entry) => (
            entry.id !== player.id
            && jokerPlayed(entry, index, 'vol')
            && entry.joker.targetId === target.id
          ))
        ) {
          socket.emit('quiz-error', { message: 'Cette cible est déjà visée' });
          return;
        }
        joker.targetId = target.id;
        joker.targetName = target.username;
      }

      joker.used = true;
      joker.usedOn = index;
      joker.redoSpent = false;

      if (card === 'double') joker.note = 'Points doublés';
      if (card === 'filet') joker.note = 'Filet si 0';
      if (card === 'seconde') joker.note = 'Peut modifier sa réponse';
      if (card === 'copie') joker.note = `Copie ${joker.targetName}`;
      if (card === 'silence') joker.note = `Silence sur ${joker.targetName}`;
      if (card === 'vol') joker.note = `Vol sur ${joker.targetName}`;
      if (card === 'indice') joker.note = 'Indice gratuit';

      if (card === 'indice') {
        if (!player.hintAsked) player.hintAsked = {};
        if (player.hintAsked[index]) {
          joker.used = false;
          joker.usedOn = null;
          joker.note = 'En main';
          socket.emit('quiz-error', { message: 'Indice déjà demandé' });
          return;
        }
        player.hintAsked[index] = true;
        if (!lobby.hintRequests) lobby.hintRequests = [];
        lobby.hintRequests.push({
          id: `${player.id}-${index}`,
          playerId: player.id,
          username: player.username,
          questionIndex: index,
          free: true
        });
        if (lobby.host?.id) {
          io.to(lobby.host.id).emit('quiz-hint-requests', { requests: lobby.hintRequests });
        }
      }

      if (card === 'silence' && target) {
        target.silencedOn = index;
        target.answers[index] = null;
        target.answered[index] = true;
        io.to(target.id).emit('quiz-silenced', { questionIndex: index });
        publishCopies(io, lobby, target);
      }

      if (card === 'copie' && target && target.answered[index]) {
        const question = lobby.questions[index];
        const text = formatPlayerAnswer(question, target.answers[index]);
        joker.seenText = text;
        joker.seenName = target.username;
        joker.note = `A vu ${target.username}`;
        io.to(player.id).emit('quiz-copied-answer', {
          questionIndex: index,
          username: target.username,
          text
        });
      }

      io.to(player.id).emit('quiz-own-joker', { joker: ownJokerPayload(joker) });
      emitJokerRoster(io, lobby);

      if (card === 'silence') {
        const answered = lobby.players.filter((entry) => entry.answered[index]).length;
        io.to(lobby.quizId).emit('quiz-progress', {
          answered,
          totalPlayers: lobby.players.length
        });
        maybeCloseIfComplete(io, lobby);
      }
    });

    socket.on('transfer-leadership', () => {
      // Le chef d'un quiz ne joue pas et ne se transmet pas comme au Music Quiz.
    });

    socket.on('leave-lobby', () => {
      removeQuizPlayer(io, socket);
    });

    socket.on('disconnect', () => {
      const person = quizPlayers.get(socket.id);
      if (!person || person.id !== socket.id) return;
      clearDrop(person);
      const socketId = socket.id;
      person.dropTimer = setTimeout(() => {
        const current = quizPlayers.get(socketId);
        if (current && current.id === socketId) removeQuizPlayer(io, socket);
      }, 120000);
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
