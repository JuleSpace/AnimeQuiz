# Modèles 3D du mode Sonic Bonk

| Fichier | Modèle | Auteur | Licence |
|---|---|---|---|
| `sonic.glb` | Sonic the Hedgehog | Sonic the Hedgehog Fan # 9,945,677 (sketchfab.com/sonicmaniafan994878) | CC BY 4.0 |
| `shadow.glb` | Shadow The Hedgehog (Sonic Forces/GMOD) | Portycraft (sketchfab.com/Portycraft) | CC BY-NC 4.0 |
| `knuckles.glb` | Knuckles (Sonic The Hedgehog) | Guilherme Navarro (sketchfab.com/guinavarro.al) | CC BY 4.0 |
| `amy.glb` | Amy Rose (Sonic The Hedgehog) | Guilherme Navarro (sketchfab.com/guinavarro.al) | CC BY 4.0 |
| `tails.glb` | Tails (Sonic The Hedgehog) | Guilherme Navarro (sketchfab.com/guinavarro.al) | CC BY 4.0 |
| `default.glb` | RobotExpressive (modèle de secours) | Tomás Laulhé, modifié par Don McCurdy | CC0 1.0 |

Personnages © SEGA ; projet de fans non commercial (obligatoire pour le modèle de Shadow, en CC BY-NC).

Retouches faites sur les fichiers : matériaux d'Amy convertis (l'ancien format « spéculaire / brillance »
n'est plus lu par Three.js) et binaire réécrit. Aucune géométrie modifiée.

## Comment ils sont animés (voir `MODELS` dans `src/components/bonkData.js`)

- Shadow utilise ses propres animations (repos, marche, course, chute, boule, Lance du Chaos, dégâts…).
- Sonic, Knuckles, Amy et Tails n'ont pas d'animation de course utilisable : le jeu anime directement
  leurs os (cuisses, genoux, bras, et les queues de Tails en hélice).
- Pour changer de modèle : remplace le fichier et mets à jour l'entrée `MODELS` (noms des animations
  ou suffixes des os).
