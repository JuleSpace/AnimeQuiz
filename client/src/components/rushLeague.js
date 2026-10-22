/**
 * Poké Rush — la Ligue : les 79 familles de la 1re génération jouables comme partenaire.
 * Chaque famille se débloque en deux temps : un défi (statistiques cumulées entre les parties),
 * puis il faut la capturer quand elle apparaît à l'état sauvage pendant une partie.
 */
import { FOES, GEN_POOLS, PARTNERS, WEAPONS, buildRoster } from './swarmData';
import { FOE_TYPES, MOVE_KIND, TYPE_COLORS, saveRush } from './rushData';
import { GEN1_NAMES, GEN1_STATS, GEN1_TYPES, LEAGUE_DATA } from './rushLeagueData';

export { GEN1_NAMES, GEN1_TYPES };

/* ——— Classes (selon l'attaque de départ) ——— */
const CLASS_OF_KIND = {
  chain: 'Foudroyeur', blast: 'Artilleur', lob: 'Artilleur', puddle: 'Alchimiste', pierce: 'Tireur', boomerang: 'Tireur', orbit: 'Gardien',
  nova: 'Onde de choc', homing: 'Traqueur', bubble: 'Traqueur', beam: 'Canonnier', psychic: 'Mentaliste', tornado: 'Tempête', meteor: 'Invocateur',
  dash: 'Colosse', radial: 'Tireur', claws: 'Bagarreur', cone: 'Souffleur', stun: 'Entraveur', firering: 'Gardien', bloom: 'Soigneur', trail: 'Coureur', drain: 'Vampire'
};
export const classOf = (weaponId) => CLASS_OF_KIND[MOVE_KIND[weaponId]] || 'Explorateur';

/* ——— Ultimes : un par type ——— */
export const ULTS = {
  Plante: { kind: 'bloom', name: 'Tempête Florale', color: '#7ac74c', desc: 'Des lianes jaillissent sous la horde, l’enracinent, et te soignent d’un quart de tes PV.' },
  Fée: { kind: 'bloom', name: 'Pouvoir Lunaire', color: '#ff9ad8', desc: 'Une lune rose apaise la horde : les ennemis sont charmés et tu récupères des PV.' },
  Insecte: { kind: 'bloom', name: 'Nuée Furieuse', color: '#a6b91a', desc: 'Une nuée s’abat autour de toi : gros dégâts sur la durée et ennemis ralentis.' },
  Feu: { kind: 'nova', name: 'Déflagration', color: '#ff6a1f', desc: 'Une énorme explosion autour de toi, puis un anneau de flammes.' },
  Combat: { kind: 'nova', name: 'Close Combat', color: '#d2513f', desc: 'Une rafale de coups qui projette tout ce qui t’entoure.' },
  Normal: { kind: 'nova', name: 'Ultralaser', color: '#ffe680', desc: 'Une onde d’énergie pure qui balaie tout autour de toi.' },
  Dragon: { kind: 'nova', name: 'Colère du Dragon', color: '#8a5aff', desc: 'Une explosion draconique : énormes dégâts et recul massif.' },
  Eau: { kind: 'wave', name: 'Hydroblast', color: '#3a7bff', desc: 'Un raz-de-marée qui balaie l’écran, repousse tout très loin et te rend invincible un instant.' },
  Glace: { kind: 'wave', name: 'Ère Glaciaire', color: '#9be8ff', desc: 'Un vent polaire qui gèle sur place tous les ennemis proches.' },
  Vol: { kind: 'wave', name: 'Rapace', color: '#a98ff3', desc: 'Un tourbillon d’ailes qui disperse la horde et te rend intouchable.' },
  Électrik: { kind: 'storm', name: 'Fatal-Foudre', color: '#ffe14a', desc: 'Une pluie d’éclairs sur les ennemis à l’écran, qui restent paralysés.' },
  Psy: { kind: 'storm', name: 'Psyko-Tempête', color: '#ff7ac8', desc: 'Une onde psychique frappe chaque ennemi à l’écran et les étourdit.' },
  Roche: { kind: 'storm', name: 'Pluie de Météores', color: '#c9a35a', desc: 'Des rochers s’écrasent sur toute la horde visible.' },
  Sol: { kind: 'storm', name: 'Abîme', color: '#d9b25a', desc: 'Le sol se fend sous chaque ennemi proche.' },
  Spectre: { kind: 'storm', name: 'Ombre Portée', color: '#8a6bc4', desc: 'Des ombres saisissent chaque ennemi à l’écran.' },
  Poison: { kind: 'storm', name: 'Gaz Toxique', color: '#b05ad6', desc: 'Des nuées toxiques éclatent sur la horde et l’empoisonnent.' },
  Acier: { kind: 'storm', name: 'Tempête d’Acier', color: '#c9d2e6', desc: 'Des lames d’acier s’abattent sur la horde.' },
  Ténèbres: { kind: 'storm', name: 'Nuit Noire', color: '#6b5a4c', desc: 'Les ténèbres frappent chaque ennemi à l’écran.' }
};
export const ultOf = (partner) => ULTS[partner?.type] || ULTS.Normal;

