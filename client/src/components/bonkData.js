/**
 * Données du mode « Sonic Bonk » (un survivors en 3D façon Megabonk) :
 * personnages, attaques, objets, robots ennemis, vagues et boss.
 */

export const RUN_SECONDS = 8 * 60;

export const CHARACTERS = [
  {
    id: 'sonic',
    name: 'Sonic',
    color: '#1f6dff',
    hp: 100,
    speed: 11,
    jump: 13,
    weapon: 'homing',
    air: 'dash',
    blurb: 'Le plus rapide. Attaque Téléguidée de départ et dash aérien.'
  },
  {
    id: 'tails',
    name: 'Tails',
    color: '#ffb02e',
    hp: 95,
    speed: 10,
    jump: 14,
    weapon: 'tornado',
    air: 'fly',
    blurb: 'Vole quelques secondes en restant appuyé sur Saut. Ses tornades repoussent tout.'
  },
  {
    id: 'knuckles',
    name: 'Knuckles',
    color: '#ff3b4e',
    hp: 140,
    speed: 9.4,
    jump: 12,
    weapon: 'quake',
    air: 'glide',
    blurb: 'Très résistant. Plane en restant appuyé sur Saut, frappe le sol à la ronde.'
  },
  {
    id: 'shadow',
    name: 'Shadow',
    color: '#2a2d3a',
    hp: 105,
    speed: 10.6,
    jump: 13,
    weapon: 'spear',
    air: 'dash',
    blurb: 'Lances du Chaos perçantes et dash aérien. Le plus offensif.'
  },
  {
    id: 'amy',
    name: 'Amy',
    color: '#ff7ac0',
    hp: 115,
    speed: 9.8,
    jump: 13.5,
    weapon: 'hammer',
    air: 'double',
    blurb: 'Double saut. Son Piko Piko Hammer écrase tout autour d’elle.'
  }
];

/* ——— Attaques automatiques (niveau 1 à 5) ——— */
export const WEAPONS = {
  homing: {
    name: 'Attaque Téléguidée',
    color: '#4fb3ff',
    desc: (lv) => `Une sphère bleue fonce sur l’ennemi le plus proche et rebondit sur ${lv} autre${lv > 1 ? 's' : ''}.`,
    at: (lv) => ({ cd: 1.1 - lv * 0.08, dmg: 16 + lv * 6, chains: lv, speed: 34 })
  },
  rings: {
    name: 'Lancer d’anneaux',
    color: '#ffd23a',
    desc: (lv) => `${lv + 2} anneaux tranchants lancés en éventail devant toi.`,
    at: (lv) => ({ cd: 1.3 - lv * 0.07, dmg: 11 + lv * 4, count: lv + 2, speed: 26, pierce: 1 + Math.floor(lv / 2) })
  },
  tornado: {
    name: 'Tornade',
    color: '#bff3ff',
    desc: (lv) => `${lv >= 3 ? 2 : 1} tornade${lv >= 3 ? 's' : ''} qui s’éloigne${lv >= 3 ? 'nt' : ''} en spirale et repousse${lv >= 3 ? 'nt' : ''} les robots.`,
    at: (lv) => ({ cd: 2.4 - lv * 0.18, dmg: 9 + lv * 3.5, count: lv >= 3 ? 2 : 1, size: 2.2 + lv * 0.35, life: 2.6 + lv * 0.2 })
  },
  quake: {
    name: 'Poing sismique',
    color: '#ff8a5a',
    desc: () => 'Frappe le sol : une onde de choc part de toi et projette les robots.',
    at: (lv) => ({ cd: 2.8 - lv * 0.22, dmg: 22 + lv * 8, radius: 7 + lv * 1.3 })
  },
  spear: {
    name: 'Lance du Chaos',
    color: '#ffe14a',
    desc: (lv) => `${Math.min(lv + 1, 5)} lances jaunes qui transpercent tout sur leur passage.`,
    at: (lv) => ({ cd: 1.25 - lv * 0.07, dmg: 14 + lv * 5, count: Math.min(lv + 1, 5), speed: 42 })
  },
  hammer: {
    name: 'Piko Piko Hammer',
    color: '#ff5aa8',
    desc: () => 'Un grand coup de marteau qui tourne autour de toi.',
    at: (lv) => ({ cd: 1.6 - lv * 0.12, dmg: 20 + lv * 7, radius: 4.2 + lv * 0.5 })
  },
  lightning: {
    name: 'Bouclier foudre',
    color: '#c79bff',
    desc: (lv) => `Foudroie ${lv + 1} robots proches à intervalles réguliers.`,
    at: (lv) => ({ cd: 1.5 - lv * 0.1, dmg: 15 + lv * 5, count: lv + 1, range: 14 + lv })
  },
  flame: {
    name: 'Bouclier flamme',
    color: '#ff6a1f',
    desc: () => 'Un cercle de flammes brûle en continu les robots qui t’approchent.',
    at: (lv) => ({ dps: 10 + lv * 6, radius: 3.4 + lv * 0.5 })
  }
};

