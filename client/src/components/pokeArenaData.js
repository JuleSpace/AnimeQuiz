import { FORM_TALENTS, TALENTS } from './pokeArenaTalents';
import { BALANCE } from './pokeArenaBalance';

export const TYPES = ['Feu', 'Eau', 'Plante', 'Électrik', 'Normal', 'Combat', 'Psy', 'Spectre', 'Dragon', 'Fée', 'Acier', 'Glace', 'Roche', 'Ténèbres', 'Vol', 'Sol', 'Insecte', 'Poison'];

const TYPE_CHART = {
  Feu: { Plante: 1.5, Glace: 1.4, Acier: 1.3, Insecte: 1.35, Eau: 0.7, Roche: 0.75, Dragon: 0.8 },
  Eau: { Feu: 1.5, Roche: 1.4, Sol: 1.35, Dragon: 0.85, Plante: 0.7 },
  Plante: { Eau: 1.5, Roche: 1.35, Sol: 1.3, Feu: 0.7, Insecte: 0.75 },
  Électrik: { Eau: 1.5, Vol: 1.35, Plante: 0.8, Sol: 0.5 },
  Combat: { Normal: 1.4, Acier: 1.3, Glace: 1.3, Roche: 1.3, Ténèbres: 1.25, Psy: 0.75, Spectre: 0.5, Fée: 0.75, Vol: 0.75, Insecte: 0.8, Poison: 0.8 },
  Psy: { Combat: 1.4, Poison: 1.3, Ténèbres: 0.65, Spectre: 0.7, Acier: 0.75 },
  Spectre: { Psy: 1.4, Spectre: 1.25, Normal: 0.5, Ténèbres: 0.7 },
  Dragon: { Dragon: 1.4, Fée: 0.55, Acier: 0.75 },
  Fée: { Dragon: 1.55, Combat: 1.25, Ténèbres: 1.25, Acier: 0.7, Poison: 0.75 },
  Acier: { Fée: 1.35, Roche: 1.3, Glace: 1.25, Feu: 0.7, Eau: 0.8 },
  Glace: { Dragon: 1.4, Plante: 1.3, Sol: 1.3, Vol: 1.25, Feu: 0.7 },
  Roche: { Feu: 1.3, Vol: 1.3, Insecte: 1.3, Glace: 1.25, Combat: 0.75 },
  Ténèbres: { Psy: 1.45, Spectre: 1.25, Combat: 0.75, Fée: 0.7 },
  Normal: { Roche: 0.8, Spectre: 0.5, Acier: 0.8 },
  Vol: { Plante: 1.4, Combat: 1.3, Insecte: 1.3, Électrik: 0.75, Roche: 0.75 },
  Sol: { Feu: 1.4, Électrik: 1.4, Roche: 1.3, Acier: 1.25, Plante: 0.7, Vol: 0.5 },
  Insecte: { Plante: 1.4, Psy: 1.3, Ténèbres: 1.25, Feu: 0.7, Spectre: 0.7, Acier: 0.75 },
  Poison: { Plante: 1.4, Fée: 1.3, Acier: 0.5, Sol: 0.75, Spectre: 0.75 }
};

export const typeMult = (atk, def) => (TYPE_CHART[atk] || {})[def] || 1;

/** Cases jouables par camp (7 cols × 3 rangées). */
export const BOARD_COLS = 7;
export const BOARD_ROWS_HALF = 3;
export const BOARD_SIZE = BOARD_COLS * BOARD_ROWS_HALF; // 21
export const ITEM_SLOTS = 3;
export const START_GOLD = 10;
export const START_HP = 100;

