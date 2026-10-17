/**
 * Campagne « Route de la Ligue » : 3 régions tirées au hasard + la Ligue, 8 étages chacune.
 * Chaque run a ses propres lieux, Champions d’Arène, Conseil 4, Maître, rival et méchants.
 * Types d’étapes : combat, élite, rival, méchant, boss, Poké Mart, Centre Pokémon, événement.
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
  STARTER_LINES,
  rollCost,
  unitFromLine
} from './pokeArenaData';
import {
  BIOMES,
  CHAMPIONS,
  CLASSES,
  ELITE_CLASSES,
  ELITE_FOUR,
  LEADERS,
  LEAGUE_BIOME,
  NAMES_F,
  NAMES_M,
  RIVALS,
  VILLAINS,
  trainerSprite
} from './pokeArenaTrainers';

export { trainerSprite };

export const FLOORS_PER_CHAPTER = 8;
export const CHAPTER_COUNT = 4;
export const TOTAL_FLOORS = CHAPTER_COUNT * FLOORS_PER_CHAPTER;

/** Anciennes sauvegardes (avant les régions aléatoires). */
const LEGACY_CHAPTERS = [
  { id: 1, name: 'Forêt de Jade', blurb: 'Sous-bois, ruisseaux et premiers duels.', biome: 'prairie', scene: 'prairie' },
  { id: 2, name: 'Monts Brumeux', blurb: 'Grottes, cols venteux et dresseurs aguerris.', biome: 'montagne', scene: 'montagne' },
  { id: 3, name: 'Plateau Indigo', blurb: 'La Ligue. Le Maître attend au sommet.', biome: 'ligue', scene: 'ligue' }
];

export const NODE_INFO = {
  combat: { label: 'Combat', icon: '⚔️', hint: 'Un dresseur te défie.' },
  elite: { label: 'Élite', icon: '💀', hint: 'Plus dur, mais butin garanti.' },
  rival: { label: 'Rival', icon: '⚡', hint: 'Ton rival. Il a choisi le starter qui bat le tien. Victoire : un objet au choix.' },
  villain: { label: 'Méchants', icon: '☠️', hint: 'Le chef d’une équipe de méchants. Très dur, gros butin.' },
  boss: { label: 'Champion', icon: '👑', hint: 'Il faut le battre pour avancer.' },
  mart: { label: 'Poké Mart', icon: '🏪', hint: 'Achète objets, plaques et bonbons.' },
  center: { label: 'Centre Pokémon', icon: '❤️', hint: 'Soigne 20 PV de dresseur.' },
  event: { label: 'Événement', icon: '❓', hint: 'Une surprise : choisis une récompense.' }
};

export const isFightKind = (kind) => kind === 'combat' || kind === 'elite' || kind === 'boss' || kind === 'rival' || kind === 'villain';
/** Combats qui donnent un objet au choix après la victoire. */
export const hasRewardChoice = (kind) => kind === 'boss' || kind === 'rival' || kind === 'villain';

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Gabarit d’un chapitre : options proposées à chaque étage. */
const chapterPattern = (chapter) => {
  if (chapter === CHAPTER_COUNT) {
    return [
      ['rival'],
      ['mart', 'center'],
      ['boss'],
      ['boss'],
      ['mart', 'center', 'event'],
      ['boss'],
      ['boss'],
      ['boss']
    ];
  }
  return [
    chapter === 1 ? ['combat'] : ['combat', 'event'],
    ['combat', 'combat'],
    ['combat', 'elite'],
    chapter === 1 ? ['mart'] : ['mart', 'event'],
    ['rival', 'combat'],
    chapter === 3 ? ['villain', 'combat'] : ['combat', 'event'],
    chapter === 1 ? ['mart', 'event'] : ['mart', 'center'],
    ['boss']
  ];
};

/* ——————————————————————— Tirage des dresseurs ——————————————————————— */

const SUPER = { Feu: 'Plante', Eau: 'Feu', Plante: 'Eau' };
const baseType = (lineId) => {
  const st = LINE_MAP[lineId]?.stages?.[0];
  return st ? (st.types || [st.type])[0] : null;
};

