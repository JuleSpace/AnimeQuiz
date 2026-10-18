# Images du roster Sonic

Les portraits viennent du wiki Sonic (sonic.fandom.com) : le navigateur demande l'image principale de la page
de chaque personnage (champ `wiki` dans `client/src/components/SonicRoster.js`) et la garde en cache une semaine.
Si le wiki ne répond pas, le médaillon aux couleurs du personnage s'affiche.

Pour imposer une autre image :

1. Dépose ici un fichier carré nommé d'après l'identifiant du personnage, par exemple `sonic.png` (256 × 256 conseillé).
2. Dans `SonicRoster.js`, ajoute `img: true` à l'entrée correspondante.
