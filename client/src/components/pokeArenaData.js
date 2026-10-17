import { TALENTS } from './pokeArenaTalents';

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
export const START_GOLD = 14;
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
  L('mudkip', 1, ['Eau', 'Starter'], 1,
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
    [S('Funécire', ['Spectre', 'Feu'], 360, 48, 13, 607), S('Mélancolux', ['Spectre', 'Feu'], 680, 90, 14, 608)],
    { at: 3, forms: [
      { id: 'lugulabre', stages: [S('Lugulabre', ['Spectre', 'Feu'], 1120, 148, 15, 609)] },
      { id: 'mega', stages: [S('Méga-Lugulabre', ['Spectre', 'Feu'], 1080, 160, 16, 10291)] }
    ] }),
  L('bidoof', 1, ['Normal'], 1,
    { name: 'Mâchouille', desc: 'Tous les 3 tours : 155% ATK Normal.', every: 3, mult: 1.55, aim: 'front' },
    [S('Keunotor', 'Normal', 400, 36, 11, 399), S('Castorno', ['Normal', 'Eau'], 760, 70, 12, 400), S('Castorno ★', ['Normal', 'Eau'], 1200, 115, 13, 400)]),
  L('wooper', 1, [], 1,
    { name: 'Séisme', desc: 'Tous les 4 tours : 170% ATK Sol zone.', every: 4, mult: 1.7, aim: 'aoe2' },
    [S('Axoloto', ['Eau', 'Sol'], 420, 34, 10, 194), S('Maraiste', ['Eau', 'Sol'], 820, 78, 11, 195), S('Maraiste ★', ['Eau', 'Sol'], 1300, 125, 12, 195)]),
  L('mareep', 1, ['Électrik'], 3,
    { name: 'Tonnerre', desc: 'Tous les 3 tours : 165% ATK Électrik.', every: 3, mult: 1.65, aim: 'random' },
    [S('Wattouat', 'Électrik', 360, 44, 12, 179), S('Lainergie', 'Électrik', 680, 82, 13, 180)],
    { at: 3, forms: [
      { id: 'pharamp', stages: [S('Pharamp', 'Électrik', 1120, 135, 14, 181)] },
      { id: 'mega', stages: [S('Méga-Pharamp', ['Électrik', 'Dragon'], 1080, 145, 13, 10045)] }
    ] }),
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
    [S('Farfuret', ['Ténèbres', 'Glace'], 380, 64, 19, 215), S('Dimoret', ['Ténèbres', 'Glace'], 740, 120, 20, 461), S('Dimoret ★', ['Ténèbres', 'Glace'], 1200, 185, 21, 461)]),
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
    [S('Toxizap', ['Électrik', 'Poison'], 420, 62, 14, 848), S('Salarsen', ['Électrik', 'Poison'], 820, 120, 15, 849), S('Salarsen ★', ['Électrik', 'Poison'], 1340, 185, 16, 849)]),
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
  L('froakie', 5, ['Eau', 'Ténèbres', 'Starter'], 2,
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
  L('sprigatito', 2, ['Starter'], 2,
    { name: 'Magie Florale', desc: 'Tous les 3 tours : 185% ATK sur le faible.', every: 3, mult: 1.85, aim: 'weak' },
    [S('Poussacha', 'Plante', 390, 52, 16, 906), S('Matourgeon', 'Plante', 740, 95, 17, 907), S('Miascarade', ['Plante', 'Ténèbres'], 1220, 158, 19, 908)]),
  L('torchic', 2, ['Starter'], 1,
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
    [S('Électhor', ['Électrik', 'Vol'], 760, 115, 16, 145), S('Électhor ★', ['Électrik', 'Vol'], 1250, 180, 17, 145), S('Électhor ★★', ['Électrik', 'Vol'], 1900, 255, 18, 145)]),
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
      { id: 'appletun', stages: [S('Dratatin', ['Plante', 'Dragon'], 900, 95, 11, 842), S('Dratatin ★', ['Plante', 'Dragon'], 1400, 145, 12, 842)] }
    ] }),
  L('bulbasaur', 2, ['Starter'], 2,
    { name: 'Giga-Sangsue', desc: 'Tous les 3 tours : 170% ATK + soin allié 8%.', every: 3, mult: 1.7, aim: 'front', healAlly: 0.08 },
    [S('Bulbizarre', ['Plante', 'Poison'], 420, 48, 12, 1), S('Herbizarre', ['Plante', 'Poison'], 780, 90, 13, 2), S('Florizarre', ['Plante', 'Poison'], 1300, 145, 14, 3)]),
  L('squirtle', 2, ['Eau', 'Starter'], 1,
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
  line2('exegg', 2, ['Noeunoeuf', ['Plante', 'Psy'], 380, 48, 11, 102], ['Noadkoko', ['Plante', 'Psy'], 820, 110, 12, 103]),
  mono('articuno', 5, 'Artikodin', ['Glace', 'Vol'], 760, 110, 15, 144, 3),
  line3('machop', 2, ['Machoc', 'Combat', 400, 55, 12, 66], ['Machopeur', 'Combat', 740, 100, 13, 67], ['Mackogneur', 'Combat', 1240, 165, 14, 68], 1),
  line3('nido', 2, ['Nidoran♂', 'Poison', 360, 42, 13, 32], ['Nidorino', 'Poison', 680, 80, 14, 33], ['Nidoking', ['Poison', 'Sol'], 1180, 145, 15, 34], 1),
  line2('sand', 2, ['Sabelette', 'Sol', 380, 48, 13, 27], ['Sablaireau', 'Sol', 820, 110, 14, 28], 1),
  line3('pidgey', 2, ['Roucool', ['Normal', 'Vol'], 340, 40, 15, 16], ['Roucoups', ['Normal', 'Vol'], 640, 75, 16, 17], ['Roucarnage', ['Normal', 'Vol'], 1100, 130, 18, 18], 2),
  mono('pinsir', 3, 'Scarabrute', 'Insecte', 560, 100, 15, 127, 1),
  line3('geodude', 2, ['Racaillou', ['Roche', 'Sol'], 420, 50, 10, 74], ['Gravalanch', ['Roche', 'Sol'], 780, 90, 11, 75], ['Grolem', ['Roche', 'Sol'], 1280, 145, 12, 76], 1),
  line2('magnemite', 2, ['Magnéti', ['Électrik', 'Acier'], 360, 55, 14, 81], ['Magnéton', ['Électrik', 'Acier'], 780, 115, 15, 82], 3),
  line2('clefairy', 2, ['Mélofée', 'Fée', 400, 48, 12, 35], ['Mélodelfe', 'Fée', 860, 105, 13, 36], 2),
  L('mewtwo', 5, [], 3,
    { name: 'Frappe', desc: 'Tous les 3 tours : 170% ATK.', every: 3, mult: 1.7, aim: 'front' },
    [S('Mewtwo', 'Psy', 780, 140, 18, 150), S('Mewtwo ★', 'Psy', 1170, 203, 19, 150)],
    { at: 3, forms: [
      { id: 'x', stages: [S('Méga-Mewtwo X', ['Psy', 'Combat'], 1560, 266, 20, 10043)] },
      { id: 'y', stages: [S('Méga-Mewtwo Y', 'Psy', 1560, 266, 20, 10044)] }
    ] }),
  line2('sentret', 1, ['Fouinette', 'Normal', 360, 36, 12, 161], ['Fouinar', 'Normal', 760, 78, 14, 162], 1),
  line3('chikorita', 2, ['Germignon', 'Plante', 400, 46, 12, 152], ['Macronium', 'Plante', 740, 82, 13, 153], ['Méganium', 'Plante', 1220, 135, 14, 154], 2, ['Starter']),
  line3('swinub', 2, ['Marcacrin', ['Glace', 'Sol'], 420, 48, 11, 220], ['Cochignon', ['Glace', 'Sol'], 800, 95, 12, 221], ['Mammochon', ['Glace', 'Sol'], 1320, 155, 13, 473], 1),
  line2('tyrogue', 2, ['Debugant', 'Combat', 340, 50, 16, 236], ['Kapoera', 'Combat', 780, 115, 18, 237], 1),
  line3('zubat', 2, ['Nosferapti', ['Poison', 'Vol'], 320, 42, 17, 41], ['Nosferalto', ['Poison', 'Vol'], 620, 85, 18, 42], ['Nostenfer', ['Poison', 'Vol'], 1080, 145, 20, 169], 2),
  line2('hoothoot', 2, ['Hoothoot', ['Normal', 'Vol'], 380, 42, 13, 163], ['Noarfang', ['Normal', 'Vol'], 820, 95, 14, 164], 3),
  mono('shuckle', 2, 'Caratroc', ['Insecte', 'Roche'], 520, 30, 8, 213, 1),
  line3('horsea', 3, ['Hypotrempe', 'Eau', 360, 48, 14, 116], ['Hypocéan', 'Eau', 700, 95, 15, 117], ['Hyporoi', ['Eau', 'Dragon'], 1200, 160, 16, 230], 2),
  line3('larvitar', 4, ['Embrylex', ['Roche', 'Sol'], 440, 58, 11, 246], ['Ymphect', ['Roche', 'Sol'], 860, 110, 12, 247], ['Tyranocif', ['Roche', 'Ténèbres'], 1480, 190, 13, 248], 1),
  line2('onix', 3, ['Onix', ['Roche', 'Sol'], 520, 60, 12, 95], ['Steelix', ['Acier', 'Sol'], 1100, 130, 11, 208], 1),
  line3('togepi', 3, ['Togepi', 'Fée', 380, 40, 11, 175], ['Togetic', ['Fée', 'Vol'], 740, 90, 13, 176], ['Togekiss', ['Fée', 'Vol'], 1260, 155, 16, 468], 2),
  line3('treecko', 2, ['Arcko', 'Plante', 380, 50, 16, 252], ['Massko', 'Plante', 720, 95, 18, 253], ['Jungko', 'Plante', 1200, 155, 20, 254], 2, ['Starter']),
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
  line3('piplup', 3, ['Tiplouf', 'Eau', 400, 50, 12, 393], ['Prinplouf', 'Eau', 760, 90, 13, 394], ['Pingoléon', ['Eau', 'Acier'], 1260, 150, 14, 395], 2, ['Starter']),
  line3('turtwig', 3, ['Tortipouss', 'Plante', 420, 50, 11, 387], ['Boskara', 'Plante', 800, 95, 12, 388], ['Torterra', ['Plante', 'Sol'], 1360, 155, 12, 389], 1, ['Starter']),
  line3('shinx', 2, ['Lixy', 'Électrik', 380, 52, 14, 403], ['Luxio', 'Électrik', 720, 95, 15, 404], ['Luxray', 'Électrik', 1180, 150, 16, 405], 2),
  line2('shellos', 2, ['Sancoki', 'Eau', 420, 48, 11, 422], ['Tritosor', ['Eau', 'Sol'], 900, 100, 12, 423], 1),
  line2('combee', 2, ['Apitrini', ['Insecte', 'Vol'], 300, 40, 16, 415], ['Apireine', ['Insecte', 'Vol'], 780, 105, 14, 416], 2),
  line2('cranidos', 3, ['Kranidos', 'Roche', 420, 70, 13, 408], ['Charkos', 'Roche', 900, 145, 14, 409], 1),
  mono('spiritomb', 4, 'Spiritomb', ['Spectre', 'Ténèbres'], 640, 100, 12, 442, 2),
  line2('skorupi', 3, ['Rapion', ['Poison', 'Insecte'], 400, 58, 14, 451], ['Drascore', ['Poison', 'Ténèbres'], 900, 125, 15, 452], 1),
  mono('giratina', 5, 'Giratina', ['Spectre', 'Dragon'], 860, 120, 14, 487, 2),
  line2('minccino', 2, ['Chinchidou', 'Normal', 360, 48, 16, 572], ['Pashmilla', 'Normal', 780, 110, 18, 573], 2),
  line3('tepig', 3, ['Gruikui', 'Feu', 420, 55, 12, 498], ['Grotichon', ['Feu', 'Combat'], 780, 105, 13, 499], ['Roitiflam', ['Feu', 'Combat'], 1300, 170, 14, 500], 1, ['Starter']),
  L('oshawott', 3, ['Starter'], 1,
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
  mono('kyurem', 5, 'Kyurem', ['Dragon', 'Glace'], 820, 125, 14, 646, 3),
  mono('meloetta', 5, 'Meloetta', ['Psy', 'Normal'], 700, 120, 16, 648, 3),
  L('fennekin', 3, ['Starter'], 3,
    { name: 'Feu Mystique', desc: 'Tous les 3 tours : 180% ATK Feu + baisse l’ATK de 15%.', every: 3, mult: 1.8, aim: 'weak', atkBreak: 0.15 },
    [S('Feunnec', 'Feu', 380, 55, 16, 653), S('Roussil', 'Feu', 720, 100, 17, 654)],
    { at: 3, forms: [
      { id: 'goupelin', stages: [S('Goupelin', ['Feu', 'Psy'], 1200, 165, 18, 655)] },
      { id: 'mega', stages: [S('Méga-Goupelin', ['Feu', 'Psy'], 1160, 178, 19, 10293)] }
    ] }),
  line3('chespin', 3, ['Marisson', 'Plante', 420, 52, 12, 650], ['Boguérisse', 'Plante', 800, 95, 12, 651], ['Blindépique', ['Plante', 'Combat'], 1320, 155, 13, 652], 1, ['Starter']),
  line2('helioptile', 2, ['Galvaran', ['Électrik', 'Normal'], 360, 52, 16, 694], ['Iguolta', ['Électrik', 'Normal'], 780, 120, 18, 695], 3),
  line2('bergmite', 3, ['Grelaçon', 'Glace', 460, 55, 10, 712], ['Séracrawl', 'Glace', 1000, 120, 11, 713], 1),
  mono('hawlucha', 3, 'Brutalibré', ['Combat', 'Vol'], 520, 100, 18, 701, 1),
  line2('skrelp', 3, ['Venalgue', ['Poison', 'Eau'], 380, 52, 12, 690], ['Kravarech', ['Poison', 'Dragon'], 860, 125, 13, 691], 2),
  line2('binacle', 2, ['Opermine', ['Roche', 'Eau'], 400, 52, 12, 688], ['Golgopathe', ['Roche', 'Eau'], 880, 120, 13, 689], 1),
  line2('espurr', 2, ['Psystigri', 'Psy', 360, 52, 15, 677], ['Mistigrix', 'Psy', 780, 115, 16, 678], 3),
  line3('goomy', 4, ['Mucuscule', 'Dragon', 420, 48, 11, 704], ['Colimucus', 'Dragon', 820, 95, 12, 705], ['Muplodocus', 'Dragon', 1400, 165, 13, 706], 2),
  line2('inkay', 3, ['Sepiatop', ['Ténèbres', 'Psy'], 380, 52, 14, 686], ['Sepiatroce', ['Ténèbres', 'Psy'], 820, 125, 15, 687], 2),
  mono('klefki', 3, 'Trousselin', ['Acier', 'Fée'], 520, 80, 13, 707, 2),
  mono('yveltal', 5, 'Yveltal', ['Ténèbres', 'Vol'], 820, 130, 16, 717, 3),
  mono('diancie', 5, 'Diancie', ['Roche', 'Fée'], 700, 115, 14, 719, 2),
  line2('stufful', 2, ['Nounourson', ['Normal', 'Combat'], 420, 55, 12, 759], ['Chelours', ['Normal', 'Combat'], 920, 125, 13, 760], 1),
  line3('litten', 3, ['Flamiaou', 'Feu', 390, 55, 16, 725], ['Matoufeu', 'Feu', 740, 105, 17, 726], ['Félinferno', ['Feu', 'Ténèbres'], 1240, 170, 18, 727], 1, ['Starter']),
  line3('popplio', 3, ['Otaquin', 'Eau', 400, 50, 13, 728], ['Otarlette', 'Eau', 760, 90, 14, 729], ['Oratoria', ['Eau', 'Fée'], 1260, 150, 15, 730], 2, ['Starter']),
  mono('togedemaru', 2, 'Togedemaru', ['Électrik', 'Acier'], 460, 80, 16, 777, 1),
  line2('crabrawler', 3, ['Crabagarre', 'Combat', 420, 60, 13, 739], ['Crabominable', ['Combat', 'Glace'], 920, 130, 12, 740], 1),
  mono('passimian', 3, 'Quartermac', 'Combat', 540, 105, 15, 766, 1),
  line2('salandit', 3, ['Tritox', ['Poison', 'Feu'], 360, 55, 16, 757], ['Malamandre', ['Poison', 'Feu'], 780, 125, 18, 758], 2),
  line2('mudbray', 2, ['Tiboudet', 'Sol', 440, 55, 12, 749], ['Bourrinos', 'Sol', 960, 120, 12, 750], 1),
  mono('oricorio', 2, 'Plumeline', ['Vol', 'Feu'], 460, 85, 17, 741, 2),
  mono('oranguru', 3, 'Gouroutan', ['Normal', 'Psy'], 560, 95, 12, 765, 3),
  L('rockruff', 3, [], 1,
    { name: 'Lame de Roc', desc: 'Tous les 3 tours : 200% ATK Roche sur le front.', every: 3, mult: 2.0, aim: 'front' },
    [S('Rocabot', 'Roche', 400, 55, 15, 744)],
    { at: 2, forms: [
      { id: 'jour', stages: [S('Lougaroc (Diurne)', 'Roche', 860, 125, 17, 745), S('Lougaroc (Diurne) ★', 'Roche', 1340, 180, 18, 745)] },
      { id: 'nuit', stages: [S('Lougaroc (Nocturne)', 'Roche', 900, 130, 15, 10126), S('Lougaroc (Nocturne) ★', 'Roche', 1400, 185, 16, 10126)] }
    ] }),
  line3('jangmo', 4, ['Bébécaille', 'Dragon', 420, 55, 13, 782], ['Écaïd', ['Dragon', 'Combat'], 820, 110, 14, 783], ['Ékaïser', ['Dragon', 'Combat'], 1400, 180, 15, 784], 1),
  line2('fomantis', 2, ['Mimantis', 'Plante', 380, 52, 14, 753], ['Floramantis', 'Plante', 820, 120, 15, 754], 2),
  mono('lunala', 5, 'Lunala', ['Psy', 'Spectre'], 820, 130, 15, 792, 3),
  mono('marshadow', 5, 'Marshadow', ['Combat', 'Spectre'], 680, 140, 20, 802, 1),
  line2('grimer-a', 3, ['Tadmorv d’Alola', ['Poison', 'Ténèbres'], 460, 55, 10, 10112], ['Grotadmorv d’Alola', ['Poison', 'Ténèbres'], 980, 120, 11, 10113], 1),
  line3('scorbunny', 3, ['Flambino', 'Feu', 380, 58, 17, 813], ['Lapyro', 'Feu', 720, 105, 18, 814], ['Pyrobut', 'Feu', 1200, 170, 20, 815], 1, ['Starter']),
  line3('sobble', 3, ['Larméléon', 'Eau', 360, 52, 16, 816], ['Arrozard', 'Eau', 700, 100, 17, 817], ['Lézargus', 'Eau', 1160, 165, 20, 818], 3, ['Starter']),
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
  mono('vivillon', 2, 'Prismillon', ['Insecte', 'Vol'], 460, 85, 16, 666, 2),
  L('ogerpon', 5, [], 1,
    { name: 'Massue Furieuse', desc: 'Tous les 3 tours : 230% ATK sur le front, ignore 10% PV.', every: 3, mult: 2.3, aim: 'front', shred: 0.1 },
    [S('Ogerpon', 'Plante', 680, 125, 18, 1017)],
    { at: 2, forms: [
      { id: 'turquoise', stages: [S('Ogerpon (Turquoise)', 'Plante', 1020, 185, 19, 1017), S('Ogerpon (Turquoise) ★', 'Plante', 1560, 250, 20, 1017)] },
      { id: 'puits', stages: [S('Ogerpon (Masque du Puits)', ['Plante', 'Eau'], 1060, 180, 18, 10273), S('Ogerpon (Masque du Puits) ★', ['Plante', 'Eau'], 1620, 245, 19, 10273)] },
      { id: 'fourneau', stages: [S('Ogerpon (Masque du Fourneau)', ['Plante', 'Feu'], 1000, 190, 19, 10274), S('Ogerpon (Masque du Fourneau) ★', ['Plante', 'Feu'], 1520, 255, 20, 10274)] }
    ] }),
  mono('miraidon', 5, 'Miraidon', ['Électrik', 'Dragon'], 820, 135, 18, 1008, 3),
  mono('roaring', 5, 'Rugit-Lune', ['Dragon', 'Ténèbres'], 780, 145, 20, 1005, 2),
  line2('toedscool', 3, ['Terracool', ['Sol', 'Plante'], 400, 52, 13, 948], ['Terracruel', ['Sol', 'Plante'], 880, 120, 15, 949], 2),
  mono('bombirdier', 3, 'Lestombaile', ['Vol', 'Ténèbres'], 520, 95, 17, 962, 2),
  line2('tarountula', 1, ['Tissenboule', 'Insecte', 360, 42, 12, 917], ['Filentrappe', 'Insecte', 760, 95, 13, 918], 2),
  line3('nacli', 2, ['Selutin', 'Roche', 420, 46, 10, 932], ['Amassel', 'Roche', 800, 90, 11, 933], ['Gigansel', 'Roche', 1340, 145, 11, 934], 1),
  line2('bellibolt', 2, ['Têtampoule', 'Électrik', 400, 48, 11, 938], ['Ampibidou', 'Électrik', 880, 115, 12, 939], 2),

  // —— Grille : Pokémon restants ——
  withSpell(line3('teddiursa', 1, ['Teddiursa', 'Normal', 420, 46, 11, 216], ['Ursaring', 'Normal', 820, 92, 11, 217], ['Ursaking', ['Sol', 'Normal'], 1340, 140, 11, 901], 1, ['Force']),
    { name: 'Coup d’Boule', desc: 'Tous les 3 tours : 165% ATK + ralentit (SPD -2).', every: 3, mult: 1.65, aim: 'front', slow: 2 }),
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
  withSpell(mono('zygarde', 5, 'Zygarde', ['Dragon', 'Sol'], 900, 115, 14, 718, 1),
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
  withSpell(line3('wurmple', 2, ['Chenipotte', 'Insecte', 340, 38, 12, 265], ['Armulys', 'Insecte', 640, 60, 8, 266], ['Charmillon', ['Insecte', 'Vol'], 1080, 150, 15, 267], 3),
    { name: 'Vent Argenté', desc: 'Tous les 3 tours : 160% ATK Insecte sur 2 cibles.', every: 3, mult: 1.6, aim: 'aoe2' }),
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
  withSpell(line2('koffing', 3, ['Smogo', 'Poison', 420, 46, 10, 109], ['Smogogo de Galar', ['Poison', 'Fée'], 960, 105, 10, 10167], 2),
    { name: 'Vent Féérique', desc: 'Tous les 3 tours : 160% ATK Fée sur 2 cibles + empoisonne.', every: 3, mult: 1.6, aim: 'aoe2', dot: { pct: 0.04, turns: 3 } }),
  withSpell(line2('munchlax', 4, ['Goinfrex', 'Normal', 560, 60, 8, 446], ['Ronflex', 'Normal', 1240, 125, 8, 143], 1, ['Force']),
    { name: 'Plaquage', desc: 'Tous les 3 tours : 180% ATK + étourdit + soigne 10%.', every: 3, mult: 1.8, aim: 'front', stun: true, healAlly: 0.1 }),
  withSpell(mono('groudon', 5, 'Groudon', 'Sol', 900, 125, 12, 383, 1),
    { name: 'Lame Pangéenne', desc: 'Tous les 4 tours : 245% ATK Sol à tous.', every: 4, mult: 2.45, aim: 'all' }),
  withSpell(mono('zacian', 5, 'Zacian', 'Fée', 760, 135, 20, 888, 1),
    { name: 'Gladius Maximus', desc: 'Tous les 3 tours : 240% ATK Acier sur le front.', every: 3, mult: 2.4, aim: 'front' })
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
  718: { name: 'Zygarde (Forme Parfaite)', types: ['Dragon', 'Sol'], dex: 10120 },
  645: { name: 'Démétéros (Totémique)', types: ['Sol', 'Vol'], dex: 10021 },
  383: { name: 'Primo-Groudon', types: ['Sol', 'Feu'], dex: 10078 },
  888: { name: 'Zacian (Épée Suprême)', types: ['Fée', 'Acier'], dex: 10188 }
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

LINES.forEach((line) => {
  if (line.forms) line.forms.forEach((form) => promoteMegaStar(form.stages));
  else promoteMegaStar(line.stages);
  line.ab = TALENTS[line.id] || null;
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

/** Carte de campagne solo — un nœud = une étape. */
export const CAMPAIGN = [
  { id: 1, name: 'Clairière Mousse', biome: 'forest', blurb: 'Échauffement', boss: false },
  { id: 2, name: 'Ruisseau Lanturn', biome: 'water', blurb: 'Courant électrique', boss: false },
  { id: 3, name: 'Bois Noctali', biome: 'dark', blurb: 'Ombre amicale', boss: false },
  { id: 4, name: 'Grotte Funécire', biome: 'ghost', blurb: 'Feux follets', boss: false },
  { id: 5, name: 'Forge Cizayox', biome: 'steel', blurb: 'Mini-boss', boss: true },
  { id: 6, name: 'Val Gardevoir', biome: 'fairy', blurb: 'Lueurs psy', boss: false },
  { id: 7, name: 'Crête Hisui', biome: 'fire', blurb: 'Typhlosion', boss: false },
  { id: 8, name: 'Arène Salarsen', biome: 'electric', blurb: 'Overdrive', boss: true },
  { id: 9, name: 'Tour Malvalame', biome: 'fire', blurb: 'Lames amères', boss: false },
  { id: 10, name: 'Ciel Lanssorien', biome: 'dragon', blurb: 'Pseudo-légende', boss: false },
  { id: 11, name: 'Ruines de Fer', biome: 'fairy', blurb: 'Paradoxe', boss: true },
  { id: 12, name: 'Temple Dialga', biome: 'legend', blurb: 'Finale', boss: true }
];

export const SAVE_KEY = 'poke-arena-campaign-v2';

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
export const ROSTER_FORMS = LINES.length * 3;

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

/** Composants (vitamines) — 2 composants = item crafté. */
export const COMPONENTS = [
  { id: 'hpup', name: 'PV Plus', icon: '🧴', sprite: itemSprite('hp-up'), desc: '+12% PV max', component: true, hpMul: 1.12 },
  { id: 'protein', name: 'Protéine', icon: '🥩', sprite: itemSprite('protein'), desc: '+12% ATK', component: true, atkMul: 1.12 },
  { id: 'calcium', name: 'Calcium', icon: '🧪', sprite: itemSprite('calcium'), desc: '+12% puissance de sort', component: true, spellMul: 1.12 },
  { id: 'carbos', name: 'Carbone', icon: '⚡', sprite: itemSprite('carbos'), desc: '+8% SPD', component: true, spdMul: 1.08 }
];

export const CRAFTED = [
  { id: 'leftovers', name: 'Restes', icon: '🍃', sprite: itemSprite('leftovers'), desc: 'Régénère 2.4% PV max par tour.', hpMul: 1.05, regen: 0.024 },
  { id: 'rocky', name: 'Casque Brut', icon: '🪖', sprite: itemSprite('rocky-helmet'), desc: '+10% PV. Renvoie 25% des dégâts subis.', hpMul: 1.1, thorns: 0.25 },
  { id: 'shellbell', name: 'Grosse Cloche', icon: '🔔', sprite: itemSprite('shell-bell'), desc: 'Drain : soigne 35% des dégâts infligés.', lifesteal: 0.35 },
  { id: 'focus', name: 'Ceinture Force', icon: '🟨', sprite: itemSprite('focus-sash'), desc: 'Survit une fois à 1 PV (par combat).', endure: true },
  { id: 'choiceband', name: 'Band. Choix', icon: '🎀', sprite: itemSprite('choice-band'), desc: '+45% ATK.', atkMul: 1.45 },
  { id: 'lifeorb', name: 'Orbe Vie', icon: '🔴', sprite: itemSprite('life-orb'), desc: '+35% dégâts. Perd 2% PV par attaque.', atkMul: 1.35, selfHurt: 0.02 },
  { id: 'scopelens', name: 'Lentille Scope', icon: '👓', sprite: itemSprite('scope-lens'), desc: '+25% ATK et sorts plus forts.', atkMul: 1.2, spellMul: 1.2 },
  { id: 'choicespecs', name: 'Lunettes Choix', icon: '🕶️', sprite: itemSprite('choice-specs'), desc: '+45% puissance de sort.', spellMul: 1.45 },
  { id: 'quickclaw', name: 'Vive Griffe', icon: '⏩', sprite: itemSprite('quick-claw'), desc: '20% de double action au tour 1. +3 SPD.', spdFlat: 3, opener: 0.2 },
  { id: 'choicescarf', name: 'Mouchoir Choix', icon: '🧣', sprite: itemSprite('choice-scarf'), desc: '+35% SPD.', spdMul: 1.35 }
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

/** a+b (ordre libre) → craft */
export const RECIPE_TABLE = {
  'hpup+hpup': 'leftovers',
  'hpup+protein': 'rocky',
  'hpup+calcium': 'shellbell',
  'hpup+carbos': 'focus',
  'protein+protein': 'choiceband',
  'protein+calcium': 'lifeorb',
  'protein+carbos': 'scopelens',
  'calcium+calcium': 'choicespecs',
  'calcium+carbos': 'quickclaw',
  'carbos+carbos': 'choicescarf'
};

export const MAGNET = {
  id: 'magnet', name: 'Aimant', icon: '🧲', sprite: itemSprite('magnet'),
  desc: 'Retire les items d’un Pokémon (retour au sac).', special: 'strip'
};

export const RUN_POOL_SIZE = 32;

/** Tire un sous-set équilibré (~32) pour la boutique joueur. */
export const buildRunPool = (mustIds = ['cynda', 'mudkip', 'eevee']) => {
  const must = mustIds.map((id) => LINE_MAP[id]).filter(Boolean);
  const used = new Set(must.map((l) => l.id));
  const byCost = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  LINES.forEach((line) => {
    if (used.has(line.id)) return;
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
    const extra = LINES.find((l) => !picked.some((p) => p.id === l.id));
    if (!extra) break;
    picked.push(extra);
  }
  return picked.slice(0, RUN_POOL_SIZE);
};

/** Estimation gains prochain round (si victoire). */
export const estimateIncome = (gold, streak, wave) => {
  const base = 5 + Math.floor(wave / 2);
  const interest = Math.min(5, Math.floor(gold / 10));
  const streakBonus = Math.min(3, streak + 1);
  const total = base + interest + streakBonus;
  const nextInterestGold = (interest < 5) ? (interest + 1) * 10 : null;
  return { base, interest, streakBonus, total, nextInterestGold };
};

export const ITEMS = [...COMPONENTS, ...CRAFTED, MAGNET];
export const ITEM_MAP = Object.fromEntries(ITEMS.map((item) => [item.id, item]));

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

export const LEVEL_XP = [0, 0, 2, 4, 8, 14, 22, 32, 48, 64];
export const BOARD_CAP = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 8 };
export const BENCH_CAP = 9;
export const SHOP_SIZE = 5;
export const emptyBoard = () => Array(BOARD_SIZE).fill(null);

/** Indices ennemis préférés : rangée avant (près du milieu), puis centre → bords. */
const FOE_SLOT_ORDER = (() => {
  const order = [];
  for (let row = BOARD_ROWS_HALF - 1; row >= 0; row -= 1) {
    const mid = Math.floor(BOARD_COLS / 2);
    order.push(row * BOARD_COLS + mid);
    for (let d = 1; d <= mid; d += 1) {
      if (mid - d >= 0) order.push(row * BOARD_COLS + (mid - d));
      if (mid + d < BOARD_COLS) order.push(row * BOARD_COLS + (mid + d));
    }
  }
  return order;
})();

export const seatFoes = (foes) => {
  const pads = emptyBoard();
  foes.forEach((foe, i) => {
    const slot = FOE_SLOT_ORDER[i] ?? i % BOARD_SIZE;
    pads[slot] = { ...foe, slot, side: 'foe' };
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
    ab: line.ab || null,
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

export const rollItem = () => {
  if (Math.random() < 0.12) return MAGNET;
  return COMPONENTS[Math.floor(Math.random() * COMPONENTS.length)];
};

export const maybeDropItem = (won, wave) => {
  if (wave > 0 && wave % 3 === 0) return rollItem();
  const chance = won ? 0.42 : 0.14;
  if (Math.random() < chance) return rollItem();
  return null;
};

export const traitBonus = (units) => {
  const counts = {};
  units.forEach((unit) => {
    (unit.traits || []).forEach((trait) => {
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

const itemMods = (items = []) => {
  const mods = {
    hpMul: 1, atkMul: 1, spdMul: 1, spdFlat: 0, spellMul: 1,
    regen: 0, selfHurt: 0, thorns: 0, lifesteal: 0, endure: false, opener: 0
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
    if (item.opener) mods.opener = Math.max(mods.opener, item.opener);
  });
  return mods;
};

/* ——————————————————————————— Moteur de combat ——————————————————————————— */

const has = (u, key) => !!(u && u.ab && u.ab[key]);
const isStatused = (u) => !!(u.slowed || u.dot || u.stunSkip);
const unitHasType = (u, type) => (u.types || [u.type]).includes(type);

export const buildFighters = (units, opts = {}) => {
  const bonus = traitBonus(units);
  return units.map((unit) => {
    const im = itemMods(unit.items || []);
    const ab = opts.neutralized ? null : (unit.ab || LINE_MAP[unit.lineId]?.ab || null);
    const a = ab || {};
    const maxHp = Math.round(unit.hp * bonus.hpMul * im.hpMul * (a.hpMul || 1));
    return {
      ...unit,
      ab,
      maxHp,
      curHp: maxHp,
      power: Math.round(unit.atk * bonus.atkMul * im.atkMul * (a.atkMul || 1)),
      spd: Math.round(unit.spd * im.spdMul * (a.spdMul || 1) + im.spdFlat),
      range: unit.range || 1,
      spellMul: im.spellMul * (a.spellMul || 1),
      regen: im.regen + (a.regen || 0),
      selfHurt: im.selfHurt,
      thorns: im.thorns + (a.thorns || 0),
      lifesteal: im.lifesteal,
      endure: im.endure || !!a.endure,
      endured: false,
      opener: im.opener,
      stunSkip: false,
      alive: true,
      cast: a.precharge || 0,
      shieldHp: 0,
      dot: null,
      slowed: false,
      vuln: 1,
      guard: 1,
      disguiseUsed: false,
      spellShieldUsed: false,
      berryUsed: false,
      constructUsed: false,
      surgeSpdOn: false
    };
  });
};

const fighterAxial = (u) => indexToAxial(u.slot ?? 0, u.side === 'foe');

const distBetween = (a, b) => hexDist(fighterAxial(a), fighterAxial(b));

const inRangeOf = (attacker, target) => distBetween(attacker, target) <= (attacker.range || 1);

const offsetNeighbors = (col, row) => {
  const odd = row & 1;
  const dirs = odd
    ? [[+1, 0], [0, -1], [-1, -1], [-1, 0], [-1, +1], [0, +1]]
    : [[+1, 0], [+1, -1], [0, -1], [-1, 0], [0, +1], [+1, +1]];
  return dirs.map(([dc, dr]) => ({ col: col + dc, row: row + dr }));
};

const axialToSlot = (col, row, isEnemy) => {
  const rowLocal = isEnemy ? row : row - BOARD_ROWS_HALF;
  if (col < 0 || col >= BOARD_COLS || rowLocal < 0 || rowLocal >= BOARD_ROWS_HALF) return null;
  return rowLocal * BOARD_COLS + col;
};

const snapshotPos = (allies, foes) => {
  const pos = {};
  allies.forEach((u) => { pos[u.uid] = { side: 'ally', slot: u.slot }; });
  foes.forEach((u) => { pos[u.uid] = { side: 'foe', slot: u.slot }; });
  return pos;
};

const occupiedKey = (side, slot) => `${side}:${slot}`;

/** Avance d’1 case vers la cible la plus proche (demi-plateau). */
const stepCloser = (u, enemies, allies, foes) => {
  const live = enemies.filter((t) => t.alive);
  if (!live.length) return false;
  const target = live.slice().sort((a, b) => distBetween(u, a) - distBetween(u, b))[0];
  const from = fighterAxial(u);
  const goal = fighterAxial(target);
  const isEnemy = u.side === 'foe';
  const team = isEnemy ? foes : allies;
  const side = isEnemy ? 'foe' : 'ally';
  const occ = new Set(
    team.filter((t) => t.alive && t.uid !== u.uid).map((t) => occupiedKey(side, t.slot))
  );
  const options = offsetNeighbors(from.col, from.row)
    .map((n) => {
      const slot = axialToSlot(n.col, n.row, isEnemy);
      return slot == null ? null : { ...n, slot, dist: hexDist(n, goal) };
    })
    .filter((n) => n && !occ.has(occupiedKey(side, n.slot)));
  if (!options.length) return false;
  options.sort((a, b) => a.dist - b.dist || Math.random() - 0.5);
  const best = options[0];
  if (best.dist >= hexDist(from, goal)) return false;
  u.slot = best.slot;
  return true;
};

const pickTargets = (aim, foes, allies, self, respectRange = false) => {
  let live = foes.filter((t) => t.alive);
  if (!live.length) return [];
  if (respectRange && self) {
    const inR = live.filter((t) => inRangeOf(self, t));
    if (inR.length) live = inR;
    else return [];
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
  const ta = target.ab || {};
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
  if (!u.alive || !u.ab) return;
  const ratio = u.curHp / u.maxHp;
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
  let crit = false;
  if (ta.crit && !da.noCrit && Math.random() < ta.crit.chance) {
    dmg *= ta.crit.mult;
    crit = true;
  }
  if (da.resist && da.resist[atkType]) dmg *= da.resist[atkType];
  if (da.fullHpGuard && target.curHp >= target.maxHp) dmg *= da.fullHpGuard;
  if (kind === 'auto' && da.autoGuard) dmg *= da.autoGuard;
  if (kind === 'spell' && da.spellGuard) dmg *= da.spellGuard;
  if (da.dmgTaken) dmg *= da.dmgTaken;
  if (da.superGuard && mult > 1) dmg *= da.superGuard;
  dmg *= (target.vuln || 1) * (target.guard || 1);
  return { result: 'hit', dmg, crit };
};

const applyDamage = (ctx, target, raw, attacker) => {
  let dmg = Math.max(6, Math.round(raw));
  const pierce = has(attacker, 'pierce');
  if (target.shieldHp > 0 && !pierce) {
    const absorbed = Math.min(target.shieldHp, dmg);
    target.shieldHp -= absorbed;
    dmg -= absorbed;
  }
  target.curHp -= dmg;
  const ta = attacker.ab || {};
  if (attacker.lifesteal) {
    attacker.curHp = Math.min(attacker.maxHp, attacker.curHp + Math.round(dmg * attacker.lifesteal));
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
    if (da.stamina) target.guard = Math.max(0.7, (target.guard || 1) - 0.04);
  }
  if (da.contact && (attacker.range || 1) <= 1 && attacker.alive && Math.random() < da.contact.chance) {
    applyStatus(ctx, attacker, target, da.contact);
  }
  if (ta.hitDot && target.curHp > 0 && Math.random() < ta.hitDot.chance) {
    applyStatus(ctx, target, attacker, { dot: { pct: ta.hitDot.pct, turns: ta.hitDot.turns } });
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

export const enemyWave = (wave, level) => {
  const cap = BOARD_CAP[Math.min(9, level)] || 1;
  // Vague 1 : 2 ennemis pour un plateau vivant (toujours battable avec un starter + shop).
  const count = Math.min(BOARD_SIZE, Math.max(wave === 1 ? 2 : 1, Math.min(cap + 1, 1 + Math.floor(wave / 2))));
  const budget = Math.min(5, 1 + Math.floor((wave - 1) / 3));
  const foes = [];
  for (let i = 0; i < count; i += 1) {
    const cost = Math.max(1, Math.min(5, budget - (i % 2)));
    const pool = LINES.filter((line) => line.cost === cost);
    const line = pool[Math.floor(Math.random() * pool.length)] || LINES[0];
    const star = wave >= 14 ? 3 : wave >= 8 ? 2 : 1;
    const unit = unitFromLine(line.id, star, `foe-${wave}-${i}`, [], null, true);
    const scale = 0.82 + wave * 0.07;
    const withItem = wave >= 7 && Math.random() < 0.22 ? [rollItem().id] : [];
    foes.push({
      ...unit,
      items: withItem,
      name: `Sauvage ${unit.name}`,
      hp: Math.round(unit.hp * scale),
      atk: Math.round(unit.atk * scale * 0.92)
    });
  }
  return foes;
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
  const allyNeutral = foesIn.some((u) => (u.ab || LINE_MAP[u.lineId]?.ab)?.neutralize);
  const foeNeutral = alliesIn.some((u) => (u.ab || LINE_MAP[u.lineId]?.ab)?.neutralize);
  const allies = buildFighters(alliesIn.map((u) => ({ ...u, side: u.side || 'ally' })), { neutralized: allyNeutral && !foeNeutral });
  const foes = buildFighters(foesIn.map((u) => ({ ...u, side: u.side || 'foe' })), { neutralized: foeNeutral && !allyNeutral });
  const log = [];
  const ctx = { allies, foes, log, turn: 0, floats: [] };
  const frames = [];
  const pushFrame = (line, fx = {}, floats = []) => {
    const all = [...floats, ...ctx.floats];
    ctx.floats = [];
    frames.push({
      line,
      hp: snapshotHp(allies, foes),
      fx,
      floats: all,
      pos: snapshotPos(allies, foes)
    });
  };
  if (allyNeutral && !foeNeutral) log.push('Gaz Inhibiteur : tes talents sont neutralisés !');
  if (foeNeutral && !allyNeutral) log.push('Gaz Inhibiteur : talents adverses neutralisés !');
  startEffects(ctx, allies, foes);
  startEffects(ctx, foes, allies);
  pushFrame(log.length ? log[log.length - 1] : 'Combat !');
  let turn = 0;
  const maxTurns = 48;

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
      if (!turnStart(ctx, u, friends, enemies, turnIndex)) {
        pushFrame(`${u.name} succombe à son altération`, { [u.uid]: 'ko' });
        continue;
      }
      if (u.stunSkip) {
        u.stunSkip = false;
        continue;
      }

      const targets = enemies.filter((t) => t.alive);
      if (!targets.length) continue;

      u.cast += 1;
      const spell = u.spell;
      const useSpell = spell && spell.every && u.cast > 0 && u.cast % spell.every === 0;
      const openerExtra = turnIndex === 0 && u.opener && Math.random() < u.opener;

      const strikes = openerExtra ? 2 : 1;
      for (let s = 0; s < strikes; s += 1) {
        if (!u.alive) break;
        if (useSpell && s === 0) {
          const spellRange = (u.range || 1) + 1;
          const prev = u.range;
          u.range = spellRange;
          let picked = pickTargets(spell.aim, enemies, friends, u, true);
          u.range = prev;
          if (!picked.length) {
            if (stepCloser(u, enemies, allies, foes)) {
              pushFrame(`${u.name} avance`, { [u.uid]: 'move' });
              u.range = spellRange;
              picked = pickTargets(spell.aim, enemies, friends, u, true);
              u.range = prev;
            }
            if (!picked.length) {
              pushFrame(`${u.name} : sort hors de portée`, { [u.uid]: 'move' });
              continue;
            }
          }
          const fx = { [u.uid]: 'spell' };
          const floats = [];
          const extras = [];
          const spellPower = u.power * (spell.mult || 1.5) * (u.spellMul || 1);
          picked.forEach((target) => {
            if (!target.alive) return;
            const hit = resolveHit(u, target, spellPower * (0.92 + Math.random() * 0.2), 'spell', turnIndex);
            if (hit.result !== 'hit') {
              extras.push(`${target.name} : ${HIT_NOTES[hit.result]}`);
              return;
            }
            let raw = hit.dmg;
            if (spell.shred) raw += target.maxHp * spell.shred;
            if (spell.stealAtk) raw = Math.max(raw, target.power * 1.1);
            const before = target.curHp;
            applyDamage(ctx, target, raw, u);
            const dealt = Math.max(0, before - target.curHp);
            fx[target.uid] = target.alive ? 'hit' : 'ko';
            if (dealt) floats.push({ uid: target.uid, text: `-${dealt}${hit.crit ? '!' : ''}`, kind: 'dmg' });
            if (target.alive) {
              const stun = spell.stun || (u.ab?.serene && Math.random() < u.ab.serene);
              applyStatus(ctx, target, u, { slow: spell.slow, stun, atkBreak: spell.atkBreak, dot: spell.dot });
            }
          });
          if (spell.healAlly) {
            const wounded = friends.filter((f) => f.alive).sort((a, b) => a.curHp / a.maxHp - b.curHp / b.maxHp)[0];
            if (wounded) {
              const heal = Math.round(wounded.maxHp * spell.healAlly);
              wounded.curHp = Math.min(wounded.maxHp, wounded.curHp + heal);
              floats.push({ uid: wounded.uid, text: `+${heal}`, kind: 'heal' });
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
          if (spell.teamAtk) friends.forEach((f) => { if (f.alive) f.power = Math.round(f.power * (1 + spell.teamAtk)); });
          if (spell.allyBuff) {
            const slow = friends.filter((f) => f.alive).sort((a, b) => a.spd - b.spd)[0];
            if (slow) slow.spd += 3;
          }
          friends.forEach((f) => { if (f !== u && f.alive && f.ab?.dancer) f.cast += 1; });
          const line = `${u.name} : ${spell.name}${extras.length ? ` (${extras.join(', ')})` : ''}`;
          if (turnIndex < 10) log.push(line);
          pushFrame(line, fx, floats);
        } else {
          let picked = pickTargets('front', enemies, friends, u, true);
          if (!picked.length) {
            if (stepCloser(u, enemies, allies, foes)) {
              pushFrame(`${u.name} avance`, { [u.uid]: 'move' });
              picked = pickTargets('front', enemies, friends, u, true);
            }
            if (!picked.length) {
              pushFrame(`${u.name} hors de portée (P${u.range})`, { [u.uid]: 'move' });
              continue;
            }
          }
          const target = picked[0];
          const fx = { [u.uid]: 'strike' };
          const floats = [];
          const hit = resolveHit(u, target, u.power * (0.88 + Math.random() * 0.28), 'auto', turnIndex);
          if (hit.result !== 'hit') {
            pushFrame(`${u.name} → ${target.name} : ${HIT_NOTES[hit.result]}`, fx);
            continue;
          }
          const before = target.curHp;
          applyDamage(ctx, target, hit.dmg, u);
          const dealt = Math.max(0, before - target.curHp);
          fx[target.uid] = target.alive ? 'hit' : 'ko';
          if (dealt) floats.push({ uid: target.uid, text: `-${dealt}${hit.crit ? '!' : ''}`, kind: 'dmg' });
          pushFrame(`${u.name} → ${target.name}${hit.crit ? ' (critique)' : ''}`, fx, floats);
        }
      }
    }
    turn += 1;
  }

  const win = foes.every((u) => !u.alive) && allies.some((u) => u.alive);
  const aliveFoes = foes.filter((u) => u.alive).length;
  const damage = win ? 0 : Math.max(2, aliveFoes + 1);
  pushFrame(
    win ? 'Victoire !' : 'Défaite…',
    Object.fromEntries((win ? foes : allies).map((u) => [u.uid, 'ko']))
  );
  return {
    win,
    log: log.slice(0, 10),
    frames,
    damage,
    survivors: allies.filter((u) => u.alive).length,
    turns: turn
  };
};

/** Fusionne 3 unités même ligne + même étoile → +1★ (évolution). Conserve les items. */
export const mergeUnits = (board, bench) => {
  let boardNext = [...board];
  let benchNext = [...bench];
  const notes = [];
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

  return { board: boardNext, bench: benchNext.filter(Boolean), notes };
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
  if (!unit || !itemId || itemId === 'magnet') return null;
  const def = ITEM_MAP[itemId];
  if (!def) return null;
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
        note: `${ITEM_MAP[other].name} + ${def.name} → ${ITEM_MAP[result].name}`
      };
    }
    if (items.length >= ITEM_SLOTS) return null;
    items.push(itemId);
    return { unit: { ...unit, items }, note: `${def.name} équipé` };
  }

  if (items.length >= ITEM_SLOTS) return null;
  items.push(itemId);
  return { unit: { ...unit, items }, note: `${def.name} équipé` };
};

export const stripItems = (unit) => {
  if (!unit) return { unit, stripped: [] };
  const stripped = [...(unit.items || [])];
  return { unit: { ...unit, items: [] }, stripped };
};
