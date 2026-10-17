/**
 * Campagne « Route de la Ligue » : 3 chapitres × 8 étages, avec des choix de chemin.
 * Types d’étapes : combat, élite, boss, Poké Mart, Centre Pokémon, événement.
 * Les dresseurs adverses ont un thème de types et une équipe calibrée sur l’étage.
 */
import {
  BOARD_CAP,
  COMPONENTS,
  CONSUMABLES,
  CRAFTED,
  ITEM_MAP,
  LINES,
  LINE_MAP,
  PLATES,
  rollCost,
  unitFromLine
} from './pokeArenaData';

export const FLOORS_PER_CHAPTER = 8;

export const CHAPTERS = [
  {
    id: 1,
    name: 'Forêt de Jade',
    blurb: 'Sous-bois, ruisseaux et premiers duels.',
    biome: 'forest',
    boss: { name: 'Pierre', title: 'Champion d’Argenta', types: ['Roche', 'Sol'], ace: 'onix' }
  },
  {
    id: 2,
    name: 'Monts Brumeux',
    blurb: 'Grottes, cols venteux et dresseurs aguerris.',
    biome: 'mountain',
    boss: { name: 'Morgane', title: 'Championne de Safrania', types: ['Psy', 'Spectre'], ace: 'abra' }
  },
  {
    id: 3,
    name: 'Plateau Indigo',
    blurb: 'La Ligue. Le Maître attend au sommet.',
    biome: 'league',
    boss: { name: 'Peter', title: 'Maître de la Ligue', types: ['Dragon', 'Vol'], ace: 'dratini' }
  }
];

export const TOTAL_FLOORS = CHAPTERS.length * FLOORS_PER_CHAPTER;

export const NODE_INFO = {
  combat: { label: 'Combat', icon: '⚔️', hint: 'Un dresseur te défie.' },
  elite: { label: 'Élite', icon: '💀', hint: 'Plus dur, mais butin garanti.' },
  boss: { label: 'Champion', icon: '👑', hint: 'Il faut le battre pour avancer.' },
  mart: { label: 'Poké Mart', icon: '🏪', hint: 'Achète objets, plaques et bonbons.' },
  center: { label: 'Centre Pokémon', icon: '❤️', hint: 'Soigne 20 PV de dresseur.' },
  event: { label: 'Événement', icon: '❓', hint: 'Une surprise : choisis une récompense.' }
};

export const isFightKind = (kind) => kind === 'combat' || kind === 'elite' || kind === 'boss';

/** Gabarit d’un chapitre : options proposées à chaque étage. */
const chapterPattern = (chapter) => [
  ['combat'],
  ['combat', 'combat'],
  ['combat', 'elite'],
  ['mart'],
  ['combat', 'elite'],
  ['combat', 'event'],
  chapter === 1 ? ['mart', 'event'] : ['mart', 'center'],
  ['boss']
];

const TRAINER_CLASSES = [
  { cls: 'Gamin', types: ['Normal'] },
  { cls: 'Scout', types: ['Insecte'] },
  { cls: 'Pêcheur', types: ['Eau'] },
  { cls: 'Montagnard', types: ['Roche', 'Sol'] },
  { cls: 'Karatéka', types: ['Combat'] },
  { cls: 'Médium', types: ['Psy'] },
  { cls: 'Exorciste', types: ['Spectre'] },
  { cls: 'Pyromane', types: ['Feu'] },
  { cls: 'Jardinière', types: ['Plante'] },
  { cls: 'Rockeur', types: ['Électrik'] },
  { cls: 'Skieuse', types: ['Glace'] },
  { cls: 'Motard', types: ['Poison', 'Ténèbres'] },
  { cls: 'Ornithologue', types: ['Vol'] },
  { cls: 'Ouvrier', types: ['Acier'] },
  { cls: 'Canon', types: ['Fée'] },
  { cls: 'Nageuse', types: ['Eau', 'Glace'] },
  { cls: 'Randonneur', types: ['Sol', 'Combat'] },
  { cls: 'Dracologue', types: ['Dragon'], minChapter: 2 },
  { cls: 'Sbire Rocket', types: ['Poison', 'Ténèbres', 'Normal'] }
];

