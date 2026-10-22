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
    id: 'bulbasaur', gen: 1, name: 'Bulbizarre', dex: 1, type: 'Plante', color: '#7ac74c', hp: 130, speed: 2.6, weapon: 'leaf', learn: ['Plante'],
    blurb: 'Le plus résistant. Des Tranch’Herbe tournent autour de lui.',
    evolutions: [{ level: 8, name: 'Herbizarre', dex: 2, hp: 30 }, { level: 16, name: 'Florizarre', dex: 3, hp: 50 }],
    mega: { name: 'Méga-Florizarre', stone: 'Florizarrite', sprite: '3-mega', scale: 1.3 }
  },
  {
    id: 'charmander', gen: 1, name: 'Salamèche', dex: 4, type: 'Feu', color: '#ee8130', hp: 100, speed: 2.9, weapon: 'ember', learn: ['Feu'],
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
    id: 'squirtle', gen: 1, name: 'Carapuce', dex: 7, type: 'Eau', color: '#6390f0', hp: 120, speed: 2.7, weapon: 'watergun', learn: ['Eau'],
    blurb: 'Solide. Son Pistolet à O transperce toute une file d’ennemis.',
    evolutions: [{ level: 8, name: 'Carabaffe', dex: 8, hp: 30 }, { level: 16, name: 'Tortank', dex: 9, hp: 45 }],
    mega: { name: 'Méga-Tortank', stone: 'Tortankite', sprite: '9-mega', scale: 1.3 }
  },
  {
    id: 'pikachu', gen: 1, name: 'Pikachu', dex: 25, type: 'Électrik', color: '#f7d02c', hp: 90, speed: 3.2, weapon: 'thunder', learn: ['Électrik', 'Acier'],
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
    id: 'chikorita', gen: 2, name: 'Germignon', dex: 152, type: 'Plante', color: '#7ac74c', hp: 125, speed: 2.6, weapon: 'bloom', learn: ['Plante'],
    blurb: 'Fait pousser des champs de fleurs : tu t’y soignes, les ennemis y ralentissent et fanent.',
    evolutions: [{ level: 8, name: 'Macronium', dex: 153, hp: 30 }, { level: 16, name: 'Méganium', dex: 154, hp: 50 }],
    mega: { name: 'Méga-Méganium', stone: 'Méganiumite', sprite: '154-mega', scale: 1.0 }
  },
  {
    id: 'cyndaquil', gen: 2, name: 'Héricendre', dex: 155, type: 'Feu', color: '#ee8130', hp: 95, speed: 3.1, weapon: 'flametrail', learn: ['Feu'],
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
    id: 'totodile', gen: 2, name: 'Kaiminus', dex: 158, type: 'Eau', color: '#6390f0', hp: 115, speed: 2.8, weapon: 'bite', learn: ['Eau', 'Ténèbres'],
    blurb: 'Croque tout ce qui s’approche et se soigne à chaque morsure.',
    evolutions: [{ level: 8, name: 'Crocrodil', dex: 159, hp: 30 }, { level: 16, name: 'Aligatueur', dex: 160, hp: 45 }],
    mega: { name: 'Méga-Aligatueur', stone: 'Aligatueurite', sprite: '160-mega', scale: 1.0 }
  },
  {
    id: 'treecko', gen: 3, name: 'Arcko', dex: 252, type: 'Plante', color: '#7ac74c', hp: 95, speed: 3.2, weapon: 'leafblade', learn: ['Plante'],
    blurb: 'Lance des Lame-Feuille en boomerang : elles tranchent à l’aller et au retour.',
    evolutions: [{ level: 8, name: 'Massko', dex: 253, hp: 25 }, { level: 16, name: 'Jungko', dex: 254, hp: 45 }],
    mega: { name: 'Méga-Jungko', stone: 'Jungkite', sprite: '254-mega' }
  },
  {
    id: 'torchic', gen: 3, name: 'Poussifeu', dex: 255, type: 'Feu', color: '#ee8130', hp: 100, speed: 2.9, weapon: 'doublekick', learn: ['Feu', 'Combat'], trait: 'turbo',
    blurb: 'Turbo : il attaque de plus en plus vite tant qu’il n’est pas touché.',
    evolutions: [{ level: 8, name: 'Galifeu', dex: 256, hp: 30 }, { level: 16, name: 'Braségali', dex: 257, hp: 45 }],
    mega: { name: 'Méga-Braségali', stone: 'Braségalite', sprite: '257-mega', scale: 1.3 }
  },
  {
    id: 'mudkip', gen: 3, name: 'Gobou', dex: 258, type: 'Eau', color: '#6390f0', hp: 125, speed: 2.7, weapon: 'mudbomb', learn: ['Eau', 'Sol'],
    blurb: 'Ses Boue-Bombes laissent des flaques qui engluent la horde.',
    evolutions: [{ level: 8, name: 'Flobio', dex: 259, hp: 30 }, { level: 16, name: 'Laggron', dex: 260, hp: 50 }],
    mega: { name: 'Méga-Laggron', stone: 'Laggronite', sprite: '260-mega', scale: 1.3 }
  },
  {
    id: 'turtwig', gen: 4, name: 'Tortipouss', dex: 387, type: 'Plante', color: '#7ac74c', hp: 140, speed: 2.5, weapon: 'seedbomb', learn: ['Plante', 'Sol'], trait: 'bark',
    blurb: 'Écorce : un bouclier qui se recharge. Ses Canon Graine tombent en cloche sur les groupes.',
    evolutions: [{ level: 8, name: 'Boskara', dex: 388, hp: 35 }, { level: 16, name: 'Torterra', dex: 389, hp: 55 }]
  },
  {
    id: 'chimchar', gen: 4, name: 'Ouisticram', dex: 390, type: 'Feu', color: '#ee8130', hp: 95, speed: 3.1, weapon: 'machpunch', learn: ['Feu', 'Combat'],
    blurb: 'Enchaîne les Mach Punch : chaque coup d’affilée frappe plus fort (combo).',
    evolutions: [{ level: 8, name: 'Chimpenfeu', dex: 391, hp: 25 }, { level: 16, name: 'Simiabraz', dex: 392, hp: 45 }]
  },
  {
    id: 'piplup', gen: 4, name: 'Tiplouf', dex: 393, type: 'Eau', color: '#6390f0', hp: 115, speed: 2.8, weapon: 'bubble', learn: ['Eau'],
    blurb: 'Ses Bulles d’O emprisonnent les ennemis, qui y prennent plus de dégâts.',
    evolutions: [{ level: 8, name: 'Prinplouf', dex: 394, hp: 30 }, { level: 16, name: 'Pingoléon', dex: 395, hp: 50 }]
  }
];

