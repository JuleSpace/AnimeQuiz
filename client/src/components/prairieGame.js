/**
 * Poké Prairie : moteur du jeu idle (sans interface).
 * Ton équipe marche sur une route et combat toute seule les Pokémon sauvages : expérience, niveaux, évolutions,
 * captures selon tes règles, argent. Les Champions d'Arène lèvent le plafond de niveau et ouvrent la zone suivante.
 * Jeu fermé, le temps passé est rejoué en accéléré au retour (récapitulatif « Pendant ton absence »).
 */
import { PR_DEX } from './prairieDex';

export const SAVE_KEY = 'poke-prairie-v2';
export const PARTY_MAX = 6;
export const BOX_CAP = 2500;
export const WINS_FOR_GYM = 20;
export const AWAY_CAP_MS = 12 * 3600 * 1000; // 12 h de rattrapage au plus
export const BATTLE_MS = 14000; // durée moyenne d'une rencontre (marche + combat), pour le hors ligne
const SHINY_ODDS = 1 / 512;

/* ——— Pokédex ——— */
export const D = (dex) => PR_DEX[dex];
export const dexName = (dex) => PR_DEX[dex]?.[0] || `#${dex}`;
export const typesOf = (dex) => { const e = PR_DEX[dex]; return e ? (e[2] >= 0 ? [e[1], e[2]] : [e[1]]) : [0]; };
export const bstOf = (dex) => { const e = PR_DEX[dex]; return e ? e[3] + e[4] + e[5] + e[6] + e[7] + e[8] : 300; };
export const spriteOf = (dex, shiny = false) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? 'shiny/' : ''}${dex}.png`;
export const itemSprite = (slug) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
export const stars = (dex) => {
  const e = PR_DEX[dex];
  if (!e) return 1;
  if (e[9] & 3) return 5;
  const b = bstOf(dex);
  return b >= 580 ? 4 : b >= 490 ? 3 : b >= 400 ? 2 : 1;
};

/* Table des types : multiplicateurs de l'attaquant contre chaque type défenseur (ordre de PR_TYPES), ×1 omis. */
const REF = {
  // attaquant: { défenseur: multiplicateur } (seulement ce qui n'est pas ×1)
  0: { 5: 0.5, 7: 0, 8: 0.5 },
  1: { 0: 2, 2: 0.5, 3: 0.5, 5: 2, 6: 0.5, 7: 0, 8: 2, 13: 0.5, 14: 2, 16: 2, 17: 0.5 },
  2: { 1: 2, 5: 0.5, 6: 2, 8: 0.5, 11: 2, 12: 0.5 },
  3: { 3: 0.5, 4: 0.5, 5: 0.5, 7: 0.5, 8: 0, 11: 2, 17: 2 },
  4: { 2: 0, 3: 2, 5: 2, 6: 0.5, 8: 2, 9: 2, 11: 0.5, 12: 2 },
  5: { 1: 0.5, 2: 2, 4: 0.5, 6: 2, 8: 0.5, 9: 2, 14: 2 },
  6: { 1: 0.5, 2: 0.5, 3: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 11: 2, 13: 2, 16: 2, 17: 0.5 },
  7: { 0: 0, 7: 2, 13: 2, 16: 0.5 },
  8: { 5: 2, 8: 0.5, 9: 0.5, 10: 0.5, 12: 0.5, 14: 2, 17: 2 },
  9: { 5: 0.5, 6: 2, 8: 2, 9: 0.5, 10: 0.5, 11: 2, 14: 2, 15: 0.5 },
  10: { 4: 2, 5: 2, 9: 2, 10: 0.5, 11: 0.5, 15: 0.5 },
  11: { 2: 0.5, 3: 0.5, 4: 2, 5: 2, 6: 0.5, 8: 0.5, 9: 0.5, 10: 2, 11: 0.5, 15: 0.5 },
  12: { 2: 2, 4: 0, 10: 2, 11: 0.5, 12: 0.5, 15: 0.5 },
  13: { 1: 2, 3: 2, 8: 0.5, 13: 0.5, 16: 0 },
  14: { 2: 2, 4: 2, 8: 0.5, 9: 0.5, 10: 0.5, 11: 2, 14: 0.5, 15: 2 },
  15: { 8: 0.5, 15: 2, 17: 0 },
  16: { 1: 0.5, 7: 2, 13: 2, 16: 0.5, 17: 0.5 },
  17: { 1: 2, 3: 0.5, 8: 0.5, 9: 0.5, 15: 2, 16: 2 }
};
export const eff = (atk, def) => def.reduce((m, t) => m * (REF[atk]?.[t] ?? 1), 1);

/* ——— Zones et Arènes ——— */
export const ZONES = [
  { name: 'Route des Pâquerettes', biome: 'prairie', lv: [2, 7], types: [0, 2, 6, 11], bst: 330, gym: { name: 'Pierre', type: 5, badge: 'Badge Roche', team: [[74, 12], [95, 14]] } },
  { name: 'Bois des Lucioles', biome: 'foret', lv: [8, 14], types: [6, 11, 3, 0], bst: 360, gym: { name: 'Ondine', type: 10, badge: 'Badge Cascade', team: [[120, 19], [121, 21]] } },
  { name: 'Côte Turquoise', biome: 'plage', lv: [14, 21], types: [10, 2, 4, 12], bst: 400, gym: { name: 'Major Bob', type: 12, badge: 'Badge Foudre', team: [[100, 24], [25, 25], [26, 27]] } },
  { name: 'Prés Fleuris', biome: 'fleurs', lv: [20, 28], types: [11, 17, 0, 6], bst: 430, gym: { name: 'Érika', type: 11, badge: 'Badge Prisme', team: [[71, 29], [114, 30], [45, 32]] } },
  { name: 'Marais Brumeux', biome: 'marais', lv: [27, 35], types: [3, 7, 16, 10], bst: 470, gym: { name: 'Koga', type: 3, badge: 'Badge Âme', team: [[109, 37], [89, 38], [110, 39], [49, 40]] } },
  { name: 'Mont Braise', biome: 'volcan', lv: [34, 42], types: [9, 5, 1, 4], bst: 500, gym: { name: 'Auguste', type: 9, badge: 'Badge Volcan', team: [[59, 44], [78, 45], [126, 46], [136, 47]] } },
  { name: 'Cimes Gelées', biome: 'neige', lv: [41, 50], types: [14, 13, 8, 15], bst: 530, gym: { name: 'Morgane', type: 13, badge: 'Badge Marais', team: [[122, 50], [49, 50], [64, 51], [65, 53]] } },
  { name: 'Plateau Céleste', biome: 'ciel', lv: [49, 60], types: [15, 2, 4, 16], bst: 560, gym: { name: 'Giovanni', type: 4, badge: 'Badge Terre', team: [[111, 55], [51, 56], [31, 57], [34, 57], [112, 60]] } },
  { name: 'Îles Légendaires', biome: 'iles', lv: [60, 80], types: [], bst: 720, gym: null }
];
export const levelCap = (save) => Math.min(100, 15 + save.badges * 10 + (save.badges >= 8 ? 100 : 0));

const POOLS = [];
const zonePool = (z) => {
  if (POOLS[z]) return POOLS[z];
  const Z = ZONES[z];
  const list = [];
  let acc = 0;
  for (let d = 1; d < PR_DEX.length; d += 1) {
    const e = PR_DEX[d];
    const legend = e[9] & 3;
    if (legend && z < ZONES.length - 1) continue;
    const b = bstOf(d);
    if (b > Z.bst) continue;
    const base = e[9] & 16;
    if (z < 4 && !base && b > Z.bst - 60) continue;
    const typed = !Z.types.length || typesOf(d).some((t) => Z.types.includes(t));
    let w = (typed ? 4 : 0.6) * (base ? 2.5 : 1) * (e[9] & 4 ? 0.3 : 1);
    w *= ({ 1: 1, 2: 0.7, 3: 0.35, 4: 0.12, 5: 0.02 })[stars(d)];
    if (legend) w = 0.015;
    acc += w;
    list.push([acc, d]);
  }
  POOLS[z] = list;
  return list;
};

/* ——— Pokémon ——— */
let seq = 0;
export const uid = () => `${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const expFor = (l) => l * l * l;
export const statOf = (dex, l, k) => {
  const b = PR_DEX[dex]?.[3 + k] || 50;
  return k === 0 ? Math.floor(((2 * b + 15) * l) / 100) + l + 10 : Math.floor(((2 * b + 15) * l) / 100) + 5;
};
export const maxHp = (m) => statOf(m.d, m.l, 0);
/** Un Pokémon : { u, d (espèce), l (niveau), x (expérience), s (chromatique), c (capturé le) } */
export const makeMon = (dex, l, shiny = false) => ({ u: uid(), d: dex, l, x: expFor(l), s: shiny ? 1 : 0, c: Date.now() });

export const spawnWild = (save) => {
  const z = save.zone;
  const list = zonePool(z);
  const x = Math.random() * list[list.length - 1][0];
  let lo = 0;
  let hi = list.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (list[m][0] < x) lo = m + 1; else hi = m; }
  const dex = list[lo][1];
  const [a, b] = ZONES[z].lv;
  const legend = PR_DEX[dex][9] & 3;
  const mon = makeMon(dex, legend ? b : rnd(a, b), Math.random() < SHINY_ODDS * (save.charm ? 3 : 1));
  return { ...mon, hp: maxHp(mon) };
};

