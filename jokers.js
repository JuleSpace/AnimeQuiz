const PACKS_PER_QUIZ = 5;

const JOKER_IDS = ['double', 'filet', 'seconde', 'copie', 'indice', 'silence', 'vol', 'melange', 'pot', 'renversement', 'toutourien', 'gambling', 'rumeur', 'bouclier'];
const TARGET_JOKERS = new Set(['copie', 'silence', 'vol']);

function drawJoker() {
  return JOKER_IDS[Math.floor(Math.random() * JOKER_IDS.length)];
}

function packCount(total) {
  if (total >= 20) return PACKS_PER_QUIZ;
  if (total >= 10) return 2;
  if (total >= 1) return 1;
  return 0;
}

function packStarts(total) {
  const count = Math.max(0, Number(total) || 0);
  const packs = packCount(count);
  const starts = [];
  for (let step = 0; step < packs; step += 1) {
    starts.push(Math.floor((step * count) / packs));
  }
  return starts;
}

function isPackQuestion(total, index) {
  return packStarts(total).includes(index);
}

function packRange(total, index) {
  const starts = packStarts(total);
  const place = starts.indexOf(index);
  const from = index + 1;
  const to = place >= 0 && place + 1 < starts.length ? starts[place + 1] : total;
  return { from, to: Math.max(from, to) };
}

function activePackRange(total, index) {
  const count = Math.max(0, Number(total) || 0);
  const starts = packStarts(count);
  if (!starts.length) return { from: 1, to: Math.max(1, count) };
  let place = 0;
  starts.forEach((start, step) => {
    if (start <= index) place = step;
  });
  const from = starts[place] + 1;
  const to = place + 1 < starts.length ? starts[place + 1] : count;
  return { from, to: Math.max(from, to) };
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

function gaveAnswer(player, index) {
  const answer = player && player.answers ? player.answers[index] : null;
  return answer != null && answer !== '';
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

    if (player.priorAnswers && Object.prototype.hasOwnProperty.call(player.priorAnswers, index)) {
      notes.push('Seconde main : la meilleure des deux réponses est retenue.');
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

  const potPlayer = players.find((player) => jokerPlayed(player, index, 'pot'));
  if (potPlayer) {
    const eligible = players.filter((player) => gaveAnswer(player, index));
    if (eligible.length >= 2) {
      const total = players.reduce((sum, player) => sum + draft[player.id].gain, 0);
      const baseShare = Math.floor(total / eligible.length);
      let spare = total % eligible.length;
      const ordered = [...eligible].sort((a, b) => {
        if (a.id === potPlayer.id) return -1;
        if (b.id === potPlayer.id) return 1;
        return String(a.username || '').localeCompare(String(b.username || ''), 'fr');
      });
      const shares = new Map();
      ordered.forEach((player) => {
        const share = baseShare + (spare > 0 ? 1 : 0);
        if (spare > 0) spare -= 1;
        shares.set(player.id, share);
      });
      players.forEach((player) => {
        const share = shares.has(player.id) ? shares.get(player.id) : 0;
        draft[player.id].gain = share;
        draft[player.id].tags.push('Pot');
        draft[player.id].notes.push(
          shares.has(player.id)
            ? `Pot commun : la cagnotte de ${total} pt est partagée, tu reçois ${share}.`
            : 'Pot commun : pas de réponse, pas de part.'
        );
      });
    }
  }

  const flipPlayer = players.find((player) => jokerPlayed(player, index, 'renversement'));
  if (flipPlayer && !potPlayer && players.length >= 2) {
    const ranked = [...players].sort((a, b) => {
      const diff = draft[b.id].gain - draft[a.id].gain;
      if (diff) return diff;
      const aCard = a.id === flipPlayer.id;
      const bCard = b.id === flipPlayer.id;
      if (aCard !== bCard) return aCard ? 1 : -1;
      const before = (b.score || 0) - (a.score || 0);
      if (before) return before;
      return String(a.username || '').localeCompare(String(b.username || ''), 'fr');
    });
    const lowToHigh = ranked.map((player) => draft[player.id].gain).sort((a, b) => a - b);
    ranked.forEach((player, place) => {
      const previous = draft[player.id].gain;
      const next = lowToHigh[place];
      draft[player.id].gain = next;
      draft[player.id].tags.push('Renversé');
      draft[player.id].notes.push(`Renversement : ${previous} pt deviennent ${next}.`);
    });
  }

  const stakePlayers = players.filter((player) => jokerPlayed(player, index, 'toutourien'));
  if (stakePlayers.length) {
    const best = players.reduce((max, player) => Math.max(max, draft[player.id].gain), 0);
    stakePlayers.forEach((player) => {
      const own = draft[player.id].gain;
      if (own <= 0) {
        draft[player.id].tags.push('Rien');
        draft[player.id].notes.push('Tout ou rien : 0 pt, tu restes à 0.');
        return;
      }
      draft[player.id].gain = best;
      draft[player.id].tags.push('Tout');
      draft[player.id].notes.push(
        own === best
          ? `Tout ou rien : tu avais déjà le plus haut score, ${best} pt.`
          : `Tout ou rien : tu prends le plus haut score, ${best} pt.`
      );
    });
  }

  const gamblers = players.filter((player) => jokerPlayed(player, index, 'gambling'));
  if (gamblers.length) {
    const best = players.reduce(
      (max, player) => Math.max(max, pointsFromChef(corrections ? corrections[player.id] : 0)),
      0
    );
    gamblers.forEach((player) => {
      const unit = Number(player.joker && player.joker.gambleRoll);
      if (!Number.isFinite(unit)) {
        draft[player.id].tags.push('Tirage');
        draft[player.id].notes.push(`Gambling : le tirage se fait à la distribution, entre 0 et ${best}.`);
        return;
      }
      const roll = Math.min(0.999999, Math.max(0, unit));
      const drawn = Math.min(best, Math.floor(roll * (best + 1)));
      draft[player.id].gain = drawn;
      draft[player.id].tags.push('Gambling');
      draft[player.id].notes.push(`Gambling : tu tires ${drawn} pt, entre 0 et ${best}, le plus haut donné par le chef.`);
    });
  }

  const claimed = new Set();
  players.forEach((player) => {
    if (!jokerPlayed(player, index, 'vol')) return;
    const targetId = player.joker.targetId;
    if (!targetId || targetId === player.id || !draft[targetId] || claimed.has(targetId)) return;
    const target = players.find((entry) => entry.id === targetId);
    if (target && jokerPlayed(target, index, 'bouclier')) {
      draft[player.id].tags.push('Vol');
      draft[player.id].notes.push('Vol : la cible est protégée.');
      return;
    }
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
  PACKS_PER_QUIZ,
  JOKER_IDS,
  TARGET_JOKERS,
  drawJoker,
  packStarts,
  isPackQuestion,
  packRange,
  activePackRange,
  freshJoker,
  pointsFromChef,
  jokerPlayed,
  resolveGains
};