/* ——— Familles → partenaires jouables ——— */
const LEGACY = Object.fromEntries(PARTNERS.filter((p) => p.gen === 1).map((p) => [p.id, p]));
const BLURB = {
  bulbasaur: 'Le plus résistant. Des Tranch’Herbe tournent autour de lui.',
  charmander: 'Crache des Flammèches sur l’ennemi le plus proche. Dracaufeu vole au-dessus de l’eau.',
  squirtle: 'Nage dans la rivière et le lac. Son jet d’eau transperce les lignes.',
  pikachu: 'Rapide et fragile : ses éclairs rebondissent d’ennemi en ennemi.'
};
export const RARITY_ORDER = ['Commun', 'Peu commun', 'Rare', 'Épique', 'Légendaire'];
export const RARITY_COLOR = { Commun: '#8a93a8', 'Peu commun': '#34b46a', Rare: '#2f7bf0', Épique: '#9a4ff0', Légendaire: '#f0a020' };

export const FAMILIES = LEAGUE_DATA.map((f) => {
  const legacy = LEGACY[f.id];
  const type = f.types[0];
  const base = {
    id: f.id, gen: 1, dex: f.dex, name: f.name, type, types: f.types, color: TYPE_COLORS[type] || '#999',
    hp: f.hp, speed: f.speed, power: f.power, weapon: f.weapon, learn: f.learn, evolutions: f.evolutions,
    rarity: f.rarity, unlock: f.unlock, legendary: f.legendary, stats: f.stats
  };
  // Évolutions au choix (Évoli) : type, couleur et effet affichés sur la carte
  base.evolutions = base.evolutions.map((e) => (e.choices ? { ...e, choices: e.choices.map((c) => ({ ...c, type: c.types[0], color: TYPE_COLORS[c.types[0]] || '#ffffff', perk: `Devient ${c.name}, de type ${c.types.join(' / ')}.` })) } : e));
  const p = legacy ? { ...base, hp: legacy.hp, speed: legacy.speed, weapon: legacy.weapon, evolutions: legacy.evolutions, mega: legacy.mega, learn: [...new Set([...(legacy.learn || []), ...f.learn])] } : base;
  const chain = [f.name, ...p.evolutions.map((e) => (e.choices ? e.choices.map((c) => c.name).join(' / ') : e.name))];
  p.chain = chain;
  p.cls = classOf(p.weapon);
  p.blurb = BLURB[f.id] || `${WEAPONS[p.weapon]?.name || 'Charge'} dès le départ. ${p.evolutions.length ? `Évolue en ${chain.slice(1).join(', puis ')} pendant la partie.` : 'N’évolue pas, mais frappe plus fort (+' + Math.round((p.power - 1) * 100) + ' % de dégâts).'}`;
  p.ult = ultOf(p);
  return p;
});
export const FAMILY = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));
export const familyOfDex = (() => {
  const map = {};
  FAMILIES.forEach((f) => {
    map[f.dex] = f.id;
    f.evolutions.forEach((e) => { if (e.dex) map[e.dex] = f.id; (e.choices || []).forEach((c) => { map[c.dex] = f.id; }); });
  });
  return (dex) => map[dex] || null;
})();

