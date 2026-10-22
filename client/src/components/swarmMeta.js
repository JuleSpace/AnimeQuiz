/**
 * Progression entre les parties du Swarm (sauvegardée dans le navigateur) :
 * Poussière Étoile, arbre de talents, régions à débloquer, défis, défi du jour et Pokédex.
 */
import { ALL_FOE_IDS, FOES, MAX_PASSIVES, MAX_WEAPONS, PARTNERS, PASSIVES, WEAPONS } from './swarmData';

export { ALL_FOE_IDS };

const KEY = 'poke-swarm-meta';

/* ——— Arbre de talents : 5 branches, 3 paliers (5 et 12 points dans la branche pour descendre) ——— */
export const BRANCHES = [
  { id: 'force', name: 'Force', color: '#ff5a5a' },
  { id: 'resolve', name: 'Endurance', color: '#5fd06a' },
  { id: 'agility', name: 'Agilité', color: '#4fa8ff' },
  { id: 'fortune', name: 'Fortune', color: '#ffd23a' },
  { id: 'mastery', name: 'Maîtrise', color: '#c77dff', needs: [0, 2, 4] }
];
export const TIER_NEEDS = [0, 5, 12];
/** Points à investir dans la branche pour atteindre un palier (la Maîtrise a moins de rangs, donc des paliers plus bas). */
export const tierNeed = (branch, tier) => (BRANCHES.find((b) => b.id === branch)?.needs || TIER_NEEDS)[tier];

export const TALENTS = [
  { id: 'power', branch: 'force', tier: 0, name: 'Puissance', max: 10, base: 30, desc: (r) => `+${r * 2} % de dégâts` },
  { id: 'crit', branch: 'force', tier: 0, name: 'Précision', max: 5, base: 40, desc: (r) => `+${r} % de coups critiques` },
  { id: 'haste', branch: 'force', tier: 1, name: 'Célérité', max: 8, base: 60, desc: (r) => `−${r * 2} % de temps de recharge` },
  { id: 'execute', branch: 'force', tier: 2, name: 'Coup de grâce', max: 3, base: 160, desc: (r) => `+${r * 10} % de dégâts aux ennemis sous 30 % de PV` },
  { id: 'vitality', branch: 'resolve', tier: 0, name: 'Vitalité', max: 10, base: 30, desc: (r) => `+${r * 6} PV max` },
  { id: 'armor', branch: 'resolve', tier: 0, name: 'Carapace', max: 5, base: 40, desc: (r) => `−${r * 3} % de dégâts reçus` },
  { id: 'regen', branch: 'resolve', tier: 1, name: 'Régénération', max: 5, base: 60, desc: (r) => `+${(r * 0.2).toFixed(1)} PV par seconde` },
  { id: 'revive', branch: 'resolve', tier: 2, name: 'Rappel', max: 1, base: 600, desc: () => 'Une fois par partie, revient à 40 % de PV au lieu d’être K.O.' },
  { id: 'swift', branch: 'agility', tier: 0, name: 'Vélocité', max: 5, base: 35, desc: (r) => `+${r * 2} % de vitesse` },
  { id: 'magnet', branch: 'agility', tier: 0, name: 'Magnétisme', max: 5, base: 25, desc: (r) => `+${r * 10} % de portée de ramassage` },
  { id: 'dash', branch: 'agility', tier: 1, name: 'Reflexes', max: 5, base: 60, desc: (r) => `−${r * 6} % de recharge de l’esquive` },
  { id: 'phase', branch: 'agility', tier: 2, name: 'Évanescence', max: 2, base: 220, desc: (r) => `+${(r * 0.15).toFixed(2)} s d’invincibilité après une esquive` },
  { id: 'wisdom', branch: 'fortune', tier: 0, name: 'Sagesse', max: 10, base: 30, desc: (r) => `+${r * 3} % d’XP` },
  { id: 'greed', branch: 'fortune', tier: 0, name: 'Avidité', max: 10, base: 40, desc: (r) => `+${r * 5} % de Poussière Étoile` },
  { id: 'reroll', branch: 'fortune', tier: 1, name: 'Second choix', max: 3, base: 120, desc: (r) => `+${r} relance${r > 1 ? 's' : ''} par partie` },
  { id: 'luck', branch: 'fortune', tier: 2, name: 'Chanceux', max: 2, base: 250, desc: (r) => `Baies et objets ${r === 2 ? 'trois' : 'deux'} fois plus fréquents` },
  { id: 'headstart', branch: 'mastery', tier: 0, name: 'Entraînement', max: 1, base: 300, desc: () => 'L’attaque de départ commence au niveau 2' },
  { id: 'evolve', branch: 'mastery', tier: 0, name: 'Croissance', max: 2, base: 180, desc: (r) => `Évolutions ${r * 2} niveaux plus tôt` },
  { id: 'cards', branch: 'mastery', tier: 1, name: 'Main pleine', max: 1, base: 500, desc: () => '4 cartes au choix au lieu de 3' },
  { id: 'mega', branch: 'mastery', tier: 2, name: 'Lien Méga', max: 1, base: 450, desc: () => 'La Méga-Gemme ne demande que 2 niveaux' },
  { id: 'ultcharge', branch: 'force', tier: 1, name: 'Ferveur', max: 3, base: 110, desc: (r) => `Jauge d’ultime +${r * 15} % plus rapide` },
  { id: 'slotp', branch: 'mastery', tier: 1, name: 'Sacoche', max: 1, base: 600, desc: () => '+1 emplacement d’objet (5 au lieu de 4)' },
  { id: 'slotw', branch: 'mastery', tier: 2, name: 'Cinquième capacité', max: 1, base: 900, desc: () => '+1 emplacement d’attaque (5 au lieu de 4)' }
];

