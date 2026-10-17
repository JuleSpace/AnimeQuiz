/**
 * Dresseurs de la campagne : classes, régions, Champions d’Arène, Conseil 4, Maîtres,
 * rivaux et équipes de méchants. Chaque run en tire une combinaison différente.
 * Les sprites viennent de Pokémon Showdown (play.pokemonshowdown.com/sprites/trainers).
 */

export const trainerSprite = (id) => (id ? `https://play.pokemonshowdown.com/sprites/trainers/${id}.png` : null);

/* ——————————————————————— Prénoms ——————————————————————— */

export const NAMES_M = [
  'Léo', 'Hugo', 'Noé', 'Malo', 'Timéo', 'Axel', 'Sacha', 'Nolan', 'Gaspard', 'Robin', 'Basile', 'Oscar',
  'Jules', 'Arthur', 'Louis', 'Gabin', 'Raphaël', 'Lucas', 'Nathan', 'Ethan', 'Mathis', 'Évan', 'Maël', 'Tom',
  'Victor', 'Adam', 'Liam', 'Aaron', 'Paul', 'Côme', 'Marius', 'Valentin', 'Simon', 'Antoine', 'Théo', 'Baptiste',
  'Enzo', 'Kylian', 'Rayan', 'Yanis', 'Samuel', 'Elias', 'Félix', 'Augustin', 'Clément', 'Bastien', 'Martin', 'Joseph',
  'Lenny', 'Milo', 'Soan', 'Ilyes', 'Anatole', 'Ruben', 'Lucien', 'Émile', 'Achille', 'Isaac', 'Noam', 'Corentin'
];

export const NAMES_F = [
  'Inès', 'Jade', 'Lina', 'Rose', 'Zoé', 'Lou', 'Iris', 'Manon', 'Alix', 'Maëlle', 'Nina', 'Clara',
  'Emma', 'Louise', 'Alice', 'Chloé', 'Léna', 'Mila', 'Ambre', 'Anna', 'Julia', 'Léonie', 'Agathe', 'Romane',
  'Lucie', 'Eva', 'Sarah', 'Juliette', 'Margaux', 'Capucine', 'Camille', 'Victoire', 'Éléa', 'Héloïse', 'Lisa', 'Mia',
  'Charlotte', 'Olivia', 'Apolline', 'Salomé', 'Garance', 'Anaïs', 'Elsa', 'Yasmine', 'Noémie', 'Constance', 'Thaïs', 'Lya',
  'Suzanne', 'Ninon', 'Céleste', 'Albane', 'Adèle', 'Maya', 'Lilou', 'Océane', 'Clémence', 'Pauline', 'Solène', 'Zélie'
];

/* ——————————————————————— Classes de dresseurs ——————————————————————— */