/* ——— Défis ——— */
const fr = (n) => Math.round(n || 0).toLocaleString('fr-FR');
export const STAT_LABEL = {
  runs: (g) => `Termine ${fr(g)} partie${g > 1 ? 's' : ''} (victoire ou défaite).`,
  wins: (g) => `Gagne ${fr(g)} partie${g > 1 ? 's' : ''} (bats le légendaire de l’arène).`,
  kills: (g) => `Mets ${fr(g)} Pokémon K.O. au total.`,
  dashes: (g) => `Esquive ${fr(g)} fois (Maj).`,
  catches: (g) => `Capture ${fr(g)} Pokémon au total.`,
  chests: (g) => `Ouvre ${fr(g)} coffres.`,
  bestLevel: (g) => `Atteins le niveau ${g} dans une partie.`,
  ults: (g) => `Lance ${fr(g)} Ultimes.`,
  altars: (g) => `Active ${fr(g)} autels.`,
  bestTime: (g) => `Survis ${Math.floor(g / 60)} minutes dans une partie.`,
  berries: (g) => `Mange ${fr(g)} baies.`,
  superHits: (g) => `Place ${fr(g)} coups super efficaces.`,
  bestKills: (g) => `Mets ${fr(g)} Pokémon K.O. en une seule partie.`,
  coins: (g) => `Ramasse ${fr(g)} ₽ au total.`,
  missions: (g) => `Accomplis ${fr(g)} missions.`,
  bosses: (g) => `Bats ${fr(g)} boss.`,
  evolutions: (g) => `Évolue ${fr(g)} fois pendant tes parties.`,
  alphas: (g) => `Bats ou capture ${fr(g)} Pokémon Alpha.`,
  noHit: (g) => `Tiens ${g} secondes sans être touché.`,
  winners: (g) => `Gagne avec ${g} partenaires différents.`,
  league: (g) => `Réunis ${g} membres dans ta Ligue.`,
  buy: (g) => `Recrute-le au Centre Pokémon pour ${fr(g)} PL.`,
  free: () => 'Toujours dans ta Ligue.'
};
export const challengeText = (f) => {
  const [k, t] = f.unlock.kind.split(':');
  if (k === 'typeKills') return `Mets ${fr(f.unlock.goal)} Pokémon K.O. avec des attaques ${t} (alliés compris).`;
  if (k === 'typeCatches') return `Capture ${fr(f.unlock.goal)} Pokémon de type ${t}.`;
  return (STAT_LABEL[k] || (() => ''))(f.unlock.goal);
};

export const blankStats = () => ({
  runs: 0, wins: 0, kills: 0, dashes: 0, catches: 0, chests: 0, bestLevel: 0, ults: 0, altars: 0, bestTime: 0, berries: 0, superHits: 0,
  bestKills: 0, coins: 0, missions: 0, bosses: 0, evolutions: 0, alphas: 0, noHit: 0, typeKills: {}, typeCatches: {}
});

export const isMember = (m, f) => f.unlock.kind === 'free' || m.league?.[f.id] === 'member' || (f.id === 'pikachu' && m.starters?.pikachu);
export const leagueSize = (m) => FAMILIES.filter((f) => isMember(m, f)).length;
export const winnersOf = (m) => Object.values(m.best || {}).filter((b) => b.win).length;

export const progressOf = (m, f) => {
  const s = { ...blankStats(), ...(m.stats || {}) };
  const [k, t] = f.unlock.kind.split(':');
  let v = 0;
  if (k === 'typeKills') v = s.typeKills?.[t] || 0;
  else if (k === 'typeCatches') v = s.typeCatches?.[t] || 0;
  else if (k === 'winners') v = winnersOf(m);
  else if (k === 'league') v = leagueSize(m);
  else if (k === 'buy') v = m.pl || 0;
  else v = s[k] || 0;
  const goal = f.unlock.goal || 1;
  return { value: Math.min(v, goal), goal, pct: Math.min(1, v / goal) };
};
/** member | ready (défi réussi : à capturer) | locked */
export const statusOf = (m, f) => {
  if (isMember(m, f)) return 'member';
  if (m.league?.[f.id] === 'ready') return 'ready';
  return 'locked';
};
/** Après une partie : les défis réussis passent « à capturer ». */
export const refreshLeague = (m) => {
  const league = { ...(m.league || {}) };
  const newly = [];
  FAMILIES.forEach((f) => {
    if (f.unlock.kind === 'free' || f.unlock.kind === 'buy' || league[f.id]) return;
    if (progressOf(m, f).pct >= 1) { league[f.id] = 'ready'; newly.push(f.id); }
  });
  return { league, newly };
};