/* ——— Combat ——— */
/** Dégâts d'une attaque (type le plus efficace, catégorie physique ou spéciale selon le meilleur stat). */
export const hit = (a, b) => {
  const physical = statOf(a.d, a.l, 1) >= statOf(a.d, a.l, 3);
  const A = statOf(a.d, a.l, physical ? 1 : 3);
  const Df = statOf(b.d, b.l, physical ? 2 : 4);
  const bt = typesOf(b.d);
  const choices = typesOf(a.d).map((t) => [t, eff(t, bt)]).sort((x, y) => y[1] - x[1]);
  const [type, mult] = choices[0];
  const crit = Math.random() < 1 / 16;
  const power = 55 + Math.min(35, a.l * 0.5);
  const base = (((2 * a.l) / 5 + 2) * power * A) / Df / 50 + 2;
  const dmg = mult === 0 ? 0 : Math.max(1, Math.floor(base * 1.5 * mult * (crit ? 1.5 : 1) * (0.85 + Math.random() * 0.15)));
  return { dmg, type, mult, crit };
};
export const speedOf = (m) => statOf(m.d, m.l, 5);

/** Expérience donnée par un Pokémon vaincu. */
export const expGain = (foe) => Math.max(4, Math.floor((bstOf(foe.d) / 4.2) * foe.l / 7 * 3));