/** id → { cls, types, sprite, f (féminin) }. */
export const CLASSES = {
  gamin: { cls: 'Gamin', types: ['Normal', 'Insecte'], sprite: 'youngster-gen8' },
  fillette: { cls: 'Fillette', types: ['Normal', 'Fée'], sprite: 'lass-gen8', f: true },
  scout: { cls: 'Scout', types: ['Insecte'], sprite: 'bugcatcher-gen6' },
  campeur: { cls: 'Campeur', types: ['Sol', 'Normal'], sprite: 'camper-gen6' },
  piqueniqueuse: { cls: 'Pique-niqueuse', types: ['Plante', 'Normal'], sprite: 'picnicker-gen6', f: true },
  ranger: { cls: 'Pokémon Ranger', types: ['Plante', 'Insecte'], sprite: 'pokemonranger-gen6' },
  rangeuse: { cls: 'Pokémon Ranger', types: ['Plante', 'Vol'], sprite: 'pokemonrangerf-gen6', f: true },
  eleveur: { cls: 'Éleveur', types: ['Normal', 'Fée'], sprite: 'pokemonbreeder-gen8' },
  eleveuse: { cls: 'Éleveuse', types: ['Fée', 'Normal'], sprite: 'pokemonbreederf-gen8', f: true },
  aromanesse: { cls: 'Aromanesse', types: ['Plante'], sprite: 'aromalady-gen6', f: true },
  jardiniere: { cls: 'Jardinière', types: ['Plante', 'Insecte'], sprite: 'gardener', f: true },
  ornitho: { cls: 'Ornithologue', types: ['Vol'], sprite: 'birdkeeper-gen6' },
  canon: { cls: 'Canon', types: ['Fée', 'Eau'], sprite: 'beauty-gen8', f: true },
  montagnard: { cls: 'Montagnard', types: ['Roche', 'Sol'], sprite: 'hiker-gen8' },
  karateka: { cls: 'Karatéka', types: ['Combat'], sprite: 'blackbelt-gen8' },
  battante: { cls: 'Battante', types: ['Combat'], sprite: 'battlegirl-gen6', f: true },
  ruinemaniac: { cls: 'Ruinemaniac', types: ['Roche', 'Sol'], sprite: 'ruinmaniac-gen6' },
  randonneur: { cls: 'Randonneur', types: ['Sol', 'Combat'], sprite: 'backpacker-gen9' },
  dracologue: { cls: 'Dracologue', types: ['Dragon'], sprite: 'dragontamer-gen6', minChapter: 2 },
  pecheur: { cls: 'Pêcheur', types: ['Eau'], sprite: 'fisherman-gen7' },
  nageur: { cls: 'Nageur', types: ['Eau'], sprite: 'swimmer-gen8' },
  nageuse: { cls: 'Nageuse', types: ['Eau', 'Glace'], sprite: 'swimmerf-gen8', f: true },
  marin: { cls: 'Marin', types: ['Eau', 'Combat'], sprite: 'sailor-gen6' },
  tuba: { cls: 'Bambin', types: ['Eau'], sprite: 'tuber-gen6' },
  tubette: { cls: 'Bambine', types: ['Eau', 'Fée'], sprite: 'tuberf-gen6', f: true },
  skieur: { cls: 'Skieur', types: ['Glace'], sprite: 'skier' },
  skieuse: { cls: 'Skieuse', types: ['Glace'], sprite: 'skierf', f: true },
  snowboarder: { cls: 'Snowboardeur', types: ['Glace', 'Sol'], sprite: 'boarder' },
  medium: { cls: 'Médium', types: ['Psy'], sprite: 'psychic-gen6' },
  mediumf: { cls: 'Médium', types: ['Psy', 'Fée'], sprite: 'psychicf', f: true },
  mystimaniac: { cls: 'Mystimaniac', types: ['Spectre', 'Psy'], sprite: 'hexmaniac-gen6', f: true },
  exorciste: { cls: 'Exorciste', types: ['Spectre'], sprite: 'channeler-lgpe', f: true },
  pyromane: { cls: 'Pyromane', types: ['Feu'], sprite: 'kindler-gen6' },
  cuisinier: { cls: 'Cuisinier', types: ['Feu', 'Normal'], sprite: 'cook-gen9' },
  motard: { cls: 'Motard', types: ['Poison', 'Ténèbres'], sprite: 'biker-gen4' },
  loubarde: { cls: 'Loubarde', types: ['Ténèbres', 'Poison'], sprite: 'delinquentf-gen9', f: true },
  scientifique: { cls: 'Scientifique', types: ['Électrik', 'Poison', 'Acier'], sprite: 'scientist-gen9' },
  ouvrier: { cls: 'Ouvrier', types: ['Acier', 'Roche'], sprite: 'worker-gen8' },
  rockeur: { cls: 'Musicien', types: ['Électrik'], sprite: 'guitarist-gen6' },
  ninja: { cls: 'Ninja', types: ['Poison', 'Insecte'], sprite: 'ninjaboy-gen6' },
  gentleman: { cls: 'Gentleman', types: ['Normal', 'Feu'], sprite: 'gentleman-gen8' },
  madame: { cls: 'Mondaine', types: ['Fée', 'Psy'], sprite: 'madame-gen8', f: true },
  topdresseur: { cls: 'Topdresseur', types: [], sprite: 'acetrainer-gen7', elite: true },
  topdresseuse: { cls: 'Topdresseuse', types: [], sprite: 'acetrainerf-gen7', f: true, elite: true },
  veteran: { cls: 'Vétéran', types: [], sprite: 'veteran-gen7', elite: true },
  veterane: { cls: 'Vétérane', types: [], sprite: 'veteranf-gen7', f: true, elite: true }
};

