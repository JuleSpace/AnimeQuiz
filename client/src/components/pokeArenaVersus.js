/**
 * Mode Salon multi : outils partagés par tous les clients.
 * - Le serveur ne connaît pas les Pokémon : il relaie les plateaux sérialisés et une graine.
 * - Chaque combat est simulé à l’identique sur les deux clients (orientation « canonique » :
 *   le joueur « hôte » du duel en bas, l’autre en haut), avec un générateur pseudo-aléatoire
 *   à graine. Le joueur du haut voit ensuite le combat retourné, son équipe en bas.
 */
import {
  BOARD_COLS,
  BOARD_ROWS_HALF,
  BOARD_SIZE,
  LINES,
  STARTER_LINES,
  shuffleList,
  simulateFight,
  unitFromLine,
  withBoardSlots
} from './pokeArenaData';

export const VERSUS_PREP_SECONDS = 40;
export const VERSUS_MIN_PLAYERS = 2;
export const VERSUS_MAX_PLAYERS = 8;

/** Taille du pool selon le nombre de joueurs : 34 lignées à 2, jusqu’à 64 à 8. */
export const versusPoolSize = (players) => Math.max(32, Math.min(64, 24 + 5 * players));
/** Starters présents dans le pool : 4 à 2 joueurs, 7 à 8 joueurs. */
export const versusStarterCount = (players) => Math.min(8, 3 + Math.floor(players / 2));

const COST_SHARE = { 1: 0.26, 2: 0.25, 3: 0.22, 4: 0.15, 5: 0.12 };

/** Générateur à graine (mulberry32). */
export const seededRandom = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Exécute fn avec Math.random remplacé par un générateur à graine (puis restauré). */
export const withSeed = (seed, fn) => {
  const original = Math.random;
  Math.random = seededRandom(seed);
  try {
    return fn();
  } finally {
    Math.random = original;
  }
};

/**
 * Pool commun de la partie, tiré au hasard à chaque lancement et identique pour tous.
 * Il s’agrandit avec le nombre de joueurs (plus de joueurs = plus de concurrence sur les lignées).
 * Les autres starters ne sont jamais tirés en dehors des starters choisis pour le pool.
 */
export const versusPool = (players = 2) => {
  const size = versusPoolSize(players);
  const starters = shuffleList(STARTER_LINES).slice(0, versusStarterCount(players));
  const picked = [...starters];
  const rest = LINES.filter((l) => !(l.traits || []).includes('Starter'));
  [1, 2, 3, 4, 5].forEach((cost) => {
    const want = Math.round(size * COST_SHARE[cost]) - picked.filter((l) => l.cost === cost).length;
    picked.push(...shuffleList(rest.filter((l) => l.cost === cost)).slice(0, Math.max(0, want)));
  });
  const extra = shuffleList(rest.filter((l) => !picked.includes(l)));
  while (picked.length < size && extra.length) picked.push(extra.pop());
  return picked.slice(0, size).map((l) => l.id);
};

export const startersInPool = (poolIds) => poolIds.filter((id) => STARTER_LINES.some((l) => l.id === id));

/** Plateau → forme compacte envoyée au serveur. */
export const serializeBoard = (board) => Array.from({ length: BOARD_SIZE }, (_, i) => {
  const u = board?.[i];
  if (!u) return null;
  return { uid: u.uid, lineId: u.lineId, star: u.star, formId: u.formId || null, items: [...(u.items || [])] };
});

/** Forme compacte → unités complètes (mêmes stats sur tous les clients). */
export const rebuildBoard = (ser) => Array.from({ length: BOARD_SIZE }, (_, i) => {
  const s = ser?.[i];
  if (!s || !LINES.some((l) => l.id === s.lineId)) return null;
  return unitFromLine(s.lineId, s.star, s.uid, s.items || [], s.formId || null, !s.formId);
});

/**
 * Case vue depuis l’autre côté : la rangée avant reste la rangée avant,
 * et la gauche devient la droite (rotation de 180°).
 */
export const mirrorIndex = (i) => {
  const rowLocal = Math.floor(i / BOARD_COLS);
  const col = i % BOARD_COLS;
  return (BOARD_ROWS_HALF - 1 - rowLocal) * BOARD_COLS + (BOARD_COLS - 1 - col);
};

export const mirrorBoard = (board) => {
  const out = Array(BOARD_SIZE).fill(null);
  (board || []).forEach((u, i) => { if (u) out[mirrorIndex(i)] = u; });
  return out;
};

/** Position de combat retournée (pour le joueur du haut). */
export const mirrorCell = (c) => ({ col: BOARD_COLS - 1 - c.col, row: BOARD_ROWS_HALF * 2 - 1 - c.row });

/**
 * Combat canonique : `homeSer` en bas (alliés), `awaySer` en haut (adversaires).
 * Renvoie le résultat brut + les deux plateaux reconstruits.
 */
export const runVersusFight = (homeSer, awaySer, seed) => withSeed(seed, () => {
  const home = rebuildBoard(homeSer);
  const awayTop = mirrorBoard(rebuildBoard(awaySer));
  const res = simulateFight(withBoardSlots(home, 'ally'), withBoardSlots(awayTop, 'foe'));
  return { res, home, awayTop };
});

/**
 * Lecture du combat pour un joueur donné.
 * isHome : ce joueur est en bas dans l’orientation canonique.
 */
export const versusView = (homeSer, awaySer, seed, isHome) => {
  const { res, home, awayTop } = runVersusFight(homeSer, awaySer, seed);
  if (isHome) {
    return { res, enemyBoard: awayTop, damageTaken: res.win ? 0 : res.damage, win: res.win };
  }
  const frames = res.frames.map((f) => {
    if (!f.pos) return f;
    const pos = {};
    Object.entries(f.pos).forEach(([uid, v]) => { pos[uid] = { ...v, ...mirrorCell(v) }; });
    return { ...f, pos };
  });
  const win = !res.win && res.foeSurvivors > 0;
  return {
    res: {
      ...res,
      win,
      frames,
      stats: res.stats.map((s) => ({ ...s, side: s.side === 'ally' ? 'foe' : 'ally' }))
    },
    enemyBoard: mirrorBoard(home),
    damageTaken: win ? 0 : res.allyDamage,
    win
  };
};

/** PV perdus par le perdant d’un round. */
export const versusLossDamage = (round, starsLeft) => Math.max(2, 2 + Math.floor(round / 3) + (starsLeft || 0));

/** « Chapitre » équivalent pour les revenus (1 → 3 au fil des rounds). */
export const versusChapter = (round) => Math.min(3, 1 + Math.floor((round - 1) / 6));