/*
 * ——— Attaques (5 niveaux). `at(lv)` renvoie les valeurs du niveau. ———
 * Chaque starter commence avec son attaque signature. Au level-up il peut apprendre :
 *  - les attaques signature des autres starters *du même type* (`learn` du partenaire) ;
 *  - les capacités communes (`shared`), dont certaines se débloquent avec la Poussière (`cost`).
 */
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
    shared: true,
    name: 'Séisme',
    type: 'Sol',
    color: '#c99a54',
    desc: () => 'Une onde de choc part de toi à intervalles réguliers.',
    at: (lv) => ({ cd: 3.2 - lv * 0.25, dmg: 16 + lv * 6, radius: 100 + lv * 16 })
  },
  swift: {
    shared: true,
    name: 'Météores',
    type: 'Normal',
    color: '#ffe680',
    desc: (lv) => `${lv + 1} étoiles à tête chercheuse qui ne ratent jamais leur cible.`,
    at: (lv) => ({ cd: 1.5 - lv * 0.08, dmg: 8 + lv * 2.5, count: lv + 1, speed: 6 })
  },
  shadow: {
    shared: true,
    name: 'Ball’Ombre',
    type: 'Spectre',
    color: '#8b6bd6',
    desc: () => 'Une grosse boule lente qui traverse toute la horde.',
    at: (lv) => ({ cd: 2.6 - lv * 0.18, dmg: 26 + lv * 9, size: 16 + lv * 2.5, speed: 3.4 })
  },
  icebeam: {
    shared: true,
    cost: 400,
    name: 'Laser Glace',
    type: 'Glace',
    color: '#9fe6ff',
    desc: (lv) => `Un rayon glacé qui traverse toute une ligne d’ennemis et les ralentit${lv >= 4 ? ' presque sur place' : ''}.`,
    at: (lv) => ({ cd: 2.1 - lv * 0.15, dmg: 14 + lv * 5, len: 380 + lv * 30, w: 16 + lv * 2, slow: 0.45 - lv * 0.05, slowT: 1.4 + lv * 0.2 })
  },
  sludge: {
    shared: true,
    cost: 450,
    name: 'Bombe Beurk',
    type: 'Poison',
    color: '#b06ad6',
    desc: (lv) => `Lance ${lv >= 4 ? 'deux bombes' : 'une bombe'} de boue toxique : une flaque violette empoisonne tout ce qui marche dedans.`,
    at: (lv) => ({ cd: 2.2 - lv * 0.14, dmg: 12 + lv * 4, puddle: 50 + lv * 7, count: lv >= 4 ? 2 : 1, dps: 9 + lv * 4, life: 3 + lv * 0.3 })
  },
  psychic: {
    shared: true,
    cost: 600,
    name: 'Psyko',
    type: 'Psy',
    color: '#ff7ac8',
    desc: (lv) => `Frappe par la pensée les ${lv + 1} ennemis les plus résistants autour de toi et les repousse.`,
    at: (lv) => ({ cd: 2.6 - lv * 0.18, dmg: 24 + lv * 9, count: lv + 1, range: 520 })
  },
  hurricane: {
    shared: true,
    cost: 700,
    name: 'Vent Violent',
    type: 'Vol',
    color: '#c8e8ff',
    desc: (lv) => `${lv >= 4 ? 'Deux tornades errantes aspirent' : 'Une tornade errante aspire'} les ennemis et les malmène.`,
    at: (lv) => ({ cd: 4.4 - lv * 0.3, dps: 16 + lv * 6, radius: 54 + lv * 6, pull: 1.4 + lv * 0.2, count: lv >= 4 ? 2 : 1, life: 3.2 + lv * 0.3 })
  },
  /* — Capacités communes (Météores, Séisme… et celles-ci) — */
  rockslide: {
    shared: true,
    name: 'Éboulement',
    type: 'Roche',
    color: '#b08a5a',
    desc: (lv) => `${2 + Math.ceil(lv / 2)} rochers tombent sur les ennemis proches et les assomment.`,
    at: (lv) => ({ cd: 2.6 - lv * 0.16, dmg: 20 + lv * 7, count: 2 + Math.ceil(lv / 2), blast: 44 + lv * 4, range: 340 })
  },
  aerialace: {
    shared: true,
    name: 'Aéropiqué',
    type: 'Vol',
    color: '#c8e8ff',
    desc: (lv) => `Une lame de vent qui fend ${lv + 1} ennemis à la suite. Elle ne rate jamais.`,
    at: (lv) => ({ cd: 1.4 - lv * 0.08, dmg: 12 + lv * 5, chains: lv + 1, range: 300 })
  },
  bodyslam: {
    shared: true,
    name: 'Plaquage',
    type: 'Normal',
    color: '#e8e0c8',
    desc: (lv) => `Ton esquive devient une charge : elle blesse et repousse tout ce que tu traverses (${16 + lv * 8} dégâts) et se recharge ${10 + lv * 4} % plus vite.`,
    at: (lv) => ({ dmg: 16 + lv * 8, cdr: 0.1 + lv * 0.04 })
  },
  blizzard: {
    shared: true,
    cost: 500,
    name: 'Blizzard',
    type: 'Glace',
    color: '#bfefff',
    desc: (lv) => `${6 + lv * 2} éclats de glace partent tout autour de toi, transpercent et ralentissent.`,
    at: (lv) => ({ cd: 2.8 - lv * 0.18, dmg: 10 + lv * 4, count: 6 + lv * 2, speed: 5.5 })
  },
  dazzlinggleam: {
    shared: true,
    cost: 550,
    name: 'Éclat Magique',
    type: 'Fée',
    color: '#ffb8e8',
    desc: () => 'Un éclair de lumière rose qui blesse tous les ennemis autour de toi.',
    at: (lv) => ({ cd: 3 - lv * 0.2, dmg: 18 + lv * 7, radius: 210 + lv * 18 })
  },
  nightslash: {
    shared: true,
    cost: 600,
    name: 'Tranche-Nuit',
    type: 'Ténèbres',
    color: '#8a6ad6',
    desc: (lv) => `Tranche ${lv + 1} ennemis proches dans l’ombre, avec +25 % de chances de coup critique.`,
    at: (lv) => ({ cd: 1.3 - lv * 0.07, dmg: 15 + lv * 6, count: lv + 1, range: 150 })
  },
  flashcannon: {
    shared: true,
    cost: 650,
    name: 'Luminocanon',
    type: 'Acier',
    color: '#d8e0ee',
    desc: () => 'Une sphère d’acier brillante qui traverse toute la horde.',
    at: (lv) => ({ cd: 2.2 - lv * 0.15, dmg: 30 + lv * 10, size: 14 + lv * 2, speed: 4.6 })
  },
  hyperbeam: {
    shared: true,
    cost: 1000,
    name: 'Ultralaser',
    type: 'Normal',
    color: '#ffb347',
    desc: () => 'Un rayon colossal qui pulvérise tout sur une longue ligne. Très lent à recharger.',
    at: (lv) => ({ cd: 7 - lv * 0.5, dmg: 90 + lv * 30, len: 720, w: 34 + lv * 3 })
  },
  dracometeor: {
    shared: true,
    cost: 900,
    name: 'Draco-Météore',
    type: 'Dragon',
    color: '#8a6aff',
    desc: (lv) => `${2 + lv} météores s’écrasent sur les ennemis autour de toi après un court sifflement.`,
    at: (lv) => ({ cd: 4 - lv * 0.25, dmg: 34 + lv * 11, count: 2 + lv, blast: 56 + lv * 5, range: 420 })
  },
  /* — Attaques de type (apprises par les starters de ce type, gratuites) — */
  spark: {
    name: 'Étincelle',
    type: 'Électrik',
    color: '#ffe14a',
    desc: (lv) => `Une décharge part de toi à intervalles courts : les ennemis proches sont touchés et ralentis${lv >= 4 ? ' fortement' : ''}.`,
    at: (lv) => ({ cd: 1.3 - lv * 0.08, dmg: 9 + lv * 3, radius: 72 + lv * 8, slow: 0.65 - lv * 0.05, slowT: 0.8 })
  },
  thunderwave: {
    name: 'Cage-Éclair',
    type: 'Électrik',
    color: '#f7d02c',
    desc: (lv) => `Paralyse les ${lv + 1} ennemis les plus proches pendant ${(1.2 + lv * 0.2).toFixed(1)} s : ils ne bougent presque plus.`,
    at: (lv) => ({ cd: 3 - lv * 0.2, dmg: 6 + lv * 2, count: lv + 1, stun: 1.2 + lv * 0.2, range: 300 })
  },
  electroball: {
    name: 'Boule Élek',
    type: 'Électrik',
    color: '#fff27a',
    desc: (lv) => `${lv >= 3 ? 'Deux boules électriques qui explosent' : 'Une boule électrique qui explose'} au contact.`,
    at: (lv) => ({ cd: 1.3 - lv * 0.07, dmg: 14 + lv * 5, count: lv >= 3 ? 2 : 1, blast: 34 + lv * 6, speed: 6 })
  },
  irontail: {
    name: 'Queue de Fer',
    type: 'Acier',
    color: '#b8c0cc',
    desc: () => 'Un grand coup de queue en arc devant toi, qui repousse fort.',
    at: (lv) => ({ cd: 1.4 - lv * 0.08, dmg: 20 + lv * 7, range: 72 + lv * 8, arc: 1.1, knock: 9 })
  },
  flamethrower: {
    name: 'Lance-Flammes',
    type: 'Feu',
    color: '#ff6a1f',
    desc: () => 'Un jet de flammes en cône devant toi, qui touche tout sur sa route.',
    at: (lv) => ({ cd: 1.15 - lv * 0.07, dmg: 12 + lv * 5, range: 130 + lv * 12, arc: 0.45, knock: 2.5 })
  },
  firespin: {
    name: 'Danse Flammes',
    type: 'Feu',
    color: '#ff8a3a',
    desc: (lv) => `Un cercle de flammes s’allume autour de toi (${12 + lv * 5} dégâts/s).`,
    at: (lv) => ({ cd: 4.4 - lv * 0.3, radius: 90 + lv * 10, dps: 12 + lv * 5, life: 2.6 + lv * 0.3, n: 10 + lv })
  },
  willowisp: {
    name: 'Feu Follet',
    type: 'Feu',
    color: '#8a9aff',
    desc: (lv) => `${lv + 1} feux follets qui poursuivent les ennemis et laissent une petite flamme en les touchant.`,
    at: (lv) => ({ cd: 1.8 - lv * 0.1, dmg: 10 + lv * 3, count: lv + 1, speed: 4.6, burn: 8 + lv * 3 })
  },
  surf: {
    name: 'Surf',
    type: 'Eau',
    color: '#4fa8ff',
    desc: () => 'Une vague part de toi et repousse très loin toute la horde.',
    at: (lv) => ({ cd: 3.6 - lv * 0.25, dmg: 14 + lv * 5, radius: 120 + lv * 16, knock: 12 })
  },
  hydropump: {
    name: 'Hydrocanon',
    type: 'Eau',
    color: '#3a7bff',
    desc: () => 'Un puissant jet d’eau qui transperce toute une ligne d’ennemis.',
    at: (lv) => ({ cd: 2.4 - lv * 0.16, dmg: 22 + lv * 8, len: 340 + lv * 30, w: 18 + lv * 2 })
  },
  whirlpool: {
    name: 'Siphon',
    type: 'Eau',
    color: '#4fc8ff',
    desc: () => 'Un tourbillon d’eau erre vers la horde, l’aspire et la noie.',
    at: (lv) => ({ cd: 4.6 - lv * 0.3, dps: 12 + lv * 5, radius: 50 + lv * 6, pull: 1.6 + lv * 0.2, count: 1, life: 3 + lv * 0.3 })
  },
  gigadrain: {
    name: 'Méga-Sangsue',
    type: 'Plante',
    color: '#9be06a',
    desc: (lv) => `Draine ${lv >= 3 ? 'deux ennemis' : 'un ennemi'} : ${2 + lv} PV rendus par cible touchée.`,
    at: (lv) => ({ cd: 1.6 - lv * 0.1, dmg: 14 + lv * 5, count: lv >= 3 ? 2 : 1, heal: 2 + lv, range: 300 })
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
  },
  // Attaques ajoutées pour la Ligue du Poké Rush (Insecte, Osselet)
  pinmissile: {
    gen: 1,
    name: 'Dard-Nuée',
    type: 'Insecte',
    color: '#a6b91a',
    desc: (lv) => `${lv + 2} dards à tête chercheuse, tirés en rafale.`,
    at: (lv) => ({ cd: 1.25 - lv * 0.07, dmg: 6 + lv * 2.2, count: lv + 2, speed: 7 })
  },
  bonemerang: {
    gen: 1,
    name: 'Osmerang',
    type: 'Sol',
    color: '#e8dcc0',
    desc: (lv) => `Un os lancé en boomerang qui frappe à l’aller et au retour${lv >= 3 ? ', en double' : ''}.`,
    at: (lv) => ({ cd: 1.35 - lv * 0.08, dmg: 14 + lv * 5, range: 200 + lv * 20, speed: 7, back: lv >= 3 })
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
  scope: { name: 'Lentilscope', desc: '+6 % de chances de coup critique (dégâts ×1,8).', color: '#ff9a3c' },
  shellbell: { name: 'Grelot Coque', desc: 'Chaque K.O. a 6 % de chances de rendre 3 PV.', color: '#f2c6a0', cost: 350 },
  expshare: { name: 'Multi Exp', desc: '+8 % d’XP.', color: '#7fd0ff', cost: 400 },
  brightpowder: { name: 'Poudre Claire', desc: '4 % de chances d’esquiver un coup.', color: '#fff6c2', cost: 500 }
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
  onix: { name: 'Onix', dex: 95, ai: 'onix', scale: 2, color: '#9b8a6a', hp: 1000, speed: 1.05, dmg: 18, size: 92, xp: 25, boss: 'mini' },
  snorlax: { name: 'Ronflex', dex: 143, ai: 'snorlax', scale: 3.4, color: '#3d6f8a', hp: 1100, speed: 0.75, dmg: 26, size: 104, xp: 30, boss: 'mini' },
  mewtwo: { name: 'Mewtwo', dex: 150, ai: 'mewtwo', flying: true, scale: 2.8, color: '#c77dd6', hp: 7000, speed: 1.25, dmg: 30, size: 112, xp: 0, boss: 'final', shoots: true },
  steelix: { name: 'Steelix', dex: 208, ai: 'onix', scale: 2, color: '#9aa0aa', hp: 1050, speed: 1.05, dmg: 19, size: 92, xp: 25, boss: 'mini' },
  tyranitar: { name: 'Tyranocif', dex: 248, ai: 'snorlax', scale: 3.2, color: '#5a8a5a', hp: 1150, speed: 0.8, dmg: 26, size: 100, xp: 30, boss: 'mini' },
  lugia: { name: 'Lugia', dex: 249, ai: 'mewtwo', flying: true, scale: 2.2, color: '#9fd0ff', hp: 7600, speed: 1.3, dmg: 30, size: 112, xp: 0, boss: 'final', shoots: true },
  aggron: { name: 'Galeking', dex: 306, ai: 'onix', scale: 3.2, color: '#9aa0aa', hp: 1100, speed: 1.0, dmg: 20, size: 96, xp: 25, boss: 'mini' },
  salamence: { name: 'Drattak', dex: 373, ai: 'dashboss', flying: true, scale: 2.4, color: '#5a8fd6', hp: 1050, speed: 1.2, dmg: 24, size: 100, xp: 30, boss: 'mini' },
  rayquaza: { name: 'Rayquaza', dex: 384, ai: 'mewtwo', flying: true, scale: 2, color: '#5fd06a', hp: 7800, speed: 1.35, dmg: 30, size: 120, xp: 0, boss: 'final', shoots: true },
  garchomp: { name: 'Carchacrok', dex: 445, ai: 'dashboss', scale: 3.2, color: '#5a6fb8', hp: 1100, speed: 1.2, dmg: 22, size: 96, xp: 25, boss: 'mini' },
  mamoswine: { name: 'Mammochon', dex: 473, ai: 'snorlax', scale: 3.4, color: '#8a6a4a', hp: 1150, speed: 0.8, dmg: 26, size: 104, xp: 30, boss: 'mini' },
  dialga: { name: 'Dialga', dex: 483, ai: 'mewtwo', scale: 2, color: '#6a8fd6', hp: 8000, speed: 1.2, dmg: 30, size: 120, xp: 0, boss: 'final', shoots: true },  /* — Kanto (pool élargi) — */
  spearow: { name: 'Piafabec', dex: 21, ai: 'fly', flying: true, color: '#a8724a', hp: 9, speed: 2.0, dmg: 4, size: 28, xp: 1 },
  oddish: { name: 'Mystherbe', dex: 43, ai: 'walk', color: '#5a7fd6', hp: 13, speed: 1.0, dmg: 4, size: 28, xp: 1 },
  mankey: { name: 'Férosinge', dex: 56, ai: 'charge', color: '#c9a36b', hp: 14, speed: 1.5, dmg: 5, size: 30, xp: 1 },
  koffing: { name: 'Smogo', dex: 109, ai: 'explode', flying: true, color: '#8b6bd6', hp: 26, speed: 1.2, dmg: 22, size: 34, xp: 2 },
  magnemite: { name: 'Magnéti', dex: 81, ai: 'shock', flying: true, color: '#9aa0aa', hp: 22, speed: 1.4, dmg: 8, size: 30, xp: 2 },
  machop: { name: 'Machoc', dex: 66, ai: 'walk', heavy: true, color: '#7a8ab8', hp: 40, speed: 1.0, dmg: 9, size: 34, xp: 2 },
  bellsprout: { name: 'Chétiflor', dex: 69, ai: 'spit', color: '#c9d65a', hp: 20, speed: 1.2, dmg: 6, size: 32, xp: 2 },
  primeape: { name: 'Colossinge', dex: 57, ai: 'charge', color: '#c9a36b', hp: 70, speed: 1.7, dmg: 12, size: 40, xp: 3 },
  weezing: { name: 'Smogogo', dex: 110, ai: 'spit', flying: true, color: '#8b6bd6', hp: 80, speed: 1.1, dmg: 12, size: 44, xp: 4 },
  magneton: { name: 'Magnéton', dex: 82, ai: 'shock', flying: true, color: '#9aa0aa', hp: 75, speed: 1.4, dmg: 13, size: 42, xp: 4 },
  arbok: { name: 'Arbok', dex: 24, ai: 'spit', color: '#a35cc4', hp: 80, speed: 1.4, dmg: 12, size: 42, xp: 4 },
  /* — Johto (pool élargi) — */
  wooper: { name: 'Axoloto', dex: 194, ai: 'walk', color: '#6fa8e0', hp: 14, speed: 1.0, dmg: 5, size: 28, xp: 1 },
  marill: { name: 'Marill', dex: 183, ai: 'walk', color: '#6390f0', hp: 12, speed: 1.3, dmg: 4, size: 28, xp: 1 },
  natu: { name: 'Natu', dex: 177, ai: 'zigzag', color: '#5fd06a', hp: 10, speed: 1.6, dmg: 4, size: 26, xp: 1 },
  yanma: { name: 'Yanma', dex: 193, ai: 'fly', flying: true, color: '#d0503a', hp: 28, speed: 2.0, dmg: 7, size: 34, xp: 2 },
  houndour: { name: 'Malosse', dex: 228, ai: 'spit', color: '#5a4a4a', hp: 30, speed: 1.4, dmg: 8, size: 34, xp: 2 },
  sneasel: { name: 'Farfuret', dex: 215, ai: 'charge', color: '#3a4a6a', hp: 30, speed: 1.7, dmg: 8, size: 34, xp: 2 },
  houndoom: { name: 'Démolosse', dex: 229, ai: 'spit', color: '#5a4a4a', hp: 85, speed: 1.5, dmg: 13, size: 44, xp: 4 },
  skarmory: { name: 'Airmure', dex: 227, ai: 'swoop', flying: true, color: '#9aa0aa', hp: 85, speed: 1.9, dmg: 13, size: 44, xp: 4 },
  donphan: { name: 'Donphan', dex: 232, ai: 'charge', heavy: true, color: '#7a8a9a', hp: 140, speed: 1.0, dmg: 17, size: 44, xp: 5 },
  granbull: { name: 'Granbull', dex: 210, ai: 'charge', heavy: true, color: '#c9a3d6', hp: 110, speed: 1.1, dmg: 15, size: 42, xp: 4 },
  gligar: { name: 'Scorplane', dex: 207, ai: 'swoop', flying: true, color: '#a37bd6', hp: 60, speed: 1.8, dmg: 11, size: 38, xp: 3 },
  /* — Hoenn (pool élargi) — */
  seedot: { name: 'Grainipiot', dex: 273, ai: 'walk', color: '#a87a4a', hp: 12, speed: 1.0, dmg: 4, size: 26, xp: 1 },
  lotad: { name: 'Nénupiot', dex: 270, ai: 'walk', color: '#5fb85a', hp: 14, speed: 0.9, dmg: 4, size: 28, xp: 1 },
  whismur: { name: 'Chuchmur', dex: 293, ai: 'walk', color: '#d0a3d6', hp: 13, speed: 1.1, dmg: 5, size: 28, xp: 1 },
  shroomish: { name: 'Balignon', dex: 285, ai: 'spit', color: '#c9b38a', hp: 24, speed: 1.0, dmg: 7, size: 30, xp: 2 },
  nuzleaf: { name: 'Pifeuil', dex: 274, ai: 'charge', color: '#a87a4a', hp: 30, speed: 1.5, dmg: 8, size: 34, xp: 2 },
  electrike: { name: 'Dynavolt', dex: 309, ai: 'shock', color: '#5fd06a', hp: 24, speed: 1.7, dmg: 7, size: 32, xp: 2 },
  numel: { name: 'Chamallot', dex: 322, ai: 'walk', heavy: true, color: '#e0b84a', hp: 40, speed: 0.9, dmg: 9, size: 34, xp: 2 },
  manectric: { name: 'Élecsprint', dex: 310, ai: 'shock', color: '#f7d02c', hp: 75, speed: 1.8, dmg: 13, size: 42, xp: 4 },
  shiftry: { name: 'Tengalice', dex: 275, ai: 'charge', color: '#8a6a4a', hp: 80, speed: 1.6, dmg: 13, size: 42, xp: 4 },
  absol: { name: 'Absol', dex: 359, ai: 'charge', color: '#dfe6f2', hp: 75, speed: 1.8, dmg: 14, size: 42, xp: 4 },
  banette: { name: 'Branette', dex: 354, ai: 'ghost', flying: true, blink: true, color: '#5a5a6a', hp: 65, speed: 1.6, dmg: 11, size: 38, xp: 3 },
  camerupt: { name: 'Camérupt', dex: 323, ai: 'charge', heavy: true, color: '#c96a3a', hp: 150, speed: 0.9, dmg: 18, size: 46, xp: 5 },
  /* — Sinnoh (pool élargi) — */
  kricketot: { name: 'Crikzik', dex: 401, ai: 'walk', color: '#d0503a', hp: 12, speed: 1.0, dmg: 4, size: 28, xp: 1 },
  budew: { name: 'Rozbouton', dex: 406, ai: 'spit', color: '#7ac74c', hp: 11, speed: 1.1, dmg: 4, size: 26, xp: 1 },
  buizel: { name: 'Mustébouée', dex: 418, ai: 'zigzag', color: '#ff9a3c', hp: 13, speed: 1.8, dmg: 5, size: 30, xp: 1 },
  buneary: { name: 'Laporeille', dex: 427, ai: 'zigzag', color: '#c9a36b', hp: 28, speed: 1.7, dmg: 7, size: 32, xp: 2 },
  glameow: { name: 'Chaglam', dex: 431, ai: 'charge', color: '#9aa0aa', hp: 28, speed: 1.6, dmg: 7, size: 32, xp: 2 },
  skorupi: { name: 'Rapion', dex: 451, ai: 'spit', color: '#a37bd6', hp: 34, speed: 1.2, dmg: 8, size: 32, xp: 2 },
  kricketune: { name: 'Mélokrik', dex: 402, ai: 'charge', color: '#d0503a', hp: 65, speed: 1.6, dmg: 12, size: 40, xp: 3 },
  honchkrow: { name: 'Corboss', dex: 430, ai: 'swoop', flying: true, color: '#3a3a5a', hp: 80, speed: 1.9, dmg: 13, size: 44, xp: 4 },
  drapion: { name: 'Drascore', dex: 452, ai: 'charge', heavy: true, color: '#8b6bd6', hp: 150, speed: 1.0, dmg: 17, size: 46, xp: 5 },
  lucario: { name: 'Lucario', dex: 448, ai: 'charge', color: '#3a6fd6', hp: 85, speed: 1.8, dmg: 14, size: 42, xp: 4 },
  weavile: { name: 'Dimoret', dex: 461, ai: 'charge', color: '#3a3a5a', hp: 70, speed: 2.0, dmg: 13, size: 40, xp: 4 },
  mismagius: { name: 'Magirêve', dex: 429, ai: 'ghost', flying: true, blink: true, color: '#8b3a8a', hp: 70, speed: 1.6, dmg: 12, size: 40, xp: 4 },
  /* — Boss (pool élargi) — */
  gyarados: { name: 'Léviator', dex: 130, ai: 'dashboss', scale: 2.2, color: '#3a6fd6', hp: 1050, speed: 1.2, dmg: 22, size: 96, xp: 25, boss: 'mini' },
  aerodactyl: { name: 'Ptéra', dex: 142, ai: 'dashboss', flying: true, scale: 2.4, color: '#9a8ab8', hp: 950, speed: 1.3, dmg: 20, size: 92, xp: 25, boss: 'mini' },
  scizor: { name: 'Cizayox', dex: 212, ai: 'dashboss', scale: 2.4, color: '#d0303a', hp: 1000, speed: 1.3, dmg: 22, size: 92, xp: 25, boss: 'mini' },
  heracross: { name: 'Scarhino', dex: 214, ai: 'snorlax', scale: 2.6, color: '#3a5ab8', hp: 1100, speed: 0.9, dmg: 24, size: 96, xp: 25, boss: 'mini' },
  metagross: { name: 'Métalosse', dex: 376, ai: 'onix', scale: 2.4, color: '#5a8fd6', hp: 1100, speed: 1.0, dmg: 22, size: 96, xp: 25, boss: 'mini' },
  flygon: { name: 'Libégon', dex: 330, ai: 'dashboss', flying: true, scale: 2.4, color: '#5fd06a', hp: 1000, speed: 1.3, dmg: 22, size: 96, xp: 25, boss: 'mini' },
  rhyperior: { name: 'Rhinastoc', dex: 464, ai: 'snorlax', scale: 2.6, color: '#8a6a4a', hp: 1150, speed: 0.85, dmg: 25, size: 100, xp: 25, boss: 'mini' },
  electivire: { name: 'Élekable', dex: 466, ai: 'dashboss', scale: 2.6, color: '#f7d02c', hp: 1050, speed: 1.2, dmg: 22, size: 96, xp: 25, boss: 'mini' },
  articuno: { name: 'Artikodin', dex: 144, ai: 'mewtwo', flying: true, scale: 2.2, color: '#9fd8ff', hp: 7000, speed: 1.25, dmg: 30, size: 110, xp: 0, boss: 'final', shoots: true },
  zapdos: { name: 'Électhor', dex: 145, ai: 'mewtwo', flying: true, scale: 2.2, color: '#f7d02c', hp: 7000, speed: 1.3, dmg: 30, size: 110, xp: 0, boss: 'final', shoots: true },
  moltres: { name: 'Sulfura', dex: 146, ai: 'mewtwo', flying: true, scale: 2.2, color: '#ff8a3a', hp: 7000, speed: 1.25, dmg: 30, size: 110, xp: 0, boss: 'final', shoots: true },
  hooh: { name: 'Ho-Oh', dex: 250, ai: 'mewtwo', flying: true, scale: 2.1, color: '#ff8a3a', hp: 7600, speed: 1.3, dmg: 30, size: 112, xp: 0, boss: 'final', shoots: true },
  entei: { name: 'Entei', dex: 244, ai: 'mewtwo', scale: 2.4, color: '#c96a3a', hp: 7400, speed: 1.3, dmg: 30, size: 108, xp: 0, boss: 'final', shoots: true },
  raikou: { name: 'Raikou', dex: 243, ai: 'mewtwo', scale: 2.4, color: '#f7d02c', hp: 7400, speed: 1.35, dmg: 30, size: 108, xp: 0, boss: 'final', shoots: true },
  suicune: { name: 'Suicune', dex: 245, ai: 'mewtwo', scale: 2.4, color: '#5fb8e0', hp: 7400, speed: 1.3, dmg: 30, size: 108, xp: 0, boss: 'final', shoots: true },
  groudon: { name: 'Groudon', dex: 383, ai: 'mewtwo', scale: 2, color: '#d0503a', hp: 7800, speed: 1.15, dmg: 32, size: 120, xp: 0, boss: 'final', shoots: true },
  kyogre: { name: 'Kyogre', dex: 382, ai: 'mewtwo', flying: true, scale: 2, color: '#3a6fd6', hp: 7800, speed: 1.2, dmg: 30, size: 120, xp: 0, boss: 'final', shoots: true },
  latios: { name: 'Latios', dex: 381, ai: 'mewtwo', flying: true, scale: 2.4, color: '#5a8fd6', hp: 7400, speed: 1.4, dmg: 30, size: 108, xp: 0, boss: 'final', shoots: true },
  latias: { name: 'Latias', dex: 380, ai: 'mewtwo', flying: true, scale: 2.4, color: '#d0503a', hp: 7400, speed: 1.4, dmg: 30, size: 108, xp: 0, boss: 'final', shoots: true },
  palkia: { name: 'Palkia', dex: 484, ai: 'mewtwo', scale: 2, color: '#d69ad6', hp: 8000, speed: 1.2, dmg: 30, size: 120, xp: 0, boss: 'final', shoots: true },
  giratina: { name: 'Giratina', dex: 487, ai: 'mewtwo', flying: true, scale: 2, color: '#8a6a8a', hp: 8000, speed: 1.2, dmg: 30, size: 120, xp: 0, boss: 'final', shoots: true },
  darkrai: { name: 'Darkrai', dex: 491, ai: 'mewtwo', flying: true, scale: 2.6, color: '#3a3a5a', hp: 7600, speed: 1.3, dmg: 30, size: 108, xp: 0, boss: 'final', shoots: true }
};

