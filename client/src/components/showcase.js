/**
 * Les projets du site, partagés par la page Portfolio et la ludothèque (cartes des jeux).
 * `hash` : où mène le bouton « Jouer » (null = la page de connexion du quiz).
 */
const IMG = `${process.env.PUBLIC_URL || ''}/portfolio`;

export const PROJECTS = [
  {
    id: 'quiz',
    no: 1,
    title: 'Bully’s Lair',
    subtitle: 'Quiz multijoueur en temps réel',
    genre: 'Multijoueur · temps réel',
    hash: null,
    img: `${IMG}/quiz.webp`,
    color: '#1f6dff',
    rarity: 'Légendaire',
    pitch: 'Une plateforme de quiz pour jouer entre amis : un organisateur pilote la partie et note les réponses, les joueurs répondent depuis leur téléphone et sabotent leurs adversaires avec des cartes.',
    highlights: [
      '11 formats de questions : choix multiple, images, vrai/faux, texte libre, texte à trous, blind test masqué, paroles, « Who’s that », classement, frise et schéma.',
      '14 cartes jokers distribuées en boosters au fil de la partie (double mise, filet, vol, bouclier…).',
      'Synchronisation en temps réel : reconnexion après un rafraîchissement, arrivée en cours de partie.',
      'Mode Music Quiz, éditeur de quiz complet (recherche, filtres par format, édition en place, duplication, rangement en catégories en un clic) et comptes d’administration avec des rôles.'
    ],
    moves: [['Formats', '11'], ['Cartes jokers', '14']],
    tech: ['React', 'Node.js', 'Express', 'Socket.IO', 'MongoDB']
  },
  {
    id: 'arena',
    no: 2,
    title: 'Poké Bully Tactics',
    subtitle: 'Auto-battler Pokémon',
    genre: 'Stratégie · solo et multi',
    hash: '#arena',
    img: `${IMG}/arena.webp`,
    color: '#c9a05a',
    rarity: 'Légendaire',
    pitch: 'Un auto-battler : on recrute des Pokémon, on fusionne trois exemplaires pour les faire évoluer, on place son équipe sur le plateau et on traverse trois régions jusqu’à la Ligue.',
    highlights: [
      'Les 1025 Pokémon : 560 lignées, 1164 formes (régionales et Méga comprises), 32 étapes et plus de 100 dresseurs célèbres.',
      'Talents, objets et synergies de types, boutique et carte de progression.',
      'Salons multijoueurs orchestrés côté serveur (Socket.IO).',
      'Pokédex interactif : recherche, filtres par coût et type, fiche animée avec évolutions, stats et synergies.'
    ],
    moves: [['Pokémon', '1025'], ['Lignées', '560']],
    tech: ['React', 'Socket.IO', 'Node.js', 'Plateau isométrique']
  },
  {
    id: 'swarm',
    no: 3,
    title: 'Poké Swarm',
    subtitle: 'Survivor 2D',
    genre: 'Survie · solo',
    hash: '#swarm',
    img: `${IMG}/swarm.webp`,
    color: '#ffd447',
    rarity: 'Rare',
    pitch: 'Un « bullet heaven » : le partenaire attaque tout seul, on se déplace dans la horde, on choisit ses bonus sous forme de cartes et on affronte un légendaire au bout de 9 minutes.',
    highlights: [
      '19 starters de 6 régions (jusqu’à Kalos), 48 attaques, évolutions au choix et Méga-Évolutions.',
      '189 espèces ennemies avec leurs comportements, 5 décors générés à chaque partie.',
      'Cartes d’attaque façon TCG avec une démo animée de chaque capacité.',
      'Progression entre les parties : talents, boutique, défis, missions, survie infinie.'
    ],
    moves: [['Attaques', '48'], ['Espèces', '189']],
    tech: ['React', 'Canvas 2D', 'Python (sprites)']
  },
  {
    id: 'rush',
    no: 4,
    title: 'Poké Rush',
    subtitle: 'Survivor 3D',
    genre: 'Action 3D · solo',
    hash: '#pokerush',
    img: `${IMG}/rush.webp`,
    color: '#3ddc84',
    rarity: 'Rare',
    pitch: 'La même formule en 3D : une île de Kanto low-poly, des sprites animés plantés dans le décor, et des Pokémon sauvages à capturer pour se battre à ses côtés.',
    highlights: [
      'Sprites animés en billboards instanciés : un seul appel de dessin par espèce, 8 directions selon la caméra (shader GLSL).',
      'Table des types complète, capture d’alliés, évolution en direct au ralenti.',
      'Île générée : terrasses à franchir en sautant, rivière et ponts, rochers 3D, hautes herbes, arène.',
      'Collection des 79 familles de Kanto à débloquer par des défis, partenaire au choix, cartes de montée de niveau.'
    ],
    moves: [['Types', '18'], ['Alliés', '3']],
    tech: ['Three.js', 'WebGL / GLSL', 'React']
  },
  {
    id: 'bonk',
    no: 5,
    title: 'Sonic Bonk',
    subtitle: 'Survivor 3D',
    genre: 'Action 3D · solo',
    hash: '#bonk',
    img: `${IMG}/bonk.webp`,
    color: '#2f8fe0',
    rarity: 'Peu commune',
    pitch: 'Un survivor rapide sur une île en relief façon Green Hill : on court, on saute, on enchaîne les spin dash au milieu de hordes de robots.',
    highlights: [
      'Modèles 3D animés (glTF) avec reciblage des animations d’un squelette à l’autre.',
      'Hordes de robots en maillages instanciés et deux boss.',
      'Ressorts, accélérateurs, plateformes et coffres, mini-carte et caméra libre.'
    ],
    moves: [['Personnages', '5'], ['Boss', '2']],
    tech: ['Three.js', 'glTF', 'React']
  },
  {
    id: 'cards',
    no: 6,
    title: 'Atelier des cartes',
    subtitle: 'Les cartes jokers en grand',
    genre: 'Vitrine animée',
    hash: '#reliques',
    img: `${IMG}/cards.webp`,
    color: '#ff2347',
    rarity: 'Peu commune',
    pitch: 'La vitrine des cartes du quiz : chaque carte en grand format avec son animation, ses sons et l’ouverture d’un booster.',
    highlights: [
      'Animations d’obtention et de jeu pour chacune des 14 cartes.',
      'Booster qui s’ouvre en éclosion d’œuf, effets sonores.',
      'Toutes les illustrations en CSS et SVG.'
    ],
    moves: [['Cartes', '14'], ['Booster', '1']],
    tech: ['React', 'CSS', 'SVG', 'Audio']
  },
  {
    id: 'prairie',
    no: 7,
    title: 'Poké Prairie',
    subtitle: 'Auto-battler idle, web et bureau',
    genre: 'Idle · solo',
    hash: '#prairie',
    img: `${IMG}/prairie.webp`,
    color: '#3fae49',
    rarity: 'Rare',
    pitch: 'Un auto-battler idle : ton équipe marche sur une route en bandeau et combat toute seule les Pokémon sauvages, gagne de l’expérience, évolue et recrute selon tes règles, même jeu fermé. Jouable sur le site et dans une appli de bureau posée au-dessus de la barre des tâches.',
    highlights: [
      'Les 1025 Pokémon avec leurs vraies stats, la table des 18 types, l’expérience, les niveaux et les évolutions.',
      '9 zones et 8 Arènes : chaque badge relève le plafond de niveau et ouvre la zone suivante.',
      'Captures automatiques selon des règles (nouvelles espèces, chromatiques, rareté), équipe de 6 et PC.',
      'Temps hors ligne rejoué en accéléré au retour, sauvegarde synchronisée avec le compte, appli Electron construite par GitHub Actions.'
    ],
    moves: [['Pokémon', '1025'], ['Arènes', '8']],
    tech: ['React', 'Electron', 'Service worker', 'GitHub Actions']
  },
  {
    id: 'academy',
    no: 8,
    title: 'Guide Cobblemon Academy',
    subtitle: 'Guide interactif',
    genre: 'Page éditoriale',
    hash: '#academy',
    img: `${IMG}/academy.webp`,
    color: '#ffd23a',
    rarity: 'Commune',
    pitch: 'Le guide du joueur d’un serveur Minecraft, mis en page comme un magazine animé : premiers jours, arènes, cartes à collectionner, économie, boutique et légendaires.',
    highlights: [
      'Sommaire qui suit la lecture, animations au défilement, compteurs animés.',
      'Mise en page responsive pensée pour le téléphone.'
    ],
    moves: [['Chapitres', '10'], ['Pokémon', '1000+']],
    tech: ['React', 'CSS']
  }
];

/** Les jeux de la ludothèque (tout sauf le guide). */
export const GAMES = PROJECTS.filter((p) => p.id !== 'academy');

export const STATS = [
  ['8', 'projets en ligne'],
  ['≈ 55 000', 'lignes de code'],
  ['153', 'commits'],
  ['1 an', 'd’octobre 2025 à octobre 2026']
];

export const SKILLS = [
  { group: 'Front-end', items: ['React 18', 'JavaScript moderne (ES2022)', 'CSS avancé : animations, responsive, impression', 'Canvas 2D'] },
  { group: '3D et rendu', items: ['Three.js / WebGL', 'Shaders GLSL', 'Instanciation et optimisation du rendu', 'Modèles glTF et animations'] },
  { group: 'Back-end et temps réel', items: ['Node.js', 'Express', 'Socket.IO (salons, reconnexion)', 'MongoDB / Mongoose'] },
  { group: 'Outils et livraison', items: ['Git et GitHub', 'Déploiement sur Railway', 'Tests de bout en bout avec Playwright', 'Scripts Python (pipeline d’images)'] }
];