export const artworkUrl = (dex) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;
export const homeUrl = (dex) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${dex}.png`;
export const spriteUrl = (dex) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;
export const hgssUrl = (dex) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/${dex}.png`;
export const animUrl = (dex) =>
  dex <= 649
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${dex}.gif`
    : homeUrl(dex);

const S = (name, type, hp, atk, spd, dex) => {
  const types = Array.isArray(type) ? type : [type];
  return { name, type: types[0], types, hp, atk, spd, dex };
};
/** range : cases hex (1 mêlée · 2 moyen · 3+ distance). */
const L = (id, cost, traits, range, spell, stages, branch = null) => ({
  id,
  cost,
  traits,
  range,
  spell,
  stages,
  branchAt: branch?.at || null,
  forms: branch?.forms || null
});

const ROLE_TRAITS = new Set(['Starter', 'Force', 'Mage']);

const bump = (name, types, hp, atk, spd, dex, n = 1) =>
  S(`${name}${n === 1 ? ' ★' : ' ★★'}`, types, Math.round(hp * (1 + 0.5 * n)), Math.round(atk * (1 + 0.45 * n)), spd + n, dex);

/** Une seule espèce (légende, bébé final, etc.). */
const mono = (id, cost, name, types, hp, atk, spd, dex, range = 2) => L(
  id, cost, [], range,
  { name: 'Frappe', desc: 'Tous les 3 tours : 170% ATK.', every: 3, mult: 1.7, aim: 'front' },
  [S(name, types, hp, atk, spd, dex), bump(name, types, hp, atk, spd, dex, 1), bump(name, types, hp, atk, spd, dex, 2)]
);

/** Deux stades réels : le ★3 est la même forme finale, plus forte. */
const line2 = (id, cost, a, b, range = 1, roles = []) => L(
  id, cost, roles, range,
  { name: 'Frappe', desc: 'Tous les 3 tours : 175% ATK.', every: 3, mult: 1.75, aim: 'front' },
  [S(a[0], a[1], a[2], a[3], a[4], a[5]), S(b[0], b[1], b[2], b[3], b[4], b[5]), bump(b[0], b[1], b[2], b[3], b[4], b[5], 1)]
);

/** Trois stades, types propres à chacun. */
const line3 = (id, cost, a, b, c, range = 2, roles = []) => L(
  id, cost, roles, range,
  { name: 'Frappe', desc: 'Tous les 3 tours : 180% ATK.', every: 3, mult: 1.8, aim: 'front' },
  [S(a[0], a[1], a[2], a[3], a[4], a[5]), S(b[0], b[1], b[2], b[3], b[4], b[5]), S(c[0], c[1], c[2], c[3], c[4], c[5])]
);

/** Remplace le sort générique d’une lignée par un sort propre. */
const withSpell = (line, spell) => ({ ...line, spell });

/**
 * Grand roster multi-gén. Chaque run n’en tire qu’~30 pour le joueur ;
 * les ennemis piochent dans tout le catalogue.
 */
export const LINES = [
  // —— Cost 1 ——
  L('eevee', 1, ['Starter'], 1,
    { name: 'Regard Noir', desc: 'Tous les 3 tours : 160% ATK + ralentit (SPD -3).', every: 3, mult: 1.6, aim: 'front', slow: 3 },
    [S('Évoli', 'Normal', 420, 42, 14, 133)],
    { at: 2, forms: [
      { id: 'aque', stages: [S('Aquali', 'Eau', 760, 80, 14, 134), S('Aquali ★', 'Eau', 1220, 130, 15, 134)] },
      { id: 'volt', stages: [S('Voltali', 'Électrik', 720, 95, 18, 135), S('Voltali ★', 'Électrik', 1180, 150, 19, 135)] },
      { id: 'pyro', stages: [S('Pyroli', 'Feu', 740, 100, 15, 136), S('Pyroli ★', 'Feu', 1200, 155, 16, 136)] },
      { id: 'ment', stages: [S('Mentali', 'Psy', 720, 98, 16, 196), S('Mentali ★', 'Psy', 1180, 155, 17, 196)] },
      { id: 'noct', stages: [S('Noctali', 'Ténèbres', 780, 88, 16, 197), S('Noctali ★', 'Ténèbres', 1260, 138, 18, 197)] },
      { id: 'phyl', stages: [S('Phyllali', 'Plante', 800, 82, 13, 470), S('Phyllali ★', 'Plante', 1280, 130, 14, 470)] },
      { id: 'givr', stages: [S('Givrali', 'Glace', 760, 90, 15, 471), S('Givrali ★', 'Glace', 1220, 145, 16, 471)] },
      { id: 'nym', stages: [S('Nymphali', 'Fée', 760, 88, 14, 700), S('Nymphali ★', 'Fée', 1220, 140, 15, 700)] }
    ] }),
  L('fletch', 1, [], 2,
    { name: 'Acrobatie', desc: 'Tous les 2 tours : 145% ATK Vol sur une cible aléatoire.', every: 2, mult: 1.45, aim: 'random' },
    [S('Passerouge', ['Normal', 'Vol'], 340, 40, 17, 661), S('Braisillon', ['Feu', 'Vol'], 600, 72, 18, 662), S('Flambusard', ['Feu', 'Vol'], 980, 118, 20, 663)]),
  L('mudkip', 2, ['Eau', 'Starter'], 1,
    { name: 'Hydrocanon', desc: 'Tous les 3 tours : 170% ATK Eau sur le front.', every: 3, mult: 1.7, aim: 'front' },
    [S('Gobou', 'Eau', 440, 40, 12, 258), S('Flobio', ['Eau', 'Sol'], 780, 72, 13, 259), S('Laggron', ['Eau', 'Sol'], 1280, 118, 14, 260)]),
  L('shroom', 1, [], 1,
    { name: 'Mach Punch', desc: 'Tous les 2 tours : 150% ATK Combat.', every: 2, mult: 1.5, aim: 'front' },
    [S('Balignon', 'Plante', 380, 44, 13, 285), S('Chapignon', ['Plante', 'Combat'], 720, 95, 16, 286), S('Chapignon ★', ['Plante', 'Combat'], 1180, 150, 18, 286)]),
  L('magikarp', 1, [], 1,
    { name: 'Mania', desc: 'Tous les 4 tours : 220% ATK Eau.', every: 4, mult: 2.2, aim: 'random' },
    [S('Magicarpe', 'Eau', 280, 18, 20, 129), S('Léviator', ['Eau', 'Vol'], 900, 120, 14, 130), S('Léviator ★', ['Eau', 'Vol'], 1480, 185, 15, 130)]),
  L('litwick', 1, [], 3,
    { name: 'Feu Follet', desc: 'Tous les 3 tours : 165% ATK + brûle 8% PV max.', every: 3, mult: 1.65, aim: 'weak', shred: 0.08 },
    [S('Funécire', ['Spectre', 'Feu'], 360, 48, 13, 607), S('Mélancolux', ['Spectre', 'Feu'], 680, 90, 14, 608), S('Lugulabre', ['Spectre', 'Feu'], 1120, 148, 15, 609)]),
  L('bidoof', 1, ['Normal'], 1,
    { name: 'Mâchouille', desc: 'Tous les 3 tours : 155% ATK Normal.', every: 3, mult: 1.55, aim: 'front' },
    [S('Keunotor', 'Normal', 400, 36, 11, 399), S('Castorno', ['Normal', 'Eau'], 760, 70, 12, 400), S('Castorno ★', ['Normal', 'Eau'], 1200, 115, 13, 400)]),
  L('wooper', 1, [], 1,
    { name: 'Séisme', desc: 'Tous les 4 tours : 170% ATK Sol zone.', every: 4, mult: 1.7, aim: 'aoe2' },
    [S('Axoloto', ['Eau', 'Sol'], 420, 34, 10, 194), S('Maraiste', ['Eau', 'Sol'], 820, 78, 11, 195), S('Maraiste ★', ['Eau', 'Sol'], 1300, 125, 12, 195)]),
  L('mareep', 1, ['Électrik'], 3,
    { name: 'Tonnerre', desc: 'Tous les 3 tours : 165% ATK Électrik.', every: 3, mult: 1.65, aim: 'random' },
    [S('Wattouat', 'Électrik', 360, 44, 12, 179), S('Lainergie', 'Électrik', 680, 82, 13, 180), S('Pharamp', 'Électrik', 1120, 135, 14, 181)]),
  L('azurill', 1, ['Fée', 'Eau'], 2,
    { name: 'Bulles d’O', desc: 'Tous les 3 tours : 150% ATK + soigne 6%.', every: 3, mult: 1.5, aim: 'front', healAlly: 0.06 },
    [S('Azurill', ['Normal', 'Fée'], 380, 32, 11, 298), S('Marill', ['Eau', 'Fée'], 720, 68, 12, 183), S('Azumarill', ['Eau', 'Fée'], 1220, 118, 13, 184)]),
  L('rowlet', 1, ['Starter'], 2,
    { name: 'Feuille Magik', desc: 'Tous les 3 tours : 160% ATK sur le faible.', every: 3, mult: 1.6, aim: 'weak' },
    [S('Brindibou', ['Plante', 'Vol'], 400, 42, 13, 722), S('Efflèche', ['Plante', 'Vol'], 740, 80, 14, 723)],
    { at: 3, forms: [
      { id: 'alola', stages: [S('Archéduc', ['Plante', 'Spectre'], 1200, 138, 15, 724)] },
      { id: 'hisui', stages: [S('Archéduc de Hisui', ['Plante', 'Combat'], 1220, 145, 16, 10244)] }
    ] }),
  L('cynda', 2, ['Starter'], 2,
    { name: 'Déflagration', desc: 'Tous les 3 tours : 190% ATK, ignore 12% PV.', every: 3, mult: 1.9, aim: 'random', shred: 0.12 },
    [S('Héricendre', 'Feu', 400, 52, 14, 155), S('Feurisson', 'Feu', 740, 92, 15, 156)],
    { at: 3, forms: [
      { id: 'johto', stages: [S('Typhlosion', 'Feu', 1180, 150, 16, 157)] },
      { id: 'hisui', stages: [S('Typhlosion de Hisui', ['Feu', 'Spectre'], 1200, 155, 17, 10233)] }
    ] }),
  L('chinchou', 2, [], 3,
    { name: 'Luminocanon', desc: 'Tous les 3 tours : 175% ATK Électrik + slow 2.', every: 3, mult: 1.75, aim: 'front', slow: 2 },
    [S('Loupio', ['Eau', 'Électrik'], 450, 48, 12, 170), S('Lanturn', ['Eau', 'Électrik'], 820, 88, 13, 171), S('Lanturn ★', ['Eau', 'Électrik'], 1320, 140, 14, 171)]),
  L('gastly', 2, [], 3,
    { name: 'Ball’Ombre', desc: 'Tous les 3 tours : 185% ATK, ignore 18% PV.', every: 3, mult: 1.85, aim: 'random', shred: 0.18 },
    [S('Fantominus', ['Spectre', 'Poison'], 320, 66, 17, 92), S('Spectrum', ['Spectre', 'Poison'], 580, 108, 19, 93), S('Ectoplasma', ['Spectre', 'Poison'], 960, 165, 21, 94)]),
  L('scyther', 2, [], 1,
    { name: 'Plaie-Croix', desc: 'Tous les 3 tours : 180% ATK sur le front.', every: 3, mult: 1.8, aim: 'front' },
    [S('Insécateur', ['Insecte', 'Vol'], 420, 62, 18, 123)],
    { at: 2, forms: [
      { id: 'scizor', stages: [S('Cizayox', ['Insecte', 'Acier'], 800, 118, 16, 212), S('Cizayox ★', ['Insecte', 'Acier'], 1300, 180, 17, 212)] },
      { id: 'kleavor', stages: [S('Hachécateur', ['Insecte', 'Roche'], 820, 125, 15, 900), S('Hachécateur ★', ['Insecte', 'Roche'], 1320, 185, 16, 900)] }
    ] }),
  L('sneasel', 2, [], 1,
    { name: 'Triple Axel', desc: 'Tous les 3 tours : 185% ATK Glace sur le backline.', every: 3, mult: 1.85, aim: 'back' },
    [S('Farfuret', ['Ténèbres', 'Glace'], 380, 64, 19, 215)],
    { at: 2, forms: [
      { id: 'johto', stages: [S('Dimoret', ['Ténèbres', 'Glace'], 740, 120, 20, 461), S('Dimoret ★', ['Ténèbres', 'Glace'], 1200, 185, 21, 461)] },
      { id: 'hisui', stages: [S('Farfurex', ['Combat', 'Poison'], 760, 125, 19, 903), S('Farfurex ★', ['Combat', 'Poison'], 1240, 190, 20, 903)] }
    ] }),
  L('riolu', 2, ['Force'], 2,
    { name: 'Aurasphère', desc: 'Tous les 3 tours : 190% ATK qui touche le back.', every: 3, mult: 1.9, aim: 'back' },
    [S('Riolu', 'Combat', 420, 60, 16, 447), S('Lucario', ['Combat', 'Acier'], 820, 125, 18, 448), S('Lucario ★', ['Combat', 'Acier'], 1340, 192, 20, 448)]),
  L('mankey', 2, [], 1,
    { name: 'Poing de Rage', desc: 'Tous les 3 tours : 200% ATK.', every: 3, mult: 2.0, aim: 'front' },
    [S('Férosinge', 'Combat', 400, 58, 15, 56), S('Colossinge', 'Combat', 760, 105, 14, 57), S('Courrousinge', ['Combat', 'Spectre'], 1240, 170, 16, 979)]),
  L('growlithe', 2, ['Feu'], 1,
    { name: 'Lance-Flammes', desc: 'Tous les 3 tours : 175% ATK Feu.', every: 3, mult: 1.75, aim: 'front' },
    [S('Caninos', 'Feu', 420, 56, 14, 58)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Arcanin', 'Feu', 820, 110, 15, 59), S('Arcanin ★', 'Feu', 1340, 170, 16, 59)] },
      { id: 'hisui', stages: [S('Arcanin de Hisui', ['Feu', 'Roche'], 860, 115, 14, 10230), S('Arcanin de Hisui ★', ['Feu', 'Roche'], 1400, 175, 15, 10230)] }
    ] }),
  L('abra', 2, ['Psy', 'Mage'], 3,
    { name: 'Psyko', desc: 'Tous les 3 tours : 190% ATK Psy sur le faible.', every: 3, mult: 1.9, aim: 'weak' },
    [S('Abra', 'Psy', 300, 70, 18, 63), S('Kadabra', 'Psy', 560, 115, 20, 64), S('Alakazam', 'Psy', 920, 175, 22, 65)]),
  L('trapinch', 2, ['Sol', 'Dragon'], 1,
    { name: 'Séisme', desc: 'Tous les 4 tours : 185% ATK Sol.', every: 4, mult: 1.85, aim: 'aoe2' },
    [S('Kraknoix', 'Sol', 400, 54, 11, 328), S('Vibraninf', ['Sol', 'Dragon'], 740, 95, 14, 329), S('Libégon', ['Sol', 'Dragon'], 1220, 155, 16, 330)]),
  L('roserade', 2, [], 3,
    { name: 'Tempête Florale', desc: 'Tous les 3 tours : 170% ATK Plante ×2.', every: 3, mult: 1.7, aim: 'aoe2' },
    [S('Rozbouton', ['Plante', 'Poison'], 360, 50, 14, 406), S('Rosélia', ['Plante', 'Poison'], 640, 90, 15, 315), S('Roserade', ['Plante', 'Poison'], 1100, 155, 17, 407)]),
  // —— Cost 3 ——
  L('ralts', 3, [], 3,
    { name: 'Pouvoir Lunaire', desc: 'Tous les 3 tours : 180% ATK en zone (2 cibles).', every: 3, mult: 1.8, aim: 'aoe2' },
    [S('Tarsal', ['Psy', 'Fée'], 400, 58, 14, 280), S('Kirlia', ['Psy', 'Fée'], 740, 102, 16, 281)],
    { at: 3, forms: [
      { id: 'garde', stages: [S('Gardevoir', ['Psy', 'Fée'], 1200, 162, 18, 282)] },
      { id: 'gall', stages: [S('Gallame', ['Psy', 'Combat'], 1220, 168, 17, 475)] }
    ] }),
  L('toxel', 3, [], 2,
    { name: 'Overdrive', desc: 'Tous les 3 tours : 185% ATK Électrik à 2 cibles.', every: 3, mult: 1.85, aim: 'aoe2' },
    [S('Toxizap', ['Électrik', 'Poison'], 420, 62, 14, 848)],
    { at: 2, forms: [
      { id: 'aigue', stages: [S('Salarsen (Aigüe)', ['Électrik', 'Poison'], 820, 120, 15, 849), S('Salarsen (Aigüe) ★', ['Électrik', 'Poison'], 1340, 185, 16, 849)] },
      { id: 'grave', stages: [S('Salarsen (Grave)', ['Électrik', 'Poison'], 860, 115, 14, 10184), S('Salarsen (Grave) ★', ['Électrik', 'Poison'], 1400, 178, 15, 10184)] }
    ] }),
  L('zorua-h', 3, [], 2,
    { name: 'Rancune', desc: 'Tous les 3 tours : 190% ATK Spectre + shred 10%.', every: 3, mult: 1.9, aim: 'weak', shred: 0.1 },
    [S('Zorua de Hisui', ['Spectre', 'Normal'], 400, 68, 16, 10238), S('Zoroark de Hisui', ['Spectre', 'Normal'], 780, 128, 18, 10239), S('Zoroark de Hisui ★', ['Spectre', 'Normal'], 1280, 195, 19, 10239)]),
  L('honedge', 3, [], 1,
    { name: 'Bouclier Royal', desc: 'Tous les 4 tours : 170% ATK + bouclier 15% PV.', every: 4, mult: 1.7, aim: 'front', shield: 0.15 },
    [S('Monorpale', ['Acier', 'Spectre'], 440, 60, 12, 679), S('Dimoclès', ['Acier', 'Spectre'], 820, 110, 13, 680), S('Exagide', ['Acier', 'Spectre'], 1340, 170, 14, 681)]),
  L('gligar', 3, [], 1,
    { name: 'Guillotine', desc: 'Tous les 4 tours : 210% ATK Sol sur le tank.', every: 4, mult: 2.1, aim: 'tank' },
    [S('Scorvol', ['Sol', 'Vol'], 460, 58, 15, 207), S('Scorvol ★', ['Sol', 'Vol'], 700, 90, 16, 207), S('Scorpenac', ['Sol', 'Vol'], 1220, 155, 17, 472)]),
  L('spheal', 3, [], 2,
    { name: 'Blizzard', desc: 'Tous les 4 tours : 160% ATK Glace ×2 + slow.', every: 4, mult: 1.6, aim: 'aoe2', slow: 2 },
    [S('Obalie', ['Glace', 'Eau'], 500, 48, 10, 363), S('Phogleur', ['Glace', 'Eau'], 880, 85, 11, 364), S('Kaimorse', ['Glace', 'Eau'], 1420, 135, 12, 365)]),
  L('mimikyu', 3, [], 1,
    { name: 'Câlinerie', desc: 'Tous les 3 tours : 195% ATK Fée.', every: 3, mult: 1.95, aim: 'front' },
    [S('Mimiqui', ['Spectre', 'Fée'], 480, 70, 15, 778), S('Mimiqui ★', ['Spectre', 'Fée'], 860, 125, 16, 778), S('Mimiqui ★★', ['Spectre', 'Fée'], 1380, 188, 17, 778)]),
  L('noibat', 3, ['Vol', 'Dragon'], 2,
    { name: 'Ouragan', desc: 'Tous les 3 tours : 175% ATK Vol ×2.', every: 3, mult: 1.75, aim: 'aoe2' },
    [S('Sonistrelle', ['Vol', 'Dragon'], 380, 58, 17, 714), S('Bruyverne', ['Vol', 'Dragon'], 820, 125, 18, 715), S('Bruyverne ★', ['Vol', 'Dragon'], 1340, 185, 19, 715)]),
  L('tinkatink', 3, [], 1,
    { name: 'Gigamarteau', desc: 'Tous les 3 tours : 190% ATK Acier.', every: 3, mult: 1.9, aim: 'front' },
    [S('Forgerette', ['Fée', 'Acier'], 420, 55, 13, 957), S('Forgella', ['Fée', 'Acier'], 800, 105, 13, 958), S('Forgelina', ['Fée', 'Acier'], 1320, 168, 14, 959)]),
  L('misdreavus', 3, ['Spectre'], 3,
    { name: 'Ball’Ombre', desc: 'Tous les 3 tours : 180% ATK Spectre.', every: 3, mult: 1.8, aim: 'random' },
    [S('Feuforêve', 'Spectre', 400, 64, 15, 200), S('Magirêve', 'Spectre', 820, 125, 16, 429), S('Magirêve ★', 'Spectre', 1340, 188, 17, 429)]),
  // —— Cost 4 ——
  L('charcadet', 4, [], 1,
    { name: 'Lame Amère', desc: 'Tous les 3 tours : 200% ATK.', every: 3, mult: 2.0, aim: 'front' },
    [S('Charbambin', 'Feu', 460, 72, 14, 935)],
    { at: 2, forms: [
      { id: 'arma', stages: [S('Carmadura', ['Feu', 'Psy'], 900, 140, 14, 936), S('Carmadura ★', ['Feu', 'Psy'], 1450, 205, 15, 936)] },
      { id: 'ceru', stages: [S('Malvalame', ['Feu', 'Spectre'], 880, 150, 16, 937), S('Malvalame ★', ['Feu', 'Spectre'], 1420, 215, 17, 937)] }
    ] }),
  L('dreepy', 4, [], 3,
    { name: 'Draco-Flèches', desc: 'Tous les 3 tours : 2× 120% ATK Dragon.', every: 3, mult: 1.2, aim: 'aoe2' },
    [S('Fantyrm', ['Dragon', 'Spectre'], 380, 70, 18, 885), S('Dispareptil', ['Dragon', 'Spectre'], 780, 125, 17, 886), S('Lanssorien', ['Dragon', 'Spectre'], 1320, 195, 19, 887)]),
  L('rookidee', 4, [], 1,
    { name: 'Plaquage', desc: 'Tous les 3 tours : 185% ATK.', every: 3, mult: 1.85, aim: 'front' },
    [S('Minisange', 'Vol', 420, 58, 15, 821), S('Bleuseille', 'Vol', 820, 105, 14, 822), S('Corvaillus', ['Vol', 'Acier'], 1400, 165, 13, 823)]),
  L('dratini', 4, [], 2,
    { name: 'Draco-Météore', desc: 'Tous les 4 tours : 210% ATK Dragon zone.', every: 4, mult: 2.1, aim: 'aoe2' },
    [S('Minidraco', 'Dragon', 500, 68, 13, 147), S('Draco', 'Dragon', 920, 120, 14, 148), S('Dracolosse', ['Dragon', 'Vol'], 1520, 188, 15, 149)]),
  L('beldum', 4, [], 2,
    { name: 'Poing Météore', desc: 'Tous les 4 tours : 220% ATK Acier sur le tank.', every: 4, mult: 2.2, aim: 'tank' },
    [S('Terhal', ['Acier', 'Psy'], 520, 75, 12, 374), S('Métang', ['Acier', 'Psy'], 960, 132, 13, 375), S('Métalosse', ['Acier', 'Psy'], 1580, 205, 14, 376)]),
  L('tyrunt', 4, [], 1,
    { name: 'Fracass’Tête', desc: 'Tous les 4 tours : 230% ATK Roche sur le front.', every: 4, mult: 2.3, aim: 'front' },
    [S('Ptyranidur', ['Roche', 'Dragon'], 540, 78, 11, 696), S('Rexillius', ['Roche', 'Dragon'], 1000, 145, 12, 697), S('Rexillius ★', ['Roche', 'Dragon'], 1600, 210, 13, 697)]),
  L('pawniard', 4, [], 1,
    { name: 'Tête de Fer', desc: 'Tous les 3 tours : 195% ATK Acier + stun.', every: 3, mult: 1.95, aim: 'front', stun: true },
    [S('Scalpion', ['Ténèbres', 'Acier'], 440, 72, 14, 624), S('Scalproie', ['Ténèbres', 'Acier'], 860, 135, 15, 625), S('Scalpereur', ['Ténèbres', 'Acier'], 1420, 205, 16, 983)]),
  L('gible', 4, [], 1,
    { name: 'Draco-Charge', desc: 'Tous les 3 tours : 200% ATK Dragon.', every: 3, mult: 2.0, aim: 'front' },
    [S('Griknot', ['Dragon', 'Sol'], 520, 74, 12, 443), S('Carmache', ['Dragon', 'Sol'], 960, 130, 13, 444), S('Carchacrok', ['Dragon', 'Sol'], 1560, 200, 15, 445)]),
  L('larvesta', 4, [], 2,
    { name: 'Danse du Feu', desc: 'Tous les 3 tours : 195% ATK Feu ×2.', every: 3, mult: 1.95, aim: 'aoe2' },
    [S('Pyronille', ['Insecte', 'Feu'], 480, 78, 13, 636), S('Pyrax', ['Insecte', 'Feu'], 920, 145, 15, 637), S('Pyrax ★', ['Insecte', 'Feu'], 1500, 215, 16, 637)]),
  L('frigibax', 4, [], 1,
    { name: 'Glaciation', desc: 'Tous les 3 tours : 195% ATK Glace.', every: 3, mult: 1.95, aim: 'front' },
    [S('Frigodo', ['Dragon', 'Glace'], 500, 72, 12, 996), S('Cryodo', ['Dragon', 'Glace'], 920, 130, 13, 997), S('Glaivodo', ['Dragon', 'Glace'], 1520, 200, 14, 998)]),
  // —— Cost 5 ——
  L('froakie', 3, ['Eau', 'Ténèbres', 'Starter'], 2,
    { name: 'Sheauriken', desc: 'Tous les 3 tours : 215% ATK sur le faible.', every: 3, mult: 2.15, aim: 'weak' },
    [S('Grenousse', 'Eau', 480, 80, 17, 656), S('Croâporal', 'Eau', 900, 140, 18, 657), S('Amphinobi', ['Eau', 'Ténèbres'], 1480, 215, 20, 658)]),
  L('ironval', 5, [], 2,
    { name: 'Choc Émotionnel', desc: 'Tous les 3 tours : 210% ATK Fée ×2.', every: 3, mult: 2.1, aim: 'aoe2' },
    [S('Garde-de-Fer', ['Fée', 'Combat'], 700, 110, 16, 1006), S('Garde-de-Fer ★', ['Fée', 'Combat'], 1150, 170, 17, 1006), S('Garde-de-Fer ★★', ['Fée', 'Combat'], 1750, 240, 18, 1006)]),
  L('celebi', 5, [], 3,
    { name: 'Soin', desc: 'Tous les 3 tours : soigne 20% + 150% ATK Psy.', every: 3, mult: 1.5, aim: 'random', healAlly: 0.2 },
    [S('Celebi', ['Psy', 'Plante'], 720, 95, 15, 251), S('Celebi ★', ['Psy', 'Plante'], 1180, 150, 16, 251), S('Celebi ★★', ['Psy', 'Plante'], 1780, 220, 17, 251)]),
  L('dialga', 5, [], 3,
    { name: 'Hurle-Temps', desc: 'Tous les 4 tours : 240% ATK Dragon à tous.', every: 4, mult: 2.4, aim: 'all' },
    [S('Dialga', ['Acier', 'Dragon'], 800, 105, 12, 483), S('Dialga ★', ['Acier', 'Dragon'], 1300, 170, 13, 483), S('Dialga ★★', ['Acier', 'Dragon'], 1950, 250, 14, 483)]),
  L('mew', 5, ['Psy', 'Mage'], 3,
    { name: 'Psyko Boost', desc: 'Tous les 3 tours : 225% ATK Psy sur le faible.', every: 3, mult: 2.25, aim: 'weak' },
    [S('Mew', 'Psy', 680, 100, 16, 151), S('Mew ★', 'Psy', 1120, 160, 17, 151), S('Mew ★★', 'Psy', 1700, 235, 18, 151)]),
  L('pheromosa', 5, ['Insecte', 'Combat'], 2,
    { name: 'Pied Voltige', desc: 'Tous les 2 tours : 200% ATK Combat.', every: 2, mult: 2.0, aim: 'front' },
    [S('Cancrelove', ['Insecte', 'Combat'], 560, 120, 22, 795), S('Cancrelove ★', ['Insecte', 'Combat'], 980, 185, 23, 795), S('Cancrelove ★★', ['Insecte', 'Combat'], 1550, 260, 24, 795)]),
  L('darkrai', 5, ['Ténèbres'], 3,
    { name: 'Trou Noir', desc: 'Tous les 3 tours : 220% ATK Ténèbres + slow.', every: 3, mult: 2.2, aim: 'weak', slow: 3 },
    [S('Darkrai', 'Ténèbres', 700, 115, 17, 491), S('Darkrai ★', 'Ténèbres', 1180, 180, 18, 491), S('Darkrai ★★', 'Ténèbres', 1800, 250, 19, 491)]),
  L('lugia', 5, ['Psy', 'Vol'], 3,
    { name: 'Aéroblast', desc: 'Tous les 4 tours : 230% ATK Vol ×2.', every: 4, mult: 2.3, aim: 'aoe2' },
    [S('Lugia', ['Psy', 'Vol'], 820, 100, 14, 249), S('Lugia ★', ['Psy', 'Vol'], 1350, 165, 15, 249), S('Lugia ★★', ['Psy', 'Vol'], 2000, 240, 16, 249)]),
  L('axew', 5, ['Dragon', 'Force'], 1,
    { name: 'Colère', desc: 'Tous les 3 tours : 220% ATK Dragon front.', every: 3, mult: 2.2, aim: 'front' },
    [S('Coupenotte', 'Dragon', 580, 88, 14, 610), S('Incisache', 'Dragon', 1020, 150, 15, 611), S('Tranchodon', 'Dragon', 1680, 220, 17, 612)]),

  // —— Grille des types (extra) ——
  L('charmander', 2, ['Feu', 'Vol', 'Starter'], 1,
    { name: 'Déflagration', desc: 'Tous les 3 tours : 180% ATK Feu zone.', every: 3, mult: 1.8, aim: 'aoe2' },
    [S('Salamèche', 'Feu', 400, 54, 14, 4), S('Reptincel', 'Feu', 760, 98, 15, 5), S('Dracaufeu', ['Feu', 'Vol'], 1280, 160, 17, 6)]),
  L('sprigatito', 3, ['Starter'], 2,
    { name: 'Magie Florale', desc: 'Tous les 3 tours : 185% ATK sur le faible.', every: 3, mult: 1.85, aim: 'weak' },
    [S('Poussacha', 'Plante', 390, 52, 16, 906), S('Matourgeon', 'Plante', 740, 95, 17, 907), S('Miascarade', ['Plante', 'Ténèbres'], 1220, 158, 19, 908)]),
  L('torchic', 3, ['Starter'], 1,
    { name: 'Pied Brûleur', desc: 'Tous les 3 tours : 185% ATK Combat.', every: 3, mult: 1.85, aim: 'front' },
    [S('Poussifeu', 'Feu', 390, 56, 15, 255), S('Galifeu', ['Feu', 'Combat'], 740, 105, 16, 256), S('Braségali', ['Feu', 'Combat'], 1240, 168, 17, 257)]),
  L('totodile', 1, ['Eau', 'Starter'], 1,
    { name: 'Cascade', desc: 'Tous les 3 tours : 165% ATK Eau.', every: 3, mult: 1.65, aim: 'front' },
    [S('Kaiminus', 'Eau', 430, 44, 12, 158), S('Crocrodil', 'Eau', 780, 82, 13, 159), S('Aligatueur', 'Eau', 1280, 135, 14, 160)]),
  L('snivy', 2, ['Plante', 'Starter'], 2,
    { name: 'Nœud Herbe', desc: 'Tous les 3 tours : 175% ATK Plante + slow.', every: 3, mult: 1.75, aim: 'front', slow: 2 },
    [S('Vipélierre', 'Plante', 380, 48, 15, 495), S('Lianaja', 'Plante', 720, 90, 16, 496), S('Majaspic', 'Plante', 1200, 148, 17, 497)]),
  L('grubbin', 1, ['Insecte', 'Électrik'], 3,
    { name: 'Éclair Fou', desc: 'Tous les 3 tours : 160% ATK Électrik.', every: 3, mult: 1.6, aim: 'random' },
    [S('Larvibule', 'Insecte', 360, 42, 13, 736), S('Chrysapile', ['Insecte', 'Électrik'], 680, 78, 12, 737), S('Lucanon', ['Insecte', 'Électrik'], 1120, 140, 14, 738)]),
  L('cubone', 2, [], 1,
    { name: 'Osmerang', desc: 'Tous les 3 tours : 180% ATK.', every: 3, mult: 1.8, aim: 'front' },
    [S('Osselait', 'Sol', 420, 50, 12, 104)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Ossatueur', 'Sol', 800, 100, 13, 105), S('Ossatueur ★', 'Sol', 1280, 155, 14, 105)] },
      { id: 'alola', stages: [S('Ossatueur d’Alola', ['Feu', 'Spectre'], 820, 110, 14, 10115), S('Ossatueur d’Alola ★', ['Feu', 'Spectre'], 1300, 165, 15, 10115)] }
    ] }),
  L('clodsire', 2, [], 1,
    { name: 'Toxik', desc: 'Tous les 3 tours : 170% ATK Poison + shred 8%.', every: 3, mult: 1.7, aim: 'front', shred: 0.08 },
    [S('Axoloto de Paldea', ['Poison', 'Sol'], 460, 40, 10, 10253), S('Terraiste', ['Poison', 'Sol'], 900, 85, 11, 980), S('Terraiste ★', ['Poison', 'Sol'], 1400, 135, 12, 980)]),
  L('gholdengo', 4, [], 3,
    { name: 'Ruée d’Or', desc: 'Tous les 3 tours : 200% ATK Acier ×2.', every: 3, mult: 2.0, aim: 'aoe2' },
    [S('Mordudor', 'Spectre', 480, 70, 13, 999), S('Gromago', ['Acier', 'Spectre'], 920, 135, 14, 1000), S('Gromago ★', ['Acier', 'Spectre'], 1500, 205, 15, 1000)]),
  L('lilligant', 3, [], 1,
    { name: 'Danse-Lames', desc: 'Tous les 3 tours : 190% ATK.', every: 3, mult: 1.9, aim: 'front', selfAtk: 0.1 },
    [S('Chlorobule', 'Plante', 400, 48, 14, 548)],
    { at: 2, forms: [
      { id: 'unova', stages: [S('Fragilady', 'Plante', 780, 110, 15, 549), S('Fragilady ★', 'Plante', 1240, 165, 16, 549)] },
      { id: 'hisui', stages: [S('Fragilady de Hisui', ['Plante', 'Combat'], 820, 125, 17, 10237), S('Fragilady de Hisui ★', ['Plante', 'Combat'], 1300, 180, 18, 10237)] }
    ] }),
  L('drifloon', 1, ['Spectre', 'Vol'], 3,
    { name: 'Ball’Ombre', desc: 'Tous les 3 tours : 155% ATK Spectre.', every: 3, mult: 1.55, aim: 'random' },
    [S('Baudrive', ['Spectre', 'Vol'], 380, 44, 14, 425), S('Grodrive', ['Spectre', 'Vol'], 820, 95, 15, 426), S('Grodrive ★', ['Spectre', 'Vol'], 1300, 150, 16, 426)]),
  L('sableye', 2, [], 1,
    { name: 'Regard Noir', desc: 'Tous les 3 tours : 170% ATK + stun.', every: 3, mult: 1.7, aim: 'front', stun: true },
    [S('Ténéfix', ['Ténèbres', 'Spectre'], 420, 52, 13, 302), S('Ténéfix ★', ['Ténèbres', 'Spectre'], 800, 100, 14, 302), S('Ténéfix ★★', ['Ténèbres', 'Spectre'], 1280, 155, 15, 302)]),
  L('mawile', 2, [], 1,
    { name: 'Câlinerie', desc: 'Tous les 3 tours : 175% ATK Fée.', every: 3, mult: 1.75, aim: 'front' },
    [S('Mysdibule', ['Acier', 'Fée'], 440, 55, 12, 303), S('Mysdibule ★', ['Acier', 'Fée'], 820, 105, 13, 303), S('Mysdibule ★★', ['Acier', 'Fée'], 1320, 165, 14, 303)]),
  L('absol', 3, ['Ténèbres'], 1,
    { name: 'Tranche-Nuit', desc: 'Tous les 3 tours : 195% ATK Ténèbres sur le faible.', every: 3, mult: 1.95, aim: 'weak' },
    [S('Absol', 'Ténèbres', 480, 78, 16, 359), S('Absol ★', 'Ténèbres', 900, 140, 17, 359), S('Absol ★★', 'Ténèbres', 1450, 210, 18, 359)]),
  L('aron', 2, ['Acier', 'Roche'], 1,
    { name: 'Tête de Fer', desc: 'Tous les 3 tours : 175% ATK Acier.', every: 3, mult: 1.75, aim: 'front' },
    [S('Galekid', ['Acier', 'Roche'], 460, 48, 10, 304), S('Galegon', ['Acier', 'Roche'], 880, 95, 11, 305), S('Galeking', ['Acier', 'Roche'], 1450, 155, 12, 306)]),
  L('bagon', 3, ['Dragon'], 1,
    { name: 'Draco-Charge', desc: 'Tous les 3 tours : 190% ATK Dragon.', every: 3, mult: 1.9, aim: 'front' },
    [S('Draby', 'Dragon', 440, 60, 13, 371), S('Drackhaus', 'Dragon', 840, 115, 14, 372), S('Drattak', 'Dragon', 1400, 180, 16, 373)]),
  L('deino', 3, ['Ténèbres', 'Dragon'], 1,
    { name: 'Mâchouille', desc: 'Tous les 3 tours : 185% ATK Ténèbres.', every: 3, mult: 1.85, aim: 'front' },
    [S('Solochi', ['Ténèbres', 'Dragon'], 450, 62, 12, 633), S('Diamat', ['Ténèbres', 'Dragon'], 860, 118, 13, 634), S('Trioxhydre', ['Ténèbres', 'Dragon'], 1420, 185, 14, 635)]),
  L('shaymin', 5, [], 3,
    { name: 'Fulmigraine', desc: 'Tous les 3 tours : soigne 12% + 180% ATK Plante.', every: 3, mult: 1.8, aim: 'weak', healAlly: 0.12 },
    [S('Shaymin', 'Plante', 700, 100, 15, 492), S('Shaymin ★', 'Plante', 1150, 155, 16, 492), S('Shaymin ★★', 'Plante', 1750, 220, 17, 492)]),
  L('zapdos', 5, [], 3,
    { name: 'Fatal-Foudre', desc: 'Tous les 3 tours : 220% ATK Électrik.', every: 3, mult: 2.2, aim: 'random' },
    [S('Électhor', ['Électrik', 'Vol'], 760, 115, 16, 145)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Électhor ★', ['Électrik', 'Vol'], 1250, 180, 17, 145), S('Électhor ★★', ['Électrik', 'Vol'], 1900, 255, 18, 145)] },
      { id: 'galar', stages: [S('Électhor de Galar', ['Combat', 'Vol'], 1280, 185, 18, 10170), S('Électhor de Galar ★', ['Combat', 'Vol'], 1940, 260, 19, 10170)] }
    ] }),
  L('rayquaza', 5, [], 2,
    { name: 'Draco-Météore', desc: 'Tous les 3 tours : 230% ATK Dragon zone.', every: 3, mult: 2.3, aim: 'aoe2' },
    [S('Rayquaza', ['Dragon', 'Vol'], 780, 120, 16, 384), S('Rayquaza ★', ['Dragon', 'Vol'], 1280, 190, 17, 384), S('Rayquaza ★★', ['Dragon', 'Vol'], 1950, 265, 18, 384)]),
  L('raichu', 2, [], 3,
    { name: 'Tonnerre', desc: 'Tous les 2 tours : 160% ATK Électrik.', every: 2, mult: 1.6, aim: 'random' },
    [S('Pikachu', 'Électrik', 340, 52, 18, 25)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Raichu', 'Électrik', 780, 115, 17, 26), S('Raichu ★', 'Électrik', 1240, 170, 18, 26)] },
      { id: 'alola', stages: [S('Raichu d’Alola', ['Électrik', 'Psy'], 800, 120, 17, 10100), S('Raichu d’Alola ★', ['Électrik', 'Psy'], 1280, 175, 18, 10100)] }
    ] }),
  L('spinda', 1, ['Normal'], 1,
    { name: 'Poing Surprise', desc: 'Tous les 3 tours : 150% ATK Normal aléatoire.', every: 3, mult: 1.5, aim: 'random' },
    [S('Spinda', 'Normal', 400, 40, 14, 327), S('Spinda ★', 'Normal', 760, 78, 15, 327), S('Spinda ★★', 'Normal', 1200, 125, 16, 327)]),
  L('greavard', 1, ['Spectre'], 1,
    { name: 'Chien de Garde', desc: 'Tous les 3 tours : 160% ATK Spectre + bouclier 8%.', every: 3, mult: 1.6, aim: 'front', shield: 0.08 },
    [S('Toutombe', 'Spectre', 420, 42, 12, 971), S('Tomberro', 'Spectre', 860, 95, 12, 972), S('Tomberro ★', 'Spectre', 1380, 150, 13, 972)]),
  L('cetoddle', 2, ['Glace'], 1,
    { name: 'Avalanche', desc: 'Tous les 3 tours : 175% ATK Glace.', every: 3, mult: 1.75, aim: 'front' },
    [S('Piétacé', 'Glace', 500, 48, 10, 974), S('Balbalèze', 'Glace', 980, 105, 11, 975), S('Balbalèze ★', 'Glace', 1550, 165, 12, 975)]),
  L('capsakid', 1, ['Plante', 'Feu'], 2,
    { name: 'Lance-Flammes', desc: 'Tous les 3 tours : 155% ATK Feu.', every: 3, mult: 1.55, aim: 'front' },
    [S('Pimito', 'Plante', 360, 46, 14, 951), S('Scovilain', ['Plante', 'Feu'], 780, 120, 15, 952), S('Scovilain ★', ['Plante', 'Feu'], 1260, 180, 16, 952)]),
  L('flamigo', 3, [], 1,
    { name: 'Pied Voltige', desc: 'Tous les 3 tours : 190% ATK Combat.', every: 3, mult: 1.9, aim: 'front' },
    [S('Flamenroule', ['Vol', 'Combat'], 460, 70, 16, 973), S('Flamenroule ★', ['Vol', 'Combat'], 880, 130, 17, 973), S('Flamenroule ★★', ['Vol', 'Combat'], 1420, 195, 18, 973)]),
  L('applin', 2, [], 2,
    { name: 'Canon Graine', desc: 'Tous les 3 tours : 170% ATK Dragon.', every: 3, mult: 1.7, aim: 'front' },
    [S('Verpom', ['Plante', 'Dragon'], 380, 44, 12, 840)],
    { at: 2, forms: [
      { id: 'flapple', stages: [S('Pomdrapi', ['Plante', 'Dragon'], 800, 120, 16, 841), S('Pomdrapi ★', ['Plante', 'Dragon'], 1280, 175, 17, 841)] },
      { id: 'appletun', stages: [S('Dratatin', ['Plante', 'Dragon'], 900, 95, 11, 842), S('Dratatin ★', ['Plante', 'Dragon'], 1400, 145, 12, 842)] },
      { id: 'dipplin', stages: [S('Pomdramour', ['Plante', 'Dragon'], 860, 100, 10, 1011), S('Pomdorochi', ['Plante', 'Dragon'], 1420, 150, 11, 1019)] }
    ] }),
  L('bulbasaur', 2, ['Starter'], 2,
    { name: 'Giga-Sangsue', desc: 'Tous les 3 tours : 170% ATK + soin allié 8%.', every: 3, mult: 1.7, aim: 'front', healAlly: 0.08 },
    [S('Bulbizarre', ['Plante', 'Poison'], 420, 48, 12, 1), S('Herbizarre', ['Plante', 'Poison'], 780, 90, 13, 2), S('Florizarre', ['Plante', 'Poison'], 1300, 145, 14, 3)]),
  L('squirtle', 1, ['Eau', 'Starter'], 1,
    { name: 'Hydrocanon', desc: 'Tous les 3 tours : 175% ATK Eau.', every: 3, mult: 1.75, aim: 'front' },
    [S('Carapuce', 'Eau', 430, 46, 12, 7), S('Carabaffe', 'Eau', 800, 88, 13, 8), S('Tortank', 'Eau', 1320, 145, 14, 9)]),
  L('chien-pao', 5, ['Ténèbres', 'Glace'], 1,
    { name: 'Lame Claire', desc: 'Tous les 3 tours : 225% ATK Glace sur le faible.', every: 3, mult: 2.25, aim: 'weak' },
    [S('Baojian', ['Ténèbres', 'Glace'], 720, 125, 20, 1002), S('Baojian ★', ['Ténèbres', 'Glace'], 1180, 190, 21, 1002), S('Baojian ★★', ['Ténèbres', 'Glace'], 1800, 260, 22, 1002)]),
  L('iron-hands', 5, [], 1,
    { name: 'Poing Éclair', desc: 'Tous les 3 tours : 215% ATK Combat.', every: 3, mult: 2.15, aim: 'front' },
    [S('Paume-de-Fer', ['Combat', 'Électrik'], 820, 115, 12, 992), S('Paume-de-Fer ★', ['Combat', 'Électrik'], 1320, 180, 13, 992), S('Paume-de-Fer ★★', ['Combat', 'Électrik'], 1980, 250, 14, 992)]),

  // —— Grille (formes normales) ——
  mono('lapras', 3, 'Lokhlass', ['Eau', 'Glace'], 620, 70, 12, 131, 2),
  L('exegg', 2, [], 1,
    { name: 'Canon Graine', desc: 'Tous les 3 tours : 175% ATK Plante sur 2 cibles.', every: 3, mult: 1.75, aim: 'aoe2' },
    [S('Noeunoeuf', ['Plante', 'Psy'], 380, 48, 11, 102)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Noadkoko', ['Plante', 'Psy'], 820, 110, 12, 103), S('Noadkoko ★', ['Plante', 'Psy'], 1300, 165, 13, 103)] },
      { id: 'alola', stages: [S('Noadkoko d’Alola', ['Plante', 'Dragon'], 880, 115, 10, 10114), S('Noadkoko d’Alola ★', ['Plante', 'Dragon'], 1400, 170, 11, 10114)] }
    ] }),
  L('articuno', 5, [], 3,
    { name: 'Blizzard', desc: 'Tous les 4 tours : 210% ATK Glace sur 2 cibles + ralentit.', every: 4, mult: 2.1, aim: 'aoe2', slow: 2 },
    [S('Artikodin', ['Glace', 'Vol'], 760, 110, 15, 144)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Artikodin ★', ['Glace', 'Vol'], 1140, 160, 16, 144), S('Artikodin ★★', ['Glace', 'Vol'], 1520, 210, 17, 144)] },
      { id: 'galar', stages: [S('Artikodin de Galar', ['Psy', 'Vol'], 1100, 170, 16, 10169), S('Artikodin de Galar ★', ['Psy', 'Vol'], 1480, 220, 17, 10169)] }
    ] }),
  line3('machop', 2, ['Machoc', 'Combat', 400, 55, 12, 66], ['Machopeur', 'Combat', 740, 100, 13, 67], ['Mackogneur', 'Combat', 1240, 165, 14, 68], 1),
  line3('nido', 2, ['Nidoran♂', 'Poison', 360, 42, 13, 32], ['Nidorino', 'Poison', 680, 80, 14, 33], ['Nidoking', ['Poison', 'Sol'], 1180, 145, 15, 34], 1),
  L('sand', 2, [], 1,
    { name: 'Tranche', desc: 'Tous les 3 tours : 180% ATK sur le plus faible.', every: 3, mult: 1.8, aim: 'weak' },
    [S('Sabelette', 'Sol', 380, 48, 13, 27)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Sablaireau', 'Sol', 820, 110, 14, 28), S('Sablaireau ★', 'Sol', 1300, 165, 15, 28)] },
      { id: 'alola', stages: [S('Sablaireau d’Alola', ['Glace', 'Acier'], 800, 112, 14, 10102), S('Sablaireau d’Alola ★', ['Glace', 'Acier'], 1280, 168, 15, 10102)] }
    ] }),
  line3('pidgey', 2, ['Roucool', ['Normal', 'Vol'], 340, 40, 15, 16], ['Roucoups', ['Normal', 'Vol'], 640, 75, 16, 17], ['Roucarnage', ['Normal', 'Vol'], 1100, 130, 18, 18], 2),
  mono('pinsir', 3, 'Scarabrute', 'Insecte', 560, 100, 15, 127, 1),
  L('geodude', 2, [], 1,
    { name: 'Éboulement', desc: 'Tous les 3 tours : 170% ATK Roche sur 2 cibles.', every: 3, mult: 1.7, aim: 'aoe2' },
    [S('Racaillou', ['Roche', 'Sol'], 420, 50, 10, 74)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Gravalanch', ['Roche', 'Sol'], 780, 90, 11, 75), S('Grolem', ['Roche', 'Sol'], 1280, 145, 12, 76)] },
      { id: 'alola', stages: [S('Gravalanch d’Alola', ['Roche', 'Électrik'], 760, 95, 11, 10110), S('Grolem d’Alola', ['Roche', 'Électrik'], 1240, 150, 12, 10111)] }
    ] }),
  withSpell(line3('magnemite', 2, ['Magnéti', ['Électrik', 'Acier'], 360, 55, 14, 81], ['Magnéton', ['Électrik', 'Acier'], 740, 105, 14, 82], ['Magnézone', ['Électrik', 'Acier'], 1260, 160, 13, 462], 3),
    { name: 'Élecanon', desc: 'Tous les 4 tours : 175% ATK Électrik + étourdit.', every: 4, mult: 1.75, aim: 'tank', stun: true }),
  line2('clefairy', 2, ['Mélofée', 'Fée', 400, 48, 12, 35], ['Mélodelfe', 'Fée', 860, 105, 13, 36], 2),
  L('mewtwo', 5, [], 3,
    { name: 'Frappe', desc: 'Tous les 3 tours : 170% ATK.', every: 3, mult: 1.7, aim: 'front' },
    [S('Mewtwo', 'Psy', 780, 140, 18, 150), S('Mewtwo ★', 'Psy', 1170, 203, 19, 150)],
    { at: 3, forms: [
      { id: 'x', stages: [S('Méga-Mewtwo X', ['Psy', 'Combat'], 1560, 266, 20, 10043)] },
      { id: 'y', stages: [S('Méga-Mewtwo Y', 'Psy', 1560, 266, 20, 10044)] }
    ] }),
  line2('sentret', 1, ['Fouinette', 'Normal', 360, 36, 12, 161], ['Fouinar', 'Normal', 760, 78, 14, 162], 1),
  line3('chikorita', 1, ['Germignon', 'Plante', 400, 46, 12, 152], ['Macronium', 'Plante', 740, 82, 13, 153], ['Méganium', 'Plante', 1220, 135, 14, 154], 2, ['Starter']),
  line3('swinub', 2, ['Marcacrin', ['Glace', 'Sol'], 420, 48, 11, 220], ['Cochignon', ['Glace', 'Sol'], 800, 95, 12, 221], ['Mammochon', ['Glace', 'Sol'], 1320, 155, 13, 473], 1),
  L('tyrogue', 2, [], 1,
    { name: 'Mach Punch', desc: 'Tous les 2 tours : 145% ATK Combat.', every: 2, mult: 1.45, aim: 'front' },
    [S('Debugant', 'Combat', 340, 50, 16, 236)],
    { at: 2, forms: [
      { id: 'lee', stages: [S('Kicklee', 'Combat', 740, 125, 17, 106), S('Kicklee ★', 'Combat', 1180, 185, 18, 106)] },
      { id: 'chan', stages: [S('Tygnon', 'Combat', 780, 115, 16, 107), S('Tygnon ★', 'Combat', 1240, 175, 17, 107)] },
      { id: 'top', stages: [S('Kapoera', 'Combat', 780, 115, 18, 237), S('Kapoera ★', 'Combat', 1240, 170, 19, 237)] }
    ] }),
  line3('zubat', 2, ['Nosferapti', ['Poison', 'Vol'], 320, 42, 17, 41], ['Nosferalto', ['Poison', 'Vol'], 620, 85, 18, 42], ['Nostenfer', ['Poison', 'Vol'], 1080, 145, 20, 169], 2),
  line2('hoothoot', 2, ['Hoothoot', ['Normal', 'Vol'], 380, 42, 13, 163], ['Noarfang', ['Normal', 'Vol'], 820, 95, 14, 164], 3),
  mono('shuckle', 2, 'Caratroc', ['Insecte', 'Roche'], 520, 30, 8, 213, 1),
  line3('horsea', 3, ['Hypotrempe', 'Eau', 360, 48, 14, 116], ['Hypocéan', 'Eau', 700, 95, 15, 117], ['Hyporoi', ['Eau', 'Dragon'], 1200, 160, 16, 230], 2),
  line3('larvitar', 4, ['Embrylex', ['Roche', 'Sol'], 440, 58, 11, 246], ['Ymphect', ['Roche', 'Sol'], 860, 110, 12, 247], ['Tyranocif', ['Roche', 'Ténèbres'], 1480, 190, 13, 248], 1),
  line2('onix', 3, ['Onix', ['Roche', 'Sol'], 520, 60, 12, 95], ['Steelix', ['Acier', 'Sol'], 1100, 130, 11, 208], 1),
  line3('togepi', 3, ['Togepi', 'Fée', 380, 40, 11, 175], ['Togetic', ['Fée', 'Vol'], 740, 90, 13, 176], ['Togekiss', ['Fée', 'Vol'], 1260, 155, 16, 468], 2),
  line3('treecko', 1, ['Arcko', 'Plante', 380, 50, 16, 252], ['Massko', 'Plante', 720, 95, 18, 253], ['Jungko', 'Plante', 1200, 155, 20, 254], 2, ['Starter']),
  line2('electrike', 2, ['Dynavolt', 'Électrik', 380, 55, 16, 309], ['Élecsprint', 'Électrik', 820, 125, 18, 310], 3),
  L('snorunt', 2, [], 2,
    { name: 'Vent Glace', desc: 'Tous les 3 tours : 165% ATK Glace sur 2 cibles + ralentit.', every: 3, mult: 1.65, aim: 'aoe2', slow: 2 },
    [S('Stalgamin', 'Glace', 380, 48, 13, 361)],
    { at: 2, forms: [
      { id: 'glalie', stages: [S('Oniglali', 'Glace', 820, 110, 14, 362), S('Oniglali ★', 'Glace', 1320, 165, 15, 362)] },
      { id: 'froslass', stages: [S('Momartik', ['Glace', 'Spectre'], 760, 115, 17, 478), S('Momartik ★', ['Glace', 'Spectre'], 1240, 170, 18, 478)] }
    ] }),
  line2('taillow', 2, ['Nirondelle', ['Normal', 'Vol'], 340, 46, 18, 276], ['Hélédelle', ['Normal', 'Vol'], 760, 105, 20, 277], 2),
  L('nincada', 2, [], 2,
    { name: 'Taillade', desc: 'Tous les 3 tours : 170% ATK.', every: 3, mult: 1.7, aim: 'front' },
    [S('Ningale', ['Insecte', 'Sol'], 380, 48, 12, 290)],
    { at: 2, forms: [
      { id: 'ninjask', stages: [S('Ninjask', ['Insecte', 'Vol'], 700, 130, 22, 291), S('Ninjask ★', ['Insecte', 'Vol'], 1120, 190, 23, 291)] },
      { id: 'shedinja', stages: [S('Munja', ['Insecte', 'Spectre'], 280, 120, 16, 292), S('Munja ★', ['Insecte', 'Spectre'], 460, 175, 17, 292)] }
    ] }),
  mono('jirachi', 5, 'Jirachi', ['Acier', 'Psy'], 700, 115, 16, 385, 3),
  line2('buneary', 2, ['Laporeille', 'Normal', 380, 52, 16, 427], ['Lockpin', 'Normal', 800, 115, 18, 428], 1),
  line3('chimchar', 3, ['Ouisticram', 'Feu', 390, 58, 16, 390], ['Chimpenfeu', ['Feu', 'Combat'], 740, 110, 17, 391], ['Simiabraz', ['Feu', 'Combat'], 1240, 175, 18, 392], 1, ['Starter']),
  line3('piplup', 2, ['Tiplouf', 'Eau', 400, 50, 12, 393], ['Prinplouf', 'Eau', 760, 90, 13, 394], ['Pingoléon', ['Eau', 'Acier'], 1260, 150, 14, 395], 2, ['Starter']),
  line3('turtwig', 1, ['Tortipouss', 'Plante', 420, 50, 11, 387], ['Boskara', 'Plante', 800, 95, 12, 388], ['Torterra', ['Plante', 'Sol'], 1360, 155, 12, 389], 1, ['Starter']),
  line3('shinx', 2, ['Lixy', 'Électrik', 380, 52, 14, 403], ['Luxio', 'Électrik', 720, 95, 15, 404], ['Luxray', 'Électrik', 1180, 150, 16, 405], 2),
  line2('shellos', 2, ['Sancoki', 'Eau', 420, 48, 11, 422], ['Tritosor', ['Eau', 'Sol'], 900, 100, 12, 423], 1),
  line2('combee', 2, ['Apitrini', ['Insecte', 'Vol'], 300, 40, 16, 415], ['Apireine', ['Insecte', 'Vol'], 780, 105, 14, 416], 2),
  line2('cranidos', 3, ['Kranidos', 'Roche', 420, 70, 13, 408], ['Charkos', 'Roche', 900, 145, 14, 409], 1),
  mono('spiritomb', 4, 'Spiritomb', ['Spectre', 'Ténèbres'], 640, 100, 12, 442, 2),
  line2('skorupi', 3, ['Rapion', ['Poison', 'Insecte'], 400, 58, 14, 451], ['Drascore', ['Poison', 'Ténèbres'], 900, 125, 15, 452], 1),
  mono('giratina', 5, 'Giratina', ['Spectre', 'Dragon'], 860, 120, 14, 487, 2),
  line2('minccino', 2, ['Chinchidou', 'Normal', 360, 48, 16, 572], ['Pashmilla', 'Normal', 780, 110, 18, 573], 2),
  line3('tepig', 1, ['Gruikui', 'Feu', 420, 55, 12, 498], ['Grotichon', ['Feu', 'Combat'], 780, 105, 13, 499], ['Roitiflam', ['Feu', 'Combat'], 1300, 170, 14, 500], 1, ['Starter']),
  L('oshawott', 2, ['Starter'], 1,
    { name: 'Coquilame', desc: 'Tous les 3 tours : 185% ATK sur le front, ignore 10% PV.', every: 3, mult: 1.85, aim: 'front', shred: 0.1 },
    [S('Moustillon', 'Eau', 400, 52, 14, 501), S('Mateloutre', 'Eau', 760, 95, 15, 502)],
    { at: 3, forms: [
      { id: 'unys', stages: [S('Clamiral', 'Eau', 1240, 155, 16, 503)] },
      { id: 'hisui', stages: [S('Clamiral de Hisui', ['Eau', 'Ténèbres'], 1220, 165, 17, 10236)] }
    ] }),
  line2('blitzle', 2, ['Zébibron', 'Électrik', 380, 55, 17, 522], ['Zéblitz', 'Électrik', 800, 120, 18, 523], 2),
  line2('cubchoo', 2, ['Polarhume', 'Glace', 420, 50, 11, 613], ['Polagriffe', 'Glace', 920, 120, 12, 614], 1),
  line3('timburr', 3, ['Charpenti', 'Combat', 420, 55, 12, 532], ['Ouvrifier', 'Combat', 800, 105, 12, 533], ['Bétochef', 'Combat', 1320, 170, 13, 534], 1),
  line3('venipede', 2, ['Venipatte', ['Insecte', 'Poison'], 360, 42, 13, 543], ['Scobolide', ['Insecte', 'Poison'], 680, 80, 14, 544], ['Brutapode', ['Insecte', 'Poison'], 1180, 140, 15, 545], 1),
  line2('drilbur', 3, ['Rototaupe', 'Sol', 400, 60, 15, 529], ['Minotaupe', ['Sol', 'Acier'], 900, 135, 16, 530], 1),
  line2('ducklett', 2, ['Couaneton', ['Eau', 'Vol'], 360, 44, 15, 580], ['Lakmécygne', ['Eau', 'Vol'], 800, 100, 16, 581], 2),
  line2('munna', 2, ['Munna', 'Psy', 380, 50, 11, 517], ['Mushana', 'Psy', 860, 115, 12, 518], 3),
  line3('sewaddle', 2, ['Larveyette', ['Insecte', 'Plante'], 360, 42, 13, 540], ['Couverdure', ['Insecte', 'Plante'], 680, 80, 13, 541], ['Manternel', ['Insecte', 'Plante'], 1140, 140, 15, 542], 2),
  line3('roggenrola', 2, ['Nodulithe', 'Roche', 420, 48, 10, 524], ['Géolithe', 'Roche', 800, 90, 11, 525], ['Gigalithe', 'Roche', 1320, 145, 11, 526], 1),
  line2('karrablast', 3, ['Carabing', 'Insecte', 380, 55, 14, 588], ['Lançargot', ['Insecte', 'Acier'], 860, 130, 12, 589], 1),
  line2('cottonee', 2, ['Doudouvet', ['Plante', 'Fée'], 360, 46, 15, 546], ['Farfaduvet', ['Plante', 'Fée'], 760, 105, 17, 547], 2),
  L('kyurem', 5, [], 3,
    { name: 'Ère Glaciaire', desc: 'Tous les 4 tours : 225% ATK Glace à tous + ralentit.', every: 4, mult: 2.25, aim: 'all', slow: 2 },
    [S('Kyurem', ['Dragon', 'Glace'], 820, 125, 14, 646), S('Kyurem ★', ['Dragon', 'Glace'], 1230, 181, 15, 646)],
    { at: 3, forms: [
      { id: 'noir', stages: [S('Kyurem Noir', ['Dragon', 'Glace'], 1600, 260, 16, 10022)] },
      { id: 'blanc', stages: [S('Kyurem Blanc', ['Dragon', 'Glace'], 1700, 245, 15, 10023)] }
    ] }),
  L('meloetta', 5, [], 3,
    { name: 'Chant Antique', desc: 'Tous les 3 tours : 190% ATK sur 2 cibles + étourdit.', every: 3, mult: 1.9, aim: 'aoe2', stun: true },
    [S('Meloetta', ['Normal', 'Psy'], 700, 120, 16, 648)],
    { at: 2, forms: [
      { id: 'chant', stages: [S('Meloetta (Chant)', ['Normal', 'Psy'], 1050, 174, 17, 648), S('Meloetta (Chant) ★', ['Normal', 'Psy'], 1400, 228, 18, 648)] },
      { id: 'danse', stages: [S('Meloetta (Danse)', ['Normal', 'Combat'], 1000, 185, 19, 10018), S('Meloetta (Danse) ★', ['Normal', 'Combat'], 1340, 240, 20, 10018)] }
    ] }),
  L('fennekin', 1, ['Starter'], 3,
    { name: 'Feu Mystique', desc: 'Tous les 3 tours : 180% ATK Feu + baisse l’ATK de 15%.', every: 3, mult: 1.8, aim: 'weak', atkBreak: 0.15 },
    [S('Feunnec', 'Feu', 380, 55, 16, 653), S('Roussil', 'Feu', 720, 100, 17, 654), S('Goupelin', ['Feu', 'Psy'], 1200, 165, 18, 655)]),
  line3('chespin', 2, ['Marisson', 'Plante', 420, 52, 12, 650], ['Boguérisse', 'Plante', 800, 95, 12, 651], ['Blindépique', ['Plante', 'Combat'], 1320, 155, 13, 652], 1, ['Starter']),
  line2('helioptile', 2, ['Galvaran', ['Électrik', 'Normal'], 360, 52, 16, 694], ['Iguolta', ['Électrik', 'Normal'], 780, 120, 18, 695], 3),
  L('bergmite', 3, [], 1,
    { name: 'Avalanche', desc: 'Tous les 3 tours : 180% ATK Glace + bouclier 10%.', every: 3, mult: 1.8, aim: 'front', shield: 0.1 },
    [S('Grelaçon', 'Glace', 460, 55, 10, 712)],
    { at: 2, forms: [
      { id: 'kalos', stages: [S('Séracrawl', 'Glace', 1000, 120, 11, 713), S('Séracrawl ★', 'Glace', 1560, 175, 12, 713)] },
      { id: 'hisui', stages: [S('Séracrawl de Hisui', ['Glace', 'Roche'], 1020, 125, 10, 10243), S('Séracrawl de Hisui ★', ['Glace', 'Roche'], 1600, 180, 11, 10243)] }
    ] }),
  mono('hawlucha', 3, 'Brutalibré', ['Combat', 'Vol'], 520, 100, 18, 701, 1),
  line2('skrelp', 3, ['Venalgue', ['Poison', 'Eau'], 380, 52, 12, 690], ['Kravarech', ['Poison', 'Dragon'], 860, 125, 13, 691], 2),
  line2('binacle', 2, ['Opermine', ['Roche', 'Eau'], 400, 52, 12, 688], ['Golgopathe', ['Roche', 'Eau'], 880, 120, 13, 689], 1),
  line2('espurr', 2, ['Psystigri', 'Psy', 360, 52, 15, 677], ['Mistigrix', 'Psy', 780, 115, 16, 678], 3),
  L('goomy', 4, [], 2,
    { name: 'Hydro-Queue', desc: 'Tous les 3 tours : 170% ATK Dragon sur 2 cibles + ralentit.', every: 3, mult: 1.7, aim: 'aoe2', slow: 2 },
    [S('Mucuscule', 'Dragon', 420, 48, 11, 704)],
    { at: 2, forms: [
      { id: 'kalos', stages: [S('Colimucus', 'Dragon', 820, 95, 12, 705), S('Muplodocus', 'Dragon', 1400, 165, 13, 706)] },
      { id: 'hisui', stages: [S('Colimucus de Hisui', ['Acier', 'Dragon'], 840, 92, 11, 10241), S('Muplodocus de Hisui', ['Acier', 'Dragon'], 1440, 160, 12, 10242)] }
    ] }),
  line2('inkay', 3, ['Sepiatop', ['Ténèbres', 'Psy'], 380, 52, 14, 686], ['Sepiatroce', ['Ténèbres', 'Psy'], 820, 125, 15, 687], 2),
  mono('klefki', 3, 'Trousselin', ['Acier', 'Fée'], 520, 80, 13, 707, 2),
  mono('yveltal', 5, 'Yveltal', ['Ténèbres', 'Vol'], 820, 130, 16, 717, 3),
  mono('diancie', 5, 'Diancie', ['Roche', 'Fée'], 700, 115, 14, 719, 2),
  line2('stufful', 2, ['Nounourson', ['Normal', 'Combat'], 420, 55, 12, 759], ['Chelours', ['Normal', 'Combat'], 920, 125, 13, 760], 1),
  line3('litten', 3, ['Flamiaou', 'Feu', 390, 55, 16, 725], ['Matoufeu', 'Feu', 740, 105, 17, 726], ['Félinferno', ['Feu', 'Ténèbres'], 1240, 170, 18, 727], 1, ['Starter']),
  line3('popplio', 2, ['Otaquin', 'Eau', 400, 50, 13, 728], ['Otarlette', 'Eau', 760, 90, 14, 729], ['Oratoria', ['Eau', 'Fée'], 1260, 150, 15, 730], 2, ['Starter']),
  mono('togedemaru', 2, 'Togedemaru', ['Électrik', 'Acier'], 460, 80, 16, 777, 1),
  line2('crabrawler', 3, ['Crabagarre', 'Combat', 420, 60, 13, 739], ['Crabominable', ['Combat', 'Glace'], 920, 130, 12, 740], 1),
  mono('passimian', 3, 'Quartermac', 'Combat', 540, 105, 15, 766, 1),
  line2('salandit', 3, ['Tritox', ['Poison', 'Feu'], 360, 55, 16, 757], ['Malamandre', ['Poison', 'Feu'], 780, 125, 18, 758], 2),
  line2('mudbray', 2, ['Tiboudet', 'Sol', 440, 55, 12, 749], ['Bourrinos', 'Sol', 960, 120, 12, 750], 1),
  L('oricorio', 2, [], 2,
    { name: 'Danse Éveil', desc: 'Tous les 3 tours : 175% ATK sur 2 cibles (type du style).', every: 3, mult: 1.75, aim: 'aoe2' },
    [S('Plumeline', ['Feu', 'Vol'], 460, 85, 17, 741)],
    { at: 2, forms: [
      { id: 'flamenco', stages: [S('Plumeline (Flamenco)', ['Feu', 'Vol'], 690, 123, 18, 741), S('Plumeline (Flamenco) ★', ['Feu', 'Vol'], 920, 162, 19, 741)] },
      { id: 'pompom', stages: [S('Plumeline (Pom-Pom)', ['Électrik', 'Vol'], 690, 123, 18, 10123), S('Plumeline (Pom-Pom) ★', ['Électrik', 'Vol'], 920, 162, 19, 10123)] },
      { id: 'hula', stages: [S('Plumeline (Hula)', ['Psy', 'Vol'], 720, 118, 18, 10124), S('Plumeline (Hula) ★', ['Psy', 'Vol'], 960, 156, 19, 10124)] },
      { id: 'buyo', stages: [S('Plumeline (Buyō)', ['Spectre', 'Vol'], 680, 126, 18, 10125), S('Plumeline (Buyō) ★', ['Spectre', 'Vol'], 900, 166, 19, 10125)] }
    ] }),
  mono('oranguru', 3, 'Gouroutan', ['Normal', 'Psy'], 560, 95, 12, 765, 3),
  L('rockruff', 3, [], 1,
    { name: 'Lame de Roc', desc: 'Tous les 3 tours : 200% ATK Roche sur le front.', every: 3, mult: 2.0, aim: 'front' },
    [S('Rocabot', 'Roche', 400, 55, 15, 744)],
    { at: 2, forms: [
      { id: 'jour', stages: [S('Lougaroc (Diurne)', 'Roche', 860, 125, 17, 745), S('Lougaroc (Diurne) ★', 'Roche', 1340, 180, 18, 745)] },
      { id: 'nuit', stages: [S('Lougaroc (Nocturne)', 'Roche', 900, 130, 15, 10126), S('Lougaroc (Nocturne) ★', 'Roche', 1400, 185, 16, 10126)] },
      { id: 'crepuscule', stages: [S('Lougaroc (Crépusculaire)', 'Roche', 880, 128, 17, 10152), S('Lougaroc (Crépusculaire) ★', 'Roche', 1370, 183, 18, 10152)] }
    ] }),
  line3('jangmo', 4, ['Bébécaille', 'Dragon', 420, 55, 13, 782], ['Écaïd', ['Dragon', 'Combat'], 820, 110, 14, 783], ['Ékaïser', ['Dragon', 'Combat'], 1400, 180, 15, 784], 1),
  line2('fomantis', 2, ['Mimantis', 'Plante', 380, 52, 14, 753], ['Floramantis', 'Plante', 820, 120, 15, 754], 2),
  L('lunala', 5, [], 3,
    { name: 'Rayon Spectral', desc: 'Tous les 4 tours : 240% ATK sur le plus faible.', every: 4, mult: 2.4, aim: 'weak' },
    [S('Cosmog', 'Psy', 520, 70, 12, 789), S('Cosmovum', 'Psy', 980, 110, 6, 790)],
    { at: 3, forms: [
      { id: 'lunala', stages: [S('Lunala', ['Psy', 'Spectre'], 1640, 260, 16, 792)] },
      { id: 'solgaleo', stages: [S('Solgaleo', ['Psy', 'Acier'], 1700, 255, 15, 791)] }
    ] }),
  mono('marshadow', 5, 'Marshadow', ['Combat', 'Spectre'], 680, 140, 20, 802, 1),
  line2('grimer-a', 3, ['Tadmorv d’Alola', ['Poison', 'Ténèbres'], 460, 55, 10, 10112], ['Grotadmorv d’Alola', ['Poison', 'Ténèbres'], 980, 120, 11, 10113], 1),
  line3('scorbunny', 3, ['Flambino', 'Feu', 380, 58, 17, 813], ['Lapyro', 'Feu', 720, 105, 18, 814], ['Pyrobut', 'Feu', 1200, 170, 20, 815], 1, ['Starter']),
  line3('sobble', 2, ['Larméléon', 'Eau', 360, 52, 16, 816], ['Arrozard', 'Eau', 700, 100, 17, 817], ['Lézargus', 'Eau', 1160, 165, 20, 818], 3, ['Starter']),
  line3('grookey', 3, ['Ouistempo', 'Plante', 400, 52, 14, 810], ['Badabouin', 'Plante', 760, 100, 14, 811], ['Gorythmic', 'Plante', 1260, 160, 15, 812], 2, ['Starter']),
  line2('snom', 2, ['Frissonille', ['Glace', 'Insecte'], 360, 40, 12, 872], ['Beldeneige', ['Glace', 'Insecte'], 820, 115, 14, 873], 3),
  mono('falinks', 3, 'Hexadron', 'Combat', 580, 100, 13, 870, 1),
  line3('zigzagoon-g', 3, ['Zigzaton de Galar', ['Ténèbres', 'Normal'], 380, 48, 14, 10174], ['Linéon de Galar', ['Ténèbres', 'Normal'], 720, 90, 15, 10175], ['Ixon', ['Ténèbres', 'Normal'], 1200, 150, 16, 862], 1),
  line2('yamask-g', 3, ['Tutafeh de Galar', ['Sol', 'Spectre'], 400, 55, 11, 10179], ['Tutétékri', ['Sol', 'Spectre'], 900, 115, 12, 867], 2),
  line2('corsola-g', 3, ['Corayon de Galar', 'Spectre', 400, 48, 10, 10173], ['Corayôme', 'Spectre', 820, 110, 11, 864], 3),
  line2('meowth-g', 2, ['Miaouss de Galar', 'Acier', 380, 52, 14, 10161], ['Berserkatt', 'Acier', 840, 120, 14, 863], 1),
  line3('impidimp', 3, ['Grimalin', ['Ténèbres', 'Fée'], 380, 52, 13, 859], ['Fourbelin', ['Ténèbres', 'Fée'], 740, 100, 14, 860], ['Angoliath', ['Ténèbres', 'Fée'], 1240, 165, 15, 861], 1),
  line3('hatenna', 3, ['Bibichut', 'Psy', 380, 48, 12, 856], ['Chapotus', 'Psy', 720, 90, 13, 857], ['Sorcilence', ['Psy', 'Fée'], 1220, 155, 14, 858], 3),
  line3('blipbug', 2, ['Larvadar', 'Insecte', 340, 40, 12, 824], ['Coléodôme', ['Insecte', 'Psy'], 680, 80, 11, 825], ['Astronelle', ['Insecte', 'Psy'], 1140, 140, 14, 826], 3),
  mono('indeedee', 3, 'Wimessir', ['Psy', 'Normal'], 520, 95, 15, 876, 3),
  mono('stonjourner', 2, 'Dolman', 'Roche', 620, 90, 10, 874, 1),
  mono('eternatus', 5, 'Éthernatos', ['Poison', 'Dragon'], 900, 130, 14, 890, 3),
  mono('zarude', 5, 'Zarude', ['Ténèbres', 'Plante'], 760, 130, 18, 893, 1),
  line2('girafarig', 2, ['Girafarig', ['Normal', 'Psy'], 420, 60, 14, 203], ['Farigiraf', ['Normal', 'Psy'], 920, 120, 13, 981], 2),
  line3('fuecoco', 3, ['Chochodile', 'Feu', 420, 55, 12, 909], ['Crocogril', 'Feu', 800, 105, 13, 910], ['Flâmigator', ['Feu', 'Spectre'], 1320, 170, 14, 911], 2, ['Starter']),
  line3('quaxly', 3, ['Coiffeton', 'Eau', 390, 55, 15, 912], ['Canarbello', 'Eau', 740, 100, 16, 913], ['Palmaval', ['Eau', 'Combat'], 1240, 165, 18, 914], 1, ['Starter']),
  line3('starly', 3, ['Étourmi', ['Normal', 'Vol'], 340, 46, 16, 396], ['Étourvol', ['Normal', 'Vol'], 680, 90, 17, 397], ['Étouraptor', ['Normal', 'Vol'], 1160, 150, 18, 398], 2),
  line2('milcery', 2, ['Crèmy', 'Fée', 360, 42, 12, 868], ['Charmilly', 'Fée', 800, 100, 13, 869], 2),
  mono('furfrou', 2, 'Couafarel', 'Normal', 480, 80, 16, 676, 1),
  withSpell(line3('vivillon', 2, ['Lépidonille', 'Insecte', 340, 38, 12, 664], ['Pérégrain', 'Insecte', 640, 58, 8, 665], ['Prismillon', ['Insecte', 'Vol'], 1080, 148, 15, 666], 3),
    { name: 'Poudre Fureur', desc: 'Tous les 3 tours : 150% ATK Insecte + étourdit.', every: 3, mult: 1.5, aim: 'random', stun: true }),
  L('ogerpon', 5, [], 1,
    { name: 'Massue Furieuse', desc: 'Tous les 3 tours : 230% ATK sur le front, ignore 10% PV.', every: 3, mult: 2.3, aim: 'front', shred: 0.1 },
    [S('Ogerpon', 'Plante', 680, 125, 18, 1017)],
    { at: 2, forms: [
      { id: 'turquoise', stages: [S('Ogerpon (Turquoise)', 'Plante', 1020, 185, 19, 1017), S('Ogerpon (Turquoise) ★', 'Plante', 1560, 250, 20, 1017)] },
      { id: 'puits', stages: [S('Ogerpon (Masque du Puits)', ['Plante', 'Eau'], 1060, 180, 18, 10273), S('Ogerpon (Masque du Puits) ★', ['Plante', 'Eau'], 1620, 245, 19, 10273)] },
      { id: 'fourneau', stages: [S('Ogerpon (Masque du Fourneau)', ['Plante', 'Feu'], 1000, 190, 19, 10274), S('Ogerpon (Masque du Fourneau) ★', ['Plante', 'Feu'], 1520, 255, 20, 10274)] },
      { id: 'pierre', stages: [S('Ogerpon (Masque de la Pierre)', ['Plante', 'Roche'], 1120, 175, 17, 10275), S('Ogerpon (Masque de la Pierre) ★', ['Plante', 'Roche'], 1700, 235, 18, 10275)] }
    ] }),
  mono('miraidon', 5, 'Miraidon', ['Électrik', 'Dragon'], 820, 135, 18, 1008, 3),
  mono('roaring', 5, 'Rugit-Lune', ['Dragon', 'Ténèbres'], 780, 145, 20, 1005, 2),
  line2('toedscool', 3, ['Terracool', ['Sol', 'Plante'], 400, 52, 13, 948], ['Terracruel', ['Sol', 'Plante'], 880, 120, 15, 949], 2),
  mono('bombirdier', 3, 'Lestombaile', ['Vol', 'Ténèbres'], 520, 95, 17, 962, 2),
  line2('tarountula', 1, ['Tissenboule', 'Insecte', 360, 42, 12, 917], ['Filentrappe', 'Insecte', 760, 95, 13, 918], 2),
  line3('nacli', 2, ['Selutin', 'Roche', 420, 46, 10, 932], ['Amassel', 'Roche', 800, 90, 11, 933], ['Gigansel', 'Roche', 1340, 145, 11, 934], 1),
  line2('bellibolt', 2, ['Têtampoule', 'Électrik', 400, 48, 11, 938], ['Ampibidou', 'Électrik', 880, 115, 12, 939], 2),

  // —— Grille : Pokémon restants ——
  L('teddiursa', 1, ['Force'], 1,
    { name: 'Coup d’Boule', desc: 'Tous les 3 tours : 165% ATK + ralentit (SPD -2).', every: 3, mult: 1.65, aim: 'front', slow: 2 },
    [S('Teddiursa', 'Normal', 420, 46, 11, 216), S('Ursaring', 'Normal', 820, 92, 11, 217)],
    { at: 3, forms: [
      { id: 'ursaking', stages: [S('Ursaking', ['Sol', 'Normal'], 1340, 140, 11, 901)] },
      { id: 'lune', stages: [S('Ursaking (Lune Vermeille)', ['Sol', 'Normal'], 1280, 150, 10, 10272)] }
    ] }),
  withSpell(line2('swablu', 2, ['Tylton', ['Normal', 'Vol'], 360, 42, 14, 333], ['Altaria', ['Dragon', 'Vol'], 800, 95, 15, 334], 2),
    { name: 'Chant Antique', desc: 'Tous les 3 tours : 150% ATK sur 2 cibles + soigne 8%.', every: 3, mult: 1.5, aim: 'aoe2', healAlly: 0.08 }),
  withSpell(mono('chatot', 1, 'Pijako', ['Normal', 'Vol'], 380, 42, 16, 441, 3),
    { name: 'Babil', desc: 'Tous les 3 tours : 150% ATK + étourdit la cible.', every: 3, mult: 1.5, aim: 'random', stun: true }),
  withSpell(line3('lillipup', 1, ['Ponchiot', 'Normal', 400, 40, 13, 506], ['Ponchien', 'Normal', 760, 76, 13, 507], ['Mastouffe', 'Normal', 1260, 122, 14, 508], 1),
    { name: 'Crocs Givre', desc: 'Tous les 3 tours : 160% ATK + ralentit (SPD -2).', every: 3, mult: 1.6, aim: 'front', slow: 2 }),
  withSpell(mono('drampa', 3, 'Draïeul', ['Normal', 'Dragon'], 620, 85, 11, 780, 3),
    { name: 'Draco-Souffle', desc: 'Tous les 3 tours : 180% ATK Dragon sur 2 cibles.', every: 3, mult: 1.8, aim: 'aoe2' }),
  withSpell(mono('victini', 5, 'Victini', ['Psy', 'Feu'], 720, 125, 18, 494, 1),
    { name: 'Coup Victoire', desc: 'Tous les 3 tours : 240% ATK Feu sur le front.', every: 3, mult: 2.4, aim: 'front' }),
  withSpell(line2('remoraid', 2, ['Rémoraid', 'Eau', 360, 52, 12, 223], ['Octillery', 'Eau', 800, 115, 12, 224], 3, ['Mage']),
    { name: 'Octazooka', desc: 'Tous les 3 tours : 175% ATK Eau + baisse l’ATK de 12%.', every: 3, mult: 1.75, aim: 'back', atkBreak: 0.12 }),
  withSpell(line2('barboach', 1, ['Barloche', ['Eau', 'Sol'], 420, 40, 11, 339], ['Barbicha', ['Eau', 'Sol'], 900, 88, 11, 340], 1),
    { name: 'Séisme', desc: 'Tous les 4 tours : 165% ATK Sol sur 2 cibles.', every: 4, mult: 1.65, aim: 'aoe2' }),
  withSpell(mono('keldeo', 5, 'Keldeo', ['Eau', 'Combat'], 720, 130, 19, 647, 1),
    { name: 'Lame Ointe', desc: 'Tous les 3 tours : 230% ATK Combat sur le front.', every: 3, mult: 2.3, aim: 'front' }),
  withSpell(mono('tapu-fini', 5, 'Tokopisco', ['Eau', 'Fée'], 820, 110, 14, 788, 3),
    { name: 'Ire de la Nature', desc: 'Tous les 4 tours : 200% ATK Fée, ignore 10% PV + soigne 20%.', every: 4, mult: 2.0, aim: 'tank', shred: 0.1, healAlly: 0.2 }),
  withSpell(line2('pansage', 1, ['Feuillajou', 'Plante', 380, 44, 15, 511], ['Feuiloutan', 'Plante', 800, 95, 16, 512], 1),
    { name: 'Balle Graine', desc: 'Tous les 2 tours : 140% ATK Plante.', every: 2, mult: 1.4, aim: 'front' }),
  withSpell(line2('phantump', 1, ['Brocélôme', ['Spectre', 'Plante'], 420, 40, 10, 708], ['Desséliande', ['Spectre', 'Plante'], 900, 88, 10, 709], 1),
    { name: 'Encornebois', desc: 'Tous les 3 tours : 155% ATK Plante + soigne 10%.', every: 3, mult: 1.55, aim: 'front', healAlly: 0.1 }),
  withSpell(line3('tynamo', 2, ['Anchwatt', 'Électrik', 360, 46, 10, 602], ['Lampéroie', 'Électrik', 720, 92, 11, 603], ['Ohmassacre', 'Électrik', 1260, 155, 11, 604], 1),
    { name: 'Crocs Éclair', desc: 'Tous les 3 tours : 180% ATK Électrik + ralentit.', every: 3, mult: 1.8, aim: 'front', slow: 2 }),
  withSpell(mono('zeraora', 5, 'Zeraora', 'Électrik', 700, 130, 23, 807, 1),
    { name: 'Plasma Punch', desc: 'Tous les 2 tours : 190% ATK Électrik.', every: 2, mult: 1.9, aim: 'front' }),
  withSpell(mono('raging-bolt', 5, 'Ire-Foudre', ['Électrik', 'Dragon'], 860, 125, 13, 1021, 3),
    { name: 'Tonnerre Croc', desc: 'Tous les 4 tours : 250% ATK Électrik sur le tank.', every: 4, mult: 2.5, aim: 'tank' }),
  withSpell(line2('amaura', 2, ['Amagara', ['Roche', 'Glace'], 420, 46, 10, 698], ['Dragmara', ['Roche', 'Glace'], 920, 105, 10, 699], 3),
    { name: 'Blizzard', desc: 'Tous les 4 tours : 175% ATK Glace sur 2 cibles + ralentit.', every: 4, mult: 1.75, aim: 'aoe2', slow: 2 }),
  withSpell(line2('vulpix-a', 2, ['Goupix d’Alola', 'Glace', 360, 46, 16, 10103], ['Feunard d’Alola', ['Glace', 'Fée'], 800, 110, 17, 10104], 3),
    { name: 'Aurore', desc: 'Tous les 3 tours : 150% ATK Glace sur 2 cibles.', every: 3, mult: 1.5, aim: 'aoe2' }),
  withSpell(mono('iron-bundle', 4, 'Hotte-de-Fer', ['Glace', 'Eau'], 620, 115, 22, 991, 3),
    { name: 'Lyophilisation', desc: 'Tous les 3 tours : 195% ATK Glace + ralentit (SPD -3).', every: 3, mult: 1.95, aim: 'random', slow: 3 }),
  withSpell(line2('pancham', 2, ['Pandespiègle', 'Combat', 420, 50, 10, 674], ['Pandarbare', ['Combat', 'Ténèbres'], 920, 115, 10, 675], 1, ['Force']),
    { name: 'Coup Bas', desc: 'Tous les 3 tours : 165% ATK Ténèbres sur le plus faible.', every: 3, mult: 1.65, aim: 'weak' }),
  withSpell(line2('farfetchd-g', 2, ['Canarticho de Galar', 'Combat', 400, 52, 13, 10166], ['Palarticho', 'Combat', 860, 120, 13, 865], 1, ['Force']),
    { name: 'Botte Sabre', desc: 'Tous les 3 tours : 195% ATK Combat sur le front.', every: 3, mult: 1.95, aim: 'front' }),
  withSpell(line2('mareanie', 3, ['Vorastérie', ['Poison', 'Eau'], 440, 44, 8, 747], ['Prédastérie', ['Poison', 'Eau'], 1000, 85, 8, 748], 1),
    { name: 'Baston Toxik', desc: 'Tous les 3 tours : 130% ATK sur 2 cibles + empoisonne + bouclier 10%.', every: 3, mult: 1.3, aim: 'aoe2', dot: { pct: 0.05, turns: 3 }, shield: 0.1 }),
  withSpell(line3('zygarde', 5, ['Zygarde', ['Dragon', 'Sol'], 900, 115, 14, 718], ['Zygarde (Forme Parfaite)', ['Dragon', 'Sol'], 1350, 167, 15, 10120], ['Méga-Zygarde', ['Dragon', 'Sol'], 1800, 218, 16, 10301], 1),
    { name: 'Force Chtonienne', desc: 'Tous les 4 tours : 220% ATK Sol à tous.', every: 4, mult: 2.2, aim: 'all' }),
  withSpell(line2('sandygast', 2, ['Bacabouh', ['Spectre', 'Sol'], 460, 42, 9, 769], ['Trépassable', ['Spectre', 'Sol'], 1000, 90, 9, 770], 2),
    { name: 'Draine-Sable', desc: 'Tous les 3 tours : 150% ATK + bouclier 12% PV.', every: 3, mult: 1.5, aim: 'front', shield: 0.12 }),
  withSpell(line2('golett', 3, ['Gringolem', ['Sol', 'Spectre'], 460, 55, 10, 622], ['Golemastoc', ['Sol', 'Spectre'], 1000, 120, 10, 623], 1, ['Force']),
    { name: 'Poing Ombre', desc: 'Tous les 3 tours : 200% ATK Spectre sur le front.', every: 3, mult: 2.0, aim: 'front' }),
  withSpell(mono('aerodactyl', 3, 'Ptéra', ['Roche', 'Vol'], 560, 92, 21, 142, 1),
    { name: 'Éboulement', desc: 'Tous les 3 tours : 175% ATK Roche sur 2 cibles + ralentit.', every: 3, mult: 1.75, aim: 'aoe2', slow: 2 }),
  withSpell(mono('landorus', 5, 'Démétéros', ['Sol', 'Vol'], 800, 125, 15, 645, 2),
    { name: 'Force Chtonienne', desc: 'Tous les 4 tours : 225% ATK Sol à tous.', every: 4, mult: 2.25, aim: 'all' }),
  withSpell(line3('solosis', 3, ['Nucléos', 'Psy', 380, 48, 9, 577], ['Méios', 'Psy', 740, 95, 9, 578], ['Symbios', 'Psy', 1300, 150, 9, 579], 3, ['Mage']),
    { name: 'Distorsion', desc: 'Tous les 4 tours : 150% ATK Psy sur 2 cibles + soigne 12%.', every: 4, mult: 1.5, aim: 'aoe2', healAlly: 0.12 }),
  withSpell(mono('scream-tail', 4, 'Hurle-Queue', ['Fée', 'Psy'], 720, 100, 15, 985, 2),
    { name: 'Bâillement', desc: 'Tous les 3 tours : 170% ATK Fée + étourdit + soigne 10%.', every: 3, mult: 1.7, aim: 'front', stun: true, healAlly: 0.1 }),
  L('wurmple', 2, [], 3,
    { name: 'Vent Argenté', desc: 'Tous les 3 tours : 160% ATK Insecte sur 2 cibles.', every: 3, mult: 1.6, aim: 'aoe2' },
    [S('Chenipotte', 'Insecte', 340, 38, 12, 265)],
    { at: 2, forms: [
      { id: 'charmillon', stages: [S('Armulys', 'Insecte', 640, 60, 8, 266), S('Charmillon', ['Insecte', 'Vol'], 1080, 150, 15, 267)] },
      { id: 'papinox', stages: [S('Blindalys', 'Insecte', 660, 56, 8, 268), S('Papinox', ['Insecte', 'Poison'], 1160, 138, 14, 269)] }
    ] }),
  withSpell(mono('slither-wing', 4, 'Rampe-Ailes', ['Insecte', 'Combat'], 700, 120, 13, 988, 1),
    { name: 'Danse Flamme', desc: 'Tous les 3 tours : 200% ATK Combat + brûle (5%/tour).', every: 3, mult: 2.0, aim: 'front', dot: { pct: 0.05, turns: 3 } }),
  withSpell(line2('kabuto', 3, ['Kabuto', ['Roche', 'Eau'], 400, 55, 14, 140], ['Kabutops', ['Roche', 'Eau'], 860, 130, 16, 141], 1),
    { name: 'Tranche', desc: 'Tous les 3 tours : 195% ATK Roche sur le plus faible.', every: 3, mult: 1.95, aim: 'weak' }),
  withSpell(line3('rhyhorn', 4, ['Rhinocorne', ['Sol', 'Roche'], 480, 62, 9, 111], ['Rhinoféros', ['Sol', 'Roche'], 920, 120, 9, 112], ['Rhinastoc', ['Sol', 'Roche'], 1560, 190, 9, 464], 1, ['Force']),
    { name: 'Roc-Boulet', desc: 'Tous les 4 tours : 235% ATK Roche sur le front.', every: 4, mult: 2.35, aim: 'front' }),
  withSpell(mono('terrakion', 5, 'Terrakium', ['Roche', 'Combat'], 800, 130, 16, 639, 1),
    { name: 'Lame Sacrée', desc: 'Tous les 3 tours : 225% ATK Roche, ignore 12% PV.', every: 3, mult: 2.25, aim: 'front', shred: 0.12 }),
  withSpell(line2('glimmet', 3, ['Germéclat', ['Roche', 'Poison'], 380, 52, 12, 969], ['Floréclat', ['Roche', 'Poison'], 840, 125, 12, 970], 3, ['Mage']),
    { name: 'Rayon Météore', desc: 'Tous les 4 tours : 210% ATK Roche sur 2 cibles + empoisonne.', every: 4, mult: 2.1, aim: 'aoe2', dot: { pct: 0.04, turns: 3 } }),
  withSpell(line2('shuppet', 3, ['Polichombr', 'Spectre', 360, 55, 12, 353], ['Branette', 'Spectre', 800, 125, 13, 354], 2),
    { name: 'Griffe Ombre', desc: 'Tous les 3 tours : 190% ATK Spectre, ignore 10% PV.', every: 3, mult: 1.9, aim: 'random', shred: 0.1 }),
  withSpell(line2('zorua', 2, ['Zorua', 'Ténèbres', 360, 55, 17, 570], ['Zoroark', 'Ténèbres', 780, 125, 18, 571], 2),
    { name: 'Vibrobscur', desc: 'Tous les 3 tours : 185% ATK Ténèbres sur le plus faible.', every: 3, mult: 1.85, aim: 'weak' }),
  withSpell(mono('morpeko', 2, 'Morpeko', ['Électrik', 'Ténèbres'], 440, 70, 20, 877, 1),
    { name: 'Roue Libre', desc: 'Tous les 2 tours : 150% ATK Électrik sur le front.', every: 2, mult: 1.5, aim: 'front' }),
  withSpell(mono('magearna', 5, 'Magearna', ['Acier', 'Fée'], 780, 120, 13, 801, 3),
    { name: 'Rayon Floral', desc: 'Tous les 4 tours : 240% ATK Fée sur le plus faible.', every: 4, mult: 2.4, aim: 'weak' }),
  withSpell(line3('igglybuff', 1, ['Toudoudou', ['Normal', 'Fée'], 420, 30, 10, 174], ['Rondoudou', ['Normal', 'Fée'], 820, 62, 10, 39], ['Grodoudou', ['Normal', 'Fée'], 1380, 100, 10, 40], 2),
    { name: 'Berceuse', desc: 'Tous les 4 tours : 130% ATK + étourdit la cible.', every: 4, mult: 1.3, aim: 'tank', stun: true }),
  withSpell(mono('xerneas', 5, 'Xerneas', 'Fée', 840, 120, 15, 716, 3),
    { name: 'Géo-Contrôle', desc: 'Tous les 4 tours : 200% ATK Fée sur 2 cibles + 20% ATK d’équipe.', every: 4, mult: 2.0, aim: 'aoe2', teamAtk: 0.2 }),
  L('koffing', 3, [], 2,
    { name: 'Gaz Toxik', desc: 'Tous les 3 tours : 160% ATK sur 2 cibles + empoisonne.', every: 3, mult: 1.6, aim: 'aoe2', dot: { pct: 0.04, turns: 3 } },
    [S('Smogo', 'Poison', 420, 46, 10, 109)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Smogogo', 'Poison', 960, 100, 10, 110), S('Smogogo ★', 'Poison', 1500, 150, 11, 110)] },
      { id: 'galar', stages: [S('Smogogo de Galar', ['Poison', 'Fée'], 960, 105, 10, 10167), S('Smogogo de Galar ★', ['Poison', 'Fée'], 1500, 155, 11, 10167)] }
    ] }),
  withSpell(line2('munchlax', 4, ['Goinfrex', 'Normal', 560, 60, 8, 446], ['Ronflex', 'Normal', 1240, 125, 8, 143], 1, ['Force']),
    { name: 'Plaquage', desc: 'Tous les 3 tours : 180% ATK + étourdit + soigne 10%.', every: 3, mult: 1.8, aim: 'front', stun: true, healAlly: 0.1 }),
  withSpell(mono('groudon', 5, 'Groudon', 'Sol', 900, 125, 12, 383, 1),
    { name: 'Lame Pangéenne', desc: 'Tous les 4 tours : 245% ATK Sol à tous.', every: 4, mult: 2.45, aim: 'all' }),
  withSpell(mono('zacian', 5, 'Zacian', 'Fée', 760, 135, 20, 888, 1),
    { name: 'Gladius Maximus', desc: 'Tous les 3 tours : 240% ATK Acier sur le front.', every: 3, mult: 2.4, aim: 'front' }),

  /* ——— Nouvelles lignées ——— */
  L('caterpie', 1, [], 3,
    { name: 'Poudre Dodo', desc: 'Tous les 4 tours : 120% ATK sur 2 cibles + les endort (étourdit).', every: 4, mult: 1.2, aim: 'aoe2', stun: true },
    [S('Chenipan', 'Insecte', 350, 39, 12, 10), S('Chrysacier', 'Insecte', 670, 76, 11, 11), S('Papilusion', ['Insecte', 'Vol'], 1080, 125, 14, 12)]),
  L('rattata', 1, [], 1,
    { name: 'Croc de Mort', desc: 'Tous les 3 tours : 185% ATK sur le plus faible.', every: 3, mult: 1.85, aim: 'weak' },
    [S('Rattata', 'Normal', 350, 37, 13, 19), S('Rattatac', 'Normal', 660, 72, 14, 20), S('Rattatac ★', 'Normal', 1060, 119, 15, 20)]),
  L('psyduck', 1, [], 2,
    { name: 'Choc Mental', desc: 'Tous les 3 tours : 160% ATK Psy sur une cible au hasard + l’étourdit.', every: 3, mult: 1.6, aim: 'random', stun: true },
    [S('Psykokwak', 'Eau', 400, 40, 12, 54), S('Akwakwak', 'Eau', 760, 78, 13, 55), S('Akwakwak ★', 'Eau', 1220, 128, 14, 55)]),
  L('poliwag', 1, [], 1,
    { name: 'Hypnose', desc: 'Tous les 3 tours : 150% ATK + étourdit la cible.', every: 3, mult: 1.5, aim: 'front', stun: true },
    [S('Ptitard', 'Eau', 430, 40, 14, 60), S('Têtarte', 'Eau', 810, 78, 14, 61)],
    { at: 3, forms: [
      { id: 'tartard', stages: [S('Tartard', ['Eau', 'Combat'], 1300, 128, 14, 62)] },
      { id: 'tarpaud', stages: [S('Tarpaud', 'Eau', 1300, 128, 14, 186)] }
    ] }),
  L('vulpix', 1, [], 3,
    { name: 'Lance-Flammes', desc: 'Tous les 3 tours : 165% ATK Feu sur la cible la plus loin + brûle.', every: 3, mult: 1.65, aim: 'back', dot: { pct: 0.04, turns: 3 } },
    [S('Goupix', 'Feu', 400, 37, 13, 37), S('Feunard', 'Feu', 760, 72, 14, 38), S('Feunard ★', 'Feu', 1220, 119, 15, 38)]),
  L('ponyta', 1, [], 1,
    { name: 'Nitrocharge', desc: 'Tous les 3 tours : 160% ATK + l’allié le plus lent gagne 3 SPD.', every: 3, mult: 1.6, aim: 'front', allyBuff: true },
    [S('Ponyta', 'Feu', 370, 41, 14, 77)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Galopa', 'Feu', 710, 80, 14, 78), S('Galopa ★', 'Feu', 1140, 132, 15, 78)] },
      { id: 'galar', stages: [S('Galopa de Galar', ['Psy', 'Fée'], 710, 80, 14, 10163), S('Galopa de Galar ★', ['Psy', 'Fée'], 1140, 132, 15, 10163)] }
    ] }),
  L('krabby', 1, ['Force'], 1,
    { name: 'Pince-Masse', desc: 'Tous les 3 tours : 200% ATK Eau sur le front.', every: 3, mult: 2.0, aim: 'front' },
    [S('Krabby', 'Eau', 370, 47, 12, 98), S('Krabboss', 'Eau', 700, 91, 13, 99), S('Krabboss ★', 'Eau', 1130, 150, 14, 99)]),
  L('pachirisu', 1, [], 2,
    { name: 'Frotte-Frimousse', desc: 'Tous les 3 tours : 130% ATK Électrik + ralentit fortement.', every: 3, mult: 1.3, aim: 'front', slow: 4 },
    [S('Pachirisu', 'Électrik', 370, 36, 14, 417), S('Pachirisu ★', 'Électrik', 710, 71, 14, 417), S('Pachirisu ★★', 'Électrik', 1140, 116, 15, 417)]),
  L('poochyena', 1, [], 1,
    { name: 'Mâchouille', desc: 'Tous les 3 tours : 165% ATK Ténèbres + baisse l’ATK de 15%.', every: 3, mult: 1.65, aim: 'front', atkBreak: 0.15 },
    [S('Medhyèna', 'Ténèbres', 370, 39, 11, 261), S('Grahyèna', 'Ténèbres', 700, 76, 13, 262), S('Grahyèna ★', 'Ténèbres', 1120, 125, 14, 262)]),
  L('lotad', 1, [], 2,
    { name: 'Giga-Sangsue', desc: 'Tous les 3 tours : 150% ATK Plante + soigne l’allié le plus blessé de 8%.', every: 3, mult: 1.5, aim: 'front', healAlly: 0.08 },
    [S('Nénupiot', ['Eau', 'Plante'], 410, 39, 11, 270), S('Lombre', ['Eau', 'Plante'], 770, 76, 12, 271), S('Ludicolo', ['Eau', 'Plante'], 1240, 125, 14, 272)]),
  L('seedot', 1, [], 1,
    { name: 'Tranch’Air', desc: 'Tous les 3 tours : 145% ATK sur 2 cibles proches.', every: 3, mult: 1.45, aim: 'aoe2' },
    [S('Grainipiot', 'Plante', 390, 41, 11, 273), S('Pifeuil', ['Plante', 'Ténèbres'], 740, 80, 12, 274), S('Tengalice', ['Plante', 'Ténèbres'], 1180, 132, 14, 275)]),
  L('pawmi', 1, ['Force'], 1,
    { name: 'Poing Éclair', desc: 'Tous les 3 tours : 170% ATK Électrik + ralentit.', every: 3, mult: 1.7, aim: 'front', slow: 2 },
    [S('Pohm', 'Électrik', 370, 44, 12, 921), S('Pohmotte', ['Électrik', 'Combat'], 700, 86, 13, 922), S('Pohmarmotte', ['Électrik', 'Combat'], 1120, 141, 15, 923)]),
  L('fidough', 1, [], 1,
    { name: 'Câlinerie', desc: 'Tous les 3 tours : 160% ATK Fée + baisse l’ATK de 10%.', every: 3, mult: 1.6, aim: 'front', atkBreak: 0.1 },
    [S('Pâtachiot', 'Fée', 390, 37, 13, 926), S('Briochien', 'Fée', 750, 72, 14, 927), S('Briochien ★', 'Fée', 1200, 118, 15, 927)]),
  L('slowpoke', 2, [], 2,
    { name: 'Psyko', desc: 'Tous les 4 tours : 190% ATK Psy sur une cible au hasard + ralentit.', every: 4, mult: 1.9, aim: 'random', slow: 2 },
    [S('Ramoloss', ['Eau', 'Psy'], 410, 49, 10, 79)],
    { at: 2, forms: [
      { id: 'flagadoss', stages: [S('Flagadoss', ['Eau', 'Psy'], 870, 102, 12, 80), S('Flagadoss ★', ['Eau', 'Psy'], 1350, 154, 13, 80)] },
      { id: 'roigada', stages: [S('Roigada', ['Eau', 'Psy'], 870, 102, 12, 199), S('Roigada ★', ['Eau', 'Psy'], 1350, 154, 13, 199)] }
    ] }),
  L('ekans', 2, [], 1,
    { name: 'Crochet Venin', desc: 'Tous les 3 tours : 150% ATK + empoisonne fort (6%/tour).', every: 3, mult: 1.5, aim: 'front', dot: { pct: 0.06, turns: 3 } },
    [S('Abo', 'Poison', 350, 48, 12, 23), S('Arbok', 'Poison', 730, 100, 14, 24), S('Arbok ★', 'Poison', 1130, 150, 15, 24)]),
  L('houndour', 2, [], 2,
    { name: 'Crocs Feu', desc: 'Tous les 3 tours : 170% ATK Feu sur le plus faible + brûle.', every: 3, mult: 1.7, aim: 'weak', dot: { pct: 0.04, turns: 3 } },
    [S('Malosse', ['Ténèbres', 'Feu'], 360, 51, 13, 228), S('Démolosse', ['Ténèbres', 'Feu'], 750, 107, 15, 229), S('Démolosse ★', ['Ténèbres', 'Feu'], 1160, 162, 16, 229)]),
  L('phanpy', 2, ['Force'], 1,
    { name: 'Séisme', desc: 'Tous les 4 tours : 150% ATK Sol sur 2 cibles + bouclier 10%.', every: 4, mult: 1.5, aim: 'aoe2', shield: 0.1 },
    [S('Phanpy', 'Sol', 400, 53, 11, 231), S('Donphan', 'Sol', 850, 112, 13, 232), S('Donphan ★', 'Sol', 1320, 169, 14, 232)]),
  L('carvanha', 2, [], 1,
    { name: 'Aqua-Brèche', desc: 'Tous les 3 tours : 190% ATK Eau sur le plus faible.', every: 3, mult: 1.9, aim: 'weak' },
    [S('Carvanha', ['Eau', 'Ténèbres'], 330, 53, 13, 318), S('Sharpedo', ['Eau', 'Ténèbres'], 690, 112, 15, 319), S('Sharpedo ★', ['Eau', 'Ténèbres'], 1070, 169, 16, 319)]),
  L('croagunk', 2, ['Force'], 1,
    { name: 'Direct Toxik', desc: 'Tous les 3 tours : 170% ATK + empoisonne.', every: 3, mult: 1.7, aim: 'front', dot: { pct: 0.04, turns: 3 } },
    [S('Cradopaud', ['Poison', 'Combat'], 370, 50, 12, 453), S('Coatox', ['Poison', 'Combat'], 770, 105, 14, 454), S('Coatox ★', ['Poison', 'Combat'], 1190, 159, 15, 454)]),
  L('hippopotas', 2, [], 1,
    { name: 'Tempête de Sable', desc: 'Tous les 4 tours : 90% ATK à tous les ennemis + les ralentit.', every: 4, mult: 0.9, aim: 'all', slow: 1 },
    [S('Hippopotas', 'Sol', 430, 52, 11, 449), S('Hippodocus', 'Sol', 900, 108, 13, 450), S('Hippodocus ★', 'Sol', 1400, 163, 14, 450)]),
  L('nickit', 2, [], 2,
    { name: 'Larcin', desc: 'Tous les 3 tours : frappe le plus faible et vole son ATK (min. 110% de son ATK).', every: 3, mult: 1.5, aim: 'weak', stealAtk: true },
    [S('Goupilou', 'Ténèbres', 360, 46, 12, 827), S('Roublenard', 'Ténèbres', 760, 96, 15, 828), S('Roublenard ★', 'Ténèbres', 1180, 144, 16, 828)]),
  L('yungoos', 2, [], 1,
    { name: 'Hyper Croc', desc: 'Tous les 3 tours : 185% ATK sur le front.', every: 3, mult: 1.85, aim: 'front' },
    [S('Manglouton', 'Normal', 370, 51, 12, 734), S('Argouste', 'Normal', 770, 107, 13, 735), S('Argouste ★', 'Normal', 1190, 162, 14, 735)]),
  L('sinistea', 2, ['Mage'], 3,
    { name: 'Ball’Ombre', desc: 'Tous les 3 tours : 175% ATK Spectre sur la cible la plus loin.', every: 3, mult: 1.75, aim: 'back' },
    [S('Théffroi', 'Spectre', 370, 56, 12, 854), S('Polthégeist', 'Spectre', 770, 119, 14, 855), S('Polthégeist ★', 'Spectre', 1200, 178, 15, 855)]),
  L('bounsweet', 2, [], 1,
    { name: 'Tropi-Kick', desc: 'Tous les 3 tours : 170% ATK Plante + baisse l’ATK de 15%.', every: 3, mult: 1.7, aim: 'front', atkBreak: 0.15 },
    [S('Croquine', 'Plante', 390, 53, 11, 761), S('Candine', 'Plante', 820, 112, 13, 762), S('Sucreine', 'Plante', 1280, 169, 15, 763)]),
  L('wimpod', 2, ['Force'], 1,
    { name: 'Première Impression', desc: 'Tous les 3 tours : 195% ATK Insecte sur le front.', every: 3, mult: 1.95, aim: 'front' },
    [S('Sovkipou', ['Insecte', 'Eau'], 410, 55, 13, 767), S('Sarmuraï', ['Insecte', 'Eau'], 870, 115, 12, 768), S('Sarmuraï ★', ['Insecte', 'Eau'], 1350, 172, 13, 768)]),
  L('numel', 2, [], 2,
    { name: 'Éruption', desc: 'Tous les 4 tours : 170% ATK Feu sur 2 cibles.', every: 4, mult: 1.7, aim: 'aoe2' },
    [S('Chamallot', ['Feu', 'Sol'], 360, 50, 11, 322), S('Camérupt', ['Feu', 'Sol'], 750, 105, 12, 323), S('Camérupt ★', ['Feu', 'Sol'], 1170, 158, 13, 323)]),
  L('chingling', 2, ['Mage'], 3,
    { name: 'Bruit Blanc', desc: 'Tous les 4 tours : 85% ATK Psy à tous les ennemis.', every: 4, mult: 0.85, aim: 'all' },
    [S('Korillon', 'Psy', 380, 48, 12, 433), S('Éoko', 'Psy', 800, 100, 14, 358), S('Éoko ★', 'Psy', 1240, 150, 15, 358)]),
  L('elekid', 3, ['Force'], 1,
    { name: 'Poing Éclair', desc: 'Tous les 3 tours : 180% ATK Électrik + étourdit la cible.', every: 3, mult: 1.8, aim: 'front', stun: true },
    [S('Élekid', 'Électrik', 390, 60, 14, 239), S('Élektek', 'Électrik', 800, 128, 15, 125), S('Élekable', 'Électrik', 1220, 188, 17, 466)]),
  L('magby', 3, ['Mage'], 3,
    { name: 'Déflagration', desc: 'Tous les 4 tours : 175% ATK Feu sur 2 cibles + brûle.', every: 4, mult: 1.75, aim: 'aoe2', dot: { pct: 0.04, turns: 3 } },
    [S('Magby', 'Feu', 390, 60, 13, 240), S('Magmar', 'Feu', 810, 129, 15, 126), S('Maganon', 'Feu', 1240, 190, 16, 467)]),
  L('porygon', 3, ['Mage'], 3,
    { name: 'Ultralaser', desc: 'Tous les 4 tours : 260% ATK sur la cible la plus tanky, puis ralentit Porygon.', every: 4, mult: 2.6, aim: 'tank', selfSlow: 1 },
    [S('Porygon', 'Normal', 400, 62, 11, 137), S('Porygon2', 'Normal', 810, 134, 13, 233), S('Porygon-Z', 'Normal', 1250, 197, 17, 474)]),
  L('feebas', 3, [], 2,
    { name: 'Anneau Hydro', desc: 'Tous les 3 tours : 150% ATK Eau + soigne l’allié le plus blessé de 12%.', every: 3, mult: 1.5, aim: 'front', healAlly: 0.12 },
    [S('Barpau', 'Eau', 440, 54, 13, 349), S('Milobellus', 'Eau', 910, 115, 14, 350), S('Milobellus ★', 'Eau', 1400, 170, 16, 350)]),
  L('duskull', 3, [], 1,
    { name: 'Poing Ombre', desc: 'Tous les 3 tours : 180% ATK Spectre sur le plus faible, sans jamais rater.', every: 3, mult: 1.8, aim: 'weak' },
    [S('Skelénox', 'Spectre', 420, 54, 11, 355), S('Téraclope', 'Spectre', 870, 115, 12, 356), S('Noctunoir', 'Spectre', 1340, 170, 15, 477)]),
  L('rolycoly', 3, [], 1,
    { name: 'Tir de Goudron', desc: 'Tous les 3 tours : 150% ATK + ralentit + brûle.', every: 3, mult: 1.5, aim: 'front', slow: 2, dot: { pct: 0.04, turns: 3 } },
    [S('Charbi', 'Roche', 460, 48, 11, 837), S('Wagomine', ['Roche', 'Feu'], 950, 103, 13, 838), S('Monthracite', ['Roche', 'Feu'], 1460, 152, 14, 839)]),
  L('flabebe', 3, ['Mage'], 3,
    { name: 'Éclat Magique', desc: 'Tous les 3 tours : 140% ATK Fée sur 2 cibles + soigne un allié de 8%.', every: 3, mult: 1.4, aim: 'aoe2', healAlly: 0.08 },
    [S('Flabébé', 'Fée', 430, 57, 11, 669), S('Floette', 'Fée', 890, 122, 13, 670), S('Florges', 'Fée', 1370, 180, 16, 671)]),
  L('clamperl', 3, [], 2,
    { name: 'Hydrocanon', desc: 'Tous les 4 tours : 220% ATK Eau sur la cible la plus loin.', every: 4, mult: 2.2, aim: 'back' },
    [S('Coquiperl', 'Eau', 380, 55, 11, 366)],
    { at: 2, forms: [
      { id: 'serpang', stages: [S('Serpang', 'Eau', 780, 117, 13, 367), S('Serpang ★', 'Eau', 1200, 173, 15, 367)] },
      { id: 'rosabyss', stages: [S('Rosabyss', 'Eau', 780, 117, 13, 368), S('Rosabyss ★', 'Eau', 1200, 173, 15, 368)] }
    ] }),
  L('mienfoo', 3, ['Force'], 1,
    { name: 'Pied Voltige', desc: 'Tous les 3 tours : 215% ATK Combat, mais perd 6% de ses PV.', every: 3, mult: 2.15, aim: 'front', recoil: 0.06 },
    [S('Kungfouine', 'Combat', 350, 60, 13, 619), S('Shaofouine', 'Combat', 720, 129, 15, 620), S('Shaofouine ★', 'Combat', 1110, 190, 17, 620)]),
  L('meditite', 3, ['Force'], 1,
    { name: 'Pied Voltige', desc: 'Tous les 3 tours : 200% ATK Combat sur le plus faible.', every: 3, mult: 2.0, aim: 'weak' },
    [S('Méditikka', ['Combat', 'Psy'], 370, 47, 12, 307), S('Charmina', ['Combat', 'Psy'], 750, 101, 14, 308), S('Charmina ★', ['Combat', 'Psy'], 1160, 150, 16, 308)]),
  L('staryu', 3, ['Mage'], 3,
    { name: 'Météores', desc: 'Tous les 3 tours : 175% ATK sur le plus faible.', every: 3, mult: 1.75, aim: 'weak' },
    [S('Stari', 'Eau', 380, 54, 13, 120), S('Staross', ['Eau', 'Psy'], 780, 115, 16, 121), S('Staross ★', ['Eau', 'Psy'], 1200, 170, 18, 121)]),
  L('litleo', 4, [], 2,
    { name: 'Rugissement Ardent', desc: 'Tous les 4 tours : 175% ATK Feu sur 2 cibles + 8% ATK d’équipe.', every: 4, mult: 1.75, aim: 'aoe2', teamAtk: 0.08 },
    [S('Hélionceau', ['Feu', 'Normal'], 490, 73, 13, 667), S('Némélios', ['Feu', 'Normal'], 910, 134, 15, 668), S('Némélios ★', ['Feu', 'Normal'], 1460, 204, 16, 668)]),
  L('duraludon', 4, [], 2,
    { name: 'Laser Acier', desc: 'Tous les 4 tours : 230% ATK Acier sur la cible la plus tanky + bouclier 12%.', every: 4, mult: 2.3, aim: 'tank', shield: 0.12 },
    [S('Duralugon', ['Acier', 'Dragon'], 540, 79, 13, 884), S('Pondralugon', ['Acier', 'Dragon'], 1000, 144, 14, 1018), S('Pondralugon ★', ['Acier', 'Dragon'], 1600, 218, 15, 1018)]),
  L('kubfu', 4, ['Force'], 1,
    { name: 'Poing Final', desc: 'Tous les 3 tours : 220% ATK Combat sur le plus faible.', every: 3, mult: 2.2, aim: 'weak' },
    [S('Wushours', 'Combat', 530, 80, 13, 891)],
    { at: 2, forms: [
      { id: 'poing', stages: [S('Shifours (Poing Final)', ['Combat', 'Ténèbres'], 980, 147, 15, 892), S('Shifours (Poing Final) ★', ['Combat', 'Ténèbres'], 1570, 223, 16, 892)] },
      { id: 'mille', stages: [S('Shifours (Mille Poings)', ['Combat', 'Eau'], 980, 147, 15, 10191), S('Shifours (Mille Poings) ★', ['Combat', 'Eau'], 1570, 223, 16, 10191)] }
    ] }),
  L('kangaskhan', 4, ['Force'], 1,
    { name: 'Uppercut Parental', desc: 'Tous les 3 tours : 190% ATK + étourdit la cible.', every: 3, mult: 1.9, aim: 'front', stun: true },
    [S('Kangourex', 'Normal', 540, 68, 14, 115), S('Kangourex ★', 'Normal', 990, 126, 15, 115), S('Kangourex ★★', 'Normal', 1590, 190, 16, 115)]),
  L('tatsugiri', 4, [], 3,
    { name: 'Ordre Ferme', desc: 'Tous les 4 tours : 190% ATK Dragon sur la cible la plus loin + 10% ATK d’équipe.', every: 4, mult: 1.9, aim: 'back', teamAtk: 0.1 },
    [S('Nigirigon', ['Dragon', 'Eau'], 480, 77, 13, 978), S('Nigirigon ★', ['Dragon', 'Eau'], 880, 141, 14, 978), S('Nigirigon ★★', ['Dragon', 'Eau'], 1410, 214, 15, 978)]),
  L('ho-oh', 5, [], 3,
    { name: 'Feu Sacré', desc: 'Tous les 4 tours : 210% ATK Feu sur 2 cibles + brûle fort.', every: 4, mult: 2.1, aim: 'aoe2', dot: { pct: 0.06, turns: 3 } },
    [S('Ho-Oh', ['Feu', 'Vol'], 900, 134, 17, 250), S('Ho-Oh ★', ['Feu', 'Vol'], 1380, 200, 18, 250), S('Ho-Oh ★★', ['Feu', 'Vol'], 1940, 273, 19, 250)]),
  L('suicune', 5, [], 2,
    { name: 'Aurore Pure', desc: 'Tous les 3 tours : 170% ATK Eau + soigne l’allié le plus blessé de 15%.', every: 3, mult: 1.7, aim: 'front', healAlly: 0.15 },
    [S('Suicune', 'Eau', 880, 111, 16, 245), S('Suicune ★', 'Eau', 1360, 167, 17, 245), S('Suicune ★★', 'Eau', 1900, 227, 18, 245)]),
  L('entei', 5, [], 1,
    { name: 'Feu Sacré', desc: 'Tous les 3 tours : 220% ATK Feu + brûle.', every: 3, mult: 2.2, aim: 'front', dot: { pct: 0.05, turns: 3 } },
    [S('Entei', 'Feu', 840, 126, 17, 244), S('Entei ★', 'Feu', 1290, 188, 18, 244), S('Entei ★★', 'Feu', 1810, 256, 19, 244)]),
  L('raikou', 5, [], 3,
    { name: 'Fatal-Foudre', desc: 'Tous les 4 tours : 240% ATK Électrik sur le plus faible + étourdit.', every: 4, mult: 2.4, aim: 'weak', stun: true },
    [S('Raikou', 'Électrik', 800, 126, 18, 243), S('Raikou ★', 'Électrik', 1230, 188, 19, 243), S('Raikou ★★', 'Électrik', 1730, 256, 20, 243)]),
  L('latias', 5, [], 3,
    { name: 'Ball’Brume', desc: 'Tous les 3 tours : 170% ATK Psy + baisse l’ATK de 20% + soigne un allié de 8%.', every: 3, mult: 1.7, aim: 'front', atkBreak: 0.2, healAlly: 0.08 },
    [S('Latias', ['Dragon', 'Psy'], 830, 123, 18, 380), S('Latias ★', ['Dragon', 'Psy'], 1270, 184, 19, 380), S('Latias ★★', ['Dragon', 'Psy'], 1790, 251, 20, 380)]),
  L('latios', 5, [], 3,
    { name: 'Lumi-Éclat', desc: 'Tous les 3 tours : 220% ATK Psy sur le plus faible.', every: 3, mult: 2.2, aim: 'weak' },
    [S('Latios', ['Dragon', 'Psy'], 790, 134, 18, 381), S('Latios ★', ['Dragon', 'Psy'], 1220, 200, 19, 381), S('Latios ★★', ['Dragon', 'Psy'], 1720, 273, 20, 381)]),
  L('kyogre', 5, [], 3,
    { name: 'Onde Originelle', desc: 'Tous les 4 tours : 170% ATK Eau à tous les ennemis.', every: 4, mult: 1.7, aim: 'all' },
    [S('Kyogre', 'Eau', 880, 142, 17, 382), S('Kyogre ★', 'Eau', 1360, 212, 18, 382), S('Kyogre ★★', 'Eau', 1900, 289, 19, 382)]),
  L('palkia', 5, [], 2,
    { name: 'Spatio-Rift', desc: 'Tous les 4 tours : 230% ATK Dragon sur 2 cibles.', every: 4, mult: 2.3, aim: 'aoe2' },
    [S('Palkia', ['Eau', 'Dragon'], 850, 142, 17, 484), S('Palkia ★', ['Eau', 'Dragon'], 1310, 212, 18, 484), S('Palkia ★★', ['Eau', 'Dragon'], 1830, 289, 19, 484)]),
  L('reshiram', 5, [], 3,
    { name: 'Flamme Bleue', desc: 'Tous les 4 tours : 230% ATK Feu sur 2 cibles + brûle.', every: 4, mult: 2.3, aim: 'aoe2', dot: { pct: 0.05, turns: 3 } },
    [S('Reshiram', ['Dragon', 'Feu'], 870, 142, 17, 643), S('Reshiram ★', ['Dragon', 'Feu'], 1340, 212, 18, 643), S('Reshiram ★★', ['Dragon', 'Feu'], 1880, 289, 19, 643)]),
  L('zekrom', 5, [], 1,
    { name: 'Éclair Croix', desc: 'Tous les 3 tours : 230% ATK Électrik + étourdit.', every: 3, mult: 2.3, aim: 'front', stun: true },
    [S('Zekrom', ['Dragon', 'Électrik'], 870, 142, 17, 644), S('Zekrom ★', ['Dragon', 'Électrik'], 1340, 212, 18, 644), S('Zekrom ★★', ['Dragon', 'Électrik'], 1880, 289, 19, 644)]),
  L('arceus', 5, [], 2,
    { name: 'Jugement', desc: 'Tous les 4 tours : 140% ATK à tous les ennemis.', every: 4, mult: 1.4, aim: 'all' },
    [S('Arceus', 'Normal', 900, 128, 18, 493), S('Arceus ★', 'Normal', 1380, 192, 19, 493), S('Arceus ★★', 'Normal', 1940, 262, 20, 493)]),
  L('koraidon', 5, [], 1,
    { name: 'Méga-Écrasement', desc: 'Tous les 3 tours : 240% ATK Combat sur le front.', every: 3, mult: 2.4, aim: 'front' },
    [S('Koraidon', ['Combat', 'Dragon'], 870, 136, 19, 1007), S('Koraidon ★', ['Combat', 'Dragon'], 1330, 204, 20, 1007), S('Koraidon ★★', ['Combat', 'Dragon'], 1870, 278, 21, 1007)]),
  L('heatran', 5, [], 2,
    { name: 'Vortex Magma', desc: 'Tous les 4 tours : 170% ATK Feu sur 2 cibles + brûle fort.', every: 4, mult: 1.7, aim: 'aoe2', dot: { pct: 0.07, turns: 3 } },
    [S('Heatran', ['Feu', 'Acier'], 840, 134, 16, 485), S('Heatran ★', ['Feu', 'Acier'], 1300, 200, 17, 485), S('Heatran ★★', ['Feu', 'Acier'], 1820, 273, 18, 485)]),

  /* ——— Nouvelles lignées (vague 3) ——— */
  L('weedle', 1, [], 1,
    { name: 'Dard-Venin', desc: 'Tous les 3 tours : 150% ATK Poison sur le plus faible + empoisonne.', every: 3, mult: 1.5, aim: 'weak', dot: { pct: 0.05, turns: 3 } },
    [S('Aspicot', ['Insecte', 'Poison'], 350, 39, 12, 13), S('Coconfort', ['Insecte', 'Poison'], 670, 76, 11, 14), S('Dardargnan', ['Insecte', 'Poison'], 1080, 125, 14, 15)]),
  L('oddish', 1, [], 2,
    { name: 'Poudre Toxik', desc: 'Tous les 4 tours : 120% ATK sur 2 cibles + empoisonne.', every: 4, mult: 1.2, aim: 'aoe2', dot: { pct: 0.05, turns: 3 } },
    [S('Mystherbe', ['Plante', 'Poison'], 400, 43, 11, 43), S('Ortide', ['Plante', 'Poison'], 770, 84, 11, 44)],
    { at: 3, forms: [
      { id: 'rafflesia', stages: [S('Rafflesia', ['Plante', 'Poison'], 1230, 138, 13, 45)] },
      { id: 'joliflor', stages: [S('Joliflor', 'Plante', 1230, 138, 13, 182)] }
    ] }),
  L('bellsprout', 1, [], 1,
    { name: 'Tranch’Herbe', desc: 'Tous les 3 tours : 170% ATK Plante + ignore 8% PV.', every: 3, mult: 1.7, aim: 'front', shred: 0.08 },
    [S('Chétiflor', ['Plante', 'Poison'], 380, 42, 11, 69), S('Boustiflor', ['Plante', 'Poison'], 730, 82, 12, 70), S('Empiflor', ['Plante', 'Poison'], 1170, 135, 14, 71)]),
  L('whismur', 1, [], 2,
    { name: 'Mégaphone', desc: 'Tous les 4 tours : 130% ATK sur tous les ennemis.', every: 4, mult: 1.3, aim: 'all' },
    [S('Chuchmur', 'Normal', 410, 39, 11, 293), S('Ramboum', 'Normal', 790, 76, 12, 294), S('Brouhabam', 'Normal', 1260, 126, 14, 295)]),
  L('pidove', 1, [], 2,
    { name: 'Lame d’Air', desc: 'Tous les 3 tours : 160% ATK Vol sur la cible la plus loin.', every: 3, mult: 1.6, aim: 'back' },
    [S('Poichigeon', ['Normal', 'Vol'], 380, 44, 12, 519), S('Colombeau', ['Normal', 'Vol'], 730, 86, 13, 520), S('Déflaisan', ['Normal', 'Vol'], 1170, 141, 15, 521)]),
  L('pikipek', 1, [], 3,
    { name: 'Bec-Canon', desc: 'Tous les 4 tours : 200% ATK Vol sur la cible la plus tanky.', every: 4, mult: 2.0, aim: 'tank' },
    [S('Picassaut', ['Normal', 'Vol'], 390, 45, 13, 731), S('Piclairon', ['Normal', 'Vol'], 750, 88, 13, 732), S('Bazoucan', ['Normal', 'Vol'], 1200, 144, 13, 733)]),
  L('wooloo', 1, [], 1,
    { name: 'Coup d’Boule', desc: 'Tous les 3 tours : 150% ATK + bouclier 12% PV.', every: 3, mult: 1.5, aim: 'front', shield: 0.12 },
    [S('Moumouton', 'Normal', 410, 37, 12, 831), S('Moumouflon', 'Normal', 780, 72, 14, 832), S('Moumouflon ★', 'Normal', 1250, 118, 15, 832)]),
  L('tandemaus', 1, [], 1,
    { name: 'Prolifération', desc: 'Tous les 3 tours : 140% ATK sur 2 cibles.', every: 3, mult: 1.4, aim: 'aoe2' },
    [S('Compagnol', 'Normal', 380, 36, 13, 924), S('Famignol', 'Normal', 730, 71, 15, 925), S('Famignol ★', 'Normal', 1170, 116, 16, 925)]),
  L('skwovet', 1, [], 1,
    { name: 'Grosse Bouchée', desc: 'Tous les 3 tours : 150% ATK + soigne 8%.', every: 3, mult: 1.5, aim: 'front', healAlly: 0.08 },
    [S('Rongourmand', 'Normal', 450, 40, 11, 819), S('Rongrigou', 'Normal', 860, 78, 11, 820), S('Rongrigou ★', 'Normal', 1380, 128, 12, 820)]),
  L('lechonk', 1, [], 1,
    { name: 'Charge', desc: 'Tous les 3 tours : 160% ATK.', every: 3, mult: 1.6, aim: 'front' },
    [S('Gourmelet', 'Normal', 430, 41, 11, 915), S('Fragroin', 'Normal', 820, 80, 13, 916), S('Fragroin ★', 'Normal', 1320, 132, 14, 916)]),
  L('kricketot', 1, [], 2,
    { name: 'Plaie-Croix', desc: 'Tous les 3 tours : 180% ATK Insecte sur le plus faible.', every: 3, mult: 1.8, aim: 'weak' },
    [S('Crikzik', 'Insecte', 360, 38, 11, 401), S('Mélokrik', 'Insecte', 680, 74, 13, 402), S('Mélokrik ★', 'Insecte', 1090, 121, 14, 402)]),
  L('hoppip', 1, [], 3,
    { name: 'Para-Spore', desc: 'Tous les 4 tours : 110% ATK sur 2 cibles + étourdit.', every: 4, mult: 1.1, aim: 'aoe2', stun: true },
    [S('Granivol', ['Plante', 'Vol'], 400, 36, 12, 187), S('Floravol', ['Plante', 'Vol'], 750, 71, 13, 188), S('Cotovol', ['Plante', 'Vol'], 1210, 116, 16, 189)]),
  L('seel', 1, [], 2,
    { name: 'Laser Glace', desc: 'Tous les 3 tours : 160% ATK Glace + ralentit (SPD -2).', every: 3, mult: 1.6, aim: 'front', slow: 2 },
    [S('Otaria', 'Eau', 420, 36, 12, 86), S('Lamantine', ['Eau', 'Glace'], 800, 71, 13, 87), S('Lamantine ★', ['Eau', 'Glace'], 1280, 116, 14, 87)]),
  L('smoliv', 1, [], 3,
    { name: 'Tir d’Olive', desc: 'Tous les 4 tours : 140% ATK sur 2 cibles + soigne 5%.', every: 4, mult: 1.4, aim: 'aoe2', healAlly: 0.05 },
    [S('Olivini', ['Plante', 'Normal'], 420, 46, 11, 928), S('Olivado', ['Plante', 'Normal'], 800, 89, 11, 929), S('Arboliva', ['Plante', 'Normal'], 1280, 147, 12, 930)]),
  L('buizel', 1, [], 1,
    { name: 'Aqua-Jet', desc: 'Tous les 3 tours : 160% ATK Eau sur le plus faible.', every: 3, mult: 1.6, aim: 'weak' },
    [S('Mustébouée', 'Eau', 370, 42, 13, 418), S('Mustéflott', 'Eau', 700, 82, 15, 419), S('Mustéflott ★', 'Eau', 1130, 135, 16, 419)]),
  L('tentacool', 2, [], 2,
    { name: 'Toxik', desc: 'Tous les 3 tours : 140% ATK sur 2 cibles + empoisonne.', every: 3, mult: 1.4, aim: 'aoe2', dot: { pct: 0.06, turns: 3 } },
    [S('Tentacool', ['Eau', 'Poison'], 390, 44, 13, 72), S('Tentacruel', ['Eau', 'Poison'], 830, 92, 15, 73), S('Tentacruel ★', ['Eau', 'Poison'], 1290, 138, 16, 73)]),
  L('shellder', 2, [], 1,
    { name: 'Stalactite', desc: 'Tous les 3 tours : 190% ATK Glace.', every: 3, mult: 1.9, aim: 'front' },
    [S('Kokiyas', 'Eau', 380, 48, 11, 90), S('Crustabri', ['Eau', 'Glace'], 810, 100, 14, 91), S('Crustabri ★', ['Eau', 'Glace'], 1250, 150, 15, 91)]),
  L('drowzee', 2, ['Mage'], 3,
    { name: 'Hypnose', desc: 'Tous les 4 tours : 130% ATK sur une cible au hasard + étourdit.', every: 4, mult: 1.3, aim: 'random', stun: true },
    [S('Soporifik', 'Psy', 400, 43, 11, 96), S('Hypnomade', 'Psy', 840, 90, 14, 97), S('Hypnomade ★', 'Psy', 1310, 136, 15, 97)]),
  L('natu', 2, ['Mage'], 3,
    { name: 'Psyko', desc: 'Tous les 3 tours : 170% ATK Psy sur la cible la plus loin.', every: 3, mult: 1.7, aim: 'back' },
    [S('Natu', ['Psy', 'Vol'], 350, 48, 13, 177), S('Xatu', ['Psy', 'Vol'], 730, 100, 15, 178), S('Xatu ★', ['Psy', 'Vol'], 1140, 150, 16, 178)]),
  L('snubbull', 2, [], 1,
    { name: 'Croc Fatal', desc: 'Tous les 3 tours : 170% ATK + baisse l’ATK de 10%.', every: 3, mult: 1.7, aim: 'front', atkBreak: 0.1 },
    [S('Snubbull', 'Fée', 380, 53, 11, 209), S('Granbull', 'Fée', 790, 112, 13, 210), S('Granbull ★', 'Fée', 1230, 169, 14, 210)]),
  L('sandile', 2, [], 1,
    { name: 'Séisme', desc: 'Tous les 4 tours : 140% ATK Sol sur 2 cibles.', every: 4, mult: 1.4, aim: 'aoe2' },
    [S('Mascaïman', ['Sol', 'Ténèbres'], 390, 53, 13, 551), S('Escroco', ['Sol', 'Ténèbres'], 820, 111, 14, 552), S('Crocorible', ['Sol', 'Ténèbres'], 1280, 167, 16, 553)]),
  L('tympole', 2, [], 2,
    { name: 'Ébullition', desc: 'Tous les 3 tours : 160% ATK Eau + brûle.', every: 3, mult: 1.6, aim: 'front', dot: { pct: 0.04, turns: 3 } },
    [S('Tritonde', 'Eau', 400, 48, 13, 535), S('Batracné', ['Eau', 'Sol'], 850, 100, 14, 536), S('Crapustule', ['Eau', 'Sol'], 1320, 150, 15, 537)]),
  L('elgyem', 2, ['Mage'], 3,
    { name: 'Psyko', desc: 'Tous les 3 tours : 180% ATK Psy sur le plus faible.', every: 3, mult: 1.8, aim: 'weak' },
    [S('Lewsor', 'Psy', 380, 55, 11, 605), S('Neitram', 'Psy', 800, 115, 12, 606), S('Neitram ★', 'Psy', 1240, 172, 13, 606)]),
  L('rufflet', 2, [], 1,
    { name: 'Rapace', desc: 'Tous les 3 tours : 190% ATK Vol + perd 5% de ses PV.', every: 3, mult: 1.9, aim: 'front', recoil: 0.05 },
    [S('Furaiglon', ['Normal', 'Vol'], 400, 54, 12, 627)],
    { at: 2, forms: [
      { id: 'unys', stages: [S('Gueriaigle', ['Normal', 'Vol'], 840, 114, 14, 628), S('Gueriaigle ★', ['Normal', 'Vol'], 1300, 171, 15, 628)] },
      { id: 'hisui', stages: [S('Gueriaigle de Hisui', ['Psy', 'Vol'], 840, 114, 14, 10240), S('Gueriaigle de Hisui ★', ['Psy', 'Vol'], 1300, 171, 15, 10240)] }
    ] }),
  L('vullaby', 2, [], 1,
    { name: 'Vibrobscur', desc: 'Tous les 3 tours : 150% ATK Ténèbres sur le plus faible + bouclier 10% PV.', every: 3, mult: 1.5, aim: 'weak', shield: 0.1 },
    [S('Vostourno', ['Ténèbres', 'Vol'], 440, 43, 12, 629), S('Vaututrice', ['Ténèbres', 'Vol'], 920, 90, 14, 630), S('Vaututrice ★', ['Ténèbres', 'Vol'], 1420, 136, 15, 630)]),
  L('skiddo', 2, [], 1,
    { name: 'Encornebois', desc: 'Tous les 3 tours : 160% ATK Plante + soigne 6%.', every: 3, mult: 1.6, aim: 'front', healAlly: 0.06 },
    [S('Cabriolaine', 'Plante', 420, 49, 12, 672), S('Chevroum', 'Plante', 880, 102, 14, 673), S('Chevroum ★', 'Plante', 1370, 154, 15, 673)]),
  L('pumpkaboo', 2, [], 2,
    { name: 'Bombe Graine', desc: 'Tous les 3 tours : 150% ATK sur 2 cibles.', every: 3, mult: 1.5, aim: 'aoe2' },
    [S('Pitrouille', ['Spectre', 'Plante'], 380, 46, 12, 710), S('Banshitrouye', ['Spectre', 'Plante'], 810, 97, 14, 711), S('Banshitrouye ★', ['Spectre', 'Plante'], 1250, 146, 15, 711)]),
  L('wattrel', 2, [], 3,
    { name: 'Vent Électrique', desc: 'Tous les 3 tours : 150% ATK Électrik sur 2 cibles.', every: 3, mult: 1.5, aim: 'aoe2' },
    [S('Zapétrel', ['Électrik', 'Vol'], 340, 50, 13, 940), S('Fulgulairo', ['Électrik', 'Vol'], 720, 105, 16, 941), S('Fulgulairo ★', ['Électrik', 'Vol'], 1120, 158, 17, 941)]),
  L('maschiff', 2, [], 1,
    { name: 'Mâchouille', desc: 'Tous les 3 tours : 170% ATK + baisse l’ATK de 12%.', every: 3, mult: 1.7, aim: 'front', atkBreak: 0.12 },
    [S('Grondogue', 'Ténèbres', 380, 53, 12, 942), S('Dogrino', 'Ténèbres', 800, 112, 14, 943), S('Dogrino ★', 'Ténèbres', 1240, 169, 15, 943)]),
  L('shroodle', 2, [], 2,
    { name: 'Gribouille', desc: 'Tous les 3 tours : 140% ATK sur le plus faible + empoisonne.', every: 3, mult: 1.4, aim: 'weak', dot: { pct: 0.06, turns: 3 } },
    [S('Gribouraigne', ['Poison', 'Normal'], 340, 48, 13, 944), S('Tag-Tag', ['Poison', 'Normal'], 730, 100, 16, 945), S('Tag-Tag ★', ['Poison', 'Normal'], 1120, 150, 17, 945)]),
  L('nymble', 2, [], 1,
    { name: 'Première Impression', desc: 'Tous les 3 tours : 200% ATK Insecte.', every: 3, mult: 2.0, aim: 'front' },
    [S('Lilliterelle', 'Insecte', 350, 49, 12, 919), S('Gambex', ['Insecte', 'Ténèbres'], 740, 103, 15, 920), S('Gambex ★', ['Insecte', 'Ténèbres'], 1150, 156, 16, 920)]),
  L('snover', 2, [], 2,
    { name: 'Blizzard', desc: 'Tous les 4 tours : 150% ATK Glace sur 2 cibles + ralentit (SPD -2).', every: 4, mult: 1.5, aim: 'aoe2', slow: 2 },
    [S('Blizzi', ['Plante', 'Glace'], 390, 47, 11, 459), S('Blizzaroi', ['Plante', 'Glace'], 820, 98, 13, 460), S('Blizzaroi ★', ['Plante', 'Glace'], 1280, 148, 14, 460)]),
  L('dewpider', 2, [], 1,
    { name: 'Aqua-Bulle', desc: 'Tous les 3 tours : 170% ATK Eau + bouclier 10% PV.', every: 3, mult: 1.7, aim: 'front', shield: 0.1 },
    [S('Araqua', ['Eau', 'Insecte'], 400, 43, 11, 751), S('Tarenbulle', ['Eau', 'Insecte'], 850, 90, 12, 752), S('Tarenbulle ★', ['Eau', 'Insecte'], 1320, 136, 13, 752)]),
  L('slakoth', 3, ['Force'], 1,
    { name: 'Giga Impact', desc: 'Tous les 4 tours : 260% ATK.', every: 4, mult: 2.6, aim: 'front', selfSlow: 1 },
    [S('Parecool', 'Normal', 470, 65, 11, 287), S('Vigoroth', 'Normal', 970, 139, 15, 288), S('Monaflèmit', 'Normal', 1490, 205, 17, 289)]),
  L('happiny', 3, [], 2,
    { name: 'Œuf de Vie', desc: 'Tous les 3 tours : 100% ATK + bouclier 10% PV, soigne 14%.', every: 3, mult: 1.0, aim: 'front', healAlly: 0.14, shield: 0.1 },
    [S('Ptiravi', 'Normal', 470, 47, 11, 440), S('Leveinard', 'Normal', 970, 101, 13, 113), S('Leuphorie', 'Normal', 1490, 150, 15, 242)]),
  L('vanillite', 3, ['Mage'], 3,
    { name: 'Blizzard', desc: 'Tous les 4 tours : 150% ATK Glace sur tous les ennemis.', every: 4, mult: 1.5, aim: 'all' },
    [S('Sorbébé', 'Glace', 400, 56, 12, 582), S('Sorboul', 'Glace', 820, 121, 13, 583), S('Sorbouboul', 'Glace', 1260, 178, 16, 584)]),
  L('tangela', 3, [], 1,
    { name: 'Martobois', desc: 'Tous les 3 tours : 180% ATK Plante + perd 4% de ses PV.', every: 3, mult: 1.8, aim: 'front', recoil: 0.04 },
    [S('Saquedeneu', 'Plante', 430, 56, 12, 114), S('Bouldeneu', 'Plante', 890, 121, 13, 465), S('Bouldeneu ★', 'Plante', 1360, 178, 15, 465)]),
  L('stantler', 3, [], 2,
    { name: 'Sorcellerie', desc: 'Tous les 3 tours : 170% ATK Psy sur le plus faible + ralentit (SPD -2).', every: 3, mult: 1.7, aim: 'weak', slow: 2 },
    [S('Cerfrousse', 'Normal', 420, 55, 13, 234), S('Cerbyllin', ['Normal', 'Psy'], 860, 118, 14, 899), S('Cerbyllin ★', ['Normal', 'Psy'], 1320, 174, 16, 899)]),
  L('klink', 3, [], 1,
    { name: 'Lancécrou', desc: 'Tous les 3 tours : 160% ATK Acier + +10% ATK pour lui.', every: 3, mult: 1.6, aim: 'front', selfAtk: 0.1 },
    [S('Tic', 'Acier', 400, 54, 11, 599), S('Clic', 'Acier', 820, 115, 13, 600), S('Cliticlic', 'Acier', 1260, 170, 17, 601)]),
  L('sizzlipede', 3, [], 1,
    { name: 'Fouet de Feu', desc: 'Tous les 3 tours : 160% ATK Feu sur 2 cibles + brûle.', every: 3, mult: 1.6, aim: 'aoe2', dot: { pct: 0.05, turns: 3 } },
    [S('Grillepattes', ['Feu', 'Insecte'], 420, 58, 12, 850), S('Scolocendre', ['Feu', 'Insecte'], 860, 123, 14, 851), S('Scolocendre ★', ['Feu', 'Insecte'], 1330, 182, 16, 851)]),
  L('yanma', 3, [], 3,
    { name: 'Bourdon', desc: 'Tous les 3 tours : 170% ATK Insecte sur la cible la plus loin.', every: 3, mult: 1.7, aim: 'back' },
    [S('Yanma', ['Insecte', 'Vol'], 400, 58, 14, 193), S('Yanmega', ['Insecte', 'Vol'], 810, 124, 15, 469), S('Yanmega ★', ['Insecte', 'Vol'], 1250, 183, 17, 469)]),
  L('lickitung', 3, [], 1,
    { name: 'Écrasement', desc: 'Tous les 3 tours : 160% ATK + étourdit.', every: 3, mult: 1.6, aim: 'front', stun: true },
    [S('Excelangue', 'Normal', 450, 49, 11, 108), S('Coudlangue', 'Normal', 930, 106, 13, 463), S('Coudlangue ★', 'Normal', 1430, 157, 15, 463)]),
  L('dunsparce', 3, [], 2,
    { name: 'Draco-Charge', desc: 'Tous les 3 tours : 180% ATK Dragon.', every: 3, mult: 1.8, aim: 'front' },
    [S('Insolourdo', 'Normal', 450, 54, 12, 206), S('Deusolourdo', 'Normal', 920, 115, 13, 982), S('Deusolourdo ★', 'Normal', 1420, 170, 15, 982)]),
  L('archen', 3, [], 1,
    { name: 'Acrobatie', desc: 'Tous les 3 tours : 210% ATK Vol sur le plus faible.', every: 3, mult: 2.1, aim: 'weak' },
    [S('Arkéapti', ['Roche', 'Vol'], 370, 64, 13, 566), S('Aéroptéryx', ['Roche', 'Vol'], 770, 136, 16, 567), S('Aéroptéryx ★', ['Roche', 'Vol'], 1180, 201, 18, 567)]),
  L('tirtouga', 3, [], 1,
    { name: 'Aqua-Brèche', desc: 'Tous les 3 tours : 180% ATK Eau.', every: 3, mult: 1.8, aim: 'front' },
    [S('Carapagos', ['Eau', 'Roche'], 420, 56, 11, 564), S('Mégapagos', ['Eau', 'Roche'], 850, 120, 12, 565), S('Mégapagos ★', ['Eau', 'Roche'], 1310, 176, 14, 565)]),
  L('shieldon', 3, [], 1,
    { name: 'Garde Large', desc: 'Tous les 4 tours : 100% ATK + bouclier 25% PV.', every: 4, mult: 1.0, aim: 'front', shield: 0.25 },
    [S('Dinoclier', ['Roche', 'Acier'], 460, 47, 11, 410), S('Bastiodon', ['Roche', 'Acier'], 950, 101, 12, 411), S('Bastiodon ★', ['Roche', 'Acier'], 1450, 150, 14, 411)]),
  L('anorith', 3, [], 1,
    { name: 'Plaie-Croix', desc: 'Tous les 3 tours : 190% ATK Insecte.', every: 3, mult: 1.9, aim: 'front' },
    [S('Anorith', ['Roche', 'Insecte'], 410, 60, 13, 347), S('Armaldo', ['Roche', 'Insecte'], 830, 129, 13, 348), S('Armaldo ★', ['Roche', 'Insecte'], 1280, 190, 15, 348)]),
  L('omanyte', 3, [], 3,
    { name: 'Hydrocanon', desc: 'Tous les 4 tours : 210% ATK Eau sur la cible la plus loin.', every: 4, mult: 2.1, aim: 'back' },
    [S('Amonita', ['Roche', 'Eau'], 410, 58, 11, 138), S('Amonistar', ['Roche', 'Eau'], 840, 123, 13, 139), S('Amonistar ★', ['Roche', 'Eau'], 1290, 182, 15, 139)]),
  L('lileep', 3, [], 2,
    { name: 'Giga-Sangsue', desc: 'Tous les 3 tours : 150% ATK Plante + soigne 8%.', every: 3, mult: 1.5, aim: 'front', healAlly: 0.08 },
    [S('Lilia', ['Roche', 'Plante'], 430, 48, 11, 345), S('Vacilys', ['Roche', 'Plante'], 890, 104, 13, 346), S('Vacilys ★', ['Roche', 'Plante'], 1370, 153, 15, 346)]),
  L('cufant', 3, ['Force'], 1,
    { name: 'Gigamarteau', desc: 'Tous les 4 tours : 230% ATK Acier.', every: 4, mult: 2.3, aim: 'front' },
    [S('Charibari', 'Acier', 440, 61, 11, 878), S('Pachyradjah', 'Acier', 900, 131, 12, 879), S('Pachyradjah ★', 'Acier', 1380, 194, 14, 879)]),
  L('clauncher', 3, ['Mage'], 3,
    { name: 'Vibraqua', desc: 'Tous les 3 tours : 180% ATK Eau sur la cible la plus loin.', every: 3, mult: 1.8, aim: 'back' },
    [S('Flingouste', 'Eau', 400, 59, 12, 692), S('Gamblast', 'Eau', 820, 126, 13, 693), S('Gamblast ★', 'Eau', 1260, 186, 15, 693)]),
  L('varoom', 3, [], 1,
    { name: 'Turbo-Moteur', desc: 'Tous les 3 tours : 180% ATK Acier + l’allié le plus lent gagne 3 SPD.', every: 3, mult: 1.8, aim: 'front', allyBuff: true },
    [S('Vrombi', ['Acier', 'Poison'], 400, 59, 12, 965), S('Vrombotor', ['Acier', 'Poison'], 820, 126, 15, 966), S('Vrombotor ★', ['Acier', 'Poison'], 1250, 185, 17, 966)]),
  L('bronzor', 3, [], 2,
    { name: 'Gyroballe', desc: 'Tous les 4 tours : 160% ATK Acier sur la cible la plus tanky + bouclier 12% PV.', every: 4, mult: 1.6, aim: 'tank', shield: 0.12 },
    [S('Archéomire', ['Acier', 'Psy'], 430, 51, 11, 436), S('Archéodong', ['Acier', 'Psy'], 880, 109, 12, 437), S('Archéodong ★', ['Acier', 'Psy'], 1350, 160, 14, 437)]),
  L('tauros', 3, ['Force'], 1,
    { name: 'Plaquage', desc: 'Tous les 3 tours : 190% ATK + perd 5% de ses PV.', every: 3, mult: 1.9, aim: 'front', recoil: 0.05 },
    [S('Tauros', 'Normal', 400, 54, 15, 128), S('Tauros ★', 'Normal', 810, 115, 16, 128), S('Tauros ★★', 'Normal', 1250, 170, 18, 128)]),
  L('great-tusk', 4, ['Force'], 1,
    { name: 'Défense Brute', desc: 'Tous les 3 tours : 200% ATK Combat + bouclier 10% PV.', every: 3, mult: 2.0, aim: 'front', shield: 0.1 },
    [S('Fort-Ivoire', ['Sol', 'Combat'], 570, 80, 14, 984), S('Fort-Ivoire ★', ['Sol', 'Combat'], 1050, 147, 15, 984), S('Fort-Ivoire ★★', ['Sol', 'Combat'], 1680, 223, 16, 984)]),
  L('flutter-mane', 4, ['Mage'], 3,
    { name: 'Éclat Magique', desc: 'Tous les 3 tours : 160% ATK Fée sur 2 cibles.', every: 3, mult: 1.6, aim: 'aoe2' },
    [S('Flotte-Mèche', ['Spectre', 'Fée'], 480, 82, 16, 987), S('Flotte-Mèche ★', ['Spectre', 'Fée'], 890, 150, 17, 987), S('Flotte-Mèche ★★', ['Spectre', 'Fée'], 1430, 227, 18, 987)]),
  L('iron-treads', 4, [], 1,
    { name: 'Rapid Spin', desc: 'Tous les 3 tours : 180% ATK Acier + l’allié le plus lent gagne 3 SPD.', every: 3, mult: 1.8, aim: 'front', allyBuff: true },
    [S('Roue-de-Fer', ['Sol', 'Acier'], 540, 74, 14, 990), S('Roue-de-Fer ★', ['Sol', 'Acier'], 990, 136, 15, 990), S('Roue-de-Fer ★★', ['Sol', 'Acier'], 1590, 207, 16, 990)]),
  L('iron-moth', 4, ['Mage'], 3,
    { name: 'Danse Flammes', desc: 'Tous les 3 tours : 170% ATK Feu sur 2 cibles + brûle.', every: 3, mult: 1.7, aim: 'aoe2', dot: { pct: 0.05, turns: 3 } },
    [S('Mite-de-Fer', ['Feu', 'Poison'], 510, 83, 15, 994), S('Mite-de-Fer ★', ['Feu', 'Poison'], 930, 152, 16, 994), S('Mite-de-Fer ★★', ['Feu', 'Poison'], 1500, 231, 17, 994)]),
  L('iron-jugulis', 4, [], 3,
    { name: 'Vibrobscur', desc: 'Tous les 3 tours : 190% ATK Ténèbres sur le plus faible.', every: 3, mult: 1.9, aim: 'weak' },
    [S('Têtes-de-Fer', ['Ténèbres', 'Vol'], 530, 78, 15, 993), S('Têtes-de-Fer ★', ['Ténèbres', 'Vol'], 970, 142, 16, 993), S('Têtes-de-Fer ★★', ['Ténèbres', 'Vol'], 1560, 216, 17, 993)]),
  L('sandy-shocks', 4, [], 2,
    { name: 'Tonnerre', desc: 'Tous les 3 tours : 180% ATK Électrik sur la cible la plus loin + étourdit.', every: 3, mult: 1.8, aim: 'back', stun: true },
    [S('Pelage-Sablé', ['Électrik', 'Sol'], 520, 77, 14, 989), S('Pelage-Sablé ★', ['Électrik', 'Sol'], 960, 142, 15, 989), S('Pelage-Sablé ★★', ['Électrik', 'Sol'], 1550, 215, 16, 989)]),
  L('nihilego', 4, ['Mage'], 3,
    { name: 'Bombe Beurk', desc: 'Tous les 3 tours : 160% ATK sur 2 cibles + empoisonne.', every: 3, mult: 1.6, aim: 'aoe2', dot: { pct: 0.06, turns: 3 } },
    [S('Zéroïd', ['Roche', 'Poison'], 560, 79, 14, 793), S('Zéroïd ★', ['Roche', 'Poison'], 1020, 145, 15, 793), S('Zéroïd ★★', ['Roche', 'Poison'], 1650, 220, 16, 793)]),
  L('buzzwole', 4, ['Force'], 1,
    { name: 'Marteau-Poing', desc: 'Tous les 3 tours : 230% ATK Combat + +8% ATK pour lui.', every: 3, mult: 2.3, aim: 'front', selfAtk: 0.08 },
    [S('Mouscoto', ['Insecte', 'Combat'], 560, 83, 13, 794), S('Mouscoto ★', ['Insecte', 'Combat'], 1040, 152, 14, 794), S('Mouscoto ★★', ['Insecte', 'Combat'], 1670, 230, 15, 794)]),
  L('kartana', 4, [], 1,
    { name: 'Lame Feuille', desc: 'Tous les 3 tours : 240% ATK Plante sur le plus faible.', every: 3, mult: 2.4, aim: 'weak' },
    [S('Katagami', ['Plante', 'Acier'], 470, 85, 15, 798), S('Katagami ★', ['Plante', 'Acier'], 860, 156, 16, 798), S('Katagami ★★', ['Plante', 'Acier'], 1380, 236, 17, 798)]),
  L('xurkitree', 4, ['Mage'], 3,
    { name: 'Fatal-Foudre', desc: 'Tous les 4 tours : 230% ATK Électrik sur la cible la plus loin.', every: 4, mult: 2.3, aim: 'back' },
    [S('Câblifère', 'Électrik', 490, 85, 13, 796), S('Câblifère ★', 'Électrik', 900, 156, 14, 796), S('Câblifère ★★', 'Électrik', 1450, 236, 15, 796)]),
  L('poipole', 4, [], 3,
    { name: 'Dard Dragon', desc: 'Tous les 3 tours : 180% ATK Poison sur la cible la plus loin.', every: 3, mult: 1.8, aim: 'back' },
    [S('Vémini', 'Poison', 480, 79, 13, 803), S('Mandrillon', ['Poison', 'Dragon'], 880, 145, 16, 804), S('Mandrillon ★', ['Poison', 'Dragon'], 1410, 220, 17, 804)]),
  L('type-null', 4, [], 1,
    { name: 'Multi-Attaque', desc: 'Tous les 3 tours : 190% ATK.', every: 3, mult: 1.9, aim: 'front' },
    [S('Type:0', 'Normal', 540, 68, 12, 772), S('Silvallié', 'Normal', 1000, 126, 15, 773), S('Silvallié ★', 'Normal', 1610, 190, 16, 773)]),
  L('uxie', 4, ['Mage'], 3,
    { name: 'Bâillement', desc: 'Tous les 4 tours : 120% ATK Psy sur une cible au hasard + étourdit.', every: 4, mult: 1.2, aim: 'random', stun: true },
    [S('Créhelf', 'Psy', 570, 62, 14, 480), S('Créhelf ★', 'Psy', 1040, 114, 15, 480), S('Créhelf ★★', 'Psy', 1680, 172, 16, 480)]),
  L('mesprit', 4, ['Mage'], 3,
    { name: 'Ondes Psy', desc: 'Tous les 3 tours : 160% ATK Psy sur 2 cibles + soigne 6%.', every: 3, mult: 1.6, aim: 'aoe2', healAlly: 0.06 },
    [S('Créfollet', 'Psy', 540, 72, 13, 481), S('Créfollet ★', 'Psy', 990, 132, 14, 481), S('Créfollet ★★', 'Psy', 1590, 200, 15, 481)]),
  L('azelf', 4, ['Mage'], 3,
    { name: 'Explonuit', desc: 'Tous les 3 tours : 200% ATK Psy sur le plus faible.', every: 3, mult: 2.0, aim: 'weak' },
    [S('Créfadet', 'Psy', 480, 79, 15, 482), S('Créfadet ★', 'Psy', 880, 144, 16, 482), S('Créfadet ★★', 'Psy', 1410, 218, 17, 482)]),
  L('cresselia', 4, [], 2,
    { name: 'Danse Lune', desc: 'Tous les 4 tours : 130% ATK Psy + bouclier 15% PV, soigne 8%.', every: 4, mult: 1.3, aim: 'front', shield: 0.15, healAlly: 0.08 },
    [S('Cresselia', 'Psy', 590, 62, 13, 488), S('Cresselia ★', 'Psy', 1090, 114, 14, 488), S('Cresselia ★★', 'Psy', 1750, 172, 15, 488)]),
  L('regirock', 4, [], 1,
    { name: 'Lame de Roc', desc: 'Tous les 3 tours : 180% ATK Roche + bouclier 12% PV.', every: 3, mult: 1.8, aim: 'front', shield: 0.12 },
    [S('Regirock', 'Roche', 590, 70, 12, 377), S('Regirock ★', 'Roche', 1090, 129, 13, 377), S('Regirock ★★', 'Roche', 1750, 195, 14, 377)]),
  L('regice', 4, [], 3,
    { name: 'Laser Glace', desc: 'Tous les 3 tours : 180% ATK Glace sur la cible la plus loin + ralentit (SPD -3).', every: 3, mult: 1.8, aim: 'back', slow: 3 },
    [S('Regice', 'Glace', 590, 70, 12, 378), S('Regice ★', 'Glace', 1090, 129, 13, 378), S('Regice ★★', 'Glace', 1750, 195, 14, 378)]),
  L('registeel', 4, [], 1,
    { name: 'Luminocanon', desc: 'Tous les 3 tours : 170% ATK Acier + bouclier 15% PV.', every: 3, mult: 1.7, aim: 'front', shield: 0.15 },
    [S('Registeel', 'Acier', 590, 62, 12, 379), S('Registeel ★', 'Acier', 1090, 114, 13, 379), S('Registeel ★★', 'Acier', 1750, 172, 14, 379)]),
  L('okidogi', 4, ['Force'], 1,
    { name: 'Chaîne Malsaine', desc: 'Tous les 3 tours : 180% ATK Poison + empoisonne.', every: 3, mult: 1.8, aim: 'front', dot: { pct: 0.06, turns: 3 } },
    [S('Félicanis', ['Poison', 'Combat'], 540, 79, 13, 1014), S('Félicanis ★', ['Poison', 'Combat'], 1000, 146, 14, 1014), S('Félicanis ★★', ['Poison', 'Combat'], 1610, 221, 15, 1014)]),
  L('munkidori', 4, [], 3,
    { name: 'Chaîne Malsaine', desc: 'Tous les 3 tours : 170% ATK Poison sur le plus faible + empoisonne.', every: 3, mult: 1.7, aim: 'weak', dot: { pct: 0.06, turns: 3 } },
    [S('Fortusimia', ['Poison', 'Psy'], 510, 80, 14, 1015), S('Fortusimia ★', ['Poison', 'Psy'], 940, 147, 15, 1015), S('Fortusimia ★★', ['Poison', 'Psy'], 1510, 223, 16, 1015)]),
  L('fezandipiti', 4, [], 2,
    { name: 'Danse Ailes', desc: 'Tous les 3 tours : 160% ATK Vol sur 2 cibles + empoisonne.', every: 3, mult: 1.6, aim: 'aoe2', dot: { pct: 0.05, turns: 3 } },
    [S('Favianos', ['Poison', 'Fée'], 550, 67, 14, 1016), S('Favianos ★', ['Poison', 'Fée'], 1010, 123, 15, 1016), S('Favianos ★★', ['Poison', 'Fée'], 1620, 186, 16, 1016)]),
  L('regigigas', 5, ['Force'], 1,
    { name: 'Presse', desc: 'Tous les 4 tours : 280% ATK sur la cible la plus tanky.', every: 4, mult: 2.8, aim: 'tank' },
    [S('Regigigas', 'Normal', 890, 142, 17, 486), S('Regigigas ★', 'Normal', 1370, 212, 18, 486), S('Regigigas ★★', 'Normal', 1920, 289, 19, 486)]),
  L('zamazenta', 5, [], 1,
    { name: 'Bouclier Maximus', desc: 'Tous les 4 tours : 200% ATK Acier + bouclier 20% PV.', every: 4, mult: 2.0, aim: 'front', shield: 0.2 },
    [S('Zamazenta', 'Combat', 900, 128, 19, 889), S('Zamazenta ★', 'Combat', 1380, 192, 20, 889), S('Zamazenta (Bouclier Suprême)', ['Combat', 'Acier'], 1940, 262, 20, 10189)]),
  L('volcanion', 5, ['Mage'], 3,
    { name: 'Jet de Vapeur', desc: 'Tous les 4 tours : 220% ATK Eau sur 2 cibles + brûle.', every: 4, mult: 2.2, aim: 'aoe2', dot: { pct: 0.05, turns: 3 } },
    [S('Volcanion', ['Feu', 'Eau'], 820, 134, 16, 721), S('Volcanion ★', ['Feu', 'Eau'], 1260, 200, 17, 721), S('Volcanion ★★', ['Feu', 'Eau'], 1760, 273, 18, 721)]),
  L('necrozma', 5, [], 2,
    { name: 'Photo-Geyser', desc: 'Tous les 4 tours : 240% ATK Psy sur la cible la plus tanky.', every: 4, mult: 2.4, aim: 'tank' },
    [S('Necrozma', 'Psy', 840, 142, 16, 800)],
    { at: 2, forms: [
      { id: 'criniere', stages: [S('Necrozma Crinière du Couchant', ['Psy', 'Acier'], 1290, 212, 17, 10155), S('Ultra-Necrozma', ['Psy', 'Dragon'], 1810, 289, 20, 10157)] },
      { id: 'ailes', stages: [S('Necrozma Ailes de l’Aurore', ['Psy', 'Spectre'], 1290, 212, 17, 10156), S('Ultra-Necrozma', ['Psy', 'Dragon'], 1810, 289, 20, 10157)] }
    ] }),
  L('deoxys', 5, [], 3,
    { name: 'Psycho Boost', desc: 'Tous les 4 tours : 240% ATK Psy sur le plus faible.', every: 4, mult: 2.4, aim: 'weak' },
    [S('Deoxys', 'Psy', 650, 142, 19, 386)],
    { at: 2, forms: [
      { id: 'attaque', stages: [S('Deoxys (Attaque)', 'Psy', 1010, 212, 20, 10001), S('Deoxys (Attaque) ★', 'Psy', 1410, 289, 21, 10001)] },
      { id: 'defense', stages: [S('Deoxys (Défense)', 'Psy', 1010, 212, 18, 10002), S('Deoxys (Défense) ★', 'Psy', 1410, 289, 19, 10002)] },
      { id: 'vitesse', stages: [S('Deoxys (Vitesse)', 'Psy', 1010, 212, 21, 10003), S('Deoxys (Vitesse) ★', 'Psy', 1410, 289, 21, 10003)] }
    ] }),
  L('genesect', 5, [], 3,
    { name: 'Techno-Buster', desc: 'Tous les 3 tours : 210% ATK Insecte sur la cible la plus loin.', every: 3, mult: 2.1, aim: 'back' },
    [S('Genesect', ['Insecte', 'Acier'], 770, 128, 17, 649), S('Genesect ★', ['Insecte', 'Acier'], 1190, 192, 18, 649), S('Genesect ★★', ['Insecte', 'Acier'], 1670, 262, 19, 649)]),
  L('hoopa', 5, [], 3,
    { name: 'Furie Dimension', desc: 'Tous les 4 tours : 240% ATK Ténèbres sur le plus faible + ignore 12% PV.', every: 4, mult: 2.4, aim: 'weak', shred: 0.12 },
    [S('Hoopa', ['Psy', 'Spectre'], 790, 142, 16, 720), S('Hoopa ★', ['Psy', 'Spectre'], 1220, 212, 17, 720), S('Hoopa Déchaîné', ['Psy', 'Ténèbres'], 1720, 289, 18, 10086)]),
  L('moltres', 5, [], 3,
    { name: 'Lance-Soleil', desc: 'Tous les 4 tours : 220% ATK Feu sur 2 cibles + brûle.', every: 4, mult: 2.2, aim: 'aoe2', dot: { pct: 0.05, turns: 3 } },
    [S('Sulfura', ['Feu', 'Vol'], 800, 131, 17, 146)],
    { at: 2, forms: [
      { id: 'kanto', stages: [S('Sulfura', ['Feu', 'Vol'], 1230, 196, 18, 146), S('Sulfura ★', ['Feu', 'Vol'], 1730, 267, 19, 146)] },
      { id: 'galar', stages: [S('Sulfura de Galar', ['Ténèbres', 'Vol'], 1230, 196, 18, 10171), S('Sulfura de Galar ★', ['Ténèbres', 'Vol'], 1730, 267, 19, 10171)] }
    ] }),
  L('cobalion', 5, [], 1,
    { name: 'Lame Sainte', desc: 'Tous les 3 tours : 200% ATK Acier + ignore 10% PV.', every: 3, mult: 2.0, aim: 'front', shred: 0.1 },
    [S('Cobaltium', ['Acier', 'Combat'], 830, 111, 18, 638), S('Cobaltium ★', ['Acier', 'Combat'], 1280, 167, 19, 638), S('Cobaltium ★★', ['Acier', 'Combat'], 1790, 227, 20, 638)]),
  L('virizion', 5, [], 1,
    { name: 'Lame Feuille', desc: 'Tous les 3 tours : 210% ATK Plante sur le plus faible + ignore 10% PV.', every: 3, mult: 2.1, aim: 'weak', shred: 0.1 },
    [S('Viridium', ['Plante', 'Combat'], 830, 111, 18, 640), S('Viridium ★', ['Plante', 'Combat'], 1280, 167, 19, 640), S('Viridium ★★', ['Plante', 'Combat'], 1790, 227, 20, 640)]),
  L('tornadus', 5, [], 3,
    { name: 'Vent Violent', desc: 'Tous les 4 tours : 190% ATK Vol sur 2 cibles.', every: 4, mult: 1.9, aim: 'aoe2' },
    [S('Boréas', 'Vol', 770, 123, 18, 641), S('Boréas ★', 'Vol', 1180, 184, 19, 641), S('Boréas (Totémique)', 'Vol', 1660, 251, 20, 10019)]),
  L('thundurus', 5, [], 3,
    { name: 'Fatal-Foudre', desc: 'Tous les 4 tours : 210% ATK Électrik sur la cible la plus loin + étourdit.', every: 4, mult: 2.1, aim: 'back', stun: true },
    [S('Fulguris', ['Électrik', 'Vol'], 750, 141, 18, 642), S('Fulguris ★', ['Électrik', 'Vol'], 1150, 212, 19, 642), S('Fulguris (Totémique)', ['Électrik', 'Vol'], 1610, 288, 19, 10020)]),
  L('chi-yu', 5, ['Mage'], 3,
    { name: 'Flamme Bleue', desc: 'Tous les 4 tours : 220% ATK Feu sur 2 cibles.', every: 4, mult: 2.2, aim: 'aoe2' },
    [S('Yuyu', ['Ténèbres', 'Feu'], 750, 136, 17, 1004), S('Yuyu ★', ['Ténèbres', 'Feu'], 1150, 204, 18, 1004), S('Yuyu ★★', ['Ténèbres', 'Feu'], 1610, 278, 19, 1004)]),
  L('ting-lu', 5, [], 1,
    { name: 'Ruine', desc: 'Tous les 4 tours : 160% ATK Sol sur tous les ennemis.', every: 4, mult: 1.6, aim: 'all' },
    [S('Dinglu', ['Ténèbres', 'Sol'], 900, 123, 15, 1003), S('Dinglu ★', ['Ténèbres', 'Sol'], 1380, 184, 16, 1003), S('Dinglu ★★', ['Ténèbres', 'Sol'], 1940, 251, 17, 1003)]),
  L('wo-chien', 5, [], 2,
    { name: 'Ruine', desc: 'Tous les 4 tours : 140% ATK Plante sur tous les ennemis + soigne 6%.', every: 4, mult: 1.4, aim: 'all', healAlly: 0.06 },
    [S('Chongjian', ['Ténèbres', 'Plante'], 860, 114, 16, 1001), S('Chongjian ★', ['Ténèbres', 'Plante'], 1320, 171, 17, 1001), S('Chongjian ★★', ['Ténèbres', 'Plante'], 1840, 233, 18, 1001)]),
  L('tapu-koko', 5, [], 2,
    { name: 'Ire de la Nature', desc: 'Tous les 4 tours : 200% ATK Électrik sur le plus faible.', every: 4, mult: 2.0, aim: 'weak' },
    [S('Tokorico', ['Électrik', 'Fée'], 740, 126, 18, 785), S('Tokorico ★', ['Électrik', 'Fée'], 1130, 188, 19, 785), S('Tokorico ★★', ['Électrik', 'Fée'], 1590, 256, 20, 785)]),
  L('tapu-lele', 5, ['Mage'], 3,
    { name: 'Choc Psy', desc: 'Tous les 3 tours : 190% ATK Psy sur la cible la plus loin.', every: 3, mult: 1.9, aim: 'back' },
    [S('Tokopiyon', ['Psy', 'Fée'], 770, 134, 17, 786), S('Tokopiyon ★', ['Psy', 'Fée'], 1190, 200, 18, 786), S('Tokopiyon ★★', ['Psy', 'Fée'], 1670, 273, 19, 786)]),
  L('tapu-bulu', 5, ['Force'], 1,
    { name: 'Martobois', desc: 'Tous les 3 tours : 220% ATK Plante + perd 5% de ses PV.', every: 3, mult: 2.2, aim: 'front', recoil: 0.05 },
    [S('Tokotoro', ['Plante', 'Fée'], 790, 134, 16, 787), S('Tokotoro ★', ['Plante', 'Fée'], 1220, 200, 17, 787), S('Tokotoro ★★', ['Plante', 'Fée'], 1720, 273, 18, 787)]),
  L('pecharunt', 5, [], 2,
    { name: 'Chaîne Malsaine', desc: 'Tous les 3 tours : 160% ATK Poison sur 2 cibles + empoisonne.', every: 3, mult: 1.6, aim: 'aoe2', dot: { pct: 0.07, turns: 3 } },
    [S('Pêchaminus', ['Poison', 'Spectre'], 870, 110, 17, 1025), S('Pêchaminus ★', ['Poison', 'Spectre'], 1350, 165, 18, 1025), S('Pêchaminus ★★', ['Poison', 'Spectre'], 1890, 224, 19, 1025)]),
  L('meltan', 5, ['Force'], 1,
    { name: 'Poing Lourd', desc: 'Tous les 4 tours : 240% ATK Acier.', every: 4, mult: 2.4, aim: 'front' },
    [S('Meltan', 'Acier', 900, 140, 14, 808), S('Melmetal', 'Acier', 1380, 210, 15, 809), S('Melmetal ★', 'Acier', 1940, 286, 16, 809)]),
  L('calyrex', 5, [], 3,
    { name: 'Psyko', desc: 'Tous les 3 tours : 180% ATK Psy sur la cible la plus loin.', every: 3, mult: 1.8, aim: 'back' },
    [S('Sylveroy', ['Psy', 'Plante'], 900, 142, 16, 898), S('Sylveroy ★', ['Psy', 'Plante'], 1380, 212, 17, 898)],
    { at: 3, forms: [
      { id: 'froid', stages: [S('Sylveroy Cavalier du Froid', ['Psy', 'Glace'], 1940, 289, 17, 10193)] },
      { id: 'effroi', stages: [S('Sylveroy Cavalier d’Effroi', ['Psy', 'Spectre'], 1940, 289, 21, 10194)] }
    ] }),
  L('walking-wake', 5, ['Mage'], 3,
    { name: 'Hydro-Vapeur', desc: 'Tous les 4 tours : 230% ATK Eau sur 2 cibles.', every: 4, mult: 2.3, aim: 'aoe2' },
    [S('Serpente-Eau', ['Eau', 'Dragon'], 820, 131, 18, 1009), S('Serpente-Eau ★', ['Eau', 'Dragon'], 1260, 196, 19, 1009), S('Serpente-Eau ★★', ['Eau', 'Dragon'], 1770, 267, 20, 1009)]),
  L('iron-leaves', 5, [], 1,
    { name: 'Lame Psychique', desc: 'Tous les 3 tours : 220% ATK Plante sur le plus faible + ignore 10% PV.', every: 3, mult: 2.2, aim: 'weak', shred: 0.1 },
    [S('Vert-de-Fer', ['Plante', 'Psy'], 820, 134, 17, 1010), S('Vert-de-Fer ★', ['Plante', 'Psy'], 1270, 200, 18, 1010), S('Vert-de-Fer ★★', ['Plante', 'Psy'], 1780, 273, 19, 1010)])
];


/**
 * Si la forme de 2★ est répétée en 3★, le 3★ devient la Méga (types de la Méga seule).
 * Les lignées à 3 stades distincts gardent leur forme finale normale.
 */
const MEGA_BY_DEX = {
  212: { name: 'Méga-Cizayox', types: ['Insecte', 'Acier'], dex: 10046 },
  130: { name: 'Méga-Léviator', types: ['Eau', 'Ténèbres'], dex: 10041 },
  448: { name: 'Méga-Lucario', types: ['Combat', 'Acier'], dex: 10059 },
  208: { name: 'Méga-Steelix', types: ['Acier', 'Sol'], dex: 10072 },
  310: { name: 'Méga-Élecsprint', types: ['Électrik'], dex: 10055 },
  362: { name: 'Méga-Oniglali', types: ['Glace'], dex: 10074 },
  428: { name: 'Méga-Lockpin', types: ['Normal', 'Combat'], dex: 10088 },
  127: { name: 'Méga-Scarabrute', types: ['Insecte', 'Vol'], dex: 10040 },
  302: { name: 'Méga-Ténéfix', types: ['Ténèbres', 'Spectre'], dex: 10066 },
  303: { name: 'Méga-Mysdibule', types: ['Acier', 'Fée'], dex: 10052 },
  359: { name: 'Méga-Absol', types: ['Ténèbres'], dex: 10057 },
  719: { name: 'Méga-Diancie', types: ['Roche', 'Fée'], dex: 10075 },
  384: { name: 'Méga-Rayquaza', types: ['Dragon', 'Vol'], dex: 10079 },
  334: { name: 'Méga-Altaria', types: ['Dragon', 'Fée'], dex: 10067 },
  478: { name: 'Méga-Momartik', types: ['Glace', 'Spectre'], dex: 10285 },
  780: { name: 'Méga-Draïeul', types: ['Normal', 'Dragon'], dex: 10302 },
  26: { name: 'Méga-Raichu', types: ['Électrik'], dex: 10304 },
  142: { name: 'Méga-Ptéra', types: ['Roche', 'Vol'], dex: 10042 },
  354: { name: 'Méga-Branette', types: ['Spectre'], dex: 10056 },
  143: { name: 'Ronflex Gigamax', types: ['Normal'], dex: 10206 },
  483: { name: 'Dialga (Originel)', types: ['Acier', 'Dragon'], dex: 10245 },
  487: { name: 'Giratina (Originel)', types: ['Spectre', 'Dragon'], dex: 10007 },
  492: { name: 'Shaymin (Céleste)', types: ['Plante', 'Vol'], dex: 10006 },
  645: { name: 'Démétéros (Totémique)', types: ['Sol', 'Vol'], dex: 10021 },
  383: { name: 'Primo-Groudon', types: ['Sol', 'Feu'], dex: 10078 },
  888: { name: 'Zacian (Épée Suprême)', types: ['Fée', 'Acier'], dex: 10188 },
  // Méga-Évolutions de Pokémon Légendes Z-A (lignées à 2 stades ou sans évolution)
  36: { name: 'Méga-Mélodelfe', types: ['Fée', 'Vol'], dex: 10278 },
  491: { name: 'Méga-Darkrai', types: ['Ténèbres'], dex: 10312 },
  530: { name: 'Méga-Minotaupe', types: ['Sol', 'Acier'], dex: 10287 },
  623: { name: 'Méga-Golemastoc', types: ['Sol', 'Spectre'], dex: 10313 },
  678: { name: 'Méga-Mistigrix', types: ['Psy'], dex: 10314 },
  687: { name: 'Méga-Sepiatroce', types: ['Ténèbres', 'Psy'], dex: 10297 },
  689: { name: 'Méga-Golgopathe', types: ['Roche', 'Combat'], dex: 10298 },
  691: { name: 'Méga-Kravarech', types: ['Poison', 'Dragon'], dex: 10299 },
  701: { name: 'Méga-Brutalibré', types: ['Combat', 'Vol'], dex: 10300 },
  740: { name: 'Méga-Crabominable', types: ['Combat', 'Glace'], dex: 10315 },
  801: { name: 'Méga-Magearna', types: ['Acier', 'Fée'], dex: 10317 },
  807: { name: 'Méga-Zeraora', types: ['Électrik'], dex: 10319 },
  870: { name: 'Méga-Hexadron', types: ['Combat'], dex: 10303 },
  952: { name: 'Méga-Scovilain', types: ['Plante', 'Feu'], dex: 10320 },
  970: { name: 'Méga-Floréclat', types: ['Roche', 'Poison'], dex: 10321 },
  // Formes Gigamax / Infinimax
  131: { name: 'Lokhlass Gigamax', types: ['Eau', 'Glace'], dex: 10204 },
  849: { name: 'Salarsen Gigamax', types: ['Électrik', 'Poison'], dex: 10219 },
  10184: { name: 'Salarsen Gigamax (Grave)', types: ['Électrik', 'Poison'], dex: 10228 },
  841: { name: 'Pomdrapi Gigamax', types: ['Plante', 'Dragon'], dex: 10216 },
  842: { name: 'Dratatin Gigamax', types: ['Plante', 'Dragon'], dex: 10217 },
  869: { name: 'Charmilly Gigamax', types: ['Fée'], dex: 10223 },
  890: { name: 'Éthernatos Infinimax', types: ['Poison', 'Dragon'], dex: 10190 },
  // Nouvelles lignées (2 stades ou sans évolution)
  99: { name: 'Krabboss Gigamax', types: ['Eau'], dex: 10203 },
  80: { name: 'Méga-Flagadoss', types: ['Eau', 'Psy'], dex: 10071 },
  229: { name: 'Méga-Démolosse', types: ['Ténèbres', 'Feu'], dex: 10048 },
  319: { name: 'Méga-Sharpedo', types: ['Eau', 'Ténèbres'], dex: 10070 },
  768: { name: 'Méga-Sarmuraï', types: ['Insecte', 'Acier'], dex: 10316 },
  323: { name: 'Méga-Camérupt', types: ['Feu', 'Sol'], dex: 10087 },
  358: { name: 'Méga-Éoko', types: ['Psy', 'Acier'], dex: 10306 },
  308: { name: 'Méga-Charmina', types: ['Combat', 'Psy'], dex: 10054 },
  121: { name: 'Méga-Staross', types: ['Eau', 'Psy'], dex: 10280 },
  668: { name: 'Méga-Némélios', types: ['Feu', 'Normal'], dex: 10295 },
  892: { name: 'Shifours Gigamax (Poing Final)', types: ['Combat', 'Ténèbres'], dex: 10226 },
  10191: { name: 'Shifours Gigamax (Mille Poings)', types: ['Combat', 'Eau'], dex: 10227 },
  115: { name: 'Méga-Kangourex', types: ['Normal'], dex: 10039 },
  978: { name: 'Méga-Nigirigon', types: ['Dragon', 'Eau'], dex: 10322 },
  380: { name: 'Méga-Latias', types: ['Dragon', 'Psy'], dex: 10062 },
  381: { name: 'Méga-Latios', types: ['Dragon', 'Psy'], dex: 10063 },
  382: { name: 'Primo-Kyogre', types: ['Eau'], dex: 10077 },
  484: { name: 'Palkia (Originel)', types: ['Eau', 'Dragon'], dex: 10246 },
  485: { name: 'Méga-Heatran', types: ['Feu', 'Acier'], dex: 10311 },
  // Vague 3
  460: { name: 'Méga-Blizzaroi', types: ['Plante', 'Glace'], dex: 10060 },
  851: { name: 'Scolocendre Gigamax', types: ['Feu', 'Insecte'], dex: 10220 },
  879: { name: 'Pachyradjah Gigamax', types: ['Acier'], dex: 10224 },
  809: { name: 'Melmetal Gigamax', types: ['Acier'], dex: 10208 }
};

const promoteMegaStar = (stages) => {
  if (!stages || stages.length < 2) return;
  const prev = stages[stages.length - 2];
  const last = stages[stages.length - 1];
  if (!prev || !last || prev.dex !== last.dex) return;
  const mega = MEGA_BY_DEX[last.dex];
  if (!mega) return;
  stages[stages.length - 1] = S(mega.name, mega.types, last.hp, last.atk, last.spd, mega.dex);
};

const applyBalance = (line) => {
  const k = BALANCE[line.id];
  if (!k || k === 1) return;
  const tune = (st) => {
    st.hp = Math.round(st.hp * k);
    st.atk = Math.round(st.atk * k);
  };
  line.stages.forEach(tune);
  (line.forms || []).forEach((form) => form.stages.forEach(tune));
};

LINES.forEach((line) => {
  if (line.forms) line.forms.forEach((form) => promoteMegaStar(form.stages));
  else promoteMegaStar(line.stages);
  applyBalance(line);
  line.ab = TALENTS[line.id] || null;
  (line.forms || []).forEach((form) => {
    form.ab = FORM_TALENTS[`${line.id}:${form.id}`] || line.ab;
  });
});

/** Starters jouables : toutes les lignées avec le rôle Starter. */
export const STARTER_LINES = LINES.filter((line) => (line.traits || []).includes('Starter'));

/** Le starter choisi + 2 autres starters tirés au hasard pour la boutique de la run. */
export const starterTrio = (lineId) => {
  const others = STARTER_LINES.filter((line) => line.id !== lineId)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .map((line) => line.id);
  return [lineId, ...others];
};

export const SAVE_KEY = 'poke-arena-campaign-v3';

export const saveCampaign = (state) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
};

export const loadCampaign = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearCampaign = () => {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
};

export const hasSave = () => !!loadCampaign();

export const LINE_MAP = Object.fromEntries(LINES.map((line) => [line.id, line]));
export const ROSTER_LINES = LINES.length;
export const ROSTER_FORMS = (() => {
  const names = new Set();
  LINES.forEach((line) => {
    line.stages.forEach((st) => names.add(st.dex));
    (line.forms || []).forEach((f) => f.stages.forEach((st) => names.add(st.dex)));
  });
  return names.size;
})();

export const AIM_LABELS = {
  front: 'cible la plus proche',
  back: 'cible la plus loin',
  weak: 'ennemi le plus faible',
  tank: 'ennemi le plus tanky',
  random: 'cible aléatoire',
  aoe2: '2 cibles proches',
  all: 'tous les ennemis'
};

export const rangeLabel = (range = 1) => {
  if (range <= 1) return 'Mêlée (1 case)';
  if (range === 2) return 'Moyen (2 cases)';
  return `Distance (${range} cases)`;
};

/** Résumé de rôle pour le codex. */
export const linePlaystyle = (line) => {
  const r = line.range || 1;
  const traits = line.traits || [];
  const aim = line.spell?.aim;
  const bits = [];
  if (r <= 1) bits.push('Avant-garde');
  else if (r === 2) bits.push('Ligne médiane');
  else bits.push('Arrière-ligne');
  if (traits.includes('Force') || traits.includes('Acier') || traits.includes('Roche')) bits.push('bruiser');
  else if (traits.includes('Mage') || traits.includes('Psy')) bits.push('mage');
  else if (traits.includes('Spectre') || traits.includes('Ténèbres')) bits.push('assassin / pression');
  else if (traits.includes('Starter')) bits.push('pilier de run');
  if (aim === 'aoe2' || aim === 'all') bits.push('zone');
  else if (aim === 'weak' || aim === 'back') bits.push('exécuteur');
  return bits.join(' · ');
};

const itemSprite = (slug) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

/**
 * Objets.
 * — 6 composants (vitamines) : 2 composants sur le même Pokémon = objet fabriqué (21 recettes).
 * — Plaques : le Pokémon compte aussi pour le type de la plaque dans les synergies.
 * — Consommables (Poké Mart) : utilisés au moment où on les applique.
 */
export const COMPONENTS = [
  { id: 'hpup', name: 'PV Plus', icon: '❤', sprite: itemSprite('hp-up'), desc: '+15% PV max.', component: true, hpMul: 1.15 },
  { id: 'protein', name: 'Protéine', icon: '✊', sprite: itemSprite('protein'), desc: '+12% ATK.', component: true, atkMul: 1.12 },
  { id: 'calcium', name: 'Calcium', icon: '✦', sprite: itemSprite('calcium'), desc: '+15% puissance des sorts.', component: true, spellMul: 1.15 },
  { id: 'carbos', name: 'Carbone', icon: '➤', sprite: itemSprite('carbos'), desc: '+2 SPD.', component: true, spdFlat: 2 },
  { id: 'zinc', name: 'Zinc', icon: '⛨', sprite: itemSprite('zinc'), desc: '-8% de dégâts subis.', component: true, dmgTaken: 0.92 },
  { id: 'ppup', name: 'PP Plus', icon: '◎', sprite: itemSprite('pp-up'), desc: 'Commence le combat avec 1 charge de sort.', component: true, precharge: 1 }
];

export const CRAFTED = [
  { id: 'leftovers', name: 'Restes', sprite: itemSprite('leftovers'), desc: '+15% PV. Récupère 3% PV max par tour.', hpMul: 1.15, regen: 0.03 },
  { id: 'rocky', name: 'Casque Brut', sprite: itemSprite('rocky-helmet'), desc: '+15% PV. Renvoie 25% des dégâts subis à l’attaquant.', hpMul: 1.15, thorns: 0.25 },
  { id: 'bigroot', name: 'Grosse Racine', sprite: itemSprite('big-root'), desc: '+10% PV. Ses sorts le soignent de 35% des dégâts infligés.', hpMul: 1.1, spellDrain: 0.35 },
  { id: 'focus', name: 'Ceinture Force', sprite: itemSprite('focus-sash'), desc: 'Survit une fois à 1 PV par combat. +2 SPD.', endure: true, spdFlat: 2 },
  { id: 'assaultvest', name: 'Veste de Combat', sprite: itemSprite('assault-vest'), desc: '+20% PV. Les sorts ennemis lui font 30% de dégâts en moins.', hpMul: 1.2, spellGuard: 0.7 },
  { id: 'sitrus', name: 'Baie Sitrus', sprite: itemSprite('sitrus-berry'), desc: '+8% PV. Sous 50% PV : récupère 30% de ses PV (une fois).', hpMul: 1.08, berry: 0.3 },
  { id: 'choiceband', name: 'Bandeau Choix', sprite: itemSprite('choice-band'), desc: '+40% ATK.', atkMul: 1.4 },
  { id: 'lifeorb', name: 'Orbe Vie', sprite: itemSprite('life-orb'), desc: '+30% de dégâts (attaques et sorts). Perd 3% PV par attaque.', atkMul: 1.3, selfHurt: 0.03 },
  { id: 'razorclaw', name: 'Griffe Rasoir', sprite: itemSprite('razor-claw'), desc: '25% de coups critiques (×1,6). +1 SPD.', critChance: 0.25, critMult: 1.6, spdFlat: 1 },
  { id: 'expertbelt', name: 'Ceinture Pro', sprite: itemSprite('expert-belt'), desc: '+8% ATK. Ses coups super efficaces font +30% de dégâts.', atkMul: 1.08, superMul: 1.3 },
  { id: 'kingsrock', name: 'Roche Royale', sprite: itemSprite('kings-rock'), desc: '+6% ATK. Ses attaques ont 20% de chances d’étourdir.', atkMul: 1.06, flinch: 0.2 },
  { id: 'choicespecs', name: 'Lunettes Choix', sprite: itemSprite('choice-specs'), desc: '+45% puissance des sorts.', spellMul: 1.45 },
  { id: 'powerherb', name: 'Herbe Pouvoir', sprite: itemSprite('power-herb'), desc: 'Lance son sort dès son premier tour. +10% puissance des sorts.', castNow: true, spellMul: 1.1 },
  { id: 'toxicorb', name: 'Orbe Toxique', sprite: itemSprite('toxic-orb'), desc: 'Ses sorts empoisonnent (5% PV par tour, 3 tours). +10% sorts.', spellDot: { pct: 0.05, turns: 3 }, spellMul: 1.1 },
  { id: 'shellbell', name: 'Grelot Coque', sprite: itemSprite('shell-bell'), desc: 'Soigne 20% de tous les dégâts infligés. +10% sorts.', lifesteal: 0.2, spellMul: 1.1 },
  { id: 'choicescarf', name: 'Mouchoir Choix', sprite: itemSprite('choice-scarf'), desc: '+35% SPD.', spdMul: 1.35 },
  { id: 'covertcloak', name: 'Pare-Effet', sprite: itemSprite('covert-cloak'), desc: 'Immunisé aux poisons, brûlures, ralentissements et étourdissements. +1 SPD.', noCC: true, cleanse: true, spdFlat: 1 },
  { id: 'quickclaw', name: 'Vive Griffe', sprite: itemSprite('quick-claw'), desc: '20% de chances de rejouer à chaque tour. +2 SPD.', quick: 0.2, spdFlat: 2 },
  { id: 'eviolite', name: 'Évoluroc', sprite: itemSprite('eviolite'), desc: '-20% de dégâts subis, -35% tant qu’il n’est pas 3★.', eviolite: true },
  { id: 'lightclay', name: 'Lumargile', sprite: itemSprite('light-clay'), desc: 'Début du combat : bouclier de 25% PV pour lui et l’allié le plus proche.', startShield: 0.25 },
  { id: 'ppmax', name: 'PP Max', sprite: itemSprite('pp-max'), desc: 'Lance son sort un tour plus tôt à chaque cycle (min. tous les 2 tours).', everyMinus: 1 }
];

/** Plaques d’Arceus : ajoutent un type pour les synergies. */
const PLATE_DEFS = [
  ['Feu', 'flame-plate', 'Plaque Flamme'], ['Eau', 'splash-plate', 'Plaque Hydro'], ['Plante', 'meadow-plate', 'Plaque Herbe'],
  ['Électrik', 'zap-plate', 'Plaque Volt'], ['Combat', 'fist-plate', 'Plaque Poing'], ['Psy', 'mind-plate', 'Plaque Esprit'],
  ['Spectre', 'spooky-plate', 'Plaque Fantôme'], ['Dragon', 'draco-plate', 'Plaque Draco'], ['Fée', 'pixie-plate', 'Plaque Pixie'],
  ['Acier', 'iron-plate', 'Plaque Fer'], ['Glace', 'icicle-plate', 'Plaque Glace'], ['Roche', 'stone-plate', 'Plaque Roc'],
  ['Ténèbres', 'dread-plate', 'Plaque Ombre'], ['Vol', 'sky-plate', 'Plaque Ciel'], ['Sol', 'earth-plate', 'Plaque Terre'],
  ['Insecte', 'insect-plate', 'Plaque Insecte'], ['Poison', 'toxic-plate', 'Plaque Toxik'], ['Normal', 'blank-plate', 'Plaque Vierge']
];
export const PLATES = PLATE_DEFS.map(([type, slug, name]) => ({
  id: `plate-${slug.split('-')[0]}`,
  name,
  sprite: itemSprite(slug),
  desc: `Le Pokémon compte aussi comme type ${type} pour les synergies.`,
  plate: true,
  addTrait: type
}));

/** Consommables : effet immédiat, achetés au Poké Mart ou gagnés en événement. */
export const CONSUMABLES = [
  { id: 'magnet', name: 'Aimant', sprite: itemSprite('magnet'), desc: 'Retire tous les objets d’un Pokémon (ils reviennent dans le sac).', special: 'strip', consumable: true },
  { id: 'rarecandy', name: 'Super Bonbon', sprite: itemSprite('rare-candy'), desc: 'Fait passer un Pokémon 1★ à 2★.', special: 'starUp', consumable: true },
  { id: 'expshare', name: 'Multi Exp', sprite: itemSprite('exp-share'), desc: '+8 XP de dresseur, tout de suite.', special: 'xp', amount: 8, consumable: true, instant: true },
  { id: 'revive', name: 'Rappel', sprite: itemSprite('revive'), desc: 'Soigne 15 PV de dresseur, tout de suite.', special: 'heal', amount: 15, consumable: true, instant: true },
  { id: 'amuletcoin', name: 'Pièce Rune', sprite: itemSprite('amulet-coin'), desc: '+1 or à chaque victoire pour le reste de la run.', special: 'coin', consumable: true, instant: true }
];

/**
 * Bonus réels (mêmes chiffres que le combat).
 * cap = nombre de copies pris en compte.
 */
const TRAIT_BONUS = {
  Feu: { atk: 0.07, cap: 4 },
  Électrik: { atk: 0.07, cap: 4 },
  Dragon: { atk: 0.07, cap: 4 },
  Force: { atk: 0.07, cap: 4 },
  Ténèbres: { atk: 0.07, cap: 4 },
  Insecte: { atk: 0.07, cap: 4 },
  Eau: { hp: 0.07, cap: 4 },
  Plante: { hp: 0.07, cap: 4 },
  Combat: { hp: 0.07, cap: 4 },
  Starter: { hp: 0.07, cap: 4 },
  Acier: { hp: 0.07, cap: 4 },
  Roche: { hp: 0.07, cap: 4 },
  Sol: { hp: 0.07, cap: 4 },
  Psy: { atk: 0.045, hp: 0.045, cap: 4 },
  Spectre: { atk: 0.045, hp: 0.045, cap: 4 },
  Mage: { atk: 0.045, hp: 0.045, cap: 4 },
  Fée: { atk: 0.045, hp: 0.045, cap: 4 },
  Glace: { atk: 0.045, hp: 0.045, cap: 4 },
  Vol: { atk: 0.035, cap: 3 },
  Normal: { atk: 0.035, cap: 3 },
  Poison: { atk: 0.035, cap: 3 }
};

const formatBonus = (rule, n) => {
  const parts = [];
  if (rule.atk) parts.push(`+${Math.round(rule.atk * 100 * n)}% ATK`);
  if (rule.hp) parts.push(`+${Math.round(rule.hp * 100 * n)}% PV`);
  return parts.join(' et ');
};

/** Libellé du bonus actif pour un nombre de copies. */
export const bonusLabel = (trait, count) => {
  const rule = TRAIT_BONUS[trait];
  if (!rule || count < 2) return '';
  return formatBonus(rule, Math.min(count, rule.cap));
};

/** Spécificités des synergies (affichées au survol). */
export const TRAIT_INFO = {
  Feu: { title: 'Feu', blurb: 'Offensif pur.', effect: '×2+ : +7% ATK par Feu (max ×4). Avantage vs Plante / Glace / Acier.' },
  Eau: { title: 'Eau', blurb: 'Endurance.', effect: '×2+ : +7% PV par Eau. Avantage vs Feu / Roche / Sol.' },
  Plante: { title: 'Plante', blurb: 'Contrôle & tank.', effect: '×2+ : +7% PV. Avantage vs Eau / Roche / Sol.' },
  Électrik: { title: 'Électrik', blurb: 'Burst rapide.', effect: '×2+ : +7% ATK. Avantage vs Eau / Vol.' },
  Normal: { title: 'Normal', blurb: 'Polyvalent.', effect: '×2+ : léger +ATK. Faible vs Spectre / Roche.' },
  Combat: { title: 'Combat', blurb: 'Frontline bruiser.', effect: '×2+ : +7% PV. Fort vs Normal / Acier / Glace.' },
  Psy: { title: 'Psy', blurb: 'Mages.', effect: '×2+ : +ATK et +PV modérés. Fort vs Combat / Poison.' },
  Spectre: { title: 'Spectre', blurb: 'Insaisissables.', effect: '×2+ : +ATK/+PV. Ignore souvent les tanks Normal. Fort vs Psy.' },
  Dragon: { title: 'Dragon', blurb: 'Scale late.', effect: '×2+ : +7% ATK. Fort vs Dragon, faible vs Fée.' },
  Fée: { title: 'Fée', blurb: 'Anti-dragon.', effect: '×2+ : +ATK/+PV. Excellent vs Dragon / Ténèbres / Combat.' },
  Acier: { title: 'Acier', blurb: 'Mur.', effect: '×2+ : +7% PV. Fort vs Fée / Roche / Glace.' },
  Glace: { title: 'Glace', blurb: 'Burst ciblé.', effect: '×2+ : +ATK/+PV. Fort vs Dragon / Plante / Sol / Vol.' },
  Roche: { title: 'Roche', blurb: 'Tank physique.', effect: '×2+ : +7% PV. Fort vs Feu / Vol / Insecte.' },
  Ténèbres: { title: 'Ténèbres', blurb: 'Assassin.', effect: '×2+ : +7% ATK. Fort vs Psy / Spectre.' },
  Vol: { title: 'Vol', blurb: 'Mobilité.', effect: '×2+ : léger +ATK. Fort vs Plante / Combat / Insecte.' },
  Sol: { title: 'Sol', blurb: 'Anti-électrique.', effect: '×2+ : +7% PV. Fort vs Feu / Électrik / Roche / Acier.' },
  Insecte: { title: 'Insecte', blurb: 'Harass.', effect: '×2+ : +7% ATK. Fort vs Plante / Psy / Ténèbres.' },
  Poison: { title: 'Poison', blurb: 'Pression.', effect: '×2+ : léger +ATK. Fort vs Plante / Fée.' },
  Starter: { title: 'Starter', blurb: 'Partenaires solides.', effect: '×2+ : +7% PV. Bonus de survie en début de campagne.' },
  Force: { title: 'Force', blurb: 'Brutes de mêlée.', effect: '×2+ : +7% ATK. Aiment la première ligne (portée 1).' },
  Mage: { title: 'Mage', blurb: 'Backline sorts.', effect: '×2+ : +ATK/+PV. Souvent portée 3.' }
};

const fmtMult = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

/** Fiche complète d’une synergie : paliers + affinités du tableau des types. */
export const traitDossier = (trait) => {
  const info = TRAIT_INFO[trait] || { title: trait, blurb: '' };
  const rule = TRAIT_BONUS[trait];
  const tiers = [];
  if (rule) {
    for (let n = 2; n <= rule.cap; n += 1) {
      tiers.push({ n, label: `×${n} : ${formatBonus(rule, n)}` });
    }
  }
  const chart = TYPE_CHART[trait] || null;
  const strong = chart
    ? Object.entries(chart).filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1])
    : [];
  const weak = chart
    ? Object.entries(chart).filter(([, v]) => v < 1).sort((a, b) => a[1] - b[1])
    : [];
  return {
    title: info.title || trait,
    blurb: info.blurb || '',
    tiers,
    strong: strong.map(([name, mult]) => ({ name, mult, label: `${name} ×${fmtMult(mult)}` })),
    weak: weak.map(([name, mult]) => ({ name, mult, label: `${name} ×${fmtMult(mult)}` }))
  };
};

const stageTypeList = (stage) => stage?.types || (stage?.type ? [stage.type] : []);

/** Tous les types réellement présents, avec les stades qui les portent. */
export const lineSynergyRows = (line) => {
  if (!line) return [];
  const buckets = new Map();
  let visits = 0;
  const add = (trait, label) => {
    if (!buckets.has(trait)) buckets.set(trait, []);
    const list = buckets.get(trait);
    if (!list.includes(label)) list.push(label);
  };
  const visit = (stage, star) => {
    visits += 1;
    stageTypeList(stage).forEach((t) => add(t, `${stage.name} · ${star}★`));
  };
  if (!line.forms) {
    line.stages.forEach((stage, i) => visit(stage, i + 1));
  } else {
    line.stages.forEach((stage, i) => {
      if (i + 1 < line.branchAt) visit(stage, i + 1);
    });
    line.forms.forEach((form) => {
      form.stages.forEach((stage, i) => visit(stage, line.branchAt + i));
    });
  }
  (line.traits || []).filter((t) => ROLE_TRAITS.has(t)).forEach((t) => add(t, 'Toute la lignée'));
  const order = [...TYPES, 'Starter', 'Force', 'Mage'];
  return [...buckets.entries()]
    .map(([trait, where]) => {
      const everywhere = where.length === visits && where.every((w) => w !== 'Toute la lignée');
      return {
        trait,
        where: (everywhere || (where.length === 1 && where[0] === 'Toute la lignée')) ? ['Toute la lignée'] : where,
        ...traitDossier(trait)
      };
    })
    .sort((a, b) => order.indexOf(a.trait) - order.indexOf(b.trait));
};

/** a+b (ordre libre) → objet fabriqué */
export const RECIPE_TABLE = {
  'hpup+hpup': 'leftovers',
  'hpup+protein': 'rocky',
  'calcium+hpup': 'bigroot',
  'carbos+hpup': 'focus',
  'hpup+zinc': 'assaultvest',
  'hpup+ppup': 'sitrus',
  'protein+protein': 'choiceband',
  'calcium+protein': 'lifeorb',
  'carbos+protein': 'razorclaw',
  'protein+zinc': 'expertbelt',
  'ppup+protein': 'kingsrock',
  'calcium+calcium': 'choicespecs',
  'calcium+carbos': 'powerherb',
  'calcium+zinc': 'toxicorb',
  'calcium+ppup': 'shellbell',
  'carbos+carbos': 'choicescarf',
  'carbos+zinc': 'covertcloak',
  'carbos+ppup': 'quickclaw',
  'zinc+zinc': 'eviolite',
  'ppup+zinc': 'lightclay',
  'ppup+ppup': 'ppmax'
};

export const MAGNET = CONSUMABLES[0];

export const RUN_POOL_SIZE = 32;

/** Tire un sous-set équilibré (~32) pour la boutique joueur. */
export const buildRunPool = (mustIds = ['cynda', 'mudkip', 'eevee']) => {
  const must = mustIds.map((id) => LINE_MAP[id]).filter(Boolean);
  const used = new Set(must.map((l) => l.id));
  const byCost = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  // Les autres starters restent hors de la boutique : seuls le starter choisi et ses deux compagnons y sont.
  const isOtherStarter = (line) => (line.traits || []).includes('Starter') && !used.has(line.id);
  LINES.forEach((line) => {
    if (used.has(line.id) || isOtherStarter(line)) return;
    byCost[line.cost]?.push(line);
  });
  const targets = { 1: 8, 2: 8, 3: 7, 4: 5, 5: 4 };
  const picked = [...must];
  [1, 2, 3, 4, 5].forEach((cost) => {
    const pool = [...byCost[cost]].sort(() => Math.random() - 0.5);
    const need = Math.max(0, targets[cost] - picked.filter((l) => l.cost === cost).length);
    picked.push(...pool.slice(0, need));
  });
  while (picked.length < RUN_POOL_SIZE) {
    const extra = LINES.find((l) => !isOtherStarter(l) && !picked.some((p) => p.id === l.id));
    if (!extra) break;
    picked.push(extra);
  }
  return picked.slice(0, RUN_POOL_SIZE);
};

/** Estimation gains prochain round (si victoire). */
/** Bonus de série (victoires OU défaites d’affilée). streak > 0 = victoires, < 0 = défaites. */
export const streakGold = (streak) => {
  const n = Math.abs(streak || 0);
  if (n >= 5) return 3;
  if (n >= 4) return 2;
  if (n >= 2) return 1;
  return 0;
};

/**
 * Gains d’un combat. chapter : 1..3 (base 5/6/7), win : +1 or,
 * intérêts : 1 par tranche de 10 or (max 5), série de victoires ou de défaites.
 */
export const estimateIncome = (gold, streak, chapter = 1, win = true, bonus = 0) => {
  const base = 4 + Math.max(1, Math.min(3, chapter));
  const interest = Math.min(5, Math.floor(Math.max(0, gold) / 10));
  const nextStreak = win ? Math.max(1, (streak > 0 ? streak : 0) + 1) : Math.min(-1, (streak < 0 ? streak : 0) - 1);
  const streakBonus = streakGold(nextStreak);
  const winBonus = win ? 1 + bonus : 0;
  const total = base + interest + streakBonus + winBonus;
  const nextInterestGold = (interest < 5) ? (interest + 1) * 10 : null;
  return { base, interest, streakBonus, winBonus, total, nextInterestGold, nextStreak };
};

export const ITEMS = [...COMPONENTS, ...CRAFTED, ...PLATES, ...CONSUMABLES];
export const ITEM_MAP = Object.fromEntries(ITEMS.map((item) => [item.id, item]));
// Anciennes sauvegardes : objets renommés.
ITEM_MAP.scopelens = ITEM_MAP.razorclaw;

export const recipeKey = (a, b) => [a, b].sort().join('+');
export const craftResult = (a, b) => RECIPE_TABLE[recipeKey(a, b)] || null;

export const RECIPE_LIST = Object.entries(RECIPE_TABLE).map(([key, resultId]) => {
  const [a, b] = key.split('+');
  return { a, b, result: ITEM_MAP[resultId] };
});

export const SHOP_ODDS = {
  1: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 },
  2: { 1: 75, 2: 25, 3: 0, 4: 0, 5: 0 },
  3: { 1: 60, 2: 30, 3: 10, 4: 0, 5: 0 },
  4: { 1: 45, 2: 35, 3: 18, 4: 2, 5: 0 },
  5: { 1: 35, 2: 35, 3: 22, 4: 8, 5: 0 },
  6: { 1: 28, 2: 32, 3: 28, 4: 10, 5: 2 },
  7: { 1: 20, 2: 30, 3: 30, 4: 16, 5: 4 },
  8: { 1: 16, 2: 26, 3: 30, 4: 20, 5: 8 },
  9: { 1: 12, 2: 22, 3: 28, 4: 26, 5: 12 }
};

/** XP pour passer au niveau n (LEVEL_XP[n]). +2 XP par combat, 4 or = 4 XP. */
export const LEVEL_XP = [0, 0, 2, 4, 8, 14, 22, 34, 48, 66];
export const MAX_LEVEL = 9;
export const BOARD_CAP = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10 };
export const XP_COST = 4;
export const REROLL_COST = 2;

/** Ajoute de l’XP et renvoie le nouveau niveau. */
export const addXp = (level, xp, amount) => {
  let nextXp = xp + amount;
  let nextLevel = level;
  while (nextLevel < MAX_LEVEL && nextXp >= LEVEL_XP[nextLevel + 1]) {
    nextXp -= LEVEL_XP[nextLevel + 1];
    nextLevel += 1;
  }
  if (nextLevel >= MAX_LEVEL) nextXp = 0;
  return { level: nextLevel, xp: nextXp };
};
export const BENCH_CAP = 9;
export const SHOP_SIZE = 5;
export const emptyBoard = () => Array(BOARD_SIZE).fill(null);

/** Cases d’une rangée, du centre vers les bords en laissant des trous (équipe aérée). */
const SPREAD_COLS = [3, 1, 5, 2, 4, 0, 6];
const rowCenterOut = (rowLocal) => SPREAD_COLS
  .filter((c) => c < BOARD_COLS)
  .map((c) => rowLocal * BOARD_COLS + c);

/**
 * Place les ennemis : mêlée sur la rangée avant (près du milieu), distance au fond.
 * Côté ennemi, la rangée locale 2 est la plus proche du joueur.
 */
export const seatFoes = (foes) => {
  const pads = emptyBoard();
  const front = rowCenterOut(BOARD_ROWS_HALF - 1);
  const mid = rowCenterOut(BOARD_ROWS_HALF - 2);
  const back = rowCenterOut(0);
  const take = (lists) => {
    for (const list of lists) {
      const slot = list.find((i) => !pads[i]);
      if (slot != null) return slot;
    }
    return pads.findIndex((u) => !u);
  };
  [...foes]
    .sort((a, b) => (a.range || 1) - (b.range || 1))
    .forEach((foe) => {
      const r = foe.range || 1;
      const order = r <= 1 ? [front, mid, back] : r === 2 ? [mid, front, back] : [back, mid, front];
      const slot = take(order);
      if (slot < 0) return;
      pads[slot] = { ...foe, slot, side: 'foe' };
    });
  return pads;
};

/** Placement auto côté joueur (mêmes règles, la rangée locale 0 est l’avant). */
export const autoSeat = (units) => {
  const pads = emptyBoard();
  const front = rowCenterOut(0);
  const mid = rowCenterOut(1);
  const back = rowCenterOut(2);
  [...units]
    .sort((a, b) => (a.range || 1) - (b.range || 1))
    .forEach((u) => {
      const r = u.range || 1;
      const order = r <= 1 ? [front, mid, back] : r === 2 ? [mid, front, back] : [back, mid, front];
      let slot = -1;
      for (const list of order) {
        slot = list.find((i) => !pads[i]) ?? -1;
        if (slot >= 0) break;
      }
      if (slot >= 0) pads[slot] = u;
    });
  return pads;
};

/** Attache slot + camp aux unités présentes sur un plateau. */
export const withBoardSlots = (board, side) => board
  .map((u, i) => (u ? { ...u, slot: i, side } : null))
  .filter(Boolean);

const resolveStage = (line, star, formId, autoForm) => {
  const stageN = Math.max(1, Math.min(3, star));
  if (!line.branchAt || stageN < line.branchAt) {
    return { base: line.stages[stageN - 1], formId: formId || null, pending: false, stageN };
  }
  let chosen = formId || null;
  if (!chosen && autoForm && line.forms?.length) {
    chosen = line.forms[Math.floor(Math.random() * line.forms.length)].id;
  }
  if (!chosen) {
    const pre = line.stages[Math.max(0, line.branchAt - 2)] || line.stages[0];
    return { base: pre, formId: null, pending: true, stageN };
  }
  const form = line.forms.find((f) => f.id === chosen) || line.forms[0];
  const idx = Math.max(0, stageN - line.branchAt);
  const base = form.stages[Math.min(idx, form.stages.length - 1)];
  return { base, formId: form.id, pending: false, stageN };
};

export const unitFromLine = (lineId, star = 1, uid, items = [], formId = null, autoForm = false) => {
  const line = LINE_MAP[lineId];
  if (!line) return null;
  const resolved = resolveStage(line, star, formId, autoForm);
  const base = resolved.base;
  if (!base) return null;
  const types = base.types || [base.type];
  const roles = (line.traits || []).filter((t) => ROLE_TRAITS.has(t));
  const dex = base.dex;
  return {
    uid: uid || `${lineId}-${resolved.stageN}-${Math.random().toString(36).slice(2, 8)}`,
    lineId,
    star: resolved.stageN,
    cost: line.cost,
    traits: [...types, ...roles],
    spell: line.spell,
    ab: (resolved.formId && line.forms?.find((f) => f.id === resolved.formId)?.ab) || line.ab || null,
    range: line.range || 1,
    name: base.name,
    type: types[0],
    types,
    formId: resolved.formId,
    pendingEvo: resolved.pending,
    hp: base.hp,
    atk: base.atk,
    spd: base.spd,
    dex,
    art: artworkUrl(dex),
    home: homeUrl(dex),
    sprite: spriteUrl(dex),
    pixel: dex < 10000 ? hgssUrl(dex) : homeUrl(dex),
    anim: animUrl(dex),
    model: homeUrl(dex),
    items: items.slice(0, ITEM_SLOTS)
  };
};

/** Applique le choix d’évolution (même uid / objets / étoile). */
export const applyEvolutionChoice = (unit, formId) => {
  if (!unit) return null;
  return unitFromLine(unit.lineId, unit.star, unit.uid, unit.items || [], formId, false);
};

/** Index plateau 0..20 → axial (col,row) selon le camp. */
export const indexToAxial = (index, isEnemy) => {
  const col = index % BOARD_COLS;
  const rowLocal = Math.floor(index / BOARD_COLS);
  return { col, row: isEnemy ? rowLocal : BOARD_ROWS_HALF + rowLocal };
};

const offsetToCube = (col, row) => {
  const x = col - (row - (row & 1)) / 2;
  const z = row;
  const y = -x - z;
  return { x, y, z };
};

export const hexDist = (a, b) => {
  const ca = offsetToCube(a.col, a.row);
  const cb = offsetToCube(b.col, b.row);
  return (Math.abs(ca.x - cb.x) + Math.abs(ca.y - cb.y) + Math.abs(ca.z - cb.z)) / 2;
};

export const rollCost = (level) => {
  const odds = SHOP_ODDS[Math.min(9, Math.max(1, level))] || SHOP_ODDS[1];
  const roll = Math.random() * 100;
  let acc = 0;
  for (const cost of [1, 2, 3, 4, 5]) {
    acc += odds[cost] || 0;
    if (roll < acc) return cost;
  }
  return 1;
};

export const rollShop = (level, size = SHOP_SIZE, poolLines = LINES) => {
  const catalog = poolLines?.length ? poolLines : LINES;
  const slots = [];
  for (let i = 0; i < size; i += 1) {
    const cost = rollCost(level);
    let pool = catalog.filter((line) => line.cost === cost);
    if (!pool.length) pool = catalog;
    const pick = pool[Math.floor(Math.random() * pool.length)] || LINES[0];
    slots.push(unitFromLine(pick.id, 1));
  }
  return slots;
};

export const rollComponent = () => COMPONENTS[Math.floor(Math.random() * COMPONENTS.length)];
export const rollCrafted = () => CRAFTED[Math.floor(Math.random() * CRAFTED.length)];
export const rollPlate = () => PLATES[Math.floor(Math.random() * PLATES.length)];
/** Compat : tirage d’un composant. */
export const rollItem = rollComponent;

/** Types comptés pour les synergies : types du Pokémon + rôles + plaques équipées. */
export const unitTraits = (unit) => {
  const list = [...(unit?.traits || [])];
  (unit?.items || []).forEach((id) => {
    const add = ITEM_MAP[id]?.addTrait;
    if (add && !list.includes(add)) list.push(add);
  });
  return list;
};

export const traitBonus = (units) => {
  const counts = {};
  const seen = new Set();
  units.forEach((unit) => {
    // Deux exemplaires identiques sur le terrain ne comptent qu’une fois (comme dans les auto-battlers).
    const key = `${unit.lineId}:${unit.formId || ''}`;
    const dupe = seen.has(key);
    seen.add(key);
    unitTraits(unit).forEach((trait) => {
      if (dupe && !(unit.items || []).some((id) => ITEM_MAP[id]?.addTrait === trait)) return;
      counts[trait] = (counts[trait] || 0) + 1;
    });
  });
  let atkMul = 1;
  let hpMul = 1;
  const active = [];
  const details = [];
  Object.entries(counts).forEach(([trait, count]) => {
    const rule = TRAIT_BONUS[trait];
    if (!rule || count < 2) return;
    active.push(`${trait} ×${count}`);
    const n = Math.min(count, rule.cap);
    if (rule.atk) atkMul += rule.atk * n;
    if (rule.hp) hpMul += rule.hp * n;
    const tip = formatBonus(rule, n);
    const info = TRAIT_INFO[trait];
    details.push({
      trait,
      count,
      tip,
      blurb: info?.blurb || '',
      effect: info?.effect || tip
    });
  });
  return { atkMul, hpMul, active, counts, details };
};

export const traitCap = (trait) => TRAIT_BONUS[trait]?.cap || 0;

const itemMods = (items = []) => {
  const mods = {
    hpMul: 1, atkMul: 1, spdMul: 1, spdFlat: 0, spellMul: 1,
    regen: 0, selfHurt: 0, thorns: 0, lifesteal: 0, endure: false,
    dmgTaken: 1, spellGuard: 1, precharge: 0, spellDrain: 0, berry: 0,
    critChance: 0, critMult: 1.5, superMul: 1, flinch: 0, castNow: false,
    spellDot: null, noCC: false, cleanse: false, quick: 0, eviolite: false,
    startShield: 0, everyMinus: 0
  };
  items.forEach((id) => {
    const item = ITEM_MAP[id];
    if (!item) return;
    if (item.hpMul) mods.hpMul *= item.hpMul;
    if (item.atkMul) mods.atkMul *= item.atkMul;
    if (item.spdMul) mods.spdMul *= item.spdMul;
    if (item.spdFlat) mods.spdFlat += item.spdFlat;
    if (item.spellMul) mods.spellMul *= item.spellMul;
    if (item.regen) mods.regen += item.regen;
    if (item.selfHurt) mods.selfHurt += item.selfHurt;
    if (item.thorns) mods.thorns += item.thorns;
    if (item.lifesteal) mods.lifesteal += item.lifesteal;
    if (item.endure) mods.endure = true;
    if (item.dmgTaken) mods.dmgTaken *= item.dmgTaken;
    if (item.spellGuard) mods.spellGuard *= item.spellGuard;
    if (item.precharge) mods.precharge += item.precharge;
    if (item.spellDrain) mods.spellDrain += item.spellDrain;
    if (item.berry) mods.berry = Math.max(mods.berry, item.berry);
    if (item.critChance) {
      mods.critChance = Math.min(0.75, mods.critChance + item.critChance);
      mods.critMult = Math.max(mods.critMult, item.critMult || 1.5);
    }
    if (item.superMul) mods.superMul *= item.superMul;
    if (item.flinch) mods.flinch = Math.min(0.6, mods.flinch + item.flinch);
    if (item.castNow) mods.castNow = true;
    if (item.spellDot) mods.spellDot = item.spellDot;
    if (item.noCC) mods.noCC = true;
    if (item.cleanse) mods.cleanse = true;
    if (item.quick) mods.quick = Math.min(0.6, mods.quick + item.quick);
    if (item.eviolite) mods.eviolite = true;
    if (item.startShield) mods.startShield += item.startShield;
    if (item.everyMinus) mods.everyMinus += item.everyMinus;
  });
  return mods;
};

/* ——————————————————————————— Moteur de combat ——————————————————————————— */

/** Talent d’une unité selon sa lignée et sa forme. */
export const talentOf = (lineId, formId) => {
  const line = LINE_MAP[lineId];
  if (!line) return null;
  return (formId && line.forms?.find((f) => f.id === formId)?.ab) || line.ab || null;
};

const has = (u, key) => !!(u && u.ab && u.ab[key]);
const isStatused = (u) => !!(u.slowed || u.dot || u.stunSkip);
const unitHasType = (u, type) => (u.types || [u.type]).includes(type);

export const buildFighters = (units, opts = {}) => {
  const bonus = traitBonus(units);
  return units.map((unit) => {
    const im = itemMods(unit.items || []);
    const ab = opts.neutralized ? null : (unit.ab || talentOf(unit.lineId, unit.formId));
    const a = ab || {};
    const scale = unit.scale || 1;
    const maxHp = Math.round(unit.hp * scale * bonus.hpMul * im.hpMul * (a.hpMul || 1));
    const every = unit.spell?.every ? Math.max(2, unit.spell.every - im.everyMinus) : 0;
    let cast = (a.precharge || 0) + im.precharge;
    if (im.castNow && every) cast = Math.max(cast, every - 1);
    return {
      ...unit,
      ab,
      maxHp,
      curHp: maxHp,
      power: Math.round(unit.atk * scale * bonus.atkMul * im.atkMul * (a.atkMul || 1)),
      spd: Math.round(unit.spd * im.spdMul * (a.spdMul || 1) + im.spdFlat),
      range: unit.range || 1,
      spellEvery: every,
      spellMul: im.spellMul * (a.spellMul || 1),
      regen: im.regen + (a.regen || 0),
      selfHurt: im.selfHurt,
      thorns: im.thorns + (a.thorns || 0),
      lifesteal: im.lifesteal,
      spellDrain: im.spellDrain,
      endure: im.endure || !!a.endure,
      endured: false,
      itemBerry: im.berry,
      itemBerryUsed: false,
      itemCrit: im.critChance,
      itemCritMult: im.critMult,
      superMul: im.superMul,
      flinch: im.flinch,
      spellDot: im.spellDot,
      itemNoCC: im.noCC,
      itemCleanse: im.cleanse,
      quick: im.quick,
      dmgTakenMul: im.dmgTaken * (im.eviolite ? (unit.star >= 3 ? 0.8 : 0.65) : 1),
      spellGuardMul: im.spellGuard,
      startShield: im.startShield,
      stunSkip: false,
      alive: true,
      cast,
      shieldHp: 0,
      dot: null,
      slowed: false,
      vuln: 1,
      guard: 1,
      dmgDealt: 0,
      disguiseUsed: false,
      spellShieldUsed: false,
      berryUsed: false,
      constructUsed: false,
      surgeSpdOn: false
    };
  });
};

const fighterAxial = (u) => u.cell || indexToAxial(u.slot ?? 0, u.side === 'foe');

const distBetween = (a, b) => hexDist(fighterAxial(a), fighterAxial(b));

const inRangeOf = (attacker, target) => distBetween(attacker, target) <= (attacker.range || 1);

const BOARD_ROWS = BOARD_ROWS_HALF * 2;
const cellKey = (c) => `${c.col},${c.row}`;
const onGrid = (c) => c.col >= 0 && c.col < BOARD_COLS && c.row >= 0 && c.row < BOARD_ROWS;

/** Voisins hexagonaux réels (vérifiés par la distance cubique, quel que soit le décalage des rangées). */
const hexNeighbors = (c) => {
  const out = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue;
      const n = { col: c.col + dc, row: c.row + dr };
      if (onGrid(n) && hexDist(c, n) === 1) out.push(n);
    }
  }
  return out;
};

const snapshotPos = (allies, foes) => {
  const pos = {};
  [...allies, ...foes].forEach((u) => {
    const c = fighterAxial(u);
    pos[u.uid] = { side: u.side, col: c.col, row: c.row };
  });
  return pos;
};

/**
 * Déplace l’unité d’1 case sur le plateau entier (les deux moitiés) vers la case libre la plus
 * proche d’où elle peut toucher un ennemi (plus court chemin qui contourne les autres Pokémon).
 */
const stepCloser = (u, enemies, allies, foes, reach = u.range || 1) => {
  const live = enemies.filter((t) => t.alive);
  if (!live.length) return false;
  const start = fighterAxial(u);
  const blocked = new Set(
    [...allies, ...foes].filter((t) => t.alive && t !== u).map((t) => cellKey(fighterAxial(t)))
  );
  const canHitFrom = (c) => live.some((t) => hexDist(c, fighterAxial(t)) <= reach);
  const prev = new Map([[cellKey(start), null]]);
  const queue = [start];
  let goal = null;
  while (queue.length && !goal) {
    const c = queue.shift();
    const around = hexNeighbors(c).sort(() => Math.random() - 0.5);
    for (const n of around) {
      const k = cellKey(n);
      if (prev.has(k) || blocked.has(k)) continue;
      prev.set(k, c);
      if (canHitFrom(n)) {
        goal = n;
        break;
      }
      queue.push(n);
    }
  }
  let step = null;
  if (goal) {
    step = goal;
    while (prev.get(cellKey(step)) && prev.get(cellKey(step)) !== start) step = prev.get(cellKey(step));
  } else {
    // Aucun chemin : on se rapproche quand même de l’ennemi le plus proche si une case le permet.
    const nearest = live.slice().sort((a, b) => distBetween(u, a) - distBetween(u, b))[0];
    const goalCell = fighterAxial(nearest);
    const here = hexDist(start, goalCell);
    const options = hexNeighbors(start)
      .filter((n) => !blocked.has(cellKey(n)))
      .map((n) => ({ ...n, d: hexDist(n, goalCell) }))
      .filter((n) => n.d < here)
      .sort((a, b) => a.d - b.d);
    if (options.length) step = { col: options[0].col, row: options[0].row };
  }
  if (!step) return false;
  u.cell = { col: step.col, row: step.row };
  return true;
};

const pickTargets = (aim, foes, allies, self, respectRange = false) => {
  let live = foes.filter((t) => t.alive);
  if (!live.length) return [];
  if (respectRange && self) {
    const inR = live.filter((t) => inRangeOf(self, t));
    if (!inR.length) return [];
    if (aim === 'all') return live;
    live = inR;
  }
  if (aim === 'all') return live;
  if (aim === 'aoe2') {
    const shuffled = [...live].sort((a, b) => distBetween(self, a) - distBetween(self, b));
    return shuffled.slice(0, Math.min(2, shuffled.length));
  }
  if (aim === 'weak') return [live.slice().sort((a, b) => a.curHp - b.curHp)[0]];
  if (aim === 'tank') return [live.slice().sort((a, b) => b.curHp - a.curHp)[0]];
  if (aim === 'back') return [live.slice().sort((a, b) => distBetween(self, b) - distBetween(self, a))[0]];
  if (aim === 'front') return [live.slice().sort((a, b) => distBetween(self, a) - distBetween(self, b))[0]];
  return [live[Math.floor(Math.random() * live.length)]];
};

const note = (ctx, line) => {
  if (ctx.turn < 10 && ctx.log.length < 14) ctx.log.push(line);
};

/** Altérations : ralentissement, étourdissement, baisse d’ATK, poison / brûlure. */
const applyStatus = (ctx, target, source, eff, reflected = false) => {
  if (!target?.alive || !eff) return;
  const ta = { ...(target.ab || {}) };
  if (target.itemNoCC) ta.noCC = true;
  if (target.itemCleanse) ta.cleanse = true;
  let lowered = false;
  if (eff.slow && !ta.noCC) {
    if (ta.contrary) target.spd += eff.slow;
    else {
      target.spd = Math.max(1, target.spd - eff.slow);
      target.slowed = true;
      lowered = true;
    }
  }
  if (eff.stun && !ta.noCC) target.stunSkip = true;
  if (eff.atkBreak && !ta.noCC) {
    if (ta.contrary) target.power = Math.round(target.power * (1 + eff.atkBreak));
    else {
      target.power = Math.max(1, Math.round(target.power * (1 - eff.atkBreak)));
      lowered = true;
    }
  }
  if (eff.dot && !(ta.cleanse || ta.magicGuard || target.teamCleansed)) {
    const pct = eff.dot.pct * ((source?.ab?.dotMul) || 1);
    if (!target.dot || target.dot.pct <= pct) target.dot = { pct, turns: eff.dot.turns || 3 };
  }
  if (lowered && ta.defiant) {
    target.power = Math.round(target.power * (1 + ta.defiant));
    note(ctx, `${target.name} : ${ta.name} !`);
  }
  if (ta.synchro && source?.alive && !reflected && (eff.slow || eff.dot)) {
    applyStatus(ctx, source, target, { slow: eff.slow, dot: eff.dot }, true);
  }
};

const checkThresholds = (ctx, u) => {
  if (!u.alive) return;
  const ratio = u.curHp / u.maxHp;
  if (u.itemBerry && !u.itemBerryUsed && ratio < 0.5) {
    u.itemBerryUsed = true;
    const heal = Math.round(u.maxHp * u.itemBerry);
    u.curHp = Math.min(u.maxHp, u.curHp + heal);
    ctx.floats.push({ uid: u.uid, text: `+${heal}`, kind: 'heal' });
    note(ctx, `${u.name} mange sa Baie Sitrus !`);
  }
  if (!u.ab) return;
  if (u.ab.berry && !u.berryUsed && ratio < 0.5) {
    u.berryUsed = true;
    const heal = Math.round(u.maxHp * u.ab.berry);
    u.curHp = Math.min(u.maxHp, u.curHp + heal);
    ctx.floats.push({ uid: u.uid, text: `+${heal}`, kind: 'heal' });
    note(ctx, `${u.name} : ${u.ab.name} !`);
  }
  if (u.ab.powerConstruct && !u.constructUsed && ratio < 0.5) {
    u.constructUsed = true;
    const extra = Math.round(u.maxHp * u.ab.powerConstruct);
    u.maxHp += extra;
    u.curHp += extra;
    ctx.floats.push({ uid: u.uid, text: `+${extra}`, kind: 'heal' });
    note(ctx, `${u.name} : ${u.ab.name} !`);
  }
};

const onDeath = (ctx, dead, killer) => {
  if (killer && killer !== dead && killer.alive && killer.ab?.onKo) {
    killer.power = Math.round(killer.power * (1 + killer.ab.onKo));
    if (killer.ab.onKoSpd) killer.spd += killer.ab.onKoSpd;
  }
  const friends = dead.side === 'foe' ? ctx.foes : ctx.allies;
  friends.forEach((f) => {
    if (f.alive && f.ab?.supreme) f.power = Math.round(f.power * (1 + f.ab.supreme));
  });
  [...ctx.allies, ...ctx.foes].forEach((u) => {
    if (u.alive && u.ab?.anyKo) u.power = Math.round(u.power * (1 + u.ab.anyKo));
  });
  if (killer && killer !== dead) note(ctx, `${killer.name} KO ${dead.name}`);
};

const finish = (ctx, u, killer) => {
  if (!u.alive) return;
  if (u.curHp > 0) {
    checkThresholds(ctx, u);
    return;
  }
  if (u.endure && !u.endured) {
    u.curHp = 1;
    u.endured = true;
    note(ctx, `${u.name} tient bon !`);
    return;
  }
  u.curHp = 0;
  u.alive = false;
  onDeath(ctx, u, killer);
};

/** Calcule les dégâts d’un coup (auto ou sort) en tenant compte des talents des deux camps. */
const resolveHit = (attacker, target, base, kind, turnIndex) => {
  const ta = attacker.ab || {};
  const da = ta.pierce ? {} : (target.ab || {});
  const atkType = attacker.type;
  if (da.dodge && Math.random() < da.dodge) return { result: 'dodge' };
  if (da.disguise && !target.disguiseUsed) {
    target.disguiseUsed = true;
    return { result: 'disguise' };
  }
  if (kind === 'spell' && da.spellShield && !target.spellShieldUsed) {
    target.spellShieldUsed = true;
    return { result: 'spellShield' };
  }
  if (da.wonderGuard && typeMult(atkType, target.type) <= 1 && !ta.protean) return { result: 'immune' };
  if (da.immune && da.immune.includes(atkType)) {
    if (da.absorb) target.curHp = Math.min(target.maxHp, target.curHp + Math.round(target.maxHp * da.absorb));
    if (da.immuneAtk) target.power = Math.round(target.power * (1 + da.immuneAtk));
    return { result: 'immune' };
  }
  let mult = typeMult(atkType, target.type);
  if (ta.protean || ta.tinted) mult = Math.max(1, mult);
  if (ta.scrappy && unitHasType(target, 'Spectre')) mult = Math.max(1, mult);
  let dmg = base * mult;
  if (ta.lowHp && attacker.curHp / attacker.maxHp <= ta.lowHp.at) dmg *= 1 + ta.lowHp.atk;
  if (ta.guts && isStatused(attacker)) dmg *= 1 + ta.guts;
  if (ta.surge && turnIndex < ta.surge.turns) dmg *= 1 + (ta.surge.atk || 0);
  if (ta.hunger && turnIndex % 2 === 0) dmg *= 1 + ta.hunger;
  if (ta.vsType) Object.entries(ta.vsType).forEach(([t, m]) => { if (unitHasType(target, t)) dmg *= m; });
  if (kind === 'auto' && ta.autoMul) dmg *= ta.autoMul;
  if (mult > 1 && attacker.superMul) dmg *= attacker.superMul;
  let crit = false;
  if (ta.crit && !da.noCrit && Math.random() < ta.crit.chance) {
    dmg *= ta.crit.mult;
    crit = true;
  } else if (attacker.itemCrit && !da.noCrit && Math.random() < attacker.itemCrit) {
    dmg *= attacker.itemCritMult || 1.5;
    crit = true;
  }
  if (da.resist && da.resist[atkType]) dmg *= da.resist[atkType];
  if (da.fullHpGuard && target.curHp >= target.maxHp) dmg *= da.fullHpGuard;
  if (kind === 'auto' && da.autoGuard) dmg *= da.autoGuard;
  if (kind === 'spell' && da.spellGuard) dmg *= da.spellGuard;
  if (da.dmgTaken) dmg *= da.dmgTaken;
  if (da.superGuard && mult > 1) dmg *= da.superGuard;
  if (kind === 'spell') dmg *= target.spellGuardMul || 1;
  dmg *= (target.vuln || 1) * (target.guard || 1) * (target.dmgTakenMul || 1);
  return { result: 'hit', dmg, crit, mult };
};

const applyDamage = (ctx, target, raw, attacker, kind = 'auto') => {
  let dmg = Math.max(6, Math.round(raw));
  const pierce = has(attacker, 'pierce');
  if (target.shieldHp > 0 && !pierce) {
    const absorbed = Math.min(target.shieldHp, dmg);
    target.shieldHp -= absorbed;
    dmg -= absorbed;
  }
  target.curHp -= dmg;
  attacker.dmgDealt = (attacker.dmgDealt || 0) + dmg;
  const ta = attacker.ab || {};
  const drain = (attacker.lifesteal || 0) + (kind === 'spell' ? attacker.spellDrain || 0 : 0);
  if (drain) {
    attacker.curHp = Math.min(attacker.maxHp, attacker.curHp + Math.round(dmg * drain));
  }
  if (attacker.selfHurt && !ta.rockHead && !ta.magicGuard) {
    attacker.curHp -= Math.round(attacker.maxHp * attacker.selfHurt);
  }
  if (target.thorns && attacker.alive && !ta.rockHead && !ta.magicGuard) {
    attacker.curHp -= Math.round(dmg * target.thorns);
  }
  // Réactions du défenseur
  const da = pierce ? {} : (target.ab || {});
  if (target.curHp > 0) {
    if (da.onHitType && da.onHitType.type === attacker.type) {
      if (da.onHitType.shield) target.shieldHp += Math.round(target.maxHp * da.onHitType.shield);
      if (da.onHitType.atk) target.power = Math.round(target.power * (1 + da.onHitType.atk));
    }
    if (da.onHitAtk) target.power = Math.round(target.power * (1 + da.onHitAtk));
    if (da.onHitSpd) target.spd += da.onHitSpd;
    if (da.stamina) target.guard = Math.max(0.7, (target.guard || 1) - 0.04);
  }
  if (da.contact && (attacker.range || 1) <= 1 && attacker.alive && Math.random() < da.contact.chance) {
    applyStatus(ctx, attacker, target, da.contact);
  }
  if (ta.hitDot && target.curHp > 0 && Math.random() < ta.hitDot.chance) {
    applyStatus(ctx, target, attacker, { dot: { pct: ta.hitDot.pct, turns: ta.hitDot.turns } });
  }
  if (kind === 'auto' && attacker.flinch && target.curHp > 0 && Math.random() < attacker.flinch) {
    applyStatus(ctx, target, attacker, { stun: true });
  }
  finish(ctx, target, attacker);
  finish(ctx, attacker, null);
  return dmg;
};

/** Effets de début de combat d’un camp sur lui-même et sur l’adversaire. */
const startEffects = (ctx, side, other) => {
  side.forEach((u) => {
    const a = u.ab;
    if (!a?.trace) return;
    const pool = other.filter((f) => f.ab && !f.ab.trace);
    const src = pool[Math.floor(Math.random() * pool.length)];
    if (!src) return;
    u.ab = { ...src.ab, name: `${a.name} → ${src.ab.name}` };
    if (src.ab.atkMul) u.power = Math.round(u.power * src.ab.atkMul);
    if (src.ab.spdMul) u.spd = Math.round(u.spd * src.ab.spdMul);
    if (src.ab.spellMul) u.spellMul *= src.ab.spellMul;
    if (src.ab.regen) u.regen += src.ab.regen;
    if (src.ab.thorns) u.thorns += src.ab.thorns;
    if (src.ab.endure) u.endure = true;
    if (src.ab.precharge) u.cast += src.ab.precharge;
    note(ctx, `${u.name} copie ${src.ab.name} !`);
  });
  side.forEach((u) => {
    const a = u.ab;
    if (!a) return;
    if (a.intimidate) {
      other.forEach((f) => {
        if (f.ab?.airLock) return;
        if (f.ab?.contrary) {
          f.power = Math.round(f.power * (1 + a.intimidate));
          return;
        }
        f.power = Math.max(1, Math.round(f.power * (1 - a.intimidate)));
        if (f.ab?.defiant) f.power = Math.round(f.power * (1 + f.ab.defiant));
      });
      note(ctx, `${u.name} : ${a.name} !`);
    }
    if (a.teamAtk) {
      side.forEach((f) => {
        if (!a.teamAtk.type || unitHasType(f, a.teamAtk.type)) f.power = Math.round(f.power * (1 + a.teamAtk.mult));
      });
    }
    if (a.teamShield) {
      side.forEach((f) => {
        if (a.teamShield.types.some((t) => unitHasType(f, t))) f.shieldHp += Math.round(f.maxHp * a.teamShield.pct);
      });
    }
    if (a.teamCleanse) side.forEach((f) => { f.teamCleansed = true; });
    if (a.ruin) other.forEach((f) => { if (!f.ab?.airLock) f.vuln *= 1 + a.ruin; });
    if (a.pressure) other.forEach((f) => { if (!f.ab?.airLock) f.cast -= a.pressure; });
    if (a.surge?.spd) {
      u.spd += a.surge.spd;
      u.surgeSpdOn = true;
    }
  });
};

/** Effets de début de tour d’une unité. Retourne false si elle est tombée. */
const turnStart = (ctx, u, friends, enemies, turnIndex) => {
  const a = u.ab || {};
  if (u.regen) u.curHp = Math.min(u.maxHp, u.curHp + Math.round(u.maxHp * u.regen));
  if (u.dot) {
    const tick = Math.round(u.maxHp * u.dot.pct);
    u.curHp -= tick;
    ctx.floats.push({ uid: u.uid, text: `-${tick}`, kind: 'dmg' });
    u.dot.turns -= 1;
    if (u.dot.turns <= 0) u.dot = null;
    finish(ctx, u, null);
    if (!u.alive) return false;
  }
  if (a.sunPower && !a.magicGuard) {
    u.curHp -= Math.round(u.maxHp * 0.03);
    finish(ctx, u, null);
    if (!u.alive) return false;
  }
  if (a.badDreams) {
    enemies.forEach((e) => {
      if (e.alive && isStatused(e) && !e.ab?.magicGuard) {
        e.curHp -= Math.round(e.maxHp * a.badDreams);
        finish(ctx, e, u);
      }
    });
  }
  if (a.allyHeal) {
    const wounded = friends.filter((f) => f.alive && f.curHp < f.maxHp)
      .sort((x, y) => x.curHp / x.maxHp - y.curHp / y.maxHp)[0];
    if (wounded) {
      const heal = Math.round(wounded.maxHp * a.allyHeal);
      wounded.curHp = Math.min(wounded.maxHp, wounded.curHp + heal);
      ctx.floats.push({ uid: wounded.uid, text: `+${heal}`, kind: 'heal' });
    }
  }
  if (a.spdUp) u.spd += a.spdUp;
  if (a.moody) {
    if (Math.random() < 0.5) u.power = Math.round(u.power * 1.08);
    else u.spd += 2;
  }
  if (u.surgeSpdOn && a.surge && turnIndex >= a.surge.turns) {
    u.spd = Math.max(1, u.spd - (a.surge.spd || 0));
    u.surgeSpdOn = false;
  }
  return true;
};

const snapshotHp = (allies, foes) => {
  const hp = {};
  [...allies, ...foes].forEach((u) => {
    hp[u.uid] = { cur: Math.max(0, u.curHp), max: u.maxHp, alive: u.alive };
  });
  return hp;
};

const HIT_NOTES = {
  dodge: 'esquive',
  disguise: 'le coup est absorbé',
  spellShield: 'le sort est annulé',
  immune: 'aucun effet'
};

export const simulateFight = (alliesIn, foesIn) => {
  const allyNeutral = foesIn.some((u) => (u.ab || talentOf(u.lineId, u.formId))?.neutralize);
  const foeNeutral = alliesIn.some((u) => (u.ab || talentOf(u.lineId, u.formId))?.neutralize);
  const allies = buildFighters(alliesIn.map((u) => ({ ...u, side: u.side || 'ally' })), { neutralized: allyNeutral && !foeNeutral });
  const foes = buildFighters(foesIn.map((u) => ({ ...u, side: u.side || 'foe' })), { neutralized: foeNeutral && !allyNeutral });
  const log = [];
  const ctx = { allies, foes, log, turn: 0, floats: [] };
  const frames = [];
  /**
   * Une image du combat.
   * fx    : uid → 'strike' | 'spell' | 'move' | 'hit' | 'ko' | 'heal' | 'buff' | 'miss'
   * act   : { uid, kind, type, targets[], crit } — l’action jouée (pilote les animations)
   */
  const pushFrame = (line, fx = {}, floats = [], act = null) => {
    const all = [...floats, ...ctx.floats];
    ctx.floats = [];
    frames.push({
      line,
      hp: snapshotHp(allies, foes),
      fx,
      floats: all,
      act,
      turn: ctx.turn,
      pos: snapshotPos(allies, foes)
    });
  };
  if (allyNeutral && !foeNeutral) log.push('Gaz Inhibiteur : tes talents sont neutralisés !');
  if (foeNeutral && !allyNeutral) log.push('Gaz Inhibiteur : talents adverses neutralisés !');
  startEffects(ctx, allies, foes);
  startEffects(ctx, foes, allies);
  // Lumargile : bouclier pour soi et l’allié le plus proche.
  [allies, foes].forEach((team) => {
    team.forEach((u) => {
      if (!u.startShield) return;
      const mate = team.filter((f) => f !== u && f.alive).sort((a, b) => distBetween(u, a) - distBetween(u, b))[0];
      [u, mate].filter(Boolean).forEach((f) => { f.shieldHp += Math.round(f.maxHp * u.startShield); });
    });
  });
  pushFrame(log.length ? log[log.length - 1] : 'Combat !', {}, [], { kind: 'start' });
  let turn = 0;
  const maxTurns = 50;

  const doStrike = (u, enemies, friends, turnIndex) => {
    let picked = pickTargets('front', enemies, friends, u, true);
    if (!picked.length) {
      if (stepCloser(u, enemies, allies, foes)) {
        pushFrame(`${u.name} avance`, { [u.uid]: 'move' }, [], { uid: u.uid, kind: 'move' });
        picked = pickTargets('front', enemies, friends, u, true);
      }
      if (!picked.length) return false;
    }
    const target = picked[0];
    const fx = { [u.uid]: 'strike' };
    const floats = [];
    const hit = resolveHit(u, target, u.power * (0.88 + Math.random() * 0.28), 'auto', turnIndex);
    const act = { uid: u.uid, kind: 'strike', type: u.type, targets: [target.uid], ranged: (u.range || 1) > 1 };
    if (hit.result !== 'hit') {
      fx[target.uid] = 'miss';
      floats.push({ uid: target.uid, text: hit.result === 'immune' ? 'Immunisé' : 'Raté', kind: 'miss' });
      pushFrame(`${u.name} → ${target.name} : ${HIT_NOTES[hit.result]}`, fx, floats, act);
      return true;
    }
    const before = target.curHp;
    applyDamage(ctx, target, hit.dmg, u, 'auto');
    const dealt = Math.max(0, before - target.curHp);
    fx[target.uid] = target.alive ? 'hit' : 'ko';
    if (dealt) floats.push({ uid: target.uid, text: `-${dealt}${hit.crit ? '!' : ''}`, kind: hit.crit ? 'crit' : (hit.mult > 1 ? 'super' : 'dmg') });
    act.crit = hit.crit;
    act.eff = hit.mult;
    pushFrame(`${u.name} → ${target.name}${hit.crit ? ' (critique)' : ''}${hit.mult > 1 ? ' — super efficace' : ''}`, fx, floats, act);
    return true;
  };

  const doSpell = (u, spell, enemies, friends, turnIndex) => {
    const spellRange = (u.range || 1) + 1;
    const prev = u.range;
    u.range = spellRange;
    let picked = pickTargets(spell.aim, enemies, friends, u, true);
    u.range = prev;
    if (!picked.length) {
      if (stepCloser(u, enemies, allies, foes, spellRange)) {
        pushFrame(`${u.name} avance`, { [u.uid]: 'move' }, [], { uid: u.uid, kind: 'move' });
        u.range = spellRange;
        picked = pickTargets(spell.aim, enemies, friends, u, true);
        u.range = prev;
      }
      if (!picked.length) {
        u.cast -= 1; // le sort reste chargé pour le tour suivant
        return false;
      }
    }
    const fx = { [u.uid]: 'spell' };
    const floats = [];
    const extras = [];
    const act = { uid: u.uid, kind: 'spell', type: u.type, name: spell.name, aim: spell.aim, targets: [] };
    const spellPower = u.power * (spell.mult || 1.5) * (u.spellMul || 1);
    picked.forEach((target) => {
      if (!target.alive) return;
      act.targets.push(target.uid);
      const hit = resolveHit(u, target, spellPower * (0.92 + Math.random() * 0.2), 'spell', turnIndex);
      if (hit.result !== 'hit') {
        fx[target.uid] = 'miss';
        floats.push({ uid: target.uid, text: hit.result === 'immune' ? 'Immunisé' : 'Bloqué', kind: 'miss' });
        extras.push(`${target.name} : ${HIT_NOTES[hit.result]}`);
        return;
      }
      let raw = hit.dmg;
      if (spell.shred) raw += target.maxHp * spell.shred;
      if (spell.stealAtk) raw = Math.max(raw, target.power * 1.1);
      const before = target.curHp;
      applyDamage(ctx, target, raw, u, 'spell');
      const dealt = Math.max(0, before - target.curHp);
      fx[target.uid] = target.alive ? 'hit' : 'ko';
      if (hit.crit) act.crit = true;
      if (dealt) floats.push({ uid: target.uid, text: `-${dealt}${hit.crit ? '!' : ''}`, kind: hit.crit ? 'crit' : (hit.mult > 1 ? 'super' : 'dmg') });
      if (target.alive) {
        const stun = spell.stun || (u.ab?.serene && Math.random() < u.ab.serene);
        applyStatus(ctx, target, u, { slow: spell.slow, stun, atkBreak: spell.atkBreak, dot: spell.dot || u.spellDot });
      }
    });
    if (spell.healAlly) {
      const wounded = friends.filter((f) => f.alive).sort((a, b) => a.curHp / a.maxHp - b.curHp / b.maxHp)[0];
      if (wounded) {
        const heal = Math.round(wounded.maxHp * spell.healAlly);
        wounded.curHp = Math.min(wounded.maxHp, wounded.curHp + heal);
        floats.push({ uid: wounded.uid, text: `+${heal}`, kind: 'heal' });
        if (!fx[wounded.uid]) fx[wounded.uid] = 'heal';
      }
    }
    if (spell.shield) u.shieldHp += Math.round(u.maxHp * spell.shield);
    if (u.ab?.stance) u.shieldHp += Math.round(u.maxHp * u.ab.stance);
    if (spell.selfAtk) u.power = Math.round(u.power * (1 + spell.selfAtk));
    if (spell.selfSlow) u.spd = Math.max(1, u.spd - spell.selfSlow);
    if (spell.recoil && u.alive && !u.ab?.rockHead && !u.ab?.magicGuard) {
      u.curHp -= Math.round(u.maxHp * spell.recoil);
      finish(ctx, u, null);
    }
    if (spell.teamAtk) {
      friends.forEach((f) => {
        if (!f.alive) return;
        f.power = Math.round(f.power * (1 + spell.teamAtk));
        if (!fx[f.uid]) fx[f.uid] = 'buff';
      });
    }
    if (spell.allyBuff) {
      const slow = friends.filter((f) => f.alive).sort((a, b) => a.spd - b.spd)[0];
      if (slow) {
        slow.spd += 3;
        if (!fx[slow.uid]) fx[slow.uid] = 'buff';
      }
    }
    friends.forEach((f) => { if (f !== u && f.alive && f.ab?.dancer) f.cast += 1; });
    const line = `${u.name} : ${spell.name}${extras.length ? ` (${extras.join(', ')})` : ''}`;
    if (turnIndex < 10) log.push(line);
    pushFrame(line, fx, floats, act);
    return true;
  };

  while (turn < maxTurns) {
    ctx.turn = turn;
    const liveA = allies.filter((u) => u.alive);
    const liveF = foes.filter((u) => u.alive);
    if (!liveA.length || !liveF.length) break;

    const queue = [
      ...liveA.map((u) => ({ side: 'a', u })),
      ...liveF.map((u) => ({ side: 'f', u }))
    ].sort((a, b) => b.u.spd - a.u.spd || Math.random() - 0.5);

    const turnIndex = turn;
    for (let qi = 0; qi < queue.length; qi += 1) {
      const { side, u } = queue[qi];
      if (!u.alive) continue;
      const enemies = side === 'a' ? foes : allies;
      const friends = side === 'a' ? allies : foes;
      if (!enemies.some((t) => t.alive)) break;
      if (!turnStart(ctx, u, friends, enemies, turnIndex)) {
        pushFrame(`${u.name} succombe à son altération`, { [u.uid]: 'ko' });
        continue;
      }
      if (u.stunSkip) {
        u.stunSkip = false;
        pushFrame(`${u.name} est étourdi`, { [u.uid]: 'stun' }, [{ uid: u.uid, text: 'Étourdi', kind: 'miss' }]);
        continue;
      }

      u.cast += 1;
      const spell = u.spell;
      const useSpell = spell && u.spellEvery && u.cast > 0 && u.cast % u.spellEvery === 0;
      let acted = false;
      if (useSpell) acted = doSpell(u, spell, enemies, friends, turnIndex);
      if (!acted) acted = doStrike(u, enemies, friends, turnIndex);
      if (!acted) pushFrame(`${u.name} cherche une cible`, { [u.uid]: 'move' });
      // Vive Griffe : action supplémentaire.
      if (u.alive && u.quick && enemies.some((t) => t.alive) && Math.random() < u.quick) {
        doStrike(u, enemies, friends, turnIndex);
      }
    }
    turn += 1;
  }

  const win = foes.every((u) => !u.alive) && allies.some((u) => u.alive);
  const aliveFoes = foes.filter((u) => u.alive);
  pushFrame(
    win ? 'Victoire !' : 'Défaite…',
    {},
    [],
    { kind: 'end', win }
  );
  return {
    win,
    log: log.slice(0, 10),
    frames,
    damage: win ? 0 : aliveFoes.reduce((sum, u) => sum + (u.star || 1), 0),
    survivors: allies.filter((u) => u.alive).length,
    foeSurvivors: aliveFoes.length,
    turns: turn,
    stats: [...allies, ...foes].map((u) => ({ uid: u.uid, name: u.name, side: u.side, dmg: Math.round(u.dmgDealt || 0), alive: u.alive, dex: u.dex }))
  };
};

/** Fusionne 3 unités même ligne + même étoile → +1★ (évolution). Conserve les items. */
export const mergeUnits = (board, bench) => {
  let boardNext = [...board];
  let benchNext = [...bench];
  const notes = [];
  const evolved = [];
  let changed = true;

  while (changed) {
    changed = false;
    const all = [
      ...boardNext.map((u, index) => (u ? { where: 'board', index, u } : null)),
      ...benchNext.map((u, index) => (u ? { where: 'bench', index, u } : null))
    ].filter(Boolean);

    const groups = {};
    all.forEach((entry) => {
      if (entry.u.star >= 3 || entry.u.pendingEvo) return;
      const key = `${entry.u.lineId}:${entry.u.star}:${entry.u.formId || ''}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });

    const key = Object.keys(groups).find((k) => groups[k].length >= 3);
    if (!key) break;

    const trio = groups[key].slice(0, 3);
    const base = trio[0].u;
    const pooledItems = [];
    trio.forEach((entry) => {
      (entry.u.items || []).forEach((id) => {
        if (pooledItems.length < ITEM_SLOTS) pooledItems.push(id);
      });
    });
    const upgraded = unitFromLine(base.lineId, base.star + 1, undefined, pooledItems, base.formId || null);
    evolved.push(upgraded.uid);
    notes.push(upgraded.pendingEvo
      ? `${base.name} ×3 — choisis son évolution`
      : `${base.name} ×3 → ${upgraded.name} (${upgraded.star}★)`);

    // Si au moins 1 du trio est sur le terrain → l’évolué reste sur le terrain
    // (premier slot board du trio). Sinon il reste sur le banc (pas d’auto-field).
    const boardAnchor = trio.find((entry) => entry.where === 'board');

    for (let ti = 0; ti < trio.length; ti += 1) {
      const entry = trio[ti];
      if (entry.where === 'board') boardNext[entry.index] = null;
      else benchNext[entry.index] = null;
    }
    benchNext = benchNext.filter(Boolean);

    if (boardAnchor) {
      boardNext[boardAnchor.index] = upgraded;
    } else {
      benchNext.push(upgraded);
    }

    changed = true;
  }

  return { board: boardNext, bench: benchNext.filter(Boolean), notes, evolved };
};