/**
 * Pools d'ennemis de chaque génération. À chaque partie on en tire une partie (roster) :
 * 4 espèces par palier (faible, moyen, fort), 2 boss intermédiaires et 1 boss final.
 */
export const GEN_POOLS = {
  1: {
    t1: ['rattata', 'pidgey', 'caterpie', 'zubat', 'spearow', 'oddish', 'mankey'],
    t2: ['ekans', 'geodude', 'gastly', 'koffing', 'magnemite', 'machop', 'bellsprout'],
    t3: ['raticate', 'golbat', 'graveler', 'haunter', 'primeape', 'weezing', 'magneton', 'arbok'],
    minis: ['onix', 'snorlax', 'gyarados', 'aerodactyl'],
    finals: ['mewtwo', 'articuno', 'zapdos', 'moltres']
  },
  2: {
    t1: ['sentret', 'hoothoot', 'ledyba', 'teddiursa', 'wooper', 'marill', 'natu'],
    t2: ['spinarak', 'mareep', 'pineco', 'snubbull', 'misdreavus', 'yanma', 'houndour', 'sneasel'],
    t3: ['furret', 'noctowl', 'ariados', 'crobat', 'ursaring', 'blissey', 'houndoom', 'skarmory', 'donphan', 'granbull', 'gligar'],
    minis: ['steelix', 'tyranitar', 'scizor', 'heracross'],
    finals: ['lugia', 'hooh', 'entei', 'raikou', 'suicune']
  },
  3: {
    t1: ['zigzagoon', 'poochyena', 'taillow', 'wurmple', 'seedot', 'lotad', 'whismur'],
    t2: ['wingull', 'makuhita', 'aron', 'shroomish', 'nuzleaf', 'electrike', 'numel'],
    t3: ['mightyena', 'swellow', 'hariyama', 'sableye', 'lairon', 'manectric', 'shiftry', 'absol', 'banette', 'camerupt'],
    minis: ['aggron', 'salamence', 'metagross', 'flygon'],
    finals: ['rayquaza', 'groudon', 'kyogre', 'latios', 'latias']
  },
  4: {
    t1: ['starly', 'bidoof', 'shinx', 'kricketot', 'budew', 'buizel'],
    t2: ['stunky', 'drifloon', 'gible', 'croagunk', 'buneary', 'glameow', 'skorupi'],
    t3: ['staravia', 'luxio', 'gabite', 'honchkrow', 'drapion', 'lucario', 'weavile', 'mismagius', 'kricketune'],
    minis: ['garchomp', 'mamoswine', 'rhyperior', 'electivire'],
    finals: ['dialga', 'palkia', 'giratina', 'darkrai']
  }
};

