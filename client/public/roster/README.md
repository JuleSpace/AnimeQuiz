# Images du roster Sonic

Par défaut, chaque personnage s'affiche en médaillon (ses couleurs et ses initiales).

Pour mettre une vraie image :

1. Dépose ici un fichier carré nommé d'après l'identifiant du personnage, par exemple `sonic.png` ou `shadow.png` (256 × 256 conseillé).
2. Dans `client/src/components/SonicRoster.js`, ajoute `img: true` à l'entrée correspondante.

Les identifiants sont listés dans `ROSTER` (et dans `AVATAR_IDS` côté serveur, `quiz.js`).
