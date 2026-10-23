/**
 * Poké Prairie : logique du jeu (sans interface).
 * Des Pokémon sauvages apparaissent dans les hautes herbes au fil du temps, même jeu fermé
 * (on rattrape le temps écoulé au retour), et on les capture pendant un « Rush ».
 * Tout tient dans une sauvegarde JSON : locale d'abord, synchronisée avec le compte quand on est en ligne.
 */
import { PR_DEX } from './prairieDex';

export const SAVE_KEY = 'poke-prairie-save';
export const SPAWN_MS = 3 * 60 * 1000; // une apparition toutes les 3 minutes
export const WILD_CAP = 40; // au-delà, les plus anciens repartent
export const BOX_CAP = 3000;
const SHINY_ODDS = 1 / 400;

export const RARITY = {
  common: { label: 'Commun', stars: 1, weight: 10, catch: 0.75, flee: 0.08, coins: 8, color: '#8fd16a' },
  uncommon: { label: 'Peu commun', stars: 2, weight: 5, catch: 0.55, flee: 0.12, coins: 14, color: '#4fb3ff' },
  rare: { label: 'Rare', stars: 3, weight: 1.6, catch: 0.38, flee: 0.18, coins: 30, color: '#b07bff' },
  epic: { label: 'Épique', stars: 4, weight: 0.35, catch: 0.2, flee: 0.25, coins: 70, color: '#ff9f2e' },
  legend: { label: 'Légendaire', stars: 5, weight: 0.05, catch: 0.08, flee: 0.35, coins: 200, color: '#ff4f7a' }
};
export const BALLS = {
  poke: { name: 'Poké Ball', mult: 1, price: 20, slug: 'poke-ball', key: '1' },
  super: { name: 'Super Ball', mult: 1.5, price: 60, slug: 'great-ball', key: '2' },
  hyper: { name: 'Hyper Ball', mult: 2.2, price: 150, slug: 'ultra-ball', key: '3' },
  master: { name: 'Master Ball', mult: 999, price: 5000, slug: 'master-ball', key: '4' }
};
export const ITEMS = {
  lure: { name: 'Leurre', desc: 'Pendant 30 min, les Pokémon apparaissent deux fois plus vite.', price: 200, ms: 30 * 60 * 1000, slug: 'lure' },
  incense: { name: 'Encens Rare', desc: 'Pendant 1 h, plus de Pokémon rares, épiques et légendaires.', price: 350, ms: 60 * 60 * 1000, slug: 'rare-candy' },
  charm: { name: 'Charme Chroma', desc: 'Pour toujours : les Pokémon chromatiques sont trois fois plus fréquents.', price: 25000, once: true, slug: 'shiny-stone' }
};

export const dexName = (dex) => PR_DEX[dex]?.[0] || `#${dex}`;
export const dexGen = (dex) => PR_DEX[dex]?.[3] || 1;
export const rarityOf = (dex) => {
  const e = PR_DEX[dex];
  if (!e) return 'common';
  const [, bst, flags] = e;
  if (flags & 3) return 'legend';
  if (bst >= 580) return 'epic';
  if (bst >= 490) return 'rare';
  if (bst >= 400) return 'uncommon';
  return 'common';
};
export const spriteOf = (dex, shiny = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? 'shiny/' : ''}${dex}.png`;
export const ballSprite = (slug) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

/* ——— Tirage ——— */
let POOL = null;
const pool = (incense) => {
  if (!POOL) {
    POOL = { normal: [], incense: [] };
    let a = 0;
    let b = 0;
    for (let d = 1; d < PR_DEX.length; d += 1) {
      const r = rarityOf(d);
      const flags = PR_DEX[d][2];
      // les formes de base (qui évoluent encore) sortent plus souvent que les formes finales
      const base = (flags & 8 ? 1.4 : 1) * ((PR_DEX[d][2] & 2) ? 0.4 : 1);
      a += RARITY[r].weight * base;
      b += RARITY[r].weight * base * ({ common: 0.6, uncommon: 1, rare: 2.2, epic: 3.5, legend: 5 })[r];
      POOL.normal.push([a, d]);
      POOL.incense.push([b, d]);
    }
  }
  return incense ? POOL.incense : POOL.normal;
};
const pickDex = (incense) => {
  const list = pool(incense);
  const x = Math.random() * list[list.length - 1][0];
  let lo = 0;
  let hi = list.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (list[m][0] < x) lo = m + 1; else hi = m; }
  return list[lo][1];
};
let uidSeq = 0;
const uid = () => `${Date.now().toString(36)}${(uidSeq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export const makeWild = (save, at = Date.now()) => {
  const incense = (save.boosts?.incense || 0) > at;
  const dex = pickDex(incense);
  const r = rarityOf(dex);
  const odds = SHINY_ODDS * (save.charm ? 3 : 1);
  const lvl = Math.min(100, Math.max(2, Math.round(({ common: 6, uncommon: 14, rare: 24, epic: 38, legend: 50 })[r] + (Math.random() - 0.3) * 14)));
  return { id: uid(), dex, shiny: Math.random() < odds, lvl, t: at };
};

/* ——— Sauvegarde ——— */
export const newSave = () => ({
  v: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  lastTick: Date.now(),
  coins: 150,
  balls: { poke: 20, super: 3, hyper: 0, master: 0 },
  boosts: { lure: 0, incense: 0 },
  charm: false,
  wild: [],
  box: [], // [uid, dex, shiny(0/1), lvl, caughtAt]
  partner: null, // uid d'un Pokémon de la boîte
  dex: {}, // dex -> [vu, attrapé, chroma attrapé]
  stats: { caught: 0, seen: 0, fled: 0, shinies: 0, rushes: 0, coinsEarned: 0 },
  daily: '',
  settings: { sound: true }
});
export const loadLocal = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (raw && raw.v === 1) return { ...newSave(), ...raw, stats: { ...newSave().stats, ...raw.stats }, balls: { ...newSave().balls, ...raw.balls }, boosts: { ...newSave().boosts, ...raw.boosts } };
  } catch { /* sauvegarde illisible : on repart de zéro */ }
  return newSave();
};
export const saveLocal = (save) => {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* stockage plein ou bloqué */ }
};
/** Progression comparable entre deux appareils (pour la synchro). */
export const progressScore = (s) => (s?.stats?.caught || 0) * 10 + (s?.stats?.coinsEarned || 0) / 100 + (s?.updatedAt || 0) / 1e13;

