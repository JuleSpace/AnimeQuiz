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

const S = (name, type, hp, atk, spd, dex) => ({ name, type, hp, atk, spd, dex });
/** range : cases hex (1 mêlée · 2 moyen · 3+ distance). */
const L = (id, cost, traits, range, spell, stages) => ({ id, cost, traits, range, spell, stages });

/**
 * Grand roster multi-gén. Chaque run n’en tire qu’~30 pour le joueur ;
 * les ennemis piochent dans tout le catalogue.
 */
export const LINES = [
  // —— Cost 1 ——
  L('eevee', 1, ['Normal', 'Ténèbres'], 1,
    { name: 'Regard Noir', desc: 'Tous les 3 tours : 160% ATK + ralentit (SPD -3).', every: 3, mult: 1.6, aim: 'front', slow: 3 },
    [S('Évoli', 'Normal', 420, 42, 14, 133), S('Noctali', 'Ténèbres', 780, 88, 16, 197), S('Noctali ★', 'Ténèbres', 1260, 138, 18, 197)]),
  L('fletch', 1, ['Feu', 'Vol'], 2,
    { name: 'Acrobatie', desc: 'Tous les 2 tours : 145% ATK Vol sur une cible aléatoire.', every: 2, mult: 1.45, aim: 'random' },
    [S('Passerouge', 'Vol', 340, 40, 17, 661), S('Braisillon', 'Feu', 600, 72, 18, 662), S('Flambusard', 'Feu', 980, 118, 20, 663)]),
  L('mudkip', 1, ['Eau', 'Starter'], 1,
    { name: 'Hydrocanon', desc: 'Tous les 3 tours : 170% ATK Eau sur le front.', every: 3, mult: 1.7, aim: 'front' },
    [S('Gobou', 'Eau', 440, 40, 12, 258), S('Flobio', 'Eau', 780, 72, 13, 259), S('Laggron', 'Eau', 1280, 118, 14, 260)]),
  L('shroom', 1, ['Plante', 'Combat'], 1,
    { name: 'Mach Punch', desc: 'Tous les 2 tours : 150% ATK Combat.', every: 2, mult: 1.5, aim: 'front' },
    [S('Balignon', 'Plante', 380, 44, 13, 285), S('Chapignon', 'Combat', 720, 95, 16, 286), S('Chapignon ★', 'Combat', 1180, 150, 18, 286)]),
  L('magikarp', 1, ['Eau', 'Dragon'], 1,
    { name: 'Mania', desc: 'Tous les 4 tours : 220% ATK Eau.', every: 4, mult: 2.2, aim: 'random' },
    [S('Magicarpe', 'Eau', 280, 18, 20, 129), S('Léviator', 'Eau', 900, 120, 14, 130), S('Léviator ★', 'Eau', 1480, 185, 15, 130)]),
  L('litwick', 1, ['Feu', 'Spectre'], 3,
    { name: 'Feu Follet', desc: 'Tous les 3 tours : 165% ATK + brûle 8% PV max.', every: 3, mult: 1.65, aim: 'weak', shred: 0.08 },
    [S('Funécire', 'Feu', 360, 48, 13, 607), S('Mélancolux', 'Feu', 680, 90, 14, 608), S('Lugulabre', 'Spectre', 1120, 148, 15, 609)]),
  L('bidoof', 1, ['Normal'], 1,
    { name: 'Mâchouille', desc: 'Tous les 3 tours : 155% ATK Normal.', every: 3, mult: 1.55, aim: 'front' },
    [S('Keunotor', 'Normal', 400, 36, 11, 399), S('Castorno', 'Normal', 760, 70, 12, 400), S('Castorno ★', 'Normal', 1200, 115, 13, 400)]),
  L('wooper', 1, ['Eau', 'Sol'], 1,
    { name: 'Séisme', desc: 'Tous les 4 tours : 170% ATK Sol zone.', every: 4, mult: 1.7, aim: 'aoe2' },
    [S('Axoloto', 'Eau', 420, 34, 10, 194), S('Maraiste', 'Sol', 820, 78, 11, 195), S('Maraiste ★', 'Sol', 1300, 125, 12, 195)]),
  L('mareep', 1, ['Électrik'], 3,
    { name: 'Tonnerre', desc: 'Tous les 3 tours : 165% ATK Électrik.', every: 3, mult: 1.65, aim: 'random' },
    [S('Wattouat', 'Électrik', 360, 44, 12, 179), S('Lainergie', 'Électrik', 680, 82, 13, 180), S('Pharamp', 'Électrik', 1120, 135, 14, 181)]),
  L('azurill', 1, ['Fée', 'Eau'], 2,
    { name: 'Bulles d’O', desc: 'Tous les 3 tours : 150% ATK + soigne 6%.', every: 3, mult: 1.5, aim: 'front', healAlly: 0.06 },
    [S('Azurill', 'Fée', 380, 32, 11, 298), S('Marill', 'Eau', 720, 68, 12, 183), S('Azumarill', 'Eau', 1220, 118, 13, 184)]),
  L('rowlet', 1, ['Plante', 'Spectre', 'Starter'], 2,
    { name: 'Feuille Magik', desc: 'Tous les 3 tours : 160% ATK Plante/Spectre.', every: 3, mult: 1.6, aim: 'weak' },
    [S('Brindibou', 'Plante', 400, 42, 13, 722), S('Efflèche', 'Plante', 740, 80, 14, 723), S('Archéduc', 'Spectre', 1200, 138, 15, 724)]),
  // —— Cost 2 ——
  L('cynda', 2, ['Feu', 'Spectre', 'Starter'], 2,
    { name: 'Shell Trap', desc: 'Tous les 3 tours : 190% ATK, ignore 12% PV.', every: 3, mult: 1.9, aim: 'random', shred: 0.12 },
    [S('Héricendre', 'Feu', 400, 52, 14, 155), S('Feurisson', 'Feu', 740, 92, 15, 156), S('Typhlosion Hisui', 'Feu', 1200, 155, 17, 10233)]),
  L('chinchou', 2, ['Eau', 'Électrik'], 3,
    { name: 'Luminocanon', desc: 'Tous les 3 tours : 175% ATK Électrik + slow 2.', every: 3, mult: 1.75, aim: 'front', slow: 2 },
    [S('Loupio', 'Eau', 450, 48, 12, 170), S('Lanturn', 'Eau', 820, 88, 13, 171), S('Lanturn ★', 'Eau', 1320, 140, 14, 171)]),
  L('gastly', 2, ['Spectre', 'Poison'], 3,
    { name: 'Ball’Ombre', desc: 'Tous les 3 tours : 185% ATK, ignore 18% PV.', every: 3, mult: 1.85, aim: 'random', shred: 0.18 },
    [S('Fantominus', 'Spectre', 320, 66, 17, 92), S('Spectrum', 'Spectre', 580, 108, 19, 93), S('Ectoplasma', 'Spectre', 960, 165, 21, 94)]),
  L('scyther', 2, ['Insecte', 'Acier'], 1,
    { name: 'Plaie-Croix', desc: 'Tous les 3 tours : 180% ATK Acier sur le front.', every: 3, mult: 1.8, aim: 'front' },
    [S('Insécateur', 'Insecte', 420, 62, 18, 123), S('Cizayox', 'Acier', 800, 118, 16, 212), S('Cizayox ★', 'Acier', 1300, 180, 17, 212)]),
  L('sneasel', 2, ['Glace', 'Ténèbres'], 1,
    { name: 'Yama Arashi', desc: 'Tous les 3 tours : 185% ATK Glace sur le backline.', every: 3, mult: 1.85, aim: 'back' },
    [S('Farfuret', 'Glace', 380, 64, 19, 215), S('Dimoret', 'Glace', 740, 120, 20, 461), S('Dimoret ★', 'Glace', 1200, 185, 21, 461)]),
  L('riolu', 2, ['Combat', 'Force'], 2,
    { name: 'Aurasphère', desc: 'Tous les 3 tours : 190% ATK qui touche le back.', every: 3, mult: 1.9, aim: 'back' },
    [S('Riolu', 'Combat', 420, 60, 16, 447), S('Lucario', 'Combat', 820, 125, 18, 448), S('Lucario ★', 'Combat', 1340, 192, 20, 448)]),
  L('mankey', 2, ['Combat', 'Spectre'], 1,
    { name: 'Rage Fist', desc: 'Tous les 3 tours : 200% ATK Combat/Spectre.', every: 3, mult: 2.0, aim: 'front' },
    [S('Férosinge', 'Combat', 400, 58, 15, 56), S('Colossinge', 'Combat', 760, 105, 14, 57), S('Courrousinge', 'Spectre', 1240, 170, 16, 979)]),
  L('growlithe', 2, ['Feu'], 1,
    { name: 'Lance-Flammes', desc: 'Tous les 3 tours : 175% ATK Feu.', every: 3, mult: 1.75, aim: 'front' },
    [S('Caninos', 'Feu', 420, 56, 14, 58), S('Arcanin', 'Feu', 820, 110, 15, 59), S('Arcanin ★', 'Feu', 1340, 170, 16, 59)]),
  L('abra', 2, ['Psy', 'Mage'], 3,
    { name: 'Psyko', desc: 'Tous les 3 tours : 190% ATK Psy sur le faible.', every: 3, mult: 1.9, aim: 'weak' },
    [S('Abra', 'Psy', 300, 70, 18, 63), S('Kadabra', 'Psy', 560, 115, 20, 64), S('Alakazam', 'Psy', 920, 175, 22, 65)]),
  L('trapinch', 2, ['Sol', 'Dragon'], 1,
    { name: 'Séisme', desc: 'Tous les 4 tours : 185% ATK Sol.', every: 4, mult: 1.85, aim: 'aoe2' },
    [S('Kraknoix', 'Sol', 400, 54, 11, 328), S('Vibraninf', 'Sol', 740, 95, 14, 329), S('Libégon', 'Dragon', 1220, 155, 16, 330)]),
  L('roserade', 2, ['Plante', 'Poison'], 3,
    { name: 'Tempête Florale', desc: 'Tous les 3 tours : 170% ATK Plante ×2.', every: 3, mult: 1.7, aim: 'aoe2' },
    [S('Rozbouton', 'Plante', 360, 50, 14, 406), S('Roserade', 'Plante', 780, 118, 16, 407), S('Roserade ★', 'Poison', 1260, 175, 17, 407)]),
  // —— Cost 3 ——
  L('ralts', 3, ['Psy', 'Fée'], 3,
    { name: 'Pouvoir Lunaire', desc: 'Tous les 3 tours : 180% ATK en zone (2 cibles).', every: 3, mult: 1.8, aim: 'aoe2' },
    [S('Tarsal', 'Psy', 400, 58, 14, 280), S('Kirlia', 'Psy', 740, 102, 16, 281), S('Gardevoir', 'Fée', 1200, 162, 18, 282)]),
  L('toxel', 3, ['Électrik', 'Poison'], 2,
    { name: 'Overdrive', desc: 'Tous les 3 tours : 185% ATK Électrik à 2 cibles.', every: 3, mult: 1.85, aim: 'aoe2' },
    [S('Toxizap', 'Électrik', 420, 62, 14, 848), S('Salarsen', 'Électrik', 820, 120, 15, 849), S('Salarsen ★', 'Électrik', 1340, 185, 16, 849)]),
  L('zorua-h', 3, ['Spectre', 'Normal'], 2,
    { name: 'Bitter Malice', desc: 'Tous les 3 tours : 190% ATK Spectre + shred 10%.', every: 3, mult: 1.9, aim: 'weak', shred: 0.1 },
    [S('Zorua Hisui', 'Spectre', 400, 68, 16, 10238), S('Zoroark Hisui', 'Spectre', 780, 128, 18, 10239), S('Zoroark Hisui ★', 'Spectre', 1280, 195, 19, 10239)]),
  L('honedge', 3, ['Acier', 'Spectre'], 1,
    { name: 'Bouclier Royal', desc: 'Tous les 4 tours : 170% ATK + bouclier 15% PV.', every: 4, mult: 1.7, aim: 'front', shield: 0.15 },
    [S('Monorpale', 'Acier', 440, 60, 12, 679), S('Dimoclès', 'Acier', 820, 110, 13, 680), S('Exagide', 'Acier', 1340, 170, 14, 681)]),
  L('gligar', 3, ['Sol', 'Vol'], 1,
    { name: 'Guillotine', desc: 'Tous les 4 tours : 210% ATK Sol sur le tank.', every: 4, mult: 2.1, aim: 'tank' },
    [S('Scorvol', 'Sol', 460, 58, 15, 207), S('Scorvol ★', 'Sol', 700, 90, 16, 207), S('Scorpenac', 'Sol', 1220, 155, 17, 472)]),
  L('spheal', 3, ['Eau', 'Glace'], 2,
    { name: 'Blizzard', desc: 'Tous les 4 tours : 160% ATK Glace ×2 + slow.', every: 4, mult: 1.6, aim: 'aoe2', slow: 2 },
    [S('Obalie', 'Eau', 500, 48, 10, 363), S('Phogleur', 'Eau', 880, 85, 11, 364), S('Kaimorse', 'Glace', 1420, 135, 12, 365)]),
  L('mimikyu', 3, ['Spectre', 'Fée'], 1,
    { name: 'Force Cachée', desc: 'Tous les 3 tours : 195% ATK Fée.', every: 3, mult: 1.95, aim: 'front' },
    [S('Mimiqui', 'Spectre', 480, 70, 15, 778), S('Mimiqui ★', 'Spectre', 860, 125, 16, 778), S('Mimiqui ★★', 'Fée', 1380, 188, 17, 778)]),
  L('noibat', 3, ['Vol', 'Dragon'], 2,
    { name: 'Ouragan', desc: 'Tous les 3 tours : 175% ATK Vol ×2.', every: 3, mult: 1.75, aim: 'aoe2' },
    [S('Sonistrelle', 'Vol', 380, 58, 17, 714), S('Bruyverne', 'Dragon', 820, 125, 18, 715), S('Bruyverne ★', 'Dragon', 1340, 185, 19, 715)]),
  L('tinkatink', 3, ['Fée', 'Acier'], 1,
    { name: 'Gigamarteau', desc: 'Tous les 3 tours : 190% ATK Acier.', every: 3, mult: 1.9, aim: 'front' },
    [S('Forgerette', 'Fée', 420, 55, 13, 957), S('Forgella', 'Fée', 800, 105, 13, 958), S('Forgelina', 'Acier', 1320, 168, 14, 959)]),
  L('misdreavus', 3, ['Spectre'], 3,
    { name: 'Ball’Ombre', desc: 'Tous les 3 tours : 180% ATK Spectre.', every: 3, mult: 1.8, aim: 'random' },
    [S('Feuforêve', 'Spectre', 400, 64, 15, 200), S('Magirêve', 'Spectre', 820, 125, 16, 429), S('Magirêve ★', 'Spectre', 1340, 188, 17, 429)]),
  // —— Cost 4 ——
  L('charcadet', 4, ['Feu', 'Spectre'], 1,
    { name: 'Lame Amère', desc: 'Tous les 3 tours : 200% ATK (drain via sorts).', every: 3, mult: 2.0, aim: 'front' },
    [S('Charbambin', 'Feu', 460, 72, 14, 935), S('Carmadura', 'Feu', 700, 110, 13, 936), S('Malvalame', 'Feu', 1380, 195, 16, 937)]),
  L('dreepy', 4, ['Dragon', 'Spectre'], 3,
    { name: 'Draco-Flèches', desc: 'Tous les 3 tours : 2× 120% ATK Dragon.', every: 3, mult: 1.2, aim: 'aoe2' },
    [S('Fantyrm', 'Dragon', 380, 70, 18, 885), S('Dispareptil', 'Dragon', 780, 125, 17, 886), S('Lanssorien', 'Dragon', 1320, 195, 19, 887)]),
  L('rookidee', 4, ['Vol', 'Acier'], 1,
    { name: 'Plaquage', desc: 'Tous les 3 tours : 185% ATK Acier.', every: 3, mult: 1.85, aim: 'front' },
    [S('Minisange', 'Vol', 420, 58, 15, 821), S('Bleuseille', 'Vol', 820, 105, 14, 822), S('Corvaillus', 'Acier', 1400, 165, 13, 823)]),
  L('dratini', 4, ['Dragon', 'Vol'], 2,
    { name: 'Draco-Météore', desc: 'Tous les 4 tours : 210% ATK Dragon zone.', every: 4, mult: 2.1, aim: 'aoe2' },
    [S('Minidraco', 'Dragon', 500, 68, 13, 147), S('Draco', 'Dragon', 920, 120, 14, 148), S('Dracolosse', 'Dragon', 1520, 188, 15, 149)]),
  L('beldum', 4, ['Acier', 'Psy'], 2,
    { name: 'Météores', desc: 'Tous les 4 tours : 220% ATK Acier sur le tank.', every: 4, mult: 2.2, aim: 'tank' },
    [S('Terhal', 'Acier', 520, 75, 12, 374), S('Métang', 'Acier', 960, 132, 13, 375), S('Métalosse', 'Acier', 1580, 205, 14, 376)]),
  L('tyrunt', 4, ['Roche', 'Dragon'], 1,
    { name: 'Head Smash', desc: 'Tous les 4 tours : 230% ATK Roche sur le front.', every: 4, mult: 2.3, aim: 'front' },
    [S('Ptyranidur', 'Roche', 540, 78, 11, 696), S('Rexillius', 'Roche', 1000, 145, 12, 697), S('Rexillius ★', 'Dragon', 1600, 210, 13, 697)]),
  L('pawniard', 4, ['Ténèbres', 'Acier'], 1,
    { name: 'Tête de Fer', desc: 'Tous les 3 tours : 195% ATK Acier + stun.', every: 3, mult: 1.95, aim: 'front', stun: true },
    [S('Scalpion', 'Ténèbres', 440, 72, 14, 624), S('Scalproie', 'Ténèbres', 860, 135, 15, 625), S('Scalpereur', 'Ténèbres', 1420, 205, 16, 983)]),
  L('gible', 4, ['Dragon', 'Sol'], 1,
    { name: 'Draco-Charge', desc: 'Tous les 3 tours : 200% ATK Dragon.', every: 3, mult: 2.0, aim: 'front' },
    [S('Griknot', 'Dragon', 520, 74, 12, 443), S('Carmache', 'Dragon', 960, 130, 13, 444), S('Carchacrok', 'Dragon', 1560, 200, 15, 445)]),
  L('larvesta', 4, ['Feu', 'Insecte'], 2,
    { name: 'Danse du Feu', desc: 'Tous les 3 tours : 195% ATK Feu ×2.', every: 3, mult: 1.95, aim: 'aoe2' },
    [S('Pyronille', 'Feu', 480, 78, 13, 636), S('Pyrax', 'Feu', 920, 145, 15, 637), S('Pyrax ★', 'Feu', 1500, 215, 16, 637)]),
  L('frigibax', 4, ['Dragon', 'Glace'], 1,
    { name: 'Glaciation', desc: 'Tous les 3 tours : 195% ATK Glace.', every: 3, mult: 1.95, aim: 'front' },
    [S('Frigibax', 'Dragon', 500, 72, 12, 996), S('Arctibax', 'Dragon', 920, 130, 13, 997), S('Baxcalibur', 'Dragon', 1520, 200, 14, 998)]),
  // —— Cost 5 ——
  L('froakie', 5, ['Eau', 'Ténèbres', 'Starter'], 2,
    { name: 'Shedding Water', desc: 'Tous les 3 tours : 215% ATK sur le weak.', every: 3, mult: 2.15, aim: 'weak' },
    [S('Grenousse', 'Eau', 480, 80, 17, 656), S('Croâporal', 'Eau', 900, 140, 18, 657), S('Amphinobi', 'Eau', 1480, 215, 20, 658)]),
  L('ironval', 5, ['Fée', 'Combat'], 2,
    { name: 'Cœur d’Âme', desc: 'Tous les 3 tours : 210% ATK Fée ×2.', every: 3, mult: 2.1, aim: 'aoe2' },
    [S('Garde-de-Fer', 'Fée', 700, 110, 16, 1006), S('Garde-de-Fer ★', 'Fée', 1150, 170, 17, 1006), S('Garde-de-Fer ★★', 'Combat', 1750, 240, 18, 1006)]),
  L('celebi', 5, ['Psy', 'Plante'], 3,
    { name: 'Soin', desc: 'Tous les 3 tours : soigne 20% + 150% ATK Psy.', every: 3, mult: 1.5, aim: 'random', healAlly: 0.2 },
    [S('Celebi', 'Psy', 720, 95, 15, 251), S('Celebi ★', 'Psy', 1180, 150, 16, 251), S('Celebi ★★', 'Plante', 1780, 220, 17, 251)]),
  L('dialga', 5, ['Acier', 'Dragon'], 3,
    { name: 'Hurle-Temps', desc: 'Tous les 4 tours : 240% ATK Dragon à tous.', every: 4, mult: 2.4, aim: 'all' },
    [S('Dialga', 'Acier', 800, 105, 12, 483), S('Dialga ★', 'Dragon', 1300, 170, 13, 483), S('Dialga ★★', 'Dragon', 1950, 250, 14, 483)]),
  L('mew', 5, ['Psy', 'Mage'], 3,
    { name: 'Psycho Boost', desc: 'Tous les 3 tours : 225% ATK Psy sur le weak.', every: 3, mult: 2.25, aim: 'weak' },
    [S('Mew', 'Psy', 680, 100, 16, 151), S('Mew ★', 'Psy', 1120, 160, 17, 151), S('Mew ★★', 'Psy', 1700, 235, 18, 151)]),
  L('pheromosa', 5, ['Insecte', 'Combat'], 2,
    { name: 'Pied Voltige', desc: 'Tous les 2 tours : 200% ATK Combat.', every: 2, mult: 2.0, aim: 'front' },
    [S('Cancrelove', 'Insecte', 560, 120, 22, 795), S('Cancrelove ★', 'Combat', 980, 185, 23, 795), S('Cancrelove ★★', 'Combat', 1550, 260, 24, 795)]),
  L('darkrai', 5, ['Ténèbres'], 3,
    { name: 'Trou Noir', desc: 'Tous les 3 tours : 220% ATK Ténèbres + slow.', every: 3, mult: 2.2, aim: 'weak', slow: 3 },
    [S('Darkrai', 'Ténèbres', 700, 115, 17, 491), S('Darkrai ★', 'Ténèbres', 1180, 180, 18, 491), S('Darkrai ★★', 'Ténèbres', 1800, 250, 19, 491)]),
  L('lugia', 5, ['Psy', 'Vol'], 3,
    { name: 'Aéroblast', desc: 'Tous les 4 tours : 230% ATK Vol ×2.', every: 4, mult: 2.3, aim: 'aoe2' },
    [S('Lugia', 'Psy', 820, 100, 14, 249), S('Lugia ★', 'Vol', 1350, 165, 15, 249), S('Lugia ★★', 'Vol', 2000, 240, 16, 249)]),
  L('axew', 5, ['Dragon', 'Force'], 1,
    { name: 'Lame Pangoléon', desc: 'Tous les 3 tours : 220% ATK Dragon front.', every: 3, mult: 2.2, aim: 'front' },
    [S('Coupenotte', 'Dragon', 580, 88, 14, 610), S('Incisache', 'Dragon', 1020, 150, 15, 611), S('Tranchodon', 'Dragon', 1680, 220, 17, 612)])
];