/* ——— Sauvegarde ——— */
export const STARTERS = [1, 4, 7, 25, 133, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912];
export const newSave = () => ({
  v: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  lastTick: Date.now(),
  money: 300,
  balls: { poke: 15, super: 0, hyper: 0, master: 0 },
  items: { candy: 0, potion: 3 },
  box: [], // tous les Pokémon (équipe comprise)
  party: [], // uids, 6 au plus
  hp: {}, // uid -> PV actuels (équipe)
  zone: 0,
  maxZone: 0,
  zoneWins: {},
  badges: 0,
  dex: {}, // dex -> [vu, attrapé, chroma]
  rules: { newSpecies: true, shiny: true, minStars: 3, all: false, ball: 'poke' },
  stats: { wins: 0, battles: 0, caught: 0, wipes: 0, evolutions: 0, shinies: 0, moneyEarned: 0 },
  log: [],
  charm: false,
  started: false
});
export const loadLocal = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (raw && raw.v === 2) {
      const b = newSave();
      return { ...b, ...raw, balls: { ...b.balls, ...raw.balls }, items: { ...b.items, ...raw.items }, rules: { ...b.rules, ...raw.rules }, stats: { ...b.stats, ...raw.stats } };
    }
  } catch { /* illisible : nouvelle partie */ }
  return newSave();
};
export const saveLocal = (s) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* plein */ } };
export const progressScore = (s) => (s?.badges || 0) * 1e6 + (s?.stats?.wins || 0) + (s?.updatedAt || 0) / 1e13;
export const mergeSaves = (a, b) => (!a ? b : !b ? a : progressScore(a) >= progressScore(b) ? a : b);
export const exportSave = (s) => JSON.stringify({ game: 'poke-prairie', exportedAt: Date.now(), save: s });
export const importSave = (text) => {
  const data = JSON.parse(text);
  const s = data?.save || data;
  if (!s || s.v !== 2 || !Array.isArray(s.box)) throw new Error('Ce fichier n’est pas une sauvegarde Poké Prairie.');
  return { ...newSave(), ...s };
};