/** Génération et palier de chaque ennemi (Pokédex). */
export const FOE_INFO = (() => {
  const out = {};
  Object.entries(GEN_POOLS).forEach(([g, pool]) => Object.entries(pool).forEach(([tier, ids]) => ids.forEach((id) => { out[id] = { gen: Number(g), tier }; })));
  return out;
})();
export const ALL_FOE_IDS = Object.keys(FOE_INFO);

/** Hasard reproductible (défi du jour). */
export const seededRng = (seed) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const shuffled = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** Tire le roster d'une partie : vagues (en secondes) et boss. */
export const buildRoster = (gen, rng = Math.random) => {
  const pool = GEN_POOLS[gen] || GEN_POOLS[1];
  const a = shuffled(pool.t1, rng).slice(0, 4);
  const b = shuffled(pool.t2, rng).slice(0, 4);
  const c = shuffled(pool.t3, rng).slice(0, 4);
  const waves = [
    { from: 0, foes: [a[0], a[1]] },
    { from: 75, foes: [a[0], a[1], a[2]] },
    { from: 140, foes: [a[2], a[3], b[0], b[1]] },
    { from: 220, foes: [a[3], b[0], b[1], b[2]] },
    { from: 300, foes: [b[1], b[2], b[3], c[0]] },
    { from: 390, foes: [b[2], b[3], c[0], c[1]] },
    { from: 450, foes: [b[3], c[0], c[1], c[2]] },
    { from: 510, foes: [b[0], c[0], c[1], c[2], c[3]] }
  ];
  const minis = shuffled(pool.minis, rng).slice(0, 2);
  const final = pool.finals[Math.floor(rng() * pool.finals.length)];
  const bosses = [
    { at: 180, id: minis[0], hpMul: 1, title: `${FOES[minis[0]].name} surgit !` },
    { at: 360, id: minis[1], hpMul: 2.2, title: `${FOES[minis[1]].name} bloque le passage !` },
    { at: 540, id: final, hpMul: 1, title: `${FOES[final].name} apparaît. Bats-le pour gagner !` }
  ];
  return { gen, waves, bosses, foes: [...a, ...b, ...c], minis, final };
};

