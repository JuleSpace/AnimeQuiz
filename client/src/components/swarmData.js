/**
 * Données du mode Swarm : partenaires, attaques, objets passifs, ennemis et vagues.
 * Tout est volontairement simple : 4 partenaires, 7 attaques, 6 objets, une dizaine d'ennemis et 3 boss.
 */

export const RUN_SECONDS = 10 * 60;

export const PARTNERS = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    dex: 25,
    type: 'Électrik',
    color: '#f7d02c',
    hp: 90,
    speed: 3.2,
    weapon: 'thunder',
    blurb: 'Le plus rapide. Son Tonnerre rebondit d’un ennemi à l’autre.',
    evolutions: [{ level: 12, name: 'Raichu', dex: 26, hp: 40 }]
  },
  {
    id: 'charmander',
    name: 'Salamèche',
    dex: 4,
    type: 'Feu',
    color: '#ee8130',
    hp: 100,
    speed: 2.9,
    weapon: 'ember',
    blurb: 'Crache des Flammèches sur l’ennemi le plus proche.',
    evolutions: [{ level: 8, name: 'Reptincel', dex: 5, hp: 25 }, { level: 16, name: 'Dracaufeu', dex: 6, hp: 40 }]
  },
  {
    id: 'squirtle',
    name: 'Carapuce',
    dex: 7,
    type: 'Eau',
    color: '#6390f0',
    hp: 120,
    speed: 2.7,
    weapon: 'watergun',
    blurb: 'Solide. Son Pistolet à O transperce toute une file d’ennemis.',
    evolutions: [{ level: 8, name: 'Carabaffe', dex: 8, hp: 30 }, { level: 16, name: 'Tortank', dex: 9, hp: 45 }]
  },
  {
    id: 'bulbasaur',
    name: 'Bulbizarre',
    dex: 1,
    type: 'Plante',
    color: '#7ac74c',
    hp: 130,
    speed: 2.6,
    weapon: 'leaf',
    blurb: 'Le plus résistant. Des Tranch’Herbe tournent autour de lui.',
    evolutions: [{ level: 8, name: 'Herbizarre', dex: 2, hp: 30 }, { level: 16, name: 'Florizarre', dex: 3, hp: 50 }]
  }
];

/* ——— Attaques (5 niveaux). `at(lv)` renvoie les valeurs du niveau. ——— */
export const WEAPONS = {
  thunder: {
    name: 'Tonnerre',
    type: 'Électrik',
    color: '#f7d02c',
    desc: (lv) => `Foudroie l’ennemi le plus proche et rebondit sur ${lv + 1} autres.`,
    at: (lv) => ({ cd: 1.05 - lv * 0.08, dmg: 14 + lv * 4, chains: lv + 1, range: 270 })
  },
  ember: {
    name: 'Flammèche',
    type: 'Feu',
    color: '#ee8130',
    desc: (lv) => `${lv >= 4 ? 3 : lv >= 2 ? 2 : 1} boule${lv >= 2 ? 's' : ''} de feu vers l’ennemi le plus proche, qui explose${lv >= 2 ? 'nt' : ''} à l’impact.`,
    at: (lv) => ({ cd: 0.95 - lv * 0.05, dmg: 10 + lv * 4, count: lv >= 4 ? 3 : lv >= 2 ? 2 : 1, blast: 30 + lv * 6, speed: 6.5 })
  },
  watergun: {
    name: 'Pistolet à O',
    type: 'Eau',
    color: '#6390f0',
    desc: (lv) => `Jet qui transperce tout vers l’ennemi le plus proche${lv >= 3 ? ', et aussi dans l’autre sens' : ''}${lv >= 5 ? ' et sur les côtés' : ''}.`,
    at: (lv) => ({ cd: 0.75 - lv * 0.04, dmg: 9 + lv * 3, back: lv >= 3, side: lv >= 5, speed: 9, size: 7 + lv })
  },
  leaf: {
    name: 'Tranch’Herbe',
    type: 'Plante',
    color: '#7ac74c',
    desc: (lv) => `${lv + 1} feuilles tournent autour de toi et tranchent tout ce qu’elles touchent.`,
    at: (lv) => ({ count: lv + 1, dmg: 7 + lv * 2.5, radius: 62 + lv * 7, spin: 2.6 + lv * 0.25 })
  },
  quake: {
    name: 'Séisme',
    type: 'Sol',
    color: '#c99a54',
    desc: () => 'Une onde de choc part de toi à intervalles réguliers.',
    at: (lv) => ({ cd: 3.2 - lv * 0.25, dmg: 16 + lv * 6, radius: 100 + lv * 16 })
  },
  swift: {
    name: 'Météores',
    type: 'Normal',
    color: '#ffe680',
    desc: (lv) => `${lv + 1} étoiles à tête chercheuse qui ne ratent jamais leur cible.`,
    at: (lv) => ({ cd: 1.5 - lv * 0.08, dmg: 8 + lv * 2.5, count: lv + 1, speed: 6 })
  },
  shadow: {
    name: 'Ball’Ombre',
    type: 'Spectre',
    color: '#8b6bd6',
    desc: () => 'Une grosse boule lente qui traverse toute la horde.',
    at: (lv) => ({ cd: 2.6 - lv * 0.18, dmg: 26 + lv * 9, size: 16 + lv * 2.5, speed: 3.4 })
  }
};