export const ELITE_CLASSES = ['topdresseur', 'topdresseuse', 'veteran', 'veterane'];

/* ——————————————————————— Régions (chapitres) ——————————————————————— */

/** Biomes tirables pour les 3 premiers chapitres ; la Ligue clôt toujours la run. */
export const BIOMES = [
  {
    id: 'prairie', scene: 'prairie',
    names: ['Route Fleurie', 'Plaine Verdoyante', 'Forêt de Jade', 'Vallon des Baies', 'Bois aux Lucioles'],
    blurbs: ['Hautes herbes, ruisseaux et premiers duels.', 'Des dresseurs à chaque détour de sentier.'],
    classes: ['gamin', 'fillette', 'scout', 'campeur', 'piqueniqueuse', 'ranger', 'rangeuse', 'eleveur', 'eleveuse', 'aromanesse', 'jardiniere', 'ornitho']
  },
  {
    id: 'montagne', scene: 'montagne',
    names: ['Monts Brumeux', 'Col du Dragon', 'Sommet Céleste', 'Route des Crêtes', 'Mont Couronné'],
    blurbs: ['Cols venteux et dresseurs aguerris.', 'L’air se raréfie, les combats se durcissent.'],
    classes: ['montagnard', 'karateka', 'battante', 'ruinemaniac', 'randonneur', 'ornitho', 'dracologue', 'ouvrier']
  },
  {
    id: 'plage', scene: 'plage',
    names: ['Côte Azurée', 'Archipel Écume', 'Baie Corail', 'Littoral Doré', 'Îles Écarlates'],
    blurbs: ['Sable chaud, embruns et nageurs coriaces.', 'Les marins ne lâchent jamais un duel.'],
    classes: ['pecheur', 'nageur', 'nageuse', 'marin', 'tuba', 'tubette', 'canon', 'ornitho', 'rockeur']
  },
  {
    id: 'neige', scene: 'neige',
    names: ['Pic Glacé', 'Toundra d’Argent', 'Val Givré', 'Route Blizzard', 'Lac Gelé'],
    blurbs: ['Blizzard, sapins givrés et esprits du froid.', 'Le vent glacé n’épargne personne.'],
    classes: ['skieur', 'skieuse', 'snowboarder', 'montagnard', 'karateka', 'mystimaniac', 'medium', 'mediumf']
  },
  {
    id: 'volcan', scene: 'volcan',
    names: ['Mont Braise', 'Caldeira Ardente', 'Cratère Écarlate', 'Route Cendrée', 'Île Volcanique'],
    blurbs: ['Lave, cendres et dresseurs brûlants.', 'Le sol tremble sous les pas.'],
    classes: ['pyromane', 'cuisinier', 'montagnard', 'ruinemaniac', 'motard', 'loubarde', 'scientifique', 'karateka', 'dracologue']
  },
  {
    id: 'grotte', scene: 'grotte',
    names: ['Grotte Lumineuse', 'Caverne Abyssale', 'Mines Oubliées', 'Antre Cristallin', 'Souterrain Obscur'],
    blurbs: ['Cristaux, galeries et ombres qui bougent.', 'Qui sait ce qui dort au fond ?'],
    classes: ['montagnard', 'mystimaniac', 'exorciste', 'ruinemaniac', 'motard', 'ninja', 'scientifique', 'ouvrier', 'loubarde']
  }
];