const touch = (s) => ({ ...s, updatedAt: Date.now() });
const seen = (dexMap, dex, caught = false, shiny = false) => {
  const cur = dexMap[dex] || [0, 0, 0];
  return { ...dexMap, [dex]: [1, cur[1] || (caught ? 1 : 0), cur[2] || (shiny && caught ? 1 : 0)] };
};

/**
 * Fait avancer le temps : apparitions depuis le dernier passage (rattrape aussi le temps jeu fermé).
 * Renvoie la nouvelle sauvegarde et le nombre d'apparitions.
 */
export const tick = (save, now = Date.now()) => {
  let t = save.lastTick || now;
  if (now - t > 7 * 24 * 3600 * 1000) t = now - 7 * 24 * 3600 * 1000; // une semaine au plus
  const wild = [...save.wild];
  let added = 0;
  for (;;) {
    const fast = (save.boosts?.lure || 0) > t;
    const step = fast ? SPAWN_MS / 2 : SPAWN_MS;
    if (t + step > now) break;
    t += step;
    wild.push(makeWild(save, t));
    added += 1;
  }
  if (!added) return { save, added: 0 };
  while (wild.length > WILD_CAP) wild.shift();
  return { save: { ...save, wild, lastTick: t }, added };
};
/** Prochaine apparition (ms restantes). */
export const nextSpawnIn = (save, now = Date.now()) => {
  const step = (save.boosts?.lure || 0) > now ? SPAWN_MS / 2 : SPAWN_MS;
  return Math.max(0, (save.lastTick || now) + step - now);
};

/** Cadeau du jour : des Poké Balls à la première visite de la journée. */
export const dailyGift = (save) => {
  const day = new Date().toISOString().slice(0, 10);
  if (save.daily === day) return { save, gift: null };
  const gift = { poke: 10, super: 3, hyper: save.stats.caught >= 100 ? 1 : 0 };
  return {
    save: touch({ ...save, daily: day, balls: { ...save.balls, poke: save.balls.poke + gift.poke, super: save.balls.super + gift.super, hyper: save.balls.hyper + gift.hyper } }),
    gift
  };
};

/**
 * Lance une Ball sur un Pokémon sauvage. Résultat : 'caught' | 'broke' (il reste) | 'fled' | 'noball'.
 * `shakes` = nombre de secousses à animer (0 à 3).
 */