const FIRST_NAMES = [
  'Léo', 'Inès', 'Hugo', 'Jade', 'Noé', 'Lina', 'Malo', 'Rose', 'Timéo', 'Zoé', 'Axel', 'Lou',
  'Sacha', 'Iris', 'Nolan', 'Manon', 'Gaspard', 'Alix', 'Robin', 'Maëlle', 'Basile', 'Nina', 'Oscar', 'Clara'
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const makeTrainer = (kind, chapter, avoidTypes = []) => {
  if (kind === 'boss') {
    const boss = CHAPTERS[chapter - 1].boss;
    return { name: boss.name, title: boss.title, types: boss.types, ace: boss.ace };
  }
  if (kind === 'elite') {
    const a = pick(TRAINER_CLASSES.filter((c) => !c.minChapter || c.minChapter <= chapter));
    const b = pick(TRAINER_CLASSES.filter((c) => c !== a && (!c.minChapter || c.minChapter <= chapter)));
    const types = [...new Set([a.types[0], b.types[0]])];
    return { name: pick(FIRST_NAMES), title: Math.random() < 0.5 ? 'Topdresseur' : 'Topdresseuse', types };
  }
  const pool = TRAINER_CLASSES.filter((c) => (!c.minChapter || c.minChapter <= chapter)
    && !c.types.some((t) => avoidTypes.includes(t)));
  const c = pick(pool.length ? pool : TRAINER_CLASSES);
  return { name: pick(FIRST_NAMES), title: c.cls, types: c.types };
};

/** Génère la carte complète d’une run. */
export const generateMap = () => {
  const floors = [];
  CHAPTERS.forEach((ch) => {
    chapterPattern(ch.id).forEach((kinds, i) => {
      const floor = floors.length;
      const used = [];
      const nodes = kinds.map((kind, k) => {
        const node = { id: `${floor}-${k}`, floor, chapter: ch.id, kind };
        if (isFightKind(kind)) {
          node.trainer = makeTrainer(kind, ch.id, used);
          used.push(...node.trainer.types);
        }
        return node;
      });
      floors.push({ floor, chapter: ch.id, step: i, nodes });
    });
  });
  return floors;
};

export const chapterOf = (floor) => Math.min(CHAPTERS.length, Math.floor(floor / FLOORS_PER_CHAPTER) + 1);

/* ——————————————————————— Équipes adverses ——————————————————————— */

/** Niveau de dresseur attendu à chaque étage (sert à choisir coûts et taille d’équipe). */
const EXPECT_LEVEL = [1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8];

/** Taille d’équipe de base par étage. */
const TEAM_SIZE = [2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 9];

/**
 * Total d’étoiles de l’équipe adverse par étage (combat normal).
 * Les élites ont +1,5 étoile et +1 Pokémon ; les champions sont déjà comptés (étages 7, 15, 23).
 * Réglé par simulation de runs complètes (bot joueur) : voir le README du mode.
 */
const STAR_BUDGET = [2, 3, 4, 4, 5.5, 6, 6.5, 7.5, 8, 8.5, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14, 14.5, 15, 15.5];

/** Puissance des ennemis par étage (multiplie PV et ATK). */
export const DIFFICULTY = [
  0.86, 0.88, 0.9, 0.9, 0.92, 0.92, 0.94, 0.94,
  0.94, 0.95, 0.96, 0.96, 0.97, 0.98, 0.98, 1.0,
  0.98, 1.0, 1.0, 1.02, 1.02, 1.04, 1.04, 1.06
];
export const KIND_SCALE = { combat: 1, elite: 1.0, boss: 0.94 };

const lineTypes = (line) => {
  const set = new Set();
  line.stages.forEach((st) => (st.types || [st.type]).forEach((t) => set.add(t)));
  (line.forms || []).forEach((f) => f.stages.forEach((st) => (st.types || [st.type]).forEach((t) => set.add(t))));
  return set;
};
const LINE_TYPES = Object.fromEntries(LINES.map((l) => [l.id, lineTypes(l)]));

const themedPool = (types, cost) => {
  const byCost = LINES.filter((l) => l.cost === cost);
  const themed = byCost.filter((l) => types.some((t) => LINE_TYPES[l.id].has(t)));
  return themed.length ? themed : byCost;
};

/** Répartit un budget d’étoiles sur l’équipe (3★ seulement en fin de partie). */
const spreadStars = (size, budget, floor) => {
  const stars = Array(size).fill(1);
  let extra = budget - size;
  if (extra % 1) extra = Math.floor(extra) + (Math.random() < extra % 1 ? 1 : 0);
  const max = floor >= 14 ? 3 : 2;
  let guard = 0;
  while (extra > 0 && guard < 200) {
    guard += 1;
    const i = Math.floor(Math.random() * size);
    if (stars[i] < max) {
      stars[i] += 1;
      extra -= 1;
    }
    if (stars.every((st) => st >= max)) break;
  }
  return stars.sort((x, y) => y - x);
};

const itemCount = (floor, kind) => {
  if (kind === 'boss') return chapterOf(floor);
  if (kind === 'elite') return floor >= 12 ? 2 : 1;
  if (floor >= 18) return Math.random() < 0.7 ? 2 : 1;
  if (floor >= 9) return Math.random() < 0.6 ? 1 : 0;
  return 0;
};

/** Construit l’équipe d’un dresseur pour un nœud de combat. */
export const enemyTeam = (node) => {
  const { floor, kind } = node;
  const trainer = node.trainer || { types: [] };
  const level = EXPECT_LEVEL[floor] || 8;
  const size = clamp((TEAM_SIZE[floor] || 9) + (kind === 'elite' ? 1 : 0), 2, 10);
  const scale = (DIFFICULTY[floor] || 1.15) * (KIND_SCALE[kind] || 1);
  const picks = [];
  if (kind === 'boss' && trainer.ace && LINE_MAP[trainer.ace]) picks.push(trainer.ace);
  while (picks.length < size) {
    let cost = rollCost(level);
    if (floor < 2) cost = 1;
    const pool = themedPool(trainer.types, cost).filter((l) => !picks.includes(l.id));
    const line = pick(pool.length ? pool : LINES);
    picks.push(line.id);
  }
  let items = itemCount(floor, kind);
  const budget = (STAR_BUDGET[floor] || 18) + (kind === 'elite' ? 1 : 0);
  // Les meilleures étoiles vont aux lignées les moins chères (comme un vrai joueur).
  const order = picks.map((id, i) => ({ id, i, cost: LINE_MAP[id].cost }))
    .sort((a, b) => (kind === 'boss' && a.i === 0 ? -1 : kind === 'boss' && b.i === 0 ? 1 : a.cost - b.cost));
  const stars = spreadStars(picks.length, budget, floor);
  const starOf = {};
  order.forEach((o, k) => { starOf[o.i] = stars[k]; });
  const foes = picks.map((lineId, i) => {
    const unit = unitFromLine(lineId, starOf[i] || 1, `foe-${node.id}-${i}`, [], null, true);
    return { ...unit, scale };
  });
  // Les objets vont aux plus forts (coût × étoiles).
  foes
    .slice()
    .sort((a, b) => b.cost * b.star - a.cost * a.star)
    .forEach((u) => {
      if (items <= 0) return;
      u.items = [pick(CRAFTED).id];
      items -= 1;
    });
  return foes;
};

/* ——————————————————————— Récompenses, boutique, événements ——————————————————————— */

export const PRICES = { component: 3, crafted: 7, plate: 5, magnet: 2, rarecandy: 7, expshare: 5, revive: 4, amuletcoin: 8 };

export const priceOf = (itemId) => {
  const item = ITEM_MAP[itemId];
  if (!item) return 99;
  if (item.component) return PRICES.component;
  if (item.plate) return PRICES.plate;
  if (PRICES[itemId] != null) return PRICES[itemId];
  return PRICES.crafted;
};

/** Stock du Poké Mart : 7 emplacements. */
export const martStock = (floor) => {
  const comps = shuffle(COMPONENTS);
  const consumables = CONSUMABLES.filter((c) => c.id !== 'amuletcoin' || floor < 16);
  const slots = [
    comps[0].id,
    comps[1].id,
    comps[2].id,
    pick(CRAFTED).id,
    pick(CRAFTED).id,
    pick(PLATES).id,
    pick(consumables).id
  ];
  return slots.map((id, i) => ({ key: `${floor}-${i}-${id}`, itemId: id, price: priceOf(id), sold: false }));
};

/** Butin d’un combat gagné. */
export const fightLoot = (node) => {
  const loot = [];
  if (node.kind === 'elite') {
    loot.push(pick(COMPONENTS).id);
    if (Math.random() < 0.45) loot.push(pick(COMPONENTS).id);
  } else if (node.kind === 'combat') {
    if (Math.random() < 0.35) loot.push(pick(COMPONENTS).id);
  }
  return loot;
};

/** Récompense de champion : 3 objets au choix. */
export const bossChoices = () => {
  const crafted = shuffle(CRAFTED).slice(0, 2).map((i) => i.id);
  return [...crafted, pick(PLATES).id];
};

export const EVENT_POOL = [
  { id: 'gold', title: 'Bourse oubliée', text: 'Un portefeuille traîne dans les hautes herbes.' },
  { id: 'item', title: 'Ramasseur', text: 'Un Zigzaton te rapporte une vitamine.' },
  { id: 'xp', title: 'Professeur', text: 'Une leçon express sur les types.' },
  { id: 'unit', title: 'Œuf mystère', text: 'La Pension te confie un Pokémon.' },
  { id: 'plate', title: 'Ruines anciennes', text: 'Une plaque gravée scintille.' },
  { id: 'heal', title: 'Source chaude', text: 'Ton équipe reprend des forces.' }
];

/** 3 options d’événement (l’œuf mystère pioche dans le catalogue de la run). */
export const eventOptions = (floor, runPool = []) => {
  const chapter = chapterOf(floor);
  const opts = shuffle(EVENT_POOL).slice(0, 3);
  return opts.map((o) => {
    if (o.id === 'gold') return { ...o, amount: 5 + chapter * 2, label: `+${5 + chapter * 2} or` };
    if (o.id === 'item') {
      const it = pick(COMPONENTS);
      return { ...o, itemId: it.id, label: it.name };
    }
    if (o.id === 'xp') return { ...o, amount: 6, label: '+6 XP' };
    if (o.id === 'unit') {
      const pool = (runPool.length ? runPool : LINES).filter((l) => l.cost <= chapter + 1);
      const line = pick(pool.length ? pool : LINES);
      const star = chapter >= 3 ? 2 : 1;
      return { ...o, lineId: line.id, star, label: `${unitFromLine(line.id, star)?.name || line.id} ${'★'.repeat(star)}` };
    }
    if (o.id === 'plate') {
      const pl = pick(PLATES);
      return { ...o, itemId: pl.id, label: pl.name };
    }
    return { ...o, amount: 12, label: '+12 PV de dresseur' };
  });
};

export const CENTER_HEAL = 20;

/** PV de dresseur perdus après une défaite. */
export const lossDamage = (node, result) => {
  const base = 2 + Math.floor(node.floor / 4);
  const dmg = base + (result?.damage || 0);
  const mult = node.kind === 'boss' ? 1.5 : node.kind === 'elite' ? 1.2 : 1;
  return Math.max(2, Math.round(dmg * mult));
};

export const boardCapFor = (level) => BOARD_CAP[Math.min(9, level)] || 2;
