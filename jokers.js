const PACK_EVERY = 15;

const JOKER_IDS = ['double', 'filet', 'seconde', 'copie', 'indice', 'silence', 'vol', 'melange'];
const TARGET_JOKERS = new Set(['copie', 'silence', 'vol']);

function drawJoker() {
  return JOKER_IDS[Math.floor(Math.random() * JOKER_IDS.length)];
}

function freshJoker(card) {
  return {
    card,
    used: false,
    usedOn: null,
    targetId: null,
    targetName: '',
    note: 'En main',
    redoSpent: false,
    seenText: '',
    seenName: ''
  };
}

function pointsFromChef(value) {
  const points = Math.round(Number(value));
  if (!Number.isFinite(points) || points < 0) return 0;
  return Math.min(99, points);
}

function jokerPlayed(player, index, card) {
  const joker = player && player.joker;
  if (!joker || !joker.used || joker.usedOn !== index) return false;
  if (card && joker.card !== card) return false;
  return true;
}

function resolveGains(players, question, index, corrections) {
  const draft = {};

  players.forEach((player) => {
    const raw = pointsFromChef(corrections ? corrections[player.id] : 0);
    let gain = raw;
    const tags = [];
    const notes = [];

    if (jokerPlayed(player, index, 'double')) {
      gain = raw * 2;
      tags.push('×2');
      notes.push('Double mise : tes points ont été doublés.');
    }

    draft[player.id] = { gain, tags, notes };
  });

  const ids = Object.keys(draft);
  const base = {};
  ids.forEach((id) => { base[id] = draft[id].gain; });

  players.forEach((player) => {
    if (!jokerPlayed(player, index, 'filet')) return;
    const own = base[player.id];
    const others = ids.filter((id) => id !== player.id);
    const average = others.length
      ? Math.round(others.reduce((sum, id) => sum + base[id], 0) / others.length)
      : 0;
    draft[player.id].tags.push('Filet');
    if (average > own) {
      draft[player.id].gain = average;
      draft[player.id].notes.push(`Filet : tu prends la moyenne des autres, ${average} pt.`);
    } else {
      draft[player.id].notes.push(`Filet : tu gardes tes ${own} pt (moyenne des autres : ${average}).`);
    }
  });

  const claimed = new Set();
  players.forEach((player) => {
    if (!jokerPlayed(player, index, 'vol')) return;
    const targetId = player.joker.targetId;
    if (!targetId || targetId === player.id || !draft[targetId] || claimed.has(targetId)) return;
    claimed.add(targetId);

    const stolen = draft[targetId].gain;
    draft[targetId].gain = 0;
    draft[targetId].tags = ['Volé'];
    draft[targetId].notes = ['Vol : tes points de cette question t\'ont été pris.'];
    draft[player.id].gain += stolen;
    if (stolen > 0) {
      draft[player.id].tags.push(`Vol +${stolen}`);
      draft[player.id].notes.push(`Vol : tu prends ${stolen} pt.`);
    } else {
      draft[player.id].tags.push('Vol');
      draft[player.id].notes.push('Vol : la cible n\'avait aucun point à prendre.');
    }
  });

  return draft;
}

module.exports = {
  PACK_EVERY,
  JOKER_IDS,
  TARGET_JOKERS,
  drawJoker,
  freshJoker,
  pointsFromChef,
  jokerPlayed,
  resolveGains
};