const markDex = (dex, d, caught = false, shiny = false) => {
  const c = dex[d] || [0, 0, 0];
  return { ...dex, [d]: [1, c[1] || (caught ? 1 : 0), c[2] || (caught && shiny ? 1 : 0)] };
};
const pushLog = (s, entry) => { s.log = [{ t: Date.now(), ...entry }, ...(s.log || [])].slice(0, 40); };

export const chooseStarter = (save, dex) => {
  const m = makeMon(dex, 5);
  return { ...save, started: true, box: [m], party: [m.u], hp: { [m.u]: maxHp(m) }, dex: markDex(save.dex, dex, true), updatedAt: Date.now(), lastTick: Date.now() };
};

export const monById = (save, u) => save.box.find((m) => m.u === u);
export const partyMons = (save) => save.party.map((u) => monById(save, u)).filter(Boolean);
export const curHp = (save, m) => Math.min(maxHp(m), save.hp[m.u] ?? maxHp(m));

/**
 * Après une victoire : expérience (pleine pour celui qui a combattu, moitié pour les autres),
 * montée de niveau dans la limite du plafond, évolutions. Mute `s` (copie de travail).
 */
const giveExp = (s, fighterU, amount, events) => {
  const cap = levelCap(s);
  s.party.forEach((u) => {
    const i = s.box.findIndex((m) => m.u === u);
    if (i < 0) return;
    const m = { ...s.box[i] };
    if (m.l >= cap) return;
    m.x += u === fighterU ? amount : Math.floor(amount / 2);
    const before = m.l;
    while (m.l < cap && m.x >= expFor(m.l + 1)) m.l += 1;
    if (m.l === cap) m.x = Math.min(m.x, expFor(cap));
    if (m.l > before) {
      events.push({ kind: 'level', u, d: m.d, l: m.l });
      const evo = PR_DEX[m.d]?.[12] || [];
      const ok = evo.filter(([, L]) => m.l >= L);
      if (ok.length) {
        const [to] = ok[Math.floor(Math.random() * ok.length)];
        events.push({ kind: 'evolve', u, from: m.d, d: to });
        pushLog(s, { kind: 'evolve', from: m.d, d: to, s: m.s });
        s.stats.evolutions += 1;
        m.d = to;
        s.dex = markDex(s.dex, to, true, Boolean(m.s));
      }
      s.hp[u] = Math.min(maxHp(m), (s.hp[u] ?? 0) + Math.floor(maxHp(m) * 0.2));
    }
    s.box[i] = m;
  });
};