export const LEAGUE_BIOME = {
  id: 'ligue', scene: 'ligue',
  names: ['Plateau Indigo', 'Ligue Pokémon', 'Colline Victoire', 'Sommet de la Ligue', 'Tour Céleste'],
  blurbs: ['Le Conseil 4, puis le Maître. Pas de retour en arrière.', 'Cinq combats pour entrer dans la légende.'],
  classes: ['topdresseur', 'topdresseuse', 'veteran', 'veterane', 'dracologue', 'gentleman', 'madame', 'medium', 'scientifique']
};

/* ——————————————————————— Champions d’Arène ——————————————————————— */

// [nom, féminin, région, types, as, sprite, biomes]
const L = (name, f, region, types, ace, sprite, biomes) => ({ name, f, region, types, ace, sprite, biomes });

export const LEADERS = [
  L('Pierre', false, 'Kanto', ['Roche', 'Sol'], 'onix', 'brock', ['montagne', 'grotte']),
  L('Ondine', true, 'Kanto', ['Eau'], 'staryu', 'misty', ['plage']),
  L('Major Bob', false, 'Kanto', ['Électrik'], 'raichu', 'ltsurge', ['plage']),
  L('Erika', true, 'Kanto', ['Plante'], 'oddish', 'erika', ['prairie']),
  L('Jeannine', true, 'Kanto', ['Poison'], 'venipede', 'janine', ['grotte', 'volcan']),
  L('Morgane', true, 'Kanto', ['Psy'], 'abra', 'sabrina', ['grotte', 'neige']),
  L('Auguste', false, 'Kanto', ['Feu'], 'growlithe', 'blaine', ['volcan']),
  L('Albert', false, 'Johto', ['Vol'], 'pidgey', 'falkner', ['prairie', 'montagne']),
  L('Hector', false, 'Johto', ['Insecte'], 'scyther', 'bugsy', ['prairie']),
  L('Blanche', true, 'Johto', ['Normal'], 'tauros', 'whitney', ['prairie']),
  L('Mortimer', false, 'Johto', ['Spectre'], 'gastly', 'morty', ['grotte', 'neige']),
  L('Chuck', false, 'Johto', ['Combat'], 'poliwag', 'chuck', ['plage', 'montagne']),
  L('Jasmine', true, 'Johto', ['Acier'], 'magnemite', 'jasmine', ['plage', 'montagne']),
  L('Frédo', false, 'Johto', ['Glace'], 'swinub', 'pryce', ['neige']),
  L('Sandra', true, 'Johto', ['Dragon'], 'horsea', 'clair', ['montagne', 'grotte']),
  L('Roxanne', true, 'Hoenn', ['Roche'], 'roggenrola', 'roxanne', ['grotte']),
  L('Bastien', false, 'Hoenn', ['Combat'], 'machop', 'brawly', ['plage']),
  L('Voltère', false, 'Hoenn', ['Électrik'], 'electrike', 'wattson', ['plage', 'volcan']),
  L('Adriane', true, 'Hoenn', ['Feu'], 'numel', 'flannery', ['volcan']),
  L('Norman', false, 'Hoenn', ['Normal'], 'slakoth', 'norman', ['prairie']),
  L('Alizée', true, 'Hoenn', ['Vol'], 'swablu', 'winona', ['prairie', 'montagne']),
  L('Juan', false, 'Hoenn', ['Eau'], 'barboach', 'juan', ['plage']),
  L('Pierrick', false, 'Sinnoh', ['Roche'], 'cranidos', 'roark', ['grotte', 'montagne']),
  L('Flo', true, 'Sinnoh', ['Plante'], 'roserade', 'gardenia', ['prairie']),
  L('Mélina', true, 'Sinnoh', ['Combat'], 'riolu', 'maylene', ['neige', 'montagne']),
  L('Lovis', false, 'Sinnoh', ['Eau'], 'buizel', 'crasherwake', ['plage']),
  L('Kiméra', true, 'Sinnoh', ['Spectre'], 'drifloon', 'fantina', ['grotte']),
  L('Charles', false, 'Sinnoh', ['Acier'], 'shieldon', 'byron', ['montagne', 'grotte']),
  L('Gladys', true, 'Sinnoh', ['Glace'], 'snover', 'candice', ['neige']),
  L('Tanguy', false, 'Sinnoh', ['Électrik'], 'shinx', 'volkner', ['plage']),
  L('Rachid', false, 'Unys', ['Plante'], 'pansage', 'cilan', ['prairie']),
  L('Armando', false, 'Unys', ['Feu'], 'houndour', 'chili', ['volcan']),
  L('Noa', false, 'Unys', ['Eau'], 'tympole', 'cress', ['plage']),
  L('Aloé', true, 'Unys', ['Normal'], 'lillipup', 'lenora', ['prairie']),
  L('Artie', false, 'Unys', ['Insecte'], 'sewaddle', 'burgh', ['prairie']),
  L('Inezia', true, 'Unys', ['Électrik'], 'blitzle', 'elesa', ['plage', 'volcan']),
  L('Bardane', false, 'Unys', ['Sol'], 'drilbur', 'clay', ['grotte', 'montagne']),
  L('Carolina', true, 'Unys', ['Vol'], 'ducklett', 'skyla', ['plage']),
  L('Zhu', false, 'Unys', ['Glace'], 'cubchoo', 'brycen', ['neige']),
  L('Watson', false, 'Unys', ['Dragon'], 'axew', 'drayden', ['montagne']),
  L('Tcheren', false, 'Unys', ['Normal'], 'minccino', 'cheren', ['prairie']),
  L('Strykna', true, 'Unys', ['Poison'], 'koffing', 'roxie', ['volcan', 'grotte']),
  L('Amana', false, 'Unys', ['Eau'], 'clamperl', 'marlon', ['plage']),
  L('Violette', true, 'Kalos', ['Insecte'], 'vivillon', 'viola', ['prairie']),
  L('Lino', false, 'Kalos', ['Roche'], 'tyrunt', 'grant', ['montagne', 'grotte']),
  L('Cornélia', true, 'Kalos', ['Combat'], 'mienfoo', 'korrina', ['montagne']),
  L('Amaro', false, 'Kalos', ['Plante'], 'skiddo', 'ramos', ['prairie']),
  L('Lem', false, 'Kalos', ['Électrik'], 'helioptile', 'clemont', ['plage']),
  L('Valériane', true, 'Kalos', ['Fée'], 'flabebe', 'valerie', ['prairie']),
  L('Astera', true, 'Kalos', ['Psy'], 'espurr', 'olympia', ['neige', 'grotte']),
  L('Urup', false, 'Kalos', ['Glace'], 'bergmite', 'wulfric', ['neige']),
  L('Percy', false, 'Galar', ['Plante'], 'wooloo', 'milo', ['prairie']),
  L('Donna', true, 'Galar', ['Eau'], 'krabby', 'nessa', ['plage']),
  L('Kabu', false, 'Galar', ['Feu'], 'sizzlipede', 'kabu', ['volcan']),
  L('Faïza', true, 'Galar', ['Combat'], 'falinks', 'bea', ['montagne']),
  L('Alistair', false, 'Galar', ['Spectre'], 'sinistea', 'allister', ['grotte']),
  L('Sally', true, 'Galar', ['Fée'], 'milcery', 'opal', ['prairie']),
  L('Chaz', false, 'Galar', ['Roche'], 'rolycoly', 'gordie', ['volcan', 'grotte']),
  L('Lona', true, 'Galar', ['Glace'], 'snom', 'melony', ['neige']),
  L('Peterson', false, 'Galar', ['Ténèbres'], 'zigzagoon-g', 'piers', ['grotte']),
  L('Roy', false, 'Galar', ['Dragon'], 'duraludon', 'raihan', ['montagne']),
  L('Éra', true, 'Paldea', ['Insecte'], 'tarountula', 'katy', ['prairie']),
  L('Colza', false, 'Paldea', ['Plante'], 'smoliv', 'brassius', ['prairie']),
  L('Mashynn', true, 'Paldea', ['Électrik'], 'bellibolt', 'iono', ['plage']),
  L('Kombu', false, 'Paldea', ['Eau'], 'clauncher', 'kofu', ['plage']),
  L('Okuba', false, 'Paldea', ['Normal'], 'dunsparce', 'larry', ['prairie', 'montagne']),
  L('Laïm', true, 'Paldea', ['Spectre'], 'greavard', 'ryme', ['grotte', 'neige']),
  L('Tully', true, 'Paldea', ['Psy'], 'girafarig', 'tulip', ['neige', 'grotte']),
  L('Grusha', false, 'Paldea', ['Glace'], 'cetoddle', 'grusha', ['neige'])
];