/** Le rival prend le starter qui bat celui du joueur (sinon un autre starter). */
const rivalAce = (starterId, trio = []) => {
  const mine = baseType(starterId);
  const others = (trio.length ? trio : STARTER_LINES.map((l) => l.id)).filter((id) => id !== starterId && LINE_MAP[id]);
  const counter = others.find((id) => SUPER[baseType(id)] === mine);
  if (counter) return counter;
  if (others.length) return pick(others);
  return pick(STARTER_LINES).id;
};

/** Sac de prénoms sans doublon pour toute la run. */
const nameBag = () => {
  const bags = { m: shuffle(NAMES_M), f: shuffle(NAMES_F) };
  return (f) => {
    const key = f ? 'f' : 'm';
    if (!bags[key].length) bags[key] = shuffle(f ? NAMES_F : NAMES_M);
    return bags[key].pop();
  };
};

const leaderTrainer = (l, title) => ({
  name: l.name,
  title,
  region: l.region,
  types: l.types,
  ace: l.ace,
  sprite: l.sprite,
  f: !!l.f
});

/**
 * Tire tout le casting d’une run : 3 régions, 3 Champions d’Arène (un par région),
 * un Conseil 4, un Maître, un rival et une équipe de méchants.
 */
export const rollCast = (starterId, trio = []) => {
  const biomes = shuffle(BIOMES).slice(0, CHAPTER_COUNT - 1);
  const used = new Set();
  const leaders = biomes.map((b) => {
    const pool = LEADERS.filter((l) => l.biomes.includes(b.id) && !used.has(l.name));
    const l = pick(pool.length ? pool : LEADERS.filter((x) => !used.has(x.name)));
    used.add(l.name);
    return l;
  });
  const rival = pick(RIVALS);
  used.add(rival.name);
  // Conseil 4 : 4 membres aux types variés
  const e4 = [];
  shuffle(ELITE_FOUR).forEach((m) => {
    if (e4.length >= 4 || used.has(m.name)) return;
    if (e4.some((o) => o.types[0] === m.types[0])) return;
    e4.push(m);
    used.add(m.name);
  });
  shuffle(ELITE_FOUR).forEach((m) => {
    if (e4.length < 4 && !used.has(m.name)) {
      e4.push(m);
      used.add(m.name);
    }
  });
  const champion = pick(CHAMPIONS.filter((c) => !used.has(c.name)));
  const villain = pick(VILLAINS);
  const regions = [...biomes, LEAGUE_BIOME].map((b, i) => ({
    id: i + 1,
    biome: b.id,
    scene: b.scene,
    name: pick(b.names),
    blurb: pick(b.blurbs)
  }));
  return {
    regions,
    biomes: [...biomes, LEAGUE_BIOME],
    leaders,
    e4,
    champion,
    rival: {
      ...rival,
      ace: rivalAce(starterId, trio),
      extra: shuffle(['Vol', 'Normal', 'Électrik', 'Ténèbres', 'Combat', 'Psy', 'Dragon', 'Acier', 'Fée', 'Sol']).slice(0, 3)
    },
    villain
  };
};

const classTrainer = (id, nextName) => {
  const c = CLASSES[id];
  return { name: nextName(c.f), title: c.cls, types: c.types, sprite: c.sprite, f: !!c.f };
};