/** La règle de capture veut-elle ce Pokémon ? */
export const wants = (save, foe) => {
  const r = save.rules;
  if (r.all) return true;
  if (r.shiny && foe.s) return true;
  if (r.newSpecies && !save.dex[foe.d]?.[1]) return true;
  return stars(foe.d) >= (r.minStars || 9);
};
export const BALLS = {
  poke: { name: 'Poké Ball', mult: 1, price: 40, slug: 'poke-ball' },
  super: { name: 'Super Ball', mult: 1.6, price: 120, slug: 'great-ball' },
  hyper: { name: 'Hyper Ball', mult: 2.4, price: 300, slug: 'ultra-ball' },
  master: { name: 'Master Ball', mult: 999, price: 20000, slug: 'master-ball' }
};
export const SHOP_ITEMS = {
  potion: { name: 'Potion', desc: 'Soigne toute l’équipe de 50 %. S’utilise toute seule quand l’équipe va mal.', price: 150, slug: 'potion' },
  candy: { name: 'Super Bonbon', desc: 'Un niveau de plus pour un Pokémon (dans la limite du plafond).', price: 900, slug: 'rare-candy' },
  charm: { name: 'Charme Chroma', desc: 'Pour toujours : trois fois plus de Pokémon chromatiques.', price: 60000, slug: 'shiny-stone', once: true }
};
/** Choisit la Ball : celle des règles, sinon la meilleure qui reste (jamais la Master Ball sans le vouloir). */
const pickBall = (s) => {
  const want = s.rules.ball || 'poke';
  if (s.balls[want] > 0) return want;
  return ['poke', 'super', 'hyper'].find((b) => s.balls[b] > 0) || null;
};
const tryCatch = (s, foe, events) => {
  if (!wants(s, foe)) return;
  const ball = pickBall(s);
  if (!ball) { events.push({ kind: 'noball', d: foe.d }); return; }
  s.balls = { ...s.balls, [ball]: s.balls[ball] - 1 };
  const rate = (PR_DEX[foe.d]?.[11] || 45) / 255;
  const ok = ball === 'master' || Math.random() < Math.min(0.97, rate * BALLS[ball].mult * 1.4 + 0.12);
  if (!ok) { events.push({ kind: 'escape', d: foe.d, ball }); return; }
  const m = { u: uid(), d: foe.d, l: foe.l, x: expFor(foe.l), s: foe.s, c: Date.now() };
  s.box = [...s.box, m].slice(-BOX_CAP);
  if (s.party.length < PARTY_MAX) { s.party = [...s.party, m.u]; s.hp[m.u] = maxHp(m); }
  s.dex = markDex(s.dex, foe.d, true, Boolean(foe.s));
  s.stats.caught += 1;
  if (foe.s) s.stats.shinies += 1;
  events.push({ kind: 'catch', d: foe.d, s: foe.s, ball, u: m.u });
  if (foe.s || stars(foe.d) >= 4) pushLog(s, { kind: 'catch', d: foe.d, s: foe.s, l: foe.l });
};

/**
 * Résout une victoire ou une défaite (après un combat joué en direct ou simulé).
 * `fighters` : uids qui ont combattu ; renvoie { save, events }.
 */