/* ——— Pokémon sauvages de la 1re génération (définitions pour le moteur 3D) ——— */
const bst = (dex) => (GEN1_STATS[dex] || [50, 50, 50, 50, 50, 50]).reduce((a, b) => a + b, 0);
const synthFoe = (dex, tier) => {
  const st = GEN1_STATS[dex] || [50, 50, 50, 50, 50, 50];
  const types = GEN1_TYPES[dex] || ['Normal'];
  const fly = types.includes('Vol') && ![84, 85].includes(dex);
  const ghost = types.includes('Spectre');
  const special = st[3] > st[1] + 10;
  const ai = ghost ? 'ghost' : fly ? 'fly' : special && ['Poison', 'Psy', 'Feu', 'Eau', 'Électrik', 'Glace'].includes(types[0]) ? 'spit' : st[5] >= 80 ? 'charge' : 'walk';
  const hpT = [12, 30, 70][tier]; const dmgT = [5, 8, 12][tier];
  return {
    name: GEN1_NAMES[dex], dex, ai, flying: fly || ghost, color: TYPE_COLORS[types[0]] || '#ffffff',
    hp: Math.round(hpT * (0.7 + st[0] / 160)), speed: Math.min(2.3, Math.max(0.8, 0.85 + st[5] / 85)), dmg: Math.round(dmgT * (0.8 + st[1] / 220)),
    size: [30, 34, 40][tier], xp: [1, 2, 4][tier], heavy: st[2] > 100
  };
};
const foeKeyOf = Object.fromEntries(Object.entries(FOES).filter(([, d]) => d.dex <= 151 && !d.boss && !String(d.dex).includes('-')).map(([k, d]) => [d.dex, k]));
/** Clé FOES d'un Pokémon de la 1re génération (créée au besoin). */
export const ensureFoe = (dex, tier = null) => {
  if (foeKeyOf[dex]) return foeKeyOf[dex];
  const key = `g1_${dex}`;
  if (!FOES[key]) {
    const b = bst(dex);
    FOES[key] = synthFoe(dex, tier ?? (b < 320 ? 0 : b < 430 ? 1 : 2));
    FOE_TYPES[key] = GEN1_TYPES[dex] || ['Normal'];
  }
  foeKeyOf[dex] = key;
  return key;
};

