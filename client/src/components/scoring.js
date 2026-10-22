/*
 * Score de fin de partie : le temps ne fait pas tout.
 * Chaque jeu additionne ce que tu as accompli (K.O., niveau, boss, captures, missions…),
 * une victoire rapporte un gros bonus (d'autant plus gros qu'elle est rapide), puis la difficulté multiplie le tout.
 * Le même calcul (version simplifiée) sert de repli côté serveur pour les anciennes parties.
 */

const line = (label, v, detail = '') => ({ label, v: Math.max(0, Math.round(v)), detail });
const total = (lines, mult = 1) => {
  const base = lines.reduce((a, l) => a + l.v, 0);
  const out = [...lines];
  if (mult > 1) out.push(line(`Difficulté ×${mult.toFixed(2)}`, base * (mult - 1)));
  return { total: Math.round(base * mult), lines: out.filter((l) => l.v > 0) };
};
const speedBonus = (t, par) => Math.max(0, (par - t) * 25);
const fr = (n) => Math.round(n || 0).toLocaleString('fr-FR');

/** Poké Swarm. par = temps de référence pour une victoire (le légendaire arrive vers 9:00). */
export const swarmScore = ({ result, t, kills, level, bosses = 0, alphaKills = 0, missions = 0, endless = false, rank = 0 }) => {
  const win = result === 'win';
  const lines = [
    line('K.O.', kills * 10, `${fr(kills)} × 10`),
    line('Niveau', level * 150, `niv. ${level} × 150`),
    line('Boss vaincus', bosses * 1500, `${bosses} × 1 500`),
    line('Pokémon Alpha', alphaKills * 1000, `${alphaKills} × 1 000`),
    line('Missions', missions * 750, `${missions} × 750`),
    endless ? line('Survie', t * 5, `${Math.floor(t)} s × 5`) : null,
    win ? line('Victoire', 6000, 'légendaire battu') : null,
    win && !endless ? line('Vitesse', speedBonus(t, 720), 'plus tu gagnes vite, plus ça monte') : null
  ].filter(Boolean);
  return total(lines, 1 + rank * 0.25);
};

/** Poké Rush. */
export const rushScore = ({ result, t, kills, level, caught = 0, bosses = 0, alphaKills = 0, missions = 0 }) => {
  const win = result === 'win';
  return total([
    line('K.O.', kills * 10, `${fr(kills)} × 10`),
    line('Niveau', level * 150, `niv. ${level} × 150`),
    line('Captures', caught * 400, `${caught} × 400`),
    line('Boss vaincus', bosses * 1500, `${bosses} × 1 500`),
    line('Pokémon Alpha', alphaKills * 1000, `${alphaKills} × 1 000`),
    line('Missions', missions * 750, `${missions} × 750`),
    win ? line('Victoire', 6000, 'légendaire de l’arène battu') : null,
    win ? line('Vitesse', speedBonus(t, 660), 'plus tu gagnes vite, plus ça monte') : null
  ].filter(Boolean));
};

/** Sonic Bonk. */
export const bonkScore = ({ result, t, kills, level, rings = 0 }) => {
  const win = result === 'win';
  return total([
    line('K.O.', kills * 10, `${fr(kills)} × 10`),
    line('Niveau', level * 150, `niv. ${level} × 150`),
    line('Anneaux', rings * 2, `${fr(rings)} × 2`),
    win ? line('Victoire', 6000, 'Colosse abattu') : null,
    win ? line('Vitesse', speedBonus(t, 660), 'plus tu gagnes vite, plus ça monte') : null
  ].filter(Boolean));
};

/** Poké Bully Tactics : on avance, on gagne des combats, on finit avec une équipe forte et des PV. */
export const arenaScore = ({ result, floor, wins = 0, level = 1, hp = 0, stars = 0 }) => {
  const win = result === 'win';
  return total([
    line('Étapes', floor * 1000, `${floor} × 1 000`),
    line('Combats gagnés', wins * 300, `${wins} × 300`),
    line('Niveau de dresseur', level * 200, `niv. ${level} × 200`),
    line('Équipe', stars * 100, `${stars} étoile${stars > 1 ? 's' : ''} × 100`),
    win ? line('Maître de la Ligue', 10000, 'Ligue conquise') : null,
    win ? line('PV restants', hp * 30, `${hp} PV × 30`) : null
  ].filter(Boolean));
};

export const fmtScore = (n) => fr(n);
