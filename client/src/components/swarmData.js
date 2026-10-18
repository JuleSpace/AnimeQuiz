/**
 * Données du mode Swarm : générations, partenaires, attaques, objets passifs, ennemis, vagues et boss.
 * Chaque génération (1 à 4) a ses starters, ses Pokémon sauvages et ses 3 boss.
 */

export const RUN_SECONDS = 10 * 60;

/* ——— Générations jouables ——— */
export const GENS = [
  { id: 1, name: 'Kanto', label: '1re génération' },
  { id: 2, name: 'Johto', label: '2e génération' },
  { id: 3, name: 'Hoenn', label: '3e génération' },
  { id: 4, name: 'Sinnoh', label: '4e génération' }
];

/**
 * Partenaires. `trait` = mécanique propre au starter, `mega` = Méga-Évolution débloquée par la Méga-Gemme
 * (proposée au level-up une fois la dernière forme atteinte ; niveau 3 de la gemme = Méga).
 * `mega.sprite` : planche de la Méga (PMDCollab, ou sprites de pokeemerald-expansion convertis : voir LISEZMOI).
 */
export const PARTNERS = [
  {
    id: 'bulbasaur', gen: 1, name: 'Bulbizarre', dex: 1, type: 'Plante', color: '#7ac74c', hp: 130, speed: 2.6, weapon: 'leaf',
    blurb: 'Le plus résistant. Des Tranch’Herbe tournent autour de lui.',
    evolutions: [{ level: 8, name: 'Herbizarre', dex: 2, hp: 30 }, { level: 16, name: 'Florizarre', dex: 3, hp: 50 }],
    mega: { name: 'Méga-Florizarre', stone: 'Florizarrite', sprite: '3-mega', scale: 1.3 }
  },
  {
    id: 'charmander', gen: 1, name: 'Salamèche', dex: 4, type: 'Feu', color: '#ee8130', hp: 100, speed: 2.9, weapon: 'ember',
    blurb: 'Crache des Flammèches sur l’ennemi le plus proche.',
    evolutions: [{ level: 8, name: 'Reptincel', dex: 5, hp: 25 }, { level: 16, name: 'Dracaufeu', dex: 6, hp: 40 }],
    // Deux Méga-Évolutions : le premier niveau de Méga-Gemme fait choisir la pierre
    mega: {
      name: 'Méga-Dracaufeu', stone: 'Dracaufite', sprite: '6-mega',
      choices: [
        { id: 'x', name: 'Méga-Dracaufeu X', stone: 'Dracaufite X', sprite: '6-mega', type: 'Dragon', color: '#3aa0ff',
          perk: 'Flammes bleues : +45 % de dégâts et plus rapide.' },
        { id: 'y', name: 'Méga-Dracaufeu Y', stone: 'Dracaufite Y', sprite: '6-megay', scale: 1.3, type: 'Feu', color: '#ff7a1f',
          perk: 'Sécheresse : un soleil brûlant frappe tout autour de toi et les attaques rechargent 25 % plus vite.' }
      ]
    }
  },
  {
    id: 'squirtle', gen: 1, name: 'Carapuce', dex: 7, type: 'Eau', color: '#6390f0', hp: 120, speed: 2.7, weapon: 'watergun',
    blurb: 'Solide. Son Pistolet à O transperce toute une file d’ennemis.',
    evolutions: [{ level: 8, name: 'Carabaffe', dex: 8, hp: 30 }, { level: 16, name: 'Tortank', dex: 9, hp: 45 }],
    mega: { name: 'Méga-Tortank', stone: 'Tortankite', sprite: '9-mega', scale: 1.3 }
  },
  {
    id: 'pikachu', gen: 1, name: 'Pikachu', dex: 25, type: 'Électrik', color: '#f7d02c', hp: 90, speed: 3.2, weapon: 'thunder',
    blurb: 'Le plus rapide. Son Tonnerre rebondit d’un ennemi à l’autre.',
    evolutions: [{ level: 12, name: 'Raichu', dex: 26, hp: 40 }],
    mega: {
      name: 'Méga-Raichu', stone: 'Raichite', sprite: '26-megax', scale: 1.0,
      choices: [
        { id: 'x', name: 'Méga-Raichu X', stone: 'Raichite X', sprite: '26-megax', scale: 1.0, type: 'Électrik', color: '#f7c61c',
          perk: 'Survolté : +45 % de dégâts et plus rapide.' },
        { id: 'y', name: 'Méga-Raichu Y', stone: 'Raichite Y', sprite: '26-megay', scale: 1.0, type: 'Électrik', color: '#ff9a2e',
          perk: 'Champ électrique : des décharges frappent tout autour de toi et les attaques rechargent 25 % plus vite.' }
      ]
    }
  },
  {
    id: 'chikorita', gen: 2, name: 'Germignon', dex: 152, type: 'Plante', color: '#7ac74c', hp: 125, speed: 2.6, weapon: 'bloom',
    blurb: 'Fait pousser des champs de fleurs : tu t’y soignes, les ennemis y ralentissent et fanent.',
    evolutions: [{ level: 8, name: 'Macronium', dex: 153, hp: 30 }, { level: 16, name: 'Méganium', dex: 154, hp: 50 }],
    mega: { name: 'Méga-Méganium', stone: 'Méganiumite', sprite: '154-mega', scale: 1.0 }
  },
  {
    id: 'cyndaquil', gen: 2, name: 'Héricendre', dex: 155, type: 'Feu', color: '#ee8130', hp: 95, speed: 3.1, weapon: 'flametrail',
    blurb: 'Laisse une traînée de feu derrière lui : plus tu bouges, plus ça brûle. Évolue en Typhlosion de Johto ou d’Hisui, au choix.',
    evolutions: [
      { level: 8, name: 'Feurisson', dex: 156, hp: 25 },
      {
        level: 16, name: 'Typhlosion', dex: 157, hp: 45,
        // Au moment d'évoluer, on choisit sa forme
        choices: [
          { id: 'johto', name: 'Typhlosion', dex: 157, type: 'Feu', color: '#ff7a1f',
            perk: 'Éruption : les flammes de la Roue de Feu sont 30 % plus larges et brûlent 25 % plus fort.' },
          { id: 'hisui', name: 'Typhlosion d’Hisui', dex: '157-hisui', type: 'Spectre', color: '#a35cff',
            perk: 'Feu Ensorcelé : des flammes spectrales violettes qui durent deux fois plus longtemps et maudissent les ennemis (+25 % de dégâts subis).' }
        ]
      }
    ]
  },
  {
    id: 'totodile', gen: 2, name: 'Kaiminus', dex: 158, type: 'Eau', color: '#6390f0', hp: 115, speed: 2.8, weapon: 'bite',
    blurb: 'Croque tout ce qui s’approche et se soigne à chaque morsure.',
    evolutions: [{ level: 8, name: 'Crocrodil', dex: 159, hp: 30 }, { level: 16, name: 'Aligatueur', dex: 160, hp: 45 }],
    mega: { name: 'Méga-Aligatueur', stone: 'Aligatueurite', sprite: '160-mega', scale: 1.0 }
  },
  {
    id: 'treecko', gen: 3, name: 'Arcko', dex: 252, type: 'Plante', color: '#7ac74c', hp: 95, speed: 3.2, weapon: 'leafblade',
    blurb: 'Lance des Lame-Feuille en boomerang : elles tranchent à l’aller et au retour.',
    evolutions: [{ level: 8, name: 'Massko', dex: 253, hp: 25 }, { level: 16, name: 'Jungko', dex: 254, hp: 45 }],
    mega: { name: 'Méga-Jungko', stone: 'Jungkite', sprite: '254-mega' }
  },
  {
    id: 'torchic', gen: 3, name: 'Poussifeu', dex: 255, type: 'Feu', color: '#ee8130', hp: 100, speed: 2.9, weapon: 'doublekick', trait: 'turbo',
    blurb: 'Turbo : il attaque de plus en plus vite tant qu’il n’est pas touché.',
    evolutions: [{ level: 8, name: 'Galifeu', dex: 256, hp: 30 }, { level: 16, name: 'Braségali', dex: 257, hp: 45 }],
    mega: { name: 'Méga-Braségali', stone: 'Braségalite', sprite: '257-mega', scale: 1.3 }
  },
  {
    id: 'mudkip', gen: 3, name: 'Gobou', dex: 258, type: 'Eau', color: '#6390f0', hp: 125, speed: 2.7, weapon: 'mudbomb',
    blurb: 'Ses Boue-Bombes laissent des flaques qui engluent la horde.',
    evolutions: [{ level: 8, name: 'Flobio', dex: 259, hp: 30 }, { level: 16, name: 'Laggron', dex: 260, hp: 50 }],
    mega: { name: 'Méga-Laggron', stone: 'Laggronite', sprite: '260-mega', scale: 1.3 }
  },
  {
    id: 'turtwig', gen: 4, name: 'Tortipouss', dex: 387, type: 'Plante', color: '#7ac74c', hp: 140, speed: 2.5, weapon: 'seedbomb', trait: 'bark',
    blurb: 'Écorce : un bouclier qui se recharge. Ses Canon Graine tombent en cloche sur les groupes.',
    evolutions: [{ level: 8, name: 'Boskara', dex: 388, hp: 35 }, { level: 16, name: 'Torterra', dex: 389, hp: 55 }]
  },
  {
    id: 'chimchar', gen: 4, name: 'Ouisticram', dex: 390, type: 'Feu', color: '#ee8130', hp: 95, speed: 3.1, weapon: 'machpunch',
    blurb: 'Enchaîne les Mach Punch : chaque coup d’affilée frappe plus fort (combo).',
    evolutions: [{ level: 8, name: 'Chimpenfeu', dex: 391, hp: 25 }, { level: 16, name: 'Simiabraz', dex: 392, hp: 45 }]
  },
  {
    id: 'piplup', gen: 4, name: 'Tiplouf', dex: 393, type: 'Eau', color: '#6390f0', hp: 115, speed: 2.8, weapon: 'bubble',
    blurb: 'Ses Bulles d’O emprisonnent les ennemis, qui y prennent plus de dégâts.',
    evolutions: [{ level: 8, name: 'Prinplouf', dex: 394, hp: 30 }, { level: 16, name: 'Pingoléon', dex: 395, hp: 50 }]
  }
];