// Hordes du Poké Rush : toute la faune de Kanto, en trois paliers de puissance
const T1 = [19, 16, 10, 13, 21, 23, 27, 29, 32, 41, 43, 46, 48, 50, 52, 56, 60, 69, 74, 98, 116, 118, 54, 39, 35];
const T2 = [20, 17, 24, 28, 30, 33, 42, 44, 47, 49, 51, 53, 57, 58, 77, 92, 100, 109, 104, 88, 96, 102, 84, 72, 81, 37, 79, 66, 63];
const T3 = [22, 18, 93, 75, 67, 78, 110, 89, 97, 101, 105, 85, 82, 64, 123, 127, 128, 111, 115, 59, 62, 26, 45, 71];
const shuffled = (l, rng) => { const a = [...l]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const buildRushRoster = (rng = Math.random) => {
  const base = buildRoster(1, rng);
  const a = shuffled(T1, rng).slice(0, 5).map((d) => ensureFoe(d, 0));
  const b = shuffled(T2, rng).slice(0, 5).map((d) => ensureFoe(d, 1));
  const c = shuffled(T3, rng).slice(0, 4).map((d) => ensureFoe(d, 2));
  const waves = [
    { from: 0, foes: [a[0], a[1]] },
    { from: 60, foes: [a[0], a[1], a[2]] },
    { from: 120, foes: [a[2], a[3], a[4], b[0]] },
    { from: 200, foes: [a[3], a[4], b[0], b[1]] },
    { from: 280, foes: [b[0], b[1], b[2], b[3]] },
    { from: 360, foes: [b[2], b[3], b[4], c[0]] },
    { from: 420, foes: [b[4], c[0], c[1], c[2]] },
    { from: 470, foes: [c[0], c[1], c[2], c[3]] }
  ];
  return { ...base, waves, foes: [...a, ...b, ...c] };
};

/** Familles prêtes à rejoindre la Ligue : elles apparaissent en partie (2 au maximum). */
export const leagueSpawns = (m, rng = Math.random) => shuffled(FAMILIES.filter((f) => statusOf(m, f) === 'ready'), rng).slice(0, 2)
  .map((f, i) => ({ fam: f.id, key: ensureFoe(f.dex), at: 50 + i * 130 + Math.floor(rng() * 70), legendary: f.legendary }));

export const LEGEND_POOL = GEN_POOLS[1].finals;

/** Fin de partie : statistiques cumulées de la Ligue, membres capturés, défis réussis. */
export const applyRunToLeague = (m0, run) => {
  const s = { ...blankStats(), ...(m0.stats || {}) };
  const typeKills = { ...(s.typeKills || {}) };
  Object.entries(run.typeKills || {}).forEach(([t, n]) => { typeKills[t] = (typeKills[t] || 0) + n; });
  const typeCatches = { ...(s.typeCatches || {}) };
  (run.caughtTypes || []).forEach((t) => { typeCatches[t] = (typeCatches[t] || 0) + 1; });
  const stats = {
    ...s, typeKills, typeCatches,
    runs: s.runs + 1, wins: s.wins + (run.result === 'win' ? 1 : 0), kills: s.kills + run.kills, dashes: s.dashes + (run.dashes || 0),
    catches: s.catches + (run.caughtCount || 0), chests: s.chests + (run.chests || 0), ults: s.ults + (run.ults || 0), altars: s.altars + (run.altars || 0),
    berries: s.berries + (run.berries || 0), superHits: s.superHits + (run.superHits || 0), coins: s.coins + Math.round(run.coinsTotal || 0),
    missions: s.missions + (run.missions || 0), bosses: s.bosses + (run.bosses || 0), evolutions: s.evolutions + (run.evolutions || 0), alphas: s.alphas + (run.alphas || 0),
    bestLevel: Math.max(s.bestLevel, run.level || 0), bestTime: Math.max(s.bestTime, Math.floor(run.t || 0)), bestKills: Math.max(s.bestKills, run.kills || 0),
    noHit: Math.max(s.noHit, Math.floor(run.noHit || 0))
  };
  const league = { ...(m0.league || {}) };
  const joined = [];
  (run.leagueCaught || []).forEach((id) => { if (league[id] !== 'member') { league[id] = 'member'; joined.push(id); } });
  const m1 = { ...m0, stats, league };
  const { league: l2, newly } = refreshLeague(m1);
  const m = saveRush({ ...m1, league: l2 });
  return { meta: m, joined, ready: newly };
};

/** Clé FOES → numéro du Pokédex (les sauvages synthétisés ont des clés « g1_<n> »). */
export const foeDex = (key) => {
  if (FOES[key]) return FOES[key].dex;
  const m = /^g1_(\d+)$/.exec(key || '');
  return m ? Number(m[1]) : null;
};
export const foeName = (key) => FOES[key]?.name || GEN1_NAMES[foeDex(key)] || '???';

/** Recruter une famille contre des Points de Ligue (défi « buy »). */
export const buyFamily = (m, f) => {
  if (f.unlock.kind !== 'buy' || isMember(m, f) || (m.pl || 0) < f.unlock.goal) return m;
  return saveRush({ ...m, pl: m.pl - f.unlock.goal, league: { ...(m.league || {}), [f.id]: 'member' } });
};

/** Première ouverture de la Ligue : on reprend les parties déjà jouées pour amorcer les défis. */
export const migrateLeague = (m0) => {
  if (m0.stats) {
    const { league, newly } = refreshLeague(m0);
    return newly.length ? saveRush({ ...m0, league }) : m0;
  }
  const catches = Object.values(m0.caught || {}).reduce((a, n) => a + n, 0);
  const kills = (m0.history || []).reduce((a, r) => a + (r.kills || 0), 0);
  const stats = { ...blankStats(), runs: m0.runs || 0, wins: m0.wins || 0, catches, kills, bestKills: Math.max(0, ...(m0.history || []).map((r) => r.kills || 0)), bestLevel: Math.max(0, ...(m0.history || []).map((r) => r.level || 0)) };
  const m1 = { ...m0, stats, league: { ...(m0.league || {}) } };
  return saveRush({ ...m1, league: refreshLeague(m1).league });
};