/* ——————————————————————— Ligue ——————————————————————— */

export const ELITE_FOUR = [
  L('Olga', true, 'Kanto', ['Glace', 'Eau'], 'lapras', 'lorelei-lgpe'),
  L('Aldo', false, 'Kanto', ['Combat', 'Roche'], 'tyrogue', 'bruno'),
  L('Agatha', true, 'Kanto', ['Spectre', 'Poison'], 'gastly', 'agatha-lgpe'),
  L('Clément', false, 'Johto', ['Psy'], 'natu', 'will'),
  L('Koga', false, 'Johto', ['Poison', 'Insecte'], 'koffing', 'koga'),
  L('Marion', true, 'Johto', ['Ténèbres'], 'houndour', 'karen'),
  L('Damien', false, 'Hoenn', ['Ténèbres'], 'absol', 'sidney'),
  L('Spectra', true, 'Hoenn', ['Spectre'], 'duskull', 'phoebe-gen6'),
  L('Glacia', true, 'Hoenn', ['Glace'], 'spheal', 'glacia'),
  L('Aaron', false, 'Sinnoh', ['Insecte'], 'skorupi', 'aaron'),
  L('Terry', true, 'Sinnoh', ['Sol'], 'hippopotas', 'bertha'),
  L('Adrien', false, 'Sinnoh', ['Feu'], 'magby', 'flint'),
  L('Lucio', false, 'Sinnoh', ['Psy'], 'bronzor', 'lucian'),
  L('Anis', true, 'Unys', ['Spectre'], 'litwick', 'shauntal'),
  L('Pieris', false, 'Unys', ['Ténèbres'], 'pawniard', 'grimsley'),
  L('Percila', true, 'Unys', ['Psy'], 'munna', 'caitlin'),
  L('Kunz', false, 'Unys', ['Combat'], 'timburr', 'marshal'),
  L('Malva', true, 'Kalos', ['Feu'], 'litleo', 'malva'),
  L('Narcisse', false, 'Kalos', ['Eau'], 'skrelp', 'siebold'),
  L('Thyméo', false, 'Kalos', ['Acier'], 'klefki', 'wikstrom'),
  L('Dracéna', true, 'Kalos', ['Dragon'], 'goomy', 'drasna'),
  L('Pectorius', false, 'Alola', ['Combat'], 'crabrawler', 'hala'),
  L('Alyxia', true, 'Alola', ['Roche'], 'rockruff', 'olivia'),
  L('Margie', true, 'Alola', ['Spectre'], 'sandygast', 'acerola'),
  L('Kahili', true, 'Alola', ['Vol'], 'pikipek', 'kahili'),
  L('Molène', false, 'Alola', ['Acier'], 'beldum', 'molayne'),
  L('Rika', true, 'Paldea', ['Sol'], 'wooper', 'rika'),
  L('Popi', true, 'Paldea', ['Acier'], 'tinkatink', 'poppy'),
  L('Okuba', false, 'Paldea', ['Vol'], 'flamigo', 'larry'),
  L('Hassel', false, 'Paldea', ['Dragon'], 'applin', 'hassel')
];