/* ——— Objets passifs (niveau 1 à 5) ——— */
export const PASSIVES = {
  shoes: { name: 'Chaussures de vitesse', desc: '+8 % de vitesse de course.', color: '#ff3b4e' },
  gloves: { name: 'Gants de puissance', desc: '+12 % de dégâts.', color: '#ffffff' },
  magnet: { name: 'Aimant', desc: '+40 % de portée pour ramasser XP et anneaux.', color: '#c0c6d6' },
  heart: { name: 'Vie supplémentaire', desc: '+25 PV max et soigne d’autant.', color: '#6bd17a' },
  clock: { name: 'Chrono', desc: '−7 % de temps de recharge.', color: '#4fb3ff' },
  chao: { name: 'Chao porte-bonheur', desc: '+10 % d’XP et +5 % de coups critiques.', color: '#8ff2ff' }
};

export const MAX_WEAPONS = 4;
export const MAX_PASSIVES = 4;
export const MAX_LEVEL = 5;

/* ——— Robots (designs originaux) ——— */
export const ENEMIES = {
  beetle: { name: 'Scarabot', hp: 14, speed: 4.4, dmg: 6, size: 0.9, xp: 1, kind: 'beetle' },
  wasp: { name: 'Guêpobot', hp: 10, speed: 5.4, dmg: 5, size: 0.8, xp: 1, kind: 'wasp', fly: true },
  crab: { name: 'Crabot', hp: 34, speed: 3.2, dmg: 9, size: 1.1, xp: 2, kind: 'crab', shoots: true },
  pawn: { name: 'Sentinelle', hp: 26, speed: 4.6, dmg: 8, size: 1, xp: 2, kind: 'pawn' },
  roller: { name: 'Roulobot', hp: 20, speed: 7.2, dmg: 10, size: 0.85, xp: 2, kind: 'roller', charge: true },
  brute: { name: 'Cuirassé', hp: 120, speed: 2.9, dmg: 16, size: 1.8, xp: 5, kind: 'brute' },
  // Boss
  titan: { name: 'Titan d’acier', hp: 2600, speed: 3.4, dmg: 22, size: 4.2, xp: 40, kind: 'titan', boss: 'mini' },
  colossus: { name: 'Le Colosse', hp: 9000, speed: 3.8, dmg: 30, size: 5.2, xp: 0, kind: 'colossus', boss: 'final' }
};

export const WAVES = [
  { from: 0, list: ['beetle', 'beetle', 'wasp'] },
  { from: 45, list: ['beetle', 'wasp', 'pawn'] },
  { from: 100, list: ['pawn', 'wasp', 'crab', 'roller'] },
  { from: 170, list: ['pawn', 'crab', 'roller', 'beetle'] },
  { from: 250, list: ['pawn', 'roller', 'brute', 'wasp'] },
  { from: 330, list: ['crab', 'roller', 'brute', 'pawn'] },
  { from: 400, list: ['brute', 'roller', 'pawn', 'wasp', 'crab'] }
];