const makeTrainer = (kind, ctx, avoidTypes = []) => {
  const { chapter, step, cast, nextName } = ctx;
  const biome = cast.biomes[chapter - 1];
  if (kind === 'boss') {
    if (chapter < CHAPTER_COUNT) {
      const l = cast.leaders[chapter - 1];
      return { ...leaderTrainer(l, l.f ? 'Championne d’Arène' : 'Champion d’Arène'), role: 'gym', badge: chapter };
    }
    if (step === FLOORS_PER_CHAPTER - 1) {
      return { ...leaderTrainer(cast.champion, cast.champion.f ? 'Maîtresse de la Ligue' : 'Maître de la Ligue'), role: 'champion' };
    }
    const order = [2, 3, 5, 6].indexOf(step);
    const m = cast.e4[Math.max(0, order)];
    return { ...leaderTrainer(m, 'Conseil 4'), role: 'e4', seat: order + 1 };
  }
  if (kind === 'rival') {
    const r = cast.rival;
    const aceTypes = (LINE_MAP[r.ace]?.stages?.[0]?.types) || [LINE_MAP[r.ace]?.stages?.[0]?.type].filter(Boolean);
    const extra = (r.extra || []).slice(0, chapter >= 4 ? 3 : chapter >= 2 ? 2 : 1);
    return {
      name: r.name, title: 'Rival', types: [...new Set([...aceTypes, ...extra])], ace: r.ace, sprite: r.sprite, f: !!r.f, role: 'rival', meet: chapter
    };
  }
  if (kind === 'villain') {
    const v = cast.villain;
    return { ...leaderTrainer(v.boss, `Chef de la ${v.team}`), role: 'villain', team: v.team };
  }
  // Sbires de l’équipe de méchants, parfois, à partir du 2e chapitre
  if (kind === 'combat' && chapter >= 2 && chapter < CHAPTER_COUNT && Math.random() < 0.18) {
    const v = cast.villain;
    const f = Math.random() < 0.5;
    return {
      name: nextName(f), title: `Sbire ${v.team.replace('Team ', '')}`, types: v.boss.types.slice(0, 2), sprite: v.grunt[f ? 1 : 0], f, team: v.team
    };
  }
  if (kind === 'elite') {
    const c = CLASSES[pick(ELITE_CLASSES)];
    const pool = biome.classes.map((id) => CLASSES[id]).filter((x) => !x.elite && x.types.length && (!x.minChapter || x.minChapter <= chapter));
    const a = pick(pool);
    const b = pick(pool.filter((x) => x !== a)) || a;
    const types = [...new Set([a.types[0], b.types[0]])];
    return { name: nextName(c.f), title: c.cls, types, sprite: c.sprite, f: !!c.f };
  }
  const ok = (id) => !CLASSES[id].elite && (!CLASSES[id].minChapter || CLASSES[id].minChapter <= chapter);
  const fresh = (id) => ok(id) && !CLASSES[id].types.some((t) => avoidTypes.includes(t)) && !ctx.recent.includes(id);
  const ids = biome.classes.filter(fresh);
  const id = pick(ids.length ? ids : biome.classes.filter(ok));
  ctx.recent.push(id);
  if (ctx.recent.length > 3) ctx.recent.shift();
  return classTrainer(id, nextName);
};

/** Génère la carte complète d’une run (régions et dresseurs tirés au hasard). */
export const generateMap = (starterId = null, trio = []) => {
  const cast = rollCast(starterId, trio);
  const nextName = nameBag();
  const recent = [];
  const floors = [];
  cast.regions.forEach((region) => {
    chapterPattern(region.id).forEach((kinds, step) => {
      const floor = floors.length;
      const used = [];
      const nodes = kinds.map((kind, k) => {
        const node = { id: `${floor}-${k}`, floor, chapter: region.id, kind };
        if (isFightKind(kind)) {
          node.trainer = makeTrainer(kind, { chapter: region.id, step, cast, nextName, recent }, used);
          used.push(...node.trainer.types);
        }
        return node;
      });
      floors.push({ floor, chapter: region.id, step, region, nodes });
    });
  });
  return floors;
};

/** Régions d’une carte (avec repli pour les anciennes sauvegardes). */
export const regionsOf = (map = []) => {
  const out = [];
  map.forEach((f) => {
    if (out.some((r) => r.id === f.chapter)) return;
    out.push(f.region || LEGACY_CHAPTERS[f.chapter - 1] || { id: f.chapter, name: `Chapitre ${f.chapter}`, blurb: '', biome: 'prairie', scene: 'prairie' });
  });
  return out;
};

export const regionAt = (map = [], floor = 0) => {
  const f = map[Math.min(map.length - 1, Math.max(0, floor))];
  if (!f) return null;
  return f.region || LEGACY_CHAPTERS[f.chapter - 1] || null;
};

/** Dernier boss de la carte (Maître de la Ligue). */
export const finalBoss = (map = []) => {
  const last = map[map.length - 1];
  return last?.nodes?.find((n) => n.kind === 'boss')?.trainer || null;
};