export const REGION_COST = { 1: 0, 2: 600, 3: 1200, 4: 2000 };

/* ——— Défis (une seule fois chacun) ——— */
export const ACHIEVEMENTS = [
  { id: 'first', name: 'Premier pas', desc: 'Termine une partie.', reward: 50 },
  { id: 'surv5', name: 'Coriace', desc: 'Survis 5 minutes.', reward: 100 },
  { id: 'final', name: 'Face au légendaire', desc: 'Atteins le boss final.', reward: 150 },
  { id: 'miniboss', name: 'Chasseur de boss', desc: 'Bats un boss intermédiaire.', reward: 80 },
  { id: 'win1', name: 'Maître de Kanto', desc: 'Gagne une partie à Kanto.', reward: 300 },
  { id: 'win2', name: 'Maître de Johto', desc: 'Gagne une partie à Johto.', reward: 300 },
  { id: 'win3', name: 'Maître de Hoenn', desc: 'Gagne une partie à Hoenn.', reward: 300 },
  { id: 'win4', name: 'Maître de Sinnoh', desc: 'Gagne une partie à Sinnoh.', reward: 300 },
  { id: 'k500', name: 'Raz-de-marée', desc: '500 K.O. en une partie.', reward: 150 },
  { id: 'k1000', name: 'Apocalypse', desc: '1 000 K.O. en une partie.', reward: 300 },
  { id: 'lv20', name: 'Vétéran', desc: 'Atteins le niveau 20.', reward: 100 },
  { id: 'lv30', name: 'Champion', desc: 'Atteins le niveau 30.', reward: 250 },
  { id: 'mega', name: 'Méga-lien', desc: 'Méga-Évolue pendant une partie.', reward: 150 },
  { id: 'maxw', name: 'Spécialiste', desc: 'Monte une attaque au niveau 5.', reward: 80 },
  { id: 'full', name: 'Équipement complet', desc: '4 attaques et 4 objets dans la même partie.', reward: 120 },
  { id: 'rocks', name: 'Casse-cailloux', desc: 'Casse 10 rochers fissurés en une partie.', reward: 60 },
  { id: 'untouch', name: 'Intouchable', desc: 'Reste 3 minutes sans être touché.', reward: 200 },
  { id: 'nodash', name: 'Sans filet', desc: 'Gagne sans utiliser l’esquive.', reward: 400 },
  { id: 'starters', name: 'Collectionneur', desc: 'Joue avec 6 starters différents.', reward: 120 },
  { id: 'dex30', name: 'Chercheur', desc: 'Pokédex : 30 espèces vaincues.', reward: 150 },
  { id: 'dexall', name: 'Professeur', desc: 'Pokédex complet.', reward: 400 },
  { id: 'life10k', name: 'Infatigable', desc: '10 000 K.O. au total.', reward: 300 },
  { id: 'daily', name: 'Régulier', desc: 'Réussis un défi du jour.', reward: 100 },
  { id: 'legends3', name: 'Chasseur de légendes', desc: 'Bats 3 boss finaux différents.', reward: 300 },
  { id: 'legends10', name: 'Mythologue', desc: 'Bats 10 boss finaux différents.', reward: 800 },
  { id: 'biomes', name: 'Globe-trotter', desc: 'Joue dans les 5 décors.', reward: 150 },
  { id: 'rank1', name: 'Menace accrue', desc: 'Gagne une partie en rang 1 ou plus.', reward: 250 },
  { id: 'rank3', name: 'Danger extrême', desc: 'Gagne une partie en rang 3 ou plus.', reward: 500 },
  { id: 'rank5', name: 'Légende vivante', desc: 'Gagne une partie au rang 5.', reward: 1200 },
  { id: 'ct3', name: 'Studieux', desc: 'Débloque 3 capacités ou objets.', reward: 120 },
  { id: 'dex100', name: 'Encyclopédiste', desc: 'Pokédex : 100 espèces vaincues.', reward: 400 },
  { id: 'mission3', name: 'Carnet rempli', desc: 'Réussis les 3 missions d’une même partie.', reward: 200 },
  { id: 'missions25', name: 'Agent de terrain', desc: 'Réussis 25 missions au total.', reward: 300 },
  { id: 'alpha1', name: 'Chasseur d’Alpha', desc: 'Bats un Pokémon Alpha.', reward: 100 },
  { id: 'alpha10', name: 'Dompteur d’Alpha', desc: 'Bats 10 Pokémon Alpha au total.', reward: 300 },
  { id: 'altar3', name: 'Pèlerin', desc: 'Active les 3 autels d’une même partie.', reward: 150 },
  { id: 'ult10', name: 'Coup de grâce ultime', desc: 'Lance 10 ultimes au total.', reward: 120 },
  { id: 'endless12', name: 'Increvable', desc: 'Survie infinie : tiens 12 minutes.', reward: 300 },
  { id: 'endless20', name: 'Éternel', desc: 'Survie infinie : tiens 20 minutes.', reward: 800 }
];