export const settle = (save, foe, won, lastFighter, gym = null) => {
  const s = { ...save, box: [...save.box], hp: { ...save.hp }, stats: { ...save.stats }, balls: { ...save.balls }, zoneWins: { ...save.zoneWins } };
  const events = [];
  s.stats.battles += 1;
  s.dex = markDex(s.dex, foe.d);
  if (won) {
    s.stats.wins += 1;
    const money = gym ? 500 * (s.badges + 1) : Math.round(foe.l * 2 + bstOf(foe.d) / 40);
    s.money += money;
    s.stats.moneyEarned += money;
    events.push({ kind: 'win', money });
    giveExp(s, lastFighter, expGain(foe) * (gym ? 2 : 1), events);
    if (gym) {
      // une Arène se gagne en battant toute son équipe : géré par l'appelant (dernier Pokémon du Champion)
    } else {
      s.zoneWins[s.zone] = (s.zoneWins[s.zone] || 0) + 1;
      tryCatch(s, foe, events);
    }
  } else {
    s.stats.wipes += 1;
    const lost = Math.floor(s.money * 0.1);
    s.money -= lost;
    s.zoneWins[s.zone] = Math.max(0, (s.zoneWins[s.zone] || 0) - 3);
    partyMons(s).forEach((m) => { s.hp[m.u] = maxHp(m); });
    events.push({ kind: 'wipe', lost });
  }
  // Récupération en marchant ; une Potion part toute seule si l'équipe est au plus mal
  partyMons(s).forEach((m) => { s.hp[m.u] = Math.min(maxHp(m), (s.hp[m.u] ?? maxHp(m)) + Math.ceil(maxHp(m) * 0.12)); });
  const total = partyMons(s).reduce((n, m) => n + maxHp(m), 0);
  const left = partyMons(s).reduce((n, m) => n + curHp(s, m), 0);
  if (s.items.potion > 0 && left < total * 0.35) {
    s.items = { ...s.items, potion: s.items.potion - 1 };
    partyMons(s).forEach((m) => { s.hp[m.u] = Math.min(maxHp(m), curHp(s, m) + Math.ceil(maxHp(m) * 0.5)); });
    events.push({ kind: 'potion' });
  }
  s.updatedAt = Date.now();
  return { save: s, events };
};

/** Premier Pokémon de l'équipe encore debout. */
export const nextFighter = (save) => partyMons(save).find((m) => curHp(save, m) > 0) || null;

/** Combat complet sans animation (hors ligne). Renvoie { won, save (PV à jour), last } */
export const simulate = (save, foe) => {
  const s = { ...save, hp: { ...save.hp } };
  let f = { ...foe };
  let me = nextFighter(s);
  let guard = 0;
  while (me && f.hp > 0 && guard < 400) {
    guard += 1;
    const order = speedOf(me) >= speedOf(f) ? [me, f] : [f, me];
    for (const a of order) {
      if (a === me) { f.hp -= hit(me, f).dmg; if (f.hp <= 0) break; } else {
        s.hp[me.u] = curHp(s, me) - hit(f, me).dmg;
        if (s.hp[me.u] <= 0) { s.hp[me.u] = 0; break; }
      }
    }
    if (s.hp[me.u] <= 0) me = nextFighter(s);
  }
  return { won: f.hp <= 0, save: s, last: me?.u || null };
};

/**
 * Rattrape le temps passé jeu fermé (ou onglet en veille) : rencontres simulées, sans les Arènes.
 * Renvoie { save, summary }.
 */
export const catchUp = (save, now = Date.now()) => {
  if (!save.started || !save.party.length) return { save: { ...save, lastTick: now }, summary: null };
  const elapsed = Math.min(AWAY_CAP_MS, Math.max(0, now - (save.lastTick || now)));
  const n = Math.floor(elapsed / BATTLE_MS);
  if (n < 1) return { save, summary: null };
  let s = save;
  const sum = { ms: elapsed, battles: 0, wins: 0, wipes: 0, money: 0, caught: [], levels: 0, evolutions: [] };
  const before = Object.fromEntries(partyMons(save).map((m) => [m.u, m.l]));
  for (let i = 0; i < n; i += 1) {
    const foe = spawnWild(s);
    const r = simulate(s, foe);
    const out = settle(r.save, foe, r.won, r.last);
    s = out.save;
    sum.battles += 1;
    out.events.forEach((e) => {
      if (e.kind === 'win') { sum.wins += 1; sum.money += e.money; }
      if (e.kind === 'wipe') sum.wipes += 1;
      if (e.kind === 'catch') sum.caught.push({ d: e.d, s: e.s });
      if (e.kind === 'evolve') sum.evolutions.push({ from: e.from, d: e.d });
    });
  }
  partyMons(s).forEach((m) => { sum.levels += Math.max(0, m.l - (before[m.u] || m.l)); });
  return { save: { ...s, lastTick: (save.lastTick || now) + n * BATTLE_MS }, summary: sum };
};