/* ——— Attaques (5 niveaux). `at(lv)` renvoie les valeurs du niveau. `gen` 0 = disponible partout. ——— */
export const WEAPONS = {
  thunder: {
    gen: 1,
    name: 'Tonnerre',
    type: 'Électrik',
    color: '#f7d02c',
    desc: (lv) => `Foudroie l’ennemi le plus proche et rebondit sur ${lv + 1} autres.`,
    at: (lv) => ({ cd: 1.05 - lv * 0.08, dmg: 14 + lv * 4, chains: lv + 1, range: 270 })
  },
  ember: {
    gen: 1,
    name: 'Flammèche',
    type: 'Feu',
    color: '#ee8130',
    desc: (lv) => `${lv >= 4 ? 3 : lv >= 2 ? 2 : 1} boule${lv >= 2 ? 's' : ''} de feu vers l’ennemi le plus proche, qui explose${lv >= 2 ? 'nt' : ''} à l’impact.`,
    at: (lv) => ({ cd: 0.95 - lv * 0.05, dmg: 10 + lv * 4, count: lv >= 4 ? 3 : lv >= 2 ? 2 : 1, blast: 30 + lv * 6, speed: 6.5 })
  },
  watergun: {
    gen: 1,
    name: 'Pistolet à O',
    type: 'Eau',
    color: '#6390f0',
    desc: (lv) => `Jet qui transperce tout vers l’ennemi le plus proche${lv >= 3 ? ', et aussi dans l’autre sens' : ''}${lv >= 5 ? ' et sur les côtés' : ''}.`,
    at: (lv) => ({ cd: 0.75 - lv * 0.04, dmg: 9 + lv * 3, back: lv >= 3, side: lv >= 5, speed: 9, size: 7 + lv })
  },
  leaf: {
    gen: 1,
    name: 'Tranch’Herbe',
    type: 'Plante',
    color: '#7ac74c',
    desc: (lv) => `${lv + 1} feuilles tournent autour de toi et tranchent tout ce qu’elles touchent.`,
    at: (lv) => ({ count: lv + 1, dmg: 7 + lv * 2.5, radius: 62 + lv * 7, spin: 2.6 + lv * 0.25 })
  },
  quake: {
    gen: 0,
    name: 'Séisme',
    type: 'Sol',
    color: '#c99a54',
    desc: () => 'Une onde de choc part de toi à intervalles réguliers.',
    at: (lv) => ({ cd: 3.2 - lv * 0.25, dmg: 16 + lv * 6, radius: 100 + lv * 16 })
  },
  swift: {
    gen: 0,
    name: 'Météores',
    type: 'Normal',
    color: '#ffe680',
    desc: (lv) => `${lv + 1} étoiles à tête chercheuse qui ne ratent jamais leur cible.`,
    at: (lv) => ({ cd: 1.5 - lv * 0.08, dmg: 8 + lv * 2.5, count: lv + 1, speed: 6 })
  },
  shadow: {
    gen: 0,
    name: 'Ball’Ombre',
    type: 'Spectre',
    color: '#8b6bd6',
    desc: () => 'Une grosse boule lente qui traverse toute la horde.',
    at: (lv) => ({ cd: 2.6 - lv * 0.18, dmg: 26 + lv * 9, size: 16 + lv * 2.5, speed: 3.4 })
  },
  /* — Johto — */
  bloom: {
    gen: 2,
    name: 'Champ Fleuri',
    type: 'Plante',
    color: '#9be06a',
    desc: (lv) => `Fait pousser un champ de fleurs à tes pieds : tu t’y soignes (${2 + lv} PV/s), les ennemis y ralentissent et fanent.`,
    at: (lv) => ({ cd: 4.6 - lv * 0.35, radius: 70 + lv * 12, life: 4 + lv * 0.5, dps: 9 + lv * 5, heal: 2 + lv })
  },
  flametrail: {
    gen: 2,
    name: 'Roue de Feu',
    type: 'Feu',
    color: '#ff8a3a',
    desc: (lv) => `Tu laisses une traînée de flammes en courant (${14 + lv * 7} dégâts/s). Rester immobile ne brûle rien !`,
    at: (lv) => ({ dps: 14 + lv * 7, life: 1.2 + lv * 0.2, radius: 17 + lv * 2 })
  },
  bite: {
    gen: 2,
    name: 'Mâchouille',
    type: 'Ténèbres',
    color: '#5a6fb8',
    desc: (lv) => `Croque devant toi en arc de cercle. Chaque ennemi mordu te rend ${1 + Math.floor(lv / 2)} PV.`,
    at: (lv) => ({ cd: 1.05 - lv * 0.07, dmg: 18 + lv * 7, range: 62 + lv * 8, heal: 1 + Math.floor(lv / 2) })
  },
  /* — Hoenn — */
  leafblade: {
    gen: 3,
    name: 'Lame-Feuille',
    type: 'Plante',
    color: '#5fd06a',
    desc: (lv) => `${lv >= 5 ? 3 : lv >= 3 ? 2 : 1} lame${lv >= 3 ? 's' : ''} en boomerang, qui tranche${lv >= 3 ? 'nt' : ''} à l’aller et au retour.`,
    at: (lv) => ({ cd: 1.3 - lv * 0.08, dmg: 12 + lv * 5, count: lv >= 5 ? 3 : lv >= 3 ? 2 : 1, range: 200 + lv * 20, speed: 7 })
  },
  doublekick: {
    gen: 3,
    name: 'Double Pied',
    type: 'Combat',
    color: '#ff7a3a',
    desc: () => 'Deux coups de pied enflammés sur l’ennemi le plus proche, qui explosent à l’impact.',
    at: (lv) => ({ cd: 0.9 - lv * 0.06, dmg: 13 + lv * 5, blast: 26 + lv * 4, range: 95 + lv * 6 })
  },
  mudbomb: {
    gen: 3,
    name: 'Boue-Bombe',
    type: 'Sol',
    color: '#a5753f',
    desc: (lv) => `Lance ${lv >= 4 ? 'deux boulets' : 'un boulet'} de boue : la flaque englue (−50 % de vitesse) et abîme les ennemis.`,
    at: (lv) => ({ cd: 1.6 - lv * 0.1, dmg: 14 + lv * 5, puddle: 42 + lv * 6, count: lv >= 4 ? 2 : 1, dps: 4 + lv * 2 })
  },
  /* — Sinnoh — */
  seedbomb: {
    gen: 4,
    name: 'Canon Graine',
    type: 'Plante',
    color: '#c9a36b',
    desc: (lv) => `${1 + Math.floor(lv / 2)} graine${lv >= 2 ? 's' : ''} lancée${lv >= 2 ? 's' : ''} en cloche sur les ennemis, qui explose${lv >= 2 ? 'nt' : ''} en tombant.`,
    at: (lv) => ({ cd: 1.8 - lv * 0.12, dmg: 22 + lv * 7, count: 1 + Math.floor(lv / 2), blast: 40 + lv * 5 })
  },
  machpunch: {
    gen: 4,
    name: 'Mach Punch',
    type: 'Combat',
    color: '#ff9a3c',
    desc: () => 'Coups de poing éclair au contact. Chaque coup d’affilée fait +8 % de dégâts (combo, jusqu’à +80 %).',
    at: (lv) => ({ cd: 0.42 - lv * 0.03, dmg: 7 + lv * 3, range: 62 + lv * 6 })
  },
  bubble: {
    gen: 4,
    name: 'Bulles d’O',
    type: 'Eau',
    color: '#7fd0ff',
    desc: (lv) => `${1 + Math.ceil(lv / 2)} bulles qui emprisonnent les ennemis (${(1 + lv * 0.15).toFixed(1)} s) : ils y prennent +25 % de dégâts.`,
    at: (lv) => ({ cd: 1.4 - lv * 0.08, dmg: 10 + lv * 4, count: 1 + Math.ceil(lv / 2), trap: 1 + lv * 0.15, speed: 2.6 })
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

/** Méga-Gemme : 3 niveaux, la Méga-Évolution arrive au niveau 3 (ne prend pas de place d'objet). */
export const MEGA_LEVELS = 3;

export const MAX_WEAPONS = 4;
export const MAX_PASSIVES = 4;
export const MAX_LEVEL = 5;

/* ——— Ennemis ——— */
export const FOES = {
  /* — Kanto — */
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
  /* — Johto — */
  sentret: { name: 'Fouinette', dex: 161, ai: 'walk', color: '#c9a36b', hp: 11, speed: 1.4, dmg: 5, size: 30, xp: 1 },
  furret: { name: 'Fouinar', dex: 162, ai: 'charge', color: '#c9a36b', hp: 55, speed: 1.6, dmg: 10, size: 38, xp: 3 },
  hoothoot: { name: 'Hoothoot', dex: 163, ai: 'fly', flying: true, color: '#a77f5a', hp: 9, speed: 1.7, dmg: 4, size: 30, xp: 1 },
  noctowl: { name: 'Noarfang', dex: 164, ai: 'swoop', flying: true, color: '#a77f5a', hp: 55, speed: 1.9, dmg: 11, size: 40, xp: 3 },
  ledyba: { name: 'Coxy', dex: 165, ai: 'fly', flying: true, color: '#e05a4a', hp: 12, speed: 1.9, dmg: 4, size: 30, xp: 1 },
  spinarak: { name: 'Mimigal', dex: 167, ai: 'web', color: '#7ac74c', hp: 22, speed: 1.2, dmg: 6, size: 32, xp: 2 },
  ariados: { name: 'Migalos', dex: 168, ai: 'web', color: '#e05a4a', hp: 75, speed: 1.4, dmg: 11, size: 40, xp: 3 },
  crobat: { name: 'Nostenfer', dex: 169, ai: 'fly', flying: true, color: '#8b6bd6', hp: 70, speed: 2.5, dmg: 12, size: 42, xp: 4 },
  mareep: { name: 'Wattouat', dex: 179, ai: 'shock', color: '#f7d02c', hp: 30, speed: 1.2, dmg: 9, size: 34, xp: 2 },
  misdreavus: { name: 'Feuforêve', dex: 200, ai: 'ghost', flying: true, blink: true, color: '#8b6bd6', hp: 60, speed: 1.6, dmg: 10, size: 38, xp: 3 },
  pineco: { name: 'Pomdepik', dex: 204, ai: 'explode', color: '#7a8a5a', hp: 28, speed: 1.35, dmg: 24, size: 34, xp: 2 },
  snubbull: { name: 'Snubbull', dex: 209, ai: 'walk', color: '#ff9ccf', hp: 30, speed: 1.3, dmg: 8, size: 34, xp: 2 },
  teddiursa: { name: 'Teddiursa', dex: 216, ai: 'walk', color: '#c9a36b', hp: 24, speed: 1.5, dmg: 6, size: 32, xp: 1 },
  ursaring: { name: 'Ursaring', dex: 217, ai: 'charge', heavy: true, color: '#8a5a3a', hp: 150, speed: 0.95, dmg: 17, size: 46, xp: 5 },
  blissey: { name: 'Leuphorie', dex: 242, ai: 'heal', color: '#ff9ccf', hp: 120, speed: 0.9, dmg: 6, size: 44, xp: 4 },
  /* — Hoenn — */
  poochyena: { name: 'Medhyèna', dex: 261, ai: 'walk', color: '#5a5a6a', hp: 14, speed: 1.5, dmg: 6, size: 30, xp: 1 },
  mightyena: { name: 'Grahyèna', dex: 262, ai: 'charge', color: '#5a5a6a', hp: 60, speed: 1.7, dmg: 11, size: 40, xp: 3 },
  zigzagoon: { name: 'Zigzaton', dex: 263, ai: 'zigzag', color: '#c9a36b', hp: 12, speed: 1.9, dmg: 5, size: 30, xp: 1 },
  wurmple: { name: 'Chenipotte', dex: 265, ai: 'spit', color: '#e05a4a', hp: 14, speed: 1.0, dmg: 4, size: 28, xp: 1 },
  taillow: { name: 'Nirondelle', dex: 276, ai: 'fly', flying: true, color: '#3a5a9a', hp: 9, speed: 2.2, dmg: 4, size: 28, xp: 1 },
  swellow: { name: 'Hélédelle', dex: 277, ai: 'swoop', flying: true, color: '#3a5a9a', hp: 55, speed: 2.2, dmg: 11, size: 38, xp: 3 },
  wingull: { name: 'Goélise', dex: 278, ai: 'fly', flying: true, color: '#dfe6f2', hp: 20, speed: 2.0, dmg: 6, size: 32, xp: 2 },
  makuhita: { name: 'Makuhita', dex: 296, ai: 'walk', heavy: true, color: '#e0b84a', hp: 45, speed: 1.0, dmg: 10, size: 36, xp: 2 },
  hariyama: { name: 'Hariyama', dex: 297, ai: 'charge', heavy: true, color: '#c9a36b', hp: 150, speed: 0.9, dmg: 18, size: 46, xp: 5 },
  sableye: { name: 'Ténéfix', dex: 302, ai: 'ghost', blink: true, color: '#6a4aa8', hp: 55, speed: 1.6, dmg: 10, size: 36, xp: 3 },
  aron: { name: 'Galekid', dex: 304, ai: 'walk', heavy: true, color: '#9aa0aa', hp: 50, speed: 0.9, dmg: 10, size: 34, xp: 2 },
  lairon: { name: 'Galegon', dex: 305, ai: 'charge', heavy: true, color: '#9aa0aa', hp: 140, speed: 0.9, dmg: 16, size: 42, xp: 4 },
  /* — Sinnoh — */
  starly: { name: 'Étourmi', dex: 396, ai: 'fly', flying: true, color: '#8a6a5a', hp: 9, speed: 1.9, dmg: 4, size: 28, xp: 1 },
  staravia: { name: 'Étourvol', dex: 397, ai: 'swoop', flying: true, color: '#8a6a5a', hp: 55, speed: 2.1, dmg: 11, size: 38, xp: 3 },
  bidoof: { name: 'Keunotor', dex: 399, ai: 'walk', color: '#c9a36b', hp: 16, speed: 1.2, dmg: 5, size: 32, xp: 1 },
  shinx: { name: 'Lixy', dex: 403, ai: 'shock', color: '#5a8fd6', hp: 18, speed: 1.6, dmg: 7, size: 30, xp: 1 },
  luxio: { name: 'Luxio', dex: 404, ai: 'shock', color: '#5a8fd6', hp: 60, speed: 1.7, dmg: 12, size: 38, xp: 3 },
  drifloon: { name: 'Baudrive', dex: 425, ai: 'ghost', flying: true, color: '#a57bd6', hp: 40, speed: 1.0, dmg: 9, size: 36, xp: 2 },
  stunky: { name: 'Moufouette', dex: 434, ai: 'spit', color: '#8b6bd6', hp: 30, speed: 1.3, dmg: 8, size: 34, xp: 2 },
  gible: { name: 'Griknot', dex: 443, ai: 'charge', color: '#5a6fb8', hp: 35, speed: 1.5, dmg: 9, size: 32, xp: 2 },
  gabite: { name: 'Carmache', dex: 444, ai: 'charge', color: '#5a6fb8', hp: 120, speed: 1.6, dmg: 15, size: 42, xp: 4 },
  croagunk: { name: 'Cradopaud', dex: 453, ai: 'spit', color: '#5a8fd6', hp: 50, speed: 1.3, dmg: 10, size: 36, xp: 3 },
  /* — Boss — */
  onix: { name: 'Onix', dex: 95, ai: 'onix', scale: 2, color: '#9b8a6a', hp: 900, speed: 1.05, dmg: 18, size: 92, xp: 25, boss: 'mini' },
  snorlax: { name: 'Ronflex', dex: 143, ai: 'snorlax', scale: 3.4, color: '#3d6f8a', hp: 2200, speed: 0.75, dmg: 26, size: 104, xp: 40, boss: 'mini' },
  mewtwo: { name: 'Mewtwo', dex: 150, ai: 'mewtwo', flying: true, scale: 2.8, color: '#c77dd6', hp: 7000, speed: 1.25, dmg: 30, size: 112, xp: 0, boss: 'final', shoots: true },
  steelix: { name: 'Steelix', dex: 208, ai: 'onix', scale: 2, color: '#9aa0aa', hp: 1000, speed: 1.05, dmg: 19, size: 92, xp: 25, boss: 'mini' },
  tyranitar: { name: 'Tyranocif', dex: 248, ai: 'snorlax', scale: 3.2, color: '#5a8a5a', hp: 2400, speed: 0.8, dmg: 26, size: 100, xp: 40, boss: 'mini' },
  lugia: { name: 'Lugia', dex: 249, ai: 'mewtwo', flying: true, scale: 2.2, color: '#9fd0ff', hp: 7600, speed: 1.3, dmg: 30, size: 112, xp: 0, boss: 'final', shoots: true },
  aggron: { name: 'Galeking', dex: 306, ai: 'onix', scale: 3.2, color: '#9aa0aa', hp: 1100, speed: 1.0, dmg: 20, size: 96, xp: 25, boss: 'mini' },
  salamence: { name: 'Drattak', dex: 373, ai: 'dashboss', flying: true, scale: 2.4, color: '#5a8fd6', hp: 2400, speed: 1.2, dmg: 26, size: 100, xp: 40, boss: 'mini' },
  rayquaza: { name: 'Rayquaza', dex: 384, ai: 'mewtwo', flying: true, scale: 2, color: '#5fd06a', hp: 7800, speed: 1.35, dmg: 30, size: 120, xp: 0, boss: 'final', shoots: true },
  garchomp: { name: 'Carchacrok', dex: 445, ai: 'dashboss', scale: 3.2, color: '#5a6fb8', hp: 1200, speed: 1.2, dmg: 22, size: 96, xp: 25, boss: 'mini' },
  mamoswine: { name: 'Mammochon', dex: 473, ai: 'snorlax', scale: 3.4, color: '#8a6a4a', hp: 2600, speed: 0.8, dmg: 27, size: 104, xp: 40, boss: 'mini' },
  dialga: { name: 'Dialga', dex: 483, ai: 'mewtwo', scale: 2, color: '#6a8fd6', hp: 8000, speed: 1.2, dmg: 30, size: 120, xp: 0, boss: 'final', shoots: true }
};

/** Vagues (en secondes) de chaque génération. */
export const GEN_WAVES = {
  1: [
    { from: 0, foes: ['rattata', 'pidgey'] },
    { from: 75, foes: ['rattata', 'pidgey', 'caterpie'] },
    { from: 140, foes: ['caterpie', 'zubat', 'pidgey', 'ekans'] },
    { from: 220, foes: ['zubat', 'ekans', 'geodude'] },
    { from: 300, foes: ['geodude', 'gastly', 'raticate', 'zubat'] },
    { from: 390, foes: ['raticate', 'golbat', 'gastly'] },
    { from: 450, foes: ['golbat', 'graveler', 'haunter'] },
    { from: 510, foes: ['graveler', 'haunter', 'golbat', 'raticate'] }
  ],
  2: [
    { from: 0, foes: ['sentret', 'hoothoot', 'ledyba'] },
    { from: 75, foes: ['sentret', 'hoothoot', 'spinarak', 'teddiursa'] },
    { from: 140, foes: ['spinarak', 'mareep', 'snubbull', 'pineco'] },
    { from: 220, foes: ['furret', 'mareep', 'pineco', 'ledyba'] },
    { from: 300, foes: ['noctowl', 'ariados', 'misdreavus', 'blissey', 'furret'] },
    { from: 390, foes: ['ursaring', 'crobat', 'misdreavus', 'pineco'] },
    { from: 450, foes: ['ariados', 'crobat', 'ursaring', 'blissey'] },
    { from: 510, foes: ['ursaring', 'noctowl', 'ariados', 'crobat', 'pineco'] }
  ],
  3: [
    { from: 0, foes: ['zigzagoon', 'poochyena', 'taillow'] },
    { from: 75, foes: ['zigzagoon', 'wurmple', 'wingull'] },
    { from: 140, foes: ['poochyena', 'wurmple', 'makuhita', 'aron'] },
    { from: 220, foes: ['mightyena', 'wingull', 'aron', 'zigzagoon'] },
    { from: 300, foes: ['swellow', 'sableye', 'makuhita', 'mightyena'] },
    { from: 390, foes: ['hariyama', 'lairon', 'sableye'] },
    { from: 450, foes: ['swellow', 'lairon', 'hariyama', 'mightyena'] },
    { from: 510, foes: ['lairon', 'hariyama', 'swellow', 'sableye', 'mightyena'] }
  ],
  4: [
    { from: 0, foes: ['starly', 'bidoof', 'shinx'] },
    { from: 75, foes: ['starly', 'bidoof', 'stunky'] },
    { from: 140, foes: ['shinx', 'drifloon', 'gible', 'stunky'] },
    { from: 220, foes: ['luxio', 'drifloon', 'croagunk', 'bidoof'] },
    { from: 300, foes: ['staravia', 'luxio', 'gible', 'croagunk'] },
    { from: 390, foes: ['gabite', 'staravia', 'drifloon'] },
    { from: 450, foes: ['gabite', 'luxio', 'croagunk', 'staravia'] },
    { from: 510, foes: ['gabite', 'luxio', 'staravia', 'croagunk', 'drifloon'] }
  ]
};

/** Boss de chaque génération. */
export const GEN_BOSSES = {
  1: [
    { at: 180, id: 'onix', title: 'Un Onix surgit du sol !' },
    { at: 360, id: 'snorlax', title: 'Un Ronflex bloque le passage !' },
    { at: 540, id: 'mewtwo', title: 'Mewtwo apparaît. Bats-le pour gagner !' }
  ],
  2: [
    { at: 180, id: 'steelix', title: 'Un Steelix jaillit de terre !' },
    { at: 360, id: 'tyranitar', title: 'Tyranocif fait trembler le sol !' },
    { at: 540, id: 'lugia', title: 'Lugia descend du ciel. Bats-le pour gagner !' }
  ],
  3: [
    { at: 180, id: 'aggron', title: 'Galeking défend son territoire !' },
    { at: 360, id: 'salamence', title: 'Drattak fond sur toi !' },
    { at: 540, id: 'rayquaza', title: 'Rayquaza fend le ciel. Bats-le pour gagner !' }
  ],
  4: [
    { at: 180, id: 'garchomp', title: 'Carchacrok charge à pleine vitesse !' },
    { at: 360, id: 'mamoswine', title: 'Mammochon piétine tout sur son passage !' },
    { at: 540, id: 'dialga', title: 'Dialga déforme le temps. Bats-le pour gagner !' }
  ]
};

/** Compatibilité : vagues et boss de la 1re génération. */
export const WAVES = GEN_WAVES[1];
export const BOSSES = GEN_BOSSES[1];

/** Animation jouée par le partenaire quand l'attaque part. */
export const CAST_ANIM = {
  thunder: 'shoot', ember: 'shoot', watergun: 'shoot', quake: 'attack', swift: 'shoot', shadow: 'shoot',
  bloom: 'shoot', bite: 'attack', leafblade: 'attack', doublekick: 'attack', mudbomb: 'shoot',
  seedbomb: 'shoot', machpunch: 'attack', bubble: 'shoot'
};

/** Méga choisie (Dracaufeu X ou Y) ou unique. */
export const megaOf = (partner, choice) => {
  if (!partner?.mega) return null;
  if (!partner.mega.choices) return partner.mega;
  return partner.mega.choices.find((c) => c.id === choice) || null;
};

export const spriteOf = (dex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

/** XP pour passer du niveau `lv` au suivant. */
export const xpToNext = (lv) => Math.round(5 + lv * 4 + lv * lv * 0.35);