/** Ce que fait chaque ennemi (fiche du Pokédex). */
export const AI_INFO = {
  walk: 'Avance droit sur toi et attaque au contact.',
  charge: 'Charge : il s’arrête, un « ! » apparaît, puis il fonce en ligne droite. Écarte-toi sur le côté.',
  fly: 'Vole en ondulant : passe au-dessus de l’eau et des obstacles.',
  spit: 'Crache une boule de poison à distance. Continue de bouger pour l’éviter.',
  ghost: 'Spectre qui flotte et traverse tout.',
  web: 'Lance une toile qui te ralentit fortement pendant 2 secondes.',
  zigzag: 'Fonce en zigzag : les tirs en ligne droite le ratent souvent.',
  swoop: 'Trace une ligne au sol, puis pique dessus. Sors de la ligne.',
  shock: 'Quand tu es tout près, une décharge en cercle s’annonce autour de lui. Recule.',
  explode: 'Vient au contact, clignote… puis explose. Sors du cercle avant la fin !',
  heal: 'Reste derrière la horde et soigne ses alliés. À abattre en priorité.',
  onix: 'Fait pleuvoir des rochers : des cercles apparaissent au sol autour de toi, bouge dès qu’ils s’affichent.',
  snorlax: 'Saute sur toi : un grand cercle annonce l’atterrissage. Sors-en, le choc repousse tout.',
  dashboss: 'Trace un large couloir au sol, puis charge à toute vitesse dessus. Garde un côté libre.',
  mewtwo: 'Garde ses distances, tire des salves en étoile, annonce trois rayons en éventail et se téléporte régulièrement.'
};
export const TRAIT_INFO = {
  flying: 'Vole : passe au-dessus de l’eau.',
  heavy: 'Lourd : presque insensible au recul.',
  blink: 'Se téléporte à côté de toi quand tu t’éloignes.',
  mini: 'Boss intermédiaire : il arrive à 3 min ou à 6 min (bien plus résistant à 6 min).',
  final: 'Boss final : apparaît à 9 min. Le battre fait gagner la partie.'
};

