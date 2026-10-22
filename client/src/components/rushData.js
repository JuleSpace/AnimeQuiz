/**
 * Poké Rush : données propres au mode 3D (types, table des types, attaques en 3D, progression).
 * Les Pokémon, attaques et objets viennent du Swarm (swarmData) ; la progression est séparée.
 */
import { FOES, GEN_POOLS, PARTNERS, PASSIVES, WEAPONS } from './swarmData';

export const RUSH_SECONDS = 9 * 60; // le légendaire se réveille à 8:00, il faut le battre dans l'arène
export const FINAL_AT = 8 * 60;
export const MAX_ALLIES = 3;

/* ——— Types de chaque Pokémon sauvage ——— */
export const FOE_TYPES = {
  rattata: ['Normal'], pidgey: ['Normal', 'Vol'], caterpie: ['Insecte'], zubat: ['Poison', 'Vol'], ekans: ['Poison'],
  geodude: ['Roche', 'Sol'], gastly: ['Spectre', 'Poison'], raticate: ['Normal'], golbat: ['Poison', 'Vol'], graveler: ['Roche', 'Sol'],
  haunter: ['Spectre', 'Poison'], spearow: ['Normal', 'Vol'], oddish: ['Plante', 'Poison'], mankey: ['Combat'], koffing: ['Poison'],
  magnemite: ['Électrik', 'Acier'], machop: ['Combat'], bellsprout: ['Plante', 'Poison'], primeape: ['Combat'], weezing: ['Poison'],
  magneton: ['Électrik', 'Acier'], arbok: ['Poison'], onix: ['Roche', 'Sol'], snorlax: ['Normal'], gyarados: ['Eau', 'Vol'],
  aerodactyl: ['Roche', 'Vol'], mewtwo: ['Psy'], articuno: ['Glace', 'Vol'], zapdos: ['Électrik', 'Vol'], moltres: ['Feu', 'Vol'],
  sentret: ['Normal'], furret: ['Normal'], hoothoot: ['Normal', 'Vol'], noctowl: ['Normal', 'Vol'], ledyba: ['Insecte', 'Vol'],
  spinarak: ['Insecte', 'Poison'], ariados: ['Insecte', 'Poison'], crobat: ['Poison', 'Vol'], mareep: ['Électrik'], misdreavus: ['Spectre'],
  pineco: ['Insecte'], snubbull: ['Fée'], teddiursa: ['Normal'], ursaring: ['Normal'], blissey: ['Normal'], wooper: ['Eau', 'Sol'],
  marill: ['Eau', 'Fée'], natu: ['Psy', 'Vol'], yanma: ['Insecte', 'Vol'], houndour: ['Ténèbres', 'Feu'], sneasel: ['Ténèbres', 'Glace'],
  houndoom: ['Ténèbres', 'Feu'], skarmory: ['Acier', 'Vol'], donphan: ['Sol'], granbull: ['Fée'], gligar: ['Sol', 'Vol'],
  steelix: ['Acier', 'Sol'], tyranitar: ['Roche', 'Ténèbres'], lugia: ['Psy', 'Vol'], scizor: ['Insecte', 'Acier'], heracross: ['Insecte', 'Combat'],
  hooh: ['Feu', 'Vol'], entei: ['Feu'], raikou: ['Électrik'], suicune: ['Eau'],
  poochyena: ['Ténèbres'], mightyena: ['Ténèbres'], zigzagoon: ['Normal'], wurmple: ['Insecte'], taillow: ['Normal', 'Vol'],
  swellow: ['Normal', 'Vol'], wingull: ['Eau', 'Vol'], makuhita: ['Combat'], hariyama: ['Combat'], sableye: ['Ténèbres', 'Spectre'],
  aron: ['Acier', 'Roche'], lairon: ['Acier', 'Roche'], seedot: ['Plante'], lotad: ['Eau', 'Plante'], whismur: ['Normal'],
  shroomish: ['Plante'], nuzleaf: ['Plante', 'Ténèbres'], electrike: ['Électrik'], numel: ['Feu', 'Sol'], manectric: ['Électrik'],
  shiftry: ['Plante', 'Ténèbres'], absol: ['Ténèbres'], banette: ['Spectre'], camerupt: ['Feu', 'Sol'], aggron: ['Acier', 'Roche'],
  salamence: ['Dragon', 'Vol'], rayquaza: ['Dragon', 'Vol'], metagross: ['Acier', 'Psy'], flygon: ['Sol', 'Dragon'],
  groudon: ['Sol'], kyogre: ['Eau'], latios: ['Dragon', 'Psy'], latias: ['Dragon', 'Psy'],
  starly: ['Normal', 'Vol'], staravia: ['Normal', 'Vol'], bidoof: ['Normal'], shinx: ['Électrik'], luxio: ['Électrik'],
  drifloon: ['Spectre', 'Vol'], stunky: ['Poison', 'Ténèbres'], gible: ['Dragon', 'Sol'], gabite: ['Dragon', 'Sol'], croagunk: ['Poison', 'Combat'],
  kricketot: ['Insecte'], budew: ['Plante', 'Poison'], buizel: ['Eau'], buneary: ['Normal'], glameow: ['Normal'], skorupi: ['Poison', 'Insecte'],
  kricketune: ['Insecte'], honchkrow: ['Ténèbres', 'Vol'], drapion: ['Poison', 'Ténèbres'], lucario: ['Combat', 'Acier'],
  weavile: ['Ténèbres', 'Glace'], mismagius: ['Spectre'], garchomp: ['Dragon', 'Sol'], mamoswine: ['Glace', 'Sol'],
  rhyperior: ['Sol', 'Roche'], electivire: ['Électrik'], dialga: ['Acier', 'Dragon'], palkia: ['Eau', 'Dragon'],
  giratina: ['Spectre', 'Dragon'], darkrai: ['Ténèbres']
};
export const foeTypes = (id) => FOE_TYPES[id] || ['Normal'];