/* ——— Capacités et objets à débloquer (Poussière) ——— */
export const UNLOCKABLES = [
  ...Object.entries(WEAPONS).filter(([, w]) => w.cost).map(([id, w]) => ({ id, kind: 'weapon', name: w.name, type: w.type, color: w.color, cost: w.cost, desc: w.desc(1) })),
  ...Object.entries(PASSIVES).filter(([, it]) => it.cost).map(([id, it]) => ({ id, kind: 'passive', name: it.name, type: 'Objet', color: it.color, cost: it.cost, desc: it.desc }))
];
export const buyUnlock = (m, id) => {
  const u = UNLOCKABLES.find((x) => x.id === id);
  if (!u || m.unlocks[id] || m.dust < u.cost) return m;
  const next = { ...m, dust: m.dust - u.cost, unlocks: { ...m.unlocks, [id]: true } };
  if (Object.keys(next.unlocks).length >= 3 && !next.achievements.ct3) {
    next.achievements = { ...next.achievements, ct3: true };
    next.dust += 120;
    next.totalDust = (next.totalDust || 0) + 120;
  }
  return saveMeta(next);
};

/* ——— Rangs de menace (difficulté) : gagner au rang N débloque le rang N+1 de la région ——— */
export const MAX_RANK = 5;
export const RANK_INFO = (r) => ({
  foeHp: 1 + r * 0.25,
  foeDmg: 1 + r * 0.12,
  spawn: 1 - r * 0.06,
  bossHp: 1 + r * 0.3,
  dust: 1 + r * 0.25
});
export const rankLabel = (r) => (r ? `Rang ${r} : ennemis +${Math.round(r * 25)} % PV, +${Math.round(r * 12)} % dégâts · Poussière ×${(1 + r * 0.25).toFixed(2)}` : 'Rang 0 : difficulté normale');