/** Animation jouée par le partenaire quand l'attaque part. */
export const CAST_ANIM = {
  thunder: 'shoot', ember: 'shoot', watergun: 'shoot', quake: 'attack', swift: 'shoot', shadow: 'shoot',
  bloom: 'shoot', bite: 'attack', leafblade: 'attack', doublekick: 'attack', mudbomb: 'shoot',
  seedbomb: 'shoot', machpunch: 'attack', bubble: 'shoot',
  icebeam: 'shoot', sludge: 'shoot', psychic: 'shoot', hurricane: 'shoot', dracometeor: 'shoot',
  spark: 'shoot', thunderwave: 'shoot', electroball: 'shoot', irontail: 'attack', flamethrower: 'shoot', firespin: 'shoot',
  willowisp: 'shoot', surf: 'attack', hydropump: 'shoot', whirlpool: 'shoot', gigadrain: 'shoot',
  rockslide: 'shoot', aerialace: 'attack', bodyslam: 'attack', blizzard: 'shoot', dazzlinggleam: 'shoot',
  nightslash: 'attack', flashcannon: 'shoot', hyperbeam: 'shoot', pinmissile: 'shoot', bonemerang: 'attack'
};

/* ——— Ultime : une attaque surpuissante par type de starter (touche R) ——— */
export const ULTIMATES = {
  Plante: { name: 'Tempête Florale', color: '#7ac74c', desc: 'Des lianes jaillissent sous toute la horde : gros dégâts, ennemis enracinés, et tu récupères un quart de tes PV.' },
  Feu: { name: 'Déflagration', color: '#ff6a1f', desc: 'Une énorme explosion autour de toi, puis un anneau de flammes.' },
  Eau: { name: 'Hydroblast', color: '#3a7bff', desc: 'Un raz-de-marée qui balaie l’écran, repousse tout très loin et te rend invincible un instant.' },
  Électrik: { name: 'Fatal-Foudre', color: '#ffe14a', desc: 'Une pluie d’éclairs sur les ennemis à l’écran, qui restent paralysés.' }
};
export const ultimateOf = (partner) => ULTIMATES[partner?.type] || ULTIMATES.Électrik;