/** Carte de campagne solo — un nœud = une étape. */
export const CAMPAIGN = [
  { id: 1, name: 'Clairière Mousse', biome: 'forest', blurb: 'Échauffement', boss: false },
  { id: 2, name: 'Ruisseau Lanturn', biome: 'water', blurb: 'Courant électrique', boss: false },
  { id: 3, name: 'Bois Noctali', biome: 'dark', blurb: 'Ombre amicale', boss: false },
  { id: 4, name: 'Grotte Funécire', biome: 'ghost', blurb: 'Type favori', boss: false },
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

/** Spécificités des synergies (affichées au survol). */
export const TRAIT_INFO = {
  Feu: { title: 'Feu', blurb: 'Offensif pur.', effect: '×2+ : +7% ATK par Feu (max ×4). Avantage vs Plante / Glace / Acier.' },
  Eau: { title: 'Eau', blurb: 'Endurance.', effect: '×2+ : +7% PV par Eau. Avantage vs Feu / Roche / Sol.' },
  Plante: { title: 'Plante', blurb: 'Contrôle & tank.', effect: '×2+ : +7% PV. Avantage vs Eau / Roche / Sol.' },
  Électrik: { title: 'Électrik', blurb: 'Burst rapide.', effect: '×2+ : +7% ATK. Avantage vs Eau / Vol.' },
  Normal: { title: 'Normal', blurb: 'Polyvalent.', effect: '×2+ : léger +ATK. Faible vs Spectre / Roche.' },
  Combat: { title: 'Combat', blurb: 'Frontline bruiser.', effect: '×2+ : +7% PV. Fort vs Normal / Acier / Glace.' },
  Psy: { title: 'Psy', blurb: 'Mages.', effect: '×2+ : +ATK et +PV modérés. Fort vs Combat / Poison.' },
  Spectre: { title: 'Spectre', blurb: 'Ton type favori.', effect: '×2+ : +ATK/+PV. Ignore souvent les tanks Normal. Fort vs Psy.' },
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

export const RUN_POOL_SIZE = 30;

/** Tire un sous-set équilibré (~30) pour la boutique joueur. */
export const buildRunPool = (mustIds = ['cynda', 'mudkip', 'eevee']) => {
  const must = mustIds.map((id) => LINE_MAP[id]).filter(Boolean);
  const used = new Set(must.map((l) => l.id));
  const byCost = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  LINES.forEach((line) => {
    if (used.has(line.id)) return;
    byCost[line.cost]?.push(line);
  });
  const targets = { 1: 7, 2: 7, 3: 7, 4: 5, 5: 4 };
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

export const unitFromLine = (lineId, star = 1, uid, items = []) => {
  const line = LINE_MAP[lineId];
  if (!line) return null;
  const stage = Math.max(1, Math.min(3, star));
  const base = line.stages[stage - 1];
  const dex = base.dex;
  return {
    uid: uid || `${lineId}-${stage}-${Math.random().toString(36).slice(2, 8)}`,
    lineId,
    star: stage,
    cost: line.cost,
    traits: line.traits,
    spell: line.spell,
    range: line.range || 1,
    name: base.name,
    type: base.type,
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
    if (count < 2) return;
    active.push(`${trait} ×${count}`);
    const n = Math.min(count, 4);
    let tip = '';
    if (['Feu', 'Électrik', 'Dragon', 'Force', 'Ténèbres', 'Insecte'].includes(trait)) {
      atkMul += 0.07 * n;
      tip = `+${Math.round(7 * n)}% ATK`;
    } else if (['Eau', 'Plante', 'Combat', 'Starter', 'Acier', 'Roche', 'Sol'].includes(trait)) {
      hpMul += 0.07 * n;
      tip = `+${Math.round(7 * n)}% PV`;
    } else if (['Psy', 'Spectre', 'Mage', 'Fée', 'Glace'].includes(trait)) {
      atkMul += 0.045 * n;
      hpMul += 0.045 * n;
      tip = `+${Math.round(4.5 * n)}% ATK & PV`;
    } else if (['Vol', 'Normal', 'Poison'].includes(trait)) {
      atkMul += 0.035 * Math.min(count, 3);
      tip = `+${Math.round(3.5 * Math.min(count, 3))}% ATK`;
    }
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

export const buildFighters = (units) => {
  const bonus = traitBonus(units);
  return units.map((unit) => {
    const im = itemMods(unit.items || []);
    const maxHp = Math.round(unit.hp * bonus.hpMul * im.hpMul);
    return {
      ...unit,
      maxHp,
      curHp: maxHp,
      power: Math.round(unit.atk * bonus.atkMul * im.atkMul),
      spd: Math.round(unit.spd * im.spdMul + im.spdFlat),
      range: unit.range || 1,
      spellMul: im.spellMul,
      regen: im.regen,
      selfHurt: im.selfHurt,
      thorns: im.thorns,
      lifesteal: im.lifesteal,
      endure: im.endure,
      endured: false,
      opener: im.opener,
      stunSkip: false,
      alive: true,
      cast: 0
    };
  });
};

const fighterAxial = (u) => indexToAxial(u.slot ?? 0, u.side === 'foe');

const distBetween = (a, b) => hexDist(fighterAxial(a), fighterAxial(b));

const inRangeOf = (attacker, target) => distBetween(attacker, target) <= (attacker.range || 1);

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

const applyDamage = (target, raw, attacker, log, turnIndex) => {
  let dmg = Math.max(6, Math.round(raw));
  target.curHp -= dmg;
  if (attacker.lifesteal) {
    attacker.curHp = Math.min(attacker.maxHp, attacker.curHp + Math.round(dmg * attacker.lifesteal));
  }
  if (attacker.selfHurt) {
    attacker.curHp -= Math.round(attacker.maxHp * attacker.selfHurt);
  }
  if (target.thorns && attacker.alive) {
    attacker.curHp -= Math.round(dmg * target.thorns);
  }
  const finish = (u) => {
    if (u.curHp > 0) return;
    if (u.endure && !u.endured) {
      u.curHp = 1;
      u.endured = true;
      return;
    }
    u.curHp = 0;
    u.alive = false;
  };
  finish(target);
  finish(attacker);
  if (!target.alive && turnIndex < 10) log.push(`${attacker.name} KO ${target.name}`);
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
    const unit = unitFromLine(line.id, star, `foe-${wave}-${i}`);
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

export const simulateFight = (alliesIn, foesIn) => {
  const allies = buildFighters(alliesIn.map((u) => ({ ...u, side: u.side || 'ally' })));
  const foes = buildFighters(foesIn.map((u) => ({ ...u, side: u.side || 'foe' })));
  const log = [];
  const frames = [{ line: 'Combat !', hp: snapshotHp(allies, foes), fx: {} }];
  let turn = 0;
  const maxTurns = 48;

  while (turn < maxTurns) {
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
      if (u.stunSkip) {
        u.stunSkip = false;
        continue;
      }
      if (u.regen) u.curHp = Math.min(u.maxHp, u.curHp + Math.round(u.maxHp * u.regen));

      const enemies = side === 'a' ? foes : allies;
      const friends = side === 'a' ? allies : foes;
      const targets = enemies.filter((t) => t.alive);
      if (!targets.length) continue;

      u.cast += 1;
      const spell = u.spell;
      const useSpell = spell && spell.every && u.cast % spell.every === 0;
      const openerExtra = turnIndex === 0 && u.opener && Math.random() < u.opener;
      const fx = { [u.uid]: 'strike' };

      const strikes = openerExtra ? 2 : 1;
      for (let s = 0; s < strikes; s += 1) {
        if (useSpell && s === 0) {
          // Sorts : portée +1
          const spellRange = (u.range || 1) + 1;
          const prev = u.range;
          u.range = spellRange;
          const picked = pickTargets(spell.aim, enemies, friends, u, true);
          u.range = prev;
          if (!picked.length) {
            frames.push({ line: `${u.name} : sort hors de portée`, hp: snapshotHp(allies, foes), fx });
            continue;
          }
          const spellPower = u.power * (spell.mult || 1.5) * (u.spellMul || 1);
          picked.forEach((target) => {
            let raw = spellPower * typeMult(u.type, target.type) * (0.92 + Math.random() * 0.2);
            if (spell.shred) raw += target.maxHp * spell.shred;
            if (spell.stealAtk) raw = Math.max(raw, target.power * 1.1);
            applyDamage(target, raw, u, log, turnIndex);
            fx[target.uid] = target.alive ? 'hit' : 'ko';
            if (spell.slow) target.spd = Math.max(1, target.spd - spell.slow);
            if (spell.stun) target.stunSkip = true;
            if (spell.atkBreak) target.power = Math.round(target.power * (1 - spell.atkBreak));
          });
          if (spell.healAlly) {
            const wounded = friends.filter((f) => f.alive).sort((a, b) => a.curHp / a.maxHp - b.curHp / b.maxHp)[0];
            if (wounded) wounded.curHp = Math.min(wounded.maxHp, wounded.curHp + Math.round(wounded.maxHp * spell.healAlly));
          }
          if (spell.shield) u.curHp = Math.min(u.maxHp, u.curHp + Math.round(u.maxHp * spell.shield));
          if (spell.selfAtk) u.power = Math.round(u.power * (1 + spell.selfAtk));
          if (spell.teamAtk) friends.forEach((f) => { if (f.alive) f.power = Math.round(f.power * (1 + spell.teamAtk)); });
          if (spell.allyBuff) {
            const slow = friends.filter((f) => f.alive).sort((a, b) => a.spd - b.spd)[0];
            if (slow) slow.spd += 3;
          }
          const line = `${u.name} : ${spell.name}`;
          if (turnIndex < 10) log.push(line);
          frames.push({ line, hp: snapshotHp(allies, foes), fx: { ...fx } });
        } else {
          const picked = pickTargets('front', enemies, friends, u, true);
          if (!picked.length) {
            frames.push({
              line: `${u.name} hors de portée (P${u.range})`,
              hp: snapshotHp(allies, foes),
              fx
            });
            continue;
          }
          const target = picked[0];
          const mult = typeMult(u.type, target.type);
          const dmg = u.power * mult * (0.88 + Math.random() * 0.28);
          applyDamage(target, dmg, u, log, turnIndex);
          fx[target.uid] = target.alive ? 'hit' : 'ko';
          frames.push({
            line: `${u.name} → ${target.name}`,
            hp: snapshotHp(allies, foes),
            fx: { ...fx }
          });
        }
      }
    }
    turn += 1;
  }

  const win = foes.every((u) => !u.alive) && allies.some((u) => u.alive);
  const aliveFoes = foes.filter((u) => u.alive).length;
  const damage = win ? 0 : Math.max(2, aliveFoes + 1);
  frames.push({
    line: win ? 'Victoire !' : 'Défaite…',
    hp: snapshotHp(allies, foes),
    fx: Object.fromEntries(
      (win ? foes : allies).map((u) => [u.uid, 'ko'])
    )
  });
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
      if (entry.u.star >= 3) return;
      const key = `${entry.u.lineId}:${entry.u.star}`;
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
    const upgraded = unitFromLine(base.lineId, base.star + 1, undefined, pooledItems);
    notes.push(`${base.name} ×3 → ${upgraded.name} (${upgraded.star}★)`);

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