/* ——— Défi du jour ——— */
export const DAILY_MODS = [
  { id: 'horde', name: 'Horde', desc: 'Deux fois plus d’ennemis, Poussière ×1,5.', spawn: 0.5, dust: 1.5 },
  { id: 'fragile', name: 'Fragile', desc: 'PV max −40 %, mais +30 % de dégâts.', hp: 0.6, dmg: 1.3, dust: 1.3 },
  { id: 'famine', name: 'Famine', desc: 'Aucune baie, mais +30 % d’XP.', noBerry: true, xp: 1.3, dust: 1.3 },
  { id: 'frenzy', name: 'Frénésie', desc: 'Les ennemis vont 20 % plus vite.', foeSpeed: 1.2, dust: 1.4 },
  { id: 'rush', name: 'Boss rush', desc: 'Les boss arrivent bien plus tôt.', bossTime: 0.6, dust: 1.4 },
  { id: 'tanky', name: 'Peau dure', desc: 'Ennemis +50 % de PV, XP +20 %.', foeHp: 1.5, xp: 1.2, dust: 1.4 }
];
export const todayKey = () => new Date().toISOString().slice(0, 10);
const hashStr = (s) => [...s].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;
export const dailyChallenge = (key = todayKey()) => {
  const h = hashStr(`swarm-${key}`);
  const partner = PARTNERS[h % PARTNERS.length];
  const mod = DAILY_MODS[(h >>> 8) % DAILY_MODS.length];
  return { key, partnerId: partner.id, gen: partner.gen, mod };
};

/* ——— Sauvegarde ——— */
const blank = () => ({
  v: 1, dust: 0, totalDust: 0, talents: {}, bought: 0, regions: { 1: true }, achievements: {},
  dex: {}, runs: 0, kills: 0, starters: {}, daily: {}, unlocks: {}, ranks: {}, legends: {}, biomes: {}, met: {}
});
export const loadMeta = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.v === 1) return { ...blank(), ...raw, regions: { 1: true, ...raw.regions } };
  } catch { /* sauvegarde illisible : on repart de zéro */ }
  return blank();
};
export const saveMeta = (m) => {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* stockage indisponible */ }
  return m;
};

/* ——— Talents ——— */
export const rankOf = (m, id) => m.talents[id] || 0;
export const branchPoints = (m, branch) => TALENTS.filter((t) => t.branch === branch).reduce((a, t) => a + rankOf(m, t.id), 0);
export const talentCost = (m, t) => Math.round(t.base * (1 + rankOf(m, t.id) * 0.35) * (1 + (m.bought || 0) * 0.006));
export const talentLocked = (m, t) => branchPoints(m, t.branch) < tierNeed(t.branch, t.tier);
export const buyTalent = (m, id) => {
  const t = TALENTS.find((x) => x.id === id);
  if (!t || rankOf(m, id) >= t.max || talentLocked(m, t)) return m;
  const cost = talentCost(m, t);
  if (m.dust < cost) return m;
  return saveMeta({ ...m, dust: m.dust - cost, talents: { ...m.talents, [id]: rankOf(m, id) + 1 }, bought: (m.bought || 0) + 1, spent: (m.spent || 0) + cost });
};
export const refundAll = (m) => saveMeta({ ...m, dust: m.dust + (m.spent || 0), talents: {}, bought: 0, spent: 0 });
export const unlockRegion = (m, gen) => {
  const cost = REGION_COST[gen] || 0;
  if (m.regions[gen] || m.dust < cost) return m;
  return saveMeta({ ...m, dust: m.dust - cost, regions: { ...m.regions, [gen]: true } });
};

