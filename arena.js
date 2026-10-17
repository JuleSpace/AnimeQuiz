/**
 * Poké Bully Tactics — salons multijoueurs (namespace Socket.io « /arena »).
 *
 * Le serveur orchestre la partie sans connaître les Pokémon :
 *  - salon par code, chef de salon, lancement ;
 *  - pool commun tiré par le client du chef, starter tiré au hasard parmi les starters du pool ;
 *  - rounds : préparation chronométrée, appariements, graine de combat partagée ;
 *  - chaque client simule le combat (déterministe) et renvoie ses PV ; éliminations, classement.
 */

const PREP_SECONDS = 40;
const GRACE_SECONDS = 8;
const MAX_PLAYERS = 8;
const START_HP = 100;

const rooms = new Map();

const makeCode = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  } while (rooms.has(code));
  return code;
};

const shuffle = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const cleanName = (name) => String(name || '').replace(/\s+/g, ' ').trim().slice(0, 20) || 'Dresseur';

const publicRoom = (room) => ({
  code: room.code,
  hostId: room.hostId,
  status: room.status,
  round: room.round,
  deadline: room.deadline,
  players: room.order.map((id) => {
    const p = room.players.get(id);
    return {
      id: p.id,
      name: p.name,
      hp: p.hp,
      alive: p.alive,
      connected: p.connected,
      ready: p.ready,
      level: p.level || 1,
      place: p.place || null,
      lastResult: p.lastResult || null
    };
  })
});

const alivePlayers = (room) => room.order.map((id) => room.players.get(id)).filter((p) => p.alive);