export const chapterOf = (floor) => Math.min(CHAPTER_COUNT, Math.floor(floor / FLOORS_PER_CHAPTER) + 1);

/* ——————————————————————— Équipes adverses ——————————————————————— */

/** Niveau de dresseur attendu à chaque étage (sert à choisir coûts et taille d’équipe). */
const EXPECT_LEVEL = [1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9];

/** Taille d’équipe de base par étage. */
const TEAM_SIZE = [2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 10, 10, 10];

/**
 * Total d’étoiles de l’équipe adverse par étage (combat normal).
 * Élites, rivaux et méchants ont +1 Pokémon et des étoiles en plus ; les boss sont déjà comptés
 * (Arènes aux étages 8, 16, 24 ; Conseil 4 aux étages 27, 28, 30, 31 ; Maître au 32).
 * Réglé par simulation de runs complètes (bot joueur) : voir le README du mode.
 */
const STAR_BUDGET = [2, 3, 4, 4.5, 6, 6.5, 7, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12,
  12.2, 12.4, 12.6, 13, 13.4, 13.8, 14.2, 15, 15.4, 15.8, 16, 16.5, 17, 17.5, 18, 19];

/** Puissance des ennemis par étage (multiplie PV et ATK). */
export const DIFFICULTY = [
  0.86, 0.88, 0.9, 0.91, 0.93, 0.94, 0.95, 0.95,
  0.96, 0.96, 0.97, 0.97, 0.98, 0.98, 0.99, 0.98,
  0.96, 0.96, 0.97, 0.97, 0.98, 0.98, 0.99, 0.99,
  1.0, 1.0, 1.01, 1.02, 1.02, 1.03, 1.04, 1.06
];
export const KIND_SCALE = { combat: 1, elite: 1.0, rival: 0.95, villain: 0.96, boss: 0.9 };
const EXTRA_UNITS = { elite: 1, rival: 0, villain: 1 };
const EXTRA_STARS = { elite: 1, rival: 0, villain: 0.5 };

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
  if (kind === 'boss') return Math.min(4, chapterOf(floor) + (floor >= 26 ? 1 : 0));
  if (kind === 'villain') return 3;
  if (kind === 'elite' || kind === 'rival') return floor >= 10 ? 2 : 1;
  if (floor >= 16) return Math.random() < 0.6 ? 2 : 1;
  if (floor >= 8) return Math.random() < 0.7 ? 1 : 0;
  if (floor >= 4) return Math.random() < 0.5 ? 1 : 0;
  return 0;
};