/** Effets des talents (+ modificateur du défi du jour) transmis au moteur. */
export const metaEffects = (m, mod = null, rank = 0) => {
  const r = (id) => rankOf(m, id);
  const R = RANK_INFO(rank);
  return {
    unlocks: m.unlocks || {},
    foeDmg: R.foeDmg,
    bossHp: R.bossHp,
    dmg: (1 + r('power') * 0.02) * (mod?.dmg || 1),
    crit: r('crit') * 0.01,
    cd: 1 - r('haste') * 0.02,
    execute: r('execute') * 0.1,
    hp: r('vitality') * 6,
    hpMul: mod?.hp || 1,
    armor: 1 - r('armor') * 0.03,
    regen: r('regen') * 0.2,
    revive: r('revive') > 0,
    speed: 1 + r('swift') * 0.02,
    magnet: 1 + r('magnet') * 0.1,
    dashCd: 1 - r('dash') * 0.06,
    phase: r('phase') * 0.15,
    xp: (1 + r('wisdom') * 0.03) * (mod?.xp || 1),
    rerolls: r('reroll'),
    luck: 1 + r('luck'),
    headstart: r('headstart') > 0,
    evolveEarly: r('evolve') * 2,
    cards: r('cards') ? 4 : 3,
    megaLevels: r('mega') ? 2 : 3,
    spawn: (mod?.spawn || 1) * R.spawn,
    foeHp: (mod?.foeHp || 1) * R.foeHp,
    foeSpeed: mod?.foeSpeed || 1,
    bossTime: mod?.bossTime || 1,
    noBerry: !!mod?.noBerry,
    ultRate: 1 + r('ultcharge') * 0.15,
    maxWeapons: MAX_WEAPONS + (r('slotw') ? 1 : 0),
    maxPassives: MAX_PASSIVES + (r('slotp') ? 1 : 0)
  };
};

/* ——— Fin de partie : Poussière gagnée, défis, Pokédex ——— */