/* ——— Arène ——— */
export const gymReady = (save) => ZONES[save.zone]?.gym && save.badges === save.zone && (save.zoneWins[save.zone] || 0) >= WINS_FOR_GYM;
export const gymTeam = (zone) => (ZONES[zone].gym?.team || []).map(([d, l]) => { const m = makeMon(d, l); return { ...m, hp: maxHp(m) }; });
export const winGym = (save) => {
  const s = { ...save, badges: save.badges + 1, maxZone: Math.max(save.maxZone, save.zone + 1) };
  const g = ZONES[save.zone].gym;
  s.money += 1500 * s.badges;
  s.balls = { ...s.balls, super: s.balls.super + 5, hyper: s.balls.hyper + (s.badges >= 4 ? 3 : 0) };
  partyMons(s).forEach((m) => { s.hp = { ...s.hp, [m.u]: maxHp(m) }; });
  pushLog(s, { kind: 'badge', badge: g.badge, leader: g.name });
  s.updatedAt = Date.now();
  return s;
};

/* ——— Équipe, boutique ——— */
export const travel = (save, z) => (z <= save.maxZone ? { ...save, zone: z, updatedAt: Date.now() } : save);
export const healAll = (save) => ({ ...save, hp: Object.fromEntries(partyMons(save).map((m) => [m.u, maxHp(m)])) });
export const setParty = (save, uids) => {
  const party = uids.slice(0, PARTY_MAX);
  const hp = { ...save.hp };
  party.forEach((u) => { const m = monById(save, u); if (m && hp[u] === undefined) hp[u] = maxHp(m); });
  return { ...save, party, hp, updatedAt: Date.now() };
};
export const buy = (save, kind, id, qty = 1) => {
  if (kind === 'ball') {
    const cost = BALLS[id].price * qty;
    if (save.money < cost) return null;
    return { ...save, money: save.money - cost, balls: { ...save.balls, [id]: save.balls[id] + qty }, updatedAt: Date.now() };
  }
  const it = SHOP_ITEMS[id];
  if (save.money < it.price * qty) return null;
  if (id === 'charm') return save.charm ? null : { ...save, money: save.money - it.price, charm: true, updatedAt: Date.now() };
  return { ...save, money: save.money - it.price * qty, items: { ...save.items, [id]: (save.items[id] || 0) + qty }, updatedAt: Date.now() };
};
export const feedCandy = (save, u) => {
  if (!(save.items.candy > 0)) return { save, events: [] };
  const s = { ...save, box: [...save.box], hp: { ...save.hp }, stats: { ...save.stats }, items: { ...save.items, candy: save.items.candy - 1 } };
  const m = monById(s, u);
  if (!m || m.l >= levelCap(s)) return { save, events: [] };
  const i = s.box.indexOf(m);
  s.box[i] = { ...m, x: expFor(m.l + 1) };
  const events = [];
  const keep = s.party;
  s.party = [u];
  giveExp(s, u, 0, events);
  s.party = keep;
  s.updatedAt = Date.now();
  return { save: s, events };
};
export const releaseValue = (m) => 20 * stars(m.d) * (m.s ? 10 : 1) + m.l * 2;
export const release = (save, uids) => {
  const set = new Set(uids.filter((u) => !save.party.includes(u)));
  const gone = save.box.filter((m) => set.has(m.u));
  const money = gone.reduce((n, m) => n + releaseValue(m), 0);
  return { save: { ...save, box: save.box.filter((m) => !set.has(m.u)), money: save.money + money, updatedAt: Date.now() }, money, count: gone.length };
};
/** Doublons : garde le meilleur (chromatique puis niveau) de chaque espèce, jamais l'équipe ni un chromatique. */
export const duplicates = (save) => {
  const best = new Map();
  save.box.forEach((m) => { const c = best.get(m.d); if (!c || m.s > c.s || (m.s === c.s && m.l > c.l)) best.set(m.d, m); });
  return save.box.filter((m) => best.get(m.d) !== m && !m.s && !save.party.includes(m.u)).map((m) => m.u);
};