/* ——— Table des types (attaque → défense). Une immunité compte comme « pas très efficace » (×0,25) pour rester jouable. ——— */
const SE = {
  Normal: [], Feu: ['Plante', 'Glace', 'Insecte', 'Acier'], Eau: ['Feu', 'Sol', 'Roche'], Plante: ['Eau', 'Sol', 'Roche'],
  Électrik: ['Eau', 'Vol'], Glace: ['Plante', 'Sol', 'Vol', 'Dragon'], Combat: ['Normal', 'Glace', 'Roche', 'Ténèbres', 'Acier'],
  Poison: ['Plante', 'Fée'], Sol: ['Feu', 'Électrik', 'Poison', 'Roche', 'Acier'], Vol: ['Plante', 'Combat', 'Insecte'],
  Psy: ['Combat', 'Poison'], Insecte: ['Plante', 'Psy', 'Ténèbres'], Roche: ['Feu', 'Glace', 'Vol', 'Insecte'],
  Spectre: ['Psy', 'Spectre'], Dragon: ['Dragon'], Ténèbres: ['Psy', 'Spectre'], Acier: ['Glace', 'Roche', 'Fée'], Fée: ['Combat', 'Dragon', 'Ténèbres']
};
const NVE = {
  Normal: ['Roche', 'Acier'], Feu: ['Feu', 'Eau', 'Roche', 'Dragon'], Eau: ['Eau', 'Plante', 'Dragon'],
  Plante: ['Feu', 'Plante', 'Poison', 'Vol', 'Insecte', 'Dragon', 'Acier'], Électrik: ['Électrik', 'Plante', 'Dragon'],
  Glace: ['Feu', 'Eau', 'Glace', 'Acier'], Combat: ['Poison', 'Vol', 'Psy', 'Insecte', 'Fée'], Poison: ['Poison', 'Sol', 'Roche', 'Spectre'],
  Sol: ['Plante', 'Insecte'], Vol: ['Électrik', 'Roche', 'Acier'], Psy: ['Psy', 'Acier'], Insecte: ['Feu', 'Combat', 'Poison', 'Vol', 'Spectre', 'Acier', 'Fée'],
  Roche: ['Combat', 'Sol', 'Acier'], Spectre: ['Ténèbres'], Dragon: ['Acier'], Ténèbres: ['Combat', 'Ténèbres', 'Fée'],
  Acier: ['Feu', 'Eau', 'Électrik', 'Acier'], Fée: ['Feu', 'Poison', 'Acier']
};
const IMMUNE = {
  Normal: ['Spectre'], Électrik: ['Sol'], Combat: ['Spectre'], Poison: ['Acier'], Sol: ['Vol'], Psy: ['Ténèbres'], Spectre: ['Normal'], Dragon: ['Fée']
};
export const typeMult = (atk, defTypes) => defTypes.reduce((m, d) => {
  if (IMMUNE[atk]?.includes(d)) return m * 0.25;
  if (SE[atk]?.includes(d)) return m * 2;
  if (NVE[atk]?.includes(d)) return m * 0.5;
  return m;
}, 1);
export const TYPE_LIST = Object.keys(SE);
export const TYPE_COLORS = {
  Normal: '#b8b48a', Feu: '#ee8130', Eau: '#6390f0', Plante: '#7ac74c', Électrik: '#f7d02c', Glace: '#7fd8e8', Combat: '#d2513f',
  Poison: '#a35cc4', Sol: '#d9b25a', Vol: '#a98ff3', Psy: '#f95587', Insecte: '#a6b91a', Roche: '#b6a136', Spectre: '#8a6bc4',
  Dragon: '#6f35fc', Ténèbres: '#6b5a4c', Acier: '#b7b7ce', Fée: '#ff9ad8'
};
/** Faiblesses d'un Pokémon sauvage (pour la fiche et l'aide en partie). */
export const weaknessesOf = (types) => TYPE_LIST.filter((t) => typeMult(t, types) > 1);