export const recordRun = (m0, run) => {
  const m = {
    ...m0, dex: { ...m0.dex }, achievements: { ...m0.achievements }, starters: { ...m0.starters }, daily: { ...m0.daily },
    ranks: { ...(m0.ranks || {}) }, legends: { ...(m0.legends || {}) }, biomes: { ...(m0.biomes || {}) }, unlocks: { ...(m0.unlocks || {}) },
    endless: { ...(m0.endless || {}) }, alphas: { ...(m0.alphas || {}) }
  };
  const rank = run.rank || 0;
  const lines = [];
  const add = (label, v) => { if (v > 0) lines.push({ label, v: Math.round(v) }); };
  add(`Survie (${Math.floor(run.t / 60)} min ${String(Math.floor(run.t % 60)).padStart(2, '0')})`, run.t / 8);
  add(`${run.kills} K.O.`, run.kills / 12);
  add(`Niveau ${run.level}`, run.level * 2);
  add(`${run.bosses} boss vaincu${run.bosses > 1 ? 's' : ''}`, run.bosses * 30);
  if (run.result === 'win') add('Victoire', 200);
  const missionsDone = (run.missions || []).filter((x) => x.done).length;
  add(`${missionsDone} mission${missionsDone > 1 ? 's' : ''} réussie${missionsDone > 1 ? 's' : ''}`, missionsDone * 60);
  add(`${run.alphaKills || 0} Alpha vaincu${(run.alphaKills || 0) > 1 ? 's' : ''}`, (run.alphaKills || 0) * 50);
  if (run.endless && run.t > 540) add('Survie infinie', (run.t - 540) / 3 + (run.endlessWave || 0) * 40);
  add('Autel de la Fortune', run.blessDust || 0);
  let base = lines.reduce((a, l) => a + l.v, 0);
  const mult = (1 + rankOf(m, 'greed') * 0.05) * (run.daily ? run.daily.mod.dust : 1) * RANK_INFO(rank).dust;
  if (mult > 1) lines.push({ label: `Bonus ×${mult.toFixed(2)}`, v: Math.round(base * (mult - 1)) });
  base = Math.round(base * mult);
  // défi du jour
  let dailyDone = false;
  if (run.daily && !m.daily[run.daily.key] && (run.t >= 300 || run.result === 'win')) {
    m.daily[run.daily.key] = true;
    dailyDone = true;
    lines.push({ label: 'Défi du jour réussi', v: 200 });
    base += 200;
  }
  // Pokédex et compteurs
  Object.entries(run.killsBy || {}).forEach(([id, n]) => { m.dex[id] = (m.dex[id] || 0) + n; });
  m.met = { ...(m0.met || {}) };
  (run.met || []).forEach((id) => { m.met[id] = true; });
  m.runs = (m.runs || 0) + 1;
  m.kills = (m.kills || 0) + run.kills;
  m.starters[run.partnerId] = true;
  m.missionsDone = (m.missionsDone || 0) + missionsDone;
  m.ults = (m.ults || 0) + (run.ults || 0);
  Object.entries(run.alphaBy || {}).forEach(([id, n]) => { m.alphas[id] = (m.alphas[id] || 0) + n; });
  const alphaTotal = Object.values(m.alphas).reduce((a, b) => a + b, 0);
  let endlessRecord = false;
  if (run.endless && run.t > (m.endless[run.gen] || 0)) { m.endless[run.gen] = run.t; endlessRecord = true; }
  if (run.endless && run.finalDown && run.finalBoss) m.legends[run.finalBoss] = true;
  // Historique : les 15 dernières parties
  m.history = [{
    at: Date.now(), partnerId: run.partnerId, gen: run.gen, result: run.result, t: Math.round(run.t), kills: run.kills, level: run.level,
    rank, biome: run.biome, endless: !!run.endless, missions: missionsDone, finalBoss: run.finalBoss, weapons: run.weaponIds || [], score: run.score || 0
  }, ...(m0.history || [])].slice(0, 15);
  if (run.biome) m.biomes[run.biome] = true;
  // victoire : boss final ajouté aux légendes, rang suivant débloqué pour la région
  let rankUp = false;
  if (run.result === 'win') {
    if (run.finalBoss) m.legends[run.finalBoss] = true;
    if (!run.daily && rank >= (m.ranks[run.gen] || 0) && rank < MAX_RANK) { m.ranks[run.gen] = rank + 1; rankUp = true; }
  }
  // défis
  const unlocked = [];
  const done = (id, cond) => { if (cond && !m.achievements[id]) { m.achievements[id] = true; unlocked.push(ACHIEVEMENTS.find((a) => a.id === id)); } };
  const dexCount = ALL_FOE_IDS.filter((id) => m.dex[id] > 0).length;
  done('first', true);
  done('surv5', run.t >= 300);
  done('final', run.reachedFinal);
  done('miniboss', run.bosses >= 1);
  done(`win${run.gen}`, run.result === 'win');
  done('k500', run.kills >= 500);
  done('k1000', run.kills >= 1000);
  done('lv20', run.level >= 20);
  done('lv30', run.level >= 30);
  done('mega', run.mega);
  done('maxw', run.maxWeapon);
  done('full', run.weapons >= 4 && run.passives >= 4);
  done('rocks', run.rocks >= 10);
  done('untouch', run.noHit >= 180);
  done('nodash', run.result === 'win' && run.dashes === 0);
  done('starters', Object.keys(m.starters).length >= 6);
  done('dex30', dexCount >= 30);
  done('dexall', dexCount >= ALL_FOE_IDS.length);
  done('life10k', m.kills >= 10000);
  done('daily', dailyDone);
  done('legends3', Object.keys(m.legends).length >= 3);
  done('legends10', Object.keys(m.legends).length >= 10);
  done('biomes', Object.keys(m.biomes).length >= 5);
  done('rank1', run.result === 'win' && rank >= 1);
  done('rank3', run.result === 'win' && rank >= 3);
  done('rank5', run.result === 'win' && rank >= 5);
  done('dex100', dexCount >= 100);
  done('mission3', missionsDone >= 3);
  done('missions25', m.missionsDone >= 25);
  done('alpha1', alphaTotal >= 1);
  done('alpha10', alphaTotal >= 10);
  done('altar3', (run.altarsUsed || 0) >= 3);
  done('ult10', m.ults >= 10);
  done('endless12', run.endless && run.t >= 720);
  done('endless20', run.endless && run.t >= 1200);
  const bonus = unlocked.reduce((a, x) => a + x.reward, 0);
  m.dust = (m.dust || 0) + base + bonus;
  m.totalDust = (m.totalDust || 0) + base + bonus;
  saveMeta(m);
  return { meta: m, earned: base, bonus, lines, unlocked, dailyDone, rankUp: rankUp ? m.ranks[run.gen] : 0, endlessRecord };
};

export const foeName = (id) => FOES[id]?.name || id;