/* ——— Autels : bénédictions au choix ——— */
export const BLESSINGS = [
  { id: 'might', name: 'Autel de la Force', desc: '+15 % de dégâts jusqu’à la fin de la partie.', color: '#ff6a5a' },
  { id: 'wind', name: 'Autel du Vent', desc: '+12 % de vitesse jusqu’à la fin de la partie.', color: '#7fe0ff' },
  { id: 'life', name: 'Autel de la Vie', desc: 'Soin complet et +30 PV max.', color: '#5fd98a' },
  { id: 'wisdom', name: 'Autel du Savoir', desc: 'Tu gagnes un niveau tout de suite.', color: '#b48cff' },
  { id: 'magnet', name: 'Autel de l’Aimant', desc: 'Attire tous les bonbons d’XP de la carte.', color: '#c0c6d6' },
  { id: 'storm', name: 'Autel de l’Orage', desc: 'Ta jauge d’ultime se remplit entièrement.', color: '#ffe14a' },
  { id: 'fortune', name: 'Autel de la Fortune', desc: '+80 Poussière Étoile à la fin de la partie.', color: '#ffd447' }
];

/** Le partenaire peut-il apprendre cette attaque ? (`unlocked` : capacités achetées) */
export const canLearn = (partner, id, unlocked = {}) => {
  const W = WEAPONS[id];
  if (!W || id === partner.weapon) return false;
  if (W.shared) return !W.cost || Boolean(unlocked[id]);
  return (partner.learn || []).includes(W.type);
};
/** L'objet est-il disponible ? */
export const canHold = (id, unlocked = {}) => !PASSIVES[id].cost || Boolean(unlocked[id]);

/** Méga choisie (Dracaufeu X ou Y) ou unique. */
export const megaOf = (partner, choice) => {
  if (!partner?.mega) return null;
  if (!partner.mega.choices) return partner.mega;
  return partner.mega.choices.find((c) => c.id === choice) || null;
};

export const spriteOf = (dex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

/** XP pour passer du niveau `lv` au suivant. */
export const xpToNext = (lv) => Math.round(5 + lv * 4 + lv * lv * 0.35);