export const throwBall = (save, wildId, ballId) => {
  const w = save.wild.find((x) => x.id === wildId);
  if (!w) return { save, result: 'gone' };
  if (!(save.balls[ballId] > 0)) return { save, result: 'noball' };
  const r = RARITY[rarityOf(w.dex)];
  const ball = BALLS[ballId];
  const partnerDex = save.box.find((b) => b[0] === save.partner)?.[1];
  const sameType = partnerDex && PR_DEX[partnerDex]?.[4] === PR_DEX[w.dex]?.[4] ? 1.1 : 1;
  const levelPenalty = 1 - Math.min(0.3, w.lvl / 400);
  const p = Math.min(0.99, r.catch * ball.mult * sameType * levelPenalty);
  const caught = ballId === 'master' || Math.random() < p;
  const balls = { ...save.balls, [ballId]: save.balls[ballId] - 1 };
  let next = { ...save, balls, dex: seen(save.dex, w.dex) };
  if (caught) {
    const isNew = !(save.dex[w.dex]?.[1]);
    const coins = Math.round(r.coins * (w.shiny ? 5 : 1) + (isNew ? 20 : 0));
    const box = [...save.box, [uid(), w.dex, w.shiny ? 1 : 0, w.lvl, Date.now()]].slice(-BOX_CAP);
    next = {
      ...next,
      wild: save.wild.filter((x) => x.id !== wildId),
      box,
      partner: save.partner || box[box.length - 1][0],
      coins: save.coins + coins,
      dex: seen(next.dex, w.dex, true, w.shiny),
      stats: { ...save.stats, caught: save.stats.caught + 1, shinies: save.stats.shinies + (w.shiny ? 1 : 0), coinsEarned: save.stats.coinsEarned + coins, seen: save.stats.seen + 1 }
    };
    return { save: touch(next), result: 'caught', shakes: 3, coins, isNew, wild: w };
  }
  const fled = Math.random() < r.flee;
  const shakes = Math.floor(Math.random() * 3);
  if (fled) {
    next = { ...next, wild: save.wild.filter((x) => x.id !== wildId), coins: save.coins + 1, stats: { ...save.stats, fled: save.stats.fled + 1, seen: save.stats.seen + 1 } };
    return { save: touch(next), result: 'fled', shakes, wild: w };
  }
  return { save: touch(next), result: 'broke', shakes, wild: w };
};
/** Laisser partir un Pokémon sauvage sans le capturer. */
export const letGo = (save, wildId) => touch({ ...save, wild: save.wild.filter((x) => x.id !== wildId) });

export const buy = (save, kind, id, qty = 1) => {
  if (kind === 'ball') {
    const cost = BALLS[id].price * qty;
    if (save.coins < cost) return null;
    return touch({ ...save, coins: save.coins - cost, balls: { ...save.balls, [id]: save.balls[id] + qty } });
  }
  const it = ITEMS[id];
  if (save.coins < it.price) return null;
  if (id === 'charm') return save.charm ? null : touch({ ...save, coins: save.coins - it.price, charm: true });
  const now = Date.now();
  const from = Math.max(now, save.boosts[id] || 0);
  return touch({ ...save, coins: save.coins - it.price, boosts: { ...save.boosts, [id]: from + it.ms } });
};

/** Transférer au Professeur : rend des pièces (la moitié de la prime de capture). */
export const transferValue = (entry) => Math.round(RARITY[rarityOf(entry[1])].coins * (entry[2] ? 5 : 1) / 2);
export const transfer = (save, uids) => {
  const set = new Set(uids);
  set.delete(save.partner);
  const gone = save.box.filter((b) => set.has(b[0]));
  const coins = gone.reduce((n, b) => n + transferValue(b), 0);
  return { save: touch({ ...save, box: save.box.filter((b) => !set.has(b[0])), coins: save.coins + coins }), coins, count: gone.length };
};
/** Doublons : on garde le meilleur exemplaire de chaque espèce (chromatique, puis niveau). Jamais le partenaire ni un chromatique. */
export const duplicates = (save) => {
  const best = new Map();
  save.box.forEach((b) => {
    const cur = best.get(b[1]);
    if (!cur || b[2] > cur[2] || (b[2] === cur[2] && b[3] > cur[3])) best.set(b[1], b);
  });
  return save.box.filter((b) => best.get(b[1]) !== b && !b[2] && b[0] !== save.partner).map((b) => b[0]);
};

/** Fusion de deux sauvegardes (deux appareils hors ligne) : on garde la plus avancée, enrichie du Pokédex de l'autre. */
export const mergeSaves = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  const [main, other] = progressScore(a) >= progressScore(b) ? [a, b] : [b, a];
  const dex = { ...main.dex };
  Object.entries(other.dex || {}).forEach(([d, v]) => {
    const c = dex[d] || [0, 0, 0];
    dex[d] = [c[0] || v[0], c[1] || v[1], c[2] || v[2]];
  });
  return { ...main, dex };
};

export const exportSave = (save) => JSON.stringify({ game: 'poke-prairie', exportedAt: Date.now(), save });
export const importSave = (text) => {
  const data = JSON.parse(text);
  const s = data?.save || data;
  if (!s || s.v !== 1 || !Array.isArray(s.box)) throw new Error('Ce fichier n’est pas une sauvegarde Poké Prairie.');
  return { ...newSave(), ...s };
};