/* ——— Objets passifs (5 niveaux) ——— */
export const PASSIVES = {
  protein: { name: 'Protéine', desc: '+12 % de dégâts.', color: '#e26b5a' },
  carbos: { name: 'Carbone', desc: '+8 % de vitesse de déplacement.', color: '#5aa7e2' },
  hpup: { name: 'PV Plus', desc: '+25 PV max et soigne d’autant.', color: '#6bd17a' },
  magnet: { name: 'Aimant', desc: '+35 % de portée pour ramasser l’XP.', color: '#c0c6d6' },
  quickclaw: { name: 'Vive Griffe', desc: '−7 % de temps de recharge.', color: '#f0c34a' },
  leftovers: { name: 'Restes', desc: 'Récupère 0,6 PV par seconde.', color: '#9bd36b' },
  scope: { name: 'Lentilscope', desc: '+6 % de chances de coup critique (dégâts ×1,8).', color: '#ff9a3c' }
};

export const MAX_WEAPONS = 4;
export const MAX_PASSIVES = 4;
export const MAX_LEVEL = 5;

/* ——— Ennemis ——— */
export const FOES = {
  rattata: { name: 'Rattata', dex: 19, ai: 'charge', color: '#a77fc4', hp: 10, speed: 1.35, dmg: 5, size: 30, xp: 1 },
  pidgey: { name: 'Roucool', dex: 16, ai: 'fly', flying: true, color: '#c9a36b', hp: 8, speed: 1.75, dmg: 4, size: 30, xp: 1 },
  caterpie: { name: 'Chenipan', dex: 10, ai: 'walk', color: '#7ac74c', hp: 14, speed: 0.95, dmg: 4, size: 28, xp: 1 },
  zubat: { name: 'Nosferapti', dex: 41, ai: 'fly', flying: true, color: '#6c8fd6', hp: 12, speed: 2.25, dmg: 5, size: 30, xp: 1 },
  ekans: { name: 'Abo', dex: 23, ai: 'spit', color: '#a35cc4', hp: 24, speed: 1.4, dmg: 7, size: 32, xp: 2 },
  geodude: { name: 'Racaillou', dex: 74, ai: 'walk', heavy: true, color: '#9b8a6a', hp: 45, speed: 0.9, dmg: 10, size: 34, xp: 2 },
  gastly: { name: 'Fantominus', dex: 92, ai: 'ghost', flying: true, color: '#8b6bd6', hp: 32, speed: 1.6, dmg: 8, size: 34, xp: 2 },
  raticate: { name: 'Rattatac', dex: 20, ai: 'charge', color: '#c9a36b', hp: 55, speed: 1.55, dmg: 10, size: 38, xp: 3 },
  golbat: { name: 'Nosferalto', dex: 42, ai: 'fly', flying: true, color: '#6c8fd6', hp: 60, speed: 2.1, dmg: 11, size: 40, xp: 3 },
  graveler: { name: 'Gravalanch', dex: 75, ai: 'charge', heavy: true, color: '#9b8a6a', hp: 130, speed: 0.85, dmg: 16, size: 44, xp: 4 },
  haunter: { name: 'Spectrum', dex: 93, ai: 'ghost', flying: true, blink: true, color: '#8b6bd6', hp: 90, speed: 1.7, dmg: 13, size: 42, xp: 4 },
  // Boss
  onix: { name: 'Onix', dex: 95, ai: 'onix', scale: 2, color: '#9b8a6a', hp: 900, speed: 1.05, dmg: 18, size: 92, xp: 25, boss: 'mini' },
  snorlax: { name: 'Ronflex', dex: 143, ai: 'snorlax', scale: 3.4, color: '#3d6f8a', hp: 2200, speed: 0.75, dmg: 26, size: 104, xp: 40, boss: 'mini' },
  mewtwo: { name: 'Mewtwo', dex: 150, ai: 'mewtwo', flying: true, scale: 2.8, color: '#c77dd6', hp: 7000, speed: 1.25, dmg: 30, size: 112, xp: 0, boss: 'final', shoots: true }
};

/** Qui apparaît à quel moment (en secondes). */
export const WAVES = [
  { from: 0, foes: ['rattata', 'pidgey'] },
  { from: 75, foes: ['rattata', 'pidgey', 'caterpie'] },
  { from: 140, foes: ['caterpie', 'zubat', 'pidgey', 'ekans'] },
  { from: 220, foes: ['zubat', 'ekans', 'geodude'] },
  { from: 300, foes: ['geodude', 'gastly', 'raticate', 'zubat'] },
  { from: 390, foes: ['raticate', 'golbat', 'gastly'] },
  { from: 450, foes: ['golbat', 'graveler', 'haunter'] },
  { from: 510, foes: ['graveler', 'haunter', 'golbat', 'raticate'] }
];

export const BOSSES = [
  { at: 180, id: 'onix', title: 'Un Onix surgit du sol !' },
  { at: 360, id: 'snorlax', title: 'Un Ronflex bloque le passage !' },
  { at: 540, id: 'mewtwo', title: 'Mewtwo apparaît. Bats-le pour gagner !' }
];

/** Animation jouée par le partenaire quand l'attaque part. */
export const CAST_ANIM = { thunder: 'shoot', ember: 'shoot', watergun: 'shoot', quake: 'attack', swift: 'shoot', shadow: 'shoot' };

export const spriteOf = (dex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

/** XP pour passer du niveau `lv` au suivant. */
export const xpToNext = (lv) => Math.round(5 + lv * 4 + lv * lv * 0.35);