export const CHAMPIONS = [
  L('Peter', false, 'Kanto', ['Dragon', 'Vol'], 'dratini', 'lance'),
  L('Blue', false, 'Kanto', ['Vol', 'Psy', 'Feu'], 'pidgey', 'blue'),
  L('Red', false, 'Kanto', ['Électrik', 'Feu', 'Eau', 'Plante'], 'raichu', 'red'),
  L('Pierre Rochard', false, 'Hoenn', ['Acier', 'Roche'], 'beldum', 'steven'),
  L('Marc', false, 'Hoenn', ['Eau'], 'feebas', 'wallace'),
  L('Cynthia', true, 'Sinnoh', ['Dragon', 'Sol'], 'gible', 'cynthia'),
  L('Goyah', false, 'Unys', ['Insecte', 'Feu'], 'larvesta', 'alder'),
  L('Iris', true, 'Unys', ['Dragon'], 'axew', 'iris'),
  L('Dianthéa', true, 'Kalos', ['Fée', 'Roche'], 'ralts', 'diantha'),
  L('Euphorbe', false, 'Alola', ['Roche', 'Feu'], 'rockruff', 'kukui'),
  L('Tarak', false, 'Galar', ['Feu', 'Dragon'], 'charmander', 'leon'),
  L('Alisma', true, 'Paldea', ['Roche', 'Ténèbres'], 'glimmet', 'geeta'),
  L('Menzi', true, 'Paldea', ['Électrik', 'Combat'], 'pawmi', 'nemona-v')
];