/* ——— Les attaques du Swarm, rejouées en 3D ———
 * Les distances du Swarm sont en pixels : on les convertit en mètres (PX).
 * Chaque attaque reçoit un comportement 3D générique.
 */
export const PX = 1 / 20;
export const MOVE_KIND = {
  thunder: 'chain', aerialace: 'chain',
  ember: 'blast', electroball: 'blast', seedbomb: 'lob', mudbomb: 'puddle', sludge: 'puddle',
  watergun: 'pierce', shadow: 'pierce', flashcannon: 'pierce', leafblade: 'boomerang',
  leaf: 'orbit',
  quake: 'nova', spark: 'nova', surf: 'nova', dazzlinggleam: 'nova',
  swift: 'homing', willowisp: 'homing', bubble: 'bubble',
  icebeam: 'beam', hydropump: 'beam', hyperbeam: 'beam',
  psychic: 'psychic',
  hurricane: 'tornado', whirlpool: 'tornado',
  rockslide: 'meteor', dracometeor: 'meteor',
  bodyslam: 'dash',
  blizzard: 'radial',
  nightslash: 'claws', bite: 'claws', machpunch: 'claws', doublekick: 'claws',
  irontail: 'cone', flamethrower: 'cone',
  thunderwave: 'stun',
  firespin: 'firering', bloom: 'bloom', flametrail: 'trail',
  gigadrain: 'drain'
};

/* ——— Capture ——— */
export const catchChance = (foe, hpFrac, bonus = 0) => {
  const tier = foe.boss ? 0.12 : foe.alpha ? 0.4 : 1;
  const base = 0.45 + (1 - hpFrac) * 0.45 + bonus;
  return Math.min(0.97, base * tier);
};

/* ——— Pokémon de départ : la Gen 1 pour commencer ——— */
export const RUSH_STARTERS = PARTNERS.filter((p) => p.gen === 1).map((p) => ({ ...p, cost: p.id === 'pikachu' ? 400 : 0 }));
export const RUSH_GENS = [1];
export const rushPool = (gen = 1) => GEN_POOLS[gen];

/* ——— Progression propre au Poké Rush : Points de Ligue (PL) ——— */
const KEY = 'poke-rush-meta';
export const UPGRADES = [
  { id: 'balls', name: 'Sacoche à Balls', max: 3, base: 80, desc: (r) => `Commence avec ${3 + r} Poké Balls` },
  { id: 'catch', name: 'Lancer précis', max: 3, base: 120, desc: (r) => `+${r * 6} % de chances de capture` },
  { id: 'vitality', name: 'Entraînement', max: 5, base: 60, desc: (r) => `+${r * 8} PV max` },
  { id: 'power', name: 'Combativité', max: 5, base: 70, desc: (r) => `+${r * 4} % de dégâts` },
  { id: 'speed', name: 'Chaussures de course', max: 3, base: 90, desc: (r) => `+${r * 4} % de vitesse` },
  { id: 'coins', name: 'Pièce Rune', max: 3, base: 100, desc: (r) => `+${r * 15} % de Poké Dollars ramassés` },
  { id: 'allyslot', name: 'Quatrième compagnon', max: 1, base: 600, desc: () => 'Ton équipe peut compter 4 Pokémon capturés' },
  { id: 'cards', name: 'Main pleine', max: 1, base: 500, desc: () => '4 cartes au choix au lieu de 3' },
  { id: 'reroll', name: 'Second choix', max: 2, base: 150, desc: (r) => `+${r} relance${r > 1 ? 's' : ''} par partie` }
];
export const RUSH_MOVES = Object.entries(WEAPONS).filter(([, w]) => w.cost).map(([id, w]) => ({ id, name: w.name, type: w.type, color: w.color, cost: Math.round(w.cost * 0.6), desc: w.desc(1) }));
export const RUSH_ITEMS = Object.entries(PASSIVES).filter(([, it]) => it.cost).map(([id, it]) => ({ id, name: it.name, color: it.color, cost: Math.round(it.cost * 0.6), desc: it.desc }));