export const BOSSES = [
  { at: 210, id: 'titan', title: 'Un Titan d’acier débarque !' },
  { at: 420, id: 'colossus', title: 'Le Colosse arrive. Détruis-le pour gagner !' }
];

/** XP pour passer du niveau `lv` au suivant. */
export const xpToNext = (lv) => Math.round(6 + lv * 4.5 + lv * lv * 0.4);

/**
 * Modèles 3D des persos (public/bonk/models), téléchargés sur Sketchfab.
 * `clips` : nom (ou morceau de nom) de l'animation à utiliser pour chaque état.
 * `rig` : pour les modèles sans animation de course, os animés par le code
 * (suffixe « _N » du nom de l'os : [cuisse, genou] et [bras, coude]).
 */
export const MODELS = {
  sonic: {
    file: 'sonic.glb',
    credit: 'Sonic : « Sonic the Hedgehog » par Sonic the Hedgehog Fan # 9,945,677 (CC BY 4.0)',
    // Ses propres animations sont abîmées : il reprend celles de Shadow (voir anims.json).
    clips: {},
    retarget: {
      root: 'Bip001_44', spine: 'Spine1_36', neck: 'Neck_35', head: 'Head_18',
      thighL: 'L_Thigh_5', calfL: 'L_Calf_4', footL: 'L_Foot_3', toeL: 'L_Toe0_2',
      thighR: 'R_Thigh_9', calfR: 'R_Calf_8', footR: 'R_Foot_7', toeR: 'R_Toe0_6',
      uarmL: 'L_UpperArm_25', farmL: 'L_Forearm_24', handL: 'L_Hand_23',
      uarmR: 'R_UpperArm_33', farmR: 'R_Forearm_32', handR: 'R_Hand_31'
    }
  },
  shadow: {
    file: 'shadow.glb',
    credit: 'Shadow : « Shadow The Hedgehog (Sonic Forces/GMOD) » par Portycraft (CC BY-NC 4.0)',
    clips: { idle: '|idle', run: '|run', walk: '|walk', jump: '|fall', ball: '|ball', punch: '|chaosspearground', death: '|damage', hurt: '|damage', win: '|chaoscontrolloop', boost: '|boost' }
  },
  knuckles: {
    file: 'knuckles.glb',
    credit: 'Knuckles : « Knuckles (Sonic The Hedgehog) » par Guilherme Navarro (CC BY 4.0)',
    clips: {},
    retarget: {
      root: '_124', spine: '_123', neck: '_83', head: '_82',
      thighL: '_26', calfL: '_23', footL: '_20', toeL: '_17',
      thighR: '_36', calfR: '_33', footR: '_30', toeR: '_27',
      uarmL: '_101', farmL: '_99', handL: '_95',
      uarmR: '_120', farmR: '_118', handR: '_114'
    }
  },
  amy: {
    file: 'amy.glb',
    credit: 'Amy : « Amy Rose (Sonic The Hedgehog) » par Guilherme Navarro (CC BY 4.0)',
    clips: {},
    retarget: {
      root: '_144', spine: '_123', neck: '_71', head: '_70',
      thighL: '_130', calfL: '_128', footL: '_125', toeL: '_124',
      thighR: '_137', calfR: '_135', footR: '_132', toeR: '_131',
      uarmL: '_95', farmL: '_93', handL: '_89',
      uarmR: '_120', farmR: '_118', handR: '_114'
    }
  },
  tails: {
    file: 'tails.glb',
    credit: 'Tails : « Tails (Sonic The Hedgehog) » par Guilherme Navarro (CC BY 4.0)',
    clips: {},
    retarget: {
      root: '_143', spine: '_142', neck: '_90', head: '_89',
      thighL: '_36', calfL: '_34', footL: '_30', toeL: '_27',
      thighR: '_46', calfR: '_44', footR: '_40', toeR: '_37',
      uarmL: '_114', farmL: '_112', handL: '_108',
      uarmR: '_139', farmR: '_137', handR: '_133',
      spinner: '_26'
    }
  }
};