/* ——————————————————————— Rivaux et méchants ——————————————————————— */

export const RIVALS = [
  { name: 'Blue', sprite: 'blue-gen7' },
  { name: 'Silver', sprite: 'silver' },
  { name: 'Timmy', sprite: 'wally' },
  { name: 'Louka', sprite: 'barry' },
  { name: 'Bianca', sprite: 'bianca', f: true },
  { name: 'Matis', sprite: 'hugh' },
  { name: 'Serena', sprite: 'serena', f: true },
  { name: 'Kalem', sprite: 'calem' },
  { name: 'Tili', sprite: 'hau' },
  { name: 'Gladio', sprite: 'gladion' },
  { name: 'Nabil', sprite: 'hop' },
  { name: 'Travis', sprite: 'bede' },
  { name: 'Rosemary', sprite: 'marnie', f: true },
  { name: 'Menzi', sprite: 'nemona-s', f: true },
  { name: 'Kassis', sprite: 'kieran' },
  { name: 'Pepper', sprite: 'arven-s' }
];

export const VILLAINS = [
  { team: 'Team Rocket', grunt: ['rocketgrunt', 'rocketgruntf'], boss: L('Giovanni', false, 'Kanto', ['Sol', 'Poison', 'Ténèbres'], 'nido', 'giovanni') },
  { team: 'Team Aqua', grunt: ['aquagrunt', 'aquagruntf'], boss: L('Arthur', false, 'Hoenn', ['Eau', 'Ténèbres'], 'carvanha', 'archie-gen6') },
  { team: 'Team Magma', grunt: ['magmagrunt', 'magmagruntf'], boss: L('Max', false, 'Hoenn', ['Feu', 'Sol'], 'numel', 'maxie-gen6') },
  { team: 'Team Galaxie', grunt: ['galacticgrunt', 'galacticgruntf'], boss: L('Hélio', false, 'Sinnoh', ['Ténèbres', 'Vol'], 'sneasel', 'cyrus') },
  { team: 'Team Plasma', grunt: ['plasmagrunt', 'plasmagruntf'], boss: L('Ghetis', false, 'Unys', ['Ténèbres', 'Dragon'], 'deino', 'ghetsis') },
  { team: 'Team Flare', grunt: ['flaregrunt', 'flaregruntf'], boss: L('Lysandre', false, 'Kalos', ['Feu', 'Ténèbres'], 'litleo', 'lysandre') },
  { team: 'Team Skull', grunt: ['skullgrunt', 'skullgruntf'], boss: L('Guzma', false, 'Alola', ['Insecte', 'Ténèbres'], 'wimpod', 'guzma') }
];