const attachArena = (io) => {
  const nsp = io.of('/arena');

  const broadcast = (room) => nsp.to(room.code).emit('arena:room', publicRoom(room));

  const finishGame = (room) => {
    room.status = 'over';
    clearTimeout(room.timer);
    const alive = alivePlayers(room);
    if (alive.length === 1) alive[0].place = 1;
    const ranking = room.order
      .map((id) => room.players.get(id))
      .sort((a, b) => (a.place || 99) - (b.place || 99));
    nsp.to(room.code).emit('arena:over', { ranking: ranking.map((p) => ({ id: p.id, name: p.name, place: p.place, hp: p.hp })) });
    broadcast(room);
  };

  const startRound = (room) => {
    room.round += 1;
    room.status = 'prep';
    room.boards = new Map();
    room.results = new Map();
    room.order.forEach((id) => {
      const p = room.players.get(id);
      p.ready = false;
    });
    room.deadline = Date.now() + PREP_SECONDS * 1000 + (room.round === 1 ? 10000 : 0);
    clearTimeout(room.timer);
    room.timer = setTimeout(() => launchFights(room), room.deadline - Date.now() + GRACE_SECONDS * 1000);
    nsp.to(room.code).emit('arena:round', { round: room.round, deadline: room.deadline });
    broadcast(room);
  };

  const launchFights = (room) => {
    if (room.status !== 'prep') return;
    clearTimeout(room.timer);
    room.status = 'fight';
    const alive = shuffle(alivePlayers(room));
    const boardOf = (p) => room.boards.get(p.id) || p.lastBoard || Array(21).fill(null);
    const pairs = [];
    for (let i = 0; i + 1 < alive.length; i += 2) pairs.push([alive[i], alive[i + 1], false]);
    if (alive.length % 2 === 1) {
      // Joueur impair : il affronte le reflet d’un autre joueur (seul son résultat compte).
      const solo = alive[alive.length - 1];
      const others = alive.filter((p) => p.id !== solo.id);
      const mirror = others[Math.floor(Math.random() * others.length)] || solo;
      pairs.push([solo, mirror, true]);
    }
    room.expected = new Set(alive.map((p) => p.id));
    pairs.forEach(([a, b, ghost]) => {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const home = boardOf(a);
      const away = boardOf(b);
      a.lastBoard = home;
      if (!ghost) b.lastBoard = away;
      nsp.to(a.id).emit('arena:fight', {
        round: room.round, seed, isHome: true, ghost,
        opponent: { id: b.id, name: ghost ? `Reflet de ${b.name}` : b.name },
        home, away
      });
      if (!ghost) {
        nsp.to(b.id).emit('arena:fight', {
          round: room.round, seed, isHome: false, ghost: false,
          opponent: { id: a.id, name: a.name },
          home, away
        });
      }
    });
    // Filet de sécurité : si un client ne renvoie pas son résultat.
    room.timer = setTimeout(() => closeRound(room), 120000);
    broadcast(room);
  };

  const closeRound = (room) => {
    if (room.status !== 'fight') return;
    clearTimeout(room.timer);
    // Éliminations de ce round (classement : les derniers tombés finissent mieux placés)
    const fallen = alivePlayers(room).filter((p) => p.hp <= 0 || !p.connected);
    const aliveCount = alivePlayers(room).length;
    fallen
      .sort((a, b) => a.hp - b.hp)
      .forEach((p, k) => {
        p.alive = false;
        p.place = aliveCount - fallen.length + 1 + (fallen.length - 1 - k);
      });
    if (alivePlayers(room).length <= 1) {
      finishGame(room);
      return;
    }
    startRound(room);
  };

  nsp.on('connection', (socket) => {
    let joined = null;

    const leave = () => {
      if (!joined) return;
      const room = rooms.get(joined);
      joined = null;
      if (!room) return;
      const p = room.players.get(socket.id);
      if (!p) return;
      if (room.status === 'lobby') {
        room.players.delete(socket.id);
        room.order = room.order.filter((id) => id !== socket.id);
      } else {
        p.connected = false;
        if (room.status === 'prep') p.ready = true;
      }
      socket.leave(room.code);
      if (room.hostId === socket.id) {
        const next = room.order.map((id) => room.players.get(id)).find((x) => x.connected);
        room.hostId = next ? next.id : null;
      }
      if (!room.order.some((id) => room.players.get(id).connected)) {
        clearTimeout(room.timer);
        rooms.delete(room.code);
        return;
      }
      if (room.status === 'prep' && alivePlayers(room).every((x) => x.ready || !x.connected)) launchFights(room);
      if (room.status === 'fight' && room.expected) {
        room.expected.delete(socket.id);
        if (!room.expected.size) closeRound(room);
      }
      broadcast(room);
    };

    socket.on('arena:create', ({ name } = {}, ack) => {
      leave();
      const code = makeCode();
      const room = {
        code, hostId: socket.id, status: 'lobby', round: 0, deadline: null,
        players: new Map(), order: [], timer: null, pool: [], starters: []
      };
      rooms.set(code, room);
      room.players.set(socket.id, { id: socket.id, name: cleanName(name), hp: START_HP, alive: true, connected: true, ready: false });
      room.order.push(socket.id);
      socket.join(code);
      joined = code;
      ack?.({ ok: true, code, me: socket.id });
      broadcast(room);
    });

    socket.on('arena:join', ({ code, name } = {}, ack) => {
      const room = rooms.get(String(code || '').toUpperCase().trim());
      if (!room) return ack?.({ ok: false, error: 'Salon introuvable.' });
      if (room.status !== 'lobby') return ack?.({ ok: false, error: 'La partie a déjà commencé.' });
      if (room.order.length >= MAX_PLAYERS) return ack?.({ ok: false, error: 'Salon complet (8 joueurs).' });
      leave();
      room.players.set(socket.id, { id: socket.id, name: cleanName(name), hp: START_HP, alive: true, connected: true, ready: false });
      room.order.push(socket.id);
      socket.join(room.code);
      joined = room.code;
      ack?.({ ok: true, code: room.code, me: socket.id });
      broadcast(room);
    });

    socket.on('arena:start', ({ pool, starters } = {}, ack) => {
      const room = rooms.get(joined);
      if (!room || room.hostId !== socket.id || room.status !== 'lobby') return ack?.({ ok: false });
      if (room.order.length < 2) return ack?.({ ok: false, error: 'Il faut au moins 2 joueurs.' });
      if (!Array.isArray(pool) || !Array.isArray(starters) || !starters.length) return ack?.({ ok: false });
      room.pool = pool.slice(0, 64).map(String);
      room.starters = starters.filter((s) => room.pool.includes(s));
      const starterOf = {};
      room.order.forEach((id) => {
        starterOf[id] = room.starters[Math.floor(Math.random() * room.starters.length)];
      });
      nsp.to(room.code).emit('arena:started', { pool: room.pool, starterOf });
      ack?.({ ok: true });
      startRound(room);
    });

    socket.on('arena:ready', ({ round, board, level } = {}) => {
      const room = rooms.get(joined);
      if (!room || room.status !== 'prep' || round !== room.round) return;
      const p = room.players.get(socket.id);
      if (!p || !p.alive) return;
      if (Array.isArray(board)) room.boards.set(socket.id, board.slice(0, 21));
      p.ready = true;
      p.level = Number(level) || p.level || 1;
      if (alivePlayers(room).every((x) => x.ready || !x.connected)) launchFights(room);
      else broadcast(room);
    });

    socket.on('arena:unready', ({ round } = {}) => {
      const room = rooms.get(joined);
      if (!room || room.status !== 'prep' || round !== room.round) return;
      const p = room.players.get(socket.id);
      if (p) p.ready = false;
      broadcast(room);
    });

    socket.on('arena:result', ({ round, hp, win } = {}) => {
      const room = rooms.get(joined);
      if (!room || room.status !== 'fight' || round !== room.round) return;
      const p = room.players.get(socket.id);
      if (!p || !room.expected?.has(socket.id)) return;
      p.hp = Math.max(0, Math.min(START_HP, Number(hp) || 0));
      p.lastResult = win ? 'win' : 'loss';
      room.expected.delete(socket.id);
      if (!room.expected.size) closeRound(room);
      else broadcast(room);
    });

    socket.on('arena:leave', leave);
    socket.on('disconnect', leave);
  });
};

module.exports = { attachArena };