const blank = () => ({ v: 1, pl: 0, total: 0, up: {}, starters: {}, unlocks: {}, caught: {}, seen: {}, runs: 0, wins: 0, best: {}, history: [] });
export const loadRush = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.v === 1) return { ...blank(), ...raw };
  } catch { /* sauvegarde illisible */ }
  return blank();
};
export const saveRush = (m) => {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* stockage indisponible */ }
  return m;
};
export const upRank = (m, id) => m.up[id] || 0;
export const upCost = (m, u) => Math.round(u.base * (1 + upRank(m, u.id) * 0.6));
export const buyUpgrade = (m, id) => {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u || upRank(m, id) >= u.max) return m;
  const cost = upCost(m, u);
  if (m.pl < cost) return m;
  return saveRush({ ...m, pl: m.pl - cost, up: { ...m.up, [id]: upRank(m, id) + 1 } });
};
export const buyRushThing = (m, id, cost, field = 'unlocks') => {
  if (m[field][id] || m.pl < cost) return m;
  return saveRush({ ...m, pl: m.pl - cost, [field]: { ...m[field], [id]: true } });
};
export const starterOpen = (m, s) => !s.cost || !!m.starters[s.id];

/** Effets de la progression transmis au moteur. */
export const rushEffects = (m) => ({
  balls: 3 + upRank(m, 'balls'),
  catchBonus: upRank(m, 'catch') * 0.06,
  hp: upRank(m, 'vitality') * 8,
  dmg: 1 + upRank(m, 'power') * 0.04,
  speed: 1 + upRank(m, 'speed') * 0.04,
  coins: 1 + upRank(m, 'coins') * 0.15,
  allies: 3 + upRank(m, 'allyslot'),
  cards: upRank(m, 'cards') ? 4 : 3,
  rerolls: 2 + upRank(m, 'reroll'),
  unlocks: m.unlocks || {}
});

/** Fin de partie : Points de Ligue, Pokédex des captures, historique. */
export const recordRush = (m0, run) => {
  const m = { ...m0, caught: { ...m0.caught }, seen: { ...m0.seen }, best: { ...m0.best } };
  const lines = [];
  const add = (label, v) => { if (v > 0) lines.push({ label, v: Math.round(v) }); };
  add(`Survie (${Math.floor(run.t / 60)} min ${String(Math.floor(run.t % 60)).padStart(2, '0')})`, run.t / 6);
  add(`${run.kills} K.O.`, run.kills / 10);
  add(`${run.caught.length} capture${run.caught.length > 1 ? 's' : ''}`, run.caught.length * 15);
  add(`${run.bosses} boss vaincu${run.bosses > 1 ? 's' : ''}`, run.bosses * 40);
  add(`${run.missions} mission${run.missions > 1 ? 's' : ''}`, run.missions * 40);
  if (run.result === 'win') add('Légendaire vaincu', 250);
  const newCaught = run.caught.filter((id) => !m.caught[id]);
  add(`${newCaught.length} nouvelle${newCaught.length > 1 ? 's' : ''} espèce${newCaught.length > 1 ? 's' : ''} au Pokédex`, newCaught.length * 30);
  const earned = lines.reduce((a, l) => a + l.v, 0);
  run.caught.forEach((id) => { m.caught[id] = (m.caught[id] || 0) + 1; });
  (run.met || []).forEach((id) => { m.seen[id] = true; });
  m.pl += earned;
  m.total += earned;
  m.runs += 1;
  if (run.result === 'win') m.wins += 1;
  const prev = m.best[run.partnerId];
  if (!prev || (run.result === 'win' && (!prev.win || run.t < prev.t)) || (!prev.win && run.result !== 'win' && run.t > prev.t)) {
    m.best[run.partnerId] = { win: run.result === 'win', t: Math.round(run.t), kills: run.kills };
  }
  m.history = [{ at: Date.now(), partnerId: run.partnerId, result: run.result, t: Math.round(run.t), kills: run.kills, level: run.level, caught: run.caught.length, form: run.form }, ...(m0.history || [])].slice(0, 15);
  saveRush(m);
  return { meta: m, earned, lines, newCaught };
};

export const foeDef = (id) => FOES[id];