/** Si trop d’unités sur le terrain vs cap niveau, renvoie le surplus au banc. */
export const enforceBoardCap = (board, bench, cap) => {
  const nextBoard = [...board];
  let nextBench = [...bench];
  const present = nextBoard
    .map((u, index) => (u ? { u, index } : null))
    .filter(Boolean);
  if (present.length <= cap) {
    return { board: nextBoard, bench: nextBench, moved: 0 };
  }
  const overflow = present.slice(cap);
  overflow.forEach(({ index }) => {
    const unit = nextBoard[index];
    nextBoard[index] = null;
    if (unit) nextBench.push(unit);
  });
  nextBench = nextBench.filter(Boolean);
  return { board: nextBoard, bench: nextBench, moved: overflow.length };
};

/**
 * Équipe un item. 2 composants → craft auto.
 * Retourne { unit, note, stripped } ou null si impossible.
 */
export const equipItemOnUnit = (unit, itemId) => {
  if (!unit || !itemId) return null;
  const def = ITEM_MAP[itemId];
  if (!def || def.consumable) return null;
  const items = [...(unit.items || [])];

  if (def.component) {
    const compIdx = items.findIndex((id) => ITEM_MAP[id]?.component);
    if (compIdx >= 0) {
      const other = items[compIdx];
      const result = craftResult(other, itemId);
      if (!result) return null;
      items.splice(compIdx, 1);
      items.push(result);
      return {
        unit: { ...unit, items: items.slice(0, ITEM_SLOTS) },
        note: `${ITEM_MAP[other].name} + ${def.name} → ${ITEM_MAP[result].name} !`,
        crafted: result
      };
    }
    if (items.length >= ITEM_SLOTS) return null;
    items.push(itemId);
    return { unit: { ...unit, items }, note: `${def.name} équipé` };
  }

  if (def.plate && unitTraits(unit).includes(def.addTrait)) return null;
  if (items.length >= ITEM_SLOTS) return null;
  items.push(itemId);
  return { unit: { ...unit, items }, note: `${def.name} équipé` };
};

export const stripItems = (unit) => {
  if (!unit) return { unit, stripped: [] };
  const stripped = [...(unit.items || [])];
  return { unit: { ...unit, items: [] }, stripped };
};