/** Construit l’équipe d’un dresseur pour un nœud de combat. */
export const enemyTeam = (node) => {
  const { floor, kind } = node;
  const trainer = node.trainer || { types: [] };
  const level = EXPECT_LEVEL[floor] || 8;
  const size = clamp((TEAM_SIZE[floor] || 10) + (EXTRA_UNITS[kind] || 0), 2, 10);
  const scale = (DIFFICULTY[floor] || 1.15) * (KIND_SCALE[kind] || 1);
  const picks = [];
  const aced = kind !== 'combat' && kind !== 'elite' && trainer.ace && LINE_MAP[trainer.ace];
  if (aced) picks.push(trainer.ace);
  while (picks.length < size) {
    let cost = rollCost(level);
    if (floor < 2) cost = 1;
    const pool = themedPool(trainer.types, cost).filter((l) => !picks.includes(l.id));
    const line = pick(pool.length ? pool : LINES);
    picks.push(line.id);
  }
  let items = itemCount(floor, kind);
  const budget = (STAR_BUDGET[floor] || 21) + (EXTRA_STARS[kind] || 0);
  // Les meilleures étoiles vont aux lignées les moins chères (comme un vrai joueur).
  const order = picks.map((id, i) => ({ id, i, cost: LINE_MAP[id].cost }))
    .sort((a, b) => (aced && a.i === 0 ? -1 : aced && b.i === 0 ? 1 : a.cost - b.cost));
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

export const PRICES = { keystone: 10, component: 3, crafted: 7, plate: 5, magnet: 2, rarecandy: 7, expshare: 5, revive: 4, amuletcoin: 8 };

export const priceOf = (itemId) => {
  const item = ITEM_MAP[itemId];
  if (!item) return 99;
  if (PRICES[itemId] != null && item.rare) return PRICES[itemId];
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
  // À partir du 2e chapitre, une Pierre Clé est parfois en vente (chère).
  if (floor >= FLOORS_PER_CHAPTER && Math.random() < 0.3) slots[2] = 'keystone';
  return slots.map((id, i) => ({ key: `${floor}-${i}-${id}`, itemId: id, price: priceOf(id), sold: false }));
};

/** Butin d’un combat gagné. */
export const fightLoot = (node) => {
  const loot = [];
  if (node.kind === 'elite') {
    loot.push(pick(COMPONENTS).id);
    if (Math.random() < 0.45) loot.push(pick(COMPONENTS).id);
    if (Math.random() < 0.18) loot.push('keystone');
  } else if (node.kind === 'rival' || node.kind === 'villain') {
    loot.push(pick(COMPONENTS).id);
  } else if (node.kind === 'combat') {
    if (Math.random() < 0.35) loot.push(pick(COMPONENTS).id);
  }
  return loot;
};

/** Récompense après un rival ou un chef de méchants : 3 objets au choix. */
export const rewardChoices = (node) => {
  if (node?.kind === 'rival') return shuffle(CRAFTED).slice(0, 3).map((i) => i.id);
  return bossChoices();
};

/** Récompense de champion : 3 objets au choix. */
export const bossChoices = () => {
  const crafted = shuffle(CRAFTED).slice(0, 2).map((i) => i.id);
  // Le coffre de champion propose toujours une Pierre Clé, au prix d’un objet fini.
  return [...crafted, 'keystone'];
};

export const EVENT_POOL = [
  { id: 'gold', title: 'Bourse oubliée', text: 'Un portefeuille traîne dans les hautes herbes.' },
  { id: 'item', title: 'Ramasseur', text: 'Un Zigzaton te rapporte une vitamine.' },
  { id: 'xp', title: 'Professeur', text: 'Une leçon express sur les types.' },
  { id: 'unit', title: 'Œuf mystère', text: 'La Pension te confie un Pokémon.' },
  { id: 'plate', title: 'Ruines anciennes', text: 'Une plaque gravée scintille.' },
  { id: 'heal', title: 'Source chaude', text: 'Ton équipe reprend des forces.' },
  { id: 'candy', title: 'Sac abandonné', text: 'Un objet utile dépasse d’un sac à dos.' },
  { id: 'tutor', title: 'Dojo caché', text: 'Un maître entraîne ton équipe.' },
  { id: 'trade', title: 'Échange', text: 'Un collectionneur propose un Pokémon rare contre de l’or.' }
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
    if (o.id === 'candy') {
      const it = pick(CONSUMABLES.filter((c) => c.id !== 'amuletcoin' || floor < 16));
      return { ...o, effect: 'item', itemId: it.id, label: it.name };
    }
    if (o.id === 'tutor') return { ...o, effect: 'xp', amount: 4 + chapter * 2, label: `+${4 + chapter * 2} XP` };
    if (o.id === 'trade') {
      const pool = (runPool.length ? runPool : LINES).filter((l) => l.cost >= 3 && l.cost <= Math.min(5, chapter + 2));
      const line = pick(pool.length ? pool : LINES);
      const price = 3 + line.cost * 2;
      return { ...o, effect: 'unit', cost: price, lineId: line.id, star: 1, label: `${unitFromLine(line.id, 1)?.name || line.id} contre ${price} or` };
    }
    return { ...o, amount: 12, label: '+12 PV de dresseur' };
  });
};

export const CENTER_HEAL = 20;

/** PV de dresseur perdus après une défaite. */
export const lossDamage = (node, result) => {
  const base = 2 + Math.floor(Math.min(node.floor, 24) / 4);
  const dmg = base + (result?.damage || 0);
  const mult = node.kind === 'boss' ? 1.5 : node.kind === 'villain' ? 1.3 : node.kind === 'elite' || node.kind === 'rival' ? 1.2 : 1;
  return Math.max(2, Math.round(dmg * mult));
};

export const boardCapFor = (level) => BOARD_CAP[Math.min(9, level)] || 2;
